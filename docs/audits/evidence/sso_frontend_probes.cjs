const fs=require('fs'),vm=require('vm'),path=require('path');
const esbuild=require(path.join(process.cwd(),'node_modules/esbuild'));
const source=fs.readFileSync('frontend-portal/portal/src/oidc.ts','utf8');
const build=esbuild.transformSync(source,{loader:'ts',format:'cjs',define:{'import.meta.env':JSON.stringify({VITE_PORTAL_OIDC_CLIENT_ID:'audit-client',VITE_IDENTITY_ISSUER:'https://issuer.test',VITE_API_ISSUER:'https://api.test'})}}).code;
function setup(fetcher){const store=new Map(); const context={module:{exports:{}},exports:{},sessionStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},window:{location:{origin:'https://portal.test',pathname:'/auth/callback',search:'',assign:u=>{context.assigned=u}}},crypto:require('crypto').webcrypto,TextEncoder,Uint8Array,URLSearchParams,Date,Map,Promise,Response,fetch:fetcher,atob,btoa};context.exports=context.module.exports;vm.createContext(context);vm.runInContext(build,context);return {api:context.module.exports,store,context};}
(async()=>{
 const out={};
 const invalidId=['e30',Buffer.from(JSON.stringify({nonce:'n',iss:'https://wrong.test',aud:'other-client',exp:1,sub:'different-user'})).toString('base64url'),'not-a-signature'].join('.');
 const x=setup(async url=>new Response(JSON.stringify(url.includes('well-known')?{issuer:'https://wrong.test',authorization_endpoint:'https://wrong.test/auth',token_endpoint:'https://wrong.test/token'}:{access_token:'opaque',id_token:invalidId,refresh_token:'refresh',token_type:'NotBearer',expires_in:900}),{status:200}));
 x.store.set('qts-portal:oidc:state',JSON.stringify({verifier:'v',nonce:'n',createdAt:Date.now()}));
 await x.api.redeemAuthorizationResponse('?state=state&code=code');
 out.accepts_wrong_discovery_issuer_expired_wrong_audience_unsigned_id_token=x.api.hasStoredSession();
 const y=setup(async()=>{throw new Error('network unavailable')});
 y.store.set('qts-portal:oidc:state',JSON.stringify({verifier:'v',nonce:'n',createdAt:Date.now()}));
 try{await y.api.redeemAuthorizationResponse('?state=state&code=code')}catch{}
 out.network_error_deletes_pkce_transaction=!y.store.has('qts-portal:oidc:state');
 const z=setup(async()=>{throw new Error('temporary outage')});
 z.store.set('qts-portal:session',JSON.stringify({access_token:'old',id_token:'old-id',refresh_token:'still-valid',expires_at:1}));
 try{await z.api.restoreSession()}catch(e){out.temporary_network_error_reported_as_expired=e.name;}
 out.temporary_network_error_deletes_refresh_token=!z.api.hasStoredSession();
 const l=setup(async()=>new Response(JSON.stringify({authorization_endpoint:'https://issuer.test/auth',token_endpoint:'https://issuer.test/token',end_session_endpoint:'https://issuer.test/logout'}),{status:200}));
 l.store.set('qts-portal:session',JSON.stringify({access_token:'a',id_token:'id-hint',refresh_token:'r',expires_at:Date.now()+100000}));
 await l.api.beginLogout();out.logout_sends_id_token_hint=new URL(l.context.assigned).searchParams.has('id_token_hint');
 console.log(JSON.stringify(out,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});

