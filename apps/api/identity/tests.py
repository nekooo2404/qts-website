import base64
import hashlib
import uuid
from datetime import timedelta
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from django.core.cache import cache
from django.test import RequestFactory, TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from . import keycloak
from .models import (
    Application,
    ApplicationAssignment,
    AuthorizationCode,
    DirectGrant,
    IdentitySession,
    Membership,
    Permission,
    Role,
    RolePermission,
    Tenant,
    User,
)
from .services import effective_permissions, issue_authorization_code


@override_settings(IDENTITY_ISSUER="https://identity.test", IDENTITY_WEB_ORIGIN="http://identity.test")
class IdentityProtocolTest(TestCase):
    def setUp(self):
        self.client = APIClient(enforce_csrf_checks=False)
        self.factory = RequestFactory()
        self.tenant = Tenant.objects.create(slug="alpha", name="Alpha Corporation")
        self.user = User.objects.create_user(email="alex@alpha.test", password="A-secure-password", display_name="Alex Harper")
        self.membership = Membership.objects.create(tenant=self.tenant, user=self.user)
        self.permission = Permission.objects.create(code="portal.view_dashboard", name="View dashboard")
        self.role = Role.objects.create(tenant=self.tenant, code="employee", name="Employee")
        RolePermission.objects.create(role=self.role, permission=self.permission)
        self.membership.role_assignments.create(role=self.role)
        self.application = Application.objects.create(
            tenant=self.tenant,
            name="QTS Portal",
            slug="qts-portal",
            redirect_uris=["https://portal.test/auth/callback"],
            allowed_scopes=["profile", "email"],
            is_public=True,
        )
        ApplicationAssignment.objects.create(membership=self.membership, application=self.application)
        self.session = IdentitySession.create_for(self.user, self.tenant, self.factory.get("/"), ["pwd"])

    def pkce(self):
        verifier = "v" * 64
        challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
        return verifier, challenge

    def test_discovery_and_jwks_are_available(self):
        discovery = self.client.get("/.well-known/openid-configuration")
        self.assertEqual(discovery.status_code, 200)
        self.assertEqual(discovery.json()["issuer"], "https://identity.test")
        jwks = self.client.get("/oauth/jwks.json")
        self.assertEqual(jwks.status_code, 200)
        self.assertEqual(jwks.json()["keys"][0]["alg"], "RS256")

    def test_authorization_code_requires_pkce_and_is_single_use(self):
        client_session = self.client.session
        client_session["qts_identity_session_id"] = str(self.session.id)
        client_session.save()
        verifier, challenge = self.pkce()
        response = self.client.get("/oauth/authorize", {
            "response_type": "code", "client_id": self.application.client_id,
            "redirect_uri": "https://portal.test/auth/callback", "scope": "openid profile email",
            "state": "state-value", "nonce": "nonce-value", "code_challenge": challenge, "code_challenge_method": "S256",
        })
        self.assertEqual(response.status_code, 302)
        parameters = parse_qs(urlparse(response["Location"]).query)
        code = parameters["code"][0]
        token = self.client.post("/oauth/token", {
            "grant_type": "authorization_code", "client_id": self.application.client_id, "code": code,
            "redirect_uri": "https://portal.test/auth/callback", "code_verifier": verifier,
        })
        self.assertEqual(token.status_code, 200)
        self.assertIn("access_token", token.json())
        replay = self.client.post("/oauth/token", {
            "grant_type": "authorization_code", "client_id": self.application.client_id, "code": code,
            "redirect_uri": "https://portal.test/auth/callback", "code_verifier": verifier,
        })
        self.assertEqual(replay.status_code, 400)
        self.assertEqual(replay.json()["error"], "invalid_grant")

    def test_unregistered_redirect_is_rejected(self):
        response = self.client.get("/oauth/authorize", {
            "response_type": "code", "client_id": self.application.client_id,
            "redirect_uri": "https://attacker.test/callback", "scope": "openid", "state": "state", "nonce": "nonce",
        })
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["error"], "invalid_request")

    def test_direct_deny_overrides_role_permission(self):
        DirectGrant.objects.create(membership=self.membership, permission=self.permission, allowed=False)
        self.assertNotIn("portal.view_dashboard", effective_permissions(self.membership))

    def test_refresh_reuse_revokes_session(self):
        verifier, challenge = self.pkce()
        code = issue_authorization_code(self.application, self.session, "https://portal.test/auth/callback", ["openid", "offline_access"], "nonce", challenge, "S256")
        response = self.client.post("/oauth/token", {
            "grant_type": "authorization_code", "client_id": self.application.client_id, "code": code,
            "redirect_uri": "https://portal.test/auth/callback", "code_verifier": verifier,
        })
        refresh = response.json()["refresh_token"]
        first_rotation = self.client.post("/oauth/token", {"grant_type": "refresh_token", "client_id": self.application.client_id, "refresh_token": refresh})
        self.assertEqual(first_rotation.status_code, 200)
        replay = self.client.post("/oauth/token", {"grant_type": "refresh_token", "client_id": self.application.client_id, "refresh_token": refresh})
        self.assertEqual(replay.status_code, 400)
        self.session.refresh_from_db()
        self.assertIsNotNone(self.session.revoked_at)

    def test_token_endpoint_accepts_form_encoded_bodies(self):
        verifier, challenge = self.pkce()
        code = issue_authorization_code(self.application, self.session, "https://portal.test/auth/callback", ["openid"], "nonce", challenge, "S256")
        response = self.client.post(
            "/oauth/token",
            f"grant_type=authorization_code&client_id={self.application.client_id}&code={code}&redirect_uri=https://portal.test/auth/callback&code_verifier={verifier}",
            content_type="application/x-www-form-urlencoded",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.json())

    def test_cross_tenant_application_cannot_be_authorized(self):
        other = Tenant.objects.create(slug="beta", name="Beta Group")
        other_application = Application.objects.create(
            tenant=other, name="Beta CRM", slug="beta-crm", redirect_uris=["https://beta.test/callback"], is_public=True,
        )
        client_session = self.client.session
        client_session["qts_identity_session_id"] = str(self.session.id)
        client_session.save()
        _verifier, challenge = self.pkce()
        response = self.client.get("/oauth/authorize", {
            "response_type": "code", "client_id": other_application.client_id, "redirect_uri": "https://beta.test/callback",
            "scope": "openid", "state": "state", "nonce": "nonce", "code_challenge": challenge, "code_challenge_method": "S256",
        })
        self.assertEqual(response.status_code, 302)
        self.assertEqual(parse_qs(urlparse(response["Location"]).query)["error"], ["access_denied"])


@override_settings(
    IDENTITY_PROVIDER="keycloak",
    KEYCLOAK_ISSUER="https://keycloak.test/realms/qts",
    KEYCLOAK_INTERNAL_ISSUER="http://keycloak/realms/qts",
    KEYCLOAK_AUDIENCE="account",
)
class KeycloakTokenTest(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        self.subject = uuid.uuid4()
        self.tenant = Tenant.objects.create(slug="alpha", name="Alpha Corporation")
        from .models import OrganizationDomain
        OrganizationDomain.objects.create(tenant=self.tenant, domain="alpha.test", verified_at=timezone.now())
        self.user = User.objects.create_user(
            email="alex@alpha.test",
            password="A-secure-password",
            display_name="Alex Harper",
            keycloak_id=self.subject,
        )
        self.membership = Membership.objects.create(tenant=self.tenant, user=self.user)
        self.permission = Permission.objects.create(code="portal.view_dashboard", name="View dashboard")
        role = Role.objects.create(tenant=self.tenant, code="employee", name="Employee")
        RolePermission.objects.create(role=role, permission=self.permission)
        self.membership.role_assignments.create(role=role)
        numbers = self.private_key.public_key().public_numbers()
        self.jwks = {
            "keys": [{
                "kty": "RSA",
                "kid": "test-key",
                "alg": "RS256",
                "n": base64.urlsafe_b64encode(numbers.n.to_bytes((numbers.n.bit_length() + 7) // 8, "big")).rstrip(b"=").decode(),
                "e": base64.urlsafe_b64encode(numbers.e.to_bytes((numbers.e.bit_length() + 7) // 8, "big")).rstrip(b"=").decode(),
            }]
        }

    def token(self, **overrides):
        claims = {
            "sub": str(self.subject),
            "iss": "https://keycloak.test/realms/qts",
            "aud": "account",
            "exp": timezone.now() + timedelta(minutes=5),
        }
        claims.update(overrides)
        return jwt.encode(claims, self.private_key, algorithm="RS256", headers={"kid": "test-key"})

    def keycloak_response(self):
        response = type("KeycloakResponse", (), {})()
        response.json = lambda: self.jwks
        response.raise_for_status = lambda: None
        return response

    @patch("identity.keycloak.requests.get")
    def test_keycloak_token_returns_django_entitlements(self, get):
        get.return_value = self.keycloak_response()
        response = self.client.get("/api/portal-entitlements", HTTP_AUTHORIZATION=f"Bearer {self.token()}")
        self.assertEqual(response.status_code, 200, response.content)
        self.assertTrue(response.json()["modules"]["Dashboard"])
        self.assertEqual(response.json()["roles"], ["employee"])

    @patch("identity.keycloak.requests.get")
    def test_keycloak_token_with_wrong_audience_is_rejected(self, get):
        get.return_value = self.keycloak_response()
        response = self.client.get("/api/portal-entitlements", HTTP_AUTHORIZATION=f"Bearer {self.token(aud='other')}")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["error"], "invalid_token")

    @patch("identity.keycloak.requests.get")
    def test_disabled_django_user_is_rejected(self, get):
        get.return_value = self.keycloak_response()
        self.user.is_active = False
        self.user.save(update_fields=["is_active"])
        response = self.client.get("/oauth/userinfo", HTTP_AUTHORIZATION=f"Bearer {self.token()}")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["error"], "invalid_token")
