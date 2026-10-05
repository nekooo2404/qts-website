"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
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
  user?: { id?: string; email?: string; name?: string; employee_code?: string };
};
type Kind = "login" | "settings" | "recovery" | "verification";
type AuthMode = "account" | "issued-id";

const titles: Record<Kind, string> = {
  login: "Log in to your QTS account",
  settings: "Bảo mật tài khoản",
  recovery: "Khôi phục tài khoản",
  verification: "Xác minh email",
};

const subtitles: Record<Kind, string> = {
  login: "Access Portal, HRM, and every app your organization grants.",
  settings: "Quản lý mật khẩu, mã dự phòng và thiết bị bảo mật của bạn.",
  recovery: "Khôi phục quyền truy cập bằng quy trình bảo mật của QTS.",
  verification: "Hoàn tất xác minh email trước khi sử dụng hệ sinh thái QTS.",
};

const labels: Record<string, string> = {
  identifier: "Thông tin đăng nhập",
  email: "Email công việc",
  login_id: "ID được cấp",
  "traits.login_id": "ID được cấp",
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
  if (group === "password") return "Thông tin đăng nhập";
  if (group === "totp") return "Nhập mã xác thực";
  if (group === "lookup_secret") return "Mã dự phòng";
  if (group === "code") return "Mã xác nhận";
  if (group === "passkey") return "Khóa bảo mật";
  if (group === "oidc") return "Đăng nhập một lần";
  return translateIdentityText(group);
}

function submitLabel(node: Node, group: string, mode: AuthMode = "account") {
  const method = String(node.attributes.value ?? "");
  if (group === "password" || method === "password") return mode === "issued-id" ? "Continue with SSO" : "Continue";
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

function normalizeLoginMode(value: string | null): AuthMode | null {
  if (value === "account" || value === "local") return "account";
  if (value === "issued-id" || value === "sso") return "issued-id";
  return null;
}

function readRememberedLoginMode(): AuthMode | null {
  try {
    return normalizeLoginMode(window.sessionStorage.getItem(loginModeStorageKey));
  } catch {
    return null;
  }
}

function BrandHeader() {
  return <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 pt-5 sm:px-6 lg:px-8">
    <Link href={identityPath("/launcher")} className="flex items-center gap-3" aria-label="Đăng nhập QTS">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-panel">
        <ShieldCheckIcon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="grid leading-tight">
        <b className="text-sm font-bold tracking-[-0.03em] text-foreground">QTS</b>
        <small className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Đăng nhập an toàn</small>
      </span>
    </Link>
    <div className="flex items-center gap-2">
      <Badge tone="success" className="hidden sm:inline-flex">Sẵn sàng</Badge>
    </div>
  </header>;
}

function SecureSessionProgress() {
  return <Alert tone="info" className="flex items-center gap-2">
    <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
    <span>Đang hoàn tất đăng nhập...</span>
  </Alert>;
}

function LoginMethodNotice({ mode }: { mode: AuthMode }) {
  if (mode !== "issued-id") return null;
  return <p className="rounded-xl bg-muted px-3 py-2 text-xs leading-5 text-muted-foreground">
    Continue with SSO sử dụng phiên đăng nhập sẵn có hoặc ID được tổ chức cấp. Nếu chưa có phiên, hãy nhập ID và mật khẩu để xác minh.
  </p>;
}

function isIdentifierNode(node: Node) {
  return ["identifier", "email", "login_id", "traits.email", "traits.login_id"].includes(node.attributes.name ?? "");
}

function passwordGroupTitle(mode: AuthMode) {
  return mode === "issued-id" ? "Continue with SSO" : "Log in with email";
}

function loginFieldLabel(node: Node, mode: AuthMode) {
  if (isIdentifierNode(node)) return mode === "issued-id" ? "Company ID or issued ID" : "Email address or username";
  if (node.attributes.name === "password") return "Password";
  const a = node.attributes;
  return labels[a.name ?? ""] || translateIdentityText(node.meta?.label?.text) || "Thông tin xác thực";
}

function loginFieldPlaceholder(node: Node, mode: AuthMode) {
  if (!isIdentifierNode(node)) return undefined;
  return mode === "issued-id" ? "QTS-00001" : "name@qtsgroup.vn";
}

function SecurityNotice() {
  return <div className="flex items-start gap-2 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
    <ComputerDesktopIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
    <span>Mật khẩu chỉ được xử lý trong hệ thống đăng nhập QTS, không lưu trong Portal hoặc HRM.</span>
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
  const [ssoChecking, setSsoChecking] = useState(false);
  const [mode, setMode] = useState<AuthMode>("account");
  const [support] = useState(makeSupportContext);
  const autoResumeAttempted = useRef(false);
  const restartableError = Boolean(error && isRestartableError(error));
  const permissionError = Boolean(error && isPermissionError(error));

  const groups = useMemo(() => [...new Set(flow?.ui.nodes.map(node => node.group).filter(group => group !== "default") ?? [])], [flow]);
  const localGroups = groups.filter(group => group !== "oidc");
  const secondAuthenticationChallenge = isSecondAuthenticationChallenge(flow);

  function navigate(target: string) {
    const destination = new URL(target, window.location.origin);
    if (destination.origin !== window.location.origin || !destination.pathname.startsWith(identityPath("/"))) throw new Error("Chuyển hướng không hợp lệ.");
    window.location.assign(destination.toString());
  }

  function selectMode(nextMode: AuthMode) {
    rememberLoginMode(nextMode);
    setMode(nextMode);
  }

  async function continueWithSso() {
    selectMode("issued-id");
    if (!flow || ssoChecking) return;
    setSsoChecking(true);
    setError("");
    try {
      const response = await fetch(identityPath("/identity-api/api/session"), {
        credentials: "include",
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      const session = await response.json().catch(() => null) as ActiveIdentitySession | null;
      if (response.ok && session?.authenticated === true) {
        navigate(flow.return_to ?? identityPath("/launcher"));
      }
    } catch {
      // Keep the issued-ID form visible when there is no reusable SSO session.
    } finally {
      setSsoChecking(false);
    }
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || ssoChecking || !flow) return;
    const body = buildFormBody(event.currentTarget, (event.nativeEvent as SubmitEvent).submitter);
    setBusy(true);
    setError("");
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
    const requestedMode = normalizeLoginMode(new URLSearchParams(window.location.search).get("mode"));
    if (requestedMode) {
      rememberLoginMode(requestedMode);
      setMode(requestedMode);
      return;
    }
    const rememberedMode = readRememberedLoginMode();
    if (rememberedMode) setMode(rememberedMode);
  }, [kind]);

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
        if (kind === "login" && rememberedMode === "account" && isRefreshFlow(result)) {
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

  useEffect(() => {
    if (kind !== "login" || !flow || autoResumeAttempted.current || isRefreshFlow(flow) || isSecondAuthenticationChallenge(flow)) return;
    autoResumeAttempted.current = true;
    const abort = new AbortController();
    void fetch(identityPath("/identity-api/api/session"), {
      credentials: "include",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: abort.signal,
    })
      .then(async response => {
        const session = await response.json().catch(() => null) as ActiveIdentitySession | null;
        if (!response.ok || session?.authenticated !== true) return;
        navigate(flow.return_to ?? identityPath("/launcher"));
      })
      .catch(() => {
        // No active browser session yet. Keep the credential form visible.
      });
    return () => abort.abort();
  }, [flow, kind]);

  function renderFlowForm(group: string) {
    if (!flow) return null;
    const nodes = flow.ui.nodes.filter(node => node.group === "default" || node.group === group);
    const fieldNodes = nodes.filter(node => node.type !== "input" || node.attributes.type !== "submit");
    const submitNodes = nodes.filter(node => node.type === "input" && node.attributes.type === "submit");
    const formTitle = kind === "login" && group === "password" ? passwordGroupTitle(mode) : groupLabel(group);
    const isPasswordLoginForm = kind === "login" && group === "password";
    return <form key={group} action={flow.ui.action} method="post" onSubmit={submit} aria-busy={busy || ssoChecking} aria-label={formTitle} className="space-y-4">
      <div className={isPasswordLoginForm ? "space-y-4" : "rounded-2xl border border-border bg-card p-4"}>
        <h3 className={isPasswordLoginForm ? "sr-only" : "text-sm font-semibold text-foreground"}>{formTitle}</h3>
        <div className={isPasswordLoginForm ? "space-y-4" : "mt-4 space-y-4"}>
          {fieldNodes.map((node, index) => {
            const a = node.attributes;
            const id = `ory-${group}-${index}`;
            if (node.type === "img" && a.src) return <Image unoptimized key={id} src={a.src} alt="Mã QR để thiết lập ứng dụng xác thực" width={200} height={200} className="rounded-2xl border border-border bg-background p-2" />;
            if (node.type === "text") return <p key={id} className="text-sm leading-6 text-muted-foreground">{translateIdentityText(a.text?.text)}</p>;
            if (node.type !== "input") return null;
            if (a.type === "hidden") return <input key={id} type="hidden" name={a.name} value={String(a.value ?? "")} />;
            const describedBy = `${id}-errors`;
            const label = kind === "login" && group === "password" ? loginFieldLabel(node, mode) : labels[a.name ?? ""] || translateIdentityText(node.meta?.label?.text) || "Thông tin xác thực";
            if (a.type === "checkbox") return <label key={id} className="flex items-start gap-3 rounded-xl border border-border bg-background p-3 text-sm text-foreground">
              <input className="mt-1 h-4 w-4 accent-slate-900" name={a.name} type="checkbox" defaultChecked={Boolean(a.value)} disabled={a.disabled} aria-invalid={node.messages?.some(m => m.type === "error") || undefined} aria-describedby={node.messages?.length ? describedBy : undefined} />
              <span className="grid gap-1"><b>{label}</b>{renderNodeMessages(node, describedBy, error)}</span>
            </label>;
            const passwordField = isPasswordLoginForm && a.name === "password";
            return <div key={id} className="grid gap-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-semibold text-foreground" htmlFor={id}>{label}</label>
                {passwordField && emailFlowsEnabled && <Link className="text-xs font-semibold text-primary underline-offset-4 hover:underline" href={identityPath("/recovery")}>Forgot your password?</Link>}
              </div>
              <Input
                id={id}
                name={a.name}
                type={a.type ?? "text"}
                defaultValue={typeof a.value === "string" ? a.value : undefined}
                placeholder={kind === "login" && group === "password" ? loginFieldPlaceholder(node, mode) : undefined}
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
            return <Button className="w-full" key={`submit-${group}-${index}`} type="submit" name={a.name} value={String(a.value ?? "")} disabled={a.disabled || busy || ssoChecking} aria-disabled={busy || ssoChecking || undefined}>
              {busy ? "Đang xử lý..." : submitLabel(node, group, mode)} <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </Button>;
          })}
        </div>
      </div>
    </form>;
  }

  const flowMessages = flow?.ui.messages?.map((m, i) => ({ ...m, text: translateIdentityText(m.text), key: i })).filter(m => m.text && m.text !== error) ?? [];

  return <main className="identity-auth-surface min-h-[100dvh] overflow-hidden bg-background text-foreground">
    <BrandHeader />
    <section className="mx-auto flex w-full max-w-xl px-4 py-6 sm:px-6 lg:py-6">
      <Card className="relative w-full overflow-hidden bg-card/95 shadow-gateway backdrop-blur">
        <div className="absolute inset-x-0 top-0 h-1 bg-primary" aria-hidden="true" />
        <CardHeader className="space-y-3 p-5 sm:p-6">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-muted text-primary">
            <ShieldCheckIcon className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-3xl tracking-[-0.06em]" id="identity-title">{enrollmentRequired ? "Hoàn tất kích hoạt bảo mật" : titles[kind]}</CardTitle>
            <CardDescription>{enrollmentRequired ? "Đổi mật khẩu ban đầu, thiết lập TOTP và lưu mã dự phòng trước khi chờ quản trị viên kích hoạt tài khoản." : subtitles[kind]}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-5 pt-0 sm:p-6 sm:pt-0">
          {enrollmentRequired && kind === "settings" && <Alert tone="warning">Tài khoản đang chờ hoàn tất kích hoạt. Hoàn tất đổi mật khẩu, TOTP và mã dự phòng tại đây; tài khoản sẽ được kích hoạt sau khi quản trị viên xác minh (<Link className="font-semibold underline" href={identityPath("/enrollment-pending")}>trạng thái chờ</Link>).</Alert>}
          {kind === "login" && <div className="space-y-4" role="group" aria-label="Sign in options">
            <Button type="button" variant="secondary" className="min-h-12 w-full justify-center rounded-xl border-input bg-background text-[15px] font-semibold text-foreground hover:bg-muted" onClick={() => void continueWithSso()} disabled={busy || ssoChecking} aria-pressed={mode === "issued-id"}>
              <KeyIcon className="h-4 w-4" aria-hidden="true" />
              {ssoChecking ? "Checking SSO..." : "Continue with SSO"}
            </Button>
            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground" aria-hidden="true">
              <span className="h-px flex-1 bg-border" />
              <span>or</span>
              <span className="h-px flex-1 bg-border" />
            </div>
          </div>}
          {(busy || ssoChecking) && <SecureSessionProgress />}
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
          {flow && kind === "login" && <>
            <LoginMethodNotice mode={mode} />
            {mode === "issued-id" && <button type="button" className="text-xs font-semibold text-primary underline-offset-4 hover:underline" onClick={() => selectMode("account")}>Use email address instead</button>}
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
