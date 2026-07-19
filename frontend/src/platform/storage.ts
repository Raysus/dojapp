import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const TOKEN_KEY = 'token';
const REFRESH_KEY = 'refresh_token';

async function getPreference(key: string): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    const { value } = await Preferences.get({ key });
    return value;
  }
  return localStorage.getItem(key);
}

async function setPreference(key: string, value: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Preferences.set({ key, value });
    return;
  }
  localStorage.setItem(key, value);
}

async function removePreference(key: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Preferences.remove({ key });
    return;
  }
  localStorage.removeItem(key);
}

export async function getToken(): Promise<string | null> {
  return getPreference(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  return setPreference(TOKEN_KEY, token);
}

export async function removeToken(): Promise<void> {
  return removePreference(TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return getPreference(REFRESH_KEY);
}

export async function setRefreshToken(token: string): Promise<void> {
  return setPreference(REFRESH_KEY, token);
}

export async function removeRefreshToken(): Promise<void> {
  return removePreference(REFRESH_KEY);
}

export async function clearAuthStorage(): Promise<void> {
  await Promise.all([removeToken(), removeRefreshToken()]);
}
