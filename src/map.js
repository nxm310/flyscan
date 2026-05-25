/* ==========================================================================
   FLYRADAR — MAP CONTROLLER MODULE
   ========================================================================== */

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

    // Dark Matter tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
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
    
    // Custom DivIcon allowing rotation and pulse effects
    const htmlContent = `
      <div class="plane-marker-icon-wrapper" style="transform: rotate(${heading}deg);">
        <div class="plane-marker-pulse ${categoryClass}"></div>
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="${this.planeSvgPath}"/>
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
      const icon = this.createPlaneIcon(f, isSelected);

      if (this.markers.has(f.id)) {
        // Update existing marker
        const marker = this.markers.get(f.id);
        marker.setLatLng([f.lat, f.lng]);
        marker.setIcon(icon);
      } else {
        // Create new marker
        const marker = L.marker([f.lat, f.lng], { icon: icon }).addTo(this.map);
        
        // Marker click listener
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          this.onFlightSelected(f);
        });

        this.markers.set(f.id, marker);
      }
    });

    // Remove any markers that are no longer active
    for (const [id, marker] of this.markers.entries()) {
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
