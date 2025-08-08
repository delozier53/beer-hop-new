// capacitor.config.ts
import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.beerhop.app",
  appName: "BeerHop",
  webDir: "dist/public",
  bundledWebRuntime: false,
  server: {
    // For live reload on device you could set a LAN url here during dev.
    // url: "http://192.168.1.123:5000",
    // cleartext: true,
  },
};

export default config;
