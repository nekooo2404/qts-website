from django.urls import path

from . import views

urlpatterns = [
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
]
