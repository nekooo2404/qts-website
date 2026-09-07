# QTS Production Deployment

## Runtime layout

Production is one Docker Compose project named `qtsss`. Always deploy with
`./deploy.sh`; do not run an unqualified `docker compose up` from a second copy
of the repository. The script refuses to run when another checkout already
owns the `qtsss` project.

| Service | Host binding | Purpose |
| --- | --- | --- |
| `db` | none in production | PostgreSQL 16 |
| `redis` | none in production | Application cache |
| `keycloak` | `127.0.0.1:8081` | OIDC identity provider |
| `api` | `127.0.0.1:8000` | Django API |
| `web-prod` | `127.0.0.1:3000` | Marketing site |
| `portal-prod` | `127.0.0.1:5174` | Portal SPA |
| `identity-prod` | `127.0.0.1:3001` | Identity Center |

Caddy is the only public listener on ports 80 and 443.

## Prerequisites

- Docker Engine and Docker Compose v2
- Bash, curl, and enough disk space for four application images
- DNS A records for all production hosts pointing to the deployment server
- Caddy running with ports 80 and 443 reachable from the internet

Required DNS names:

```text
qtsgroup.vn
www.qtsgroup.vn
portal.qtsgroup.vn
api.qtsgroup.vn
sso.qtsgroup.vn
```

## Production environment

Create `.env.production` with mode `0600`. It is ignored by Git.

```bash
COMPOSE_PROJECT_NAME=qtsss
POSTGRES_DB=qts
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<strong-random-password>

DJANGO_SECRET_KEY=<openssl-rand-hex-32>
DJANGO_ALLOWED_HOSTS=api.qtsgroup.vn,qtsgroup.vn,www.qtsgroup.vn,api
CORS_ALLOWED_ORIGINS=https://qtsgroup.vn,https://www.qtsgroup.vn,https://portal.qtsgroup.vn
IDENTITY_ISSUER=https://api.qtsgroup.vn
IDENTITY_WEB_ORIGIN=https://qtsgroup.vn/identity
IDENTITY_SIGNING_KEY_PASSPHRASE=<openssl-rand-hex-32>
IDENTITY_PROVIDER=keycloak
KEYCLOAK_ISSUER=https://sso.qtsgroup.vn/realms/qts
KEYCLOAK_INTERNAL_ISSUER=http://keycloak:8080/realms/qts
KEYCLOAK_AUDIENCE=account
KC_BOOTSTRAP_ADMIN_USERNAME=admin
KC_BOOTSTRAP_ADMIN_PASSWORD=<strong-random-password>
DEMO_PASSWORD=<strong-random-password>

VITE_IDENTITY_ISSUER=https://sso.qtsgroup.vn/realms/qts
VITE_API_ISSUER=https://api.qtsgroup.vn
VITE_PORTAL_OIDC_CLIENT_ID=qts-portal
VITE_IDENTITY_WEB_ORIGIN=https://qtsgroup.vn/identity
VITE_PORTAL_OIDC_REDIRECT_URI=https://portal.qtsgroup.vn/auth/callback
VITE_PORTAL_OIDC_POST_LOGOUT_REDIRECT_URI=https://portal.qtsgroup.vn/
```

## Deploy

```bash
chmod 600 .env.production
chmod +x deploy.sh scripts/backup.sh scripts/restore.sh
ENV_FILE=.env.production ./deploy.sh
```

The deploy is idempotent and performs these gates in order:

1. Validate the merged production Compose configuration.
2. Refuse to continue if the obsolete `qts` Compose project still exists.
3. Create a PostgreSQL custom-format backup using the configured database/user.
4. Build application images sequentially to avoid VPS memory exhaustion.
5. Start and wait for PostgreSQL, Redis, and Keycloak.
6. Apply migrations, verify that none remain, and seed identity data.
7. Recreate the production services with restart policies.
8. Check every local service endpoint.

Backups are stored in `./backups` with directory mode `0700`. A failed or empty
backup stops the deployment.

## Verification

```bash
docker compose -p qtsss --env-file .env.production \
  -f docker-compose.yml -f docker-compose.prod.yml --profile prod ps

curl -fsS -H 'Host: api.qtsgroup.vn' -H 'X-Forwarded-Proto: https' \
  http://127.0.0.1:8000/api/v1/health/
curl -fsS http://127.0.0.1:8081/realms/qts/.well-known/openid-configuration >/dev/null
curl -fsS http://127.0.0.1:3000/ >/dev/null
curl -fsS http://127.0.0.1:5174/health
curl -fsS http://127.0.0.1:3001/identity/apps >/dev/null
```

Verify DNS before expecting Caddy to issue certificates:

```bash
for host in qtsgroup.vn www.qtsgroup.vn portal.qtsgroup.vn \
  api.qtsgroup.vn sso.qtsgroup.vn; do
  getent ahostsv4 "$host" | awk -v host="$host" 'NR == 1 { print host, $1 }'
done
```

## Backup and restore

Nightly backup example:

```cron
17 2 * * * ENV_FILE=/opt/qtsss/.env.production /opt/qtsss/scripts/backup.sh
```

Keep count defaults to seven and can be changed with `KEEP=14`.

Restore is interactive and overwrites current database state:

```bash
ENV_FILE=.env.production ./scripts/restore.sh backups/backup-YYYYMMDD-HHMMSS.dump
```

## Rollback

Application rollback does not rename or delete the `qtsss_qts_postgres` volume.

1. Restore the previous Compose files/images.
2. Start the previous release with the same project name.
3. Restore the pre-deploy dump only if a database migration must be reversed.

```bash
docker compose -p qtsss --env-file .env.production \
  -f docker-compose.yml -f docker-compose.prod.yml --profile prod up -d

ENV_FILE=.env.production ./scripts/restore.sh backups/backup-YYYYMMDD-HHMMSS.dump
```

Never run `down -v`; it deletes the production database volume.
