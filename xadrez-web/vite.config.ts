import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages: https://moises-h7.github.io/xadrez/
const base = process.env.GITHUB_ACTIONS ? '/xadrez/' : '/';

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
