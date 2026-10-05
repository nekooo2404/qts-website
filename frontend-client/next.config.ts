import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "same-origin" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.qtsgroup.vn https://sso.qtsgroup.vn https://qtsgroup.vn",
      "object-src 'none'",
      "frame-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "manifest-src 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  distDir: process.env.QTS_WEB_DIST_DIR ?? ".next",
  reactStrictMode: true,

  // ============================================
  // Build Performance (Next.js 15.5)
  // ============================================
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [68, 75],
  },

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
    ],
  },

  // SWC compiler optimizations
  compiler: {
    removeConsole: {
      exclude: ["error", "warn"],
    },
    reactRemoveProperties: true,
  },

  poweredByHeader: false,

  async rewrites() {
    const api = process.env.API_INTERNAL_ORIGIN ?? "http://localhost:8081";
    const cms = process.env.CMS_INTERNAL_ORIGIN ?? "http://cms:8000";
    return [
      { source: "/api/:path*", destination: `${api}/api/:path*` },
      { source: "/cms-api/:path*", destination: `${cms}/api/:path*` },
    ];
  },

  // Cache headers cho CMS media. Next tự quản lý immutable cache cho /_next/static.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/cms-media/:path*",
        headers: [
          ...securityHeaders,
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          ...securityHeaders,
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
    ];
  },
};

export default nextConfig;
