import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Skip next/image optimization — big build-time speedup. Re-enable if needed.
  images: { unoptimized: true },
  // Standalone output → smaller image, faster startup, no node_modules in runner
  output: "standalone",
};

export default nextConfig;
