import type { NextConfig } from "next";

const apiOrigin = process.env.IDENTITY_API_ORIGIN ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  reactStrictMode: true,

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

  // Static asset cache headers
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },

  // API proxy rewrite
  async rewrites() {
    return [
      {
        source: "/identity-api/:path*",
        destination: `${apiOrigin}/:path*`,
      },
    ];
  },
};

export default nextConfig;