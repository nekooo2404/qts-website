# QTS Identity Admin Service

Spring Boot service for QTS Identity admin APIs.

## Scope

This Spring service owns the QTS Identity admin/browser APIs, the baseline
Identity schema migration, and idempotent enterprise bootstrap data for the
Spring runtime. It allows an authenticated user to revoke their own
session or an administrator to revoke a session in the same tenant:

- `GET /api/v1/identity/api/admin/users`
- `GET /api/admin/users`
- `GET /oauth/userinfo`
- `GET /api/session`
- `GET /api/launcher`
- `GET /api/portal-entitlements`
- `GET /api/sessions`
- `DELETE /api/sessions/{session_id}`
- `GET /api/admin/roles`
- `GET /api/admin/applications`
- `PATCH /api/admin/users/{membership_id}/access`
- `PATCH /api/v1/identity/api/admin/users/{membership_id}/access`
- `GET /api/console/security-overview`
- `GET /api/console/audit-events`
- `GET /oauth/csrf`
- `POST /api/enrollment/complete`

It preserves the existing public response shape for the admin user list:

- tenant-scoped user membership list;
- roles;
- application assignments;
- pagination;
- `identity.manage_users` permission requirement.

The catalog endpoints provide tenant-scoped role/application options for
admin tooling without exposing password or token operations.

On startup, Flyway applies `V1__identity_baseline_schema.sql` when
`IDENTITY_FLYWAY_ENABLED=true`, then the bootstrap runner ensures the default
tenant, roles, permissions, Portal/HRM applications, superadmin membership, and
HRM employee link when `QTS_IDENTITY_BOOTSTRAP_ENABLED=true`. The bootstrap is
idempotent and does not read workspace `.secrets` unless explicitly allowed.

The access update endpoint changes only existing tenant membership role and
application assignments. It validates all role codes and application slugs in
the tenant scope, rejects self-modification for the current `qts_sid`, keeps
unchanged requests idempotent, increments `policy_version` on real changes,
and appends `identity.membership.access.updated` audit events.

Browser UI endpoints (`/api/session`, `/api/launcher`, `/api/sessions`,
`/api/console/**`, `/api/portal-entitlements`, and enrollment completion) can
resolve the current user either from a Bearer access token or from the Kratos
browser session cookie via `/sessions/whoami`. `/oauth/userinfo` remains
Bearer-token only.

## Ownership boundaries

The following capabilities remain owned by adjacent Identity modules:

- Ory Hydra login, consent, or logout challenge handling;
- Ory/Kratos password, TOTP, and backup-code setup screens;
- user creation, invitation, disable, password reset, or Ory identity writes;
- local password handling beyond optional first-run Kratos superadmin
  bootstrap when an operator provides `BOOTSTRAP_SUPERADMIN_PASSWORD` or a
  mounted secret file.

The service re-evaluates the current tenant membership, permissions, and active
`qts_sid` session from the shared Identity tables. Session revocation is
tenant-scoped, append-only-audited, and does not disclose another user's
session. Host Caddy routes Identity read/admin/browser endpoints to the
Spring service on `127.0.0.1:18084` in production overlay mode.

## Run tests with Docker

```powershell
docker run --rm `
  -e MAVEN_OPTS="-Xmx512m -XX:ActiveProcessorCount=2" `
  -v ${PWD}/backend/services/identity-admin-service:/workspace `
  -w /workspace `
  maven:3.9.11-eclipse-temurin-21 `
  mvn -B test
```

## Run with Compose

```powershell
docker compose `
  --profile spring-identity-admin `
  -f docker-compose.yml `
  -f docker-compose.spring.yml `
  up --build identity-admin-service
```

The service listens on `127.0.0.1:8084` in the base profile and
`127.0.0.1:18084` with `docker-compose.spring.cutover.yml`.

## Production identity settings

```text
QTS_SECURITY_ENABLED=true
QTS_IDENTITY_ISSUER=https://sso.qtsgroup.vn/
QTS_IDENTITY_JWK_SET_URI=https://sso.qtsgroup.vn/.well-known/jwks.json
QTS_IDENTITY_AUDIENCE=qts-api
ORY_KRATOS_INTERNAL_PUBLIC_URL=http://kratos:4433
ORY_KRATOS_ADMIN_URL=http://kratos:4434
ORY_KRATOS_SESSION_COOKIE=ory_kratos_session
```

Tokens must be access tokens and include a tenant claim (`tid`, `qts_tenant`,
or `ext.qts_tenant`). Portal/HRM read APIs and session revocation also require
an active `qts_sid` claim. Admin user listing additionally requires
`identity.manage_users`. Access updates require both JWT authority and the
DB-backed current-session permission check.

## Rollback

Restore the previous known-good `identity-admin-service` image/config. Writes
in this slice are session revocation, existing membership access reassignment,
and self-service enrollment completion. They write only compatible Identity
tables/Ory metadata with audit events, so rollback does not require schema
contraction.
