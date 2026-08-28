#!/usr/bin/env bash
# QTS production deploy: backup -> build -> migrate -> up -> verify
# Usage: ENV_FILE=.env.production ./deploy.sh
set -euo pipefail

ENV_FILE="${ENV_FILE:-.env.production}"
COMPOSE="docker compose --env-file $ENV_FILE -f docker-compose.yml -f docker-compose.prod.yml"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: missing $ENV_FILE" >&2
  exit 1
fi

echo "[1/6] Backup database before deploy"
STAMP="$(date +%Y%m%d-%H%M%S)"
docker compose -f docker-compose.yml exec -T db pg_dump -U qts -Fc qts > "$BACKUP_DIR/backup-$STAMP.dump" \
  || echo "WARN: db not reachable yet, skipping backup"

echo "[2/6] Build images (dev + prod profile)"
$COMPOSE --profile prod build

echo "[3/6] Migration check (dry run, fails if pending)"
$COMPOSE run --rm api python manage.py migrate --check \
  || { echo "Pending migrations detected — apply them, then re-run deploy.sh";
       echo "  Apply with: $COMPOSE run --rm api python manage.py migrate"; exit 1; }

echo "[4/6] Start production stack"
$COMPOSE --profile prod up -d

echo "[5/6] Wait for health"
sleep 5
for i in $(seq 1 30); do
  if curl -fsS http://localhost:8000/api/v1/health/ > /dev/null 2>&1; then
    echo "API healthy"
    break
  fi
  [ "$i" -eq 30 ] && { echo "ERROR: API not healthy after 150s"; docker compose -f docker-compose.yml logs api | tail -50; exit 1; }
  sleep 5
done

echo "[6/6] First-deploy seed (safe to skip if already seeded)"
$COMPOSE run --rm api python manage.py seed_identity || echo "WARN: seed failed (may already exist)"

echo "Deploy complete. Remember: update Keycloak client qts-portal redirect URIs + web origins to production URLs."
