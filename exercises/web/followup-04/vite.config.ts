import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import vue from "@vitejs/plugin-vue";
export default defineConfig({
  base: "./",
  appType: "mpa",
  plugins: [react(), vue()],
  build: {
    rollupOptions: {
      input: { main: "index.html", vue: "vue.html", library: "library.html" },
    },
  },
  test: {
    environment: "jsdom",
    exclude: ["tests/**", "node_modules/**"],
    setupFiles: ["./src/test-setup.ts"],
  },
});
