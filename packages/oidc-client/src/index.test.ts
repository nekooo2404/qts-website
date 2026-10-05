import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { exportJWK, generateKeyPair, SignJWT } from "jose";

import { createOidcClient, IdentityUnavailableError, SilentAuthorizationRequiredError } from "./index.ts";

const issuer = "https://sso.test/";
const apiIssuer = "https://api.test";
const clientId = "qts-portal";
const storageKey = "oidc-client-test:session";
const transactionPrefix = "oidc-client-test:transaction:";
const subject = "test-subject";

const globalDescriptors = {
  fetch: Object.getOwnPropertyDescriptor(globalThis, "fetch"),
  sessionStorage: Object.getOwnPropertyDescriptor(globalThis, "sessionStorage"),
  window: Object.getOwnPropertyDescriptor(globalThis, "window"),
};

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, String(value));
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

type FetchRecord = {
  url: URL;
  method: string;
  cache: RequestCache | undefined;
  authorization: string | null;
  body: string | undefined;
};

type HarnessOptions = {
  discovery?: Record<string, string | undefined>;
  expiresAt?: number;
  issuer?: string;
  initialAccessToken?: string;
  postLogoutRedirectUri?: () => string;
  redirectUri?: () => string;
  refreshTokenStorage?: "memory" | "session" | "none";
  sessionPersistence?: "memory" | "session";
  seedSession?: boolean;
  tokenNonce?: string;
  tokenIdToken?: string;
  userInfoSub?: string;
  retryFirstRequest?: boolean;
  useDefaultSessionPersistence?: boolean;
};

type Harness = {
  assigned: string[];
  client: ReturnType<typeof createOidcClient>;
  count: (pathname: string, method?: string) => number;
  discoveryPath: string;
  makeClient: () => ReturnType<typeof createOidcClient>;
  records: FetchRecord[];
  resetRecords: () => void;
  storage: MemoryStorage;
  tokenNonce: string | undefined;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function restoreGlobal(name: keyof typeof globalDescriptors) {
  const descriptor = globalDescriptors[name];
  if (descriptor) Object.defineProperty(globalThis, name, descriptor);
  else Reflect.deleteProperty(globalThis, name);
}

afterEach(() => {
  restoreGlobal("fetch");
  restoreGlobal("sessionStorage");
  restoreGlobal("window");
});

async function createHarness(options: HarnessOptions = {}): Promise<Harness> {
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const publicJwk = await exportJWK(publicKey);
  const storage = new MemoryStorage();
  const records: FetchRecord[] = [];
  const assigned: string[] = [];
  const testIssuer = options.issuer ?? issuer;
  const location = {
    origin: "https://portal.test",
    pathname: "/",
    search: "",
    assign(url: string) {
      assigned.push(url);
    },
  };
  const discovery = {
    issuer: testIssuer,
    jwks_uri: `${testIssuer}jwks.json`,
    authorization_endpoint: `${testIssuer}oauth2/auth`,
    token_endpoint: `${testIssuer}oauth2/token`,
    end_session_endpoint: `${testIssuer}oauth2/sessions/logout`,
    ...options.discovery,
  };
  const initialAccessToken = options.initialAccessToken ?? "access-token-1";
  const refreshTokenStorage = options.refreshTokenStorage ?? "memory";
  const sessionPersistence = options.sessionPersistence ?? "session";
  const initialIdToken = await signToken(privateKey);
  const state: { tokenNonce?: string } = { tokenNonce: options.tokenNonce };

  async function tokenResponse() {
    return json({
      access_token: "access-token-2",
      id_token: options.tokenIdToken ?? await signToken(privateKey, state.tokenNonce),
      refresh_token: "refresh-token-2",
      token_type: "Bearer",
      expires_in: 300,
    });
  }

  const fetchMock = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const request = input instanceof Request ? input : undefined;
    const url = new URL(
      typeof input === "string" ? input : input instanceof URL ? input.href : input.url,
    );
    const headers = new Headers(init.headers ?? request?.headers);
    const method = init.method ?? request?.method ?? "GET";
    records.push({
      url,
      method,
      cache: init.cache ?? request?.cache,
      authorization: headers.get("Authorization"),
      body: typeof init.body === "string" ? init.body : undefined,
    });

    if (url.href === `${testIssuer.replace(/\/$/, "")}/.well-known/openid-configuration`) return json(discovery);
    if (url.href === `${testIssuer}jwks.json`) {
      return json({ keys: [{ ...publicJwk, kid: "test-key", alg: "RS256", use: "sig" }] });
    }
    if (url.href === `${testIssuer}oauth2/token`) return tokenResponse();
    if (url.href === `${apiIssuer}/oauth/userinfo`) {
      return json({ sub: options.userInfoSub ?? subject, email: "user@example.test", name: "Test User" });
    }
    if (url.href === `${apiIssuer}/api/portal-entitlements`) return json({ modules: {}, manage: {}, roles: [] });
    if (url.href === `${apiIssuer}/api/launcher`) return json({ applications: [] });
    if (url.href === `${apiIssuer}/api/retry`) {
      if (options.retryFirstRequest && headers.get("Authorization") === `Bearer ${initialAccessToken}`) {
        return json({ error_description: "expired" }, 401);
      }
      return json({ ok: true });
    }
    return json({ ok: true });
  };

  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: storage });
  Object.defineProperty(globalThis, "window", { configurable: true, value: { location } });
  Object.defineProperty(globalThis, "fetch", { configurable: true, value: fetchMock });

  function makeClient() {
    const config = {
      issuer: testIssuer,
      apiIssuer,
      clientId: () => clientId,
      redirectUri: options.redirectUri ?? (() => "https://portal.test/auth/callback"),
      postLogoutRedirectUri: options.postLogoutRedirectUri ?? (() => "https://portal.test/"),
      storageKey,
      transactionPrefix,
      userInfoPath: "/oauth/userinfo",
      refreshTokenStorage,
      ...(options.useDefaultSessionPersistence ? {} : { sessionPersistence }),
    };
    return createOidcClient(config);
  }

  if (options.seedSession ?? true) {
    storage.setItem(storageKey, JSON.stringify({
      access_token: initialAccessToken,
      id_token: initialIdToken,
      expires_at: options.expiresAt ?? Date.now() + 300_000,
      ...(refreshTokenStorage === "session" ? { refresh_token: "refresh-token-1" } : {}),
    }));
  }

  return {
    assigned,
    client: makeClient(),
    count: (pathname, method) => records.filter(record => record.url.pathname === pathname
      && (method === undefined || record.method === method)).length,
    discoveryPath: "/.well-known/openid-configuration",
    makeClient,
    records,
    resetRecords: () => { records.length = 0; },
    storage,
    get tokenNonce() { return state.tokenNonce; },
    set tokenNonce(value: string | undefined) { state.tokenNonce = value; },
  };
}

async function signToken(privateKey: CryptoKey, nonce?: string) {
  return new SignJWT({ email: "user@example.test", ...(nonce ? { nonce } : {}) })
    .setProtectedHeader({ alg: "RS256", kid: "test-key" })
    .setIssuer(issuer)
    .setAudience(clientId)
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(privateKey);
}

function authorizationState(harness: Harness) {
  const url = new URL(harness.assigned.at(-1) ?? "");
  return url.searchParams.get("state") ?? "";
}

test("authorization uses an S256 PKCE transaction and rejects state reuse", async () => {
  const harness = await createHarness({ seedSession: false });

  await harness.client.beginAuthorization();

  const url = new URL(harness.assigned.at(-1) ?? "");
  const state = url.searchParams.get("state") ?? "";
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.ok(url.searchParams.get("code_challenge"));
  assert.ok(url.searchParams.get("nonce"));
  assert.ok(state);

  const transaction = JSON.parse(harness.storage.getItem(`${transactionPrefix}${state}`) ?? "{}");
  assert.ok(transaction.verifier);
  assert.equal(transaction.nonce, url.searchParams.get("nonce"));

  await assert.rejects(() => harness.client.redeemAuthorizationResponse("?code=code-1&state=wrong-state"));
  harness.tokenNonce = transaction.nonce;
  await harness.client.redeemAuthorizationResponse(`?code=code-1&state=${state}`);
  assert.equal(harness.storage.getItem(`${transactionPrefix}${state}`), null);

  await assert.rejects(() => harness.makeClient().redeemAuthorizationResponse(`?code=code-1&state=${state}`));
});

test("silent authorization keeps PKCE state and exposes login-required fallback", async () => {
  const harness = await createHarness({ seedSession: false });

  await harness.client.beginAuthorization({ prompt: "none" });

  const url = new URL(harness.assigned.at(-1) ?? "");
  const state = url.searchParams.get("state") ?? "";
  assert.equal(url.searchParams.get("prompt"), "none");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.ok(url.searchParams.get("code_challenge"));
  assert.ok(url.searchParams.get("nonce"));

  const transaction = JSON.parse(harness.storage.getItem(`${transactionPrefix}${state}`) ?? "{}");
  assert.equal(transaction.prompt, "none");
  assert.ok(transaction.verifier);
  assert.equal(transaction.nonce, url.searchParams.get("nonce"));

  await assert.rejects(
    () => harness.client.redeemAuthorizationResponse(`?error=login_required&state=${state}`),
    error => error instanceof SilentAuthorizationRequiredError,
  );
  assert.equal(harness.storage.getItem(`${transactionPrefix}${state}`), null);

  await harness.client.beginAuthorization({ prompt: "none" });
  const consentState = new URL(harness.assigned.at(-1) ?? "").searchParams.get("state") ?? "";
  await assert.rejects(
    () => harness.client.redeemAuthorizationResponse(`?error=consent_required&state=${consentState}`),
    error => error instanceof SilentAuthorizationRequiredError,
  );
  assert.equal(harness.storage.getItem(`${transactionPrefix}${consentState}`), null);
});

test("callback rejects a mismatched nonce without storing a session", async () => {
  const harness = await createHarness({ seedSession: false, tokenNonce: "wrong-nonce" });
  await harness.client.beginAuthorization();

  await assert.rejects(() => harness.client.redeemAuthorizationResponse(
    `?code=code-1&state=${authorizationState(harness)}`,
  ));

  assert.equal(harness.storage.getItem(storageKey), null);
});

test("callback exposes enrollment-required interaction as a typed error and clears its transaction", async () => {
  const harness = await createHarness({ seedSession: false });
  await harness.client.beginAuthorization();
  const state = authorizationState(harness);

  await assert.rejects(
    () => harness.client.redeemAuthorizationResponse(
      `?error=interaction_required&error_description=${encodeURIComponent("enrollment_required: Tài khoản phải đổi mật khẩu, thiết lập TOTP và lưu mã dự phòng.")}&state=${state}`,
    ),
    error => error instanceof Error
      && error.name === "EnrollmentRequiredError"
      && error.message.includes("đổi mật khẩu"),
  );
  assert.equal(harness.storage.getItem(`${transactionPrefix}${state}`), null);
});

test("default session persistence keeps token sets out of browser storage", async () => {
  const harness = await createHarness({ seedSession: false, useDefaultSessionPersistence: true });
  await harness.client.beginAuthorization();
  const state = authorizationState(harness);
  const transaction = JSON.parse(harness.storage.getItem(`${transactionPrefix}${state}`) ?? "{}");
  harness.tokenNonce = transaction.nonce;

  await harness.client.redeemAuthorizationResponse(`?code=code-1&state=${state}`);

  assert.equal(harness.storage.getItem(storageKey), null);
  assert.equal(harness.client.hasStoredSession(), true);
  await harness.client.loadUserInfo();
  assert.equal(
    harness.records.find(record => record.url.pathname === "/oauth/userinfo")?.authorization,
    "Bearer access-token-2",
  );
});

test("authorization rejects cross-origin redirect URIs before navigation", async () => {
  const harness = await createHarness({
    seedSession: false,
    redirectUri: () => "https://attacker.test/auth/callback",
  });

  await assert.rejects(
    () => harness.client.beginAuthorization(),
    error => error instanceof Error && error.message.includes("Redirect URI"),
  );

  assert.equal(harness.assigned.length, 0);
  assert.equal(harness.count(harness.discoveryPath, "GET"), 0);
});

test("logout rejects cross-origin post-logout redirect URIs before navigation", async () => {
  const harness = await createHarness({
    postLogoutRedirectUri: () => "https://attacker.test/",
  });

  await assert.rejects(
    () => harness.client.beginLogout(),
    error => error instanceof Error && error.message.includes("Post-logout redirect URI"),
  );

  assert.equal(harness.assigned.length, 0);
  assert.equal(harness.count(harness.discoveryPath, "GET"), 0);
});

test("discovery rejects an issuer mismatch and off-origin endpoints", async () => {
  const issuerMismatch = await createHarness({
    seedSession: false,
    discovery: { issuer: "https://different-sso.test/" },
  });
  await assert.rejects(() => issuerMismatch.client.beginAuthorization());

  for (const endpoint of [
    "jwks_uri",
    "authorization_endpoint",
    "token_endpoint",
    "end_session_endpoint",
    "revocation_endpoint",
  ]) {
    const harness = await createHarness({
      seedSession: false,
      discovery: { [endpoint]: "https://attacker.test/endpoint" },
    });
    await assert.rejects(() => harness.client.beginAuthorization());
  }

  for (const authorization_endpoint of [
    `${issuer}oauth2/auth#fragment`,
    "https://user:pass@sso.test/oauth2/auth",
  ]) {
    const harness = await createHarness({
      seedSession: false,
      discovery: { authorization_endpoint },
    });
    await assert.rejects(() => harness.client.beginAuthorization());
  }
});

test("remote http issuer is rejected while localhost http remains valid for development", async () => {
  const remoteHttp = await createHarness({
    seedSession: false,
    issuer: "http://sso.test/",
  });
  await assert.rejects(() => remoteHttp.client.beginAuthorization(), /HTTPS/);

  const localHttp = await createHarness({
    seedSession: false,
    issuer: "http://localhost:4444/",
  });
  await localHttp.client.beginAuthorization();
  assert.equal(localHttp.assigned.length, 1);
});

test("callback errors do not expose provider-supplied descriptions", async () => {
  const harness = await createHarness({ seedSession: false });
  await harness.client.beginAuthorization();
  const state = authorizationState(harness);

  await assert.rejects(
    () => harness.client.redeemAuthorizationResponse(
      `?error=server_error&error_description=${encodeURIComponent("SQL stack trace: password=abc")}&state=${state}`,
    ),
    error => error instanceof Error
      && !error.message.includes("SQL stack trace")
      && !error.message.includes("password=abc"),
  );
});

test("userinfo subject mismatches clear the stored session", async () => {
  const harness = await createHarness({ userInfoSub: "other-subject" });

  await assert.rejects(() => harness.client.loadUserInfo(), /Danh tính/);

  assert.equal(harness.storage.getItem(storageKey), null);
});

test("overlapping expired requests use one refresh-token exchange", async () => {
  const harness = await createHarness({
    expiresAt: Date.now() - 1,
    refreshTokenStorage: "session",
  });

  await Promise.all([
    harness.client.authorizedRequest("/api/one"),
    harness.client.authorizedRequest("/api/two"),
  ]);

  assert.equal(harness.count("/oauth2/token", "POST"), 1);
});

test("a 401 refreshes once and retries the authorized request", async () => {
  const harness = await createHarness({
    refreshTokenStorage: "session",
    retryFirstRequest: true,
  });

  assert.deepEqual(await harness.client.authorizedRequest("/api/retry"), { ok: true });
  assert.equal(harness.count("/oauth2/token", "POST"), 1);
  assert.equal(harness.count("/api/retry", "GET"), 2);
});

test("authorized requests may target a separate absolute API origin", async () => {
  const harness = await createHarness();

  assert.deepEqual(await harness.client.authorizedRequest("https://hrm-api.test/api/v1/employees"), { ok: true });

  const record = harness.records.find(item => item.url.origin === "https://hrm-api.test");
  assert.equal(record?.url.pathname, "/api/v1/employees");
  assert.equal(record?.authorization, "Bearer access-token-1");
});

test("only discovery is cacheable; token, userinfo, and API requests remain no-store", async () => {
  const harness = await createHarness({ seedSession: false });
  await harness.client.beginAuthorization();
  const state = authorizationState(harness);
  const transaction = JSON.parse(harness.storage.getItem(`${transactionPrefix}${state}`) ?? "{}");
  harness.tokenNonce = transaction.nonce;
  await harness.client.redeemAuthorizationResponse(`?code=code-1&state=${state}`);
  await harness.client.loadUserInfo();
  await harness.client.authorizedRequest("/api/portal-entitlements", { method: "GET" });

  assert.equal(harness.records.find(record => record.url.pathname === harness.discoveryPath)?.cache, "default");
  for (const pathname of ["/oauth2/token", "/oauth/userinfo", "/api/portal-entitlements"]) {
    assert.equal(harness.records.find(record => record.url.pathname === pathname)?.cache, "no-store");
  }
});

test("restoring a session verifies locally and leaves one parallel userinfo request", async () => {
  const harness = await createHarness();

  await harness.client.restoreSession();
  assert.equal(harness.count("/oauth/userinfo", "GET"), 0);
  await Promise.all([
    harness.client.loadUserInfo(),
    harness.client.authorizedRequest("/api/portal-entitlements", { method: "GET" }),
    harness.client.authorizedRequest("/api/launcher", { method: "GET" }),
  ]);

  assert.equal(harness.count("/oauth/userinfo", "GET"), 1);
  assert.equal(harness.count("/api/portal-entitlements", "GET"), 1);
  assert.equal(harness.count("/api/launcher", "GET"), 1);
});

test("concurrent userinfo loads share one request for the current ID token", async () => {
  const harness = await createHarness();

  await Promise.all([harness.client.loadUserInfo(), harness.client.loadUserInfo()]);

  assert.equal(harness.count("/oauth/userinfo", "GET"), 1);
});

test("a second client reuses valid cached discovery metadata", async () => {
  const harness = await createHarness({ seedSession: false });
  await harness.client.beginAuthorization();
  assert.equal(harness.count(harness.discoveryPath, "GET"), 1);

  harness.resetRecords();
  await harness.makeClient().beginAuthorization();

  assert.equal(harness.count(harness.discoveryPath, "GET"), 0);
});

test("authorization falls back to standard Ory endpoints when discovery fetch fails", async () => {
  const harness = await createHarness({ seedSession: false });
  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    value: async () => {
      throw new TypeError("Failed to fetch");
    },
  });

  await harness.client.beginAuthorization();

  const url = new URL(harness.assigned.at(-1) ?? "");
  assert.equal(url.origin, new URL(issuer).origin);
  assert.equal(url.pathname, "/oauth2/auth");
  assert.equal(url.searchParams.get("client_id"), clientId);
});

test("token exchange network failures remain a safe Identity unavailable error", async () => {
  const harness = await createHarness({ seedSession: false });
  await harness.client.beginAuthorization();
  const state = authorizationState(harness);
  const transaction = JSON.parse(harness.storage.getItem(`${transactionPrefix}${state}`) ?? "{}");
  harness.tokenNonce = transaction.nonce;
  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    value: async () => {
      throw new TypeError("Failed to fetch");
    },
  });

  await assert.rejects(
    () => harness.client.redeemAuthorizationResponse(`?code=code-1&state=${state}`),
    error => error instanceof IdentityUnavailableError
      && error.message.includes("QTS Identity")
      && !error.message.includes("Failed to fetch"),
  );
});
