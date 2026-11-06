import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      // The browser calls /api on the dev server, which forwards to FastAPI.
      proxy: {
        "/api": env.API_PROXY_TARGET || "http://127.0.0.1:8000",
      },
    },
  };
});
