import base64
import hashlib
import json
import secrets
from datetime import timedelta
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

import jwt
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from django.conf import settings
from django.core.cache import cache
from django.db import transaction
from django.utils import timezone

from .models import (
    Application,
    ApplicationAssignment,
    AuditEvent,
    AuthorizationCode,
    DirectGrant,
    IdentitySession,
    Membership,
    RefreshToken,
    RefreshTokenFamily,
    SigningKey,
)


CORE_SCOPES = {"openid", "profile", "email", "offline_access"}


class IdentityError(Exception):
    def __init__(self, code, description, status=400):
        self.code = code
        self.description = description
        self.status = status
        super().__init__(description)


def b64url(value):
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode()


def hash_value(value):
    return hashlib.sha256(value.encode()).hexdigest()


def append_query(uri, values):
    parsed = urlparse(uri)
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    query.update({key: value for key, value in values.items() if value is not None})
    return urlunparse(parsed._replace(query=urlencode(query)))


def fernet():
    material = settings.IDENTITY_SIGNING_KEY_PASSPHRASE or settings.SECRET_KEY
    return Fernet(base64.urlsafe_b64encode(hashlib.sha256(material.encode()).digest()))


def active_signing_key():
    key = SigningKey.objects.filter(is_active=True).order_by("-created_at").first()
    if key:
        return key
    private = rsa.generate_private_key(public_exponent=65537, key_size=3072)
    public = private.public_key().public_numbers()
    kid = f"qts-{secrets.token_urlsafe(12)}"
    public_jwk = {
        "kty": "RSA",
        "use": "sig",
        "alg": "RS256",
        "kid": kid,
        "n": b64url(public.n.to_bytes((public.n.bit_length() + 7) // 8, "big")),
        "e": b64url(public.e.to_bytes((public.e.bit_length() + 7) // 8, "big")),
    }
    pem = private.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    )
    return SigningKey.objects.create(
        kid=kid,
        private_key_pem=fernet().encrypt(pem).decode(),
        public_jwk=public_jwk,
    )


def signing_private_key(key):
    pem = fernet().decrypt(key.private_key_pem.encode())
    return serialization.load_pem_private_key(pem, password=None)


def jwks():
    return {"keys": list(SigningKey.objects.filter(is_active=True).values_list("public_jwk", flat=True))}


def resolve_tenant(email):
    domain = email.rsplit("@", 1)[-1].lower() if "@" in email else ""
    from .models import OrganizationDomain

    connection = (
        OrganizationDomain.objects.select_related("tenant")
        .filter(domain=domain, verified_at__isnull=False, tenant__status="active")
        .first()
    )
    return connection.tenant if connection else None


def membership_for(user, tenant):
    try:
        membership = Membership.objects.select_related("user", "tenant").get(user=user, tenant=tenant)
    except Membership.DoesNotExist as error:
        raise IdentityError("access_denied", "Access is not available for this organization.", 403) from error
    if membership.status != Membership.Status.ACTIVE or not user.is_active or tenant.status != "active":
        raise IdentityError("access_denied", "Access is not available for this organization.", 403)
    return membership


def effective_permissions(membership):
    key = f"identity:permissions:{membership.id}:{membership.policy_version}"
    cached = cache.get(key)
    if cached is not None:
        return set(cached)
    role_permissions = membership.role_assignments.values_list("role__permissions__code", flat=True)
    granted = set(permission for permission in role_permissions if permission)
    for code, allowed in membership.direct_grants.values_list("permission__code", "allowed"):
        if allowed:
            granted.add(code)
        else:
            granted.discard(code)
    cache.set(key, sorted(granted), timeout=900)
    return granted


def membership_roles(membership):
    return list(membership.role_assignments.values_list("role__code", flat=True))


def invalidate_policy(membership):
    cache.delete(f"identity:permissions:{membership.id}:{membership.policy_version}")
    membership.bump_policy_version()


def can_access_application(membership, application):
    if not application.is_active:
        return False
    if application.tenant_id and application.tenant_id != membership.tenant_id:
        return False
    assignment = ApplicationAssignment.objects.filter(membership=membership, application=application, is_enabled=True).first()
    if not assignment:
        return False
    permissions = effective_permissions(membership)
    return set(application.required_permissions).issubset(permissions)


def audit(request, action, *, tenant=None, actor=None, target=None, outcome="success", metadata=None):
    previous = AuditEvent.objects.order_by("-created_at").values_list("event_hash", flat=True).first() or ""
    ip = request.META.get("REMOTE_ADDR", "") if request else ""
    user_agent = request.META.get("HTTP_USER_AGENT", "")[:600] if request else ""
    content = json.dumps(
        {
            "previous": previous,
            "tenant": str(tenant.id) if tenant else "",
            "actor": str(actor.id) if actor else "",
            "action": action,
            "target": str(getattr(target, "pk", "")),
            "outcome": outcome,
            "metadata": metadata or {},
        },
        sort_keys=True,
        separators=(",", ":"),
    )
    return AuditEvent.objects.create(
        tenant=tenant,
        actor=actor,
        action=action,
        target_type=target._meta.label if target else "",
        target_id=str(getattr(target, "pk", "")),
        outcome=outcome,
        ip_hash=hash_value(ip) if ip else "",
        user_agent=user_agent,
        metadata=metadata or {},
        previous_hash=previous,
        event_hash=hash_value(content),
    )


def create_identity_session(user, tenant, request, methods):
    session = IdentitySession.create_for(user, tenant, request, methods)
    audit(request, "identity.login.success", tenant=tenant, actor=user, target=session, metadata={"amr": methods})
    return session


def validate_redirect(application, redirect_uri):
    if not redirect_uri or redirect_uri not in application.redirect_uris:
        raise IdentityError("invalid_request", "The redirect URI is not registered for this application.")


def validate_authorization_request(params):
    if params.get("response_type") != "code":
        raise IdentityError("unsupported_response_type", "Only authorization code flow is supported.")
    client_id = params.get("client_id", "")
    application = Application.objects.filter(client_id=client_id, is_active=True).first()
    if not application:
        raise IdentityError("unauthorized_client", "The application is not available.")
    redirect_uri = params.get("redirect_uri", "")
    validate_redirect(application, redirect_uri)
    if not params.get("state"):
        raise IdentityError("invalid_request", "state is required.")
    if application.is_public and (
        params.get("code_challenge_method") != "S256" or not params.get("code_challenge")
    ):
        raise IdentityError("invalid_request", "PKCE S256 is required for this application.")
    scopes = set(params.get("scope", "").split())
    if "openid" not in scopes:
        raise IdentityError("invalid_scope", "openid scope is required.")
    available = CORE_SCOPES | set(application.allowed_scopes)
    if not scopes.issubset(available):
        raise IdentityError("invalid_scope", "One or more scopes are not available.")
    if "openid" in scopes and not params.get("nonce"):
        raise IdentityError("invalid_request", "nonce is required for OpenID Connect.")
    return application, redirect_uri, sorted(scopes)


def issue_authorization_code(application, session, redirect_uri, scopes, nonce, code_challenge, code_challenge_method):
    code = secrets.token_urlsafe(48)
    AuthorizationCode.issue(
        code,
        application=application,
        session=session,
        redirect_uri=redirect_uri,
        scopes=scopes,
        nonce=nonce or "",
        code_challenge=code_challenge,
        code_challenge_method=code_challenge_method or "S256",
    )
    return code


def verify_code_verifier(challenge, verifier):
    digest = hashlib.sha256(verifier.encode()).digest()
    return secrets.compare_digest(challenge, b64url(digest))


def consume_authorization_code(raw_code, application, redirect_uri, verifier):
    digest = hash_value(raw_code)
    with transaction.atomic():
        code = AuthorizationCode.objects.select_for_update().select_related("session__user", "session__tenant").filter(code_hash=digest).first()
        if not code or code.application_id != application.id or code.redirect_uri != redirect_uri:
            raise IdentityError("invalid_grant", "The authorization code is invalid.")
        if code.consumed_at or code.expires_at <= timezone.now() or not code.session.is_active:
            raise IdentityError("invalid_grant", "The authorization code is expired or already used.")
        if code.code_challenge_method != "S256" or not verifier or not verify_code_verifier(code.code_challenge, verifier):
            raise IdentityError("invalid_grant", "The PKCE verifier is invalid.")
        code.consumed_at = timezone.now()
        code.save(update_fields=["consumed_at"])
    return code


def token_claims(session, application, scopes, nonce=None, include_identity=False):
    membership = membership_for(session.user, session.tenant)
    now = timezone.now()
    payload = {
        "iss": settings.IDENTITY_ISSUER,
        "sub": str(session.user_id),
        "aud": application.client_id,
        "exp": now + timedelta(seconds=settings.IDENTITY_TOKEN_LIFETIME_SECONDS),
        "iat": now,
        "auth_time": int(session.auth_time.timestamp()),
        "amr": session.authentication_methods,
        "acr": "urn:qts:acr:mfa" if len(session.authentication_methods) > 1 else "urn:qts:acr:pwd",
        "sid": str(session.id),
        "tid": str(session.tenant_id),
        "pver": membership.policy_version,
        "roles": membership_roles(membership),
        "permissions": sorted(effective_permissions(membership)),
        "scope": " ".join(scopes),
    }
    if include_identity:
        payload.update({"email": session.user.email, "name": session.user.display_name})
        if nonce:
            payload["nonce"] = nonce
    return payload


def encode_token(payload):
    key = active_signing_key()
    return jwt.encode(payload, signing_private_key(key), algorithm="RS256", headers={"kid": key.kid, "typ": "JWT"})


def decode_token(raw_token, *, verify_audience=None):
    header = jwt.get_unverified_header(raw_token)
    key = SigningKey.objects.filter(kid=header.get("kid"), is_active=True).first()
    if not key:
        raise IdentityError("invalid_token", "The signing key is not recognized.", 401)
    kwargs = {"algorithms": ["RS256"], "issuer": settings.IDENTITY_ISSUER}
    if verify_audience:
        kwargs["audience"] = verify_audience
    else:
        kwargs["options"] = {"verify_aud": False}
    try:
        payload = jwt.decode(raw_token, serialization.load_pem_public_key(
            signing_private_key(key).public_key().public_bytes(serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo)
        ), **kwargs)
    except jwt.PyJWTError as error:
        raise IdentityError("invalid_token", "The token is invalid or expired.", 401) from error
    session = IdentitySession.objects.select_related("user", "tenant").filter(id=payload.get("sid")).first()
    if not session or not session.is_active or str(session.user_id) != payload.get("sub"):
        raise IdentityError("invalid_token", "The session is no longer active.", 401)
    membership = membership_for(session.user, session.tenant)
    if payload.get("pver") != membership.policy_version:
        raise IdentityError("invalid_token", "The authorization policy has changed.", 401)
    return payload, session, membership


def issue_token_set(session, application, scopes, nonce=None, include_refresh=False):
    access = encode_token(token_claims(session, application, scopes))
    identity = encode_token(token_claims(session, application, scopes, nonce, include_identity=True))
    result = {
        "access_token": access,
        "id_token": identity,
        "token_type": "Bearer",
        "expires_in": settings.IDENTITY_TOKEN_LIFETIME_SECONDS,
        "scope": " ".join(scopes),
    }
    if include_refresh:
        lifetime = min(max(1, session.tenant.session_max_days), min(30, settings.IDENTITY_REFRESH_LIFETIME_DAYS))
        family = RefreshTokenFamily.objects.create(
            session=session,
            application=application,
            expires_at=min(session.expires_at, timezone.now() + timedelta(days=lifetime)),
        )
        raw_refresh = secrets.token_urlsafe(64)
        RefreshToken.issue(raw_refresh, family)
        result["refresh_token"] = raw_refresh
    return result


def rotate_refresh_token(raw_refresh, application):
    digest = hash_value(raw_refresh)
    reuse = False
    with transaction.atomic():
        token = RefreshToken.objects.select_for_update().select_related("family__session__user", "family__session__tenant", "family__application").filter(token_hash=digest).first()
        if not token or token.family.application_id != application.id:
            raise IdentityError("invalid_grant", "The refresh token is invalid.")
        family = token.family
        session = family.session
        if token.used_at or token.revoked_at or family.revoked_at or token.expires_at <= timezone.now() or not family.session.is_active:
            reuse = True
        elif token.used_at is None:
            token.used_at = timezone.now()
            token.save(update_fields=["used_at"])
            raw_next = secrets.token_urlsafe(64)
            RefreshToken.issue(raw_next, family)
    if reuse:
        family.revoke(reuse=True)
        session.revoke("refresh_token_reuse")
        audit(None, "identity.refresh.reuse_detected", tenant=session.tenant, actor=session.user, target=family, outcome="failure")
        raise IdentityError("invalid_grant", "The refresh token is invalid.")
    token_set = issue_token_set(session, application, ["openid", "profile", "email"])
    token_set["refresh_token"] = raw_next
    return token_set


def revoke_refresh_token(raw_refresh):
    token = RefreshToken.objects.select_related("family").filter(token_hash=hash_value(raw_refresh)).first()
    if token:
        token.family.revoke()
