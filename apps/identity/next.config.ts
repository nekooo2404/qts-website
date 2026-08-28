import type { NextConfig } from "next";

const apiOrigin = process.env.IDENTITY_API_ORIGIN ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // ============================================
  // Build performance optimizations
  // ============================================
  // Skip next/image optimization — big build-time speedup
  images: { unoptimized: true },

  // Enable experimental features for faster builds
  experimental: {
    // Use newer SWC JIT for faster compilation
  },

  // ============================================
  // Production optimizations
  // ============================================
  // Standalone output → smaller image, no node_modules needed
  output: "standalone",

  // Minify using SWC (faster than terser)
  swcMinify: true,

  // Conditionally enable logging in development only
  logging: {
    fetches: {
      fullUrl: false,
    },
  },

  // API rewrites for backend proxy
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
