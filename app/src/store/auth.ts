/**
 * Customer auth store — JWT pair from the NestJS backend.
 * Access token stays in memory (api/client.ts); refresh token persists
 * in MMKV; user profile persists for instant cold-start UI.
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { http, apiErrorMessage, setAccessToken, saveRefreshToken, loadRefreshToken } from "../api/client";
import { mmkvStorage } from "../lib/storage";
import type { User } from "../types";

type AuthState = {
  user: User | null;
  hydrated: boolean;
  busy: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (input: { email: string; password: string; name: string; phone?: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
  clearError: () => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      hydrated: false,
      busy: false,
      error: null,

      login: async (email, password) => {
        set({ busy: true, error: null });
        try {
          const res = await http.post("/auth/login", { email, password });
          const { user, accessToken, refreshToken } = res.data;
          setAccessToken(accessToken);
          saveRefreshToken(refreshToken);
          set({ user, busy: false });
          return true;
        } catch (err) {
          set({ busy: false, error: apiErrorMessage(err, "Login failed") });
          return false;
        }
      },

      register: async (input) => {
        set({ busy: true, error: null });
        try {
          const res = await http.post("/auth/register", input);
          const { user, accessToken, refreshToken } = res.data;
          setAccessToken(accessToken);
          saveRefreshToken(refreshToken);
          set({ user, busy: false });
          return true;
        } catch (err) {
          set({ busy: false, error: apiErrorMessage(err, "Registration failed") });
          return false;
        }
      },

      logout: async () => {
        const refreshToken = loadRefreshToken();
        try {
          if (refreshToken) await http.post("/auth/logout", { refreshToken });
        } catch {
          /* best effort */
        }
        setAccessToken(null);
        saveRefreshToken(null);
        set({ user: null });
      },

      bootstrap: async () => {
        if (get().hydrated) return;
        const refreshToken = loadRefreshToken();
        if (!refreshToken) {
          set({ hydrated: true, user: null });
          return;
        }
        try {
          const res = await http.post("/auth/refresh", { refreshToken });
          const { accessToken, refreshToken: next } = res.data;
          if (accessToken) {
            setAccessToken(accessToken);
            if (next) saveRefreshToken(next);
            const me = await http.get("/auth/me");
            set({ user: me.data.user, hydrated: true });
            return;
          }
        } catch {
          /* fall through */
        }
        saveRefreshToken(null);
        set({ user: null, hydrated: true });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "ahona-auth",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (s) => ({ user: s.user }),
    },
  ),
);
