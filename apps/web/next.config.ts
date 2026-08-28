import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // ============================================
  // Build Performance (Next.js 16)
  // ============================================
  // Skip next/image optimization (chậm) - tăng tốc đáng kể
  images: { unoptimized: true },

  // Tắt source maps trong production
  productionBrowserSourceMaps: false,

  // Standalone output → image nhỏ nhất
  output: "standalone",

  // Tắt logging nặng trong production
  logging: {
    fetches: { fullUrl: false },
  },

  // ============================================
  // Compiler Optimizations (SWC - default in Next 16)
  // ============================================
  compiler: {
    // Remove console.* trong production (chỉ giữ error/warn)
    removeConsole: {
      exclude: ["error", "warn"],
    },
    // Tối ưu React component: bỏ debugging props
    reactRemoveProperties: true,
  },

  // Cache headers cho static assets (CDN friendly)
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
