# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('engineers', '0028_add_settlement_range_to_engineer'),
    ]

    operations = [
        migrations.AddField(
            model_name='engineer',
            name='waiting_since',
            field=models.DateField(blank=True, null=True, verbose_name='待機開始日'),
        ),
    ]
