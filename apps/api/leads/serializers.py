from rest_framework import serializers
from .models import Lead


class ConsultationLeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = ("id", "name", "email", "company", "message", "created_at")
        read_only_fields = ("id", "created_at")
