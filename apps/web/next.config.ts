import type { NextConfig } from "next";

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

  // Tree-shake cho các package lớn (Next 15 vẫn cần khai báo trong experimental)
  experimental: {
    optimizePackageImports: [
      "framer-motion",
      "recharts",
      "@heroicons/react",
      "animate.css",
    ],
  },

  // SWC compiler optimizations
  compiler: {
    removeConsole: {
      exclude: ["error", "warn"],
    },
    reactRemoveProperties: true,
  },

  // Cache headers cho static assets
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
};

export default nextConfig;