# QTS Enterprise Ecosystem

A product-led public QTS website, dark-mode internal operations portal, and Django REST API foundation.

## Applications

| Application | URL | Purpose |
| --- | --- | --- |
| `apps/web` | `http://localhost:3000` | QTS marketing and consultation experience |
| `apps/portal` | `http://localhost:5174` | Internal QTS enterprise operating portal |
| `apps/api` | `http://localhost:8000` | Django REST API, JWT auth, lead persistence |

## Local setup

PostgreSQL is required for the Django API. The supported development workflow runs the API and PostgreSQL through Docker Compose.

1. Install frontend dependencies from the repository root:

   ```bash
   npm install
   ```

2. Start PostgreSQL and the Django API:

   ```bash
   docker compose up --build -d
   docker compose exec api python manage.py migrate
   ```

   Docker Compose supplies `POSTGRES_HOST=db` to the API container. For a Django process run directly on the host, set `POSTGRES_HOST=localhost` together with all other required `POSTGRES_*` values from `.env.example`.

3. Start the public website and portal in separate terminals:

   ```bash
   npm run dev:web
   npm run dev:portal
   ```

4. To run API tests without a PostgreSQL service, use the dedicated test settings:

   ```bash
   cd apps/api
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   python manage.py test --settings=config.settings_test
   ```

## Identity setup

Copy `.env.example` to `.env` and choose an identity provider.

### Local Django OIDC

`IDENTITY_PROVIDER=local` is default. Start Compose, migrate, seed identity, then point the portal at Django:

```bash
docker compose up --build -d
docker compose exec api python manage.py migrate
docker compose exec api python manage.py seed_identity
```

```dotenv
VITE_IDENTITY_ISSUER=http://localhost:8000
VITE_API_ISSUER=http://localhost:8000
VITE_PORTAL_OIDC_CLIENT_ID=<client-id-printed-by-seed_identity>
```

### Keycloak OIDC

Set `IDENTITY_PROVIDER=keycloak`, then start Keycloak with PostgreSQL and seed Django entitlement data:

```bash
docker compose up --build -d db redis keycloak api
docker compose exec api python manage.py migrate
docker compose exec api python manage.py seed_identity
```

Set `apps/portal/.env.local`:

```dotenv
VITE_IDENTITY_ISSUER=http://localhost:8081/realms/qts
VITE_API_ISSUER=http://localhost:8000
VITE_PORTAL_OIDC_CLIENT_ID=qts-portal
VITE_PORTAL_OIDC_REDIRECT_URI=http://localhost:5174/auth/callback
VITE_PORTAL_OIDC_POST_LOGOUT_REDIRECT_URI=http://localhost:5174/
```

Portal is a public PKCE client. Never place a client secret in `.env.local` or any `VITE_*` variable; Vite embeds these values in browser JavaScript. Development Keycloak admin is `admin` / `admin-local`; seeded users use `QtsDemo!2026`. Both are development-only credentials, never production credentials.

## API routes

- `GET /api/v1/health/` — service health
- `GET /api/v1/overview/` — QTS operating overview
- `POST /api/v1/leads/consultation/` — public consultation lead
- `GET /api/schema/` and `GET /api/docs/` — OpenAPI schema and Swagger UI

## Quality commands

```bash
npm run typecheck
npm run build
```

The public site uses purpose-driven Framer Motion interactions. The portal is dense by design, supports responsive breakpoints and command search, and ships populated enterprise module states instead of empty screens.
