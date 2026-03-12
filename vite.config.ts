import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const AUTH_API_BASE = "http://localhost:45000";
  const MANAGEMENT_API_BASE = "http://localhost:45001";

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        "/api/auth": {
          target: AUTH_API_BASE,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/auth/, ""),
        },
        "/api/management": {
          target: MANAGEMENT_API_BASE,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/management/, ""),
        },
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
