import { expect, test } from "@playwright/test";

test("landing renders enterprise trust surface and hardened headers", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.ok()).toBeTruthy();

  await expect(page.getByRole("heading", { name: /Kết nối Portal, HRM, Identity và quy trình/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Những lý do doanh nghiệp có thể bắt đầu với QTS/i })).toBeVisible();
  await expect(page.getByText(/không phải ảnh chụp sản phẩm hay dữ liệu khách hàng/i)).toBeVisible();
  await expect(page.getByText(/Bảo mật là lớp nền/i)).toBeVisible();
  await expect(page.getByRole("banner").getByRole("link", { name: "Yêu cầu tư vấn" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Bề mặt vận hành QTS" })).toBeVisible();
  await expect(page.locator("nextjs-portal")).toHaveCount(0);

  const aiModule = page.getByRole("button", { name: /AI: Biến tín hiệu thành hành động/i });
  await expect(aiModule).toHaveAttribute("aria-controls", "platform-preview");
  await aiModule.click();
  await expect(aiModule).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#platform-preview")).toContainText(/Trí tuệ đáng tin cậy/i);

  const headers = response?.headers() ?? {};
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
});
