import paramiko, sys, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c=paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('103.75.185.136',port=24700,username='root',password='76O^%m)KCJw?e21B<lfB',timeout=30,banner_timeout=30,auth_timeout=30)
def run(cmd, timeout=120):
    print('\n$ '+cmd[:180], flush=True)
    _,o,_=c.exec_command(cmd, timeout=timeout, get_pty=True)
    o.channel.set_combine_stderr(True); buf=b''
    while not o.channel.exit_status_ready():
        if o.channel.recv_ready(): buf+=o.channel.recv(65536)
        time.sleep(0.3)
    while o.channel.recv_ready(): buf+=o.channel.recv(65536)
    txt=buf.decode('utf-8','replace'); rc=o.channel.recv_exit_status()
    print(txt[-8000:].encode('ascii','replace').decode(), flush=True)
    print('EXIT',rc, flush=True)
    return txt, rc
# free 6379: host redis conflicts with compose redis. Stop host redis if running, or change compose to not expose host port in prod
run('ss -ltnp | grep 6379; systemctl status redis-server 2>&1 | head -n 20; systemctl status redis 2>&1 | head -n 20',30)
run('systemctl stop redis-server 2>&1; systemctl stop redis 2>&1; sleep 1; ss -ltnp | grep 6379 || echo "6379 free"',30)
# also ensure db container actually starts: it was recreated but failed due to redis dep? start db alone
run('cd /opt/qtsss && docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml up -d db 2>&1 | tail -n 30',60)
run('cd /opt/qtsss && docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml ps 2>&1 | tail -n 30; docker ps --format "{{.Names}} {{.Status}} {{.Ports}}" | head -n 20',30)
run('for i in $(seq 1 20); do docker exec qtsss-db-1 pg_isready -U postgres -d qts >/dev/null 2>&1 && echo READY_POSTGRES && break; docker exec qtsss-db-1 pg_isready -U qts -d qts >/dev/null 2>&1 && echo READY_QTS && break; sleep 2; done; docker logs qtsss-db-1 2>&1 | tail -n 40',60)
# fix postgres role (local socket, no host)
run(r'''docker exec qtsss-db-1 sh -c '
if psql -U qts -d qts -c "SELECT 1" >/dev/null 2>&1; then
  echo FIX_AS_QTS
  psql -U qts -d qts <<EOSQL
DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='\''postgres'\'') THEN CREATE ROLE postgres WITH LOGIN SUPERUSER PASSWORD '\''Buiduchoa2404'\''; ELSE ALTER ROLE postgres WITH LOGIN SUPERUSER PASSWORD '\''Buiduchoa2404'\''; END IF; END \$\$;
EOSQL
  psql -U qts -d qts -c "CREATE SCHEMA IF NOT EXISTS keycloak AUTHORIZATION postgres;"
  psql -U qts -d qts -c "GRANT ALL ON SCHEMA keycloak TO postgres;"
  echo DONE_QTS
elif psql -U postgres -d qts -c "SELECT 1" >/dev/null 2>&1; then
  echo ALREADY_POSTGRES
  psql -U postgres -d qts -c "ALTER ROLE postgres WITH PASSWORD '\''Buiduchoa2404'\'';"
else echo NO_ACCESS; exit 1; fi
PGPASSWORD=Buiduchoa2404 psql -U postgres -d qts -c "SELECT current_user, current_database();"
' 2>&1 | tail -n 30''',60)
run('PGPASSWORD=Buiduchoa2404 psql -h 127.0.0.1 -p 5433 -U postgres -d qts -c "SELECT 1" 2>&1 | tail -n 20; echo HOST_CHECK:$?',30)
run('cd /opt/qtsss && docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml up -d redis 2>&1 | tail -n 20; docker ps | head -n 20',60)
c.close()
print('FIX DONE')
