import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'packages/frontend',
  resolve: {
    alias: {
      '@frcs/shared': resolve(__dirname, 'packages/shared/src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: resolve(__dirname, 'dist/frontend'),
    emptyOutDir: true,
  },
});
