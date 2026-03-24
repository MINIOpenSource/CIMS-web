import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // 禁用严格模式的双重渲染
  reactStrictMode: true,
};

export default nextConfig;
