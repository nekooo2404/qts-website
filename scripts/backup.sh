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

BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).dump"
BACKUP_TMP="$BACKUP_FILE.tmp"
trap 'rm -f "$BACKUP_TMP"' EXIT
"${COMPOSE[@]}" exec -T db sh -ec \
  'exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' >"$BACKUP_TMP"
[[ -s "$BACKUP_TMP" ]] || { echo "ERROR: PostgreSQL backup is empty" >&2; exit 1; }
mv "$BACKUP_TMP" "$BACKUP_FILE"
chmod 600 "$BACKUP_FILE"
trap - EXIT

mapfile -t OLD_BACKUPS < <(find "$BACKUP_DIR" -maxdepth 1 -type f -name 'backup-*.dump' -printf '%T@ %p\n' | sort -rn | tail -n +"$((KEEP + 1))" | cut -d' ' -f2-)
if ((${#OLD_BACKUPS[@]})); then
  rm -f -- "${OLD_BACKUPS[@]}"
fi

echo "Backup written to $BACKUP_FILE"
