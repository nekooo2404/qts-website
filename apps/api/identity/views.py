import base64
import binascii
import hashlib
import secrets
from datetime import timedelta

import requests
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.core.cache import cache
from django.http import HttpResponseRedirect, JsonResponse
from django.middleware.csrf import get_token
from rest_framework.authentication import CSRFCheck
from django.utils import timezone
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_GET, require_POST
from drf_spectacular.utils import OpenApiTypes, extend_schema
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from django.db import transaction

from .models import Application, ApplicationAssignment, AuditEvent, HrmEmployeeLink, IdentitySession, Membership, Role, User
from .authentication import IdentityBearerAuthentication
from .services import (
    IdentityError,
    append_query,
    audit,
    can_access_application,
    consume_authorization_code,
    b64url,
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


def require_request_csrf(request):
    if request.method not in {"POST", "PUT", "PATCH", "DELETE"}:
        return
    raw_request = getattr(request, "_request", request)
    check = CSRFCheck(lambda _request: None)
    check.process_request(raw_request)
    reason = check.process_view(raw_request, lambda *_args: None, (), {})
    if reason:
        raise IdentityError("csrf_failed", "Yêu cầu thiếu hoặc có CSRF token không hợp lệ.", 403)


def request_data(request):
    if request.content_type and "application/json" in request.content_type:
        try:
            data = request.data
        except (ValueError, TypeError):
            raise IdentityError("invalid_request", "Nội dung yêu cầu phải là JSON hợp lệ.")
        if not hasattr(data, "get"):
            raise IdentityError("invalid_request", "Nội dung yêu cầu phải là object.")
        return data
    if request.POST:
        return request.POST
    data = request.data
    if not hasattr(data, "get"):
        raise IdentityError("invalid_request", "Nội dung yêu cầu phải là object.")
    return data


def client_credentials(request, data):
    """Accept OAuth client_secret_basic and client_secret_post without logging secrets."""
    body_client_id = str(data.get("client_id", ""))
    basic_client_id = ""
    basic_secret = ""
    authorization = request.headers.get("Authorization", "")
    if authorization.startswith("Basic "):
        try:
            decoded = base64.b64decode(authorization[6:], validate=True).decode("utf-8")
            basic_client_id, basic_secret = decoded.split(":", 1)
        except (ValueError, UnicodeDecodeError, binascii.Error) as error:
            raise IdentityError("invalid_client", "Xác thực client thất bại.", 401) from error
    if basic_client_id and body_client_id and basic_client_id != body_client_id:
        raise IdentityError("invalid_client", "Thông tin client không nhất quán.", 401)
    return basic_client_id or body_client_id, basic_secret or data.get("client_secret", "")


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
    if getattr(request, "identity_context", None):
        return request.identity_context
    authorization = request.headers.get("Authorization", "")
    if not authorization.startswith("Bearer "):
        raise IdentityError("invalid_token", "Bắt buộc có bearer access token.", 401)
    raw_token = authorization.removeprefix("Bearer ").strip()
    if not raw_token:
        raise IdentityError("invalid_token", "Bearer token không được để trống.", 401)
    if settings.IDENTITY_PROVIDER == "ory":
        from .ory import decode_ory_token
        return decode_ory_token(raw_token)
    return decode_token(raw_token)


def authenticated_context(request):
    if request.headers.get("Authorization", "").startswith("Bearer "):
        return bearer_context(request)
    if settings.IDENTITY_PROVIDER == "ory":
        from .ory import resolve_kratos_session
        from .ory_views import local_session
        kratos = resolve_kratos_session(request)
        if not kratos:
            raise IdentityError("unauthorized", "Vui lòng đăng nhập để tiếp tục.", 401)
        session, membership = local_session(request, kratos)
        return {}, session, membership
    session = active_session(request)
    if not session:
        raise IdentityError("unauthorized", "Vui lòng đăng nhập để tiếp tục.", 401)
    membership = membership_for(session.user, session.tenant)
    return {}, session, membership


def require_permission(request, permission):
    _payload, _session, membership = authenticated_context(request)
    if permission not in effective_permissions(membership):
        raise IdentityError("insufficient_scope", "Bạn không được phép thực hiện hành động này.", 403)
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
@never_cache
def discovery(_request):
    if settings.IDENTITY_PROVIDER == "ory":
        try:
            response = requests.get(settings.ORY_HYDRA_INTERNAL_PUBLIC_URL.rstrip("/") + "/.well-known/openid-configuration", timeout=5)
            response.raise_for_status()
            return JsonResponse(response.json())
        except (requests.RequestException, ValueError):
            return JsonResponse({"error": "server_error"}, status=503)
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
        "token_endpoint_auth_methods_supported": ["none", "client_secret_basic", "client_secret_post"],
        "subject_types_supported": ["public"],
        "id_token_signing_alg_values_supported": ["RS256"],
        "code_challenge_methods_supported": ["S256"],
        "scopes_supported": ["openid", "profile", "email", "offline_access"],
    })


@require_GET
@never_cache
def jwks_view(_request):
    if settings.IDENTITY_PROVIDER == "ory":
        from .ory import fetch_jwks
        try:
            return JsonResponse(fetch_jwks())
        except IdentityError as error:
            return identity_error_response(error)
    from .services import active_signing_key

    active_signing_key()
    return JsonResponse(jwks())


@require_GET
@never_cache
def csrf(request):
    return JsonResponse({"csrfToken": get_token(request)})


@require_GET
@never_cache
def authorize(request):
    if settings.IDENTITY_PROVIDER != "local":
        return JsonResponse({"error": "not_found"}, status=404)
    try:
        application, redirect_uri, scopes = validate_authorization_request(request.GET)
        session = active_session(request)
        if not session or request.GET.get("prompt") == "login":
            query = urlencode(list(request.GET.items()), doseq=True)
            return HttpResponseRedirect(f"{settings.IDENTITY_WEB_ORIGIN.rstrip('/')}/login?{query}")
        membership = membership_for(session.user, session.tenant)
        if not can_access_application(membership, application):
            return HttpResponseRedirect(append_query(redirect_uri, {"error": "access_denied", "state": request.GET.get("state")}))
        max_age = request.GET.get("max_age")
        if max_age and session.auth_time < timezone.now() - timedelta(seconds=int(max_age)):
            query = urlencode(list(request.GET.items()), doseq=True)
            return HttpResponseRedirect(f"{settings.IDENTITY_WEB_ORIGIN.rstrip('/')}/login?{query}")
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
            error = IdentityError("invalid_request", "Yêu cầu ủy quyền không hợp lệ.")
        redirect_uri = request.GET.get("redirect_uri")
        if redirect_uri:
            application = Application.objects.filter(client_id=request.GET.get("client_id", "")).first()
            if application and redirect_uri in application.redirect_uris:
                return HttpResponseRedirect(append_query(redirect_uri, {"error": error.code, "error_description": error.description, "state": request.GET.get("state")}))
        return identity_error_response(error)


@extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def sign_in(request):
    if settings.IDENTITY_PROVIDER != "local":
        return JsonResponse({"error": "not_found"}, status=404)
    try:
        require_request_csrf(request)
        data = request_data(request)
        email = str(data.get("email", "")).strip().lower()
        password = str(data.get("password", ""))
        throttle_key = f"identity:login:{request.META.get('REMOTE_ADDR', '')}:{email}"
        attempts = cache.get(throttle_key, 0)
        if attempts >= 8:
            raise IdentityError("temporarily_unavailable", "Đăng nhập tạm thời không khả dụng. Vui lòng thử lại sau.", 429)
        tenant = resolve_tenant(email)
        user = authenticate(request, email=email, password=password)
        if not user or not tenant:
            cache.set(throttle_key, attempts + 1, timeout=900)
            audit(request, "identity.login.failed", outcome="failure", metadata={"identifier_hash": hashlib.sha256(email.encode()).hexdigest()})
            raise IdentityError("invalid_credentials", "Không nhận dạng được email hoặc mật khẩu.", 401)
        membership_for(user, tenant)
        if tenant.require_mfa:
            raise IdentityError("mfa_required", "Tổ chức yêu cầu xác thực đa yếu tố.", 403)
        session = create_identity_session(user, tenant, request, ["pwd"])
        login(request, user)
        request.session.cycle_key()
        request.session[SESSION_KEY] = str(session.id)
        cache.delete(throttle_key)
        return Response(session_payload(session))
    except IdentityError as error:
        return Response({"error": error.code, "error_description": error.description}, status=error.status)


@never_cache
@extend_schema(responses=OpenApiTypes.OBJECT)
@api_view(["GET"])
@permission_classes([AllowAny])
def current_session(request):
    if settings.IDENTITY_PROVIDER == "ory":
        try:
            _claims, session, _member = authenticated_context(request)
            return Response(session_payload(session))
        except IdentityError as error:
            return Response({"authenticated": False, "error": error.code}, status=error.status)
    session = active_session(request)
    if not session:
        return Response({"authenticated": False}, status=401)
    return Response(session_payload(session))


@never_cache
@extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
@api_view(["POST"])
@permission_classes([AllowAny])
def token(request):
    if settings.IDENTITY_PROVIDER != "local":
        return JsonResponse({"error": "not_found"}, status=404)
    try:
        data = request_data(request)
        client_id, supplied_secret = client_credentials(request, data)
        application = Application.objects.filter(client_id=client_id, is_active=True).first()
        if not application:
            raise IdentityError("invalid_client", "Không nhận dạng được client.", 401)
        if not application.is_public and not application.check_secret(supplied_secret):
            raise IdentityError("invalid_client", "Xác thực client thất bại.", 401)
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
        raise IdentityError("unsupported_grant_type", "Chỉ hỗ trợ authorization_code và refresh_token.")
    except IdentityError as error:
        return Response({"error": error.code, "error_description": error.description}, status=error.status)


@never_cache
@extend_schema(responses=OpenApiTypes.OBJECT)
@api_view(["GET"])
@authentication_classes([IdentityBearerAuthentication])
@permission_classes([AllowAny])
def userinfo(request):
    try:
        payload, session, membership = bearer_context(request)
        user = session.user if session else membership.user
        tenant = session.tenant if session else membership.tenant
        scopes = set(str(payload.get("scope", "")).split())
        roles = list(membership.role_assignments.values_list("role__code", flat=True))
        role_set = set(roles)
        data_scope = "self" if role_set == {"employee"} else "manager" if role_set == {"manager"} else "company"
        response = {
            "sub": str(user.ory_id if settings.IDENTITY_PROVIDER == "ory" else user.id),
            "tid": str(tenant.id),
            "tenant": tenant.name,
            "roles": roles,
            "permissions": sorted(effective_permissions(membership)),
            "data_scope": data_scope,
            "sid": str(session.id) if session else payload.get("sid", ""),
        }
        hrm_link = HrmEmployeeLink.objects.filter(
            membership=membership,
            tenant=tenant,
            user=user,
            status=HrmEmployeeLink.Status.ACTIVE,
        ).first()
        if hrm_link:
            response.update({"employee_id": str(hrm_link.employee_id), "employee_code": hrm_link.employee_code})
        if "email" in scopes:
            response.update({"email": user.email, "email_verified": payload.get("email_verified") is True})
        if "profile" in scopes:
            response["name"] = user.display_name
        return Response(response)
    except IdentityError as error:
        return Response({"error": error.code, "error_description": error.description}, status=error.status)


@never_cache
@extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
@api_view(["POST"])
@permission_classes([AllowAny])
def revoke(request):
    if settings.IDENTITY_PROVIDER != "local":
        return JsonResponse({"error": "not_found"}, status=404)
    try:
        data = request_data(request)
        client_id, supplied_secret = client_credentials(request, data)
        application = Application.objects.filter(client_id=client_id, is_active=True).first()
        if not application:
            raise IdentityError("invalid_client", "Không nhận dạng được client.", 401)
        if not application.is_public and not application.check_secret(supplied_secret):
            raise IdentityError("invalid_client", "Xác thực client thất bại.", 401)
        revoke_refresh_token(data.get("token", ""), application)
        return Response(status=200)
    except IdentityError as error:
        return Response({"error": error.code, "error_description": error.description}, status=error.status)


@never_cache
@extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
@api_view(["POST", "GET"])
@permission_classes([AllowAny])
def end_session(request):
    if settings.IDENTITY_PROVIDER != "local":
        return JsonResponse({"error": "not_found"}, status=404)
    try:
        require_request_csrf(request)
    except IdentityError as error:
        return Response({"error": error.code, "error_description": error.description}, status=error.status)
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


@never_cache
@extend_schema(responses=OpenApiTypes.OBJECT)
@api_view(["GET"])
@authentication_classes([IdentityBearerAuthentication])
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


@extend_schema(responses=OpenApiTypes.OBJECT)
@api_view(["GET"])
@authentication_classes([IdentityBearerAuthentication])
@permission_classes([AllowAny])
def sessions(request):
    try:
        _payload, session, _membership = authenticated_context(request)
        if session is None:
            return Response({"sessions": [], "managed_by": "ory"})
        items = IdentitySession.objects.filter(user=session.user, tenant=session.tenant).order_by("-last_seen_at")
        return Response({"sessions": [{
            "id": str(item.id), "current": item.id == session.id, "user_agent": item.user_agent,
            "location": item.location or "Vị trí không xác định", "last_seen_at": item.last_seen_at,
            "auth_time": item.auth_time, "amr": item.authentication_methods,
        } for item in items if item.is_active]})
    except IdentityError as error:
        return Response({"error": error.code, "error_description": error.description}, status=error.status)


@extend_schema(responses={204: OpenApiTypes.OBJECT})
@api_view(["DELETE"])
@authentication_classes([IdentityBearerAuthentication])
@permission_classes([AllowAny])
def revoke_session(request, session_id):
    try:
        _payload, current, membership = authenticated_context(request)
        if current is None:
            raise IdentityError("not_found", "Các phiên đăng nhập do Keycloak quản lý.", 404)
        target = IdentitySession.objects.filter(id=session_id, tenant=membership.tenant).first()
        if not target or (target.user_id != current.user_id and "identity.manage_users" not in effective_permissions(membership)):
            raise IdentityError("not_found", "Không tìm thấy phiên đăng nhập.", 404)
        if not request.headers.get("Authorization", "").startswith("Bearer "):
            require_request_csrf(request)
        target.revoke("remote_logout")
        if settings.IDENTITY_PROVIDER == "ory" and target.kratos_session_id:
            from .ory import kratos_admin
            kratos_admin("DELETE", f"/admin/sessions/{target.kratos_session_id}")
        audit(request, "identity.session.revoked", tenant=membership.tenant, actor=current.user, target=target)
        return Response(status=204)
    except IdentityError as error:
        return Response({"error": error.code, "error_description": error.description}, status=error.status)


@extend_schema(responses=OpenApiTypes.OBJECT)
@api_view(["GET"])
@authentication_classes([IdentityBearerAuthentication])
@permission_classes([AllowAny])
def portal_entitlements(request):
    try:
        _payload, session, membership = bearer_context(request)
        portal = Application.objects.filter(
            tenant=membership.tenant,
            slug="qts-portal",
            is_active=True,
        ).first()
        if not portal or not can_access_application(membership, portal):
            raise IdentityError("access_denied", "Không có quyền truy cập Cổng thông tin.", 403)
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


@extend_schema(responses=OpenApiTypes.OBJECT)
@api_view(["GET"])
@authentication_classes([IdentityBearerAuthentication])
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


@extend_schema(responses=OpenApiTypes.OBJECT)
@api_view(["GET"])
@authentication_classes([IdentityBearerAuthentication])
@permission_classes([AllowAny])
def audit_events(request):
    try:
        membership = require_permission(request, "identity.view_audit")
        events = AuditEvent.objects.filter(tenant=membership.tenant).select_related("actor")[:100]
        return Response({"events": [{
            "id": str(event.id), "action": event.action, "outcome": event.outcome,
            "actor": event.actor.email if event.actor else "Hệ thống", "created_at": event.created_at,
            "target_type": event.target_type, "target_id": event.target_id,
        } for event in events]})
    except IdentityError as error:
        return Response({"error": error.code, "error_description": error.description}, status=error.status)


def _admin_user_payload(membership):
    user = membership.user
    return {
        "id": str(user.id),
        "membership_id": str(membership.id),
        "email": user.email,
        "display_name": user.display_name,
        "is_active": user.is_active,
        "ory_id": str(user.ory_id) if user.ory_id else None,
        "membership": {
            "id": str(membership.id),
            "status": membership.status,
            "status_label": membership.get_status_display(),
            "roles": sorted(membership.role_assignments.select_related("role").values_list("role__code", flat=True)),
            "applications": sorted(
                membership.application_assignments.select_related("application").values_list("application__slug", flat=True),
            ),
            "policy_version": membership.policy_version,
        },
        "created_at": user.created_at,
    }


def _require_admin(request):
    payload, session, membership = authenticated_context(request)
    permissions = effective_permissions(membership)
    if "identity.manage_users" not in permissions:
        raise IdentityError("insufficient_scope", "Bạn không được phép thực hiện hành động này.", 403)
    return payload, session, membership, permissions


def _admin_list_options(request):
    from django.db.models import Q as _Q  # noqa: PLC0415 - local to admin list

    membership = _require_admin(request)[2]
    memberships = (
        Membership.objects.select_related("user", "tenant")
        .filter(tenant=membership.tenant)
        .order_by("user__email")
    )
    q_value = (request.query_params.get("q") or request.GET.get("q") or "").strip()
    status_value = (request.query_params.get("status") or request.GET.get("status") or "").strip()
    role_value = (request.query_params.get("role") or request.GET.get("role") or "").strip()
    page_value = (request.query_params.get("page") or request.GET.get("page") or "1").strip()
    page_size_value = (request.query_params.get("page_size") or request.GET.get("page_size") or "20").strip()

    if q_value:
        memberships = memberships.filter(
            _Q(user__email__icontains=q_value) | _Q(user__display_name__icontains=q_value)
        )
    if status_value in {"active", "disabled", "invited"}:
        memberships = memberships.filter(status=status_value)
    if role_value:
        memberships = memberships.filter(role_assignments__role__code=role_value).distinct()

    try:
        page = max(1, int(page_value))
    except ValueError:
        page = 1
    try:
        page_size = max(1, min(100, int(page_size_value)))
    except ValueError:
        page_size = 20
    total = memberships.count()
    offset = (page - 1) * page_size
    memberships = list(memberships[offset : offset + page_size])
    return memberships, {"page": page, "page_size": page_size, "total": total}


@never_cache
@extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
@api_view(["POST"])
@permission_classes([AllowAny])
def enrollment_complete(request):
    if settings.IDENTITY_PROVIDER != "ory":
        return Response({"error": "not_found", "error_description": "Not found."}, status=404)
    try:
        from . import ory as ory_module
        from .services import invalidate_policy as _invalidate_policy

        require_request_csrf(request)
        kratos = ory_module.resolve_kratos_session(request)
        if not kratos:
            raise IdentityError("unauthorized", "Vui lòng đăng nhập để tiếp tục.", 401)
        identity = kratos.get("identity") or {}
        subject_str = str(identity.get("id") or "")
        try:
            import uuid as _uuid_mod
            subject = _uuid_mod.UUID(subject_str)
        except (TypeError, ValueError, AttributeError) as error:
            raise IdentityError("invalid_token", "Phiên đăng nhập không hợp lệ.", 401) from error

        data = request_data(request)
        if not data.get("confirm_password_changed"):
            raise IdentityError("invalid_request", "Vui lòng xác nhận đã đổi mật khẩu ban đầu.", 400)

        user = ory_module.user_from_ory_id(subject)
        if not user:
            raise IdentityError("invalid_token", "Không có người dùng tương ứng với phiên đăng nhập.", 401)

        # Throttle self-service enrollment (3/min per user)
        throttle_key = f"identity:enrollment:{user.id}"
        attempts = cache.get(throttle_key, 0)
        if attempts >= 3:
            raise IdentityError("temporarily_unavailable", "Vui lòng thử lại sau ít phút.", 429)

        authoritative = ory_module.kratos_admin("GET", f"/admin/identities/{subject}")
        metadata = dict(authoritative.get("metadata_admin") or {})
        if metadata.get("qts_user_id") != str(user.id):
            raise IdentityError("access_denied", "Tài khoản không khớp với định danh.", 403)
        if metadata.get("requires_enrollment") is not True:
            return Response({"completed": True, "membership_status": "active"})

        credential_types = set((authoritative.get("credentials") or {}).keys())
        missing = sorted({"password", "totp", "lookup_secret"} - credential_types)
        if missing:
            cache.set(throttle_key, attempts + 1, timeout=60)
            return Response(
                {"error": "enrollment_incomplete", "error_description": "Chưa hoàn tất thiết lập bảo mật.", "missing": missing},
                status=400,
            )

        completed_at = timezone.now().isoformat()
        metadata.update(requires_enrollment=False, enrollment_completed_at=completed_at)
        ory_module.kratos_admin("PATCH", f"/admin/identities/{subject}", [
            {"op": "replace", "path": "/metadata_admin", "value": metadata},
        ])

        with transaction.atomic():
            memberships = list(Membership.objects.select_for_update().filter(user=user))
            for membership in memberships:
                if membership.status == Membership.Status.INVITED:
                    membership.status = Membership.Status.ACTIVE
                    membership.save(update_fields=["status", "updated_at"])
                    _invalidate_policy(membership)
                audit(None, "identity.enrollment.completed", tenant=membership.tenant, actor=user, target=membership, metadata={"completed_at": completed_at, "self_service": True})

        cache.delete(throttle_key)
        return Response({"completed": True, "membership_status": "active"})

    except IdentityError as error:
        # Enrollment incomplete is already returned as 400 above; other errors map via code/status.
        if error.code == "enrollment_incomplete":
            return Response({"error": error.code, "error_description": error.description}, status=error.status)
        return Response({"error": error.code, "error_description": error.description}, status=error.status)


@never_cache
@extend_schema(responses=OpenApiTypes.OBJECT)
@api_view(["GET"])
@authentication_classes([IdentityBearerAuthentication])
@permission_classes([AllowAny])
def admin_users(request):
    try:
        _require_admin(request)
        memberships, pagination = _admin_list_options(request)
        return Response({"users": [_admin_user_payload(item) for item in memberships], "pagination": pagination})
    except IdentityError as error:
        return Response({"error": error.code, "error_description": error.description}, status=error.status)
