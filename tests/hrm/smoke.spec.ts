import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.viewportWidth + 2);
}

async function expectNoA11yViolations(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.map((violation) => violation.id)).toEqual([]);
}

async function switchPrototypeRole(page: import("@playwright/test").Page, role: string) {
  await page.locator(".header-actions").getByRole("button", { name: /Hồ sơ/ }).click();
  await page.getByLabel("Chọn vai trò kiểm thử").selectOption(role);
  await page.keyboard.press("Escape");
}

async function openWorkflow(page: import("@playwright/test").Page) {
  await page.locator(".sidebar-nav").getByRole("button", { name: "Phê duyệt" }).click();
}

test("hrm test mode renders authenticated workspace shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".hrm-shell")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Điều hướng HRM" })).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("link", { name: "Bỏ qua đến nội dung" })).toHaveAttribute("href", "#main");
  await expect(page.locator("vite-error-overlay")).toHaveCount(0);
  await page.locator("#main").focus();
  await expect(page.locator("#main")).toBeFocused();
  await expect(page.locator("#main")).toHaveCSS("outline-style", "none");
  await expectNoHorizontalOverflow(page);
  await expectNoA11yViolations(page);
});

test("hrm mobile workspace has no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".hrm-shell")).toBeVisible();
  const workbenchTable = page.locator(".hrm-workbench-table");
  await expect(workbenchTable).toBeVisible();
  const workbenchOverflow = await workbenchTable.evaluate((element) => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
  }));
  expect(workbenchOverflow.scrollWidth).toBeLessThanOrEqual(workbenchOverflow.clientWidth + 2);
  await expect(page.locator(".hrm-workbench-table td[data-label='Kiểm soát']").first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("hrm tablet rail keeps navigation labels and active state visible", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await page.goto("/");

  const sidebar = page.locator(".sidebar");
  const navItems = sidebar.locator(".nav-item");
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

test("hrm workflow actions are gated by current role and step", async ({ page }) => {
  await page.goto("/");
  const workflowList = page.locator(".workflow-list");

  await switchPrototypeRole(page, "manager");
  await openWorkflow(page);
  await workflowList.getByRole("button", { name: /WF-2609-002.*bước Quản lý trực tiếp/i }).click();
  await expect(page.getByText("Bạn đang xử lý bước quản lý trực tiếp.")).toBeVisible();
  await page.getByRole("button", { name: /Phê duyệt yêu cầu WF-2609-002 ở bước Quản lý trực tiếp/i }).click();
  await expect(workflowList.getByRole("button", { name: /WF-2609-002.*bước Nhân sự/i })).toBeVisible();
  await expect(page.getByText("Chờ HR xử lý bước này.")).toBeVisible();
  await expect(page.getByRole("button", { name: /Phê duyệt yêu cầu WF-2609-002/i })).toHaveCount(0);

  await switchPrototypeRole(page, "hr-manager");
  await openWorkflow(page);
  await workflowList.getByRole("button", { name: /WF-2609-002.*bước Nhân sự/i }).click();
  await page.getByRole("button", { name: /Phê duyệt yêu cầu WF-2609-002 ở bước Nhân sự/i }).click();
  await expect(workflowList.getByRole("button", { name: /WF-2609-002.*bước Hoàn tất/i })).toBeVisible();
  await expect(page.getByText("Yêu cầu đã kết thúc.")).toBeVisible();
});

test("hrm reject modal focuses required reason", async ({ page }) => {
  await page.goto("/");
  await switchPrototypeRole(page, "manager");
  await openWorkflow(page);
  await page.getByRole("button", { name: /WF-2609-002.*bước Quản lý trực tiếp/i }).click();
  await page.getByRole("button", { name: /Từ chối yêu cầu WF-2609-002 ở bước Quản lý trực tiếp/i }).click();

  const reason = page.getByLabel("Lý do từ chối");
  await expect(reason).toBeFocused();
  await expect(page.getByRole("button", { name: "Xác nhận từ chối" })).toBeDisabled();
  await reason.fill("Thiếu xác nhận bàn giao ca làm việc.");
  await expect(page.getByRole("button", { name: "Xác nhận từ chối" })).toBeEnabled();
});
