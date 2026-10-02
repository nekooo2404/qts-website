"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowPathIcon,
  ArrowRightIcon,
  ComputerDesktopIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  LockClosedIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { identityPath } from "@/lib/base-path";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

type Message = { id?: number; text: string; type?: string };
type Node = {
  type: string;
  group: string;
  messages?: Message[];
  meta?: { label?: Message };
  attributes: {
    name?: string;
    type?: string;
    value?: string | boolean;
    required?: boolean;
    disabled?: boolean;
    autocomplete?: string;
    src?: string;
    text?: Message;
  };
};
type Flow = { id: string; return_to?: string; ui: { action: string; method: string; nodes: Node[]; messages?: Message[] } };
type BrowserFlow = Flow & { refresh?: boolean };
type IdentityResponse = Partial<Flow> & {
  redirect_browser_to?: string;
  error?: { id?: string; message?: string; reason?: string };
  message?: string;
  reason?: string;
};
type ActiveIdentitySession = {
  authenticated?: boolean;
  user?: { id?: string; email?: string; name?: string };
};
type Kind = "login" | "settings" | "recovery" | "verification";
type AuthMode = "sso" | "local";

const titles: Record<Kind, string> = {
  login: "Đăng nhập QTS",
  settings: "Bảo mật tài khoản",
  recovery: "Khôi phục tài khoản",
  verification: "Xác minh email",
};

const subtitles: Record<Kind, string> = {
  login: "Một tài khoản cho các ứng dụng được tổ chức cấp quyền.",
  settings: "Quản lý mật khẩu, mã dự phòng và thiết bị bảo mật của bạn.",
  recovery: "Khôi phục quyền truy cập bằng quy trình bảo mật của QTS.",
  verification: "Hoàn tất xác minh email trước khi sử dụng hệ sinh thái QTS.",
};

const labels: Record<string, string> = {
  identifier: "Email hoặc tên đăng nhập",
  email: "Email công việc",
  password: "Mật khẩu",
  "traits.email": "Email công việc",
  "traits.name": "Họ và tên",
  totp_code: "Mã xác thực 6 số",
  code: "Mã xác nhận",
};

const routeForKind: Record<Kind, string> = { login: "/login", settings: "/settings", recovery: "/recovery", verification: "/verification" };
const loginModeStorageKey = "qts.identity.login_mode";

const textTranslations: Record<string, string> = {
  Password: "Mật khẩu",
  "Sign in with password": "Đăng nhập bằng tài khoản nội bộ",
  "Sign in with passkey": "Đăng nhập bằng khóa bảo mật",
  "Use Authenticator": "Dùng ứng dụng xác thực",
  Submit: "Tiếp tục",
  Continue: "Tiếp tục",
  "The provided credentials are invalid, check for spelling mistakes in your password or username, email address, or phone number.": "Thông tin đăng nhập chưa đúng. Vui lòng kiểm tra lại.",
  "Could not find a strategy to log you in with. Did you fill out the form correctly?": "Thông tin đăng nhập chưa đầy đủ. Vui lòng kiểm tra lại.",
  "The login flow expired. Please try again.": "Phiên đăng nhập đã hết hạn vì lý do bảo mật.",
  "Please confirm this action by verifying that it is you.": "Vui lòng xác nhận lại để tiếp tục.",
  "Please complete the second authentication challenge.": "Phiên hiện tại đang yêu cầu xác thực bổ sung.",
};

function translateIdentityText(text?: string) {
  if (!text) return "";
  const normalized = text.trim();
  return textTranslations[normalized] ?? text;
}

function groupLabel(group: string) {
  if (group === "password") return "Đăng nhập bằng email công việc";
  if (group === "totp") return "Nhập mã xác thực";
  if (group === "lookup_secret") return "Mã dự phòng";
  if (group === "code") return "Mã xác nhận";
  if (group === "passkey") return "Khóa bảo mật";
  if (group === "oidc") return "Đăng nhập một lần";
  return translateIdentityText(group);
}

function submitLabel(node: Node, group: string) {
  const method = String(node.attributes.value ?? "");
  if (group === "password" || method === "password") return "Đăng nhập";
  if (group === "totp" || method === "totp") return "Xác nhận mã";
  if (group === "lookup_secret" || method === "lookup_secret") return "Dùng mã dự phòng";
  if (group === "oidc" || method === "oidc") return translateIdentityText(node.meta?.label?.text) || "Tiếp tục";
  return translateIdentityText(node.meta?.label?.text) || "Tiếp tục";
}

async function readIdentityResponse(response: Response): Promise<IdentityResponse | null> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return null;
  try {
    return await response.json() as IdentityResponse;
  } catch {
    return null;
  }
}

function firstIdentityError(result: IdentityResponse | null) {
  const message = result?.ui?.messages?.find(item => item.type === "error") ?? result?.ui?.messages?.[0];
  if (message?.text) return translateIdentityText(message.text);
  for (const node of result?.ui?.nodes ?? []) {
    const nodeMessage = node.messages?.find(item => item.type === "error") ?? node.messages?.[0];
    if (nodeMessage?.text) return translateIdentityText(nodeMessage.text);
  }
  return translateIdentityText(result?.error?.reason ?? result?.error?.message ?? result?.reason ?? result?.message ?? "");
}

function isRestartableError(message: string) {
  const normalized = message.toLocaleLowerCase("vi-VN");
  return normalized.includes("hết hạn") || normalized.includes("bắt đầu lại") || normalized.includes("không tải được yêu cầu");
}

function isPermissionError(message: string) {
  const normalized = message.toLocaleLowerCase("vi-VN");
  return normalized.includes("quyền") || normalized.includes("permission") || normalized.includes("forbidden");
}

function makeSupportContext() {
  const randomPart = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().slice(0, 8).toUpperCase()
    : Math.random().toString(16).slice(2, 10).toUpperCase();
  return { correlationId: `QTS-ID-${randomPart}`, timestamp: new Date().toISOString() };
}

function buildFormBody(form: HTMLFormElement, submitter: SubmitEvent["submitter"]) {
  const data = new FormData(form, submitter);
  const body = new URLSearchParams();
  for (const [key, value] of data.entries()) {
    if (typeof value === "string") body.append(key, value);
  }
  return body;
}

function normalizeLoginIdentifier(value?: string) {
  return (value ?? "").trim().toLocaleLowerCase("vi-VN");
}

function emailLocalPart(value?: string) {
  const normalized = normalizeLoginIdentifier(value);
  return normalized.includes("@") ? normalized.split("@")[0] : "";
}

function sessionMatchesIdentifier(session: ActiveIdentitySession, identifier: string) {
  const target = normalizeLoginIdentifier(identifier);
  if (!target || session.authenticated !== true) return false;
  const email = normalizeLoginIdentifier(session.user?.email);
  const accepted = [session.user?.id, session.user?.email, emailLocalPart(email)].map(normalizeLoginIdentifier).filter(Boolean);
  return accepted.includes(target);
}

function firstIdentifierFromFlow(flow: Flow | null) {
  const node = flow?.ui.nodes.find(item => ["identifier", "email", "traits.email"].includes(item.attributes.name ?? "") && typeof item.attributes.value === "string");
  return typeof node?.attributes.value === "string" ? node.attributes.value : "";
}

function isRefreshFlow(flow: BrowserFlow | null) {
  return flow?.refresh === true;
}

function isSecondAuthenticationChallenge(flow: Flow | null) {
  const messages = [
    ...(flow?.ui.messages ?? []),
    ...(flow?.ui.nodes.flatMap(node => node.messages ?? []) ?? []),
  ];
  return messages.some(message => message.text.toLocaleLowerCase("en-US").includes("second authentication challenge"));
}

function buildBrowserFlowUrl(api: string, kind: Kind, returnTo: string | null) {
  const query = new URLSearchParams();
  if (returnTo) query.set("return_to", returnTo);
  const suffix = query.toString();
  return `${api}/self-service/${kind}/browser${suffix ? `?${suffix}` : ""}`;
}

function rememberLoginMode(mode: AuthMode) {
  try {
    window.sessionStorage.setItem(loginModeStorageKey, mode);
  } catch {
    // Private browsing or storage policies should not block login.
  }
}

function readRememberedLoginMode(): AuthMode | null {
  try {
    const mode = window.sessionStorage.getItem(loginModeStorageKey);
    return mode === "local" || mode === "sso" ? mode : null;
  } catch {
    return null;
  }
}

function BrandHeader() {
  return <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 pt-5 sm:px-6 lg:px-8">
    <Link href={identityPath("/launcher")} className="flex items-center gap-3" aria-label="Trung tâm định danh QTS">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-panel">
        <ShieldCheckIcon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="grid leading-tight">
        <b className="text-sm font-bold tracking-[-0.03em] text-foreground">QTS</b>
        <small className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Trung tâm định danh</small>
      </span>
    </Link>
    <div className="flex items-center gap-2">
      <Badge tone="success" className="hidden sm:inline-flex">Sẵn sàng</Badge>
    </div>
  </header>;
}

function AuthenticationSelector({ mode, onMode, onRestart }: { mode: AuthMode; onMode: (mode: AuthMode) => void; onRestart: () => void }) {
  const options: Array<{ mode: AuthMode; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }> = [
    { mode: "sso", label: "Đăng nhập một lần", icon: ShieldCheckIcon },
    { mode: "local", label: "Tài khoản nội bộ", icon: KeyIcon },
  ];
  return <div className="space-y-3" role="tablist" aria-label="Chọn phương thức đăng nhập">
    <div className="grid grid-cols-2 gap-2">
    {options.map(option => {
      const Icon = option.icon;
      const selected = mode === option.mode;
      return <button key={option.mode} type="button" role="tab" aria-selected={selected} onClick={() => onMode(option.mode)} className={cn("flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-center text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", selected ? "border-primary bg-primary text-primary-foreground shadow-panel" : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-muted")}>
        <span className={cn("grid h-7 w-7 place-items-center rounded-lg", selected ? "bg-white/10 text-primary-foreground" : "bg-muted text-primary")}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span>{option.label}</span>
      </button>;
    })}
    </div>
    <button type="button" onClick={onRestart} className="w-full text-center text-xs font-semibold text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      Dùng tài khoản khác
    </button>
  </div>;
}

function SecureSessionProgress() {
  return <Alert tone="info" className="flex items-center gap-2">
    <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
    <span>Đang hoàn tất đăng nhập...</span>
  </Alert>;
}

function SsoBrowserFlow({ hasOidcGroup }: { hasOidcGroup: boolean }) {
  if (!hasOidcGroup) return <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
    <ShieldCheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
    <span>Nếu bạn đã đăng nhập QTS trên trình duyệt này, chỉ cần nhập ID hoặc email công việc để mở lại phiên.</span>
  </div>;
  return <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
    <ShieldCheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
    <span>QTS sẽ đưa bạn về ứng dụng đang yêu cầu đăng nhập sau khi xác minh thành công.</span>
  </div>;
}

function SingleSignOnResume({
  identifier,
  onIdentifierChange,
  onSubmit,
  busy,
  error,
  onLocalLogin,
}: {
  identifier: string;
  onIdentifierChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  busy: boolean;
  error: string;
  onLocalLogin: () => void;
}) {
  return <form onSubmit={onSubmit} aria-busy={busy} aria-label="Đăng nhập một lần" className="space-y-4">
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground">Vào bằng đăng nhập một lần</h3>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">Dành cho tài khoản đã tạo phiên QTS trên trình duyệt này.</p>
      <div className="mt-4 grid gap-2">
        <label className="text-sm font-semibold text-foreground" htmlFor="sso-identifier">ID hoặc email công việc</label>
        <Input
          id="sso-identifier"
          name="sso_identifier"
          type="text"
          value={identifier}
          onChange={event => onIdentifierChange(event.target.value)}
          autoComplete="username"
          required
          disabled={busy}
          aria-describedby={error ? "sso-identifier-error" : undefined}
          aria-invalid={Boolean(error) || undefined}
        />
        {error && <p id="sso-identifier-error" className="text-xs leading-5 text-destructive" role="alert">{error}</p>}
      </div>
      <div className="mt-4 grid gap-3">
        <Button className="w-full" type="submit" disabled={busy} aria-disabled={busy || undefined}>
          {busy ? "Đang kiểm tra..." : "Vào hệ thống"} <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
        </Button>
        <button type="button" onClick={onLocalLogin} className="text-center text-sm font-semibold text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Lần đầu hoặc phiên đã hết hạn? Nhập email và mật khẩu
        </button>
      </div>
    </div>
  </form>;
}

function LocalLoginNotice() {
  return <Alert tone="info">
    Tài khoản nội bộ luôn yêu cầu email và mật khẩu cho mỗi lần đăng nhập.
  </Alert>;
}

function SecurityNotice() {
  return <div className="flex items-start gap-2 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
    <ComputerDesktopIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
    <span>Mật khẩu chỉ được xử lý tại trung tâm định danh QTS, không lưu trong ứng dụng nghiệp vụ.</span>
  </div>;
}

function SessionExpiredState({ onRestart }: { onRestart: () => void }) {
  return <Alert tone="warning" className="space-y-4">
    <div className="flex items-start gap-3">
      <ExclamationTriangleIcon className="mt-0.5 h-5 w-5" aria-hidden="true" />
      <div>
        <h2 className="font-semibold">Phiên đăng nhập đã hết hạn vì lý do bảo mật.</h2>
        <p className="mt-1">Yêu cầu cũ không còn dùng được. Hãy tạo phiên mới rồi đăng nhập lại.</p>
      </div>
    </div>
    <div className="grid gap-2 sm:grid-cols-2">
      <Button type="button" onClick={onRestart}>Đăng nhập lại</Button>
      <ButtonLink variant="secondary" href={identityPath("/launcher")}>Về trung tâm ứng dụng</ButtonLink>
    </div>
  </Alert>;
}

function ServiceUnavailableState({ support, message }: { support: { correlationId: string; timestamp: string }; message: string }) {
  return <Alert tone="danger" className="space-y-4">
    <div className="flex items-start gap-3">
      <ExclamationTriangleIcon className="mt-0.5 h-5 w-5" aria-hidden="true" />
      <div>
        <h2 className="font-semibold">Dịch vụ đăng nhập đang bảo trì hoặc không phản hồi.</h2>
        <p className="mt-1">{message || "Không kết nối được trang đăng nhập. Vui lòng thử lại sau."}</p>
      </div>
    </div>
    <dl className="grid gap-2 rounded-xl bg-background/70 p-3 text-xs sm:grid-cols-2">
      <div><dt className="font-semibold">Mã hỗ trợ</dt><dd className="font-mono">{support.correlationId}</dd></div>
      <div><dt className="font-semibold">Thời điểm</dt><dd className="font-mono">{support.timestamp}</dd></div>
      <div className="sm:col-span-2"><dt className="font-semibold">Cần hỗ trợ?</dt><dd>Gửi mã hỗ trợ này cho quản trị viên QTS.</dd></div>
    </dl>
  </Alert>;
}

function PermissionDeniedState() {
  return <Alert tone="warning" className="flex items-start gap-3">
    <LockClosedIcon className="mt-0.5 h-5 w-5" aria-hidden="true" />
    <div>
      <b>Bạn chưa được cấp quyền truy cập chức năng này.</b>
      <p className="mt-1">Quyền truy cập được quản lý bởi quản trị viên tổ chức. Vui lòng liên hệ quản trị viên nếu bạn cần thêm quyền.</p>
    </div>
  </Alert>;
}

function renderNodeMessages(node: Node, describedBy: string, outerError: string) {
  const messages = node.messages?.map((m, i) => ({ ...m, text: translateIdentityText(m.text), key: i })).filter(m => m.text && m.text !== outerError);
  if (!messages?.length) return null;
  return <div id={describedBy} className="mt-2 grid gap-1">{messages.map(m => <p className="text-xs text-destructive" key={m.key} role="alert">{m.text}</p>)}</div>;
}

export function SignInForm({ kind = "login", emailFlowsEnabled = false, enrollmentRequired = false }: { kind?: Kind; emailFlowsEnabled?: boolean; enrollmentRequired?: boolean }) {
  const [flow, setFlow] = useState<Flow | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<AuthMode>("sso");
  const [ssoIdentifier, setSsoIdentifier] = useState("");
  const [ssoResumeError, setSsoResumeError] = useState("");
  const [support] = useState(makeSupportContext);
  const restartableError = Boolean(error && isRestartableError(error));
  const permissionError = Boolean(error && isPermissionError(error));

  const groups = useMemo(() => [...new Set(flow?.ui.nodes.map(node => node.group).filter(group => group !== "default") ?? [])], [flow]);
  const ssoGroups = groups.filter(group => group === "oidc");
  const localGroups = groups.filter(group => group !== "oidc");
  const secondAuthenticationChallenge = isSecondAuthenticationChallenge(flow);

  function navigate(target: string) {
    const destination = new URL(target, window.location.origin);
    if (destination.origin !== window.location.origin || !destination.pathname.startsWith(identityPath("/"))) throw new Error("Chuyển hướng không hợp lệ.");
    window.location.assign(destination.toString());
  }

  function selectMode(nextMode: AuthMode) {
    setSsoResumeError("");
    rememberLoginMode(nextMode);
    setMode(nextMode);
  }

  function restartLogin() {
    const destination = new URL(identityPath(routeForKind[kind]), window.location.origin);
    destination.searchParams.set("restart", Date.now().toString(36));
    if (kind === "login") {
      rememberLoginMode(mode);
      destination.searchParams.set("mode", mode);
    }
    const returnTo = new URLSearchParams(window.location.search).get("return_to") ?? flow?.return_to;
    if (returnTo) {
      try {
        const target = new URL(returnTo, window.location.origin);
        if (target.origin === window.location.origin && target.pathname.startsWith(identityPath("/"))) {
          destination.searchParams.set("return_to", target.toString());
        }
      } catch {
        // Ignore malformed continuation while restarting the sign-in page.
      }
    }
    window.location.assign(destination.toString());
  }

  async function resumeSingleSignOn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const identifier = ssoIdentifier.trim();
    if (!identifier) {
      setSsoResumeError("Vui lòng nhập ID hoặc email công việc.");
      return;
    }
    setBusy(true);
    setError("");
    setSsoResumeError("");
    try {
      const response = await fetch(identityPath("/identity-api/api/session"), {
        credentials: "include",
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
      const session = await response.json().catch(() => null) as ActiveIdentitySession | null;
      if (!response.ok || !session?.authenticated) {
        selectMode("local");
        setSsoResumeError("Phiên đăng nhập một lần chưa sẵn sàng. Vui lòng nhập email và mật khẩu để tạo phiên mới.");
        return;
      }
      if (!sessionMatchesIdentifier(session, identifier)) {
        setSsoResumeError("ID không khớp với phiên đang mở trên trình duyệt này. Hãy dùng tài khoản khác hoặc nhập lại.");
        return;
      }
      navigate(flow?.return_to ?? identityPath("/launcher"));
    } catch {
      selectMode("local");
      setSsoResumeError("Chưa kiểm tra được phiên đăng nhập một lần. Vui lòng nhập email và mật khẩu để tạo phiên mới.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !flow) return;
    const body = buildFormBody(event.currentTarget, (event.nativeEvent as SubmitEvent).submitter);
    setBusy(true);
    setError("");
    setSsoResumeError("");
    try {
      const response = await fetch(flow.ui.action, {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(15000),
      });
      if (response.redirected) {
        navigate(response.url);
        return;
      }
      const result = await readIdentityResponse(response);
      if (result?.redirect_browser_to) {
        navigate(result.redirect_browser_to);
        return;
      }
      if (result?.ui) {
        setFlow({ ...result, id: result.id ?? flow.id, return_to: result.return_to ?? flow.return_to, ui: result.ui });
        const nextError = response.ok ? "" : firstIdentityError(result);
        if (nextError) setError(nextError);
        return;
      }
      if (!response.ok) throw new Error(firstIdentityError(result) || "Không hoàn tất được xác thực. Vui lòng thử lại.");
      navigate(flow.return_to ?? identityPath("/launcher"));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không kết nối được trang đăng nhập.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (kind !== "login") return;
    const requestedMode = new URLSearchParams(window.location.search).get("mode");
    if (requestedMode === "local" || requestedMode === "sso") {
      rememberLoginMode(requestedMode);
      setMode(requestedMode);
      return;
    }
    const rememberedMode = readRememberedLoginMode();
    if (rememberedMode) setMode(rememberedMode);
  }, [kind]);

  useEffect(() => {
    if (!flow || ssoIdentifier) return;
    const identifier = firstIdentifierFromFlow(flow);
    if (identifier) setSsoIdentifier(identifier);
  }, [flow, ssoIdentifier]);

  useEffect(() => {
    const abort = new AbortController();
    const params = new URLSearchParams(window.location.search);
    const id = params.get("flow");
    const api = identityPath("/kratos");
    let safeReturnTo: string | null = null;
    const returnTo = params.get("return_to");
    if (returnTo) {
      try {
        const target = new URL(returnTo, window.location.origin);
        if (target.origin === window.location.origin && target.pathname.startsWith(identityPath("/"))) safeReturnTo = target.toString();
      } catch {
        // A malformed external continuation must not prevent starting login.
      }
    }
    if (!id) {
      window.location.replace(buildBrowserFlowUrl(api, kind, safeReturnTo));
      return () => abort.abort();
    }
    void fetch(`${api}/self-service/${kind}/flows?id=${encodeURIComponent(id)}`, { credentials: "same-origin", signal: abort.signal, cache: "no-store" })
      .then(async response => {
        if ([404, 410].includes(response.status)) throw new Error("Phiên đăng nhập đã hết hạn vì lý do bảo mật.");
        if (!response.ok) throw new Error("Không chuẩn bị được trang đăng nhập. Vui lòng thử lại.");
        const result = await response.json() as BrowserFlow;
        const action = new URL(result.ui.action, window.location.origin);
        if (action.origin !== window.location.origin || !action.pathname.startsWith(`${api}/self-service/`)) throw new Error("Yêu cầu đăng nhập không hợp lệ.");
        const rememberedMode = readRememberedLoginMode();
        if (kind === "login" && rememberedMode === "local" && isRefreshFlow(result)) {
          window.location.replace(buildBrowserFlowUrl(api, kind, safeReturnTo));
          return;
        }
        setFlow(result);
      })
      .catch(reason => {
        if (!abort.signal.aborted) setError(reason instanceof Error ? reason.message : "Không kết nối được trang đăng nhập.");
      });
    return () => abort.abort();
  }, [kind]);

  function renderFlowForm(group: string) {
    if (!flow) return null;
    const nodes = flow.ui.nodes.filter(node => node.group === "default" || node.group === group);
    const fieldNodes = nodes.filter(node => node.type !== "input" || node.attributes.type !== "submit");
    const submitNodes = nodes.filter(node => node.type === "input" && node.attributes.type === "submit");
    return <form key={group} action={flow.ui.action} method="post" onSubmit={submit} aria-busy={busy} aria-label={groupLabel(group)} className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground">{groupLabel(group)}</h3>
        <div className="mt-4 space-y-4">
          {fieldNodes.map((node, index) => {
            const a = node.attributes;
            const id = `ory-${group}-${index}`;
            const label = labels[a.name ?? ""] || translateIdentityText(node.meta?.label?.text) || "Thông tin xác thực";
            if (node.type === "img" && a.src) return <Image unoptimized key={id} src={a.src} alt="Mã QR để thiết lập ứng dụng xác thực" width={200} height={200} className="rounded-2xl border border-border bg-background p-2" />;
            if (node.type === "text") return <p key={id} className="text-sm leading-6 text-muted-foreground">{translateIdentityText(a.text?.text)}</p>;
            if (node.type !== "input") return null;
            if (a.type === "hidden") return <input key={id} type="hidden" name={a.name} value={String(a.value ?? "")} />;
            const describedBy = `${id}-errors`;
            if (a.type === "checkbox") return <label key={id} className="flex items-start gap-3 rounded-xl border border-border bg-background p-3 text-sm text-foreground">
              <input className="mt-1 h-4 w-4 accent-slate-900" name={a.name} type="checkbox" defaultChecked={Boolean(a.value)} disabled={a.disabled} aria-invalid={node.messages?.some(m => m.type === "error") || undefined} aria-describedby={node.messages?.length ? describedBy : undefined} />
              <span className="grid gap-1"><b>{label}</b>{renderNodeMessages(node, describedBy, error)}</span>
            </label>;
            return <div key={id} className="grid gap-2">
              <label className="text-sm font-semibold text-foreground" htmlFor={id}>{label}</label>
              <Input
                id={id}
                name={a.name}
                type={a.type ?? "text"}
                defaultValue={kind === "login" && mode === "local" && ["identifier", "email", "traits.email"].includes(a.name ?? "") && ssoIdentifier.trim()
                  ? ssoIdentifier.trim()
                  : typeof a.value === "string" ? a.value : undefined}
                required={a.required}
                disabled={a.disabled}
                autoComplete={a.autocomplete}
                aria-invalid={node.messages?.some(m => m.type === "error") || undefined}
                aria-describedby={node.messages?.length ? describedBy : undefined}
              />
              {renderNodeMessages(node, describedBy, error)}
            </div>;
          })}
        </div>
        <div className="mt-4 grid gap-2">
          {submitNodes.map((node, index) => {
            const a = node.attributes;
            return <Button className="w-full" key={`submit-${group}-${index}`} type="submit" name={a.name} value={String(a.value ?? "")} disabled={a.disabled || busy} aria-disabled={busy || undefined}>
              {busy ? "Đang xử lý..." : submitLabel(node, group)} <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </Button>;
          })}
        </div>
      </div>
    </form>;
  }

  const flowMessages = flow?.ui.messages?.map((m, i) => ({ ...m, text: translateIdentityText(m.text), key: i })).filter(m => m.text && m.text !== error) ?? [];

  return <main className="identity-auth-surface min-h-[100dvh] overflow-hidden bg-background text-foreground">
    <BrandHeader />
    <section className="mx-auto flex w-full max-w-xl px-4 py-8 sm:px-6 lg:py-12">
      <Card className="relative w-full overflow-hidden bg-card/95 shadow-gateway backdrop-blur">
        <div className="absolute inset-x-0 top-0 h-1 bg-primary" aria-hidden="true" />
        <CardHeader className="space-y-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-muted text-primary">
            <ShieldCheckIcon className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-3xl tracking-[-0.06em]" id="identity-title">{enrollmentRequired ? "Hoàn tất kích hoạt bảo mật" : titles[kind]}</CardTitle>
            <CardDescription>{enrollmentRequired ? "Đổi mật khẩu ban đầu, thiết lập TOTP và lưu mã dự phòng trước khi chờ quản trị viên kích hoạt tài khoản." : subtitles[kind]}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {enrollmentRequired && kind === "settings" && <Alert tone="warning">Tài khoản đang chờ hoàn tất kích hoạt. Hoàn tất đổi mật khẩu, TOTP và mã dự phòng tại đây; tài khoản sẽ được kích hoạt sau khi quản trị viên xác minh (<Link className="font-semibold underline" href={identityPath("/enrollment-pending")}>trạng thái chờ</Link>).</Alert>}
          {kind === "login" && <AuthenticationSelector mode={mode} onMode={selectMode} onRestart={restartLogin} />}
          {busy && <SecureSessionProgress />}
          {restartableError && <SessionExpiredState onRestart={restartLogin} />}
          {permissionError && !restartableError && <PermissionDeniedState />}
          {error && !restartableError && !permissionError && flow && <Alert role="alert" tone="danger">{error} <button type="button" className="font-semibold underline underline-offset-4" onClick={restartLogin}>Bắt đầu lại</button></Alert>}
          {error && !flow && !restartableError && <ServiceUnavailableState support={support} message={error} />}
          {!flow && !error && <div role="status" className="space-y-3 rounded-2xl border border-border bg-muted p-4">
            <div className="h-4 w-40 animate-pulse rounded-full bg-border" />
            <div className="h-11 animate-pulse rounded-xl bg-border" />
            <div className="h-11 animate-pulse rounded-xl bg-border" />
            <p className="text-sm text-muted-foreground">Đang chuẩn bị trang đăng nhập...</p>
          </div>}
          {flowMessages.map(m => <Alert key={m.key} role={m.type === "error" ? "alert" : "status"} tone={m.type === "error" ? "danger" : "info"}>{m.text}</Alert>)}
          {flow && kind === "login" && mode === "sso" && <>
            <SsoBrowserFlow hasOidcGroup={ssoGroups.length > 0} />
            {ssoGroups.length > 0
              ? ssoGroups.map(renderFlowForm)
              : <SingleSignOnResume
                  identifier={ssoIdentifier}
                  onIdentifierChange={setSsoIdentifier}
                  onSubmit={resumeSingleSignOn}
                  busy={busy}
                  error={ssoResumeError}
                  onLocalLogin={() => selectMode("local")}
                />}
          </>}
          {flow && kind === "login" && mode === "local" && <>
            <LocalLoginNotice />
            {ssoResumeError && <Alert tone="warning">{ssoResumeError}</Alert>}
            {localGroups.length === 0 ? secondAuthenticationChallenge
              ? <Alert tone="warning" className="space-y-3">
                  <span>Phiên đăng nhập cũ đang yêu cầu xác thực bổ sung. MFA mặc định đã tắt; nếu bạn chưa tự bật MFA trong cài đặt, hãy bắt đầu đăng nhập lại.</span>
                  <Button type="button" onClick={restartLogin}>Đăng nhập lại</Button>
                </Alert>
              : <Alert tone="warning">Tài khoản này chưa có phương thức đăng nhập bằng mật khẩu. Vui lòng liên hệ quản trị viên.</Alert>
              : localGroups.map(renderFlowForm)}
          </>}
          {flow && kind !== "login" && localGroups.map(renderFlowForm)}
          <SecurityNotice />
          <nav aria-label="Hỗ trợ tài khoản" className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-muted-foreground">
            {emailFlowsEnabled && <Link className="hover:text-foreground" href={identityPath("/recovery")}>Quên mật khẩu</Link>}
            <Link className="hover:text-foreground" href={identityPath("/settings")}>Thiết lập bảo mật</Link>
            <Link className="hover:text-foreground" href={identityPath("/launcher")}>Trung tâm ứng dụng</Link>
          </nav>
          {!emailFlowsEnabled && <p className="text-xs leading-5 text-muted-foreground">Quên mật khẩu hoặc mất thiết bị xác thực? Liên hệ quản trị viên QTS để khôi phục quyền truy cập.</p>}
        </CardContent>
      </Card>
    </section>
    <footer className="mx-auto w-full max-w-xl px-4 pb-8 text-center text-xs leading-5 text-muted-foreground sm:px-6">
      <p>Nếu bạn không thấy ứng dụng cần dùng sau khi đăng nhập, hãy liên hệ quản trị viên tổ chức.</p>
    </footer>
  </main>;
}
