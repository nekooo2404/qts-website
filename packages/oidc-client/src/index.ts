import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

export type TokenSet = {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
};

export type SubjectUserInfo = {
  sub: string;
};

export type OidcClientConfig = {
  issuer: string;
  apiIssuer: string;
  clientId: () => string;
  redirectUri: () => string;
  postLogoutRedirectUri: () => string;
  storageKey: string;
  transactionPrefix: string;
  userInfoPath: string;
  scopes?: string[];
  /** Defaults to memory. Session storage is for explicit compatibility-test mode and is readable by same-origin script. */
  sessionPersistence?: "memory" | "session";
  /** Defaults to memory. Session storage is only for explicit compatibility mode and remains exposed to same-origin script. */
  refreshTokenStorage?: "memory" | "session" | "none";
};

type AuthorizationTransaction = {
  verifier: string;
  nonce: string;
  createdAt: number;
};

type StoredSession = {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_at: number;
};

type OpenIdConfiguration = {
  issuer: string;
  jwks_uri: string;
  authorization_endpoint: string;
  token_endpoint: string;
  revocation_endpoint?: string;
  end_session_endpoint: string;
};

type PendingLogout = {
  state: string;
  createdAt: number;
};

const transactionLifetime = 10 * 60 * 1000;
const logoutLifetime = 10 * 60 * 1000;
const expiryMargin = 30 * 1000;
const discoveryCacheTtl = 900_000;
const genericIdentityError = "Không thể hoàn tất yêu cầu định danh. Vui lòng thử lại.";

export class SessionExpiredError extends Error {
  constructor() {
    super("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    this.name = "SessionExpiredError";
  }
}

export class EnrollmentRequiredError extends Error {
  constructor(message = "Tài khoản phải đổi mật khẩu, thiết lập xác thực đa yếu tố và lưu mã dự phòng trước khi truy cập ứng dụng.") {
    super(message);
    this.name = "EnrollmentRequiredError";
  }
}

export class IdentityUnavailableError extends Error {
  constructor(message = "Chưa kết nối được QTS Identity. Vui lòng kiểm tra mạng hoặc thử lại sau.") {
    super(message);
    this.name = "IdentityUnavailableError";
  }
}

export function isEnrollmentRequiredError(error: unknown) {
  return error instanceof EnrollmentRequiredError;
}

function errorMessageIndicatesEnrollment(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("enrollment_required")
    || normalized.includes("enrollment")
    || normalized.includes("đổi mật khẩu")
    || normalized.includes("mã dự phòng")
    || normalized.includes("totp");
}

async function identityFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  try {
    return await fetch(input, {
      ...init,
      signal: init.signal ?? AbortSignal.timeout(15_000),
      cache: init.cache ?? "no-store",
    });
  } catch (error) {
    if (error instanceof IdentityUnavailableError) throw error;
    throw new IdentityUnavailableError();
  }
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

async function responseError(response: Response) {
  const body = await response.json().catch(() => ({})) as { error?: string; error_description?: string };
  return safeOidcErrorMessage(body.error, body.error_description);
}

function callbackEnrollmentError(error: string, description: string | null) {
  if (error === "enrollment_required") return true;
  if (error === "interaction_required" && description && errorMessageIndicatesEnrollment(description)) return true;
  return false;
}

function safeOidcErrorMessage(error?: string | null, description?: string | null) {
  const combined = `${error ?? ""} ${description ?? ""}`.trim().toLowerCase();
  if (!combined) return genericIdentityError;
  if (combined.includes("temporarily_unavailable") || combined.includes("server_error")) {
    return "Dịch vụ định danh tạm thời chưa khả dụng. Vui lòng thử lại.";
  }
  if (combined.includes("invalid_grant") || combined.includes("authorization code")) {
    return "Phiên đăng nhập không còn hợp lệ. Vui lòng bắt đầu lại.";
  }
  if (combined.includes("redirect uri")) {
    return "Địa chỉ quay lại sau đăng nhập chưa được đăng ký cho ứng dụng này.";
  }
  if (combined.includes("pkce") || combined.includes("code_verifier")) {
    return "Mã xác minh đăng nhập không hợp lệ. Vui lòng bắt đầu lại.";
  }
  if (combined.includes("access_denied")) {
    return "Bạn chưa được cấp quyền tiếp tục yêu cầu này.";
  }
  return genericIdentityError;
}

function mfaFromClaims(claims: JWTPayload | null): boolean | null {
  if (!claims) return null;
  const acr = typeof claims.acr === "string" ? claims.acr.toLowerCase() : "";
  if (["aal2", "aal3"].includes(acr)) return true;

  const amr = Array.isArray(claims.amr)
    ? claims.amr.filter((method): method is string => typeof method === "string").map(method => method.toLowerCase())
    : [];
  const strongMethods = new Set(["mfa", "otp", "totp", "webauthn", "hwk", "swk", "sms"]);
  if (amr.some(method => strongMethods.has(method))) return true;
  if (acr === "aal1" || amr.length > 0) return false;
  return null;
}

export function createOidcClient(config: OidcClientConfig) {
  const sessionPersistence = config.sessionPersistence ?? "memory";
  const refreshTokenStorage = config.refreshTokenStorage ?? "memory";
  const pendingExchanges = new Map<string, Promise<TokenSet>>();
  const pendingLogoutKey = `${config.storageKey}:pending-logout`;
  let discoveryPromise: Promise<OpenIdConfiguration> | null = null;
  let refreshPromise: Promise<StoredSession> | null = null;
  let keySet: ReturnType<typeof createRemoteJWKSet> | null = null;
  let memoryRefreshToken: string | undefined;
  let memorySession: StoredSession | null = null;
  let verifiedToken = "";
  let verifiedClaims: JWTPayload | null = null;
  let userInfoToken = "";
  let userInfoProfile: SubjectUserInfo | null = null;
  let userInfoPromise: Promise<SubjectUserInfo> | null = null;

  function transactionKey(state: string) {
    return `${config.transactionPrefix}${state}`;
  }

  function clearUserInfoCache() {
    userInfoToken = "";
    userInfoProfile = null;
    userInfoPromise = null;
  }

  function clearTokens() {
    memorySession = null;
    sessionStorage.removeItem(config.storageKey);
    memoryRefreshToken = undefined;
    verifiedToken = "";
    verifiedClaims = null;
    clearUserInfoCache();
  }

  function clearSession() {
    clearTokens();
    sessionStorage.removeItem(pendingLogoutKey);
  }

  function clearConfirmedLogout() {
    const serialized = sessionStorage.getItem(pendingLogoutKey);
    if (!serialized) return;
    try {
      const pending = JSON.parse(serialized) as PendingLogout;
      if (!pending.state || Date.now() - pending.createdAt > logoutLifetime) {
        sessionStorage.removeItem(pendingLogoutKey);
        return;
      }
      if (new URLSearchParams(window.location.search).get("state") === pending.state) {
        sessionStorage.removeItem(pendingLogoutKey);
        clearTokens();
      }
    } catch {
      sessionStorage.removeItem(pendingLogoutKey);
    }
  }

  function readSession(): StoredSession | null {
    clearConfirmedLogout();
    if (sessionPersistence === "memory") {
      return memorySession ? { ...memorySession } : null;
    }

    const serialized = sessionStorage.getItem(config.storageKey);
    if (!serialized) return null;
    try {
      const session = JSON.parse(serialized) as StoredSession;
      if (!session.access_token || !session.id_token || !Number.isFinite(session.expires_at)) throw new Error();
      if (refreshTokenStorage === "memory" && session.refresh_token) {
        const sanitized = { ...session };
        delete sanitized.refresh_token;
        sessionStorage.setItem(config.storageKey, JSON.stringify(sanitized));
        return sanitized;
      }
      return session;
    } catch {
      clearTokens();
      return null;
    }
  }

  function readTransaction(state: string) {
    const key = transactionKey(state);
    const serialized = sessionStorage.getItem(key);
    if (!serialized) return null;
    try {
      const transaction = JSON.parse(serialized) as AuthorizationTransaction;
      if (!transaction.verifier || !transaction.nonce || Date.now() - transaction.createdAt > transactionLifetime) {
        sessionStorage.removeItem(key);
        return null;
      }
      return transaction;
    } catch {
      sessionStorage.removeItem(key);
      return null;
    }
  }

  function currentRefreshToken(session: StoredSession | null) {
    if (refreshTokenStorage === "session") return session?.refresh_token;
    if (refreshTokenStorage === "memory") return memoryRefreshToken;
    return undefined;
  }

  function storeSession(tokens: TokenSet, previous?: StoredSession) {
    const expiresIn = Number(tokens.expires_in);
    const refreshToken = tokens.refresh_token ?? currentRefreshToken(previous ?? null);
    const session: StoredSession = {
      access_token: tokens.access_token,
      id_token: tokens.id_token ?? previous?.id_token ?? "",
      expires_at: Date.now() + Math.max(0, expiresIn * 1000 - expiryMargin),
      ...(refreshTokenStorage === "session" && refreshToken ? { refresh_token: refreshToken } : {}),
    };
    if (!session.access_token || !session.id_token || !Number.isFinite(expiresIn) || expiresIn <= 0) {
      throw new Error("Phản hồi định danh không chứa đủ token bắt buộc.");
    }
    if (refreshTokenStorage === "memory") memoryRefreshToken = refreshToken;
    if (userInfoToken && userInfoToken !== session.id_token) clearUserInfoCache();
    if (sessionPersistence === "memory") {
      memorySession = session;
      sessionStorage.removeItem(config.storageKey);
    } else {
      sessionStorage.setItem(config.storageKey, JSON.stringify(session));
    }
    return session;
  }

  function discoveryCacheKey() {
    return `${config.storageKey}:openid-configuration`;
  }

  function issuerBase() {
    return config.issuer.replace(/\/$/, "");
  }

  function parseTrustedUrl(value: string, label: string) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new Error(`${label} không hợp lệ.`);
    }
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.hash) {
      throw new Error(`${label} không hợp lệ.`);
    }
    if (url.protocol === "http:" && !isLoopbackHostname(url.hostname)) {
      throw new Error(`${label} phải dùng HTTPS.`);
    }
    return url;
  }

  function isLoopbackHostname(hostname: string) {
    const normalized = hostname.toLowerCase();
    return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1" || normalized === "[::1]";
  }

  function validateSameOriginApplicationUrl(value: string, label: string, requiredPathname?: string) {
    const url = parseTrustedUrl(value, label);
    if (url.origin !== window.location.origin) {
      throw new Error(`${label} không khớp domain ứng dụng.`);
    }
    if (requiredPathname && url.pathname !== requiredPathname) {
      throw new Error(`${label} không khớp đường dẫn ứng dụng.`);
    }
    return url.toString();
  }

  function validatedRedirectUri() {
    return validateSameOriginApplicationUrl(config.redirectUri(), "Redirect URI", "/auth/callback");
  }

  function validatedPostLogoutRedirectUri() {
    return validateSameOriginApplicationUrl(config.postLogoutRedirectUri(), "Post-logout redirect URI");
  }

  function standardOryDiscovery() {
    const base = issuerBase();
    return validateDiscovery({
      issuer: config.issuer,
      jwks_uri: `${base}/.well-known/jwks.json`,
      authorization_endpoint: `${base}/oauth2/auth`,
      token_endpoint: `${base}/oauth2/token`,
      end_session_endpoint: `${base}/oauth2/sessions/logout`,
    });
  }

  function validateDiscovery(document: OpenIdConfiguration) {
    if (document.issuer !== config.issuer || !document.jwks_uri || !document.authorization_endpoint || !document.token_endpoint || !document.end_session_endpoint) {
      throw new Error("Tài liệu khám phá định danh chưa đầy đủ.");
    }
    const issuerOrigin = new URL(config.issuer).origin;
    const endpoints = [document.jwks_uri, document.authorization_endpoint, document.token_endpoint, document.end_session_endpoint, document.revocation_endpoint];
    for (const endpoint of endpoints.filter((value): value is string => Boolean(value))) {
      const endpointUrl = parseTrustedUrl(endpoint, "Endpoint định danh");
      if (endpointUrl.origin !== issuerOrigin) throw new Error("Endpoint định danh không cùng issuer.");
    }
    return document;
  }

  function readCachedDiscovery() {
    const serialized = sessionStorage.getItem(discoveryCacheKey());
    if (!serialized) return null;
    try {
      const cached = JSON.parse(serialized) as { fetchedAt?: number; document?: OpenIdConfiguration };
      if (!cached.document || !Number.isFinite(cached.fetchedAt) || Date.now() - Number(cached.fetchedAt) > discoveryCacheTtl) {
        sessionStorage.removeItem(discoveryCacheKey());
        return null;
      }
      return validateDiscovery(cached.document);
    } catch {
      sessionStorage.removeItem(discoveryCacheKey());
      return null;
    }
  }

  async function loadDiscovery() {
    const cached = readCachedDiscovery();
    if (cached) return cached;
    try {
      const response = await identityFetch(`${issuerBase()}/.well-known/openid-configuration`, {
        headers: { Accept: "application/json" },
        cache: "default",
      });
      if (!response.ok) return standardOryDiscovery();
      const document = validateDiscovery(await response.json() as OpenIdConfiguration);
      sessionStorage.setItem(discoveryCacheKey(), JSON.stringify({ fetchedAt: Date.now(), document }));
      return document;
    } catch (error) {
      if (error instanceof IdentityUnavailableError) return standardOryDiscovery();
      throw error;
    }
  }

  async function discover(): Promise<OpenIdConfiguration> {
    if (!discoveryPromise) {
      discoveryPromise = loadDiscovery().catch(error => {
        discoveryPromise = null;
        throw error;
      });
    }
    return discoveryPromise;
  }

  async function verifyIdToken(idToken: string, expectedNonce?: string) {
    const document = await discover();
    keySet ??= createRemoteJWKSet(new URL(document.jwks_uri), { timeoutDuration: 10_000 });
    const clientId = config.clientId();
    const { payload } = await jwtVerify(idToken, keySet, {
      algorithms: ["RS256"],
      issuer: config.issuer,
      audience: clientId,
      requiredClaims: ["iss", "sub", "aud", "exp", "iat"],
      clockTolerance: 5,
    });
    if ((expectedNonce !== undefined && payload.nonce !== expectedNonce)
      || (Array.isArray(payload.aud) && payload.aud.length > 1 && payload.azp !== clientId)) {
      throw new Error("Phản hồi định danh không khớp giao dịch đăng nhập.");
    }
    verifiedToken = idToken;
    verifiedClaims = payload;
    return payload;
  }

  async function exchangeRefreshToken() {
    const previous = readSession();
    const refreshToken = currentRefreshToken(previous);
    if (!previous || !refreshToken) throw new SessionExpiredError();
    const { token_endpoint } = await discover();
    const response = await identityFetch(token_endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: config.clientId(),
        refresh_token: refreshToken,
      }).toString(),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (body.error === "invalid_grant" || body.error === "invalid_token") {
        clearSession();
        throw new SessionExpiredError();
      }
      throw new Error("Dịch vụ định danh tạm thời chưa khả dụng. Vui lòng thử lại.");
    }
    const tokenSet = await response.json() as TokenSet;
    const session = storeSession(tokenSet, previous);
    await verifyIdToken(session.id_token);
    return session;
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

  async function authorizedRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
    let accessToken = await getAccessToken();
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${accessToken}`);
    if (!headers.has("Accept")) headers.set("Accept", "application/json");
    let response = await identityFetch(`${config.apiIssuer}${path}`, { ...init, headers });
    if (response.status === 401) {
      const current = readSession();
      if (!current) throw new SessionExpiredError();
      if (current.access_token === accessToken) await refreshSession();
      accessToken = await getAccessToken();
      headers.set("Authorization", `Bearer ${accessToken}`);
      response = await identityFetch(`${config.apiIssuer}${path}`, { ...init, headers });
    }
    if (!response.ok) throw new Error(await responseError(response));
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  async function loadUserInfo<T extends SubjectUserInfo>() {
    const stored = readSession();
    if (!stored) throw new SessionExpiredError();
    if (userInfoProfile && userInfoToken === stored.id_token) return userInfoProfile as T;
    if (userInfoPromise && userInfoToken === stored.id_token) return await userInfoPromise as T;

    const pending = (async () => {
      const profile = await authorizedRequest<T>(config.userInfoPath, { method: "GET" });
      const current = readSession();
      if (!current) throw new SessionExpiredError();
      const claims = verifiedToken === current.id_token && verifiedClaims
        ? verifiedClaims
        : await verifyIdToken(current.id_token);
      if (claims.sub !== profile.sub) {
        clearSession();
        throw new Error("Danh tính người dùng không khớp.");
      }
      userInfoToken = current.id_token;
      userInfoProfile = profile;
      return profile;
    })();

    userInfoToken = stored.id_token;
    userInfoPromise = pending;
    try {
      return await pending as T;
    } finally {
      if (userInfoPromise === pending) userInfoPromise = null;
    }
  }

  async function beginAuthorization() {
    const state = randomValue(32);
    const nonce = randomValue(32);
    const verifier = randomValue(64);
    const challenge = await codeChallenge(verifier);
    const redirectUri = validatedRedirectUri();
    const { authorization_endpoint } = await discover();
    sessionStorage.setItem(transactionKey(state), JSON.stringify({
      verifier,
      nonce,
      createdAt: Date.now(),
    } satisfies AuthorizationTransaction));

    const defaultScopes = refreshTokenStorage === "none"
      ? ["openid", "profile", "email"]
      : ["openid", "profile", "email", "offline_access"];
    const parameters = new URLSearchParams({
      response_type: "code",
      client_id: config.clientId(),
      redirect_uri: redirectUri,
      scope: (config.scopes ?? defaultScopes).join(" "),
      state,
      nonce,
      code_challenge: challenge,
      code_challenge_method: "S256",
    });
    window.location.assign(`${authorization_endpoint}?${parameters.toString()}`);
  }

  function isAuthorizationCallback() {
    return window.location.pathname === "/auth/callback";
  }

  async function redeemAuthorizationResponse(search = window.location.search): Promise<TokenSet> {
    const parameters = new URLSearchParams(search);
    const state = parameters.get("state");
    const code = parameters.get("code");
    const error = parameters.get("error");
    const description = parameters.get("error_description");
    if (!state) throw new Error("Phản hồi định danh thiếu trường state.");
    if (error) {
      if (readTransaction(state)) sessionStorage.removeItem(transactionKey(state));
      if (callbackEnrollmentError(error, description)) {
        throw new EnrollmentRequiredError();
      }
      throw new Error(safeOidcErrorMessage(error, description));
    }
    if (!code) throw new Error("Phản hồi định danh thiếu authorization code.");

    const exchangeKey = `${state}:${code}`;
    const existingExchange = pendingExchanges.get(exchangeKey);
    if (existingExchange) return existingExchange;
    const transaction = readTransaction(state);
    if (!transaction) throw new Error("Yêu cầu đăng nhập không tồn tại, đã hết hạn hoặc đã được sử dụng.");

    const exchange = Promise.resolve().then(async () => {
      const { token_endpoint } = await discover();
      const response = await identityFetch(token_endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: config.clientId(),
          code,
          redirect_uri: validatedRedirectUri(),
          code_verifier: transaction.verifier,
        }).toString(),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const tokenSet = await response.json() as TokenSet;
      if (!tokenSet.access_token || !tokenSet.id_token || (tokenSet.token_type ?? "").toLowerCase() !== "bearer") {
        throw new Error("Phản hồi định danh không chứa đủ token bắt buộc.");
      }
      await verifyIdToken(tokenSet.id_token, transaction.nonce);
      storeSession(tokenSet);
      sessionStorage.removeItem(transactionKey(state));
      return tokenSet;
    });
    const pending = exchange.catch(error => {
      pendingExchanges.delete(exchangeKey);
      throw error;
    });
    pendingExchanges.set(exchangeKey, pending);
    return pending;
  }

  function hasStoredSession() {
    return readSession() !== null;
  }

  async function restoreSession() {
    if (!readSession()) return false;
    try {
      await getAccessToken();
      const stored = readSession();
      if (!stored) throw new SessionExpiredError();
      await verifyIdToken(stored.id_token);
      return true;
    } catch (error) {
      if (error instanceof SessionExpiredError) throw error;
      clearSession();
      throw error;
    }
  }

  async function beginLogout() {
    const session = readSession();
    const postLogoutRedirectUri = validatedPostLogoutRedirectUri();
    const { end_session_endpoint } = await discover();
    if (!end_session_endpoint) throw new Error("Nhà cung cấp định danh không hỗ trợ đăng xuất.");
    const state = randomValue(24);
    const parameters = new URLSearchParams({
      client_id: config.clientId(),
      post_logout_redirect_uri: postLogoutRedirectUri,
      id_token_hint: session?.id_token ?? "",
      state,
    });
    sessionStorage.setItem(pendingLogoutKey, JSON.stringify({ state, createdAt: Date.now() } satisfies PendingLogout));
    try {
      window.location.assign(`${end_session_endpoint}?${parameters.toString()}`);
    } catch (error) {
      sessionStorage.removeItem(pendingLogoutKey);
      throw error;
    }
  }

  return {
    authorizedRequest,
    beginAuthorization,
    beginLogout,
    clearSession,
    hasStoredSession,
    isAuthorizationCallback,
    loadUserInfo,
    redeemAuthorizationResponse,
    restoreSession,
    authenticationAssurance: () => mfaFromClaims(verifiedClaims),
    idToken: () => readSession()?.id_token ?? "",
  };
}
