#!/usr/bin/env bash
# Synchronize first-party Ory Hydra clients without depending on any retired backend.
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${1:-$ROOT_DIR/.env.production}"
[[ -f "$ENV_FILE" ]] || { echo "ERROR: missing environment file: $ENV_FILE" >&2; exit 1; }

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
require_command() { command -v "$1" >/dev/null 2>&1 || fail "missing required command: $1"; }
require() { [[ -n "${env[$1]:-}" ]] || fail "missing required setting: $1"; }

json_escape() {
  local value="$1"
  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  value="${value//$'\n'/\\n}"
  value="${value//$'\r'/}"
  printf '%s' "$value"
}

safe_client_id() {
  [[ "$1" =~ ^[A-Za-z0-9._~-]+$ ]] || fail "unsafe Ory client id: $1"
}

client_payload() {
  local client_id="$1" redirect_uri="$2" logout_uri="$3" audience="$4"
  cat <<JSON
{
  "client_id": "$(json_escape "$client_id")",
  "client_name": "$(json_escape "$client_id")",
  "redirect_uris": ["$(json_escape "$redirect_uri")"],
  "post_logout_redirect_uris": ["$(json_escape "$logout_uri")"],
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "scope": "openid profile email offline_access",
  "audience": ["$(json_escape "$audience")"],
  "token_endpoint_auth_method": "none",
  "subject_type": "public",
  "access_token_strategy": "jwt",
  "skip_consent": false
}
JSON
}

sync_client() {
  local client_id="$1" redirect_uri="$2" logout_uri="$3"
  local hydra_admin="${env[ORY_HYDRA_ADMIN_HOST_URL]:-${env[ORY_HYDRA_ADMIN_URL]}}"
  if [[ "$hydra_admin" == "http://hydra:4445"* ]]; then
    hydra_admin="http://127.0.0.1:4445${hydra_admin#http://hydra:4445}"
  fi
  hydra_admin="${hydra_admin%/}"
  local audience="${env[ORY_API_AUDIENCE]}"
  local clients_url="$hydra_admin/admin/clients"
  local target="$clients_url/$client_id"
  local tmp status payload

  safe_client_id "$client_id"
  payload="$(client_payload "$client_id" "$redirect_uri" "$logout_uri" "$audience")"
  tmp="$(mktemp)"
  status="$(curl -sS -o "$tmp" -w '%{http_code}' "$target" || true)"
  case "$status" in
    200)
      curl -fsS -X PUT "$target" \
        -H 'Content-Type: application/json' \
        --data "$payload" >/dev/null
      ;;
    404)
      curl -fsS -X POST "$clients_url" \
        -H 'Content-Type: application/json' \
        --data "$payload" >/dev/null
      ;;
    *)
      rm -f "$tmp"
      fail "Hydra client lookup failed for $client_id with HTTP $status"
      ;;
  esac
  rm -f "$tmp"
  curl -fsS "$target" >/dev/null
  printf 'Verified Hydra client: %s\n' "$client_id"
}

require_command curl
require_command mktemp

for key in \
  ORY_HYDRA_ADMIN_URL ORY_API_AUDIENCE \
  ORY_HYDRA_CLIENT_ID_PORTAL VITE_PORTAL_OIDC_REDIRECT_URI VITE_PORTAL_OIDC_POST_LOGOUT_REDIRECT_URI \
  ORY_HYDRA_CLIENT_ID_HRM VITE_HRM_OIDC_REDIRECT_URI VITE_HRM_OIDC_POST_LOGOUT_REDIRECT_URI; do
  require "$key"
done

sync_client "${env[ORY_HYDRA_CLIENT_ID_PORTAL]}" \
  "${env[VITE_PORTAL_OIDC_REDIRECT_URI]}" \
  "${env[VITE_PORTAL_OIDC_POST_LOGOUT_REDIRECT_URI]}"

sync_client "${env[ORY_HYDRA_CLIENT_ID_HRM]}" \
  "${env[VITE_HRM_OIDC_REDIRECT_URI]}" \
  "${env[VITE_HRM_OIDC_POST_LOGOUT_REDIRECT_URI]}"

echo "First-party Ory clients are synchronized."
