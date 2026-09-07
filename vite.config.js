import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    proxy: {
      '/api-planespotters': {
        target: 'https://api.planespotters.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-planespotters/, ''),
        headers: {
          'User-Agent': 'FlyRadar/2.0 (Aviation Web App)'
        }
      }
    }
  }
});
