import { defineConfig } from 'vite';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// Config path is repo root — use this so `vite` works when cwd is `packages/frontend`
const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: resolve(rootDir, 'packages/frontend'),
  resolve: {
    alias: {
      '@frcs/shared': resolve(rootDir, 'packages/shared/src'),
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
    outDir: resolve(rootDir, 'dist/frontend'),
    emptyOutDir: true,
  },
});
