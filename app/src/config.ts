/**
 * Runtime config for the Ahona app.
 * In dev, the NestJS backend runs on localhost:4000; on Android emulators
 * localhost must be addressed via 10.0.2.2. A release build must never ship
 * pointing at a loopback address, so it always uses PROD_API_ORIGIN below —
 * replace it with the deployed backend's real HTTPS origin before publishing.
 */
import { Platform } from "react-native";

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

export const BRAND = {
  name: "Ahona",
  tagline: "Health & Beauty, delivered at dawn",
  currency: "৳",
  supportPhone: "+8801700000000",
  supportEmail: "support@ahona.store",
};
