import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Tauri가 기대하는 고정 포트와 설정
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: { ignored: ["**/src-tauri/**"] },
  },
  build: {
    target: ["es2021", "chrome105", "safari15"],
  },
});
