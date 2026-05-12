from django.db import migrations


class Migration(migrations.Migration):
    """
    engineers_nakamapuser テーブルはモデルが存在しない孤立テーブルです。
    このテーブルの engineer_id 外部キー制約がエンジニア削除を阻害していたため削除します。
    """

    dependencies = [
        ('engineers', '0025_add_rate_type_to_engineer'),
    ]

    operations = [
        migrations.RunSQL(
            sql="DROP TABLE IF EXISTS engineers_nakamapuser CASCADE;",
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
