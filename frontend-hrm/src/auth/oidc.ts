import { createOidcClient, EnrollmentRequiredError, IdentityUnavailableError, SessionExpiredError } from "@qts/oidc-client";

export { EnrollmentRequiredError, IdentityUnavailableError, SessionExpiredError };

export type UserInfo = {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  tid: string;
  tenant: string;
  roles: string[];
  permissions: string[];
  data_scope: "company" | "branch" | "department" | "manager" | "self";
  employee_id?: string | null;
  employee_code?: string | null;
  sid: string;
};

export type LauncherApplication = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  client_id: string;
  redirect_uri: string;
  status: string;
  last_accessed_at: string | null;
};

type PublicEnvKey =
  | "VITE_IDENTITY_ISSUER"
  | "VITE_API_ISSUER"
  | "VITE_IDENTITY_WEB_ORIGIN"
  | "VITE_HRM_OIDC_CLIENT_ID"
  | "VITE_HRM_OIDC_REDIRECT_URI"
  | "VITE_HRM_OIDC_POST_LOGOUT_REDIRECT_URI";

const REQUIRED_PRODUCTION_ENV: PublicEnvKey[] = [
  "VITE_IDENTITY_ISSUER",
  "VITE_API_ISSUER",
  "VITE_IDENTITY_WEB_ORIGIN",
  "VITE_HRM_OIDC_CLIENT_ID",
  "VITE_HRM_OIDC_REDIRECT_URI",
  "VITE_HRM_OIDC_POST_LOGOUT_REDIRECT_URI",
];

function publicEnv(name: PublicEnvKey) {
  return import.meta.env[name]?.trim() ?? "";
}

function allowsInsecureLocalOidc() {
  if (import.meta.env.VITE_ALLOW_INSECURE_LOCAL_OIDC !== "true") return false;
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

function parsePublicUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isLoopbackHost(hostname: string) {
  return ["localhost", "127.0.0.1", "::1"].includes(hostname);
}

function matchesCurrentOrigin(url: URL) {
  if (url.origin === window.location.origin) return true;
  if (!allowsInsecureLocalOidc()) return false;
  const current = parsePublicUrl(window.location.origin);
  if (!current) return false;
  return (
    url.protocol === current.protocol
    && url.port === current.port
    && isLoopbackHost(url.hostname)
    && isLoopbackHost(current.hostname)
  );
}

function productionUrlIssue(name: PublicEnvKey, value: string) {
  const url = parsePublicUrl(value);
  if (!url) return `${name} không phải URL hợp lệ.`;
  if (url.protocol !== "https:") return `${name} phải dùng HTTPS trong production.`;
  if (isLoopbackHost(url.hostname)) return `${name} không được trỏ về localhost trong production.`;
  return "";
}

export function hrmRuntimeConfigIssue() {
  if (!import.meta.env.PROD) return "";
  const missing = REQUIRED_PRODUCTION_ENV.filter((name) => !publicEnv(name));
  if (missing.length > 0) return `QTS HRM thiếu cấu hình production: ${missing.join(", ")}.`;
  if (!allowsInsecureLocalOidc()) {
    for (const key of REQUIRED_PRODUCTION_ENV.filter((name) => name !== "VITE_HRM_OIDC_CLIENT_ID")) {
      const issue = productionUrlIssue(key, publicEnv(key));
      if (issue) return issue;
    }
  }
  const redirect = parsePublicUrl(publicEnv("VITE_HRM_OIDC_REDIRECT_URI"));
  const postLogout = parsePublicUrl(publicEnv("VITE_HRM_OIDC_POST_LOGOUT_REDIRECT_URI"));
  if (redirect && !matchesCurrentOrigin(redirect)) return "Redirect URI của HRM không khớp domain đang mở.";
  if (postLogout && !matchesCurrentOrigin(postLogout)) return "Post-logout redirect URI của HRM không khớp domain đang mở.";
  return "";
}

export const identityIssuer = import.meta.env.VITE_IDENTITY_ISSUER ?? "http://localhost:4444/";
export const apiIssuer = (import.meta.env.VITE_API_ISSUER ?? identityIssuer).replace(/\/$/, "");
export const identityWebOrigin = (import.meta.env.VITE_IDENTITY_WEB_ORIGIN ?? "http://localhost:3001").replace(/\/$/, "");

function browserTokenStorageMode() {
  if (
    import.meta.env.VITE_ALLOW_BROWSER_TOKEN_STORAGE === "true"
    && import.meta.env.VITE_OIDC_SESSION_PERSISTENCE === "session"
  ) {
    return "session";
  }
  return "memory";
}

export function isOidcConfigured() {
  return Boolean(import.meta.env.VITE_HRM_OIDC_CLIENT_ID);
}

function hrmClientId() {
  const configIssue = hrmRuntimeConfigIssue();
  if (configIssue) {
    throw new Error("QTS HRM chưa sẵn sàng đăng nhập. Vui lòng liên hệ quản trị viên.");
  }
  const clientId = import.meta.env.VITE_HRM_OIDC_CLIENT_ID;
  if (!clientId) {
    throw new Error("QTS HRM chưa sẵn sàng đăng nhập. Vui lòng kiểm tra cấu hình ứng dụng trong QTS Identity.");
  }
  return clientId;
}

const oidc = createOidcClient({
  issuer: identityIssuer,
  apiIssuer,
  clientId: hrmClientId,
  redirectUri: () => import.meta.env.VITE_HRM_OIDC_REDIRECT_URI ?? `${window.location.origin}/auth/callback`,
  postLogoutRedirectUri: () => import.meta.env.VITE_HRM_OIDC_POST_LOGOUT_REDIRECT_URI ?? `${window.location.origin}/`,
  storageKey: "ory-qts-hrm:session",
  transactionPrefix: "qts-hrm:oidc:",
  userInfoPath: "/oauth/userinfo",
  sessionPersistence: browserTokenStorageMode(),
  refreshTokenStorage: "memory",
});

export const beginAuthorization = oidc.beginAuthorization;
export const beginLogout = oidc.beginLogout;
export const clearHrmSession = oidc.clearSession;
export const hasStoredSession = oidc.hasStoredSession;
export const isAuthorizationCallback = oidc.isAuthorizationCallback;
export const redeemAuthorizationResponse = oidc.redeemAuthorizationResponse;
export const restoreSession = oidc.restoreSession;
export const authorizedApiRequest = oidc.authorizedRequest;

export function verifiedAuthenticationAssurance() {
  return oidc.authenticationAssurance();
}

export async function loadHrmIdentity() {
  const [profile, launcher] = await Promise.all([
    oidc.loadUserInfo<UserInfo>(),
    oidc.authorizedRequest<{ applications: LauncherApplication[] }>("/api/launcher", { method: "GET" }),
  ]);
  return { profile, applications: launcher.applications ?? [], idToken: oidc.idToken() };
}
