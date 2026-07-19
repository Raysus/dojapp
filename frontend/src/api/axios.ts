import axios from 'axios';
import { getApiBaseUrl } from '../platform/env';
import { getCachedToken, setCachedToken } from '../platform/token';
import {
  clearAuthStorage,
  getRefreshToken,
  setRefreshToken,
  setToken,
} from '../platform/storage';
import { emitUnauthorized } from '../platform/authEvents';
import { refreshRequest } from '../services/auth.service';

export const api = axios.create({
  baseURL: getApiBaseUrl(),
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  try {
    const tokens = await refreshRequest(refreshToken);
    setCachedToken(tokens.access_token);
    await setToken(tokens.access_token);
    await setRefreshToken(tokens.refresh_token);
    return tokens.access_token;
  } catch {
    setCachedToken(null);
    await clearAuthStorage();
    return null;
  }
}

api.interceptors.request.use(config => {
  const token = getCachedToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  response => response,
  async error => {
    const status = error.response?.status;
    const original = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
    const url = String(original?.url ?? '');
    const isAuthEndpoint =
      url.includes('/auth/login') || url.includes('/auth/refresh');

    if (status !== 401 || isAuthEndpoint || !original || original._retry) {
      if (status === 401 && !isAuthEndpoint) {
        setCachedToken(null);
        await clearAuthStorage();
        emitUnauthorized();
        const path = window.location.pathname;
        if (!path.includes('/login')) {
          const base = import.meta.env.BASE_URL || '/';
          const loginPath = `${base.replace(/\/?$/, '/')}login`.replace(/\/+/g, '/');
          window.location.assign(loginPath);
        }
      }
      return Promise.reject(error);
    }

    original._retry = true;

    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;
    if (!newToken) {
      emitUnauthorized();
      const path = window.location.pathname;
      if (!path.includes('/login')) {
        const base = import.meta.env.BASE_URL || '/';
        const loginPath = `${base.replace(/\/?$/, '/')}login`.replace(/\/+/g, '/');
        window.location.assign(loginPath);
      }
      return Promise.reject(error);
    }

    original.headers = original.headers ?? {};
    original.headers.Authorization = `Bearer ${newToken}`;
    return api.request(original);
  },
);
