#!/usr/bin/env python
"""
売上予測機能用のサンプルデータを追加するスクリプト
"""
import os
import django
from datetime import date, datetime
from decimal import Decimal

# Django設定
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prodia_backend.settings')
django.setup()

from engineers.models import Engineer, RevenueForecast, MonthlyRevenueSummary, ProdiaUser

def add_sample_revenue_data():
    """サンプル売上データを追加"""
    print("🚀 売上予測機能用のサンプルデータを追加中...")
    
    # 既存エンジニアに売上情報を追加
    engineers = Engineer.objects.all()[:10]  # 最初の10人のエンジニアに設定
    
    sample_projects = [
        {"company": "株式会社テックソリューション", "rate": 650000, "working_rate": 0.95},
        {"company": "デジタルイノベーション株式会社", "rate": 720000, "working_rate": 1.0},
        {"company": "クラウドシステムズ株式会社", "rate": 580000, "working_rate": 0.90},
        {"company": "AIテクノロジー株式会社", "rate": 800000, "working_rate": 1.0},
        {"company": "フィンテック開発株式会社", "rate": 750000, "working_rate": 0.95},
        {"company": "株式会社ウェブデザイン", "rate": 520000, "working_rate": 0.85},
        {"company": "モバイルアプリ株式会社", "rate": 680000, "working_rate": 0.90},
        {"company": "データアナリティクス株式会社", "rate": 770000, "working_rate": 1.0},
        {"company": "セキュリティソフト株式会社", "rate": 690000, "working_rate": 0.95},
        {"company": "エンタープライズ株式会社", "rate": 850000, "working_rate": 1.0},
    ]
    
    for i, engineer in enumerate(engineers):
        if i < len(sample_projects):
            project = sample_projects[i]
            
            engineer.client_company = project["company"]
            engineer.monthly_rate = project["rate"]
            engineer.working_rate = project["working_rate"]
            engineer.project_start_date = date(2024, 1, 1)
            engineer.project_end_date = date(2024, 12, 31)
            engineer.project_status = 'active'
            engineer.contract_type = 'ses'
            engineer.working_days_per_month = 20
            
            engineer.save()  # 自動的にmonthly_revenueが計算される
            
            print(f"✅ {engineer.name} - {project['company']} (月単価: {project['rate']:,}円)")
    
    # 作成者ユーザーを取得
    admin_user = ProdiaUser.objects.first()
    if not admin_user:
        print("⚠️ Prodiaユーザーが存在しません。先にcreate_users.pyを実行してください。")
        return
    
    # 月次売上サマリーのサンプルデータ
    print("\n📊 月次売上サマリーを作成中...")
    
    monthly_data = [
        {"month": date(2024, 1, 1), "revenue": 12500000, "engineers": 8},
        {"month": date(2024, 2, 1), "revenue": 13200000, "engineers": 8},
        {"month": date(2024, 3, 1), "revenue": 13800000, "engineers": 9},
        {"month": date(2024, 4, 1), "revenue": 14100000, "engineers": 9},
        {"month": date(2024, 5, 1), "revenue": 14500000, "engineers": 10},
        {"month": date(2024, 6, 1), "revenue": 14800000, "engineers": 10},
    ]
    
    for data in monthly_data:
        summary, created = MonthlyRevenueSummary.objects.get_or_create(
            year_month=data["month"],
            defaults={
                'actual_revenue': data["revenue"],
                'active_engineers': data["engineers"],
                'total_working_days': data["engineers"] * 20,  # 20稼働日/月
            }
        )
        if created:
            print(f"✅ {data['month'].strftime('%Y年%m月')}: {data['revenue']:,}円")
    
    # 売上予測のサンプルデータ
    print("\n🔮 売上予測データを作成中...")
    
    forecast_data = [
        {
            "date": date(2024, 7, 1),
            "scenario": "realistic",
            "revenue": 15200000,
            "engineers": 10,
            "avg_rate": 680000,
            "new_hires": 0,
            "rate_increase": 0.00
        },
        {
            "date": date(2024, 7, 1),
            "scenario": "optimistic",
            "revenue": 16800000,
            "engineers": 12,
            "avg_rate": 700000,
            "new_hires": 2,
            "rate_increase": 0.05
        },
        {
            "date": date(2024, 7, 1),
            "scenario": "pessimistic",
            "revenue": 13500000,
            "engineers": 9,
            "avg_rate": 650000,
            "new_hires": -1,
            "rate_increase": -0.02
        },
    ]
    
    for data in forecast_data:
        forecast, created = RevenueForecast.objects.get_or_create(
            forecast_date=data["date"],
            forecast_type='monthly',
            scenario=data["scenario"],
            defaults={
                'total_revenue': data["revenue"],
                'active_engineers_count': data["engineers"],
                'average_monthly_rate': data["avg_rate"],
                'average_working_rate': Decimal('0.93'),
                'new_hires_assumption': data["new_hires"],
                'rate_increase_assumption': data["rate_increase"],
                'project_continuation_rate': Decimal('0.85'),
                'created_by': admin_user
            }
        )
        if created:
            scenario_name = dict(RevenueForecast.SCENARIO_CHOICES)[data["scenario"]]
            print(f"✅ 2024年7月 {scenario_name}: {data['revenue']:,}円")
    
    # 売上サマリー表示
    print("\n📈 現在の売上状況:")
    total_monthly = sum(eng.monthly_revenue or 0 for eng in Engineer.objects.filter(project_status='active'))
    active_count = Engineer.objects.filter(project_status='active').count()
    
    print(f"   稼働中エンジニア: {active_count}名")
    print(f"   月間売上合計: {total_monthly:,.0f}円")
    print(f"   年間売上予測: {total_monthly * 12:,.0f}円")
    
    if active_count > 0:
        avg_revenue = total_monthly / active_count
        print(f"   エンジニア当たり平均売上: {avg_revenue:,.0f}円/月")
    
    print(f"\n🎉 売上予測機能用データの追加完了！")

if __name__ == '__main__':
    add_sample_revenue_data()