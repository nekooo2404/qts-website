#!/usr/bin/env bash
# Validate production configuration without printing values or loading secrets into the shell.
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${1:-$ROOT_DIR/.env.production}"
[[ -f "$ENV_FILE" ]] || { echo "ERROR: missing production environment file" >&2; exit 1; }

declare -A env
while IFS= read -r line || [[ -n "$line" ]]; do
  [[ -z "$line" || "$line" == \#* || "$line" != *=* ]] && continue
  key="${line%%=*}"
  value="${line#*=}"
  key="${key%$'\r'}"
  value="${value%$'\r'}"
  env["$key"]="$value"
done < "$ENV_FILE"

fail() { echo "ERROR: $1" >&2; exit 1; }
require() { [[ -n "${env[$1]:-}" ]] || fail "missing required setting: $1"; }
contains() { [[ ",${1}," == *",${2},"* ]]; }
resolve_host() {
  local host="$1"
  if command -v getent >/dev/null 2>&1 && getent ahosts "$host" >/dev/null 2>&1; then
    return 0
  fi
  if command -v nslookup >/dev/null 2>&1 && nslookup "$host" >/dev/null 2>&1; then
    return 0
  fi
  if command -v dig >/dev/null 2>&1 && dig +short "$host" >/dev/null 2>&1; then
    return 0
  fi
  return 1
}
origin() {
  local url="$1" remainder
  [[ "$url" =~ ^https://[^/?#]+(/.*)?$ ]] || return 1
  remainder="${url#https://}"
  printf 'https://%s' "${remainder%%/*}"
}
valid_public_url() {
  local value="$1"
  [[ "$value" =~ ^https://[^/?#]+(/.*)?$ ]] || return 1
  [[ "$value" != *"*"* && "$value" != *localhost* && "$value" != *example* && "$value" != *replace-* && "$value" != *demo* ]]
}

for key in \
  COMPOSE_PROJECT_NAME POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD \
  IDENTITY_ISSUER IDENTITY_WEB_ORIGIN IDENTITY_API_ORIGIN IDENTITY_BRIDGE_ORIGIN IDENTITY_SIGNING_KEY_PASSPHRASE \
  IDENTITY_PROVIDER ORY_HYDRA_ISSUER_BROWSER_URL ORY_KRATOS_BROWSER_URL ORY_HYDRA_ADMIN_URL ORY_KRATOS_INTERNAL_PUBLIC_URL ORY_KRATOS_ADMIN_URL ORY_KRATOS_SESSION_COOKIE ORY_HYDRA_CLIENT_ID_PORTAL ORY_HYDRA_CLIENT_ID_HRM ORY_HYDRA_LOGIN_URL ORY_HYDRA_CONSENT_URL ORY_HYDRA_LOGOUT_URL ORY_API_AUDIENCE ORY_HYDRA_DSN ORY_KRATOS_DSN ORY_HYDRA_DB_PASSWORD ORY_KRATOS_DB_PASSWORD ORY_HYDRA_SYSTEM_SECRET ORY_KRATOS_COOKIE_SECRET ORY_KRATOS_CIPHER_SECRET \
  IDENTITY_PRIMARY_DOMAIN IDENTITY_REQUIRE_MFA SEED_DEMO_USERS \
  QTS_SECURITY_ENABLED QTS_SECURITY_CORS_ALLOWED_ORIGINS QTS_IDENTITY_ISSUER QTS_IDENTITY_JWK_SET_URI QTS_IDENTITY_AUDIENCE QTS_IDENTITY_BRIDGE_ENABLED QTS_IDENTITY_BOOTSTRAP_ENABLED LEAD_FLYWAY_ENABLED EVENT_FLYWAY_ENABLED ATTENDANCE_FLYWAY_ENABLED IDENTITY_FLYWAY_ENABLED \
  HRM_FLYWAY_ENABLED HRM_MAX_PAGE_SIZE \
  QTS_EVENT_POLL_ENABLED QTS_EVENT_MAIL_ENABLED MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE \
  VITE_IDENTITY_ISSUER VITE_API_ISSUER VITE_IDENTITY_WEB_ORIGIN \
  VITE_PORTAL_OIDC_CLIENT_ID VITE_PORTAL_OIDC_REDIRECT_URI VITE_PORTAL_OIDC_POST_LOGOUT_REDIRECT_URI \
  VITE_HRM_OIDC_CLIENT_ID VITE_ALLOW_INSECURE_LOCAL_OIDC VITE_HRM_OIDC_REDIRECT_URI VITE_HRM_OIDC_POST_LOGOUT_REDIRECT_URI; do
  require "$key"
done

[[ "${env[IDENTITY_PROVIDER]}" == "ory" ]] || fail "IDENTITY_PROVIDER must be ory"
[[ "${env[QTS_LEGACY_BACKEND_ROLLBACK]:-false}" != "true" ]] || fail "retired backend rollback is disabled; production deploy must use Spring services"
[[ "${env[ORY_API_AUDIENCE]}" == "qts-api" ]] || fail "ORY_API_AUDIENCE must be qts-api"
[[ "${env[SEED_DEMO_USERS]}" == "false" ]] || fail "SEED_DEMO_USERS must be false"
[[ "${env[QTS_SECURITY_ENABLED]}" == "true" ]] || fail "QTS_SECURITY_ENABLED must be true"
[[ "${env[VITE_ALLOW_INSECURE_LOCAL_OIDC]}" == "false" ]] || fail "VITE_ALLOW_INSECURE_LOCAL_OIDC must be false in production"
[[ "${env[VITE_ALLOW_BROWSER_TOKEN_STORAGE]:-false}" != "true" ]] || fail "VITE_ALLOW_BROWSER_TOKEN_STORAGE must not be true in production"
[[ "${env[VITE_OIDC_SESSION_PERSISTENCE]:-memory}" != "session" ]] || fail "VITE_OIDC_SESSION_PERSISTENCE must not be session in production"
[[ "${env[QTS_IDENTITY_AUDIENCE]}" == "qts-api" ]] || fail "QTS_IDENTITY_AUDIENCE must be qts-api"
[[ "${env[LEAD_FLYWAY_ENABLED]}" == "true" ]] || fail "LEAD_FLYWAY_ENABLED must be true"
[[ "${env[EVENT_FLYWAY_ENABLED]}" == "true" ]] || fail "EVENT_FLYWAY_ENABLED must be true"
[[ "${env[ATTENDANCE_FLYWAY_ENABLED]}" == "true" ]] || fail "ATTENDANCE_FLYWAY_ENABLED must be true"
[[ "${env[IDENTITY_FLYWAY_ENABLED]}" == "true" ]] || fail "IDENTITY_FLYWAY_ENABLED must be true"
[[ "${env[QTS_IDENTITY_BOOTSTRAP_ENABLED]}" == "true" ]] || fail "QTS_IDENTITY_BOOTSTRAP_ENABLED must be true"
[[ "${env[ORY_HYDRA_LOGIN_URL]}" == "${env[IDENTITY_WEB_ORIGIN]}/identity-api/oauth/ory/login" ]] || fail "ORY_HYDRA_LOGIN_URL must point to the current bridge"
[[ "${env[ORY_HYDRA_CONSENT_URL]}" == "${env[IDENTITY_WEB_ORIGIN]}/identity-api/oauth/ory/consent" ]] || fail "ORY_HYDRA_CONSENT_URL must point to the current bridge"
[[ "${env[ORY_HYDRA_LOGOUT_URL]}" == "${env[IDENTITY_WEB_ORIGIN]}/identity-api/oauth/ory/logout" ]] || fail "ORY_HYDRA_LOGOUT_URL must point to the current bridge"
[[ "${env[QTS_IDENTITY_ISSUER]}" == "${env[ORY_HYDRA_ISSUER_BROWSER_URL]}" ]] || fail "QTS_IDENTITY_ISSUER must match ORY_HYDRA_ISSUER_BROWSER_URL"
[[ "${env[VITE_IDENTITY_ISSUER]}" == "${env[ORY_HYDRA_ISSUER_BROWSER_URL]}" ]] || fail "VITE_IDENTITY_ISSUER must match ORY_HYDRA_ISSUER_BROWSER_URL"
[[ "${env[VITE_API_ISSUER]}" == "${env[IDENTITY_ISSUER]}" ]] || fail "VITE_API_ISSUER must match IDENTITY_ISSUER"
[[ "${env[VITE_IDENTITY_WEB_ORIGIN]}" == "${env[IDENTITY_WEB_ORIGIN]}" ]] || fail "VITE_IDENTITY_WEB_ORIGIN must match IDENTITY_WEB_ORIGIN"
[[ "${env[PORTAL_OIDC_REDIRECT_URI]:-${env[VITE_PORTAL_OIDC_REDIRECT_URI]}}" == "${env[VITE_PORTAL_OIDC_REDIRECT_URI]}" ]] || fail "Portal redirect settings differ"
[[ "${env[PORTAL_OIDC_POST_LOGOUT_REDIRECT_URI]:-${env[VITE_PORTAL_OIDC_POST_LOGOUT_REDIRECT_URI]}}" == "${env[VITE_PORTAL_OIDC_POST_LOGOUT_REDIRECT_URI]}" ]] || fail "Portal post-logout settings differ"
[[ "${env[HRM_OIDC_REDIRECT_URI]:-${env[VITE_HRM_OIDC_REDIRECT_URI]}}" == "${env[VITE_HRM_OIDC_REDIRECT_URI]}" ]] || fail "HRM redirect settings differ"
[[ "${env[HRM_OIDC_POST_LOGOUT_REDIRECT_URI]:-${env[VITE_HRM_OIDC_POST_LOGOUT_REDIRECT_URI]}}" == "${env[VITE_HRM_OIDC_POST_LOGOUT_REDIRECT_URI]}" ]] || fail "HRM post-logout settings differ"

for key in IDENTITY_ISSUER IDENTITY_WEB_ORIGIN ORY_HYDRA_ISSUER_BROWSER_URL ORY_HYDRA_LOGIN_URL ORY_HYDRA_CONSENT_URL ORY_HYDRA_LOGOUT_URL QTS_IDENTITY_ISSUER QTS_IDENTITY_JWK_SET_URI VITE_API_ISSUER VITE_IDENTITY_ISSUER VITE_PORTAL_OIDC_REDIRECT_URI VITE_PORTAL_OIDC_POST_LOGOUT_REDIRECT_URI VITE_HRM_OIDC_REDIRECT_URI VITE_HRM_OIDC_POST_LOGOUT_REDIRECT_URI; do
  valid_public_url "${env[$key]}" || fail "$key must be a non-placeholder HTTPS URL without wildcards"
done

portal_origin="$(origin "${env[VITE_PORTAL_OIDC_REDIRECT_URI]}")" || fail "invalid Portal redirect URI"
hrm_origin="$(origin "${env[VITE_HRM_OIDC_REDIRECT_URI]}")" || fail "invalid HRM redirect URI"
identity_origin="$(origin "${env[IDENTITY_WEB_ORIGIN]}")" || fail "invalid Identity web origin"
[[ "${env[VITE_PORTAL_OIDC_REDIRECT_URI]}" == "$portal_origin/auth/callback" ]] || fail "Portal redirect URI must end in /auth/callback"
[[ "${env[VITE_PORTAL_OIDC_POST_LOGOUT_REDIRECT_URI]}" == "$portal_origin/" ]] || fail "Portal post-logout URI must be its origin root"
[[ "${env[VITE_HRM_OIDC_REDIRECT_URI]}" == "$hrm_origin/auth/callback" ]] || fail "HRM redirect URI must end in /auth/callback"
[[ "${env[VITE_HRM_OIDC_POST_LOGOUT_REDIRECT_URI]}" == "$hrm_origin/" ]] || fail "HRM post-logout URI must be its origin root"
[[ "${env[QTS_SECURITY_CORS_ALLOWED_ORIGINS]}" != *"*"* && "${env[QTS_SECURITY_CORS_ALLOWED_ORIGINS]}" != *localhost* && "${env[QTS_SECURITY_CORS_ALLOWED_ORIGINS]}" != *example* ]] || fail "QTS_SECURITY_CORS_ALLOWED_ORIGINS must be an explicit production origin allowlist"
contains "${env[QTS_SECURITY_CORS_ALLOWED_ORIGINS]}" "$identity_origin" || fail "QTS_SECURITY_CORS_ALLOWED_ORIGINS omits Identity"
contains "${env[QTS_SECURITY_CORS_ALLOWED_ORIGINS]}" "$portal_origin" || fail "QTS_SECURITY_CORS_ALLOWED_ORIGINS omits Portal"
contains "${env[QTS_SECURITY_CORS_ALLOWED_ORIGINS]}" "$hrm_origin" || fail "QTS_SECURITY_CORS_ALLOWED_ORIGINS omits HRM"
if [[ -n "${env[CORS_ALLOWED_ORIGINS]:-}" ]]; then
  contains "${env[CORS_ALLOWED_ORIGINS]}" "$portal_origin" || fail "CORS_ALLOWED_ORIGINS omits Portal"
  contains "${env[CORS_ALLOWED_ORIGINS]}" "$hrm_origin" || fail "CORS_ALLOWED_ORIGINS omits HRM"
fi

for public_origin in "${env[IDENTITY_WEB_ORIGIN]}" "$portal_origin" "$hrm_origin"; do
  public_host="${public_origin#https://}"
  public_host="${public_host%%/*}"
  resolve_host "$public_host" || fail "DNS name does not resolve: $public_host"
done

for key in "${!env[@]}"; do
  [[ "$key" == VITE_* ]] || continue
  [[ ! "$key" =~ (SECRET|PASSWORD|PASSPHRASE|PRIVATE|API_KEY|ACCESS_TOKEN|REFRESH_TOKEN|KC_) ]] || fail "sensitive setting must not use a VITE_ name"
done

case "$(uname -s 2>/dev/null || printf unknown)" in
  MINGW*|MSYS*|CYGWIN*)
    ;;
  *)
    if mode="$(stat -c '%a' "$ENV_FILE" 2>/dev/null)"; then
      (( (8#$mode & 8#077) == 0 )) || fail "production environment file must not be readable by group or others"
    fi
    ;;
esac

if [[ "${env[ORY_EMAIL_FLOWS_ENABLED]:-false}" == "true" ]]; then
  require ORY_SMTP_CONNECTION_URI
fi

if [[ "${env[QTS_EVENT_MAIL_ENABLED]}" == "true" ]]; then
  require SMTP_HOST
  require SMTP_PORT
  require SMTP_USERNAME
  require SMTP_PASSWORD
  [[ "${env[SMTP_HOST]}" != "localhost" && "${env[SMTP_HOST]}" != "mailpit" ]] || fail "SMTP_HOST must be a production mail host when QTS_EVENT_MAIL_ENABLED=true"
fi
cd "$ROOT_DIR"
docker compose \
  --env-file "$ENV_FILE" \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  -f docker-compose.spring.yml \
  -f docker-compose.spring.prod.yml \
  --profile prod \
  --profile spring \
  --profile spring-events \
  --profile spring-attendance \
  --profile spring-identity-admin \
  --profile spring-identity-bridge \
  --profile spring-hrm \
  config --quiet

docker compose \
  --env-file "$ENV_FILE" \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  -f docker-compose.spring.yml \
  -f docker-compose.spring.prod.yml \
  -f docker-compose.spring.cutover.yml \
  --profile prod \
  --profile spring \
  --profile spring-events \
  --profile spring-attendance \
  --profile spring-identity-admin \
  --profile spring-identity-bridge \
  --profile spring-hrm \
  config --quiet

echo "Production environment structure is valid."
