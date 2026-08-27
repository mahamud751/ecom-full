/**
 * API client for the NestJS backend (server/ project).
 *
 * - Server components use `apiServer()` (no auth needed for catalog SSR).
 * - Client components use `apiFetch()` / `adminFetch()` / `doctorFetch()`
 *   which attach the in-memory JWT and auto-refresh via the httpOnly
 *   refresh cookie held by the `/api/auth-proxy` Next route.
 */

/** Browser-facing API base */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

/** Server-side API base (SSR pages) */
export const SERVER_API_BASE = process.env.API_URL || API_BASE;

export class ApiClientError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/* ── Server-side fetch (SSR pages, no auth) ─────────────────────── */

export async function apiServer<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${SERVER_API_BASE}${path}`, {
    ...init,
    cache: "no-store",
  });
  if (!res.ok) {
    let message = `API ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      /* ignore */
    }
    throw new ApiClientError(res.status, message);
  }
  return (await res.json()) as T;
}

/* ── Client token registry (access tokens kept in memory only) ──── */

export type AuthRole = "customer" | "admin" | "doctor";

const tokens: Record<AuthRole, string | null> = {
  customer: null,
  admin: null,
  doctor: null,
};

export function setAccessToken(role: AuthRole, token: string | null) {
  tokens[role] = token;
}

export function getAccessToken(role: AuthRole): string | null {
  return tokens[role];
}

/* ── Refresh via the Next auth proxy (httpOnly cookie) ──────────── */

const refreshing: Partial<Record<AuthRole, Promise<string | null>>> = {};

async function refreshAccessToken(role: AuthRole): Promise<string | null> {
  try {
    const res = await fetch("/api/auth-proxy", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: role, action: "refresh" }),
    });
    if (!res.ok) {
      tokens[role] = null;
      return null;
    }
    const data = await res.json();
    tokens[role] = data.accessToken || null;
    return tokens[role];
  } catch {
    tokens[role] = null;
    return null;
  }
}

/* ── Authenticated client fetch with one 401 auto-refresh retry ─── */

export async function authedFetch(
  role: AuthRole,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const doFetch = (token: string | null) => {
    const headers = new Headers(init.headers || undefined);
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return fetch(url, { ...init, headers });
  };

  let res = await doFetch(tokens[role]);
  if (res.status === 401) {
    // Deduplicate concurrent refreshes per role
    if (!refreshing[role]) {
      refreshing[role] = refreshAccessToken(role).finally(() => {
        delete refreshing[role];
      });
    }
    const token = await refreshing[role];
    if (token) res = await doFetch(token);
  }
  return res;
}

/** Customer-scoped fetch */
export function apiFetch(path: string, init?: RequestInit) {
  return authedFetch("customer", path, init);
}

/** Admin-scoped fetch */
export function adminFetch(path: string, init?: RequestInit) {
  return authedFetch("admin", path, init);
}

/** Doctor-scoped fetch */
export function doctorFetch(path: string, init?: RequestInit) {
  return authedFetch("doctor", path, init);
}

/** Resolve media/upload URLs served by the backend */
export function mediaUrl(src: string | null | undefined): string {
  if (!src) return "";
  if (src.startsWith("http")) return src;
  const origin = API_BASE.replace(/\/api\/?$/, "");
  return `${origin}${src.startsWith("/") ? "" : "/"}${src}`;
}
