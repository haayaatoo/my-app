from rest_framework import routers
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    EngineerViewSet, SkillSheetViewSet, SalesMemoViewSet, MemoAttachmentViewSet, 
    InterviewViewSet, login_view, logout_view, change_password_view,
    market_trends_view, market_summary_view, aichi_market_trends_view, 
    aichi_market_summary_view, regional_comparison_view,
    RecruitmentChannelViewSet, SocialMediaPostViewSet,
    CompanyViewSet, CompanyAppointmentViewSet,
    DealViewSet,
    ProjectViewSet, ProjectAssignmentViewSet,
    PartnerEngineerViewSet,
    TeleapoRecordViewSet,
    MonthlyProjectReportViewSet,
    PPInterviewViewSet,
    BPProspectViewSet,
    health_check,
)
from . import calendar_views

router = routers.DefaultRouter()
router.register(r'engineers', EngineerViewSet)
router.register(r'skillsheets', SkillSheetViewSet)
router.register(r'memos', SalesMemoViewSet)
router.register(r'memo-attachments', MemoAttachmentViewSet)
router.register(r'interviews', InterviewViewSet)
router.register(r'recruitment-channels', RecruitmentChannelViewSet)
router.register(r'social-posts', SocialMediaPostViewSet)
router.register(r'companies', CompanyViewSet)
router.register(r'appointments', CompanyAppointmentViewSet)
router.register(r'deals', DealViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'project-assignments', ProjectAssignmentViewSet)
router.register(r'partner-engineers', PartnerEngineerViewSet)
router.register(r'teleapo', TeleapoRecordViewSet)
router.register(r'monthly-reports', MonthlyProjectReportViewSet)
router.register(r'pp-interviews', PPInterviewViewSet)
router.register(r'bp-prospects', BPProspectViewSet)

urlpatterns = router.urls + [
    path('auth/login/', login_view, name='login'),
    path('auth/logout/', logout_view, name='logout'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/change-password/', change_password_view, name='change_password'),
    
    # 市場データAPI
    path('market/trends/', market_trends_view, name='market_trends'),
    path('market/summary/', market_summary_view, name='market_summary'),
    
    # 愛知県特化型市場データAPI
    path('market/aichi/trends/', aichi_market_trends_view, name='aichi_market_trends'),
    path('market/aichi/summary/', aichi_market_summary_view, name='aichi_market_summary'),
    path('market/regional/comparison/', regional_comparison_view, name='regional_comparison'),

    # Google Calendar 連携API
    path('calendar/oauth/start/', calendar_views.oauth_start, name='calendar_oauth_start'),
    path('calendar/oauth/callback/', calendar_views.oauth_callback, name='calendar_oauth_callback'),
    path('calendar/oauth/status/', calendar_views.oauth_status, name='calendar_oauth_status'),
    path('calendar/oauth/disconnect/', calendar_views.oauth_disconnect, name='calendar_oauth_disconnect'),
    path('calendar/events/', calendar_views.list_events, name='calendar_list_events'),
    path('calendar/events/export/', calendar_views.export_events, name='calendar_export_events'),
    path('calendar/events/create/', calendar_views.create_event, name='calendar_create_event'),
    path('calendar/events/<str:event_id>/update/', calendar_views.update_event, name='calendar_update_event'),
    path('calendar/events/<str:event_id>/delete/', calendar_views.delete_event, name='calendar_delete_event'),

    #ヘルスチェック用
    path('health/', health_check, name='health'),
]
