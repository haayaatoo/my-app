import csv
from io import TextIOWrapper
from django import forms
from .models import Engineer

class EngineerUploadForm(forms.Form):
    file = forms.FileField(label='CSVファイルを選択')

    def save(self):
        file = self.cleaned_data['file']
        decoded_file = TextIOWrapper(file, encoding='utf-8')
        reader = csv.DictReader(decoded_file)
        created, updated = 0, 0
        for row in reader:
            obj, is_created = Engineer.objects.update_or_create(
                name=row.get('name'),
                defaults={
                    'position': row.get('position'),
                    'project_name': row.get('project_name'),
                    'planner': row.get('planner'),
                    'skills': row.get('skills'),
                    'engineer_status': row.get('engineer_status'),
                    'phase': row.get('phase'),
                }
            )
            if is_created:
                created += 1
            else:
                updated += 1
        return created, updated
