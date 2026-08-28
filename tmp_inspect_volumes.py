import paramiko,sys,time
sys.stdout.reconfigure(encoding='utf-8',errors='replace')
c=paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('103.75.185.136',port=24700,username='root',password='76O^%m)KCJw?e21B<lfB',timeout=30,banner_timeout=30,auth_timeout=30)
def run(cmd, timeout=90):
 print('\n$ '+cmd[:180],flush=True); _,o,_=c.exec_command(cmd,timeout=timeout,get_pty=True);o.channel.set_combine_stderr(True);b=b''
 while not o.channel.exit_status_ready():
  if o.channel.recv_ready():b+=o.channel.recv(65536)
  time.sleep(.2)
 while o.channel.recv_ready():b+=o.channel.recv(65536)
 t=b.decode('utf-8','replace');print(t[-12000:].encode('ascii','replace').decode(),flush=True);print('EXIT',o.channel.recv_exit_status(),flush=True);return t
query="SELECT current_user; SELECT nspname FROM pg_namespace WHERE nspname NOT IN ('pg_catalog','information_schema','public') ORDER BY 1; SELECT count(*) AS tables FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema'); SELECT app, name, applied FROM django_migrations ORDER BY applied DESC LIMIT 5;"
run("docker exec qts-db-1 psql -U postgres -d qts -v ON_ERROR_STOP=1 -c \""+query.replace('"','\\"')+"\"",60)
# start isolated container only for non-destructive inspection; no published port
run('docker rm -f inspect-qtsss-db >/dev/null 2>&1 || true; docker run -d --name inspect-qtsss-db -v qtsss_qts_postgres:/var/lib/postgresql/data postgres:16-alpine postgres -c default_transaction_read_only=on',30)
run("for i in $(seq 1 30); do docker exec inspect-qtsss-db pg_isready -U postgres -d qts >/dev/null 2>&1 && break; sleep 1; done; docker logs inspect-qtsss-db 2>&1 | tail -30",60)
run("docker exec inspect-qtsss-db psql -U postgres -d qts -v ON_ERROR_STOP=1 -c \""+query.replace('"','\\"')+"\"",60)
run('docker rm -f inspect-qtsss-db',30)
c.close()
