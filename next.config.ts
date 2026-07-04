import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel serverless: include SQLite built at deploy time for API routes
  outputFileTracingIncludes: {
    "/*": ["./prisma/demo.db"],
  },
};

export default nextConfig;
