import Link from "next/link";

export function QtsBrand() {
  return <Link className="brand" href="/launcher" aria-label="Trang chủ Trung tâm Định danh QTS"><i className="brand-mark"/><span>QTS <small>Trung tâm Định danh</small></span></Link>;
}

export function IdentityShell({ children, active }: { children: React.ReactNode; active?: "launcher" | "account" | "security" | "console" | "developer" }) {
  return <div className="identity-shell">
    <header className="topbar"><div className="container topbar-inner">
      <QtsBrand/>
      <nav aria-label="Điều hướng định danh">
        <Link className={active === "launcher" || active === "account" ? "active" : ""} href="/launcher">Ứng dụng</Link>
        <Link className={active === "security" ? "active" : ""} href="/account/security">Bảo mật</Link>
        <Link className={active === "console" ? "active" : ""} href="/console">Bảng điều khiển</Link>
        <Link className={active === "developer" ? "active" : ""} href="/developer">Kết nối</Link>
      </nav>
      <Link className="primary-action" href="/launcher">Trình khởi chạy</Link>
    </div></header>
    <main className="container">{children}</main>
  </div>;
}
