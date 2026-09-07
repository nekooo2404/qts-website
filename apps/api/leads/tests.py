from django.core.cache import cache
from django.test import override_settings
from django.urls import Resolver404, resolve
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Lead

URL = "/api/v1/leads/consultation/"


def payload(**overrides):
    body = {
        "name": "Alex Morgan",
        "email": "alex@company.com",
        "company": "Northstar",
        "phone": "+84 909 000 000",
        "message": "We need a unified operations platform",
        "consent": True,
        "idempotency_key": "0f0b2f0f-1a1f-4a2e-9a2b-6d3f1d2c4a55",
    }
    body.update(overrides)
    return body


class CoreEndpointsTest(APITestCase):
    def test_health_returns_service_status(self):
        response = self.client.get("/api/v1/health/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["status"], "ok")

    def test_overview_endpoint_is_gone(self):
        # P0-04: the fabricated QTS summary must not be served.
        with self.assertRaises(Resolver404):
            resolve("/api/v1/overview/")


class ConsultationAPITestCase(APITestCase):
    def setUp(self):
        super().setUp()
        # DRF throttle history lives in the cache and survives test methods.
        cache.clear()


class ConsultationLeadTest(ConsultationAPITestCase):
    def test_valid_lead_is_persisted(self):
        response = self.client.post(URL, payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Lead.objects.count(), 1)
        lead = Lead.objects.first()
        self.assertEqual(lead.email, "alex@company.com")
        self.assertEqual(lead.status, Lead.Status.NEW)

    def test_invalid_lead_is_rejected(self):
        response = self.client.post(
            URL,
            {"name": "", "email": "not-an-email", "company": "", "message": ""},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Lead.objects.count(), 0)

    def test_honeypot_field_must_be_empty(self):
        response = self.client.post(URL, payload(website="http://spam.example"), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Lead.objects.count(), 0)

    def test_consent_is_required(self):
        response = self.client.post(URL, payload(consent=False), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("consent", response.json())
        self.assertEqual(Lead.objects.count(), 0)

    def test_duplicate_idempotency_key_returns_existing_lead(self):
        first = self.client.post(URL, payload(), format="json")
        second = self.client.post(URL, payload(), format="json")
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertEqual(Lead.objects.count(), 1)


class ConsultationThrottleTest(ConsultationAPITestCase):
    # IS_TEST disables global throttling; the scoped one still applies because
    # it is declared on the view. Re-enable the defaults to mirror production.
    @override_settings(
        REST_FRAMEWORK={
            "DEFAULT_AUTHENTICATION_CLASSES": ("rest_framework_simplejwt.authentication.JWTAuthentication",),
            "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
            "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
            "DEFAULT_THROTTLE_CLASSES": [
                "rest_framework.throttling.AnonRateThrottle",
                "rest_framework.throttling.UserRateThrottle",
            ],
            "DEFAULT_THROTTLE_RATES": {"anon": "60/min", "user": "1000/day", "consultation": "5/min"},
        }
    )
    def test_sixth_request_from_same_ip_is_throttled(self):
        cache.clear()
        for i in range(5):
            response = self.client.post(URL, payload(idempotency_key=f"throttle-{i}"), format="json")
            self.assertIn(response.status_code, (status.HTTP_201_CREATED, status.HTTP_200_OK))
        response = self.client.post(URL, payload(idempotency_key="throttle-5"), format="json")
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(Lead.objects.count(), 5)
