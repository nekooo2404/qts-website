import { useEffect, useRef, useState } from "react";
import type { ButtonHTMLAttributes, ReactNode, RefObject } from "react";
import {
  ArrowPathIcon,
  ChevronRightIcon,
  CircleStackIcon,
  EyeIcon,
  LockClosedIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { usePermissionCheck } from "../auth/authorization";
import type { Permission, Role } from "../permissions";

export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

/** Read a :root duration so JS stays in sync with the CSS tokens (and with reduced-motion overrides). */
export function motionMs(name: string, fallback: number) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return 0;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
  return parseFloat(raw) || fallback;
}

/**
 * Keeps a floating surface mounted for the length of its exit animation.
 * Returns [rendered, closing]: render while `rendered`, apply the closing class while `closing`.
 */
export function usePresence(open: boolean, closeVar: string, fallbackMs: number): [boolean, boolean] {
  const [rendered, setRendered] = useState(open);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    if (open) {
      setRendered(true);
      setClosing(false);
      return;
    }
    if (!rendered) return;
    setClosing(true);
    const timer = window.setTimeout(() => {
      setRendered(false);
      setClosing(false);
    }, motionMs(closeVar, fallbackMs));
    return () => window.clearTimeout(timer);
  }, [open, rendered, closeVar, fallbackMs]);
  return [rendered, closing];
}

const FOCUSABLE_SELECTOR = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

function focusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((element) => element.getClientRects().length > 0 && element.getAttribute("aria-hidden") !== "true");
}

function useDialogFocus({
  open,
  rendered,
  closing,
  dialog,
  initialFocus,
  onClose,
}: {
  open: boolean;
  rendered: boolean;
  closing: boolean;
  dialog: RefObject<HTMLElement | null>;
  initialFocus: RefObject<HTMLElement | null>;
  onClose: () => void;
}) {
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) returnFocus.current = activeElement;
  }, [open]);

  useEffect(() => {
    if (!rendered || closing) return;
    const element = dialog.current;
    if (!element) return;
    initialFocus.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = focusableElements(element);
      if (!focusable.length) {
        event.preventDefault();
        element.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!element.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closing, dialog, initialFocus, onClose, rendered]);

  useEffect(() => {
    if (open || rendered) return;
    const element = returnFocus.current;
    if (element?.isConnected) element.focus();
    returnFocus.current = null;
  }, [open, rendered]);
}

export function Button({
  variant = "secondary",
  size = "md",
  loading,
  children,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  loading?: boolean;
}) {
  return <button {...props} type={type} className={cx("button", `button-${variant}`, `button-${size}`, className)} disabled={props.disabled || loading} aria-busy={loading || props["aria-busy"] || undefined}>
    {loading ? <ArrowPathIcon className="spin" aria-hidden="true" /> : null}
    {children}
  </button>;
}

export type BadgeTone = "neutral" | "blue" | "success" | "warning" | "danger" | "info";

export function Badge({ children, tone = "neutral", icon }: { children: ReactNode; tone?: BadgeTone; icon?: ReactNode }) {
  return <span className={`badge badge-${tone}`}>{icon}{children}</span>;
}

export function statusTone(status: string): BadgeTone {
  if (["Đang làm việc", "Đã xác minh", "Approved", "Completed", "Paid", "Active", "Đã đồng bộ"].includes(status)) return "success";
  if (["Thử việc", "Chờ xác minh", "Chờ khóa", "Pending", "Current", "Đã tải lên", "Draft", "Calculated", "Reviewed"].includes(status)) return "warning";
  if (["Nghỉ việc", "Từ chối", "Rejected", "Expired"].includes(status)) return "danger";
  if (["Đang tham gia", "Locked"].includes(status)) return "info";
  return "neutral";
}

const STATUS_LABELS: Record<string, string> = {
  Pending: "Chờ duyệt",
  Approved: "Đã duyệt",
  Rejected: "Từ chối",
  Completed: "Hoàn tất",
  Done: "Hoàn tất",
  Current: "Đang xử lý",
  Waiting: "Chờ xử lý",
  Draft: "Bản nháp",
  Reviewed: "Đã rà soát",
  Locked: "Đã khóa",
  Active: "Đang hiệu lực",
  Expired: "Đã hết hạn",
  Paid: "Đã thanh toán",
  Calculated: "Đã tính",
  "Đã tải lên": "Đã tải lên",
};

const LOCALIZED_STATUSES = new Set([
  "Chờ nhận việc",
  "Thử việc",
  "Đang làm việc",
  "Tạm hoãn HĐ",
  "Nghỉ thai sản",
  "Nghỉ không lương",
  "Nghỉ việc",
  "Chờ xác minh",
  "Đã xác minh",
  "Từ chối",
  "Đang đánh giá",
  "Đang mở",
  "Đã gửi",
]);

export function statusLabel(status: string) {
  return STATUS_LABELS[status] ?? (LOCALIZED_STATUSES.has(status) ? status : "Trạng thái khác");
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone(status)}>{statusLabel(status)}</Badge>;
}

export function Card({ children, className = "", title, action, description }: { children: ReactNode; className?: string; title?: string; description?: string; action?: ReactNode }) {
  return <section className={cx("card", className)}>
    {(title || action) && <header className="card-header">
      <div>{title && <h2>{title}</h2>}{description && <p>{description}</p>}</div>
      {action}
    </header>}
    {children}
  </section>;
}

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
}: {
  title: string;
  description?: string;
  breadcrumb?: string[];
  actions?: ReactNode;
}) {
  return <header className="page-header">
    <div>
      {breadcrumb && <nav className="breadcrumb" aria-label="Breadcrumb">{breadcrumb.map((item, index) => <span key={`${item}-${index}`}>{index > 0 && <ChevronRightIcon aria-hidden="true" />}{item}</span>)}</nav>}
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
    {actions && <div className="page-actions">{actions}</div>}
  </header>;
}

export function StatTile({ label, value, detail, tone = "blue" }: { label: string; value: string; detail: string; tone?: BadgeTone }) {
  return <article className="stat-tile">
    <p>{label}</p>
    <strong>{value}</strong>
    <span className={`stat-detail stat-${tone}`}>{detail}</span>
  </article>;
}

export function EmptyState({ title = "Chưa có dữ liệu", detail = "Không có bản ghi thuộc phạm vi dữ liệu hiện tại.", action, icon, animate = false }: { title?: string; detail?: string; action?: ReactNode; icon?: ReactNode; animate?: boolean }) {
  return <div className={cx("empty-state", animate && "animate__animated animate__fadeIn animate__faster")} role="status">
    <span className="empty-state-icon" aria-hidden="true">{icon ?? <CircleStackIcon />}</span>
    <strong>{title}</strong>
    <span>{detail}</span>
    {action ? <div className="empty-state-action">{action}</div> : null}
  </div>;
}

export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cx("skeleton", className)} style={style} aria-hidden="true" />;
}

export function PermissionGate({
  role,
  permission,
  children,
  fallback,
}: {
  role: Role;
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const canAccess = usePermissionCheck(role);
  return canAccess(permission) ? <>{children}</> : <>{fallback ?? null}</>;
}

export function DataMask({
  label,
  value,
  masked,
  permission,
  role,
  onReveal,
}: {
  label: string;
  value: string;
  masked: string;
  permission: Permission;
  role: Role;
  onReveal?: () => void;
}) {
  const canAccess = usePermissionCheck(role);
  const allowed = canAccess(permission);
  const [revealed, setRevealed] = useState(false);
  const showing = revealed ? value : masked;
  const [shown, setShown] = useState(showing);
  const swapEl = useRef<HTMLElement | null>(null);
  const entering = useRef(false);
  // Text states swap (transitions-dev 04): exit the masked text, then let React commit the revealed one and animate it back in.
  useEffect(() => {
    if (showing === shown) return;
    const el = swapEl.current;
    if (!el) { setShown(showing); return; }
    el.classList.add("is-exit");
    const t = window.setTimeout(() => { entering.current = true; setShown(showing); }, motionMs("--text-swap-dur", 150));
    return () => { window.clearTimeout(t); el.classList.remove("is-exit"); };
  }, [showing, shown]);
  const attachSwap = (el: HTMLElement | null) => {
    swapEl.current = el;
    if (!el || !entering.current) return;
    entering.current = false;
    el.classList.add("is-enter-start");
    void el.offsetHeight; // force reflow so the enter transition plays
    el.classList.remove("is-enter-start");
  };
  if (!allowed) {
    return <div className="data-field sensitive-field">
      <span>{label}</span>
      <div>
        <b>Không có quyền xem</b>
        <LockClosedIcon className="locked-icon" aria-label="Dữ liệu bảo mật" />
      </div>
    </div>;
  }
  const canReveal = !revealed && masked !== value;
  return <div className="data-field sensitive-field">
    <span>{label}</span>
    <div>
      <b ref={attachSwap} className="text-swap">{shown}</b>
      {canReveal ? <button type="button" className="inline-icon" title={`Xem ${label}`} aria-label={`Xem ${label}`} onClick={() => { setRevealed(true); onReveal?.(); }}><EyeIcon /></button> : null}
    </div>
  </div>;
}

export function Drawer({
  open,
  title,
  children,
  onClose,
  footer,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
}) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLElement>(null);
  const [rendered, closing] = usePresence(open, "--panel-close-dur", 350);
  useDialogFocus({ open, rendered, closing, dialog: drawer, initialFocus: closeButton, onClose });
  if (!rendered) return null;
  return <div className={closing ? "drawer-backdrop is-closing" : "drawer-backdrop"} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <aside ref={drawer} tabIndex={-1} className={closing ? "drawer is-closing" : "drawer"} role="dialog" aria-modal="true" aria-label={title}>
      <header><h2>{title}</h2><button ref={closeButton} type="button" className="inline-icon" onClick={onClose} aria-label="Đóng"><XMarkIcon /></button></header>
      <div className="drawer-body">{children}</div>
      {footer && <footer className="drawer-footer">{footer}</footer>}
    </aside>
  </div>;
}

export function Modal({
  open,
  title,
  children,
  onClose,
  footer,
  initialFocusRef,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  initialFocusRef?: RefObject<HTMLElement | null>;
}) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const modal = useRef<HTMLElement>(null);
  const [rendered, closing] = usePresence(open, "--modal-close-dur", 150);
  useDialogFocus({ open, rendered, closing, dialog: modal, initialFocus: initialFocusRef ?? closeButton, onClose });
  if (!rendered) return null;
  return <div className={closing ? "modal-backdrop is-closing" : "modal-backdrop"} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={modal} tabIndex={-1} className={closing ? "modal is-closing" : "modal"} role="dialog" aria-modal="true" aria-label={title}>
      <header><h2>{title}</h2><button ref={closeButton} type="button" className="inline-icon" onClick={onClose} aria-label="Đóng"><XMarkIcon /></button></header>
      <div className="modal-body">{children}</div>
      {footer && <footer className="modal-footer">{footer}</footer>}
    </section>
  </div>;
}

export function SecurityNote({ children }: { children: ReactNode }) {
  return <div className="security-note"><LockClosedIcon aria-hidden="true" /><span>{children}</span></div>;
}

export function AuditToast({
  message,
  action,
}: {
  message: string | null;
  action?: { label: string; onClick: () => void };
}) {
  const [rendered, setRendered] = useState<string | null>(message);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    if (message) { setRendered(message); setClosing(false); return; }
    if (!rendered) return;
    setClosing(true);
    const t = window.setTimeout(() => { setRendered(null); setClosing(false); }, motionMs("--toast-close", 250));
    return () => window.clearTimeout(t);
  }, [message, rendered]);
  if (!rendered) return null;
  return <div className={closing ? "audit-toast is-closing" : "audit-toast is-open"} role="status" aria-live="polite">
    <LockClosedIcon aria-hidden="true" />
    <span>{rendered}</span>
    {action && <button type="button" className="audit-toast-action" onClick={action.onClick}>{action.label}</button>}
  </div>;
}

export function IconButton({ label, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return <button {...props} type={props.type ?? "button"} className={cx("icon-button", props.className)} aria-label={label} title={label}>{children}</button>;
}
