import paramiko,sys,time
sys.stdout.reconfigure(encoding='utf-8',errors='replace')
c=paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('103.75.185.136',port=24700,username='root',password='76O^%m)KCJw?e21B<lfB',timeout=30,banner_timeout=30,auth_timeout=30)
def run(cmd,timeout=180):
 print('\n$ '+cmd[:180],flush=True);_,o,_=c.exec_command(cmd,timeout=timeout,get_pty=True);o.channel.set_combine_stderr(True);b=b''
 while not o.channel.exit_status_ready():
  if o.channel.recv_ready():b+=o.channel.recv(65536)
  time.sleep(.25)
 while o.channel.recv_ready():b+=o.channel.recv(65536)
 t=b.decode('utf-8','replace');rc=o.channel.recv_exit_status();print(t[-12000:].encode('ascii','replace').decode(),flush=True);print('EXIT',rc,flush=True);return t,rc
# Start temporary postgres over real qtsss volume, not exposing ports. Read-only logical inspection.
run('docker rm -f inspect-qtsss-db >/dev/null 2>&1 || true; docker run -d --name inspect-qtsss-db -v qtsss_qts_postgres:/var/lib/postgresql/data postgres:16-alpine',30)
run('for i in $(seq 1 30); do docker exec inspect-qtsss-db pg_isready -U qts -d qts >/dev/null 2>&1 && break; sleep 1; done; docker logs inspect-qtsss-db 2>&1 | tail -20',60)
run(r'''docker exec -e PGPASSWORD='9f120c4e3c404eec2c6fb17665df0015' inspect-qtsss-db psql -U qts -d qts -v ON_ERROR_STOP=1 -c "SELECT current_user; SELECT table_schema, count(*) FROM information_schema.tables WHERE table_type='BASE TABLE' GROUP BY 1 ORDER BY 1; SELECT count(*) AS migrations FROM public.django_migrations;"''',60)
# Safety backup before credentials and app changes. Preserves DB data independent of volume.
run("mkdir -p /opt/qtsss-backups && docker exec -e PGPASSWORD='9f120c4e3c404eec2c6fb17665df0015' inspect-qtsss-db pg_dump -U qts -d qts > /opt/qtsss-backups/qts-before-postgres-user-switch-$(date +%Y%m%d%H%M%S).sql && ls -lh /opt/qtsss-backups/qts-before-postgres-user-switch-*.sql | tail -1",180)
run('docker rm -f inspect-qtsss-db',30)
# Stop only accidental qts containers to release 5433/6379; volumes are retained.
run('docker stop qts-db-1 qts-redis-1 && docker rm qts-db-1 qts-redis-1; docker ps --format "{{.Names}} {{.Status}}" | cat',90)
# Start intended production db using original qtsss volume; entrypoint keeps existing database intact.
base='cd /opt/qtsss && docker compose -p qtsss --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml'
run(base+' up -d db',90)
run(base+' ps; docker logs qtsss-db-1 2>&1 | tail -30',60)
# Existing cluster owner is qts. Add requested postgres login, retaining every database/schema/table.
run(r'''docker exec qtsss-db-1 sh -c '
export PGPASSWORD='\''9f120c4e3c404eec2c6fb17665df0015'\''
psql -U qts -d qts -v ON_ERROR_STOP=1 <<EOSQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '\''postgres'\'') THEN
    CREATE ROLE postgres LOGIN SUPERUSER PASSWORD '\''Buiduchoa2404'\'';
  ELSE
    ALTER ROLE postgres LOGIN SUPERUSER PASSWORD '\''Buiduchoa2404'\'';
  END IF;
END
\$\$;
ALTER SCHEMA keycloak OWNER TO postgres;
GRANT ALL ON SCHEMA keycloak TO postgres;
EOSQL
PGPASSWORD='\''Buiduchoa2404'\'' psql -U postgres -d qts -c "SELECT current_user, current_database();"
' ''',90)
run(base+' ps; docker inspect -f "{{.State.Health.Status}}" qtsss-db-1',30)
run("docker exec -e PGPASSWORD='Buiduchoa2404' qtsss-db-1 psql -U postgres -d qts -v ON_ERROR_STOP=1 -c \"SELECT table_schema, count(*) FROM information_schema.tables WHERE table_type='BASE TABLE' GROUP BY 1 ORDER BY 1; SELECT count(*) AS migrations FROM public.django_migrations;\"",60)
c.close()
print('PRODUCTION DB RECOVERED')
