import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Keep internal port as 3000
    proxy: {
      // Proxy API requests to the Flask backend during development
      "/api": {
        target: "http://backend:5000", // Docker service name in development
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
