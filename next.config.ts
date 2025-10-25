import type { NextConfig } from "next";

const withPWA = require("next-pwa");

const nextConfig: NextConfig = {
  /* config options here */
};

const pwaConfig = {
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "offlineCache",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      urlPattern: /^https:\/\/api\..*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "apiCache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
  buildExcludes: ["middleware-manifest.json"],
  fallback: {
    document: "/_offline",
  },
};

module.exports = withPWA(pwaConfig)(nextConfig);
