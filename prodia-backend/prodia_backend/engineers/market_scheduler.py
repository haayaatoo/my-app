#!/usr/bin/env python3
"""
市場データ定期更新・キャッシュシステム
Django管理コマンドとしても使用可能
"""
import os
import django
import json
import time
from datetime import datetime, timedelta
from pathlib import Path

# Django設定
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prodia_backend.settings')
django.setup()

from engineers.market_data import get_latest_market_trends

class MarketDataScheduler:
    """市場データの定期更新・キャッシュ管理"""
    
    def __init__(self):
        self.cache_file = Path(__file__).parent / 'market_data_cache.json'
        self.cache_duration = 3600  # 1時間
        
    def load_cached_data(self):
        """キャッシュされたデータを読み込み"""
        try:
            if self.cache_file.exists():
                with open(self.cache_file, 'r', encoding='utf-8') as f:
                    cache_data = json.load(f)
                
                # キャッシュの有効性チェック
                cache_time = datetime.fromisoformat(cache_data.get('cached_at', ''))
                if datetime.now() - cache_time < timedelta(seconds=self.cache_duration):
                    print(f"✅ キャッシュデータを使用 (作成: {cache_time.strftime('%Y-%m-%d %H:%M:%S')})")
                    return cache_data.get('data', [])
                else:
                    print(f"⏰ キャッシュ期限切れ (作成: {cache_time.strftime('%Y-%m-%d %H:%M:%S')})")
        except Exception as e:
            print(f"⚠️ キャッシュ読み込みエラー: {e}")
        
        return None
    
    def save_to_cache(self, data):
        """データをキャッシュに保存"""
        try:
            cache_data = {
                'data': data,
                'cached_at': datetime.now().isoformat(),
                'cache_duration_seconds': self.cache_duration
            }
            
            with open(self.cache_file, 'w', encoding='utf-8') as f:
                json.dump(cache_data, f, ensure_ascii=False, indent=2)
            
            print(f"💾 データをキャッシュに保存しました ({len(data)}件)")
            
        except Exception as e:
            print(f"❌ キャッシュ保存エラー: {e}")
    
    def update_market_data(self, force_update=False):
        """市場データを更新"""
        print(f"🔄 市場データ更新開始... (強制更新: {force_update})")
        
        # キャッシュ確認（強制更新でない場合）
        if not force_update:
            cached_data = self.load_cached_data()
            if cached_data:
                return cached_data
        
        # 新しいデータを取得
        try:
            print("📡 外部APIからデータを取得中...")
            new_data = get_latest_market_trends(use_real_api=False)  # 現在はモックデータ
            
            # キャッシュに保存
            self.save_to_cache(new_data)
            
            print(f"✅ 市場データ更新完了 ({len(new_data)}件の技術をトラッキング)")
            return new_data
            
        except Exception as e:
            print(f"❌ 市場データ更新エラー: {e}")
            
            # エラー時はキャッシュデータ使用を試行
            cached_data = self.load_cached_data()
            if cached_data:
                print("🔄 エラーのためキャッシュデータを使用します")
                return cached_data
            
            raise e
    
    def run_continuous_update(self, interval_minutes=60):
        """継続的な定期更新"""
        print(f"🚀 市場データ継続更新を開始 (間隔: {interval_minutes}分)")
        
        while True:
            try:
                self.update_market_data()
                print(f"⏳ 次回更新まで {interval_minutes}分待機...")
                time.sleep(interval_minutes * 60)
                
            except KeyboardInterrupt:
                print("\n👋 継続更新を停止しました")
                break
            except Exception as e:
                print(f"❌ 更新中にエラー発生: {e}")
                print("⏳ 5分後に再試行...")
                time.sleep(300)  # 5分待機して再試行

# Django管理コマンドから使用するためのインスタンス
scheduler = MarketDataScheduler()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "update":
            # 一回だけ更新
            scheduler.update_market_data(force_update=True)
            
        elif command == "continuous":
            # 継続的更新
            interval = int(sys.argv[2]) if len(sys.argv) > 2 else 60
            scheduler.run_continuous_update(interval_minutes=interval)
            
        elif command == "cache":
            # キャッシュデータ確認
            cached = scheduler.load_cached_data()
            if cached:
                print(f"📊 キャッシュ状況: {len(cached)}件のデータ")
                for item in cached[:5]:
                    print(f"  - {item['technology']}: {item['change_percentage']:+.1f}%")
            else:
                print("📭 キャッシュデータなし")
                
        else:
            print("使用方法:")
            print("  python market_scheduler.py update      # 一回更新")
            print("  python market_scheduler.py continuous  # 継続更新")
            print("  python market_scheduler.py cache       # キャッシュ確認")
    else:
        # デフォルトは一回更新
        scheduler.update_market_data()