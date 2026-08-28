import type { NextConfig } from "next";

const apiOrigin = process.env.IDENTITY_API_ORIGIN ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Skip next/image optimization at build/runtime — significant speedup,
  // <img> is rendered instead. Re-enable if you use next/image heavily.
  images: { unoptimized: true },
  // Standalone output → smaller image, faster startup
  output: "standalone",
  async rewrites() {
    return [{ source: "/identity-api/:path*", destination: `${apiOrigin}/:path*` }];
  },
};

export default nextConfig;
