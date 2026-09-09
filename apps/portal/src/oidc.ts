export type UserInfo = {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  tid: string;
  tenant: string;
  roles: string[];
  permissions: string[];
  sid: string;
};

export type PortalEntitlements = {
  modules: Record<string, boolean>;
  manage: Record<string, boolean>;
  roles: string[];
};

type AuthorizationTransaction = {
  verifier: string;
  nonce: string;
  createdAt: number;
};

type TokenSet = {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
};

type StoredSession = {
  access_token: string;
  id_token: string;
  refresh_token: string;
  expires_at: number;
};

type OpenIdConfiguration = {
  authorization_endpoint: string;
  token_endpoint: string;
  revocation_endpoint?: string;
  end_session_endpoint: string;
};

const transactionPrefix = "qts-portal:oidc:";
const transactionLifetime = 10 * 60 * 1000;
const tokenStorageKey = "qts-portal:session";
const expiryMargin = 30 * 1000;
const pendingExchanges = new Map<string, Promise<TokenSet>>();
let discoveryPromise: Promise<OpenIdConfiguration> | null = null;
let refreshPromise: Promise<StoredSession> | null = null;

export class SessionExpiredError extends Error {
  constructor() {
    super("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    this.name = "SessionExpiredError";
  }
}

async function discover(): Promise<OpenIdConfiguration> {
  if (!discoveryPromise) {
    discoveryPromise = fetch(`${identityIssuer}/.well-known/openid-configuration`, { headers: { Accept: "application/json" } })
      .then(async response => {
        if (!response.ok) throw new Error("Không thể tải tài liệu khám phá định danh.");
        const document = await response.json() as OpenIdConfiguration;
        if (!document.authorization_endpoint || !document.token_endpoint) throw new Error("Tài liệu khám phá định danh chưa đầy đủ.");
        return document;
      })
      .catch(error => {
        discoveryPromise = null;
        throw error;
      });
  }
  return discoveryPromise;
}

export const identityIssuer = (import.meta.env.VITE_IDENTITY_ISSUER ?? "http://localhost:8000").replace(/\/$/, "");
export const apiIssuer = (import.meta.env.VITE_API_ISSUER ?? identityIssuer).replace(/\/$/, "");
export const identityWebOrigin = (import.meta.env.VITE_IDENTITY_WEB_ORIGIN ?? "http://localhost:3001").replace(/\/$/, "");

function portalClientId() {
  const clientId = import.meta.env.VITE_PORTAL_OIDC_CLIENT_ID;
  if (!clientId) {
    throw new Error("QTS Portal chưa được cấu hình OIDC. Hãy đặt VITE_PORTAL_OIDC_CLIENT_ID từ kết quả seed định danh.");
  }
  return clientId;
}

function redirectUri() {
  return import.meta.env.VITE_PORTAL_OIDC_REDIRECT_URI ?? `${window.location.origin}/auth/callback`;
}

function postLogoutRedirectUri() {
  return import.meta.env.VITE_PORTAL_OIDC_POST_LOGOUT_REDIRECT_URI ?? `${window.location.origin}/`;
}

function base64url(bytes: Uint8Array) {
  let value = "";
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function randomValue(length: number) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

async function codeChallenge(verifier: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64url(new Uint8Array(digest));
}

function transactionKey(state: string) {
  return `${transactionPrefix}${state}`;
}

function readTransaction(state: string) {
  const serialized = sessionStorage.getItem(transactionKey(state));
  if (!serialized) return null;
  try {
    const transaction = JSON.parse(serialized) as AuthorizationTransaction;
    if (!transaction.verifier || !transaction.nonce || Date.now() - transaction.createdAt > transactionLifetime) {
      sessionStorage.removeItem(transactionKey(state));
      return null;
    }
    return transaction;
  } catch {
    sessionStorage.removeItem(transactionKey(state));
    return null;
  }
}

function responseError(response: Response) {
  return response.json()
    .catch(() => ({}))
    .then((body: { error_description?: string }) => body.error_description ?? "Không thể hoàn tất yêu cầu định danh.");
}

function readSession(): StoredSession | null {
  const serialized = sessionStorage.getItem(tokenStorageKey);
  if (!serialized) return null;
  try {
    const session = JSON.parse(serialized) as StoredSession;
    if (!session.access_token || !session.id_token || !session.refresh_token || !Number.isFinite(session.expires_at)) throw new Error();
    return session;
  } catch {
    sessionStorage.removeItem(tokenStorageKey);
    return null;
  }
}

export function clearPortalSession() {
  sessionStorage.removeItem(tokenStorageKey);
}

function storeSession(tokens: TokenSet, previous?: StoredSession) {
  const expiresIn = Number(tokens.expires_in);
  const session = {
    access_token: tokens.access_token,
    id_token: tokens.id_token ?? previous?.id_token ?? "",
    refresh_token: tokens.refresh_token ?? previous?.refresh_token ?? "",
    expires_at: Date.now() + Math.max(0, expiresIn * 1000 - expiryMargin),
  } satisfies StoredSession;
  if (!session.access_token || !session.id_token || !session.refresh_token || !Number.isFinite(expiresIn) || expiresIn <= 0) {
    throw new Error("Phản hồi định danh không chứa đủ token bắt buộc.");
  }
  sessionStorage.setItem(tokenStorageKey, JSON.stringify(session));
  return session;
}

function verifiedNonce(idToken: string, expectedNonce: string) {
  const payload = idToken.split(".")[1];
  if (!payload) throw new Error("Token định danh không đúng định dạng.");
  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(normalized)) as { nonce?: string };
    if (claims.nonce !== expectedNonce) throw new Error("Nonce trong phản hồi định danh không hợp lệ.");
  } catch (error) {
    if (error instanceof Error && error.message === "Nonce trong phản hồi định danh không hợp lệ.") throw error;
    throw new Error("Token định danh không đúng định dạng.");
  }
}

export async function beginAuthorization() {
  const clientId = portalClientId();
  const state = randomValue(32);
  const nonce = randomValue(32);
  const verifier = randomValue(64);
  const challenge = await codeChallenge(verifier);

  sessionStorage.setItem(transactionKey(state), JSON.stringify({ verifier, nonce, createdAt: Date.now() } satisfies AuthorizationTransaction));

  const parameters = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri(),
    scope: "openid profile email offline_access",
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  const { authorization_endpoint } = await discover();
  window.location.assign(`${authorization_endpoint}?${parameters.toString()}`);
}

export function isAuthorizationCallback() {
  return window.location.pathname === "/auth/callback";
}

export async function redeemAuthorizationResponse(search = window.location.search): Promise<TokenSet> {
  const parameters = new URLSearchParams(search);
  const state = parameters.get("state");
  const code = parameters.get("code");
  const error = parameters.get("error");
  const description = parameters.get("error_description");

  if (!state) throw new Error("Phản hồi định danh thiếu trường state.");

  if (error) {
    if (readTransaction(state)) sessionStorage.removeItem(transactionKey(state));
    throw new Error(description ?? error);
  }
  if (!code) throw new Error("Phản hồi định danh thiếu authorization code.");

  const exchangeKey = `${state}:${code}`;
  const existingExchange = pendingExchanges.get(exchangeKey);
  if (existingExchange) return existingExchange;

  const transaction = readTransaction(state);
  if (!transaction) {
    throw new Error("Yêu cầu đăng nhập không tồn tại, đã hết hạn hoặc đã được sử dụng.");
  }

  const exchange = Promise.resolve().then(async () => {
    sessionStorage.removeItem(transactionKey(state));
    const { token_endpoint } = await discover();
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: portalClientId(),
      code,
      redirect_uri: redirectUri(),
      code_verifier: transaction.verifier,
    });
    const response = await fetch(token_endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: body.toString(),
    });
    if (!response.ok) throw new Error(await responseError(response));
    const tokenSet = await response.json() as TokenSet;
    if (!tokenSet.access_token || !tokenSet.id_token || !tokenSet.refresh_token) throw new Error("Phản hồi định danh không chứa đủ token bắt buộc.");
    verifiedNonce(tokenSet.id_token, transaction.nonce);
    storeSession(tokenSet);
    return tokenSet;
  });

  pendingExchanges.set(exchangeKey, exchange);
  return exchange;
}

async function exchangeRefreshToken() {
  const previous = readSession();
  if (!previous) throw new SessionExpiredError();
  try {
    const { token_endpoint } = await discover();
    const response = await fetch(token_endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: portalClientId(),
        refresh_token: previous.refresh_token,
      }).toString(),
    });
    if (!response.ok) throw new Error();
    return storeSession(await response.json() as TokenSet, previous);
  } catch {
    clearPortalSession();
    throw new SessionExpiredError();
  }
}

async function refreshSession() {
  if (refreshPromise) return refreshPromise;
  const pending = exchangeRefreshToken();
  refreshPromise = pending;
  try {
    return await pending;
  } finally {
    if (refreshPromise === pending) refreshPromise = null;
  }
}

async function getAccessToken() {
  let session = readSession();
  if (!session) throw new SessionExpiredError();
  if (Date.now() >= session.expires_at) session = await refreshSession();
  return session.access_token;
}

export function hasStoredSession() {
  return readSession() !== null;
}

export async function restoreSession() {
  if (!readSession()) return false;
  await getAccessToken();
  return true;
}

async function authorizedGet<T>(path: string): Promise<T> {
  let accessToken = await getAccessToken();
  let response = await fetch(`${apiIssuer}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });
  if (response.status === 401) {
    const current = readSession();
    if (!current) throw new SessionExpiredError();
    if (current.access_token === accessToken) await refreshSession();
    accessToken = await getAccessToken();
    response = await fetch(`${apiIssuer}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    });
  }
  if (!response.ok) throw new Error(await responseError(response));
  return response.json() as Promise<T>;
}

export async function loadPortalIdentity() {
  const [profile, entitlements] = await Promise.all([
    authorizedGet<UserInfo>("/oauth/userinfo"),
    authorizedGet<PortalEntitlements>("/api/portal-entitlements"),
  ]);
  return { profile, entitlements };
}

export async function beginLogout() {
  const session = readSession();
  clearPortalSession();
  const { end_session_endpoint, revocation_endpoint } = await discover();
  if (session && revocation_endpoint) {
    await fetch(revocation_endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: session.refresh_token, client_id: portalClientId() }).toString(),
    }).catch(() => undefined);
  }
  if (!end_session_endpoint) throw new Error("Nhà cung cấp định danh không hỗ trợ đăng xuất.");
  const parameters = new URLSearchParams({
    client_id: portalClientId(),
    post_logout_redirect_uri: postLogoutRedirectUri(),
  });
  window.location.assign(`${end_session_endpoint}?${parameters.toString()}`);
}
