# QTS Production Deployment

## Architecture

| Service | Port | Image | Purpose |
|---------|------|-------|---------|
| db | 5432 | postgres:16-alpine | PostgreSQL |
| redis | 6379 | redis:7-alpine | Cache |
| keycloak | 8081 | quay.io/keycloak/keycloak:26.1 | OIDC IdP |
| api | 8000 | qts-api (local build) | Django REST |
| web-prod | 3000 | qts-web (local build) | Next.js site |
| portal-prod | 5174 | nginx:1.27-alpine | Portal SPA |
| identity-prod | 3001 | qts-identity (local build) | Identity Center |

## Prerequisites

- Docker + Docker Compose v2
- Reverse proxy with TLS (Caddy, Traefik, nginx) in front
- Domain names for: web, portal, identity, api, keycloak

## Environment (.env.production)

Create `.env.production` (never commit):

```bash
DJANGO_SECRET_KEY=<openssl rand -hex 32>
DJANGO_ALLOWED_HOSTS=api.yourdomain.com
DJANGO_DEBUG=false
IDENTITY_SIGNING_KEY_PASSPHRASE=<openssl rand -hex 32>
POSTGRES_DB=qts
POSTGRES_USER=qts
POSTGRES_PASSWORD=<strong random>
CORS_ALLOWED_ORIGINS=https://web.yourdomain.com,https://portal.yourdomain.com,https://identity.yourdomain.com
IDENTITY_ISSUER=https://api.yourdomain.com
IDENTITY_WEB_ORIGIN=https://identity.yourdomain.com
IDENTITY_PROVIDER=keycloak
KEYCLOAK_ISSUER=https://keycloak.yourdomain.com/realms/qts
KEYCLOAK_INTERNAL_ISSUER=http://keycloak:8080/realms/qts
KEYCLOAK_AUDIENCE=account

# Portal build args (embedded in browser JS — public, no secrets)
VITE_IDENTITY_ISSUER=https://keycloak.yourdomain.com/realms/qts
VITE_API_ISSUER=https://api.yourdomain.com
VITE_PORTAL_OIDC_CLIENT_ID=qts-portal
VITE_IDENTITY_WEB_ORIGIN=https://identity.yourdomain.com
VITE_PORTAL_OIDC_REDIRECT_URI=https://portal.yourdomain.com/auth/callback
VITE_PORTAL_OIDC_POST_LOGOUT_REDIRECT_URI=https://portal.yourdomain.com/

NEXT_PUBLIC_API_URL=https://api.yourdomain.com
API_TAG=latest
```

## Deployment Steps

Automated script covers steps 1-6: `ENV_FILE=.env.production ./deploy.sh`. Manual steps below.

### 1. Backup (always before deploy)

```bash
docker compose exec db pg_dump -U qts -Fc qts > backup-$(date +%Y%m%d-%H%M).dump
```

### 2. Build images

```bash
docker compose build --profile prod
```

### 3. Migrate (check mode — safe, no write)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm api python manage.py migrate --check
```

### 4. Seed identity (first deploy only)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm api python manage.py seed_identity
```

### 5. Start production stack

```bash
docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml up -d --profile prod
```

### 6. Verify

```bash
curl -s http://localhost:8000/api/v1/health/   # {"status":"ok",...}
curl -s http://localhost:3000/                 # Next.js HTML
curl -s http://localhost:5174/                 # Portal HTML
curl -s http://localhost:8081/realms/qts/.well-known/openid-configuration | head -5
```

### 7. Keycloak realm import

Realm JSON auto-imported from `infra/keycloak/realm-qts.json` on first Keycloak start. Verify:
- Realm `qts` exists
- Client `qts-portal` is public, PKCE S256
- 4 users with emails matching seed data

**Production client config (required):** `realm-qts.json` ships with localhost-only
`redirectUris`, `webOrigins`, and `post.logout.redirect.uris`. Before production sign-in
works, update client `qts-portal` in the Keycloak admin console:
- `redirectUris`: `https://portal.qts.example.com/auth/callback`
- `webOrigins`: `https://portal.qts.example.com`
- `post.logout.redirect.uris`: `https://portal.qts.example.com/`

### 8. Lock down host ports

Compose currently publishes `5432`, `6379`, `8081`, etc. on all interfaces. For production,
bind to loopback so only the reverse proxy reaches them — edit `docker-compose.yml`:

```yaml
ports: ["127.0.0.1:5432:5432"]   # db
ports: ["127.0.0.1:6379:6379"]   # redis
ports: ["127.0.0.1:8081:8080"]   # keycloak
```

## Rollback

### If deploy fails:

```bash
# 1. Stop new containers
docker compose --profile prod down

# 2. Restore DB from backup
docker compose exec -T db pg_restore -U qts -d qts --clean --if-exists < backup-YYYYMMDD-HHMM.dump

# 3. Restart previous images
docker compose --profile prod up -d
```

### If migration corrupts DB:

```bash
docker compose exec -T db pg_restore -U qts -d qts --clean --if-exists < backup-YYYYMMDD-HHMM.dump
```

## Reverse Proxy (example: Caddy)

A ready-to-edit example lives in `Caddyfile` at the repo root:

Django already sets `SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")` so `SECURE_SSL_REDIRECT` works behind proxy.

## Backup operations

- Nightly: cron `17 2 * * * /path/to/qtsss/scripts/backup.sh` — dumps `backup-*.dump`, keeps newest 7.
- Restore (interactive confirmation): `./scripts/restore.sh backups/backup-YYYYMMDD-HHMMSS.dump`.
- `deploy.sh` also takes a pre-deploy backup into `./backups/` automatically.

## Monitoring

- API health: `GET /api/v1/health/`
- Keycloak health: `GET /health/ready`
- Portal: `GET /health` (nginx stub)
- DB: `pg_isready -h db -U qts`

## Known Limitations

- `start-dev` mode for Keycloak — switch to `start --optimized` + `build` image for production Keycloak
- No media file storage configured (only static files via Whitenoise)
- Portal JS chunk >500 kB — consider code splitting in future
