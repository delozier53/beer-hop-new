import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.beerhop.app',
  appName: 'Beer Hop',
  webDir: 'dist/public',     // where your Vite build ends up
  server: {
    androidScheme: 'https',  // keeps WKWebView/Android happy with local assets
    iosScheme: 'https'
  }
  // NOTE: 'bundledWebRuntime' no longer exists in v6
};

export default config;
