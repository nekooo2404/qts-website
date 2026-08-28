#!/usr/bin/env bash
# Nightly DB backup. Cron: 17 2 * * * /path/to/qtsss/scripts/backup.sh
set -euo pipefail
cd "$(dirname "$0")/.."
BACKUP_DIR="${BACKUP_DIR:-./backups}"
KEEP="${KEEP:-7}"
mkdir -p "$BACKUP_DIR"
docker compose -f docker-compose.yml exec -T db pg_dump -U qts -Fc qts > "$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).dump"
# Prune old backups, keep newest KEEP
ls -1t "$BACKUP_DIR"/backup-*.dump | tail -n +"$((KEEP + 1))" | xargs -r rm -f
echo "backup done -> $BACKUP_DIR ($(ls -1 "$BACKUP_DIR"/backup-*.dump | wc -l) kept)"
