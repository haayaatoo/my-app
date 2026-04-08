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

# パスワードは環境変数から取得（例: export PRODIA_DEFAULT_PASSWORD=yourpassword）
DEFAULT_PASSWORD = os.environ.get('PRODIA_DEFAULT_PASSWORD', '')
if not DEFAULT_PASSWORD:
    raise ValueError("環境変数 PRODIA_DEFAULT_PASSWORD を設定してください")

# ユーザーデータ
users_data = [
    {
        'name': '上谷 昌嗣',
        'email': 'kamiya@1dr.co.jp',
        'password': DEFAULT_PASSWORD
    },
    {
        'name': '浅井 英昭',
        'email': 'asai@1dr.co.jp',
        'password': DEFAULT_PASSWORD
    },
    {
        'name': '温水 飛和',
        'email': 't-nukumizu@1dr.co.jp',
        'password': DEFAULT_PASSWORD
    },
    {
        'name': '瀬戸山 ひなた',
        'email': 'h-setoyama@1dr.co.jp',
        'password': DEFAULT_PASSWORD
    },
    {
        'name': '上前 一華',
        'email': 'i-uemae@1dr.co.jp',
        'password': DEFAULT_PASSWORD
    },
    {
        'name': '稲垣 綾華',
        'email': 'a-inagaki@1dr.co.jp',
        'password': DEFAULT_PASSWORD
    },
    {
        'name': '岡田 有莉',
        'email': 'y-okada@1dr.co.jp',
        'password': DEFAULT_PASSWORD
    },
    {
        'name': '今村 颯斗',
        'email': 'h-imamura@1dr.co.jp',
        'password': DEFAULT_PASSWORD
    },
    {
        'name': '野田 理沙子',
        'email': 'r-noda@1dr.co.jp',
        'password': DEFAULT_PASSWORD
    },
    {
        'name': '服部 宇宙',
        'email': 's-hattori@1dr.co.jp',
        'password': DEFAULT_PASSWORD
    },
    {
        'name': '山口 のどか',
        'email': 'n-yamaguchi@1dr.co.jp',
        'password': DEFAULT_PASSWORD
    }
]

def create_users():
    """ユーザーを作成・更新"""
    print("🚀 Prodiaユーザーを作成・更新中...")

    # 削除対象ユーザー
    delete_emails = ['y-nishida@1dr.co.jp', 'k-kumagai@1dr.co.jp']
    for email in delete_emails:
        deleted, _ = ProdiaUser.objects.filter(email=email).delete()
        if deleted:
            print(f"🗑️  {email} を削除しました。")
    
    for user_data in users_data:
        user, created = ProdiaUser.objects.get_or_create(
            email=user_data['email'],
            defaults={'name': user_data['name']}
        )
        if not created:
            user.name = user_data['name']
        user.set_password(user_data['password'])
        user.save()
        status = "✅ 作成" if created else "🔄 更新"
        print(f"{status}: {user_data['name']} ({user_data['email']})")
    
    print(f"\n🎉 完了！合計 {ProdiaUser.objects.count()} ユーザーが登録されています。")

if __name__ == '__main__':
    create_users()