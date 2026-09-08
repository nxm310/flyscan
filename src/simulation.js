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

// Tactical Category Filter matcher
export function checkFlightFilterMatch(f, filterCategory) {
  if (!filterCategory || filterCategory === 'all') return true;
  if (filterCategory === 'civil') return f.category === 'CIVIL';
  if (filterCategory === 'military') return f.category === 'MILITARY' || isMilitaryFlight(f);
  if (filterCategory === 'private') return f.category === 'PRIVATE';
  if (filterCategory === 'heavy') return isHeavyAircraft(f);
  if (filterCategory === 'heli') return isHelicopter(f);
  if (filterCategory === 'vip') return isVipFlight(f);
  return true;
}

function isHeavyAircraft(f) {
  const model = ((f.aircraftModel || '') + ' ' + (f.t || '') + ' ' + (f.desc || '')).toUpperCase();
  const heavyCodes = [
    'A388', 'A380', 'B744', 'B748', 'B747', 'B77W', 'B772', 'B773', 'B777', 'B77L',
    'A359', 'A35K', 'A350', 'A343', 'A345', 'A346', 'A332', 'A333', 'A339', 'A338', 'A330',
    'A3ST', 'A337', 'BELUGA', 'A124', 'AN124', 'A225', 'AN225', 'C17', 'B788', 'B789', 'B78X', '787',
    'MD11', 'DC10', 'KC46', 'IL76', 'IL96'
  ];
  return heavyCodes.some(code => model.includes(code));
}

function isHelicopter(f) {
  const model = ((f.aircraftModel || '') + ' ' + (f.t || '') + ' ' + (f.desc || '')).toUpperCase();
  const callsign = ((f.flightNumber || '') + ' ' + (f.callsign || '')).toUpperCase();
  const heliCodes = [
    'H125', 'H130', 'H135', 'H145', 'H155', 'H160', 'H175', 'H225', 'EC35', 'EC45', 'EC25', 'EC20',
    'AS50', 'AS55', 'AS32', 'AS350', 'AS355', 'AS365', 'EC130', 'EC135', 'EC145', 'EC155', 'EC225', 'EC725',
    'SA330', 'SA341', 'SA342', 'B06', 'B206', 'B407', 'B412', 'B429', 'R44', 'R66', 'S76', 'S92',
    'AW139', 'AW109', 'A109', 'A119', 'A169', 'NH90', 'TIGR', 'CABR', 'G2CA', 'BELL', 'PUMA'
  ];
  const heliCallsigns = [
    'SAMU', 'DRAGON', 'DRGN', 'F-ZB', 'GEND', 'SECURITE CIVILE', 'RESCUE', 'LIFELIGHT',
    'HELI', 'MEDIC', 'POLICE', 'SAR'
  ];
  return heliCodes.some(c => model.includes(c)) || heliCallsigns.some(cs => callsign.includes(cs));
}

function isMilitaryFlight(f) {
  const model = ((f.aircraftModel || '') + ' ' + (f.t || '') + ' ' + (f.desc || '')).toUpperCase();
  const callsign = ((f.flightNumber || '') + ' ' + (f.callsign || '')).toUpperCase();
  const milCodes = [
    'RFAL', 'RAFALE', 'M2000', 'MIR2', 'EUFI', 'TYPHOON', 'TYPH', 'F16', 'F18', 'F35', 'F22',
    'A400', 'A400M', 'C130', 'C30J', 'C17', 'C27J', 'C295', 'CN35', 'KC30', 'KC46', 'E3TF', 'E3CF',
    'C135', 'MRTT', 'A332MRTT', 'TORN', 'GR4', 'HAWK', 'ALPHA', 'ALPH', 'PC21', 'L39', 'M346', 'ATL2'
  ];
  const milCallsigns = [
    'CTM', 'FAF', 'FNY', 'BAF', 'GAF', 'AME', 'IAM', 'RFR', 'RRR', 'NATO', 'FORTE', 'HOMER',
    'JAKE', 'VALK', 'VIPER', 'EAGLE', 'HAWK', 'TOPGUN', 'REACH', 'ASCOT', 'LAGR', 'SWORD', 'DAGGER', 'TITAN'
  ];
  return milCodes.some(c => model.includes(c)) || milCallsigns.some(cs => callsign.includes(cs));
}

function isVipFlight(f) {
  const callsign = ((f.flightNumber || '') + ' ' + (f.callsign || '')).toUpperCase();
  const model = ((f.aircraftModel || '') + ' ' + (f.t || '') + ' ' + (f.desc || '')).toUpperCase();
  const vipKeywords = ['COTAM', 'CTM0001', 'CTM01', 'AFO', 'AIR FORCE ONE', 'EXEC', 'VIP', 'REPUBLIQUE', 'GOVERNMENT', 'STATE', 'F-RA'];
  const bizJets = ['FA7X', 'FA8X', 'F900', 'FA50', 'GLF6', 'GL5T', 'GL6T', 'GLEX', 'G650', 'CL60', 'CL35', 'C700', 'C680', 'PC24'];
  return vipKeywords.some(kw => callsign.includes(kw)) || bizJets.some(bj => model.includes(bj)) || (f.category === 'PRIVATE' && (callsign.startsWith('CTM') || callsign.includes('VIP')));
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
  HOP: { code: 'A5', name: 'Air France HOP', country: 'France' },
  TVF: { code: 'TO', name: 'Transavia France', country: 'France' },
  TRA: { code: 'HV', name: 'Transavia', country: 'Pays-Bas' },
  EJU: { code: 'EC', name: 'EasyJet Europe', country: 'Autriche' },
  EZS: { code: 'DS', name: 'EasyJet Switzerland', country: 'Suisse' },
  RYS: { code: 'RR', name: 'Ryanair Sun / Buzz', country: 'Pologne' },
  MAY: { code: 'BF', name: 'French Bee', country: 'France' },
  CRL: { code: 'SS', name: 'Corsair International', country: 'France' },
  FPO: { code: '5O', name: 'ASL Airlines France', country: 'France' },
  VOE: { code: 'V7', name: 'Volotea', country: 'Espagne' },
  WUK: { code: 'W9', name: 'Wizz Air UK', country: 'Royaume-Uni' },
  EWG: { code: 'EW', name: 'Eurowings', country: 'Allemagne' },
  SHT: { code: 'BA', name: 'BA Shuttle', country: 'Royaume-Uni' },
  SWR: { code: 'LX', name: 'Swiss International', country: 'Suisse' },
  AUA: { code: 'OS', name: 'Austrian Airlines', country: 'Autriche' },
  IBS: { code: 'I2', name: 'Iberia Express', country: 'Espagne' },
  ANE: { code: 'YW', name: 'Air Nostrum', country: 'Espagne' },
  ITY: { code: 'AZ', name: 'ITA Airways', country: 'Italie' },
  LOT: { code: 'LO', name: 'LOT Polish Airlines', country: 'Pologne' },
  PGT: { code: 'PC', name: 'Pegasus Airlines', country: 'Turquie' },
  ETD: { code: 'EY', name: 'Etihad Airways', country: 'Émirats Arabes Unis' },
  ACA: { code: 'AC', name: 'Air Canada', country: 'Canada' },
  BCS: { code: 'QY', name: 'European Air Transport', country: 'Allemagne' },
  SAMU: { code: 'SMU', name: 'SAMU Secours Médical Urgent', country: 'France' },
  DRAGON: { code: 'DRG', name: 'Sécurité Civile (Dragon)', country: 'France' },
  GEND: { code: 'GND', name: 'Gendarmerie Nationale', country: 'France' },
  GAF: { code: 'GAF', name: 'German Air Force', country: 'Allemagne' },
  COTAM: { code: 'FAF', name: 'Armée de l\'Air & République Française', country: 'France' },
  CTM: { code: 'FAF', name: 'Commandement du Transport Aérien Militaire', country: 'France' },
  FAF: { code: 'FAF', name: 'Armée de l\'Air et de l\'Espace', country: 'France' },
  FNY: { code: 'FNY', name: 'Marine Nationale', country: 'France' },
  BAF: { code: 'BAF', name: 'Belgian Air Force', country: 'Belgique' },
  AME: { code: 'AME', name: 'Ejército del Aire', country: 'Espagne' },
  IAM: { code: 'IAM', name: 'Aeronautica Militare', country: 'Italie' },
  REACH: { code: 'USAF', name: 'United States Air Force', country: 'États-Unis' },
  ASCOT: { code: 'RAF', name: 'Royal Air Force', country: 'Royaume-Uni' },
  RRR: { code: 'RAF', name: 'Royal Air Force Transport', country: 'Royaume-Uni' },
  NATO: { code: 'NATO', name: 'OTAN Allied Command', country: 'International' },
};

// Military callsign prefixes
const MILITARY_PREFIXES = [
  'COTAM', 'CTM', 'FAF', 'FNY', 'BAF', 'GAF', 'AME', 'IAM', 'REACH', 'ASCOT',
  'RRR', 'NATO', 'USAF', 'FRCH', 'LAGR', 'TOPGUN', 'VIPER', 'EAGLE', 'GHOST',
  'HAWK', 'JOLLY', 'KNIFE', 'SWORD', 'SABER', 'LANCE', 'ARROW', 'DAGGER',
  'FORGE', 'STEEL', 'IRON', 'GIANT', 'TITAN', 'M2K', 'FORTE', 'HOMER'
];

// ============================================================
// 2. COMPREHENSIVE WORLD AIRPORTS DATABASE (300+ airports)
// ============================================================
export const AIRPORTS = {
  // === FRANCE ===
  CDG: { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France', lat: 49.0097, lng: 2.5479, iata: 'CDG', rwyHdg: 267, windDir: 210, windSpeed: 14, temp: 17, delayIndex: 1.2 },
  ORY: { code: 'ORY', name: 'Paris Orly', city: 'Paris', country: 'France', lat: 48.7233, lng: 2.3794, iata: 'ORY', rwyHdg: 250, windDir: 190, windSpeed: 12, temp: 17, delayIndex: 0.8 },
  LBG: { code: 'LBG', name: 'Paris-Le Bourget', city: 'Paris', country: 'France', lat: 48.9694, lng: 2.4414, iata: 'LBG', rwyHdg: 245, windDir: 210, windSpeed: 12, temp: 17, delayIndex: 0.5 },
  BVA: { code: 'BVA', name: 'Beauvais-Tillé', city: 'Beauvais', country: 'France', lat: 49.4544, lng: 2.1128, iata: 'BVA', rwyHdg: 220, windDir: 220, windSpeed: 14, temp: 16, delayIndex: 0.9 },
  LFPL: { code: 'LFPL', name: 'Lognes-Émerainville', city: 'Lognes', country: 'France', lat: 48.8222, lng: 2.6225, iata: 'LFPL', rwyHdg: 260, windDir: 210, windSpeed: 10, temp: 17, delayIndex: 0.1 },
  LFPE: { code: 'LFPE', name: 'Meaux-Esbly', city: 'Meaux', country: 'France', lat: 48.9242, lng: 2.8417, iata: 'LFPE', rwyHdg: 250, windDir: 210, windSpeed: 10, temp: 17, delayIndex: 0.1 },
  LFPK: { code: 'LFPK', name: 'Coulommiers-Voisins', city: 'Coulommiers', country: 'France', lat: 48.8353, lng: 3.0150, iata: 'LFPK', rwyHdg: 270, windDir: 210, windSpeed: 10, temp: 17, delayIndex: 0.1 },
  LFPM: { code: 'LFPM', name: 'Melun-Villaroche', city: 'Melun', country: 'France', lat: 48.6053, lng: 2.6719, iata: 'LFPM', rwyHdg: 280, windDir: 200, windSpeed: 10, temp: 17, delayIndex: 0.1 },
  LFPN: { code: 'LFPN', name: 'Toussus-le-Noble', city: 'Versailles', country: 'France', lat: 48.7500, lng: 2.1069, iata: 'LFPN', rwyHdg: 250, windDir: 210, windSpeed: 11, temp: 17, delayIndex: 0.2 },
  LFPT: { code: 'LFPT', name: 'Pontoise-Cormeilles', city: 'Pontoise', country: 'France', lat: 49.0964, lng: 2.0408, iata: 'LFPT', rwyHdg: 230, windDir: 220, windSpeed: 12, temp: 16, delayIndex: 0.2 },
  NCE: { code: 'NCE', name: 'Nice Côte d\'Azur', city: 'Nice', country: 'France', lat: 43.6653, lng: 7.2150, iata: 'NCE', rwyHdg: 224, windDir: 180, windSpeed: 8, temp: 22, delayIndex: 0.5 },
  MRS: { code: 'MRS', name: 'Marseille Provence', city: 'Marseille', country: 'France', lat: 43.4367, lng: 5.2150, iata: 'MRS', rwyHdg: 314, windDir: 320, windSpeed: 20, temp: 21, delayIndex: 0.4 },
  LYS: { code: 'LYS', name: 'Saint-Exupéry', city: 'Lyon', country: 'France', lat: 45.7264, lng: 5.0900, iata: 'LYS', rwyHdg: 355, windDir: 270, windSpeed: 10, temp: 19, delayIndex: 0.6 },
  TLS: { code: 'TLS', name: 'Toulouse-Blagnac', city: 'Toulouse', country: 'France', lat: 43.6291, lng: 1.3638, iata: 'TLS', rwyHdg: 322, windDir: 230, windSpeed: 11, temp: 20, delayIndex: 0.3 },
  BOD: { code: 'BOD', name: 'Bordeaux-Mérignac', city: 'Bordeaux', country: 'France', lat: 44.8283, lng: -0.7156, iata: 'BOD', rwyHdg: 232, windDir: 250, windSpeed: 14, temp: 18, delayIndex: 0.4 },
  NTE: { code: 'NTE', name: 'Nantes Atlantique', city: 'Nantes', country: 'France', lat: 47.1532, lng: -1.6111, iata: 'NTE', rwyHdg: 211, windDir: 240, windSpeed: 16, temp: 16, delayIndex: 0.5 },
  BIA: { code: 'BIA', name: 'Bastia Poretta', city: 'Bastia', country: 'Corse', lat: 42.5527, lng: 9.4835, iata: 'BIA', rwyHdg: 160, windDir: 200, windSpeed: 9, temp: 24, delayIndex: 0.3 },
  AJA: { code: 'AJA', name: 'Ajaccio Napoléon Bonaparte', city: 'Ajaccio', country: 'Corse', lat: 41.9236, lng: 8.8029, iata: 'AJA', rwyHdg: 200, windDir: 180, windSpeed: 8, temp: 24, delayIndex: 0.2 },
  CLY: { code: 'CLY', name: 'Calvi Sainte-Catherine', city: 'Calvi', country: 'Corse', lat: 42.5206, lng: 8.7931, iata: 'CLY', rwyHdg: 180, windDir: 190, windSpeed: 8, temp: 24, delayIndex: 0.2 },
  FSC: { code: 'FSC', name: 'Figari Sud-Corse', city: 'Figari', country: 'Corse', lat: 41.5006, lng: 9.0978, iata: 'FSC', rwyHdg: 230, windDir: 220, windSpeed: 10, temp: 25, delayIndex: 0.2 },
  SXB: { code: 'SXB', name: 'Strasbourg', city: 'Strasbourg', country: 'France', lat: 48.5383, lng: 7.6280, iata: 'SXB', rwyHdg: 230, windDir: 260, windSpeed: 9, temp: 15, delayIndex: 0.3 },
  BES: { code: 'BES', name: 'Brest Bretagne', city: 'Brest', country: 'France', lat: 48.4478, lng: -4.4222, iata: 'BES', rwyHdg: 260, windDir: 250, windSpeed: 18, temp: 15, delayIndex: 0.3 },
  RNS: { code: 'RNS', name: 'Rennes Bretagne', city: 'Rennes', country: 'France', lat: 48.0719, lng: -1.7322, iata: 'RNS', rwyHdg: 280, windDir: 240, windSpeed: 15, temp: 16, delayIndex: 0.3 },
  BIQ: { code: 'BIQ', name: 'Biarritz Pays Basque', city: 'Biarritz', country: 'France', lat: 43.4683, lng: -1.5311, iata: 'BIQ', rwyHdg: 270, windDir: 260, windSpeed: 12, temp: 19, delayIndex: 0.3 },
  MPL: { code: 'MPL', name: 'Montpellier Méditerranée', city: 'Montpellier', country: 'France', lat: 43.5764, lng: 3.9631, iata: 'MPL', rwyHdg: 305, windDir: 320, windSpeed: 16, temp: 22, delayIndex: 0.4 },
  PGF: { code: 'PGF', name: 'Perpignan Rivesaltes', city: 'Perpignan', country: 'France', lat: 42.7408, lng: 2.8706, iata: 'PGF', rwyHdg: 330, windDir: 320, windSpeed: 18, temp: 23, delayIndex: 0.3 },
  TLN: { code: 'TLN', name: 'Toulon-Hyères', city: 'Toulon', country: 'France', lat: 43.0972, lng: 6.1461, iata: 'TLN', rwyHdg: 230, windDir: 240, windSpeed: 14, temp: 22, delayIndex: 0.3 },
  LIL: { code: 'LIL', name: 'Lille-Lesquin', city: 'Lille', country: 'France', lat: 50.5619, lng: 3.0894, iata: 'LIL', rwyHdg: 260, windDir: 230, windSpeed: 15, temp: 15, delayIndex: 0.4 },
  PUF: { code: 'PUF', name: 'Pau Pyrénées', city: 'Pau', country: 'France', lat: 43.3800, lng: -0.4186, iata: 'PUF', rwyHdg: 310, windDir: 270, windSpeed: 10, temp: 18, delayIndex: 0.2 },
  LDE: { code: 'LDE', name: 'Tarbes-Lourdes-Pyrénées', city: 'Tarbes', country: 'France', lat: 43.1789, lng: -0.0064, iata: 'LDE', rwyHdg: 200, windDir: 220, windSpeed: 9, temp: 17, delayIndex: 0.2 },
  FDF: { code: 'FDF', name: 'Martinique Aimé Césaire', city: 'Fort-de-France', country: 'Martinique', lat: 14.5911, lng: -61.0031, iata: 'FDF', rwyHdg: 100, windDir: 90, windSpeed: 15, temp: 29, delayIndex: 0.8 },
  PTP: { code: 'PTP', name: 'Pointe-à-Pitre Le Raizet', city: 'Pointe-à-Pitre', country: 'Guadeloupe', lat: 16.2653, lng: -61.5317, iata: 'PTP', rwyHdg: 120, windDir: 90, windSpeed: 14, temp: 29, delayIndex: 0.7 },
  RUN: { code: 'RUN', name: 'Roland Garros', city: 'Saint-Denis', country: 'La Réunion', lat: -20.8872, lng: 55.5103, iata: 'RUN', rwyHdg: 140, windDir: 120, windSpeed: 16, temp: 26, delayIndex: 0.8 },
  DUB: { code: 'DUB', name: 'Dublin Airport', city: 'Dublin', country: 'Irlande', lat: 53.4213, lng: -6.2701, iata: 'DUB', rwyHdg: 280, windDir: 240, windSpeed: 18, temp: 13, delayIndex: 1.6 },
  ORK: { code: 'ORK', name: 'Cork Airport', city: 'Cork', country: 'Irlande', lat: 51.8413, lng: -8.4911, iata: 'ORK', rwyHdg: 250, windDir: 230, windSpeed: 16, temp: 12, delayIndex: 1.1 },
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
  AGP: { code: 'AGP', name: 'Málaga-Costa del Sol', city: 'Malaga', country: 'Espagne', lat: 36.6749, lng: -4.4991, iata: 'AGP', windDir: 180, windSpeed: 10, temp: 25, delayIndex: 1.0 },
  IBZ: { code: 'IBZ', name: 'Ibiza Airport', city: 'Ibiza', country: 'Espagne', lat: 38.8729, lng: 1.3731, iata: 'IBZ', windDir: 200, windSpeed: 10, temp: 25, delayIndex: 0.9 },
  ALC: { code: 'ALC', name: 'Alicante-Elche', city: 'Alicante', country: 'Espagne', lat: 38.2822, lng: -0.5582, iata: 'ALC', windDir: 190, windSpeed: 9, temp: 24, delayIndex: 0.9 },
  SVQ: { code: 'SVQ', name: 'Seville Airport', city: 'Séville', country: 'Espagne', lat: 37.4180, lng: -5.8931, iata: 'SVQ', windDir: 220, windSpeed: 11, temp: 27, delayIndex: 0.8 },
  BIO: { code: 'BIO', name: 'Bilbao Airport', city: 'Bilbao', country: 'Espagne', lat: 43.3011, lng: -2.9106, iata: 'BIO', windDir: 250, windSpeed: 12, temp: 18, delayIndex: 0.7 },
  TFS: { code: 'TFS', name: 'Tenerife Sur', city: 'Tenerife', country: 'Espagne', lat: 28.0445, lng: -16.5725, iata: 'TFS', windDir: 60, windSpeed: 14, temp: 26, delayIndex: 1.1 },
  LPA: { code: 'LPA', name: 'Gran Canaria', city: 'Las Palmas', country: 'Espagne', lat: 27.9319, lng: -15.3866, iata: 'LPA', windDir: 50, windSpeed: 15, temp: 25, delayIndex: 1.0 },
  FAO: { code: 'FAO', name: 'Faro Airport', city: 'Faro', country: 'Portugal', lat: 37.0144, lng: -7.9659, iata: 'FAO', windDir: 230, windSpeed: 12, temp: 22, delayIndex: 0.9 },
  FNC: { code: 'FNC', name: 'Madeira Cristiano Ronaldo', city: 'Funchal', country: 'Portugal', lat: 32.6979, lng: -16.7744, iata: 'FNC', windDir: 40, windSpeed: 18, temp: 22, delayIndex: 1.5 },
  FCO: { code: 'FCO', name: 'Leonardo da Vinci', city: 'Rome', country: 'Italie', lat: 41.8003, lng: 12.2389, iata: 'FCO', windDir: 210, windSpeed: 9, temp: 22, delayIndex: 2.2 },
  MXP: { code: 'MXP', name: 'Milan Malpensa', city: 'Milan', country: 'Italie', lat: 45.6306, lng: 8.7281, iata: 'MXP', windDir: 250, windSpeed: 8, temp: 18, delayIndex: 1.8 },
  BLQ: { code: 'BLQ', name: 'Bologna Guglielmo Marconi', city: 'Bologne', country: 'Italie', lat: 44.5354, lng: 11.2887, iata: 'BLQ', windDir: 240, windSpeed: 8, temp: 19, delayIndex: 1.1 },
  VCE: { code: 'VCE', name: 'Venice Marco Polo', city: 'Venise', country: 'Italie', lat: 45.5053, lng: 12.3519, iata: 'VCE', windDir: 230, windSpeed: 7, temp: 18, delayIndex: 1.2 },
  NAP: { code: 'NAP', name: 'Naples Capodichino', city: 'Naples', country: 'Italie', lat: 40.8860, lng: 14.2908, iata: 'NAP', windDir: 200, windSpeed: 8, temp: 24, delayIndex: 1.0 },
  CTA: { code: 'CTA', name: 'Catania Fontanarossa', city: 'Catane', country: 'Italie', lat: 37.4668, lng: 15.0664, iata: 'CTA', windDir: 190, windSpeed: 9, temp: 25, delayIndex: 1.2 },
  PMO: { code: 'PMO', name: 'Palermo Falcone Borsellino', city: 'Palerme', country: 'Italie', lat: 38.1760, lng: 13.0910, iata: 'PMO', windDir: 210, windSpeed: 10, temp: 24, delayIndex: 1.0 },
  ATH: { code: 'ATH', name: 'Eleftherios Venizelos', city: 'Athènes', country: 'Grèce', lat: 37.9364, lng: 23.9445, iata: 'ATH', windDir: 160, windSpeed: 10, temp: 26, delayIndex: 1.6 },
  HER: { code: 'HER', name: 'Heraklion Nikos Kazantzakis', city: 'Héraklion', country: 'Grèce', lat: 35.3397, lng: 25.1803, iata: 'HER', windDir: 320, windSpeed: 15, temp: 27, delayIndex: 1.3 },
  RHO: { code: 'RHO', name: 'Rhodes Diagoras', city: 'Rhodes', country: 'Grèce', lat: 36.4054, lng: 28.0862, iata: 'RHO', windDir: 300, windSpeed: 14, temp: 27, delayIndex: 1.1 },
  CFU: { code: 'CFU', name: 'Corfu Ioannis Kapodistrias', city: 'Corfou', country: 'Grèce', lat: 39.6019, lng: 19.9117, iata: 'CFU', windDir: 220, windSpeed: 9, temp: 25, delayIndex: 1.0 },
  LIS: { code: 'LIS', name: 'Humberto Delgado', city: 'Lisbonne', country: 'Portugal', lat: 38.7813, lng: -9.1359, iata: 'LIS', windDir: 220, windSpeed: 14, temp: 21, delayIndex: 1.4 },
  OPO: { code: 'OPO', name: 'Francisco de Sá Carneiro', city: 'Porto', country: 'Portugal', lat: 41.2481, lng: -8.6814, iata: 'OPO', windDir: 230, windSpeed: 16, temp: 19, delayIndex: 0.9 },
  RAK: { code: 'RAK', name: 'Marrakech Menara', city: 'Marrakech', country: 'Maroc', lat: 31.6069, lng: -8.0363, iata: 'RAK', windDir: 260, windSpeed: 10, temp: 28, delayIndex: 1.2 },
  AGA: { code: 'AGA', name: 'Agadir Al Massira', city: 'Agadir', country: 'Maroc', lat: 30.3250, lng: -9.4131, iata: 'AGA', windDir: 270, windSpeed: 12, temp: 25, delayIndex: 0.9 },
  FEZ: { code: 'FEZ', name: 'Fès-Saïss', city: 'Fès', country: 'Maroc', lat: 33.9273, lng: -4.9778, iata: 'FEZ', windDir: 250, windSpeed: 11, temp: 27, delayIndex: 0.8 },
  TNG: { code: 'TNG', name: 'Tangier Ibn Battouta', city: 'Tanger', country: 'Maroc', lat: 35.7269, lng: -5.9169, iata: 'TNG', windDir: 260, windSpeed: 15, temp: 23, delayIndex: 0.9 },
  DJE: { code: 'DJE', name: 'Djerba-Zarzis', city: 'Djerba', country: 'Tunisie', lat: 33.8750, lng: 10.7755, iata: 'DJE', windDir: 120, windSpeed: 12, temp: 28, delayIndex: 0.8 },
  AYT: { code: 'AYT', name: 'Antalya Airport', city: 'Antalya', country: 'Turquie', lat: 36.8987, lng: 30.8005, iata: 'AYT', windDir: 180, windSpeed: 9, temp: 29, delayIndex: 1.4 },
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

// ============================================================
// ICAO 4-letter to IATA / Airport mapping
// ============================================================
export const ICAO_TO_IATA = {
  LFPG: 'CDG', LFPO: 'ORY', LFMN: 'NCE', LFML: 'MRS', LFLL: 'LYS', LFBO: 'TLS', LFBD: 'BOD', LFRS: 'NTE',
  LFKB: 'BIA', LFKJ: 'AJA', LFST: 'SXB', LFQQ: 'LIL', LFRB: 'BES', LFRN: 'RNS', LFBZ: 'BIQ', LFMV: 'AVN',
  LFMD: 'NCE', LFPB: 'CDG', LFPM: 'CDG', LFPN: 'CDG',
  EGLL: 'LHR', EGKK: 'LGW', EGSS: 'STN', EGCC: 'MAN', EGPH: 'EDI', EGGW: 'LTN', EGBB: 'BHX',
  EDDF: 'FRA', EDDM: 'MUC', EDDB: 'BER', EDDL: 'DUS', EDDH: 'HAM', EDDK: 'CGN', EDDS: 'STR',
  EHAM: 'AMS', EBBR: 'BRU', LSGG: 'GVA', LSZH: 'ZRH',
  LEMD: 'MAD', LEBL: 'BCN', LEVC: 'VLC', LEPA: 'PMI', LEMG: 'AGP', LEIB: 'IBZ', LEAL: 'ALC', LEZL: 'SVQ', LEBB: 'BIO',
  GCTS: 'TFS', GCLP: 'LPA', LPFR: 'FAO', LPMA: 'FNC',
  LIRF: 'FCO', LIMC: 'MXP', LIPZ: 'VCE', LIRN: 'NAP', LIPE: 'BLQ', LICC: 'CTA', LICJ: 'PMO',
  LGAV: 'ATH', LGIR: 'HER', LGRP: 'RHO', LGKR: 'CFU',
  LPPT: 'LIS', LPPR: 'OPO', LOWW: 'VIE', LKPR: 'PRG', EPWA: 'WAW', LHBP: 'BUD',
  EKCH: 'CPH', ENGM: 'OSL', ESSA: 'ARN', EFHK: 'HEL', UUEE: 'SVO', LTFM: 'IST', LTBA: 'IST', LTAI: 'AYT',
  EIDW: 'DUB', EICK: 'ORK',
  TFFF: 'FDF', TFFR: 'PTP', FMEE: 'RUN',
  GMMX: 'RAK', GMAD: 'AGA', GMFF: 'FEZ', GMTT: 'TNG', DTTJ: 'DJE',
  OMDB: 'DXB', OMAA: 'AUH', OTHH: 'DOH', OKBK: 'KWI', OBBI: 'BAH', LLBG: 'TLV', OJAI: 'AMM', OLBA: 'BEY',
  OIIE: 'THR', OPKC: 'KHI', VIDP: 'DEL', VABB: 'BOM', VOBL: 'BLR', VOMM: 'MAA',
  RJTT: 'HND', RJAA: 'NRT', RJBB: 'KIX', RKSI: 'ICN', ZBAA: 'PEK', ZSPD: 'PVG', VHHH: 'HKG',
  WSSS: 'SIN', WMKK: 'KUL', VTBS: 'BKK', WIII: 'CGK', RPLL: 'MNL',
  KJFK: 'JFK', KEWR: 'EWR', KLGA: 'LGA', KLAX: 'LAX', KORD: 'ORD', KATL: 'ATL', KDFW: 'DFW', KDEN: 'DEN',
  KMIA: 'MIA', KSFO: 'SFO', KSEA: 'SEA', KBOS: 'BOS', CYYZ: 'YYZ', CYUL: 'YUL', CYVR: 'YVR', MMMX: 'MEX',
  SBGR: 'GRU', SBGL: 'GIG', SAEZ: 'EZE', SCEL: 'SCL', SKBO: 'BOG', SPJC: 'LIM',
  HECA: 'CAI', GMMN: 'CMN', DAAG: 'ALG', DTTA: 'TUN', FAOR: 'JNB', HKJK: 'NBO', HAAB: 'ADD', DGAA: 'ACC', DNMM: 'LOS',
  YSSY: 'SYD', YMML: 'MEL', YBBN: 'BNE', NZAA: 'AKL'
};

export function resolveAirport(code) {
  if (!code || code === '???' || code === 'N/A') {
    return { code: 'N/A', name: 'Non renseigné', city: 'Vol local / VFR', country: '' };
  }
  const clean = code.trim().toUpperCase();
  if (AIRPORTS[clean]) return AIRPORTS[clean];
  const iata = ICAO_TO_IATA[clean];
  if (iata && AIRPORTS[iata]) return AIRPORTS[iata];
  
  let country = '';
  if (clean.startsWith('LF')) country = 'France';
  else if (clean.startsWith('EG')) country = 'Royaume-Uni';
  else if (clean.startsWith('ED') || clean.startsWith('ET')) country = 'Allemagne';
  else if (clean.startsWith('LE')) country = 'Espagne';
  else if (clean.startsWith('LI')) country = 'Italie';
  else if (clean.startsWith('LP')) country = 'Portugal';
  else if (clean.startsWith('LS')) country = 'Suisse';
  else if (clean.startsWith('EB')) country = 'Belgique';
  else if (clean.startsWith('EH')) country = 'Pays-Bas';
  else if (clean.startsWith('LO')) country = 'Autriche';
  else if (clean.startsWith('EI')) country = 'Irlande';
  else if (clean.startsWith('GM')) country = 'Maroc';
  else if (clean.startsWith('DA')) country = 'Algérie';
  else if (clean.startsWith('DT')) country = 'Tunisie';
  else if (clean.startsWith('K')) country = 'États-Unis';
  else if (clean.startsWith('C')) country = 'Canada';
  else if (clean.startsWith('Y')) country = 'Australie';
  else if (clean.startsWith('Z')) country = 'Chine';
  else if (clean.startsWith('RJ')) country = 'Japon';

  return {
    code: clean,
    name: `Aéroport ${clean}`,
    city: clean,
    country: country
  };
}

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
    
    // Origin / Destination: prioritize real flight plan departure/arrival
    if (raw.origin && raw.origin.name) {
      this.origin = raw.origin;
    } else if (raw.departure && String(raw.departure).trim() !== '' && raw.departure !== '???') {
      this.origin = resolveAirport(raw.departure);
    } else {
      this.origin = { 
        code: 'N/A', 
        name: 'Origine non renseignée', 
        city: 'Vol local / VFR', 
        country: '' 
      };
    }

    if (raw.destination && raw.destination.name) {
      this.destination = raw.destination;
    } else if (raw.arrival && String(raw.arrival).trim() !== '' && raw.arrival !== '???') {
      this.destination = resolveAirport(raw.arrival);
    } else {
      this.destination = { 
        code: 'N/A', 
        name: 'Destination non renseignée', 
        city: 'Vol local / VFR', 
        country: '' 
      };
    }
    
    // Trail
    this.routeHistory = buildTrail(this.lat, this.lng, this.heading, this.speed);
    
    // Calculate distance in km and progress along route if both origin and destination have known coords
    const orgData = (this.origin.code !== 'N/A' && AIRPORTS[this.origin.code]) ? AIRPORTS[this.origin.code] : null;
    const dstData = (this.destination.code !== 'N/A' && AIRPORTS[this.destination.code]) ? AIRPORTS[this.destination.code] : null;

    if (orgData && dstData) {
      this.totalDistance = Math.round(getDistance(orgData.lat, orgData.lng, dstData.lat, dstData.lng));
      const distFromOrg = getDistance(orgData.lat, orgData.lng, this.lat, this.lng);
      const distToDst = getDistance(this.lat, this.lng, dstData.lat, dstData.lng);
      const sumDist = distFromOrg + distToDst;
      this.progress = sumDist > 0 ? Math.min(0.99, Math.max(0.01, distFromOrg / sumDist)) : 0.5;
    } else {
      this.totalDistance = null;
      this.progress = null;
    }
    
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
// 4. REAL LIVE AIRSPACE MANAGER (100% Physical Flights — Zero Simulation)
// Direct Telemetry: Flightradar24 & ADS-B Ground Transponders
// ============================================================

export const TacticalFlight = LiveFlight;
export const SimFlight = LiveFlight;

export class AirspaceSimulator {
  constructor() {
    this.flights = [];
    this.historicalLogs = [];
    this.alerts = [];
    this.activeSquawks = 0;
    this.mode = "live";
    this._knownEmergencyIds = new Set();
    this._liveFlightsMap = new Map();
    this._lastCenter = { lat: 48.85, lng: 2.35 };
    this._lastBounds = null;
    this._lastZoom = 9;
    this._lastFetchTime = 0;
    this._activeSource = "En attente du flux réel...";
  }

  initialize() {
    // Initial fetch of real flights over Paris / France
    this.fetchAndApplyLiveStates(48.85, 2.35, { south: 48.2, north: 49.5, west: 1.8, east: 3.6 });
  }

  // Viewport tracking (no synthetic flights generated)
  ensureViewportDensity(bounds, zoomLevel = 9) {
    if (!bounds) return;
    const south = typeof bounds.getSouth === "function" ? bounds.getSouth() : bounds.south;
    const north = typeof bounds.getNorth === "function" ? bounds.getNorth() : bounds.north;
    const west = typeof bounds.getWest === "function" ? bounds.getWest() : bounds.west;
    const east = typeof bounds.getEast === "function" ? bounds.getEast() : bounds.east;

    this._lastBounds = { south, north, west, east };
    this._lastZoom = zoomLevel;

    const centerLat = (south + north) / 2;
    const centerLng = (west + east) / 2;
    if (Date.now() - this._lastFetchTime > 8000) {
      this.fetchAndApplyLiveStates(centerLat, centerLng, this._lastBounds);
    }
  }

  // ──────────────────────────────────────────────
  // Source 1: Real Flightradar24 Live Feed
  // ──────────────────────────────────────────────
  async _fetchRealFlightradar24(bounds) {
    const s = bounds.south.toFixed(4);
    const n = bounds.north.toFixed(4);
    const w = bounds.west.toFixed(4);
    const e = bounds.east.toFixed(4);
    const boundsParam = n + "," + s + "," + w + "," + e;

function createTimeoutSignal(ms) {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => {
    try { controller.abort(); } catch (_) {}
  }, ms);
  return controller.signal;
}

    const candidateUrls = [
      "/api/live-flights?bounds=" + boundsParam,
      "./api/live-flights?bounds=" + boundsParam,
      "/api-fr24/zones/fcgi/feed.js?bounds=" + boundsParam + "&faa=1&satellite=1&mlat=1&flarm=1&adsb=1&gnd=0&air=1&vehicles=0&estimated=1&maxage=14400&gliders=0&stats=0",
      "https://data-cloud.flightradar24.com/zones/fcgi/feed.js?bounds=" + boundsParam + "&faa=1&satellite=1&mlat=1&flarm=1&adsb=1&gnd=0&air=1&vehicles=0&estimated=1&maxage=14400&gliders=0&stats=0"
    ];

    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, {
          signal: createTimeoutSignal(5000),
          headers: { "Accept": "application/json" }
        });
        if (!res.ok) continue;
        const json = await res.json();
        const data = json.data || json;

        const flights = [];
        for (const key in data) {
          if (key === "full_count" || key === "version" || key === "stats") continue;
          const arr = data[key];
          if (Array.isArray(arr) && arr.length >= 13) {
            const hex = arr[0];
            const lat = arr[1];
            const lng = arr[2];
            const heading = arr[3] || 0;
            const altFt = arr[4] || 0;
            const speed = arr[5] || 0;
            const squawk = String(arr[6] || "2000");
            const modelIcao = arr[8] || "Inconnu";
            const reg = arr[9] || "";
            const orgCode = arr[11] || "";
            const dstCode = arr[12] || "";
            const flightNo = arr[13] || arr[16] || hex;
            const vs = arr[15] || 0;
            const callsign = arr[16] || flightNo;
            const airlineIcao = arr[18] || callsign.slice(0, 3);

            flights.push(new LiveFlight({
              hex,
              flight: flightNo,
              callsign,
              r: reg,
              t: modelIcao,
              lat,
              lon: lng,
              alt_baro: altFt,
              gs: speed,
              track: heading,
              baro_rate: vs,
              squawk,
              departure: orgCode,
              arrival: dstCode,
              _source: "Flightradar24 Live"
            }));
          }
        }
        if (flights.length > 0) {
          return { flights, source: "Flightradar24 (Direct)" };
        }
      } catch (_) {}
    }
    return null;
  }

  // ──────────────────────────────────────────────
  // Source 2: Real ADS-B Transponder Feed (adsb.lol)
  // ──────────────────────────────────────────────
  async _fetchRealAdsb(lat, lng, distNm = 150) {
    const candidateUrls = [
      "/api/live-flights?lat=" + lat.toFixed(4) + "&lng=" + lng.toFixed(4) + "&dist=" + distNm,
      "./api/live-flights?lat=" + lat.toFixed(4) + "&lng=" + lng.toFixed(4) + "&dist=" + distNm,
      "/api-adsb/v2/lat=" + lat.toFixed(4) + "/lon/" + lng.toFixed(4) + "/dist/" + distNm,
      "https://api.adsb.lol/v2/lat/" + lat.toFixed(4) + "/lon/" + lng.toFixed(4) + "/dist/" + distNm
    ];

    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, { signal: createTimeoutSignal(5000) });
        if (!res.ok) continue;
        const json = await res.json();
        const data = json.data || json;
        const rawList = data.ac || data.aircraft || [];

        if (rawList.length > 0) {
          const flights = rawList
            .filter(ac => ac.lat != null && ac.lon != null && ac.alt_baro !== "ground")
            .map(ac => new LiveFlight({
              hex: ac.hex,
              flight: (ac.flight || "").trim() || ac.hex,
              r: ac.r,
              t: ac.t,
              desc: ac.desc,
              lat: ac.lat,
              lon: ac.lon,
              alt_baro: typeof ac.alt_baro === "number" ? ac.alt_baro : null,
              alt_geom: ac.alt_geom,
              gs: ac.gs,
              track: ac.track,
              baro_rate: ac.baro_rate,
              squawk: ac.squawk,
              seen: ac.seen,
              _source: "ADS-B Live"
            }));
          return { flights, source: "ADS-B Réseau Mondial" };
        }
      } catch (_) {}
    }
    return null;
  }

  // ──────────────────────────────────────────────
  // Main method: Fetch & Apply 100% Real Live Flights
  // ──────────────────────────────────────────────
  async fetchAndApplyLiveStates(lat = 48.85, lng = 2.35, customBounds = null) {
    this._lastFetchTime = Date.now();
    this._lastCenter = { lat, lng };

    const bounds = customBounds || this._lastBounds || {
      south: lat - 0.75,
      north: lat + 0.75,
      west: lng - 1.25,
      east: lng + 1.25
    };

    // 1. Query Real Flightradar24 first
    let result = await this._fetchRealFlightradar24(bounds);

    // 2. Query Real ADS-B if FR24 was empty
    if (!result || result.flights.length === 0) {
      result = await this._fetchRealAdsb(lat, lng, 160);
    }

    if (result && result.flights.length > 0) {
      this._activeSource = result.source;
      const seenIds = new Set();

      // Update flights in-place to ensure continuous smooth tracking
      result.flights.forEach(p => {
        seenIds.add(p.id);
        if (this._liveFlightsMap.has(p.id)) {
          const existing = this._liveFlightsMap.get(p.id);
          existing.lat = p.lat;
          existing.lng = p.lng;
          existing.altitude = p.altitude;
          existing.altitudeM = p.altitudeM;
          existing.speed = p.speed;
          existing.heading = p.heading;
          existing.verticalSpeed = p.verticalSpeed;
          existing.squawk = p.squawk;
          existing.isEmergency = p.isEmergency;
          existing.emergencyType = p.emergencyType;
          if (p.origin && p.origin.code !== "???") existing.origin = p.origin;
          if (p.destination && p.destination.code !== "???") existing.destination = p.destination;
          existing.lastContact = Date.now();

          if (p.lat && p.lng) {
            existing.routeHistory.push([p.lat, p.lng]);
            if (existing.routeHistory.length > 60) existing.routeHistory.shift();
          }
        } else {
          p.lastContact = Date.now();
          this._liveFlightsMap.set(p.id, p);
          this._logFlightHistory(p);
        }
      });

      // Remove stale flights not seen for > 45 seconds
      const now = Date.now();
      for (const [id, f] of this._liveFlightsMap.entries()) {
        if (!seenIds.has(id) && (now - (f.lastContact || 0) > 45000)) {
          this._liveFlightsMap.delete(id);
        }
      }

      this.flights = Array.from(this._liveFlightsMap.values());
      this._detectRealEmergencies();
      this._updateStats();

      return {
        success: true,
        count: this.flights.length,
        liveCount: this.flights.length,
        source: this._activeSource
      };
    }

    this.flights = Array.from(this._liveFlightsMap.values());
    this._updateStats();

    return {
      success: this.flights.length > 0,
      count: this.flights.length,
      liveCount: this.flights.length,
      source: "Attente signal transpondeur"
    };
  }

  // Dead-reckoning position update
  tick(dt = 1) {
    this.flights.forEach(f => {
      if (typeof f.tick === "function") {
        f.tick(dt);
      }
    });
  }

  _updateStats() {
    this.activeSquawks = this.flights.filter(f => f.isEmergency).length;
  }

  _logFlightHistory(f) {
    const entry = {
      id: f.id,
      flightNumber: f.flightNumber,
      airlineName: f.airline?.name || "Inconnu",
      aircraftModel: f.aircraftModel || "Inconnu",
      origin: f.origin?.code || "N/A",
      destination: f.destination?.code || "N/A",
      altitudeM: f.altitudeM || 0,
      speedKts: f.speed || 0,
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    };
    this.historicalLogs.unshift(entry);
    if (this.historicalLogs.length > 150) this.historicalLogs.pop();
  }

  _detectRealEmergencies() {
    this.flights.filter(f => f.isEmergency).forEach(f => {
      if (!this._knownEmergencyIds.has(f.id)) {
        this._knownEmergencyIds.add(f.id);
        const alertItem = {
          id: "REAL-" + f.id,
          flightId: f.id,
          flightNumber: f.flightNumber,
          airlineName: f.airline?.name || "Inconnu",
          aircraftModel: f.aircraftModel || "Inconnu",
          origin: f.origin?.code || "N/A",
          destination: f.destination?.code || "N/A",
          type: f.emergencyType,
          message: "⚠️ " + f.flightNumber + " (" + (f.airline?.name || f.icao24) + ") : " + f.emergencyType + " — Alt: " + f.altitudeM + "m",
          timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          isReal: true
        };
        this.alerts.unshift(alertItem);
        if (this.alerts.length > 50) this.alerts.pop();
      }
    });

    const activeIds = new Set(this.flights.filter(f => f.isEmergency).map(f => f.id));
    for (const id of this._knownEmergencyIds) {
      if (!activeIds.has(id)) this._knownEmergencyIds.delete(id);
    }
  }

  regenerateAirspaceAround(lat, lng) {
    this.fetchAndApplyLiveStates(lat, lng);
  }
}
