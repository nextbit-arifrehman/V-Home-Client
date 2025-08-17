// vite.config.js
import react from "@vitejs/plugin-react";
import path from "path";

export default {
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: ".", // project root is now the Vite root
  build: {
    outDir: "dist", // output to /dist
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    proxy: {
      "/api": {
        target: "https://11assing.vercel.app", // backend port
        changeOrigin: true,
        secure: false,
      },
    },
  },
};
