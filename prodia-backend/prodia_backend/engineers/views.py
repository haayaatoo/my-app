from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.contrib.sessions.models import Session
from django.utils import timezone
from django.db import transaction
from .models import Engineer, SkillSheet, SalesMemo, MemoAttachment, ProdiaUser, Interview
from .serializers import (
    EngineerSerializer, 
    SkillSheetSerializer, 
    SalesMemoSerializer, 
    MemoAttachmentSerializer,
    EngineerDetailSerializer,
    InterviewSerializer
)

class EngineerViewSet(viewsets.ModelViewSet):
    queryset = Engineer.objects.all()
    serializer_class = EngineerSerializer
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """CSV一括登録API"""
        engineers_data = request.data.get('engineers', [])
        
        if not engineers_data:
            return Response({
                'error': 'エンジニアデータが送信されていません'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        created_engineers = []
        errors = []
        skipped_count = 0
        
        try:
            with transaction.atomic():
                for index, engineer_data in enumerate(engineers_data):
                    try:
                        # 重複チェック（メールアドレス）
                        if Engineer.objects.filter(email=engineer_data.get('email')).exists():
                            skipped_count += 1
                            continue
                        
                        # データの前処理
                        processed_data = {
                            'name': engineer_data.get('name', '').strip(),
                            'email': engineer_data.get('email', '').strip(),
                            'position': engineer_data.get('position', '').strip() or None,
                            'project_name': engineer_data.get('project_name', '').strip(),
                            'planner': engineer_data.get('planner', '').strip(),
                            'engineer_status': engineer_data.get('engineer_status', 'unassigned').strip(),
                        }
                        
                        # スキルの処理（文字列、リスト、または空）
                        skills = engineer_data.get('skills', [])
                        if isinstance(skills, str):
                            if skills.strip():
                                skills = [s.strip() for s in skills.split(',') if s.strip()]
                            else:
                                skills = []
                        elif not isinstance(skills, list):
                            skills = []
                        processed_data['skills'] = skills
                        
                        # フェーズの処理（文字列、リスト、または空）
                        phase = engineer_data.get('phase', [])
                        if isinstance(phase, str):
                            if phase.strip():
                                phase = [p.strip() for p in phase.split(',') if p.strip()]
                            else:
                                phase = []
                        elif not isinstance(phase, list):
                            phase = []
                        processed_data['phase'] = phase
                        
                        # バリデーション
                        if not processed_data['name']:
                            errors.append(f'行 {index + 1}: 名前は必須です')
                            continue
                            
                        if not processed_data['email'] or '@' not in processed_data['email']:
                            errors.append(f'行 {index + 1}: 有効なメールアドレスが必要です')
                            continue
                            
                        if not processed_data['project_name']:
                            errors.append(f'行 {index + 1}: プロジェクト名は必須です')
                            continue
                            
                        if not processed_data['planner']:
                            errors.append(f'行 {index + 1}: プランナーは必須です')
                            continue
                        
                        # エンジニア作成
                        serializer = EngineerSerializer(data=processed_data)
                        if serializer.is_valid():
                            engineer = serializer.save()
                            created_engineers.append(engineer)
                        else:
                            errors.append(f'行 {index + 1}: {serializer.errors}')
                            
                    except Exception as e:
                        errors.append(f'行 {index + 1}: {str(e)}')
                
                # エラーが多い場合は全体をロールバック
                if len(errors) > len(engineers_data) / 2:
                    return Response({
                        'error': 'エラーが多すぎます',
                        'errors': errors,
                        'details': f'{len(errors)}個のエラーが発生しました'
                    }, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response({
                'error': f'データベースエラー: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # 結果レスポンス
        response_data = {
            'success': True,
            'created_count': len(created_engineers),
            'skipped_count': skipped_count,
            'error_count': len(errors),
            'message': f'{len(created_engineers)}名のエンジニアを登録しました'
        }
        
        if skipped_count > 0:
            response_data['message'] += f'（{skipped_count}名は重複のためスキップ）'
            
        if errors:
            response_data['errors'] = errors
            
        return Response(response_data, status=status.HTTP_201_CREATED)


# SkillSheet用ViewSet
class SkillSheetViewSet(viewsets.ModelViewSet):
    queryset = SkillSheet.objects.all().order_by('-uploaded_at')
    serializer_class = SkillSheetSerializer


# 営業メモ用ViewSet
class SalesMemoViewSet(viewsets.ModelViewSet):
    queryset = SalesMemo.objects.all().order_by('-updated_at')
    serializer_class = SalesMemoSerializer
    
    def get_queryset(self):
        queryset = SalesMemo.objects.all().order_by('-updated_at')
        
        # フィルタリングオプション
        memo_type = self.request.query_params.get('memo_type', None)
        engineer_name = self.request.query_params.get('engineer_name', None)
        author = self.request.query_params.get('author', None)
        is_completed = self.request.query_params.get('is_completed', None)
        
        if memo_type:
            queryset = queryset.filter(memo_type=memo_type)
        if engineer_name:
            queryset = queryset.filter(engineer_name=engineer_name)
        if author:
            queryset = queryset.filter(author=author)
        if is_completed is not None:
            queryset = queryset.filter(is_completed=is_completed.lower() == 'true')
            
        return queryset
    
    @action(detail=False, methods=['get'])
    def by_engineer(self, request):
        """エンジニア別のメモ一覧を取得"""
        engineer_name = request.query_params.get('engineer_name')
        if not engineer_name:
            return Response({'error': 'engineer_name parameter is required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        memos = SalesMemo.objects.filter(engineer_name=engineer_name).order_by('-updated_at')
        serializer = self.get_serializer(memos, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """営業ダッシュボード用のメモ統計情報"""
        total_memos = SalesMemo.objects.count()
        pending_tasks = SalesMemo.objects.filter(is_completed=False, memo_type='task').count()
        engineer_memos = SalesMemo.objects.filter(memo_type='engineer').count()
        urgent_memos = SalesMemo.objects.filter(priority='urgent', is_completed=False).count()
        
        return Response({
            'total_memos': total_memos,
            'pending_tasks': pending_tasks,
            'engineer_memos': engineer_memos,
            'urgent_memos': urgent_memos,
            'recent_memos': SalesMemoSerializer(
                SalesMemo.objects.order_by('-updated_at')[:5], many=True
            ).data
        })


# メモ添付ファイル用ViewSet
class MemoAttachmentViewSet(viewsets.ModelViewSet):
    queryset = MemoAttachment.objects.all()
    serializer_class = MemoAttachmentSerializer


# 認証API
@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def login_view(request):
    """メールアドレスとパスワードでログイン"""
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response({
            'error': 'メールアドレスとパスワードを入力してください'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # ProdiaUserテーブルからメールアドレスを検索
        user = ProdiaUser.objects.get(email=email)
        
        # アクティブユーザーかチェック
        if not user.is_active:
            return Response({
                'error': 'アカウントが無効です'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # パスワード認証
        if user.check_password(password):
            # ログイン時刻を記録
            user.last_login = timezone.now()
            user.save()
            
            return Response({
                'success': True,
                'user': {
                    'id': user.id,
                    'name': user.name,
                    'email': user.email,
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'パスワードが正しくありません'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
    except ProdiaUser.DoesNotExist:
        return Response({
            'error': 'メールアドレスが見つかりません'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    """ログアウト"""
    return Response({
        'success': True,
        'message': 'ログアウトしました'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def change_password_view(request):
    """パスワード変更"""
    email = request.data.get('email')
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    
    if not all([email, current_password, new_password]):
        return Response({
            'error': '全ての項目を入力してください'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if len(new_password) < 6:
        return Response({
            'error': 'パスワードは6文字以上で入力してください'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # ユーザーを検索
        user = ProdiaUser.objects.get(email=email)
        
        # 現在のパスワードを確認
        if not user.check_password(current_password):
            return Response({
                'error': '現在のパスワードが正しくありません'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # 新しいパスワードを設定
        user.set_password(new_password)
        user.save()
        
        return Response({
            'success': True,
            'message': 'パスワードを変更しました'
        }, status=status.HTTP_200_OK)
        
    except ProdiaUser.DoesNotExist:
        return Response({
            'error': 'ユーザーが見つかりません'
        }, status=status.HTTP_404_NOT_FOUND)


# 面談履歴管理ViewSet
class InterviewViewSet(viewsets.ModelViewSet):
    queryset = Interview.objects.all()
    serializer_class = InterviewSerializer
    permission_classes = [AllowAny]  # 後で権限制御を追加予定
    
    def get_queryset(self):
        """権限チェック付きクエリセット取得"""
        queryset = Interview.objects.all()
        
        # エンジニアIDでフィルタリング
        engineer_id = self.request.query_params.get('engineer_id', None)
        if engineer_id is not None:
            queryset = queryset.filter(engineer_id=engineer_id)
            
        # 面談種別でフィルタリング
        interview_type = self.request.query_params.get('interview_type', None)
        if interview_type is not None:
            queryset = queryset.filter(interview_type=interview_type)
            
        # 結果でフィルタリング
        result = self.request.query_params.get('result', None)
        if result is not None:
            queryset = queryset.filter(result=result)
            
        return queryset.select_related('engineer', 'created_by')
    
    def create(self, request, *args, **kwargs):
        """面談記録作成（エラーログ付き）"""
        print(f"📝 CREATE 受信データ: {request.data}")
        
        # 作成者を自動設定
        try:
            created_by = ProdiaUser.objects.get(email='kamiya@1dr.co.jp')
        except ProdiaUser.DoesNotExist:
            created_by = ProdiaUser.objects.first()
        
        # データに作成者を追加
        mutable_data = request.data.copy()
        mutable_data['created_by'] = created_by.id if created_by else None
        
        serializer = self.get_serializer(data=mutable_data)
        if serializer.is_valid():
            serializer.save()
            print(f"✅ 面談記録作成成功: {serializer.data}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            print(f"❌ CREATE バリデーションエラー: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, *args, **kwargs):
        """面談記録更新（エラーログ付き）"""
        print(f"📝 UPDATE 受信データ: {request.data}")
        print(f"📝 更新対象ID: {kwargs.get('pk')}")
        
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # データをコピーして作成者を保持
        mutable_data = request.data.copy()
        mutable_data['created_by'] = instance.created_by.id if instance.created_by else None
        
        serializer = self.get_serializer(instance, data=mutable_data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            print(f"✅ 面談記録更新成功: {serializer.data}")
            return Response(serializer.data)
        else:
            print(f"❌ UPDATE バリデーションエラー: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def check_permission(self, request):
        """面談履歴へのアクセス権限をチェック"""
        # 権限のあるユーザーのメールアドレス
        allowed_emails = ['kamiya@1dr.co.jp', 'asai@1dr.co.jp']
        
        # TODO: 実際のログインユーザーをチェック
        # 一時的にTrue返す（開発用）
        return Response({
            'has_permission': True,
            'message': '面談履歴へのアクセスが許可されています'
        })

# 市場データAPI
@api_view(['GET'])
@permission_classes([AllowAny])
def market_trends_view(request):
    """リアルタイム市場トレンドデータを取得"""
    try:
        from .market_data import get_latest_market_trends
        
        # クエリパラメータで実データ使用を制御
        use_real_api = request.GET.get('real', 'false').lower() == 'true'
        
        trends_data = get_latest_market_trends(use_real_api=use_real_api)
        
        return Response({
            'success': True,
            'data': trends_data,
            'total_technologies': len(trends_data),
            'data_source': 'Real APIs' if use_real_api else 'Enhanced Mock Data',
            'last_updated': timezone.now().isoformat()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'市場データ取得エラー: {str(e)}',
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def market_summary_view(request):
    """市場データサマリー（ダッシュボード用）"""
    try:
        from .market_data import get_latest_market_trends
        
        trends_data = get_latest_market_trends(use_real_api=False)
        
        # 上位トレンド（最も変化率の高い技術）
        top_growing = sorted(trends_data, key=lambda x: x['change_percentage'], reverse=True)[:4]
        declining_techs = [t for t in trends_data if t['change_percentage'] < 0]
        
        # 統計計算
        avg_change = sum(t['change_percentage'] for t in trends_data) / len(trends_data)
        total_demand = sum(t['current_demand'] for t in trends_data)
        
        summary = {
            'top_growing_technologies': top_growing,
            'declining_technologies': declining_techs[:2],  # 下降中の技術（上位2つ）
            'market_stats': {
                'total_technologies_tracked': len(trends_data),
                'average_change_percentage': round(avg_change, 1),
                'total_market_demand': total_demand,
                'growth_ratio': len([t for t in trends_data if t['change_percentage'] > 0]) / len(trends_data)
            }
        }
        
        return Response({
            'success': True,
            'summary': summary,
            'last_updated': timezone.now().isoformat()
        })
        
    except Exception as e:
        return Response({
            'error': f'市場サマリー取得エラー: {str(e)}',
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 愛知県特化型市場データAPI
@api_view(['GET'])
@permission_classes([AllowAny])
def aichi_market_trends_view(request):
    """愛知県のIT技術トレンドデータを取得"""
    try:
        from .aichi_market import get_aichi_market_trends
        
        trends_data = get_aichi_market_trends()
        
        return Response({
            'success': True,
            'region': '愛知県',
            'data': trends_data,
            'total_technologies': len(trends_data),
            'data_characteristics': {
                'manufacturing_focused': True,
                'automotive_industry_data': True,
                'regional_salary_data': True,
                'local_company_analysis': True
            },
            'last_updated': timezone.now().isoformat()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'愛知県市場データ取得エラー: {str(e)}',
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def aichi_market_summary_view(request):
    """愛知県市場サマリー（ダッシュボード用）"""
    try:
        from .aichi_market import get_aichi_market_summary
        
        summary_data = get_aichi_market_summary()
        
        return Response({
            'success': True,
            'region': '愛知県',
            'summary': summary_data,
            'regional_insights': {
                'manufacturing_hub': '中部地方最大の製造業集積地',
                'automotive_center': 'トヨタグループを中心とした自動車産業',
                'dx_acceleration': '製造業DXによる技術需要急増',
                'salary_competitiveness': '全国トップクラスの技術者年収',
                'future_technologies': ['ROS', 'Unity', 'AI/ML', 'IoT', 'EV関連技術']
            },
            'last_updated': timezone.now().isoformat()
        })
        
    except Exception as e:
        return Response({
            'error': f'愛知県市場サマリー取得エラー: {str(e)}',
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET']) 
@permission_classes([AllowAny])
def regional_comparison_view(request):
    """地域別技術トレンド比較"""
    try:
        from .market_data import get_latest_market_trends
        from .aichi_market import get_aichi_market_summary, get_aichi_market_trends
        
        # 全国データ
        national_data = get_latest_market_trends(use_real_api=False)
        
        # 愛知県データ
        aichi_data = get_aichi_market_trends()
        aichi_summary = get_aichi_market_summary()
        
        # 比較分析
        comparison = {
            'national': {
                'total_technologies': len(national_data),
                'top_tech': max(national_data, key=lambda x: x['change_percentage'])['technology'],
                'avg_growth': sum(x['change_percentage'] for x in national_data) / len(national_data)
            },
            'aichi': {
                'total_jobs': aichi_summary['market_stats']['total_job_postings'], 
                'avg_salary': aichi_summary['market_stats']['average_salary'],
                'top_tech': aichi_data[0]['technology'],
                'avg_growth': sum(x['change_percentage'] for x in aichi_data) / len(aichi_data),
                'specializations': ['製造業DX', '自動車関連', 'ロボティクス', 'IoT']
            }
        }
        
        return Response({
            'success': True,
            'comparison': comparison,
            'analysis': {
                'aichi_advantages': [
                    '製造業特化による高年収',
                    'ロボティクス・AI需要の急成長', 
                    '世界的企業の技術投資',
                    '安定した雇用環境'
                ],
                'growth_opportunities': [
                    'EV・自動運転技術',
                    '製造業のスマートファクトリー化',
                    'VR/AR産業応用',
                    'サプライチェーンDX'
                ]
            },
            'last_updated': timezone.now().isoformat()
        })
        
    except Exception as e:
        return Response({
            'error': f'地域比較データ取得エラー: {str(e)}',
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
