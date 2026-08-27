/**
 * Runtime config for the Ahona app.
 * The NestJS backend runs on port 4000; on Android emulators localhost
 * must be addressed via 10.0.2.2.
 */
import { Platform } from "react-native";

const DEV_HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";

export const API_ORIGIN = `http://${DEV_HOST}:4000`;
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
