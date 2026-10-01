import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/ory", workers: 1, retries: 0, timeout: 120_000,
  reporter: [["list"], ["json", { outputFile: "test-results/ory/results.json" }]],
  use: { channel: "chrome", trace: "off", screenshot: "off", video: "off" },
  preserveOutput: "never",
});
