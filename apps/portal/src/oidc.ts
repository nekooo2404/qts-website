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
  id_token: string;
  token_type: string;
  expires_in: number;
};

type OpenIdConfiguration = {
  authorization_endpoint: string;
  token_endpoint: string;
  end_session_endpoint: string;
};

const transactionPrefix = "qts-portal:oidc:";
const transactionLifetime = 10 * 60 * 1000;
const pendingExchanges = new Map<string, Promise<TokenSet>>();
let discoveryPromise: Promise<OpenIdConfiguration> | null = null;

async function discover(): Promise<OpenIdConfiguration> {
  if (!discoveryPromise) {
    discoveryPromise = fetch(`${identityIssuer}/.well-known/openid-configuration`, { headers: { Accept: "application/json" } })
      .then(async response => {
        if (!response.ok) throw new Error("The identity discovery document could not be loaded.");
        const document = await response.json() as OpenIdConfiguration;
        if (!document.authorization_endpoint || !document.token_endpoint) throw new Error("The identity discovery document is incomplete.");
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
    throw new Error("QTS Portal OIDC is not configured. Set VITE_PORTAL_OIDC_CLIENT_ID from the identity seed output.");
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
    .then((body: { error_description?: string }) => body.error_description ?? "The identity request could not be completed.");
}

function verifiedNonce(idToken: string, expectedNonce: string) {
  const payload = idToken.split(".")[1];
  if (!payload) throw new Error("The identity token is malformed.");
  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(normalized)) as { nonce?: string };
    if (claims.nonce !== expectedNonce) throw new Error("The identity response nonce is invalid.");
  } catch (error) {
    if (error instanceof Error && error.message === "The identity response nonce is invalid.") throw error;
    throw new Error("The identity token is malformed.");
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
    scope: "openid profile email",
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

  if (!state) throw new Error("The identity response is missing state.");

  if (error) {
    if (readTransaction(state)) sessionStorage.removeItem(transactionKey(state));
    throw new Error(description ?? error);
  }
  if (!code) throw new Error("The identity response is missing an authorization code.");

  const exchangeKey = `${state}:${code}`;
  const existingExchange = pendingExchanges.get(exchangeKey);
  if (existingExchange) return existingExchange;

  const transaction = readTransaction(state);
  if (!transaction) {
    throw new Error("The sign-in request is missing, expired, or has already been used.");
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
    if (!tokenSet.access_token || !tokenSet.id_token) throw new Error("The identity response did not include the required tokens.");
    verifiedNonce(tokenSet.id_token, transaction.nonce);
    return tokenSet;
  });

  pendingExchanges.set(exchangeKey, exchange);
  return exchange;
}

async function authorizedGet<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${apiIssuer}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });
  if (!response.ok) throw new Error(await responseError(response));
  return response.json() as Promise<T>;
}

export async function loadPortalIdentity(accessToken: string) {
  const [profile, entitlements] = await Promise.all([
    authorizedGet<UserInfo>("/oauth/userinfo", accessToken),
    authorizedGet<PortalEntitlements>("/api/portal-entitlements", accessToken),
  ]);
  return { profile, entitlements };
}

export async function beginLogout() {
  const { end_session_endpoint } = await discover();
  if (!end_session_endpoint) throw new Error("The identity provider does not support sign-out.");
  const parameters = new URLSearchParams({
    client_id: portalClientId(),
    post_logout_redirect_uri: postLogoutRedirectUri(),
  });
  window.location.assign(`${end_session_endpoint}?${parameters.toString()}`);
}
