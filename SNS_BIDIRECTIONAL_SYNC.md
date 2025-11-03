# SNS双方向連携の詳細仕様

## 1. 管理画面 → SNS投稿

### フロー
```
1. 管理画面で投稿作成・編集
2. 「投稿する」ボタンクリック
3. バックエンドでSNS API呼び出し
4. 各プラットフォームに同時投稿
5. 投稿結果を管理画面に反映
```

### 実装例
```javascript
// フロントエンド
const handleCreatePost = async () => {
  try {
    const response = await fetch('/api/social-posts/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platforms: ['instagram', 'twitter', 'tiktok'], // 複数選択可能
        title: newPost.title,
        content: newPost.content,
        media_file: newPost.media_file,
        scheduled_time: newPost.date
      })
    });

    const result = await response.json();
    
    if (result.success) {
      alert(`✅ 投稿完了！
      Instagram: ${result.instagram?.status || 'スキップ'}
      Twitter: ${result.twitter?.status || 'スキップ'}
      TikTok: ${result.tiktok?.status || 'スキップ'}`);
      
      // 管理画面のデータを更新
      setSocialPosts([result.post, ...socialPosts]);
    }
  } catch (error) {
    alert('❌ 投稿に失敗しました');
  }
};
```

```python
# バックエンド（Django）
class SocialMediaPostView(APIView):
    def post(self, request):
        data = request.data
        results = {}
        
        # 各プラットフォームに投稿
        for platform in data['platforms']:
            try:
                if platform == 'instagram':
                    instagram_api = InstagramAPI()
                    result = instagram_api.create_post(
                        caption=data['content'],
                        media_url=data['media_file']
                    )
                    results['instagram'] = {
                        'status': 'success',
                        'post_id': result['id'],
                        'url': f"https://instagram.com/p/{result['shortcode']}"
                    }
                
                elif platform == 'twitter':
                    twitter_api = TwitterAPI()
                    result = twitter_api.post_tweet(
                        text=data['content'],
                        media=data['media_file']
                    )
                    results['twitter'] = {
                        'status': 'success',
                        'post_id': result.id_str,
                        'url': f"https://twitter.com/user/status/{result.id_str}"
                    }
                    
            except Exception as e:
                results[platform] = {
                    'status': 'failed',
                    'error': str(e)
                }
        
        # データベースに保存
        post = SocialMediaPost.objects.create(
            title=data['title'],
            content=data['content'],
            platforms=data['platforms'],
            external_ids=results,
            status='published'
        )
        
        return Response({
            'success': True,
            'post': PostSerializer(post).data,
            **results
        })
```

## 2. SNS → 管理画面 自動同期

### 方法1: Webhook（リアルタイム）
```python
# webhooks.py - SNSからのリアルタイム通知受信
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
import json

@csrf_exempt
def instagram_webhook(request):
    """Instagramからの投稿通知を受信"""
    if request.method == 'POST':
        data = json.loads(request.body)
        
        for entry in data.get('entry', []):
            for change in entry.get('changes', []):
                if change['field'] == 'media':
                    # 新しい投稿を取得してDBに保存
                    media_id = change['value']['media_id']
                    sync_instagram_post(media_id)
    
    return HttpResponse('OK')

def sync_instagram_post(media_id):
    """Instagram投稿をDBと管理画面に同期"""
    instagram_api = InstagramAPI()
    post_data = instagram_api.get_media(media_id)
    
    # データベースに保存
    SocialMediaPost.objects.update_or_create(
        external_id=media_id,
        platform='instagram',
        defaults={
            'title': post_data.get('caption', '')[:100],
            'content': post_data.get('caption', ''),
            'media_url': post_data.get('media_url'),
            'likes_count': post_data.get('like_count', 0),
            'comments_count': post_data.get('comments_count', 0),
            'published_at': post_data.get('timestamp'),
            'sync_source': 'webhook'
        }
    )
    
    # WebSocket経由で管理画面にリアルタイム通知
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        'social_posts_updates',
        {
            'type': 'post_update',
            'data': post_data
        }
    )
```

### 方法2: 定期同期（バッチ処理）
```python
# tasks.py - 定期的にSNSデータを取得
from celery import shared_task
from datetime import datetime, timedelta

@shared_task
def sync_all_social_posts():
    """全プラットフォームの投稿を同期（5分毎実行）"""
    
    # Instagram投稿を同期
    instagram_api = InstagramAPI()
    recent_posts = instagram_api.get_user_media(limit=50)
    
    for post in recent_posts['data']:
        SocialMediaPost.objects.update_or_create(
            external_id=post['id'],
            platform='instagram',
            defaults={
                'title': post.get('caption', '')[:100],
                'content': post.get('caption', ''),
                'media_url': post.get('media_url'),
                'likes_count': post.get('like_count', 0),
                'comments_count': post.get('comments_count', 0),
                'views_count': post.get('views', 0),
                'published_at': post.get('timestamp'),
                'engagement_rate': calculate_engagement_rate(post),
                'sync_source': 'batch'
            }
        )
    
    # Twitter投稿を同期
    twitter_api = TwitterAPI()
    recent_tweets = twitter_api.get_user_timeline(count=50)
    
    for tweet in recent_tweets:
        SocialMediaPost.objects.update_or_create(
            external_id=tweet.id_str,
            platform='twitter',
            defaults={
                'title': tweet.text[:100],
                'content': tweet.text,
                'likes_count': tweet.favorite_count,
                'shares_count': tweet.retweet_count,
                'published_at': tweet.created_at,
                'sync_source': 'batch'
            }
        )

def calculate_engagement_rate(post):
    """エンゲージメント率を計算"""
    total_engagement = (
        post.get('like_count', 0) + 
        post.get('comments_count', 0) + 
        post.get('shares_count', 0)
    )
    followers = post.get('followers_count', 1)  # ゼロ除算回避
    return (total_engagement / followers) * 100
```

### フロントエンド - リアルタイム更新
```javascript
// WebSocket接続でリアルタイム更新
useEffect(() => {
  const ws = new WebSocket('ws://localhost:8000/ws/social-posts/');
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'post_update') {
      // 新しい投稿をリストに追加
      setSocialPosts(prev => {
        const exists = prev.find(p => p.external_id === data.post.external_id);
        if (exists) {
          // 既存投稿を更新
          return prev.map(p => 
            p.external_id === data.post.external_id ? data.post : p
          );
        } else {
          // 新規投稿を追加
          return [data.post, ...prev];
        }
      });
      
      // 通知表示
      showNotification(
        `📱 新しい${data.post.platform}投稿が同期されました`,
        'success'
      );
    }
  };
  
  return () => ws.close();
}, []);
```

## 3. 管理画面での統合表示

### 投稿元の表示
```javascript
// 投稿カードで投稿元を表示
const getPostSource = (post) => {
  if (post.sync_source === 'manual') {
    return {
      icon: 'fas fa-desktop',
      text: '管理画面から投稿',
      color: 'text-green-600'
    };
  } else if (post.sync_source === 'webhook') {
    return {
      icon: 'fas fa-mobile-alt',
      text: 'アプリから投稿（リアルタイム同期）',
      color: 'text-blue-600'
    };
  } else {
    return {
      icon: 'fas fa-sync-alt',
      text: '自動同期',
      color: 'text-gray-600'
    };
  }
};

// 投稿カード内で表示
<div className="flex items-center gap-2 text-sm">
  <i className={`${getPostSource(post).icon} ${getPostSource(post).color}`}></i>
  <span className={getPostSource(post).color}>
    {getPostSource(post).text}
  </span>
</div>
```

## 4. 高度な機能

### 一括投稿
```javascript
const handleBulkPost = async (selectedPosts) => {
  const results = await Promise.all(
    selectedPosts.map(post => 
      fetch('/api/social-posts/bulk-create', {
        method: 'POST',
        body: JSON.stringify({
          ...post,
          platforms: ['instagram', 'twitter'] // 複数プラットフォーム
        })
      })
    )
  );
  
  alert(`${results.length}件の投稿を処理しました`);
};
```

### 投稿分析
```python
# analytics.py
def get_post_analytics(post_id):
    """投稿のリアルタイム分析データを取得"""
    post = SocialMediaPost.objects.get(id=post_id)
    
    if post.platform == 'instagram':
        api = InstagramAPI()
        insights = api.get_media_insights(post.external_id)
        
        return {
            'reach': insights['reach'],
            'impressions': insights['impressions'],
            'engagement_rate': insights['engagement'] / insights['reach'] * 100,
            'best_time': insights['peak_time'],
            'demographics': insights['audience_demographics']
        }
```

## 5. セキュリティ・制限

### API制限の管理
- **レート制限**: 各SNSの1時間あたりのAPI呼び出し制限
- **権限管理**: 投稿権限のあるユーザーのみ実行可能
- **エラーハンドリング**: API障害時の自動リトライ

### データ整合性
- **重複防止**: 外部IDでの一意性確保
- **同期状態管理**: 最後の同期時間を記録
- **競合解決**: 管理画面とSNSでの同時編集時の処理

## まとめ

✅ **管理画面 → SNS**: リアルタイム投稿
✅ **SNS → 管理画面**: Webhook + 定期同期
✅ **双方向データ整合性**: 完全同期
✅ **リアルタイム更新**: WebSocket通信
✅ **統合分析**: 全プラットフォーム横断集計

この実装により、真の意味での**統合SNS管理プラットフォーム**が完成します！