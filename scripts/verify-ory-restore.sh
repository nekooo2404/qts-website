#!/usr/bin/env bash
# Restore isolated Ory test database dumps into a fresh private PostgreSQL container.
#
# Never restores into an existing container, never publishes a port, and never
# targets production. Snapshot files contain sensitive test data and stay ignored.
set -Eeuo pipefail

SNAPSHOT_DIR=".secrets/ory-restore-$(date +%Y%m%d-%H%M%S)"
COUNT_SQL="select count(*) from information_schema.tables where table_schema='public' and table_type='BASE TABLE'"
mkdir -p "$SNAPSHOT_DIR"
chmod 700 "$SNAPSHOT_DIR"

hash_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    shasum -a 256 "$1" | awk '{print $1}'
  fi
}

json_escape() {
  local value="$1"
  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  value="${value//$'\n'/\\n}"
  printf '%s' "$value"
}

declare -A TABLES
declare -A BYTES
declare -A HASHES

for service in db hydra-db kratos-db; do
  container="qtsss-ory-check-${service}-1"
  dump_file="$SNAPSHOT_DIR/${service}.dump"
  docker exec "$container" sh -ec 'exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$dump_file"
  [[ -s "$dump_file" ]] || { echo "ERROR: empty dump for $service" >&2; exit 1; }
  tables="$(docker exec -e PROOF_SQL="$COUNT_SQL" "$container" sh -ec 'exec psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "$PROOF_SQL"')"
  TABLES["$service"]="$tables"
  BYTES["$service"]="$(wc -c < "$dump_file" | tr -d ' ')"
  HASHES["$service"]="$(hash_file "$dump_file")"
done

proof_name="qtsss-ory-restore-proof-$(date +%s)-$$"
password="$(od -An -N 24 -tx1 /dev/urandom | tr -d ' \n')"
docker run -d --name "$proof_name" -e POSTGRES_PASSWORD="$password" postgres:16-alpine >/dev/null

cleanup() {
  docker rm -f -v "$proof_name" >/dev/null 2>&1 || true
}
trap cleanup EXIT

for _ in $(seq 1 30); do
  if docker exec "$proof_name" pg_isready -U postgres >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
docker exec "$proof_name" pg_isready -U postgres >/dev/null

for service in db hydra-db kratos-db; do
  database="${service//-/_}"
  docker exec "$proof_name" createdb -U postgres "$database" >/dev/null
  docker exec -i "$proof_name" pg_restore -U postgres -d "$database" --no-owner --no-privileges --exit-on-error \
    < "$SNAPSHOT_DIR/${service}.dump" >/dev/null
  restored="$(docker exec "$proof_name" psql -U postgres -d "$database" -Atc "$COUNT_SQL")"
  [[ "$restored" == "${TABLES[$service]}" ]] || {
    echo "ERROR: restored table count mismatch for $service" >&2
    exit 1
  }
done

manifest="$SNAPSHOT_DIR/manifest.json"
{
  echo "{"
  echo '  "result": "PASS",'
  echo "  \"snapshot\": \"$(json_escape "$SNAPSHOT_DIR")\","
  echo '  "databases": {'
  index=0
  for service in db hydra-db kratos-db; do
    (( index++ )) || true
    comma=","
    [[ "$index" -eq 3 ]] && comma=""
    printf '    "%s": {"bytes": %s, "sha256": "%s", "tables": %s, "restore_verified": true}%s\n' \
      "$service" "${BYTES[$service]}" "${HASHES[$service]}" "${TABLES[$service]}" "$comma"
  done
  echo "  }"
  echo "}"
} > "$manifest"
chmod 600 "$manifest"
cat "$manifest"
