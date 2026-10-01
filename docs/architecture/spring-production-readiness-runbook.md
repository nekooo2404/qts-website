# QTS Spring Services Production Readiness Runbook

Scope: Spring Boot services that own the production backend runtime after the
Spring cutover.

- `lead-service`
- `event-service`
- `attendance-service`
- `identity-admin-service`
- `identity-bridge-service`
- `hrm-service`

Retired backend profiles are removed from the production deploy path. Production
traffic must be served by Spring services, Ory Hydra/Kratos, and the frontend
applications listed in `docker-compose.spring.cutover.yml`.

## 1. Non-negotiable production gates

Every service that receives production traffic must pass these gates.

| Gate | Required evidence |
|---|---|
| Tests | root reactor `mvn -B test` passes for all Spring services |
| Dependency scan | filesystem dependency scan rejects high/critical vulnerabilities |
| Cutover guard | no retired non-Spring backend files or active deployment references exist |
| Runtime hardening | every Spring Dockerfile runs non-root and sets OOM-fail-fast plus UTF-8 JVM flags |
| Cache safety | every Spring API service has no-store headers for API responses |
| Browser CSRF safety | browser-cookie mutations require trusted origin and CSRF token |
| Public abuse control | public write endpoints have spam/idempotency/rate-limit protection |
| Browser issuer safety | production builds keep insecure local OIDC off and token storage in memory |
| Image | Docker image builds successfully from repo root |
| Compose | `docker compose ... config --quiet` passes for Spring prod + cutover overlays |
| Schema ownership | Spring Flyway migrations are enabled for Lead, Event, Attendance, Identity and HRM services |
| Health | `/actuator/health/readiness` returns `UP` |
| Auth | private endpoints return `401` without token and `403` without permission |
| Tenant scope | token for tenant A cannot read/write tenant B data |
| Contract parity | response shape stays compatible with the public frontend/API contract |
| Rollback | previous known-good Spring image/compose revision can be restored without manual data edits |
| Secret hygiene | production secrets are not in image, build args, repo, browser env or logs |
| Observability | Spring HTTP responses emit `X-Request-ID`; error logs and health/latency/error metrics are available |

## 2. Local production gate

Windows:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/spring-production-gate.ps1
```

Linux/macOS/CI:

```bash
bash scripts/spring-production-gate.sh
```

If Docker Desktop or Docker Engine is unavailable, the PowerShell gate can still
run local Maven tests and compose validation with `-SkipDockerBuild`. Do not
mark the backend production-ready until Docker image builds and runtime smoke
tests pass in CI or on a host with a working Docker daemon.

## 3. CI gate

The GitHub Actions workflow is:

```text
.github/workflows/spring-production-gate.yml
```

It runs Maven tests, Docker image builds, vulnerability scans and compose
overlay validation for every Spring service.

## 4. Production compose overlays

Validate the internal Spring production shape:

```bash
docker compose --env-file .env.production \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  -f docker-compose.spring.yml \
  -f docker-compose.spring.prod.yml \
  --profile prod \
  --profile spring \
  --profile spring-events \
  --profile spring-attendance \
  --profile spring-identity-admin \
  --profile spring-identity-bridge \
  --profile spring-hrm \
  config --quiet
```

Validate the host-Caddy cutover shape:

```bash
docker compose --env-file .env.production \
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
  config --quiet
```

The cutover overlay publishes loopback-only ports for host Caddy:

| Service | Host port |
|---|---:|
| `lead-service` | `127.0.0.1:18081` |
| `event-service` | `127.0.0.1:18082` |
| `attendance-service` | `127.0.0.1:18083` |
| `identity-admin-service` | `127.0.0.1:18084` |
| `identity-bridge-service` | `127.0.0.1:18085` |
| `hrm-service` | `127.0.0.1:18086` |

## 5. Smoke tests before release

Run readiness probes:

```powershell
curl.exe -fsS http://127.0.0.1:18081/actuator/health/readiness
curl.exe -fsS http://127.0.0.1:18082/actuator/health/readiness
curl.exe -fsS http://127.0.0.1:18083/actuator/health/readiness
curl.exe -fsS http://127.0.0.1:18084/actuator/health/readiness
curl.exe -fsS http://127.0.0.1:18085/actuator/health/readiness
curl.exe -fsS http://127.0.0.1:18086/actuator/health/readiness
```

Then verify the user-facing flows:

- password login through QTS Identity;
- MFA or backup-code enrollment where required;
- Portal SSO without re-entering credentials;
- HRM SSO without re-entering credentials;
- launcher application filtering;
- consultation form submission and lead notification;
- repeated consultation submissions from one client return `429` with `Retry-After`;
- API responses preserve or create an `X-Request-ID` correlation header;
- lead list/update/export;
- HRM employee and organization reads;
- attendance device enrollment/sync;
- disabled user or application assignment denial;
- logout and cross-app session revocation.
- logout reject when `Origin`/`Referer` is not QTS Identity or CSRF token is missing;

Health checks alone are insufficient.

## 6. Event-service cutover

`event-service` must stay with polling disabled until the operator explicitly
cuts over event delivery:

```text
QTS_EVENT_POLL_ENABLED=false
```

Enable polling only after:

1. no other event publisher owns the same outbox stream;
2. `QTS_EVENT_POLL_ENABLED=true` is set for `event-service`;
3. outbox lag, inbox lag and dead-letter counts are monitored.

Rollback for event delivery is to disable polling or restore the previous
known-good Spring event-service image/config.

## 7. Gateway ownership

Host Caddy routes production API traffic to Spring loopback ports:

| Route group | Spring target |
|---|---|
| `qtsgroup.vn/api/v1/leads/**` | `lead-service` on `127.0.0.1:18081` |
| `api.qtsgroup.vn/oauth/userinfo` and Identity `/api/**` browser/admin endpoints | `identity-admin-service` on `127.0.0.1:18084` |
| `api.qtsgroup.vn/api/v1/leads/**` | `lead-service` on `127.0.0.1:18081` |
| `api.qtsgroup.vn/api/v1/attendance/**` | `attendance-service` on `127.0.0.1:18083` |
| `api.qtsgroup.vn/api/v1/employees/**` and `/api/v1/organizations/**` | `hrm-service` on `127.0.0.1:18086` |
| unknown `api.qtsgroup.vn` paths | `404`; no retired backend fallback |

## 8. Rollback rules

Rollback is release-first, data-second.

| Service | Rollback |
|---|---|
| `lead-service` | restore previous known-good image/config |
| `event-service` | disable polling or restore previous known-good image/config |
| `attendance-service` | restore previous known-good image/config |
| `identity-admin-service` | restore previous known-good image/config |
| `identity-bridge-service` | restore previous known-good image/config and resync Hydra URLs if needed |
| `hrm-service` | restore previous known-good image/config after in-flight requests drain |

Do not contract schemas during the rollback window.

## 9. Production environment rules

- `QTS_SECURITY_ENABLED=true`.
- `QTS_IDENTITY_ISSUER`, `VITE_IDENTITY_ISSUER` and
  `ORY_HYDRA_ISSUER_BROWSER_URL` must be the exact HTTPS issuer.
- `QTS_SECURITY_CORS_ALLOWED_ORIGINS` must be an explicit allowlist for SSO,
  Portal and HRM origins.
- Keep Actuator exposure at `health,info` unless metrics are exposed only on an
  internal management network.
- Never bake secrets into Docker images.
- Never pass production secrets as Docker build arguments.
- `QTS_LEGACY_BACKEND_ROLLBACK=true` is intentionally rejected by
  `scripts/validate-production-env.sh`.

## 10. Reference standards used

- Spring Boot Actuator health/readiness/liveness.
- Spring Security OAuth2 Resource Server for JWT validation.
- OAuth 2.0 Security Best Current Practice / RFC 9700.
- OWASP API Security Top 10 and Secrets Management guidance.
- Docker image hardening and non-root runtime guidance.
- GitHub Actions hardening: pin third-party actions by full commit SHA and let
  Dependabot open update PRs.
- OpenTelemetry/Micrometer observability model.
