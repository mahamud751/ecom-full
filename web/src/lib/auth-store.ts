"use client";

import { create } from "zustand";
import type { PublicUser } from "@/lib/user-types";
import { setAccessToken } from "@/lib/api-client";

type AuthState = {
  user: PublicUser | null;
  loading: boolean;
  authOpen: boolean;
  authTab: "login" | "register";
  setAuthOpen: (open: boolean, tab?: "login" | "register") => void;
  setUser: (user: PublicUser | null) => void;
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

  setUser: (user) => set({ user, loading: false }),

  refresh: async () => {
    try {
      const res = await fetch("/api/auth-proxy", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "customer", action: "bootstrap" }),
      });
      if (!res.ok) {
        setAccessToken("customer", null);
        set({ user: null, loading: false });
        return null;
      }
      const data = await res.json();
      setAccessToken("customer", data.accessToken || null);
      const user = data.user as PublicUser;
      set({ user, loading: false });
      return user;
    } catch {
      set({ user: null, loading: false });
      return null;
    }
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
    set({ user: null, loading: false });
  },
}));
