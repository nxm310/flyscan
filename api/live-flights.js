export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, User-Agent');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { bounds = '51.0,42.0,-5.0,9.0', lat = '48.85', lng = '2.35', dist = '150' } = req.query || {};
  const [n, s, w, e] = (bounds || '51.0,42.0,-5.0,9.0').split(',').map(Number);
  const url = `https://data-cloud.flightradar24.com/zones/fcgi/feed.js?bounds=${n.toFixed(4)},${s.toFixed(4)},${w.toFixed(4)},${e.toFixed(4)}&faa=1&satellite=1&mlat=1&flarm=1&adsb=1&gnd=0&air=1&vehicles=0&estimated=1&maxage=14400&gliders=0&stats=0`;

  try {
    const frRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://www.flightradar24.com/',
        'Origin': 'https://www.flightradar24.com'
      },
      signal: AbortSignal.timeout(6000)
    });
    if (frRes.ok) {
      const data = await frRes.json();
      return res.status(200).json({ source: 'Flightradar24', data });
    }
  } catch (_) {}

  // Fallback to adsb.lol
  try {
    const adsbRes = await fetch(`https://api.adsb.lol/v2/lat/${parseFloat(lat).toFixed(4)}/lon/${parseFloat(lng).toFixed(4)}/dist/${dist}`, {
      headers: { 'User-Agent': 'FlyRadarApp/2.0' },
      signal: AbortSignal.timeout(6000)
    });
    if (adsbRes.ok) {
      const data = await adsbRes.json();
      return res.status(200).json({ source: 'ADSB.lol', data });
    }
  } catch (_) {}

  return res.status(503).json({ error: 'Flux télémétriques temporairement indisponibles' });
}
