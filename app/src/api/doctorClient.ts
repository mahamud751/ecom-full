/**
 * Doctor session for taking patient calls on the phone. A doctor signs in to
 * the app with the normal login (which gives a customer session); with the
 * same credentials we also open a doctor session against /doctors/auth so
 * the phone can join consult calls as the doctor. Same JWT flow as the
 * customer client: access token in memory, rotating refresh token in MMKV.
 */
import axios, { type AxiosRequestConfig } from 'axios';
import { API_BASE } from '../config';
import { storage } from '../lib/storage';

const REFRESH_KEY = 'htp_refresh_doctor';

let accessToken: string | null = null;

function saveRefreshToken(token: string | null) {
  if (token) storage.set(REFRESH_KEY, token);
  else storage.remove(REFRESH_KEY);
}

function loadRefreshToken(): string | null {
  return storage.getString(REFRESH_KEY) ?? null;
}

/** True when this phone holds a doctor session (it can take calls). */
export function hasDoctorSession(): boolean {
  return loadRefreshToken() !== null;
}

export const doctorHttp = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
});

doctorHttp.interceptors.request.use(config => {
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
    const res = await axios.post(`${API_BASE}/doctors/auth/refresh`, {
      refreshToken,
    });
    const pair = res.data as { accessToken?: string; refreshToken?: string };
    if (pair.accessToken) {
      accessToken = pair.accessToken;
      if (pair.refreshToken) saveRefreshToken(pair.refreshToken);
      return accessToken;
    }
    return null;
  } catch (err) {
    // Only a rejected token ends the session; offline keeps it.
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      saveRefreshToken(null);
    }
    return null;
  }
}

doctorHttp.interceptors.response.use(
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
      if (token) return doctorHttp.request(original);
    }
    return Promise.reject(error);
  },
);

/**
 * Opens a doctor session with these credentials. Resolves false for a
 * non-doctor account (the normal case) without raising.
 */
export async function doctorSignIn(
  email: string,
  password: string,
): Promise<boolean> {
  try {
    const res = await axios.post(`${API_BASE}/doctors/auth/login`, {
      email,
      password,
    });
    const { accessToken: access, refreshToken } = res.data as {
      accessToken?: string;
      refreshToken?: string;
    };
    if (!access || !refreshToken) return false;
    accessToken = access;
    saveRefreshToken(refreshToken);
    return true;
  } catch {
    return false;
  }
}

export async function doctorSignOut() {
  const refreshToken = loadRefreshToken();
  accessToken = null;
  saveRefreshToken(null);
  if (refreshToken) {
    await axios
      .post(`${API_BASE}/doctors/auth/logout`, { refreshToken })
      .catch(() => undefined);
  }
}
