from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Engineer, SkillSheet, SalesMemo, MemoAttachment
from .serializers import (
    EngineerSerializer, 
    SkillSheetSerializer, 
    SalesMemoSerializer, 
    MemoAttachmentSerializer,
    EngineerDetailSerializer
)

class EngineerViewSet(viewsets.ModelViewSet):
    queryset = Engineer.objects.all()
    serializer_class = EngineerSerializer


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
