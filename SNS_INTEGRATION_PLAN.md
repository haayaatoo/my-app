# SNS投稿機能の実装計画

## 1. ファイルアップロード機能

### フロントエンド
```jsx
// ファイルアップロード処理
const handleFileUpload = async (file) => {
  const formData = new FormData();
  formData.append('media', file);
  
  try {
    const response = await fetch('/api/upload-media', {
      method: 'POST',
      body: formData
    });
    const result = await response.json();
    setNewPost({...newPost, media_url: result.url});
  } catch (error) {
    console.error('アップロード失敗:', error);
  }
};
```

### バックエンド（Django）
```python
# views.py
from django.core.files.storage import default_storage
from django.http import JsonResponse

def upload_media(request):
    if request.method == 'POST':
        media_file = request.FILES['media']
        
        # ファイル保存
        file_path = default_storage.save(f'media/{media_file.name}', media_file)
        file_url = default_storage.url(file_path)
        
        return JsonResponse({'url': file_url})
```

## 2. SNS API連携

### Instagram API
```python
import requests

class InstagramAPI:
    def __init__(self, access_token):
        self.access_token = access_token
        self.base_url = "https://graph.instagram.com"
    
    def create_media(self, image_url, caption):
        url = f"{self.base_url}/me/media"
        params = {
            'image_url': image_url,
            'caption': caption,
            'access_token': self.access_token
        }
        response = requests.post(url, params=params)
        return response.json()
    
    def publish_media(self, creation_id):
        url = f"{self.base_url}/me/media_publish"
        params = {
            'creation_id': creation_id,
            'access_token': self.access_token
        }
        response = requests.post(url, params=params)
        return response.json()
```

### TikTok API
```python
class TikTokAPI:
    def __init__(self, access_token):
        self.access_token = access_token
        self.base_url = "https://open-api.tiktok.com"
    
    def upload_video(self, video_file, title, description):
        # TikTok API v2の実装
        # 注意: 企業アカウントが必要
        pass
```

### X (Twitter) API
```python
import tweepy

class TwitterAPI:
    def __init__(self, api_key, api_secret, access_token, access_token_secret):
        auth = tweepy.OAuthHandler(api_key, api_secret)
        auth.set_access_token(access_token, access_token_secret)
        self.api = tweepy.API(auth)
    
    def post_tweet(self, text, media_path=None):
        if media_path:
            media = self.api.media_upload(media_path)
            tweet = self.api.update_status(status=text, media_ids=[media.media_id])
        else:
            tweet = self.api.update_status(status=text)
        return tweet
```

## 3. 投稿管理システム

### Django Models
```python
# models.py
class SocialMediaPost(models.Model):
    PLATFORM_CHOICES = [
        ('instagram', 'Instagram'),
        ('tiktok', 'TikTok'),
        ('twitter', 'X (Twitter)'),
    ]
    
    STATUS_CHOICES = [
        ('draft', '下書き'),
        ('scheduled', 'スケジュール済み'),
        ('published', '投稿済み'),
        ('failed', '投稿失敗'),
    ]
    
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    title = models.CharField(max_length=200)
    content = models.TextField()
    media_file = models.FileField(upload_to='social_media/')
    scheduled_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    external_post_id = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    published_at = models.DateTimeField(null=True, blank=True)
```

### 投稿処理
```python
# tasks.py (Celery使用)
from celery import shared_task
from .models import SocialMediaPost
from .api_clients import InstagramAPI, TwitterAPI, TikTokAPI

@shared_task
def publish_social_media_post(post_id):
    post = SocialMediaPost.objects.get(id=post_id)
    
    try:
        if post.platform == 'instagram':
            api = InstagramAPI(settings.INSTAGRAM_ACCESS_TOKEN)
            result = api.create_and_publish_media(
                post.media_file.url, 
                post.content
            )
            
        elif post.platform == 'twitter':
            api = TwitterAPI(
                settings.TWITTER_API_KEY,
                settings.TWITTER_API_SECRET,
                settings.TWITTER_ACCESS_TOKEN,
                settings.TWITTER_ACCESS_TOKEN_SECRET
            )
            result = api.post_tweet(post.content, post.media_file.path)
            
        elif post.platform == 'tiktok':
            api = TikTokAPI(settings.TIKTOK_ACCESS_TOKEN)
            result = api.upload_video(
                post.media_file.path,
                post.title,
                post.content
            )
        
        post.status = 'published'
        post.external_post_id = result.get('id')
        post.published_at = timezone.now()
        post.save()
        
    except Exception as e:
        post.status = 'failed'
        post.save()
        raise e
```

## 4. 必要な設定・認証

### API キー・トークン
```python
# settings.py
# Instagram
INSTAGRAM_APP_ID = 'your_app_id'
INSTAGRAM_APP_SECRET = 'your_app_secret'
INSTAGRAM_ACCESS_TOKEN = 'your_access_token'

# Twitter
TWITTER_API_KEY = 'your_api_key'
TWITTER_API_SECRET = 'your_api_secret'
TWITTER_ACCESS_TOKEN = 'your_access_token'
TWITTER_ACCESS_TOKEN_SECRET = 'your_access_token_secret'

# TikTok
TIKTOK_CLIENT_KEY = 'your_client_key'
TIKTOK_CLIENT_SECRET = 'your_client_secret'
TIKTOK_ACCESS_TOKEN = 'your_access_token'
```

### 必要な申請・認証
1. **Instagram Business API**: Meta for Developers
2. **TikTok for Business API**: TikTok for Business
3. **X API v2**: Twitter Developer Platform

## 5. セキュリティ・制限事項

### セキュリティ対策
- API キーの安全な保管（環境変数）
- ファイルアップロード制限（サイズ・形式）
- レート制限の実装
- ユーザー権限管理

### プラットフォーム制限
- **Instagram**: 企業アカウントのみ、コンテンツポリシー
- **TikTok**: 企業パートナーシップが必要
- **X**: 月間投稿制限、API料金

## 6. 開発スケジュール

### Phase 1: 基盤構築（2週間）
- ファイルアップロード機能
- データベース設計・実装
- 基本API構造

### Phase 2: SNS API連携（3週間）
- Instagram API統合
- Twitter API統合
- エラーハンドリング

### Phase 3: 高度機能（2週間）
- スケジュール投稿
- 投稿分析・統計
- TikTok API統合（オプション）

### Phase 4: テスト・リファイン（1週間）
- 統合テスト
- セキュリティ監査
- パフォーマンス最適化

## 7. 費用概算

### API利用料
- **Instagram**: 無料（制限あり）
- **X API**: 月額$100〜（Basic Plan）
- **TikTok**: 要相談（企業向け）

### インフラ
- ファイルストレージ: AWS S3等
- バックグラウンド処理: Redis + Celery
- 監視・ログ: CloudWatch等

## 総開発時間: 約8週間
## 推定コスト: ¥500,000 - ¥800,000（外注の場合）