import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Disable type checking during build temporarily
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },

  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
