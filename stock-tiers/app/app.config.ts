import type { ExpoConfig } from "expo/config";

// The API base URL is read directly from process.env.EXPO_PUBLIC_API_BASE_URL in
// src/api/client.ts (Expo string-inlines EXPO_PUBLIC_* into the bundle at build
// time). Local dev example: EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:8000
const config: ExpoConfig = {
  name: "Stock Tiers",
  slug: "stock-tiers",
  version: "0.1.0",
  orientation: "portrait",
  scheme: "stocktiers",
  newArchEnabled: true,
  web: {
    bundler: "metro",
    output: "single",
  },
};

export default config;
