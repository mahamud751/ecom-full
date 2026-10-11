"use client";

import { create } from "zustand";
import type { PublicUser } from "@/lib/user-types";
import { setAccessToken } from "@/lib/api-client";

/**
 * The signed-in profile is cached in localStorage so a reload shows the
 * user instantly; the httpOnly refresh cookie stays the source of truth and
 * `refresh()` confirms (or clears) it. Tokens are never stored here.
 */
const USER_KEY = "ahona_user";

function readCachedUser(): PublicUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as PublicUser) : null;
  } catch {
    return null;
  }
}

function writeCachedUser(user: PublicUser | null) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {
    /* storage unavailable */
  }
}

/** Shared in-flight bootstrap so concurrent callers don't race the cookie */
let inflight: Promise<PublicUser | null> | null = null;

type AuthState = {
  user: PublicUser | null;
  loading: boolean;
  authOpen: boolean;
  authTab: "login" | "register";
  setAuthOpen: (open: boolean, tab?: "login" | "register") => void;
  setUser: (user: PublicUser | null) => void;
  hydrate: () => void;
  refresh: () => Promise<PublicUser | null>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  authOpen: false,
  authTab: "login",

  setAuthOpen: (open, tab) =>
    set({
      authOpen: open,
      ...(tab ? { authTab: tab } : {}),
    }),

  setUser: (user) => {
    writeCachedUser(user);
    set({ user, loading: false });
  },

  hydrate: () => {
    const cached = readCachedUser();
    if (cached && !get().user) set({ user: cached, loading: false });
  },

  refresh: () => {
    if (!inflight) {
      inflight = bootstrap().finally(() => {
        inflight = null;
      });
    }
    return inflight;
  },

  logout: async () => {
    try {
      await fetch("/api/auth-proxy", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "customer", action: "logout" }),
      });
    } catch {
      /* ignore */
    }
    setAccessToken("customer", null);
    writeCachedUser(null);
    set({ user: null, loading: false });
  },
}));

async function bootstrap(): Promise<PublicUser | null> {
  const { setUser } = useAuthStore.getState();
  try {
    const res = await fetch("/api/auth-proxy", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "customer", action: "bootstrap" }),
    });
    if (!res.ok) {
      setAccessToken("customer", null);
      setUser(null);
      return null;
    }
    const data = await res.json();
    setAccessToken("customer", data.accessToken || null);
    const user = data.user as PublicUser;
    setUser(user);
    return user;
  } catch {
    // Network error: keep any cached user rather than signing them out
    useAuthStore.setState({ loading: false });
    return useAuthStore.getState().user;
  }
}
