import axios from 'axios';
import { getApiBaseUrl } from '../platform/env';

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in?: string | number;
};

export const loginRequest = async (email: string, password: string): Promise<AuthTokens> => {
  const res = await axios.post(`${getApiBaseUrl()}/auth/login`, {
    email,
    password,
  });

  return res.data;
};

export const refreshRequest = async (refreshToken: string): Promise<AuthTokens> => {
  const res = await axios.post(`${getApiBaseUrl()}/auth/refresh`, {
    refresh_token: refreshToken,
  });

  return res.data;
};

export const logoutRequest = async (refreshToken?: string | null): Promise<void> => {
  try {
    await axios.post(`${getApiBaseUrl()}/auth/logout`, {
      refresh_token: refreshToken ?? undefined,
    });
  } catch {
    // Best-effort revoke
  }
};
