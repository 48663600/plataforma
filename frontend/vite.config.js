import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" genera rutas relativas: el mismo build funciona en GitHub Pages
// (https://usuario.github.io/plataforma/), Firebase o cualquier subcarpeta.
export default defineConfig({
  base: process.env.VITE_BASE || "./",
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: { react: ["react", "react-dom"], xlsx: ["xlsx"] },
      },
    },
  },
  test: { environment: "node" },
});
