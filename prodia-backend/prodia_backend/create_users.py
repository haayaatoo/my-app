#!/usr/bin/env python
"""
Prodiaユーザーを作成するスクリプト
"""
import os
import django

# Django設定
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prodia_backend.settings')
django.setup()

from engineers.models import ProdiaUser

# ユーザーデータ
users_data = [
    {
        'name': '上谷 昌嗣',
        'email': 'kamiya@1dr.co.jp',
        'password': 'password'
    },
    {
        'name': '浅井 英昭',
        'email': 'asai@1dr.co.jp',
        'password': 'password'
    },
    {
        'name': '温水 飛和',
        'email': 't-nukumizu@1dr.co.jp',
        'password': 'password'
    },
    {
        'name': '西田 有志',
        'email': 'y-nishida@1dr.co.jp',
        'password': 'password'
    },
    {
        'name': '稲垣 綾華',
        'email': 'a-inagaki@1dr.co.jp',
        'password': 'password'
    },
    {
        'name': '岡田 有莉',
        'email': 'y-okada@1dr.co.jp',
        'password': 'password'
    },
    {
        'name': '熊谷 一輝',
        'email': 'k-kumagai@1dr.co.jp',
        'password': 'password'
    },
    {
        'name': '瀬戸山 ひなた',
        'email': 'h-setoyama@1dr.co.jp',
        'password': 'password'
    },
    {
        'name': '上前 一華',
        'email': 'i-uemae@1dr.co.jp',
        'password': 'password'
    },
    {
        'name': '今村 颯斗',
        'email': 'h-imamura@1dr.co.jp',
        'password': 'password'
    }
]

def create_users():
    """ユーザーを作成"""
    print("🚀 Prodiaユーザーを作成中...")
    
    for user_data in users_data:
        # 既存ユーザーをチェック
        if ProdiaUser.objects.filter(email=user_data['email']).exists():
            print(f"⚠️  {user_data['name']} ({user_data['email']}) は既に存在します。スキップします。")
            continue
        
        # ユーザー作成
        user = ProdiaUser(
            name=user_data['name'],
            email=user_data['email']
        )
        user.set_password(user_data['password'])  # パスワードをハッシュ化
        user.save()
        
        print(f"✅ {user_data['name']} ({user_data['email']}) を作成しました。")
    
    print(f"\n🎉 作成完了！合計 {ProdiaUser.objects.count()} ユーザーが登録されています。")

if __name__ == '__main__':
    create_users()