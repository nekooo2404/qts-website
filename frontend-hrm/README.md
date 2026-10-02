# Frontend HRM

`frontend-hrm` is the HRM browser application. It owns HRM routes, screens,
fixtures and presentation. Authentication is delegated to QTS Identity via
OIDC, and authorization is enforced again by the HRM Spring service.

- Package: `@qts/hrm`
- Local development: `npm run dev:hrm`
- Production build: `npm run build:hrm`
- Docker port: `5175`
