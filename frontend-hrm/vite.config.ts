import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@qts/oidc-client": fileURLToPath(new URL("../packages/oidc-client/src/index.ts", import.meta.url)),
    },
  },
  server: { port: 5175 },
});
