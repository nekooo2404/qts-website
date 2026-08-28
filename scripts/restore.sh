#!/usr/bin/env bash
# Restore DB from a dump. DANGER: overwrites current database state.
# Usage: ./scripts/restore.sh backups/backup-YYYYMMDD-HHMMSS.dump
set -euo pipefail
cd "$(dirname "$0")/.."
[ $# -eq 1 ] && [ -f "$1" ] || { echo "Usage: $0 <backup.dump>"; exit 1; }
echo "WARNING: this will overwrite the current database with $1"
read -r -p "Type 'restore' to continue: " CONFIRM
[ "$CONFIRM" = "restore" ] || { echo "aborted"; exit 1; }
docker compose -f docker-compose.yml exec -T db pg_restore -U qts -d qts --clean --if-exists --no-owner < "$1"
echo "restore done"
