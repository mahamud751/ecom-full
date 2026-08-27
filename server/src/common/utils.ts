/** Shared helpers ported from the original Next.js API layer */
import { HttpException } from "@nestjs/common";

/** Error response shaped like the legacy Next API routes: { error: "..." } */
export class ApiError extends HttpException {
  constructor(
    status: number,
    message: string,
    extra?: Record<string, unknown>,
  ) {
    super({ error: message, ...(extra || {}) }, status);
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Unique human-readable reference numbers: CHB-…, RF-…, TKT-…, LAB-…, CB-… */
export function makeRefNumber(prefix: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 900 + 100);
  return `${prefix}-${ts}-${rand}`;
}

export function uniqueSlug(base: string): string {
  return `${slugify(base)}-${Date.now().toString(36)}`;
}
