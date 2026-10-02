import type { NextConfig } from "next";

import { identityBasePath } from "./lib/base-path";

const apiOrigin = process.env.IDENTITY_API_ORIGIN ?? "http://localhost:8084";
const identityBridgeOrigin = process.env.IDENTITY_BRIDGE_ORIGIN ?? "http://localhost:8085";
const basePath = identityBasePath;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(basePath ? { basePath } : {}),
  poweredByHeader: false,

  // ============================================
  // Build Performance (Next.js 15.5)
  // ============================================
  images: { unoptimized: true },

  productionBrowserSourceMaps: false,

  output: "standalone",

  logging: {
    fetches: { fullUrl: false },
  },

  experimental: {
    optimizePackageImports: [
      "framer-motion",
      "recharts",
      "@heroicons/react",
    ],
  },

  compiler: {
    removeConsole: {
      exclude: ["error", "warn"],
    },
    reactRemoveProperties: true,
  },

  // API proxy rewrite
  async rewrites() {
    const allowed = [
      "/oauth/csrf",
      "/oauth/ory/login",
      "/oauth/ory/consent",
      "/oauth/ory/logout",
      "/oauth/ory/logout/accept",
      "/api/session",
      "/api/sign-in",
      "/api/launcher",
      "/api/sessions",
      "/api/portal-entitlements",
      "/api/console/security-overview",
      "/api/console/audit-events",
      "/api/enrollment/complete",
    ];
    const apiRewrites = (prefix: string) => allowed
      .filter((path) => !path.startsWith("/oauth/ory/"))
      .map((path) => ({
      source: `${prefix}/identity-api${path}${path === "/api/sessions" ? "/:path*" : ""}`,
      destination: `${apiOrigin}${path}${path === "/api/sessions" ? "/:path*" : ""}`,
    }));
    const bridgeRewrites = (prefix: string) => allowed
      .filter((path) => path.startsWith("/oauth/ory/"))
      .map((path) => ({
        source: `${prefix}/identity-api${path}`,
        destination: `${identityBridgeOrigin}${path}`,
      }));
    const kratosOrigin = process.env.ORY_KRATOS_INTERNAL_PUBLIC_URL ?? "http://localhost:4433";

    return {
      beforeFiles: [
        ...apiRewrites(""),
        ...apiRewrites("/identity"),
        ...bridgeRewrites(""),
        ...bridgeRewrites("/identity"),
        { source: "/kratos/self-service/:path*", destination: `${kratosOrigin}/self-service/:path*` },
        { source: "/kratos/sessions/whoami", destination: `${kratosOrigin}/sessions/whoami` },
        { source: "/identity/kratos/self-service/:path*", destination: `${kratosOrigin}/self-service/:path*` },
        { source: "/identity/kratos/sessions/whoami", destination: `${kratosOrigin}/sessions/whoami` },
      ],
    };
  },
};

export default nextConfig;
