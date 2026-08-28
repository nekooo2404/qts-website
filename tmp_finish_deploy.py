import paramiko, time, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
H='103.75.185.136'; P=24700; PW='76O^%m)KCJw?e21B<lfB'
c=paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(H,port=P,username='root',password=PW,timeout=30,banner_timeout=30,auth_timeout=30)
def run(cmd,timeout=600):
    print('\n$ '+cmd[:200],flush=True)
    _,o,_=c.exec_command(cmd,timeout=timeout,get_pty=True);o.channel.set_combine_stderr(True); data=b''
    while not o.channel.exit_status_ready():
        if o.channel.recv_ready(): data+=o.channel.recv(65536)
        time.sleep(.4)
    while o.channel.recv_ready():data+=o.channel.recv(65536)
    text=data.decode('utf8','replace');rc=o.channel.recv_exit_status()
    print(text[-16000:].encode('ascii','replace').decode(),flush=True);print('EXIT',rc,flush=True)
    if rc: raise RuntimeError(cmd)
    return text
base='cd /opt/qtsss && docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml'
run(base+' --profile prod images',60)
# Each image sequentially; retry incomplete web image from prior client timeout.
for svc in ['web-prod','portal-prod','identity-prod']:
    run(base+' --profile prod build '+svc,1800)
run(base+' up -d db redis',180)
run("for i in $(seq 1 30); do [ \"$(docker inspect -f '{{.State.Health.Status}}' qtsss-db-1 2>/dev/null)\" = healthy ] && [ \"$(docker inspect -f '{{.State.Health.Status}}' qtsss-redis-1 2>/dev/null)\" = healthy ] && exit 0; sleep 2; done; exit 1",90)
# Existing database preserved; take fresh logical backup before migrate.
run(base+" exec -T db pg_dump -U qts qts > /opt/qtsss-backups/qts-before-migrate-$(date +%Y%m%d%H%M%S).sql && ls -lh /opt/qtsss-backups/qts-before-migrate-*.sql | tail -1",180)
run(base+' up -d keycloak-db-init && '+base+' wait keycloak-db-init',240)
run(base+' up -d keycloak',180)
run(base+" exec -T keycloak sh -c 'for i in $(seq 1 45); do curl -fsS http://localhost:8080/health/ready >/dev/null && exit 0; sleep 2; done; exit 1'",150)
run(base+' run --rm api python manage.py migrate',300)
run(base+' run --rm api python manage.py seed_identity',300)
run(base+' --profile prod up -d --remove-orphans',240)
run('sleep 10; '+base+' --profile prod ps',120)
run("for u in http://127.0.0.1:8000/api/v1/health/ http://127.0.0.1:8081/realms/qts/.well-known/openid-configuration http://127.0.0.1:3000 http://127.0.0.1:5174 http://127.0.0.1:3001; do printf '%s ' \"$u\"; curl -fsS -o /dev/null -w '%{http_code}\\n' --max-time 15 \"$u\"; done",180)
run("ss -ltnp | grep -E ':(3000|3001|5174|8000|8081|5432|6379)\\b'",60)
c.close();print('DEPLOY OK')
