import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  base: '/',
  plugins: [react(), tailwind()],
  resolve: {
    alias: {
      '@': path.resolve(root, 'src'),
    },
  },
  build: { outDir: 'dist', sourcemap: false },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
})
