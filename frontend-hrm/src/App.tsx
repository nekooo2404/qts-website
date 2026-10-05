import { useEffect, useRef, useState } from "react";
import type { ComponentType, ReactNode, SVGProps } from "react";
import {
  ArrowDownTrayIcon,
  ArrowRightOnRectangleIcon,
  ArrowTopRightOnSquareIcon,
  BanknotesIcon,
  BellIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChartBarSquareIcon,
  CheckCircleIcon,
  ViewColumnsIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  CloudArrowUpIcon,
  DocumentArrowDownIcon,
  DocumentCheckIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  HomeIcon,
  IdentificationIcon,
  LifebuoyIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  QueueListIcon,
  RectangleStackIcon,
  ListBulletIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  UserGroupIcon,
  UserPlusIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import {
  ATTENDANCE_TREND,
  attendanceMonth,
  attendanceToday,
  auditLog,
  dependents,
  documents,
  employeeByCode,
  employees,
  emergencies,
  employmentHistory,
  HEADCOUNT,
  leaveBalances,
  leaveTypes,
  maskId,
  organizationPositions,
  organizationUnits,
  MONTHS,
  payslipLines,
  SALARY_COST,
  salaryHistory,
  seedPrototypeHrmData,
  TURNOVER,
  type AttendanceRow,
  type DocumentRow,
  type Employee,
  type WorkflowItem,
  visibleEmployees,
  vnd,
  workflows as initialWorkflows,
} from "./data";
import { loadOfficialHrmData } from "./hrmApi";
import {
  beginAuthorization,
  beginLogout,
  clearHrmSession,
  EnrollmentRequiredError,
  hasStoredSession,
  hrmRuntimeConfigIssue,
  IdentityUnavailableError,
  identityWebOrigin,
  isAuthorizationCallback,
  isOidcConfigured,
  loadHrmIdentity,
  redeemAuthorizationResponse,
  restoreSession,
  SessionExpiredError,
  SilentAuthorizationRequiredError,
  type LauncherApplication,
} from "./auth/oidc";
import { pickHrmRole, sessionFromUserInfo, type HrmSession } from "./auth/session";
import { AuthorizationProvider, useDataScope, usePermissionCheck } from "./auth/authorization";
import { can as roleCan, landingPath, ROLE_LABEL, scopeFor, type Permission, type Role } from "./permissions";
import {
  AuditToast,
  Badge,
  type BadgeTone,
  Button,
  Card,
  DataMask,
  Drawer,
  EmptyState,
  IconButton,
  Modal,
  PageHeader,
  PermissionGate,
  SecurityNote,
  Skeleton,
  StatTile,
  StatusBadge,
  usePresence,
} from "./design-system/components";
import { ColumnChart, TrendChart, type Point } from "./design-system/charts";

type AuthPhase = "prototype" | "redirecting" | "unauthenticated" | "authenticating" | "authenticated" | "signing-out" | "error" | "expired" | "enrollment-pending";
type Icon = ComponentType<SVGProps<SVGSVGElement>>;
type Page =
  | "ceo-dashboard"
  | "hr-dashboard"
  | "employees"
  | "profile"
  | "organization"
  | "documents"
  | "contracts"
  | "recruitment"
  | "onboarding"
  | "attendance"
  | "late-early"
  | "leave"
  | "payroll"
  | "kpi"
  | "training"
  | "assets"
  | "reports"
  | "workflow"
  | "permissions";
type SidebarNavEntry = { page: Page; label: string; icon: Icon; show?: boolean };
type ProfileTab = "personal" | "employment" | "contract" | "documents" | "attendance" | "payroll" | "insurance" | "history" | "audit";
type HeaderSurface = "waffle" | "notifications" | "profile" | null;

const TAB_LABELS: Array<[ProfileTab, string]> = [
  ["personal", "Thông tin cá nhân"],
  ["employment", "Công việc"],
  ["contract", "Hợp đồng"],
  ["documents", "Văn bản"],
  ["attendance", "Chấm công"],
  ["payroll", "Tiền lương"],
  ["insurance", "BHXH"],
  ["history", "Lịch sử"],
  ["audit", "Nhật ký kiểm tra"],
];

const PAGE_LABELS: Record<Page, string> = {
  "ceo-dashboard": "Tổng quan điều hành",
  "hr-dashboard": "Tổng quan nhân sự",
  employees: "Hồ sơ nhân viên",
  profile: "Hồ sơ cá nhân",
  organization: "Cơ cấu tổ chức",
  documents: "Văn bản",
  contracts: "Hợp đồng",
  recruitment: "Tuyển dụng",
  onboarding: "Tiếp nhận nhân sự",
  attendance: "Chấm công",
  "late-early": "Đi muộn và về sớm",
  leave: "Nghỉ phép",
  payroll: "Bảng lương",
  kpi: "KPI",
  training: "Đào tạo",
  assets: "Tài sản",
  reports: "Báo cáo",
  workflow: "Phê duyệt",
  permissions: "Quản trị quyền",
};

const ROLE_ACTOR: Record<Role, string> = {
  "super-admin": "QTS-00001",
  "hr-manager": "QTS-00012",
  "hr-staff": "QTS-00042",
  manager: "QTS-00015",
  employee: "QTS-00028",
  accountant: "QTS-00031",
};

const CHART_POINTS = (values: number[]): Point[] => MONTHS.map((label, index) => ({ label, value: values[index] }));

const PROTOTYPE_APPLICATIONS: LauncherApplication[] = [
  { id: "hrm", name: "HRM", slug: "qts-hrm", description: "Quản lý nhân sự", icon: "user-group", client_id: "qts-hrm", redirect_uri: "", status: "Available", last_accessed_at: null },
  { id: "portal", name: "Cổng thông tin QTS", slug: "qts-portal", description: "Cổng nội bộ doanh nghiệp", icon: "building", client_id: "qts-portal", redirect_uri: "http://localhost:5174/", status: "Available", last_accessed_at: null },
];

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(-2).map((word) => word[0]).join("").toUpperCase();
}

function appPageFor(role: Role, ownCode = ROLE_ACTOR[role]): Page {
  const path = landingPath(role, ownCode);
  if (path === "/dashboard/ceo") return "ceo-dashboard";
  if (path === "/payroll") return "payroll";
  if (path === "/dashboard/hr") return "hr-dashboard";
  return "profile";
}

function actorCodeForSession(role: Role, employeeCode?: string | null) {
  if (employeeCode && employeeByCode(employeeCode)) return employeeCode;
  if (employeeByCode(ROLE_ACTOR[role])) return ROLE_ACTOR[role];
  return employees[0]?.code ?? ROLE_ACTOR[role];
}

function isEmployeeVisible(scope: ReturnType<typeof scopeFor>, actorCode: string, employee: Employee) {
  return visibleEmployees(scope, actorCode).some((row) => row.code === employee.code);
}

function currentWorkflowStep(item: WorkflowItem) {
  return item.steps.find((step) => step.status === "Current");
}

function workflowStepLabel(stepRole: string) {
  if (stepRole === "Manager") return "Quản lý trực tiếp";
  if (stepRole === "HR") return "Nhân sự";
  if (stepRole === "Completed") return "Hoàn tất";
  return stepRole;
}

function workflowActorLabel(role: Role) {
  if (role === "super-admin") return "Quản trị đặc quyền";
  if (role === "hr-manager" || role === "hr-staff") return "Nhân sự";
  if (role === "manager") return "Quản lý trực tiếp";
  if (role === "employee") return "Người gửi";
  return ROLE_LABEL[role];
}

function workflowDecision(item: WorkflowItem, role: Role, actorCode: string, hasApprovalPermission: boolean) {
  const step = currentWorkflowStep(item);
  const employee = employeeByCode(item.employeeCode);
  const terminal = item.status === "Completed" || item.status === "Rejected" || !step;
  if (terminal) return { canAct: false, step, note: "Yêu cầu đã kết thúc." };
  if (!hasApprovalPermission) return { canAct: false, step, note: `${workflowActorLabel(role)} chỉ có quyền theo dõi yêu cầu này.` };
  if (step.role === "Manager") {
    const directManager = employee?.managerCode === actorCode;
    const canAct = role === "super-admin" || (role === "manager" && directManager);
    return { canAct, step, note: canAct ? "Bạn đang xử lý bước quản lý trực tiếp." : "Chờ quản lý trực tiếp xử lý bước này." };
  }
  if (step.role === "HR") {
    const canAct = role === "super-admin" || role === "hr-manager" || role === "hr-staff";
    return { canAct, step, note: canAct ? "Bạn đang xử lý bước nhân sự." : "Chờ HR xử lý bước này." };
  }
  return { canAct: false, step, note: `Bước ${workflowStepLabel(step.role)} không có thao tác thủ công.` };
}

function QtsMark() {
  return <img className="qts-mark" src="/images/brand/qts-logo.webp" alt="" width={29} height={29} />;
}

function StatusDot({ tone = "blue" }: { tone?: "blue" | "warning" | "success" | "danger" }) {
  return <i className={`status-dot status-dot-${tone}`} aria-hidden="true" />;
}

function applicationOrigin(redirectUri: string) {
  try {
    return new URL(redirectUri).origin;
  } catch {
    return "";
  }
}

function isHrmApplication(app: LauncherApplication) {
  return app.slug === "qts-hrm" || app.client_id === "qts-hrm";
}

function isSharedApplication(app: LauncherApplication) {
  return isHrmApplication(app) || app.slug === "qts-portal" || app.client_id === "qts-portal";
}

function useOnlineStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const setOnlineState = () => setOnline(true);
    const setOfflineState = () => setOnline(false);
    window.addEventListener("online", setOnlineState);
    window.addEventListener("offline", setOfflineState);
    return () => {
      window.removeEventListener("online", setOnlineState);
      window.removeEventListener("offline", setOfflineState);
    };
  }, []);
  return online;
}

function Sidebar({
  page,
  role,
  onNavigate,
}: {
  page: Page;
  role: Role;
  onNavigate: (page: Page) => void;
}) {
  const canAccess = usePermissionCheck(role);
  const dashboardPage: Page | null = canAccess("hrm.dashboard.executive")
    ? "ceo-dashboard"
    : canAccess("hrm.dashboard.hr")
      ? "hr-dashboard"
      : null;
  const homePage: Page = dashboardPage ?? (canAccess("hrm.payroll.read") ? "payroll" : "profile");
  const primary: SidebarNavEntry[] = dashboardPage ? [{ page: dashboardPage, label: "Tổng quan", icon: HomeIcon }] : [];
  const people = [
    { page: "employees", label: "Hồ sơ nhân viên", icon: IdentificationIcon, show: role !== "accountant" && canAccess("hrm.employee.read") },
    { page: "organization", label: "Cơ cấu tổ chức", icon: BuildingOffice2Icon, show: role !== "accountant" && canAccess("organization.department.read") },
    { page: "documents", label: "Văn bản", icon: DocumentTextIcon, show: canAccess("hrm.document.view") },
    { page: "contracts", label: "Hợp đồng", icon: ClipboardDocumentCheckIcon, show: canAccess("hrm.contract.read") },
  ] satisfies SidebarNavEntry[];
  const time = [
    { page: "attendance", label: "Chấm công", icon: CalendarDaysIcon, show: canAccess("hrm.attendance.read") },
    { page: "leave", label: "Nghỉ phép", icon: ClockIcon, show: canAccess("hrm.leave.read") || canAccess("hrm.leave.read_own") },
    { page: "workflow", label: "Phê duyệt", icon: QueueListIcon, show: canAccess("hrm.workflow.read") || canAccess("hrm.workflow.approve") },
  ] satisfies SidebarNavEntry[];
  const lifecycle = [
    { page: "recruitment", label: "Tuyển dụng", icon: UserPlusIcon, show: canAccess("hrm.nav.recruitment") },
    { page: "onboarding", label: "Tiếp nhận nhân sự", icon: CheckCircleIcon, show: canAccess("hrm.onboarding.read") },
    { page: "training", label: "Đào tạo", icon: RectangleStackIcon, show: canAccess("hrm.training.read") },
    { page: "assets", label: "Tài sản", icon: BriefcaseIcon, show: canAccess("hrm.asset.read") },
  ] satisfies SidebarNavEntry[];
  const performance = [
    { page: "payroll", label: "Bảng lương", icon: BanknotesIcon, show: canAccess("hrm.payroll.read") },
    { page: "kpi", label: "KPI", icon: ChartBarSquareIcon, show: canAccess("hrm.kpi.read") },
    { page: "reports", label: "Báo cáo", icon: ChartBarSquareIcon, show: canAccess("hrm.report.read") },
  ] satisfies SidebarNavEntry[];
  const administration = [
    { page: "permissions", label: "Quản trị", icon: ShieldCheckIcon, show: canAccess("hrm.nav.system") || canAccess("hrm.permission.manage") },
  ] satisfies SidebarNavEntry[];
  const active = (candidate: Page) => candidate === page || (candidate === "hr-dashboard" && page === "ceo-dashboard");
  const renderGroup = (label: string, items: SidebarNavEntry[]) => {
    const visibleItems = items.filter((item) => item.show !== false);
    if (!visibleItems.length) return null;
    return <section className="nav-group" aria-label={label} key={label}>
      <p className="nav-heading">{label}</p>
      {visibleItems.map((item) => <NavItem key={item.label} label={item.label} icon={item.icon} active={item.page === "employees" && page === "profile" || active(item.page)} onClick={() => onNavigate(item.page)} />)}
    </section>;
  };

  return <aside className="sidebar">
    <div className="sidebar-head">
      <div className="sidebar-brand-stack">
        <button className="hrm-brand" onClick={() => onNavigate(homePage)} type="button" aria-label="Trang chủ QTS HRM">
          <QtsMark /><span>QTS <small>Nền tảng nhân sự</small></span>
        </button>
        <span className="sidebar-role-pill">Vai trò · {ROLE_LABEL[role]}</span>
      </div>
    </div>
    <nav className="sidebar-nav" aria-label="Điều hướng HRM">
      {primary.map((item) => <NavItem key={item.label} {...item} active={active(item.page)} onClick={() => onNavigate(item.page)} />)}
      {renderGroup("Hồ sơ", people)}
      {renderGroup("Thời gian", time)}
      {renderGroup("Vòng đời", lifecycle)}
      {renderGroup("Hiệu suất", performance)}
      {renderGroup("Quản trị", administration)}
    </nav>
    <footer className="sidebar-help" aria-label="Hỗ trợ HRM"><LifebuoyIcon aria-hidden="true" /><span><b>Hỗ trợ QTS</b><small>Hướng dẫn sử dụng</small></span></footer>
  </aside>;
}

function NavItem({ label, icon: Icon, active, onClick }: { label: string; icon: Icon; active: boolean; onClick: () => void }) {
  return <button type="button" className={`nav-item ${active ? "active" : ""}`} onClick={onClick} aria-current={active ? "page" : undefined} aria-label={label} data-label={label}><Icon aria-hidden="true" /><span>{label}</span></button>;
}

function BottomNav({ page, role, onNavigate, onProfile }: { page: Page; role: Role; onNavigate: (page: Page) => void; onProfile: () => void }) {
  const canAccess = usePermissionCheck(role);
  const dashboard = canAccess("hrm.dashboard.executive") ? "ceo-dashboard" : canAccess("hrm.dashboard.hr") ? "hr-dashboard" : null;
  const items = [
    dashboard && { page: dashboard, label: "Tổng quan", icon: HomeIcon, action: () => onNavigate(dashboard) },
    canAccess("hrm.attendance.read") && { page: "attendance" as Page, label: "Chấm công", icon: CalendarDaysIcon, action: () => onNavigate("attendance") },
    (canAccess("hrm.leave.read") || canAccess("hrm.leave.read_own")) && { page: "leave" as Page, label: "Nghỉ phép", icon: ClockIcon, action: () => onNavigate("leave") },
    canAccess("hrm.payroll.read") && { page: "payroll" as Page, label: "Bảng lương", icon: BanknotesIcon, action: () => onNavigate("payroll") },
    { page: "profile" as Page, label: "Hồ sơ", icon: IdentificationIcon, action: onProfile },
  ].filter(Boolean) as Array<{ page: Page; label: string; icon: Icon; action: () => void }>;
  return <nav className="bottom-nav" aria-label="Điều hướng thiết yếu" style={{ "--bottom-nav-items": items.length } as React.CSSProperties}>{items.map((item) => { const Icon = item.icon; const active = item.page === page || item.page === "profile" && page === "employees"; return <button key={item.label} type="button" className={active ? "active" : undefined} onClick={item.action} aria-current={active ? "page" : undefined}><Icon aria-hidden="true" /><span>{item.label}</span></button>; })}</nav>;
}

function GlobalSearch({ open, role, directory, onClose, onEmployee, onNavigate }: { open: boolean; role: Role; directory: Employee[]; onClose: () => void; onEmployee: (code: string) => void; onNavigate: (page: Page) => void }) {
  const canAccess = usePermissionCheck(role);
  const [rendered, closing] = usePresence(open, "--modal-close-dur", 150);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const normalized = query.trim().toLocaleLowerCase("vi-VN");
  const matches = directory.filter((employee) => !normalized || [employee.legalName, employee.code, employee.workEmail].some((value) => value.toLocaleLowerCase("vi-VN").includes(normalized))).slice(0, 6);
  const navItems: Array<{ key: string; label: string; icon: Icon; detail: string; action: () => void }> = [
    canAccess("hrm.attendance.read") && { key: "nav-attendance", label: "Chấm công", icon: CalendarDaysIcon, detail: "Tổng quan chuyên cần và đối soát", action: () => { onNavigate("attendance"); onClose(); } },
    (canAccess("hrm.leave.read") || canAccess("hrm.leave.read_own")) && { key: "nav-leave", label: "Nghỉ phép", icon: ClockIcon, detail: "Số dư và đơn nghỉ phép", action: () => { onNavigate("leave"); onClose(); } },
    canAccess("hrm.contract.read") && { key: "nav-contracts", label: "Hợp đồng", icon: ClipboardDocumentCheckIcon, detail: "Danh sách và hợp đồng sắp hết hạn", action: () => { onNavigate("contracts"); onClose(); } },
    (canAccess("hrm.workflow.read") || canAccess("hrm.workflow.approve")) && { key: "nav-workflow", label: "Phê duyệt", icon: QueueListIcon, detail: "Hàng đợi phê duyệt", action: () => { onNavigate("workflow"); onClose(); } },
  ].filter(Boolean) as Array<{ key: string; label: string; icon: Icon; detail: string; action: () => void }>;
  const flatCount = matches.length + navItems.length;
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  useEffect(() => { setActiveIndex(0); }, [normalized]);
  useEffect(() => {
    if (!open) return;
    const active = document.activeElement;
    if (active instanceof HTMLElement) returnFocusRef.current = active;
  }, [open]);
  // The surface stays mounted through its exit, so autofocus is set explicitly instead of via autoFocus.
  useEffect(() => { if (open && !closing) { setQuery(""); inputRef.current?.focus(); } }, [open, closing]);
  useEffect(() => {
    if (open || rendered) return;
    const element = returnFocusRef.current;
    if (element?.isConnected) element.focus();
    returnFocusRef.current = null;
  }, [open, rendered]);
  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
    if (event.key === "Home") { event.preventDefault(); setActiveIndex(0); return; }
    if (event.key === "End") { event.preventDefault(); setActiveIndex(Math.max(0, flatCount - 1)); return; }
    if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((i) => Math.min(i + 1, Math.max(0, flatCount - 1))); return; }
    if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); return; }
    if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex < matches.length) { const e = matches[activeIndex]; if (e) { onEmployee(e.code); onClose(); } }
      else { const n = navItems[activeIndex - matches.length]; n?.action(); }
    }
  };
  const onDialogKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(modalRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled])") ?? []).filter((element) => element.getClientRects().length > 0);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  if (!rendered) return null;
  return <div className={closing ? "command-backdrop is-closing" : "command-backdrop"} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} role="presentation">
    <section ref={modalRef} tabIndex={-1} className={closing ? "command-modal is-closing" : "command-modal"} role="dialog" aria-modal="true" aria-label="Tìm kiếm toàn hệ thống" onKeyDown={onDialogKeyDown}>
      <div className="command-input-shell"><MagnifyingGlassIcon aria-hidden="true" /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={onKeyDown} placeholder="Tìm nhân viên, mã nhân viên hoặc email…" role="searchbox" aria-controls="hrm-command-results" aria-expanded="true" aria-autocomplete="list" aria-activedescendant={flatCount ? `cmd-${activeIndex}` : undefined} />{query ? <button type="button" className="command-clear" aria-label="Xóa từ khóa tìm kiếm" onClick={() => { setQuery(""); setActiveIndex(0); inputRef.current?.focus(); }}><XCircleIcon aria-hidden="true" /></button> : null}<kbd>Esc</kbd></div>
      <div id="hrm-command-results" className="command-results" role="listbox" aria-label="Kết quả tìm kiếm">
        <p id="cmd-group-people">Nhân sự</p>
        {matches.map((employee, idx) => <button key={employee.code} id={`cmd-${idx}`} role="option" aria-selected={idx === activeIndex} type="button" className={idx === activeIndex ? "is-active" : undefined} onClick={() => { onEmployee(employee.code); onClose(); }}><Avatar employee={employee} size="sm" /><span><b>{employee.legalName}</b><small>{employee.code} · {employee.department}</small></span><ChevronRightIcon /></button>)}
        {matches.length === 0 && <EmptyState title="Không tìm thấy kết quả" detail="Thử theo tên, mã nhân viên hoặc email công việc." />}
        <p id="cmd-group-nav">Điều hướng</p>
        {navItems.map((item, idx) => {
          const flat = matches.length + idx;
          const Icon = item.icon;
          return <button key={item.key} id={`cmd-${flat}`} role="option" aria-selected={flat === activeIndex} type="button" className={flat === activeIndex ? "is-active" : undefined} onClick={item.action}><Icon /><span><b>{item.label}</b><small>{item.detail}</small></span><ChevronRightIcon /></button>;
        })}
      </div>
    </section>
  </div>;
}

function Waffle({
  applications,
  prototype,
  open,
  onToggle,
  onClose,
}: {
  applications: LauncherApplication[];
  prototype: boolean;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const [rendered, closing] = usePresence(open, "--dropdown-close-dur", 150);
  const cards = prototype ? PROTOTYPE_APPLICATIONS : applications;
  return <div className="waffle-shell">
    <IconButton label="Ứng dụng QTS" onClick={onToggle} aria-expanded={open} aria-haspopup="menu"><Squares2X2Icon /></IconButton>
    {rendered && <div className={closing ? "waffle-popover is-closing" : "waffle-popover"} role="menu">
      <div><b>Ứng dụng QTS</b><small>{prototype ? "Môi trường phát triển" : "Ứng dụng được cấp"}</small></div>
      {cards.filter(isSharedApplication).map((app) => {
        if (isHrmApplication(app)) return <button type="button" role="menuitem" key={app.id} onClick={onClose} aria-current="page"><span className="waffle-icon blue"><UserGroupIcon /></span><span><b>{app.name}</b><small>Ứng dụng hiện tại</small></span></button>;
        const href = applicationOrigin(app.redirect_uri);
        if (!href) return null;
        return <a href={`${href}?sso=1`} role="menuitem" key={app.id} onClick={onClose}><span className="waffle-icon"><BuildingOffice2Icon /></span><span><b>{app.name}</b><small>{app.description}</small></span><ArrowTopRightOnSquareIcon /></a>;
      })}
    </div>}
  </div>;
}

function Header({
  role,
  actor,
  session,
  applications,
  prototype,
  onRole,
  onSearch,
  onLogout,
}: {
  role: Role;
  actor: Employee;
  session: HrmSession | null;
  applications: LauncherApplication[];
  prototype: boolean;
  onRole: (role: Role) => void;
  onSearch: () => void;
  onLogout: () => void;
}) {
  const [surface, setSurface] = useState<HeaderSurface>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [profileRendered, profileClosing] = usePresence(surface === "profile", "--dropdown-close-dur", 150);
  const [notificationsRendered, notificationsClosing] = usePresence(surface === "notifications", "--dropdown-close-dur", 150);
  const displayName = session?.displayName ?? actor.legalName;
  const email = session?.email ?? actor.workEmail;
  const toggle = (next: Exclude<HeaderSurface, null>) => setSurface((current) => current === next ? null : next);
  const closeSurface = () => setSurface(null);

  useEffect(() => {
    if (!surface) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") closeSurface(); };
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (headerRef.current && target && !headerRef.current.contains(target)) closeSurface();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [surface]);

  return <header className="app-header" ref={headerRef}>
    <button type="button" className="header-search" onClick={() => { closeSurface(); onSearch(); }} aria-label="Tìm nhân viên, hồ sơ, nghiệp vụ"><MagnifyingGlassIcon /><span>Tìm nhân viên, hồ sơ, nghiệp vụ</span><kbd>⌘ K</kbd></button>
    <div className="header-actions">
      <Waffle applications={applications} prototype={prototype} open={surface === "waffle"} onToggle={() => toggle("waffle")} onClose={closeSurface} />
      <div className="notification-shell">
        <IconButton label="Thông báo" onClick={() => toggle("notifications")} aria-expanded={surface === "notifications"} aria-haspopup="menu"><BellIcon /><i className="notification-indicator" aria-hidden="true" /></IconButton>
        {notificationsRendered && <div className={notificationsClosing ? "notification-panel is-closing" : "notification-panel"} role="menu"><header><span><b>Thông báo</b><small>Theo dữ liệu HRM</small></span><Badge tone="neutral">0 mới</Badge></header><div className="notification-empty"><EmptyState title="Chưa có thông báo" detail="Thông báo nghiệp vụ sẽ xuất hiện khi có dữ liệu chính thức từ hệ thống." /></div></div>}
      </div>
      <div className="profile-shell">
        <button type="button" className="header-profile" onClick={() => toggle("profile")} aria-expanded={surface === "profile"} aria-haspopup="menu" aria-label={`Hồ sơ ${displayName}`}><Avatar employee={actor} size="sm" /><span><b>{displayName}</b><small>{prototype ? ROLE_LABEL[role] : session?.roles.join(", ")}</small></span><ChevronDownIcon aria-hidden="true" /></button>
        {profileRendered && <div className={profileClosing ? "profile-popover is-closing" : "profile-popover"}><div className="profile-summary"><Avatar employee={actor} size="md" /><span><b>{displayName}</b><small>{email}</small></span></div>{prototype ? <><label className="role-preview-label">Chọn vai trò kiểm thử <select value={role} onChange={(event) => onRole(event.target.value as Role)}>{(Object.keys(ROLE_LABEL) as Role[]).map((value) => <option value={value} key={value}>{ROLE_LABEL[value]}</option>)}</select></label><p><ShieldCheckIcon /> Chỉ dùng để xem phạm vi hiển thị theo từng vai trò</p></> : <><p><ShieldCheckIcon /> Vai trò do QTS Identity cấp</p><button type="button" className="profile-signout" onClick={() => { closeSurface(); onLogout(); }}><ArrowRightOnRectangleIcon /> Đăng xuất</button></>}</div>}
      </div>
    </div>
  </header>;
}

function Avatar({ employee, size = "md" }: { employee: Employee; size?: "sm" | "md" | "lg" }) {
  return <span className={`avatar avatar-${size}`} role="img" aria-label={`Ảnh đại diện ${employee.legalName}`}>{employee.initials || initials(employee.legalName)}</span>;
}

function AlertList({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const alerts: Array<{ title: string; detail: string; tone: "warning" | "danger" | "info"; page: Page }> = [];
  return <Card title="Cảnh báo cần xử lý" description="Ưu tiên theo ảnh hưởng tuân thủ">
    {alerts.length ? <div className="alert-list">{alerts.map((alert) => <button key={alert.title} type="button" onClick={() => onNavigate(alert.page)}><StatusDot tone={alert.tone === "danger" ? "danger" : alert.tone === "warning" ? "warning" : "blue"} /><span><b>{alert.title}</b><small>{alert.detail}</small></span><ChevronRightIcon /></button>)}</div> : <EmptyState title="Chưa có cảnh báo" detail="Cảnh báo sẽ hiển thị khi dữ liệu hợp đồng, văn bản hoặc BHXH được đồng bộ." />}
  </Card>;
}

function dataSourceLabel(prototype: boolean) {
  return prototype ? "Dữ liệu mẫu kiểm thử" : "Dữ liệu HRM chính thức";
}

function CeoDashboard({ onNavigate, prototype }: { onNavigate: (page: Page) => void; prototype: boolean }) {
  const totalEmployees = visibleEmployees("company", ROLE_ACTOR["super-admin"]).length;
  const sourceLabel = dataSourceLabel(prototype);
  const executiveReports: Array<{ title: string; detail: string; icon: Icon; page: Page }> = [
    { title: "Báo cáo nhân sự", detail: "Cơ cấu lao động theo pháp nhân và phòng ban", icon: ChartBarSquareIcon, page: "reports" },
    { title: "Chi phí lao động", detail: "Chi phí nhân sự theo kỳ và đơn vị", icon: BanknotesIcon, page: "payroll" },
    { title: "Báo cáo tuân thủ", detail: "Hồ sơ pháp lý, BHXH và Mẫu 02/PLI", icon: DocumentCheckIcon, page: "contracts" },
  ];
  return <>
    <PageHeader title="Bảng điều hành CEO" description="Góc nhìn điều hành nhân sự và chi phí lao động của QTS." breadcrumb={["Tổng quan", "CEO"]} actions={<div className="period-filter"><CalendarDaysIcon /><select aria-label="Khoảng thời gian"><option>Tháng 09/2026</option><option>90 ngày gần nhất</option><option>Năm 2026</option></select></div>} />
    <section className="stat-grid stat-grid-four">
      <StatTile label="Tổng nhân sự" value={String(totalEmployees)} detail={sourceLabel} tone="success" />
      <StatTile label="Nhân sự hoạt động" value={String(visibleEmployees("company", ROLE_ACTOR["super-admin"]).filter((employee) => employee.active).length)} detail="Theo trạng thái hồ sơ" tone="blue" />
      <StatTile label="Nghỉ việc" value={String(visibleEmployees("company", ROLE_ACTOR["super-admin"]).filter((employee) => employee.status === "Nghỉ việc").length)} detail={sourceLabel} tone="warning" />
      <StatTile label="Chi phí nhân sự" value="—" detail="Chưa có bảng lương chính thức" tone="blue" />
    </section>
    <section className="dashboard-charts">
      <Card className="chart-card"><TrendChart title="Biến động nhân sự" description="Tổng nhân sự trong 12 tháng" points={CHART_POINTS(HEADCOUNT)} tableLabel="Tổng nhân sự" /></Card>
      <Card className="chart-card"><TrendChart title="Tỷ lệ nghỉ việc" description="Theo tháng" points={CHART_POINTS(TURNOVER)} unit="%" tableLabel="Tỷ lệ nghỉ việc" /></Card>
      <Card className="chart-card"><ColumnChart title="Chi phí lương" description="Theo tháng, đơn vị tỷ VNĐ" points={CHART_POINTS(SALARY_COST)} tableLabel="Chi phí lương" /></Card>
      <Card className="chart-card"><TrendChart title="Tỷ lệ chuyên cần" description="Theo tháng" points={CHART_POINTS(ATTENDANCE_TREND)} unit="%" tableLabel="Tỷ lệ chuyên cần" /></Card>
    </section>
    <section className="dashboard-lower"><AlertList onNavigate={onNavigate} /><Card title="Báo cáo điều hành" description="Dữ liệu chỉ hiển thị trong phạm vi quyền truy cập"><div className="report-list">{executiveReports.map((report) => { const Icon = report.icon; return <button key={report.title} type="button" onClick={() => onNavigate(report.page)} aria-label={`Mở ${report.title}`}><Icon /><span><b>{report.title}</b><small>{report.detail}</small></span><ChevronRightIcon /></button>; })}</div></Card></section>
  </>;
}

function HrDashboard({ role, actorName, workflowItems, prototype, onNavigate, onSelectEmployee }: { role: Role; actorName: string; workflowItems: WorkflowItem[]; prototype: boolean; onNavigate: (page: Page) => void; onSelectEmployee: (code: string) => void }) {
  const canAccess = usePermissionCheck(role);
  const showPayroll = canAccess("hrm.payroll.read");
  const visible = visibleEmployees(useDataScope(role), ROLE_ACTOR[role]);
  const visibleCodes = new Set(visible.map((employee) => employee.code));
  const attendanceRows = attendanceToday.filter((row) => visibleCodes.has(row.employeeCode));
  const attendanceExceptions = attendanceRows.filter((row) => row.lateMin > 0 || row.earlyMin > 0 || row.missing).length;
  const missingDocumentCount = documents.filter((row) => visibleCodes.has(row.employeeCode) && row.required && !row.fileName).length;
  const pendingWorkflowCount = workflowItems.filter((item) => (visibleCodes.has(item.employeeCode) || item.employeeCode === ROLE_ACTOR[role]) && item.status === "Pending").length;
  const totalEmployees = visible.length;
  const spotlight = visible[0] ?? employeeByCode("QTS-00001");
  const openSpotlight = () => { if (spotlight) onSelectEmployee(spotlight.code); };
  const openQueue: Array<{ count: string; tone: BadgeTone; title: string; detail: string; page: Page }> = [];
  if (missingDocumentCount) openQueue.push({ count: String(missingDocumentCount), tone: "danger", title: "Hoàn thiện hồ sơ pháp lý", detail: "Văn bản bắt buộc chưa có tệp trong phạm vi", page: "documents" });
  if (pendingWorkflowCount) openQueue.push({ count: String(pendingWorkflowCount), tone: "warning", title: "Chờ nhân sự rà soát", detail: "Đơn nghỉ phép, claim công và điều chỉnh giờ làm", page: "workflow" });
  if (attendanceExceptions) openQueue.push({ count: String(attendanceExceptions), tone: "warning", title: "Đối soát chấm công", detail: "Đi muộn, về sớm hoặc thiếu công trong ngày", page: "attendance" });
  if (showPayroll && payslipLines.length) openQueue.push({ count: String(payslipLines.length), tone: "info", title: "Rà soát bảng lương", detail: "Có dữ liệu phiếu lương cần xử lý", page: "payroll" });
  const sourceLabel = dataSourceLabel(prototype);
  const workbenchRows = [
    { area: "Phạm vi dữ liệu", state: `${visible.length} hồ sơ`, owner: ROLE_LABEL[role] },
    { area: "Chuyên cần", state: attendanceRows.length ? `${attendanceRows.length - attendanceExceptions}/${attendanceRows.length}` : "—", owner: attendanceRows.length ? "Đối soát hôm nay" : "Chưa có nguồn chính thức" },
    { area: "Việc cần xử lý", state: String(openQueue.length), owner: openQueue.length ? "Theo dữ liệu trong phạm vi" : "Không có tác vụ mở" },
    { area: "Bảng lương", state: showPayroll ? "Có quyền xem" : "Không hiển thị", owner: "Field-Level Security" },
  ];
  return <>
    <section className="command-header" aria-labelledby="command-title"><div><h1 id="command-title">Chào buổi sáng, {actorName}</h1><p>Đây là những nghiệp vụ nhân sự cần được chú ý hôm nay.</p></div><time className="command-date">{new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date())}</time></section>
    <section className="hrm-workbench" aria-label="Bề mặt điều phối HRM">
      <div className="hrm-workbench-copy">
        <span>Bàn điều phối HRM</span>
        <h2>Quyền, phạm vi dữ liệu và hàng đợi cùng một bề mặt.</h2>
        <p>Màn hình ưu tiên việc cần xử lý, nguồn dữ liệu và ranh giới bảo mật trước khi mở chi tiết nghiệp vụ.</p>
      </div>
      <div className="hrm-workbench-table">
        <table>
          <thead><tr><th>Miền dữ liệu</th><th>Trạng thái</th><th>Kiểm soát</th></tr></thead>
          <tbody>{workbenchRows.map(row => <tr key={row.area}><td data-label="Miền dữ liệu">{row.area}</td><td data-label="Trạng thái"><b>{row.state}</b></td><td data-label="Kiểm soát">{row.owner}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
    <section className="command-metrics" aria-label="Tổng quan vận hành" style={{ "--command-metric-secondary-count": showPayroll ? 3 : 2 } as React.CSSProperties}><button type="button" className="command-kpi command-kpi-primary" onClick={() => onNavigate("employees")}><span>Tổng nhân sự</span><b>{totalEmployees}</b><small>{sourceLabel}</small></button><button type="button" className="command-kpi" onClick={() => onNavigate("attendance")}><span>Chuyên cần hôm nay</span><b>{attendanceRows.length ? `${attendanceRows.length - attendanceExceptions}/${attendanceRows.length}` : "—"}</b><small>{attendanceRows.length ? `${attendanceExceptions} trường hợp cần đối soát` : "Chưa có dữ liệu chấm công chính thức"}</small></button><button type="button" className="command-kpi" onClick={() => onNavigate("recruitment")}><span>Vị trí đang mở</span><b>—</b><small>Chưa kết nối dữ liệu tuyển dụng</small></button>{showPayroll && <button type="button" className="command-kpi" onClick={() => onNavigate("payroll")}><span>Bảng lương</span><b>—</b><small>Chưa có kỳ lương chính thức</small></button>}</section>
    <section className="command-grid"><Card className="command-trend"><TrendChart title="Biến động nhân sự" description="Tổng nhân sự trong 12 tháng" points={CHART_POINTS(HEADCOUNT)} tableLabel="Tổng nhân sự" /></Card><Card className="command-agenda" title="Lịch và nhắc việc" description="Theo dữ liệu nghiệp vụ được kết nối"><EmptyState title="Chưa có lịch nghiệp vụ" detail="Lịch tuyển dụng, chấm công và phê duyệt sẽ hiển thị khi có nguồn dữ liệu chính thức." /></Card></section>
    <section className="command-lower">{spotlight && <article className="employee-spotlight"><Avatar employee={spotlight} size="lg" /><div><Badge tone="info">Hồ sơ trong phạm vi</Badge><h2>{spotlight.legalName}</h2><p>{spotlight.position} · {spotlight.department}</p><small>Nguồn: {sourceLabel.toLowerCase()}</small></div><Button variant="secondary" onClick={openSpotlight}>Mở hồ sơ <ChevronRightIcon /></Button></article>}<Card className="command-queue" title="Việc cần xử lý hôm nay" description="Tác vụ đang chờ theo phê duyệt và nghiệp vụ">{openQueue.length ? <div className="task-list">{openQueue.map((item) => <button key={item.title} type="button" onClick={() => onNavigate(item.page)}><Badge tone={item.tone}>{item.count}</Badge><span><b>{item.title}</b><small>{item.detail}</small></span><ChevronRightIcon /></button>)}</div> : <EmptyState title="Không có việc cần xử lý" detail="Hệ thống chưa ghi nhận tác vụ nghiệp vụ chính thức trong phạm vi của bạn." />}</Card></section>
    <Card title="Tình trạng vận hành" description="Dữ liệu HRM và quyền truy cập QTS Identity được kiểm tra trước khi hiển thị."><div className="status-summary"><div><StatusDot tone="success" /><span><b>Hồ sơ nhân sự</b><small>{sourceLabel}</small></span><Badge tone="success">Đã kết nối</Badge></div></div></Card>
  </>;
}

function OrganizationScreen({ role }: { role: Role }) {
  const canAccess = usePermissionCheck(role);
  if (!canAccess("organization.department.read")) return <section className="access-denied"><LockClosedIcon /><h1>Không có quyền xem cơ cấu tổ chức</h1><p>Cơ cấu tổ chức chỉ hiển thị sau khi hệ thống kiểm tra quyền và phạm vi dữ liệu.</p></section>;
  const childrenOf = (parentId: string | null) => organizationUnits.filter((unit) => unit.parentId === parentId);
  const renderUnit = (unit: typeof organizationUnits[number]) => <li key={unit.id}><div className="org-node"><span><BuildingOffice2Icon /></span><div><b>{unit.name}</b><small>{unit.kind} · {unit.code} · Phụ trách: {unit.manager}</small></div></div>{childrenOf(unit.id).length ? <ul>{childrenOf(unit.id).map(renderUnit)}</ul> : null}</li>;
  return <>
    <PageHeader title="Cơ cấu tổ chức" description="Pháp nhân, chi nhánh, phòng ban và vị trí được quản lý độc lập với tuyến phê duyệt." breadcrumb={["Nhân sự", "Cơ cấu tổ chức"]} />
    <section className="stat-grid stat-grid-four"><StatTile label="Pháp nhân" value={String(organizationUnits.filter((unit) => unit.kind === "Pháp nhân").length)} detail="Theo database HRM" tone="blue" /><StatTile label="Chi nhánh" value={String(organizationUnits.filter((unit) => unit.kind === "Chi nhánh").length)} detail="Theo database HRM" tone="blue" /><StatTile label="Phòng ban" value={String(organizationUnits.filter((unit) => unit.kind === "Phòng ban").length)} detail="Theo cơ cấu hiện hành" tone="success" /><StatTile label="Vị trí" value={String(organizationPositions.length)} detail="Theo database HRM" tone="info" /></section>
    <section className="module-grid organization-layout"><Card title="Cây tổ chức" description="Quan hệ phòng ban chỉ mô tả thiết kế tổ chức; luồng phê duyệt dùng quan hệ quản lý trực tiếp của nhân viên."><ul className="org-tree">{childrenOf(null).map(renderUnit)}</ul></Card><Card title="Danh mục vị trí" description="Vị trí và tuyến báo cáo dự kiến, không tự suy ra người phê duyệt."><div className="table-scroll"><table className="data-table"><thead><tr><th>Mã</th><th>Chức danh</th><th>Phòng ban</th><th>Báo cáo tới</th><th>Định biên</th></tr></thead><tbody>{organizationPositions.map((position) => <tr key={position.code}><td>{position.code}</td><td><b>{position.title}</b></td><td>{position.department}</td><td>{position.reportsTo}</td><td>{position.headcount}</td></tr>)}</tbody></table></div></Card></section>
    <SecurityNote>Thay đổi phòng ban hoặc vị trí không ghi đè lịch sử công tác. Hệ thống phải chặn vòng lặp parent_department_id và reports_to_position_id.</SecurityNote>
  </>;
}

function ContractsScreen({ role, actorCode, onAudit }: { role: Role; actorCode: string; onAudit: (message: string) => void }) {
  const canAccess = usePermissionCheck(role);
  const dataScope = useDataScope(role);
  const [status, setStatus] = useState("all");
  if (!canAccess("hrm.contract.read")) return <section className="access-denied"><LockClosedIcon /><h1>Không có quyền xem hợp đồng</h1><p>Hợp đồng được lọc theo quyền, Phạm vi dữ liệu và Field-Level Security.</p></section>;
  const rows = visibleEmployees(dataScope, actorCode).filter((employee) => employee.contractNo).filter((employee) => status === "all" || (status === "expiring" ? Boolean(employee.contractEnd) : employee.status === status));
  const expiringCount = rows.filter((employee) => employee.contractEnd).length;
  return <>
    <PageHeader title="Hợp đồng" description="Theo dõi hợp đồng lao động, phụ lục, gia hạn và đề xuất chấm dứt theo vòng đời có kiểm soát." breadcrumb={["Nhân sự", "Hợp đồng"]} />
    <section className="document-alerts"><div><ClockIcon /><span><b>Hợp đồng có ngày hết hạn</b><small>Theo dữ liệu hợp đồng chính thức đã đồng bộ.</small></span><Badge tone="warning">{expiringCount}</Badge></div><div><DocumentCheckIcon /><span><b>Hợp đồng đang quản lý</b><small>Chỉ hiển thị hợp đồng đã có trong database HRM.</small></span><Badge tone="success">{rows.length}</Badge></div></section>
    <section className="filter-bar"><label><span>Trạng thái</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Tất cả hợp đồng</option><option value="expiring">Có ngày hết hạn</option><option value="Thử việc">Thử việc</option><option value="Đang làm việc">Đang làm việc</option></select></label><span className="result-count">{rows.length} hợp đồng trong phạm vi</span></section>
    <Card className="table-card"><div className="table-scroll"><table className="data-table"><thead><tr><th>Số hợp đồng</th><th>Nhân sự</th><th>Loại hợp đồng</th><th>Hiệu lực</th><th>Ngày hết hạn</th><th>Trạng thái</th><th><span className="sr-only">Thao tác</span></th></tr></thead><tbody>{rows.map((employee) => <tr key={employee.code}><td><b>{employee.contractNo}</b></td><td><span className="cell-person"><Avatar employee={employee} size="sm" /><span><b>{employee.legalName}</b><small>{employee.code}</small></span></span></td><td>{employee.contractType}</td><td>{employee.contractStart}</td><td>{employee.contractEnd || "Không xác định thời hạn"}</td><td><StatusBadge status={employee.status === "Nghỉ việc" ? "Expired" : "Active"} /></td><td><div className="row-actions"><IconButton label={`Xem thông tin hợp đồng ${employee.contractNo} trong dữ liệu chính thức`} onClick={() => onAudit(`xem thông tin hợp đồng ${employee.contractNo}.`)}><EyeIcon /></IconButton><IconButton label={`Tạo đề xuất gia hạn ${employee.contractNo} trong dữ liệu chính thức`} onClick={() => onAudit(`yêu cầu tạo đề xuất gia hạn ${employee.contractNo}. Luồng duyệt sẽ do cấu hình phê duyệt quyết định.`)}><DocumentCheckIcon /></IconButton></div></td></tr>)}</tbody></table></div>{!rows.length && <EmptyState title="Không có hợp đồng phù hợp" detail="Thử thay đổi bộ lọc hoặc phạm vi dữ liệu." />}</Card>
    <SecurityNote>Điều khoản đã ký không bị ghi đè. Đề xuất gia hạn và chấm dứt chỉ được ghi nhận sau khi hệ thống xác nhận quyền; tuyến phê duyệt của các nghiệp vụ này chưa được đặc tả.</SecurityNote>
  </>;
}

function LeaveScreen({ role, actorCode, workflowItems, onAudit }: { role: Role; actorCode: string; workflowItems: WorkflowItem[]; onAudit: (message: string) => void }) {
  const canAccess = usePermissionCheck(role);
  const dataScope = useDataScope(role);
  const own = role === "employee";
  const canRead = own ? canAccess("hrm.leave.read_own") : canAccess("hrm.leave.read");
  const [leaveType, setLeaveType] = useState("annual");
  const [startDate, setStartDate] = useState("2026-09-15");
  const [endDate, setEndDate] = useState("2026-09-16");
  const [reason, setReason] = useState("");
  if (!canRead) return <section className="access-denied"><LockClosedIcon /><h1>Không có quyền xem nghỉ phép</h1><p>Số dư và đơn nghỉ phép chỉ hiển thị trong phạm vi được cấp.</p></section>;
  const visibleCodes = new Set(visibleEmployees(dataScope, actorCode).map((employee) => employee.code));
  const requests = workflowItems.filter((item) => item.type === "Nghỉ phép" && (own ? item.employeeCode === actorCode : visibleCodes.has(item.employeeCode)));
  const balances = leaveBalances.filter((balance) => balance.employeeCode === actorCode);
  const submit = () => { if (reason.trim()) onAudit(`yêu cầu gửi đơn ${leaveTypes.find((type) => type.id === leaveType)?.name.toLowerCase()} từ ${startDate} đến ${endDate}.`); };
  return <>
    <PageHeader title="Nghỉ phép" description="Đơn nghỉ được kiểm tra trùng ngày, số dư và áp dụng vào sổ cái phép sau khi hoàn tất phê duyệt." breadcrumb={["Vận hành", "Nghỉ phép"]} />
    <section className="leave-balance-grid">{leaveTypes.map((type) => { const balance = balances.find((item) => item.leaveTypeId === type.id); const available = balance ? balance.entitled - balance.used - balance.pending : 0; return <article className="leave-balance" key={type.id}><span><b>{type.name}</b><small>{type.description}</small></span><strong>{balance ? `${available} ngày` : "Theo chính sách"}</strong>{balance && <small>Được cấp {balance.entitled} · Đã dùng {balance.used} · Chờ duyệt {balance.pending}</small>}</article>; })}</section>
    <section className="late-early-layout"><Card title="Tạo đơn nghỉ phép" description={`Người gửi: ${employeeByCode(actorCode)?.legalName ?? actorCode}`}><div className="form-grid"><label><span>Loại nghỉ</span><select value={leaveType} onChange={(event) => setLeaveType(event.target.value)}>{leaveTypes.map((type) => <option value={type.id} key={type.id}>{type.name}</option>)}</select></label><label><span>Từ ngày</span><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label><label><span>Đến ngày</span><input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label><label className="form-wide"><span>Lý do</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Nêu rõ lý do nghỉ phép" rows={4} /></label></div><SecurityNote>Đơn chỉ trừ số dư khi được phê duyệt và áp dụng. Đơn bị từ chối không làm giảm phép.</SecurityNote><div className="form-actions"><Button variant="primary" disabled={!reason.trim()} onClick={submit}><DocumentCheckIcon /> Gửi đơn nghỉ phép</Button></div></Card><Card title="Đơn trong phạm vi" description="Luồng phê duyệt dùng quan hệ quản lý trực tiếp.">{requests.length ? <div className="workflow-list">{requests.map((item) => <article key={item.id} className="leave-request-row"><span><Badge tone="info">Nghỉ phép</Badge><b>{item.employeeName}</b><small>{item.payload}</small></span><span><StatusBadge status={item.status} /><small>Bước: {item.current}</small></span></article>)}</div> : <EmptyState title="Chưa có đơn nghỉ phép" detail="Không có đơn thuộc phạm vi dữ liệu hiện tại." />}</Card></section>
  </>;
}

function RecruitmentScreen({ onAudit }: { onAudit: (message: string) => void }) {
  const jobs: Array<{ title: string; department: string; count: string; stage: string }> = [];
  return <>
    <PageHeader title="Tuyển dụng" description="Theo dõi yêu cầu tuyển dụng từ vị trí mở đến offer; ứng viên chưa là nhân sự cho đến khi offer được chấp nhận." breadcrumb={["Vận hành", "Tuyển dụng"]} actions={<Button variant="primary" onClick={() => onAudit("yêu cầu tạo yêu cầu tuyển dụng mới.")}><PlusIcon /> Tạo yêu cầu tuyển dụng</Button>} />
    <section className="stat-grid stat-grid-four"><StatTile label="Vị trí mở" value="0" detail="Chưa có dữ liệu tuyển dụng" tone="blue" /><StatTile label="Ứng viên" value="0" detail="Chưa kết nối ATS" tone="info" /><StatTile label="Phỏng vấn tuần này" value="0" detail="Chưa có lịch hẹn" tone="warning" /><StatTile label="Đề nghị nhận việc" value="0" detail="Chưa có dữ liệu offer" tone="success" /></section>
    <Card title="Vị trí đang tuyển" description="Yêu cầu tuyển dụng → Đăng tuyển → Nhận CV → Sàng lọc → Phỏng vấn → Đánh giá → Đề nghị nhận việc → Nhận việc.">{jobs.length ? <div className="module-list">{jobs.map((job) => <article key={job.title}><span><b>{job.title}</b><small>{job.department} · {job.count}</small></span><Badge tone={job.stage === "Phỏng vấn" ? "warning" : "blue"}>{job.stage}</Badge><IconButton label={`Mở vị trí ${job.title} trong dữ liệu chính thức`} onClick={() => onAudit(`xem yêu cầu tuyển dụng ${job.title}.`)}><ChevronRightIcon /></IconButton></article>)}</div> : <EmptyState title="Chưa có vị trí tuyển dụng" detail="Dữ liệu tuyển dụng chính thức chưa được đồng bộ." />}</Card>
    <SecurityNote>Khi offer được chấp nhận, dịch vụ hệ thống sẽ chuyển dữ liệu cần thiết sang hồ sơ nhân viên và văn bản nhân sự. Không tạo employee status “ứng viên”.</SecurityNote>
  </>;
}

function OnboardingScreen({ role, onAudit }: { role: Role; onAudit: (message: string) => void }) {
  const canAccess = usePermissionCheck(role);
  if (!canAccess("hrm.onboarding.read")) return <section className="access-denied"><LockClosedIcon /><h1>Không có quyền xem tiếp nhận nhân sự</h1></section>;
  const rows: Array<{ name: string; start: string; status: string; progress: string }> = [];
  return <>
    <PageHeader title="Tiếp nhận nhân sự" description="Phối hợp Nhân sự, Công nghệ thông tin, Hành chính, quản lý trực tiếp và người hướng dẫn từ khi đề nghị nhận việc được chấp nhận đến khi hoàn tất nhận việc." breadcrumb={["Vận hành", "Tiếp nhận nhân sự"]} />
    <section className="module-grid"><Card title="Hồ sơ tiếp nhận" description="Theo dõi theo người nhận việc, không tự suy diễn danh sách bắt buộc.">{rows.length ? <div className="module-list">{rows.map((row) => <article key={row.name}><span><b>{row.name}</b><small>Ngày nhận việc {row.start} · {row.progress}</small></span><StatusBadge status={row.status} /><IconButton label={`Xem hồ sơ tiếp nhận của ${row.name} trong dữ liệu chính thức`} onClick={() => onAudit(`xem hồ sơ tiếp nhận ${row.name}.`)}><ChevronRightIcon /></IconButton></article>)}</div> : <EmptyState title="Chưa có hồ sơ tiếp nhận" detail="Dữ liệu onboarding chính thức chưa được đồng bộ." />}</Card><Card title="Luồng phối hợp" description="Các đầu việc hiển thị theo đúng thứ tự nghiệp vụ."><ol className="process-list"><li>Đề nghị nhận việc được chấp nhận</li><li>Nhân sự hoàn thiện hồ sơ</li><li>Công nghệ thông tin cấp tài khoản và quyền</li><li>Hành chính cấp tài sản</li><li>Quản lý trực tiếp và người hướng dẫn tiếp nhận</li><li>Hoàn tất tiếp nhận nhân sự</li></ol></Card></section>
    <SecurityNote>Việc kiểm tra mã số thuế, BHXH, ngân hàng, địa chỉ và hồ sơ bắt buộc phải do chính sách dịch vụ hệ thống xác định; giao diện không tự xác nhận hoàn tất.</SecurityNote>
  </>;
}

function KpiScreen({ role, onAudit }: { role: Role; onAudit: (message: string) => void }) {
  const canAccess = usePermissionCheck(role);
  if (!canAccess("hrm.kpi.read")) return <section className="access-denied"><LockClosedIcon /><h1>Không có quyền KPI</h1></section>;
  const rows: Array<{ level: string; name: string; status: string; owner: string }> = [];
  return <>
    <PageHeader title="KPI & đánh giá hiệu suất" description="Liên kết mục tiêu công ty, KPI phòng ban và KPI nhân viên; dữ liệu đánh giá là dữ liệu quản lý có kiểm soát quyền." breadcrumb={["Vận hành", "KPI"]} />
    <section className="stat-grid stat-grid-four"><StatTile label="Chu kỳ hiện tại" value="—" detail="Chưa có dữ liệu KPI" tone="blue" /><StatTile label="KPI phòng ban" value="0" detail="Chưa có mục tiêu" tone="info" /><StatTile label="Đánh giá 1-1" value="0" detail="Chưa có lịch" tone="warning" /><StatTile label="Đánh giá hoàn tất" value="0" detail="Trong kỳ hiện tại" tone="success" /></section>
    <Card title="Cấu trúc mục tiêu" description="Mục tiêu công ty → KPI phòng ban → KPI cá nhân → Đánh giá hiệu suất.">{rows.length ? <div className="module-list">{rows.map((row) => <article key={row.level}><span><Badge tone="blue">{row.level}</Badge><b>{row.name}</b><small>Phụ trách: {row.owner}</small></span><StatusBadge status={row.status} /><IconButton label={`Xem ${row.name} trong dữ liệu chính thức`} onClick={() => onAudit(`xem mục tiêu ${row.name}.`)}><ChevronRightIcon /></IconButton></article>)}</div> : <EmptyState title="Chưa có dữ liệu KPI" detail="Mục tiêu và đánh giá sẽ hiển thị khi dịch vụ KPI được kết nối." />}</Card>
  </>;
}

function TrainingScreen({ role, onAudit }: { role: Role; onAudit: (message: string) => void }) {
  const canAccess = usePermissionCheck(role);
  if (!canAccess("hrm.training.read")) return <section className="access-denied"><LockClosedIcon /><h1>Không có quyền Đào tạo</h1></section>;
  const courses: Array<{ name: string; date: string; attendance: string; status: string }> = [];
  return <>
    <PageHeader title="Đào tạo" description="Kế hoạch, khóa học, đăng ký và kết quả đào tạo được liên kết về hồ sơ năng lực khi chính sách cho phép." breadcrumb={["Vận hành", "Đào tạo"]} />
    <section className="module-grid"><Card title="Kế hoạch & khóa học" description="Theo dõi lịch đào tạo và đăng ký hiện có.">{courses.length ? <div className="module-list">{courses.map((course) => <article key={course.name}><span><b>{course.name}</b><small>{course.date} · {course.attendance}</small></span><StatusBadge status={course.status} /><IconButton label={`Xem khóa ${course.name} trong dữ liệu chính thức`} onClick={() => onAudit(`xem khóa đào tạo ${course.name}.`)}><ChevronRightIcon /></IconButton></article>)}</div> : <EmptyState title="Chưa có khóa đào tạo" detail="Dữ liệu đào tạo chính thức chưa được đồng bộ." />}</Card><Card title="Theo dõi chứng chỉ" description="Chứng chỉ và kết quả đào tạo được cập nhật vào hồ sơ năng lực sau khi có dữ liệu được xác minh."><EmptyState title="Chưa có dữ liệu chứng chỉ" detail="Dữ liệu nguồn và chính sách xác minh chưa được kết nối." /></Card></section>
  </>;
}

function AssetsScreen({ role, onAudit }: { role: Role; onAudit: (message: string) => void }) {
  const canAccess = usePermissionCheck(role);
  if (!canAccess("hrm.asset.read")) return <section className="access-denied"><LockClosedIcon /><h1>Không có quyền Tài sản</h1></section>;
  const rows: Array<{ asset: string; code: string; holder: string; status: string }> = [];
  return <>
    <PageHeader title="Tài sản nhân viên" description="Tài sản được gắn với mã nhân viên để hỗ trợ cấp phát, bàn giao và thu hồi khi kết thúc làm việc." breadcrumb={["Vận hành", "Tài sản"]} />
    <Card title="Tài sản đang cấp phát" description="Dữ liệu chính thức theo người nhận bàn giao.">{rows.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>Tài sản</th><th>Mã tài sản</th><th>Người sử dụng</th><th>Tình trạng</th><th><span className="sr-only">Thao tác</span></th></tr></thead><tbody>{rows.map((row) => <tr key={row.code}><td><b>{row.asset}</b></td><td>{row.code}</td><td>{row.holder}</td><td><Badge tone="success">{row.status}</Badge></td><td><IconButton label={`Xem lịch sử ${row.code} trong dữ liệu chính thức`} onClick={() => onAudit(`xem tài sản ${row.code}.`)}><ChevronRightIcon /></IconButton></td></tr>)}</tbody></table></div> : <EmptyState title="Chưa có dữ liệu tài sản" detail="Danh sách tài sản sẽ hiển thị khi dịch vụ tài sản được kết nối." />}</Card>
    <SecurityNote>Khi nhân viên nghỉ việc, dịch vụ hệ thống phải sinh checklist thu hồi từ dữ liệu tài sản thực tế; giao diện không tự thay đổi trạng thái tài sản.</SecurityNote>
  </>;
}

function ReportsScreen({ role, onNavigate, onAudit }: { role: Role; onNavigate: (page: Page) => void; onAudit: (message: string) => void }) {
  const canAccess = usePermissionCheck(role);
  if (!canAccess("hrm.report.read")) return <section className="access-denied"><LockClosedIcon /><h1>Không có quyền Báo cáo</h1></section>;
  const reports: Array<{ title: string; detail: string; page: Page; icon: Icon }> = [{ title: "Tổng quan nhân sự", detail: "Tổng số, biến động và cơ cấu lao động", page: "ceo-dashboard", icon: UserGroupIcon }, { title: "Chấm công", detail: "Đi muộn, về sớm, nghỉ phép và thiếu công", page: "attendance", icon: CalendarDaysIcon }, { title: "Hợp đồng & tuân thủ", detail: "Hợp đồng, hồ sơ pháp lý và cảnh báo hết hạn", page: "contracts", icon: ClipboardDocumentCheckIcon }, { title: "Chi phí nhân sự", detail: "Chỉ hiển thị trong phạm vi bảng lương được cấp", page: "payroll", icon: BanknotesIcon }];
  return <>
    <PageHeader title="Báo cáo" description="Điểm truy cập các báo cáo vận hành. Dữ liệu xuất thực tế vẫn phải áp dụng phân quyền theo vai trò, phạm vi dữ liệu và bảo mật trường ở hệ thống nghiệp vụ." breadcrumb={["Vận hành", "Báo cáo"]} />
    <section className="report-catalog">{reports.map((report) => { const Icon = report.icon; return <article key={report.title}><span className="operation-icon operation-blue"><Icon /></span><div><h2>{report.title}</h2><p>{report.detail}</p></div><div><Button variant="secondary" size="sm" aria-label={`Mở báo cáo ${report.title}`} onClick={() => onNavigate(report.page)}>Mở báo cáo</Button><IconButton label={`Yêu cầu xuất ${report.title} trong dữ liệu chính thức`} onClick={() => onAudit(`yêu cầu xuất ${report.title}; hệ thống sẽ kiểm tra quyền trước khi tạo dữ liệu.`)}><ArrowDownTrayIcon /></IconButton></div></article>; })}</section>
    <SecurityNote>Báo cáo pháp lý và xuất dữ liệu không được suy diễn trường nhạy cảm từ giao diện. Hệ thống phải áp dụng cùng bộ lọc quyền như màn hình nguồn.</SecurityNote>
  </>;
}

function EmployeeList({ role, actorCode, onSelect, onAudit }: { role: Role; actorCode: string; onSelect: (code: string) => void; onAudit: (message: string) => void }) {
  const dataScope = useDataScope(role);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const visible = visibleEmployees(dataScope, actorCode);
  const results = visible.filter((employee) => {
    const matchSearch = [employee.code, employee.legalName, employee.workEmail].some((value) => value.toLocaleLowerCase("vi-VN").includes(search.toLocaleLowerCase("vi-VN")));
    const matchDepartment = department === "all" || employee.department === department;
    const matchStatus = status === "all" || employee.status === status;
    return matchSearch && matchDepartment && matchStatus;
  });
  const departments = [...new Set(visible.map((row) => row.department))];
  const scopeDescription = dataScope === "company" ? "Toàn công ty" : dataScope === "department" ? "Phòng ban được giao" : dataScope === "manager" ? "Nhân sự thuộc quyền" : "Hồ sơ của tôi";
  const activateEmployeeRow = (event: React.KeyboardEvent<HTMLTableRowElement>, code: string) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSelect(code);
  };
  return <>
    <PageHeader title="Hồ sơ nhân viên" description={`Danh sách nhân sự theo phạm vi dữ liệu do dịch vụ hệ thống cấp: ${scopeDescription}.`} breadcrumb={["Nhân sự", "Hồ sơ nhân viên"]} actions={<><div className="people-view-toggle" role="group" aria-label="Cách hiển thị hồ sơ"><button type="button" className={view === "grid" ? "active" : undefined} onClick={() => setView("grid")} aria-label="Hiển thị dạng thẻ" aria-pressed={view === "grid"}><ViewColumnsIcon /></button><button type="button" className={view === "list" ? "active" : undefined} onClick={() => setView("list")} aria-label="Hiển thị dạng danh sách" aria-pressed={view === "list"}><ListBulletIcon /></button></div><PermissionGate role={role} permission="hrm.employee.export"><Button variant="secondary" onClick={() => onAudit("yêu cầu xuất danh sách nhân sự theo phạm vi quyền.")}><ArrowDownTrayIcon /> Xuất dữ liệu</Button></PermissionGate></>} />
    <section className="filter-bar"><label className="search-field"><MagnifyingGlassIcon aria-hidden="true" /><span className="sr-only">Tìm nhân viên</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm mã, tên hoặc email nhân viên" /></label><label><span>Phòng ban</span><select value={department} onChange={(event) => setDepartment(event.target.value)}><option value="all">Tất cả phòng ban</option>{departments.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label><span>Trạng thái</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Tất cả trạng thái</option>{[...new Set(visible.map((row) => row.status))].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><span className="result-count" role="status" aria-live="polite">{results.length} hồ sơ</span></section>
    {results.length === 0 ? <Card className="table-card"><EmptyState title="Không có nhân sự trong phạm vi dữ liệu" detail="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm." /></Card> : view === "grid" ? <section className="employee-grid" aria-label="Hồ sơ nhân viên dạng thẻ">{results.map((employee) => <button key={employee.code} type="button" className="employee-card" onClick={() => onSelect(employee.code)}><span className="employee-card-head"><Avatar employee={employee} size="md" /><span><b>{employee.legalName}</b><small>{employee.position}</small></span></span><span className="employee-card-foot"><span>{employee.department}<small>{employee.code}</small></span><StatusBadge status={employee.status} /></span></button>)}</section> : <Card className="table-card"><div className="table-scroll"><table className="data-table employee-table"><thead><tr><th>Nhân viên</th><th>Mã nhân viên</th><th>Phòng ban</th><th>Chức danh</th><th>Quản lý trực tiếp</th><th>Trạng thái</th><th><span className="sr-only">Mở</span></th></tr></thead><tbody>{results.map((employee) => <tr key={employee.code} tabIndex={0} role="button" aria-label={`Mở hồ sơ ${employee.legalName}`} onClick={() => onSelect(employee.code)} onKeyDown={(event) => activateEmployeeRow(event, employee.code)}><td><div className="employee-name"><Avatar employee={employee} size="md" /><span><b>{employee.legalName}</b><small>{employee.workEmail}</small></span></div></td><td>{employee.code}</td><td>{employee.department}</td><td>{employee.position}</td><td>{employee.managerName}</td><td><StatusBadge status={employee.status} /></td><td><ChevronRightIcon className="row-arrow" /></td></tr>)}</tbody></table></div></Card>}
  </>;
}

function DataField({ label, value }: { label: string; value: string }) {
  return <div className="data-field"><span>{label}</span><b>{value || "—"}</b></div>;
}

function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="profile-section"><h2>{title}</h2><div className="data-grid">{children}</div></section>;
}

function DocumentTable({
  rows,
  role,
  onAudit,
  compact = false,
}: {
  rows: DocumentRow[];
  role: Role;
  onAudit: (message: string) => void;
  compact?: boolean;
}) {
  return <div className="table-scroll"><table className={`data-table document-table ${compact ? "compact" : ""}`}><thead><tr><th>Loại văn bản</th>{!compact && <th>Nhân sự</th>}<th>Tệp</th><th>Phiên bản</th><th>Hết hạn</th><th>Xác minh</th><th>Bảo mật</th><th><span className="sr-only">Thao tác</span></th></tr></thead><tbody>{rows.map((document) => {
    const employee = employeeByCode(document.employeeCode);
    return <tr key={document.id}><td><b>{document.type}</b>{document.required && <small className="required-mark">Bắt buộc</small>}</td>{!compact && <td>{employee?.legalName ?? document.employeeCode}<small>{document.employeeCode}</small></td>}<td>{document.fileName ? <span className="file-cell"><DocumentTextIcon />{document.fileName}<small>{document.mime}</small></span> : <span className="missing-file">Chưa có tệp</span>}</td><td>{document.version}</td><td>{document.expiry || "Không thời hạn"}</td><td><StatusBadge status={document.verify} /></td><td>{document.encrypted ? <Badge tone="info" icon={<LockClosedIcon />}>Đã mã hóa</Badge> : <Badge tone="warning">Chờ mã hóa</Badge>}</td><td><div className="row-actions"><PermissionGate role={role} permission="hrm.document.view" fallback={<IconButton label="Không có quyền xem" disabled><LockClosedIcon /></IconButton>}><IconButton label="Xem văn bản trong dữ liệu chính thức" onClick={() => onAudit(`xem văn bản ${document.fileName || document.type}.`)}><EyeIcon /></IconButton></PermissionGate><PermissionGate role={role} permission="hrm.document.download" fallback={<IconButton label="Không có quyền tải" disabled><LockClosedIcon /></IconButton>}><IconButton label="Tải văn bản trong dữ liệu chính thức" onClick={() => onAudit(`yêu cầu tải ${document.fileName || document.type}.`)}><DocumentArrowDownIcon /></IconButton></PermissionGate></div></td></tr>;
  })}</tbody></table></div>;
}

function EmployeeProfile({
  employee,
  role,
  actorCode,
  onBack,
  onDocuments,
  onAttendance,
  onPayroll,
  onAudit,
}: {
  employee: Employee;
  role: Role;
  actorCode: string;
  onBack: () => void;
  onDocuments: () => void;
  onAttendance: () => void;
  onPayroll: () => void;
  onAudit: (message: string) => void;
}) {
  const dataScope = useDataScope(role);
  const [tab, setTab] = useState<ProfileTab>("personal");
  const employeeDocuments = documents.filter((row) => row.employeeCode === employee.code);
  const canAccess = role !== "accountant" && isEmployeeVisible(dataScope, actorCode, employee);
  const ownsProfile = employee.code === actorCode;
  if (!canAccess) return <section className="access-denied"><LockClosedIcon /><h1>Không có quyền truy cập hồ sơ</h1><p>{role === "accountant" ? "Vai trò kế toán chỉ truy cập dữ liệu nhân sự qua bảng lương theo phạm vi được cấp." : "Hồ sơ này nằm ngoài phạm vi dữ liệu của tài khoản hiện tại."}</p><Button onClick={onBack}>Quay lại danh sách</Button></section>;
  return <>
    <div className="profile-back"><Button variant="ghost" onClick={onBack}><ChevronLeftIcon /> Hồ sơ nhân viên</Button></div>
    <section className="employee-profile-header"><Avatar employee={employee} size="lg" /><div><div className="profile-title-line"><h1>{employee.legalName}</h1><StatusBadge status={employee.status} /></div><p>{employee.code} · {employee.position}</p><span>{employee.department} · {employee.workEmail}</span></div><div className="profile-header-actions"><PermissionGate role={role} permission="hrm.employee.edit"><Button variant="secondary" onClick={() => onAudit(`bắt đầu chỉnh sửa hồ sơ ${employee.code}.`)}><PencilSquareIcon /> Chỉnh sửa</Button></PermissionGate>{ownsProfile && <Button variant="secondary" onClick={() => onAudit("Yêu cầu thay đổi thông tin bảo mật đã được gửi HR phê duyệt.")}><DocumentCheckIcon /> Yêu cầu chỉnh sửa</Button>}</div></section>
    <nav className="profile-tabs" aria-label="Thông tin hồ sơ nhân viên">{TAB_LABELS.map(([value, label]) => <button key={value} type="button" className={tab === value ? "active" : ""} onClick={() => setTab(value)}>{label}</button>)}</nav>
    <section className="profile-content">
      {tab === "personal" && <div className="profile-card-stack"><Card><InfoSection title="Định danh và thông tin cá nhân"><DataField label="Họ và tên pháp lý" value={employee.legalName} /><DataMask label="Ngày sinh" value={employee.birthday} masked="Đã ẩn" permission="hrm.employee.field.personal" role={role} onReveal={() => onAudit(`xem ngày sinh của ${employee.code}.`)} /><DataField label="Giới tính" value={employee.gender} /><DataField label="Tình trạng hôn nhân" value={employee.marital} /><DataMask label="Số CCCD" value={employee.idNumber} masked={maskId(employee.idNumber)} permission="hrm.employee.field.cccd" role={role} onReveal={() => onAudit(`xem CCCD của ${employee.code}.`)} /><DataField label="Ngày cấp" value={employee.idIssueDate} /><DataField label="Nơi cấp" value={employee.idIssuePlace} /><DataField label="Quốc tịch" value={employee.nationality} /><DataMask label="Mã số thuế" value={employee.taxCode || "Chưa có"} masked="Đã ẩn" permission="hrm.employee.field.tax" role={role} onReveal={() => onAudit(`xem mã số thuế của ${employee.code}.`)} /><DataMask label="Số tài khoản" value={employee.bankAccount} masked="Đã ẩn" permission="hrm.employee.field.bank" role={role} onReveal={() => onAudit(`xem tài khoản ngân hàng của ${employee.code}.`)} /><DataMask label="Ngân hàng" value={employee.bankName} masked="Đã ẩn" permission="hrm.employee.field.bank" role={role} onReveal={() => onAudit(`xem ngân hàng của ${employee.code}.`)} /></InfoSection></Card><Card><InfoSection title="Liên hệ và địa chỉ"><DataField label="Email công việc" value={employee.workEmail} /><DataMask label="Email cá nhân" value={employee.privateEmail} masked="Đã ẩn" permission="hrm.employee.field.personal" role={role} onReveal={() => onAudit(`xem email cá nhân của ${employee.code}.`)} /><DataField label="Điện thoại công việc" value={employee.workPhone} /><DataMask label="Di động" value={employee.mobile} masked="Đã ẩn" permission="hrm.employee.field.personal" role={role} onReveal={() => onAudit(`xem số di động của ${employee.code}.`)} /><DataMask label="Địa chỉ thường trú" value={employee.permanentAddress} masked="Đã ẩn" permission="hrm.employee.field.personal" role={role} onReveal={() => onAudit(`xem địa chỉ thường trú của ${employee.code}.`)} /><DataMask label="Nơi ở hiện tại" value={employee.temporaryAddress} masked="Đã ẩn" permission="hrm.employee.field.personal" role={role} onReveal={() => onAudit(`xem nơi ở hiện tại của ${employee.code}.`)} /></InfoSection></Card><SensitiveRelations employeeCode={employee.code} role={role} onAudit={onAudit} /></div>}
      {tab === "employment" && <Card><InfoSection title="Thông tin công việc"><DataField label="Pháp nhân" value={employee.company} /><DataField label="Chi nhánh" value={employee.branch} /><DataField label="Phòng ban" value={employee.department} /><DataField label="Chức danh" value={employee.position} /><DataField label="Quản lý trực tiếp" value={employee.managerName} /><DataField label="Người hướng dẫn thử việc" value={employee.coachName} /><DataField label="Loại hình làm việc" value={employee.employmentType} /><DataField label="Trạng thái vòng đời" value={employee.status} /><DataField label="Ngày vào làm" value={employee.joiningDate} /><DataField label="Lịch làm việc" value={employee.schedule} /><DataField label="Mã chấm công" value={employee.barcode} /></InfoSection><SecurityNote>Mã PIN máy chấm công và nhận diện khuôn mặt không được hiển thị cho vai trò không có quyền vận hành chấm công.</SecurityNote></Card>}
      {tab === "contract" && <Card title="Hợp đồng hiện hành" description="Lương và phụ cấp lấy từ hợp đồng/quyết định có hiệu lực, không nhập lặp."><div className="contract-grid"><DataField label="Số hợp đồng" value={employee.contractNo} /><DataField label="Loại hợp đồng" value={employee.contractType} /><DataField label="Hiệu lực từ" value={employee.contractStart} /><DataField label="Ngày hết hạn" value={employee.contractEnd || "Không xác định thời hạn"} /><DataMask label="Lương cơ bản" value={vnd(employee.baseSalary)} masked="Đã ẩn" permission="hrm.employee.field.salary" role={role} onReveal={() => onAudit(`xem lương cơ bản của ${employee.code}.`)} /><DataMask label="Lương đóng BHXH" value={vnd(employee.insuranceSalary)} masked="Đã ẩn" permission="hrm.employee.field.salary" role={role} onReveal={() => onAudit(`xem lương BHXH của ${employee.code}.`)} /></div><Button variant="secondary" onClick={onDocuments}><DocumentTextIcon /> Xem văn bản hợp đồng</Button></Card>}
      {tab === "documents" && <Card title="Văn bản nhân sự" description="Phiên bản, xác minh, mã hóa và tải văn bản đều theo quyền được cấp."><DocumentTable rows={employeeDocuments} role={role} onAudit={onAudit} compact /><div className="card-footer-link"><Button variant="secondary" onClick={onDocuments}>Mở trung tâm văn bản <ChevronRightIcon /></Button></div></Card>}
      {tab === "attendance" && <Card title="Chấm công tháng 09/2026" description={`Lịch áp dụng: ${employee.schedule}`} action={<Button variant="secondary" onClick={onAttendance}>Mở bảng chấm công</Button>}><AttendanceMini employeeCode={employee.code} /></Card>}
      {tab === "payroll" && <ProfilePayroll employee={employee} role={role} actorCode={actorCode} onOpen={onPayroll} onAudit={onAudit} />}
      {tab === "insurance" && <Card><InfoSection title="Bảo hiểm xã hội"><DataMask label="Số BHXH" value={employee.socialInsuranceNo || "Chưa có"} masked={employee.socialInsuranceNo ? maskId(employee.socialInsuranceNo) : "Đã ẩn"} permission="hrm.employee.field.tax" role={role} onReveal={() => onAudit(`xem số BHXH của ${employee.code}.`)} /><DataField label="Trạng thái tham gia" value={employee.socialInsuranceStatus} /><DataMask label="Mức lương đóng BHXH" value={vnd(employee.insuranceSalary)} masked="Đã ẩn" permission="hrm.employee.field.salary" role={role} onReveal={() => onAudit(`xem mức đóng BHXH của ${employee.code}.`)} /></InfoSection><SecurityNote>Dữ liệu BHXH và sức khỏe thuộc nhóm bảo mật, chỉ được trả về khi hệ thống xác nhận quyền truy cập.</SecurityNote></Card>}
      {tab === "history" && <HistoryPanel employee={employee} role={role} />}
      {tab === "audit" && <AuditPanel employee={employee} role={role} />}
    </section>
  </>;
}

function SensitiveRelations({ employeeCode, role, onAudit }: { employeeCode: string; role: Role; onAudit: (message: string) => void }) {
  const contacts = emergencies[employeeCode] ?? [];
  const people = dependents[employeeCode] ?? [];
  return <Card title="Liên hệ khẩn cấp và người phụ thuộc" description="Thông tin có tính bảo mật, phục vụ an toàn và giảm trừ gia cảnh."><div className="relation-split"><section><h3>Liên hệ khẩn cấp</h3>{contacts.length ? contacts.map((contact) => <div className="relation-row" key={contact.phone}><span><b>{contact.name}{contact.primary ? " · Liên hệ chính" : ""}</b><small>{contact.relationship}</small></span><DataMask label="Điện thoại" value={contact.phone} masked="Đã ẩn" permission="hrm.employee.field.personal" role={role} onReveal={() => onAudit(`xem liên hệ khẩn cấp của ${employeeCode}.`)} /></div>) : <EmptyState title="Chưa có liên hệ khẩn cấp" detail="Hồ sơ cần được HR bổ sung." />}</section><section><h3>Người phụ thuộc</h3>{people.length ? people.map((person) => <div className="relation-row" key={person.idNumber}><span><b>{person.name}</b><small>{person.relationship} · {person.dob}</small></span><DataMask label="Số giấy tờ" value={person.idNumber} masked={maskId(person.idNumber)} permission="hrm.employee.field.tax" role={role} onReveal={() => onAudit(`xem người phụ thuộc của ${employeeCode}.`)} /></div>) : <EmptyState title="Chưa có người phụ thuộc" detail="Không ghi nhận giảm trừ gia cảnh." />}</section></div></Card>;
}

function AttendanceMini({ employeeCode }: { employeeCode: string }) {
  const rows = attendanceMonth.filter((row) => row.employeeCode === employeeCode);
  return <div className="table-scroll"><table className="data-table"><thead><tr><th>Ngày</th><th>Ca</th><th>Vào ca</th><th>Ra ca</th><th>Đi muộn</th><th>Về sớm</th></tr></thead><tbody>{rows.map((row) => <tr key={row.date}><td>{row.date}</td><td>{row.shift}</td><td>{row.checkIn || "—"}</td><td>{row.checkOut || "—"}</td><td>{row.lateMin ? `${row.lateMin} phút` : "—"}</td><td>{row.earlyMin ? `${row.earlyMin} phút` : "—"}</td></tr>)}</tbody></table></div>;
}

function ProfilePayroll({ employee, role, actorCode, onOpen, onAudit }: { employee: Employee; role: Role; actorCode: string; onOpen: () => void; onAudit: (message: string) => void }) {
  const canAccess = usePermissionCheck(role);
  const canRead = (canAccess("hrm.payroll.read") || canAccess("hrm.payslip.read_own")) && (canAccess("hrm.employee.field.salary") || employee.code === actorCode);
  if (!canRead) return <Card title="Bảng lương"><SecurityNote>Thông tin bảng lương không thuộc quyền truy cập của tài khoản hiện tại.</SecurityNote></Card>;
  if (!employee.baseSalary) return <Card title="Bảng lương"><EmptyState title="Chưa có dữ liệu lương" detail="Bảng lương chính thức của nhân sự này chưa được đồng bộ." /></Card>;
  return <Card title="Bảng lương" description="Dữ liệu nguồn từ hợp đồng, chấm công, BHXH, thuế và người phụ thuộc."><div className="payroll-summary"><div><span>Lương cơ bản</span><b>{vnd(employee.baseSalary)}</b></div><div><span>Khấu trừ</span><b>—</b></div><div><span>Thực nhận</span><b>—</b></div><StatusBadge status="Chưa có kỳ lương" /></div><Button variant="secondary" onClick={() => { onOpen(); onAudit(`xem phiếu lương ${employee.code}.`); }}><BanknotesIcon /> Mở phiếu lương</Button></Card>;
}

function HistoryPanel({ employee, role }: { employee: Employee; role: Role }) {
  const canAccess = usePermissionCheck(role);
  const history = employmentHistory[employee.code] ?? [];
  const salaries = salaryHistory[employee.code] ?? [];
  return <div className="profile-card-stack"><Card title="Lịch sử công tác"><HistoryTable rows={history} /></Card><Card title="Lịch sử diễn biến lương" description="Không ghi đè lịch sử lương.">{canAccess("hrm.employee.field.salary") ? <HistoryTable rows={salaries} /> : <SecurityNote>Lịch sử lương thuộc Field-Level Security và không hiển thị cho vai trò hiện tại.</SecurityNote>}</Card></div>;
}

function HistoryTable({ rows }: { rows: Array<{ date: string; action: string; from: string; to: string; decision: string }> }) {
  if (!rows.length) return <EmptyState title="Chưa có lịch sử" detail="Không ghi nhận thay đổi có hiệu lực." />;
  return <div className="table-scroll"><table className="data-table"><thead><tr><th>Hiệu lực</th><th>Hành động</th><th>Từ</th><th>Đến</th><th>Văn bản</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.date}-${row.action}`}><td>{row.date}</td><td>{row.action}</td><td>{row.from}</td><td>{row.to}</td><td>{row.decision}</td></tr>)}</tbody></table></div>;
}

function AuditPanel({ employee, role }: { employee: Employee; role: Role }) {
  const canAccess = usePermissionCheck(role);
  if (!canAccess("hrm.employee.edit")) return <Card title="Nhật ký kiểm tra"><SecurityNote>Nhật ký kiểm tra chỉ hiển thị cho HR được phân quyền hoặc vai trò đặc quyền.</SecurityNote></Card>;
  const rows = auditLog[employee.code] ?? [];
  return <Card title="Nhật ký kiểm tra" description="Truy vết xem, tải, sửa và xuất dữ liệu nhạy cảm.">{rows.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>Thời điểm</th><th>Người thao tác</th><th>Hành động</th><th>Trường / đối tượng</th><th>IP</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.at}-${row.field}`}><td>{row.at}</td><td>{row.actor}</td><td>{row.action}</td><td>{row.field}</td><td>{row.ip}</td></tr>)}</tbody></table></div> : <EmptyState title="Chưa có sự kiện kiểm tra" detail="Mọi truy cập dữ liệu bảo mật sẽ được ghi nhận tại đây." />}</Card>;
}

function DocumentsScreen({ role, actorCode, onAudit }: { role: Role; actorCode: string; onAudit: (message: string) => void }) {
  const canAccess = usePermissionCheck(role);
  const dataScope = useDataScope(role);
  const [type, setType] = useState("all");
  const [verify, setVerify] = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  if (!canAccess("hrm.document.view")) return <section className="access-denied"><LockClosedIcon /><h1>Không có quyền xem văn bản</h1><p>Trung tâm văn bản chỉ hiển thị thông tin và tệp khi hệ thống xác nhận quyền phù hợp.</p></section>;
  const visibleCodes = new Set(visibleEmployees(dataScope, actorCode).map((employee) => employee.code));
  const rows = documents.filter((row) => visibleCodes.has(row.employeeCode)).filter((row) => (type === "all" || row.type === type) && (verify === "all" || row.verify === verify));
  return <>
    <PageHeader title="Trung tâm văn bản nhân sự" description="Quản lý văn bản nhân sự theo danh sách cần hoàn thiện, phiên bản, xác minh, mã hóa và quyền truy cập." breadcrumb={["Nhân sự", "Văn bản"]} actions={<PermissionGate role={role} permission="hrm.document.upload"><Button variant="primary" onClick={() => setUploadOpen(true)}><CloudArrowUpIcon /> Tải văn bản lên</Button></PermissionGate>} />
    <section className="document-alerts"><div><ExclamationTriangleIcon /><span><b>Checklist hồ sơ thiếu</b><small>Được tính từ văn bản chính thức đã đồng bộ.</small></span><Badge tone="danger">{rows.filter((row) => row.required && !row.fileName).length}</Badge></div><div><ClockIcon /><span><b>Văn bản có hạn</b><small>Văn bản có ngày hết hạn trong database HRM.</small></span><Badge tone="warning">{rows.filter((row) => row.expiry).length}</Badge></div></section>
    <section className="filter-bar"><label><span>Loại văn bản</span><select value={type} onChange={(event) => setType(event.target.value)}><option value="all">Tất cả loại</option>{[...new Set(documents.map((row) => row.type))].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label><span>Xác minh</span><select value={verify} onChange={(event) => setVerify(event.target.value)}><option value="all">Tất cả trạng thái</option>{[...new Set(documents.map((row) => row.verify))].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><span className="result-count">{rows.length} văn bản</span></section>
    <Card className="table-card"><DocumentTable rows={rows} role={role} onAudit={onAudit} />{!rows.length && <EmptyState title="Không có văn bản" detail="Không có văn bản thuộc bộ lọc và Phạm vi dữ liệu hiện tại." />}</Card>
    <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onAudit={onAudit} />
  </>;
}

function UploadModal({ open, onClose, onAudit }: { open: boolean; onClose: () => void; onAudit: (message: string) => void }) {
  const [fileName, setFileName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    if (open) return;
    setFileName("");
    setSubmitted(false);
  }, [open]);
  return <Modal open={open} title="Tải văn bản lên" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Hủy</Button><Button variant="primary" disabled={!fileName || !employees.length} onClick={() => { setSubmitted(true); onAudit(`chọn file ${fileName} cho dữ liệu chính thức tải lên`); }}>Tải lên</Button></>}><div className="form-grid"><label><span>Nhân viên</span><select disabled={!employees.length}>{employees.map((employee) => <option key={employee.code} value={employee.code}>{employee.code} · {employee.legalName}</option>)}</select></label><label><span>Loại văn bản</span><select><option>HĐLĐ</option><option>Phụ lục HĐ</option><option>QĐ lương</option><option>QĐ bổ nhiệm</option><option>Hồ sơ nghỉ việc</option></select></label><label><span>Ngày hiệu lực</span><input type="date" /></label><label><span>Ngày hết hạn</span><input type="date" /></label></div><label className="upload-zone"><CloudArrowUpIcon /><b>{fileName || "Chọn file tải lên"}</b><small>{fileName ? "Tệp đã được chọn trong trình duyệt; hệ thống chính thức vẫn phải quét virus, mã hóa và ghi nhật ký." : "Chưa có file nào được tải lên. Hệ thống chính thức cần kiểm tra định dạng file, quét virus, lưu trữ riêng tư và mã hóa."}</small><input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => { setFileName(event.target.files?.[0]?.name ?? ""); setSubmitted(false); }} /></label>{submitted && <SecurityNote>Đã chọn tệp trong trình duyệt; dịch vụ lưu trữ chính thức chưa được gọi.</SecurityNote>}<SecurityNote>Tải lên thật chỉ được bật khi dịch vụ lưu trữ, phân quyền và nhật ký kiểm tra đã kết nối.</SecurityNote></Modal>;
}

function AttendanceScreen({ role, actorCode, onLateEarly, onWorkflow, onAudit }: { role: Role; actorCode: string; onLateEarly: () => void; onWorkflow: () => void; onAudit: (message: string) => void }) {
  const dataScope = useDataScope(role);
  const [department, setDepartment] = useState("all");
  const allowedCodes = new Set(visibleEmployees(dataScope, actorCode).map((employee) => employee.code));
  const rows = attendanceToday.filter((row) => allowedCodes.has(row.employeeCode)).filter((row) => department === "all" || employeeByCode(row.employeeCode)?.department === department);
  const departments = [...new Set(visibleEmployees(dataScope, actorCode).map((employee) => employee.department))];
  return <>
    <PageHeader title="Bảng chấm công" description="Đối chiếu dữ liệu chấm công với lịch làm việc chuẩn, không chỉnh sửa bản ghi gốc." breadcrumb={["Chấm công"]} actions={<><Button variant="secondary" onClick={onWorkflow}><ClipboardDocumentCheckIcon /> Yêu cầu điều chỉnh công</Button><Button variant="primary" onClick={onLateEarly}><PlusIcon /> Đăng ký đi muộn / về sớm</Button></>} />
    <section className="stat-grid attendance-stats"><StatTile label="Vào ca" value={String(rows.filter((row) => row.checkIn).length)} detail="Đã ghi nhận hôm nay" tone="success" /><StatTile label="Ra ca" value={String(rows.filter((row) => row.checkOut).length)} detail="Theo dữ liệu chấm công" tone="blue" /><StatTile label="Đi muộn" value={String(rows.filter((row) => row.lateMin > 0).length)} detail="Cần đối soát theo ca" tone="warning" /><StatTile label="Về sớm" value={String(rows.filter((row) => row.earlyMin > 0).length)} detail="Đang chờ phê duyệt" tone="warning" /><StatTile label="Làm thêm" value={String(rows.filter((row) => row.otMin > 0).length)} detail="Đăng ký làm thêm tháng này" tone="info" /><StatTile label="Thiếu công" value={String(rows.filter((row) => row.missing).length)} detail="Thiếu giờ vào hoặc giờ ra" tone="danger" /></section>
    <Card title="Bảng công trong ngày" description="Nguồn nhận diện: khuôn mặt · định vị · mã QR · thẻ · mã PIN máy chấm công."><section className="filter-bar compact-filter"><label><span>Phòng ban</span><select value={department} onChange={(event) => setDepartment(event.target.value)}><option value="all">Tất cả phòng ban</option>{departments.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label><span>Ngày</span><input type="date" /></label></section>{rows.length ? <AttendanceTable rows={rows} /> : <EmptyState title="Chưa có dữ liệu chấm công" detail="Dữ liệu chấm công chính thức chưa được đồng bộ." />}</Card>
    <SecurityNote>Hệ thống chấm công đối chiếu mã nhân viên và lịch làm việc; mọi điều chỉnh đi qua luồng phê duyệt, không cho phép sửa trực tiếp dữ liệu chấm công gốc.</SecurityNote>
    <section className="attendance-action-row"><Button variant="secondary" onClick={() => onAudit("Đã tạo yêu cầu gửi xác nhận bảng công tới email cá nhân theo phạm vi quyền.")}><DocumentCheckIcon /> Gửi xác nhận bảng công</Button><Button variant="secondary" onClick={onWorkflow}><QueueListIcon /> Mở hàng đợi điều chỉnh</Button></section>
  </>;
}

function AttendanceTable({ rows }: { rows: AttendanceRow[] }) {
  return <div className="table-scroll"><table className="data-table"><thead><tr><th>Nhân viên</th><th>Ca làm việc</th><th>Vào ca</th><th>Ra ca</th><th>Đi muộn</th><th>Về sớm</th><th>Làm thêm</th><th>Thiếu công</th></tr></thead><tbody>{rows.map((row) => {
    const employee = employeeByCode(row.employeeCode);
    if (!employee) return null;
    return <tr key={row.employeeCode}><td><span className="cell-person"><Avatar employee={employee} size="sm" /><span><b>{employee.legalName}</b><small>{row.employeeCode}</small></span></span></td><td>{row.shift}</td><td>{row.checkIn || "—"}</td><td>{row.checkOut || "—"}</td><td>{row.lateMin ? <Badge tone="warning">{row.lateMin} phút</Badge> : "—"}</td><td>{row.earlyMin ? <Badge tone="warning">{row.earlyMin} phút</Badge> : "—"}</td><td>{row.otMin ? `${row.otMin} phút` : "—"}</td><td>{row.missing ? <Badge tone="danger">Thiếu</Badge> : <Badge tone="success">Đủ</Badge>}</td></tr>;
  })}</tbody></table></div>;
}

function WorkflowTimeline({ item, role, actorCode, onAdvance, onReject }: { item: WorkflowItem; role: Role; actorCode: string; onAdvance: (id: string) => void; onReject: (id: string) => void }) {
  const canAccess = usePermissionCheck(role);
  const decision = workflowDecision(item, role, actorCode, canAccess("hrm.workflow.approve"));
  return <div className="workflow-timeline">{item.steps.map((step, index) => <div className={`timeline-step timeline-${step.status.toLowerCase()}`} key={`${step.role}-${index}`}><i>{step.status === "Done" ? <CheckCircleIcon /> : step.status === "Rejected" ? <XCircleIcon /> : <span>{index + 1}</span>}</i><div><div className="timeline-title"><b>{workflowStepLabel(step.role)}</b>{step.status === "Current" && <Badge tone="warning">Chờ xử lý</Badge>}{step.status === "Done" && <Badge tone="success">Hoàn tất</Badge>}</div><span>{step.name}</span>{step.at && <time>{step.at}</time>}{step.note && <p>{step.note}</p>}</div></div>)}<div className="timeline-decision" role="status"><ShieldCheckIcon aria-hidden="true" /><span>{decision.note}</span></div>{decision.canAct && decision.step && <div className="timeline-actions"><Button variant="danger" aria-label={`Từ chối yêu cầu ${item.id} ở bước ${workflowStepLabel(decision.step.role)}`} onClick={() => onReject(item.id)}><XCircleIcon /> Từ chối</Button><Button variant="primary" aria-label={`Phê duyệt yêu cầu ${item.id} ở bước ${workflowStepLabel(decision.step.role)}`} onClick={() => onAdvance(item.id)}><CheckCircleIcon /> Phê duyệt</Button></div>}</div>;
}

function LateEarlyScreen({ role, actorCode, workflowItems, selectedId, setSelectedId, onSubmit, onAdvance, onReject }: { role: Role; actorCode: string; workflowItems: WorkflowItem[]; selectedId: string; setSelectedId: (id: string) => void; onSubmit: (type: "Đi muộn / về sớm", payload: string) => void; onAdvance: (id: string) => void; onReject: (id: string) => void }) {
  const dataScope = useDataScope(role);
  const [date, setDate] = useState("2026-09-12");
  const [kind, setKind] = useState("Về sớm");
  const [minutes, setMinutes] = useState("30");
  const [reason, setReason] = useState("");
  const actor = employeeByCode(actorCode);
  const allowed = new Set(visibleEmployees(dataScope, actorCode).map((employee) => employee.code));
  const queue = workflowItems.filter((item) => item.type === "Đi muộn / về sớm" && (allowed.has(item.employeeCode) || item.employeeCode === actorCode));
  const selected = queue.find((item) => item.id === selectedId) ?? queue[0];
  if (!actor) return <EmptyState title="Không xác định được người dùng" />;
  const submitted = () => {
    if (!reason.trim()) return;
    onSubmit("Đi muộn / về sớm", `${kind} ${date} · ${minutes} phút · Lý do: ${reason.trim()}`);
    setReason("");
  };
  return <>
    <PageHeader title="Đăng ký đi muộn / về sớm" description="Mọi điều chỉnh đi qua Manager và HR trước khi hệ thống chấm công áp dụng." breadcrumb={["Chấm công", "Đăng ký điều chỉnh"]} />
    <section className="late-early-layout"><Card title="Tạo đăng ký điều chỉnh" description={`Người gửi: ${actor.legalName} · ${actor.code}`}><div className="form-grid"><label><span>Ngày áp dụng</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><label><span>Loại điều chỉnh</span><select value={kind} onChange={(event) => setKind(event.target.value)}><option>Đi muộn</option><option>Về sớm</option></select></label><label><span>Số phút</span><input type="number" min="1" value={minutes} onChange={(event) => setMinutes(event.target.value)} /></label><label><span>File minh chứng</span><input type="file" accept=".pdf,.doc,.docx" /></label><label className="form-wide"><span>Lý do</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Nêu rõ lý do và thông tin cần đối soát" rows={4} /></label></div><SecurityNote>Thao tác chỉ tạo bản nháp cục bộ. Dữ liệu chỉ được ghi chính thức khi dịch vụ chấm công và phê duyệt xử lý.</SecurityNote><div className="form-actions"><Button variant="primary" disabled={!reason.trim()} onClick={submitted}><DocumentCheckIcon /> Gửi đăng ký</Button></div></Card><Card title="Dòng phê duyệt" description={selected?.payload ?? "Chưa có đăng ký trong phạm vi dữ liệu."}>{selected ? <WorkflowTimeline item={selected} role={role} actorCode={actorCode} onAdvance={onAdvance} onReject={onReject} /> : <EmptyState title="Chưa có đăng ký" detail="Dùng form bên trái để gửi đăng ký." />}</Card></section>
    <Card title="Hàng đợi điều chỉnh giờ làm" description="Đơn theo Phạm vi dữ liệu và bước phê duyệt hiện tại.">{queue.length ? <div className="workflow-list compact-workflow-list">{queue.map((item) => <button type="button" key={item.id} className={item.id === selected?.id ? "selected" : ""} aria-pressed={item.id === selected?.id} aria-label={`Chọn yêu cầu ${item.id}: ${item.employeeName}, bước ${workflowStepLabel(currentWorkflowStep(item)?.role ?? item.current)}`} onClick={() => setSelectedId(item.id)}><span><b>{item.employeeName}</b><small>{item.payload}</small></span><span><StatusBadge status={item.status} /><small>{workflowStepLabel(currentWorkflowStep(item)?.role ?? item.current)}</small></span><ChevronRightIcon /></button>)}</div> : <EmptyState title="Không có đơn điều chỉnh" />}</Card>
  </>;
}

function PayrollScreen({ role, actorCode, locked, onLock, onAudit }: { role: Role; actorCode: string; locked: boolean; onLock: () => void; onAudit: (message: string) => void }) {
  const canAccess = usePermissionCheck(role);
  const dataScope = useDataScope(role);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const hasFinancialFields = canAccess("hrm.employee.field.salary");
  const workerRows = hasFinancialFields ? visibleEmployees(dataScope, actorCode) : visibleEmployees(dataScope, actorCode).filter((employee) => employee.code === actorCode);
  const selected = employeeByCode(selectedCode ?? actorCode);
  const activatePayrollRow = (event: React.KeyboardEvent<HTMLTableRowElement>, code: string) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    setSelectedCode(code);
  };
  if (!canAccess("hrm.payroll.read")) return <section className="access-denied"><LockClosedIcon /><h1>Không có quyền xem bảng lương</h1><p>Bảng lương chỉ hiển thị cho vai trò có quyền nghiệp vụ phù hợp.</p></section>;
  return <>
    <PageHeader title="Bảng lương" description="Kỳ lương sử dụng dữ liệu từ hợp đồng, chấm công, BHXH, thuế và người phụ thuộc." breadcrumb={["Bảng lương"]} actions={<>{canAccess("hrm.payroll.lock") && <Button variant="primary" disabled={locked} onClick={() => setConfirmOpen(true)}><LockClosedIcon /> {locked ? "Đã khóa dữ liệu chính thức" : "Khóa bảng lương"}</Button>}</>} />
    <section className="payroll-period"><div><span>Kỳ lương</span><b>—</b><small>Chưa có kỳ lương chính thức</small></div><div><span>Số nhân sự</span><b>{workerRows.filter((employee) => employee.baseSalary > 0).length}</b><small>Có dữ liệu lương</small></div><div><span>Trạng thái</span><StatusBadge status={locked ? "Locked" : "Reviewed"} /><small>{locked ? "Đã khóa, chỉ điều chỉnh qua quyết định" : "Chưa có dữ liệu khóa kỳ"}</small></div><div><span>Tổng thực nhận</span><b>—</b><small>Chưa có bảng lương chính thức</small></div></section>
    <Card title="Danh sách phiếu lương" description={hasFinancialFields ? "Chọn nhân sự để xem chi tiết phiếu lương." : "Nhân viên chỉ xem phiếu lương của chính mình."}>{workerRows.some((employee) => employee.baseSalary > 0) ? <div className="table-scroll"><table className="data-table"><thead><tr><th>Nhân viên</th><th>Phòng ban</th><th>Tổng thu nhập</th><th>Thực nhận</th><th>Trạng thái</th><th><span className="sr-only">Mở</span></th></tr></thead><tbody>{workerRows.filter((employee) => employee.baseSalary > 0).map((employee) => <tr key={employee.code} onClick={() => setSelectedCode(employee.code)} tabIndex={0} role="button" aria-label={`Mở phiếu lương ${employee.legalName}`} onKeyDown={(event) => activatePayrollRow(event, employee.code)}><td><span className="cell-person"><Avatar employee={employee} size="sm" /><span><b>{employee.legalName}</b><small>{employee.code}</small></span></span></td><td>{employee.department}</td><td>{hasFinancialFields || employee.code === actorCode ? vnd(Math.round(employee.baseSalary * 1.125)) : "Đã ẩn"}</td><td>{hasFinancialFields || employee.code === actorCode ? vnd(Math.round(employee.baseSalary * .9766)) : "Đã ẩn"}</td><td><StatusBadge status={locked ? "Locked" : "Reviewed"} /></td><td><ChevronRightIcon className="row-arrow" /></td></tr>)}</tbody></table></div> : <EmptyState title="Chưa có bảng lương" detail="Dữ liệu lương chính thức chưa được đồng bộ vào HRM." />}</Card>
    {selected && <PayslipDrawer employee={selected} open={Boolean(selectedCode)} onClose={() => setSelectedCode(null)} onAudit={onAudit} />}
    <Modal open={confirmOpen} title="Khóa bảng lương" onClose={() => setConfirmOpen(false)} footer={<><Button variant="secondary" onClick={() => setConfirmOpen(false)}>Hủy</Button><Button variant="primary" onClick={() => { onLock(); setConfirmOpen(false); onAudit("yêu cầu khóa bảng lương"); }}><LockClosedIcon /> Khóa</Button></>}><p>Chỉ thực hiện khi có kỳ lương chính thức từ hệ thống nghiệp vụ.</p><SecurityNote>Không có bảng lương hay Nhật ký kiểm tra hệ thống chính thức nào được ghi. Dịch vụ nghiệp vụ phải kiểm tra lại quyền trước khi triển khai thao tác thật.</SecurityNote></Modal>
  </>;
}

function PayslipDrawer({ employee, open, onClose, onAudit }: { employee: Employee; open: boolean; onClose: () => void; onAudit: (message: string) => void }) {
  return <Drawer open={open} title={`Phiếu lương · ${employee.legalName}`} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Đóng</Button><Button variant="primary" disabled={!payslipLines.length} onClick={() => onAudit(`yêu cầu xuất tệp phiếu lương ${employee.code}`)}><DocumentArrowDownIcon /> Xuất tệp</Button></>}><div className="payslip-employee"><Avatar employee={employee} size="md" /><span><b>{employee.legalName}</b><small>{employee.code}</small></span><Badge tone="info" icon={<LockClosedIcon />}>Dữ liệu chính thức</Badge></div>{payslipLines.length ? <><div className="payslip-lines">{payslipLines.map((line) => <div className={`payslip-line payslip-${line.kind}`} key={line.label}><span>{line.label}</span><b>{line.amount < 0 ? "− " : ""}{vnd(Math.abs(line.amount))}</b></div>)}</div><p className="formula-note">Thực nhận = Lương cơ bản + Phụ cấp + Thưởng + Làm thêm − BHXH − Thuế − Khấu trừ</p></> : <EmptyState title="Chưa có phiếu lương" detail="Phiếu lương chính thức chưa được đồng bộ." />}<SecurityNote>Không có tệp phiếu lương được tạo. Hệ thống chính thức phải kiểm tra quyền trước khi xuất dữ liệu nhạy cảm.</SecurityNote></Drawer>;
}

function WorkflowScreen({ role, actorCode, workflowItems, selectedId, setSelectedId, onAdvance, onReject }: { role: Role; actorCode: string; workflowItems: WorkflowItem[]; selectedId: string; setSelectedId: (id: string) => void; onAdvance: (id: string) => void; onReject: (id: string) => void }) {
  const canAccess = usePermissionCheck(role);
  const dataScope = useDataScope(role);
  if (!canAccess("hrm.workflow.read") && !canAccess("hrm.workflow.approve")) return <section className="access-denied"><LockClosedIcon /><h1>Không có quyền xem phê duyệt</h1><p>Hàng đợi phê duyệt chỉ hiển thị cho người gửi hoặc vai trò được cấp quyền xử lý.</p></section>;
  const allowed = new Set(visibleEmployees(dataScope, actorCode).map((employee) => employee.code));
  const items = workflowItems.filter((item) => allowed.has(item.employeeCode) || item.employeeCode === actorCode);
  const selected = items.find((item) => item.id === selectedId) ?? items[0];
  const selectedEmployee = selected ? employeeByCode(selected.employeeCode) : undefined;
  if (!selected) return <EmptyState title="Không có yêu cầu phê duyệt" detail="Không có yêu cầu thuộc phạm vi dữ liệu hiện tại." />;
  return <>
    <PageHeader title="Quản lý phê duyệt" description="Dòng phê duyệt sử dụng quan hệ quản lý trực tiếp, không suy vòng vèo qua sơ đồ tổ chức." breadcrumb={["Phê duyệt"]} />
    <section className="workflow-layout"><Card title="Hàng đợi phê duyệt" description={`${items.filter((item) => item.status === "Pending").length} yêu cầu đang chờ xử lý`}><div className="workflow-list">{items.map((item) => {
      const current = currentWorkflowStep(item);
      return <button type="button" key={item.id} className={item.id === selected.id ? "selected" : ""} aria-pressed={item.id === selected.id} aria-label={`Chọn yêu cầu ${item.id}: ${item.type} của ${item.employeeName}, bước ${workflowStepLabel(current?.role ?? item.current)}`} onClick={() => setSelectedId(item.id)}><span><Badge tone={item.type === "Nghỉ phép" ? "info" : item.type === "Điều chỉnh công" ? "warning" : "blue"}>{item.type}</Badge><b>{item.employeeName}</b><small>{item.id} · {item.submittedAt}</small></span><span><StatusBadge status={item.status} /><small>Bước: {workflowStepLabel(current?.role ?? item.current)}</small></span><ChevronRightIcon /></button>;
    })}</div></Card><Card title={selected.type === "Nghỉ phép" ? "Đơn nghỉ phép" : "Yêu cầu điều chỉnh"} description={selected.payload}><div className="workflow-detail-head"><span>{selectedEmployee ? <Avatar employee={selectedEmployee} size="md" /> : null}<span><b>{selected.employeeName}</b><small>{selected.employeeCode} · {selected.submittedAt}</small></span></span><StatusBadge status={selected.status} /></div><WorkflowTimeline item={selected} role={role} actorCode={actorCode} onAdvance={onAdvance} onReject={onReject} /><SecurityNote>Nhật ký phê duyệt lưu người tạo, người duyệt, thời điểm, trạng thái và dữ liệu trước/sau ở từng bước.</SecurityNote></Card></section>
  </>;
}

function PermissionScreen() {
  const [tab, setTab] = useState<"roles" | "matrix" | "scope">("roles");
  const permissions: Array<{ code: Permission; label: string }> = [
    { code: "hrm.employee.read", label: "Xem hồ sơ nhân sự" },
    { code: "hrm.employee.field.personal", label: "Xem dữ liệu cá nhân bảo mật" },
    { code: "hrm.employee.field.cccd", label: "Xem CCCD / định danh" },
    { code: "hrm.employee.field.salary", label: "Xem lương và phụ cấp" },
    { code: "hrm.employee.field.bank", label: "Xem tài khoản ngân hàng" },
    { code: "hrm.document.download", label: "Tải văn bản nhân sự" },
    { code: "hrm.payroll.read", label: "Xem bảng lương" },
    { code: "hrm.workflow.approve", label: "Phê duyệt yêu cầu" },
  ];
  const roles: Role[] = ["super-admin", "hr-manager", "hr-staff", "manager", "employee", "accountant"];
  return <>
    <PageHeader title="Quản lý vai trò" description="Phân quyền theo vai trò xác định hành động; phạm vi dữ liệu giới hạn đối tượng; bảo mật trường dữ liệu giới hạn trường trả về." breadcrumb={["Quản trị", "Phân quyền"]} actions={<a className="button button-secondary button-md" href={`${identityWebOrigin}/console`} target="_blank" rel="noreferrer">Mở QTS Identity <ArrowTopRightOnSquareIcon /></a>} />
    <SecurityNote>Quyền được lưu và nhật ký kiểm tra tại QTS Identity. HRM áp dụng quyền ở giao diện, dịch vụ hệ thống và khi xuất tệp - không xem việc ẩn trên giao diện là bảo mật.</SecurityNote>
    <nav className="system-tabs"><button type="button" className={tab === "roles" ? "active" : ""} onClick={() => setTab("roles")}>Vai trò</button><button type="button" className={tab === "matrix" ? "active" : ""} onClick={() => setTab("matrix")}>Ma trận quyền</button><button type="button" className={tab === "scope" ? "active" : ""} onClick={() => setTab("scope")}>Phạm vi dữ liệu & Bảo mật trường dữ liệu</button></nav>
    {tab === "roles" && <Card title="Vai trò hệ thống" description="Vai trò hệ thống không thể xóa; thay đổi phân quyền được kiểm soát tại Identity."><div className="role-grid">{roles.map((value) => <article key={value} className="role-card"><div><span className="role-icon"><ShieldCheckIcon /></span><Badge tone={value === "super-admin" ? "danger" : value === "hr-manager" ? "blue" : "neutral"}>{ROLE_LABEL[value]}</Badge></div><b>{ROLE_LABEL[value]}</b><p>{roleDescription(value)}</p><small>{scopeLabel(value)}</small></article>)}</div></Card>}
    {tab === "matrix" && <Card title="Ma trận quyền" description="Ma trận mẫu chỉ đọc; quyền hiệu lực của phiên đến từ QTS Identity."><div className="table-scroll"><table className="data-table permission-table"><thead><tr><th>Quyền</th>{roles.map((value) => <th key={value}>{ROLE_LABEL[value]}</th>)}</tr></thead><tbody>{permissions.map((item) => <tr key={item.code}><td><b>{item.label}</b><small>Hiệu lực theo phiên đăng nhập</small></td>{roles.map((value) => <td key={value}><label className="permission-toggle"><input type="checkbox" checked={roleCan(value, item.code)} readOnly disabled /><i /><span className="sr-only">{ROLE_LABEL[value]}: {item.label}</span></label></td>)}</tr>)}</tbody></table></div></Card>}
    {tab === "scope" && <div className="scope-layout"><Card title="Phạm vi dữ liệu" description="Đợt 1 chỉ áp dụng toàn công ty, quản lý trực tiếp và hồ sơ cá nhân. Phạm vi chi nhánh/phòng ban sẽ được cấp khi hệ thống có dữ liệu gán tương ứng."><div className="scope-cards"><ScopeCard title="Toàn công ty" detail="Toàn pháp nhân" roles="Quản trị cấp cao, quản lý nhân sự, nhân sự, kế toán" /><ScopeCard title="Quản lý trực tiếp" detail="Nhân sự thuộc quyền quản lý" roles="Quản lý" /><ScopeCard title="Hồ sơ cá nhân" detail="Hồ sơ của chính mình" roles="Nhân viên" /></div></Card><Card title="Bảo mật trường dữ liệu" description="Không trả toàn bộ hồ sơ cho mọi vai trò."><div className="field-security"><div><Badge tone="success">Công khai nội bộ</Badge><span>Họ tên, ảnh, phòng ban, chức danh, email công việc, số máy lẻ, quản lý trực tiếp.</span></div><div><Badge tone="info">Quản lý</Badge><span>Loại hợp đồng, ngày vào làm, bằng cấp, KPI và dữ liệu quản lý.</span></div><div><Badge tone="danger">Bảo mật</Badge><span>CCCD, địa chỉ nhà, tài khoản ngân hàng, mã số thuế, lương, BHXH, người phụ thuộc, sức khỏe.</span></div></div><div className="scope-preview"><EyeIcon /><span><b>Phạm vi xem · Quản lý</b><small>Xem nhân sự thuộc quyền; không thấy lương, CCCD, ngân hàng hoặc nhóm bảng lương.</small></span></div></Card></div>}
  </>;
}

function ScopeCard({ title, detail, roles }: { title: string; detail: string; roles: string }) {
  return <div><b>{title}</b><span>{detail}</span><small>{roles}</small></div>;
}

function roleDescription(role: Role) {
  const descriptions: Record<Role, string> = {
    "super-admin": "Toàn hệ thống; cấu hình kỹ thuật và phân quyền theo chính sách đặc quyền.",
    "hr-manager": "Toàn bộ nghiệp vụ HR và dữ liệu hồ sơ bảo mật theo phạm vi doanh nghiệp.",
    "hr-staff": "Hồ sơ, tuyển dụng, tiếp nhận nhân sự, văn bản theo trường và phạm vi được cấp.",
    manager: "Nhân sự thuộc quyền; không mặc định xem lương, CCCD hoặc ngân hàng.",
    employee: "Dịch vụ tự phục vụ nhân viên và dữ liệu của chính mình theo trường được phép.",
    accountant: "Bảng lương, chi phí, mã số thuế, BHXH, ngân hàng; không mặc định xem toàn bộ hồ sơ nhân sự.",
  };
  return descriptions[role];
}

function scopeLabel(role: Role) {
  return `Phạm vi mẫu: ${scopeFor(role) === "company" ? "Toàn công ty" : scopeFor(role) === "manager" ? "Quản lý trực tiếp" : "Hồ sơ cá nhân"}; phiên chính thức dùng phạm vi dữ liệu do hệ thống cấp.`;
}

function NotFoundScreen({ onBack }: { onBack: () => void }) {
  return <section className="access-denied"><ExclamationTriangleIcon /><h1>Không tìm thấy màn hình</h1><p>Đường dẫn này không khớp với phân hệ nào đã mở trong QTS HRM.</p><Button onClick={onBack}>Về tổng quan</Button></section>;
}

function AuthenticationScreen({ phase, error, onSignIn, actionLabel = "Thử lại" }: { phase: AuthPhase; error: string; onSignIn: () => void; actionLabel?: string }) {
  const loading = phase === "unauthenticated" || phase === "authenticating" || phase === "redirecting" || phase === "signing-out";
  const expired = phase === "expired";
  const enrollmentPending = phase === "enrollment-pending";
  const signingOut = phase === "signing-out";
  const enrollmentUrl = `${identityWebOrigin}/enrollment-pending`;
  const title = signingOut ? "Đang chuyển đến xác nhận đăng xuất" : loading ? "Đang xác minh danh tính" : expired ? "Phiên đăng nhập đã hết hạn" : enrollmentPending ? "Tài khoản đang chờ hoàn tất kích hoạt" : "Không thể xác minh danh tính";
  const detail = signingOut
    ? "Phiên hiện tại vẫn được giữ cho đến khi bạn xác nhận đăng xuất."
    : loading
      ? "QTS HRM đang tự động xác minh phiên đăng nhập và kiểm tra quyền truy cập."
      : expired
        ? "Phiên đã hết hạn. HRM sẽ tự động bắt đầu lại xác minh danh tính."
        : enrollmentPending
          ? "Tài khoản đã đăng nhập nhưng chưa thể truy cập HRM cho đến khi hoàn tất đổi mật khẩu, thiết lập TOTP và lưu mã dự phòng."
          : "QTS HRM không thể hoàn tất xác minh danh tính. Vui lòng thử lại.";
  return <main className="auth-screen">
    <section className="auth-card" aria-busy={loading || undefined}>
      <div className="auth-brand"><QtsMark /><span>QTS <small>Nền tảng nhân sự</small></span></div>
      <h1>{title}</h1>
      <p>{detail}</p>
      {loading && <div className="auth-loading-stack" role="status" aria-live="polite" aria-label={title}>
        <Skeleton className="skeleton-text" style={{ width: "72%" }} />
        <Skeleton className="skeleton-text" style={{ width: "92%" }} />
        <Skeleton className="skeleton-text" style={{ width: "58%" }} />
      </div>}
      {enrollmentPending ? <><p className="auth-error auth-warning animate__animated animate__fadeIn animate__faster" role="alert">{error || "Quản trị viên sẽ xác minh và kích hoạt tài khoản sau khi hoàn tất các bước bảo mật."}</p><div className="auth-actions"><a className="button button-primary" href={enrollmentUrl}>Hoàn tất bảo mật tài khoản</a><Button variant="secondary" onClick={onSignIn}>Thử lại sau khi hoàn tất</Button></div></> : <>{error && <p className="auth-error animate__animated animate__fadeIn animate__faster" role="alert">{error}</p>}{!loading && <Button variant="primary" onClick={onSignIn}>{actionLabel} <ArrowRightOnRectangleIcon /></Button>}</>}
    </section>
  </main>;
}

function MissingEmployeeLinkScreen({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  return <main className="auth-screen"><section className="auth-card"><div className="auth-brand"><QtsMark /><span>QTS <small>Nền tảng nhân sự</small></span></div><h1>Chưa liên kết hồ sơ nhân sự</h1><p>Tài khoản {email} đã xác thực qua QTS Identity nhưng chưa có mã nhân viên HRM. HRM không mở dữ liệu hoặc tự suy diễn hồ sơ nhân sự từ vai trò.</p><p className="auth-error animate__animated animate__fadeIn animate__faster" role="alert">Vui lòng hoàn tất liên kết mã nhân viên trong hệ thống HRM và QTS Identity trước khi vào HRM chính thức.</p><Button variant="primary" onClick={onSignOut}>Đăng xuất an toàn <ArrowRightOnRectangleIcon /></Button></section></main>;
}

function ProductionConfigurationScreen({ issue }: { issue: string }) {
  return <main className="auth-screen"><section className="auth-card auth-card-wide" role="alert">
    <div className="auth-brand"><QtsMark /><span>QTS <small>Nền tảng nhân sự</small></span></div>
    <h1>HRM chưa sẵn sàng phục vụ</h1>
    <p>Ứng dụng chưa vượt qua kiểm tra cấu hình production nên không mở phiên làm việc hoặc dữ liệu nhân sự.</p>
    <p className="auth-error">{issue}</p>
    <SecurityNote>Vui lòng kiểm tra cấu hình QTS Identity, redirect URI và domain HRM trước khi phát hành.</SecurityNote>
  </section></main>;
}

const identityReloadRecoveryKey = "qts-hrm:identity-unavailable-reload-at";

function isIdentityUnavailableError(error: unknown) {
  return error instanceof IdentityUnavailableError
    || (error instanceof Error && error.message.includes("Chưa kết nối được QTS Identity"));
}

function reloadOnceForIdentityRecovery() {
  try {
    const lastReloadAt = Number(window.sessionStorage.getItem(identityReloadRecoveryKey) ?? "0");
    if (Number.isFinite(lastReloadAt) && Date.now() - lastReloadAt < 60_000) return false;
    window.sessionStorage.setItem(identityReloadRecoveryKey, String(Date.now()));
  } catch {
    const url = new URL(window.location.href);
    if (url.searchParams.get("identity-recovery") === "1") return false;
    url.searchParams.set("identity-recovery", "1");
    window.location.replace(url);
    return true;
  }
  window.location.reload();
  return true;
}

export function App() {
  const configIssue = hrmRuntimeConfigIssue();
  const prototype = !configIssue && import.meta.env.DEV && (
    !isOidcConfigured() || import.meta.env.VITE_HRM_TEST_MODE === "1"
  );
  if (prototype) seedPrototypeHrmData();
  const ssoHandoff = new URLSearchParams(window.location.search).get("sso") === "1";
  const [phase, setPhase] = useState<AuthPhase>(() => prototype ? "prototype" : isAuthorizationCallback() || hasStoredSession() ? "authenticating" : "unauthenticated");
  const [authenticationError, setAuthenticationError] = useState("");
  const [session, setSession] = useState<HrmSession | null>(null);
  const [applications, setApplications] = useState<LauncherApplication[]>([]);
  const [authenticatedRole, setAuthenticatedRole] = useState<Role | null>(null);
  const [, setHrmDataVersion] = useState(0);
  const authorizationStarted = useRef(false);
  const identityApplied = useRef(false);
  // Deterministic ids for locally drafted requests in browser state.
  const lateEarlySeq = useRef(221);
  const [role, setRole] = useState<Role>("hr-manager");
  const [page, setPage] = useState<Page>("hr-dashboard");
  const [selectedEmployeeCode, setSelectedEmployeeCode] = useState(ROLE_ACTOR["hr-manager"]);
  const [searchOpen, setSearchOpen] = useState(false);
  const mainContentRef = useRef<HTMLElement>(null);
  const [auditMessage, setAuditMessage] = useState<string | null>(null);
  const [workflowItems, setWorkflowItems] = useState(initialWorkflows);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(initialWorkflows[0]?.id ?? "");
  const [payrollLocked, setPayrollLocked] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectUndo, setRejectUndo] = useState<WorkflowItem | null>(null);
  const rejectReasonRef = useRef<HTMLTextAreaElement>(null);
  const rejectUndoTimer = useRef<number | null>(null);
  const online = useOnlineStatus();

  useEffect(() => () => {
    if (rejectUndoTimer.current !== null) window.clearTimeout(rejectUndoTimer.current);
  }, []);

  if (configIssue) return <ProductionConfigurationScreen issue={configIssue} />;

  async function loadOfficialData() {
    const official = await loadOfficialHrmData();
    if (official.employees.length === 0) {
      throw new Error("Chưa có dữ liệu nhân sự chính thức trong database.");
    }
    setWorkflowItems([]);
    setSelectedWorkflowId("");
    setHrmDataVersion((version) => version + 1);
    return official;
  }

  const applyIdentity = (profile: Parameters<typeof sessionFromUserInfo>[0], assignedApplications: LauncherApplication[], idToken: string) => {
    if (identityApplied.current) return;
    identityApplied.current = true;
    const nextSession = sessionFromUserInfo(profile, idToken);
    const nextRole = pickHrmRole(nextSession.roles);
    setSession(nextSession);
    setApplications(assignedApplications);
    setAuthenticatedRole(nextRole);
    if (nextRole) {
      const resolvedActorCode = actorCodeForSession(nextRole, nextSession.employeeCode);
      setRole(nextRole);
      setSelectedEmployeeCode(resolvedActorCode);
      setPage(appPageFor(nextRole, resolvedActorCode));
    }
  };

  useEffect(() => {
    if (prototype || !isAuthorizationCallback()) return;
    let cancelled = false;
    void (async () => {
      try {
        await redeemAuthorizationResponse();
        const identity = await loadHrmIdentity();
        await loadOfficialData();
        if (cancelled) return;
        applyIdentity(identity.profile, identity.applications, identity.idToken);
        setPhase("authenticated");
        window.history.replaceState({}, document.title, "/");
      } catch (error) {
        if (cancelled) return;
        if (error instanceof SilentAuthorizationRequiredError || new URLSearchParams(window.location.search).get("error") === "consent_required") {
          window.history.replaceState({}, document.title, "/");
          setPhase("redirecting");
          void beginAuthorization().catch((reason) => {
            if (isIdentityUnavailableError(reason) && reloadOnceForIdentityRecovery()) return;
            setAuthenticationError(reason instanceof Error ? reason.message : "Không thể bắt đầu đăng nhập.");
            setPhase("error");
          });
          return;
        }
        clearHrmSession();
        setAuthenticationError(error instanceof Error ? error.message : "Không thể hoàn tất đăng nhập.");
        setPhase(error instanceof EnrollmentRequiredError ? "enrollment-pending" : error instanceof SessionExpiredError ? "expired" : "error");
        window.history.replaceState({}, document.title, "/");
      }
    })();
    return () => { cancelled = true; };
  }, [prototype]);

  useEffect(() => {
    if (prototype || isAuthorizationCallback() || phase !== "unauthenticated" || authorizationStarted.current) return;
    authorizationStarted.current = true;
    if (ssoHandoff) window.history.replaceState({}, document.title, "/");
    signIn({ silent: true });
  }, [phase, prototype, ssoHandoff]);

  useEffect(() => {
    if (prototype || isAuthorizationCallback() || phase !== "authenticating") return;
    let cancelled = false;
    void (async () => {
      try {
        if (!await restoreSession()) {
          if (!cancelled) setPhase("unauthenticated");
          return;
        }
        const identity = await loadHrmIdentity();
        await loadOfficialData();
        if (cancelled) return;
        applyIdentity(identity.profile, identity.applications, identity.idToken);
        setPhase("authenticated");
      } catch (error) {
        if (cancelled) return;
        if (error instanceof SessionExpiredError) {
          clearHrmSession();
          setAuthenticationError("");
          setPhase("redirecting");
          void beginAuthorization().catch((reason) => {
            if (isIdentityUnavailableError(reason) && reloadOnceForIdentityRecovery()) return;
            setAuthenticationError(reason instanceof Error ? reason.message : "Không thể bắt đầu đăng nhập.");
            setPhase("error");
          });
          return;
        }
        setAuthenticationError(error instanceof Error ? error.message : "Không tải được phiên. Vui lòng thử lại.");
        setPhase("error");
      }
    })();
    return () => { cancelled = true; };
  }, [phase, prototype, ssoHandoff]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (phase !== "prototype" && phase !== "authenticated") return;
    if (searchOpen) return;
    mainContentRef.current?.focus({ preventScroll: true });
  }, [page, phase, searchOpen]);

  const signIn = (options: { silent?: boolean } = {}) => {
    const silent = options.silent === true;
    setAuthenticationError("");
    if (phase === "redirecting") return;
    setPhase("redirecting");
    void beginAuthorization(silent ? { prompt: "none" } : undefined).catch((error) => {
      if (isIdentityUnavailableError(error) && reloadOnceForIdentityRecovery()) return;
      setAuthenticationError(error instanceof Error ? error.message : "Không thể bắt đầu đăng nhập.");
      setPhase("error");
    });
  };
  const signOut = () => {
    setSearchOpen(false);
    setAuthenticationError("");
    setPhase("signing-out");
    void beginLogout().catch((error) => {
      setAuthenticationError(error instanceof Error ? error.message : "Không thể hoàn tất đăng xuất.");
      setPhase("authenticated");
    });
  };

  if (phase !== "prototype" && phase !== "authenticated") return <AuthenticationScreen phase={phase} error={authenticationError} onSignIn={signIn} />;
  if (!prototype && !authenticatedRole) return <AuthenticationScreen phase="error" error="Tài khoản chưa có vai trò HRM phù hợp." onSignIn={signOut} actionLabel="Đăng xuất an toàn" />;

  const activeRole = prototype ? role : authenticatedRole as Role;
  const sessionEmployeeCode = session?.employeeCode ?? null;
  const actorCode = prototype ? ROLE_ACTOR[activeRole] : actorCodeForSession(activeRole, sessionEmployeeCode);
  const effectiveDataScope = prototype ? scopeFor(activeRole) : session?.dataScope ?? "self";
  if (!prototype && !sessionEmployeeCode) return <MissingEmployeeLinkScreen email={session?.email ?? "tài khoản hiện tại"} onSignOut={signOut} />;
  const actor = employeeByCode(actorCode);
  const directory = visibleEmployees(effectiveDataScope, actorCode);
  if (!actor) return <AuthenticationScreen phase="error" error="Không xác định được hồ sơ HRM cho tài khoản này. Vui lòng liên hệ quản trị viên." onSignIn={signOut} actionLabel="Đăng xuất an toàn" />;
  const selectedEmployee = employeeByCode(selectedEmployeeCode) ?? actor;
  const effectivePermissions = prototype ? null : session?.permissions ?? [];
  const hasActivePermission = (permission: Permission) => prototype ? roleCan(activeRole, permission) : (effectivePermissions ?? []).includes(permission);

  const navigate = (next: Page) => {
    setPage(next);
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };
  const selectEmployee = (code: string) => { setSelectedEmployeeCode(code); navigate("profile"); };
  const logAudit = (message: string) => {
    const detail = message.replace(/^:\s*/i, "").replace(/^:\s*/i, "");
    setAuditMessage(detail);
    window.setTimeout(() => setAuditMessage(null), 4800);
  };
  const changeRole = (next: Role) => {
    if (!prototype) return;
    setRole(next);
    setSelectedEmployeeCode(ROLE_ACTOR[next]);
    navigate(appPageFor(next));
    logAudit(`Chọn quyền xem: ${ROLE_LABEL[next]}. Giao diện áp dụng phân quyền theo vai trò, phạm vi dữ liệu và bảo mật trường dữ liệu.`);
  };
  const advanceWorkflow = (id: string) => {
    setWorkflowItems((items) => items.map((item) => {
      if (item.id !== id) return item;
      const decision = workflowDecision(item, activeRole, actorCode, hasActivePermission("hrm.workflow.approve"));
      if (!decision.canAct) return item;
      const currentIndex = item.steps.findIndex((step) => step.status === "Current");
      if (currentIndex < 0) return item;
      const steps = item.steps.map((step, index) => {
        if (index === currentIndex) return { ...step, status: "Done" as const, at: "2026-09-11 10:18", name: step.name || actor.legalName, note: step.note || "Đã phê duyệt." };
        if (index === currentIndex + 1) return { ...step, status: "Current" as const };
        return step;
      });
      const hasCompletionStep = steps.at(-1)?.role === "Completed";
      const completed = hasCompletionStep ? currentIndex >= steps.length - 2 : currentIndex >= steps.length - 1;
      if (completed && hasCompletionStep) steps[steps.length - 1] = { ...steps[steps.length - 1], status: "Done", at: "2026-09-11 10:19", note: "Đã đồng bộ hệ thống chấm công." };
      return { ...item, steps, current: completed ? "Completed" : steps[currentIndex + 1]?.role ?? "Completed", status: completed ? "Completed" : "Pending" };
    }));
    logAudit(`phê duyệt yêu cầu ${id}`);
  };
  const rejectWorkflow = (id: string, reason: string) => {
    setWorkflowItems((items) => items.map((item) => {
      if (item.id !== id) return item;
      const decision = workflowDecision(item, activeRole, actorCode, hasActivePermission("hrm.workflow.approve"));
      if (!decision.canAct) return item;
      return { ...item, status: "Rejected", current: "Rejected", steps: item.steps.map((step) => step.status === "Current" ? { ...step, status: "Rejected", at: "2026-09-11 10:18", note: reason } : step) };
    }));
    logAudit(`từ chối yêu cầu ${id}; lý do: ${reason}`);
  };
  const requestReject = (id: string) => {
    const target = workflowItems.find((item) => item.id === id);
    if (!target || !workflowDecision(target, activeRole, actorCode, hasActivePermission("hrm.workflow.approve")).canAct) return;
    setRejectTarget(id);
    setRejectReason("");
  };
  const confirmReject = () => {
    const reason = rejectReason.trim();
    const original = rejectTarget ? workflowItems.find((item) => item.id === rejectTarget) : null;
    if (!rejectTarget || !reason || !original) return;
    rejectWorkflow(rejectTarget, reason);
    if (rejectUndoTimer.current !== null) window.clearTimeout(rejectUndoTimer.current);
    setRejectUndo(original);
    rejectUndoTimer.current = window.setTimeout(() => {
      setRejectUndo(null);
      rejectUndoTimer.current = null;
    }, 5000);
    setRejectTarget(null);
    setRejectReason("");
  };
  const undoReject = () => {
    if (!rejectUndo) return;
    const restored = rejectUndo;
    setWorkflowItems((items) => items.map((item) => item.id === restored.id && item.status === "Rejected" ? restored : item));
    setRejectUndo(null);
    if (rejectUndoTimer.current !== null) {
      window.clearTimeout(rejectUndoTimer.current);
      rejectUndoTimer.current = null;
    }
    logAudit(`hoàn tác từ chối yêu cầu ${restored.id}`);
  };
  const submitLateEarly = (_type: "Đi muộn / về sớm", payload: string) => {
    lateEarlySeq.current += 1;
    const id = `WF-LATE-${lateEarlySeq.current}`;
    const entry: WorkflowItem = {
      id,
      type: "Đi muộn / về sớm",
      employeeCode: actorCode,
      employeeName: actor.legalName,
      submittedAt: "2026-09-11 10:18",
      current: "Manager",
      status: "Pending",
      payload,
      steps: [
        { role: "Nhân viên", name: actor.legalName, at: "2026-09-11 10:18", status: "Done", note: "Đã gửi đăng ký." },
        { role: "Manager", name: actor.managerName, at: "", status: "Current", note: "" },
        { role: "HR", name: "HR phụ trách", at: "", status: "Waiting", note: "" },
        { role: "Completed", name: "Hệ thống chấm công", at: "", status: "Waiting", note: "" },
      ],
    };
    setWorkflowItems((items) => [entry, ...items]);
    setSelectedWorkflowId(id);
    logAudit(`tạo ${id}; chờ quản lý trực tiếp phê duyệt`);
  };

  let screen: ReactNode = null;
  switch (page) {
    case "ceo-dashboard": screen = <CeoDashboard prototype={prototype} onNavigate={navigate} />; break;
    case "hr-dashboard": screen = <HrDashboard role={activeRole} actorName={actor.legalName} workflowItems={workflowItems} prototype={prototype} onNavigate={navigate} onSelectEmployee={selectEmployee} />; break;
    case "employees": screen = <EmployeeList role={activeRole} actorCode={actorCode} onSelect={selectEmployee} onAudit={logAudit} />; break;
    case "profile": screen = <EmployeeProfile employee={selectedEmployee} role={activeRole} actorCode={actorCode} onBack={() => navigate("employees")} onDocuments={() => navigate("documents")} onAttendance={() => navigate("attendance")} onPayroll={() => navigate("payroll")} onAudit={logAudit} />; break;
    case "documents": screen = <DocumentsScreen role={activeRole} actorCode={actorCode} onAudit={logAudit} />; break;
    case "attendance": screen = <AttendanceScreen role={activeRole} actorCode={actorCode} onLateEarly={() => navigate("late-early")} onWorkflow={() => navigate("workflow")} onAudit={logAudit} />; break;
    case "late-early": screen = <LateEarlyScreen role={activeRole} actorCode={actorCode} workflowItems={workflowItems} selectedId={selectedWorkflowId} setSelectedId={setSelectedWorkflowId} onSubmit={submitLateEarly} onAdvance={advanceWorkflow} onReject={requestReject} />; break;
    case "payroll": screen = <PayrollScreen role={activeRole} actorCode={actorCode} locked={payrollLocked} onLock={() => setPayrollLocked(true)} onAudit={logAudit} />; break;
    case "workflow": screen = <WorkflowScreen role={activeRole} actorCode={actorCode} workflowItems={workflowItems} selectedId={selectedWorkflowId} setSelectedId={setSelectedWorkflowId} onAdvance={advanceWorkflow} onReject={requestReject} />; break;
    case "permissions": screen = <PermissionScreen />; break;
    case "organization": screen = <OrganizationScreen role={activeRole} />; break;
    case "contracts": screen = <ContractsScreen role={activeRole} actorCode={actorCode} onAudit={logAudit} />; break;
    case "recruitment": screen = <RecruitmentScreen onAudit={logAudit} />; break;
    case "onboarding": screen = <OnboardingScreen role={activeRole} onAudit={logAudit} />; break;
    case "leave": screen = <LeaveScreen role={activeRole} actorCode={actorCode} workflowItems={workflowItems} onAudit={logAudit} />; break;
    case "kpi": screen = <KpiScreen role={activeRole} onAudit={logAudit} />; break;
    case "training": screen = <TrainingScreen role={activeRole} onAudit={logAudit} />; break;
    case "assets": screen = <AssetsScreen role={activeRole} onAudit={logAudit} />; break;
    case "reports": screen = <ReportsScreen role={activeRole} onNavigate={navigate} onAudit={logAudit} />; break;
    default: screen = <NotFoundScreen onBack={() => navigate(appPageFor(activeRole, actorCode))} />; break;
  }

  return <AuthorizationProvider permissions={effectivePermissions} dataScope={effectiveDataScope}>
    <div className="hrm-shell">
      <a className="skip-link" href="#main">Bỏ qua đến nội dung</a>
      <Sidebar page={page} role={activeRole} onNavigate={navigate} />
      <div className="app-workspace">
        <Header
          role={activeRole}
          actor={actor}
          session={session}
          applications={applications}
          prototype={prototype}
          onRole={changeRole}
          onSearch={() => setSearchOpen(true)}
          onLogout={signOut}
        />
        <main ref={mainContentRef} id="main" className="main-content" tabIndex={-1} aria-live="polite" aria-label={PAGE_LABELS[page]}>
          {prototype && <div className="preview-banner" role="status" aria-live="polite">
            <ExclamationTriangleIcon />
            <span><b>Chế độ kiểm thử HRM</b> Giao diện đang dùng dữ liệu mẫu cục bộ; phiên chính thức vẫn yêu cầu QTS Identity và dữ liệu HRM từ dịch vụ hệ thống.</span>
          </div>}
          {!online && <div className="runtime-banner" role="status" aria-live="polite">
            <ExclamationTriangleIcon />
            <span><b>Mất kết nối mạng</b> Một số thao tác cần xác thực hoặc dữ liệu mới sẽ chờ đến khi kết nối trở lại.</span>
          </div>}
          <div key={page} className="screen-transition">{screen}</div>
        </main>
      </div>
      <BottomNav page={page} role={activeRole} onNavigate={navigate} onProfile={() => selectEmployee(actorCode)} />
      <GlobalSearch
        open={searchOpen}
        role={activeRole}
        directory={directory}
        onClose={() => setSearchOpen(false)}
        onEmployee={selectEmployee}
        onNavigate={navigate}
      />
      <AuditToast message={auditMessage} action={rejectUndo ? { label: "Hoàn tác", onClick: undoReject } : undefined} />
      <Modal
        open={Boolean(rejectTarget)}
        title="Từ chối yêu cầu"
        onClose={() => { setRejectTarget(null); setRejectReason(""); }}
        initialFocusRef={rejectReasonRef}
        footer={<><Button variant="secondary" onClick={() => { setRejectTarget(null); setRejectReason(""); }}>Hủy</Button><Button variant="danger" disabled={!rejectReason.trim()} onClick={confirmReject}><XCircleIcon /> Xác nhận từ chối</Button></>}
      >
        <p>Ghi rõ lý do để người gửi và nhật ký kiểm tra có đủ ngữ cảnh.</p>
        <label className="form-wide"><span>Lý do từ chối <b aria-hidden="true">*</b></span><textarea ref={rejectReasonRef} value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} rows={4} maxLength={500} placeholder="Ví dụ: Thiếu tài liệu xác nhận ca làm việc." required aria-required="true" aria-label="Lý do từ chối" /></label>
      </Modal>
    </div>
  </AuthorizationProvider>;
}
