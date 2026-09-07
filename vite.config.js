import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    proxy: {
      '/api-fr24': {
        target: 'https://data-cloud.flightradar24.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-fr24/, ''),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Referer': 'https://www.flightradar24.com/',
          'Origin': 'https://www.flightradar24.com'
        }
      },
      '/api-adsb': {
        target: 'https://api.adsb.lol',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-adsb/, ''),
        headers: {
          'User-Agent': 'FlyRadar/2.0 (Live ADS-B Ingestion)'
        }
      },
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
