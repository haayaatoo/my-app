
from django.contrib import admin, messages
from django.urls import path
from django.shortcuts import render, redirect
from .models import Engineer
from .forms import EngineerUploadForm


@admin.register(Engineer)
class EngineerAdmin(admin.ModelAdmin):
    list_display = ('name', 'position', 'project_name', 'planner', 'engineer_status', 'phase')
    search_fields = ('name', 'project_name', 'planner', 'skills')
    list_filter = ('engineer_status', 'position', 'phase')

    change_list_template = "admin/engineers/engineer_changelist.html"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('upload/', self.admin_site.admin_view(self.upload_view), name='engineer-upload'),
        ]
        return custom_urls + urls

    def upload_view(self, request):
        if request.method == 'POST':
            form = EngineerUploadForm(request.POST, request.FILES)
            if form.is_valid():
                created, updated = form.save()
                self.message_user(request, f"{created}件新規登録、{updated}件更新しました。", messages.SUCCESS)
                return redirect('..')
        else:
            form = EngineerUploadForm()
        return render(request, 'admin/engineers/upload_form.html', {'form': form})
