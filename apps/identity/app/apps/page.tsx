"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ClockIcon, LockClosedIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import { IdentityShell } from "@/components/IdentityShell";
import { LauncherApplication, authorizeUrl, dateTime, identityFetch } from "@/lib/identity";

const statusLabels: Record<string, string> = { Available: "Sẵn sàng" };

export default function LauncherPage() {
  const [applications, setApplications] = useState<LauncherApplication[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    identityFetch<{ applications: LauncherApplication[] }>("/api/launcher")
      .then((payload) => setApplications(payload.applications))
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Không thể tải danh sách ứng dụng."));
  }, []);

  const launch = async (application: LauncherApplication) => {
    try {
      const url = await authorizeUrl(application.client_id, application.redirect_uri);
      window.location.assign(url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể khởi chạy ứng dụng.");
    }
  };

  return <IdentityShell active="apps">
    <section className="section">
      <h1>Không gian làm việc của bạn</h1>
      <p className="lead">Một tài khoản mở QTS Portal và các không gian CRM, ERP, HR, Analytics, AI theo phân quyền của tổ chức.</p>
      {error && <p role="alert" className="form-error">{error}</p>}
      {applications.length === 0 ? <div className="panel empty">Tài khoản chưa được gán ứng dụng nào. Nếu bạn cần truy cập, vui lòng liên hệ quản trị viên QTS Identity để được phân quyền.</div> : <div className="launcher-grid">{applications.map((application, index) => <motion.button key={application.id} type="button" onClick={() => void launch(application)} className="launcher-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .04 }}>
        <span className="badge badge-good">{statusLabels[application.status] ?? application.status}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 10 }}><Squares2X2Icon width={15}/>{application.icon}</span>
        <b>{application.name}</b>
        <small>{application.description}</small>
        <span><ClockIcon width={13}/>{dateTime(application.last_accessed_at)}</span>
        <span><LockClosedIcon width={13}/>Mở an toàn</span>
      </motion.button>)}</div>}
    </section>
  </IdentityShell>;
}
