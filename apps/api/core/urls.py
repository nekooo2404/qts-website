from django.http import JsonResponse
from django.urls import path


def health(_request):
    return JsonResponse({"status": "ok", "service": "qts-api", "version": "v1"})


urlpatterns = [path("health/", health, name="health")]
