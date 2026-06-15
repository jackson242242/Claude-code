import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" so built assets use relative paths — required for Capacitor (file:// in the native webview)
export default defineConfig({
  plugins: [react()],
  base: "./",
});
