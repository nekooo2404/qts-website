#!/usr/bin/env bash
# QTS Spring/Ory production cutover wizard.
#
# This wizard is intentionally Spring-only. Retired backend commands are
# not part of the production cutover path.
set -Eeuo pipefail

ENV_FILE="${ENV_FILE:-.env.production}"
PROJECT_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

say() { printf '  %s\n' "$1"; }
step() { printf '  - %s\n' "$1"; }
warn() { printf '  WARNING: %s\n' "$1"; }
pause() { printf '  %s ' "${1:-Press Enter to continue}"; read -r _ || true; }
confirm() {
  local reply=""
  printf '  ? %s [y/N] ' "$1"
  read -r reply || true
  [[ "$reply" =~ ^[Yy] ]]
}
require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    printf 'ERROR: missing required command: %s\n' "$1" >&2
    exit 1
  }
}

compose_spring_cutover() {
  docker compose --env-file "$ENV_FILE" \
    -f docker-compose.yml \
    -f docker-compose.prod.yml \
    -f docker-compose.spring.yml \
    -f docker-compose.spring.prod.yml \
    -f docker-compose.spring.cutover.yml \
    --profile prod \
    --profile spring \
    --profile spring-events \
    --profile spring-attendance \
    --profile spring-identity-admin \
    --profile spring-identity-bridge \
    --profile spring-hrm \
    "$@"
}

printf '\nQTS Spring/Ory production cutover\n'
printf '6 stages\n\n'

require_command docker
require_command curl
require_command bash

printf '\nStage 1/6 - DNS\n'
say "Open INET DNS management for qtsgroup.vn."
step "Confirm A records for qtsgroup.vn, api.qtsgroup.vn, portal.qtsgroup.vn, sso.qtsgroup.vn, and hrm.qtsgroup.vn point to the production IP."
pause "Press Enter after DNS is confirmed."

printf '\nStage 2/6 - Rollback snapshot\n'
warn "Do this from the production checkout after uploading the reviewed candidate."
step "Take a VPS/provider snapshot."
step "Back up .env.production, Caddyfile, current image IDs, and PostgreSQL dumps."
step "Keep rollback assets available, not as the serving path."
confirm "Is rollback independently recoverable?" || exit 1

printf '\nStage 3/6 - Validate configuration\n'
chmod 600 "$ENV_FILE"
./scripts/validate-production-env.sh "$ENV_FILE"
compose_spring_cutover config --quiet

printf '\nStage 4/6 - Prepare Ory clients\n'
compose_spring_cutover up -d --wait --wait-timeout 240 db redis hydra kratos
bash ./scripts/sync-ory-clients.sh "$ENV_FILE"
confirm "Are Portal and HRM OAuth clients present with the expected redirect URIs?" || exit 1

printf '\nStage 5/6 - Cut over\n'
warn "This switches route ownership to Spring services behind Caddy."
confirm "Start the Spring cutover now?" || exit 1
ENV_FILE="$ENV_FILE" ./deploy.sh

printf '\nStage 6/6 - Smoke tests\n'
step "Open https://sso.qtsgroup.vn/login and verify login starts through QTS Identity."
step "Open https://portal.qtsgroup.vn/health and https://hrm.qtsgroup.vn/health."
step "Open Portal, then HRM, and confirm the same SSO session is reused."
confirm "Can representative users access assigned Portal and HRM applications?" || exit 1
npm run test:production

printf '\nSpring/Ory cutover wizard complete. Keep rollback assets during the rollback window.\n'
