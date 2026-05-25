/* ==========================================================================
   FLYRADAR — REAL WEATHER SERVICE
   Source: Open-Meteo API (https://open-meteo.com)
   Completely free, no API key required, CORS-enabled
   ========================================================================== */

// Cache weather data per airport to avoid hammering the API
const weatherCache = new Map(); // airportCode → { data, fetchedAt }
const WEATHER_TTL_MS = 5 * 60 * 1000; // Refresh every 5 minutes

/**
 * Fetch real-time weather for an airport by its lat/lng.
 * Returns: { tempC, windSpeedKmh, windDir, conditionIcon, description, humidity, pressure, feelsLike }
 */
export async function fetchAirportWeather(airportCode, lat, lng) {
  const now = Date.now();
  const cached = weatherCache.get(airportCode);
  
  // Return cached data if still fresh
  if (cached && (now - cached.fetchedAt) < WEATHER_TTL_MS) {
    return cached.data;
  }
  
  try {
    const url = [
      `https://api.open-meteo.com/v1/forecast`,
      `?latitude=${lat.toFixed(4)}`,
      `&longitude=${lng.toFixed(4)}`,
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure`,
      `&wind_speed_unit=kmh`,
      `&timezone=auto`,
    ].join('');
    
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const json = await res.json();
    const c = json.current;
    
    const data = {
      tempC: Math.round(c.temperature_2m * 10) / 10,
      feelsLike: Math.round(c.apparent_temperature * 10) / 10,
      humidity: c.relative_humidity_2m,
      windSpeedKmh: Math.round(c.wind_speed_10m),
      windDir: Math.round(c.wind_direction_10m),
      pressure: Math.round(c.surface_pressure),
      weatherCode: c.weather_code,
      conditionIcon: weatherCodeToIcon(c.weather_code),
      description: weatherCodeToDescription(c.weather_code),
      fetchedAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      isReal: true,
    };
    
    weatherCache.set(airportCode, { data, fetchedAt: now });
    return data;
    
  } catch (err) {
    console.warn(`[Weather] Failed for ${airportCode}:`, err.message);
    // Return a null result, caller will show '--'
    return null;
  }
}

// Map Open-Meteo WMO weather codes to Lucide icon names
function weatherCodeToIcon(code) {
  if (code === 0) return 'sun';
  if (code <= 2) return 'cloud-sun';
  if (code === 3) return 'cloud';
  if (code <= 48) return 'cloud-fog';
  if (code <= 57) return 'cloud-drizzle';
  if (code <= 67) return 'cloud-rain';
  if (code <= 77) return 'cloud-snow';
  if (code <= 82) return 'cloud-rain';
  if (code <= 86) return 'cloud-snow';
  if (code <= 99) return 'cloud-lightning';
  return 'cloud';
}

// Map WMO weather codes to French descriptions
function weatherCodeToDescription(code) {
  if (code === 0) return 'Ciel dégagé';
  if (code === 1) return 'Principalement dégagé';
  if (code === 2) return 'Partiellement nuageux';
  if (code === 3) return 'Couvert';
  if (code <= 49) return 'Brouillard';
  if (code <= 57) return 'Bruine';
  if (code <= 65) return 'Pluie';
  if (code <= 67) return 'Pluie verglaçante';
  if (code <= 77) return 'Neige';
  if (code <= 82) return 'Averses de pluie';
  if (code <= 86) return 'Averses de neige';
  if (code <= 99) return 'Orage';
  return 'Inconnu';
}

// Wind direction degrees → compass direction
export function windDirToCompass(deg) {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
  return dirs[Math.round(deg / 22.5) % 16];
}
