# QTS Attendance Service

Spring Boot owner for QTS attendance device and sync APIs.

## Scope

This service implements the existing attendance contract without changing the
shared PostgreSQL schema:

- `POST /api/v1/attendance/devices`
- `GET /api/v1/attendance/devices/{id}`
- `POST /api/v1/attendance/devices/{id}/revoke`
- `POST /api/v1/attendance/device-events:sync`

The service preserves the production attendance invariants:

- device uniqueness per tenant;
- Ed25519 device signatures;
- request assertion binding and replay protection;
- unique `(tenant_id, device_id, event_id)`;
- unique `(tenant_id, device_id, nonce)`;
- idempotent sync with `Idempotency-Key`;
- append-only source events;
- transactional `attendance.source_recorded.v1` outbox emission;
- tenant-scoped device reads and permission checks.

The service does not store device private keys. Enrollment returns the private
key once over TLS and the caller is responsible for secure device provisioning.

## Safe migration posture

The service is intentionally additive. During Spring cutover, host Caddy routes
`/api/v1/attendance/**` to `127.0.0.1:18083`:

1. Build and start this service with the `spring-attendance` profile.
2. Run the contract and integration checks against the shared database.
3. Route a selected tenant/device cohort to port `8083`.
4. Compare accepted, duplicate, rejected, replay, and outbox metrics.
5. Promote the route gradually.
6. Roll back by restoring the previous known-good Spring image/config.

No schema contraction or data copy is required for rollback.

## Run tests with Docker

```powershell
docker run --rm `
  -e MAVEN_OPTS="-Xmx512m -XX:ActiveProcessorCount=2" `
  -v ${PWD}/backend/services/attendance-service:/workspace `
  -w /workspace `
  maven:3.9.11-eclipse-temurin-21 `
  mvn -B test
```

## Run with Compose

```powershell
docker compose `
  --profile spring-attendance `
  -f docker-compose.yml `
  -f docker-compose.spring.yml `
  up --build attendance-service
```

The service listens on `127.0.0.1:8083` by default. It only depends on the
existing PostgreSQL and Redis services; Redis is used for replay protection and
rate limiting.

## Production identity settings

Set these values from the QTS Identity deployment, never from a developer
machine:

```text
QTS_SECURITY_ENABLED=true
QTS_IDENTITY_ISSUER=https://sso.qtsgroup.vn/
QTS_IDENTITY_JWK_SET_URI=https://sso.qtsgroup.vn/.well-known/jwks.json
QTS_IDENTITY_AUDIENCE=qts-api
```

Identity access tokens must include `iss`, `aud`, `exp`, `iat`, `sub`,
`token_use=access`, a tenant claim (`tid` or the QTS Hydra extension), and
permission claims. Device assertions use the `QTS-DEVICE` bearer scheme and
must be bound to method, path, idempotency key, and body hash.

## Operational notes

- Keep `QTS_SECURITY_ENABLED=true` outside local tests.
- Put the service behind the same TLS-terminating gateway and request-ID
  middleware as the other QTS services.
- Alert on `ATTENDANCE_REPLAY`, `IDEMPOTENCY_CONFLICT`, `RATE_001`, and outbox
  write failures.
- Do not expose port `8083` directly to the public internet.
