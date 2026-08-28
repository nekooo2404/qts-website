import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c=paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('103.75.185.136',port=24700,username='root',password='76O^%m)KCJw?e21B<lfB',timeout=20)
cmd="cd /opt/qtsss && set -a && . ./.env.production && set +a && docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml exec -T -u 70 db psql -U qts -d qts -v ON_ERROR_STOP=1 -c \"ALTER ROLE qts PASSWORD '$POSTGRES_PASSWORD';\" && docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml run --rm keycloak-db-init"
_,o,e=c.exec_command(cmd,timeout=300); out=o.read()+e.read(); rc=o.channel.recv_exit_status()
print(out.decode('utf8','replace').encode('ascii','replace').decode());print('exit',rc)
c.close()
