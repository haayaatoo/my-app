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

    @property
    def is_authenticated(self):
        """DRF の IsAuthenticated パーミッションが参照するプロパティ"""
        return self.is_active

    @property
    def is_anonymous(self):
        return False

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
    project_name = models.CharField(max_length=100, blank=True, null=True)
    planner = models.CharField(max_length=100, blank=True, null=True)
    skills = models.JSONField()  # 複数スキル
    engineer_status = models.CharField(max_length=20)  # active/upcoming/unassigned
    phase = models.JSONField()  # 経験フェーズ（複数選択可）
    
    # 売上予測機能用の新規フィールド
    # プロジェクト・売上情報
    monthly_rate = models.DecimalField(max_digits=10, decimal_places=0, blank=True, null=True, verbose_name='月単価（円）')
    project_start_date = models.DateField(blank=True, null=True, verbose_name='プロジェクト開始日')
    project_end_date = models.DateField(blank=True, null=True, verbose_name='プロジェクト終了予定日')
    contract_extended_at = models.DateTimeField(blank=True, null=True, verbose_name='契約延長日')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新日時')
    client_company = models.CharField(max_length=200, blank=True, null=True, verbose_name='派遣先企業名')
    project_location = models.CharField(max_length=200, blank=True, null=True, verbose_name='プロジェクト所在地')
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
    last_user_updated_at = models.DateTimeField(blank=True, null=True, verbose_name='最終更新日時')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='登録日時', null=True, blank=True)
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


# ===============================
# 企業アポイント管理モデル
# ===============================

class Company(models.Model):
    """企業マスターリスト"""
    name = models.CharField(max_length=200, unique=True, verbose_name='企業名')
    memo = models.TextField(blank=True, null=True, verbose_name='備考')
    website_url = models.URLField(max_length=500, blank=True, null=True, verbose_name='ホームページURL')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "企業"
        verbose_name_plural = "企業一覧"
        ordering = ['name']

    def __str__(self):
        return self.name


class CompanyAppointment(models.Model):
    """企業アポイント管理 - プランナー間の重複アポを防止"""
    STATUS_CHOICES = [
        ('scheduled', '予定'),
        ('completed', '完了'),
        ('cancelled', 'キャンセル'),
    ]

    company = models.ForeignKey(
        Company, on_delete=models.CASCADE,
        related_name='appointments', verbose_name='企業'
    )
    planner = models.CharField(max_length=100, verbose_name='プランナー')
    appointment_date = models.DateField(verbose_name='日程')
    appointment_time = models.TimeField(null=True, blank=True, verbose_name='時間')
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES,
        default='scheduled', verbose_name='ステータス'
    )
    notes = models.TextField(blank=True, null=True, verbose_name='メモ')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "アポイント"
        verbose_name_plural = "アポイント一覧"
        ordering = ['appointment_date', 'appointment_time']

    def __str__(self):
        return f"{self.company.name} - {self.planner} ({self.appointment_date})"


# ===============================
# テレアポ記録
# ===============================

class TeleapoRecord(models.Model):
    """テレアポ（架電）履歴管理"""
    RESULT_CHOICES = [
        ('apo_taken', 'アポ取れた'),
        ('absent',    '不在'),
        ('rejected',  'お断り'),
        ('callback',  '折り返し待ち'),
        ('other',     'その他'),
    ]

    company_name  = models.CharField(max_length=200, verbose_name='企業名')
    phone_number  = models.CharField(max_length=50, blank=True, null=True, verbose_name='電話番号')
    planner       = models.CharField(max_length=100, verbose_name='プランナー名')
    call_date     = models.DateField(verbose_name='架電日')
    result        = models.CharField(max_length=20, choices=RESULT_CHOICES, verbose_name='架電結果')
    notes         = models.TextField(blank=True, null=True, verbose_name='備考')
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "テレアポ記録"
        verbose_name_plural = "テレアポ記録"
        ordering = ['-call_date', '-created_at']

    def __str__(self):
        return f"{self.company_name} - {self.planner} ({self.call_date})"


# ===============================
# 案件パイプライン（かんばんボード）
# ===============================

class Deal(models.Model):
    """営業案件管理モデル（かんばんボード用）"""

    STAGE_CHOICES = [
        ('open_system',    'オープン系'),
        ('web',            'Web系'),
        ('embedded',       '組み込み'),
        ('infrastructure', 'インフラ'),
        ('support_other',  '開発支援・その他'),
        ('low_skill',      'ロースキル'),
    ]

    PRIORITY_CHOICES = [
        ('low',    '低'),
        ('medium', '中'),
        ('high',   '高'),
        ('urgent', '至急'),
    ]

    # 基本情報
    title = models.CharField(max_length=200, verbose_name='案件タイトル')
    client_company = models.CharField(max_length=200, verbose_name='客先企業名')
    contact_person = models.CharField(max_length=100, blank=True, null=True, verbose_name='担当者名')
    contact_email = models.EmailField(blank=True, null=True, verbose_name='担当者メール')
    contact_phone = models.CharField(max_length=30, blank=True, null=True, verbose_name='担当者電話')

    # パイプラインステージ
    stage = models.CharField(max_length=20, choices=STAGE_CHOICES, default='open_system', verbose_name='ステージ')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium', verbose_name='優先度')

    # 提案エンジニア（複数可）
    proposed_engineers = models.ManyToManyField(
        Engineer, blank=True, related_name='deals', verbose_name='提案エンジニア'
    )

    # 案件詳細
    description = models.TextField(blank=True, null=True, verbose_name='案件詳細')
    required_skills = models.JSONField(default=list, blank=True, verbose_name='必要スキル')
    expected_monthly_rate = models.DecimalField(
        max_digits=10, decimal_places=0, blank=True, null=True, verbose_name='想定月単価（円）'
    )
    expected_start_date = models.DateField(blank=True, null=True, verbose_name='参画予定日')
    expected_duration_months = models.IntegerField(blank=True, null=True, verbose_name='想定期間（月）')

    # 進捗管理
    next_action = models.TextField(blank=True, null=True, verbose_name='次回アクション')
    next_action_date = models.DateField(blank=True, null=True, verbose_name='次回アクション日')
    win_probability = models.IntegerField(default=50, verbose_name='受注確率（%）')

    # 担当営業
    assigned_to = models.CharField(max_length=100, verbose_name='担当営業')

    # 結果
    lost_reason = models.TextField(blank=True, null=True, verbose_name='失注理由')
    won_at = models.DateField(blank=True, null=True, verbose_name='成約日')
    lost_at = models.DateField(blank=True, null=True, verbose_name='失注日')

    # システム項目
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = '案件'
        verbose_name_plural = '案件一覧'
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.title} ({self.client_company}) - {self.get_stage_display()}"


class DealActivity(models.Model):
    """案件活動履歴ログ"""

    ACTIVITY_TYPE_CHOICES = [
        ('note',       'メモ'),
        ('call',       '電話'),
        ('email',      'メール'),
        ('meeting',    '訪問'),
        ('proposal',   '提案書送付'),
        ('stage_move', 'ステージ変更'),
    ]

    deal = models.ForeignKey(Deal, on_delete=models.CASCADE, related_name='activities', verbose_name='案件')
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPE_CHOICES, verbose_name='活動種別')
    content = models.TextField(verbose_name='内容')
    created_by = models.CharField(max_length=100, verbose_name='記録者')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = '案件活動履歴'
        verbose_name_plural = '案件活動履歴'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.deal.title} - {self.get_activity_type_display()} ({self.created_at.strftime('%Y/%m/%d')})"


# ===============================
# 元請案件管理（参画中プロジェクト）
# ===============================

class Project(models.Model):
    """元請案件モデル（実際に参画中・完了した案件）"""

    STATUS_CHOICES = [
        ('active',    '参画中'),
        ('planned',   '開始予定'),
        ('completed', '完了'),
        ('suspended', '中断'),
    ]

    WORK_STYLE_CHOICES = [
        ('onsite',  '常駐'),
        ('remote',  'フルリモート'),
        ('hybrid',  'ハイブリッド'),
    ]

    # 基本情報
    title = models.CharField(max_length=200, verbose_name='案件名')
    client_company = models.CharField(max_length=200, verbose_name='元請企業名')
    client_contact = models.CharField(max_length=100, blank=True, null=True, verbose_name='客先担当者名')
    client_contact_email = models.EmailField(blank=True, null=True, verbose_name='客先担当者メール')
    client_contact_phone = models.CharField(max_length=30, blank=True, null=True, verbose_name='客先担当者電話')

    # ステータス
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', verbose_name='ステータス')

    # 期間
    start_date = models.DateField(blank=True, null=True, verbose_name='案件開始日')
    end_date = models.DateField(blank=True, null=True, verbose_name='案件終了予定日')

    # 詳細
    description = models.TextField(blank=True, null=True, verbose_name='案件詳細')
    required_skills = models.JSONField(default=list, blank=True, verbose_name='必要スキル')
    location = models.CharField(max_length=200, blank=True, null=True, verbose_name='就業場所')
    work_style = models.CharField(max_length=20, choices=WORK_STYLE_CHOICES, blank=True, null=True, verbose_name='勤務形態')

    # 単価（会社受取額）
    monthly_rate = models.DecimalField(max_digits=10, decimal_places=0, blank=True, null=True, verbose_name='月単価（会社受取）')

    # 備考
    notes = models.TextField(blank=True, null=True, verbose_name='備考・メモ')

    # システム項目
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = '元請案件'
        verbose_name_plural = '元請案件一覧'
        ordering = ['-start_date', '-created_at']

    def __str__(self):
        return f"{self.title} ({self.client_company})"


class ProjectAssignment(models.Model):
    """エンジニアの案件参画情報（中間テーブル）"""

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='assignments', verbose_name='案件')
    engineer = models.ForeignKey(Engineer, on_delete=models.CASCADE, related_name='project_assignments', verbose_name='エンジニア')

    # 参画期間（エンジニアごとに異なる場合がある）
    start_date = models.DateField(blank=True, null=True, verbose_name='参画開始日')
    end_date = models.DateField(blank=True, null=True, verbose_name='参画終了予定日')

    # エンジニア個人の単価
    monthly_rate = models.DecimalField(max_digits=10, decimal_places=0, blank=True, null=True, verbose_name='月単価（エンジニア）')

    # 役割
    role = models.CharField(max_length=100, blank=True, null=True, verbose_name='役割（PL/PG等）')

    # 参画状況
    is_active = models.BooleanField(default=True, verbose_name='現在参画中')

    # 備考
    notes = models.TextField(blank=True, null=True, verbose_name='備考')

    # システム項目
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'エンジニア参画情報'
        verbose_name_plural = 'エンジニア参画情報一覧'
        ordering = ['-start_date']
        unique_together = [['project', 'engineer']]

    def __str__(self):
        return f"{self.engineer.name} → {self.project.title}"


# ===============================
# パートナーエンジニア管理
# ===============================

class PartnerEngineer(models.Model):
    """パートナーエンジニア（BP）管理モデル"""

    STATUS_CHOICES = [
        ('active',   '稼働中'),
        ('upcoming', '稼働予定'),
        ('free',     'フリー'),
        ('inactive', '非稼働'),
    ]

    EXTENSION_CHOICES = [
        ('yes',     '有'),
        ('no',      '無'),
        ('unknown', '未定'),
    ]

    REMOTE_CHOICES = [
        ('yes',    '有'),
        ('no',     '無'),
        ('hybrid', 'ハイブリッド'),
    ]

    # ── カード表面（基本情報）──
    name          = models.CharField(max_length=100, verbose_name='技術者氏名')
    name_kana     = models.CharField(max_length=100, blank=True, null=True, verbose_name='フリガナ')
    partner_company = models.CharField(max_length=200, verbose_name='所属会社（BP会社名）')
    skills        = models.JSONField(default=list, blank=True, verbose_name='スキル')
    planner       = models.CharField(max_length=100, blank=True, null=True, verbose_name='担当プランナー')
    status        = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', verbose_name='ステータス')

    # ── 案件情報 ──
    project_name    = models.CharField(max_length=200, blank=True, null=True, verbose_name='案件名')
    nearest_station = models.CharField(max_length=100, blank=True, null=True, verbose_name='最寄り駅')
    remote          = models.CharField(max_length=10, choices=REMOTE_CHOICES, blank=True, null=True, verbose_name='リモート有無')
    contract_start  = models.DateField(blank=True, null=True, verbose_name='契約開始日')
    contract_end    = models.DateField(blank=True, null=True, verbose_name='契約終了日')
    extension_possibility = models.CharField(max_length=10, choices=EXTENSION_CHOICES, blank=True, null=True, verbose_name='延長の可能性')
    calendar_type   = models.CharField(max_length=100, blank=True, null=True, verbose_name='カレンダー', default='通常カレンダー')
    work_hours      = models.CharField(max_length=50, blank=True, null=True, verbose_name='勤務時間', default='9:00-18:00')
    actual_work_hours = models.CharField(max_length=20, blank=True, null=True, verbose_name='実働時間', default='8h')

    # ── 甲（クライアント）契約単価 ──
    client_company      = models.CharField(max_length=200, blank=True, null=True, verbose_name='甲：会社名')
    client_unit_price   = models.DecimalField(max_digits=10, decimal_places=0, blank=True, null=True, verbose_name='甲：基本単価（円）')
    client_settlement_range  = models.CharField(max_length=50, blank=True, null=True, verbose_name='甲：精算幅', default='140-180h')
    client_overtime_rate     = models.DecimalField(max_digits=8, decimal_places=0, blank=True, null=True, verbose_name='甲：超過単価（円）')
    client_deduction_rate    = models.DecimalField(max_digits=8, decimal_places=0, blank=True, null=True, verbose_name='甲：控除単価（円）')
    client_settlement_unit   = models.CharField(max_length=20, blank=True, null=True, verbose_name='甲：精算単位', default='15分')
    client_payment_site      = models.CharField(max_length=100, blank=True, null=True, verbose_name='甲：支払サイト', default='月末日締め、翌月末日支払い')
    client_timesheet_format  = models.CharField(max_length=100, blank=True, null=True, verbose_name='甲：勤務表', default='現場フォーマット')
    client_timesheet_collection = models.CharField(max_length=200, blank=True, null=True, verbose_name='甲：勤怠表回収方法')
    client_invoice_deadline  = models.CharField(max_length=100, blank=True, null=True, verbose_name='甲：請求書期限', default='第2営業日まで')
    client_contact_to        = models.CharField(max_length=200, blank=True, null=True, verbose_name='甲：書類送付先 To')
    client_contact_cc        = models.CharField(max_length=200, blank=True, null=True, verbose_name='甲：書類送付先 Cc')

    # ── 乙（パートナー）契約単価 ──
    partner_unit_price       = models.DecimalField(max_digits=10, decimal_places=0, blank=True, null=True, verbose_name='乙：基本単価（円）')
    partner_settlement_range = models.CharField(max_length=50, blank=True, null=True, verbose_name='乙：精算幅', default='140-180h')
    partner_overtime_rate    = models.DecimalField(max_digits=8, decimal_places=0, blank=True, null=True, verbose_name='乙：超過単価（円）')
    partner_deduction_rate   = models.DecimalField(max_digits=8, decimal_places=0, blank=True, null=True, verbose_name='乙：控除単価（円）')
    partner_settlement_unit  = models.CharField(max_length=20, blank=True, null=True, verbose_name='乙：精算単位', default='15分')
    partner_payment_site     = models.CharField(max_length=100, blank=True, null=True, verbose_name='乙：支払サイト', default='月末日締め、翌月末日支払い')
    partner_timesheet_format = models.CharField(max_length=100, blank=True, null=True, verbose_name='乙：勤務表', default='現場フォーマット')
    partner_timesheet_collection = models.CharField(max_length=200, blank=True, null=True, verbose_name='乙：勤怠表回収方法')
    partner_invoice_deadline = models.CharField(max_length=100, blank=True, null=True, verbose_name='乙：請求書期限', default='第2営業日まで')
    partner_contact_to       = models.CharField(max_length=200, blank=True, null=True, verbose_name='乙：書類送付先 To')
    partner_contact_cc       = models.CharField(max_length=200, blank=True, null=True, verbose_name='乙：書類送付先 Cc')

    # ── 弊社事務担当 ──
    our_admin_to  = models.CharField(max_length=200, blank=True, null=True, verbose_name='弊社事務担当 To')
    our_admin_cc  = models.CharField(max_length=200, blank=True, null=True, verbose_name='弊社事務担当 Cc')

    # ── 備考 ──
    notes = models.TextField(blank=True, null=True, verbose_name='備考')

    # システム項目
    contract_extended_at = models.DateTimeField(blank=True, null=True, verbose_name='契約延長日')
    last_user_updated_at = models.DateTimeField(blank=True, null=True, verbose_name='最終更新日時')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'パートナーエンジニア'
        verbose_name_plural = 'パートナーエンジニア一覧'
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.name}（{self.partner_company}）"


# ===============================
# 月次プロジェクトレポート
# ===============================

class MonthlyProjectReport(models.Model):
    """月次プロジェクト稼働記録（案件回収管理 > 月次レポートタブ）"""

    # 対象年月 "YYYY-MM" 形式で格納
    year_month  = models.CharField(max_length=7, unique=True, verbose_name='対象年月')

    # 件数
    idr_count   = models.IntegerField(default=0, verbose_name='IDR稼働件数')
    bp_count    = models.IntegerField(default=0, verbose_name='BP稼働件数')
    total_count = models.IntegerField(default=0, verbose_name='総数')

    # メタ
    note        = models.TextField(blank=True, default='', verbose_name='メモ')
    is_auto     = models.BooleanField(default=True, verbose_name='自動算出フラグ')
    locked      = models.BooleanField(default=False, verbose_name='確定フラグ')

    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = '月次プロジェクトレポート'
        verbose_name_plural = '月次プロジェクトレポート'
        ordering = ['-year_month']

    def save(self, *args, **kwargs):
        self.total_count = self.idr_count + self.bp_count
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.year_month} IDR:{self.idr_count} BP:{self.bp_count}"


class PPInterview(models.Model):
    """PP営業進捗管理（面談カンバン）"""
    engineer_name = models.CharField(max_length=100, verbose_name='エンジニア名')
    company_name = models.CharField(max_length=200, blank=True, default='', verbose_name='企業名')
    interview_date = models.CharField(max_length=20, blank=True, default='', verbose_name='面談日')
    interview_time = models.CharField(max_length=20, blank=True, default='', verbose_name='面談時刻')
    sales_person = models.CharField(max_length=100, default='', verbose_name='営業担当')
    status = models.CharField(max_length=50, default='日程調整中', verbose_name='ステータス')
    start_month = models.CharField(max_length=20, blank=True, default='', verbose_name='開始月')
    response_deadline = models.CharField(max_length=20, blank=True, default='', verbose_name='回答期限')
    unit_price = models.CharField(max_length=50, blank=True, default='', verbose_name='単価')
    notes = models.TextField(blank=True, default='', verbose_name='備考')
    history = models.JSONField(default=list, blank=True, verbose_name='変更履歴')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'PP営業面談'
        verbose_name_plural = 'PP営業面談'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.engineer_name} - {self.company_name} ({self.status})"


class BPProspect(models.Model):
    """BP進捗管理（面談カンバン）"""
    company_name = models.CharField(max_length=200, verbose_name='企業名')
    engineer_name = models.CharField(max_length=100, blank=True, default='', verbose_name='エンジニア名')
    supplier_name = models.CharField(max_length=200, blank=True, default='', verbose_name='仕入れ先名')
    interview_date = models.CharField(max_length=20, blank=True, default='', verbose_name='面談日')
    interview_time = models.CharField(max_length=20, blank=True, default='', verbose_name='面談時刻')
    decision_date = models.CharField(max_length=20, blank=True, default='', verbose_name='回答期限')
    start_month = models.CharField(max_length=20, blank=True, default='', verbose_name='開始月')
    sales_price = models.CharField(max_length=50, blank=True, default='', verbose_name='販売単価')
    purchase_price = models.CharField(max_length=50, blank=True, default='', verbose_name='仕入れ単価')
    main_planner = models.CharField(max_length=100, default='', verbose_name='メインプランナー')
    support_planners = models.JSONField(default=list, blank=True, verbose_name='サポートプランナー')
    priority = models.CharField(max_length=10, default='中', verbose_name='優先度')
    status = models.CharField(max_length=50, default='日程調整中', verbose_name='ステータス')
    notes = models.TextField(blank=True, default='', verbose_name='備考')
    interview_count = models.JSONField(default=dict, blank=True, verbose_name='面談件数')
    history = models.JSONField(default=list, blank=True, verbose_name='変更履歴')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'BP見込み'
        verbose_name_plural = 'BP見込み'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.company_name} - {self.engineer_name} ({self.status})"

