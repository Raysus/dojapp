import { Capacitor } from '@capacitor/core';

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

function isLocalhostUrl(url: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(url);
}

/**
 * Resuelve la URL base del API según plataforma, modo y variables de entorno.
 *
 * Web dev:        VITE_API_URL (default http://localhost:3000)
 * Android emu:    VITE_API_URL_ANDROID o http://10.0.2.2:3000
 * Android físico: VITE_API_URL_ANDROID=http://192.168.x.x:3000
 * Producción:     VITE_API_URL_PRODUCTION (HTTPS recomendado)
 */
export function getApiBaseUrl(): string {
  const mode = import.meta.env.MODE;
  const productionUrl = import.meta.env.VITE_API_URL_PRODUCTION as string | undefined;

  if (mode === 'production' && productionUrl) {
    return stripTrailingSlash(productionUrl);
  }

  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
    const androidUrl = import.meta.env.VITE_API_URL_ANDROID as string | undefined;
    if (androidUrl) return stripTrailingSlash(androidUrl);

    const configured = import.meta.env.VITE_API_URL as string | undefined;
    if (configured && !isLocalhostUrl(configured)) {
      return stripTrailingSlash(configured);
    }

    return 'http://10.0.2.2:3000';
  }

  const webUrl = import.meta.env.VITE_API_URL as string | undefined;
  return stripTrailingSlash(webUrl ?? 'http://localhost:3000');
}

export function isProductionApi(): boolean {
  return getApiBaseUrl().startsWith('https://');
}
