import paramiko, time, sys, base64
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
H='103.75.185.136'; P=24700; PW='76O^%m)KCJw?e21B<lfB'
c=paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(hostname=H, port=P, username='root', password=PW, timeout=30, banner_timeout=30, auth_timeout=30)
def run(cmd, timeout=600, tail=14000):
    print('\n$ ' + cmd[:200], flush=True)
    _,o,_=c.exec_command(cmd, timeout=timeout, get_pty=True)
    o.channel.set_combine_stderr(True)
    buf=b''; last=time.time()
    while not o.channel.exit_status_ready():
        if o.channel.recv_ready():
            z=o.channel.recv(65536); buf+=z
            now=time.time()
            if now-last>4:
                print(z.decode('utf-8','replace').encode('ascii','replace').decode(), end='', flush=True)
                last=now
        time.sleep(0.3)
    while o.channel.recv_ready():
        z=o.channel.recv(65536); buf+=z
        print(z.decode('utf-8','replace').encode('ascii','replace').decode(), end='', flush=True)
    txt=buf.decode('utf-8','replace')
    print('\n--- EXIT %d TAIL ---\n%s' % (o.channel.recv_exit_status(), txt[-tail:].encode('ascii','replace').decode()), flush=True)
    rc=o.channel.recv_exit_status()
    if rc:
        raise RuntimeError('failed %d: %s' % (rc, cmd[:120]))
    return txt

patch = r"""
from pathlib import Path
p=Path('/opt/qtsss/docker-compose.yml')
s=p.read_text()
m={'"5432:5432"':'"127.0.0.1:5432:5432"','"6379:6379"':'"127.0.0.1:6379:6379"','"8081:8080"':'"127.0.0.1:8081:8080"','"8000:8000"':'"127.0.0.1:8000:8000"','"3001:3001"':'"127.0.0.1:3001:3001"','"3000:3000"':'"127.0.0.1:3000:3000"','"5174:80"':'"127.0.0.1:5174:80"'}
for a,b in m.items(): s=s.replace(a,b)
p.write_text(s)
print('patched')
"""
run("echo %s | base64 -d | python3" % base64.b64encode(patch.encode()).decode(), 60)
run("cd /opt/qtsss && grep -q '^KC_BOOTSTRAP_ADMIN_PASSWORD=' .env.production || { p=$(openssl rand -base64 32 | tr -d '\\n' | tr '/+' '_-'); printf '\\nKC_BOOTSTRAP_ADMIN_USERNAME=admin\\nKC_BOOTSTRAP_ADMIN_PASSWORD=%s\\n' \"$p\" >> .env.production; umask 077; printf 'username=admin\\npassword=%s\\n' \"$p\" > /root/qts-keycloak-admin.txt; chmod 600 /root/qts-keycloak-admin.txt; } && ls -l /root/qts-keycloak-admin.txt .env.production", 60)
run("cd /opt/qtsss && docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml --profile prod config -q && echo CONFIG_OK", 60)
# Build sequentially to fit 1GB RAM
run("cd /opt/qtsss && docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml --profile prod build api", 1800, 20000)
run("cd /opt/qtsss && docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml --profile prod build web-prod", 1800, 20000)
run("cd /opt/qtsss && docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml --profile prod build portal-prod", 1800, 20000)
run("cd /opt/qtsss && docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml --profile prod build identity-prod", 1800, 20000)
run("cd /opt/qtsss && docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml up -d db redis && docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml ps", 180)
run("cd /opt/qtsss && for i in $(seq 1 30); do [ \"$(docker inspect -f '{{.State.Health.Status}}' qtsss-db-1 2>/dev/null)\" = healthy ] && [ \"$(docker inspect -f '{{.State.Health.Status}}' qtsss-redis-1 2>/dev/null)\" = healthy ] && echo READY && exit 0; sleep 2; done; docker ps -a; docker logs qtsss-db-1 --tail=50; exit 1", 120)
run("cd /opt/qtsss && umask 077 && docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml exec -T db pg_dump -U qts qts > /opt/qtsss-backups/qts-before-migrate-$(date +%Y%m%d%H%M%S).sql && ls -lh /opt/qtsss-backups/qts-before-migrate-*.sql | tail -1", 180)
run("cd /opt/qtsss && docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml up -d keycloak-db-init && docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml wait keycloak-db-init && echo KC_INIT_OK", 240)
run("cd /opt/qtsss && docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml up -d keycloak", 180)
run("cd /opt/qtsss && for i in $(seq 1 45); do curl -fsS http://127.0.0.1:8081/health/ready >/dev/null && echo KC_READY && exit 0; sleep 2; done; docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml logs --tail=120 keycloak; exit 1", 150, 14000)
run("cd /opt/qtsss && docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml run --rm api python manage.py migrate", 300)
run("cd /opt/qtsss && docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml run --rm api python manage.py seed_identity", 300)
run("cd /opt/qtsss && docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml --profile prod up -d --remove-orphans", 240)
run("sleep 10; cd /opt/qtsss && docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml --profile prod ps", 120)
# verify local endpoints + listener audit
run(r"for u in http://127.0.0.1:8000/api/v1/health/ http://127.0.0.1:8081/realms/qts/.well-known/openid-configuration http://127.0.0.1:3000 http://127.0.0.1:5174 http://127.0.0.1:3001; do echo ==== $u; curl -fsSI --max-time 15 $u | head -n 1; done", 180)
run("ss -ltnp | grep -E ':(3000|3001|5174|8000|8081|5432|6379)\\b' || ss -ltnp", 60)
c.close()
print('\nDEPLOY OK')
