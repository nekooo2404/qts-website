import { defineConfig } from "@playwright/test";
const baseURL = process.env.LANDING_TEST_URL ?? "http://127.0.0.1:3000";
const shouldStartServer = !process.env.LANDING_TEST_URL;
export default defineConfig({
  testDir: "./tests/landing", workers: 1, retries: 0, timeout: 60_000,
  use: { channel: "chrome", baseURL, trace: "off" },
  webServer: shouldStartServer ? {
    command: `npm --workspace @qts/web run build && node -e "const fs=require('fs');const path=require('path');const app=path.join(process.cwd(),'frontend-client');const standalone=path.join(app,'.next','standalone');const out=path.join(standalone,'frontend-client');fs.cpSync(path.join(app,'.next','static'),path.join(out,'.next','static'),{recursive:true,force:true});if(fs.existsSync(path.join(app,'public')))fs.cpSync(path.join(app,'public'),path.join(out,'public'),{recursive:true,force:true});process.chdir(standalone);process.env.PORT='3000';process.env.HOSTNAME='127.0.0.1';require(path.join(out,'server.js'));"`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  } : undefined,
});
