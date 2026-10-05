#!/usr/bin/env bash
# Nightly DB backup. Cron: 17 2 * * * /path/to/qtsss/scripts/backup.sh
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.production}"
if [[ "$ENV_FILE" != /* ]]; then
  ENV_FILE="$ROOT_DIR/$ENV_FILE"
fi
PROJECT_NAME="${COMPOSE_PROJECT_NAME:-qtsss}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
if [[ "$BACKUP_DIR" != /* ]]; then
  BACKUP_DIR="$ROOT_DIR/$BACKUP_DIR"
fi
KEEP="${KEEP:-7}"
COMPOSE=(
  docker compose
  --project-name "$PROJECT_NAME"
  --env-file "$ENV_FILE"
  -f "$ROOT_DIR/docker-compose.yml"
  -f "$ROOT_DIR/docker-compose.prod.yml"
)

[[ "$KEEP" =~ ^[1-9][0-9]*$ ]] || { echo "ERROR: KEEP must be a positive integer" >&2; exit 1; }
[[ -f "$ENV_FILE" ]] || { echo "ERROR: missing $ENV_FILE" >&2; exit 1; }
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

SNAPSHOT="$BACKUP_DIR/ory-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -m 700 "$SNAPSHOT"
for service in db hydra-db kratos-db; do
  "${COMPOSE[@]}" exec -T "$service" sh -ec \
    'exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' >"$SNAPSHOT/$service.dump.partial"
  [[ -s "$SNAPSHOT/$service.dump.partial" ]] || { echo "ERROR: empty $service backup" >&2; exit 1; }
  mv "$SNAPSHOT/$service.dump.partial" "$SNAPSHOT/$service.dump"
  chmod 600 "$SNAPSHOT/$service.dump"
done
# Completion marker only follows all three successful dumps. Secrets are backed
# up separately by the operator; a database-only snapshot cannot recover Ory keys.
printf '%s\n' 'db hydra-db kratos-db' > "$SNAPSHOT/COMPLETE"
chmod 600 "$SNAPSHOT/COMPLETE"
echo "Complete Ory database snapshot: $SNAPSHOT"
