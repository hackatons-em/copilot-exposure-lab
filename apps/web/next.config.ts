import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@cel/types"],
  eslint: { ignoreDuringBuilds: false },
};

export default nextConfig;
