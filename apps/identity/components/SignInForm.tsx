"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRightIcon, BuildingOffice2Icon, KeyIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { identityPath } from "@/lib/base-path";
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

  useEffect(() => { document.title = "Đăng nhập — QTS Identity"; }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (status === "identifier") {
      if (!email.includes("@")) { setError("Vui lòng nhập địa chỉ email công việc."); return; }
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
      window.location.assign(identityPath(authorize ? `/identity-api/oauth/authorize?${authorize}` : "/apps"));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể hoàn tất đăng nhập.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="ambient-login"><motion.section className="login-card" initial={{ opacity: 0, y: 18, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .36 }}>
    <div className="brand"><i className="brand-mark"/><span>QTS <small>Trung tâm Định danh</small></span></div>
    <h1>{status === "identifier" ? "Đăng nhập vào không gian làm việc" : "Chào mừng trở lại"}</h1>
    <p>{status === "identifier" ? "Sử dụng email công việc để tìm đường đăng nhập an toàn của tổ chức." : `Tiếp tục an toàn với ${email}.`}</p>
    <form onSubmit={submit}>
      <label className="field">Email công việc<input type="email" autoComplete="email" autoFocus value={email} onChange={(event) => setEmail(event.target.value)} disabled={status === "password"} placeholder="ten@cong-ty.vn"/></label>
      {status === "password" && <label className="field">Mật khẩu<input type="password" autoComplete="current-password" autoFocus value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nhập mật khẩu"/></label>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-action" type="submit" disabled={busy} style={{ width: "100%", marginTop: 16 }}>{busy ? "Đang xác thực phiên an toàn…" : status === "identifier" ? <>Tiếp tục <ArrowRightIcon width={15}/></> : <>Đăng nhập an toàn <ArrowRightIcon width={15}/></>}</button>
    </form>
    <div className="idp-grid" aria-label="Phương thức đăng nhập khác">
      <button className="idp-button" type="button"><BuildingOffice2Icon width={15} style={{ verticalAlign: "middle", marginRight: 7 }}/>Tiếp tục với Microsoft</button>
      <button className="idp-button" type="button"><KeyIcon width={15} style={{ verticalAlign: "middle", marginRight: 7 }}/>Tiếp tục với Google</button>
      <button className="idp-button" type="button"><ShieldCheckIcon width={15} style={{ verticalAlign: "middle", marginRight: 7 }}/>Đăng nhập SSO doanh nghiệp</button>
    </div>
    <p className="form-note">Tổ chức của bạn quyết định phương thức đăng nhập khả dụng. QTS không chia sẻ mật khẩu với các ứng dụng đã kết nối.</p>
  </motion.section></main>;
}
