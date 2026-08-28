"use client";

import { useEffect, useState } from "react";
import { ClockIcon, ComputerDesktopIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { IdentityShell } from "@/components/IdentityShell";
import { identityFetch } from "@/lib/identity";

type SessionItem = {
  id: string;
  current: boolean;
  user_agent: string;
  location: string;
  last_seen_at: string;
  auth_time: string;
  amr: string[];
};

export default function SecurityPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const payload = await identityFetch<{ sessions: SessionItem[] }>("/api/sessions");
      setSessions(payload.sessions);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Session data could not be loaded.");
    }
  }

  useEffect(() => { void load(); }, []);

  async function revoke(sessionId: string) {
    setMessage("");
    setError("");
    try {
      await identityFetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
      setMessage("The selected session was revoked.");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The session could not be revoked.");
    }
  }

  return <IdentityShell active="security">
    <section className="section">
      <h1>Security center</h1>
      <p className="lead">Manage MFA, recovery options and all devices currently signed in to your QTS Identity session.</p>
      <div className="panel">
        <div className="panel-head"><h3>Multi-factor authentication</h3><span className="badge badge-muted">Authenticator · Email · SMS · Passkey · Security key</span></div>
        <div style={{ padding: 18, display: "grid", gap: 10, color: "#666983", fontSize: 12, lineHeight: 1.55 }}>
          <p style={{ margin: 0 }}>Tenant policy controls required methods. Passkeys and TOTP authenticator apps satisfy phishing-resistant MFA. Recovery codes are single-use and tenant-audited.</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="primary-action" type="button">Add authenticator app</button>
            <button className="primary-action" type="button" style={{ background: "#fff", color: "#343653", border: "1px solid rgba(35,41,92,.11)", boxShadow: "none" }}>Create passkey</button>
            <button className="primary-action" type="button" style={{ background: "#fff", color: "#343653", border: "1px solid rgba(35,41,92,.11)", boxShadow: "none" }}>Configure security key</button>
          </div>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head"><h3>Where you are signed in</h3><span className="badge badge-good"><ClockIcon width={12} style={{ marginRight: 6 }}/>Revocation is immediate</span></div>
        {message && <div style={{ margin: 14, padding: 10, borderRadius: 10, background: "#eafaf2", color: "#1f7a5d", fontSize: 12 }}>{message}</div>}
        {error && <div role="alert" style={{ margin: 14, padding: 10, borderRadius: 10, background: "#fdecef", color: "#8f2e3a", fontSize: 12 }}>{error}</div>}
        {sessions.length === 0 ? <div className="empty">No active QTS Identity sessions were found. Sign in again to create a managed session.</div> : sessions.map((session) => <div key={session.id} className="session-row">
          <span style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
            <ComputerDesktopIcon width={18} color="#6d6be8"/>
            <span style={{ display: "grid", gap: 3, minWidth: 0 }}>
              <b style={{ fontSize: 12 }}>{session.current ? "This device" : session.user_agent || "Unknown browser"}{session.current ? " · Current session" : ""}</b>
              <small style={{ color: "#848699", fontSize: 11 }}>{session.location} · Last seen {new Date(session.last_seen_at).toLocaleString()} · {session.amr.join(", ") || "pwd"}</small>
            </span>
          </span>
          <button className="primary-action" type="button" onClick={() => revoke(session.id)} style={{ background: session.current ? "#fff" : "#181a2d", color: session.current ? "#343653" : "#fff", border: session.current ? "1px solid rgba(35,41,92,.11)" : "0", boxShadow: "none" }}><LockClosedIcon width={14}/>{session.current ? "Sign out" : "Revoke"}</button>
        </div>)}
      </div>
    </section>
  </IdentityShell>;
}
