from django.urls import path

from . import views, ory_views

urlpatterns = [
    path("oauth/ory/login", ory_views.login, name="ory-login"),
    path("oauth/ory/consent", ory_views.consent, name="ory-consent"),
    path("oauth/ory/logout", ory_views.logout, name="ory-logout"),
    path("oauth/ory/logout/accept", ory_views.logout_accept, name="ory-logout-accept"),
    path(".well-known/openid-configuration", views.discovery, name="oidc-discovery"),
    path("oauth/jwks.json", views.jwks_view, name="oidc-jwks"),
    path("oauth/csrf", views.csrf, name="identity-csrf"),
    path("oauth/authorize", views.authorize, name="oidc-authorize"),
    path("oauth/token", views.token, name="oidc-token"),
    path("oauth/userinfo", views.userinfo, name="oidc-userinfo"),
    path("oauth/revoke", views.revoke, name="oidc-revoke"),
    path("oauth/logout", views.end_session, name="oidc-logout"),
    path("api/session", views.current_session, name="identity-session"),
    path("api/sign-in", views.sign_in, name="identity-sign-in"),
    path("api/launcher", views.launcher, name="identity-launcher"),
    path("api/sessions", views.sessions, name="identity-sessions"),
    path("api/sessions/<uuid:session_id>", views.revoke_session, name="identity-session-revoke"),
    path("api/portal-entitlements", views.portal_entitlements, name="identity-portal-entitlements"),
    path("api/console/security-overview", views.security_overview, name="identity-security-overview"),
    path("api/console/audit-events", views.audit_events, name="identity-audit-events"),
    path("api/enrollment/complete", views.enrollment_complete, name="identity-enrollment-complete"),
    path("api/admin/users", views.admin_users, name="identity-admin-users"),
]
