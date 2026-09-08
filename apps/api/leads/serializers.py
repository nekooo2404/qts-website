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
            "message": {
                "min_length": 10,
                "max_length": 2000,
                "error_messages": {
                    "required": "Vui lòng mô tả nhu cầu của bạn.",
                    "blank": "Trường này không được để trống.",
                    "min_length": "Nội dung trao đổi cần dài tối thiểu {min_length} ký tự.",
                    "max_length": "Nội dung trao đổi không được vượt quá {max_length} ký tự.",
                },
            },
            "idempotency_key": {
                "max_length": 64,
                "error_messages": {"required": "Thiếu khóa chống gửi trùng.", "blank": "Thiếu khóa chống gửi trùng."},
            },
            "name": {"error_messages": {"required": "Vui lòng nhập họ và tên.", "blank": "Vui lòng nhập họ và tên."}},
            "company": {"error_messages": {"required": "Vui lòng nhập tên doanh nghiệp.", "blank": "Vui lòng nhập tên doanh nghiệp."}},
            "email": {
                "error_messages": {
                    "required": "Vui lòng nhập email.",
                    "blank": "Vui lòng nhập email.",
                    "invalid": "Địa chỉ email không hợp lệ.",
                }
            },
            "consent": {"error_messages": {"required": "Bạn phải đồng ý trước khi gửi yêu cầu này."}},
        }

    def validate_website(self, value: str) -> str:
        # honeypot: a human never sees this field, so anything in it is a bot
        if value.strip():
            raise serializers.ValidationError("Trường này phải để trống.")
        return value

    def validate_consent(self, value: bool) -> bool:
        if not value:
            raise serializers.ValidationError("Bạn phải đồng ý trước khi gửi yêu cầu này.")
        return value
