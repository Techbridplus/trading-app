/** @type {import('next').NextConfig} */
const path = require("path");

const appDir = __dirname;

const nextConfig = {
  // Prevent Next from scanning the parent B:\programming monorepo
  outputFileTracingRoot: appDir,
  turbopack: {
    root: appDir,
  },
  // Don't bundle Playwright during dev — avoids long hangs on startup
  serverExternalPackages: ["playwright-core", "apify-client"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "**.cdninstagram.com" },
      { protocol: "https", hostname: "pbs.twimg.com" },
      { protocol: "https", hostname: "**.fbcdn.net" },
      { protocol: "https", hostname: "yt3.ggpht.com" },
      { protocol: "https", hostname: "**.tiktokcdn.com" },
    ],
  },
};

module.exports = nextConfig;
