from django.db import models


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
