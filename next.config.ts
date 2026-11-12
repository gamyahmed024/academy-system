import type { NextConfig } from "next";

// Every screen is per-user and must show live data (attendance, balances), so
// pages render on each request; Cache Components is intentionally left off.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
