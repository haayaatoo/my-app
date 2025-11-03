from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone

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
    # 基本情報
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True, blank=True, null=True)  # メールアドレス（ログイン用）
    position = models.CharField(max_length=50, blank=True, null=True)  # 役職（空欄可）
    project_name = models.CharField(max_length=100)
    planner = models.CharField(max_length=100)
    skills = models.JSONField()  # 複数スキル
    engineer_status = models.CharField(max_length=20)  # active/upcoming/unassigned
    phase = models.JSONField()  # 経験フェーズ（複数選択可）
    
    # 売上予測機能用の新規フィールド
    # プロジェクト・売上情報
    monthly_rate = models.DecimalField(max_digits=10, decimal_places=0, blank=True, null=True, verbose_name='月単価（円）')
    project_start_date = models.DateField(blank=True, null=True, verbose_name='プロジェクト開始日')
    project_end_date = models.DateField(blank=True, null=True, verbose_name='プロジェクト終了予定日')
    client_company = models.CharField(max_length=200, blank=True, null=True, verbose_name='派遣先企業名')
    working_days_per_month = models.IntegerField(default=20, verbose_name='月稼働日数')
    working_rate = models.DecimalField(max_digits=3, decimal_places=2, default=1.00, verbose_name='稼働率（0.0-1.0）')
    
    # 売上計算用
    monthly_revenue = models.DecimalField(max_digits=10, decimal_places=0, blank=True, null=True, verbose_name='月売上（自動計算）')
    
    # 契約・ステータス情報
    contract_type = models.CharField(
        max_length=20, 
        choices=[
            ('ses', 'SES'),
            ('dispatch', '派遣'),
            ('contract', '請負'),
            ('freelance', 'フリーランス'),
            ('internal', '社内開発'),
        ],
        default='ses',
        verbose_name='契約形態'
    )
    
    project_status = models.CharField(
        max_length=20,
        choices=[
            ('active', '稼働中'),
            ('pending', '待機中'),
            ('ending', '終了予定'),
            ('ended', '終了'),
            ('paused', '一時停止'),
        ],
        default='active',
        verbose_name='プロジェクトステータス'
    )
    
    # メタデータ
    revenue_updated_at = models.DateTimeField(auto_now=True, verbose_name='売上情報更新日')

    def calculate_monthly_revenue(self):
        """月売上を自動計算"""
        if self.monthly_rate and self.working_days_per_month and self.working_rate:
            # 月売上 = 月単価 × 稼働率
            return float(self.monthly_rate) * float(self.working_rate)
        return 0

    def save(self, *args, **kwargs):
        """保存時に月売上を自動計算"""
        self.monthly_revenue = self.calculate_monthly_revenue()
        super().save(*args, **kwargs)

    def get_annual_revenue_forecast(self):
        """年売上予測を計算"""
        if self.monthly_revenue:
            return float(self.monthly_revenue) * 12
        return 0

    def get_project_duration_months(self):
        """プロジェクト期間（月数）を計算"""
        if self.project_start_date and self.project_end_date:
            from datetime import datetime
            
            start = self.project_start_date
            end = self.project_end_date
            
            # 簡易的な月数計算
            years_diff = end.year - start.year
            months_diff = end.month - start.month
            total_months = years_diff * 12 + months_diff
            
            # 日数を考慮して調整
            if end.day > start.day:
                total_months += 1
            
            return max(total_months, 1)  # 最低1ヶ月
        return 0

    def __str__(self):
        return f"{self.name} ({self.email})"

    class Meta:
        verbose_name = "エンジニア"
        verbose_name_plural = "エンジニア"


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


class RecruitmentChannel(models.Model):
    """採用経路管理モデル"""
    CHANNEL_CHOICES = [
        ('sns_instagram', 'Instagram'),
        ('sns_x', 'X（Twitter）'),
        ('sns_tiktok', 'TikTok'),
        ('website', 'HP応募'),
        ('card_interview', 'カード面談'),
        ('referral', 'リファラル'),
        ('job_media', '求人媒体'),
        ('indeed', 'Indeed'),
        ('other', 'その他'),
    ]
    
    STATUS_CHOICES = [
        ('applied', '応募'),
        ('screening', '書類選考中'),
        ('interview', '面接中'),
        ('hired', '採用'),
        ('rejected', '不採用'),
        ('withdrawn', '辞退'),
    ]
    
    # 基本情報
    applicant_name = models.CharField(max_length=100, verbose_name='応募者名')
    email = models.EmailField(verbose_name='メールアドレス', blank=True, null=True)
    phone = models.CharField(max_length=20, verbose_name='電話番号', blank=True, null=True)
    
    # 採用経路情報
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES, verbose_name='採用経路')
    channel_detail = models.CharField(max_length=200, blank=True, null=True, verbose_name='詳細情報')
    
    # 進捗管理
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='applied', verbose_name='ステータス')
    applied_at = models.DateTimeField(default=timezone.now, verbose_name='応募日時')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新日時')
    
    # SNS関連情報
    sns_post_url = models.URLField(blank=True, null=True, verbose_name='SNS投稿URL')
    sns_engagement_data = models.JSONField(blank=True, null=True, verbose_name='エンゲージメントデータ')
    
    # 採用結果・コスト分析
    hired_at = models.DateTimeField(blank=True, null=True, verbose_name='採用決定日')
    cost_per_acquisition = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, verbose_name='採用単価')
    
    # メモ・備考
    notes = models.TextField(blank=True, null=True, verbose_name='備考')
    
    class Meta:
        verbose_name = '採用経路管理'
        verbose_name_plural = '採用経路管理'
        ordering = ['-applied_at']
    
    def __str__(self):
        return f"{self.applicant_name} - {self.get_channel_display()}"


class SocialMediaPost(models.Model):
    """SNS投稿管理モデル（TikTok連携用）"""
    PLATFORM_CHOICES = [
        ('tiktok', 'TikTok'),
        ('instagram', 'Instagram'),
        ('x', 'X（Twitter）'),
    ]
    
    # 基本情報
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES, verbose_name='プラットフォーム')
    post_id = models.CharField(max_length=100, verbose_name='投稿ID', unique=True)
    post_url = models.URLField(verbose_name='投稿URL')
    content = models.TextField(verbose_name='投稿内容')
    hashtags = models.JSONField(blank=True, null=True, verbose_name='ハッシュタグ')
    
    # 投稿日時
    posted_at = models.DateTimeField(verbose_name='投稿日時')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='記録日時')
    
    # エンゲージメント指標
    likes_count = models.IntegerField(default=0, verbose_name='いいね数')
    comments_count = models.IntegerField(default=0, verbose_name='コメント数')
    shares_count = models.IntegerField(default=0, verbose_name='シェア数')
    views_count = models.IntegerField(default=0, verbose_name='視聴数')
    impressions = models.IntegerField(default=0, verbose_name='インプレッション')
    reach = models.IntegerField(default=0, verbose_name='リーチ')
    
    # エンゲージメント率（自動計算）
    engagement_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name='エンゲージメント率')
    
    # 採用関連
    applications_generated = models.IntegerField(default=0, verbose_name='応募発生数')
    hires_generated = models.IntegerField(default=0, verbose_name='採用発生数')
    
    # API同期情報
    last_synced_at = models.DateTimeField(auto_now=True, verbose_name='最終同期日時')
    
    class Meta:
        verbose_name = 'SNS投稿'
        verbose_name_plural = 'SNS投稿'
        ordering = ['-posted_at']
    
    def save(self, *args, **kwargs):
        # エンゲージメント率の自動計算
        if self.views_count > 0:
            total_engagement = self.likes_count + self.comments_count + self.shares_count
            self.engagement_rate = (total_engagement / self.views_count) * 100
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.get_platform_display()} - {self.posted_at.strftime('%Y-%m-%d %H:%M')}"


class RevenueForecast(models.Model):
    """売上予測サマリーモデル"""
    
    FORECAST_TYPE_CHOICES = [
        ('monthly', '月次予測'),
        ('quarterly', '四半期予測'),
        ('annual', '年次予測'),
    ]
    
    SCENARIO_CHOICES = [
        ('optimistic', '楽観シナリオ'),
        ('realistic', '現実シナリオ'),
        ('pessimistic', '悲観シナリオ'),
    ]
    
    # 予測基本情報
    forecast_date = models.DateField(verbose_name='予測対象年月')
    forecast_type = models.CharField(max_length=20, choices=FORECAST_TYPE_CHOICES, verbose_name='予測期間')
    scenario = models.CharField(max_length=20, choices=SCENARIO_CHOICES, verbose_name='シナリオ')
    
    # 売上予測値
    total_revenue = models.DecimalField(max_digits=12, decimal_places=0, verbose_name='総売上予測（円）')
    active_engineers_count = models.IntegerField(verbose_name='稼働エンジニア数')
    average_monthly_rate = models.DecimalField(max_digits=10, decimal_places=0, verbose_name='平均月単価')
    average_working_rate = models.DecimalField(max_digits=3, decimal_places=2, verbose_name='平均稼働率')
    
    # 予測根拠データ
    new_hires_assumption = models.IntegerField(default=0, verbose_name='新規採用想定数')
    rate_increase_assumption = models.DecimalField(max_digits=3, decimal_places=2, default=0, verbose_name='単価上昇率想定')
    project_continuation_rate = models.DecimalField(max_digits=3, decimal_places=2, default=0.85, verbose_name='プロジェクト継続率')
    
    # システム項目
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(ProdiaUser, on_delete=models.CASCADE, verbose_name='作成者')
    
    class Meta:
        verbose_name = "売上予測"
        verbose_name_plural = "売上予測"
        ordering = ['-forecast_date', 'scenario']
        unique_together = ['forecast_date', 'forecast_type', 'scenario']
    
    def __str__(self):
        return f"{self.forecast_date} {self.get_forecast_type_display()} ({self.get_scenario_display()})"


class MonthlyRevenueSummary(models.Model):
    """月次売上サマリー（実績記録用）"""
    
    # 対象年月
    year_month = models.DateField(verbose_name='対象年月（月初日）')
    
    # 実績値
    actual_revenue = models.DecimalField(max_digits=12, decimal_places=0, verbose_name='実際売上（円）')
    active_engineers = models.IntegerField(verbose_name='稼働エンジニア数')
    total_working_days = models.IntegerField(verbose_name='総稼働日数')
    
    # 計算値
    average_daily_revenue = models.DecimalField(max_digits=10, decimal_places=0, verbose_name='日平均売上')
    revenue_per_engineer = models.DecimalField(max_digits=10, decimal_places=0, verbose_name='エンジニア当たり売上')
    
    # 前年同月比較
    previous_year_revenue = models.DecimalField(max_digits=12, decimal_places=0, blank=True, null=True, verbose_name='前年同月売上')
    year_over_year_growth = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True, verbose_name='前年同月比成長率')
    
    # システム項目
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "月次売上サマリー"
        verbose_name_plural = "月次売上サマリー"
        ordering = ['-year_month']
        unique_together = ['year_month']
    
    def calculate_growth_rate(self):
        """前年同月比成長率を計算"""
        if self.previous_year_revenue and self.previous_year_revenue > 0:
            growth = ((self.actual_revenue - self.previous_year_revenue) / self.previous_year_revenue) * 100
            return round(growth, 2)
        return 0
    
    def save(self, *args, **kwargs):
        """保存時に計算値を更新"""
        if self.actual_revenue and self.active_engineers > 0:
            self.revenue_per_engineer = self.actual_revenue / self.active_engineers
        
        if self.actual_revenue and self.total_working_days > 0:
            self.average_daily_revenue = self.actual_revenue / self.total_working_days
            
        self.year_over_year_growth = self.calculate_growth_rate()
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.year_month.strftime('%Y年%m月')} - {self.actual_revenue:,}円"
