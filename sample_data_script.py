from engineers.models import RecruitmentChannel, SocialMediaPost
from django.utils import timezone
from datetime import timedelta

# 既存データをクリア
RecruitmentChannel.objects.all().delete()
SocialMediaPost.objects.all().delete()

# 採用経路サンプルデータ
applications = [
    {
        'applicant_name': '田中太郎',
        'email': 'tanaka@example.com',
        'phone': '090-1234-5678',
        'channel': 'sns_instagram',
        'channel_detail': 'Instagram投稿からの応募',
        'status': 'hired',
        'applied_at': timezone.now() - timedelta(days=10),
        'hired_at': timezone.now() - timedelta(days=2),
        'sns_post_url': 'https://instagram.com/p/sample1',
        'cost_per_acquisition': 50000,
        'notes': 'Instagram広告経由で応募、技術力高い'
    },
    {
        'applicant_name': '佐藤花子',
        'email': 'sato@example.com',
        'phone': '090-2345-6789',
        'channel': 'sns_tiktok',
        'channel_detail': 'TikTok動画を見て応募',
        'status': 'interview',
        'applied_at': timezone.now() - timedelta(days=5),
        'sns_post_url': 'https://tiktok.com/@prodia/video/1',
        'notes': 'TikTokで会社の雰囲気を知って応募'
    },
    {
        'applicant_name': '鈴木一郎',
        'email': 'suzuki@example.com',
        'phone': '090-3456-7890',
        'channel': 'sns_x',
        'channel_detail': 'Xでの投稿を見て応募',
        'status': 'screening',
        'applied_at': timezone.now() - timedelta(days=3),
        'sns_post_url': 'https://x.com/prodia/status/1',
        'notes': 'X（Twitter）での求人投稿を見て応募'
    },
    {
        'applicant_name': '高橋次郎',
        'email': 'takahashi@example.com',
        'phone': '090-4567-8901',
        'channel': 'website',
        'channel_detail': '公式HPの採用ページから応募',
        'status': 'hired',
        'applied_at': timezone.now() - timedelta(days=15),
        'hired_at': timezone.now() - timedelta(days=5),
        'cost_per_acquisition': 30000,
        'notes': 'HP経由、経験豊富なエンジニア'
    },
    {
        'applicant_name': '山田三郎',
        'email': 'yamada@example.com',
        'phone': '090-5678-9012',
        'channel': 'card_interview',
        'channel_detail': 'カード面談イベントで直接面談',
        'status': 'rejected',
        'applied_at': timezone.now() - timedelta(days=8),
        'notes': 'スキルが要求レベルに達していない'
    },
    {
        'applicant_name': '伊藤四郎',
        'email': 'ito@example.com',
        'phone': '090-6789-0123',
        'channel': 'referral',
        'channel_detail': '田中太郎からの紹介',
        'status': 'hired',
        'applied_at': timezone.now() - timedelta(days=12),
        'hired_at': timezone.now() - timedelta(days=1),
        'cost_per_acquisition': 20000,
        'notes': '社員紹介制度利用、優秀な人材'
    },
    {
        'applicant_name': '渡辺五郎',
        'email': 'watanabe@example.com',
        'phone': '090-7890-1234',
        'channel': 'indeed',
        'channel_detail': 'Indeed求人広告から応募',
        'status': 'interview',
        'applied_at': timezone.now() - timedelta(days=6),
        'notes': 'Indeed経由、面接調整中'
    }
]

for data in applications:
    RecruitmentChannel.objects.create(**data)

# SNS投稿サンプルデータ
posts = [
    {
        'platform': 'tiktok',
        'post_id': 'tiktok_001',
        'post_url': 'https://tiktok.com/@prodia/video/001',
        'content': 'エンジニアの1日密着！コーディング風景をお見せします #エンジニア #プログラミング #転職',
        'hashtags': ['エンジニア', 'プログラミング', '転職', 'IT企業'],
        'posted_at': timezone.now() - timedelta(days=5),
        'likes_count': 1250,
        'comments_count': 89,
        'shares_count': 156,
        'views_count': 15600,
        'impressions': 28500,
        'reach': 12400,
        'applications_generated': 3,
        'hires_generated': 1
    },
    {
        'platform': 'tiktok',
        'post_id': 'tiktok_002',
        'post_url': 'https://tiktok.com/@prodia/video/002',
        'content': '未経験からエンジニアになった社員インタビュー #未経験OK #エンジニア転職',
        'hashtags': ['未経験OK', 'エンジニア転職', 'キャリアチェンジ'],
        'posted_at': timezone.now() - timedelta(days=10),
        'likes_count': 890,
        'comments_count': 67,
        'shares_count': 45,
        'views_count': 8900,
        'impressions': 15600,
        'reach': 7800,
        'applications_generated': 2,
        'hires_generated': 0
    },
    {
        'platform': 'instagram',
        'post_id': 'insta_001',
        'post_url': 'https://instagram.com/p/prodia001',
        'content': '新しいプロジェクト始動！技術力を活かして一緒に成長しませんか？',
        'hashtags': ['エンジニア募集', '新プロジェクト', '技術力'],
        'posted_at': timezone.now() - timedelta(days=7),
        'likes_count': 234,
        'comments_count': 18,
        'shares_count': 12,
        'views_count': 3400,
        'impressions': 8900,
        'reach': 3100,
        'applications_generated': 2,
        'hires_generated': 1
    }
]

for data in posts:
    SocialMediaPost.objects.create(**data)

print(f"✅ サンプルデータ作成完了:")
print(f"📊 採用経路データ: {RecruitmentChannel.objects.count()}件")
print(f"📱 SNS投稿データ: {SocialMediaPost.objects.count()}件")