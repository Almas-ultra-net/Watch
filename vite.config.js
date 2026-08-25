import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// در ساختِ GitHub Actions متغیر GITHUB_REPOSITORY تنظیم می‌شود و
// base به‌صورت خودکار روی `/Watch/` قرار می‌گیرد تا روی GitHub Pages درست کار کند.
const repo = process.env.GITHUB_REPOSITORY || '';
const repoName = repo.split('/')[1] || '';
const base = process.env.BASE_URL || (process.env.GITHUB_ACTIONS && repoName ? `/${repoName}/` : '/');

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
        },
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    // میزبان پیش‌نمایش (tunnel) نیز پذیرفته شود
    allowedHosts: true,
  },
});
