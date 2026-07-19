import type { CapacitorConfig } from '@capacitor/cli';

// Mixed content only for LAN/HTTP debug. Production builds talk HTTPS.
const allowMixed =
  process.env.CAP_ALLOW_MIXED_CONTENT === 'true' ||
  process.env.VITE_ALLOW_MIXED_CONTENT === 'true';

const config: CapacitorConfig = {
  appId: 'com.dojapp.app',
  appName: 'Dojapp',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: allowMixed,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#0f172a',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
  },
};

export default config;
