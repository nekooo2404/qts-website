import Link from "next/link";

export function QtsBrand() {
  return <Link className="brand" href="/apps" aria-label="QTS Identity Center home"><i className="brand-mark"/><span>QTS <small>Identity Center</small></span></Link>;
}

export function IdentityShell({ children, active }: { children: React.ReactNode; active?: "apps" | "security" | "console" | "developer" }) {
  return <div className="identity-shell">
    <header className="topbar"><div className="container topbar-inner">
      <QtsBrand/>
      <nav aria-label="Identity navigation">
        <Link className={active === "apps" ? "active" : ""} href="/apps">Applications</Link>
        <Link className={active === "security" ? "active" : ""} href="/account/security">Security</Link>
        <Link className={active === "console" ? "active" : ""} href="/console">Identity Console</Link>
        <Link className={active === "developer" ? "active" : ""} href="/developer">Developer</Link>
      </nav>
      <Link className="primary-action" href="/account/security">Account security</Link>
    </div></header>
    <main className="container">{children}</main>
  </div>;
}
