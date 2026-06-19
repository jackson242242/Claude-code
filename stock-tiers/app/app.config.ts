import type { ExpoConfig } from "expo/config";

// The API base URL is injected from the environment at build/start time and
// exposed to the app via Constants.expoConfig.extra.apiBaseUrl.
// Local dev example: EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:8000
const config: ExpoConfig = {
  name: "Stock Tiers",
  slug: "stock-tiers",
  version: "0.1.0",
  orientation: "portrait",
  scheme: "stocktiers",
  newArchEnabled: true,
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8000",
  },
};

export default config;
