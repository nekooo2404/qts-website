# QTS Production Backend Specification

QTS production backend is Spring Boot services plus Ory Hydra/Kratos.

## Runtime owners

| Domain | Runtime owner |
|---|---|
| Consultation leads | `lead-service` |
| Durable events and notifications | `event-service` |
| Attendance devices and sync | `attendance-service` |
| Identity admin, session, launcher, userinfo | `identity-admin-service` |
| Hydra login, consent, logout bridge | `identity-bridge-service` |
| HRM employees and organization | `hrm-service` |

## Required standards

- Java 21, Spring Boot, Spring Security Resource Server.
- OAuth2/OIDC via Ory Hydra.
- Passwords, MFA and browser sessions via Ory Kratos.
- PostgreSQL for durable data.
- Redis Streams for event delivery.
- Flyway for schema migration.
- Actuator readiness/liveness probes.
- Non-root, read-only production containers.
- HTTPS-only public origins.
- Secrets from environment or secret manager, never browser variables.

## Production governance

The implementation standards above are complemented by the
[QTS Production Governance Pack](../production-governance/README.md). It
contains the requirements traceability matrix, ownership and security
decisions, reliability objectives, backup/restore, audit retention, test
acceptance, topology, threat model and operational procedures required before
production approval.

## Active deploy path

Production deploy uses:

- `docker-compose.yml`
- `docker-compose.prod.yml`
- `docker-compose.spring.yml`
- `docker-compose.spring.prod.yml`
- `docker-compose.spring.cutover.yml`
- `scripts/validate-production-env.sh`
- `scripts/spring-production-gate.ps1` or `scripts/spring-production-gate.sh`

Historical backend runtimes are not part of production deploy, CI, gateway
routing or local bootstrap.
