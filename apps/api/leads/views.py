from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .serializers import ConsultationLeadSerializer


@api_view(["POST"])
@permission_classes([AllowAny])
def consultation(request):
    serializer = ConsultationLeadSerializer(data=request.data)
    if serializer.is_valid():
        instance = serializer.save()
        return Response(ConsultationLeadSerializer(instance).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
