import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";

const monorepoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Standalone = Docker/self-host. Sur Vercel, laisser le mode par défaut.
  ...(process.env.VERCEL
    ? {}
    : { output: "standalone", outputFileTracingRoot: monorepoRoot }),
  transpilePackages: [
    "@notoflow/ui",
    "@notoflow/editor",
    "@notoflow/types",
    "@notoflow/database-engine",
    "@notoflow/ai",
    "@notoflow/realtime",
    "@notoflow/database",
  ],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }
    return config;
  },
};

export default nextConfig;
