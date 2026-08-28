import paramiko, sys, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c=paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('103.75.185.136',port=24700,username='root',password='76O^%m)KCJw?e21B<lfB',timeout=30,banner_timeout=30,auth_timeout=30)
def run(cmd, timeout=120):
    print('\n$ '+cmd[:200], flush=True)
    _,o,_=c.exec_command(cmd, timeout=timeout, get_pty=True)
    o.channel.set_combine_stderr(True); buf=b''
    while not o.channel.exit_status_ready():
        if o.channel.recv_ready(): buf+=o.channel.recv(65536)
        time.sleep(0.3)
    while o.channel.recv_ready(): buf+=o.channel.recv(65536)
    txt=buf.decode('utf-8','replace'); rc=o.channel.recv_exit_status()
    print(txt[-9000:].encode('ascii','replace').decode(), flush=True)
    print('EXIT',rc, flush=True)
    return txt, rc
run('docker volume ls | grep -E "qts|qtsss"; echo "---"; docker network ls | grep -E "qts|qtsss"; echo "---"; ls -l /opt/qtsss/ 2>&1 | head -n 30; ls -l /opt/qts 2>&1 | head -n 20',30)
run('docker ps --format "{{.Names}} {{.Image}} {{.Status}} {{.Ports}}" 2>&1 | cat',30)
run('docker inspect qts-db-1 --format "{{.Mounts}} {{.Config.Env}}" 2>&1 | tr "," "\\n" | head -n 40',30)
run('docker inspect qtsss-db-1 2>&1 | head -n 30; docker volume inspect qts_qts_postgres 2>&1 | head -n 30; docker volume inspect qtsss_qts_postgres 2>&1 | head -n 30',30)
run('cat /opt/qtsss/.env.production | sed "s/=.*/=***/"; echo "---"; caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile 2>&1 | tail -n 10',30)
# fix postgres role in the LIVE old db (qts-db-1) directly
run(r'''docker exec qts-db-1 sh -c '
psql -U qts -d qts -c "SELECT rolname FROM pg_roles WHERE rolname='\''postgres'\'';"
psql -U qts -d qts <<EOSQL
DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='\''postgres'\'') THEN CREATE ROLE postgres WITH LOGIN SUPERUSER PASSWORD '\''Buiduchoa2404'\''; ELSE ALTER ROLE postgres WITH LOGIN SUPERUSER PASSWORD '\''Buiduchoa2404'\''; END IF; END \$\$;
EOSQL
psql -U qts -d qts -c "CREATE SCHEMA IF NOT EXISTS keycloak AUTHORIZATION postgres;"
psql -U qts -d qts -c "GRANT ALL ON SCHEMA keycloak TO postgres;"
psql -U qts -d qts -c "SELECT rolname, rolsuper FROM pg_roles WHERE rolname IN ('\''qts'\'','\''postgres'\'');"
PGPASSWORD=Buiduchoa2404 psql -U postgres -d qts -c "SELECT current_user, current_database();"
' 2>&1 | tail -n 40
''',60)
# verify host port 5433 works as postgres
run('docker exec qts-db-1 pg_isready -U postgres -d qts; docker exec qts-db-1 pg_isready -U qts -d qts',30)
# stop duplicate qtsss containers that conflict, keep single stack consolidated under project name qtsss
# down qtsss project only (keeps qts-db-1 alive), then reconfigure qtsss to use external volume of qts
run('cd /opt/qtsss && docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml down 2>&1 | tail -n 20; docker ps --format "{{.Names}} {{.Status}}" | cat',60)
run('docker volume ls | grep postgres',30)
c.close()
print('DIAG DONE')
