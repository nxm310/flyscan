/* ==========================================================================
   FLYRADAR — PRODUCTION & LOCAL SERVER WITH LIVE ADS-B / FR24 PROXY
   ========================================================================== */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');
const ROOT_DIR = fs.existsSync(DIST_DIR) ? DIST_DIR : __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

// Cache to prevent pounding third-party APIs
const flightCache = new Map();
const CACHE_TTL_MS = 3500;

async function fetchFlightradar24Data(boundsStr) {
  const cached = flightCache.get(boundsStr);
  if (cached && (Date.now() - cached.time < CACHE_TTL_MS)) {
    return cached.data;
  }

  // bounds: north,south,west,east
  const [n, s, w, e] = boundsStr.split(',').map(Number);
  const url = `https://data-cloud.flightradar24.com/zones/fcgi/feed.js?bounds=${n.toFixed(4)},${s.toFixed(4)},${w.toFixed(4)},${e.toFixed(4)}&faa=1&satellite=1&mlat=1&flarm=1&adsb=1&gnd=0&air=1&vehicles=0&estimated=1&maxage=14400&gliders=0&stats=0`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.flightradar24.com/',
        'Origin': 'https://www.flightradar24.com'
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!res.ok) throw new Error(`FR24 HTTP ${res.status}`);
    const data = await res.json();
    flightCache.set(boundsStr, { time: Date.now(), data });
    return data;
  } catch (err) {
    console.warn('[Server Proxy] FR24 error, trying fallback:', err.message);
    return null;
  }
}

async function fetchAdsbLolData(lat, lng, dist) {
  const cacheKey = `adsb_${lat.toFixed(2)}_${lng.toFixed(2)}_${dist}`;
  const cached = flightCache.get(cacheKey);
  if (cached && (Date.now() - cached.time < CACHE_TTL_MS)) {
    return cached.data;
  }

  const url = `https://api.adsb.lol/v2/lat/${lat.toFixed(4)}/lon/${lng.toFixed(4)}/dist/${dist}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'FlyRadarApp/2.0' },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) throw new Error(`ADSB.lol HTTP ${res.status}`);
    const data = await res.json();
    flightCache.set(cacheKey, { time: Date.now(), data });
    return data;
  } catch (err) {
    console.warn('[Server Proxy] ADSB.lol error:', err.message);
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  // CORS Headers for all API responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, User-Agent');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // 1. API: Flightradar24 Live Telemetry Proxy
  if (reqUrl.pathname === '/api/live-flights') {
    const bounds = reqUrl.searchParams.get('bounds') || '51.0,42.0,-5.0,9.0';
    const lat = parseFloat(reqUrl.searchParams.get('lat') || '48.85');
    const lng = parseFloat(reqUrl.searchParams.get('lng') || '2.35');
    const dist = parseInt(reqUrl.searchParams.get('dist') || '150', 10);

    const fr24Data = await fetchFlightradar24Data(bounds);
    if (fr24Data) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ source: 'Flightradar24', data: fr24Data }));
      return;
    }

    // Fallback to adsb.lol if FR24 is temporarily unreachable
    const adsbData = await fetchAdsbLolData(lat, lng, dist);
    if (adsbData) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ source: 'ADSB.lol', data: adsbData }));
      return;
    }

    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Flux télémétriques temporairement indisponibles' }));
    return;
  }

  // 2. Static File Serving
  let filePath = path.join(ROOT_DIR, reqUrl.pathname === '/' ? 'index.html' : reqUrl.pathname);

  // Security: prevent directory traversal
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Fallback to index.html if file doesn't exist (SPA routing)
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(ROOT_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end(`Erreur serveur: ${err.code}`);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

server.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIpAddress();
  console.log(`\n========================================================`);
  console.log(`✈️  FLYRADAR — 100% DONNÉES PHYSIQUES RÉELLES (LIVE ADS-B)`);
  console.log(`📡  Mac local       : http://localhost:${PORT}`);
  console.log(`📱  iPhone (Wi-Fi)  : http://${localIp}:${PORT}`);
  console.log(`🌐  Flux direct connecté à Flightradar24 & ADS-B`);
  console.log(`========================================================\n`);
});
