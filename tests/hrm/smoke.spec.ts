import { expect, test } from "@playwright/test";

test("hrm test mode renders authenticated workspace shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".hrm-shell")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Điều hướng HRM" })).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("link", { name: "Bỏ qua đến nội dung" })).toHaveAttribute("href", "#main");
  await expect(page.locator("vite-error-overlay")).toHaveCount(0);
});
