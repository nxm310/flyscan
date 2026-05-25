/* ==========================================================================
   FLYRADAR — FLIGHT AND AIRSPACE SIMULATION SYSTEM
   ========================================================================== */

// 1. Core Databases
export const AIRLINES = {
  CIVIL: [
    { code: 'AF', name: 'Air France', callsign: 'AIRFRANS' },
    { code: 'DL', name: 'Delta Air Lines', callsign: 'DELTA' },
    { code: 'LH', name: 'Lufthansa', callsign: 'LUFTHANSA' },
    { code: 'BA', name: 'British Airways', callsign: 'SPEEDBIRD' },
    { code: 'EK', name: 'Emirates', callsign: 'EMIRATES' },
    { code: 'KL', name: 'KLM', callsign: 'KLM' },
    { code: 'QR', name: 'Qatar Airways', callsign: 'QATARI' },
    { code: 'SQ', name: 'Singapore Airlines', callsign: 'SINGAPORE' },
    { code: 'EZ', name: 'EasyJet', callsign: 'EASY' },
    { code: 'FR', name: 'Ryanair', callsign: 'RYANAIR' }
  ],
  MILITARY: [
    { code: 'FAF', name: 'Armée de l\'Air Française', callsign: 'COTAM' },
    { code: 'USAF', name: 'United States Air Force', callsign: 'REACH' },
    { code: 'RAF', name: 'Royal Air Force', callsign: 'ASCOT' }
  ],
  PRIVATE: [
    { code: 'NJS', name: 'NetJets', callsign: 'SHARED' },
    { code: 'LXJ', name: 'Flexjet', callsign: 'FLEXJET' },
    { code: 'PVT', name: 'Vols Privés', callsign: 'PRIVATE' }
  ]
};

export const AIRCRAFT_MODELS = {
  CIVIL: [
    { model: 'Airbus A350-900', speed: 490, alt: 37000, regPrefix: 'F-HTY' },
    { model: 'Boeing 787-9', speed: 480, alt: 38000, regPrefix: 'N-837' },
    { model: 'Airbus A320-200', speed: 440, alt: 32000, regPrefix: 'EI-DEP' },
    { model: 'Boeing 737-800', speed: 450, alt: 34000, regPrefix: 'G-RYS' },
    { model: 'Airbus A380-800', speed: 500, alt: 39000, regPrefix: 'A6-EVC' }
  ],
  MILITARY: [
    { model: 'Dassault Rafale C', speed: 650, alt: 42000, regPrefix: 'FAF-11' },
    { model: 'Lockheed C-130J Super Hercules', speed: 340, alt: 22000, regPrefix: 'ZH-88' },
    { model: 'Boeing KC-135R Stratotanker', speed: 460, alt: 35000, regPrefix: 'USAF-62' }
  ],
  PRIVATE: [
    { model: 'Cessna Citation Latitude', speed: 420, alt: 41000, regPrefix: 'N-296CS' },
    { model: 'Gulfstream G650ER', speed: 510, alt: 45000, regPrefix: 'VP-CGG' },
    { model: 'Bombardier Global 7500', speed: 505, alt: 43000, regPrefix: 'D-AAAS' }
  ]
};

export const AIRPORTS = {
  CDG: { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France', lat: 49.0097, lng: 2.5479, windDir: 210, windSpeed: 14, temp: 17, delayIndex: 1.2 },
  JFK: { code: 'JFK', name: 'John F. Kennedy', city: 'New York', country: 'États-Unis', lat: 40.6413, lng: -73.7781, windDir: 180, windSpeed: 8, temp: 21, delayIndex: 2.4 },
  LHR: { code: 'LHR', name: 'Heathrow', city: 'Londres', country: 'Royaume-Uni', lat: 51.4700, lng: -0.4543, windDir: 230, windSpeed: 18, temp: 15, delayIndex: 3.1 },
  HND: { code: 'HND', name: 'Haneda', city: 'Tokyo', country: 'Japon', lat: 35.5494, lng: 139.7798, windDir: 90, windSpeed: 5, temp: 19, delayIndex: 0.8 },
  DXB: { code: 'DXB', name: 'Dubai Intl', city: 'Dubaï', country: 'Émirats Arabes Unis', lat: 25.2532, lng: 55.3657, windDir: 320, windSpeed: 10, temp: 34, delayIndex: 1.5 }
};

// Extented airport endpoints in Europe/France for realistic short hauls
const FLIGHT_HUBS = [
  { code: 'CDG', lat: 49.0097, lng: 2.5479 },
  { code: 'NCE', lat: 43.6653, lng: 7.2150 },
  { code: 'MRS', lat: 43.4367, lng: 5.2150 },
  { code: 'LYS', lat: 45.7264, lng: 5.0900 },
  { code: 'TLS', lat: 43.6291, lng: 1.3638 },
  { code: 'BOD', lat: 44.8283, lng: -0.7156 },
  { code: 'GVA', lat: 46.2381, lng: 6.1089 },
  { code: 'FRA', lat: 50.0379, lng: 8.5622 },
  { code: 'MAD', lat: 40.4719, lng: -3.5626 },
  { code: 'FCO', lat: 41.8003, lng: 12.2389 }
];

// Helper: Calculate great circle distance
export function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

// Helper: Calculate heading/bearing
export function getBearing(lat1, lng1, lat2, lng2) {
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  
  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
            
  let brng = Math.atan2(y, x) * 180 / Math.PI;
  return (brng + 360) % 360; // 0 to 360 bearing
}

// 2. Flight Class definition
export class Flight {
  constructor(id, category = 'CIVIL') {
    this.id = id;
    this.category = category; // CIVIL, MILITARY, PRIVATE
    
    // Choose airline
    const airlinePool = AIRLINES[category];
    this.airline = airlinePool[Math.floor(Math.random() * airlinePool.length)];
    
    // Generate flight number
    const flightNumberDigits = Math.floor(100 + Math.random() * 900);
    this.flightNumber = `${this.airline.code}${flightNumberDigits}`;
    
    // Choose aircraft model and stats
    const modelPool = AIRCRAFT_MODELS[category];
    const modelTemplate = modelPool[Math.floor(Math.random() * modelPool.length)];
    this.aircraftModel = modelTemplate.model;
    this.registration = `${modelTemplate.regPrefix}-${Math.floor(100 + Math.random() * 900)}`;
    
    this.maxSpeed = modelTemplate.speed; // knots
    this.cruiseAlt = modelTemplate.alt; // feet
    
    // Choose origin and destination hubs
    let orgIdx = Math.floor(Math.random() * FLIGHT_HUBS.length);
    let destIdx = Math.floor(Math.random() * FLIGHT_HUBS.length);
    while (orgIdx === destIdx) {
      destIdx = Math.floor(Math.random() * FLIGHT_HUBS.length);
    }
    
    this.origin = FLIGHT_HUBS[orgIdx];
    this.destination = FLIGHT_HUBS[destIdx];
    
    // Calculate total flight distance in km
    this.totalDistance = getDistance(this.origin.lat, this.origin.lng, this.destination.lat, this.destination.lng);
    
    // Simulation state variables
    this.progress = Math.random() * 0.9; // Start at random point along route (0 to 1)
    this.lat = this.origin.lat;
    this.lng = this.origin.lng;
    this.altitude = 0;
    this.speed = 0;
    this.heading = 0;
    this.verticalSpeed = 0;
    this.squawk = this.generateNormalSquawk();
    this.isEmergency = false;
    this.emergencyType = ''; // SQUAWK 7700 or SQUAWK 7600
    this.routeHistory = [];
    
    // Populate initial coordinates & path history
    this.updatePositionAndTelemetry();
    this.prepopulateHistory();
  }

  generateNormalSquawk() {
    // Squawk is octal (0-7 only)
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += Math.floor(Math.random() * 8);
    }
    // Avoid emergency numbers
    if (code === '7700' || code === '7600' || code === '7500') {
      return '2204';
    }
    return code;
  }

  prepopulateHistory() {
    // Generate a set of points behind the current progress
    const steps = 15;
    const currentProgress = this.progress;
    
    for (let i = 0; i <= steps; i++) {
      const stepProgress = (i / steps) * currentProgress;
      const lat = this.origin.lat + (this.destination.lat - this.origin.lat) * stepProgress;
      const lng = this.origin.lng + (this.destination.lng - this.origin.lng) * stepProgress;
      this.routeHistory.push([lat, lng]);
    }
  }

  updatePositionAndTelemetry() {
    // Current coordinate calculation based on route progression (Linear interpolation as approximation)
    const lat = this.origin.lat + (this.destination.lat - this.origin.lat) * this.progress;
    const lng = this.origin.lng + (this.destination.lng - this.origin.lng) * this.progress;
    this.lat = lat;
    this.lng = lng;
    
    // Append to path history periodically (keep size limited)
    if (this.routeHistory.length === 0 || getDistance(this.lat, this.lng, this.routeHistory[this.routeHistory.length - 1][0], this.routeHistory[this.routeHistory.length - 1][1]) > 5) {
      this.routeHistory.push([this.lat, this.lng]);
      if (this.routeHistory.length > 50) {
        this.routeHistory.shift();
      }
    }
    
    // Heading Calculation
    this.heading = getBearing(lat, lng, this.destination.lat, this.destination.lng);
    
    // Altitude and Speed Calculations based on Flight Stage (Cruising, Climb, Descent)
    const p = this.progress;
    if (p < 0.15) {
      // Climb Phase
      const stageProgress = p / 0.15;
      this.altitude = Math.round(stageProgress * this.cruiseAlt);
      this.speed = Math.round(180 + stageProgress * (this.maxSpeed - 180));
      this.verticalSpeed = 1500 + Math.round(Math.random() * 800); // positive climb rate
    } else if (p > 0.85) {
      // Descent Phase
      const stageProgress = (1 - p) / 0.15;
      this.altitude = Math.round(stageProgress * this.cruiseAlt);
      this.speed = Math.round(140 + stageProgress * (this.maxSpeed - 140));
      this.verticalSpeed = -1200 - Math.round(Math.random() * 500); // negative sink rate
      
      // Safety bounds near destination
      if (this.altitude < 0) this.altitude = 0;
      if (this.speed < 120) this.speed = 120;
    } else {
      // Cruise Phase
      this.altitude = this.cruiseAlt + Math.round((Math.random() - 0.5) * 100);
      this.speed = this.maxSpeed + Math.round((Math.random() - 0.5) * 15);
      this.verticalSpeed = Math.round((Math.random() - 0.5) * 100); // minor adjustments
    }
  }

  tick(dt) {
    // Advance progress based on current speed
    // Speed is in knots (1 knot = 1.852 km/h). dt is in seconds.
    const speedKmh = this.speed * 1.852;
    const distanceMoved = (speedKmh / 3600) * dt; // km moved in this frame
    const progressInc = distanceMoved / this.totalDistance;
    
    this.progress += progressInc;
    
    // Recalculate properties
    this.updatePositionAndTelemetry();
  }

  declareEmergency(type) {
    this.isEmergency = true;
    this.emergencyType = type;
    this.squawk = type === 'SQUAWK 7700' ? '7700' : '7600';
    this.heading += (Math.random() - 0.5) * 35; // veer off course slightly
    this.altitude -= 2000; // descend slightly in emergency
    if (this.altitude < 5000) this.altitude = 5000;
  }
}

// 3. Airspace Simulator State
export class AirspaceSimulator {
  constructor() {
    this.flights = [];
    this.historicalLogs = [];
    this.alerts = [];
    this.activeSquawks = 0;
    this.totalFlightsCount = 65;
  }

  initialize() {
    // Generate initial flights across all categories
    for (let i = 0; i < this.totalFlightsCount; i++) {
      let category = 'CIVIL';
      const roll = Math.random();
      if (roll < 0.12) {
        category = 'MILITARY';
      } else if (roll < 0.25) {
        category = 'PRIVATE';
      }
      
      const f = new Flight(`FL-${1000 + i}`, category);
      this.flights.push(f);
    }
    
    // Create some initial historical logs
    this.prepopulateHistory();
    
    // Calculate initial statistics
    this.updateStats();
  }

  prepopulateHistory() {
    const historicalDestinations = ['CDG', 'JFK', 'LHR', 'HND', 'DXB'];
    const airlines = [...AIRLINES.CIVIL, ...AIRLINES.PRIVATE];
    
    for (let i = 0; i < 8; i++) {
      const airl = airlines[Math.floor(Math.random() * airlines.length)];
      const model = AIRCRAFT_MODELS.CIVIL[Math.floor(Math.random() * AIRCRAFT_MODELS.CIVIL.length)].model;
      const org = historicalDestinations[Math.floor(Math.random() * historicalDestinations.length)];
      let dest = historicalDestinations[Math.floor(Math.random() * historicalDestinations.length)];
      while (org === dest) {
        dest = historicalDestinations[Math.floor(Math.random() * historicalDestinations.length)];
      }
      
      const durationHours = 2 + Math.floor(Math.random() * 6);
      const durationMins = Math.floor(Math.random() * 60);
      
      const log = {
        id: `HIST-${2000 + i}`,
        flightNumber: `${airl.code}${100 + Math.floor(Math.random() * 900)}`,
        airlineName: airl.name,
        aircraftModel: model,
        origin: org,
        destination: dest,
        duration: `${durationHours}h ${durationMins}m`,
        date: new Date(Date.now() - (i + 1) * 3600 * 24000).toLocaleDateString('fr-FR'),
        routeHistory: [
          [48.8566 + (Math.random() - 0.5) * 5, 2.3522 + (Math.random() - 0.5) * 5],
          [48.8566, 2.3522]
        ]
      };
      this.historicalLogs.push(log);
    }
  }

  tick(dt) {
    this.flights.forEach(f => {
      f.tick(dt);
      
      // Check if flight reached its destination (progress >= 1.0)
      if (f.progress >= 1.0) {
        this.completeFlight(f);
      }
    });
    
    // Periodically update airport conditions and delay ratings
    this.updateAirports();
    
    // Calculate statistics
    this.updateStats();
  }

  completeFlight(flight) {
    // Add flight to historical log
    const durationHours = 1 + Math.floor(flight.totalDistance / 800);
    const durationMins = Math.floor(Math.random() * 60);
    
    const log = {
      id: `HIST-${Date.now()}`,
      flightNumber: flight.flightNumber,
      airlineName: flight.airline.name,
      aircraftModel: flight.aircraftModel,
      origin: flight.origin.code,
      destination: flight.destination.code,
      duration: `${durationHours}h ${durationMins}m`,
      date: new Date().toLocaleDateString('fr-FR'),
      routeHistory: [...flight.routeHistory]
    };
    
    this.historicalLogs.unshift(log);
    if (this.historicalLogs.length > 20) {
      this.historicalLogs.pop();
    }
    
    // Remove the completed flight and spawn a new one
    const index = this.flights.indexOf(flight);
    if (index > -1) {
      this.flights.splice(index, 1);
    }
    
    // Create new flight to replace it
    const newFlight = new Flight(`FL-${Date.now()}`, flight.category);
    newFlight.progress = 0; // starts at takeoff
    newFlight.altitude = 0;
    newFlight.speed = 150;
    this.flights.push(newFlight);
  }

  updateAirports() {
    // Randomize weather and delays slightly for dynamism
    Object.values(AIRPORTS).forEach(ap => {
      // Wind speed shift
      ap.windSpeed += Math.round((Math.random() - 0.5) * 2);
      if (ap.windSpeed < 2) ap.windSpeed = 2;
      
      // Wind direction shift
      ap.windDir = (ap.windDir + Math.round((Math.random() - 0.5) * 10) + 360) % 360;
      
      // Temperature shift
      ap.temp += Math.random() > 0.5 ? 0.1 : -0.1;
      ap.temp = Math.round(ap.temp * 10) / 10;
      
      // Delay index shifts
      ap.delayIndex += (Math.random() - 0.5) * 0.4;
      if (ap.delayIndex < 0.2) ap.delayIndex = 0.2;
      if (ap.delayIndex > 9.9) ap.delayIndex = 9.9;
      ap.delayIndex = Math.round(ap.delayIndex * 10) / 10;
    });
  }

  updateStats() {
    this.activeSquawks = this.flights.filter(f => f.isEmergency).length;
  }

  triggerRandomSquawkAlert() {
    // Pick a random civil flight to declare emergency
    const civilFlights = this.flights.filter(f => !f.isEmergency && f.category === 'CIVIL' && f.progress > 0.1 && f.progress < 0.85);
    
    if (civilFlights.length === 0) return null;
    
    const selectedFlight = civilFlights[Math.floor(Math.random() * civilFlights.length)];
    const isMajor = Math.random() > 0.3; // 70% Squawk 7700, 30% Squawk 7600
    const alertType = isMajor ? 'SQUAWK 7700' : 'SQUAWK 7600';
    
    selectedFlight.declareEmergency(alertType);
    
    // Register Alert
    const alertItem = {
      id: `ALT-${Date.now()}`,
      flightId: selectedFlight.id,
      flightNumber: selectedFlight.flightNumber,
      airlineName: selectedFlight.airline.name,
      aircraftModel: selectedFlight.aircraftModel,
      origin: selectedFlight.origin.code,
      destination: selectedFlight.destination.code,
      type: alertType,
      message: isMajor 
        ? `${selectedFlight.flightNumber} (${selectedFlight.airline.name}) a déclaré une URGENCE GÉNÉRALE (Squawk 7700) en altitude.`
        : `${selectedFlight.flightNumber} (${selectedFlight.airline.name}) signale une PERTE DE RADIOCONTACT (Squawk 7600).`,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    
    this.alerts.unshift(alertItem);
    if (this.alerts.length > 30) {
      this.alerts.pop();
    }
    
    this.updateStats();
    
    return alertItem;
  }

  regenerateAirspaceAround(lat, lng) {
    // 1. Create a set of localized virtual hubs around the user's location
    const radius = 2.5; // ~280km bounding box
    
    this.userHubs = [
      { code: 'LOC', lat: lat, lng: lng }, // Center (user location)
      { code: 'HUB1', lat: lat + radius * 0.6, lng: lng + radius * 0.8 },
      { code: 'HUB2', lat: lat - radius * 0.7, lng: lng - radius * 0.5 },
      { code: 'HUB3', lat: lat + radius * 0.5, lng: lng - radius * 0.7 },
      { code: 'HUB4', lat: lat - radius * 0.8, lng: lng + radius * 0.6 }
    ];

    // Clear existing flights and alerts
    this.flights = [];
    this.alerts = [];
    this.activeSquawks = 0;

    // Generate new flights orbiting this local workspace
    for (let i = 0; i < this.totalFlightsCount; i++) {
      let category = 'CIVIL';
      const roll = Math.random();
      if (roll < 0.12) {
        category = 'MILITARY';
      } else if (roll < 0.25) {
        category = 'PRIVATE';
      }

      const f = new Flight(`FL-${1000 + i}`, category);
      
      // Override hubs with geolocated positions
      let orgIdx = Math.floor(Math.random() * this.userHubs.length);
      let destIdx = Math.floor(Math.random() * this.userHubs.length);
      while (orgIdx === destIdx) {
        destIdx = Math.floor(Math.random() * this.userHubs.length);
      }
      
      f.origin = this.userHubs[orgIdx];
      f.destination = this.userHubs[destIdx];
      f.totalDistance = getDistance(f.origin.lat, f.origin.lng, f.destination.lat, f.destination.lng);
      f.progress = Math.random() * 0.9;
      f.updatePositionAndTelemetry();
      f.routeHistory = [];
      f.prepopulateHistory();
      
      this.flights.push(f);
    }

    this.updateStats();
  }
}
