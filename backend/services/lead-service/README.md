# QTS Lead Service

Spring Boot owner for QTS consultation and CRM lead APIs.

This service is intentionally narrow:

- Implements the consultation endpoint plus the staff CRM endpoints:
  `GET /api/v1/leads/`, `PATCH /api/v1/leads/{id}/`,
  `GET /api/v1/leads/{id}/activities/`, and `GET /api/v1/leads/export/`.
- Writes to the existing `leads_lead`, `leads_leadactivity`, and `outbox_events` tables.
- Keeps the endpoint public, matching the landing-page consultation form.
- Keeps only the consultation endpoint and health check public; staff endpoints require a Hydra JWT
  with `crm.view_customer` or `crm.edit_customer`.
- Receives production traffic when host Caddy routes
  `/api/v1/leads/**` to `127.0.0.1:18081`.
- Leaves Identity, Ory login/consent/logout, HRM, and attendance ownership to
  their dedicated Spring/Ory modules.

## Run tests with Docker

The workstation does not need a local JDK if Docker is available:

```powershell
docker run --rm -v ${PWD}/backend/services/lead-service:/workspace -w /workspace maven:3.9.11-eclipse-temurin-21 mvn -B test
```

## Run locally with Docker Compose overlay

```powershell
docker compose --profile spring -f docker-compose.yml -f docker-compose.spring.yml up --build lead-service
```

The service listens on `127.0.0.1:8081`.

Required runtime security settings:

```powershell
$env:QTS_SECURITY_ENABLED = "true"
$env:QTS_IDENTITY_ISSUER = "https://sso.qtsgroup.vn/"
$env:QTS_IDENTITY_JWK_SET_URI = "https://sso.qtsgroup.vn/.well-known/jwks.json"
$env:QTS_IDENTITY_AUDIENCE = "qts-api"
```

The JWT must contain `iss`, `aud`, `exp`, `iat`, `sub`, `token_use=access`, and a
`permissions` array. The service maps permission claims to `PERM_*` authorities.
For Docker-only local Hydra, the compose overlay uses the internal JWKS URL
`http://hydra:4444/.well-known/jwks.json` while keeping the browser-facing issuer
`http://localhost:4444/`; production must use the real HTTPS issuer and its JWKS URL.

## Rollback

Restore the previous known-good `lead-service` image/config. This service
writes only compatible lead and outbox tables, so rollback does not require
schema contraction.
