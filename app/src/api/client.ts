/**
 * Axios client for the NestJS backend with the same JWT flow as the web:
 * short-lived access token (15m) held in memory + rotating refresh token
 * persisted in MMKV. On 401 the interceptor refreshes once and retries.
 */
import axios, { type AxiosRequestConfig } from 'axios';
import { API_BASE } from '../config';
import { storage } from '../lib/storage';

const REFRESH_KEY = 'htp_refresh_customer';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function saveRefreshToken(token: string | null) {
  if (token) storage.set(REFRESH_KEY, token);
  else storage.remove(REFRESH_KEY);
}

export function loadRefreshToken(): string | null {
  return storage.getString(REFRESH_KEY) ?? null;
}

export const http = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
});

http.interceptors.request.use(config => {
  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = loadRefreshToken();
  if (!refreshToken) return null;
  try {
    // Plain axios — bypass the interceptor to avoid recursion
    const res = await axios.post(`${API_BASE}/auth/refresh`, {
      refreshToken,
    });
    const pair = res.data as { accessToken?: string; refreshToken?: string };
    if (pair.accessToken) {
      accessToken = pair.accessToken;
      if (pair.refreshToken) saveRefreshToken(pair.refreshToken);
      return accessToken;
    }
    return null;
  } catch {
    saveRefreshToken(null);
    return null;
  }
}

http.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config as AxiosRequestConfig & {
      _retried?: boolean;
    };
    if (error.response?.status === 401 && original && !original._retried) {
      original._retried = true;
      if (!refreshing) {
        refreshing = refreshAccessToken().finally(() => {
          refreshing = null;
        });
      }
      const token = await refreshing;
      if (token) return http.request(original);
    }
    return Promise.reject(error);
  },
);

/** Extract a human-readable error message from any axios failure */
export function apiErrorMessage(
  err: unknown,
  fallback = 'Something went wrong',
): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { error?: string; message?: unknown }
      | undefined;
    if (data?.error) return data.error;
    if (typeof data?.message === 'string') return data.message;
    if (Array.isArray(data?.message) && typeof data.message[0] === 'string') {
      return data.message[0];
    }
    if (err.code === 'ECONNABORTED') return 'Request timed out';
    if (!err.response) return 'Cannot reach the server';
  }
  return fallback;
}
