"use client";

import { useEffect, useState } from "react";
import { ArrowPathIcon, ChartBarSquareIcon, ExclamationTriangleIcon, ShieldCheckIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { IdentityShell } from "@/components/IdentityShell";
import { SecurityOverview, identityFetch } from "@/lib/identity";

type AuditEvent = { id: string; action: string; outcome: string; actor: string; created_at: string; target_type: string; target_id: string };

const initialOverview: SecurityOverview = { active_users: 0, failed_logins: 0, mfa_adoption: 0, risk_level: "Loading", connected_applications: 0 };
const labels: Record<string, string> = { Loading: "Đang tải", Guarded: "Được bảo vệ", success: "Thành công", failure: "Thất bại", denied: "Bị từ chối" };
const display = (value: string) => labels[value] ?? value.replaceAll("_", " ");

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
      setError(reason instanceof Error ? reason.message : "Không thể tải dữ liệu bảng điều khiển định danh.");
    }
  }

  useEffect(() => { void load(); }, []);
  const statCards = [
    ["Người dùng hoạt động", overview.active_users, UserGroupIcon, "Thành viên hiện tại của tổ chức"],
    ["Đăng nhập thất bại", overview.failed_logins, ExclamationTriangleIcon, "Trong 24 giờ gần nhất"],
    ["Áp dụng MFA", `${overview.mfa_adoption}%`, ShieldCheckIcon, "Thiết bị xác thực đã xác nhận"],
    ["Ứng dụng kết nối", overview.connected_applications, ChartBarSquareIcon, "Đăng ký ứng dụng đang hoạt động"],
  ] as const;

  return <IdentityShell active="console">
    <section className="section">
      <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 18 }}><div><h1>Bảng điều khiển QTS Identity</h1><p className="lead">Tình trạng bảo mật, hoạt động truy cập, quản lý thành viên và quản trị ứng dụng trên toàn tổ chức.</p></div><button className="primary-action" onClick={() => void load()}><ArrowPathIcon width={15}/>Làm mới</button></div>
      {error && <p role="alert" className="form-error">{error}</p>}
      <div className="admin-grid">{statCards.map(([label, value, Icon, helper]) => <article className="stat-card" key={label}><Icon width={18} color="#6865df"/><span>{label}</span><b>{value}</b><span>{helper}</span></article>)}</div>
      <div className="panel"><div className="panel-head"><h3>Rủi ro bảo mật</h3><span className={`badge ${overview.risk_level === "Guarded" ? "badge-good" : "badge-warning"}`}>{display(overview.risk_level)}</span></div><div className="empty">Tín hiệu rủi ro kết hợp đăng nhập thất bại, sử dụng lại refresh token bất thường, thay đổi chính sách và sự kiện kết nối định danh ngoài. Hành động nhạy cảm yêu cầu MFA gần nhất khi chính sách tổ chức quy định.</div></div>
      <div className="panel"><div className="panel-head"><h3>Trung tâm nhật ký doanh nghiệp</h3><span className="badge badge-muted">100 sự kiện gần nhất</span></div><div style={{ overflowX: "auto" }}><table className="table"><thead><tr><th>Thời gian</th><th>Chủ thể</th><th>Hành động</th><th>Kết quả</th><th>Đối tượng</th></tr></thead><tbody>{events.length === 0 ? <tr><td colSpan={5} className="empty">Không có sự kiện nhật ký hoặc tài khoản này không được phép xem.</td></tr> : events.map((event) => <tr key={event.id}><td>{new Date(event.created_at).toLocaleString("vi-VN")}</td><td>{event.actor}</td><td>{display(event.action)}</td><td><span className={`badge ${event.outcome === "success" ? "badge-good" : "badge-warning"}`}>{display(event.outcome)}</span></td><td>{display(event.target_type || "—")}</td></tr>)}</tbody></table></div></div>
      <div className="admin-grid"><article className="panel"><div className="panel-head"><h3>Người dùng và quyền truy cập</h3></div><div className="empty">Tìm thành viên tổ chức, vô hiệu hóa tài khoản, đặt lại MFA, gán vai trò RBAC và cấp quyền trực tiếp. Mọi thay đổi đều cập nhật phiên bản chính sách và tạo bằng chứng kiểm tra.</div></article><article className="panel"><div className="panel-head"><h3>Ứng dụng</h3></div><div className="empty">Đăng ký ứng dụng nội bộ, khách hàng, đối tác và bên thứ ba với redirect URI, scope, chính sách gán và thông tin xác thực chính xác.</div></article><article className="panel"><div className="panel-head"><h3>SSO doanh nghiệp</h3></div><div className="empty">Cấu hình định tuyến tên miền đã xác minh cho Microsoft Entra ID, Google Workspace, Okta OIDC hoặc kết nối SAML có chữ ký.</div></article></div>
    </section>
  </IdentityShell>;
}
