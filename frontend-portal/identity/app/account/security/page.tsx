"use client";

import { useEffect, useState } from "react";
import { ClockIcon, ComputerDesktopIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { IdentityShell } from "@/components/IdentityShell";
import { identityFetch } from "@/lib/identity";
import Link from "next/link";

type SessionItem = {
  id: string;
  current: boolean;
  user_agent: string;
  location: string;
  last_seen_at: string;
  auth_time: string;
  amr: string[];
};

function formatAmrValue(token: string): string {
  const normalized = token.trim().toLowerCase();
  if (normalized === "pwd" || normalized === "password") return "Mật khẩu";
  if (normalized === "otp" || normalized === "totp") return "Mã từ ứng dụng xác thực";
  if (normalized === "webauthn" || normalized === "passkey") return "Khóa bảo mật";
  if (normalized === "mfa") return "Xác thực đa yếu tố";
  if (!normalized) return "Phương thức xác thực khác";
  return "Phương thức xác thực khác";
}

function formatAmrList(entries: string[]): string {
  if (!entries.length) return formatAmrValue("pwd");
  return entries.map(formatAmrValue).join(", ");
}

export default function SecurityPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const payload = await identityFetch<{ sessions: SessionItem[] }>("/api/sessions");
      setSessions(payload.sessions);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể tải dữ liệu phiên đăng nhập.");
    }
  }

  useEffect(() => { void load(); }, []);

  async function revoke(sessionId: string) {
    setMessage("");
    setError("");
    try {
      await identityFetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
      setMessage("Đã thu hồi phiên được chọn.");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể thu hồi phiên đăng nhập.");
    }
  }

  return <IdentityShell active="security">
    <section className="section">
      <h1>Trung tâm bảo mật</h1>
      <p className="lead">Quản lý xác thực đa yếu tố, phương án khôi phục và mọi thiết bị đang đăng nhập bằng QTS Identity.</p>
      <div className="panel">
        <div className="panel-head"><h3>Xác thực đa yếu tố (MFA)</h3><span className="badge badge-muted">Ứng dụng xác thực (TOTP) · Mã dự phòng</span></div>
        <div style={{ padding: 18, display: "grid", gap: 10, color: "#666983", fontSize: 12, lineHeight: 1.55 }}>
          <p style={{ margin: 0 }}>Thiết lập ứng dụng xác thực (TOTP) và lưu mã dự phòng ở nơi an toàn. Chỉ nhập mã xác thực trên trang QTS tin cậy; không chia sẻ mã với người khác.</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link className="primary-action" href="/settings">Quản lý mật khẩu, MFA và mã dự phòng</Link>
          </div>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head"><h3>Nơi bạn đang đăng nhập</h3><span className="badge badge-good"><ClockIcon width={12} style={{ marginRight: 6 }}/>Thu hồi ngay lập tức</span></div>
        {message && <div style={{ margin: 14, padding: 10, borderRadius: 10, background: "#eafaf2", color: "#1f7a5d", fontSize: 12 }}>{message}</div>}
        {error && <div role="alert" style={{ margin: 14, padding: 10, borderRadius: 10, background: "#fdecef", color: "#8f2e3a", fontSize: 12 }}>{error}</div>}
        {sessions.length === 0 ? <div className="empty">Không tìm thấy phiên QTS Identity đang hoạt động. Hãy đăng nhập lại để tạo phiên được quản lý.</div> : sessions.map((session) => <div key={session.id} className="session-row">
          <span style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
            <ComputerDesktopIcon width={18} color="#6d6be8"/>
            <span style={{ display: "grid", gap: 3, minWidth: 0 }}>
              <b style={{ fontSize: 12 }}>{session.current ? "Thiết bị này" : session.user_agent || "Trình duyệt không xác định"}{session.current ? " · Phiên hiện tại" : ""}</b>
              <small style={{ color: "#848699", fontSize: 11 }}>{session.location} · Hoạt động gần nhất {new Date(session.last_seen_at).toLocaleString("vi-VN")} · {formatAmrList(session.amr)}</small>
            </span>
          </span>
          <button className="primary-action" type="button" onClick={() => revoke(session.id)} style={{ background: session.current ? "#fff" : "#181a2d", color: session.current ? "#343653" : "#fff", border: session.current ? "1px solid rgba(35,41,92,.11)" : "0", boxShadow: "none" }}><LockClosedIcon width={14}/>{session.current ? "Đăng xuất" : "Thu hồi"}</button>
        </div>)}
      </div>
    </section>
  </IdentityShell>;
}
