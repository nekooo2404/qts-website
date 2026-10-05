import { expect, test, type Page } from "@playwright/test";
import { exportJWK, generateKeyPair, SignJWT } from "jose";

const identityIssuer = "http://127.0.0.1:5196/";
const identityApi = "http://127.0.0.1:5196";
const portalClientId = "qts-portal";
const testUser = {
  sub: "portal-user-1",
  email: "mai.nguyen@qts.com",
  email_verified: true,
  name: "Mai Nguyen",
  tid: "qts",
  tenant: "QTS",
  roles: ["portal-admin", "organization-admin"],
  permissions: [],
  data_scope: "company",
  sid: "portal-session-1",
};

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.viewportWidth + 2);
}

async function installIdentityMock(page: Page) {
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const publicJwk = await exportJWK(publicKey);
  const key = { ...publicJwk, kid: "portal-test-key", alg: "RS256", use: "sig" };
  let nonce = "";

  await page.route(`${identityApi}/.well-known/openid-configuration`, async (route) => {
    await route.fulfill({
      json: {
        issuer: identityIssuer,
        jwks_uri: `${identityApi}/jwks.json`,
        authorization_endpoint: `${identityApi}/oauth2/auth`,
        token_endpoint: `${identityApi}/oauth2/token`,
        end_session_endpoint: `${identityApi}/oauth2/sessions/logout`,
      },
    });
  });

  await page.route(`${identityApi}/jwks.json`, async (route) => {
    await route.fulfill({ json: { keys: [key] } });
  });

  await page.route(`${identityApi}/oauth2/auth**`, async (route) => {
    const url = new URL(route.request().url());
    nonce = url.searchParams.get("nonce") ?? "";
    const state = url.searchParams.get("state") ?? "";
    const redirectUri = url.searchParams.get("redirect_uri") ?? "http://127.0.0.1:5194/auth/callback";
    await route.fulfill({
      status: 302,
      headers: { location: `${redirectUri}?code=portal-test-code&state=${state}` },
      body: "",
    });
  });

  await page.route(`${identityApi}/oauth2/token`, async (route) => {
    const idToken = await new SignJWT({
      email: testUser.email,
      name: testUser.name,
      nonce,
    })
      .setProtectedHeader({ alg: "RS256", kid: "portal-test-key" })
      .setIssuer(identityIssuer)
      .setSubject(testUser.sub)
      .setAudience(portalClientId)
      .setIssuedAt()
      .setExpirationTime("10m")
      .sign(privateKey);

    await route.fulfill({
      json: {
        access_token: "portal-access-token",
        id_token: idToken,
        refresh_token: "portal-refresh-token",
        token_type: "Bearer",
        expires_in: 600,
      },
    });
  });

  await page.route(`${identityApi}/oauth/userinfo`, async (route) => {
    await route.fulfill({ json: testUser });
  });

  await page.route(`${identityApi}/api/portal-entitlements`, async (route) => {
    await route.fulfill({
      json: {
        modules: {
          Dashboard: true,
          Projects: true,
          CRM: true,
          HR: true,
          Finance: true,
          Developer: true,
          Analytics: true,
          Settings: true,
        },
        manage: { Settings: true },
        roles: testUser.roles,
      },
    });
  });

  await page.route(`${identityApi}/api/launcher`, async (route) => {
    await route.fulfill({
      json: {
        applications: [
          {
            id: "portal",
            name: "Cổng thông tin QTS",
            slug: "qts-portal",
            description: "Không gian vận hành doanh nghiệp",
            icon: "portal",
            client_id: "qts-portal",
            redirect_uri: "http://127.0.0.1:5194/auth/callback",
            status: "active",
            last_accessed_at: "2026-10-02T08:00:00.000Z",
          },
          {
            id: "hrm",
            name: "QTS HRM",
            slug: "qts-hrm",
            description: "Quản lý hồ sơ nhân sự và đơn từ",
            icon: "hrm",
            client_id: "qts-hrm",
            redirect_uri: "http://127.0.0.1:5195/auth/callback",
            status: "active",
            last_accessed_at: null,
          },
        ],
      },
    });
  });

  await page.route(`${identityApi}/api/v1/leads/**`, async (route) => {
    await route.fulfill({ json: { count: 0, next: null, previous: null, results: [] } });
  });

  await page.route(`${identityApi}/api/admin/users**`, async (route) => {
    await route.fulfill({
      json: {
        users: [
          {
            id: "user-1",
            membership_id: "membership-1",
            email: "linh.tran@qts.com",
            display_name: "Linh Tran",
            is_active: true,
            ory_id: "ory-1",
            membership: {
              id: "membership-1",
              status: "active",
              status_label: "Hoạt động",
              roles: ["employee", "manager"],
              applications: ["Cổng thông tin QTS", "QTS HRM"],
              policy_version: 1,
            },
            created_at: "2026-10-02T08:00:00.000Z",
          },
        ],
        pagination: { page: 1, page_size: 20, total: 1 },
      },
    });
  });
}

test("portal launcher gives search feedback and opens the workspace", async ({ page }) => {
  await installIdentityMock(page);

  await page.goto("/");

  await expect(page.getByRole("heading", { name: /Xin chào, Mai Nguyen/ })).toBeVisible();
  await expect(page.locator("#launcher-search-status")).toContainText("2 ứng dụng sẵn sàng mở");

  const search = page.getByLabel("Tìm ứng dụng được cấp");
  await search.fill("hrm");
  await expect(page.locator("#launcher-search-status")).toContainText("Hiển thị 1 trong 2 ứng dụng");
  await expect(page.getByRole("link", { name: /Mở QTS HRM/ })).toBeVisible();

  await page.getByLabel("Xóa tìm kiếm").click();
  await expect(search).toHaveValue("");
  await page.getByRole("button", { name: /Mở Cổng thông tin QTS/ }).click();
  await expect(page.getByRole("main", { name: "Tổng quan" })).toBeFocused();
  await expect(page.getByRole("heading", { name: /Xin chào, Mai/ })).toBeVisible();
  await page.locator(".sidebar").getByRole("button", { name: /Phân tích/ }).click();
  await expect(page.getByRole("heading", { name: "Phân tích" })).toBeVisible();
  await expect(page.getByText("Sẽ hiển thị khi có nguồn dữ liệu vận hành được kết nối.")).toBeVisible();
  await expect(page.getByText(/QTS Intelligence/)).toHaveCount(0);
  await page.locator(".sidebar").getByRole("button", { name: "Nhân sự" }).click();
  await expect(page.getByRole("heading", { name: "Con người và nhân sự" })).toBeVisible();
  const hrDraftButton = page.locator(".projects-panel").getByRole("button", { name: /Chuẩn bị bản nháp/ });
  await expect(hrDraftButton).toBeVisible();
  await expect(page.getByRole("button", { name: /Thêm nhân sự/ })).toHaveCount(0);
  await hrDraftButton.click();
  const draftDialog = page.getByRole("dialog", { name: "Chuẩn bị bản nháp hồ sơ nhân sự" });
  await expect(draftDialog).toBeVisible();
  await expect(draftDialog.getByRole("button", { name: /Chuẩn bị bản nháp/ })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("portal tablet rail keeps labels and current page visible", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await installIdentityMock(page);

  await page.goto("/");
  await page.locator(".application-card-primary").click();

  const sidebar = page.locator(".sidebar");
  const navItems = sidebar.locator(".side-link");
  await expect(sidebar).toBeVisible();
  await expect(navItems.first()).toHaveAttribute("aria-current", "page");
  await expect(navItems.first()).not.toHaveAttribute("title", /.+/);

  const visibleLabels = await navItems.locator("span").evaluateAll((nodes) =>
    nodes.slice(0, 5).map((node) => {
      const rect = node.getBoundingClientRect();
      const style = window.getComputedStyle(node);
      return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
    }),
  );
  expect(visibleLabels.length).toBeGreaterThan(0);
  expect(visibleLabels.every(Boolean)).toBe(true);
  await expectNoHorizontalOverflow(page);
});

test("mobile command palette can reach admin users and keeps table context", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installIdentityMock(page);

  await page.goto("/");
  await page.getByRole("button", { name: /Mở Cổng thông tin QTS/ }).click();
  await page.keyboard.press("Control+K");

  await page.getByLabel("Tìm tính năng").fill("tài khoản");
  await page.getByRole("button", { name: "Tài khoản nhân viên" }).click();

  await expect(page.getByRole("heading", { name: "Tài khoản nhân viên" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Chuẩn bị yêu cầu/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Thêm tài khoản/ })).toHaveCount(0);
  await expect(page.locator(".admin-users-table td[data-label='Trạng thái']")).toContainText("Hoạt động");
  await expect(page.locator(".admin-users-table td[data-label='Ứng dụng']")).toContainText("QTS HRM");
  await expectNoHorizontalOverflow(page);
});
