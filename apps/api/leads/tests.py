from rest_framework import status
from rest_framework.test import APITestCase

from .models import Lead


class CoreEndpointsTest(APITestCase):
    def test_health_returns_service_status(self):
        response = self.client.get("/api/v1/health/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["status"], "ok")

    def test_overview_returns_qts_platform_summary(self):
        response = self.client.get("/api/v1/overview/")
        payload = response.json()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(payload["organization"], "QTS Global")
        self.assertEqual(payload["modules"], ["CRM", "ERP", "AI", "Analytics", "Workflow", "Cloud"])


class ConsultationLeadTest(APITestCase):
    def test_valid_lead_is_persisted(self):
        response = self.client.post(
            "/api/v1/leads/consultation/",
            {"name": "Alex Morgan", "email": "alex@company.com", "company": "Northstar", "message": "Unified operations platform"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Lead.objects.count(), 1)
        self.assertEqual(Lead.objects.first().email, "alex@company.com")

    def test_invalid_lead_is_rejected(self):
        response = self.client.post(
            "/api/v1/leads/consultation/",
            {"name": "", "email": "not-an-email", "company": "", "message": ""},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Lead.objects.count(), 0)
