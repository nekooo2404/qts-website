import { defineConfig } from "@playwright/test";

process.env.VITE_IDENTITY_ISSUER ??= "http://127.0.0.1:5196/";
process.env.VITE_API_ISSUER ??= "http://127.0.0.1:5196";
process.env.VITE_PORTAL_OIDC_CLIENT_ID ??= "qts-portal";
process.env.VITE_ALLOW_BROWSER_TOKEN_STORAGE ??= "true";
process.env.VITE_OIDC_SESSION_PERSISTENCE ??= "session";

const baseURL = process.env.PORTAL_URL ?? "http://127.0.0.1:5194";
const shouldStartServer = !process.env.PORTAL_URL;

export default defineConfig({
  testDir: "./tests/portal",
  workers: 1,
  retries: 0,
  timeout: 60_000,
  use: { channel: "chrome", baseURL, trace: "off", screenshot: "off", video: "off" },
  webServer: shouldStartServer ? {
    command: "node ../../node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5194",
    cwd: "frontend-portal/portal",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  } : undefined,
});
