import { useEffect, useRef, useState, type ComponentType, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, type SVGProps } from "react";
import {
  ArrowRightOnRectangleIcon,
  ArrowTopRightOnSquareIcon,
  BellIcon,
  BuildingOffice2Icon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

export type AppChromeApplication = {
  id: string;
  name: string;
  description?: string;
  href?: string;
  current?: boolean;
  kind?: "portal" | "hrm" | "app";
  onSelect?: () => void;
};

export type AppChromeNotification = {
  id: string;
  title: string;
  detail?: string;
  tone?: "info" | "warning" | "danger";
  onSelect?: () => void;
};

export type AppChromeUser = {
  name: string;
  email?: string;
  role?: string;
  initials?: string;
};

export type AppHeaderProps = {
  searchPlaceholder: string;
  searchLabel?: string;
  shortcutLabel?: string;
  onSearch: () => void;
  searchControls?: string;
  searchExpanded?: boolean;
  applications: AppChromeApplication[];
  notifications?: AppChromeNotification[];
  notificationSummary?: string;
  user: AppChromeUser;
  onLogout?: () => void;
  className?: string;
  children?: ReactNode;
};

type HeaderSurface = "applications" | "notifications" | "profile" | null;
type Icon = ComponentType<SVGProps<SVGSVGElement>>;

function initialsFor(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "QT";
}

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function applicationIcon(kind: AppChromeApplication["kind"]): Icon {
  if (kind === "hrm") return UserGroupIcon;
  if (kind === "portal") return BuildingOffice2Icon;
  return Squares2X2Icon;
}

function surfaceClass(base: string, surface: HeaderSurface, current: Exclude<HeaderSurface, null>) {
  return classNames(base, surface === current && `${base}--active`);
}

export function AppHeader({
  searchPlaceholder,
  searchLabel = searchPlaceholder,
  shortcutLabel = "⌘ K",
  onSearch,
  searchControls,
  searchExpanded,
  applications,
  notifications = [],
  notificationSummary,
  user,
  onLogout,
  className,
  children,
}: AppHeaderProps) {
  const [surface, setSurface] = useState<HeaderSurface>(null);
  const [focusFirstItemOnOpen, setFocusFirstItemOnOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<Record<Exclude<HeaderSurface, null>, HTMLButtonElement | null>>({
    applications: null,
    notifications: null,
    profile: null,
  });
  const initials = user.initials ?? initialsFor(user.name);
  const hasNotifications = notifications.length > 0;
  const closeSurface = (restoreFocus = false) => {
    const closingSurface = surface;
    setSurface(null);
    setFocusFirstItemOnOpen(false);
    if (restoreFocus && closingSurface) {
      window.setTimeout(() => triggerRefs.current[closingSurface]?.focus(), 0);
    }
  };
  const toggle = (next: Exclude<HeaderSurface, null>) => {
    setFocusFirstItemOnOpen(false);
    setSurface(current => current === next ? null : next);
  };
  const openSurfaceFromKeyboard = (event: ReactKeyboardEvent<HTMLButtonElement>, next: Exclude<HeaderSurface, null>) => {
    if (!["ArrowDown", "Enter", " "].includes(event.key)) return;
    event.preventDefault();
    setFocusFirstItemOnOpen(true);
    setSurface(next);
  };

  useEffect(() => {
    if (!surface) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSurface(true);
      }
    };
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (target && !headerRef.current?.contains(target)) closeSurface();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [surface]);

  useEffect(() => {
    if (!surface || !focusFirstItemOnOpen) return;
    const focusTimer = window.setTimeout(() => {
      popoverRef.current?.querySelector<HTMLElement>("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])")?.focus();
    }, 0);
    return () => window.clearTimeout(focusTimer);
  }, [focusFirstItemOnOpen, surface]);

  return <header className={classNames("qts-app-header", className)} ref={headerRef}>
    <button type="button" className="qts-app-search" onClick={() => { closeSurface(); onSearch(); }} aria-label={searchLabel} aria-controls={searchControls} aria-expanded={searchExpanded} aria-haspopup={searchControls ? "dialog" : undefined}>
      <MagnifyingGlassIcon aria-hidden="true" />
      <span>{searchPlaceholder}</span>
      <kbd>{shortcutLabel}</kbd>
    </button>

    <div className="qts-app-actions">
      {children}
      <div className="qts-app-popover-shell">
        <button type="button" ref={node => { triggerRefs.current.applications = node; }} className={surfaceClass("qts-app-icon-button", surface, "applications")} onClick={() => toggle("applications")} onKeyDown={event => openSurfaceFromKeyboard(event, "applications")} aria-label="Ứng dụng QTS" aria-haspopup="menu" aria-controls={surface === "applications" ? "qts-app-switcher-popover" : undefined} aria-expanded={surface === "applications"}>
          <Squares2X2Icon aria-hidden="true" />
        </button>
        {surface === "applications" && <div ref={popoverRef} id="qts-app-switcher-popover" className="qts-app-popover qts-app-switcher" role="menu" aria-label="Ứng dụng QTS">
          <header><b>Ứng dụng QTS</b><small>Ứng dụng được cấp</small></header>
          {applications.length > 0 ? applications.map(application => {
            const ApplicationIcon = applicationIcon(application.kind);
            const body = <><span className={classNames("qts-app-switcher-icon", application.current && "qts-app-switcher-icon--current")}><ApplicationIcon aria-hidden="true" /></span><span><b>{application.name}</b><small>{application.current ? "Ứng dụng hiện tại" : application.description}</small></span>{!application.current && application.href && <ArrowTopRightOnSquareIcon className="qts-app-switcher-arrow" aria-hidden="true" />}</>;
            if (application.current || !application.href) {
              return <button type="button" role="menuitem" key={application.id} aria-current={application.current ? "page" : undefined} onClick={() => { application.onSelect?.(); closeSurface(); }}>{body}</button>;
            }
            return <a href={application.href} role="menuitem" key={application.id} onClick={() => closeSurface()}>{body}</a>;
          }) : <div className="qts-app-empty-state" role="status">
            <Squares2X2Icon aria-hidden="true" />
            <b>Chưa có ứng dụng được cấp</b>
            <p>Khi QTS Identity cấp thêm quyền truy cập, ứng dụng sẽ xuất hiện tại đây.</p>
          </div>}
        </div>}
      </div>

      <div className="qts-app-popover-shell">
        <button type="button" ref={node => { triggerRefs.current.notifications = node; }} className={surfaceClass("qts-app-icon-button", surface, "notifications")} onClick={() => toggle("notifications")} onKeyDown={event => openSurfaceFromKeyboard(event, "notifications")} aria-label="Thông báo" aria-haspopup="dialog" aria-controls={surface === "notifications" ? "qts-app-notifications-popover" : undefined} aria-expanded={surface === "notifications"}>
          <BellIcon aria-hidden="true" />
          {hasNotifications && <i className="qts-app-notification-dot" aria-hidden="true" />}
        </button>
        {surface === "notifications" && <div ref={popoverRef} id="qts-app-notifications-popover" className="qts-app-popover qts-app-notifications" role="dialog" aria-label="Thông báo">
          <header><span><b>Thông báo</b><small>{notificationSummary ?? "Cập nhật dành cho tài khoản của bạn"}</small></span>{hasNotifications && <em>{notifications.length}</em>}</header>
          {hasNotifications ? notifications.map(item => <button type="button" key={item.id} className={`qts-app-notification qts-app-notification--${item.tone ?? "info"}`} onClick={() => { item.onSelect?.(); closeSurface(); }}>
            <ShieldCheckIcon aria-hidden="true" />
            <span><b>{item.title}</b>{item.detail && <small>{item.detail}</small>}</span>
          </button>) : <div className="qts-app-empty-state" role="status">
            <BellIcon aria-hidden="true" />
            <b>Chưa có thông báo mới</b>
            <p>Khi có cập nhật được phép xem, nội dung sẽ hiển thị tại đây.</p>
          </div>}
        </div>}
      </div>

      <div className="qts-app-popover-shell">
        <button type="button" ref={node => { triggerRefs.current.profile = node; }} className={surfaceClass("qts-app-profile-button", surface, "profile")} onClick={() => toggle("profile")} onKeyDown={event => openSurfaceFromKeyboard(event, "profile")} aria-label={`Hồ sơ ${user.name}`} aria-haspopup="menu" aria-controls={surface === "profile" ? "qts-app-profile-popover" : undefined} aria-expanded={surface === "profile"}>
          <span className="qts-app-avatar" aria-hidden="true">{initials}</span>
          <span><b>{user.name}</b>{user.role && <small>{user.role}</small>}</span>
          <ChevronDownIcon aria-hidden="true" />
        </button>
        {surface === "profile" && <div ref={popoverRef} id="qts-app-profile-popover" className="qts-app-popover qts-app-profile-popover" role="menu" aria-label="Tài khoản">
          <div className="qts-app-profile-summary">
            <span className="qts-app-avatar qts-app-avatar--lg" aria-hidden="true">{initials}</span>
            <span><b>{user.name}</b>{user.email && <small>{user.email}</small>}</span>
          </div>
          {user.role && <p><ShieldCheckIcon aria-hidden="true" /> Vai trò do QTS Identity cấp: {user.role}</p>}
          {onLogout && <button type="button" role="menuitem" className="qts-app-signout" onClick={() => { closeSurface(); onLogout(); }}>
            <ArrowRightOnRectangleIcon aria-hidden="true" /> Đăng xuất
          </button>}
        </div>}
      </div>
    </div>
  </header>;
}
