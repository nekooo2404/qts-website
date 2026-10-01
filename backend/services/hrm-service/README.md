# QTS HRM Service

Spring Boot owner for QTS HRM employee and organization APIs.

## Scope

This service exposes the HRM read APIs:

- `GET /api/v1/employees`
- `GET /api/v1/employees/{employeeId}`
- `GET /api/v1/employees/{employeeId}/personal-details`
- `GET /api/v1/employees/{employeeId}/employment-records`
- `GET /api/v1/employees/{employeeId}/dependents`
- `GET /api/v1/employees/{employeeId}/emergency-contacts`
- `GET /api/v1/organizations/companies`
- `GET /api/v1/organizations/branches`
- `GET /api/v1/organizations/departments`
- `GET /api/v1/organizations/positions`

The service reads tenant-scoped HRM data and keeps the existing QTS Identity
tables as the source of tenant, membership, employee-link, and permission
truth. It does not handle passwords, Ory login/consent/logout, or browser
session creation.

## Migration posture

The HRM slice is additive and rollback-safe:

1. Start the service with the `spring-hrm` profile.
2. Run readiness, no-token, permission, and tenant-isolation smoke tests.
3. Route selected endpoint groups or tenant cohorts to port `8086`.
4. Compare response contract, row counts, error rate, and latency with the
   previous release.
5. Promote gradually.
6. Roll back by restoring the previous known-good Spring image/config; no schema
   contraction is required.

Flyway migration `V2__backfill_identity_employee_links.sql` is an additive
backfill that links HRM employees to QTS Identity memberships. It must remain
idempotent during rolling Spring releases.

## Run tests with Docker

```powershell
docker run --rm `
  -e MAVEN_OPTS="-Xmx512m -XX:ActiveProcessorCount=2" `
  -v ${PWD}/backend/services/hrm-service:/workspace `
  -w /workspace `
  maven:3.9.11-eclipse-temurin-21 `
  mvn -B test
```

## Run with Compose

```powershell
docker compose `
  --profile spring-hrm `
  -f docker-compose.yml `
  -f docker-compose.spring.yml `
  up --build hrm-service
```

The service listens on `127.0.0.1:8086` in the local Spring overlay. Do not
publish this port directly to the internet; route through the TLS gateway.

## Production identity settings

```text
QTS_SECURITY_ENABLED=true
QTS_IDENTITY_ISSUER=https://sso.qtsgroup.vn/
QTS_IDENTITY_JWK_SET_URI=https://sso.qtsgroup.vn/.well-known/jwks.json
QTS_IDENTITY_AUDIENCE=qts-api
HRM_FLYWAY_ENABLED=true
HRM_MAX_PAGE_SIZE=100
```

Tokens must be Hydra access tokens and include:

- `iss`, `aud`, `exp`, `iat`, `sub`
- `token_use=access`
- tenant claim: `tid`, `qts_tenant`, or `ext.qts_tenant`
- HRM/organization permission claims for the requested operation

Users with only self-service employee permission may read only the linked
employee record. Cross-tenant reads must return an authorization or not-found
response without leaking another tenant's data.

## Smoke tests

```powershell
curl.exe -fsS http://127.0.0.1:8086/actuator/health/readiness
curl.exe -i -sS http://127.0.0.1:8086/api/v1/employees
curl.exe -i -sS http://127.0.0.1:8086/api/v1/organizations/companies
```

Expected before adding a token:

- readiness returns `{"status":"UP"}`;
- domain requests return `401`;
- responses include `Cache-Control: no-store`.

Then run the same requests with real QTS Identity access tokens for:

- full HR admin permission;
- self-service employee permission;
- another tenant.

## Rollback

Restore the previous known-good `hrm-service` image/config. Because the service
uses additive schema changes and does not own login/session creation, rollback
does not require data deletion.
