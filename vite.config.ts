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
    // 브라우저 미리보기(npm run dev)에서 wowccm.net 데이터를 받기 위한 프록시
    proxy: {
      "/wowproxy": {
        target: "https://wowccm.net",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/wowproxy/, ""),
      },
    },
  },
  build: {
    target: ["es2021", "chrome105", "safari15"],
  },
});
