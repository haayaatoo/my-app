
from django.contrib import admin, messages
from django.urls import path
from django.shortcuts import render, redirect
from .models import Engineer, SkillSheet, SalesMemo, MemoAttachment
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


@admin.register(SkillSheet)
class SkillSheetAdmin(admin.ModelAdmin):
    list_display = ('engineer_name', 'file', 'uploader', 'status', 'is_approved', 'uploaded_at')
    list_filter = ('status', 'is_approved', 'uploaded_at')
    search_fields = ('engineer_name', 'uploader', 'file')
    readonly_fields = ('uploaded_at',)
    actions = ['approve_skillsheets', 'reject_skillsheets']

    def approve_skillsheets(self, request, queryset):
        queryset.update(status='approved', is_approved=True)
        self.message_user(request, f"{queryset.count()}件のスキルシートを承認しました。")
    approve_skillsheets.short_description = "選択されたスキルシートを承認する"

    def reject_skillsheets(self, request, queryset):
        queryset.update(status='rejected', is_approved=False)
        self.message_user(request, f"{queryset.count()}件のスキルシートを却下しました。")
    reject_skillsheets.short_description = "選択されたスキルシートを却下する"


class MemoAttachmentInline(admin.TabularInline):
    model = MemoAttachment
    extra = 0
    readonly_fields = ('uploaded_at',)


@admin.register(SalesMemo)
class SalesMemoAdmin(admin.ModelAdmin):
    list_display = ('title', 'memo_type', 'engineer_name', 'author', 'priority', 'is_completed', 'due_date', 'created_at')
    list_filter = ('memo_type', 'priority', 'is_completed', 'is_shared', 'created_at')
    search_fields = ('title', 'content', 'engineer_name', 'author')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [MemoAttachmentInline]
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('基本情報', {
            'fields': ('memo_type', 'title', 'content')
        }),
        ('関連付け', {
            'fields': ('engineer_name', 'skillsheet')
        }),
        ('営業情報', {
            'fields': ('author', 'priority', 'tags', 'is_shared')
        }),
        ('進捗管理', {
            'fields': ('is_completed', 'due_date')
        }),
        ('システム情報', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    actions = ['mark_completed', 'mark_incomplete', 'mark_shared']

    def mark_completed(self, request, queryset):
        queryset.update(is_completed=True)
        self.message_user(request, f"{queryset.count()}件のメモを完了としてマークしました。")
    mark_completed.short_description = "選択されたメモを完了にする"

    def mark_incomplete(self, request, queryset):
        queryset.update(is_completed=False)
        self.message_user(request, f"{queryset.count()}件のメモを未完了としてマークしました。")
    mark_incomplete.short_description = "選択されたメモを未完了にする"

    def mark_shared(self, request, queryset):
        queryset.update(is_shared=True)
        self.message_user(request, f"{queryset.count()}件のメモをチーム共有にしました。")
    mark_shared.short_description = "選択されたメモをチーム共有にする"


@admin.register(MemoAttachment)
class MemoAttachmentAdmin(admin.ModelAdmin):
    list_display = ('memo', 'file_name', 'uploaded_at')
    list_filter = ('uploaded_at',)
    search_fields = ('memo__title', 'file_name')
    readonly_fields = ('uploaded_at',)
