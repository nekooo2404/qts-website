from django.db import IntegrityError
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Lead
from .serializers import ConsultationLeadSerializer
from .throttles import ConsultationThrottle


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([ConsultationThrottle])
def consultation(request):
    # Fast-path dedupe: same tab double-click / retry with same key.
    # The DB unique constraint is the source of truth; this read avoids a
    # needless INSERT + IntegrityError on the common retry path.
    key = (request.data.get("idempotency_key") or "").strip()
    if key:
        existing = Lead.objects.filter(idempotency_key=key).first()
        if existing is not None:
            return Response(ConsultationLeadSerializer(existing).data, status=status.HTTP_200_OK)

    serializer = ConsultationLeadSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    try:
        instance = serializer.save()
    except IntegrityError:
        # Race between the fast-path check and INSERT — return the winner.
        existing = Lead.objects.filter(idempotency_key=serializer.validated_data["idempotency_key"]).first()
        if existing is not None:
            return Response(ConsultationLeadSerializer(existing).data, status=status.HTTP_200_OK)
        raise
    return Response(ConsultationLeadSerializer(instance).data, status=status.HTTP_201_CREATED)
