import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/production",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  reporter: [["list"], ["json", { outputFile: "test-results/production/results.json" }]],
  use: {
    browserName: "chromium",
    channel: process.env.E2E_BROWSER_CHANNEL,
    ignoreHTTPSErrors: false,
    trace: "off",
    screenshot: "off",
    video: "off",
  },
});
