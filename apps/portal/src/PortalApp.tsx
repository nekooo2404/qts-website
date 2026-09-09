import { useEffect, useMemo, useRef, useState } from "react";
import { beginAuthorization, beginLogout, clearPortalSession, hasStoredSession, identityWebOrigin, isAuthorizationCallback, loadPortalIdentity, redeemAuthorizationResponse, restoreSession, SessionExpiredError } from "./oidc";
import type { PortalEntitlements, UserInfo } from "./oidc";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownTrayIcon,
  ArrowRightIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  BoltIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  CircleStackIcon,
  CloudArrowUpIcon,
  CodeBracketSquareIcon,
  CommandLineIcon,
  CreditCardIcon,
  CubeTransparentIcon,
  DocumentTextIcon,
  EllipsisHorizontalIcon,
  EnvelopeIcon,
  FolderIcon,
  HomeIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PresentationChartLineIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

type Page = "Dashboard" | "Projects" | "CRM" | "HR" | "Finance" | "Developer" | "Analytics" | "Settings";
type Icon = React.ComponentType<React.SVGProps<SVGSVGElement>>;
type Person = { id: string; name: string; title: string; initials: string; email: string };

type IdentityState = {
  person: Person;
  entitlements: PortalEntitlements;
};

const nav: { page: Page; icon: Icon; count?: string }[] = [
  { page: "Dashboard", icon: HomeIcon },
  { page: "Projects", icon: FolderIcon },
  { page: "CRM", icon: UsersIcon },
  { page: "HR", icon: UserGroupIcon },
  { page: "Finance", icon: CreditCardIcon },
  { page: "Developer", icon: CommandLineIcon },
];
const secondary: { page: Page; icon: Icon }[] = [
  { page: "Analytics", icon: PresentationChartLineIcon },
  { page: "Settings", icon: CubeTransparentIcon },
];
const allModules = [...nav, ...secondary];

const pageLabels: Record<Page, string> = {
  Dashboard: "Tổng quan",
  Projects: "Dự án",
  CRM: "CRM",
  HR: "Nhân sự",
  Finance: "Tài chính",
  Developer: "Nhà phát triển",
  Analytics: "Phân tích",
  Settings: "Cài đặt",
};

const permissionLabels: Record<Page, string> = {
  Dashboard: "Tổng quan vận hành",
  Projects: "Triển khai chương trình",
  CRM: "Tài khoản và cơ hội",
  HR: "Con người và đội ngũ",
  Finance: "Doanh thu và hóa đơn",
  Developer: "Dịch vụ và tích hợp",
  Analytics: "Phân tích hỗ trợ quyết định",
  Settings: "Kiểm soát tổ chức",
};

const roleLabels: Record<string, string> = {
  admin: "Quản trị viên",
  member: "Thành viên QTS",
  employee: "Thành viên QTS",
  "identity-admin": "Quản trị viên định danh",
  "portal-admin": "Quản trị viên cổng thông tin",
  "portal-user": "Người dùng cổng thông tin",
};

function displayRole(role: string) {
  return roleLabels[role.toLowerCase()] ?? role.replaceAll("_", " ").replaceAll("-", " ");
}

function initialsFor(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "QT";
}

function personFromUserInfo(profile: UserInfo, entitlements: PortalEntitlements): Person {
  return {
    id: profile.sub,
    name: profile.name || profile.email,
    title: entitlements.roles.map(displayRole).join(" · ") || "Thành viên QTS",
    initials: initialsFor(profile.name || profile.email),
    email: profile.email,
  };
}

function Logo() {
  return <div className="portal-logo"><i className="portal-logo-mark"/><span>Cổng thông tin QTS</span></div>;
}

type AuthPhase = "unauthenticated" | "authenticating" | "authenticated" | "error";

function ProfileMenu({ person, onSignOut }: { person: Person; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  return <div className="profile-menu-shell">
    <div className="profile">
      <i className="profile-avatar">{person.initials}</i>
      <div><span className="profile-name">{person.name}</span><span className="profile-role">{person.title}</span></div>
      <button className="profile-button" onClick={() => setOpen(value => !value)} title="Tùy chọn tài khoản" aria-label="Tùy chọn tài khoản" aria-haspopup="menu" aria-expanded={open}><EllipsisHorizontalIcon width={16}/></button>
    </div>
    {open && <div className="profile-menu" role="menu" aria-label="Tùy chọn tài khoản">
      <span className="profile-menu-label">Đang đăng nhập với</span>
      <div className="profile-menu-item" role="presentation">
        <i className="profile-avatar">{person.initials}</i>
        <span><b>{person.name}</b><small>{person.email}</small></span>
      </div>
      <span className="profile-menu-divider"/>
      <button className="profile-menu-item danger" role="menuitem" onClick={onSignOut}><ArrowRightOnRectangleIcon width={15}/>Đăng xuất</button>
    </div>}
  </div>;
}

function Sidebar({ page, onPage, person, allowedNav, allowedSecondary, onLogout }: { page: Page; onPage: (page: Page) => void; person: Person; allowedNav: typeof nav; allowedSecondary: typeof secondary; onLogout: () => void }) {
  return <aside className="sidebar">
    <div className="sidebar-top">
      <Logo/>
      <button className="workspace-switcher"><i className="workspace-initial">Q</i><span>Không gian QTS</span><ChevronDownIcon width={14}/></button>
      <div className="nav-section">Không gian làm việc</div>
      <nav className="side-nav" aria-label="Điều hướng cổng thông tin QTS">{allowedNav.map(item => <NavigationButton key={item.page} item={item} active={page === item.page} onClick={() => onPage(item.page)}/>)}</nav>
      <div className="nav-section">Thông tin chuyên sâu</div>
      <nav className="side-nav" aria-label="Điều hướng phân tích và cài đặt">{allowedSecondary.map(item => <NavigationButton key={item.page} item={item} active={page === item.page} onClick={() => onPage(item.page)}/>)}</nav>
    </div>
    <div className="sidebar-bottom"><ProfileMenu person={person} onSignOut={onLogout}/></div>
  </aside>;
}

function NavigationButton({ item, active, onClick }: { item: { page: Page; icon: Icon; count?: string }; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return <button className={`side-link ${active ? "active" : ""}`} onClick={onClick}><Icon/><span>{pageLabels[item.page]}</span>{item.count && <b className="nav-count">{item.count}</b>}</button>;
}

function CommandPalette({ onClose, onPage, allowedModules }: { onClose: () => void; onPage: (page: Page) => void; allowedModules: Page[] }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.toLocaleLowerCase("vi-VN");
  const items = allModules
    .filter(item => allowedModules.includes(item.page))
    .filter(item => item.page.toLowerCase().includes(normalizedQuery) || pageLabels[item.page].toLocaleLowerCase("vi-VN").includes(normalizedQuery));

  useEffect(() => {
    const handle = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [onClose]);

  return <motion.div className="command-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <motion.div className="command-modal" initial={{ opacity: 0, y: -10, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: .98 }}>
      <input className="command-input" autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm dự án, đội ngũ hoặc chuyển trang…"/>
      <div className="command-list"><small>Điều hướng</small>{items.length === 0
        ? <p className="command-empty">Không có mô-đun được phép nào khớp với tìm kiếm.</p>
        : items.map(item => { const Icon = item.icon; return <button className="command-item" key={item.page} onClick={() => { onPage(item.page); onClose(); }}><Icon/>{pageLabels[item.page]}</button>; })}
      </div>
    </motion.div>
  </motion.div>;
}

function WaffleLauncher({ allowedModules, onPage }: { allowedModules: Page[]; onPage: (page: Page) => void }) {
  const [open, setOpen] = useState(false);
  const shell = useRef<HTMLDivElement>(null);
  const modules = allModules.filter(module => allowedModules.includes(module.page));

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent | MouseEvent) => {
      if (event instanceof KeyboardEvent && event.key === "Escape") setOpen(false);
      if (event instanceof MouseEvent && !shell.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", close);
    window.addEventListener("mousedown", close);
    return () => {
      window.removeEventListener("keydown", close);
      window.removeEventListener("mousedown", close);
    };
  }, [open]);

  return <div className="waffle-shell" ref={shell}>
    <button className="icon-action waffle-button" type="button" onClick={() => setOpen(value => !value)} aria-label="Ứng dụng QTS" aria-haspopup="menu" aria-expanded={open}><i className="waffle-dots" aria-hidden="true">{Array.from({ length: 9 }, (_, index) => <span key={index}/>)}</i></button>
    {open && <motion.div className="waffle-panel" role="menu" aria-label="Ứng dụng QTS" initial={{ opacity: 0, y: -7, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .15 }}>
      <div className="waffle-heading"><b>Ứng dụng QTS</b><small>Không gian làm việc của bạn</small></div>
      <div className="waffle-grid">
        {modules.map(module => { const ModuleIcon = module.icon; return <button className="waffle-item" type="button" role="menuitem" key={module.page} onClick={() => { onPage(module.page); setOpen(false); }}><i><ModuleIcon/></i><span>{pageLabels[module.page]}</span></button>; })}
        <a className="waffle-item" role="menuitem" href="https://mail.qtsgroup.vn" target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}><i className="mail"><EnvelopeIcon/></i><span>Hộp thư QTS</span></a>
      </div>
    </motion.div>}
  </div>;
}

function Topbar({ page, onCommand, allowedModules, onPage }: { page: Page; onCommand: () => void; allowedModules: Page[]; onPage: (page: Page) => void }) {
  return <header className="topbar">
    <div className="breadcrumb"><span>QTS</span><span> / </span><b>{pageLabels[page]}</b></div>
    <button className="command-button" onClick={onCommand}><MagnifyingGlassIcon/><span>Tìm kiếm hoặc chuyển đến…</span><i className="key">⌘ K</i></button>
    <div className="top-actions"><WaffleLauncher allowedModules={allowedModules} onPage={onPage}/><button className="icon-action" aria-label="Thông báo"><BellIcon/></button><button className="icon-action" aria-label="Trợ giúp"><CircleStackIcon/></button></div>
  </header>;
}

function PageHeading({ page, description }: { page: string; description: string }) {
  return <div className="page-heading"><div><h1>{page}</h1><p>{description}</p></div><button className="date-filter"><CalendarDaysIcon/>30 ngày gần nhất<ChevronDownIcon width={12}/></button></div>;
}

function Kpi({ label, icon: Icon }: { label: string; icon: Icon }) {
  return <article className="panel kpi"><span className="kpi-label"><Icon/>{label}</span><strong className="kpi-value">—</strong><span className="kpi-meta">Chưa kết nối dữ liệu</span></article>;
}

function EmptyData({ children = "Chưa có dữ liệu để hiển thị." }: { children?: React.ReactNode }) {
  return <div style={{ padding: 22, color: "#85879a", fontSize: 12, lineHeight: 1.6 }}>{children}</div>;
}

function Dashboard({ person }: { person: Person }) {
  return <>
    <PageHeading page={`Xin chào, ${person.name.split(" ")[0]}`} description="Tổng quan vận hành của QTS trong một không gian thống nhất."/>
    <section className="kpi-grid">
      <Kpi label="Doanh thu vận hành" icon={CreditCardIcon}/>
      <Kpi label="Dự án đang hoạt động" icon={FolderIcon}/>
      <Kpi label="Hiệu suất đội ngũ" icon={UserGroupIcon}/>
      <Kpi label="Tình trạng hệ thống" icon={ShieldCheckIcon}/>
      <Kpi label="Tài khoản khách hàng" icon={UsersIcon}/>
    </section>
    <section className="dashboard-grid">
      <article className="panel chart-panel"><div className="panel-heading"><div><h2>Hiệu quả vận hành</h2><p>Dữ liệu được tổng hợp từ các mô-đun đã kết nối</p></div></div><EmptyData>Chưa có nguồn dữ liệu vận hành được kết nối.</EmptyData></article>
      <article className="panel system-panel"><div className="panel-heading"><div><h2>Tình trạng hệ thống</h2><p>Trạng thái các dịch vụ vận hành</p></div></div><EmptyData>Chưa có dữ liệu giám sát hệ thống.</EmptyData></article>
    </section>
    <section className="lower-grid">
      <article className="panel projects-panel"><div className="panel-heading"><div><h2>Dự án ưu tiên</h2><p>Các chương trình có mốc triển khai đang hoạt động</p></div><button className="icon-action" aria-label="Xuất danh sách dự án"><ArrowDownTrayIcon/></button></div><ProjectTable compact/></article>
      <article className="panel activity-panel"><div className="panel-heading"><div><h2>Hoạt động vận hành</h2><p>Tín hiệu mới nhất trên toàn QTS</p></div><button className="icon-action" aria-label="Xem hoạt động"><EllipsisHorizontalIcon/></button></div><EmptyData>Chưa ghi nhận hoạt động nào.</EmptyData></article>
    </section>
  </>;
}

function ProjectTable({ compact = false }: { compact?: boolean }) {
  return <table className="table"><thead><tr><th>Dự án</th><th>{compact ? "Khách hàng" : "Phụ trách"}</th><th>Tiến độ</th><th>Trạng thái</th></tr></thead><tbody><tr><td colSpan={4}><EmptyData>Chưa có dự án nào để hiển thị.</EmptyData></td></tr></tbody></table>;
}

function Projects() {
  const [mode, setMode] = useState<"overview" | "board">("overview");
  const columns = ["Việc cần làm", "Đang thực hiện", "Đang xem xét", "Hoàn tất"];
  return <>
    <PageHeading page="Dự án" description="Theo dõi chương trình, năng lực triển khai và công việc đang thực hiện."/>
    <div className="panel" style={{ padding: 18 }}>
      <div className="panel-heading"><div><h2>Danh mục triển khai</h2><p>Dữ liệu dự án theo quyền truy cập của tài khoản</p></div><div className="panel-options"><button className={mode === "overview" ? "active" : ""} onClick={() => setMode("overview")}>Tổng quan</button><button className={mode === "board" ? "active" : ""} onClick={() => setMode("board")}>Kanban</button></div></div>
      {mode === "overview" ? <ProjectTable/> : <div className="kanban">{columns.map(column => <div className="kanban-column" key={column}><div className="kanban-heading"><b>{column}</b><span>0</span></div><p className="command-empty">Chưa có công việc.</p></div>)}</div>}
    </div>
  </>;
}

function CRM() {
  const stages = ["Khám phá", "Đủ điều kiện", "Đề xuất", "Mở rộng"];
  return <>
    <PageHeading page="CRM" description="Quản lý quan hệ, cơ hội và tín hiệu khách hàng theo đúng ngữ cảnh."/>
    <div className="crm-grid">{stages.map(stage => <article className="pipeline-column panel" key={stage}><div className="pipeline-heading"><b>{stage}</b><span>0</span></div><p className="command-empty">Chưa có cơ hội ở giai đoạn này.</p></article>)}</div>
    <article className="panel" style={{ padding: 18, marginTop: 12 }}><div className="panel-heading"><div><h2>Tài khoản doanh nghiệp</h2><p>Thông tin thương mại sẽ hiển thị sau khi kết nối nguồn CRM.</p></div><button className="portal-button"><PlusIcon width={13}/>Thêm tài khoản</button></div><table className="table"><thead><tr><th>Doanh nghiệp</th><th>Ngành</th><th>Giá trị năm</th><th>Giai đoạn</th></tr></thead><tbody><tr><td colSpan={4}><EmptyData>Chưa có tài khoản doanh nghiệp nào.</EmptyData></td></tr></tbody></table></article>
  </>;
}

function HR() {
  return <>
    <PageHeading page="Con người và nhân sự" description="Theo dõi đội ngũ, năng lực và tình trạng vận hành nhân sự."/>
    <section className="kpi-grid">
      <Kpi label="Nhân sự" icon={UserGroupIcon}/>
      <Kpi label="Chuyên cần" icon={CalendarDaysIcon}/>
      <Kpi label="Hiệu suất" icon={PresentationChartLineIcon}/>
      <Kpi label="Vị trí đang tuyển" icon={UsersIcon}/>
      <Kpi label="Năng lực đội ngũ" icon={BoltIcon}/>
    </section>
    <div className="lower-grid">
      <article className="panel projects-panel"><div className="panel-heading"><div><h2>Hiệu suất đội ngũ</h2><p>Dữ liệu đánh giá hiệu suất gần nhất</p></div><button className="portal-button"><PlusIcon width={13}/>Thêm nhân sự</button></div><table className="table"><thead><tr><th>Nhân sự</th><th>Đội ngũ</th><th>Điểm</th><th>Hiệu suất</th></tr></thead><tbody><tr><td colSpan={4}><EmptyData>Chưa có dữ liệu nhân sự để hiển thị.</EmptyData></td></tr></tbody></table></article>
      <article className="panel system-panel"><div className="panel-heading"><div><h2>Tình trạng tổ chức</h2><p>Các chỉ số vận hành nguồn nhân lực</p></div></div><EmptyData>Chưa kết nối dữ liệu nhân sự.</EmptyData></article>
    </div>
  </>;
}

function Finance() {
  return <>
    <PageHeading page="Tài chính" description="Theo dõi doanh thu, dòng tiền và quyết định đầu tư trong bối cảnh vận hành."/>
    <section className="kpi-grid">
      <Kpi label="Doanh thu đã ghi nhận" icon={CreditCardIcon}/>
      <Kpi label="Biên lợi nhuận gộp" icon={PresentationChartLineIcon}/>
      <Kpi label="Hóa đơn chưa thanh toán" icon={DocumentTextIcon}/>
      <Kpi label="Chi phí vận hành" icon={CircleStackIcon}/>
      <Kpi label="Khả năng đảm bảo tiền mặt" icon={ShieldCheckIcon}/>
    </section>
    <div className="dashboard-grid">
      <article className="panel chart-panel"><div className="panel-heading"><div><h2>Doanh thu theo nhóm vận hành</h2><p>Dữ liệu tài chính trong kỳ hiện tại</p></div></div><EmptyData>Chưa kết nối nguồn dữ liệu tài chính.</EmptyData></article>
      <article className="panel system-panel"><div className="panel-heading"><div><h2>Kiểm soát hóa đơn</h2><p>Tình trạng thu hồi công nợ</p></div></div><EmptyData>Chưa có hóa đơn để hiển thị.</EmptyData></article>
    </div>
  </>;
}

function Developer() {
  return <>
    <PageHeading page="Nhà phát triển" description="Các dịch vụ, bản phát hành và tích hợp vận hành hệ thống QTS."/>
    <section className="kpi-grid">
      <Kpi label="Khả dụng API" icon={CloudArrowUpIcon}/>
      <Kpi label="Lượt triển khai" icon={CommandLineIcon}/>
      <Kpi label="Yêu cầu API" icon={CodeBracketSquareIcon}/>
      <Kpi label="Độ trễ dịch vụ" icon={BoltIcon}/>
      <Kpi label="Khóa đang hoạt động" icon={ShieldCheckIcon}/>
    </section>
    <div className="lower-grid">
      <article className="panel projects-panel"><div className="panel-heading"><div><h2>Vận hành triển khai</h2><p>Các dịch vụ kết nối với hệ thống lõi QTS</p></div><button className="portal-button"><CloudArrowUpIcon width={13}/>Triển khai</button></div><table className="table"><thead><tr><th>Dịch vụ</th><th>Môi trường</th><th>Bản phát hành</th><th>Trạng thái</th></tr></thead><tbody><tr><td colSpan={4}><EmptyData>Chưa có dịch vụ triển khai nào.</EmptyData></td></tr></tbody></table></article>
      <article className="panel activity-panel"><div className="panel-heading"><div><h2>Nhật ký yêu cầu trực tiếp</h2><p>Hoạt động API gần nhất</p></div></div><div className="terminal"><p><span>--</span>Chưa có yêu cầu API để hiển thị.</p></div></article>
    </div>
  </>;
}

function Analytics() {
  return <>
    <PageHeading page="Phân tích" description="Thông tin hỗ trợ quyết định cho toàn bộ hệ thống vận hành doanh nghiệp."/>
    <section className="dashboard-grid">
      <article className="panel chart-panel"><div className="panel-heading"><div><h2>Động lực vận hành</h2><p>Chỉ số tổng hợp từ các chương trình chiến lược</p></div><div className="panel-options"><button className="active">30 ngày</button><button>90 ngày</button></div></div><EmptyData>Chưa có dữ liệu phân tích để hiển thị.</EmptyData></article>
      <article className="panel system-panel"><div className="panel-heading"><div><h2>Tín hiệu cần chú ý</h2><p>Được tổng hợp bởi QTS Intelligence</p></div><BoltIcon width={15} color="#9b95ff"/></div><EmptyData>Chưa ghi nhận tín hiệu cần chú ý.</EmptyData></article>
    </section>
  </>;
}

function AccessSummaryChip({ label, tone }: { label: string; tone: "good" | "warning" | "blue" | "purple" }) {
  return <span className={`badge ${tone}`}>{label}</span>;
}

function AccessManagement({ person, entitlements, canManageAccess }: { person: Person; entitlements: PortalEntitlements; canManageAccess: boolean }) {
  const enabledCount = allModules.filter(module => entitlements.modules[module.page]).length;

  return <article className="panel access-panel">
    <div className="panel-heading"><div><h2>Quyền truy cập cổng thông tin</h2><p>QTS Identity đánh giá quyền; không thể thay đổi quyền từ cổng thông tin này.</p></div><AccessSummaryChip label={`${enabledCount} mô-đun có thể xem`} tone={enabledCount === 0 ? "warning" : "good"}/></div>
    <div className="access-body">
      <div className="access-detail">
        <div className="access-person-summary">
          <i className="profile-avatar">{person.initials}</i>
          <div><b>{person.name}</b><small>{person.title} · {person.email}</small></div>
          {canManageAccess && <span className="badge purple">Quản trị viên định danh</span>}
        </div>
        {enabledCount === 0 && <p className="access-warning" role="status">Tài khoản này hiện chưa có quyền xem bất kỳ mô-đun nào.</p>}
        <p className="access-readonly-note">Vai trò và quyền cấp riêng được quản lý, lưu vết tại QTS Identity.</p>
        <div className="access-matrix" aria-label={`Quyền truy cập mô-đun của ${person.name}`}>
          <div className="access-matrix-head"><span>Mô-đun</span><span>Xem</span><span>Quản lý</span></div>
          {allModules.map(module => {
            const ModuleIcon = module.icon;
            const canView = Boolean(entitlements.modules[module.page]);
            const canManage = module.page === "Settings" && canManageAccess;
            return <div className="access-matrix-row" key={module.page}>
              <span className="access-module"><ModuleIcon width={14} aria-hidden="true"/><span><b>{pageLabels[module.page]}</b><small>{permissionLabels[module.page]}</small></span></span>
              <span className={`capability-toggle ${canView ? "on" : "readonly"}`}><i aria-hidden="true"/><span>{canView ? "Có quyền xem" : "Không có quyền xem"}</span></span>
              <span className={`capability-toggle ${canManage ? "on" : "readonly"}`}><i aria-hidden="true"/><span>{canManage ? "Có quyền quản lý" : canView ? "Chỉ xem" : "—"}</span></span>
            </div>;
          })}
        </div>
      </div>
    </div>
  </article>;
}

function Settings({ person, entitlements, canManageAccess }: { person: Person; entitlements: PortalEntitlements; canManageAccess: boolean }) {
  const cards: [string, string, string, Icon][] = [
    ["Tổ chức", "QTS", "Hồ sơ doanh nghiệp, bối cảnh khu vực và thiết lập vận hành mặc định", UsersIcon],
    ["Xác thực", "QTS Identity", "SSO tập trung và bảo mật phiên", ShieldCheckIcon],
    ["Bảng điều khiển định danh", canManageAccess ? "Quyền quản trị" : "Quyền chỉ đọc", "Vai trò và quyền cấp riêng được kiểm soát tại Trung tâm Định danh", CodeBracketSquareIcon],
  ];

  return <>
    <PageHeading page="Cài đặt" description="Xem quyền truy cập tổ chức và tùy chọn vận hành QTS."/>
    <AccessManagement person={person} entitlements={entitlements} canManageAccess={canManageAccess}/>
    <div className="settings-grid settings-support-grid">{cards.map(([title, value, copy, Icon]) => <article className="panel setting-card" key={title}><i><Icon/></i><h2>{title}</h2><b>{value}</b><p>{copy}</p><a className="date-filter" href={`${identityWebOrigin}/console`}>Mở Trung tâm Định danh<ArrowRightIcon width={12}/></a></article>)}</div>
  </>;
}

function AccessDenied() {
  return <section className="access-denied panel">
    <i className="access-denied-icon"><LockClosedIcon width={22} aria-hidden="true"/></i>
    <h1>Chưa có quyền truy cập cổng thông tin</h1>
    <p>Tài khoản hiện chưa có quyền xem bất kỳ mô-đun nào. Vui lòng liên hệ quản trị viên để yêu cầu quyền truy cập.</p>
  </section>;
}

function Login({ error, onSignIn, busy }: { error?: string; onSignIn: () => void; busy?: boolean }) {
  return <main className="login"><i className="particles"/><motion.section className="login-card" initial={{ opacity: 0, y: 18, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .45 }}><div className="login-logo"><Logo/></div><h1>Chào mừng đến với QTS</h1><p>Tiếp tục qua QTS Identity để truy cập không gian làm việc doanh nghiệp an toàn.</p>{error && <p className="login-error" role="alert">{error}</p>}<button className="portal-button" type="button" onClick={onSignIn} disabled={busy}>{busy ? "Đang chuyển đến QTS Identity…" : <>Tiếp tục đến Cổng thông tin QTS<ArrowRightIcon width={14}/></>}</button><p className="login-hint">QTS Identity quản lý việc xác thực và quyền truy cập.</p></motion.section></main>;
}

function AuthenticationStatus() {
  return <main className="login"><i className="particles"/><motion.section className="login-card" initial={{ opacity: 0, y: 18, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .45 }}><div className="login-logo"><Logo/></div><h1>Đang hoàn tất đăng nhập</h1><p>Đang xác minh phiên QTS Identity và quyền truy cập cổng thông tin.</p></motion.section></main>;
}

export default function PortalApp() {
  const [identity, setIdentity] = useState<IdentityState | null>(null);
  const [phase, setPhase] = useState<AuthPhase>(() => isAuthorizationCallback() || hasStoredSession() ? "authenticating" : "unauthenticated");
  const [authenticationError, setAuthenticationError] = useState("");
  const [page, setPage] = useState<Page>("Dashboard");
  const [command, setCommand] = useState(false);

  useEffect(() => {
    if (!isAuthorizationCallback()) return;
    let cancelled = false;

    void (async () => {
      try {
        await redeemAuthorizationResponse();
        const { profile, entitlements } = await loadPortalIdentity();
        if (cancelled) return;
        setIdentity({
          person: personFromUserInfo(profile, entitlements),
          entitlements,
        });
        setPhase("authenticated");
        window.history.replaceState({}, document.title, "/");
      } catch (error) {
        if (cancelled) return;
        if (error instanceof SessionExpiredError) clearPortalSession();
        setAuthenticationError(error instanceof Error ? error.message : "Không thể hoàn tất đăng nhập.");
        setPhase("error");
        window.history.replaceState({}, document.title, "/");
      }
    })();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (isAuthorizationCallback() || phase !== "authenticating") return;
    let cancelled = false;

    void (async () => {
      try {
        const restored = await restoreSession();
        if (!restored) {
          setPhase("unauthenticated");
          return;
        }
        const { profile, entitlements } = await loadPortalIdentity();
        if (cancelled) return;
        setIdentity({
          person: personFromUserInfo(profile, entitlements),
          entitlements,
        });
        setPhase("authenticated");
      } catch (error) {
        if (cancelled) return;
        if (error instanceof SessionExpiredError) {
          clearPortalSession();
          setAuthenticationError(error.message);
          setPhase("error");
          return;
        }
        clearPortalSession();
        setPhase("unauthenticated");
      }
    })();

    return () => { cancelled = true; };
  }, [phase]);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommand(true);
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);

  const allowedModules = useMemo(() => identity ? allModules.filter(module => identity.entitlements.modules[module.page]).map(module => module.page) : [], [identity]);
  const allowedNav = useMemo(() => nav.filter(item => allowedModules.includes(item.page)), [allowedModules]);
  const allowedSecondary = useMemo(() => secondary.filter(item => allowedModules.includes(item.page)), [allowedModules]);
  const canManageSettings = Boolean(identity?.entitlements.manage.Settings);

  useEffect(() => {
    if (!identity || allowedModules.includes(page)) return;
    const fallback = allowedModules[0];
    if (fallback) setPage(fallback);
  }, [allowedModules, identity, page]);

  const signIn = () => {
    setAuthenticationError("");
    setPhase("authenticating");
    void beginAuthorization().catch(error => {
      setAuthenticationError(error instanceof Error ? error.message : "Không thể bắt đầu đăng nhập.");
      setPhase("error");
    });
  };

  const signOut = () => {
    setCommand(false);
    setIdentity(null);
    setPhase("unauthenticated");
    void beginLogout().catch(error => {
      setAuthenticationError(error instanceof Error ? error.message : "Không thể hoàn tất đăng xuất.");
      setPhase("error");
    });
  };

  if (phase === "authenticating") return <AuthenticationStatus/>;
  if (!identity) return <Login error={phase === "error" ? authenticationError : undefined} onSignIn={signIn}/>;

  const person = identity.person;
  if (allowedModules.length === 0) {
    return <main className="portal-shell portal-shell-empty"><div className="workspace"><Topbar page={page} onCommand={() => setCommand(true)} allowedModules={allowedModules} onPage={setPage}/><main className="main-content"><AccessDenied/></main></div><div className="portal-empty-sidebar"><ProfileMenu person={person} onSignOut={signOut}/></div></main>;
  }

  const renderPage = () => ({ Dashboard: <Dashboard person={person}/>, Projects: <Projects/>, CRM: <CRM/>, HR: <HR/>, Finance: <Finance/>, Developer: <Developer/>, Analytics: <Analytics/>, Settings: <Settings person={person} entitlements={identity.entitlements} canManageAccess={canManageSettings}/> }[page]);
  return <div className="portal-shell"><Sidebar page={page} onPage={setPage} person={person} allowedNav={allowedNav} allowedSecondary={allowedSecondary} onLogout={signOut}/><div className="workspace"><Topbar page={page} onCommand={() => setCommand(true)} allowedModules={allowedModules} onPage={setPage}/><main className="main-content"><AnimatePresence mode="wait"><motion.div key={page} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: .18 }}>{renderPage()}</motion.div></AnimatePresence></main></div><AnimatePresence>{command && <CommandPalette onClose={() => setCommand(false)} onPage={setPage} allowedModules={allowedModules}/>}</AnimatePresence></div>;
}
