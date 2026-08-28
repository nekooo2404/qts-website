"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRightIcon, BuildingOffice2Icon, KeyIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { csrfHeaders, getCsrfToken, identityFetch } from "@/lib/identity";

function preserveAuthorization() {
  const parameters = new URLSearchParams(window.location.search);
  const authorize = new URLSearchParams();
  for (const key of ["response_type", "client_id", "redirect_uri", "scope", "state", "nonce", "code_challenge", "code_challenge_method", "prompt", "max_age"]) {
    const value = parameters.get(key);
    if (value) authorize.set(key, value);
  }
  return authorize.toString();
}

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"identifier" | "password">("identifier");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const authorize = useMemo(() => typeof window === "undefined" ? "" : preserveAuthorization(), []);

  useEffect(() => { document.title = "Sign in — QTS Identity"; }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (status === "identifier") {
      if (!email.includes("@")) { setError("Enter your work email address."); return; }
      setStatus("password");
      return;
    }
    setBusy(true);
    try {
      const csrf = await getCsrfToken();
      await identityFetch("/api/sign-in", {
        method: "POST",
        headers: csrfHeaders(csrf),
        body: JSON.stringify({ email, password }),
      });
      window.location.assign(authorize ? `/identity-api/oauth/authorize?${authorize}` : "/apps");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sign-in could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="ambient-login"><motion.section className="login-card" initial={{ opacity: 0, y: 18, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .36 }}>
    <div className="brand"><i className="brand-mark"/><span>QTS <small>Identity Center</small></span></div>
    <h1>{status === "identifier" ? "Sign in to your workspace" : "Welcome back"}</h1>
    <p>{status === "identifier" ? "Use your work email to find your organization’s secure sign-in path." : `Continue securely as ${email}.`}</p>
    <form onSubmit={submit}>
      <label className="field">Work email<input type="email" autoComplete="email" autoFocus value={email} onChange={(event) => setEmail(event.target.value)} disabled={status === "password"} placeholder="you@company.com"/></label>
      {status === "password" && <label className="field">Password<input type="password" autoComplete="current-password" autoFocus value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password"/></label>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-action" type="submit" disabled={busy} style={{ width: "100%", marginTop: 16 }}>{busy ? "Verifying secure session…" : status === "identifier" ? <>Continue <ArrowRightIcon width={15}/></> : <>Sign in securely <ArrowRightIcon width={15}/></>}</button>
    </form>
    <div className="idp-grid" aria-label="Alternative sign-in options">
      <button className="idp-button" type="button"><BuildingOffice2Icon width={15} style={{ verticalAlign: "middle", marginRight: 7 }}/>Continue with Microsoft</button>
      <button className="idp-button" type="button"><KeyIcon width={15} style={{ verticalAlign: "middle", marginRight: 7 }}/>Continue with Google</button>
      <button className="idp-button" type="button"><ShieldCheckIcon width={15} style={{ verticalAlign: "middle", marginRight: 7 }}/>Enterprise SSO</button>
    </div>
    <p className="form-note">Your organization controls available sign-in methods. QTS never exposes your password to connected applications.</p>
  </motion.section></main>;
}
