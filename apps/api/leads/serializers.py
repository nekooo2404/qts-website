from rest_framework import serializers

from .models import Lead


class ConsultationLeadSerializer(serializers.ModelSerializer):
    website = serializers.CharField(required=False, allow_blank=True, max_length=200, write_only=True)

    class Meta:
        model = Lead
        fields = (
            "id",
            "name",
            "email",
            "company",
            "phone",
            "message",
            "locale",
            "consent",
            "source_url",
            "utm_source",
            "utm_medium",
            "utm_campaign",
            "idempotency_key",
            "website",
            "status",
            "created_at",
        )
        read_only_fields = ("id", "status", "created_at")
        extra_kwargs = {
            "message": {"min_length": 10, "max_length": 2000},
            "idempotency_key": {"max_length": 64},
        }

    def validate_website(self, value: str) -> str:
        # honeypot: a human never sees this field, so anything in it is a bot
        if value.strip():
            raise serializers.ValidationError("This field must be empty.")
        return value

    def validate_consent(self, value: bool) -> bool:
        if not value:
            raise serializers.ValidationError("Consent is required to submit this request.")
        return value
