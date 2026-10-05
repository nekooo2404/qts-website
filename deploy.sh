#!/usr/bin/env bash
# QTS production deploy: validate -> backup -> build -> start Spring cutover -> verify
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

ENV_FILE="${ENV_FILE:-.env.production}"
if [[ "$ENV_FILE" != /* ]]; then
  ENV_FILE="$SCRIPT_DIR/$ENV_FILE"
fi

PROJECT_NAME="${COMPOSE_PROJECT_NAME:-qtsss}"
BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/backups}"
PRODUCTION_IPV4="${PRODUCTION_IPV4:-103.75.185.136}"
PUBLIC_HOSTS=(qtsgroup.vn api.qtsgroup.vn portal.qtsgroup.vn sso.qtsgroup.vn hrm.qtsgroup.vn)
COMPOSE=(
  docker compose
  --project-name "$PROJECT_NAME"
  --env-file "$ENV_FILE"
  -f "$SCRIPT_DIR/docker-compose.yml"
  -f "$SCRIPT_DIR/docker-compose.prod.yml"
)
SPRING_COMPOSE=(
  "${COMPOSE[@]}"
  -f "$SCRIPT_DIR/docker-compose.spring.yml"
  -f "$SCRIPT_DIR/docker-compose.spring.prod.yml"
)
SPRING_CUTOVER_COMPOSE=(
  "${SPRING_COMPOSE[@]}"
  -f "$SCRIPT_DIR/docker-compose.spring.cutover.yml"
)
SPRING_PROFILES=(
  --profile prod
  --profile spring
  --profile spring-events
  --profile spring-attendance
  --profile spring-identity-admin
  --profile spring-identity-bridge
  --profile spring-hrm
)

# The production VPS is memory constrained. Keep image builds sequential unless
# an operator deliberately raises this value.
export COMPOSE_PARALLEL_LIMIT="${COMPOSE_PARALLEL_LIMIT:-1}"

die() {
  echo "ERROR: $*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "missing required command: $1"
}

wait_for_url() {
  local name="$1"
  local url="$2"
  shift 2

  for attempt in $(seq 1 30); do
    if curl -fsS --max-time 10 "$@" "$url" >/dev/null; then
      echo "$name healthy"
      return 0
    fi
    sleep 5
  done

  echo "ERROR: $name did not become healthy: $url" >&2
  return 1
}

wait_for_status() {
  local name="$1"
  local expected="$2"
  local url="$3"
  local status

  for attempt in $(seq 1 30); do
    status="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 "$url" || true)"
    if [[ "$status" == "$expected" ]]; then
      echo "$name healthy (HTTP $status)"
      return 0
    fi
    sleep 5
  done

  echo "ERROR: $name returned HTTP ${status:-000}, expected $expected: $url" >&2
  return 1
}

require_command docker
require_command curl
require_command getent
require_command caddy
[[ -f "$ENV_FILE" ]] || die "missing $ENV_FILE"

for hostname in "${PUBLIC_HOSTS[@]}"; do
  resolved_ips="$(getent ahostsv4 "$hostname" | awk '{print $1}' | sort -u)"
  [[ -n "$resolved_ips" ]] || die "public DNS is not ready for $hostname"
  if ! grep -Fx "$PRODUCTION_IPV4" <<< "$resolved_ips" >/dev/null; then
    die "$hostname resolves to [$resolved_ips], expected $PRODUCTION_IPV4"
  fi
done

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

echo "[1/9] Validate production configuration"
"$SCRIPT_DIR/scripts/validate-production-env.sh" "$ENV_FILE"

# A historical deployment used project name "qts" and competed with the
# canonical "qtsss" stack for the same host ports. Refuse to recreate that
# split-brain state; an operator must inspect and remove retired containers.
RETIRED_CONTAINERS="$(docker ps -aq --filter label=com.docker.compose.project=qts)"
if [[ "$PROJECT_NAME" != "qts" && -n "$RETIRED_CONTAINERS" ]]; then
  die "retired Compose project 'qts' still exists; inspect it before deploying '$PROJECT_NAME'"
fi

# Do not let a second checkout silently take ownership of the same Compose
# project. This was the source of the original /var/www/qts vs /opt/qtsss
# split-brain deployment.
ACTIVE_WORKDIRS="$(docker ps -aq --filter "label=com.docker.compose.project=$PROJECT_NAME" \
  | xargs -r docker inspect -f '{{index .Config.Labels "com.docker.compose.project.working_dir"}}' \
  | sed '/^$/d' | sort -u)"
if [[ -n "$ACTIVE_WORKDIRS" ]]; then
  while IFS= read -r active_workdir; do
    [[ "$active_workdir" == "$SCRIPT_DIR" ]] || die \
      "Compose project '$PROJECT_NAME' is owned by '$active_workdir'; run this script from that checkout"
  done <<< "$ACTIVE_WORKDIRS"
fi

echo "[2/9] Back up application and Ory databases"
"${COMPOSE[@]}" up -d --wait --wait-timeout 90 db hydra-db kratos-db

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="$BACKUP_DIR" bash "$SCRIPT_DIR/scripts/backup.sh"

echo "[3/9] Build production images sequentially"
if [[ "${SKIP_BUILD:-0}" == "1" ]]; then
  echo "Skipping image builds; using preloaded production images"
else
  echo "Building Spring production services"
  for service in lead-service event-service attendance-service identity-admin-service identity-bridge-service hrm-service; do
    echo "Building $service"
    "${SPRING_CUTOVER_COMPOSE[@]}" build "$service"
  done
fi

echo "[4/9] Start database, Redis and Ory"
"${SPRING_CUTOVER_COMPOSE[@]}" "${SPRING_PROFILES[@]}" up -d --wait --wait-timeout 240 db redis hydra kratos

echo "[5/9] Validate Spring production overlays"
"${SPRING_COMPOSE[@]}" "${SPRING_PROFILES[@]}" config --quiet
"${SPRING_CUTOVER_COMPOSE[@]}" "${SPRING_PROFILES[@]}" config --quiet

echo "[6/9] Synchronize first-party Ory clients"
bash "$SCRIPT_DIR/scripts/sync-ory-clients.sh" "$ENV_FILE"

echo "[7/9] Start production services sequentially"
UP_BUILD_ARGS=()
if [[ "${SKIP_BUILD:-0}" == "1" ]]; then
  UP_BUILD_ARGS+=(--no-build)
fi
for service in lead-service identity-admin-service identity-bridge-service attendance-service hrm-service event-service; do
  echo "Starting $service"
  "${SPRING_CUTOVER_COMPOSE[@]}" "${SPRING_PROFILES[@]}" up -d --wait --wait-timeout 180 "${UP_BUILD_ARGS[@]}" "$service"
done

echo "[8/9] Verify local service endpoints"
wait_for_url "Lead API" "http://127.0.0.1:18081/actuator/health/readiness"
wait_for_url "Event API" "http://127.0.0.1:18082/actuator/health/readiness"
wait_for_url "Attendance API" "http://127.0.0.1:18083/actuator/health/readiness"
wait_for_url "Identity Admin API" "http://127.0.0.1:18084/actuator/health/readiness"
wait_for_url "Identity Bridge API" "http://127.0.0.1:18085/actuator/health/readiness"
wait_for_url "HRM API" "http://127.0.0.1:18086/actuator/health/readiness"
wait_for_url "Ory" "http://127.0.0.1:4444/.well-known/openid-configuration" -H "X-Forwarded-Proto: https"

echo "[9/9] Reload Caddy and verify public HTTPS endpoints"
caddy validate --config "$SCRIPT_DIR/Caddyfile"
require_command systemctl
CADDY_BACKUP="$BACKUP_DIR/Caddyfile-$STAMP"
install -m 600 /etc/caddy/Caddyfile "$CADDY_BACKUP"
install -m 644 "$SCRIPT_DIR/Caddyfile" /etc/caddy/Caddyfile
rollback_caddy() {
  echo "Public verification failed; restoring previous Caddy configuration" >&2
  install -m 644 "$CADDY_BACKUP" /etc/caddy/Caddyfile
  systemctl reload caddy
}
trap rollback_caddy ERR
systemctl reload caddy
wait_for_status "Public API authentication boundary" "401" "https://api.qtsgroup.vn/api/v1/leads"
wait_for_url "Public SSO discovery" "https://sso.qtsgroup.vn/.well-known/openid-configuration"
trap - ERR

"${SPRING_CUTOVER_COMPOSE[@]}" "${SPRING_PROFILES[@]}" ps
echo "Deploy complete for Compose project '$PROJECT_NAME'."
