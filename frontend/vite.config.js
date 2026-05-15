import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/preview": { target: "http://localhost:8000", changeOrigin: true },
      "/generate": { target: "http://localhost:8000", changeOrigin: true },
      "/convert": { target: "http://localhost:8000", changeOrigin: true },
      "/generate-dax": { target: "http://localhost:8000", changeOrigin: true },
      "/validate-dax": { target: "http://localhost:8000", changeOrigin: true },
      "/download": { target: "http://localhost:8000", changeOrigin: true },
    },
  },
});
