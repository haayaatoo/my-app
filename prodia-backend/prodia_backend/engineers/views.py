from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.contrib.sessions.models import Session
from django.utils import timezone
from django.db import transaction
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from .models import Engineer, SkillSheet, SalesMemo, MemoAttachment, ProdiaUser, Interview, RecruitmentChannel, SocialMediaPost, Company, CompanyAppointment, Deal, DealActivity, Project, ProjectAssignment, PartnerEngineer, TeleapoRecord, MonthlyProjectReport, PPInterview, BPProspect
from .serializers import (
    EngineerSerializer, 
    SkillSheetSerializer, 
    SalesMemoSerializer, 
    MemoAttachmentSerializer,
    EngineerDetailSerializer,
    InterviewSerializer,
    RecruitmentChannelSerializer,
    SocialMediaPostSerializer,
    CompanySerializer,
    CompanyAppointmentSerializer,
    DealSerializer,
    DealActivitySerializer,
    ProjectSerializer,
    ProjectAssignmentSerializer,
)

from .serializers import PartnerEngineerSerializer, TeleapoRecordSerializer, MonthlyProjectReportSerializer, PPInterviewSerializer, BPProspectSerializer

def health_check(request):
    return JsonResponse({"status": "ok"})

class EngineerViewSet(viewsets.ModelViewSet):
    queryset = Engineer.objects.all()
    serializer_class = EngineerSerializer

    def _detect_extension(self, instance, new_end_date_str, date_field):
        """project_end_date が延長されたか検知"""
        from datetime import date
        old_val = getattr(instance, date_field)
        if not new_end_date_str or old_val is None:
            return False
        try:
            new_val = date.fromisoformat(str(new_end_date_str))
            return new_val > old_val
        except (ValueError, TypeError):
            return False

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        extend = self._detect_extension(instance, request.data.get('project_end_date'), 'project_end_date')
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        if extend:
            serializer.save(contract_extended_at=timezone.now(), last_user_updated_at=timezone.now())
        else:
            serializer.save(last_user_updated_at=timezone.now())
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    @action(detail=False, methods=['post'], url_path='bulk-create')
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
                        # 重複チェック（名前）
                        if Engineer.objects.filter(name=engineer_data.get('name', '').strip()).exists():
                            skipped_count += 1
                            continue
                        
                        # データの前処理
                        email_val = engineer_data.get('email', '').strip() or None
                        monthly_rate_val = engineer_data.get('monthly_rate', '').strip() or None
                        project_start_val = engineer_data.get('project_start_date', '').strip() or None
                        project_end_val = engineer_data.get('project_end_date', '').strip() or None
                        processed_data = {
                            'name': engineer_data.get('name', '').strip(),
                            'email': email_val,
                            'position': engineer_data.get('position', '').strip() or None,
                            'project_name': engineer_data.get('project_name', '').strip(),
                            'planner': engineer_data.get('planner', '').strip(),
                            'engineer_status': engineer_data.get('engineer_status', 'unassigned').strip(),
                            'client_company': engineer_data.get('client_company', '').strip() or None,
                            'monthly_rate': monthly_rate_val,
                            'project_start_date': project_start_val,
                            'project_end_date': project_end_val,
                            'project_location': engineer_data.get('project_location', '').strip() or None,
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
    """メールアドレスとパスワードでログイン → JWTトークンを返す"""
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response({
            'error': 'メールアドレスとパスワードを入力してください'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = ProdiaUser.objects.get(email=email)

        if not user.is_active:
            return Response({
                'error': 'アカウントが無効です'
            }, status=status.HTTP_401_UNAUTHORIZED)

        if not user.check_password(password):
            return Response({
                'error': 'パスワードが正しくありません'
            }, status=status.HTTP_401_UNAUTHORIZED)

        # ログイン時刻を記録
        user.last_login = timezone.now()
        user.save()

        # JWTトークンをProdiaユーザーIDからカスタム生成
        refresh = RefreshToken()
        refresh['user_id'] = user.id
        refresh['email'] = user.email
        refresh['name'] = user.name

        return Response({
            'success': True,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
            }
        }, status=status.HTTP_200_OK)

    except ProdiaUser.DoesNotExist:
        return Response({
            'error': 'メールアドレスが見つかりません'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    """リフレッシュトークンをブラックリストに追加してログアウト"""
    refresh_token = request.data.get('refresh')
    if refresh_token:
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            pass  # すでに無効なトークンは無視
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


# 採用経路管理ViewSet
class RecruitmentChannelViewSet(viewsets.ModelViewSet):
    queryset = RecruitmentChannel.objects.all()
    serializer_class = RecruitmentChannelSerializer
    
    def get_queryset(self):
        queryset = RecruitmentChannel.objects.all()
        
        # フィルタリング
        channel = self.request.query_params.get('channel')
        status = self.request.query_params.get('status')  
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if channel:
            queryset = queryset.filter(channel=channel)
        if status:
            queryset = queryset.filter(status=status)
        if date_from:
            queryset = queryset.filter(applied_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(applied_at__date__lte=date_to)
            
        return queryset
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """採用経路別統計データ"""
        queryset = self.get_queryset()
        
        # 全体統計
        total_applications = queryset.count()
        hired_count = queryset.filter(status='hired').count()
        hiring_rate = (hired_count / total_applications * 100) if total_applications > 0 else 0
        
        # 採用経路別統計
        channel_stats = {}
        for choice in RecruitmentChannel.CHANNEL_CHOICES:
            channel_code = choice[0]
            channel_applications = queryset.filter(channel=channel_code)
            channel_hired = channel_applications.filter(status='hired').count()
            channel_total = channel_applications.count()
            channel_rate = (channel_hired / channel_total * 100) if channel_total > 0 else 0
            
            channel_stats[channel_code] = {
                'name': choice[1],
                'total_applications': channel_total,
                'hired_count': channel_hired,
                'hiring_rate': round(channel_rate, 1)
            }
        
        return Response({
            'overall': {
                'total_applications': total_applications,
                'hired_count': hired_count,
                'hiring_rate': round(hiring_rate, 1)
            },
            'by_channel': channel_stats
        })


# SNS投稿管理ViewSet  
class SocialMediaPostViewSet(viewsets.ModelViewSet):
    queryset = SocialMediaPost.objects.all()
    serializer_class = SocialMediaPostSerializer
    
    def get_queryset(self):
        queryset = SocialMediaPost.objects.all()
        
        # プラットフォーム別フィルタリング
        platform = self.request.query_params.get('platform')
        if platform:
            queryset = queryset.filter(platform=platform)
            
        return queryset
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """SNS投稿分析データ"""
        queryset = self.get_queryset()
        
        # 全体統計
        total_posts = queryset.count()
        total_views = sum(post.views_count for post in queryset)
        total_likes = sum(post.likes_count for post in queryset)
        total_comments = sum(post.comments_count for post in queryset)
        total_shares = sum(post.shares_count for post in queryset)
        
        # 平均エンゲージメント率
        avg_engagement = sum(float(post.engagement_rate) for post in queryset) / total_posts if total_posts > 0 else 0
        
        # プラットフォーム別統計
        platform_stats = {}
        for choice in SocialMediaPost.PLATFORM_CHOICES:
            platform_code = choice[0]
            platform_posts = queryset.filter(platform=platform_code)
            platform_count = platform_posts.count()
            
            if platform_count > 0:
                platform_stats[platform_code] = {
                    'name': choice[1],
                    'posts_count': platform_count,
                    'total_views': sum(p.views_count for p in platform_posts),
                    'total_likes': sum(p.likes_count for p in platform_posts),
                    'avg_engagement': sum(float(p.engagement_rate) for p in platform_posts) / platform_count
                }
        
        return Response({
            'overall': {
                'total_posts': total_posts,
                'total_views': total_views,
                'total_likes': total_likes,
                'total_comments': total_comments,
                'total_shares': total_shares,
                'avg_engagement_rate': round(avg_engagement, 2)
            },
            'by_platform': platform_stats
        })


# ===============================
# 企業アポイント管理ViewSet
# ===============================

class CompanyViewSet(viewsets.ModelViewSet):
    """企業マスター管理"""
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Company.objects.all()
        name = self.request.query_params.get('name', None)
        if name:
            queryset = queryset.filter(name__icontains=name)
        return queryset

    @action(detail=False, methods=['post'], url_path='bulk-create')
    def bulk_create(self, request):
        """企業名の一括登録"""
        names = request.data.get('names', [])
        created = 0
        skipped = 0
        for name in names:
            name = name.strip()
            if not name:
                continue
            _, created_flag = Company.objects.get_or_create(name=name)
            if created_flag:
                created += 1
            else:
                skipped += 1
        return Response({'created': created, 'skipped': skipped})

    @action(detail=False, methods=['get'], url_path='teleapo-status')
    def teleapo_status(self, request):
        """企業ごとのテレアポ状況を返す（架電リスト用）"""
        from collections import defaultdict

        companies = Company.objects.all().order_by('name')

        # TeleapoRecord を全件取得して company_name でグルーピング
        all_records = list(
            TeleapoRecord.objects.values(
                'company_name', 'planner', 'call_date', 'result'
            ).order_by('-call_date', '-created_at')
        )

        call_data = defaultdict(list)
        for r in all_records:
            call_data[r['company_name']].append(r)

        result = []
        search = request.query_params.get('search', '').strip()
        status_filter = request.query_params.get('status', 'all')  # all / uncalled / called

        for company in companies:
            if search and search.lower() not in company.name.lower():
                continue

            records = call_data.get(company.name, [])
            call_count = len(records)

            if status_filter == 'uncalled' and call_count > 0:
                continue
            if status_filter == 'called' and call_count == 0:
                continue

            result.append({
                'id': company.id,
                'name': company.name,
                'call_count': call_count,
                'last_call_date': str(records[0]['call_date']) if records else None,
                'last_result': records[0]['result'] if records else None,
                'last_planner': records[0]['planner'] if records else None,
                'callers': list({r['planner'] for r in records}),
            })

        return Response(result)


class CompanyAppointmentViewSet(viewsets.ModelViewSet):
    """企業アポイント管理 - 重複防止機能付き"""
    queryset = CompanyAppointment.objects.select_related('company').all()
    serializer_class = CompanyAppointmentSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = CompanyAppointment.objects.select_related('company').all()
        company_id = self.request.query_params.get('company', None)
        planner = self.request.query_params.get('planner', None)
        apt_status = self.request.query_params.get('status', None)
        if company_id:
            queryset = queryset.filter(company_id=company_id)
        if planner:
            queryset = queryset.filter(planner=planner)
        if apt_status:
            queryset = queryset.filter(status=apt_status)
        return queryset

    def create(self, request, *args, **kwargs):
        company_id = request.data.get('company')
        planner = request.data.get('planner')

        # コンフリクト検出（同企業に別プランナーのアクティブなアポが存在するか確認）
        conflict_info = None
        if company_id and planner:
            conflicts = CompanyAppointment.objects.filter(
                company_id=company_id,
                status='scheduled'
            ).exclude(planner=planner)
            if conflicts.exists():
                c = conflicts.first()
                conflict_info = {
                    'planner': c.planner,
                    'date': str(c.appointment_date),
                }

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)

        response_data = dict(serializer.data)
        if conflict_info:
            response_data['conflict_warning'] = conflict_info

        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=['get'])
    def check_conflict(self, request):
        """アポ登録前のコンフリクト確認API"""
        company_id = request.query_params.get('company')
        planner = request.query_params.get('planner')
        exclude_id = request.query_params.get('exclude_id')

        if not company_id or not planner:
            return Response({'has_conflict': False})

        qs = CompanyAppointment.objects.filter(
            company_id=company_id,
            status='scheduled'
        ).exclude(planner=planner)

        if exclude_id:
            qs = qs.exclude(id=exclude_id)

        if qs.exists():
            c = qs.first()
            return Response({
                'has_conflict': True,
                'conflict': {
                    'planner': c.planner,
                    'date': str(c.appointment_date),
                    'time': str(c.appointment_time) if c.appointment_time else None,
                }
            })

        return Response({'has_conflict': False})


# ===============================
# 案件パイプライン（かんばんボード）
# ===============================

class DealViewSet(viewsets.ModelViewSet):
    """案件パイプライン管理"""
    queryset = Deal.objects.prefetch_related('proposed_engineers', 'activities').all()
    serializer_class = DealSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Deal.objects.prefetch_related('proposed_engineers', 'activities').all()
        stage = self.request.query_params.get('stage')
        assigned_to = self.request.query_params.get('assigned_to')
        if stage:
            queryset = queryset.filter(stage=stage)
        if assigned_to:
            queryset = queryset.filter(assigned_to=assigned_to)
        return queryset

    @action(detail=False, methods=['get'])
    def pipeline(self, request):
        """かんばんボード用：ステージ別案件一覧"""
        stages = ['open_system', 'web', 'embedded', 'infrastructure', 'support_other', 'low_skill']
        stage_labels = {
            'open_system':    'オープン系',
            'web':            'Web系',
            'embedded':       '組み込み',
            'infrastructure': 'インフラ',
            'support_other':  '開発支援・その他',
            'low_skill':      'ロースキル',
        }
        pipeline = {}
        for s in stages:
            deals = Deal.objects.prefetch_related('proposed_engineers', 'activities').filter(stage=s)
            pipeline[s] = {
                'label': stage_labels[s],
                'deals': DealSerializer(deals, many=True).data,
                'count': deals.count(),
                'total_amount': sum(
                    float(d.expected_monthly_rate or 0) for d in deals
                ),
            }
        return Response(pipeline)

    @action(detail=True, methods=['post'])
    def add_activity(self, request, pk=None):
        """案件に活動履歴を追加"""
        deal = self.get_object()
        data = request.data.copy()
        data['deal'] = deal.id
        serializer = DealActivitySerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            new_stage = request.data.get('new_stage')
            if new_stage:
                deal.stage = new_stage
                deal.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'])
    def move_stage(self, request, pk=None):
        """ドラッグ＆ドロップによるステージ変更"""
        deal = self.get_object()
        new_stage = request.data.get('stage')
        if not new_stage:
            return Response({'error': 'stage is required'}, status=status.HTTP_400_BAD_REQUEST)

        old_stage = deal.stage
        deal.stage = new_stage
        if new_stage == 'won':
            from django.utils.timezone import now
            deal.won_at = now().date()
        elif new_stage == 'lost':
            from django.utils.timezone import now
            deal.lost_at = now().date()
            deal.lost_reason = request.data.get('lost_reason', '')
        deal.save()

        DealActivity.objects.create(
            deal=deal,
            activity_type='stage_move',
            content=f'ステージを「{old_stage}」→「{new_stage}」に変更',
            created_by=request.data.get('updated_by', 'システム'),
        )
        return Response(DealSerializer(deal).data)


# ===============================
# 元請案件管理（参画中プロジェクト）
# ===============================

class ProjectViewSet(viewsets.ModelViewSet):
    """元請案件管理"""
    queryset = Project.objects.all().prefetch_related('assignments__engineer')
    serializer_class = ProjectSerializer
    permission_classes = [AllowAny]

    @action(detail=False, methods=['get'])
    def by_client(self, request):
        """元請企業別に案件をグルーピングして返す"""
        projects = self.get_queryset()
        result = {}
        for project in projects:
            key = project.client_company
            if key not in result:
                result[key] = {
                    'client_company': key,
                    'projects': [],
                    'total_engineers': 0,
                    'active_count': 0,
                }
            serialized = ProjectSerializer(project).data
            result[key]['projects'].append(serialized)
            result[key]['total_engineers'] += project.assignments.count()
            if project.status == 'active':
                result[key]['active_count'] += 1

        return Response(list(result.values()))

    @action(detail=True, methods=['post'])
    def add_assignment(self, request, pk=None):
        """エンジニアを案件に参画登録"""
        project = self.get_object()
        engineer_id = request.data.get('engineer_id')
        if not engineer_id:
            return Response({'error': 'engineer_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            engineer = Engineer.objects.get(pk=engineer_id)
        except Engineer.DoesNotExist:
            return Response({'error': 'Engineer not found'}, status=status.HTTP_404_NOT_FOUND)

        assignment, created = ProjectAssignment.objects.get_or_create(
            project=project,
            engineer=engineer,
            defaults={
                'start_date': request.data.get('start_date'),
                'end_date': request.data.get('end_date'),
                'monthly_rate': request.data.get('monthly_rate'),
                'role': request.data.get('role', ''),
                'notes': request.data.get('notes', ''),
            }
        )
        if not created:
            for field in ['start_date', 'end_date', 'monthly_rate', 'role', 'notes', 'is_active']:
                if field in request.data:
                    setattr(assignment, field, request.data[field])
            assignment.save()

        return Response(ProjectSerializer(project).data)

    @action(detail=True, methods=['delete'], url_path=r'remove_assignment/(?P<assignment_id>[^/.]+)')
    def remove_assignment(self, request, pk=None, assignment_id=None):
        """参画登録を削除"""
        project = self.get_object()
        try:
            assignment = ProjectAssignment.objects.get(pk=assignment_id, project=project)
            assignment.delete()
        except ProjectAssignment.DoesNotExist:
            return Response({'error': 'Assignment not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ProjectSerializer(project).data)


class ProjectAssignmentViewSet(viewsets.ModelViewSet):
    queryset = ProjectAssignment.objects.all()
    serializer_class = ProjectAssignmentSerializer
    permission_classes = [AllowAny]


class PartnerEngineerViewSet(viewsets.ModelViewSet):
    queryset = PartnerEngineer.objects.all().order_by('-updated_at')
    serializer_class = PartnerEngineerSerializer
    permission_classes = [AllowAny]

    def _detect_extension(self, instance, new_end_date_str):
        """contract_end が延長されたか検知"""
        from datetime import date
        if not new_end_date_str or instance.contract_end is None:
            return False
        try:
            new_val = date.fromisoformat(str(new_end_date_str))
            return new_val > instance.contract_end
        except (ValueError, TypeError):
            return False

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        data = request.data.copy()
        extend = self._detect_extension(instance, data.get('contract_end'))
        partial = kwargs.get('partial', False)
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        if extend:
            serializer.save(contract_extended_at=timezone.now(), last_user_updated_at=timezone.now())
        else:
            serializer.save(last_user_updated_at=timezone.now())
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)


# ===============================
# テレアポ記録 ViewSet
# ===============================

class TeleapoRecordViewSet(viewsets.ModelViewSet):
    """テレアポ（架電）履歴管理"""
    queryset = TeleapoRecord.objects.all()
    serializer_class = TeleapoRecordSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = TeleapoRecord.objects.all()
        planner = self.request.query_params.get('planner')
        company = self.request.query_params.get('company')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        result = self.request.query_params.get('result')
        if planner:
            qs = qs.filter(planner=planner)
        if company:
            qs = qs.filter(company_name__icontains=company)
        if date_from:
            qs = qs.filter(call_date__gte=date_from)
        if date_to:
            qs = qs.filter(call_date__lte=date_to)
        if result:
            qs = qs.filter(result=result)
        return qs

    def create(self, request, *args, **kwargs):
        """架電記録を保存。アポ取れた の場合は打合せ済み企業リストとアポ管理に自動登録。"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        record = serializer.save()
        headers = self.get_success_headers(serializer.data)

        response_data = dict(serializer.data)

        # アポ取れた の場合: 企業を打合せ済みリストに追加し、アポ管理にも自動登録
        if record.result == 'apo_taken':
            company_obj, company_created = Company.objects.get_or_create(
                name=record.company_name
            )
            _, apt_created = CompanyAppointment.objects.get_or_create(
                company=company_obj,
                planner=record.planner,
                appointment_date=record.call_date,
                defaults={
                    'status': 'scheduled',
                    'notes': f'テレアポから自動登録（架電日: {record.call_date}）',
                },
            )
            response_data['auto_company_created'] = company_created
            response_data['auto_appointment_created'] = apt_created

        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=['get'])
    def company_history(self, request):
        """企業名で架電履歴を検索"""
        company = request.query_params.get('company', '').strip()
        if not company:
            return Response({'error': 'company パラメータが必要です'}, status=status.HTTP_400_BAD_REQUEST)
        records = TeleapoRecord.objects.filter(
            company_name__icontains=company
        ).order_by('-call_date', '-created_at')
        return Response(TeleapoRecordSerializer(records, many=True).data)


# ===============================
# 月次プロジェクトレポート ViewSet
# ===============================

class MonthlyProjectReportViewSet(viewsets.ModelViewSet):
    """月次プロジェクトレポート CRUD"""
    queryset = MonthlyProjectReport.objects.all().order_by('-year_month')
    serializer_class = MonthlyProjectReportSerializer
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'])
    def ensure_current(self, request):
        """
        今月のレコードが存在しなければ自動で作成して返す。
        フロントが画面表示時に呼ぶ。
        """
        from datetime import date
        ym = date.today().strftime('%Y-%m')
        idr_count = int(request.data.get('idr_count', 0))
        bp_count  = int(request.data.get('bp_count', 0))
        report, created = MonthlyProjectReport.objects.get_or_create(
            year_month=ym,
            defaults={
                'idr_count': idr_count,
                'bp_count':  bp_count,
                'is_auto':   True,
                'locked':    False,
            }
        )
        # 自動算出フラグが立っている場合は最新値で上書き
        if not created and report.is_auto and not report.locked:
            report.idr_count = idr_count
            report.bp_count  = bp_count
            report.save()
        return Response(MonthlyProjectReportSerializer(report).data,
                        status=status.HTTP_200_OK)


class PPInterviewViewSet(viewsets.ModelViewSet):
    """PP営業進捗 CRUD"""
    queryset = PPInterview.objects.all().order_by('-created_at')
    serializer_class = PPInterviewSerializer
    permission_classes = [AllowAny]


class BPProspectViewSet(viewsets.ModelViewSet):
    """BP進捗管理 CRUD"""
    queryset = BPProspect.objects.all().order_by('-created_at')
    serializer_class = BPProspectSerializer
    permission_classes = [AllowAny]
