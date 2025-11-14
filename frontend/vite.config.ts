import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwind from "@tailwindcss/vite";

export default defineConfig({
  base: "/",
  plugins: [react(), tailwind()],
  resolve: {
    alias: {
      "@": "/src"   // alias simple para imports '@/...'
    }
  },
  build: { outDir: "dist", sourcemap: false },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // si tus rutas en el backend NO tienen prefijo /api, descomenta:
        // rewrite: (p) => p.replace(/^\/api/, ''),
      },
      
      '/uploads': {
        target: 'http://localhost:3000', // El mismo puerto de tu backend
        changeOrigin: true,
        secure: false,
      }
    },
  },
  
});
