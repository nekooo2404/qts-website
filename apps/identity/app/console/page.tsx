"use client";

import { useEffect, useState } from "react";
import { ArrowPathIcon, ChartBarSquareIcon, ExclamationTriangleIcon, ShieldCheckIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { IdentityShell } from "@/components/IdentityShell";
import { SecurityOverview, identityFetch } from "@/lib/identity";

type AuditEvent = { id: string; action: string; outcome: string; actor: string; created_at: string; target_type: string; target_id: string };

const initialOverview: SecurityOverview = { active_users: 0, failed_logins: 0, mfa_adoption: 0, risk_level: "Loading", connected_applications: 0 };

export default function ConsolePage() {
  const [overview, setOverview] = useState(initialOverview);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const [security, audit] = await Promise.all([
        identityFetch<SecurityOverview>("/api/console/security-overview"),
        identityFetch<{ events: AuditEvent[] }>("/api/console/audit-events"),
      ]);
      setOverview(security);
      setEvents(audit.events);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Identity Console data could not be loaded.");
    }
  }

  useEffect(() => { void load(); }, []);
  const statCards = [
    ["Active users", overview.active_users, UserGroupIcon, "Current tenant memberships"],
    ["Failed sign-ins", overview.failed_logins, ExclamationTriangleIcon, "Last 24 hours"],
    ["MFA adoption", `${overview.mfa_adoption}%`, ShieldCheckIcon, "Confirmed authenticators"],
    ["Connected apps", overview.connected_applications, ChartBarSquareIcon, "Active application registrations"],
  ] as const;

  return <IdentityShell active="console">
    <section className="section">
      <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 18 }}><div><h1>QTS Identity Console</h1><p className="lead">Tenant-wide security posture, access activity, membership administration and application governance.</p></div><button className="primary-action" onClick={() => void load()}><ArrowPathIcon width={15}/>Refresh</button></div>
      {error && <p role="alert" className="form-error">{error}</p>}
      <div className="admin-grid">{statCards.map(([label, value, Icon, helper]) => <article className="stat-card" key={label}><Icon width={18} color="#6865df"/><span>{label}</span><b>{value}</b><span>{helper}</span></article>)}</div>
      <div className="panel"><div className="panel-head"><h3>Security risk</h3><span className={`badge ${overview.risk_level === "Guarded" ? "badge-good" : "badge-warning"}`}>{overview.risk_level}</span></div><div className="empty">Risk signals combine failed sign-ins, anomalous refresh-token reuse, policy changes and external identity connection events. Sensitive actions require recent MFA when tenant policy demands it.</div></div>
      <div className="panel"><div className="panel-head"><h3>Enterprise audit center</h3><span className="badge badge-muted">Latest 100 events</span></div><div style={{ overflowX: "auto" }}><table className="table"><thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Outcome</th><th>Target</th></tr></thead><tbody>{events.length === 0 ? <tr><td colSpan={5} className="empty">No tenant audit events are available or this account is not authorized to view them.</td></tr> : events.map((event) => <tr key={event.id}><td>{new Date(event.created_at).toLocaleString()}</td><td>{event.actor}</td><td>{event.action}</td><td><span className={`badge ${event.outcome === "success" ? "badge-good" : "badge-warning"}`}>{event.outcome}</span></td><td>{event.target_type || "—"}</td></tr>)}</tbody></table></div></div>
      <div className="admin-grid"><article className="panel"><div className="panel-head"><h3>Users & access</h3></div><div className="empty">Search tenant memberships, disable users, reset MFA, assign RBAC roles and issue direct permission grants. All changes increment policy versions, revoke stale resource authorization and create audit evidence.</div></article><article className="panel"><div className="panel-head"><h3>Applications</h3></div><div className="empty">Register internal, customer, partner and third-party clients with exact redirect URIs, scopes, assignment policy and rotated credentials.</div></article><article className="panel"><div className="panel-head"><h3>Enterprise SSO</h3></div><div className="empty">Configure verified-domain routing for Microsoft Entra ID, Google Workspace, Okta OIDC or signed SAML connections. JIT provisioning is policy-controlled.</div></article></div>
    </section>
  </IdentityShell>;
}
