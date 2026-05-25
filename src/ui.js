/* ==========================================================================
   FLYRADAR — USER INTERFACE CONTROLLER
   ========================================================================== */

import { AIRPORTS } from './simulation.js';

export class UIController {
  constructor(appState) {
    this.appState = appState; // Reference to core app state
    this.currentAirportCode = 'CDG';
    this.activeBottomTab = ''; // 'airports', 'history', 'tactical'
  }

  init() {
    this.registerEventListeners();
    this.updateAirportStatsPanel();
  }

  registerEventListeners() {
    // Left Sidebar: Close details
    document.getElementById('close-details-btn').addEventListener('click', () => {
      this.deselectFlight();
    });

    // Main Header: Filters
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const filter = btn.getAttribute('data-filter');
        this.appState.filterCategory = filter;
        this.appState.map.updateMarkers(this.appState.simulation.flights, this.appState.selectedFlight?.id, filter);
      });
    });

    // Main Header: Search
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    searchInput.addEventListener('input', (e) => {
      this.handleSearch(e.target.value);
    });

    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim().length > 0) {
        searchResults.classList.remove('hidden');
      }
    });

    // Click outside search to close
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.classList.add('hidden');
      }
    });

    // AR Toggle Button
    document.getElementById('ar-toggle-btn').addEventListener('click', () => {
      this.appState.ar.start();
    });

    // Left Sidebar: Center Map on selected flight
    document.getElementById('det-focus-btn').addEventListener('click', () => {
      if (this.appState.selectedFlight) {
        this.appState.map.focusOnFlight(this.appState.selectedFlight);
      }
    });

    // Left Sidebar: Simulate AR interception
    document.getElementById('det-simulate-ar-btn').addEventListener('click', () => {
      if (this.appState.selectedFlight) {
        this.appState.ar.start();
        // Calibrate yaw immediately onto the flight
        setTimeout(() => this.appState.ar.calibrateHeading(), 500);
      }
    });

    // Alerts Sidebar Toggler
    document.getElementById('alerts-toggle-btn').addEventListener('click', () => {
      this.toggleRightSidebar('alerts');
    });
    document.getElementById('close-alerts-btn').addEventListener('click', () => {
      this.toggleRightSidebar('');
    });

    // Airports Sidebar Toggler (Right)
    document.getElementById('close-airports-btn').addEventListener('click', () => {
      this.toggleRightSidebar('');
    });

    // Airport Tab Buttons
    const airportTabs = document.querySelectorAll('.airport-tab-btn');
    airportTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        airportTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const airportCode = tab.getAttribute('data-airport');
        this.currentAirportCode = airportCode;
        this.updateAirportStatsPanel();
        
        // Focus 3D camera sweep on the selected airport coordinate
        const apData = AIRPORTS[airportCode];
        if (apData) {
          this.appState.map.focusOnAirport(apData);
        }
      });
    });

    // Bottom Navigation Buttons
    document.getElementById('toggle-airports-btn').addEventListener('click', () => {
      this.toggleRightSidebar('airports');
    });

    document.getElementById('toggle-history-btn').addEventListener('click', () => {
      this.toggleBottomPanel('history');
    });

    document.getElementById('toggle-military-radar-btn').addEventListener('click', () => {
      this.toggleBottomPanel('tactical');
    });

    document.getElementById('close-bottom-panel-btn').addEventListener('click', () => {
      this.toggleBottomPanel('');
    });

    // Emergency Banner Buttons
    document.getElementById('emergency-focus-btn').addEventListener('click', () => {
      // Try each alert to find an active flight
      let foundFlight = null;
      for (const alert of this.appState.simulation.alerts) {
        foundFlight = this.appState.simulation.flights.find(f => f.id === alert.flightId);
        if (foundFlight) break;
      }
      if (foundFlight) {
        this.selectFlight(foundFlight);
        this.appState.map.focusOnFlight(foundFlight);
        document.getElementById('emergency-banner').classList.add('hidden');
      } else {
        this.showToast("Le vol en urgence a quitté le secteur radar.");
        document.getElementById('emergency-banner').classList.add('hidden');
      }
    });

    document.getElementById('emergency-close-btn').addEventListener('click', () => {
      document.getElementById('emergency-banner').classList.add('hidden');
    });

    // AR Exit Button
    document.getElementById('ar-exit-btn').addEventListener('click', () => {
      this.appState.ar.stop();
    });

    // AR Camera toggle
    document.getElementById('ar-toggle-camera-btn').addEventListener('click', () => {
      this.appState.ar.toggleCameraMode();
    });

    // AR Calibrate Gyro
    document.getElementById('ar-calibrate-btn').addEventListener('click', () => {
      this.appState.ar.calibrateHeading();
    });

    // AR Instructions close
    document.getElementById('ar-instructions-close-btn').addEventListener('click', () => {
      document.getElementById('ar-instructions-modal').classList.add('hidden');
    });

    // Geolocation click
    const geolocateBtn = document.getElementById('geolocate-btn');
    if (geolocateBtn) {
      geolocateBtn.addEventListener('click', () => {
        this.handleGeolocation();
      });
    }

    // Global mute sound button click
    const muteBtn = document.getElementById('mute-sound-btn');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        this.toggleSoundMute();
      });
    }

    // Emergency banner mute/silence button click
    const emgMuteBtn = document.getElementById('emergency-mute-btn');
    if (emgMuteBtn) {
      emgMuteBtn.addEventListener('click', () => {
        this.toggleSoundMute(true); // force mute
        document.getElementById('emergency-banner').classList.add('hidden');
      });
    }
  }

  // --- Internal helper: close sidebars without touching selected flight ---
  _closeSidebarsOnly() {
    const alertsSidebar = document.getElementById('alerts-sidebar');
    const airportsSidebar = document.getElementById('airports-sidebar');
    const bottomNavButtons = document.querySelectorAll('.bottom-nav-btn');
    alertsSidebar.classList.remove('open');
    airportsSidebar.classList.remove('open');
    bottomNavButtons.forEach(btn => btn.classList.remove('active'));
  }

  // --- Flight Selection & Sidebar UI ---
  selectFlight(flight) {
    this.appState.selectedFlight = flight;
    
    // Close right sidebars and bottom panel without triggering deselectFlight recursion
    this._closeSidebarsOnly();
    const panel = document.getElementById('bottom-collapsible-panel');
    if (panel) panel.classList.remove('open-panel');
    this.activeBottomTab = '';

    // Toggle Left Sidebar
    const sidebar = document.getElementById('flight-details-sidebar');
    sidebar.classList.remove('closed');
    
    if (flight.isEmergency) {
      sidebar.classList.add('emg');
    } else {
      sidebar.classList.remove('emg');
    }

    // Update 2D markers highlighting
    this.appState.map.updateMarkers(this.appState.simulation.flights, flight.id, this.appState.filterCategory);

    // Refresh details
    this.updateFlightDetailsPanel(flight);
  }

  deselectFlight() {
    this.appState.selectedFlight = null;
    document.getElementById('flight-details-sidebar').classList.add('closed');
    if (this.appState.map && this.appState.map.map) {
      this.appState.map.updateMarkers(this.appState.simulation.flights, null, this.appState.filterCategory);
    }
  }

  updateFlightDetailsPanel(flight) {
    if (!flight) return;

    // Logo placeholder
    document.getElementById('det-airline-logo').innerText = flight.airline.code;
    
    // Core Names
    document.getElementById('det-flight-number').innerText = flight.flightNumber;
    document.getElementById('det-airline-name').innerText = flight.airline.name;
    document.getElementById('det-flight-category').innerText = flight.category;

    // Route
    document.getElementById('det-origin-code').innerText = flight.origin.code;
    document.getElementById('det-origin-name').innerText = AIRPORTS[flight.origin.code]?.name || 'Aéroport Régional';
    document.getElementById('det-dest-code').innerText = flight.destination.code;
    document.getElementById('det-dest-name').innerText = AIRPORTS[flight.destination.code]?.name || 'Aéroport Régional';

    // Route slider bar progress
    const progressPercent = Math.round(flight.progress * 100);
    document.getElementById('det-route-progress-bar').style.left = `${progressPercent}%`;
    document.getElementById('det-progress-percent').innerText = `${progressPercent}%`;

    // Departure/Arrival Mock Schedules
    const depTime = flight.origin.code === 'CDG' ? 'En direct' : '10:45';
    const arrTime = flight.destination.code === 'CDG' ? 'Imminent' : '14:20';
    document.getElementById('det-departure-time').innerText = depTime;
    document.getElementById('det-arrival-time').innerText = arrTime;

    // Telemetry Teletext
    document.getElementById('det-altitude').innerText = `${Math.round(flight.altitude).toLocaleString()} ft`;
    
    const vRate = Math.round(flight.verticalSpeed);
    const vRateEl = document.getElementById('det-vertical-rate');
    if (vRate > 150) {
      vRateEl.innerText = `↑ +${vRate} ft/min`;
      vRateEl.className = 'sub-val text-teal';
    } else if (vRate < -150) {
      vRateEl.innerText = `↓ ${vRate} ft/min`;
      vRateEl.className = 'sub-val emergency-text';
    } else {
      vRateEl.innerText = `→ Croisière`;
      vRateEl.className = 'sub-val';
    }

    document.getElementById('det-speed').innerText = `${Math.round(flight.speed)} kts`;
    document.getElementById('det-speed-kmh').innerText = `${Math.round(flight.speed * 1.852)} km/h`;

    const heading = Math.round(flight.heading);
    document.getElementById('det-heading').innerText = `${heading}°`;
    
    let headingText = 'Nord';
    if (heading >= 22.5 && heading < 67.5) headingText = 'Nord-Est';
    else if (heading >= 67.5 && heading < 112.5) headingText = 'Est';
    else if (heading >= 112.5 && heading < 157.5) headingText = 'Sud-Est';
    else if (heading >= 157.5 && heading < 202.5) headingText = 'Sud';
    else if (heading >= 202.5 && heading < 247.5) headingText = 'Sud-Ouest';
    else if (heading >= 247.5 && heading < 292.5) headingText = 'Ouest';
    else if (heading >= 292.5 && heading < 337.5) headingText = 'Nord-Ouest';
    document.getElementById('det-heading-text').innerText = headingText;

    document.getElementById('det-squawk').innerText = flight.squawk;
    
    const squawkStatusEl = document.getElementById('det-squawk-status');
    if (flight.isEmergency) {
      squawkStatusEl.innerText = flight.emergencyType;
      squawkStatusEl.className = 'sub-val emergency-text';
    } else {
      squawkStatusEl.innerText = 'Normal / Actif';
      squawkStatusEl.className = 'sub-val text-teal';
    }

    // Metadata
    document.getElementById('det-aircraft-model').innerText = flight.aircraftModel;
    document.getElementById('det-aircraft-reg').innerText = flight.registration;
    document.getElementById('det-aircraft-country').innerText = flight.category === 'MILITARY' ? 'Tactique OTAN' : 'France / Europe';
    document.getElementById('det-coordinates').innerText = `${flight.lat.toFixed(4)}, ${flight.lng.toFixed(4)}`;
  }

  // --- Right Sidebars Navigation (Alerts / Airports) ---
  toggleRightSidebar(type) {
    // Close the left flight details sidebar without recursion
    this.deselectFlight();

    // Reset right sidebars
    this._closeSidebarsOnly();

    if (type === 'alerts') {
      document.getElementById('alerts-sidebar').classList.add('open');
      document.getElementById('alerts-toggle-btn').classList.add('active');
      this.renderAlertsSidebar();
      
      // Hide badge once read
      document.getElementById('alerts-badge').classList.add('hidden');
    } else if (type === 'airports') {
      document.getElementById('airports-sidebar').classList.add('open');
      document.getElementById('toggle-airports-btn').classList.add('active');
      this.updateAirportStatsPanel();
    }
  }

  renderAlertsSidebar() {
    const listEl = document.getElementById('alerts-list');
    listEl.innerHTML = '';

    const alerts = this.appState.simulation.alerts;

    if (alerts.length === 0) {
      listEl.innerHTML = '<div class="no-alerts">Aucune alerte active dans le secteur.</div>';
      return;
    }

    alerts.forEach(alt => {
      const card = document.createElement('div');
      const isSquawk77 = alt.type === 'SQUAWK 7700';
      card.className = `alert-card-item ${isSquawk77 ? 'emg' : ''}`;
      
      card.innerHTML = `
        <div class="alert-card-icon">
          <i data-lucide="${isSquawk77 ? 'alert-octagon' : 'wifi-off'}"></i>
        </div>
        <div class="alert-card-info">
          <h4>${alt.type} — ${alt.flightNumber}</h4>
          <p>${alt.message}</p>
          <div class="alert-card-time">${alt.timestamp}</div>
        </div>
      `;

      card.addEventListener('click', () => {
        const flight = this.appState.simulation.flights.find(f => f.id === alt.flightId);
        if (flight) {
          this.selectFlight(flight);
          this.appState.map.focusOnFlight(flight);
        } else {
          this.showToast("Le vol a quitté le secteur radar.");
        }
      });

      listEl.appendChild(card);
    });

    // Make lucide icons render
    lucide.createIcons();
  }

  updateAirportStatsPanel() {
    const code = this.currentAirportCode;
    const apData = AIRPORTS[code] || AIRPORTS.CDG;

    // Core Title
    document.getElementById('airport-fullname').innerText = apData.name;
    document.getElementById('airport-city').innerText = `${apData.city}, ${apData.country}`;

    // Temperature & wind
    document.getElementById('airport-temp').innerText = `${apData.temp}°C`;
    document.getElementById('airport-wind').innerText = `Vent: ${apData.windDir}° @ ${apData.windSpeed} km/h`;

    // Dynamic weather icon based on temperature
    const weatherIcon = document.getElementById('airport-weather-icon');
    if (apData.temp > 28) {
      weatherIcon.setAttribute('data-lucide', 'sun');
    } else if (apData.temp < 10) {
      weatherIcon.setAttribute('data-lucide', 'cloud-snow');
    } else {
      weatherIcon.setAttribute('data-lucide', 'cloud-sun');
    }

    // Delay Index Rating Gauge Circle animation
    // Circle length = 2 * PI * r = 2 * 3.14 * 40 = 251.2
    const dashoffset = 251.2 - (apData.delayIndex / 10.0) * 251.2;
    const gaugeCircle = document.getElementById('airport-delay-gauge');
    gaugeCircle.style.strokeDashoffset = dashoffset;
    
    // Delay index color coding
    if (apData.delayIndex > 5.0) {
      gaugeCircle.style.stroke = 'var(--color-emergency)';
    } else if (apData.delayIndex > 2.5) {
      gaugeCircle.style.stroke = 'var(--color-warning)';
    } else {
      gaugeCircle.style.stroke = 'var(--color-primary)';
    }

    document.getElementById('airport-delay-index').innerText = apData.delayIndex.toFixed(1);
    
    // Average delay values
    const arrDelay = Math.round(apData.delayIndex * 6);
    const depDelay = Math.round(apData.delayIndex * 8);
    document.getElementById('airport-arr-delay').innerText = `${arrDelay} min`;
    document.getElementById('airport-dep-delay').innerText = `${depDelay} min`;

    // arrivals/departures count matching flights list
    const arrivals = this.appState.simulation.flights.filter(f => f.destination.code === code);
    const departures = this.appState.simulation.flights.filter(f => f.origin.code === code);

    document.getElementById('airport-arrivals-count').innerText = arrivals.length;
    document.getElementById('airport-departures-count').innerText = departures.length;

    // Render arrivals rows
    const arrListEl = document.getElementById('airport-arrivals-list');
    arrListEl.innerHTML = '';
    
    if (arrivals.length === 0) {
      arrListEl.innerHTML = '<div class="no-alerts" style="padding:10px 0">Aucune arrivée imminente.</div>';
    } else {
      arrivals.slice(0, 3).forEach(arr => {
        const row = document.createElement('div');
        row.className = 'queue-flight-row';
        row.innerHTML = `
          <span class="q-flight-nr">${arr.flightNumber}</span>
          <span class="q-flight-route">Prov. ${arr.origin.code}</span>
          <span class="q-flight-time">Est. 13:40</span>
          <span class="q-flight-status ${arr.progress > 0.9 ? 'landed' : 'ontime'}">
            ${arr.progress > 0.9 ? 'FINALE' : 'RETARD'}
          </span>
        `;
        row.addEventListener('click', () => {
          this.selectFlight(arr);
          this.appState.map.focusOnFlight(arr);
        });
        arrListEl.appendChild(row);
      });
    }

    // Render departures rows
    const depListEl = document.getElementById('airport-departures-list');
    depListEl.innerHTML = '';
    
    if (departures.length === 0) {
      depListEl.innerHTML = '<div class="no-alerts" style="padding:10px 0">Aucun départ programmé.</div>';
    } else {
      departures.slice(0, 3).forEach(dep => {
        const row = document.createElement('div');
        row.className = 'queue-flight-row';
        row.innerHTML = `
          <span class="q-flight-nr">${dep.flightNumber}</span>
          <span class="q-flight-route">Dest. ${dep.destination.code}</span>
          <span class="q-flight-time">Prévu 12:15</span>
          <span class="q-flight-status ontime">MONTÉE</span>
        `;
        row.addEventListener('click', () => {
          this.selectFlight(dep);
          this.appState.map.focusOnFlight(dep);
        });
        depListEl.appendChild(row);
      });
    }

    lucide.createIcons();
  }

  // --- Bottom Collapsible Dashboard Panel ---
  toggleBottomPanel(tab) {
    const panel = document.getElementById('bottom-collapsible-panel');
    const bottomNavButtons = document.querySelectorAll('.bottom-nav-btn');

    // Reset styles
    panel.classList.remove('open-panel');
    bottomNavButtons.forEach(btn => btn.classList.remove('active'));

    // Close right sidebars without recursion through deselectFlight
    this._closeSidebarsOnly();

    if (tab === this.activeBottomTab || tab === '') {
      this.activeBottomTab = '';
      return;
    }

    this.activeBottomTab = tab;
    panel.classList.add('open-panel');

    if (tab === 'history') {
      document.getElementById('toggle-history-btn').classList.add('active');
      document.getElementById('bottom-panel-title').innerText = 'Historique des vols du secteur (24h)';
      this.renderHistoryPanel();
    } else if (tab === 'tactical') {
      document.getElementById('toggle-military-radar-btn').classList.add('active');
      document.getElementById('bottom-panel-title').innerText = 'Faisceau Tactique & Activité Militaire';
      this.renderTacticalAlertsPanel();
    }
  }

  renderHistoryPanel() {
    const bodyEl = document.getElementById('bottom-panel-content');
    bodyEl.innerHTML = '';

    const logs = this.appState.simulation.historicalLogs;

    const tableWrap = document.createElement('div');
    tableWrap.className = 'history-table-container';
    
    let tableHtml = `
      <div class="history-grid-header">
        <div>VOL</div>
        <div>COMPAGNIE / MODÈLE</div>
        <div>PROVENANCE / DEST.</div>
        <div>DURÉE</div>
        <div>DATE</div>
        <div>REPLAY</div>
      </div>
    `;

    logs.forEach(log => {
      tableHtml += `
        <div class="history-grid-row" data-id="${log.id}">
          <div class="hl-flight">${log.flightNumber}</div>
          <div>
            <div class="hl-company">${log.airlineName}</div>
            <div style="font-size:0.68rem;color:var(--color-text-muted)">${log.aircraftModel}</div>
          </div>
          <div class="hl-route">
            <span>${log.origin}</span>
            <i data-lucide="arrow-right" style="width:12px;height:12px"></i>
            <span>${log.destination}</span>
          </div>
          <div class="hl-duration">${log.duration}</div>
          <div class="hl-date">${log.date}</div>
          <div>
            <button class="hl-replay-btn" data-id="${log.id}">TRACER</button>
          </div>
        </div>
      `;
    });

    tableWrap.innerHTML = tableHtml;
    bodyEl.appendChild(tableWrap);

    // Event listener for replay buttons
    tableWrap.querySelectorAll('.hl-replay-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const log = logs.find(l => l.id === id);
        
        if (log) {
          // Focus 2D map on the route location quadrant
          this.appState.map.focusOnAirport({
            lat: log.routeHistory[0][0],
            lng: log.routeHistory[0][1]
          });
          
          this.showToast(`Tracé de trajectoire historique pour ${log.flightNumber}.`);
          this.toggleBottomPanel(''); // close panel
        }
      });
    });

    lucide.createIcons();
  }

  renderTacticalAlertsPanel() {
    const bodyEl = document.getElementById('bottom-panel-content');
    
    // Count stats
    const totalFlights = this.appState.simulation.flights.length;
    const milCount = this.appState.simulation.flights.filter(f => f.category === 'MILITARY').length;
    const prvCount = this.appState.simulation.flights.filter(f => f.category === 'PRIVATE').length;
    const emgCount = this.appState.simulation.activeSquawks;

    bodyEl.innerHTML = `
      <div class="tactical-grid">
        <div class="tactical-card">
          <h4>Vecteurs Militaires Actifs</h4>
          <div class="tactical-metric">
            <span class="val" style="color: var(--color-accent-military)">${milCount}</span>
            <span class="lbl">Unités en patrouille</span>
          </div>
          <p style="font-size:0.75rem;color:var(--color-text-secondary)">Surveillance radar active. Indicatifs tactiques COTAM et REACH opérationnels.</p>
        </div>
        <div class="tactical-card emg">
          <h4>Détresses Transpondeurs</h4>
          <div class="tactical-metric">
            <span class="val">${emgCount}</span>
            <span class="lbl">Urgence(s)</span>
          </div>
          <p style="font-size:0.75rem;color:var(--color-text-secondary)">Surveillance prioritaire du code Squawk 7700 (détresse) et 7600 (perte radio).</p>
        </div>
        <div class="tactical-card">
          <h4>Vols VIP / d'Affaires</h4>
          <div class="tactical-metric">
            <span class="val" style="color: var(--color-accent-private)">${prvCount}</span>
            <span class="lbl">Jets privés</span>
          </div>
          <p style="font-size:0.75rem;color:var(--color-text-secondary)">Liaisons privées actives. Opérateurs principaux : NetJets et Flexjet.</p>
        </div>
      </div>
    `;
  }

  // --- Real-time Notifications & Alerts System ---
  triggerSquawkToast(alert) {
    // Show Top Emergency Banner
    const banner = document.getElementById('emergency-banner');
    const textEl = document.getElementById('emergency-text');
    
    textEl.innerText = alert.message;
    banner.classList.remove('hidden');

    // Highlight alert button badge
    const badge = document.getElementById('alerts-badge');
    const badgeCount = this.appState.simulation.alerts.length;
    badge.innerText = badgeCount;
    badge.classList.remove('hidden');

    // Play a subtle neon blinking effect on alerts bell icon
    const bellBtn = document.getElementById('alerts-toggle-btn');
    bellBtn.classList.add('emergency-text');
    setTimeout(() => bellBtn.classList.remove('emergency-text'), 5000);

    // Dynamic audio beep warning (synthesized via Web Audio API for high-tech premium feel!)
    this.synthesizeWarningBeep();

    this.showToast(`🚨 NOUVELLE ALERTE : ${alert.flightNumber} déclaré en urgence !`);
    
    // Refresh alerts list if open
    if (document.getElementById('alerts-sidebar').classList.contains('open')) {
      this.renderAlertsSidebar();
    }
  }

  synthesizeWarningBeep() {
    // 1. Check if sound notifications are muted
    if (this.appState.soundMuted) return;

    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      const playBeepNode = (frequency, duration, delayTime) => {
        setTimeout(() => {
          // Double check mute status before playing delayed note
          if (this.appState.soundMuted) return;

          const oscNode = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();

          oscNode.connect(gainNode);
          gainNode.connect(audioCtx.destination);

          oscNode.type = 'sine';
          oscNode.frequency.setValueAtTime(frequency, audioCtx.currentTime);
          gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);

          oscNode.start();
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
          
          // CRITICAL MEMORY/AUDIO FIX: Always call stop explicitly to release the oscillator resource!
          oscNode.stop(audioCtx.currentTime + duration + 0.05);
        }, delayTime);
      };

      // Play high-tech triple-pulse warning beep sequence
      playBeepNode(880, 0.15, 0);
      playBeepNode(880, 0.15, 250);
      playBeepNode(1100, 0.3, 500);

    } catch (e) {
      console.warn("Web Audio API warning beeps not supported", e);
    }
  }

  toggleSoundMute(forceMute = null) {
    if (forceMute !== null) {
      this.appState.soundMuted = forceMute;
    } else {
      this.appState.soundMuted = !this.appState.soundMuted;
    }

    const muteBtn = document.getElementById('mute-sound-btn');
    if (muteBtn) {
      if (this.appState.soundMuted) {
        muteBtn.innerHTML = '<i data-lucide="volume-x"></i>';
        muteBtn.title = 'Activer les sons d\'alertes';
        muteBtn.classList.add('muted');
        this.showToast("Alertes sonores désactivées.");
      } else {
        muteBtn.innerHTML = '<i data-lucide="volume-2"></i>';
        muteBtn.title = 'Couper les sons d\'alertes';
        muteBtn.classList.remove('muted');
        this.showToast("Alertes sonores activées.");
      }
      // Re-trigger Lucide icons rendering for the swapped icon
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  }

  showToast(message) {
    // Custom floating clean toast
    const toast = document.createElement('div');
    toast.className = 'glass-panel';
    toast.style.position = 'fixed';
    toast.style.bottom = '85px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%) translateY(30px)';
    toast.style.padding = '10px 24px';
    toast.style.zIndex = '99999';
    toast.style.fontSize = '0.85rem';
    toast.style.fontWeight = '600';
    toast.style.borderLeft = '4px solid var(--color-primary)';
    toast.style.opacity = '0';
    toast.style.transition = 'all 0.35s cubic-bezier(0.19, 1, 0.22, 1)';
    toast.style.pointerEvents = 'none';
    toast.innerText = message;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 50);

    // Fade out and remove
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(-20px)';
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }

  // --- Interactive Search Controller ---
  handleSearch(query) {
    const resultsEl = document.getElementById('search-results');
    resultsEl.innerHTML = '';
    
    if (query.trim().length === 0) {
      resultsEl.classList.add('hidden');
      return;
    }

    const normQuery = query.toLowerCase().trim();
    const flights = this.appState.simulation.flights;

    // 1. Search for matching airports
    const matchedAirports = Object.values(AIRPORTS).filter(ap => {
      return ap.code.toLowerCase().includes(normQuery) ||
             ap.name.toLowerCase().includes(normQuery) ||
             ap.city.toLowerCase().includes(normQuery) ||
             ap.country.toLowerCase().includes(normQuery);
    });

    // 2. Search for flights (including expanded airport checks)
    const matchedFlights = flights.filter(f => {
      const origAp = AIRPORTS[f.origin.code];
      const destAp = AIRPORTS[f.destination.code];
      
      return f.flightNumber.toLowerCase().includes(normQuery) ||
             f.airline.name.toLowerCase().includes(normQuery) ||
             f.aircraftModel.toLowerCase().includes(normQuery) ||
             f.origin.code.toLowerCase().includes(normQuery) ||
             f.destination.code.toLowerCase().includes(normQuery) ||
             (origAp && (origAp.name.toLowerCase().includes(normQuery) || origAp.city.toLowerCase().includes(normQuery))) ||
             (destAp && (destAp.name.toLowerCase().includes(normQuery) || destAp.city.toLowerCase().includes(normQuery)));
    });

    resultsEl.classList.remove('hidden');

    if (matchedAirports.length === 0 && matchedFlights.length === 0) {
      resultsEl.innerHTML = '<div class="search-no-results">Aucun résultat ne correspond dans le secteur.</div>';
      return;
    }

    // Render airports matching the query
    matchedAirports.slice(0, 3).forEach(ap => {
      const div = document.createElement('div');
      div.className = 'search-item';
      
      div.innerHTML = `
        <div class="search-item-left">
          <span class="search-item-title" style="color: var(--color-secondary)"><i data-lucide="building-2" style="width:12px;height:12px;display:inline-block;margin-right:5px"></i>${ap.name} (${ap.code})</span>
          <span class="search-item-sub">${ap.city}, ${ap.country} — Index retard: ${ap.delayIndex}</span>
        </div>
        <span class="search-item-badge" style="color: var(--color-secondary); border-color: rgba(79, 172, 254, 0.2)">AÉROPORT</span>
      `;

      div.addEventListener('click', () => {
        this.currentAirportCode = ap.code;
        this.updateAirportStatsPanel();
        
        // Active airports panel right sidebar
        this.toggleRightSidebar('airports');
        
        // Highlight active airport tab button in sidebar
        const tabs = document.querySelectorAll('.airport-tab-btn');
        tabs.forEach(t => {
          if (t.getAttribute('data-airport') === ap.code) t.classList.add('active');
          else t.classList.remove('active');
        });

        this.appState.map.focusOnAirport(ap);
        resultsEl.classList.add('hidden');
        document.getElementById('search-input').value = '';
      });

      resultsEl.appendChild(div);
    });

    // Render flights matching the query
    matchedFlights.slice(0, 5).forEach(f => {
      const div = document.createElement('div');
      div.className = 'search-item';
      
      const catClass = f.category === 'MILITARY' ? 'mil' : (f.category === 'PRIVATE' ? 'prv' : 'civ');
      const catLabel = f.category === 'MILITARY' ? 'MILITAIRE' : (f.category === 'PRIVATE' ? 'PRIVÉ' : 'CIVIL');

      div.innerHTML = `
        <div class="search-item-left">
          <span class="search-item-title">${f.flightNumber} — ${f.airline.name}</span>
          <span class="search-item-sub">${f.aircraftModel} (${f.origin.code} ✈ ${f.destination.code})</span>
        </div>
        <span class="search-item-badge ${catClass}">${catLabel}</span>
      `;

      div.addEventListener('click', () => {
        this.selectFlight(f);
        this.appState.map.focusOnFlight(f);
        resultsEl.classList.add('hidden');
        document.getElementById('search-input').value = '';
      });

      resultsEl.appendChild(div);
    });

    lucide.createIcons();
  }

  handleGeolocation() {
    if (!navigator.geolocation) {
      this.showToast("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    // Visual feedback: animate the geolocate button
    const geoBtn = document.getElementById('geolocate-btn');
    if (geoBtn) geoBtn.classList.add('loading');
    this.showToast("📡 Accès GPS en cours...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        if (geoBtn) geoBtn.classList.remove('loading');

        // 1. Place a "you are here" marker on the map
        this.appState.map.setUserLocationMarker(latitude, longitude);

        // 2. Center 2D Map on user position
        this.appState.map.map.flyTo([latitude, longitude], 8, { animate: true, duration: 1.5 });

        // 3. Try to fetch live ADS-B data around user location first
        this.showToast("🛰️ Téléchargement des vols ADS-B autour de vous...");
        const liveSuccess = await this.appState.simulation.fetchAndApplyLiveStates(latitude, longitude);

        if (liveSuccess) {
          this.showToast(`✅ ${this.appState.simulation.flights.length} vols ADS-B réels détectés à proximité !`);
          const logoTag = document.querySelector('.logo-text .tag');
          if (logoTag) {
            logoTag.innerText = 'DIRECT ADS-B';
            logoTag.style.color = 'var(--color-primary)';
          }
        } else {
          // Fallback: generate simulated airspace around user
          this.appState.simulation.regenerateAirspaceAround(latitude, longitude);
          this.showToast("📡 Espace aérien simulé autour de votre position.");
        }

        // 4. Update the 2D plane markers and trails
        this.appState.map.updateMarkers(
          this.appState.simulation.flights,
          null,
          this.appState.filterCategory
        );
      },
      (error) => {
        if (geoBtn) geoBtn.classList.remove('loading');
        console.error("Geolocation error", error);
        let msg = "Impossible d'obtenir votre position GPS.";
        if (error.code === 1) msg = "Accès GPS refusé. Vérifiez les permissions du navigateur.";
        else if (error.code === 3) msg = "Délai GPS dépassé. Réessayez dans un moment.";
        this.showToast(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }
}
