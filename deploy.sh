#!/usr/bin/env bash
# QTS production deploy: validate -> backup -> build -> migrate -> start -> verify
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

ENV_FILE="${ENV_FILE:-.env.production}"
if [[ "$ENV_FILE" != /* ]]; then
  ENV_FILE="$SCRIPT_DIR/$ENV_FILE"
fi

PROJECT_NAME="${COMPOSE_PROJECT_NAME:-qtsss}"
BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/backups}"
COMPOSE=(
  docker compose
  --project-name "$PROJECT_NAME"
  --env-file "$ENV_FILE"
  -f "$SCRIPT_DIR/docker-compose.yml"
  -f "$SCRIPT_DIR/docker-compose.prod.yml"
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

require_command docker
require_command curl
[[ -f "$ENV_FILE" ]] || die "missing $ENV_FILE"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

echo "[1/8] Validate production configuration"
"${COMPOSE[@]}" --profile prod config --quiet

# A historical deployment used project name "qts" and competed with the
# canonical "qtsss" stack for the same host ports. Refuse to recreate that
# split-brain state; an operator must inspect and remove legacy containers.
LEGACY_CONTAINERS="$(docker ps -aq --filter label=com.docker.compose.project=qts)"
if [[ "$PROJECT_NAME" != "qts" && -n "$LEGACY_CONTAINERS" ]]; then
  die "legacy Compose project 'qts' still exists; inspect it before deploying '$PROJECT_NAME'"
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

echo "[2/8] Back up PostgreSQL"
"${COMPOSE[@]}" up -d --wait --wait-timeout 90 db

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE="$BACKUP_DIR/backup-$STAMP.dump"
BACKUP_TMP="$BACKUP_FILE.tmp"
trap 'rm -f "$BACKUP_TMP"' EXIT
"${COMPOSE[@]}" exec -T db sh -ec \
  'exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' >"$BACKUP_TMP"
[[ -s "$BACKUP_TMP" ]] || die "PostgreSQL backup is empty"
mv "$BACKUP_TMP" "$BACKUP_FILE"
chmod 600 "$BACKUP_FILE"
trap - EXIT
echo "Backup written to $BACKUP_FILE"

echo "[3/8] Build production images sequentially"
for service in api web-prod portal-prod identity-prod; do
  echo "Building $service"
  "${COMPOSE[@]}" build "$service"
done

echo "[4/8] Start database, Redis and Keycloak"
"${COMPOSE[@]}" up -d --wait --wait-timeout 240 db redis keycloak

echo "[5/8] Apply and verify database migrations"
"${COMPOSE[@]}" run --rm --no-deps api python manage.py migrate --noinput
"${COMPOSE[@]}" run --rm --no-deps api python manage.py migrate --check

echo "[6/8] Seed identity data idempotently"
"${COMPOSE[@]}" run --rm --no-deps api python manage.py seed_identity

echo "[7/8] Start production services"
"${COMPOSE[@]}" --profile prod up -d --remove-orphans --wait --wait-timeout 300

echo "[8/8] Verify local service endpoints"
wait_for_url "API" "http://127.0.0.1:8000/api/v1/health/" \
  -H "Host: ${API_HEALTH_HOST:-api.qts.group.vn}" \
  -H "X-Forwarded-Proto: https"
wait_for_url "Keycloak" "http://127.0.0.1:8081/realms/qts/.well-known/openid-configuration"
wait_for_url "Web" "http://127.0.0.1:3000/"
wait_for_url "Portal" "http://127.0.0.1:5174/health"
wait_for_url "Identity" "http://127.0.0.1:3001/"

"${COMPOSE[@]}" --profile prod ps
echo "Deploy complete for Compose project '$PROJECT_NAME'."
