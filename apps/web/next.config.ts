import type { NextConfig } from "next";

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
    // Use compiled SwcTransform for faster builds
    // optimizePackageImports: ['framer-motion', 'recharts'],
  },

  // ============================================
  // Production optimizations
  // ============================================
  // Standalone output → smaller image, no node_modules needed
  output: "standalone",

  // Enable production source maps for debugging (optional)
  // productionBrowserSourceMaps: false, // Set true only if needed

  // Minify using SWC (faster than terser)
  swcMinify: true,

  // Conditionally enable logging in development only
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default nextConfig;
