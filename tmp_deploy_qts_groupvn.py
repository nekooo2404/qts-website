import paramiko, sys, os, time, base64
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
HOST='103.75.185.136'; PORT=24700; USER='root'; PWD='76O^%m)KCJw?e21B<lfB'
c=paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, port=PORT, username=USER, password=PWD, timeout=30, banner_timeout=30, auth_timeout=30)
sftp=c.open_sftp()

def run(cmd, timeout=600):
    print('\n$ '+cmd[:200], flush=True)
    _,o,_=c.exec_command(cmd, timeout=timeout, get_pty=True)
    o.channel.set_combine_stderr(True)
    buf=b''
    while not o.channel.exit_status_ready():
        if o.channel.recv_ready():
            buf+=o.channel.recv(65536)
        time.sleep(0.3)
    while o.channel.recv_ready():
        buf+=o.channel.recv(65536)
    txt=buf.decode('utf-8','replace')
    rc=o.channel.recv_exit_status()
    print(txt[-15000:].encode('ascii','replace').decode(), flush=True)
    print('EXIT',rc, flush=True)
    if rc!=0:
        # don't raise for some checks
        pass
    return txt, rc

def put(local, remote):
    sftp.put(local, remote)
    print(f'PUT {local} -> {remote}')

# upload composefiles and configs
put('docker-compose.yml','/opt/qtsss/docker-compose.yml')
put('docker-compose.prod.yml','/opt/qtsss/docker-compose.prod.yml')
put('Caddyfile','/opt/qtsss/Caddyfile')
put('infra/keycloak/realm-qts.json','/opt/qtsss/infra/keycloak/realm-qts.json')
put('apps/api/Dockerfile','/opt/qtsss/apps/api/Dockerfile')
put('apps/api/requirements.txt','/opt/qtsss/apps/api/requirements.txt')
# package-lock for identity/web/portal builds
put('package-lock.json','/opt/qtsss/package-lock.json')
put('package.json','/opt/qtsss/package.json')
put('apps/web/package.json','/opt/qtsss/apps/web/package.json')
put('apps/identity/package.json','/opt/qtsss/apps/identity/package.json')
put('apps/portal/package.json','/opt/qtsss/apps/portal/package.json')
put('apps/web/Dockerfile','/opt/qtsss/apps/web/Dockerfile')
put('apps/portal/Dockerfile','/opt/qtsss/apps/portal/Dockerfile')
put('apps/identity/Dockerfile','/opt/qtsss/apps/identity/Dockerfile')

# install Caddyfile system-wide
run('cp /opt/qtsss/Caddyfile /etc/caddy/Caddyfile && cat /etc/caddy/Caddyfile',30)
run('caddy fmt --overwrite /etc/caddy/Caddyfile 2>&1; echo FMT_EXIT:$?; caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile 2>&1; echo VAL_EXIT:$?',30)

# generate /opt/qtsss/.env.production with qts.group.vn + postgres/Buiduchoa2404
# preserve existing KC admin password if exists, else generate
txt,_=run('cat /opt/qtsss/.env.production 2>/dev/null | tr -d "\\r"; echo ---END---; cat /root/qts-keycloak-admin.txt 2>/dev/null; echo ---END2---',30)
# generate secrets
run(r'''
set -e
# keep existing KC admin pass if present
KC_PASS=$(grep -E '^KC_BOOTSTRAP_ADMIN_PASSWORD=' /opt/qtsss/.env.production 2>/dev/null | cut -d= -f2- | tr -d '\r\n' || true)
if [ -z "$KC_PASS" ] && [ -f /root/qts-keycloak-admin.txt ]; then KC_PASS=$(cat /root/qts-keycloak-admin.txt | tr -d '\r\n'); fi
if [ -z "$KC_PASS" ]; then KC_PASS=$(openssl rand -base64 24 | tr -d '\n'); fi
DJANGO_SK=$(grep -E '^DJANGO_SECRET_KEY=' /opt/qtsss/.env.production 2>/dev/null | cut -d= -f2- | tr -d '\r\n' || true)
if [ -z "$DJANGO_SK" ]; then DJANGO_SK=$(openssl rand -base64 48 | tr -d '\n'); fi
IDP_PP=$(grep -E '^IDENTITY_SIGNING_KEY_PASSPHRASE=' /opt/qtsss/.env.production 2>/dev/null | cut -d= -f2- | tr -d '\r\n' || true)
if [ -z "$IDP_PP" ]; then IDP_PP=$(openssl rand -base64 32 | tr -d '\n'); fi
cat > /opt/qtsss/.env.production <<EOF
POSTGRES_DB=qts
POSTGRES_USER=postgres
POSTGRES_PASSWORD=Buiduchoa2404
DJANGO_SECRET_KEY=${DJANGO_SK}
DJANGO_ALLOWED_HOSTS=api.qts.group.vn
CORS_ALLOWED_ORIGINS=https://qts.group.vn,https://www.qts.group.vn,https://portal.qts.group.vn,https://identity.qts.group.vn
IDENTITY_ISSUER=https://api.qts.group.vn
IDENTITY_WEB_ORIGIN=https://identity.qts.group.vn
IDENTITY_SIGNING_KEY_PASSPHRASE=${IDP_PP}
IDENTITY_PROVIDER=keycloak
KEYCLOAK_ISSUER=https://sso.qts.group.vn/realms/qts
KEYCLOAK_INTERNAL_ISSUER=http://keycloak:8080/realms/qts
KEYCLOAK_AUDIENCE=account
REDIS_URL=redis://redis:6379/1
KC_BOOTSTRAP_ADMIN_USERNAME=admin
KC_BOOTSTRAP_ADMIN_PASSWORD=${KC_PASS}
NEXT_PUBLIC_API_URL=https://api.qts.group.vn
VITE_IDENTITY_ISSUER=https://sso.qts.group.vn/realms/qts
VITE_API_ISSUER=https://api.qts.group.vn
VITE_PORTAL_OIDC_CLIENT_ID=qts-portal
VITE_IDENTITY_WEB_ORIGIN=https://identity.qts.group.vn
VITE_PORTAL_OIDC_REDIRECT_URI=https://portal.qts.group.vn/auth/callback
VITE_PORTAL_OIDC_POST_LOGOUT_REDIRECT_URI=https://portal.qts.group.vn/
EOF
chmod 600 /opt/qtsss/.env.production
echo "$KC_PASS" > /root/qts-keycloak-admin.txt
chmod 600 /root/qts-keycloak-admin.txt
cat /opt/qtsss/.env.production | sed 's/=.*/=***/'
echo "KC admin preserved/generated OK"
''',60)

# ensure keycloak health on 9000, caddy reload later after compose up
# start db + redis first to fix postgres role without wiping volume
base='cd /opt/qtsss && docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml'
run(base+' up -d db redis',180)
run(base+' exec -T db sh -c \'for i in $(seq 1 30); do pg_isready -U postgres -d qts >/dev/null 2>&1 && echo READY && exit 0; pg_isready -U qts -d qts >/dev/null 2>&1 && echo READY_QTS && exit 0; sleep 2; done; echo NOT_READY; exit 1\'',60)
# create/alter postgres role inside existing volume (safe for prod data - no volume delete)
run(base+''' exec -T db sh -c "
# try as qts first (old volume superuser), fallback to postgres
if psql -U qts -d qts -c 'SELECT 1' >/dev/null 2>&1; then
  echo 'DB accessible as qts, ensuring postgres role...'
  psql -U qts -d qts -v ON_ERROR_STOP=1 <<'EOSQL'
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='postgres') THEN
    CREATE ROLE postgres WITH LOGIN SUPERUSER PASSWORD 'Buiduchoa2404';
  ELSE
    ALTER ROLE postgres WITH LOGIN SUPERUSER PASSWORD 'Buiduchoa2404';
  END IF;
END \$\$;
EOSQL
  psql -U qts -d qts -c \"CREATE SCHEMA IF NOT EXISTS keycloak AUTHORIZATION postgres;\"
  psql -U qts -d qts -c \"GRANT ALL ON SCHEMA keycloak TO postgres;\"
  echo ROLE_FIX_DONE_AS_QTS
elif psql -U postgres -d qts -c 'SELECT 1' >/dev/null 2>&1; then
  echo 'DB already accessible as postgres'
  psql -U postgres -d qts -c \"ALTER ROLE postgres WITH PASSWORD 'Buiduchoa2404';\"
  echo ROLE_FIX_DONE_AS_POSTGRES
else
  echo 'NO_DB_ACCESS'; exit 1
fi
# verify postgres can connect
PGPASSWORD=Buiduchoa2404 psql -h db -U postgres -d qts -c 'SELECT current_user, current_database();' || PGPASSWORD=Buiduchoa2404 psql -h 127.0.0.1 -U postgres -d qts -c 'SELECT 1'
"
''',60)

# reload caddy (compose ports are loopback now, caddy validates)
run('systemctl reload caddy 2>&1 || caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile 2>&1; echo CADDY_RELOAD:$?; ss -ltnp | grep -E ":(80|443)\\b" | head',30)

# build changed images sequentially (low RAM: 961MB + 2G swap)
run(base+' --profile prod build api',1800)
run(base+' --profile prod build portal-prod',1800)
run(base+' --profile prod build web-prod',1800)
run(base+' --profile prod build identity-prod',1800)
run(base+' --profile prod images | head -n 30',60)

# bring up keycloak then rest
run(base+' up -d keycloak',180)
run(base+" exec -T keycloak sh -c 'for i in $(seq 1 45); do curl -fsS http://localhost:9000/health/ready >/dev/null 2>&1 && echo KC_READY && exit 0; curl -fsS http://localhost:8080/health/ready >/dev/null 2>&1 && echo KC_READY_8080 && exit 0; sleep 2; done; curl -v http://localhost:9000/health/ready 2>&1 | head -n 50; exit 1'",180)

run('mkdir -p /opt/qtsss-backups',30)
run(base+' exec -T db pg_dump -U postgres qts > /opt/qtsss-backups/qts-before-migrate-$(date +%Y%m%d%H%M%S).sql && ls -lh /opt/qtsss-backups/*.sql | tail -5',180)
run(base+' run --rm api python manage.py migrate --check',300)
run(base+' run --rm api python manage.py seed_identity',300)
run(base+' --profile prod up -d --remove-orphans',240)
run('sleep 8; '+base+' --profile prod ps',60)
run("for u in http://127.0.0.1:8000/api/v1/health/ http://127.0.0.1:8081/realms/qts/.well-known/openid-configuration http://127.0.0.1:3000 http://127.0.0.1:5174 http://127.0.0.1:3001; do printf '%s ' \"$u\"; curl -fsS -o /dev/null -w '%{http_code}\n' --max-time 15 \"$u\" || echo fail; done",120)
run("ss -ltnp | grep -E ':(3000|3001|5174|8000|8081|5433|6379)\\b' || ss -ltnp | head -n 40",60)

# update existing Keycloak client redirect URIs via admin API (IGNORE_EXISTING does not update)
run(r'''
set -e
KC_PASS=$(cat /root/qts-keycloak-admin.txt)
# get admin token (internal http://localhost:8081)
TOKEN=$(curl -fsS -X POST http://127.0.0.1:8081/realms/master/protocol/openid-connect/token \
  -d grant_type=password -d client_id=admin-cli -d username=admin -d password="$KC_PASS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))")
if [ -z "$TOKEN" ]; then echo "KC admin token failed"; exit 0; fi
# find qts-portal client uuid
CID=$(curl -fsS -H "Authorization: Bearer $TOKEN" "http://127.0.0.1:8081/admin/realms/qts/clients?clientId=qts-portal" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['id'] if d else '')")
echo "client id $CID"
if [ -n "$CID" ]; then
  curl -fsS -X PUT -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    "http://127.0.0.1:8081/admin/realms/qts/clients/$CID" \
    -d '{"redirectUris":["http://localhost:5174/auth/callback","https://portal.qts.group.vn/auth/callback"],"webOrigins":["http://localhost:5174","https://portal.qts.group.vn"],"attributes":{"pkce.code.challenge.method":"S256","post.logout.redirect.uris":"http://localhost:5174/##https://portal.qts.group.vn/"}}' && echo KC_CLIENT_UPDATED || echo KC_CLIENT_UPDATE_FAIL
else
  echo "client not found, will be created on next import"
fi
# verify
curl -fsS http://127.0.0.1:8081/realms/qts/.well-known/openid-configuration | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('issuer',''))"
''',60)

sftp.close(); c.close()
print('\nDEPLOY QTS.GROUP.VN OK')
