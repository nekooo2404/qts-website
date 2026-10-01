#!/usr/bin/env bash
# Generate missing local Ory/Spring secrets; never replace existing credentials.
set -Eeuo pipefail

ENV_FILE="${1:?usage: scripts/configure-ory-env.sh <env-file>}"
[[ -f "$ENV_FILE" ]] || { echo "ERROR: missing env file: $ENV_FILE" >&2; exit 1; }

declare -A env
while IFS= read -r line || [[ -n "$line" ]]; do
  [[ -z "$line" || "$line" == \#* || "$line" != *=* ]] && continue
  key="${line%%=*}"
  value="${line#*=}"
  key="${key%$'\r'}"
  value="${value%$'\r'}"
  env["$key"]="$value"
done < "$ENV_FILE"

secret_hex() {
  local bytes="$1"
  od -An -N "$bytes" -tx1 /dev/urandom | tr -d ' \n'
}

ensure_secret() {
  local key="$1" bytes="${2:-32}"
  if [[ -z "${env[$key]:-}" || "${env[$key]}" == replace-* ]]; then
    env["$key"]="$(secret_hex "$bytes")"
  fi
}

safe_database_password() {
  [[ "$1" =~ ^[A-Za-z0-9._~-]+$ ]]
}

ensure_dsn() {
  local provider="$1"
  local key="ORY_${provider}_DSN"
  local password_key="ORY_${provider}_DB_PASSWORD"
  local name="${provider,,}"
  if [[ -n "${env[$key]:-}" ]]; then
    return
  fi
  if ! safe_database_password "${env[$password_key]}"; then
    echo "ERROR: $password_key contains characters that need URL encoding; set $key explicitly." >&2
    exit 1
  fi
  env["$key"]="postgres://${name}:${env[$password_key]}@${name}-db:5432/${name}?sslmode=disable"
}

ensure_secret POSTGRES_PASSWORD 32
ensure_secret IDENTITY_SIGNING_KEY_PASSPHRASE 32
ensure_secret ORY_HYDRA_DB_PASSWORD 32
ensure_secret ORY_KRATOS_DB_PASSWORD 32
ensure_secret ORY_HYDRA_SYSTEM_SECRET 32
ensure_secret ORY_KRATOS_COOKIE_SECRET 32
ensure_secret ORY_KRATOS_CIPHER_SECRET 16

ensure_dsn HYDRA
ensure_dsn KRATOS

if [[ -z "${env[IDENTITY_FLYWAY_ENABLED]:-}" ]]; then
  env["IDENTITY_FLYWAY_ENABLED"]="true"
fi
if [[ -z "${env[LEAD_FLYWAY_ENABLED]:-}" ]]; then
  env["LEAD_FLYWAY_ENABLED"]="true"
fi
if [[ -z "${env[EVENT_FLYWAY_ENABLED]:-}" ]]; then
  env["EVENT_FLYWAY_ENABLED"]="true"
fi
if [[ -z "${env[ATTENDANCE_FLYWAY_ENABLED]:-}" ]]; then
  env["ATTENDANCE_FLYWAY_ENABLED"]="true"
fi
if [[ -z "${env[QTS_IDENTITY_BOOTSTRAP_ENABLED]:-}" ]]; then
  env["QTS_IDENTITY_BOOTSTRAP_ENABLED"]="true"
fi
if [[ -z "${env[QTS_SECURITY_ENABLED]:-}" ]]; then
  env["QTS_SECURITY_ENABLED"]="true"
fi
if [[ -z "${env[QTS_SECURITY_CORS_ALLOWED_ORIGINS]:-}" ]]; then
  env["QTS_SECURITY_CORS_ALLOWED_ORIGINS"]="http://localhost:3001,http://localhost:5174,http://localhost:5175"
fi

tmp="$(mktemp)"
{
  echo "# Secrets generated locally; never commit this file."
  for key in "${!env[@]}"; do
    printf '%s=%s\n' "$key" "${env[$key]}"
  done | sort
} > "$tmp"
install -m 600 "$tmp" "$ENV_FILE"
rm -f "$tmp"

echo "Missing Ory/Spring secrets generated; existing credentials preserved."
