/* ==========================================================================
   FLYRADAR — SERVICE WORKER (PWA & OFFLINE CACHING)
   ========================================================================== */

const CACHE_NAME = 'flyradar-cache-v2';
const STATIC_ASSETS = [
  './',
  './index.html',
  './icon.svg',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './manifest.webmanifest'
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

  // Always bypass cache for real-time live APIs and proxies
  if (
    url.pathname.includes('/api/') ||
    url.pathname.includes('/api-fr24') ||
    url.pathname.includes('/api-adsb') ||
    url.hostname.includes('flightradar24.com') ||
    url.hostname.includes('adsb.lol') ||
    url.hostname.includes('airplanes.live') ||
    url.hostname.includes('adsb.fi') ||
    url.hostname.includes('opensky-network') ||
    url.hostname.includes('rainviewer.com') ||
    url.hostname.includes('planespotters.net') ||
    url.hostname.includes('open-meteo.com') ||
    url.hostname.includes('wikimedia.org')
  ) {
    return; // Let browser perform direct network fetch
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
