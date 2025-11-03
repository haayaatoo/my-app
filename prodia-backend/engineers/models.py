from django.db import models
from django.utils import timezone


class Engineer(models.Model):
    name = models.CharField(max_length=100)
    position = models.CharField(max_length=50, blank=True, null=True)  # 役職（空欄可）
    project_name = models.CharField(max_length=100)
    planner = models.CharField(max_length=100)
    skills = models.JSONField()  # 複数スキル
    engineer_status = models.CharField(max_length=20)  # active/upcoming/unassigned
    phase = models.JSONField()  # 経験フェーズ（複数選択・配列）

    def __str__(self):
        return self.name


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
    channel_detail = models.CharField(max_length=200, blank=True, null=True, verbose_name='詳細情報')  # SNS投稿URL、リファラル者名など
    
    # 進捗管理
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='applied', verbose_name='ステータス')
    applied_at = models.DateTimeField(default=timezone.now, verbose_name='応募日時')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新日時')
    
    # SNS関連情報（TikTok等の投稿から応募の場合）
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
