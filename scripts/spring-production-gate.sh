#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MAVEN_IMAGE="${MAVEN_IMAGE:-maven:3.9.11-eclipse-temurin-21}"
DEFAULT_SERVICES=(lead-service event-service attendance-service identity-admin-service identity-bridge-service hrm-service)
SERVICES=("$@")

if [ "${#SERVICES[@]}" -eq 0 ]; then
  SERVICES=("${DEFAULT_SERVICES[@]}")
fi

cd "$ROOT_DIR"
unset DEBUG

step() {
  printf '\n==> %s\n' "$1"
}

assert_no_legacy_backend() {
  local legacy_file_pattern='(^|[\\/])(apps[\\/]api|infra[\\/]keycloak|infra[\\/]legacy)([\\/]|$)|(^|[\\/])manage\.py$|requirements.*\.txt$|Pipfile$|pyproject\.toml$|\.py$'
  local legacy_files

  if command -v rg >/dev/null 2>&1; then
    legacy_files="$(rg --files | rg "$legacy_file_pattern" || true)"
  elif git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    legacy_files="$(while IFS= read -r path; do [ -e "$path" ] && printf '%s\n' "$path"; done < <(git ls-files) | grep -E "$legacy_file_pattern" || true)"
  else
    printf 'Need ripgrep or git to verify Spring cutover guard.\n' >&2
    exit 4
  fi

  if [ -n "$legacy_files" ]; then
    printf 'Retired backend files are not allowed after Spring cutover:\n%s\n' "$legacy_files" >&2
    exit 4
  fi

  local targets=(
    backend/services
    docker-compose.yml
    docker-compose.prod.yml
    docker-compose.spring.yml
    docker-compose.spring.prod.yml
    docker-compose.spring.cutover.yml
    package.json
    README.md
    DEPLOYMENT.md
    docs/specs
    docs/architecture
  )
  local existing_targets=()
  local target
  for target in "${targets[@]}"; do
    [ -e "$target" ] && existing_targets+=("$target")
  done

  if [ "${#existing_targets[@]}" -gt 0 ]; then
    local legacy_text
    if command -v rg >/dev/null 2>&1; then
      legacy_text="$(rg -n -i 'keycloak|django|apps/api|manage\.py|requirements\.txt|gunicorn|celery|python backend|legacy backend' "${existing_targets[@]}" 2>/dev/null || true)"
    else
      legacy_text="$(grep -RInEi 'keycloak|django|apps/api|manage\.py|requirements\.txt|gunicorn|celery|python backend|legacy backend' "${existing_targets[@]}" 2>/dev/null || true)"
    fi
    if [ -n "$legacy_text" ]; then
      printf 'Retired backend references are not allowed in active Spring/deployment surfaces:\n%s\n' "$legacy_text" >&2
      exit 5
    fi
  fi
}

step "Spring cutover guard: no retired backend"
assert_no_legacy_backend

assert_spring_dockerfile_hardening() {
  local dockerfile required
  local found=0

  while IFS= read -r dockerfile; do
    found=1
    for required in \
      'FROM eclipse-temurin:21-jre-alpine' \
      'adduser -S qts' \
      'USER qts' \
      '-XX:MaxRAMPercentage=75' \
      '-XX:+ExitOnOutOfMemoryError' \
      '-Dfile.encoding=UTF-8' \
      '-Dsun.jnu.encoding=UTF-8'; do
      if ! grep -Fq -- "$required" "$dockerfile"; then
        printf "Spring Dockerfile hardening missing '%s' in %s\n" "$required" "$dockerfile" >&2
        exit 6
      fi
    done
  done < <(find backend/services -name Dockerfile -type f | sort)

  if [ "$found" -eq 0 ]; then
    printf 'No Spring service Dockerfiles found.\n' >&2
    exit 6
  fi
}

step "Spring Dockerfile hardening guard"
assert_spring_dockerfile_hardening

assert_api_no_store_filters() {
  local service main_java
  for service in backend/services/*; do
    [ -d "$service" ] || continue
    main_java="$service/src/main/java"
    [ -d "$main_java" ] || continue

    if command -v rg >/dev/null 2>&1; then
      has_controller() { rg -q '@RestController|@Controller' "$main_java"; }
      has_no_store() { rg -q 'class NoStoreFilter|Cache-Control.*no-store|no-store' "$main_java"; }
    else
      has_controller() { grep -RqsE '@RestController|@Controller' "$main_java"; }
      has_no_store() { grep -RqsE 'class NoStoreFilter|Cache-Control.*no-store|no-store' "$main_java"; }
    fi

    if has_controller; then
      if ! has_no_store; then
        printf "Spring API service '%s' has controllers but no no-store response filter.\n" "$(basename "$service")" >&2
        exit 7
      fi
    fi
  done
}

step "Spring API no-store guard"
assert_api_no_store_filters

export POSTGRES_DB="${POSTGRES_DB:-qts}"
export POSTGRES_USER="${POSTGRES_USER:-postgres}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-compose-validation-only}"
export ORY_HYDRA_DB_PASSWORD="${ORY_HYDRA_DB_PASSWORD:-hydra-validation-only}"
export ORY_KRATOS_DB_PASSWORD="${ORY_KRATOS_DB_PASSWORD:-kratos-validation-only}"
export ORY_HYDRA_DSN="${ORY_HYDRA_DSN:-postgres://hydra:hydra-validation-only@hydra-db:5432/hydra?sslmode=disable}"
export ORY_KRATOS_DSN="${ORY_KRATOS_DSN:-postgres://kratos:kratos-validation-only@kratos-db:5432/kratos?sslmode=disable}"
export ORY_HYDRA_SYSTEM_SECRET="${ORY_HYDRA_SYSTEM_SECRET:-hydra-system-validation-only}"
export ORY_KRATOS_COOKIE_SECRET="${ORY_KRATOS_COOKIE_SECRET:-kratos-cookie-validation-only}"
export ORY_KRATOS_CIPHER_SECRET="${ORY_KRATOS_CIPHER_SECRET:-kratos-cipher-validation-only}"
export IDENTITY_SIGNING_KEY_PASSPHRASE="${IDENTITY_SIGNING_KEY_PASSPHRASE:-identity-validation-only}"
export CORS_ALLOWED_ORIGINS="${CORS_ALLOWED_ORIGINS:-https://portal.example.invalid,https://hrm.example.invalid}"
export IDENTITY_ISSUER="${IDENTITY_ISSUER:-https://api.example.invalid}"
export IDENTITY_WEB_ORIGIN="${IDENTITY_WEB_ORIGIN:-https://sso.example.invalid}"
export ORY_HYDRA_ISSUER_BROWSER_URL="${ORY_HYDRA_ISSUER_BROWSER_URL:-https://sso.example.invalid/}"
export ORY_KRATOS_BROWSER_URL="${ORY_KRATOS_BROWSER_URL:-https://sso.example.invalid/kratos}"
export VITE_IDENTITY_ISSUER="${VITE_IDENTITY_ISSUER:-https://sso.example.invalid/}"
export VITE_API_ISSUER="${VITE_API_ISSUER:-https://api.example.invalid}"
export VITE_HRM_API_ISSUER="${VITE_HRM_API_ISSUER:-https://api.example.invalid}"
export VITE_IDENTITY_WEB_ORIGIN="${VITE_IDENTITY_WEB_ORIGIN:-https://sso.example.invalid}"
export VITE_PORTAL_OIDC_CLIENT_ID="${VITE_PORTAL_OIDC_CLIENT_ID:-qts-portal}"
export VITE_PORTAL_OIDC_REDIRECT_URI="${VITE_PORTAL_OIDC_REDIRECT_URI:-https://portal.example.invalid/auth/callback}"
export VITE_PORTAL_OIDC_POST_LOGOUT_REDIRECT_URI="${VITE_PORTAL_OIDC_POST_LOGOUT_REDIRECT_URI:-https://portal.example.invalid/}"
export VITE_HRM_OIDC_CLIENT_ID="${VITE_HRM_OIDC_CLIENT_ID:-qts-hrm}"
export VITE_ALLOW_INSECURE_LOCAL_OIDC="${VITE_ALLOW_INSECURE_LOCAL_OIDC:-false}"
export VITE_HRM_OIDC_REDIRECT_URI="${VITE_HRM_OIDC_REDIRECT_URI:-https://hrm.example.invalid/auth/callback}"
export VITE_HRM_OIDC_POST_LOGOUT_REDIRECT_URI="${VITE_HRM_OIDC_POST_LOGOUT_REDIRECT_URI:-https://hrm.example.invalid/}"
export QTS_SECURITY_ENABLED="${QTS_SECURITY_ENABLED:-true}"
export QTS_SECURITY_CORS_ALLOWED_ORIGINS="${QTS_SECURITY_CORS_ALLOWED_ORIGINS:-https://sso.example.invalid,https://portal.example.invalid,https://hrm.example.invalid}"
export QTS_IDENTITY_ISSUER="${QTS_IDENTITY_ISSUER:-https://sso.example.invalid/}"
export QTS_IDENTITY_JWK_SET_URI="${QTS_IDENTITY_JWK_SET_URI:-https://sso.example.invalid/.well-known/jwks.json}"
export QTS_IDENTITY_AUDIENCE="${QTS_IDENTITY_AUDIENCE:-qts-api}"
export LEAD_FLYWAY_ENABLED="${LEAD_FLYWAY_ENABLED:-true}"
export EVENT_FLYWAY_ENABLED="${EVENT_FLYWAY_ENABLED:-true}"
export ATTENDANCE_FLYWAY_ENABLED="${ATTENDANCE_FLYWAY_ENABLED:-true}"
export IDENTITY_FLYWAY_ENABLED="${IDENTITY_FLYWAY_ENABLED:-true}"
export QTS_IDENTITY_BOOTSTRAP_ENABLED="${QTS_IDENTITY_BOOTSTRAP_ENABLED:-true}"
export IDENTITY_PRIMARY_DOMAIN="${IDENTITY_PRIMARY_DOMAIN:-qts.com}"
export IDENTITY_REQUIRE_MFA="${IDENTITY_REQUIRE_MFA:-true}"
export QTS_EVENT_POLL_ENABLED="${QTS_EVENT_POLL_ENABLED:-false}"
export QTS_EVENT_MAIL_ENABLED="${QTS_EVENT_MAIL_ENABLED:-false}"
export QTS_IDENTITY_BRIDGE_ENABLED="${QTS_IDENTITY_BRIDGE_ENABLED:-false}"
export ORY_HYDRA_ADMIN_URL="${ORY_HYDRA_ADMIN_URL:-http://hydra:4445}"
export ORY_KRATOS_INTERNAL_PUBLIC_URL="${ORY_KRATOS_INTERNAL_PUBLIC_URL:-http://kratos:4433}"
export ORY_KRATOS_ADMIN_URL="${ORY_KRATOS_ADMIN_URL:-http://kratos:4434}"
export ORY_KRATOS_SESSION_COOKIE="${ORY_KRATOS_SESSION_COOKIE:-ory_kratos_session}"
export ORY_HYDRA_CLIENT_ID_PORTAL="${ORY_HYDRA_CLIENT_ID_PORTAL:-qts-portal}"
export ORY_HYDRA_CLIENT_ID_HRM="${ORY_HYDRA_CLIENT_ID_HRM:-qts-hrm}"
export ORY_HYDRA_LOGIN_URL="${ORY_HYDRA_LOGIN_URL:-https://sso.example.invalid/identity-api/oauth/ory/login}"
export ORY_HYDRA_CONSENT_URL="${ORY_HYDRA_CONSENT_URL:-https://sso.example.invalid/identity-api/oauth/ory/consent}"
export ORY_HYDRA_LOGOUT_URL="${ORY_HYDRA_LOGOUT_URL:-https://sso.example.invalid/identity-api/oauth/ory/logout}"
export ORY_API_AUDIENCE="${ORY_API_AUDIENCE:-qts-api}"
export HRM_FLYWAY_ENABLED="${HRM_FLYWAY_ENABLED:-true}"
export HRM_MAX_PAGE_SIZE="${HRM_MAX_PAGE_SIZE:-100}"
export MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE="${MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE:-health,info}"

docker_daemon_available() {
  command -v docker >/dev/null 2>&1 && docker version --format '{{.Server.Version}}' >/dev/null 2>&1
}

configure_local_java() {
  if [ -d "$ROOT_DIR/.tools/jdk-21" ]; then
    export JAVA_HOME="$ROOT_DIR/.tools/jdk-21"
    export PATH="$JAVA_HOME/bin:$PATH"
  fi
}

resolve_local_maven() {
  if [ -x "$ROOT_DIR/mvnw" ]; then
    printf '%s\n' "$ROOT_DIR/mvnw"
    return 0
  fi

  if [ -x "$ROOT_DIR/.tools/apache-maven-3.9.11/bin/mvn" ]; then
    printf '%s\n' "$ROOT_DIR/.tools/apache-maven-3.9.11/bin/mvn"
    return 0
  fi

  if [ -f "$ROOT_DIR/.tools/apache-maven-3.9.11/bin/mvn.cmd" ]; then
    printf '%s\n' "$ROOT_DIR/.tools/apache-maven-3.9.11/bin/mvn.cmd"
    return 0
  fi

  if command -v mvn >/dev/null 2>&1; then
    command -v mvn
    return 0
  fi

  printf 'Maven not found. Install JDK 21 + Maven 3.9.x or use Docker.\n' >&2
  return 1
}

run_maven() {
  if [ -n "${LOCAL_MAVEN:-}" ]; then
    env \
      -u DEBUG \
      -u QTS_SECURITY_ENABLED \
      -u QTS_IDENTITY_ISSUER \
      -u QTS_IDENTITY_JWK_SET_URI \
      -u QTS_IDENTITY_AUDIENCE \
      -u LEAD_FLYWAY_ENABLED \
      -u EVENT_FLYWAY_ENABLED \
      -u ATTENDANCE_FLYWAY_ENABLED \
      -u IDENTITY_FLYWAY_ENABLED \
      -u HRM_FLYWAY_ENABLED \
      "$LOCAL_MAVEN" "$@"
  else
    docker run --rm \
      -e MAVEN_OPTS="-Xmx768m -XX:ActiveProcessorCount=2" \
      -e DEBUG= \
      -v "$ROOT_DIR:/workspace" \
      -w /workspace \
      "$MAVEN_IMAGE" \
      mvn "$@"
  fi
}

if docker_daemon_available; then
  step "Docker daemon availability"
  docker version --format '{{.Server.Version}}'
else
  printf '\n==> Docker daemon unavailable; Maven tests will use local toolchain.\n'
  configure_local_java
  LOCAL_MAVEN="$(resolve_local_maven)"
fi

if [ "${USE_LOCAL_MAVEN:-0}" = "1" ]; then
  configure_local_java
  LOCAL_MAVEN="$(resolve_local_maven)"
fi

is_default_service_set() {
  [ "${#SERVICES[@]}" -eq "${#DEFAULT_SERVICES[@]}" ] || return 1

  local requested expected
  requested="$(printf '%s\n' "${SERVICES[@]}" | sort | tr '\n' ' ')"
  expected="$(printf '%s\n' "${DEFAULT_SERVICES[@]}" | sort | tr '\n' ' ')"
  [ "$requested" = "$expected" ]
}

for service in "${SERVICES[@]}"; do
  service_path="$ROOT_DIR/backend/services/$service"
  if [ ! -d "$service_path" ]; then
    printf 'Unknown Spring service: %s\n' "$service" >&2
    exit 2
  fi
done

if is_default_service_set; then
  step "Maven tests: Spring reactor"
  run_maven -B test
else
  for service in "${SERVICES[@]}"; do
    step "Maven tests: $service"
    run_maven -B -pl "backend/services/$service" -am test
  done
fi

for service in "${SERVICES[@]}"; do
  service_path="$ROOT_DIR/backend/services/$service"

  if [ "${SKIP_DOCKER_BUILD:-0}" != "1" ]; then
    if ! docker_daemon_available; then
      printf 'Docker daemon unavailable. Start Docker or rerun with SKIP_DOCKER_BUILD=1 for local Maven and compose validation only.\n' >&2
      exit 3
    fi

    step "Docker build: $service"
    docker build \
      --file "backend/services/$service/Dockerfile" \
      --tag "qts-$service:production-gate" \
      .
  fi
done

step "Compose overlay validation"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-compose-validation-only}" \
docker compose \
  --profile prod \
  --profile spring \
  --profile spring-events \
  --profile spring-attendance \
  --profile spring-identity-admin \
  --profile spring-identity-bridge \
  --profile spring-hrm \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  -f docker-compose.spring.yml \
  -f docker-compose.spring.prod.yml \
  config --quiet

step "Optional Spring cutover overlay validation"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-compose-validation-only}" \
docker compose \
  --profile prod \
  --profile spring \
  --profile spring-events \
  --profile spring-attendance \
  --profile spring-identity-admin \
  --profile spring-identity-bridge \
  --profile spring-hrm \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  -f docker-compose.spring.yml \
  -f docker-compose.spring.prod.yml \
  -f docker-compose.spring.cutover.yml \
  config --quiet

printf '\nSpring production gate passed.\n'
