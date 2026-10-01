# QTS repository layout

The repository is split by runtime ownership. The folder names are intentionally
boring: a new contributor should be able to find the code without knowing the
history of the Django-to-Spring migration.

```text
backend/
  services/                 Spring Boot microservices and the Maven reactor

frontend-client/             Public marketing/landing website

frontend-portal/
  portal/                   Authenticated application launcher
  identity/                 QTS Identity UI: login, logout, MFA, account and launcher

frontend-hrm/                HRM browser application

packages/                    Shared browser packages
infra/                       Ory, gateway and infrastructure configuration
scripts/                     Build, deployment, migration and verification tooling
tests/                       Cross-service and browser tests
docs/                        Architecture, UX and operational documentation
```

Frontend ownership and the shared visual/navigation contract are documented in
[`docs/frontend/README.md`](docs/frontend/README.md). Keep the landing logo as
the only brand source of truth and reuse `@qts/app-chrome` for new
authenticated applications.

## Ownership rules

- `backend/services` owns APIs, persistence, Flyway migrations and service
  security. It does not own browser login screens.
- `frontend-client` owns public marketing pages and the consultation form.
- `frontend-portal/portal` owns the business-app launcher client.
- `frontend-portal/identity` owns the Identity Gateway UI and its server-side
  proxy to the Identity/Ory services.
- `frontend-hrm` owns HRM navigation and HRM-specific presentation. It consumes
  backend APIs through OIDC; it does not issue tokens or manage passwords.
- `packages` contains code shared by two or more browser applications. Do not
  move application-specific screens there just to make the tree look smaller.

## Build entry points

```powershell
npm ci
npm run build
mvnw.cmd -B test
powershell -ExecutionPolicy Bypass -File scripts/spring-production-gate.ps1
```

Docker Compose files stay at the repository root because they orchestrate more
than one ownership boundary. Their Dockerfile paths point to the folders above.

