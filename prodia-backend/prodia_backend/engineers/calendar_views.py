"""
Google Calendar 連携 API ビュー

OAuth2.0フローでユーザーのGoogleカレンダーと連携します。
トークンはDjangoセッションに保存します。
"""
import csv
import io
import json
import os
from datetime import datetime, timezone

from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

SCOPES = ['https://www.googleapis.com/auth/calendar']

# 開発環境でHTTP(localhost)を許可する
if settings.DEBUG:
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'


def _build_flow(request):
    """OAuthフローオブジェクトを構築する"""
    client_config = {
        "web": {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [settings.GOOGLE_REDIRECT_URI],
        }
    }
    flow = Flow.from_client_config(
        client_config,
        scopes=SCOPES,
        redirect_uri=settings.GOOGLE_REDIRECT_URI,
    )
    return flow


def _get_credentials(request):
    """セッションからCredentialsを取得し、必要なら自動更新する"""
    token_data = request.session.get('google_token')
    if not token_data:
        return None

    creds = Credentials(
        token=token_data.get('token'),
        refresh_token=token_data.get('refresh_token'),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        scopes=SCOPES,
    )

    # トークンが期限切れなら自動更新
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        request.session['google_token'] = {
            'token': creds.token,
            'refresh_token': creds.refresh_token,
        }

    return creds


def oauth_start(request):
    """Google OAuth認証を開始する"""
    if not settings.GOOGLE_CLIENT_ID:
        return JsonResponse({'error': 'Google Client IDが設定されていません'}, status=500)

    flow = _build_flow(request)
    auth_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent',
    )
    request.session['oauth_state'] = state
    return JsonResponse({'auth_url': auth_url})


def oauth_callback(request):
    """Google OAuthコールバック処理"""
    error = request.GET.get('error')
    if error:
        # フロントエンドにエラーを通知してウィンドウを閉じる
        return _close_popup_response(success=False, error=error)

    state = request.session.get('oauth_state')
    flow = _build_flow(request)
    flow.fetch_token(
        authorization_response=request.build_absolute_uri(),
        state=state,
    )

    creds = flow.credentials
    request.session['google_token'] = {
        'token': creds.token,
        'refresh_token': creds.refresh_token,
    }

    return _close_popup_response(success=True)


def _close_popup_response(success, error=None):
    """ポップアップウィンドウを閉じてフロントエンドに結果を通知するHTML"""
    if success:
        script = "window.opener.postMessage({type:'GOOGLE_AUTH_SUCCESS'}, '*'); window.close();"
    else:
        script = f"window.opener.postMessage({{type:'GOOGLE_AUTH_ERROR', error:'{error}'}}, '*'); window.close();"

    html = f"<html><body><script>{script}</script><p>認証完了。このウィンドウは自動で閉じます。</p></body></html>"
    return HttpResponse(html)


def oauth_status(request):
    """Google連携状態を返す"""
    connected = bool(request.session.get('google_token'))
    return JsonResponse({'connected': connected})


def oauth_disconnect(request):
    """Google連携を解除する"""
    if 'google_token' in request.session:
        del request.session['google_token']
    return JsonResponse({'success': True})


@require_http_methods(["GET"])
def list_events(request):
    """Googleカレンダーのイベント一覧を取得する"""
    creds = _get_credentials(request)
    if not creds:
        return JsonResponse({'error': 'Google認証が必要です', 'code': 'NOT_AUTHENTICATED'}, status=401)

    try:
        service = build('calendar', 'v3', credentials=creds)

        # 今月初めから3ヶ月先までのイベントを取得
        now = datetime.now(timezone.utc)
        time_min = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
        time_max_month = min(now.month + 3, 12)
        time_max = now.replace(month=time_max_month, day=28).isoformat()

        events_result = service.events().list(
            calendarId='primary',
            timeMin=time_min,
            timeMax=time_max,
            maxResults=100,
            singleEvents=True,
            orderBy='startTime',
        ).execute()

        events = events_result.get('items', [])
        return JsonResponse({'events': events})

    except HttpError as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def create_event(request):
    """Googleカレンダーにイベントを作成する"""
    creds = _get_credentials(request)
    if not creds:
        return JsonResponse({'error': 'Google認証が必要です', 'code': 'NOT_AUTHENTICATED'}, status=401)

    try:
        data = json.loads(request.body)
        service = build('calendar', 'v3', credentials=creds)

        event_body = _build_event_body(data)
        created_event = service.events().insert(
            calendarId='primary',
            body=event_body,
        ).execute()

        return JsonResponse({'event': created_event}, status=201)

    except (json.JSONDecodeError, KeyError) as e:
        return JsonResponse({'error': f'リクエストデータが不正です: {e}'}, status=400)
    except HttpError as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["PUT"])
def update_event(request, event_id):
    """Googleカレンダーのイベントを更新する"""
    creds = _get_credentials(request)
    if not creds:
        return JsonResponse({'error': 'Google認証が必要です', 'code': 'NOT_AUTHENTICATED'}, status=401)

    try:
        data = json.loads(request.body)
        service = build('calendar', 'v3', credentials=creds)

        event_body = _build_event_body(data)
        updated_event = service.events().update(
            calendarId='primary',
            eventId=event_id,
            body=event_body,
        ).execute()

        return JsonResponse({'event': updated_event})

    except (json.JSONDecodeError, KeyError) as e:
        return JsonResponse({'error': f'リクエストデータが不正です: {e}'}, status=400)
    except HttpError as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["DELETE"])
def delete_event(request, event_id):
    """Googleカレンダーのイベントを削除する"""
    creds = _get_credentials(request)
    if not creds:
        return JsonResponse({'error': 'Google認証が必要です', 'code': 'NOT_AUTHENTICATED'}, status=401)

    try:
        service = build('calendar', 'v3', credentials=creds)
        service.events().delete(
            calendarId='primary',
            eventId=event_id,
        ).execute()
        return JsonResponse({'success': True})

    except HttpError as e:
        return JsonResponse({'error': str(e)}, status=500)


def _build_event_body(data):
    """ProdiaのイベントデータをGoogle Calendar API形式に変換する"""
    date = data.get('date', '')
    start_time = data.get('time', '')
    end_time = data.get('endTime', '')

    if start_time:
        start = {'dateTime': f"{date}T{start_time}:00+09:00", 'timeZone': 'Asia/Tokyo'}
        end_dt = end_time if end_time else start_time
        end = {'dateTime': f"{date}T{end_dt}:00+09:00", 'timeZone': 'Asia/Tokyo'}
    else:
        start = {'date': date}
        end = {'date': date}

    return {
        'summary': data.get('title', '（タイトルなし）'),
        'description': data.get('description', ''),
        'start': start,
        'end': end,
    }


@require_http_methods(["GET"])
def export_events(request):
    """
    Googleカレンダーのイベントをエクスポートする

    クエリパラメータ:
      start_date : 抽出開始日 (YYYY-MM-DD)、省略時は当月1日
      end_date   : 抽出終了日 (YYYY-MM-DD)、省略時は3ヵ月後
      keyword    : タイトル/説明に含む絞り込みワード（カンマ区切りでAND検索）
      fields     : 出力フィールド（カンマ区切り）
                   選択肢: title, date, start_time, end_time, description, location, organizer, status
      format     : 出力形式 csv (デフォルト) / json
    """
    creds = _get_credentials(request)
    if not creds:
        return JsonResponse({'error': 'Google認証が必要です', 'code': 'NOT_AUTHENTICATED'}, status=401)

    # --- パラメータ取得 ---
    start_date = request.GET.get('start_date', '').strip()
    end_date = request.GET.get('end_date', '').strip()
    keyword_raw = request.GET.get('keyword', '').strip()
    fields_param = request.GET.get('fields', 'title,date,start_time,end_time,description,location')
    export_format = request.GET.get('format', 'csv').lower()

    # キーワードはカンマ区切りでAND絞り込み
    keywords = [k.strip().lower() for k in keyword_raw.split(',') if k.strip()] if keyword_raw else []

    try:
        # --- 日付範囲を RFC3339 形式へ変換 ---
        now = datetime.now(timezone.utc)
        if start_date:
            time_min = datetime.fromisoformat(start_date).replace(
                hour=0, minute=0, second=0, tzinfo=timezone.utc
            ).isoformat()
        else:
            time_min = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()

        if end_date:
            time_max = datetime.fromisoformat(end_date).replace(
                hour=23, minute=59, second=59, tzinfo=timezone.utc
            ).isoformat()
        else:
            max_month = now.month + 3 if now.month <= 9 else 12
            time_max = now.replace(month=max_month, day=28, hour=23, minute=59, second=59, microsecond=0).isoformat()

        service = build('calendar', 'v3', credentials=creds)
        events_result = service.events().list(
            calendarId='primary',
            timeMin=time_min,
            timeMax=time_max,
            maxResults=500,
            singleEvents=True,
            orderBy='startTime',
        ).execute()

        events = events_result.get('items', [])

        # --- キーワード絞り込み (AND条件) ---
        if keywords:
            def _matches(event):
                text = (
                    (event.get('summary') or '') + ' ' +
                    (event.get('description') or '') + ' ' +
                    (event.get('location') or '')
                ).lower()
                return all(kw in text for kw in keywords)
            events = [e for e in events if _matches(e)]

        # --- フィールド定義 ---
        FIELD_MAP = {
            'title':       ('タイトル',   lambda e: e.get('summary') or ''),
            'date':        ('日付',       lambda e: (e.get('start', {}).get('dateTime') or e.get('start', {}).get('date') or '')[:10]),
            'start_time':  ('開始時刻',   lambda e: (e.get('start', {}).get('dateTime') or '')[:16][11:] if 'T' in (e.get('start', {}).get('dateTime') or '') else '終日'),
            'end_time':    ('終了時刻',   lambda e: (e.get('end', {}).get('dateTime') or '')[:16][11:] if 'T' in (e.get('end', {}).get('dateTime') or '') else '終日'),
            'description': ('説明',       lambda e: (e.get('description') or '').replace('\n', ' ')),
            'location':    ('場所',       lambda e: e.get('location') or ''),
            'organizer':   ('主催者メール', lambda e: (e.get('organizer') or {}).get('email') or ''),
            'status':      ('ステータス', lambda e: e.get('status') or ''),
        }

        requested_fields = [f.strip() for f in fields_param.split(',') if f.strip() in FIELD_MAP]
        if not requested_fields:
            requested_fields = list(FIELD_MAP.keys())

        headers = [FIELD_MAP[f][0] for f in requested_fields]
        rows = []
        for event in events:
            row = {FIELD_MAP[f][0]: FIELD_MAP[f][1](event) for f in requested_fields}
            rows.append(row)

        # --- JSON形式で返す ---
        if export_format == 'json':
            return JsonResponse({'events': rows, 'count': len(rows)})

        # --- CSV形式で返す（BOM付きUTF-8でExcel文字化け防止） ---
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)

        response = HttpResponse(
            '\ufeff' + output.getvalue(),  # BOM付きUTF-8
            content_type='text/csv; charset=utf-8-sig',
        )
        filename = f"google_calendar_{start_date or 'all'}_{end_date or 'all'}.csv"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    except HttpError as e:
        return JsonResponse({'error': str(e)}, status=500)
    except ValueError as e:
        return JsonResponse({'error': f'日付形式が不正です: {e}'}, status=400)
