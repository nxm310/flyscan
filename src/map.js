/* ==========================================================================
   FLYRADAR — MAP CONTROLLER MODULE
   ========================================================================== */
import { AIRPORTS } from './simulation.js';

export class MapController {
  constructor(onFlightSelectedCallback) {
    this.map = null;
    this.markers = new Map(); // flightId -> Leaflet Marker
    this.trailPolyline = null;
    this.onFlightSelected = onFlightSelectedCallback;
    
    // SVG Path for aircraft
    this.planeSvgPath = 'M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5L21 16z';
  }

  init(lat = 46.2, lng = 2.2, zoom = 6) {
    // Initialise Leaflet Map
    this.map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
      minZoom: 3,
      maxZoom: 14
    }).setView([lat, lng], zoom);

    // Zoom control in top right
    L.control.zoom({
      position: 'topright'
    }).addTo(this.map);

    // Dark Matter tile layer by default
    this.tileLayerUrlDark = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    this.tileLayerUrlLight = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    
    this.tileLayer = L.tileLayer(this.tileLayerUrlDark, {
      maxZoom: 20
    }).addTo(this.map);

    // Init polyline trail
    this.trailPolyline = L.polyline([], {
      color: '#00f2fe',
      weight: 3.5,
      opacity: 0.8,
      lineCap: 'round',
      lineJoin: 'round',
      className: 'glowing-flight-trail'
    }).addTo(this.map);

    // User location marker (initially null)
    this.userLocationMarker = null;

    // Click map to deselect
    this.map.on('click', (e) => {
      // Check if clicking marker or map background
      if (e.originalEvent.target.id === 'map' || e.originalEvent.target.classList.contains('leaflet-container')) {
        this.onFlightSelected(null);
      }
    });

    // Draw Airports
    this.drawAirports();
  }

  drawAirports() {
    this.airportMarkers = new Map();
    
    Object.values(AIRPORTS).forEach(ap => {
      // Create a small circle marker for each airport
      const marker = L.circleMarker([ap.lat, ap.lng], {
        radius: 5,
        color: 'var(--color-primary)',
        fillColor: '#000',
        fillOpacity: 1,
        weight: 2,
        className: 'airport-marker'
      }).addTo(this.map);

      // Add a tooltip that appears on hover
      marker.bindTooltip(`<b>${ap.code}</b><br>${ap.name}`, {
        direction: 'top',
        className: 'airport-tooltip'
      });

      // Clicking an airport centers map and can trigger the airport sidebar
      marker.on('click', () => {
        this.map.setView([ap.lat, ap.lng], 10);
        // Dispatch custom event to tell UI controller to open airport sidebar
        document.dispatchEvent(new CustomEvent('airportSelected', { detail: ap.code }));
      });

      this.airportMarkers.set(ap.code, marker);
    });
  }

  switchTheme(isLightMode) {
    if (this.tileLayer) {
      this.tileLayer.setUrl(isLightMode ? this.tileLayerUrlLight : this.tileLayerUrlDark);
    }
  }

  getAltitudeColor(altFt) {
    if (altFt <= 0) return '#7f8c8d'; // Ground / unknown
    if (altFt < 1000) return '#ff0000';  // Red
    if (altFt < 2000) return '#ff4500';  // Orange-Red
    if (altFt < 4000) return '#ff8c00';  // Orange
    if (altFt < 7000) return '#ffcc00';  // Gold/Yellow
    if (altFt < 10000) return '#99ff00'; // Lime Green
    if (altFt < 15000) return '#00ff00'; // Green
    if (altFt < 20000) return '#009900'; // Dark Green
    if (altFt < 25000) return '#00ff99'; // Teal
    if (altFt < 30000) return '#00ffff'; // Cyan
    if (altFt < 35000) return '#00aaff'; // Light Blue
    if (altFt < 40000) return '#0055ff'; // Dark Blue
    if (altFt < 45000) return '#5500ff'; // Purple
    return '#ff00ff'; // Magenta (very high)
  }

  createPlaneIcon(flight, isSelected) {
    const heading = Math.round(flight.heading);
    const category = flight.category; // CIVIL, MILITARY, PRIVATE
    const isEmergency = flight.isEmergency;
    
    let categoryClass = 'civ';
    if (category === 'MILITARY') categoryClass = 'mil';
    if (category === 'PRIVATE') categoryClass = 'prv';
    if (isEmergency) categoryClass = 'emg';

    const selectedClass = isSelected ? 'selected' : '';
    const altFt = flight.altitude ? Math.round(flight.altitude) : 0;
    
    // Dynamic color based on altitude (like ADS-B Exchange)
    // If it's an emergency, keep it red/emergency color for visibility
    const planeColor = isEmergency ? '#e11d48' : this.getAltitudeColor(altFt);
    
    // Custom DivIcon allowing rotation and pulse effects
    const htmlContent = `
      <div class="plane-marker-icon-wrapper" style="transform: rotate(${heading}deg);">
        <div class="plane-marker-pulse ${categoryClass}"></div>
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="${this.planeSvgPath}" style="fill: ${planeColor} !important;"/>
        </svg>
      </div>
    `;

    return L.divIcon({
      html: htmlContent,
      className: `custom-plane-marker ${categoryClass} ${selectedClass}`,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
  }

  updateMarkers(flights, selectedFlightId, filterCategory = 'all') {
    const activeIds = new Set();

    flights.forEach(f => {
      // Check category filters
      const matchesFilter = filterCategory === 'all' || 
                            (filterCategory === 'civil' && f.category === 'CIVIL') ||
                            (filterCategory === 'military' && f.category === 'MILITARY') ||
                            (filterCategory === 'private' && f.category === 'PRIVATE');

      if (!matchesFilter) {
        // If marker exists but category filtered out, remove it
        if (this.markers.has(f.id)) {
          this.map.removeLayer(this.markers.get(f.id));
          this.markers.delete(f.id);
        }
        return;
      }

      activeIds.add(f.id);
      const isSelected = f.id === selectedFlightId;
      const altFt = f.altitude ? Math.round(f.altitude) : 0;

      if (this.markers.has(f.id)) {
        // Update existing marker
        const marker = this.markers.get(f.id);
        
        // Optimization: Cache visual properties to avoid expensive setIcon DOM operations
        const altColor = this.getAltitudeColor(altFt);
        const headingRound = Math.round(f.heading);
        const cacheKey = `${headingRound}_${altColor}_${isSelected}`;

        // Update coordinates only if changed
        const currentLatLng = marker.getLatLng();
        if (currentLatLng.lat !== f.lat || currentLatLng.lng !== f.lng) {
          marker.setLatLng([f.lat, f.lng]);
        }

        // Only rebuild DOM elements when visual state strictly changed
        if (marker._renderCacheKey !== cacheKey) {
          const icon = this.createPlaneIcon(f, isSelected);
          marker.setIcon(icon);
          marker._renderCacheKey = cacheKey;
        }
      } else {
        // Create new marker
        const icon = this.createPlaneIcon(f, isSelected);
        const marker = L.marker([f.lat, f.lng], { icon: icon }).addTo(this.map);
        
        // Initialize cache
        const altColor = this.getAltitudeColor(altFt);
        const headingRound = Math.round(f.heading);
        marker._renderCacheKey = `${headingRound}_${altColor}_${isSelected}`;
        
        // Marker click listener
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          this.onFlightSelected(f);
        });

        this.markers.set(f.id, marker);
      }
    });

    // Remove any markers that are no longer active (safely using Array.from to avoid iterator modification bugs)
    for (const [id, marker] of Array.from(this.markers.entries())) {
      if (!activeIds.has(id)) {
        this.map.removeLayer(marker);
        this.markers.delete(id);
      }
    }

    // Update trail polyline
    this.updateTrail(flights.find(f => f.id === selectedFlightId));
  }

  updateTrail(selectedFlight) {
    if (!selectedFlight) {
      this.trailPolyline.setLatLngs([]);
      return;
    }

    // Update coordinates and color
    this.trailPolyline.setLatLngs(selectedFlight.routeHistory);
    
    const color = selectedFlight.isEmergency ? '#ff2e63' : '#00f2fe';
    this.trailPolyline.setStyle({ color: color });
    
    // Re-add layer if needed to draw shadow glow
    const pathEl = this.trailPolyline.getElement();
    if (pathEl) {
      pathEl.style.filter = `drop-shadow(0 0 6px ${color})`;
    }
  }

  focusOnFlight(flight) {
    if (!flight) return;
    this.map.flyTo([flight.lat, flight.lng], 8, {
      animate: true,
      duration: 1.2
    });
  }

  focusOnAirport(airport) {
    if (!airport) return;
    this.map.flyTo([airport.lat, airport.lng], 9, {
      animate: true,
      duration: 1.5
    });
  }

  setUserLocationMarker(lat, lng) {
    // Remove old marker if exists
    if (this.userLocationMarker) {
      this.map.removeLayer(this.userLocationMarker);
    }

    // Create a pulsing dot for the user's location
    const userIcon = L.divIcon({
      html: `
        <div class="user-location-marker">
          <div class="user-location-pulse"></div>
          <div class="user-location-dot"></div>
        </div>
      `,
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    this.userLocationMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 })
      .addTo(this.map)
      .bindTooltip('Votre position', { permanent: false, direction: 'right' });
  }
}
