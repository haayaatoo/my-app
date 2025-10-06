from django.db import models

class Engineer(models.Model):
    name = models.CharField(max_length=100)
    position = models.CharField(max_length=50, blank=True, null=True)  # 役職（空欄可）
    project_name = models.CharField(max_length=100)
    planner = models.CharField(max_length=100)
    skills = models.JSONField()  # 複数スキル
    engineer_status = models.CharField(max_length=20)  # active/upcoming/unassigned
    phase = models.JSONField()  # 経験フェーズ（複数選択可）

    def __str__(self):
        return self.name


# スキルシートファイル管理モデル
class SkillSheet(models.Model):
    file = models.FileField(upload_to='skillsheets/')
    uploader = models.CharField(max_length=100)
    engineer_name = models.CharField(max_length=100, blank=True, null=True)  # エンジニア名
    status = models.CharField(max_length=20, default='pending')  # pending/approved/rejected
    is_approved = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.engineer_name or ''} {self.file.name} ({self.uploader})"


# 営業メモシステム - ハイブリッド型
class SalesMemo(models.Model):
    MEMO_TYPES = [
        ('engineer', 'エンジニア個別メモ'),
        ('project', '案件メモ'),
        ('task', 'タスクメモ'),
        ('general', '全体メモ'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', '低'),
        ('medium', '中'),
        ('high', '高'),
        ('urgent', '緊急'),
    ]

    # 基本情報
    memo_type = models.CharField(max_length=20, choices=MEMO_TYPES, default='engineer')
    title = models.CharField(max_length=200)
    content = models.TextField()
    
    # 関連付け（フェーズ1: エンジニア個別メモ）
    engineer_name = models.CharField(max_length=100, blank=True, null=True)  # エンジニア名
    skillsheet = models.ForeignKey(SkillSheet, on_delete=models.CASCADE, blank=True, null=True)  # スキルシート関連付け
    
    # 営業情報
    author = models.CharField(max_length=100)  # メモ作成者
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    tags = models.JSONField(default=list, blank=True)  # タグ（例: ["面談済み", "条件交渉中"]）
    
    # 進捗管理
    is_completed = models.BooleanField(default=False)
    due_date = models.DateTimeField(blank=True, null=True)  # 期限
    
    # メタデータ
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_shared = models.BooleanField(default=False)  # チーム共有フラグ

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['memo_type', 'engineer_name']),
            models.Index(fields=['author', 'created_at']),
            models.Index(fields=['is_completed', 'due_date']),
        ]

    def __str__(self):
        return f"{self.get_memo_type_display()}: {self.title}"


# メモ添付ファイル（将来拡張用）
class MemoAttachment(models.Model):
    memo = models.ForeignKey(SalesMemo, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='memo_attachments/')
    file_name = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.memo.title} - {self.file_name}"
