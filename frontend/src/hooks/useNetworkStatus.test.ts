import { describe, expect, it } from 'vitest';
import { getNetworkErrorMessage } from '../hooks/useNetworkStatus';

describe('getNetworkErrorMessage', () => {
  it('returns offline message when navigator is offline', () => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: false,
    });

    expect(getNetworkErrorMessage(new Error('Network Error'))).toBe(
      'Sin conexión a internet. Revisa WiFi o datos móviles.',
    );

    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: true,
    });
  });

  it('returns server message for axios network errors', () => {
    expect(getNetworkErrorMessage({ message: 'Network Error' })).toBe(
      'No se pudo conectar con el servidor. Verifica tu conexión o que el backend esté activo.',
    );
  });

  it('returns null for unrelated errors', () => {
    expect(getNetworkErrorMessage(new Error('Unauthorized'))).toBeNull();
  });
});
