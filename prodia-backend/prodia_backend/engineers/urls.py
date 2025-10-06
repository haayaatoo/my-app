from rest_framework import routers
from .views import EngineerViewSet, SkillSheetViewSet, SalesMemoViewSet, MemoAttachmentViewSet

router = routers.DefaultRouter()
router.register(r'engineers', EngineerViewSet)
router.register(r'skillsheets', SkillSheetViewSet)
router.register(r'memos', SalesMemoViewSet)
router.register(r'memo-attachments', MemoAttachmentViewSet)

urlpatterns = router.urls
