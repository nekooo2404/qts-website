import type { NextConfig } from "next";

const apiOrigin = process.env.IDENTITY_API_ORIGIN ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [{ source: "/identity-api/:path*", destination: `${apiOrigin}/:path*` }];
  },
};

export default nextConfig;
