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

test("landing renders enterprise trust surface and hardened headers", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.ok()).toBeTruthy();

  await expect(page.getByRole("heading", { name: /QTS - nền tảng vận hành doanh nghiệp/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Những lý do doanh nghiệp có thể bắt đầu với QTS/i })).toBeVisible();
  await expect(page.getByText(/không phải ảnh chụp sản phẩm hay dữ liệu khách hàng/i)).toBeVisible();
  await expect(page.locator(".hero-system-map")).toBeVisible();
  await expect(page.locator(".hero-mac-window, .hero-window-body, .hero-inspector")).toHaveCount(0);
  await expect(page.getByText(/Bảo mật là lớp nền/i)).toBeVisible();
  await expect(page.getByLabel("Bằng chứng kỹ thuật cần kiểm tra khi triển khai QTS")).toContainText(/Audit log cho thao tác nhạy cảm/i);
  await expect(page.getByRole("banner").getByRole("link", { name: "Yêu cầu tư vấn" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Bề mặt vận hành QTS" })).toBeVisible();
  await expect(page.locator("nextjs-portal")).toHaveCount(0);

  const aiModule = page.getByRole("radio", { name: /AI: Biến tín hiệu thành hành động/i });
  await expect(aiModule).toHaveAttribute("aria-controls", "platform-preview");
  await page.getByRole("radio", { name: /ERP:/i }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(aiModule).toBeFocused();
  await expect(aiModule).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("#platform-preview")).toContainText(/Trí tuệ đáng tin cậy/i);
  await expect(page.locator("#platform-preview")).toHaveCSS("opacity", "1");

  const headers = response?.headers() ?? {};
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  await expectNoA11yViolations(page);
});

test("landing layout has no horizontal overflow on desktop and mobile", async ({ page }) => {
  for (const viewport of [
    { width: 1366, height: 768 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.locator("nextjs-portal")).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  }
});

test("landing keeps production asset budget in a safe range", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("main")).toBeVisible();
  const budget = await page.evaluate(() => {
    const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    return entries.reduce((totals, entry) => {
      const size = entry.transferSize || entry.encodedBodySize || 0;
      if (entry.initiatorType === "script") totals.script += size;
      if (entry.initiatorType === "img") totals.image += size;
      return totals;
    }, { script: 0, image: 0 });
  });
  expect(budget.script).toBeLessThan(950_000);
  expect(budget.image).toBeLessThan(2_400_000);
});
