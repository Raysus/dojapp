import { useEffect, useState } from 'react';
import { Network } from '@capacitor/network';
import { isNativeApp } from '../platform/native';

export function useNetworkStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (isNativeApp()) {
      let mounted = true;

      void Network.getStatus().then(status => {
        if (mounted) setOnline(status.connected);
      });

      const handle = Network.addListener('networkStatusChange', status => {
        setOnline(status.connected);
      });

      return () => {
        mounted = false;
        void handle.then(listener => listener.remove());
      };
    }

    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return online;
}

export function getNetworkErrorMessage(error: unknown): string | null {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'Sin conexión a internet. Revisa WiFi o datos móviles.';
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message?: string }).message ?? '');
    if (message === 'Network Error') {
      return 'No se pudo conectar con el servidor. Verifica tu conexión o que el backend esté activo.';
    }
  }

  return null;
}
