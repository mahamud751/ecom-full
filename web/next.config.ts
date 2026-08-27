import type { NextConfig } from "next";

const API_ORIGIN =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000";
const apiHost = new URL(API_ORIGIN.replace(/\/api\/?$/, ""));

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],
  async rewrites() {
    // Uploaded media lives on the NestJS server; proxy it so relative
    // "/uploads/..." URLs keep working in <Image> and plain <img>.
    return [
      {
        source: "/uploads/:path*",
        destination: `${apiHost.origin}/uploads/:path*`,
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [64, 96, 128, 256, 384, 440],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "cdn2.arogga.com",
      },
    ],
    localPatterns: [
      { pathname: "/uploads/**" },
      { pathname: "/brand/**" },
      { pathname: "/icons/**" },
      { pathname: "/**" },
    ],
  },
};

export default nextConfig;
