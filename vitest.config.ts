import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    alias: {
      "@/src": path.resolve(__dirname, "./src"),
      "@/app": path.resolve(__dirname, "./app"),
      "@": path.resolve(__dirname, "."),
    },
  },
});
