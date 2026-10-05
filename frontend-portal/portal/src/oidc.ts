import { createOidcClient, EnrollmentRequiredError, SessionExpiredError, SilentAuthorizationRequiredError } from "@qts/oidc-client";

export { EnrollmentRequiredError, SessionExpiredError, SilentAuthorizationRequiredError };

export type UserInfo = {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  tid: string;
  tenant: string;
  roles: string[];
  permissions: string[];
  data_scope: "company" | "manager" | "self";
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

export type PortalEntitlements = {
  modules: Record<string, boolean>;
  manage: Record<string, boolean>;
  roles: string[];
};

export type AdminUser = {
  id: string;
  membership_id: string;
  email: string;
  display_name: string;
  is_active: boolean;
  ory_id: string | null;
  membership: {
    id: string;
    status: string;
    status_label: string;
    roles: string[];
    applications: string[];
    policy_version: number;
  };
  created_at: string;
};

export type AdminUsersResponse = {
  users: AdminUser[];
  pagination: { page: number; page_size: number; total: number };
};

export type PortalLead = {
  id: number;
  name: string;
  email: string;
  company: string;
  phone: string;
  message: string;
  locale: string;
  status: string;
  owner: string | null;
  assigned_at: string | null;
  source_url: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  created_at: string;
};

export type PortalLeadsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: PortalLead[];
};

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

function portalClientId() {
  const clientId = import.meta.env.VITE_PORTAL_OIDC_CLIENT_ID;
  if (!clientId) {
    throw new Error("Cổng thông tin QTS chưa sẵn sàng. Vui lòng liên hệ quản trị viên.");
  }
  return clientId;
}

const oidc = createOidcClient({
  issuer: identityIssuer,
  apiIssuer,
  clientId: portalClientId,
  redirectUri: () => import.meta.env.VITE_PORTAL_OIDC_REDIRECT_URI ?? `${window.location.origin}/auth/callback`,
  postLogoutRedirectUri: () => import.meta.env.VITE_PORTAL_OIDC_POST_LOGOUT_REDIRECT_URI ?? `${window.location.origin}/`,
  storageKey: "ory-qts-portal:session",
  transactionPrefix: "qts-portal:oidc:",
  userInfoPath: "/oauth/userinfo",
  sessionPersistence: browserTokenStorageMode(),
  refreshTokenStorage: "memory",
});

export const beginAuthorization = oidc.beginAuthorization;
export const beginLogout = oidc.beginLogout;
export const clearPortalSession = oidc.clearSession;
export const hasStoredSession = oidc.hasStoredSession;
export const isAuthorizationCallback = oidc.isAuthorizationCallback;
export const redeemAuthorizationResponse = oidc.redeemAuthorizationResponse;
export const restoreSession = oidc.restoreSession;

export async function listAdminUsers(params: Record<string, string | number | undefined> = {}): Promise<AdminUsersResponse> {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && String(value).length) search.set(key, String(value));
  }
  const query = search.toString();
  return oidc.authorizedRequest<AdminUsersResponse>(`/api/admin/users${query ? `?${query}` : ""}`, { method: "GET" });
}

export async function listPortalLeads(params: Record<string, string | number | undefined> = {}): Promise<PortalLeadsResponse> {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && String(value).length) search.set(key, String(value));
  }
  const query = search.toString();
  return oidc.authorizedRequest<PortalLeadsResponse>(`/api/v1/leads/${query ? `?${query}` : ""}`, { method: "GET" });
}

export async function loadPortalIdentity() {
  const [profile, entitlements, launcher] = await Promise.all([
    oidc.loadUserInfo<UserInfo>(),
    oidc.authorizedRequest<PortalEntitlements>("/api/portal-entitlements", { method: "GET" }),
    oidc.authorizedRequest<{ applications: LauncherApplication[] }>("/api/launcher", { method: "GET" }),
  ]);
  return { profile, entitlements, applications: launcher.applications ?? [] };
}
