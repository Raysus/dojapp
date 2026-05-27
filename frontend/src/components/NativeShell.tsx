import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useAuth } from '../auth/AuthContext';

export default function NativeShell() {
  const { loading } = useAuth();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    async function initNativeShell() {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#0f172a' });
      } catch {
        // Plugins may be unavailable outside a native runtime.
      }
    }

    void initNativeShell();
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || loading) return;

    void SplashScreen.hide();
  }, [loading]);

  return null;
}
