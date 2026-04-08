from rest_framework import serializers
from .models import Engineer, SkillSheet, SalesMemo, MemoAttachment, Interview, RecruitmentChannel, SocialMediaPost, Company, CompanyAppointment, Deal, DealActivity, Project, ProjectAssignment, PartnerEngineer, TeleapoRecord

# SkillSheet用シリアライザ
class SkillSheetSerializer(serializers.ModelSerializer):
    file_name = serializers.ReadOnlyField()
    file_url = serializers.ReadOnlyField()
    
    class Meta:
        model = SkillSheet
        fields = '__all__'

class EngineerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Engineer
        fields = '__all__'

# 営業メモシリアライザ
class SalesMemoSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesMemo
        fields = '__all__'
        
    def create(self, validated_data):
        # タグが文字列で送られてきた場合の処理
        tags = validated_data.get('tags', [])
        if isinstance(tags, str):
            # カンマ区切りの文字列をリストに変換
            validated_data['tags'] = [tag.strip() for tag in tags.split(',') if tag.strip()]
        return super().create(validated_data)

class MemoAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = MemoAttachment
        fields = '__all__'

# 面談履歴シリアライザ
class InterviewSerializer(serializers.ModelSerializer):
    engineer_name = serializers.ReadOnlyField(source='engineer.name')
    created_by_name = serializers.ReadOnlyField(source='created_by.name')
    interview_type_display = serializers.ReadOnlyField(source='get_interview_type_display')
    result_display = serializers.ReadOnlyField(source='get_result_display')
    
    class Meta:
        model = Interview
        fields = '__all__'

# エンジニア詳細用（メモ込み）
class EngineerDetailSerializer(serializers.ModelSerializer):
    memos = serializers.SerializerMethodField()
    
    class Meta:
        model = Engineer
        fields = '__all__'
    
    def get_memos(self, obj):
        # エンジニアに関連するメモを取得
        memos = SalesMemo.objects.filter(engineer_name=obj.name)
        return SalesMemoSerializer(memos, many=True).data


# 採用経路管理シリアライザ
class RecruitmentChannelSerializer(serializers.ModelSerializer):
    channel_display = serializers.ReadOnlyField(source='get_channel_display')
    status_display = serializers.ReadOnlyField(source='get_status_display')
    
    class Meta:
        model = RecruitmentChannel
        fields = '__all__'


# SNS投稿管理シリアライザ
class SocialMediaPostSerializer(serializers.ModelSerializer):
    platform_display = serializers.ReadOnlyField(source='get_platform_display')
    
    class Meta:
        model = SocialMediaPost
        fields = '__all__'


# 企業マスターシリアライザ
class CompanySerializer(serializers.ModelSerializer):
    active_appointment = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = '__all__'

    def get_active_appointment(self, obj):
        apt = obj.appointments.filter(status='scheduled').first()
        if apt:
            return {
                'id': apt.id,
                'planner': apt.planner,
                'date': str(apt.appointment_date),
                'time': str(apt.appointment_time) if apt.appointment_time else None,
            }
        return None


# アポイントシリアライザ
class CompanyAppointmentSerializer(serializers.ModelSerializer):
    company_name = serializers.ReadOnlyField(source='company.name')
    status_display = serializers.ReadOnlyField(source='get_status_display')

    class Meta:
        model = CompanyAppointment
        fields = '__all__'


# ===============================
# 案件パイプライン（かんばんボード）
# ===============================

class DealActivitySerializer(serializers.ModelSerializer):
    activity_type_display = serializers.ReadOnlyField(source='get_activity_type_display')

    class Meta:
        model = DealActivity
        fields = '__all__'


class DealSerializer(serializers.ModelSerializer):
    stage_display = serializers.ReadOnlyField(source='get_stage_display')
    priority_display = serializers.ReadOnlyField(source='get_priority_display')
    proposed_engineer_names = serializers.SerializerMethodField()
    activities = DealActivitySerializer(many=True, read_only=True)

    class Meta:
        model = Deal
        fields = '__all__'

    def get_proposed_engineer_names(self, obj):
        return [{'id': e.id, 'name': e.name} for e in obj.proposed_engineers.all()]


# ===============================
# 元請案件管理（参画中プロジェクト）
# ===============================

class ProjectAssignmentSerializer(serializers.ModelSerializer):
    engineer_name = serializers.ReadOnlyField(source='engineer.name')
    engineer_skills = serializers.ReadOnlyField(source='engineer.skills')
    engineer_status = serializers.ReadOnlyField(source='engineer.engineer_status')

    class Meta:
        model = ProjectAssignment
        fields = '__all__'


class ProjectSerializer(serializers.ModelSerializer):
    status_display = serializers.ReadOnlyField(source='get_status_display')
    work_style_display = serializers.ReadOnlyField(source='get_work_style_display')
    assignments = ProjectAssignmentSerializer(many=True, read_only=True)
    engineer_count = serializers.SerializerMethodField()
    active_engineer_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = '__all__'

    def get_engineer_count(self, obj):
        return obj.assignments.count()

    def get_active_engineer_count(self, obj):
        return obj.assignments.filter(is_active=True).count()


# ===============================
# パートナーエンジニア管理
# ===============================

class PartnerEngineerSerializer(serializers.ModelSerializer):
    status_display = serializers.ReadOnlyField(source='get_status_display')
    remote_display = serializers.ReadOnlyField(source='get_remote_display')
    extension_display = serializers.ReadOnlyField(source='get_extension_possibility_display')

    class Meta:
        model = PartnerEngineer
        fields = '__all__'


# テレアポ記録シリアライザ
class TeleapoRecordSerializer(serializers.ModelSerializer):
    result_display = serializers.ReadOnlyField(source='get_result_display')

    class Meta:
        model = TeleapoRecord
        fields = '__all__'
