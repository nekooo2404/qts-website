from django.urls import path
from .views import consultation

urlpatterns = [path("consultation/", consultation, name="consultation")]
