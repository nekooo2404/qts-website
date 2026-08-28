import { IdentityShell } from "@/components/IdentityShell";

const endpoints = [
  ["Authorization endpoint", "/oauth/authorize"],
  ["Token endpoint", "/oauth/token"],
  ["UserInfo endpoint", "/oauth/userinfo"],
  ["JWKS endpoint", "/oauth/jwks.json"],
  ["Revocation endpoint", "/oauth/revoke"],
  ["OpenID configuration", "/.well-known/openid-configuration"],
];

export default function DeveloperPage() {
  return <IdentityShell active="developer">
    <section className="section">
      <h1>Developer portal</h1>
      <p className="lead">Integrate QTS Identity with Authorization Code plus PKCE. Every browser application uses this flow; confidential services authenticate client secrets at the token endpoint.</p>
      <div className="panel"><div className="panel-head"><h3>Standard OAuth 2.1 profile</h3><span className="badge badge-muted">OIDC · PKCE S256 · RS256</span></div><div style={{ padding: 18, display: "grid", gap: 14 }}>
        {endpoints.map(([name, path]) => <div key={path}><b style={{ display: "block", fontSize: 12, color: "#33354a" }}>{name}</b><div className="endpoint" style={{ marginTop: 6 }}>{typeof window === "undefined" ? path : `${window.location.origin.replace(":3001", ":8000")}${path}`}</div></div>)}
        <div className="empty">Webhooks deliver back-channel logout, policy-version invalidation and audit-event notifications to registered application endpoints with HMAC signing.</div>
      </div></div>
      <div className="admin-grid"><article className="panel"><div className="panel-head"><h3>Scopes</h3></div><div className="empty">openid, profile, email, offline_access plus tenant-approved application scopes. Server scope validation is authoritative.</div></article><article className="panel"><div className="panel-head"><h3>Tokens</h3></div><div className="empty">15-minute access tokens, 7-to-30-day rotating refresh-token families bound to tenant session, reuse-revocation and session version checks at sensitive resource endpoints.</div></article><article className="panel"><div className="panel-head"><h3>Security</h3></div><div className="empty">HttpOnly secure session cookies, throttling, CSRF protection, tenant isolation, authorization-code one-time use, replay protection, and append-only audited events.</div></article></div>
    </section>
  </IdentityShell>;
}
