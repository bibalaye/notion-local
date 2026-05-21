import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
};

export default nextConfig;
