import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c=paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('103.75.185.136',port=24700,username='root',password='76O^%m)KCJw?e21B<lfB',timeout=30,banner_timeout=30,auth_timeout=30)
def run(cmd, timeout=600):
    print('\n$ '+cmd[:180], flush=True)
    _,o,_=c.exec_command(cmd, timeout=timeout, get_pty=True)
    o.channel.set_combine_stderr(True)
    buf=b''
    import time
    while not o.channel.exit_status_ready():
        if o.channel.recv_ready():
            z=o.channel.recv(65536); buf+=z
        import time as _t; _t.sleep(0.3)
    while o.channel.recv_ready():
        buf+=o.channel.recv(65536)
    txt=buf.decode('utf-8','replace')
    rc=o.channel.recv_exit_status()
    print(txt[-15000:].encode('ascii','replace').decode(), flush=True)
    print('EXIT',rc, flush=True)
    if rc: raise RuntimeError(cmd[:80])
    return txt

base='cd /opt/qtsss && docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml'

# Build missing identity-prod image (sequential, low RAM)
run(base+' --profile prod build identity-prod', 1800)
run(base+' --profile prod images', 60)
run('docker images --format "{{.Repository}} {{.Tag}} {{.Size}}" | grep qtsss', 60)

# Start keycloak and wait healthy via container health
run(base+' up -d keycloak', 180)
# poll health endpoint inside container (no host port dependency yet)
run(base+" exec -T keycloak sh -c 'for i in $(seq 1 45); do curl -fsS http://localhost:8080/health/ready >/dev/null && echo KC_READY && exit 0; sleep 2; done; curl -v http://localhost:8080/health/ready || true; exit 1'", 180)

# Backup before migration (existing data preserved)
run(base+' exec -T db pg_dump -U qts qts > /opt/qtsss-backups/qts-before-migrate-$(date +%Y%m%d%H%M%S).sql && ls -lh /opt/qtsss-backups/qts-before-migrate-*.sql | tail -1', 180)

run(base+' run --rm api python manage.py migrate', 300)
run(base+' run --rm api python manage.py seed_identity', 300)

run(base+' --profile prod up -d --remove-orphans', 240)
import time; time.sleep(10)
run(base+' --profile prod ps', 60)

# Local endpoint checks (no DNS needed) + listener audit
run("for u in http://127.0.0.1:8000/api/v1/health/ http://127.0.0.1:8081/realms/qts/.well-known/openid-configuration http://127.0.0.1:3000 http://127.0.0.1:5174 http://127.0.0.1:3001; do printf '%s ' \"$u\"; curl -fsS -o /dev/null -w '%{http_code}\n' --max-time 15 \"$u\" || echo fail; done", 120)
run("ss -ltnp | grep -E ':(3000|3001|5174|8000|8081|5432|6379)\b' || ss -ltnp", 60)
run("cat /opt/qtsss/.env.production | grep -E '^(DJANGO|POSTGRES|CORS|IDENTITY|KEYCLOAK|VITE|NEXT)' | sed 's/=.*/=***/'", 30)
run("ls -l /root/qts-keycloak-admin.txt && cat /etc/caddy/Caddyfile", 30)

c.close()
print('\nDEPLOY CONTINUE OK')
