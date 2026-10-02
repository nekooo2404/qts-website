import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@qts/app-chrome/styles.css": fileURLToPath(new URL("../../packages/app-chrome/src/styles.css", import.meta.url)),
      "@qts/app-chrome": fileURLToPath(new URL("../../packages/app-chrome/src/index.tsx", import.meta.url)),
      "@qts/oidc-client": fileURLToPath(new URL("../../packages/oidc-client/src/index.ts", import.meta.url)),
    },
  },
  server: { port: 5174 },
});
