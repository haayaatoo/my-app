from django.db import models
from django.contrib.auth.hashers import make_password, check_password

# Prodiaユーザー管理（ログイン専用）
class ProdiaUser(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=128)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(null=True, blank=True)

    def set_password(self, password):
        """パスワードをハッシュ化して保存"""
        self.password_hash = make_password(password)

    def check_password(self, password):
        """パスワードを検証"""
        return check_password(password, self.password_hash)

    def __str__(self):
        return f"{self.name} ({self.email})"

    class Meta:
        verbose_name = "Prodiaユーザー"
        verbose_name_plural = "Prodiaユーザー"


class Engineer(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True, blank=True, null=True)  # メールアドレス（ログイン用）
    position = models.CharField(max_length=50, blank=True, null=True)  # 役職（空欄可）
    project_name = models.CharField(max_length=100)
    planner = models.CharField(max_length=100)
    skills = models.JSONField()  # 複数スキル
    engineer_status = models.CharField(max_length=20)  # active/upcoming/unassigned
    phase = models.JSONField()  # 経験フェーズ（複数選択可）

    def __str__(self):
        return f"{self.name} ({self.email})"


# スキルシートファイル管理モデル
class SkillSheet(models.Model):
    file = models.FileField(upload_to='skillsheets/')
    uploader = models.CharField(max_length=100)
    engineer_name = models.CharField(max_length=100, blank=True, null=True)  # エンジニア名
    status = models.CharField(max_length=20, default='pending')  # pending/approved/rejected
    is_approved = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    @property
    def file_name(self):
        """アップロードされたファイルの元のファイル名を取得"""
        if self.file:
            import os
            return os.path.basename(self.file.name)
        return None

    @property
    def file_url(self):
        """ファイルのURLを取得"""
        if self.file:
            return self.file.url
        return None

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


# 面談履歴管理モデル
class Interview(models.Model):
    INTERVIEW_TYPE_CHOICES = [
        ('customer_interview', 'お客様面談'),
        ('evaluation_interview', '評価面談'),
        ('one_on_one', '1on1面談'),
        ('other', 'その他'),
    ]
    
    RESULT_CHOICES = [
        ('pass', '合格'),
        ('fail', '不合格'),
        ('pending', '保留'),
        ('canceled', 'キャンセル'),
    ]
    
    engineer = models.ForeignKey(Engineer, on_delete=models.CASCADE, related_name='interviews')
    interview_date = models.DateField()  # 面談日
    interview_type = models.CharField(max_length=30, choices=INTERVIEW_TYPE_CHOICES)  # 面談種別
    client_company = models.CharField(max_length=200, blank=True, null=True)  # 面談先企業名
    result = models.CharField(max_length=20, choices=RESULT_CHOICES)  # 面談結果
    
    # NG理由・改善点
    rejection_reason = models.TextField(blank=True, null=True)  # NG理由
    improvement_points = models.TextField(blank=True, null=True)  # 改善点
    
    # 評価項目（5段階評価）
    technical_skill = models.IntegerField(blank=True, null=True, help_text="技術力（1-5）")
    communication_skill = models.IntegerField(blank=True, null=True, help_text="コミュニケーション力（1-5）")
    motivation = models.IntegerField(blank=True, null=True, help_text="やる気・意欲（1-5）")
    
    # 人事評価用追加フィールド
    leadership = models.IntegerField(blank=True, null=True, help_text="リーダーシップ（1-5）")
    problem_solving = models.IntegerField(blank=True, null=True, help_text="問題解決力（1-5）")
    overall_rating = models.IntegerField(blank=True, null=True, help_text="総合評価（1-5）")
    
    # 人事評価用定性評価
    strengths = models.TextField(blank=True, null=True, help_text="強み・評価点")
    improvement_areas = models.TextField(blank=True, null=True, help_text="改善領域") 
    goals_next_period = models.TextField(blank=True, null=True, help_text="次期目標")
    
    # その他
    notes = models.TextField(blank=True, null=True)  # 備考・その他メモ
    next_action = models.TextField(blank=True, null=True)  # 次回アクション
    
    # システム項目
    created_by = models.ForeignKey(ProdiaUser, on_delete=models.CASCADE)  # 作成者
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-interview_date']
        verbose_name = "面談履歴"
        verbose_name_plural = "面談履歴"
    
    def __str__(self):
        return f"{self.engineer.name} - {self.get_interview_type_display()} ({self.interview_date})"
