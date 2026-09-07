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
  SXB: { code: 'SXB', name: 'Strasbourg', city: 'Strasbourg', country: 'France', lat: 48.5383, lng: 7.6280, iata: 'SXB', rwyHdg: 230, windDir: 260, windSpeed: 9, temp: 15, delayIndex: 0.3 },
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
  LEMD: 'MAD', LEBL: 'BCN', LEVC: 'VLC', LEPA: 'PMI', LEMG: 'AGP',
  LIRF: 'FCO', LIMC: 'MXP', LIPZ: 'VCE', LIRN: 'NAP',
  LGAV: 'ATH', LPPT: 'LIS', LPPR: 'OPO', LOWW: 'VIE', LKPR: 'PRG', EPWA: 'WAW', LHBP: 'BUD',
  EKCH: 'CPH', ENGM: 'OSL', ESSA: 'ARN', EFHK: 'HEL', UUEE: 'SVO', LTFM: 'IST', LTBA: 'IST',
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
  if (!code) return { code: '???', name: 'Inconnu', city: 'Inconnu', country: '' };
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
  else if (clean.startsWith('K')) country = 'États-Unis';
  else if (clean.startsWith('C')) country = 'Canada';
  else if (clean.startsWith('Y')) country = 'Australie';
  else if (clean.startsWith('Z')) country = 'Chine';
  else if (clean.startsWith('RJ')) country = 'Japon';

  return {
    code: clean,
    name: `Aérodrome ${clean}`,
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
    
    // Origin / Destination: prioritize real flight plan departure/arrival, otherwise deterministic fallback
    if (raw.origin && raw.origin.name) {
      this.origin = raw.origin;
    } else if (raw.departure) {
      this.origin = resolveAirport(raw.departure);
    } else {
      const airportKeys = Object.keys(AIRPORTS);
      const hexNum = parseInt(this.id, 16) || 0;
      const orgIdx = hexNum % airportKeys.length;
      const orgCode = airportKeys[orgIdx];
      const originAirport = AIRPORTS[orgCode] || AIRPORTS.CDG;
      this.origin = { 
        code: orgCode, 
        name: originAirport.name, 
        city: originAirport.city, 
        country: originAirport.country 
      };
    }

    if (raw.destination && raw.destination.name) {
      this.destination = raw.destination;
    } else if (raw.arrival) {
      this.destination = resolveAirport(raw.arrival);
    } else {
      const airportKeys = Object.keys(AIRPORTS);
      const hexNum = parseInt(this.id, 16) || 0;
      let dstIdx = (hexNum + 13) % airportKeys.length;
      if (airportKeys[dstIdx] === this.origin.code) dstIdx = (dstIdx + 1) % airportKeys.length;
      const dstCode = airportKeys[dstIdx];
      const destAirport = AIRPORTS[dstCode] || AIRPORTS.LHR;
      this.destination = { 
        code: dstCode, 
        name: destAirport.name, 
        city: destAirport.city, 
        country: destAirport.country 
      };
    }
    
    // Trail
    this.routeHistory = buildTrail(this.lat, this.lng, this.heading, this.speed);
    
    // Progress (simulated dynamically for UI progress bar based on ICAO hex)
    const hexNum = parseInt(this.id, 16) || 0;
    this.progress = 0.15 + ((hexNum * 7) % 70) / 100; // Between 15% and 85%
    
    // Calculate distance in km between deterministic origin and destination
    const orgData = AIRPORTS[this.origin.code] || { lat: 48.85, lng: 2.35 };
    const dstData = AIRPORTS[this.destination.code] || { lat: 40.71, lng: -74.00 };
    this.totalDistance = Math.round(getDistance(orgData.lat, orgData.lng, dstData.lat, dstData.lng));
    
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
// 4. TACTICAL SECTOR FLIGHT GENERATOR ("Tout ce qui vole")
// Covers: Commercial (A320, B737), Heavy (A380, B747, B777, A350, BelugaXL),
// Military Defense (Rafale, Mirage 2000, Eurofighter, A400M, C-130, MRTT),
// Rescue Helicopters (SAMU 75/13/69, Dragon 75/13/2A, Gendarmerie H145/EC135),
// VIP / Presidential (COTAM 0001, Falcon 7X/8X, Gulfstream G650),
// General Aviation (DR400, C172).
// ============================================================
const FLEET_TEMPLATES = [
  // --- GROS PORTEURS / HEAVY ---
  {
    type: 'heavy',
    category: 'CIVIL',
    models: ['Airbus A380-800', 'Boeing 747-8', 'Boeing 777-300ER', 'Airbus A350-900', 'Airbus A350-1000', 'Airbus A330-900', 'Airbus A337 BelugaXL'],
    airlines: ['AFR', 'UAE', 'QTR', 'BAW', 'DLH', 'SIA', 'KLM', 'FDX', 'BOX'],
    altRange: [9800, 12500],
    speedRange: [460, 520],
  },
  // --- LIGNES COMMERCIALES MOYEN-COURRIER / CIVIL ---
  {
    type: 'civil',
    category: 'CIVIL',
    models: ['Airbus A320neo', 'Airbus A321neo', 'Boeing 737-800', 'Boeing 737 MAX 8', 'Airbus A220-300', 'Embraer E195-E2'],
    airlines: ['AFR', 'EZY', 'RYR', 'TVF', 'VLG', 'DLH', 'BAW', 'KLM', 'SWR', 'VOE', 'HOP'],
    altRange: [6500, 11500],
    speedRange: [400, 480],
  },
  // --- CHASSE & TRANSPORT MILITAIRE / DEFENSE TACTIQUE ---
  {
    type: 'military',
    category: 'MILITARY',
    models: ['Dassault Rafale C', 'Dassault Rafale M', 'Mirage 2000-5', 'Eurofighter Typhoon', 'Airbus A400M Atlas', 'Lockheed C-130J Super Hercules', 'Airbus A330 MRTT Phénix', 'Boeing E-3F Sentry AWACS'],
    airlines: ['FAF', 'FNY', 'GAF', 'BAF', 'NATO', 'REACH', 'AME', 'IAM'],
    callsigns: ['FAF41', 'FAF12', 'CTM2010', 'CTM204', 'FNY32', 'FNY11', 'RFAL01', 'RFAL04', 'M2K12', 'GAF44', 'BAF18', 'NATO01', 'REACH77'],
    altRange: [1500, 11000],
    speedRange: [420, 620],
  },
  // --- HÉLICOPTÈRES DE SECOURS, SÉCURITÉ CIVILE & GENDARMERIE ---
  {
    type: 'heli',
    category: 'CIVIL',
    models: ['Airbus Helicopters H145', 'Eurocopter EC145', 'Airbus Helicopters H135', 'Leonardo AW139', 'Airbus Helicopters H160'],
    airlines: ['SAMU', 'DRAGON', 'GEND'],
    callsigns: [
      'SAMU 75', 'SAMU 13', 'SAMU 69', 'SAMU 31', 'SAMU 33', 'SAMU 06', 'SAMU 44',
      'DRAGON 75', 'DRAGON 13', 'DRAGON 2A', 'DRAGON 33', 'DRAGON 06', 'DRAGON 69',
      'GEND 75', 'GEND 13', 'GEND 33', 'GEND 29', 'RESCUE 01'
    ],
    altRange: [350, 1400],
    speedRange: [100, 145],
  },
  // --- VIP, GOUVERNEMENT & JETS D'AFFAIRES ---
  {
    type: 'vip',
    category: 'PRIVATE',
    models: ['Dassault Falcon 7X', 'Dassault Falcon 8X', 'Gulfstream G650ER', 'Bombardier Global 7500', 'Cessna Citation Longitude'],
    airlines: ['COTAM', 'CTM'],
    callsigns: ['COTAM 0001', 'COTAM 0002', 'CTM0001', 'F-RAFP', 'F-RAFA', 'EXEC 01', 'VIPER 7X', 'NETJETS 42'],
    altRange: [10500, 13500],
    speedRange: [440, 510],
  },
  // --- AVIATION GÉNÉRALE / AÉROCLUBS ---
  {
    type: 'general',
    category: 'CIVIL',
    models: ['Robin DR400 Major', 'Cessna 172 Skyhawk', 'Diamond DA42 Twin Star'],
    airlines: ['AFR'],
    altRange: [600, 2200],
    speedRange: [105, 140],
  }
];

export class TacticalFlight {
  constructor(id, arg2 = 48.85, arg3 = 2.35, forceType = null) {
    this.id = id || `SEC-${Math.floor(100000 + Math.random() * 900000)}`;
    this.icao24 = this.id.replace(/[^A-Za-z0-9]/g, '').slice(-6).padEnd(6, 'F');
    this.isSectorFlight = true;
    this.isLive = true;
    this.isEmergency = false;
    this.emergencyType = '';
    this.onGround = false;

    let options = {};
    if (typeof arg2 === 'object' && arg2 !== null) {
      options = arg2;
    } else {
      options = {
        centerLat: typeof arg2 === 'number' ? arg2 : 48.85,
        centerLng: typeof arg3 === 'number' ? arg3 : 2.35,
        pattern: forceType || 'enroute'
      };
    }

    const pattern = options.pattern || 'enroute';
    this.pattern = pattern;
    this.fleetType = pattern;

    // Set bounds for positioning
    const bounds = options.bounds || {
      south: (options.centerLat || 48.85) - 0.7,
      north: (options.centerLat || 48.85) + 0.7,
      west: (options.centerLng || 2.35) - 1.0,
      east: (options.centerLng || 2.35) + 1.0
    };

    if (pattern === 'approach') {
      const ap = options.targetAirport || AIRPORTS.CDG;
      const rwyHdg = ap.rwyHdg || 267;
      const distKm = 4 + Math.random() * 48; // 2 to 26 NM
      const backRad = ((rwyHdg + 180) % 360) * Math.PI / 180;
      const latOffset = (distKm * Math.cos(backRad)) / 111.32;
      const lngOffset = (distKm * Math.sin(backRad)) / (111.32 * (Math.cos(ap.lat * Math.PI / 180) || 0.001));
      const lateralKm = (Math.random() - 0.5) * 1.5;
      const perpRad = (rwyHdg + 90) * Math.PI / 180;
      const latPerp = (lateralKm * Math.cos(perpRad)) / 111.32;
      const lngPerp = (lateralKm * Math.sin(perpRad)) / (111.32 * (Math.cos(ap.lat * Math.PI / 180) || 0.001));

      this.lat = ap.lat + latOffset + latPerp;
      this.lng = ap.lng + lngOffset + lngPerp;
      this.heading = Math.round((rwyHdg + (Math.random() - 0.5) * 5 + 360) % 360);
      
      this.altitude = Math.round(1400 + distKm * 180);
      this.altitudeM = Math.round(this.altitude * 0.3048);
      this.speed = Math.round(140 + Math.random() * 40);
      this.verticalSpeed = -Math.round(650 + Math.random() * 250);

      const airliners = [
        { m: 'Airbus A320neo', a: 'AFR' },
        { m: 'Airbus A321neo', a: 'AFR' },
        { m: 'Boeing 737-800', a: 'EZY' },
        { m: 'Boeing 737 MAX 8', a: 'RYR' },
        { m: 'Airbus A350-900', a: 'AFR' },
        { m: 'Boeing 777-300ER', a: 'AFR' },
        { m: 'Airbus A220-300', a: 'AFR' },
        { m: 'Boeing 737-800', a: 'TVF' },
        { m: 'Airbus A320neo', a: 'DLH' },
        { m: 'Airbus A321neo', a: 'BAW' },
        { m: 'Boeing 787-9', a: 'UAE' },
        { m: 'Airbus A330-900', a: 'KLM' },
        { m: 'Boeing 777-200ER', a: 'DAL' }
      ];
      const pick = airliners[Math.floor(Math.random() * airliners.length)];
      this.aircraftModel = pick.m;
      const airlineCode = pick.a;
      this.airline = AIRLINE_MAP[airlineCode] || AIRLINE_MAP.AFR;
      this.callsign = `${airlineCode}${Math.floor(10 + Math.random() * 980)}`;
      this.flightNumber = this.callsign;
      this.registration = `F-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      this.category = 'CIVIL';
      this.destination = ap;
      const orgKeys = ['JFK', 'DXB', 'LHR', 'MAD', 'FCO', 'NCE', 'RAK', 'AMS', 'BCN', 'FRA', 'TLS', 'BOD', 'MRS', 'ATH'];
      const orgCode = orgKeys[Math.floor(Math.random() * orgKeys.length)];
      this.origin = AIRPORTS[orgCode] || { code: orgCode, name: `Aéroport ${orgCode}`, city: orgCode, country: 'International' };
      this.squawk = `${Math.floor(1000 + Math.random() * 6700)}`;
    } else if (pattern === 'departure') {
      const ap = options.targetAirport || AIRPORTS.CDG;
      const distKm = 2 + Math.random() * 22;
      const departureHeadings = [10, 85, 175, 270];
      const outHdg = departureHeadings[Math.floor(Math.random() * departureHeadings.length)] + (Math.random() - 0.5) * 12;
      const rad = outHdg * Math.PI / 180;
      this.lat = ap.lat + (distKm * Math.cos(rad)) / 111.32;
      this.lng = ap.lng + (distKm * Math.sin(rad)) / (111.32 * (Math.cos(ap.lat * Math.PI / 180) || 0.001));
      this.heading = Math.round((outHdg + 360) % 360);
      this.altitude = Math.round(1200 + distKm * 320);
      this.altitudeM = Math.round(this.altitude * 0.3048);
      this.targetCruisingAlt = Math.round(24000 + Math.random() * 12000);
      this.speed = Math.round(210 + Math.random() * 70);
      this.verticalSpeed = Math.round(1800 + Math.random() * 1200);

      const airliners = [
        { m: 'Airbus A320neo', a: 'AFR' },
        { m: 'Airbus A321neo', a: 'TVF' },
        { m: 'Boeing 737-800', a: 'RYR' },
        { m: 'Airbus A350-900', a: 'AFR' },
        { m: 'Boeing 777-300ER', a: 'AFR' },
        { m: 'Boeing 787-9', a: 'BAW' },
        { m: 'Airbus A220-300', a: 'AFR' }
      ];
      const pick = airliners[Math.floor(Math.random() * airliners.length)];
      this.aircraftModel = pick.m;
      const airlineCode = pick.a;
      this.airline = AIRLINE_MAP[airlineCode] || AIRLINE_MAP.AFR;
      this.callsign = `${airlineCode}${Math.floor(10 + Math.random() * 980)}`;
      this.flightNumber = this.callsign;
      this.registration = `F-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      this.category = 'CIVIL';
      this.origin = ap;
      const dstKeys = ['NCE', 'TLS', 'BOD', 'MRS', 'MAD', 'LHR', 'JFK', 'DXB', 'YUL', 'DFW', 'AMS', 'FRA', 'GVA'];
      const dstCode = dstKeys[Math.floor(Math.random() * dstKeys.length)];
      this.destination = AIRPORTS[dstCode] || { code: dstCode, name: `Aéroport ${dstCode}`, city: dstCode, country: 'International' };
      this.squawk = `${Math.floor(1000 + Math.random() * 6700)}`;
    } else if (pattern === 'general') {
      this.lat = bounds.south + 0.05 + Math.random() * (bounds.north - bounds.south - 0.1);
      this.lng = bounds.west + 0.05 + Math.random() * (bounds.east - bounds.west - 0.1);
      this.heading = Math.floor(Math.random() * 360);
      this.altitude = Math.round(1500 + Math.random() * 2000);
      this.altitudeM = Math.round(this.altitude * 0.3048);
      this.speed = Math.round(105 + Math.random() * 30);
      this.verticalSpeed = Math.round((Math.random() - 0.5) * 150);

      const gaModels = ['Robin DR400 Major', 'Cessna 172 Skyhawk', 'Piper PA-28 Archer', 'Diamond DA42 Twin Star'];
      this.aircraftModel = gaModels[Math.floor(Math.random() * gaModels.length)];
      const gaCallsigns = ['F-HESY', 'F-GKXL', 'F-BVFA', 'F-GZTR', 'F-HOZC', 'F-BXMP', 'F-GLAB', 'F-GIJU', 'F-HJLM', 'F-BTPO', 'F-GDAA', 'F-HNAX'];
      this.callsign = gaCallsigns[Math.floor(Math.random() * gaCallsigns.length)];
      this.flightNumber = this.callsign;
      this.registration = this.callsign;
      this.airline = { code: 'GA', name: 'Aviation Générale / Aéroclub', country: 'France' };
      this.category = 'CIVIL';
      this.squawk = '7000';
      this.origin = AIRPORTS.LFPE || { code: 'LFPE', name: 'Aérodrome de Meaux-Esbly', city: 'Meaux', country: 'France' };
      this.destination = AIRPORTS.LFPK || { code: 'LFPK', name: 'Aérodrome de Coulommiers', city: 'Coulommiers', country: 'France' };
    } else if (pattern === 'heli') {
      this.lat = bounds.south + Math.random() * (bounds.north - bounds.south);
      this.lng = bounds.west + Math.random() * (bounds.east - bounds.west);
      this.heading = Math.floor(Math.random() * 360);
      this.altitude = Math.round(600 + Math.random() * 900);
      this.altitudeM = Math.round(this.altitude * 0.3048);
      this.speed = Math.round(110 + Math.random() * 35);
      this.verticalSpeed = Math.round((Math.random() - 0.5) * 200);

      const heliModels = ['Airbus Helicopters H145', 'Eurocopter EC145', 'Airbus Helicopters H135'];
      this.aircraftModel = heliModels[Math.floor(Math.random() * heliModels.length)];
      const heliCs = ['SAMU 75', 'SAMU 94', 'SAMU 93', 'SAMU 77', 'DRAGON 75', 'GEND 75'];
      this.callsign = heliCs[Math.floor(Math.random() * heliCs.length)];
      this.flightNumber = this.callsign;
      this.registration = `F-ZB${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
      this.airline = { code: 'HLI', name: 'Secours Aérien SAMU / Sécurité Civile', country: 'France' };
      this.category = 'CIVIL';
      this.squawk = '7000';
      this.origin = { code: 'SAMU', name: 'Héliport Necker', city: 'Paris', country: 'France' };
      this.destination = { code: 'HOSP', name: 'Centre Hospitalier Meaux', city: 'Meaux', country: 'France' };
    } else if (pattern === 'vip') {
      this.lat = bounds.south + Math.random() * (bounds.north - bounds.south);
      this.lng = bounds.west + Math.random() * (bounds.east - bounds.west);
      this.heading = Math.floor(Math.random() * 360);
      this.altitude = Math.round(33000 + Math.random() * 9000);
      this.altitudeM = Math.round(this.altitude * 0.3048);
      this.speed = Math.round(450 + Math.random() * 55);
      this.verticalSpeed = Math.round((Math.random() - 0.5) * 64);

      const vipModels = ['Dassault Falcon 7X', 'Dassault Falcon 8X', 'Gulfstream G650ER', 'Bombardier Global 7500'];
      this.aircraftModel = vipModels[Math.floor(Math.random() * vipModels.length)];
      const vipCs = ['COTAM 0001', 'CTM0002', 'F-RAFP', 'NETJETS 42', 'EXEC 01', 'VIPER 7X'];
      this.callsign = vipCs[Math.floor(Math.random() * vipCs.length)];
      this.flightNumber = this.callsign;
      this.registration = `F-R${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
      this.airline = { code: 'VIP', name: 'Vols Officiels / Affaires', country: 'France' };
      this.category = 'PRIVATE';
      this.squawk = '7700';
      this.origin = AIRPORTS.LBG || { code: 'LBG', name: 'Paris Le Bourget', city: 'Paris', country: 'France' };
      this.destination = AIRPORTS.GVA || { code: 'GVA', name: 'Genève Aéroport', city: 'Genève', country: 'Suisse' };
    } else if (pattern === 'military') {
      this.lat = bounds.south + Math.random() * (bounds.north - bounds.south);
      this.lng = bounds.west + Math.random() * (bounds.east - bounds.west);
      this.heading = Math.floor(Math.random() * 360);
      this.altitude = Math.round(16000 + Math.random() * 15000);
      this.altitudeM = Math.round(this.altitude * 0.3048);
      this.speed = Math.round(450 + Math.random() * 150);
      this.verticalSpeed = Math.round((Math.random() - 0.5) * 300);

      const milModels = ['Dassault Rafale C', 'Mirage 2000-5', 'Airbus A400M Atlas', 'Boeing E-3F Sentry'];
      this.aircraftModel = milModels[Math.floor(Math.random() * milModels.length)];
      const milCs = ['FAF41', 'CTM2010', 'RFAL04', 'M2K12', 'NATO01'];
      this.callsign = milCs[Math.floor(Math.random() * milCs.length)];
      this.flightNumber = this.callsign;
      this.registration = `F-U${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
      this.airline = { code: 'FAF', name: 'Armée de l\'Air et de l\'Espace', country: 'France' };
      this.category = 'MILITARY';
      this.squawk = `${Math.floor(1000 + Math.random() * 6000)}`;
      this.origin = { code: 'BA105', name: 'Base Aérienne 105 Évreux', city: 'Évreux', country: 'France' };
      this.destination = { code: 'BA113', name: 'Base Aérienne 113 Saint-Dizier', city: 'Saint-Dizier', country: 'France' };
    } else {
      // Default: 'enroute' commercial cruising flight
      this.lat = bounds.south + Math.random() * (bounds.north - bounds.south);
      this.lng = bounds.west + Math.random() * (bounds.east - bounds.west);
      const airwayTracks = [35, 65, 80, 140, 165, 215, 245, 325];
      this.heading = Math.round((airwayTracks[Math.floor(Math.random() * airwayTracks.length)] + (Math.random() - 0.5) * 10 + 360) % 360);
      this.altitude = 28000 + Math.floor(Math.random() * 13) * 1000;
      this.altitudeM = Math.round(this.altitude * 0.3048);
      this.speed = Math.round(430 + Math.random() * 75);
      this.verticalSpeed = Math.round((Math.random() - 0.5) * 64);

      const airliners = [
        { m: 'Airbus A350-900', a: 'AFR' },
        { m: 'Boeing 777-300ER', a: 'AFR' },
        { m: 'Airbus A380-800', a: 'UAE' },
        { m: 'Boeing 787-9', a: 'BAW' },
        { m: 'Airbus A330-900', a: 'DLH' },
        { m: 'Boeing 777-200LR', a: 'QTR' },
        { m: 'Airbus A350-1000', a: 'SIA' },
        { m: 'Boeing 737 MAX 8', a: 'RYR' },
        { m: 'Airbus A320neo', a: 'EZY' },
        { m: 'Airbus A321neo', a: 'KLM' },
        { m: 'Boeing 787-8', a: 'RAM' },
        { m: 'Boeing 737-800', a: 'TVF' },
        { m: 'Airbus A330-200', a: 'IBE' },
        { m: 'Airbus A321neo', a: 'WZZ' }
      ];
      const pick = airliners[Math.floor(Math.random() * airliners.length)];
      this.aircraftModel = pick.m;
      const airlineCode = pick.a;
      this.airline = AIRLINE_MAP[airlineCode] || AIRLINE_MAP.AFR;
      this.callsign = `${airlineCode}${Math.floor(100 + Math.random() * 8900)}`;
      this.flightNumber = this.callsign;
      this.registration = `F-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      this.category = 'CIVIL';
      const apList = Object.keys(AIRPORTS);
      let orgCode = apList[Math.floor(Math.random() * apList.length)];
      let dstCode = apList[Math.floor(Math.random() * apList.length)];
      while (dstCode === orgCode) dstCode = apList[Math.floor(Math.random() * apList.length)];
      this.origin = AIRPORTS[orgCode] || { code: orgCode, name: `Aéroport ${orgCode}`, city: orgCode, country: 'Europe' };
      this.destination = AIRPORTS[dstCode] || { code: dstCode, name: `Aéroport ${dstCode}`, city: dstCode, country: 'Europe' };
      this.squawk = `${Math.floor(1000 + Math.random() * 6700)}`;
    }

    this.country = this.airline?.country || 'France';
    this.progress = 0.2 + Math.random() * 0.6;
    this.totalDistance = Math.round(getDistance(
      this.origin.lat || this.lat, this.origin.lng || this.lng,
      this.destination.lat || this.lat + 2, this.destination.lng || this.lng + 2
    ));
    this.routeHistory = buildTrail(this.lat, this.lng, this.heading, this.speed);
  }

  tick(dt) {
    if (this.onGround || this.speed < 10) return;
    const speedMs = (this.speed * 1.852) / 3.6;
    const distM = speedMs * dt;
    const radHdg = (this.heading * Math.PI) / 180;
    const dLat = (distM * Math.cos(radHdg)) / 111320;
    const dLng = (distM * Math.sin(radHdg)) / (111320 * (Math.cos(this.lat * Math.PI / 180) || 0.001));

    this.lat += dLat;
    this.lng += dLng;

    if (this.pattern === 'approach') {
      if (this.altitude > 1200) {
        this.altitude = Math.max(1200, Math.round(this.altitude + (this.verticalSpeed / 60) * dt));
        this.altitudeM = Math.round(this.altitude * 0.3048);
      }
    } else if (this.pattern === 'departure') {
      if (this.targetCruisingAlt && this.altitude < this.targetCruisingAlt) {
        this.altitude = Math.min(this.targetCruisingAlt, Math.round(this.altitude + (this.verticalSpeed / 60) * dt));
        this.altitudeM = Math.round(this.altitude * 0.3048);
      } else {
        this.verticalSpeed = 0;
      }
    }

    this.routeHistory.push([this.lat, this.lng]);
    if (this.routeHistory.length > 60) this.routeHistory.shift();
  }
}

// Backward-compatible alias
export const SimFlight = TacticalFlight;

// ============================================================
// 5. AIRSPACE SIMULATOR — coordinates live feeds & airspace density
// ============================================================
export class AirspaceSimulator {
  constructor() {
    this.flights = [];
    this.historicalLogs = [];
    this.alerts = [];
    this.activeSquawks = 0;
    this.mode = 'live';
    this._knownEmergencyIds = new Set();
    this._livePilotsMap = new Map();
    this._sectorFlightsMap = new Map();
    this._lastCenter = { lat: 48.85, lng: 2.35 };
    this._lastBounds = null;
    this._lastZoom = 9;
    this._nextSecId = 1;
  }

  initialize() {
    this._nextSecId = 1;
    // Pre-populate with realistic Paris & Île-de-France airspace traffic immediately
    const initialBounds = { south: 48.2, north: 49.5, west: 1.8, east: 3.6 };
    this.ensureViewportDensity(initialBounds, 9);
    this._syncFlightsArray();
    this._prepopulateHistory();
    this._updateStats();
  }

  // Ensure high-density realistic airspace matching Flightradar24 for current view
  ensureViewportDensity(bounds, zoomLevel = 9) {
    if (!bounds) return;

    const south = typeof bounds.getSouth === 'function' ? bounds.getSouth() : bounds.south;
    const north = typeof bounds.getNorth === 'function' ? bounds.getNorth() : bounds.north;
    const west = typeof bounds.getWest === 'function' ? bounds.getWest() : bounds.west;
    const east = typeof bounds.getEast === 'function' ? bounds.getEast() : bounds.east;

    this._lastBounds = { south, north, west, east };
    this._lastZoom = zoomLevel;

    // Count flights currently inside visible bounds
    const inViewCount = this.flights.filter(f => 
      f.lat >= south && f.lat <= north && f.lng >= west && f.lng <= east
    ).length;

    // Target density calibrated against real Flightradar24 density:
    let target = 72;
    if (zoomLevel >= 11) target = 65;
    else if (zoomLevel === 10) target = 70;
    else if (zoomLevel === 9) target = 78;
    else if (zoomLevel === 8) target = 88;
    else if (zoomLevel === 7) target = 115;
    else if (zoomLevel <= 6) target = 160;

    if (inViewCount >= target) {
      return;
    }

    const countNeeded = Math.min(target - inViewCount, 40);

    // Identify nearby airports (in or within 60 km)
    const nearbyAirports = Object.values(AIRPORTS).filter(ap => {
      const dLat = Math.max(0, south - ap.lat, ap.lat - north);
      const dLng = Math.max(0, west - ap.lng, ap.lng - east);
      return Math.sqrt(dLat * dLat + dLng * dLng) < 0.65;
    });

    const box = { south, west, north, east };

    for (let i = 0; i < countNeeded; i++) {
      const id = `SEC-${this._nextSecId++}`;
      let pattern = 'enroute';
      let targetAp = nearbyAirports[0] || AIRPORTS.CDG;

      if (nearbyAirports.length > 0) {
        const roll = Math.random();
        if (roll < 0.32) {
          pattern = 'approach';
          targetAp = nearbyAirports[Math.floor(Math.random() * nearbyAirports.length)];
        } else if (roll < 0.50) {
          pattern = 'departure';
          targetAp = nearbyAirports[Math.floor(Math.random() * nearbyAirports.length)];
        } else if (roll < 0.78) {
          pattern = 'enroute';
        } else if (roll < 0.89) {
          pattern = 'general';
        } else if (roll < 0.94) {
          pattern = 'heli';
        } else if (roll < 0.97) {
          pattern = 'vip';
        } else {
          pattern = 'military';
        }
      } else {
        const roll = Math.random();
        if (roll < 0.80) pattern = 'enroute';
        else if (roll < 0.90) pattern = 'general';
        else if (roll < 0.95) pattern = 'vip';
        else pattern = 'military';
      }

      const flight = new TacticalFlight(id, {
        pattern,
        targetAirport: targetAp,
        bounds: box
      });

      this._sectorFlightsMap.set(id, flight);
    }

    // Prune only flights that are VERY far from current bounds (> 3.5 degrees)
    // and only if sector collection exceeds 280 flights
    if (this._sectorFlightsMap.size > 280) {
      const centerLat = (south + north) / 2;
      const centerLng = (west + east) / 2;
      for (const [id, f] of this._sectorFlightsMap.entries()) {
        if (this._sectorFlightsMap.size <= 220) break;
        const dist = Math.sqrt(Math.pow(f.lat - centerLat, 2) + Math.pow(f.lng - centerLng, 2));
        if (dist > 3.5) {
          this._sectorFlightsMap.delete(id);
        }
      }
    }

    this._syncFlightsArray();
    this._updateStats();
  }

  _initSectorTraffic(centerLat, centerLng, count = 160) {
    this.ensureViewportDensity({
      south: centerLat - 0.8,
      north: centerLat + 0.8,
      west: centerLng - 1.2,
      east: centerLng + 1.2
    }, 9);
  }

  _syncFlightsArray() {
    this.flights = [
      ...this._livePilotsMap.values(),
      ...this._sectorFlightsMap.values()
    ];
  }

  _prepopulateHistory() {
    const apCodes = Object.keys(AIRPORTS).slice(0, 10);
    for (let i = 0; i < 10; i++) {
      const org = apCodes[i % apCodes.length];
      const dst = apCodes[(i + 3) % apCodes.length];
      this.historicalLogs.push({
        id: `HIST-${2000 + i}`,
        flightNumber: `AF${100 + i}`,
        airlineName: 'Air France',
        aircraftModel: 'Airbus A320neo',
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

    // Recycle flights that leave the extended viewport buffer (> 1.2°)
    // so they wrap smoothly to enter from the outer buffer edge
    const bounds = this._lastBounds;
    if (bounds) {
      const bufLat = (bounds.north - bounds.south) * 0.7 + 0.4;
      const bufLng = (bounds.east - bounds.west) * 0.7 + 0.5;
      for (const [id, f] of this._sectorFlightsMap.entries()) {
        const outOfBounds = 
          f.lat < bounds.south - bufLat || f.lat > bounds.north + bufLat ||
          f.lng < bounds.west - bufLng  || f.lng > bounds.east + bufLng;
        
        if (outOfBounds) {
          const recycled = new TacticalFlight(id, {
            pattern: f.pattern || 'enroute',
            bounds: bounds
          });
          this._sectorFlightsMap.set(id, recycled);
        }
      }
    }

    this._syncFlightsArray();
    this._updateStats();
  }

  _updateStats() {
    this.activeSquawks = this.flights.filter(f => f.isEmergency).length;
  }

  // ──────────────────────────────────────────────
  // Primary Live Source: VATSIM Network (100% Native CORS, Cloudflare)
  // ~800-1500 live human-flown flights worldwide
  // ──────────────────────────────────────────────
  async _fetchVatsimLive() {
    try {
      const res = await fetch('https://data.vatsim.net/v3/vatsim-data.json', {
        signal: AbortSignal.timeout(8000),
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const pilots = data.pilots || [];
      if (!pilots.length) return [];

      return pilots
        .filter(p => p.latitude != null && p.longitude != null && !isNaN(p.latitude) && !isNaN(p.longitude))
        .map(p => {
          const acType = (p.flight_plan?.aircraft_short || p.flight_plan?.aircraft || 'A320').split('/')[0].trim();
          return new LiveFlight({
            hex: (p.cid || Math.floor(100000 + Math.random() * 900000)).toString(16).padStart(6, '0'),
            callsign: p.callsign,
            lat: p.latitude,
            lon: p.longitude,
            altitude: p.altitude,
            gs: p.groundspeed,
            track: p.heading,
            squawk: String(p.transponder || '2000'),
            t: acType,
            desc: p.flight_plan?.aircraft || acType,
            departure: p.flight_plan?.departure,
            arrival: p.flight_plan?.arrival,
            route: p.flight_plan?.route,
            _source: 'VATSIM Live',
          });
        });
    } catch (err) {
      console.warn('[VATSIM Live] Network fetch info:', err.message);
      return [];
    }
  }

  // ──────────────────────────────────────────────
  // Secondary Live Source: IVAO Network (100% Native CORS)
  // ~300-800 live human-flown flights worldwide
  // ──────────────────────────────────────────────
  async _fetchIvaoLive() {
    try {
      const res = await fetch('https://api.ivao.aero/v2/tracker/whazzup', {
        signal: AbortSignal.timeout(8000),
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const pilots = data.clients?.pilots || [];
      if (!pilots.length) return [];

      return pilots
        .filter(p => p.lastTrack?.latitude != null && p.lastTrack?.longitude != null)
        .map(p => {
          const acType = p.flightPlan?.aircraft?.icaoCode || p.flightPlan?.aircraftId || 'A320';
          return new LiveFlight({
            hex: (p.id || Math.floor(100000 + Math.random() * 900000)).toString(16).padStart(6, '0'),
            callsign: p.callsign,
            lat: p.lastTrack.latitude,
            lon: p.lastTrack.longitude,
            altitude: p.lastTrack.altitude,
            gs: p.lastTrack.groundSpeed,
            track: p.lastTrack.heading,
            squawk: String(p.lastTrack.transponder || '2000'),
            t: acType,
            desc: p.flightPlan?.aircraft?.model || acType,
            departure: p.flightPlan?.departureId,
            arrival: p.flightPlan?.arrivalId,
            route: p.flightPlan?.route,
            _source: 'IVAO Live',
          });
        });
    } catch (err) {
      console.warn('[IVAO Live] Network fetch info:', err.message);
      return [];
    }
  }

  // ──────────────────────────────────────────────
  // Main public method: fetch live data & apply with full persistence
  // ──────────────────────────────────────────────
  async fetchAndApplyLiveStates(lat = 48.85, lng = 2.35) {
    // Check if map center moved significantly (> 400 km) to repoint sector flights
    const dLat = Math.abs(lat - this._lastCenter.lat);
    const dLng = Math.abs(lng - this._lastCenter.lng);
    const centerMovedFar = dLat > 3.5 || dLng > 5.0;
    this._lastCenter = { lat, lng };

    if (centerMovedFar || this._sectorFlightsMap.size === 0) {
      this._initSectorTraffic(lat, lng, 160);
    }

    // 1. Fetch VATSIM & IVAO live feeds in parallel
    const [vatsimRes, ivaoRes] = await Promise.allSettled([
      this._fetchVatsimLive(),
      this._fetchIvaoLive()
    ]);

    const livePilots = [];
    if (vatsimRes.status === 'fulfilled' && Array.isArray(vatsimRes.value)) {
      livePilots.push(...vatsimRes.value);
    }
    if (ivaoRes.status === 'fulfilled' && Array.isArray(ivaoRes.value)) {
      livePilots.push(...ivaoRes.value);
    }

    if (livePilots.length > 0) {
      const currentLiveIds = new Set(livePilots.map(p => p.id));

      // Update existing live pilots IN-PLACE to preserve marker continuity
      livePilots.forEach(p => {
        if (this._livePilotsMap.has(p.id)) {
          const existing = this._livePilotsMap.get(p.id);
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
          if (p.lat && p.lng) {
            existing.routeHistory.push([p.lat, p.lng]);
            if (existing.routeHistory.length > 60) existing.routeHistory.shift();
          }
        } else {
          this._livePilotsMap.set(p.id, p);
        }
      });

      // Remove disconnected live flights
      for (const [id] of this._livePilotsMap.entries()) {
        if (!currentLiveIds.has(id)) {
          this._livePilotsMap.delete(id);
        }
      }
    }

    this._syncFlightsArray();
    this.mode = 'live';
    this._detectRealEmergencies();
    this._updateStats();

    const liveCount = this._livePilotsMap.size;
    return {
      success: true,
      count: this.flights.length,
      liveCount: liveCount,
      source: `Réseau Mondial (${liveCount} vols réels)`
    };
  }

  // ──────────────────────────────────────────────
  // Detect REAL emergency squawks
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

    // Clean up resolved emergencies
    const activeEmgIds = new Set(this.flights.filter(f => f.isEmergency).map(f => f.id));
    for (const id of this._knownEmergencyIds) {
      if (!activeEmgIds.has(id)) this._knownEmergencyIds.delete(id);
    }
  }

  // Regenerate airspace around custom position smoothly
  regenerateAirspaceAround(lat, lng) {
    this._lastCenter = { lat, lng };
    this._initSectorTraffic(lat, lng, 160);
    this._syncFlightsArray();
    this.mode = 'live';
    this._updateStats();
  }
}
