#!/usr/bin/env bash
# Restore a complete three-database Ory snapshot. Explicit interactive confirmation.
set -Eeuo pipefail
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.production}"
[[ $# == 1 && -f "$1/COMPLETE" ]] || { echo 'Usage: restore-ory.sh <complete-snapshot-directory>' >&2; exit 1; }
SNAPSHOT="$(cd -- "$1" && pwd)"
for service in db hydra-db kratos-db; do
  [[ -s "$SNAPSHOT/$service.dump" ]] || { echo "Missing $service dump" >&2; exit 1; }
done
COMPOSE=(docker compose --env-file "$ENV_FILE" -f "$ROOT_DIR/docker-compose.yml" -f "$ROOT_DIR/docker-compose.prod.yml" --profile prod)
echo 'This stops identity/application writers and replaces all three databases. Matching Ory secrets must already be restored.'
read -r -p "Type restore-ory to continue: " ANSWER
[[ "$ANSWER" == restore-ory ]] || exit 1
"${COMPOSE[@]}" stop hydra kratos
for service in db hydra-db kratos-db; do
  "${COMPOSE[@]}" exec -T "$service" sh -ec 'exec pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --exit-on-error' < "$SNAPSHOT/$service.dump"
done
echo 'Databases restored. Writers remain stopped; validate migration versions and keys before starting them.'
