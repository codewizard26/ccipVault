import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    // Ignore ESLint errors during production builds (handled separately in CI)
    ignoreDuringBuilds: true,
  },
  turbopack: {
    root: __dirname
  }
};

export default nextConfig;
