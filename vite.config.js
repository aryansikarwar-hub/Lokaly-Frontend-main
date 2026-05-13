import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      // ✅ Proxy /uploads so video/image CORS is handled by Vite in dev
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:5000",
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "animation-vendor": [
            "framer-motion",
            "lottie-react",
            "canvas-confetti",
            "react-confetti",
          ],
          "i18n-vendor": [
            "i18next",
            "react-i18next",
            "i18next-browser-languagedetector",
          ],
        },
      },
    },
  },
});
