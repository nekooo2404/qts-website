#!/usr/bin/env bash
# Restore DB from a dump. DANGER: overwrites current database state.
# Usage: ./scripts/restore.sh backups/backup-YYYYMMDD-HHMMSS.dump
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.production}"
if [[ "$ENV_FILE" != /* ]]; then
  ENV_FILE="$ROOT_DIR/$ENV_FILE"
fi
PROJECT_NAME="${COMPOSE_PROJECT_NAME:-qtsss}"
COMPOSE=(
  docker compose
  --project-name "$PROJECT_NAME"
  --env-file "$ENV_FILE"
  -f "$ROOT_DIR/docker-compose.yml"
  -f "$ROOT_DIR/docker-compose.prod.yml"
)

[[ $# -eq 1 && -f "$1" ]] || { echo "Usage: $0 <backup.dump>" >&2; exit 1; }
[[ -f "$ENV_FILE" ]] || { echo "ERROR: missing $ENV_FILE" >&2; exit 1; }

BACKUP_FILE="$(cd -- "$(dirname -- "$1")" && pwd)/$(basename -- "$1")"
echo "WARNING: this will overwrite the current database with $BACKUP_FILE"
read -r -p "Type 'restore' to continue: " CONFIRM
[[ "$CONFIRM" == "restore" ]] || { echo "aborted"; exit 1; }

"${COMPOSE[@]}" exec -T db sh -ec \
  'exec pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --exit-on-error' <"$BACKUP_FILE"
echo "Restore complete from $BACKUP_FILE"
