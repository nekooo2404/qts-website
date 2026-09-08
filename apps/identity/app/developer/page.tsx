import { IdentityShell } from "@/components/IdentityShell";

const endpoints = [
  ["Điểm xác thực (authorization)", "/oauth/authorize"],
  ["Điểm cấp token", "/oauth/token"],
  ["Điểm thông tin người dùng", "/oauth/userinfo"],
  ["Điểm khoá công khai JWKS", "/oauth/jwks.json"],
  ["Điểm thu hồi token", "/oauth/revoke"],
  ["Cấu hình OpenID", "/.well-known/openid-configuration"],
];

export default function DeveloperPage() {
  return <IdentityShell active="developer">
    <section className="section">
      <h1>Cổng thông tin dành cho nhà phát triển</h1>
      <p className="lead">Tích hợp QTS Identity bằng Authorization Code kèm PKCE. Mọi ứng dụng trình duyệt dùng luồng này; dịch vụ bảo mật xác thực client secret tại điểm token.</p>
      <div className="panel"><div className="panel-head"><h3>Cấu hình OAuth 2.1 tiêu chuẩn</h3><span className="badge badge-muted">OIDC · PKCE S256 · RS256</span></div><div style={{ padding: 18, display: "grid", gap: 14 }}>
        {endpoints.map(([name, path]) => <div key={path}><b style={{ display: "block", fontSize: 12, color: "#33354a" }}>{name}</b><div className="endpoint" style={{ marginTop: 6 }}>{typeof window === "undefined" ? path : `${window.location.origin.replace(":3001", ":8000")}${path}`}</div></div>)}
        <div className="empty">Webhook chuyển sự kiện đăng xuất ngoại kênh, vô hiệu hóa theo phiên bản chính sách và thông báo sự kiện kiểm tra đến các endpoint đã đăng ký với chữ ký HMAC.</div>
      </div></div>
      <div className="admin-grid"><article className="panel"><div className="panel-head"><h3>Scope</h3></div><div className="empty">openid, profile, email, offline_access cộng với các scope ứng dụng do tổ chức phê duyệt. Kiểm tra scope phía máy chủ là chuẩn xác nhất.</div></article><article className="panel"><div className="panel-head"><h3>Token</h3></div><div className="empty">Token truy cập hiệu lực 15 phút, refresh token luân chuyển từ 7 đến 30 ngày gắn với phiên và kiểm tra phiên bản phiên tại các endpoint tài nguyên nhạy cảm.</div></article><article className="panel"><div className="panel-head"><h3>Bảo mật</h3></div><div className="empty">Cookie phiên HttpOnly an toàn, giới hạn tần suất, bảo vệ CSRF, tách biệt theo tổ chức, mã xác thực dùng một lần, chống phát lại và sự kiện được lưu vết không thể sửa.</div></article></div>
    </section>
  </IdentityShell>;
}
