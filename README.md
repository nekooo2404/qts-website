# QTS Enterprise Ecosystem

QTS marketing, Portal, Identity Center, HRM and Spring Boot services. Ory Hydra
and Kratos are the active identity provider stack.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the repository ownership map:
`backend`, `frontend-client`, `frontend-portal` and `frontend-hrm`.

| Component | Local URL | Responsibility |
| --- | --- | --- |
| Marketing | http://localhost:3000 | Landing pages and consultation form |
| Identity Center | http://localhost:3001 | Kratos login, MFA, launcher and account security |
| Portal | http://localhost:5174 | Assigned business applications |
| HRM | http://localhost:5175 | Assigned HR workspace |
| Lead service | http://localhost:8081 | Consultation and CRM lead APIs |
| Event service | http://localhost:8082 | Outbox/event delivery worker |
| Attendance service | http://localhost:8083 | Device enrollment and attendance sync APIs |
| Identity admin service | http://localhost:8084 | Session, launcher, userinfo, admin and enrollment APIs |
| Identity bridge service | http://localhost:8085 | Ory Hydra login/consent/logout bridge |
| HRM service | http://localhost:8086 | Employee and organization APIs |
| Hydra | http://localhost:4444/ | OAuth2/OIDC and PKCE |
| Kratos | Identity `/kratos` proxy | Accounts, passwords, TOTP and browser sessions |

Spring services are the backend runtime for production. Deploy, gateway and CI
paths must route live traffic only to Spring services.

## Setup

Preserve any existing `.env` and database credentials. For a new checkout:

```powershell
Copy-Item .env.example .env
npm ci
docker compose `
  -f docker-compose.yml `
  -f docker-compose.spring.yml `
  --profile dev-mail `
  --profile spring `
  --profile spring-events `
  --profile spring-attendance `
  --profile spring-identity-admin `
  --profile spring-identity-bridge `
  --profile spring-hrm `
  up --build -d db redis hydra kratos mailpit lead-service event-service attendance-service identity-admin-service identity-bridge-service hrm-service identity
npm run dev:web
```

For host-Caddy production cutover, include:

```powershell
docker compose `
  -f docker-compose.yml `
  -f docker-compose.prod.yml `
  -f docker-compose.spring.yml `
  -f docker-compose.spring.prod.yml `
  -f docker-compose.spring.cutover.yml `
  --profile prod `
  --profile spring `
  --profile spring-events `
  --profile spring-attendance `
  --profile spring-identity-admin `
  --profile spring-identity-bridge `
  --profile spring-hrm `
  up -d --wait
```

## Verification

```powershell
npm run typecheck
npm run lint
npm run build
```

Spring service checks:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/spring-production-gate.ps1
```

The Spring gate also rejects retired non-Spring backend files and active
deployment references, so old backend surfaces cannot re-enter production by
accident.

Production approval evidence is tracked in the
[QTS Production Governance Pack](docs/production-governance/README.md). The
pack separates implemented controls from decisions and evidence that require
approval by the system owner, security owner, product owner or operations team.

The repository root `pom.xml` is the Spring reactor. It lets CI and local
development test all backend services with one command:

```powershell
mvn -B test
```

If Docker Desktop is unavailable on Windows, the PowerShell gate uses the local
or portable JDK/Maven toolchain and still validates compose overlays. Use
`-SkipDockerBuild` when Docker image builds cannot run locally.

## Production notes

- Production browser URLs must use HTTPS and exact issuer strings.
- Do not put admin credentials or Ory secrets in `VITE_*`.
- `docker-compose.spring.cutover.yml` publishes Spring services on loopback
  ports `18081`-`18086` for host Caddy.
- Lead, Event, Attendance, Identity and HRM schema creation is owned by Spring
  Flyway migrations. Keep `LEAD_FLYWAY_ENABLED`, `EVENT_FLYWAY_ENABLED`,
  `ATTENDANCE_FLYWAY_ENABLED`, `IDENTITY_FLYWAY_ENABLED` and
  `HRM_FLYWAY_ENABLED` set to `true` in production.
- Rollback is release-first: restore the last known-good Spring image/compose
  revision and keep database snapshots available. Keep production traffic on
  Spring services only.
- Production bootstrap superadmin secrets belong in a secret manager; do not
  commit plaintext bootstrap files.
