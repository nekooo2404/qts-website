import base64
import uuid
from datetime import timedelta
from io import StringIO
from unittest.mock import Mock, patch

import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from django.core.management import call_command
from django.core.management.base import CommandError
from django.core.cache import cache
from django.test import TestCase, RequestFactory, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from . import ory
from .models import (
    Application,
    ApplicationAssignment,
    AuditEvent,
    IdentitySession,
    Membership,
    MembershipRole,
    OrganizationDomain,
    Permission,
    Role,
    RolePermission,
    Tenant,
    User,
)
from .services import IdentityError


@override_settings(IDENTITY_PROVIDER="ory", ORY_HYDRA_ISSUER_BROWSER_URL="https://sso.test/", ORY_HYDRA_INTERNAL_PUBLIC_URL="http://hydra:4444", ORY_API_AUDIENCE="qts-api", ORY_JIT_PROVISIONING=False)
class OryProtocolTest(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.tenant = Tenant.objects.create(slug="qts", name="QTS")
        OrganizationDomain.objects.create(tenant=self.tenant, domain="qts.test", verified_at=timezone.now())
        self.user = User.objects.create_user(email="employee@qts.test", display_name="Employee", ory_id=uuid.uuid4())
        self.membership = Membership.objects.create(tenant=self.tenant, user=self.user)
        self.app = Application.objects.create(tenant=self.tenant, client_id="qts-portal", slug="qts-portal", name="Portal", is_public=True)
        self.assignment = ApplicationAssignment.objects.create(membership=self.membership, application=self.app)
        self.manage_permission = Permission.objects.create(code="identity.manage_users", name="Manage users")
        self.manage_role = Role.objects.create(tenant=self.tenant, code="super-admin", name="Super Admin")
        RolePermission.objects.create(role=self.manage_role, permission=self.manage_permission)
        MembershipRole.objects.create(membership=self.membership, role=self.manage_role)
        self.kratos_id = uuid.uuid4()
        self.kratos = {"id": str(self.kratos_id), "active": True, "expires_at": (timezone.now()+timedelta(hours=1)).isoformat(), "authenticated_at": timezone.now().isoformat(), "authenticator_assurance_level": "aal1", "authentication_methods": [{"method": "password"}], "identity": {"id": str(self.user.ory_id), "traits": {"email": self.user.email, "name": self.user.display_name}}}
        self.session = IdentitySession.create_for(self.user, self.tenant, RequestFactory().get("/"), ["pwd"])
        self.session.kratos_session_id = self.kratos_id
        self.session.save()
        self.private = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        numbers = self.private.public_key().public_numbers()
        encode = lambda n: base64.urlsafe_b64encode(n.to_bytes((n.bit_length()+7)//8, "big")).rstrip(b"=").decode()
        self.jwks = {"keys": [{"kty":"RSA", "alg":"RS256", "kid":"test", "n":encode(numbers.n), "e":encode(numbers.e)}]}

    def token(self, **extra):
        claims = {"iss":"https://sso.test/", "aud":["qts-api"], "sub":str(self.user.ory_id), "exp":timezone.now()+timedelta(minutes=5), "iat":timezone.now(), "scope":"openid profile email", "ext":{"token_use":"access", "qts_sid":str(self.session.id), "qts_tenant":str(self.tenant.id), "qts_client":"qts-portal"}}
        claims.update(extra)
        return jwt.encode(claims, self.private, algorithm="RS256", headers={"kid":"test"})

    def decode(self, token):
        with patch("identity.ory.fetch_jwks", return_value=self.jwks), patch("identity.ory.requests.post", return_value=Mock(status_code=200, json=lambda:{"active":True})), patch("identity.ory.kratos_admin", return_value=self.kratos):
            return ory.decode_ory_token(token)

    def admin_get(self, path):
        with patch("identity.ory.fetch_jwks", return_value=self.jwks), patch("identity.ory.requests.post", return_value=Mock(status_code=200, json=lambda: {"active": True})), patch("identity.ory.kratos_admin", return_value=self.kratos):
            return self.client.get(path, HTTP_AUTHORIZATION=f"Bearer {self.token()}")

    def admin_post(self, path, payload):
        with patch("identity.ory.fetch_jwks", return_value=self.jwks), patch("identity.ory.requests.post", return_value=Mock(status_code=200, json=lambda: {"active": True})), patch("identity.ory.kratos_admin", return_value=self.kratos):
            return self.client.post(path, payload, format="json", HTTP_AUTHORIZATION=f"Bearer {self.token()}")

    def test_admin_user_creation_is_not_exposed_to_bearer_clients(self):
        Role.objects.get_or_create(tenant=self.tenant, code="employee", defaults={"name": "Employee"})
        Application.objects.create(tenant=self.tenant, client_id="qts-hrm", slug="qts-hrm", name="HRM", is_public=True)

        with patch("identity.ory.fetch_jwks", return_value=self.jwks), patch("identity.ory.requests.post", return_value=Mock(status_code=200, json=lambda: {"active": True})), patch("identity.ory.kratos_admin", return_value=self.kratos):
            response = self.client.post("/api/admin/users", {
                "email": "newhire@qts.test",
                "name": "New Hire",
                "password": "A-secure-password",
                "roles": ["employee"],
                "applications": ["qts-portal", "qts-hrm"],
            }, format="json", HTTP_AUTHORIZATION=f"Bearer {self.token()}")

        self.assertEqual(response.status_code, 405, response.content)
        self.assertFalse(User.objects.filter(email="newhire@qts.test").exists())
        self.assertFalse(AuditEvent.objects.filter(action="identity.admin.user_created", actor=self.user).exists())

    @override_settings(ORY_KRATOS_SESSION_COOKIE="custom_kratos_session")
    def test_whoami_forwards_only_the_configured_kratos_cookie(self):
        request = RequestFactory().get(
            "/oauth/ory/login",
            HTTP_COOKIE="csrftoken=secret; custom_kratos_session=kratos-value; sessionid=django-secret",
        )
        remote = Mock(status_code=200, json=lambda: self.kratos)

        with patch("identity.ory.requests.get", return_value=remote) as get:
            session = ory.resolve_kratos_session(request)

        self.assertEqual(session, self.kratos)
        self.assertEqual(get.call_args.kwargs["headers"], {"Cookie": "custom_kratos_session=kratos-value"})

    def test_whoami_ignores_unrelated_browser_cookies(self):
        request = RequestFactory().get(
            "/oauth/ory/login",
            HTTP_COOKIE="csrftoken=secret; sessionid=django-secret",
        )

        with patch("identity.ory.requests.get") as get:
            self.assertIsNone(ory.resolve_kratos_session(request))

        get.assert_not_called()

    def test_bearer_admin_create_is_disabled_even_without_csrf(self):
        Role.objects.get_or_create(tenant=self.tenant, code="employee", defaults={"name": "Employee"})
        browser = APIClient(enforce_csrf_checks=True)

        with patch("identity.ory.fetch_jwks", return_value=self.jwks), patch("identity.ory.requests.post", return_value=Mock(status_code=200, json=lambda: {"active": True})), patch("identity.ory.kratos_admin", return_value=self.kratos):
            response = browser.post("/api/admin/users", {
                "email": "bearer@qts.test",
                "name": "Bearer User",
                "password": "A-secure-password",
                "roles": ["employee"],
                "applications": ["qts-portal"],
            }, format="json", HTTP_AUTHORIZATION=f"Bearer {self.token()}")

        self.assertEqual(response.status_code, 405, response.content)
        self.assertFalse(User.objects.filter(email="bearer@qts.test").exists())

    def test_cookie_admin_create_is_disabled_before_csrf(self):
        browser = APIClient(enforce_csrf_checks=True)

        with patch("identity.ory.resolve_kratos_session", return_value=self.kratos), patch(
            "identity.ory_views.local_session", return_value=(self.session, self.membership)
        ):
            response = browser.post("/api/admin/users", {}, format="json")

        self.assertEqual(response.status_code, 405)

    def test_super_admin_creation_is_not_exposed(self):
        with patch("identity.ory.fetch_jwks", return_value=self.jwks), patch("identity.ory.requests.post", return_value=Mock(status_code=200, json=lambda: {"active": True})), patch("identity.ory.kratos_admin", return_value=self.kratos):
            response = self.client.post("/api/admin/users", {
                "email": "another-admin@qts.test",
                "name": "Another Admin",
                "password": "A-secure-password",
                "roles": ["super-admin"],
                "applications": ["qts-portal"],
            }, format="json", HTTP_AUTHORIZATION=f"Bearer {self.token()}")

        self.assertEqual(response.status_code, 405, response.content)
        self.assertFalse(User.objects.filter(email="another-admin@qts.test").exists())

    def test_employee_cannot_list_or_create_users(self):
        MembershipRole.objects.filter(membership=self.membership, role=self.manage_role).delete()
        self.assertEqual(self.admin_get("/api/admin/users").status_code, 403)
        self.assertEqual(self.admin_post("/api/admin/users", {"email": "nope@qts.test"}).status_code, 405)

    def test_valid_token_preserves_local_identity_and_membership(self):
        claims, session, membership = self.decode(self.token())
        self.assertEqual(session.user_id, self.user.id)
        self.assertEqual(membership.pk, self.membership.pk)

    def test_wrong_audience_issuer_expiry_and_id_token_rejected(self):
        for changes in [{"aud":"another-api"}, {"iss":"https://wrong.test/"}, {"exp":timezone.now()-timedelta(seconds=5)}, {"ext":{}}]:
            with self.subTest(changes=list(changes)), self.assertRaises(IdentityError):
                self.decode(self.token(**changes))

    def test_cross_subject_and_cross_tenant_rejected(self):
        with self.assertRaises(IdentityError):
            self.decode(self.token(sub=str(uuid.uuid4())))
        ext={"token_use":"access", "qts_sid":str(self.session.id), "qts_tenant":str(uuid.uuid4()), "qts_client":"qts-portal"}
        with self.assertRaises(IdentityError):
            self.decode(self.token(ext=ext))

    def test_disabled_assignment_rejects_previously_issued_token(self):
        raw=self.token()
        self.assignment.is_enabled=False; self.assignment.save()
        with self.assertRaises(IdentityError):self.decode(raw)

    def test_revoked_local_session_rejects_token(self):
        raw=self.token();self.session.revoke()
        with self.assertRaises(IdentityError):self.decode(raw)

    def test_kratos_revoke_and_hydra_introspection_inactive_reject(self):
        raw=self.token()
        with patch("identity.ory.fetch_jwks",return_value=self.jwks), patch("identity.ory.requests.post",return_value=Mock(status_code=200,json=lambda:{"active":False})):
            with self.assertRaises(IdentityError):ory.decode_ory_token(raw)
        self.kratos["active"]=False
        with self.assertRaises(IdentityError):self.decode(raw)

    def test_mfa_requires_aal2_not_email_code(self):
        session={**self.kratos,"authentication_methods":[{"method":"code"}]}
        self.assertFalse(ory.kratos_meets_mfa(session))
        self.tenant.require_mfa=True;self.tenant.save()
        with patch("identity.ory.kratos_admin", return_value={"metadata_admin": {}}):
            with self.assertRaises(IdentityError):ory.principal_from_kratos(session)
        session["authenticator_assurance_level"]="aal2"
        self.assertTrue(ory.kratos_meets_mfa(session))

    def test_principal_from_kratos_rejects_pending_enrollment(self):
        with patch("identity.ory.kratos_admin", return_value={"metadata_admin": {"requires_enrollment": True}}):
            with self.assertRaises(IdentityError) as raised:
                ory.principal_from_kratos(self.kratos)

        self.assertEqual(raised.exception.code, "enrollment_required")
        self.assertEqual(raised.exception.status, 403)

    def test_self_service_enrollment_reports_missing_credentials(self):
        self.membership.status = Membership.Status.INVITED
        self.membership.save(update_fields=["status", "updated_at"])
        remote = {
            "id": str(self.user.ory_id),
            "metadata_admin": {
                "qts_user_id": str(self.user.id),
                "requires_enrollment": True,
            },
            "credentials": {"password": {}},
        }

        with patch("identity.views.require_request_csrf"), patch("identity.views.ory.resolve_kratos_session", return_value=self.kratos), patch(
            "identity.views.ory.kratos_admin", return_value=remote
        ):
            response = self.client.post(
                "/api/enrollment/complete",
                {"confirm_password_changed": True},
                format="json",
            )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["error"], "enrollment_incomplete")
        self.assertEqual(response.json()["missing"], ["lookup_secret", "totp"])
        self.membership.refresh_from_db()
        self.assertEqual(self.membership.status, Membership.Status.INVITED)

    def test_self_service_enrollment_completes_and_activates_membership(self):
        self.membership.status = Membership.Status.INVITED
        self.membership.save(update_fields=["status", "updated_at"])
        remote = {
            "id": str(self.user.ory_id),
            "metadata_admin": {
                "qts_user_id": str(self.user.id),
                "requires_enrollment": True,
                "bootstrap_superadmin": True,
            },
            "credentials": {"password": {}, "totp": {}, "lookup_secret": {}},
        }

        def admin(method, path, payload=None):
            if method == "GET":
                return remote
            self.assertEqual(method, "PATCH")
            self.assertEqual(path, f"/admin/identities/{self.user.ory_id}")
            self.assertEqual(payload[0]["op"], "replace")
            self.assertEqual(payload[0]["path"], "/metadata_admin")
            self.assertFalse(payload[0]["value"]["requires_enrollment"])
            self.assertTrue(payload[0]["value"]["bootstrap_superadmin"])
            self.assertIn("enrollment_completed_at", payload[0]["value"])
            return {}

        with patch("identity.views.require_request_csrf"), patch("identity.views.ory.resolve_kratos_session", return_value=self.kratos), patch(
            "identity.views.ory.kratos_admin", side_effect=admin
        ):
            response = self.client.post(
                "/api/enrollment/complete",
                {"confirm_password_changed": True},
                format="json",
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"completed": True, "membership_status": "active"})
        self.membership.refresh_from_db()
        self.assertEqual(self.membership.status, Membership.Status.ACTIVE)
        self.assertTrue(
            AuditEvent.objects.filter(
                action="identity.enrollment.completed",
                actor=self.user,
                target_id=str(self.membership.id),
            ).exists()
        )

    def test_self_service_enrollment_requires_kratos_cookie_session(self):
        with patch("identity.views.require_request_csrf"), patch("identity.views.ory.resolve_kratos_session", return_value=None), patch(
            "identity.views.ory.kratos_admin"
        ) as admin:
            response = self.client.post(
                "/api/enrollment/complete",
                {"confirm_password_changed": True},
                format="json",
            )

        self.assertEqual(response.status_code, 401)
        admin.assert_not_called()

    def test_complete_ory_enrollment_requires_password_totp_and_backup_codes(self):
        self.membership.status = Membership.Status.INVITED
        self.membership.save(update_fields=["status", "updated_at"])
        remote = {
            "metadata_admin": {"qts_user_id": str(self.user.id), "requires_enrollment": True},
            "credentials": {"password": {}},
        }

        with patch("identity.management.commands.complete_ory_enrollment.kratos_admin", return_value=remote):
            with self.assertRaisesMessage(CommandError, "missing credentials: lookup_secret, totp"):
                call_command("complete_ory_enrollment", self.user.email, confirm_password_changed=True)

        self.membership.refresh_from_db()
        self.assertEqual(self.membership.status, Membership.Status.INVITED)

    def test_complete_ory_enrollment_patches_metadata_and_activates_memberships(self):
        self.membership.status = Membership.Status.INVITED
        self.membership.save(update_fields=["status", "updated_at"])
        remote = {
            "metadata_admin": {"qts_user_id": str(self.user.id), "requires_enrollment": True},
            "credentials": {"password": {}, "totp": {}, "lookup_secret": {}},
        }

        def admin(method, path, body=None):
            if method == "GET":
                return remote
            self.assertEqual((method, path), ("PATCH", f"/admin/identities/{self.user.ory_id}"))
            self.assertEqual(body[0]["op"], "replace")
            self.assertEqual(body[0]["path"], "/metadata_admin")
            self.assertFalse(body[0]["value"]["requires_enrollment"])
            self.assertIn("enrollment_completed_at", body[0]["value"])
            return {}

        call_output = StringIO()
        with patch("identity.management.commands.complete_ory_enrollment.kratos_admin", side_effect=admin):
            call_command("complete_ory_enrollment", self.user.email, confirm_password_changed=True, stdout=call_output)

        self.membership.refresh_from_db()
        self.assertEqual(self.membership.status, Membership.Status.ACTIVE)
        self.assertTrue(AuditEvent.objects.filter(action="identity.enrollment.completed", actor=self.user, target_id=self.membership.id).exists())
        self.assertIn("Enrollment completed", call_output.getvalue())

    def test_jit_never_links_existing_email_automatically(self):
        with override_settings(ORY_JIT_ALLOWED_DOMAINS={"qts.test"}):
            self.assertIsNone(ory.provision_user(uuid.uuid4(),self.user.email,"Imposter"))
        self.user.refresh_from_db()
        self.assertIsNotNone(self.user.ory_id)

    def test_local_password_and_token_routes_disabled(self):
        for path in ["/api/sign-in","/oauth/token","/oauth/revoke","/oauth/logout"]:
            self.assertEqual(self.client.post(path,{}).status_code,404)

    def test_login_accepts_only_registered_assigned_subject(self):
        with patch("identity.ory.resolve_kratos_session",return_value=self.kratos), patch("identity.ory.kratos_admin", return_value={"metadata_admin": {}}), patch("identity.ory.hydra_admin",side_effect=[{"client":{"client_id":"qts-portal"}}, {"redirect_to":"https://sso.test/oauth2/auth?login_verifier=abc"}]) as admin:
            response=self.client.get("/oauth/ory/login",{"login_challenge":"valid"})
            self.assertEqual(response.status_code,302)
            body=admin.call_args.args[2]
            self.assertEqual(body["subject"],str(self.user.ory_id))
            self.assertTrue(body["remember"])
            self.assertLessEqual(body["remember_for"], 3600)

    def test_stale_login_challenge_recovers_to_launcher_login(self):
        remote = Mock(status_code=404, content=b'{"error":"not_found"}')
        with patch("identity.ory.requests.request", return_value=remote):
            response = self.client.get("/oauth/ory/login", {"login_challenge": "stale"})
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response["Location"], "http://localhost:3001/login?return_to=http%3A%2F%2Flocalhost%3A3001%2Flauncher")

    def test_consent_rejects_subject_mismatch_and_unregistered_client(self):
        with patch("identity.ory.resolve_kratos_session",return_value=self.kratos), patch("identity.ory.kratos_admin", return_value={"metadata_admin": {}}), patch("identity.ory.hydra_admin",side_effect=[{"client":{"client_id":"qts-portal"},"subject":str(uuid.uuid4())},{"redirect_to":"https://sso.test/oauth2/auth?consent_verifier=abc"}]) as admin:
            self.assertEqual(self.client.get("/oauth/ory/consent",{"consent_challenge":"valid"}).status_code,302)
            self.assertIn("/reject?",admin.call_args.args[1])
        with patch("identity.ory.hydra_admin",return_value={"client":{"client_id":"unknown"}}):
            self.assertEqual(self.client.get("/oauth/ory/login",{"login_challenge":"valid"}).status_code,403)

    def test_logout_confirmation_is_required(self):
        browser=APIClient(enforce_csrf_checks=True)
        self.assertEqual(browser.post("/oauth/ory/logout/accept",{"logout_challenge":"x"}).status_code,403)
        self.session.refresh_from_db();self.assertIsNone(self.session.revoked_at)

    def test_logout_revokes_hydra_subject_when_kratos_cookie_expired(self):
        pending = {"subject": str(self.user.ory_id)}
        accepted = {"redirect_to": "https://sso.test/logout/done"}

        with patch("identity.ory.resolve_kratos_session", return_value=None), patch(
            "identity.ory.kratos_admin"
        ) as kratos_admin, patch(
            "identity.ory.hydra_admin", side_effect=[pending, None, accepted]
        ) as hydra_admin:
            response = self.client.post("/oauth/ory/logout/accept", {"logout_challenge": "valid"})

        self.assertEqual(response.status_code, 302)
        self.session.refresh_from_db()
        self.assertIsNotNone(self.session.revoked_at)
        kratos_admin.assert_called_once_with("DELETE", f"/admin/identities/{self.user.ory_id}/sessions")
        self.assertEqual(hydra_admin.call_args_list[1].args[:2], (
            "DELETE",
            f"/admin/oauth2/auth/sessions/consent?subject={self.user.ory_id}&all=true",
        ))

    def test_logout_rejects_cookie_subject_different_from_hydra_subject(self):
        pending = {"subject": str(uuid.uuid4())}

        with patch("identity.ory.resolve_kratos_session", return_value=self.kratos), patch(
            "identity.ory.kratos_admin"
        ) as kratos_admin, patch("identity.ory.hydra_admin", return_value=pending) as hydra_admin:
            response = self.client.post("/oauth/ory/logout/accept", {"logout_challenge": "valid"})

        self.assertEqual(response.status_code, 403)
        kratos_admin.assert_not_called()
        self.assertEqual(hydra_admin.call_count, 1)
        self.session.refresh_from_db()
        self.assertIsNone(self.session.revoked_at)

    def test_silent_login_never_opens_password_ui(self):
        with patch("identity.ory.resolve_kratos_session",return_value=None), patch("identity.ory.hydra_admin",side_effect=[{"client":{"client_id":"qts-portal"},"request_url":"https://sso.test/oauth2/auth?prompt=none"},{"redirect_to":"https://sso.test/oauth2/auth?login_verifier=denied"}]) as admin:
            self.assertEqual(self.client.get("/oauth/ory/login",{"login_challenge":"silent"}).status_code,302)
            self.assertEqual(admin.call_args.args[2]["error"],"login_required")

    def test_interactive_enrollment_redirects_to_identity_settings(self):
        pending = {"client": {"client_id": "qts-portal"}, "request_url": "https://sso.test/oauth2/auth"}
        with patch("identity.ory.resolve_kratos_session", return_value=self.kratos), patch(
            "identity.ory.kratos_admin", return_value={"metadata_admin": {"requires_enrollment": True}}
        ), patch("identity.ory.hydra_admin", return_value=pending) as admin:
            response = self.client.get("/oauth/ory/login", {
                "login_challenge": "enrollment",
                "return_to": "https://attacker.test/should-not-be-used",
            })

        self.assertEqual(response.status_code, 302)
        self.assertEqual(
            response["Location"],
            "http://localhost:3001/settings?enrollment=required&return_to=http%3A%2F%2Flocalhost%3A3001%2Fenrollment-pending",
        )
        self.assertEqual(admin.call_count, 1)
        self.assertEqual(admin.call_args.args[0:2], ("GET", "/admin/oauth2/auth/requests/login?login_challenge=enrollment"))

    def test_silent_enrollment_rejects_interaction_without_opening_settings(self):
        pending = {
            "client": {"client_id": "qts-portal"},
            "request_url": "https://sso.test/oauth2/auth?prompt=none",
        }
        accepted_rejection = {"redirect_to": "https://sso.test/oauth2/auth?login_verifier=denied"}
        with patch("identity.ory.resolve_kratos_session", return_value=self.kratos), patch(
            "identity.ory.kratos_admin", return_value={"metadata_admin": {"requires_enrollment": True}}
        ), patch("identity.ory.hydra_admin", side_effect=[pending, accepted_rejection]) as admin:
            response = self.client.get("/oauth/ory/login", {"login_challenge": "silent-enrollment"})

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response["Location"], accepted_rejection["redirect_to"])
        self.assertEqual(admin.call_args_list[1].args[2]["error"], "interaction_required")
        self.assertNotIn("settings", response["Location"])

    def test_consent_rejects_unenrolled_principal_without_granting_scopes(self):
        pending = {
            "client": {"client_id": "qts-portal"},
            "subject": str(self.user.ory_id),
            "requested_scope": ["openid", "profile", "email"],
        }
        rejected = {"redirect_to": "https://sso.test/oauth2/auth?consent_verifier=denied"}
        with patch("identity.ory.resolve_kratos_session", return_value=self.kratos), patch(
            "identity.ory.kratos_admin", return_value={"metadata_admin": {"requires_enrollment": True}}
        ), patch("identity.ory.hydra_admin", side_effect=[pending, rejected]) as admin:
            response = self.client.get("/oauth/ory/consent", {"consent_challenge": "enrollment-consent"})

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response["Location"], rejected["redirect_to"])
        rejection = admin.call_args_list[1]
        self.assertIn("/reject?", rejection.args[1])
        self.assertEqual(rejection.args[2]["error"], "interaction_required")
        self.assertNotIn("grant_scope", rejection.args[2])

    def test_max_age_requests_fresh_authentication(self):
        self.kratos["authenticated_at"]=(timezone.now()-timedelta(minutes=2)).isoformat()
        with patch("identity.ory.resolve_kratos_session",return_value=self.kratos), patch("identity.ory.hydra_admin",return_value={"client":{"client_id":"qts-portal"},"request_url":"https://sso.test/oauth2/auth?max_age=60"}):
            response=self.client.get("/oauth/ory/login",{"login_challenge":"fresh"})
            self.assertEqual(response.status_code,302)
            self.assertIn("refresh=true",response["Location"])

    def test_combined_login_prompt_requires_fresh_authentication(self):
        self.kratos["authenticated_at"]=(timezone.now()-timedelta(minutes=2)).isoformat()
        pending={"client":{"client_id":"qts-portal"},"request_url":"https://sso.test/oauth2/auth?prompt=login%20consent","requested_at":timezone.now().isoformat()}
        with patch("identity.ory.resolve_kratos_session",return_value=self.kratos), patch("identity.ory.hydra_admin",return_value=pending):
            response=self.client.get("/oauth/ory/login",{"login_challenge":"combined"})
            self.assertEqual(response.status_code,302)
            self.assertIn("refresh=true",response["Location"])

    def test_verified_kratos_email_does_not_verify_different_local_email(self):
        self.kratos["identity"]["traits"]["email"]="changed@qts.test"
        self.kratos["identity"]["verifiable_addresses"]=[{"value":"changed@qts.test","verified":True}]
        pending={"client":{"client_id":"qts-portal"},"subject":str(self.user.ory_id),"requested_scope":["openid","email"]}
        with patch("identity.ory.resolve_kratos_session",return_value=self.kratos), patch("identity.ory.kratos_admin", return_value={"metadata_admin": {}}), patch("identity.ory.hydra_admin",side_effect=[pending,{"redirect_to":"https://sso.test/oauth2/auth?consent_verifier=ok"}]) as admin:
            self.assertEqual(self.client.get("/oauth/ory/consent",{"consent_challenge":"email"}).status_code,302)
            tokens=admin.call_args.args[2]["session"]
            self.assertEqual(tokens["id_token"]["email"],self.user.email)
            self.assertFalse(tokens["id_token"]["email_verified"])
            self.assertFalse(tokens["access_token"]["email_verified"])
