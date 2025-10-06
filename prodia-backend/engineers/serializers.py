from rest_framework import serializers
from .models import Engineer

class EngineerSerializer(serializers.ModelSerializer):
    phase = serializers.ListField(child=serializers.CharField(), allow_empty=True)

    class Meta:
        model = Engineer
        fields = '__all__'