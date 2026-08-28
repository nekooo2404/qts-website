export type IdentitySession = {
  authenticated: boolean;
  user: { id: string; email: string; name: string };
  tenant: { id: string; slug: string; name: string };
  session: { id: string; auth_time: string; amr: string[] };
  roles: string[];
  permissions: string[];
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

export type SecurityOverview = {
  active_users: number;
  failed_logins: number;
  mfa_adoption: number;
  risk_level: string;
  connected_applications: number;
};

const api = "/identity-api";

export async function identityFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${api}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init.headers },
    ...init,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error_description ?? "The identity request could not be completed.");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function getCsrfToken() {
  const result = await identityFetch<{ csrfToken: string }>("/oauth/csrf");
  return result.csrfToken;
}

export function csrfHeaders(token: string) {
  return { "X-CSRFToken": token };
}

const transactionLifetime = 10 * 60 * 1000;

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

export async function authorizeUrl(clientId: string, redirectUri: string, scopes = ["openid", "profile", "email"]): Promise<string> {
  const state = randomValue(32);
  const nonce = randomValue(32);
  const verifier = randomValue(64);
  const challenge = await codeChallenge(verifier);
  sessionStorage.setItem(`qts-authorize:${state}`, JSON.stringify({ clientId, redirectUri, verifier, nonce, createdAt: Date.now() }));
  // Expire stale transactions opportunistically
  for (let index = 0; index < sessionStorage.length; index += 1) {
    const key = sessionStorage.key(index);
    if (!key?.startsWith("qts-authorize:")) continue;
    try {
      const payload = JSON.parse(sessionStorage.getItem(key) ?? "{}") as { createdAt?: number };
      if (typeof payload.createdAt === "number" && Date.now() - payload.createdAt > transactionLifetime) sessionStorage.removeItem(key);
    } catch { sessionStorage.removeItem(key); }
  }
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes.join(" "),
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  return `${api}/oauth/authorize?${params.toString()}`;
}

export function dateTime(value: string | null) {
  if (!value) return "Not yet opened";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}
