/**
 * Runtime config for the Ahona app.
 * In dev, the NestJS backend runs on localhost:4000; on Android emulators
 * localhost must be addressed via 10.0.2.2. A release build must never ship
 * pointing at a loopback address, so it always uses PROD_API_ORIGIN below —
 * replace it with the deployed backend's real HTTPS origin before publishing.
 */
import { PixelRatio, Platform } from "react-native";

const DEV_HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";
const PROD_API_ORIGIN = "https://api.ahona.store";

export const API_ORIGIN = __DEV__ ? `http://${DEV_HOST}:4000` : PROD_API_ORIGIN;
export const API_BASE = `${API_ORIGIN}/api`;

/** Resolve a stored media path (e.g. "/uploads/x.jpg") to a full URL */
export function mediaUrl(src?: string | null): string {
  if (!src) return "";
  if (src.startsWith("http")) return src;
  return `${API_ORIGIN}${src.startsWith("/") ? "" : "/"}${src}`;
}

/**
 * Like mediaUrl, but asks for an image sized to `widthDp` on this screen.
 * Our own /uploads are resized to WebP by the server (`?w=`, snapped to a few
 * widths); Unsplash URLs get their own `w` param. Anything else is unchanged.
 */
export function thumbUrl(src: string | null | undefined, widthDp: number): string {
  if (!src) return "";
  const px = Math.round(widthDp * PixelRatio.get());
  if (src.startsWith("/uploads/")) return `${mediaUrl(src)}?w=${px}`;
  if (src.startsWith("https://images.unsplash.com/")) {
    // Scale w and h together so `fit=crop` keeps the original aspect ratio.
    const w = Number(src.match(/[?&]w=(\d+)/)?.[1]);
    if (!w) return src;
    const k = Math.min(1, px / w);
    return src.replace(/([?&])([wh])=(\d+)/g, (_, sep, key, v) =>
      `${sep}${key}=${Math.round(Number(v) * k)}`,
    );
  }
  return mediaUrl(src);
}

export const BRAND = {
  name: "Ahona",
  tagline: "Health & Beauty, delivered at dawn",
  currency: "৳",
  supportPhone: "+8801700000000",
  supportEmail: "support@ahona.store",
};
