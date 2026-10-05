import { test, expect, type Page } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHmac } from "node:crypto";

type Account = { email: string; password: string; subject?: string; user?: string; membership?: string; totp?: string };
const accountPath = ".secrets/ory-e2e-user.json";
const portal = "http://localhost:5184", hrm = "http://localhost:5185", identity = "http://localhost:3018";
const dbContainer = process.env.ORY_E2E_DB_CONTAINER ?? "qtsss-ory-check-db-1";
const dbUser = process.env.ORY_E2E_DB_USER ?? "postgres";
const dbName = process.env.ORY_E2E_DB_NAME ?? "qts";

function sql(statement: string) {
  return execFileSync("docker", [
    "exec",
    "-i",
    dbContainer,
    "psql",
    "-v",
    "ON_ERROR_STOP=1",
    "-AtX",
    "-U",
    dbUser,
    "-d",
    dbName,
    "-c",
    statement,
  ], {
    encoding: "utf8",
    timeout: 20_000,
  }).trim();
}

function sqlLiteral(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function membershipIdFor(email: string) {
  const membership = sql(`
    select m.id::text
      from identity_membership m
      join identity_user u on u.id = m.user_id
      join identity_tenant t on t.id = m.tenant_id
     where lower(u.email) = lower(${sqlLiteral(email)})
       and t.slug = 'qts-global'
     order by m.created_at desc
     limit 1
  `);
  if (!membership) throw new Error(`No qts-global membership found for ${email}`);
  return membership;
}
async function openPasswordLogin(page: Page) {
  await page.waitForURL(
    url => url.pathname.replace(/\/$/, "").endsWith("/login") && url.searchParams.has("flow"),
    { timeout: 30_000 },
  );
  const identifier = page.locator('input[name="identifier"]');
  await expect(page.getByRole("heading", { name: /Đăng nhập QTS|Log in to your QTS account/ })).toBeVisible();
  if (await expect(identifier).toBeVisible({ timeout: 15_000 }).then(() => true).catch(() => false)) return;
  const accountButton = page.getByRole("button", { name: /Tài khoản thông thường|Nhập email và mật khẩu|Tài khoản nội bộ/ }).first();
  if (await accountButton.count()) {
    await accountButton.click();
  } else {
    await page.getByRole("tab", { name: /Tài khoản nội bộ/ }).click();
  }
  await expect(identifier).toBeVisible({ timeout: 15_000 });
}

async function openCurrentPasswordLogin(page: Page) {
  await page.waitForURL(
    url => url.pathname.replace(/\/$/, "").endsWith("/login") && url.searchParams.has("flow"),
    { timeout: 30_000 },
  );
  await expect(page.getByRole("heading", { name: /Log in to your QTS account/ })).toBeVisible();
  await expect(page.locator('input[name="identifier"]')).toBeVisible({ timeout: 15_000 });
}

async function submitPasswordLogin(page: Page, email: string, password: string) {
  await openCurrentPasswordLogin(page);
  await page.locator('input[name="identifier"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[name="method"][value="password"]').click();
}

function displayNameFor(email: string) {
  const name = sql(`select display_name from identity_user where lower(email) = lower(${sqlLiteral(email)}) limit 1`);
  if (!name) throw new Error(`No display name for ${email}`);
  return name;
}

async function startPortalFromLauncher(page: Page) {
  await page.waitForURL(
    url => (
      url.origin === identity && url.pathname.replace(/\/$/, "").endsWith("/launcher")
    ) || url.origin === portal,
    { timeout: 25_000 },
  );
  if (new URL(page.url()).origin === identity) {
    await page.locator(`a.launcher-card[href^="${portal}"]`).click();
  }
  if (new URL(page.url()).origin !== portal || new URL(page.url()).pathname.includes("/auth/callback")) {
    await page.waitForURL(
      url => url.origin === portal && url.pathname.includes("/auth/callback"),
      { timeout: 30_000 },
    );
  }
  if (new URL(page.url()).pathname.includes("/auth/callback")) {
    await page.waitForURL(
      url => url.origin === portal && !url.pathname.includes("/auth/callback"),
      { timeout: 20_000 },
    );
  }
}

async function expectPortalSession(page: Page, name: string) {
  await expect(page.locator(".portal-shell, .application-card-primary").first()).toBeVisible({ timeout: 25_000 }).catch(async (error) => {
    const dump = await page.evaluate(() => ({
      url: location.href,
      heading: document.querySelector("h1")?.textContent?.trim() ?? "",
      alert: document.querySelector("[role='alert'], .login-error")?.textContent?.trim() ?? "",
      text: (document.body.innerText || "").replace(/\s+/g, " ").slice(0, 700),
      session: sessionStorage.getItem("ory-qts-portal:session") ? "present" : "missing",
    }));
    console.log("PORTAL_EXPECT_DUMP", JSON.stringify(dump));
    throw error;
  });
  await expect(page.getByText(name, { exact: false }).first()).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem("ory-qts-portal:session")!).refresh_token)).toBeUndefined();
}

async function openPortalWorkspace(page: Page) {
  const shell = page.locator(".portal-shell");
  const chooserCard = page.locator(".application-card-primary");
  await expect(shell.or(chooserCard).first()).toBeVisible({ timeout: 15_000 });
  if (await chooserCard.isVisible()) await chooserCard.click();
  await expect(shell).toBeVisible();
}

async function openPortalAppSwitcher(page: Page) {
  await page.getByRole("button", { name: "Ứng dụng QTS" }).click();
  const menu = page.getByRole("menu", { name: "Ứng dụng QTS" });
  await expect(menu).toBeVisible();
  return menu;
}

async function submitPasswordLoginAndMaybeTotp(page: Page, email: string, password: string, totpSecret?: string) {
  await submitPasswordLogin(page, email, password);
  const totpInput = page.locator('input[name="totp_code"]');
  const portalCard = page.locator(`a.launcher-card[href^="${portal}"]`);
  await expect(totpInput.or(portalCard).first()).toBeVisible({ timeout: 20_000 });
  if (await totpInput.isVisible()) {
    if (!totpSecret) throw new Error("TOTP required but fixture has no secret");
    await totpInput.fill(totp(totpSecret));
    await page.locator('button[name="method"][value="totp"]').click();
  }
}

function totp(secret: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const ch of secret.toUpperCase().replace(/=+$/, "")) bits += alphabet.indexOf(ch).toString(2).padStart(5, "0");
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const hmac = createHmac("sha1", Buffer.from(bytes)).update(counter).digest();
  const offset = hmac[19] & 15;
  return String((hmac.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(6, "0");
}

test("malformed continuation does not prevent Kratos login", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(identity + "/login?return_to=" + encodeURIComponent("http://["));
  await openPasswordLogin(page);
  await expect(page.locator('input[name="password"]')).toBeVisible();
  expect(errors).toEqual([]);
  expect(new URL(page.url()).origin).toBe("http://localhost:3018");
});

test("Kratos login, Hydra PKCE, HRM SSO, rotation, MFA and revocation", async ({ page, context }) => {
  test.setTimeout(180_000);
  const user = JSON.parse(readFileSync(accountPath, "utf8")) as Account;
  expect(user.email).toBe("ory-e2e@qts.com");
  const membershipId = user.membership || membershipIdFor(user.email);
  const displayName = displayNameFor(user.email);
  sql("update identity_tenant set require_mfa = false where slug = 'qts-global'");
  await page.goto(portal);
  await submitPasswordLoginAndMaybeTotp(page, user.email, user.password, user.totp);
  await startPortalFromLauncher(page);
  await expectPortalSession(page, displayName);
  await page.evaluate(() => { const key = "ory-qts-portal:session"; const stored = JSON.parse(sessionStorage.getItem(key)!); stored.expires_at = 1; sessionStorage.setItem(key, JSON.stringify(stored)); });
  await page.reload();
  const continueButton = page.getByRole("button", { name: /Tiếp tục|Thử lại xác minh danh tính/ });
  await expect(continueButton.or(page.locator(".portal-shell, .application-card-primary")).first()).toBeVisible({ timeout: 25_000 });
  await expect(continueButton).toHaveCount(0);
  await startPortalFromLauncher(page);
  await expect(page.locator(".login-card")).toHaveCount(0);
  await expect(page.locator('input[name="password"]')).toHaveCount(0);
  await expectPortalSession(page, displayName);

  await openPortalWorkspace(page);
  const portalMenu = await openPortalAppSwitcher(page);
  const portalTile = portalMenu.getByRole("menuitem", { name: /Cổng thông tin QTS/ });
  const hrmTile = portalMenu.locator("a", { hasText: "QTS HRM" });
  await expect(portalMenu).toContainText("Ứng dụng được cấp");
  await expect(portalTile).toHaveCount(1);
  await expect(hrmTile).toHaveAttribute("href", /^http:\/\/localhost:5185\/?\?sso=1$/);
  await expect(portalMenu.getByText("Nhân sự", { exact: true })).toHaveCount(0);
  await portalTile.click();
  await expect(page.locator(".portal-shell")).toBeVisible();
  await expect(page.locator(".launcher-page")).toHaveCount(0);

  const hrmPage = await context.newPage();
  await hrmPage.goto(hrm + "/?sso=1");
  await expect(hrmPage.locator(".hrm-shell")).toBeVisible({ timeout: 25_000 }).catch(async (error) => {
    const dump = await hrmPage.evaluate(() => ({
      url: location.href,
      heading: document.querySelector("h1")?.textContent?.trim() ?? "",
      alert: document.querySelector("[role='alert'], .auth-error")?.textContent?.trim() ?? "",
      text: (document.body.innerText || "").replace(/\s+/g, " ").slice(0, 600),
      session: sessionStorage.getItem("ory-qts-hrm:session") ? "present" : "missing",
    }));
    console.log("HRM_DUMP", JSON.stringify(dump));
    throw error;
  });
  await expect(hrmPage.getByText(displayName, { exact: false }).first()).toBeVisible();
  await expect(hrmPage.locator('input[name="password"]')).toHaveCount(0);
  const hrmAccessToken = await hrmPage.evaluate(() => JSON.parse(sessionStorage.getItem("ory-qts-hrm:session")!).access_token);

  // HRM's Portal row keeps the current tab and opens Portal's workspace directly.
  await expect(hrmPage.locator(".sidebar-nav").getByRole("button", { name: "Payroll", exact: true })).toHaveCount(0);
  await expect(hrmPage.locator(".bottom-nav").getByRole("button", { name: "Payroll", exact: true })).toHaveCount(0);
  await hrmPage.getByRole("button", { name: "Ứng dụng QTS" }).click();
  const hrmPortalTile = hrmPage.locator(".waffle-popover a", { hasText: "Cổng thông tin QTS" });
  await expect(hrmPortalTile).toHaveAttribute("href", /^http:\/\/localhost:5184\/?\?sso=1$/);
  await expect(hrmPortalTile).not.toHaveAttribute("target");
  await hrmPortalTile.click();
  await expect(hrmPage.locator(".portal-shell")).toBeVisible({ timeout: 25_000 });
  await expect(hrmPage.locator(".login-card")).toHaveCount(0);
  await expect(hrmPage.locator(".launcher-page")).toHaveCount(0);

  // A stale destination session must be replaced through the existing Kratos SSO session.
  await hrmPage.goto(hrm);
  await expect(hrmPage.locator(".hrm-shell")).toBeVisible({ timeout: 25_000 });
  await expect(hrmPage.locator(".auth-card")).toHaveCount(0);
  await hrmPage.evaluate(() => {
    const key = "ory-qts-hrm:session";
    const stored = JSON.parse(sessionStorage.getItem(key)!);
    stored.expires_at = 1;
    delete stored.refresh_token;
    sessionStorage.setItem(key, JSON.stringify(stored));
  });
  await hrmPage.goto(portal);
  await openPortalWorkspace(hrmPage);
  const staleHrmMenu = await openPortalAppSwitcher(hrmPage);
  await staleHrmMenu.locator("a", { hasText: "QTS HRM" }).click();
  await expect(hrmPage.locator(".hrm-shell")).toBeVisible({ timeout: 25_000 });
  await expect(hrmPage.locator(".auth-card")).toHaveCount(0);
  await expect(hrmPage.getByText(displayName, { exact: false }).first()).toBeVisible();
  await expect(hrmPage.locator('input[name="password"]')).toHaveCount(0);

  await hrmPage.goto(portal);
  await openPortalWorkspace(hrmPage);
  await hrmPage.evaluate(() => {
    const key = "ory-qts-portal:session";
    const stored = JSON.parse(sessionStorage.getItem(key)!);
    stored.expires_at = 1;
    delete stored.refresh_token;
    sessionStorage.setItem(key, JSON.stringify(stored));
  });
  await hrmPage.goto(hrm);
  await expect(hrmPage.locator(".hrm-shell")).toBeVisible({ timeout: 25_000 });
  await expect(hrmPage.locator(".auth-card")).toHaveCount(0);
  await hrmPage.getByRole("button", { name: "Ứng dụng QTS" }).click();
  await hrmPage.locator(".waffle-popover a", { hasText: "Cổng thông tin QTS" }).click();
  await expect(hrmPage.locator(".portal-shell")).toBeVisible({ timeout: 25_000 });
  await expect(hrmPage.locator(".login-card")).toHaveCount(0);
  await expect(hrmPage.locator('input[name="password"]')).toHaveCount(0);

  // Revoke only this isolated fixture's HRM assignment and restore it even if an assertion fails.
  const setHrmAssignment = (enabled: boolean) => sql(`
    update identity_applicationassignment aa
       set is_enabled = ${enabled ? "true" : "false"}
      from identity_application app
     where aa.application_id = app.id
       and aa.membership_id = ${sqlLiteral(membershipId)}::uuid
       and app.slug = 'qts-hrm'
  `);
  try {
    setHrmAssignment(false);
    const launcher = await page.evaluate(async () => {
      const session = JSON.parse(sessionStorage.getItem("ory-qts-portal:session")!);
      const response = await fetch("http://localhost:18084/api/launcher", { headers: { Authorization: `Bearer ${session.access_token}` } });
      return { status: response.status, applications: (await response.json()).applications };
    });
    expect(launcher.status).toBe(200);
    expect(launcher.applications).not.toEqual(expect.arrayContaining([expect.objectContaining({ slug: "qts-hrm" })]));
    await page.reload();
    await openPortalWorkspace(page);
    const revokedMenu = await openPortalAppSwitcher(page);
    await expect(revokedMenu.locator("a", { hasText: "QTS HRM" })).toHaveCount(0);
    const status = await page.evaluate(async (accessToken) => (await fetch("http://localhost:18084/oauth/userinfo", { headers: { Authorization: `Bearer ${accessToken}` } })).status, hrmAccessToken);
    expect(status).toBe(403);
  } finally { setHrmAssignment(true); }

  // Enroll TOTP through the actual Kratos browser settings flow.
  if (!user.totp) {
    const settingsResponse = page.waitForResponse(r => r.url().includes("/self-service/settings/flows"));
    await page.goto(identity + "/settings");
    const flow = await (await settingsResponse).json();
    const node = flow.ui.nodes.find((n: { attributes: { id?: string } }) => n.attributes.id === "totp_secret_key");
    user.totp = node?.attributes?.text?.context?.secret;
    expect(typeof user.totp).toBe("string");
    await page.locator('input[name="totp_code"]').fill(totp(user.totp!));
    await page.locator('button[name="method"][value="totp"]').click();
    await expect(page.locator('button[name="totp_unlink"]')).toBeVisible({ timeout: 15_000 });
    writeFileSync(accountPath, JSON.stringify(user, null, 2), { mode: 0o600 });
  }
  // End all sessions, then require AAL2 on a fresh browser.
  await page.goto(portal);
  await expect(page.getByText(displayName, { exact: false }).first()).toBeVisible();
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).first().click();
  await page.waitForURL(u => u.pathname === "/sign-out", { timeout: 20_000 });
  await page.getByRole("button", { name: /Đăng xuất/ }).click();
  await page.waitForURL(u => u.origin === portal && u.pathname !== "/sign-out", { timeout: 20_000 });
  const revoked = (await fetch("http://localhost:18084/oauth/userinfo", { headers: { Authorization: `Bearer ${hrmAccessToken}` } })).status;
  expect(revoked).toBe(401);
  await context.clearCookies();
  await page.close().catch(() => undefined);
  const mfaPage = await context.newPage();
  sql("update identity_tenant set require_mfa = true where slug = 'qts-global'");
  try {
    await mfaPage.goto(portal);
    await submitPasswordLogin(mfaPage, user.email, user.password);
    await mfaPage.locator('input[name="totp_code"]').waitFor({ timeout: 20_000 });
    await mfaPage.locator('input[name="totp_code"]').fill(totp(user.totp!));
    await mfaPage.locator('button[name="method"][value="totp"]').click();
    await startPortalFromLauncher(mfaPage);
    await expect(mfaPage.getByText(displayName, { exact: false }).first()).toBeVisible({ timeout: 25_000 });
  } finally { sql("update identity_tenant set require_mfa = false where slug = 'qts-global'"); }
});
