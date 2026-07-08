import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/*": ["./prisma/migrations/**/*"],
  },
};

export default nextConfig;
