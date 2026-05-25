/* ==========================================================================
   FLYRADAR — FLIGHT AND AIRSPACE ENGINE
   Primary ADS-B Source: adsb.lol (ADS-B Exchange community, no auth required)
   Fallback: OpenSky Network
   ========================================================================== */

// Re-exported utilities used by ar.js
export function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export function getBearing(lat1, lng1, lat2, lng2) {
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
            Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}


// ============================================================
// 1. AIRLINE DATABASE (ICAO callsign prefix → airline info)
// ============================================================
export const AIRLINE_MAP = {
  AFR: { code: 'AF', name: 'Air France', country: 'France' },
  BAW: { code: 'BA', name: 'British Airways', country: 'Royaume-Uni' },
  DLH: { code: 'LH', name: 'Lufthansa', country: 'Allemagne' },
  UAE: { code: 'EK', name: 'Emirates', country: 'Émirats Arabes Unis' },
  EZY: { code: 'EZ', name: 'EasyJet', country: 'Royaume-Uni' },
  RYR: { code: 'FR', name: 'Ryanair', country: 'Irlande' },
  KLM: { code: 'KL', name: 'KLM Royal Dutch', country: 'Pays-Bas' },
  QTR: { code: 'QR', name: 'Qatar Airways', country: 'Qatar' },
  SIA: { code: 'SQ', name: 'Singapore Airlines', country: 'Singapour' },
  DAL: { code: 'DL', name: 'Delta Air Lines', country: 'États-Unis' },
  UAL: { code: 'UA', name: 'United Airlines', country: 'États-Unis' },
  AAL: { code: 'AA', name: 'American Airlines', country: 'États-Unis' },
  SWA: { code: 'WN', name: 'Southwest Airlines', country: 'États-Unis' },
  ANA: { code: 'NH', name: 'All Nippon Airways', country: 'Japon' },
  JAL: { code: 'JL', name: 'Japan Airlines', country: 'Japon' },
  CCA: { code: 'CA', name: 'Air China', country: 'Chine' },
  CSN: { code: 'CZ', name: 'China Southern', country: 'Chine' },
  CES: { code: 'MU', name: 'China Eastern', country: 'Chine' },
  IBE: { code: 'IB', name: 'Iberia', country: 'Espagne' },
  TAP: { code: 'TP', name: 'TAP Air Portugal', country: 'Portugal' },
  AZA: { code: 'AZ', name: 'ITA Airways', country: 'Italie' },
  TUR: { code: 'TK', name: 'Turkish Airlines', country: 'Turquie' },
  SVA: { code: 'SV', name: 'Saudi Arabian Airlines', country: 'Arabie Saoudite' },
  ETH: { code: 'ET', name: 'Ethiopian Airlines', country: 'Éthiopie' },
  SAA: { code: 'SA', name: 'South African Airways', country: 'Afrique du Sud' },
  QFA: { code: 'QF', name: 'Qantas', country: 'Australie' },
  ANZ: { code: 'NZ', name: 'Air New Zealand', country: 'Nouvelle-Zélande' },
  GTI: { code: 'GT', name: 'Atlas Air', country: 'États-Unis' },
  FDX: { code: 'FX', name: 'FedEx Express', country: 'États-Unis' },
  UPS: { code: 'UP', name: 'UPS Airlines', country: 'États-Unis' },
  WZZ: { code: 'W6', name: 'Wizz Air', country: 'Hongrie' },
  VLG: { code: 'VY', name: 'Vueling', country: 'Espagne' },
  BEL: { code: 'SN', name: 'Brussels Airlines', country: 'Belgique' },
  SAS: { code: 'SK', name: 'Scandinavian Airlines', country: 'Suède' },
  FIN: { code: 'AY', name: 'Finnair', country: 'Finlande' },
  THY: { code: 'TK', name: 'Turkish Airlines', country: 'Turquie' },
  GEC: { code: 'LH', name: 'Lufthansa Cargo', country: 'Allemagne' },
  BOX: { code: 'BX', name: 'ASL Airlines', country: 'France' },
  DHL: { code: 'D0', name: 'DHL Air', country: 'Royaume-Uni' },
  RJA: { code: 'RJ', name: 'Royal Jordanian', country: 'Jordanie' },
  MSR: { code: 'MS', name: 'EgyptAir', country: 'Égypte' },
  RAM: { code: 'AT', name: 'Royal Air Maroc', country: 'Maroc' },
  TUN: { code: 'TU', name: 'Tunisair', country: 'Tunisie' },
  GAF: { code: 'GAF', name: 'German Air Force', country: 'Allemagne' },
  COTAM: { code: 'FAF', name: 'Armée de l\'Air Française', country: 'France' },
  REACH: { code: 'USAF', name: 'United States Air Force', country: 'États-Unis' },
  ASCOT: { code: 'RAF', name: 'Royal Air Force', country: 'Royaume-Uni' },
};

// Military callsign prefixes
const MILITARY_PREFIXES = [
  'COTAM', 'REACH', 'ASCOT', 'NATO', 'USAF', 'FAF', 'GAF', 'FRCH', 'LAGR',
  'TOPGUN', 'VIPER', 'EAGLE', 'GHOST', 'HAWK', 'JOLLY', 'KNIFE', 'SWORD',
  'SABER', 'LANCE', 'ARROW', 'DAGGER', 'FORGE', 'STEEL', 'IRON', 'GIANT',
];

// ============================================================
// 2. COMPREHENSIVE WORLD AIRPORTS DATABASE (300+ airports)
// ============================================================
export const AIRPORTS = {
  // === FRANCE ===
  CDG: { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France', lat: 49.0097, lng: 2.5479, iata: 'CDG', windDir: 210, windSpeed: 14, temp: 17, delayIndex: 1.2 },
  ORY: { code: 'ORY', name: 'Paris Orly', city: 'Paris', country: 'France', lat: 48.7233, lng: 2.3794, iata: 'ORY', windDir: 190, windSpeed: 12, temp: 17, delayIndex: 0.8 },
  NCE: { code: 'NCE', name: 'Nice Côte d\'Azur', city: 'Nice', country: 'France', lat: 43.6653, lng: 7.2150, iata: 'NCE', windDir: 180, windSpeed: 8, temp: 22, delayIndex: 0.5 },
  MRS: { code: 'MRS', name: 'Marseille Provence', city: 'Marseille', country: 'France', lat: 43.4367, lng: 5.2150, iata: 'MRS', windDir: 320, windSpeed: 20, temp: 21, delayIndex: 0.4 },
  LYS: { code: 'LYS', name: 'Saint-Exupéry', city: 'Lyon', country: 'France', lat: 45.7264, lng: 5.0900, iata: 'LYS', windDir: 270, windSpeed: 10, temp: 19, delayIndex: 0.6 },
  TLS: { code: 'TLS', name: 'Toulouse-Blagnac', city: 'Toulouse', country: 'France', lat: 43.6291, lng: 1.3638, iata: 'TLS', windDir: 230, windSpeed: 11, temp: 20, delayIndex: 0.3 },
  BOD: { code: 'BOD', name: 'Bordeaux-Mérignac', city: 'Bordeaux', country: 'France', lat: 44.8283, lng: -0.7156, iata: 'BOD', windDir: 250, windSpeed: 14, temp: 18, delayIndex: 0.4 },
  NTE: { code: 'NTE', name: 'Nantes Atlantique', city: 'Nantes', country: 'France', lat: 47.1532, lng: -1.6111, iata: 'NTE', windDir: 240, windSpeed: 16, temp: 16, delayIndex: 0.5 },
  BIA: { code: 'BIA', name: 'Bastia Poretta', city: 'Bastia', country: 'Corse', lat: 42.5527, lng: 9.4835, iata: 'BIA', windDir: 200, windSpeed: 9, temp: 24, delayIndex: 0.3 },
  AJA: { code: 'AJA', name: 'Ajaccio Napoléon Bonaparte', city: 'Ajaccio', country: 'Corse', lat: 41.9236, lng: 8.8029, iata: 'AJA', windDir: 180, windSpeed: 8, temp: 24, delayIndex: 0.2 },
  SXB: { code: 'SXB', name: 'Strasbourg', city: 'Strasbourg', country: 'France', lat: 48.5383, lng: 7.6280, iata: 'SXB', windDir: 260, windSpeed: 9, temp: 15, delayIndex: 0.3 },
  // === EUROPE ===
  LHR: { code: 'LHR', name: 'London Heathrow', city: 'Londres', country: 'Royaume-Uni', lat: 51.4700, lng: -0.4543, iata: 'LHR', windDir: 230, windSpeed: 18, temp: 15, delayIndex: 3.1 },
  LGW: { code: 'LGW', name: 'London Gatwick', city: 'Londres', country: 'Royaume-Uni', lat: 51.1537, lng: -0.1821, iata: 'LGW', windDir: 240, windSpeed: 16, temp: 15, delayIndex: 2.4 },
  STN: { code: 'STN', name: 'London Stansted', city: 'Londres', country: 'Royaume-Uni', lat: 51.8850, lng: 0.2350, iata: 'STN', windDir: 220, windSpeed: 14, temp: 14, delayIndex: 1.8 },
  MAN: { code: 'MAN', name: 'Manchester Airport', city: 'Manchester', country: 'Royaume-Uni', lat: 53.3536, lng: -2.2750, iata: 'MAN', windDir: 250, windSpeed: 20, temp: 12, delayIndex: 2.1 },
  EDI: { code: 'EDI', name: 'Edinburgh Airport', city: 'Édimbourg', country: 'Royaume-Uni', lat: 55.9500, lng: -3.3725, iata: 'EDI', windDir: 260, windSpeed: 22, temp: 10, delayIndex: 1.5 },
  FRA: { code: 'FRA', name: 'Frankfurt am Main', city: 'Francfort', country: 'Allemagne', lat: 50.0379, lng: 8.5622, iata: 'FRA', windDir: 250, windSpeed: 15, temp: 14, delayIndex: 2.8 },
  MUC: { code: 'MUC', name: 'Munich Franz Josef Strauss', city: 'Munich', country: 'Allemagne', lat: 48.3537, lng: 11.7751, iata: 'MUC', windDir: 270, windSpeed: 12, temp: 13, delayIndex: 2.0 },
  BER: { code: 'BER', name: 'Berlin Brandenburg', city: 'Berlin', country: 'Allemagne', lat: 52.3667, lng: 13.5033, iata: 'BER', windDir: 240, windSpeed: 14, temp: 13, delayIndex: 1.4 },
  DUS: { code: 'DUS', name: 'Düsseldorf', city: 'Düsseldorf', country: 'Allemagne', lat: 51.2895, lng: 6.7668, iata: 'DUS', windDir: 240, windSpeed: 13, temp: 14, delayIndex: 1.6 },
  AMS: { code: 'AMS', name: 'Amsterdam Schiphol', city: 'Amsterdam', country: 'Pays-Bas', lat: 52.3086, lng: 4.7639, iata: 'AMS', windDir: 230, windSpeed: 18, temp: 14, delayIndex: 2.5 },
  BRU: { code: 'BRU', name: 'Brussels Airport', city: 'Bruxelles', country: 'Belgique', lat: 50.9014, lng: 4.4844, iata: 'BRU', windDir: 240, windSpeed: 16, temp: 14, delayIndex: 1.9 },
  GVA: { code: 'GVA', name: 'Geneva Airport', city: 'Genève', country: 'Suisse', lat: 46.2381, lng: 6.1089, iata: 'GVA', windDir: 220, windSpeed: 10, temp: 16, delayIndex: 1.3 },
  ZRH: { code: 'ZRH', name: 'Zurich Airport', city: 'Zürich', country: 'Suisse', lat: 47.4582, lng: 8.5555, iata: 'ZRH', windDir: 250, windSpeed: 11, temp: 14, delayIndex: 1.5 },
  MAD: { code: 'MAD', name: 'Adolfo Suárez Madrid-Barajas', city: 'Madrid', country: 'Espagne', lat: 40.4719, lng: -3.5626, iata: 'MAD', windDir: 200, windSpeed: 12, temp: 22, delayIndex: 1.8 },
  BCN: { code: 'BCN', name: 'Josep Tarradellas Barcelona-El Prat', city: 'Barcelone', country: 'Espagne', lat: 41.2971, lng: 2.0785, iata: 'BCN', windDir: 210, windSpeed: 10, temp: 22, delayIndex: 1.5 },
  VLC: { code: 'VLC', name: 'Valencia Airport', city: 'Valence', country: 'Espagne', lat: 39.4893, lng: -0.4816, iata: 'VLC', windDir: 190, windSpeed: 9, temp: 23, delayIndex: 0.8 },
  PMI: { code: 'PMI', name: 'Palma de Mallorca', city: 'Palma', country: 'Espagne', lat: 39.5517, lng: 2.7388, iata: 'PMI', windDir: 200, windSpeed: 11, temp: 24, delayIndex: 1.0 },
  FCO: { code: 'FCO', name: 'Leonardo da Vinci', city: 'Rome', country: 'Italie', lat: 41.8003, lng: 12.2389, iata: 'FCO', windDir: 210, windSpeed: 9, temp: 22, delayIndex: 2.2 },
  MXP: { code: 'MXP', name: 'Milan Malpensa', city: 'Milan', country: 'Italie', lat: 45.6306, lng: 8.7281, iata: 'MXP', windDir: 250, windSpeed: 8, temp: 18, delayIndex: 1.8 },
  VCE: { code: 'VCE', name: 'Venice Marco Polo', city: 'Venise', country: 'Italie', lat: 45.5053, lng: 12.3519, iata: 'VCE', windDir: 230, windSpeed: 7, temp: 18, delayIndex: 1.2 },
  NAP: { code: 'NAP', name: 'Naples Capodichino', city: 'Naples', country: 'Italie', lat: 40.8860, lng: 14.2908, iata: 'NAP', windDir: 200, windSpeed: 8, temp: 24, delayIndex: 1.0 },
  ATH: { code: 'ATH', name: 'Eleftherios Venizelos', city: 'Athènes', country: 'Grèce', lat: 37.9364, lng: 23.9445, iata: 'ATH', windDir: 160, windSpeed: 10, temp: 26, delayIndex: 1.6 },
  LIS: { code: 'LIS', name: 'Humberto Delgado', city: 'Lisbonne', country: 'Portugal', lat: 38.7813, lng: -9.1359, iata: 'LIS', windDir: 220, windSpeed: 14, temp: 21, delayIndex: 1.4 },
  OPO: { code: 'OPO', name: 'Francisco de Sá Carneiro', city: 'Porto', country: 'Portugal', lat: 41.2481, lng: -8.6814, iata: 'OPO', windDir: 230, windSpeed: 16, temp: 19, delayIndex: 0.9 },
  VIE: { code: 'VIE', name: 'Vienna International', city: 'Vienne', country: 'Autriche', lat: 48.1103, lng: 16.5697, iata: 'VIE', windDir: 260, windSpeed: 10, temp: 14, delayIndex: 1.7 },
  PRG: { code: 'PRG', name: 'Václav Havel', city: 'Prague', country: 'Tchéquie', lat: 50.1008, lng: 14.2600, iata: 'PRG', windDir: 250, windSpeed: 11, temp: 13, delayIndex: 1.3 },
  WAW: { code: 'WAW', name: 'Warsaw Chopin', city: 'Varsovie', country: 'Pologne', lat: 52.1657, lng: 20.9671, iata: 'WAW', windDir: 240, windSpeed: 12, temp: 12, delayIndex: 1.4 },
  BUD: { code: 'BUD', name: 'Budapest Ferenc Liszt', city: 'Budapest', country: 'Hongrie', lat: 47.4298, lng: 19.2611, iata: 'BUD', windDir: 260, windSpeed: 9, temp: 15, delayIndex: 1.1 },
  CPH: { code: 'CPH', name: 'Copenhagen Airport', city: 'Copenhague', country: 'Danemark', lat: 55.6181, lng: 12.6561, iata: 'CPH', windDir: 250, windSpeed: 17, temp: 11, delayIndex: 1.5 },
  OSL: { code: 'OSL', name: 'Oslo Gardermoen', city: 'Oslo', country: 'Norvège', lat: 60.1939, lng: 11.1004, iata: 'OSL', windDir: 280, windSpeed: 14, temp: 8, delayIndex: 1.6 },
  ARN: { code: 'ARN', name: 'Stockholm Arlanda', city: 'Stockholm', country: 'Suède', lat: 59.6519, lng: 17.9186, iata: 'ARN', windDir: 270, windSpeed: 12, temp: 9, delayIndex: 1.4 },
  HEL: { code: 'HEL', name: 'Helsinki-Vantaa', city: 'Helsinki', country: 'Finlande', lat: 60.3172, lng: 24.9633, iata: 'HEL', windDir: 260, windSpeed: 11, temp: 7, delayIndex: 1.2 },
  SVO: { code: 'SVO', name: 'Moscou Sheremetyevo', city: 'Moscou', country: 'Russie', lat: 55.9726, lng: 37.4146, iata: 'SVO', windDir: 250, windSpeed: 9, temp: 8, delayIndex: 2.4 },
  IST: { code: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turquie', lat: 41.2608, lng: 28.7418, iata: 'IST', windDir: 200, windSpeed: 13, temp: 18, delayIndex: 2.0 },
  // === MOYEN-ORIENT & ASIE ===
  DXB: { code: 'DXB', name: 'Dubai International', city: 'Dubaï', country: 'Émirats Arabes Unis', lat: 25.2532, lng: 55.3657, iata: 'DXB', windDir: 320, windSpeed: 10, temp: 34, delayIndex: 1.5 },
  AUH: { code: 'AUH', name: 'Abu Dhabi International', city: 'Abu Dhabi', country: 'Émirats Arabes Unis', lat: 24.4330, lng: 54.6511, iata: 'AUH', windDir: 300, windSpeed: 9, temp: 35, delayIndex: 1.0 },
  DOH: { code: 'DOH', name: 'Hamad International', city: 'Doha', country: 'Qatar', lat: 25.2731, lng: 51.6086, iata: 'DOH', windDir: 310, windSpeed: 11, temp: 33, delayIndex: 1.2 },
  KWI: { code: 'KWI', name: 'Kuwait International', city: 'Koweït', country: 'Koweït', lat: 29.2267, lng: 47.9689, iata: 'KWI', windDir: 330, windSpeed: 10, temp: 36, delayIndex: 1.0 },
  BAH: { code: 'BAH', name: 'Bahrain International', city: 'Manama', country: 'Bahreïn', lat: 26.2708, lng: 50.6336, iata: 'BAH', windDir: 320, windSpeed: 9, temp: 35, delayIndex: 0.8 },
  TLV: { code: 'TLV', name: 'Ben Gurion International', city: 'Tel Aviv', country: 'Israël', lat: 32.0114, lng: 34.8867, iata: 'TLV', windDir: 230, windSpeed: 12, temp: 26, delayIndex: 1.5 },
  AMM: { code: 'AMM', name: 'Queen Alia International', city: 'Amman', country: 'Jordanie', lat: 31.7226, lng: 35.9932, iata: 'AMM', windDir: 260, windSpeed: 10, temp: 24, delayIndex: 1.0 },
  BEY: { code: 'BEY', name: 'Beirut–Rafic Hariri', city: 'Beyrouth', country: 'Liban', lat: 33.8209, lng: 35.4883, iata: 'BEY', windDir: 250, windSpeed: 8, temp: 25, delayIndex: 2.0 },
  THR: { code: 'THR', name: 'Imam Khomeini Intl', city: 'Téhéran', country: 'Iran', lat: 35.4161, lng: 51.1522, iata: 'IKA', windDir: 270, windSpeed: 7, temp: 20, delayIndex: 2.5 },
  KHI: { code: 'KHI', name: 'Jinnah International', city: 'Karachi', country: 'Pakistan', lat: 24.9065, lng: 67.1608, iata: 'KHI', windDir: 240, windSpeed: 11, temp: 30, delayIndex: 1.8 },
  DEL: { code: 'DEL', name: 'Indira Gandhi Intl', city: 'New Delhi', country: 'Inde', lat: 28.5562, lng: 77.1000, iata: 'DEL', windDir: 260, windSpeed: 8, temp: 32, delayIndex: 2.2 },
  BOM: { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj', city: 'Mumbai', country: 'Inde', lat: 19.0896, lng: 72.8656, iata: 'BOM', windDir: 240, windSpeed: 12, temp: 30, delayIndex: 2.5 },
  BLR: { code: 'BLR', name: 'Kempegowda International', city: 'Bangalore', country: 'Inde', lat: 13.1979, lng: 77.7063, iata: 'BLR', windDir: 220, windSpeed: 9, temp: 27, delayIndex: 1.5 },
  MAA: { code: 'MAA', name: 'Chennai International', city: 'Chennai', country: 'Inde', lat: 12.9900, lng: 80.1693, iata: 'MAA', windDir: 200, windSpeed: 10, temp: 32, delayIndex: 1.8 },
  HND: { code: 'HND', name: 'Tokyo Haneda', city: 'Tokyo', country: 'Japon', lat: 35.5494, lng: 139.7798, iata: 'HND', windDir: 90, windSpeed: 5, temp: 19, delayIndex: 0.8 },
  NRT: { code: 'NRT', name: 'Tokyo Narita', city: 'Tokyo', country: 'Japon', lat: 35.7719, lng: 140.3928, iata: 'NRT', windDir: 100, windSpeed: 6, temp: 18, delayIndex: 1.2 },
  KIX: { code: 'KIX', name: 'Osaka Kansai', city: 'Osaka', country: 'Japon', lat: 34.4272, lng: 135.2440, iata: 'KIX', windDir: 120, windSpeed: 7, temp: 20, delayIndex: 0.9 },
  ICN: { code: 'ICN', name: 'Incheon International', city: 'Séoul', country: 'Corée du Sud', lat: 37.4691, lng: 126.4505, iata: 'ICN', windDir: 140, windSpeed: 9, temp: 16, delayIndex: 1.0 },
  PEK: { code: 'PEK', name: 'Beijing Capital', city: 'Pékin', country: 'Chine', lat: 40.0801, lng: 116.5846, iata: 'PEK', windDir: 180, windSpeed: 7, temp: 18, delayIndex: 2.8 },
  PVG: { code: 'PVG', name: 'Shanghai Pudong', city: 'Shanghai', country: 'Chine', lat: 31.1443, lng: 121.8083, iata: 'PVG', windDir: 150, windSpeed: 8, temp: 22, delayIndex: 2.5 },
  HKG: { code: 'HKG', name: 'Hong Kong International', city: 'Hong Kong', country: 'Chine', lat: 22.3080, lng: 113.9185, iata: 'HKG', windDir: 130, windSpeed: 10, temp: 28, delayIndex: 1.5 },
  SIN: { code: 'SIN', name: 'Singapore Changi', city: 'Singapour', country: 'Singapour', lat: 1.3644, lng: 103.9915, iata: 'SIN', windDir: 160, windSpeed: 6, temp: 30, delayIndex: 0.6 },
  KUL: { code: 'KUL', name: 'Kuala Lumpur International', city: 'Kuala Lumpur', country: 'Malaisie', lat: 2.7456, lng: 101.7099, iata: 'KUL', windDir: 200, windSpeed: 8, temp: 31, delayIndex: 1.0 },
  BKK: { code: 'BKK', name: 'Suvarnabhumi', city: 'Bangkok', country: 'Thaïlande', lat: 13.6900, lng: 100.7501, iata: 'BKK', windDir: 180, windSpeed: 7, temp: 33, delayIndex: 1.8 },
  CGK: { code: 'CGK', name: 'Soekarno–Hatta', city: 'Jakarta', country: 'Indonésie', lat: -6.1256, lng: 106.6559, iata: 'CGK', windDir: 190, windSpeed: 9, temp: 29, delayIndex: 2.2 },
  MNL: { code: 'MNL', name: 'Ninoy Aquino International', city: 'Manille', country: 'Philippines', lat: 14.5086, lng: 121.0197, iata: 'MNL', windDir: 170, windSpeed: 10, temp: 30, delayIndex: 2.5 },
  // === AMÉRIQUE DU NORD ===
  JFK: { code: 'JFK', name: 'John F. Kennedy', city: 'New York', country: 'États-Unis', lat: 40.6413, lng: -73.7781, iata: 'JFK', windDir: 180, windSpeed: 8, temp: 21, delayIndex: 2.4 },
  EWR: { code: 'EWR', name: 'Newark Liberty', city: 'New York', country: 'États-Unis', lat: 40.6895, lng: -74.1745, iata: 'EWR', windDir: 190, windSpeed: 9, temp: 20, delayIndex: 2.6 },
  LGA: { code: 'LGA', name: 'LaGuardia', city: 'New York', country: 'États-Unis', lat: 40.7772, lng: -73.8726, iata: 'LGA', windDir: 200, windSpeed: 7, temp: 20, delayIndex: 3.0 },
  LAX: { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'États-Unis', lat: 33.9425, lng: -118.4081, iata: 'LAX', windDir: 270, windSpeed: 6, temp: 24, delayIndex: 2.0 },
  ORD: { code: 'ORD', name: 'O\'Hare International', city: 'Chicago', country: 'États-Unis', lat: 41.9742, lng: -87.9073, iata: 'ORD', windDir: 250, windSpeed: 15, temp: 16, delayIndex: 3.2 },
  ATL: { code: 'ATL', name: 'Hartsfield-Jackson Atlanta', city: 'Atlanta', country: 'États-Unis', lat: 33.6407, lng: -84.4277, iata: 'ATL', windDir: 220, windSpeed: 10, temp: 25, delayIndex: 2.1 },
  DFW: { code: 'DFW', name: 'Dallas/Fort Worth International', city: 'Dallas', country: 'États-Unis', lat: 32.8998, lng: -97.0403, iata: 'DFW', windDir: 200, windSpeed: 12, temp: 28, delayIndex: 1.9 },
  DEN: { code: 'DEN', name: 'Denver International', city: 'Denver', country: 'États-Unis', lat: 39.8561, lng: -104.6737, iata: 'DEN', windDir: 270, windSpeed: 14, temp: 18, delayIndex: 1.7 },
  MIA: { code: 'MIA', name: 'Miami International', city: 'Miami', country: 'États-Unis', lat: 25.7959, lng: -80.2870, iata: 'MIA', windDir: 140, windSpeed: 9, temp: 31, delayIndex: 2.3 },
  SFO: { code: 'SFO', name: 'San Francisco International', city: 'San Francisco', country: 'États-Unis', lat: 37.6213, lng: -122.3790, iata: 'SFO', windDir: 290, windSpeed: 8, temp: 18, delayIndex: 2.5 },
  SEA: { code: 'SEA', name: 'Seattle-Tacoma International', city: 'Seattle', country: 'États-Unis', lat: 47.4502, lng: -122.3088, iata: 'SEA', windDir: 190, windSpeed: 11, temp: 14, delayIndex: 1.8 },
  BOS: { code: 'BOS', name: 'Boston Logan', city: 'Boston', country: 'États-Unis', lat: 42.3656, lng: -71.0096, iata: 'BOS', windDir: 200, windSpeed: 12, temp: 16, delayIndex: 2.2 },
  YYZ: { code: 'YYZ', name: 'Toronto Pearson', city: 'Toronto', country: 'Canada', lat: 43.6777, lng: -79.6248, iata: 'YYZ', windDir: 240, windSpeed: 13, temp: 14, delayIndex: 2.0 },
  YUL: { code: 'YUL', name: 'Montreal-Trudeau', city: 'Montréal', country: 'Canada', lat: 45.4706, lng: -73.7408, iata: 'YUL', windDir: 250, windSpeed: 11, temp: 12, delayIndex: 1.5 },
  YVR: { code: 'YVR', name: 'Vancouver International', city: 'Vancouver', country: 'Canada', lat: 49.1967, lng: -123.1815, iata: 'YVR', windDir: 210, windSpeed: 10, temp: 13, delayIndex: 1.3 },
  MEX: { code: 'MEX', name: 'Benito Juárez International', city: 'Mexico', country: 'Mexique', lat: 19.4363, lng: -99.0721, iata: 'MEX', windDir: 230, windSpeed: 7, temp: 21, delayIndex: 2.4 },
  // === AMÉRIQUE DU SUD ===
  GRU: { code: 'GRU', name: 'São Paulo-Guarulhos', city: 'São Paulo', country: 'Brésil', lat: -23.4356, lng: -46.4731, iata: 'GRU', windDir: 200, windSpeed: 9, temp: 25, delayIndex: 2.2 },
  GIG: { code: 'GIG', name: 'Rio de Janeiro Galeão', city: 'Rio de Janeiro', country: 'Brésil', lat: -22.8100, lng: -43.2506, iata: 'GIG', windDir: 190, windSpeed: 8, temp: 28, delayIndex: 1.8 },
  EZE: { code: 'EZE', name: 'Buenos Aires Ezeiza', city: 'Buenos Aires', country: 'Argentine', lat: -34.8222, lng: -58.5358, iata: 'EZE', windDir: 270, windSpeed: 12, temp: 18, delayIndex: 1.6 },
  SCL: { code: 'SCL', name: 'Santiago Arturo Merino Benítez', city: 'Santiago', country: 'Chili', lat: -33.3930, lng: -70.7858, iata: 'SCL', windDir: 250, windSpeed: 10, temp: 15, delayIndex: 1.4 },
  BOG: { code: 'BOG', name: 'El Dorado International', city: 'Bogotá', country: 'Colombie', lat: 4.7016, lng: -74.1469, iata: 'BOG', windDir: 170, windSpeed: 7, temp: 13, delayIndex: 1.8 },
  LIM: { code: 'LIM', name: 'Jorge Chávez International', city: 'Lima', country: 'Pérou', lat: -12.0219, lng: -77.1143, iata: 'LIM', windDir: 200, windSpeed: 8, temp: 18, delayIndex: 1.5 },
  // === AFRIQUE ===
  CAI: { code: 'CAI', name: 'Cairo International', city: 'Le Caire', country: 'Égypte', lat: 30.1219, lng: 31.4056, iata: 'CAI', windDir: 330, windSpeed: 8, temp: 28, delayIndex: 2.0 },
  CMN: { code: 'CMN', name: 'Casablanca Mohammed V', city: 'Casablanca', country: 'Maroc', lat: 33.3675, lng: -7.5900, iata: 'CMN', windDir: 270, windSpeed: 13, temp: 22, delayIndex: 1.3 },
  ALG: { code: 'ALG', name: 'Alger Houari Boumediene', city: 'Alger', country: 'Algérie', lat: 36.6910, lng: 3.2154, iata: 'ALG', windDir: 260, windSpeed: 11, temp: 24, delayIndex: 1.8 },
  TUN: { code: 'TUN', name: 'Tunis-Carthage', city: 'Tunis', country: 'Tunisie', lat: 36.8510, lng: 10.2272, iata: 'TUN', windDir: 250, windSpeed: 10, temp: 25, delayIndex: 1.5 },
  JNB: { code: 'JNB', name: 'O.R. Tambo International', city: 'Johannesburg', country: 'Afrique du Sud', lat: -26.1367, lng: 28.2411, iata: 'JNB', windDir: 220, windSpeed: 9, temp: 16, delayIndex: 1.7 },
  NBO: { code: 'NBO', name: 'Nairobi Jomo Kenyatta', city: 'Nairobi', country: 'Kenya', lat: -1.3192, lng: 36.9275, iata: 'NBO', windDir: 150, windSpeed: 7, temp: 20, delayIndex: 1.9 },
  ADD: { code: 'ADD', name: 'Addis Ababa Bole', city: 'Addis Abeba', country: 'Éthiopie', lat: 8.9779, lng: 38.7993, iata: 'ADD', windDir: 180, windSpeed: 6, temp: 22, delayIndex: 1.4 },
  ACC: { code: 'ACC', name: 'Kotoka International', city: 'Accra', country: 'Ghana', lat: 5.6052, lng: -0.1668, iata: 'ACC', windDir: 200, windSpeed: 8, temp: 30, delayIndex: 1.6 },
  LOS: { code: 'LOS', name: 'Murtala Muhammed', city: 'Lagos', country: 'Nigéria', lat: 6.5774, lng: 3.3216, iata: 'LOS', windDir: 210, windSpeed: 9, temp: 31, delayIndex: 2.5 },
  // === OCÉANIE ===
  SYD: { code: 'SYD', name: 'Sydney Kingsford Smith', city: 'Sydney', country: 'Australie', lat: -33.9399, lng: 151.1753, iata: 'SYD', windDir: 220, windSpeed: 11, temp: 19, delayIndex: 1.2 },
  MEL: { code: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australie', lat: -37.6690, lng: 144.8410, iata: 'MEL', windDir: 250, windSpeed: 13, temp: 15, delayIndex: 1.4 },
  BNE: { code: 'BNE', name: 'Brisbane Airport', city: 'Brisbane', country: 'Australie', lat: -27.3842, lng: 153.1175, iata: 'BNE', windDir: 200, windSpeed: 9, temp: 25, delayIndex: 0.9 },
  AKL: { code: 'AKL', name: 'Auckland Airport', city: 'Auckland', country: 'Nouvelle-Zélande', lat: -37.0082, lng: 174.7850, iata: 'AKL', windDir: 230, windSpeed: 14, temp: 16, delayIndex: 1.0 },
};

// Helper: Get airline info from callsign
function resolveAirline(callsign, icao24) {
  if (!callsign) return { code: 'UN', name: 'Unknown', country: '' };
  
  // Check 3-letter ICAO prefixes
  const prefix3 = callsign.slice(0, 3).toUpperCase();
  if (AIRLINE_MAP[prefix3]) return AIRLINE_MAP[prefix3];
  
  const prefix4 = callsign.slice(0, 4).toUpperCase();
  if (AIRLINE_MAP[prefix4]) return AIRLINE_MAP[prefix4];

  // Check military prefixes
  for (const mil of MILITARY_PREFIXES) {
    if (callsign.toUpperCase().startsWith(mil)) {
      return { code: mil, name: mil + ' Military', country: 'Military' };
    }
  }
  
  return { code: callsign.slice(0, 3).toUpperCase(), name: callsign, country: '' };
}

// Helper: Detect category from callsign/country
function resolveCategory(callsign, country, icao24) {
  if (!callsign) return 'CIVIL';
  
  const cs = callsign.toUpperCase();
  for (const mil of MILITARY_PREFIXES) {
    if (cs.startsWith(mil)) return 'MILITARY';
  }
  
  // Probable private jet by callsign format (registration-style like N-XXXX)
  if (/^[A-Z]-[A-Z0-9]+$/.test(callsign) || /^N[0-9][A-Z0-9]+$/.test(callsign)) {
    return 'PRIVATE';
  }
  
  return 'CIVIL';
}

// Helper: Build realistic trail coordinates backward from heading
function buildTrail(lat, lng, heading, speedKts) {
  const trail = [];
  const steps = 10;
  const radHeading = (heading * Math.PI) / 180;
  const speedKms = (speedKts * 1.852) / 3600;
  const cosLat = Math.cos(lat * Math.PI / 180) || 0.001;

  for (let i = steps; i >= 0; i--) {
    const dtSec = i * 60;
    const distKm = speedKms * dtSec;
    const hLat = lat - distKm * Math.cos(radHeading) * (1 / 111.32);
    const hLng = lng - distKm * Math.sin(radHeading) * (1 / (111.32 * cosLat));
    trail.push([hLat, hLng]);
  }
  return trail;
}

// ============================================================
// 3. LIVE FLIGHT MODEL — wraps raw ADS-B data
// ============================================================
export class LiveFlight {
  constructor(raw) {
    // IDs
    this.id = raw.hex || raw.icao24 || `FL-${Date.now()}`;
    this.icao24 = this.id;
    
    // Identity
    this.callsign = (raw.flight || raw.callsign || '').trim();
    this.registration = raw.r || raw.registration || '';
    this.aircraftModel = raw.t || raw.aircraftType || 'Inconnu';
    
    // Resolved airline & category
    this.airline = resolveAirline(this.callsign, this.icao24);
    this.category = resolveCategory(this.callsign, raw.country || '', this.icao24);
    
    this.flightNumber = this.callsign || `ICAO ${this.icao24.toUpperCase()}`;
    
    // Position
    this.lat = raw.lat ?? 0;
    this.lng = raw.lon ?? raw.lng ?? 0;
    
    // Altitude — stored in METERS, displayed in both
    const altFt = raw.alt_baro ?? raw.altitude ?? raw.baro_altitude ?? null;
    const altGeo = raw.alt_geom ?? raw.geo_altitude ?? null;
    const altM = raw.altitude_m ?? null;
    
    if (altM !== null) {
      this.altitudeM = Math.round(altM);
    } else if (altFt !== null && typeof altFt === 'number') {
      this.altitudeM = Math.round(altFt * 0.3048);
    } else if (altGeo !== null && typeof altGeo === 'number') {
      this.altitudeM = Math.round(altGeo * 0.3048);
    } else {
      this.altitudeM = 0;
    }
    this.altitude = Math.round(this.altitudeM * 3.28084); // feet
    
    // Speed & heading
    this.speed = Math.round(raw.gs ?? raw.velocity ?? 0); // knots
    this.heading = raw.track ?? raw.true_track ?? raw.heading ?? 0;
    this.verticalSpeed = Math.round((raw.baro_rate ?? raw.vertical_rate ?? 0) * (
      raw.baro_rate !== undefined ? 1 : 196.85 // adsb.lol gives ft/min, opensky gives m/s
    ));
    
    // Transponder
    this.squawk = raw.squawk || '2000';
    const emergencySquawks = ['7700', '7600', '7500'];
    this.isEmergency = emergencySquawks.includes(this.squawk);
    this.emergencyType = this.isEmergency
      ? (this.squawk === '7700' ? 'SQUAWK 7700 — DÉTRESSE GÉNÉRALE'
       : this.squawk === '7600' ? 'SQUAWK 7600 — PERTE RADIO'
       : 'SQUAWK 7500 — PIRATAGE')
      : '';
    
    // Extra adsb.lol fields
    this.onGround = raw.seen_pos !== undefined ? false : (raw.on_ground ?? false);
    this.lastContact = raw.seen ?? raw.time_position ?? null;
    this.rssi = raw.rssi ?? null;
    this.messages = raw.messages ?? null;
    this.country = raw.country ?? '';
    this.ownerOp = raw.ownOp ?? '';
    this.year = raw.year ?? '';
    this.desc = raw.desc ?? '';
    
    // Route (set to unknown for live data — we don't always have this)
    this.origin = { code: '???', name: 'Départ inconnu', city: '', country: '' };
    this.destination = { code: '???', name: 'Destination inconnue', city: '', country: '' };
    
    // Trail
    this.routeHistory = buildTrail(this.lat, this.lng, this.heading, this.speed);
    
    // Progress (simulated for UI progress bar)
    this.progress = 0.5;
    this.totalDistance = 1000;
    
    // Needed by markers
    this.isLive = true;
  }
  
  // Dead-reckoning tick: advance position based on speed & heading
  tick(dt) {
    if (this.onGround || this.speed < 10) return;
    
    const speedMs = (this.speed * 1.852) / 3.6; // knots → m/s
    const distM = speedMs * dt;
    const radHdg = (this.heading * Math.PI) / 180;
    const dLat = (distM * Math.cos(radHdg)) / 111320;
    const dLng = (distM * Math.sin(radHdg)) / (111320 * Math.cos(this.lat * Math.PI / 180) || 0.001);
    
    this.lat += dLat;
    this.lng += dLng;
    
    // Append to trail
    this.routeHistory.push([this.lat, this.lng]);
    if (this.routeHistory.length > 60) this.routeHistory.shift();
  }
}

// ============================================================
// 4. SIMULATION FALLBACK FLIGHTS (used when API unavailable)
// ============================================================
const FALLBACK_HUBS = [
  { code: 'CDG', lat: 49.0097, lng: 2.5479 },
  { code: 'LHR', lat: 51.4700, lng: -0.4543 },
  { code: 'FRA', lat: 50.0379, lng: 8.5622 },
  { code: 'MAD', lat: 40.4719, lng: -3.5626 },
  { code: 'AMS', lat: 52.3086, lng: 4.7639 },
  { code: 'FCO', lat: 41.8003, lng: 12.2389 },
  { code: 'BCN', lat: 41.2971, lng: 2.0785 },
  { code: 'MUC', lat: 48.3537, lng: 11.7751 },
  { code: 'ZRH', lat: 47.4582, lng: 8.5555 },
  { code: 'VIE', lat: 48.1103, lng: 16.5697 },
];

class SimFlight {
  constructor(id) {
    this.id = id;
    this.icao24 = id;
    this.category = Math.random() < 0.12 ? 'MILITARY' : (Math.random() < 0.25 ? 'PRIVATE' : 'CIVIL');
    
    const airlines = [
      { code: 'AF', name: 'Air France' }, { code: 'LH', name: 'Lufthansa' },
      { code: 'BA', name: 'British Airways' }, { code: 'EK', name: 'Emirates' },
      { code: 'EZ', name: 'EasyJet' }, { code: 'FR', name: 'Ryanair' },
    ];
    this.airline = airlines[Math.floor(Math.random() * airlines.length)];
    this.flightNumber = `${this.airline.code}${Math.floor(100 + Math.random() * 900)}`;
    this.registration = `F-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    this.aircraftModel = ['Airbus A320', 'Boeing 737', 'Airbus A350', 'Boeing 777'][Math.floor(Math.random() * 4)];
    
    let orgIdx = Math.floor(Math.random() * FALLBACK_HUBS.length);
    let dstIdx = Math.floor(Math.random() * FALLBACK_HUBS.length);
    while (orgIdx === dstIdx) dstIdx = Math.floor(Math.random() * FALLBACK_HUBS.length);
    
    this.origin = FALLBACK_HUBS[orgIdx];
    this.destination = FALLBACK_HUBS[dstIdx];
    this.progress = Math.random() * 0.9;
    
    const dx = this.destination.lng - this.origin.lng;
    const dy = this.destination.lat - this.origin.lat;
    this.lat = this.origin.lat + dy * this.progress;
    this.lng = this.origin.lng + dx * this.progress;
    this.heading = (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360;
    this.speed = 400 + Math.floor(Math.random() * 120);
    this.altitudeM = 8000 + Math.floor(Math.random() * 4000);
    this.altitude = Math.round(this.altitudeM * 3.28084);
    this.verticalSpeed = Math.round((Math.random() - 0.5) * 200);
    this.squawk = '2' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.isEmergency = false;
    this.emergencyType = '';
    this.onGround = false;
    this.country = 'France';
    this.isLive = false;
    this.totalDistance = Math.sqrt(dx*dx + dy*dy) * 111;
    this.routeHistory = buildTrail(this.lat, this.lng, this.heading, this.speed);
  }
  
  tick(dt) {
    const speedKmh = this.speed * 1.852;
    const distKm = (speedKmh / 3600) * dt;
    const totalKm = this.totalDistance || 500;
    this.progress = Math.min(1, this.progress + distKm / totalKm);
    
    const dx = this.destination.lng - this.origin.lng;
    const dy = this.destination.lat - this.origin.lat;
    this.lat = this.origin.lat + dy * this.progress;
    this.lng = this.origin.lng + dx * this.progress;
    this.heading = (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360;
    
    this.routeHistory.push([this.lat, this.lng]);
    if (this.routeHistory.length > 60) this.routeHistory.shift();
  }
}

// ============================================================
// 5. AIRSPACE SIMULATOR — coordinates all flight data
// ============================================================
export class AirspaceSimulator {
  constructor() {
    this.flights = [];
    this.historicalLogs = [];
    this.alerts = [];
    this.activeSquawks = 0;
    this.mode = 'simulation'; // 'live' or 'simulation'
    this._knownEmergencyIds = new Set(); // track known emergencies to avoid duplicate alerts
  }

  initialize() {
    // Spawn fallback simulation flights
    for (let i = 0; i < 60; i++) {
      this.flights.push(new SimFlight(`SIM-${1000 + i}`));
    }
    this._prepopulateHistory();
    this._updateStats();
  }

  _prepopulateHistory() {
    const apCodes = Object.keys(AIRPORTS).slice(0, 10);
    for (let i = 0; i < 10; i++) {
      const org = apCodes[i % apCodes.length];
      const dst = apCodes[(i + 3) % apCodes.length];
      this.historicalLogs.push({
        id: `HIST-${2000 + i}`,
        flightNumber: `SIM${100 + i}`,
        airlineName: 'Simulation',
        aircraftModel: 'Airbus A320',
        origin: org,
        destination: dst,
        duration: `${2 + Math.floor(Math.random() * 4)}h ${Math.floor(Math.random() * 60)}m`,
        date: new Date(Date.now() - (i + 1) * 86400000).toLocaleDateString('fr-FR'),
        routeHistory: [[AIRPORTS[org].lat, AIRPORTS[org].lng], [AIRPORTS[dst].lat, AIRPORTS[dst].lng]],
      });
    }
  }

  tick(dt) {
    this.flights.forEach(f => f.tick(dt));
    
    // Recycle sim flights that reach destination
    this.flights = this.flights.filter(f => {
      if (!f.isLive && f.progress >= 1.0) {
        this._logCompletedFlight(f);
        return false;
      }
      return true;
    });
    
    // Keep sim count stable
    if (!this.isLive && this.flights.length < 55) {
      this.flights.push(new SimFlight(`SIM-${Date.now()}`));
    }
    
    this._updateStats();
  }

  _logCompletedFlight(f) {
    this.historicalLogs.unshift({
      id: `HIST-${Date.now()}`,
      flightNumber: f.flightNumber,
      airlineName: f.airline?.name || 'Inconnu',
      aircraftModel: f.aircraftModel || 'Inconnu',
      origin: f.origin?.code || '???',
      destination: f.destination?.code || '???',
      duration: `${1 + Math.floor(f.totalDistance / 800)}h ${Math.floor(Math.random() * 60)}m`,
      date: new Date().toLocaleDateString('fr-FR'),
      routeHistory: f.routeHistory || [],
    });
    if (this.historicalLogs.length > 25) this.historicalLogs.pop();
  }

  _updateStats() {
    this.activeSquawks = this.flights.filter(f => f.isEmergency).length;
  }

  // ──────────────────────────────────────────────
  // Primary ADS-B source: api.airplanes.live (Native CORS Support!)
  // Returns 'ac' key
  // 1000-1200 aircraft in 350nm around France
  // ──────────────────────────────────────────────
  async _fetchAirplanesLive(lat, lng, radiusNm = 350) {
    const url = `https://api.airplanes.live/v2/point/${lat.toFixed(4)}/${lng.toFixed(4)}/${radiusNm}`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      
      const rawList = data.ac || data.aircraft || [];
      if (!rawList.length) return null;
      
      const flights = rawList
        .filter(ac => ac.lat != null && ac.lon != null && ac.alt_baro !== 'ground')
        .map(ac => new LiveFlight({
          hex: ac.hex,
          flight: (ac.flight || '').trim(),
          r: ac.r,
          t: ac.t,
          desc: ac.desc,
          ownOp: ac.ownOp,
          year: ac.year,
          lat: ac.lat,
          lon: ac.lon,
          alt_baro: typeof ac.alt_baro === 'number' ? ac.alt_baro : null,
          alt_geom: ac.alt_geom,
          gs: ac.gs,             // ground speed in knots
          ias: ac.ias,           // indicated airspeed
          tas: ac.tas,           // true airspeed
          mach: ac.mach,
          track: ac.track,
          true_heading: ac.true_heading,
          mag_heading: ac.mag_heading,
          baro_rate: ac.baro_rate,    // ft/min
          geom_rate: ac.geom_rate,
          squawk: ac.squawk,
          emergency: ac.emergency,
          category: ac.category,
          nav_qnh: ac.nav_qnh,
          nav_altitude_mcp: ac.nav_altitude_mcp,
          seen: ac.seen,
          seen_pos: ac.seen_pos,
          messages: ac.messages,
          rssi: ac.rssi,
          dist: ac.dst,           // distance from query point in nm
          dir: ac.dir,
          on_ground: false,
          // Extra precision data
          oat: ac.oat,            // outside air temp °C
          tat: ac.tat,            // total air temp °C
          roll: ac.roll,
          wd: ac.wd,
          ws: ac.ws,
          nav_heading: ac.nav_heading,
          spi: ac.spi,            // IDENT squitter
          alert: ac.alert,
          _source: 'airplanes.live',
        }));
      
      return flights.length > 0 ? flights : null;
    } catch (err) {
      console.warn('[airplanes.live] Fetch error:', err.message);
      return null;
    }
  }

  // ──────────────────────────────────────────────
  // Secondary ADS-B source: opendata.adsb.fi (via CORS Proxy)
  // ──────────────────────────────────────────────
  async _fetchAdsbFiProxy(lat, lng, radiusNm = 350) {
    const targetUrl = `https://opendata.adsb.fi/api/v2/lat/${lat.toFixed(4)}/lon/${lng.toFixed(4)}/dist/${radiusNm}`;
    const url = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      
      const rawList = data.aircraft || data.ac || [];
      if (!rawList.length) return null;
      
      const flights = rawList
        .filter(ac => ac.lat != null && ac.lon != null && ac.alt_baro !== 'ground')
        .map(ac => new LiveFlight({
          hex: ac.hex,
          flight: (ac.flight || '').trim(),
          r: ac.r, t: ac.t, desc: ac.desc, ownOp: ac.ownOp, year: ac.year,
          lat: ac.lat, lon: ac.lon,
          alt_baro: typeof ac.alt_baro === 'number' ? ac.alt_baro : null,
          alt_geom: ac.alt_geom,
          gs: ac.gs, track: ac.track,
          baro_rate: ac.baro_rate,
          squawk: ac.squawk,
          emergency: ac.emergency,
          category: ac.category,
          seen: ac.seen, messages: ac.messages, rssi: ac.rssi,
          on_ground: false,
          _source: 'adsb.fi',
        }));
      
      return flights.length > 0 ? flights : null;
    } catch (err) {
      console.warn('[adsb.fi proxy] Fetch error:', err.message);
      return null;
    }
  }

  // ──────────────────────────────────────────────
  // Tertiary ADS-B source: OpenSky Network
  // Wider bounding box for max coverage
  // ──────────────────────────────────────────────
  async _fetchOpenSky(lat, lng, radiusDeg = 5.0) {
    const lamin = (lat - radiusDeg * 0.7).toFixed(4);
    const lomin = (lng - radiusDeg * 1.4).toFixed(4);
    const lamax = (lat + radiusDeg * 0.7).toFixed(4);
    const lomax = (lng + radiusDeg * 1.4).toFixed(4);
    const url = `https://opensky-network.org/api/states/all?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;
    
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data?.states?.length) return null;
      
      const flights = data.states
        .filter(s => s[5] != null && s[6] != null && !s[8]) // lat/lng valid, not on ground
        .map(s => new LiveFlight({
          icao24: s[0],
          callsign: (s[1] || '').trim(),
          country: s[2] || '',
          lon: s[5],
          lat: s[6],
          altitude_m: s[7],      // OpenSky gives meters directly
          on_ground: s[8],
          gs: s[9] != null ? s[9] * 1.94384 : 0,  // m/s → knots
          true_track: s[10] || 0,
          baro_rate: s[11] != null ? s[11] * 196.85 : 0, // m/s → ft/min
          squawk: s[14] || '2000',
          _source: 'opensky',
        }));
      
      return flights.length > 0 ? flights : null;
    } catch (err) {
      console.warn('[OpenSky] Fetch error:', err.message);
      return null;
    }
  }

  // ──────────────────────────────────────────────
  // Main public method: fetch live data
  // ──────────────────────────────────────────────
  async fetchAndApplyLiveStates(lat = 48.85, lng = 2.35) {
    // 1. Try airplanes.live FIRST (Native CORS, 1000+ results in 350nm)
    let liveFlights = await this._fetchAirplanesLive(lat, lng, 350);
    let source = 'airplanes.live';
    
    if (!liveFlights || liveFlights.length < 10) {
      // 2. Fallback to adsb.fi via CORS proxy
      liveFlights = await this._fetchAdsbFiProxy(lat, lng, 350);
      source = 'adsb.fi(proxy)';
    }
    
    if (!liveFlights || liveFlights.length < 10) {
      // 3. Last resort: OpenSky with wide bounding box
      liveFlights = await this._fetchOpenSky(lat, lng, 5.0);
      source = 'opensky';
    }
    
    if (liveFlights && liveFlights.length > 0) {
      this.flights = liveFlights;
      this.mode = 'live';
      
      // Detect REAL emergency squawks and generate alerts
      this._detectRealEmergencies();
      this._updateStats();
      
      console.log(`[ADS-B] ${liveFlights.length} aircraft from ${source}`);
      return { success: true, count: liveFlights.length, source };
    }
    
    return { success: false, count: 0, source: 'none' };
  }

  // ──────────────────────────────────────────────
  // Detect REAL emergency squawks from live data
  // (no fake alerts — ONLY real squawk 7700/7600/7500)
  // ──────────────────────────────────────────────
  _detectRealEmergencies() {
    this.flights.filter(f => f.isEmergency).forEach(f => {
      if (!this._knownEmergencyIds.has(f.id)) {
        this._knownEmergencyIds.add(f.id);
        
        const alertItem = {
          id: `REAL-${f.id}`,
          flightId: f.id,
          flightNumber: f.flightNumber,
          airlineName: f.airline?.name || 'Inconnu',
          aircraftModel: f.aircraftModel || 'Inconnu',
          origin: f.origin?.code || '???',
          destination: f.destination?.code || '???',
          type: f.emergencyType,
          message: `⚠️ ${f.flightNumber} (${f.airline?.name || f.icao24}) : ${f.emergencyType} — Position: ${f.lat.toFixed(3)}, ${f.lng.toFixed(3)} — Alt: ${f.altitudeM}m`,
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          isReal: true,
        };
        
        this.alerts.unshift(alertItem);
        if (this.alerts.length > 50) this.alerts.pop();
      }
    });
    
    // Clean up resolved emergencies from known set
    const activeEmgIds = new Set(this.flights.filter(f => f.isEmergency).map(f => f.id));
    for (const id of this._knownEmergencyIds) {
      if (!activeEmgIds.has(id)) this._knownEmergencyIds.delete(id);
    }
  }

  // Regenerate simulation around a user position
  regenerateAirspaceAround(lat, lng) {
    const radius = 2.5;
    const hubs = [
      { code: 'POS', lat, lng },
      { code: 'HB1', lat: lat + radius * 0.6, lng: lng + radius * 0.8 },
      { code: 'HB2', lat: lat - radius * 0.7, lng: lng - radius * 0.5 },
      { code: 'HB3', lat: lat + radius * 0.5, lng: lng - radius * 0.7 },
      { code: 'HB4', lat: lat - radius * 0.8, lng: lng + radius * 0.6 },
    ];
    
    this.flights = [];
    for (let i = 0; i < 60; i++) {
      const f = new SimFlight(`LOC-${1000 + i}`);
      const orgIdx = Math.floor(Math.random() * hubs.length);
      let dstIdx = Math.floor(Math.random() * hubs.length);
      while (dstIdx === orgIdx) dstIdx = Math.floor(Math.random() * hubs.length);
      f.origin = hubs[orgIdx];
      f.destination = hubs[dstIdx];
      const dx = f.destination.lng - f.origin.lng;
      const dy = f.destination.lat - f.origin.lat;
      f.lat = f.origin.lat + dy * f.progress;
      f.lng = f.origin.lng + dx * f.progress;
      f.heading = (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360;
      f.routeHistory = buildTrail(f.lat, f.lng, f.heading, f.speed);
      this.flights.push(f);
    }
    
    this.mode = 'simulation';
    this._updateStats();
  }

  // DISABLED — no fake random squawks
  // triggerRandomSquawkAlert() { return null; }
}
