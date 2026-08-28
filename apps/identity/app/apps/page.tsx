"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ClockIcon, LockClosedIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import { IdentityShell } from "@/components/IdentityShell";
import { LauncherApplication, authorizeUrl, dateTime, identityFetch } from "@/lib/identity";

export default function LauncherPage() {
  const [applications, setApplications] = useState<LauncherApplication[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    identityFetch<{ applications: LauncherApplication[] }>("/api/launcher")
      .then((payload) => setApplications(payload.applications))
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Launcher could not be loaded."));
  }, []);

  const launch = async (application: LauncherApplication) => {
    try {
      const url = await authorizeUrl(application.client_id, application.redirect_uri);
      window.location.assign(url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The launch could not be started.");
    }
  };

  return <IdentityShell active="apps">
    <section className="section">
      <h1>Your QTS workspaces</h1>
      <p className="lead">One account opens QTS Portal, CRM, ERP, HR, Analytics, AI, customer and partner workspaces based on your tenant permissions.</p>
      {error && <p role="alert" className="form-error">{error}</p>}
      {applications.length === 0 ? <div className="panel empty">No permitted applications are currently assigned to your account. If you expected access, ask a QTS Identity administrator to add an application assignment in this tenant.</div> : <div className="launcher-grid">{applications.map((application, index) => <motion.button key={application.id} type="button" onClick={() => void launch(application)} className="launcher-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .04 }}>
        <span className="badge badge-good">{application.status}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 10 }}><Squares2X2Icon width={15}/>{application.icon}</span>
        <b>{application.name}</b>
        <small>{application.description}</small>
        <span><ClockIcon width={13}/>{dateTime(application.last_accessed_at)}</span>
        <span><LockClosedIcon width={13}/>Launch securely</span>
      </motion.button>)}</div>}
    </section>
  </IdentityShell>;
}
