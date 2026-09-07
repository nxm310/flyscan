/* ==========================================================================
   FLYRADAR — SERVICE WORKER (PWA & OFFLINE CACHING)
   ========================================================================== */

const CACHE_NAME = 'flyradar-cache-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './public/icon.svg',
  './public/apple-touch-icon.png',
  './public/icon-192.png',
  './public/icon-512.png',
  './public/manifest.webmanifest'
];

// Install: Cache essential app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-First for real-time APIs, Stale-While-Revalidate for app assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Always fetch real-time APIs fresh over network
  if (
    url.hostname.includes('airplanes.live') ||
    url.hostname.includes('adsb.fi') ||
    url.hostname.includes('opensky-network') ||
    url.hostname.includes('rainviewer.com') ||
    url.hostname.includes('planespotters.net') ||
    url.hostname.includes('open-meteo.com')
  ) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: 'offline', offline: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // App shell and static assets: cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch update in background
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
