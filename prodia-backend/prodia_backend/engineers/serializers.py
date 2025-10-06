from rest_framework import serializers
from .models import Engineer, SkillSheet, SalesMemo, MemoAttachment

# SkillSheet用シリアライザ
class SkillSheetSerializer(serializers.ModelSerializer):
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
