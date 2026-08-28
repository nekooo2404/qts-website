import base64
import json
from datetime import timedelta
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.core.cache import cache
from django.http import HttpResponseRedirect, JsonResponse
from django.middleware.csrf import get_token
from django.utils import timezone
from django.views.decorators.http import require_GET, require_POST
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Application, ApplicationAssignment, AuditEvent, IdentitySession, Membership
from .services import (
    IdentityError,
    append_query,
    audit,
    can_access_application,
    consume_authorization_code,
    create_identity_session,
    decode_token,
    effective_permissions,
    issue_authorization_code,
    issue_token_set,
    jwks,
    membership_for,
    resolve_tenant,
    revoke_refresh_token,
    rotate_refresh_token,
    validate_authorization_request,
)


SESSION_KEY = "qts_identity_session_id"


def identity_error_response(error):
    return JsonResponse({"error": error.code, "error_description": error.description}, status=error.status)


def request_data(request):
    if request.content_type and "application/json" in request.content_type:
        try:
            return json.loads(request.body or "{}")
        except json.JSONDecodeError:
            raise IdentityError("invalid_request", "The request body must be valid JSON.")
    if request.POST:
        return request.POST
    return request.data


def active_session(request):
    session_id = request.session.get(SESSION_KEY)
    if not session_id:
        return None
    session = IdentitySession.objects.select_related("user", "tenant").filter(id=session_id).first()
    if not session or not session.is_active:
        request.session.pop(SESSION_KEY, None)
        return None
    return session


def bearer_context(request):
    authorization = request.headers.get("Authorization", "")
    if not authorization.startswith("Bearer "):
        raise IdentityError("invalid_token", "A bearer access token is required.", 401)
    raw_token = authorization.removeprefix("Bearer ").strip()
    if settings.IDENTITY_PROVIDER == "keycloak":
        from .keycloak import decode_token as decode_keycloak_token

        return decode_keycloak_token(raw_token)
    return decode_token(raw_token)


def authenticated_context(request):
    authorization = request.headers.get("Authorization", "")
    if authorization.startswith("Bearer "):
        raw_token = authorization.removeprefix("Bearer ").strip()
        if settings.IDENTITY_PROVIDER == "keycloak":
            from .keycloak import decode_token as decode_keycloak_token

            return decode_keycloak_token(raw_token)
        return decode_token(raw_token)
    session = active_session(request)
    if not session:
        raise IdentityError("unauthorized", "Sign in to continue.", 401)
    membership = membership_for(session.user, session.tenant)
    return {}, session, membership


def require_permission(request, permission):
    _payload, _session, membership = authenticated_context(request)
    if permission not in effective_permissions(membership):
        raise IdentityError("insufficient_scope", "This action is not permitted.", 403)
    return membership


def session_payload(session):
    membership = membership_for(session.user, session.tenant)
    return {
        "authenticated": True,
        "user": {"id": str(session.user_id), "email": session.user.email, "name": session.user.display_name},
        "tenant": {"id": str(session.tenant_id), "slug": session.tenant.slug, "name": session.tenant.name},
        "session": {"id": str(session.id), "auth_time": session.auth_time.isoformat(), "amr": session.authentication_methods},
        "roles": list(membership.role_assignments.values_list("role__code", flat=True)),
        "permissions": sorted(effective_permissions(membership)),
    }


@require_GET
def discovery(_request):
    issuer = settings.IDENTITY_ISSUER.rstrip("/")
    return JsonResponse({
        "issuer": issuer,
        "authorization_endpoint": f"{issuer}/oauth/authorize",
        "token_endpoint": f"{issuer}/oauth/token",
        "userinfo_endpoint": f"{issuer}/oauth/userinfo",
        "jwks_uri": f"{issuer}/oauth/jwks.json",
        "revocation_endpoint": f"{issuer}/oauth/revoke",
        "end_session_endpoint": f"{issuer}/oauth/logout",
        "response_types_supported": ["code"],
        "grant_types_supported": ["authorization_code", "refresh_token"],
        "subject_types_supported": ["public"],
        "id_token_signing_alg_values_supported": ["RS256"],
        "code_challenge_methods_supported": ["S256"],
        "scopes_supported": ["openid", "profile", "email", "offline_access"],
    })


@require_GET
def jwks_view(_request):
    from .services import active_signing_key

    active_signing_key()
    return JsonResponse(jwks())


@require_GET
def csrf(request):
    return JsonResponse({"csrfToken": get_token(request)})


@require_GET
def authorize(request):
    try:
        application, redirect_uri, scopes = validate_authorization_request(request.GET)
        session = active_session(request)
        if not session or request.GET.get("prompt") == "login":
            query = urlencode(list(request.GET.items()), doseq=True)
            return HttpResponseRedirect(f"{settings.IDENTITY_WEB_ORIGIN.rstrip('/')}/sign-in?{query}")
        membership = membership_for(session.user, session.tenant)
        if not can_access_application(membership, application):
            return HttpResponseRedirect(append_query(redirect_uri, {"error": "access_denied", "state": request.GET.get("state")}))
        max_age = request.GET.get("max_age")
        if max_age and session.auth_time < timezone.now() - timedelta(seconds=int(max_age)):
            query = urlencode(list(request.GET.items()), doseq=True)
            return HttpResponseRedirect(f"{settings.IDENTITY_WEB_ORIGIN.rstrip('/')}/sign-in?{query}")
        code = issue_authorization_code(
            application,
            session,
            redirect_uri,
            scopes,
            request.GET.get("nonce"),
            request.GET.get("code_challenge"),
            request.GET.get("code_challenge_method"),
        )
        assignment = ApplicationAssignment.objects.get(membership=membership, application=application)
        assignment.last_accessed_at = timezone.now()
        assignment.save(update_fields=["last_accessed_at"])
        audit(request, "identity.application.authorized", tenant=session.tenant, actor=session.user, target=application)
        return HttpResponseRedirect(append_query(redirect_uri, {"code": code, "state": request.GET.get("state")}))
    except (IdentityError, ValueError) as error:
        if isinstance(error, ValueError):
            error = IdentityError("invalid_request", "The authorization request is invalid.")
        redirect_uri = request.GET.get("redirect_uri")
        if redirect_uri:
            application = Application.objects.filter(client_id=request.GET.get("client_id", "")).first()
            if application and redirect_uri in application.redirect_uris:
                return HttpResponseRedirect(append_query(redirect_uri, {"error": error.code, "error_description": error.description, "state": request.GET.get("state")}))
        return identity_error_response(error)


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def sign_in(request):
    try:
        data = request_data(request)
        email = str(data.get("email", "")).strip().lower()
        password = str(data.get("password", ""))
        throttle_key = f"identity:login:{request.META.get('REMOTE_ADDR', '')}:{email}"
        attempts = cache.get(throttle_key, 0)
        if attempts >= 8:
            raise IdentityError("temporarily_unavailable", "Sign-in is temporarily unavailable. Try again later.", 429)
        tenant = resolve_tenant(email)
        user = authenticate(request, email=email, password=password)
        if not user or not tenant:
            cache.set(throttle_key, attempts + 1, timeout=900)
            audit(request, "identity.login.failed", outcome="failure", metadata={"identifier_hash": str(hash(email))})
            raise IdentityError("invalid_credentials", "The email or password is not recognized.", 401)
        membership_for(user, tenant)
        session = create_identity_session(user, tenant, request, ["pwd"])
        login(request, user)
        request.session.cycle_key()
        request.session[SESSION_KEY] = str(session.id)
        cache.delete(throttle_key)
        return Response(session_payload(session))
    except IdentityError as error:
        return Response({"error": error.code, "error_description": error.description}, status=error.status)


@api_view(["GET"])
@permission_classes([AllowAny])
def current_session(request):
    session = active_session(request)
    if not session:
        return Response({"authenticated": False}, status=401)
    return Response(session_payload(session))


@api_view(["POST"])
@permission_classes([AllowAny])
def token(request):
    try:
        data = request_data(request)
        client_id = data.get("client_id", "")
        application = Application.objects.filter(client_id=client_id, is_active=True).first()
        if not application:
            raise IdentityError("invalid_client", "The client is not recognized.", 401)
        supplied_secret = data.get("client_secret") or request.headers.get("X-QTS-Client-Secret", "")
        if not application.is_public and not application.check_secret(supplied_secret):
            raise IdentityError("invalid_client", "Client authentication failed.", 401)
        grant_type = data.get("grant_type")
        if grant_type == "authorization_code":
            code = consume_authorization_code(
                data.get("code", ""),
                application,
                data.get("redirect_uri", ""),
                data.get("code_verifier", ""),
            )
            token_set = issue_token_set(
                code.session,
                application,
                code.scopes,
                code.nonce,
                include_refresh="offline_access" in code.scopes,
            )
            audit(request, "identity.token.issued", tenant=code.session.tenant, actor=code.session.user, target=application)
            return Response(token_set)
        if grant_type == "refresh_token":
            token_set = rotate_refresh_token(data.get("refresh_token", ""), application)
            return Response(token_set)
        raise IdentityError("unsupported_grant_type", "Only authorization_code and refresh_token are supported.")
    except IdentityError as error:
        return Response({"error": error.code, "error_description": error.description}, status=error.status)


@api_view(["GET", "POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def userinfo(request):
    try:
        payload, session, membership = bearer_context(request)
        user = session.user if session else membership.user
        tenant = session.tenant if session else membership.tenant
        return Response({
            "sub": str(user.keycloak_id if session is None else user.id),
            "email": user.email,
            "email_verified": True,
            "name": user.display_name,
            "tid": str(tenant.id),
            "tenant": tenant.name,
            "roles": list(membership.role_assignments.values_list("role__code", flat=True)),
            "permissions": sorted(effective_permissions(membership)),
            "sid": str(session.id) if session else payload.get("sid", ""),
        })
    except IdentityError as error:
        return Response({"error": error.code, "error_description": error.description}, status=error.status)


@api_view(["POST"])
@permission_classes([AllowAny])
def revoke(request):
    data = request_data(request)
    revoke_refresh_token(data.get("token", ""))
    return Response(status=200)


@api_view(["POST", "GET"])
@permission_classes([AllowAny])
def end_session(request):
    session = active_session(request)
    if session:
        session.revoke("logout")
        audit(request, "identity.logout", tenant=session.tenant, actor=session.user, target=session)
    logout(request)
    request.session.flush()
    uri = request.data.get("post_logout_redirect_uri") if request.method == "POST" else request.GET.get("post_logout_redirect_uri")
    client_id = request.data.get("client_id") if request.method == "POST" else request.GET.get("client_id")
    application = Application.objects.filter(client_id=client_id).first()
    if uri and application and uri in application.redirect_uris:
        if request.method == "GET":
            return HttpResponseRedirect(uri)
        return Response({"redirect_to": uri})
    return Response({"logged_out": True})


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def launcher(request):
    try:
        _payload, _session, membership = authenticated_context(request)
        assignments = ApplicationAssignment.objects.select_related("application").filter(membership=membership, is_enabled=True, application__is_active=True)
        apps = []
        for assignment in assignments:
            application = assignment.application
            if can_access_application(membership, application):
                apps.append({
                    "id": str(application.id), "name": application.name, "slug": application.slug,
                    "description": application.description, "icon": application.icon,
                    "client_id": application.client_id, "redirect_uri": application.redirect_uris[0] if application.redirect_uris else "",
                    "status": "Available", "last_accessed_at": assignment.last_accessed_at,
                })
        return Response({"applications": apps})
    except IdentityError as error:
        return Response({"error": error.code, "error_description": error.description}, status=error.status)


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def sessions(request):
    try:
        _payload, session, _membership = bearer_context(request)
        if session is None:
            return Response({"sessions": [], "managed_by": "keycloak"})
        items = IdentitySession.objects.filter(user=session.user, tenant=session.tenant).order_by("-last_seen_at")
        return Response({"sessions": [{
            "id": str(item.id), "current": item.id == session.id, "user_agent": item.user_agent,
            "location": item.location or "Unknown location", "last_seen_at": item.last_seen_at,
            "auth_time": item.auth_time, "amr": item.authentication_methods,
        } for item in items if item.is_active]})
    except IdentityError as error:
        return Response({"error": error.code, "error_description": error.description}, status=error.status)


@api_view(["DELETE"])
@authentication_classes([])
@permission_classes([AllowAny])
def revoke_session(request, session_id):
    try:
        _payload, current, membership = bearer_context(request)
        if current is None:
            raise IdentityError("not_found", "Sessions are managed by Keycloak.", 404)
        target = IdentitySession.objects.filter(id=session_id, tenant=membership.tenant).first()
        if not target or (target.user_id != current.user_id and "identity.manage_users" not in effective_permissions(membership)):
            raise IdentityError("not_found", "The session was not found.", 404)
        target.revoke("remote_logout")
        audit(request, "identity.session.revoked", tenant=membership.tenant, actor=current.user, target=target)
        return Response(status=204)
    except IdentityError as error:
        return Response({"error": error.code, "error_description": error.description}, status=error.status)


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def portal_entitlements(request):
    try:
        _payload, session, membership = bearer_context(request)
        permissions = effective_permissions(membership)
        module_map = {
            "Dashboard": ["portal.view_dashboard"], "Projects": ["portal.view_projects"],
            "CRM": ["crm.view_customer"], "HR": ["hr.view_people"],
            "Finance": ["finance.view_invoice"], "Developer": ["developer.view_logs"],
            "Analytics": ["analytics.view_reports"], "Settings": ["identity.view_console"],
        }
        modules = {page: any(permission in permissions for permission in required) for page, required in module_map.items()}
        manage = {"Settings": "identity.manage_users" in permissions}
        return Response({"modules": modules, "manage": manage, "roles": list(membership.role_assignments.values_list("role__code", flat=True))})
    except IdentityError as error:
        return Response({"error": error.code, "error_description": error.description}, status=error.status)


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def security_overview(request):
    try:
        membership = require_permission(request, "identity.view_console")
        tenant = membership.tenant
        now = timezone.now()
        day_ago = now - timedelta(days=1)
        members = Membership.objects.filter(tenant=tenant)
        return Response({
            "active_users": members.filter(status="active").count(),
            "failed_logins": AuditEvent.objects.filter(tenant=tenant, action="identity.login.failed", created_at__gte=day_ago).count(),
            "mfa_adoption": 0,
            "risk_level": "Guarded",
            "connected_applications": Application.objects.filter(tenant__in=[tenant, None], is_active=True).count(),
        })
    except IdentityError as error:
        return Response({"error": error.code, "error_description": error.description}, status=error.status)


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def audit_events(request):
    try:
        membership = require_permission(request, "identity.view_audit")
        events = AuditEvent.objects.filter(tenant=membership.tenant).select_related("actor")[:100]
        return Response({"events": [{
            "id": str(event.id), "action": event.action, "outcome": event.outcome,
            "actor": event.actor.email if event.actor else "System", "created_at": event.created_at,
            "target_type": event.target_type, "target_id": event.target_id,
        } for event in events]})
    except IdentityError as error:
        return Response({"error": error.code, "error_description": error.description}, status=error.status)
