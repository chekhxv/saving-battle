import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Во время `netlify dev` функции доступны на /.netlify/functions и /api/*.
// Для чистого `vite` (без netlify) проксируем /api на локальный netlify-порт, если он поднят.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
      '/.netlify': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
    },
  },
});
