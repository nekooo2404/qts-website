import paramiko,sys,time
sys.stdout.reconfigure(encoding='utf-8',errors='replace')
c=paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('103.75.185.136',port=24700,username='root',password='76O^%m)KCJw?e21B<lfB',timeout=30,banner_timeout=30,auth_timeout=30)
def run(cmd,timeout=180,strict=False):
 print('\n$ '+cmd[:220],flush=True);_,o,_=c.exec_command(cmd,timeout=timeout,get_pty=True);o.channel.set_combine_stderr(True);b=b''
 while not o.channel.exit_status_ready():
  if o.channel.recv_ready():b+=o.channel.recv(65536)
  time.sleep(.3)
 while o.channel.recv_ready():b+=o.channel.recv(65536)
 t=b.decode('utf-8','replace');rc=o.channel.recv_exit_status();print(t[-12000:].encode('ascii','replace').decode(),flush=True);print('EXIT',rc,flush=True)
 if strict and rc: raise RuntimeError(cmd[:100])
 return t,rc
base='cd /opt/qtsss && docker compose -p qtsss --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml'
# Keycloak's image has no curl; check management port from host.
run(base+' ps; docker logs qtsss-keycloak-1 2>&1 | tail -80',60)
run("for i in $(seq 1 60); do curl -fsS http://127.0.0.1:8081/realms/qts/.well-known/openid-configuration >/dev/null && echo KC_READY && exit 0; sleep 2; done; exit 1",150,True)
# backup exists from before account switch, migrations must be already current
run('ls -lh /opt/qtsss-backups/qts-before-postgres-user-switch-*.sql | tail -1',30,True)
run(base+' run --rm api python manage.py migrate --check',300,True)
run(base+' run --rm api python manage.py seed_identity',300,True)
run(base+' --profile prod up -d --remove-orphans',240,True)
run('sleep 12; '+base+' --profile prod ps',60)
# verify local handlers
run("for u in http://127.0.0.1:8000/api/v1/health/ http://127.0.0.1:8081/realms/qts/.well-known/openid-configuration http://127.0.0.1:3000 http://127.0.0.1:5174 http://127.0.0.1:3001; do printf '%s ' \"$u\"; curl -sS -o /dev/null -w '%{http_code}\\n' --max-time 15 \"$u\" || echo fail; done",120,True)
# Preserve all client settings, modify only old public URLs.
run(r'''
set -eu
KC_PASS=$(grep '^KC_BOOTSTRAP_ADMIN_PASSWORD=' /opt/qtsss/.env.production | cut -d= -f2-)
TOKEN=$(curl -fsS -X POST http://127.0.0.1:8081/realms/master/protocol/openid-connect/token -d grant_type=password -d client_id=admin-cli -d username=admin --data-urlencode password="$KC_PASS" | python3 -c 'import sys,json; print(json.load(sys.stdin)["access_token"])')
CID=$(curl -fsS -H "Authorization: Bearer $TOKEN" 'http://127.0.0.1:8081/admin/realms/qts/clients?clientId=qts-portal' | python3 -c 'import sys,json; x=json.load(sys.stdin); print(x[0]["id"] if x else "")')
[ -n "$CID" ]
curl -fsS -H "Authorization: Bearer $TOKEN" "http://127.0.0.1:8081/admin/realms/qts/clients/$CID" >/tmp/qts-portal-client.json
python3 - <<'PY'
import json
p='/tmp/qts-portal-client.json'; d=json.load(open(p))
d['redirectUris']=['http://localhost:5174/auth/callback','https://portal.qts.group.vn/auth/callback']
d['webOrigins']=['http://localhost:5174','https://portal.qts.group.vn']
d.setdefault('attributes',{})['pkce.code.challenge.method']='S256'
d['attributes']['post.logout.redirect.uris']='http://localhost:5174/##https://portal.qts.group.vn/'
json.dump(d,open(p,'w'))
PY
curl -fsS -o /dev/null -w 'KC_CLIENT_PUT:%{http_code}\n' -X PUT -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' --data-binary @/tmp/qts-portal-client.json "http://127.0.0.1:8081/admin/realms/qts/clients/$CID"
curl -fsS -H "Authorization: Bearer $TOKEN" "http://127.0.0.1:8081/admin/realms/qts/clients/$CID" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d["redirectUris"]); print(d["webOrigins"]); print(d.get("attributes",{}).get("pkce.code.challenge.method"))'
''',90,True)
run('systemctl reload caddy && ss -ltnp | grep -E ":(80|443|3000|3001|5174|8000|8081|5433|6379)\\b"',45,True)
run('curl -sS -o /dev/null -w "caddy-http:%{http_code}\\n" -H "Host: qts.group.vn" http://127.0.0.1; curl -sS -o /dev/null -w "caddy-https:%{http_code}\\n" --resolve qts.group.vn:443:127.0.0.1 https://qts.group.vn --insecure --max-time 15',60)
run('for h in qts.group.vn www.qts.group.vn portal.qts.group.vn identity.qts.group.vn api.qts.group.vn sso.qts.group.vn; do printf "$h "; getent ahostsv4 "$h" | head -1 || true; done; journalctl -u caddy -n 35 --no-pager | tail -35',60)
c.close();print('RESUME DEPLOY OK')
