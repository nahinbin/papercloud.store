import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compress: true, // Enable gzip compression
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
    formats: ["image/avif", "image/webp"], // Modern image formats
    minimumCacheTTL: 60, // Cache optimized images for 60 seconds
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Optimize production builds
  swcMinify: true,
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ["@vercel/speed-insights"],
    optimizeCss: true, // Optimize CSS output
  },
  // Optimize production builds
  productionBrowserSourceMaps: false, // Disable source maps in production for faster builds
};

export default nextConfig;
