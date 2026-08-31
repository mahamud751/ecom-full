import type { NextConfig } from "next";
import path from "path";

const API_ORIGIN =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000";
const apiHost = new URL(API_ORIGIN.replace(/\/api\/?$/, ""));

const nextConfig: NextConfig = {
  // Repo root also contains the sibling server/ and app/ projects; pin
  // Next's workspace root here so lockfile inference and file tracing
  // stay within this project.
  outputFileTracingRoot: path.join(__dirname),
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
    qualities: [75, 85, 90, 92, 95],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [64, 96, 128, 256, 384, 440],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    dangerouslyAllowSVG: true,
    contentDispositionType: "inline",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.openbeautyfacts.org",
      },
      {
        protocol: "https",
        hostname: "static.openbeautyfacts.org",
      },
      {
        protocol: "https",
        hostname: "images.openfoodfacts.org",
      },
      {
        protocol: "https",
        hostname: "static.openfoodfacts.org",
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
