import hashlib
import json
import uuid

import jwt
import requests
from django.conf import settings
from django.core.cache import cache

from .models import User
from .services import IdentityError, membership_for, resolve_tenant


JWKS_TIMEOUT_SECONDS = 5


def keycloak_enabled():
    return settings.IDENTITY_PROVIDER == "keycloak"


def jwks_cache_key():
    issuer_hash = hashlib.sha256(settings.KEYCLOAK_INTERNAL_ISSUER.encode()).hexdigest()
    return f"identity:keycloak:jwks:{issuer_hash}"


def fetch_jwks(*, force=False):
    key = jwks_cache_key()
    if not force:
        cached = cache.get(key)
        if cached is not None:
            return cached
    try:
        response = requests.get(
            f"{settings.KEYCLOAK_INTERNAL_ISSUER.rstrip('/')}/protocol/openid-connect/certs",
            timeout=JWKS_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        key_set = response.json()
    except (requests.RequestException, ValueError) as error:
        raise IdentityError("invalid_token", "The token signing keys are unavailable.", 401) from error
    if not isinstance(key_set, dict) or not isinstance(key_set.get("keys"), list):
        raise IdentityError("invalid_token", "The token signing keys are invalid.", 401)
    cache.set(key, key_set, timeout=settings.KEYCLOAK_JWKS_CACHE_SECONDS)
    return key_set


def signing_jwk(raw_token):
    try:
        header = jwt.get_unverified_header(raw_token)
    except jwt.PyJWTError as error:
        raise IdentityError("invalid_token", "The token is invalid or expired.", 401) from error
    if header.get("alg") != "RS256" or not isinstance(header.get("kid"), str):
        raise IdentityError("invalid_token", "The token signing algorithm is not permitted.", 401)

    def matching_key(key_set):
        return next(
            (
                key
                for key in key_set["keys"]
                if key.get("kid") == header["kid"] and key.get("kty") == "RSA" and key.get("alg", "RS256") == "RS256"
            ),
            None,
        )

    jwk = matching_key(fetch_jwks())
    if not jwk:
        jwk = matching_key(fetch_jwks(force=True))
    if not jwk:
        raise IdentityError("invalid_token", "The token signing key is not recognized.", 401)
    return jwk


def decode_token(raw_token):
    try:
        public_key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(signing_jwk(raw_token)))
        claims = jwt.decode(
            raw_token,
            public_key,
            algorithms=["RS256"],
            audience=settings.KEYCLOAK_AUDIENCE,
            issuer=settings.KEYCLOAK_ISSUER,
            options={"require": ["exp", "sub", "iss", "aud"]},
        )
        subject = uuid.UUID(str(claims["sub"]))
    except (KeyError, TypeError, ValueError, jwt.PyJWTError) as error:
        raise IdentityError("invalid_token", "The token is invalid or expired.", 401) from error

    user = User.objects.filter(keycloak_id=subject, is_active=True).first()
    if not user:
        raise IdentityError("invalid_token", "The token subject is not available.", 401)
    tenant = resolve_tenant(user.email)
    if not tenant:
        raise IdentityError("invalid_token", "The token organization is not available.", 401)
    try:
        membership = membership_for(user, tenant)
    except IdentityError as error:
        raise IdentityError("invalid_token", "The token subject is not available.", 401) from error
    return claims, None, membership
