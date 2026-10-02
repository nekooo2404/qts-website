import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { beginAuthorization, beginLogout, clearPortalSession, EnrollmentRequiredError, hasStoredSession, identityWebOrigin, isAuthorizationCallback, listAdminUsers, listPortalLeads, loadPortalIdentity, redeemAuthorizationResponse, restoreSession, SessionExpiredError } from "./oidc";
import type { AdminUser, LauncherApplication, PortalEntitlements, PortalLead, UserInfo } from "./oidc";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AppHeader, type AppChromeApplication, type AppChromeNotification } from "@qts/app-chrome";
import "@qts/app-chrome/styles.css";
import {
  ArrowDownTrayIcon,
  ArrowRightIcon,
  ArrowRightOnRectangleIcon,
  BoltIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  CircleStackIcon,
  ClockIcon,
  CloudArrowUpIcon,
  CodeBracketSquareIcon,
  CommandLineIcon,
  CreditCardIcon,
  CubeTransparentIcon,
  DocumentTextIcon,
  EllipsisHorizontalIcon,
  FolderIcon,
  HomeIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PresentationChartLineIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

type Page = "Dashboard" | "Projects" | "CRM" | "HR" | "Finance" | "Developer" | "Analytics" | "Settings" | "AdminUsers";
type Icon = React.ComponentType<React.SVGProps<SVGSVGElement>>;
type Person = { id: string; name: string; title: string; initials: string; email: string };

type IdentityState = {
  person: Person;
  entitlements: PortalEntitlements;
  applications: LauncherApplication[];
  tenant: string;
};

function applicationOrigin(redirectUri: string) {
  try {
    return new URL(redirectUri).origin;
  } catch {
    return "";
  }
}

function isPortalApplication(app: LauncherApplication) {
  return app.slug === "qts-portal" || app.client_id === "qts-portal";
}

function isSharedApplication(app: LauncherApplication) {
  return isPortalApplication(app) || app.slug === "qts-hrm" || app.client_id === "qts-hrm";
}

function lastAccessLabel(value: string | null) {
  if (!value) return "Chưa từng mở";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function AppChooser({ person, tenant, roles, applications, onOpenPortal, onSignOut }: { person: Person; tenant: string; roles: string; applications: LauncherApplication[]; onOpenPortal: () => void; onSignOut: () => void }) {
  const [query, setQuery] = useState("");
  const sharedApplications = useMemo(() => applications.filter(isSharedApplication), [applications]);
  const launchableApplications = useMemo(() => sharedApplications.filter(app => isPortalApplication(app) || Boolean(applicationOrigin(app.redirect_uri))), [sharedApplications]);
  const visibleApplications = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("vi-VN");
    if (!needle) return launchableApplications;
    return launchableApplications.filter(app => [app.name, app.description, app.slug, app.client_id].some(value => value.toLocaleLowerCase("vi-VN").includes(needle)));
  }, [launchableApplications, query]);
  const searchActive = query.trim().length > 0;
  const searchStatus = searchActive
    ? `Hiển thị ${visibleApplications.length} trong ${launchableApplications.length} ứng dụng được cấp.`
    : `${launchableApplications.length} ứng dụng sẵn sàng mở.`;
  const accessSpec = useMemo(() => [
    { label: "Ứng dụng", value: String(launchableApplications.length), detail: "Được cấp bởi QTS Identity" },
    { label: "Vai trò", value: roles || "Người dùng", detail: "Theo phiên OIDC hiện tại" },
    { label: "Phiên", value: "SSO", detail: "Mở ứng dụng qua handoff bảo mật" },
  ], [launchableApplications.length, roles]);

  return <main className="launcher-page">
    <header className="launcher-header">
      <div className="portal-logo"><img className="portal-logo-mark" src="/images/brand/qts-logo.webp" alt="" width={27} height={27} /><span>Cổng thông tin QTS</span></div>
      <button className="portal-button portal-button-ghost" type="button" onClick={onSignOut}>Đăng xuất</button>
    </header>
    <section className="launcher-content">
      <div className="launcher-hero-panel">
        <div className="launcher-intro">
          <div className="eyebrow"><ShieldCheckIcon width={16}/> Ứng dụng được cấp</div>
          <h1>Xin chào, {person.name}</h1>
          <p>Mở nhanh các phần mềm QTS được cấp cho tài khoản này. Quyền truy cập được kiểm soát bởi QTS Identity.</p>
          <div className="launcher-search" role="search">
            <MagnifyingGlassIcon width={17} aria-hidden="true"/>
            <input value={query} onChange={event => setQuery(event.target.value)} type="search" placeholder="Tìm Portal, HRM hoặc ứng dụng..." aria-label="Tìm ứng dụng được cấp" aria-describedby="launcher-search-status"/>
            {query && <button className="launcher-search-clear" type="button" onClick={() => setQuery("")} aria-label="Xóa tìm kiếm"><XMarkIcon width={15} aria-hidden="true"/></button>}
          </div>
          <p id="launcher-search-status" className="launcher-results-summary" role="status" aria-live="polite">{searchStatus}</p>
        </div>
        <aside className="launcher-account-card" aria-label="Phiên làm việc hiện tại">
          <span className="profile-avatar">{person.initials}</span>
          <b>{person.name}</b>
          <small>{person.email}</small>
          <dl className="session-meta">
            <div><dt>Tổ chức</dt><dd>{tenant}</dd></div>
            <div><dt>Vai trò</dt><dd>{roles || "Người dùng"}</dd></div>
            <div><dt>Ứng dụng</dt><dd>{launchableApplications.length}</dd></div>
          </dl>
        </aside>
      </div>
      <section className="launcher-spec-grid" aria-label="Tóm tắt kiểm soát truy cập">
        {accessSpec.map(item => <article key={item.label}>
          <span>{item.label}</span>
          <b>{item.value}</b>
          <small>{item.detail}</small>
        </article>)}
      </section>
      <div className="application-grid" aria-label="Ứng dụng được cấp quyền">
        {visibleApplications.map(app => {
          if (isPortalApplication(app)) {
            return <button className="application-card application-card-primary" type="button" key={app.id} onClick={onOpenPortal} aria-label={`Mở ${app.name}`}>
              <span className="application-icon"><HomeIcon width={22} aria-hidden="true"/></span>
              <span className="application-card-body"><span className="application-card-kicker">Đang trong hệ sinh thái</span><b>{app.name}</b><small>{app.description}</small><em><ClockIcon width={14}/> {lastAccessLabel(app.last_accessed_at)}</em></span>
              <ArrowRightIcon width={18} aria-hidden="true"/>
            </button>;
          }
          const href = applicationOrigin(app.redirect_uri);
          if (!href) return null;
          return <a className="application-card" href={`${href}?sso=1`} key={app.id} aria-label={`Mở ${app.name}`}>
            <span className="application-icon application-portal"><UserGroupIcon width={22} aria-hidden="true"/></span>
            <span className="application-card-body"><span className="application-card-kicker">Đăng nhập một lần</span><b>{app.name}</b><small>{app.description}</small><em><ClockIcon width={14}/> {lastAccessLabel(app.last_accessed_at)}</em></span>
            <ArrowRightIcon width={18} aria-hidden="true"/>
          </a>;
        })}
      </div>
      {visibleApplications.length === 0 && <div className="launcher-empty">
        <MagnifyingGlassIcon width={22} aria-hidden="true"/>
        <b>{launchableApplications.length === 0 ? "Chưa có ứng dụng sẵn sàng mở" : "Không tìm thấy ứng dụng phù hợp"}</b>
        <p>{launchableApplications.length === 0 ? "Vui lòng liên hệ quản trị viên QTS để được cấp quyền truy cập phần mềm." : "Thử tìm theo tên phần mềm hoặc xóa bộ lọc để xem lại toàn bộ ứng dụng được cấp."}</p>
        {launchableApplications.length > 0 && <button className="portal-button portal-button-ghost" type="button" onClick={() => setQuery("")}>Xóa tìm kiếm</button>}
      </div>}
      <p className="launcher-footnote"><LockClosedIcon width={15}/> QTS Identity kiểm soát xác thực và danh sách ứng dụng được cấp.</p>
    </section>
  </main>;
}

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
const adminNavigation = { page: "AdminUsers" as const, icon: UserGroupIcon };
const allModules = [...nav, ...secondary];
const commandNavigation = [...allModules, adminNavigation];

const pageLabels: Record<Page, string> = {
  Dashboard: "Tổng quan",
  Projects: "Dự án",
  CRM: "CRM",
  HR: "Nhân sự",
  Finance: "Tài chính",
  Developer: "Dịch vụ hệ thống",
  Analytics: "Phân tích",
  Settings: "Cài đặt",
  AdminUsers: "Tài khoản nhân viên",
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
  AdminUsers: "Cấp và quản lý tài khoản nhân viên",
};

const roleLabels: Record<string, string> = {
  admin: "Quản trị viên",
  member: "Thành viên QTS",
  employee: "Thành viên QTS",
  "super-admin": "Quản trị viên cấp cao",
  "organization-admin": "Quản trị tổ chức",
  manager: "Quản lý",
  developer: "Quản lý dịch vụ hệ thống",
  customer: "Khách hàng",
  "portal-limited": "Cổng thông tin giới hạn",
  "identity-admin": "Quản trị viên định danh",
  "portal-admin": "Quản trị viên cổng thông tin",
  "portal-user": "Người dùng cổng thông tin",
};

const statusLabels: Record<string, string> = {
  active: "Hoạt động",
  disabled: "Vô hiệu hóa",
  invited: "Đã mời",
};

function displayRole(role: string) {
  return roleLabels[role.toLowerCase()] ?? "Vai trò chưa xác định";
}

function displayStatus(status: string) {
  return statusLabels[status.toLowerCase()] ?? "Trạng thái chưa xác định";
}

const leadStatusLabels: Record<string, string> = {
  new: "Mới",
  contacted: "Đã liên hệ",
  qualified: "Đủ điều kiện",
  won: "Thành công",
  lost: "Không phù hợp",
  spam: "Spam",
};

const leadStatusTone: Record<string, "good" | "warning" | "blue"> = {
  new: "blue",
  contacted: "warning",
  qualified: "blue",
  won: "good",
  lost: "warning",
  spam: "warning",
};

function displayLeadStatus(status: string) {
  return leadStatusLabels[status] ?? "Mới";
}

function leadBadgeTone(status: string) {
  return leadStatusTone[status] ?? "blue";
}

function formatLeadTime(value: string) {
  if (!value) return "Vừa gửi";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Vừa gửi";
  return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }).format(date);
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
  return <div className="portal-logo"><img className="portal-logo-mark" src="/images/brand/qts-logo.webp" alt="" width={27} height={27} /><span>Cổng thông tin QTS</span></div>;
}

type AuthPhase = "unauthenticated" | "redirecting" | "authenticating" | "authenticated" | "signing-out" | "error" | "enrollment-pending";

function ProfileMenu({ person, onSignOut }: { person: Person; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeMenu = useCallback((restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) window.setTimeout(() => buttonRef.current?.focus(), 0);
  }, []);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu(true);
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [closeMenu, open]);

  return <div className="profile-menu-shell">
    <div className="profile">
      <i className="profile-avatar">{person.initials}</i>
      <div><span className="profile-name">{person.name}</span><span className="profile-role">{person.title}</span></div>
      <button ref={buttonRef} className="profile-button" onClick={() => setOpen(value => !value)} title="Tùy chọn tài khoản" aria-label="Tùy chọn tài khoản" aria-haspopup="menu" aria-controls={open ? "portal-profile-menu" : undefined} aria-expanded={open}><EllipsisHorizontalIcon width={16}/></button>
    </div>
    {open && <div id="portal-profile-menu" className="profile-menu" role="menu" aria-label="Tùy chọn tài khoản">
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

function Sidebar({ page, onPage, person, allowedNav, allowedSecondary, canManageUsers, onLogout }: { page: Page; onPage: (page: Page) => void; person: Person; allowedNav: typeof nav; allowedSecondary: typeof secondary; canManageUsers: boolean; onLogout: () => void }) {
  return <aside className="sidebar">
    <div className="sidebar-top">
      <Logo/>
      <div className="nav-section">Không gian làm việc</div>
      <nav className="side-nav" aria-label="Điều hướng cổng thông tin QTS">{allowedNav.map(item => <NavigationButton key={item.page} item={item} active={page === item.page} onClick={() => onPage(item.page)}/>)}</nav>
      <div className="nav-section">Thông tin chuyên sâu</div>
      <nav className="side-nav" aria-label="Điều hướng phân tích và cài đặt">{allowedSecondary.map(item => <NavigationButton key={item.page} item={item} active={page === item.page} onClick={() => onPage(item.page)}/>)}</nav>
      {canManageUsers && <><div className="nav-section">Quản trị</div><nav className="side-nav" aria-label="Điều hướng quản trị"><NavigationButton item={adminNavigation} active={page === "AdminUsers"} onClick={() => onPage("AdminUsers")}/></nav></>}
    </div>
    <div className="sidebar-bottom"><ProfileMenu person={person} onSignOut={onLogout}/></div>
  </aside>;
}

function NavigationButton({ item, active, onClick }: { item: { page: Page; icon: Icon; count?: string }; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  const label = pageLabels[item.page];
  return <button className={`side-link ${active ? "active" : ""}`} type="button" onClick={onClick} aria-label={label} title={label} data-label={label}><Icon aria-hidden="true"/><span>{label}</span>{item.count && <b className="nav-count">{item.count}</b>}</button>;
}

const commandFocusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function CommandPalette({ onClose, onPage, allowedModules }: { onClose: () => void; onPage: (page: Page) => void; allowedModules: Page[] }) {
  const [query, setQuery] = useState("");
  const modal = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(document.activeElement instanceof HTMLElement ? document.activeElement : null);
  const reduceMotion = useReducedMotion();
  const normalizedQuery = query.toLocaleLowerCase("vi-VN");
  const items = commandNavigation
    .filter(item => allowedModules.includes(item.page))
    .filter(item => item.page.toLowerCase().includes(normalizedQuery) || pageLabels[item.page].toLocaleLowerCase("vi-VN").includes(normalizedQuery));

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handle = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(modal.current?.querySelectorAll<HTMLElement>(commandFocusableSelector) ?? [])
        .filter(element => element.getClientRects().length > 0);
      if (focusable.length === 0) {
        event.preventDefault();
        modal.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !modal.current?.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !modal.current?.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handle);
    return () => {
      window.removeEventListener("keydown", handle);
      document.body.style.overflow = previousOverflow;
      if (returnFocus.current?.isConnected) returnFocus.current.focus();
    };
  }, [onClose]);

  return <motion.div className="command-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: reduceMotion ? .01 : .25, ease: [0.22, 1, 0.36, 1] } }} exit={{ opacity: 0, transition: { duration: reduceMotion ? .01 : .15, ease: [0.22, 1, 0.36, 1] } }} onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <motion.div ref={modal} id="portal-command-dialog" className="command-modal" role="dialog" aria-modal="true" aria-label="Điều hướng nhanh" tabIndex={-1}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: .97 }}
      animate={reduceMotion ? { opacity: 1, transition: { duration: .01 } } : { opacity: 1, y: 0, scale: 1, transition: { duration: .25, ease: [0.22, 1, 0.36, 1] } }}
      exit={reduceMotion ? { opacity: 0, transition: { duration: .01 } } : { opacity: 0, y: -8, scale: .99, transition: { duration: .15, ease: [0.22, 1, 0.36, 1] } }}>
      <input className="command-input" type="search" role="searchbox" aria-label="Tìm tính năng" aria-controls="portal-command-results" autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm dự án, đội ngũ hoặc chuyển trang…"/>
      <div className="command-list" id="portal-command-results" aria-live="polite"><small>Điều hướng</small>{items.length === 0
        ? <p className="command-empty">Không có tính năng được phép nào khớp với tìm kiếm.</p>
        : items.map(item => { const Icon = item.icon; return <button className="command-item" key={item.page} onClick={() => { onPage(item.page); onClose(); }}><Icon/>{pageLabels[item.page]}</button>; })}
      </div>
    </motion.div>
  </motion.div>;
}

const skipChooserKey = "qts-portal:skip-chooser";

function rememberChooser(openChooser: boolean) {
  if (openChooser) sessionStorage.removeItem(skipChooserKey);
  else sessionStorage.setItem(skipChooserKey, "1");
}

function consumeSkipChooser() {
  const skip = sessionStorage.getItem(skipChooserKey) === "1";
  sessionStorage.removeItem(skipChooserKey);
  return skip;
}

function portalChromeApplications(applications: LauncherApplication[], onOpenPortal: () => void): AppChromeApplication[] {
  return applications.filter(isSharedApplication).map(app => {
    if (isPortalApplication(app)) {
      return { id: app.id, name: app.name, description: app.description, current: true, kind: "portal", onSelect: onOpenPortal };
    }
    const href = applicationOrigin(app.redirect_uri);
    return {
      id: app.id,
      name: app.name,
      description: app.description,
      href: href ? `${href}?sso=1` : undefined,
      kind: app.slug === "qts-hrm" || app.client_id === "qts-hrm" ? "hrm" : "app",
    };
  });
}

function Topbar({ onCommand, commandOpen, applications, onOpenPortal, person, onSignOut, notifications = [] }: { onCommand: () => void; commandOpen: boolean; applications: LauncherApplication[]; onOpenPortal: () => void; person: Person; onSignOut: () => void; notifications?: AppChromeNotification[] }) {
  return <AppHeader
    className="portal-topbar"
    searchPlaceholder="Tìm dự án, khách hàng, nghiệp vụ"
    searchLabel="Tìm kiếm hoặc chuyển trang"
    searchControls="portal-command-dialog"
    searchExpanded={commandOpen}
    onSearch={onCommand}
    applications={portalChromeApplications(applications, onOpenPortal)}
    notifications={notifications}
    notificationSummary={notifications.length ? "Yêu cầu tư vấn mới từ khách hàng" : undefined}
    user={{ name: person.name, email: person.email, role: person.title, initials: person.initials }}
    onLogout={onSignOut}
  />;
}

function PageHeading({ page, description }: { page: string; description: string }) {
  return <div className="page-heading"><div><h1>{page}</h1><p>{description}</p></div><span className="date-filter" role="note" aria-label="Khoảng thời gian hiển thị"><CalendarDaysIcon/>30 ngày gần nhất<ChevronDownIcon width={12} aria-hidden="true"/></span></div>;
}

function Kpi({ label, icon: Icon }: { label: string; icon: Icon }) {
  return <article className="panel kpi"><span className="kpi-label"><Icon/>{label}</span><strong className="kpi-value">—</strong><span className="kpi-meta">Chưa kết nối dữ liệu</span></article>;
}

function EmptyData({ children = "Chưa có dữ liệu để hiển thị.", title = "Chưa có dữ liệu", action, icon: Icon = CircleStackIcon }: { children?: React.ReactNode; title?: string; action?: React.ReactNode; icon?: Icon }) {
  return <div className="empty-data" role="status">
    <i aria-hidden="true"><Icon width={17}/></i>
    <b>{title}</b>
    <span>{children}</span>
    {action && <div className="empty-data-action">{action}</div>}
  </div>;
}

function SkipLink() {
  return <a className="skip-link" href="#main-content">Bỏ qua điều hướng</a>;
}

type AddRecordKind = "business-account" | "employee-profile" | "identity-account";
type AddRecordField = {
  id: string;
  label: string;
  placeholder?: string;
  type?: "text" | "email" | "date" | "select" | "textarea";
  options?: string[];
};

const addRecordConfigs: Record<AddRecordKind, {
  title: string;
  description: string;
  submitLabel: string;
  note: string;
  fields: AddRecordField[];
}> = {
  "business-account": {
    title: "Thêm tài khoản doanh nghiệp",
    description: "Ghi nhận thông tin khách hàng hoặc đối tác để chuẩn bị đưa vào quy trình CRM.",
    submitLabel: "Tạo bản nháp",
    note: "Thông tin sẽ ở dạng bản nháp cho đến khi quy trình CRM được kết nối và phê duyệt.",
    fields: [
      { id: "company", label: "Tên doanh nghiệp", placeholder: "Ví dụ: QTS Global" },
      { id: "industry", label: "Ngành hoạt động", placeholder: "Ví dụ: Công nghệ, sản xuất, dịch vụ" },
      { id: "owner", label: "Người phụ trách", placeholder: "Tên nhân sự phụ trách" },
      { id: "stage", label: "Giai đoạn", type: "select", options: ["Khám phá", "Đủ điều kiện", "Đề xuất", "Mở rộng"] },
      { id: "note", label: "Ghi chú", type: "textarea", placeholder: "Nhu cầu, bối cảnh hoặc bước tiếp theo" },
    ],
  },
  "employee-profile": {
    title: "Thêm hồ sơ nhân sự",
    description: "Tạo hồ sơ nhân sự ban đầu để chuẩn bị đồng bộ sang hệ thống HRM.",
    submitLabel: "Tạo bản nháp",
    note: "Hồ sơ chỉ được ghi chính thức sau khi hoàn tất xác nhận nhân sự và quyền truy cập.",
    fields: [
      { id: "name", label: "Họ và tên", placeholder: "Nhập họ tên nhân sự" },
      { id: "email", label: "Email công việc", type: "email", placeholder: "name@qts.com" },
      { id: "team", label: "Bộ phận", placeholder: "Ví dụ: Vận hành, Kinh doanh, Nhân sự" },
      { id: "title", label: "Chức danh", placeholder: "Ví dụ: Chuyên viên nhân sự" },
      { id: "startDate", label: "Ngày bắt đầu", type: "date" },
    ],
  },
  "identity-account": {
    title: "Thêm tài khoản nhân viên",
    description: "Tạo yêu cầu cấp quyền truy cập hệ thống cho nhân viên.",
    submitLabel: "Gửi yêu cầu cấp quyền",
    note: "Tài khoản không lưu mật khẩu. Việc xác thực được quản lý qua Trung tâm Định danh.",
    fields: [
      { id: "name", label: "Họ và tên", placeholder: "Nhập họ tên nhân viên" },
      { id: "email", label: "Email công việc", type: "email", placeholder: "Nhập email công việc" },
      { id: "role", label: "Vai trò đề xuất", type: "select", options: ["Thành viên QTS", "Quản lý", "Quản trị tổ chức", "Quản trị viên cấp cao"] },
      { id: "applications", label: "Ứng dụng cần truy cập", type: "select", options: ["Cổng thông tin QTS", "QTS HRM", "Cổng thông tin QTS và QTS HRM"] },
      { id: "reason", label: "Lý do cấp quyền truy cập", type: "textarea", placeholder: "Ví dụ: Nhân viên kinh doanh cần truy cập CRM để quản lý khách hàng" },
    ],
  },
};

type IdentityRoleId = "employee" | "manager" | "organization-admin" | "super-admin";
type IdentityApplicationId = "qts-portal" | "qts-hrm" | "qts-analytics" | "qts-ai";
type IdentityRequestStatus = "idle" | "invalid" | "loading" | "pending" | "error" | "denied";

const identityRoles: {
  id: IdentityRoleId;
  label: string;
  description: string;
  review: string;
}[] = [
  { id: "employee", label: "Nhân viên", description: "Truy cập cơ bản theo phạm vi cá nhân và nghiệp vụ được giao.", review: "Phê duyệt tiêu chuẩn" },
  { id: "manager", label: "Quản lý phòng ban", description: "Theo dõi đội ngũ, xem báo cáo nhóm và xử lý yêu cầu thuộc phạm vi quản lý.", review: "Cần xác nhận phòng ban" },
  { id: "organization-admin", label: "Quản trị tổ chức", description: "Quản lý tài khoản, ứng dụng và quyền truy cập trong phạm vi tổ chức.", review: "Cần phê duyệt định danh" },
  { id: "super-admin", label: "Quản trị viên cấp cao", description: "Quyền nhạy cảm cho vận hành nền tảng và kiểm soát truy cập cấp hệ thống.", review: "Cần phê duyệt tăng cường" },
];

const identityApplications: {
  id: IdentityApplicationId;
  label: string;
  description: string;
  permissions: Record<IdentityRoleId, string[]>;
}[] = [
  {
    id: "qts-portal",
    label: "Cổng thông tin QTS",
    description: "Không gian vận hành doanh nghiệp và launcher ứng dụng.",
    permissions: {
      employee: ["Mở launcher", "Xem thông tin được cấp"],
      manager: ["Mở launcher", "Xem không gian đội ngũ", "Theo dõi yêu cầu liên quan"],
      "organization-admin": ["Quản lý tài khoản nhân viên", "Gán ứng dụng được cấp", "Xem ma trận quyền"],
      "super-admin": ["Quản trị toàn bộ cổng thông tin", "Kiểm soát ứng dụng được cấp", "Xem nhật ký quản trị"],
    },
  },
  {
    id: "qts-hrm",
    label: "QTS HRM",
    description: "Quản lý hồ sơ nhân sự, đơn từ và nghiệp vụ HR.",
    permissions: {
      employee: ["Xem hồ sơ cá nhân", "Tạo yêu cầu nghỉ phép", "Xem phiếu lương cá nhân"],
      manager: ["Xem nhân sự thuộc phạm vi", "Duyệt đơn từ đội ngũ", "Theo dõi hiệu suất phòng ban"],
      "organization-admin": ["Quản lý hồ sơ nhân sự", "Cấu hình phạm vi dữ liệu", "Duyệt điều chỉnh hồ sơ"],
      "super-admin": ["Quản trị dữ liệu HRM", "Kiểm soát quyền nhạy cảm", "Xem nhật ký truy cập nhân sự"],
    },
  },
  {
    id: "qts-analytics",
    label: "QTS Analytics",
    description: "Báo cáo điều hành và phân tích hỗ trợ quyết định.",
    permissions: {
      employee: ["Xem báo cáo được chia sẻ"],
      manager: ["Xem báo cáo phòng ban", "Lọc dữ liệu theo phạm vi quản lý"],
      "organization-admin": ["Quản lý bộ báo cáo tổ chức", "Cấp quyền xem dashboard"],
      "super-admin": ["Quản trị không gian phân tích", "Kiểm soát nguồn dữ liệu"],
    },
  },
  {
    id: "qts-ai",
    label: "QTS AI",
    description: "Trợ lý nội bộ cho tra cứu và hỗ trợ nghiệp vụ được cấp phép.",
    permissions: {
      employee: ["Sử dụng trợ lý được cấp"],
      manager: ["Sử dụng trợ lý đội ngũ", "Xem gợi ý trong phạm vi quản lý"],
      "organization-admin": ["Quản lý nhóm người dùng AI", "Cấu hình phạm vi sử dụng"],
      "super-admin": ["Quản trị chính sách AI", "Kiểm soát nhật ký sử dụng"],
    },
  },
];

const qtsWorkEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getIdentityRole(role: IdentityRoleId | "") {
  return identityRoles.find(item => item.id === role);
}

function getIdentityApplication(application: IdentityApplicationId) {
  return identityApplications.find(item => item.id === application);
}

function FieldValidation({ tone, children }: { tone: "success" | "warning" | "error"; children: React.ReactNode }) {
  const Icon = tone === "success" ? CheckCircleIcon : ExclamationTriangleIcon;
  return <p className={`identity-validation ${tone}`} role={tone === "success" ? "status" : "alert"}><Icon width={14}/>{children}</p>;
}

function RoleSelector({ value, onChange, showError, disabled }: { value: IdentityRoleId | ""; onChange: (value: IdentityRoleId) => void; showError: boolean; disabled: boolean }) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLocaleLowerCase("vi-VN");
  const filteredRoles = identityRoles.filter(role => !normalized || `${role.label} ${role.description}`.toLocaleLowerCase("vi-VN").includes(normalized));

  return <section className="identity-section identity-section-wide">
    <div className="identity-section-head"><div><h3>Vai trò đề xuất *</h3><p>Chọn vai trò gần nhất với phạm vi công việc thực tế.</p></div></div>
    <label className="identity-search"><MagnifyingGlassIcon width={15}/><span className="sr-only">Tìm vai trò</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm vai trò" disabled={disabled}/></label>
    <div className="identity-role-list" role="radiogroup" aria-label="Vai trò đề xuất" aria-invalid={showError || undefined}>
      {filteredRoles.length === 0 ? <EmptyData title="Không tìm thấy vai trò">Thử nhập tên vai trò hoặc mô tả nghiệp vụ khác.</EmptyData> : filteredRoles.map(role => <button
        className={`identity-role-card ${value === role.id ? "selected" : ""}`}
        type="button"
        role="radio"
        aria-checked={value === role.id}
        disabled={disabled}
        key={role.id}
        onClick={() => onChange(role.id)}
      >
        <span><b>{role.label}</b><small>{role.description}</small></span>
        <em>{role.review}</em>
      </button>)}
    </div>
    {showError && <FieldValidation tone="warning">Chưa chọn vai trò.</FieldValidation>}
  </section>;
}

function ApplicationSelector({ value, onChange, role, showError, disabled }: { value: IdentityApplicationId[]; onChange: (value: IdentityApplicationId[]) => void; role: IdentityRoleId | ""; showError: boolean; disabled: boolean }) {
  const toggle = (id: IdentityApplicationId) => {
    if (value.includes(id)) onChange(value.filter(item => item !== id));
    else onChange([...value, id]);
  };

  return <section className="identity-section identity-section-wide">
    <div className="identity-section-head"><div><h3>Ứng dụng cần truy cập *</h3><p>Chỉ chọn ứng dụng phục vụ công việc hiện tại.</p></div><span>{value.length} đã chọn</span></div>
    <div className="identity-app-grid" role="group" aria-label="Ứng dụng cần truy cập" aria-invalid={showError || undefined}>
      {identityApplications.map(app => {
        const checked = value.includes(app.id);
        const preview = role ? app.permissions[role].slice(0, 2) : [];
        return <button className={`identity-app-card ${checked ? "selected" : ""}`} type="button" role="checkbox" aria-checked={checked} disabled={disabled} key={app.id} onClick={() => toggle(app.id)}>
          <span className="identity-check" aria-hidden="true">{checked ? <CheckCircleIcon width={16}/> : null}</span>
          <span><b>{app.label}</b><small>{app.description}</small>{preview.length > 0 && <em>{preview.join(" · ")}</em>}</span>
        </button>;
      })}
    </div>
    {showError && <FieldValidation tone="warning">Chọn ít nhất một ứng dụng.</FieldValidation>}
  </section>;
}

function PermissionPreview({ role, applications }: { role: IdentityRoleId | ""; applications: IdentityApplicationId[] }) {
  const selectedRole = getIdentityRole(role);
  const selectedApps = applications.map(getIdentityApplication).filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (!role || !selectedRole || selectedApps.length === 0) {
    return <section className="identity-permission-preview" aria-live="polite">
      <div className="identity-section-head"><div><h3>Quyền được cấp</h3><p>Kiểm tra lại trước khi gửi yêu cầu.</p></div></div>
      <div className="identity-preview-empty">
        <CircleStackIcon width={18}/>
        <b>Chưa có quyền để xem trước</b>
        <span>Chọn vai trò và ít nhất một ứng dụng để xem quyền dự kiến.</span>
      </div>
    </section>;
  }

  return <section className="identity-permission-preview" aria-live="polite">
    <div className="identity-section-head"><div><h3>Quyền được cấp</h3><p>Kiểm tra lại trước khi gửi yêu cầu.</p></div>{selectedRole && <span>{selectedRole.label}</span>}</div>
    <div className="identity-preview-list">
      {selectedApps.map(app => <article className="identity-preview-app" key={app.id}>
        <h4>{app.label}</h4>
        <ul>{app.permissions[role].map(permission => <li key={permission}><CheckCircleIcon width={14}/>{permission}</li>)}</ul>
      </article>)}
    </div>
  </section>;
}

function IdentityRequestStatusPanel({ status, role }: { status: IdentityRequestStatus; role: IdentityRoleId | "" }) {
  const selectedRole = getIdentityRole(role);
  if (status === "loading") return <div className="identity-status-panel loading" role="status"><span className="identity-loader" aria-hidden="true"/><div><b>Đang gửi yêu cầu...</b><p>Hệ thống đang kiểm tra thông tin và phạm vi quyền.</p></div></div>;
  if (status === "pending") return <div className="identity-status-panel success" role="status"><CheckCircleIcon width={18}/><div><b>Yêu cầu đang chờ phê duyệt</b><p>Quản trị viên định danh sẽ xác nhận trước khi quyền truy cập có hiệu lực.</p></div></div>;
  if (status === "invalid") return <div className="identity-status-panel warning" role="alert"><ExclamationTriangleIcon width={18}/><div><b>Thông tin chưa đầy đủ</b><p>Vui lòng kiểm tra các trường bắt buộc trước khi gửi yêu cầu.</p></div></div>;
  if (status === "denied") return <div className="identity-status-panel error" role="alert"><ExclamationTriangleIcon width={18}/><div><b>Chưa được cấp quyền thao tác</b><p>Tài khoản hiện tại chưa được phép gửi yêu cầu cấp quyền nhạy cảm.</p></div></div>;
  if (status === "error") return <div className="identity-status-panel error" role="alert"><ExclamationTriangleIcon width={18}/><div><b>Chưa gửi được yêu cầu</b><p>Vui lòng kiểm tra kết nối và thử lại.</p></div></div>;
  if (selectedRole?.id === "super-admin") return <div className="identity-status-panel warning" role="note"><ShieldCheckIcon width={18}/><div><b>Vai trò nhạy cảm</b><p>Yêu cầu này cần được rà soát tăng cường tại Trung tâm Định danh.</p></div></div>;
  return <div className="identity-status-panel" role="note"><LockClosedIcon width={18}/><div><b>Tài khoản không lưu mật khẩu</b><p>Việc xác thực được quản lý qua Trung tâm Định danh QTS.</p></div></div>;
}

function CreateIdentityAccountForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<IdentityRoleId | "">("");
  const [applications, setApplications] = useState<IdentityApplicationId[]>([]);
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState({ name: false, email: false, role: false, applications: false });
  const [status, setStatus] = useState<IdentityRequestStatus>("idle");
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const normalizedEmail = email.trim().toLocaleLowerCase("vi-VN");
  const nameValid = name.trim().length >= 2;
  const emailValid = qtsWorkEmailPattern.test(normalizedEmail);
  const roleValid = Boolean(role);
  const applicationsValid = applications.length > 0;
  const requestLocked = status === "loading" || status === "pending";
  const canSubmit = nameValid && emailValid && roleValid && applicationsValid;
  const showNameError = (touched.name || status === "invalid") && !nameValid;
  const showEmailError = (touched.email || status === "invalid") && !emailValid;
  const showRoleError = (touched.role || status === "invalid") && !roleValid;
  const showApplicationsError = (touched.applications || status === "invalid") && !applicationsValid;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched({ name: true, email: true, role: true, applications: true });
    if (!canSubmit) {
      setStatus("invalid");
      return;
    }
    setStatus("loading");
    timer.current = window.setTimeout(() => setStatus("pending"), 650);
  };

  return <form className="record-modal-form identity-access-form" onSubmit={submit} noValidate>
    <IdentityRequestStatusPanel status={status} role={role}/>
    <div className="identity-field-grid">
      <label className="record-field">
        <span>Họ và tên *</span>
        <input value={name} onChange={event => { setName(event.target.value); if (status === "invalid") setStatus("idle"); }} onBlur={() => setTouched(value => ({ ...value, name: true }))} placeholder="Nhập họ tên nhân viên" autoComplete="name" maxLength={120} disabled={requestLocked} aria-invalid={showNameError || undefined}/>
        {showNameError ? <FieldValidation tone="warning">Nhập họ tên nhân viên.</FieldValidation> : nameValid && <FieldValidation tone="success">Tên hợp lệ.</FieldValidation>}
      </label>
      <label className="record-field">
        <span>Email công việc *</span>
        <input value={email} onChange={event => { setEmail(event.target.value); if (status === "invalid") setStatus("idle"); }} onBlur={() => setTouched(value => ({ ...value, email: true }))} placeholder="Nhập email công việc" inputMode="email" autoComplete="email" maxLength={160} disabled={requestLocked} aria-invalid={showEmailError || undefined}/>
        <small className="identity-helper">Ví dụ: nguyenvana@qts.com</small>
        {showEmailError ? <FieldValidation tone="warning">Email chưa đúng định dạng.</FieldValidation> : emailValid && <FieldValidation tone="success">Email hợp lệ.</FieldValidation>}
      </label>
    </div>
    <RoleSelector value={role} onChange={value => { setRole(value); setTouched(item => ({ ...item, role: true })); if (status === "invalid") setStatus("idle"); }} showError={showRoleError} disabled={requestLocked}/>
    <ApplicationSelector value={applications} role={role} onChange={value => { setApplications(value); setTouched(item => ({ ...item, applications: true })); if (status === "invalid") setStatus("idle"); }} showError={showApplicationsError} disabled={requestLocked}/>
    <PermissionPreview role={role} applications={applications}/>
    <label className="record-field record-field-wide">
      <span>Lý do cấp quyền truy cập</span>
      <textarea value={reason} onChange={event => setReason(event.target.value)} rows={4} maxLength={420} disabled={requestLocked} placeholder={"Ví dụ:\nNhân viên kinh doanh cần truy cập CRM để quản lý khách hàng"}/>
      <small className="identity-helper">{reason.length}/420 ký tự. Nên ghi rõ phòng ban, nghiệp vụ và thời điểm cần truy cập.</small>
    </label>
    <div className="record-modal-actions">
      <button className="portal-button portal-button-ghost" type="button" onClick={onClose}>{status === "pending" ? "Đóng" : "Hủy"}</button>
      <button className="portal-button" type="submit" disabled={requestLocked}>{status === "loading" ? "Đang gửi yêu cầu..." : status === "pending" ? "Đang chờ phê duyệt" : "Gửi yêu cầu cấp quyền"}</button>
    </div>
  </form>;
}

function AddRecordModal({ kind, onClose }: { kind: AddRecordKind; onClose: () => void }) {
  const config = addRecordConfigs[kind];
  const modal = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(document.activeElement instanceof HTMLElement ? document.activeElement : null);
  const reduceMotion = useReducedMotion();
  const [submitted, setSubmitted] = useState(false);
  const titleId = `add-${kind}-title`;
  const descriptionId = `add-${kind}-description`;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFirstField = window.setTimeout(() => {
      const focusable = Array.from(modal.current?.querySelectorAll<HTMLElement>(commandFocusableSelector) ?? [])
        .filter(element => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true");
      (focusable[0] ?? modal.current)?.focus();
    }, 0);

    const handle = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(modal.current?.querySelectorAll<HTMLElement>(commandFocusableSelector) ?? [])
        .filter(element => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true");
      if (!focusable.length) {
        event.preventDefault();
        modal.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !modal.current?.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !modal.current?.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handle);
    return () => {
      window.clearTimeout(focusFirstField);
      window.removeEventListener("keydown", handle);
      document.body.style.overflow = previousOverflow;
      if (returnFocus.current?.isConnected) returnFocus.current.focus();
    };
  }, [onClose]);

  const renderField = (field: AddRecordField) => {
    const common = {
      id: field.id,
      name: field.id,
      required: field.id !== "note" && field.id !== "reason",
      "aria-label": field.label,
    };
    if (field.type === "select") {
      return <select {...common} defaultValue="">
        <option value="" disabled>Chọn {field.label.toLocaleLowerCase("vi-VN")}</option>
        {field.options?.map(option => <option value={option} key={option}>{option}</option>)}
      </select>;
    }
    if (field.type === "textarea") {
      return <textarea {...common} rows={4} placeholder={field.placeholder}/>;
    }
    return <input {...common} type={field.type ?? "text"} placeholder={field.placeholder}/>;
  };

  return <motion.div
    className="record-modal-backdrop"
    initial={reduceMotion ? false : { opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
    transition={{ duration: reduceMotion ? 0 : 0.16, ease: [0.22, 1, 0.36, 1] }}
    onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}
  >
    <motion.div
      ref={modal}
      className={`record-modal t-modal is-open ${kind === "identity-account" ? "record-modal-identity" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      tabIndex={-1}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
      transition={{ duration: reduceMotion ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
      onMouseDown={event => event.stopPropagation()}
    >
      <div className="record-modal-head">
        <i className="record-modal-icon" aria-hidden="true"><PlusIcon width={18}/></i>
        <div>
          <h2 id={titleId}>{config.title}</h2>
          <p id={descriptionId}>{config.description}</p>
        </div>
        <button className="icon-action record-modal-close" type="button" onClick={onClose} aria-label="Đóng cửa sổ thêm mới"><XMarkIcon width={17}/></button>
      </div>
      {kind === "identity-account" ? <CreateIdentityAccountForm onClose={onClose}/> : <form className="record-modal-form" onSubmit={event => { event.preventDefault(); setSubmitted(true); }}>
        <div className="record-modal-grid">
          {config.fields.map(field => <label className={field.type === "textarea" ? "record-field record-field-wide" : "record-field"} key={field.id} htmlFor={field.id}>
            <span>{field.label}</span>
            {renderField(field)}
          </label>)}
        </div>
        <p className="record-modal-note">{config.note}</p>
        {submitted && <p className="record-modal-status" role="status">Thông tin đã sẵn sàng để gửi khi quy trình phê duyệt được bật.</p>}
        <div className="record-modal-actions">
          <button className="portal-button portal-button-ghost" type="button" onClick={onClose}>Hủy</button>
          <button className="portal-button" type="submit" disabled={submitted}>{submitted ? "Đã tạo bản nháp" : config.submitLabel}</button>
        </div>
      </form>}
    </motion.div>
  </motion.div>;
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
      <article className="panel chart-panel"><div className="panel-heading"><div><h2>Hiệu quả vận hành</h2><p>Dữ liệu được tổng hợp từ các tính năng đã kết nối</p></div></div><EmptyData>Chưa có nguồn dữ liệu vận hành được kết nối.</EmptyData></article>
      <article className="panel system-panel"><div className="panel-heading"><div><h2>Tình trạng hệ thống</h2><p>Trạng thái các dịch vụ vận hành</p></div></div><EmptyData>Chưa có dữ liệu giám sát hệ thống.</EmptyData></article>
    </section>
    <section className="lower-grid">
      <article className="panel projects-panel"><div className="panel-heading"><div><h2>Dự án ưu tiên</h2><p>Các chương trình có mốc triển khai đang hoạt động</p></div><button className="icon-action" type="button" disabled aria-label="Xuất danh sách dự án khi có dữ liệu"><ArrowDownTrayIcon/></button></div><ProjectTable compact/></article>
      <article className="panel activity-panel"><div className="panel-heading"><div><h2>Hoạt động vận hành</h2><p>Tín hiệu mới nhất trên toàn QTS</p></div><button className="icon-action" type="button" disabled aria-label="Xem hoạt động khi có dữ liệu"><EllipsisHorizontalIcon/></button></div><EmptyData>Chưa ghi nhận hoạt động nào.</EmptyData></article>
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
      <div className="panel-heading"><div><h2>Danh mục triển khai</h2><p>Dữ liệu dự án theo quyền truy cập của tài khoản</p></div><div className="panel-options" role="group" aria-label="Chế độ xem dự án"><button type="button" className={mode === "overview" ? "active" : ""} aria-pressed={mode === "overview"} onClick={() => setMode("overview")}>Tổng quan</button><button type="button" className={mode === "board" ? "active" : ""} aria-pressed={mode === "board"} onClick={() => setMode("board")}>Kanban</button></div></div>
      {mode === "overview" ? <ProjectTable/> : <div className="kanban">{columns.map(column => <div className="kanban-column" key={column}><div className="kanban-heading"><b>{column}</b><span>0</span></div><p className="command-empty">Chưa có công việc.</p></div>)}</div>}
    </div>
  </>;
}

function CRM({ leads, loading, error, onRefresh }: { leads: PortalLead[]; loading: boolean; error: string; onRefresh: () => void }) {
  const [modal, setModal] = useState<AddRecordKind | null>(null);
  const stages = ["Khám phá", "Đủ điều kiện", "Đề xuất", "Mở rộng"];
  const stageCounts = {
    "Khám phá": leads.filter(lead => lead.status === "new").length,
    "Đủ điều kiện": leads.filter(lead => lead.status === "contacted" || lead.status === "qualified").length,
    "Đề xuất": leads.filter(lead => lead.status === "won").length,
    "Mở rộng": leads.filter(lead => lead.status === "lost" || lead.status === "spam").length,
  };
  return <>
    <PageHeading page="CRM" description="Quản lý quan hệ, cơ hội và tín hiệu khách hàng theo đúng ngữ cảnh."/>
    <div className="crm-grid">{stages.map(stage => <article className="pipeline-column panel" key={stage}><div className="pipeline-heading"><b>{stage}</b><span>{stageCounts[stage as keyof typeof stageCounts]}</span></div><p className="command-empty">{stageCounts[stage as keyof typeof stageCounts] ? "Yêu cầu tư vấn đang nằm trong nhóm này." : "Chưa có cơ hội ở giai đoạn này."}</p></article>)}</div>
    <article className="panel crm-leads-panel"><div className="panel-heading"><div><h2>Yêu cầu tư vấn từ khách hàng</h2><p>Thông tin được gửi từ form landing web và hiển thị cho tài khoản nhân viên, quản trị viên có quyền CRM.</p></div><button className="portal-button portal-button-ghost" type="button" onClick={onRefresh} disabled={loading} aria-busy={loading || undefined}><CloudArrowUpIcon width={13} className={loading ? "spin-icon" : undefined} aria-hidden="true"/>{loading ? "Đang cập nhật" : "Làm mới"}</button></div>
      {error && <div className="admin-message error admin-message-action" role="alert"><span>{error}</span><button className="portal-button portal-button-ghost" type="button" onClick={onRefresh}>Thử lại</button></div>}
      {loading && leads.length > 0 && <p className="admin-message info" role="status">Đang làm mới danh sách yêu cầu tư vấn. Bạn vẫn có thể xem dữ liệu hiện tại.</p>}
      {loading && leads.length === 0 ? <EmptyData title="Đang tải yêu cầu tư vấn">Portal đang đồng bộ yêu cầu mới nhất từ hệ thống.</EmptyData> : leads.length === 0 ? <EmptyData title="Chưa có yêu cầu tư vấn">Khi khách hàng gửi form Yêu cầu tư vấn, thông tin sẽ xuất hiện tại đây và trên nút thông báo.</EmptyData> : <div className="crm-lead-list" aria-live="polite">
        {leads.map(lead => <article className="crm-lead-card" key={lead.id}>
          <div className="crm-lead-card-head">
            <span className="company-symbol" aria-hidden="true">{initialsFor(lead.company)}</span>
            <span><b>{lead.company}</b><small>{lead.name} · {lead.email}</small></span>
            <span className={`badge ${leadBadgeTone(lead.status)}`}>{displayLeadStatus(lead.status)}</span>
          </div>
          <p className="crm-lead-message">{lead.message}</p>
          <dl className="crm-lead-fields">
            <div><dt>Điện thoại</dt><dd>{lead.phone || "Chưa cung cấp"}</dd></div>
            <div><dt>Thời điểm</dt><dd>{formatLeadTime(lead.created_at)}</dd></div>
            <div><dt>Nguồn</dt><dd>{lead.source_url || "Landing web"}</dd></div>
          </dl>
        </article>)}
      </div>}
    </article>
    <article className="panel" style={{ padding: 18, marginTop: 12 }}><div className="panel-heading"><div><h2>Tài khoản doanh nghiệp</h2><p>Thông tin thương mại sẽ hiển thị sau khi kết nối nguồn CRM.</p></div><button className="portal-button" type="button" onClick={() => setModal("business-account")}><PlusIcon width={13}/>Thêm tài khoản</button></div><table className="table"><thead><tr><th>Doanh nghiệp</th><th>Ngành</th><th>Giá trị năm</th><th>Giai đoạn</th></tr></thead><tbody><tr><td colSpan={4}><EmptyData>Chưa có tài khoản doanh nghiệp nào.</EmptyData></td></tr></tbody></table></article>
    <AnimatePresence>{modal && <AddRecordModal kind={modal} onClose={() => setModal(null)}/>}</AnimatePresence>
  </>;
}

function HR() {
  const [modal, setModal] = useState<AddRecordKind | null>(null);
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
      <article className="panel projects-panel"><div className="panel-heading"><div><h2>Hiệu suất đội ngũ</h2><p>Dữ liệu đánh giá hiệu suất gần nhất</p></div><button className="portal-button" type="button" onClick={() => setModal("employee-profile")}><PlusIcon width={13}/>Thêm nhân sự</button></div><table className="table"><thead><tr><th>Nhân sự</th><th>Đội ngũ</th><th>Điểm</th><th>Hiệu suất</th></tr></thead><tbody><tr><td colSpan={4}><EmptyData>Chưa có dữ liệu nhân sự để hiển thị.</EmptyData></td></tr></tbody></table></article>
      <article className="panel system-panel"><div className="panel-heading"><div><h2>Tình trạng tổ chức</h2><p>Các chỉ số vận hành nguồn nhân lực</p></div></div><EmptyData>Chưa kết nối dữ liệu nhân sự.</EmptyData></article>
    </div>
    <AnimatePresence>{modal && <AddRecordModal kind={modal} onClose={() => setModal(null)}/>}</AnimatePresence>
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
    <PageHeading page="Dịch vụ hệ thống" description="Theo dõi các dịch vụ kết nối và trạng thái vận hành hệ sinh thái QTS."/>
    <section className="kpi-grid">
      <Kpi label="Tình trạng kết nối" icon={CloudArrowUpIcon}/>
      <Kpi label="Cập nhật trong kỳ" icon={CommandLineIcon}/>
      <Kpi label="Lượt xử lý" icon={CodeBracketSquareIcon}/>
      <Kpi label="Độ trễ dịch vụ" icon={BoltIcon}/>
      <Kpi label="Khóa đang hoạt động" icon={ShieldCheckIcon}/>
    </section>
    <div className="lower-grid">
      <article className="panel projects-panel"><div className="panel-heading"><div><h2>Vận hành kết nối</h2><p>Các dịch vụ kết nối với hệ thống lõi QTS</p></div><button className="portal-button" type="button" disabled><CloudArrowUpIcon width={13}/>Cập nhật</button></div><table className="table"><thead><tr><th>Dịch vụ</th><th>Phạm vi</th><th>Phiên bản</th><th>Trạng thái</th></tr></thead><tbody><tr><td colSpan={4}><EmptyData>Chưa có dịch vụ kết nối nào.</EmptyData></td></tr></tbody></table></article>
      <article className="panel activity-panel"><div className="panel-heading"><div><h2>Nhật ký hoạt động</h2><p>Hoạt động gần nhất</p></div></div><div className="terminal"><p><span>--</span>Chưa có lượt xử lý để hiển thị.</p></div></article>
    </div>
  </>;
}

function Analytics() {
  const [range, setRange] = useState<"30 ngày" | "90 ngày">("30 ngày");
  return <>
    <PageHeading page="Phân tích" description="Thông tin hỗ trợ quyết định cho toàn bộ hệ thống vận hành doanh nghiệp."/>
    <section className="dashboard-grid">
      <article className="panel chart-panel"><div className="panel-heading"><div><h2>Động lực vận hành</h2><p>Chỉ số tổng hợp từ các chương trình chiến lược</p></div><div className="panel-options" role="group" aria-label="Khoảng thời gian phân tích"><button type="button" className={range === "30 ngày" ? "active" : ""} aria-pressed={range === "30 ngày"} onClick={() => setRange("30 ngày")}>30 ngày</button><button type="button" className={range === "90 ngày" ? "active" : ""} aria-pressed={range === "90 ngày"} onClick={() => setRange("90 ngày")}>90 ngày</button></div></div><EmptyData>{`Chưa có dữ liệu phân tích trong ${range.toLocaleLowerCase("vi-VN")} để hiển thị.`}</EmptyData></article>
      <article className="panel system-panel"><div className="panel-heading"><div><h2>Tín hiệu cần chú ý</h2><p>Được tổng hợp bởi QTS Intelligence</p></div><BoltIcon className="panel-heading-icon" width={15}/></div><EmptyData>Chưa ghi nhận tín hiệu cần chú ý.</EmptyData></article>
    </section>
  </>;
}

function AccessSummaryChip({ label, tone }: { label: string; tone: "good" | "warning" | "blue" | "purple" }) {
  return <span className={`badge ${tone}`}>{label}</span>;
}

function AccessManagement({ person, entitlements, canManageAccess }: { person: Person; entitlements: PortalEntitlements; canManageAccess: boolean }) {
  const enabledCount = allModules.filter(module => entitlements.modules[module.page]).length;

  return <article className="panel access-panel">
    <div className="panel-heading"><div><h2>Quyền truy cập cổng thông tin</h2><p>QTS Identity đánh giá quyền; không thể thay đổi quyền từ cổng thông tin này.</p></div><AccessSummaryChip label={`${enabledCount} tính năng có thể xem`} tone={enabledCount === 0 ? "warning" : "good"}/></div>
    <div className="access-body">
      <div className="access-detail">
        <div className="access-person-summary">
          <i className="profile-avatar">{person.initials}</i>
          <div><b>{person.name}</b><small>{person.title} · {person.email}</small></div>
          {canManageAccess && <span className="badge purple">Quản trị viên định danh</span>}
        </div>
        {enabledCount === 0 && <p className="access-warning" role="status">Tài khoản này hiện chưa có quyền xem bất kỳ tính năng nào.</p>}
        <p className="access-readonly-note">Vai trò và quyền cấp riêng được quản lý, lưu vết tại QTS Identity.</p>
        <div className="access-matrix" aria-label={`Quyền truy cập tính năng của ${person.name}`}>
          <div className="access-matrix-head"><span>Tính năng</span><span>Xem</span><span>Quản lý</span></div>
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

const adminRoles = ["employee", "manager", "developer", "organization-admin", "super-admin", "customer", "portal-limited"];

function AdminUserSkeletonRows() {
  return <>{Array.from({ length: 5 }, (_, index) => <tr className="admin-skeleton-row" aria-hidden="true" key={index}>
    <td><span className="skeleton-line skeleton-title"/><span className="skeleton-line skeleton-copy"/></td>
    <td><span className="skeleton-pill"/></td>
    <td><span className="skeleton-line"/><span className="skeleton-line skeleton-short"/></td>
    <td><span className="skeleton-pill skeleton-pill-muted"/></td>
  </tr>)}</>;
}

function AdminUsers() {
  const [modal, setModal] = useState<AddRecordKind | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await listAdminUsers({ q: debouncedQuery || undefined, role: role || undefined, status: status || undefined, page, page_size: 20 });
      setUsers(result.users);
      setTotal(result.pagination.total);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể tải danh sách tài khoản.");
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, page, role, status]);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => window.clearTimeout(handle);
  }, [query]);

  useEffect(() => { void load(); }, [load]);
  const hasFilters = Boolean(query.trim() || role || status);
  const clearFilters = () => {
    setPage(1);
    setQuery("");
    setRole("");
    setStatus("");
    setDebouncedQuery("");
  };

  return <>
    <PageHeading page="Tài khoản nhân viên" description="Theo dõi tài khoản, vai trò và ứng dụng trong tổ chức QTS."/>
    <p className="admin-message" role="note">Tạo tài khoản mới được thực hiện qua quy trình tạo tài khoản có kiểm soát. Cổng thông tin không nhận hoặc lưu mật khẩu ban đầu.</p>
    <section className="admin-users-layout admin-users-layout-single">
      <article className="panel admin-user-list"><div className="panel-heading"><div><h2>Nhân viên trong tổ chức</h2><p aria-live="polite">{loading ? "Đang cập nhật danh sách tài khoản" : `${total} tài khoản theo bộ lọc hiện tại`}</p></div><button className="portal-button" type="button" onClick={() => setModal("identity-account")}><PlusIcon width={13}/>Thêm tài khoản</button></div>
        <div className="admin-filters"><input value={query} onChange={event => { setPage(1); setQuery(event.target.value); }} placeholder="Tìm email hoặc tên" aria-label="Tìm tài khoản"/><select value={role} onChange={event => { setPage(1); setRole(event.target.value); }} aria-label="Lọc theo vai trò"><option value="">Tất cả vai trò</option>{adminRoles.map(item => <option key={item} value={item}>{displayRole(item)}</option>)}</select><select value={status} onChange={event => { setPage(1); setStatus(event.target.value); }} aria-label="Lọc theo trạng thái"><option value="">Tất cả trạng thái</option><option value="active">Hoạt động</option><option value="disabled">Vô hiệu hóa</option><option value="invited">Đã mời</option></select>{hasFilters && <button className="portal-button portal-button-ghost admin-clear-filters" type="button" onClick={clearFilters}>Xóa lọc</button>}</div>
        {error && <div className="admin-message error admin-message-action" role="alert"><span>{error}</span><button className="portal-button portal-button-ghost" type="button" onClick={() => void load()}>Thử lại</button></div>}
        <div className="admin-table-wrap"><table className="table admin-users-table" aria-label="Danh sách tài khoản nhân viên" aria-busy={loading || undefined}><thead><tr><th>Nhân viên</th><th>Vai trò</th><th>Ứng dụng</th><th>Trạng thái</th></tr></thead><tbody>{loading ? <AdminUserSkeletonRows/> : users.length === 0 ? <tr><td colSpan={4}><EmptyData title={hasFilters ? "Không tìm thấy tài khoản" : "Chưa có tài khoản"} action={hasFilters ? <button className="portal-button portal-button-ghost" type="button" onClick={clearFilters}>Xóa bộ lọc</button> : undefined}>{hasFilters ? "Thử thay đổi từ khóa, vai trò hoặc trạng thái để mở rộng kết quả." : "Danh sách nhân viên sẽ hiển thị sau khi dữ liệu được đồng bộ."}</EmptyData></td></tr> : users.map(user => <tr key={user.membership_id}><td data-label="Nhân viên"><b>{user.display_name}</b><small>{user.email}</small></td><td data-label="Vai trò"><span className="admin-chip-list">{user.membership.roles.map(item => <span className="badge blue" key={item}>{displayRole(item)}</span>)}</span></td><td data-label="Ứng dụng"><span className="admin-app-list">{user.membership.applications.join(", ") || "—"}</span></td><td data-label="Trạng thái"><span className={`badge ${user.membership.status === "active" ? "good" : "warning"}`}>{displayStatus(user.membership.status)}</span></td></tr>)}</tbody></table></div>
        <div className="admin-pagination"><button className="portal-button portal-button-ghost" type="button" disabled={page === 1 || loading} onClick={() => setPage(value => value - 1)} aria-label="Trang trước">Trước</button><span aria-live="polite">Trang {page}</span><button className="portal-button portal-button-ghost" type="button" disabled={loading || page * 20 >= total} onClick={() => setPage(value => value + 1)} aria-label="Trang sau">Sau</button></div>
      </article>
    </section>
    <AnimatePresence>{modal && <AddRecordModal kind={modal} onClose={() => setModal(null)}/>}</AnimatePresence>
  </>;
}

function Settings({ person, entitlements, canManageAccess }: { person: Person; entitlements: PortalEntitlements; canManageAccess: boolean }) {
  const cards: [string, string, string, Icon][] = [
    ["Tổ chức", "QTS", "Hồ sơ doanh nghiệp, bối cảnh khu vực và thiết lập vận hành mặc định", UsersIcon],
    ["Xác thực", "QTS Identity", "Đăng nhập tập trung và bảo mật phiên", ShieldCheckIcon],
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
    <p>Tài khoản hiện chưa có quyền xem bất kỳ tính năng nào. Vui lòng liên hệ quản trị viên để yêu cầu quyền truy cập.</p>
  </section>;
}

function EnrollmentPending({ error, onContinue, onSignOut }: { error: string; onContinue: () => void; onSignOut: () => void }) {
  const enrollmentUrl = `${identityWebOrigin}/enrollment-pending`;
  return <main className="login"><motion.section className="login-card" initial={{ opacity: 0, y: 8, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .25, ease: [0.22, 1, 0.36, 1] }}><div className="login-logo"><Logo/></div><h1>Tài khoản đang chờ hoàn tất kích hoạt</h1><p>{error || "Tài khoản đã đăng nhập nhưng chưa thể truy cập ứng dụng cho đến khi hoàn tất đổi mật khẩu, thiết lập TOTP và lưu mã dự phòng."}</p><div className="login-actions"><a className="portal-button" href={enrollmentUrl}>Mở QTS Identity để hoàn tất</a><button className="portal-button portal-button-ghost" type="button" onClick={onContinue}>Thử lại sau khi hoàn tất</button><button className="portal-button portal-button-ghost" type="button" onClick={onSignOut}>Đăng xuất</button></div><p className="login-hint">Sau khi hoàn tất 3 bước bảo mật, vui lòng liên hệ quản trị viên để xác minh và kích hoạt.</p></motion.section></main>;
}

function Login({ error, onSignIn, busy }: { error?: string; onSignIn: () => void; busy?: boolean }) {
  return <main className="login"><motion.section className="login-card" initial={{ opacity: 0, y: 8, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .25, ease: [0.22, 1, 0.36, 1] }}><div className="login-logo"><Logo/></div><h1>Không thể xác minh danh tính</h1><p>QTS Portal đã tự động kết nối QTS Identity nhưng chưa hoàn tất được phiên xác thực.</p>{error && <p className="login-error" role="alert">{error}</p>}<button className="portal-button" type="button" onClick={onSignIn} disabled={busy} aria-busy={busy || undefined}>{busy ? "Đang thử lại…" : <>Thử lại xác minh danh tính<ArrowRightIcon width={14}/></>}</button><p className="login-hint">QTS Identity quản lý việc xác thực và quyền truy cập.</p></motion.section></main>;
}

function AuthenticationStatus({ signingOut = false }: { signingOut?: boolean }) {
  return <main className="login"><motion.section className="login-card" role="status" aria-live="polite" aria-busy="true" initial={{ opacity: 0, y: 8, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .25, ease: [0.22, 1, 0.36, 1] }}><div className="login-logo"><Logo/></div><h1>{signingOut ? "Đang chuyển đến xác nhận đăng xuất" : "Đang xác minh danh tính"}</h1><div className="auth-progress" aria-hidden="true"><span/><span/><span/></div><p>{signingOut ? "Phiên hiện tại vẫn được giữ cho đến khi bạn xác nhận tại QTS Identity." : "QTS Portal đang tự động kết nối QTS Identity và kiểm tra quyền truy cập."}</p></motion.section></main>;
}

export default function PortalApp() {
  const [identity, setIdentity] = useState<IdentityState | null>(null);
  const [phase, setPhase] = useState<AuthPhase>(() => isAuthorizationCallback() || hasStoredSession() ? "authenticating" : "unauthenticated");
  const [authenticationError, setAuthenticationError] = useState("");
  const [page, setPage] = useState<Page>("Dashboard");
  const [command, setCommand] = useState(false);
  const mainContentRef = useRef<HTMLElement>(null);
  const ssoHandoff = new URLSearchParams(window.location.search).get("sso") === "1";
  const [showChooser, setChooser] = useState(() => !ssoHandoff);
  const authorizationStarted = useRef(false);
  const reduceMotion = useReducedMotion();
  const [consultationLeads, setConsultationLeads] = useState<PortalLead[]>([]);
  const [consultationLeadsLoading, setConsultationLeadsLoading] = useState(false);
  const [consultationLeadsError, setConsultationLeadsError] = useState("");

  useEffect(() => {
    if (!isAuthorizationCallback()) return;
    let cancelled = false;

    void (async () => {
      try {
        await redeemAuthorizationResponse();
        const { profile, entitlements, applications } = await loadPortalIdentity();
        if (cancelled) return;
        setIdentity({
          person: personFromUserInfo(profile, entitlements),
          entitlements,
          applications,
          tenant: profile.tenant || "Tổ chức QTS",
        });
        setChooser(!consumeSkipChooser());
        setPhase("authenticated");
        window.history.replaceState({}, document.title, "/");
      } catch (error) {
        if (cancelled) return;
        if (error instanceof EnrollmentRequiredError) {
          clearPortalSession();
          setAuthenticationError(error.message);
          setPhase("enrollment-pending");
        } else {
          if (error instanceof SessionExpiredError) clearPortalSession();
          setAuthenticationError(error instanceof Error ? error.message : "Không thể hoàn tất đăng nhập.");
          setPhase("error");
        }
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
        const { profile, entitlements, applications } = await loadPortalIdentity();
        if (cancelled) return;
        setIdentity({
          person: personFromUserInfo(profile, entitlements),
          entitlements,
          applications,
          tenant: profile.tenant || "Tổ chức QTS",
        });
        setPhase("authenticated");
      } catch (error) {
        if (cancelled) return;
        if (error instanceof EnrollmentRequiredError) {
          clearPortalSession();
          setAuthenticationError(error.message);
          setPhase("enrollment-pending");
          return;
        }
        if (error instanceof SessionExpiredError) {
          clearPortalSession();
          if (ssoHandoff) {
            setPhase("unauthenticated");
            return;
          }
          setAuthenticationError(error.message);
          setPhase("error");
          return;
        }
        setAuthenticationError(error instanceof Error ? error.message : "Không tải được phiên. Vui lòng thử lại.");
        setPhase("error");
      }
    })();

    return () => { cancelled = true; };
  }, [phase, ssoHandoff]);

  useEffect(() => {
    if (!ssoHandoff || isAuthorizationCallback() || phase !== "unauthenticated" || authorizationStarted.current) return;
    authorizationStarted.current = true;
    window.history.replaceState({}, document.title, "/");
    signIn(false);
  }, [phase, ssoHandoff]);

  useEffect(() => {
    if (ssoHandoff || isAuthorizationCallback() || phase !== "unauthenticated" || authorizationStarted.current) return;
    authorizationStarted.current = true;
    signIn(true);
  }, [phase, ssoHandoff]);

  const closeCommand = useCallback(() => setCommand(false), []);
  const openCommand = useCallback(() => setCommand(true), []);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (identity && !showChooser && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openCommand();
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [identity, openCommand, showChooser]);

  const allowedModules = useMemo(() => identity ? allModules.filter(module => identity.entitlements.modules[module.page]).map(module => module.page) : [], [identity]);
  const allowedNav = useMemo(() => nav.filter(item => allowedModules.includes(item.page)), [allowedModules]);
  const allowedSecondary = useMemo(() => secondary.filter(item => allowedModules.includes(item.page)), [allowedModules]);
  const canManageSettings = Boolean(identity?.entitlements.manage.Settings);
  const commandAllowedModules = useMemo(() => canManageSettings ? [...allowedModules, "AdminUsers" as const] : allowedModules, [allowedModules, canManageSettings]);
  const canViewCRM = allowedModules.includes("CRM");

  const loadConsultationLeads = useCallback(async () => {
    if (!canViewCRM) {
      setConsultationLeads([]);
      setConsultationLeadsError("");
      setConsultationLeadsLoading(false);
      return;
    }
    setConsultationLeadsLoading(true);
    try {
      const result = await listPortalLeads({ page_size: 20 });
      setConsultationLeads(result.results ?? []);
      setConsultationLeadsError("");
    } catch (reason) {
      setConsultationLeadsError(reason instanceof Error ? reason.message : "Không thể tải yêu cầu tư vấn.");
    } finally {
      setConsultationLeadsLoading(false);
    }
  }, [canViewCRM]);

  useEffect(() => {
    if (!identity || !canViewCRM) {
      setConsultationLeads([]);
      setConsultationLeadsError("");
      return;
    }
    void loadConsultationLeads();
    const interval = window.setInterval(() => void loadConsultationLeads(), 30000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void loadConsultationLeads();
    };
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [canViewCRM, identity, loadConsultationLeads]);

  const leadNotifications = useMemo<AppChromeNotification[]>(() => consultationLeads
    .filter(lead => lead.status === "new")
    .slice(0, 5)
    .map(lead => ({
      id: `lead-${lead.id}`,
      title: `Yêu cầu tư vấn từ ${lead.company}`,
      detail: `${lead.name} · ${lead.email}`,
      tone: "info",
      onSelect: () => {
        setChooser(false);
        setPage("CRM");
      },
    })), [consultationLeads]);

  useEffect(() => {
    if (!identity || allowedModules.includes(page) || (page === "AdminUsers" && canManageSettings)) return;
    const fallback = allowedModules[0];
    if (fallback) setPage(fallback);
  }, [allowedModules, canManageSettings, identity, page]);

  useEffect(() => {
    if (!identity || showChooser || command) return;
    mainContentRef.current?.focus({ preventScroll: true });
  }, [command, identity, page, showChooser]);

  const signIn = (openChooser = true) => {
    setAuthenticationError("");
    if (phase === "redirecting") return;
    rememberChooser(openChooser);
    setChooser(openChooser);
    setPhase("redirecting");
    void beginAuthorization().catch(error => {
      setAuthenticationError(error instanceof Error ? error.message : "Không thể bắt đầu đăng nhập.");
      setPhase("error");
    });
  };

  const signOut = () => {
    setCommand(false);
    setAuthenticationError("");
    setPhase("signing-out");
    void beginLogout().catch(error => {
      setAuthenticationError(error instanceof Error ? error.message : "Không thể hoàn tất đăng xuất.");
      setPhase("authenticated");
    });
  };

  const openSsoLogin = () => {
    signIn(true);
  };

  if (phase === "unauthenticated" || phase === "authenticating" || phase === "redirecting" || phase === "signing-out") return <AuthenticationStatus signingOut={phase === "signing-out"}/>;
  if (phase === "enrollment-pending") return <EnrollmentPending error={authenticationError} onContinue={openSsoLogin} onSignOut={signOut}/>;
  if (!identity) return <Login error={phase === "error" ? authenticationError : undefined} onSignIn={openSsoLogin}/>;

  const person = identity.person;
  if (showChooser && identity.applications.length > 0) {
    return <AppChooser person={person} tenant={identity.tenant} roles={identity.entitlements.roles.map(displayRole).join(" · ") || person.title} applications={identity.applications} onOpenPortal={() => setChooser(false)} onSignOut={signOut}/>;
  }
  if (allowedModules.length === 0) {
    return <><SkipLink/><main className="portal-shell portal-shell-empty" inert={command ? true : undefined} aria-hidden={command || undefined}><div className="workspace"><Topbar onCommand={openCommand} commandOpen={command} applications={identity.applications} onOpenPortal={() => setChooser(false)} person={person} onSignOut={signOut} notifications={leadNotifications}/><main ref={mainContentRef} className="main-content" id="main-content" tabIndex={-1} aria-live="polite"><AccessDenied/></main></div><div className="portal-empty-sidebar"><ProfileMenu person={person} onSignOut={signOut}/></div></main><AnimatePresence>{command && <CommandPalette onClose={closeCommand} onPage={setPage} allowedModules={commandAllowedModules}/>}</AnimatePresence></>;
  }

  const renderPage = () => ({ Dashboard: <Dashboard person={person}/>, Projects: <Projects/>, CRM: <CRM leads={consultationLeads} loading={consultationLeadsLoading} error={consultationLeadsError} onRefresh={() => void loadConsultationLeads()}/>, HR: <HR/>, Finance: <Finance/>, Developer: <Developer/>, Analytics: <Analytics/>, Settings: <Settings person={person} entitlements={identity.entitlements} canManageAccess={canManageSettings}/>, AdminUsers: canManageSettings ? <AdminUsers/> : <AccessDenied/> }[page]);
  return <><SkipLink/><div className="portal-shell" inert={command ? true : undefined} aria-hidden={command || undefined}><Sidebar page={page} onPage={setPage} person={person} allowedNav={allowedNav} allowedSecondary={allowedSecondary} canManageUsers={canManageSettings} onLogout={signOut}/><div className="workspace"><Topbar onCommand={openCommand} commandOpen={command} applications={identity.applications} onOpenPortal={() => setChooser(false)} person={person} onSignOut={signOut} notifications={leadNotifications}/><main ref={mainContentRef} className="main-content" id="main-content" tabIndex={-1} aria-live="polite" aria-label={pageLabels[page]}><AnimatePresence mode="wait"><motion.div key={page} initial={reduceMotion ? false : { opacity: 0, y: 8, filter: "blur(2px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -5, filter: "blur(2px)" }} transition={{ duration: reduceMotion ? 0 : .25, ease: [0.22, 1, 0.36, 1] }}>{renderPage()}</motion.div></AnimatePresence></main></div></div><AnimatePresence>{command && <CommandPalette onClose={closeCommand} onPage={setPage} allowedModules={commandAllowedModules}/>}</AnimatePresence></>;
}
