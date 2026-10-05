#!/usr/bin/env bash
# Prepare/run an isolated Spring/Ory stack. Never targets production Compose.
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

START=false
if [[ "${1:-}" == "--start" ]]; then
  START=true
elif [[ -n "${1:-}" ]]; then
  echo "usage: scripts/setup-ory-tests.sh [--start]" >&2
  exit 2
fi

HYDRA_ISSUER="http://localhost:4446/"
SECRET_DIR="$ROOT_DIR/.secrets"
ENV_FILE="$SECRET_DIR/ory-e2e.env"
mkdir -p "$SECRET_DIR"

upsert_env() {
  local key="$1" value="$2" tmp
  touch "$ENV_FILE"
  tmp="$(mktemp)"
  grep -vE "^${key}=" "$ENV_FILE" > "$tmp" || true
  printf '%s=%s\n' "$key" "$value" >> "$tmp"
  install -m 600 "$tmp" "$ENV_FILE"
  rm -f "$tmp"
}

secret_hex() {
  od -An -N "${1:-16}" -tx1 /dev/urandom | tr -d ' \n'
}

if [[ ! -f "$ENV_FILE" ]]; then
  grep -E '^[A-Za-z_][A-Za-z0-9_]*=' .env.example > "$ENV_FILE" || true
  chmod 600 "$ENV_FILE"
fi

bash scripts/configure-ory-env.sh "$ENV_FILE"
# Isolated env files persist; copy any keys added later to .env.example.
while IFS= read -r line || [[ -n "$line" ]]; do
  [[ -z "$line" || "$line" == \#* || "$line" != *=* ]] && continue
  key="${line%%=*}"
  key="${key%$'\r'}"
  value="${line#*=}"
  value="${value%$'\r'}"
  if ! grep -qE "^${key}=" "$ENV_FILE"; then
    upsert_env "$key" "$value"
  fi
done < .env.example
upsert_env COMPOSE_PROJECT_NAME qtsss-ory-check
upsert_env IDENTITY_PROVIDER ory
upsert_env IDENTITY_WEB_ORIGIN http://localhost:3018
upsert_env VITE_IDENTITY_WEB_ORIGIN http://localhost:3018
upsert_env ORY_HYDRA_ISSUER_BROWSER_URL "$HYDRA_ISSUER"
upsert_env ORY_HYDRA_ADMIN_HOST_URL http://127.0.0.1:4447
upsert_env QTS_IDENTITY_ISSUER "$HYDRA_ISSUER"
upsert_env VITE_IDENTITY_ISSUER "$HYDRA_ISSUER"
upsert_env VITE_API_ISSUER http://localhost:18084
upsert_env VITE_HRM_API_ISSUER http://localhost:18086
upsert_env ORY_KRATOS_BROWSER_URL http://localhost:3018/kratos
upsert_env VITE_PORTAL_OIDC_REDIRECT_URI http://localhost:5184/auth/callback
upsert_env VITE_PORTAL_OIDC_POST_LOGOUT_REDIRECT_URI http://localhost:5184/
upsert_env VITE_HRM_OIDC_REDIRECT_URI http://localhost:5185/auth/callback
upsert_env VITE_HRM_OIDC_POST_LOGOUT_REDIRECT_URI http://localhost:5185/
upsert_env QTS_IDENTITY_JWK_SET_URI http://hydra:4444/.well-known/jwks.json
upsert_env QTS_IDENTITY_AUDIENCE qts-api
upsert_env QTS_IDENTITY_BRIDGE_ENABLED true
upsert_env LEAD_FLYWAY_ENABLED true
upsert_env EVENT_FLYWAY_ENABLED true
upsert_env ATTENDANCE_FLYWAY_ENABLED true
upsert_env IDENTITY_FLYWAY_ENABLED true
upsert_env HRM_FLYWAY_ENABLED true
upsert_env QTS_EVENT_POLL_ENABLED false
upsert_env QTS_EVENT_MAIL_ENABLED false
upsert_env QTS_SECURITY_ENABLED true
upsert_env QTS_SECURITY_CORS_ALLOWED_ORIGINS "http://localhost:3018,http://localhost:5184,http://localhost:5185"
upsert_env QTS_IDENTITY_BOOTSTRAP_ENABLED true
upsert_env IDENTITY_PRIMARY_DOMAIN qts.com
upsert_env IDENTITY_REQUIRE_MFA true
upsert_env SEED_DEMO_USERS false
upsert_env BOOTSTRAP_SUPERADMIN_EMAIL ory-e2e@qts.com
upsert_env BOOTSTRAP_SUPERADMIN_NAME "Ory E2E"
if ! grep -q '^BOOTSTRAP_SUPERADMIN_PASSWORD=' "$ENV_FILE"; then
  upsert_env BOOTSTRAP_SUPERADMIN_PASSWORD "Qts!$(secret_hex 18)7aA"
fi

COMPOSE=(
  docker compose
  --project-name qtsss-ory-check
  --env-file "$ENV_FILE"
  -f docker-compose.yml
  -f docker-compose.prod.yml
  -f docker-compose.spring.yml
  -f docker-compose.spring.prod.yml
  -f docker-compose.spring.cutover.yml
  -f docker-compose.ory-test.yml
  --profile prod
  --profile spring
  --profile spring-events
  --profile spring-attendance
  --profile spring-identity-admin
  --profile spring-identity-bridge
  --profile spring-hrm
  --profile dev-mail
)

"${COMPOSE[@]}" config --quiet
if [[ "$START" != true ]]; then
  echo "Isolated Spring/Ory configuration ready. Use --start to build and provision."
  exit 0
fi

"${COMPOSE[@]}" up --build -d --wait \
  db redis hydra kratos \
  lead-service event-service attendance-service identity-admin-service identity-bridge-service \
  mailpit

bash scripts/sync-ory-clients.sh "$ENV_FILE"

credentials="$SECRET_DIR/ory-e2e-user.json"
if [[ ! -f "$credentials" ]]; then
  email="$(grep -E '^BOOTSTRAP_SUPERADMIN_EMAIL=' "$ENV_FILE" | tail -n1 | cut -d= -f2-)"
  password="$(grep -E '^BOOTSTRAP_SUPERADMIN_PASSWORD=' "$ENV_FILE" | tail -n1 | cut -d= -f2-)"
  tmp="$(mktemp)"
  printf '{"email":"%s","password":"%s"}\n' "$email" "$password" > "$tmp"
  install -m 600 "$tmp" "$credentials"
  rm -f "$tmp"
fi

echo "Isolated Spring/Ory fixture ready. Credentials remain under .secrets; no email sent."
