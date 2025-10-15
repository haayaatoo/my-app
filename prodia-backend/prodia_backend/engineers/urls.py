from rest_framework import routers
from django.urls import path
from .views import (
    EngineerViewSet, SkillSheetViewSet, SalesMemoViewSet, MemoAttachmentViewSet, 
    InterviewViewSet, login_view, logout_view, change_password_view,
    market_trends_view, market_summary_view, aichi_market_trends_view, 
    aichi_market_summary_view, regional_comparison_view
)

router = routers.DefaultRouter()
router.register(r'engineers', EngineerViewSet)
router.register(r'skillsheets', SkillSheetViewSet)
router.register(r'memos', SalesMemoViewSet)
router.register(r'memo-attachments', MemoAttachmentViewSet)
router.register(r'interviews', InterviewViewSet)

urlpatterns = router.urls + [
    path('auth/login/', login_view, name='login'),
    path('auth/logout/', logout_view, name='logout'),
    path('auth/change-password/', change_password_view, name='change_password'),
    
    # 市場データAPI
    path('market/trends/', market_trends_view, name='market_trends'),
    path('market/summary/', market_summary_view, name='market_summary'),
    
    # 愛知県特化型市場データAPI
    path('market/aichi/trends/', aichi_market_trends_view, name='aichi_market_trends'),
    path('market/aichi/summary/', aichi_market_summary_view, name='aichi_market_summary'),
    path('market/regional/comparison/', regional_comparison_view, name='regional_comparison'),
]
