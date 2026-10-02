import { IdentityShell } from "@/components/IdentityShell";

export default function LauncherLoading() {
  return <IdentityShell active="launcher"><section className="launcher-stage" aria-label="Đang tải trình khởi chạy">
    <div className="launcher-hero launcher-hero-skeleton">
      <div>
        <span className="launcher-skeleton-line launcher-skeleton-kicker"/>
        <span className="launcher-skeleton-line launcher-skeleton-title"/>
        <span className="launcher-skeleton-line launcher-skeleton-copy"/>
        <span className="launcher-skeleton-line launcher-skeleton-copy launcher-skeleton-copy-short"/>
      </div>
      <aside className="launcher-profile">
        <span className="launcher-skeleton-avatar"/>
        <span className="launcher-skeleton-line launcher-skeleton-name"/>
        <span className="launcher-skeleton-line launcher-skeleton-email"/>
        <span className="launcher-skeleton-line launcher-skeleton-email"/>
      </aside>
    </div>
    <div className="launcher-toolbar">
      <span className="launcher-skeleton-search"/>
      <span className="launcher-skeleton-count"/>
    </div>
    <div className="launcher-grid">
      {Array.from({ length: 3 }).map((_, index) => <div className="launcher-card launcher-card-skeleton" key={index}>
        <span className="launcher-skeleton-avatar"/>
        <span className="launcher-skeleton-line launcher-skeleton-name"/>
        <span className="launcher-skeleton-line launcher-skeleton-email"/>
        <span className="launcher-skeleton-line launcher-skeleton-copy-short"/>
      </div>)}
    </div>
  </section></IdentityShell>;
}
