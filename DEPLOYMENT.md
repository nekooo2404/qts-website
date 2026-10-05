# Production deployment: Spring services + Ory Hydra/Kratos

Production checkout: `/opt/qtsss`; Compose project: `qtsss`.

## Public endpoints

- Marketing: `https://qtsgroup.vn`
- Identity UI and Kratos browser proxy: `https://sso.qtsgroup.vn`
- Hydra issuer: `https://sso.qtsgroup.vn/` (trailing slash required)
- Portal callback: `https://portal.qtsgroup.vn/auth/callback`
- HRM callback: `https://hrm.qtsgroup.vn/auth/callback`
- API: `https://api.qtsgroup.vn`

All hostnames need DNS and trusted TLS. Kratos cookies are host-only on the
Identity origin. Ory admin ports stay private on the Docker network.

## Required production overlays

Spring production uses:

```bash
docker compose \
  --env-file .env.production \
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
  up -d --wait --wait-timeout 300
```

Do not include retired backend compose files or profiles in the Spring
production path. Production deploys are Spring-service-only.

## Core environment

```dotenv
QTS_SECURITY_ENABLED=true
QTS_IDENTITY_ISSUER=https://sso.qtsgroup.vn/
QTS_IDENTITY_JWK_SET_URI=https://sso.qtsgroup.vn/.well-known/jwks.json
QTS_IDENTITY_AUDIENCE=qts-api

ORY_HYDRA_ISSUER_BROWSER_URL=https://sso.qtsgroup.vn/
ORY_KRATOS_BROWSER_URL=https://sso.qtsgroup.vn/kratos
ORY_KRATOS_INTERNAL_PUBLIC_URL=http://kratos:4433
ORY_KRATOS_ADMIN_URL=http://kratos:4434
ORY_KRATOS_SESSION_COOKIE=ory_kratos_session
ORY_API_AUDIENCE=qts-api

IDENTITY_WEB_ORIGIN=https://sso.qtsgroup.vn
IDENTITY_API_ORIGIN=http://identity-admin-service:8084
IDENTITY_BRIDGE_ORIGIN=http://identity-bridge-service:8085
API_INTERNAL_ORIGIN=http://lead-service:8081

LEAD_FLYWAY_ENABLED=true
EVENT_FLYWAY_ENABLED=true
ATTENDANCE_FLYWAY_ENABLED=true
IDENTITY_FLYWAY_ENABLED=true
HRM_FLYWAY_ENABLED=true
```

Required secrets: Postgres passwords, Ory DSNs, Ory system/cookie/cipher
secrets, SMTP credentials when mail delivery is enabled, and all Spring
service secrets. Generate once per environment, back up securely, and never
pass production secrets as Docker build arguments.

## Gateway ownership

The host Caddyfile routes live API traffic to Spring loopback ports published
by `docker-compose.spring.cutover.yml`:

- `127.0.0.1:18081` routes to lead service
- `127.0.0.1:18083` routes to attendance service
- `127.0.0.1:18084` routes to identity admin service
- `127.0.0.1:18085` routes to identity bridge service
- `127.0.0.1:18086` routes to HRM service

Unknown `api.qtsgroup.vn` API paths return `404` after release; they must not
fall through to non-Spring backend routes.

## Low-RAM VPS deployment rule

The production VPS has limited memory. Do not build Node frontend images on the
server during normal releases. Build artifacts or images on a workstation/CI
runner, transfer the verified release to `/opt/qtsss`, then start only the
runtime containers on the VPS.

For emergency source-only updates, use a low-impact rollout:

1. upload/extract the release under `/opt/qtsss/releases/<timestamp>`;
2. switch `/opt/qtsss/current-release` after the files are present;
3. restart only the service whose runtime assets changed;
4. avoid parallel Docker builds and avoid Compose profiles unrelated to the
   changed service.

## Verification

Before release:

```bash
bash scripts/spring-production-gate.sh
```

For source-only verification, the Spring services share a root Maven reactor:

```bash
mvn -B test
```

Then verify:

- password login;
- MFA / backup code enrollment;
- SSO into Portal and HRM without re-login;
- launcher application filtering;
- consultation form submission;
- lead list/update/export;
- HRM employee and organization reads;
- attendance device enrollment/sync;
- disabled user/application access denial;
- logout and cross-app session revocation.

Discovery/health alone are insufficient.

## Rollback

Rollback is release-first:

1. Restore the previous known-good Spring image tags and compose revision.
2. Restore the previous host Caddy route mapping only if that release used a
   different Spring service port mapping.
3. Keep Ory/Postgres data intact; do not contract schema during the rollback
   window.
4. Back up Spring/Ory/Postgres secrets separately from database snapshots.

`backup.sh` and `restore-ory.sh` remain available for database-level recovery,
but normal rollback should be an image/compose revision change, not a data
restore.
