import { defineConfig } from "@playwright/test";

process.env.VITE_HRM_TEST_MODE ??= "1";
process.env.VITE_ALLOW_INSECURE_LOCAL_OIDC ??= "true";

const baseURL = process.env.HRM_TEST_URL ?? "http://127.0.0.1:5195";
const shouldStartServer = !process.env.HRM_TEST_URL;

export default defineConfig({
  testDir: "./tests/hrm",
  workers: 1,
  retries: 0,
  timeout: 60_000,
  use: { channel: "chrome", baseURL, trace: "off", screenshot: "off", video: "off" },
  webServer: shouldStartServer ? {
    command: "npm --workspace @qts/hrm run dev -- --host 127.0.0.1 --port 5195",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  } : undefined,
});
