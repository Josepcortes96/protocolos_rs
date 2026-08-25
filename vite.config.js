import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api": {
          target: env.INFORMACION_PROXY_TARGET,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
        "/pdf": {
          target: "https://pub-5c3d4294745645bfb40dddc883e0604a.r2.dev",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/pdf/, ""),
        },
      },
    },
  };
});
