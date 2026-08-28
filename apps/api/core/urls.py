from django.http import JsonResponse
from django.urls import path


def health(_request):
    return JsonResponse({"status": "ok", "service": "qts-api", "version": "v1"})


def overview(_request):
    return JsonResponse({
        "organization": "QTS Global",
        "revenue": "$5.8M",
        "projects": 24,
        "system_health": "99.9%",
        "clients": 45,
        "modules": ["CRM", "ERP", "AI", "Analytics", "Workflow", "Cloud"],
    })


urlpatterns = [
    path("health/", health, name="health"),
    path("overview/", overview, name="overview"),
]
