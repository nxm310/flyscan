/* ==========================================================================
   FLYRADAR — MAIN COORDINATOR ENTRY POINT
   ========================================================================== */

import { AirspaceSimulator, AIRPORTS } from './simulation.js';
import { MapController } from './map.js';
import { ARController } from './ar.js';
import { UIController } from './ui.js';


// Global application state object
const appState = {
  simulation: null,
  map: null,
  radar3d: null,
  is3DMode: false,
  ar: null,
  ui: null,
  selectedFlight: null,
  filterCategory: 'all',
  soundMuted: false,
  userPos: null
};

// Safe Lucide initializer — waits until the library is loaded (it uses defer)
function initLucide() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  } else {
    setTimeout(initLucide, 50);
  }
}

window.addEventListener('load', () => {
  initLucide();
  startAppLoading();

  // Register Progressive Web App Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./public/sw.js')
      .then(reg => console.log('[FlyRadar PWA] Service Worker actif:', reg.scope))
      .catch(err => console.warn('[FlyRadar PWA] Échec Service Worker:', err));
  }
});


async function startAppLoading() {
  const progressBar = document.getElementById('splash-progress');
  const statusText = document.getElementById('splash-status');

  const updateProgress = (percent, text) => {
    progressBar.style.width = `${percent}%`;
    statusText.innerText = text;
  };

  try {
    // Step 1: Instantiate Airspace simulator
    updateProgress(15, "Instanciation du simulateur de vol...");
    appState.simulation = new AirspaceSimulator();
    
    // Step 2: Initialize Airspace flight vectors (Live network feeds VATSIM + IVAO + dense tactical airspace)
    await sleep(300);
    updateProgress(30, "Connexion aux flux radars mondiaux en direct...");
    appState.simulation.initialize();
    
    // Attempt real live vector fetch
    const liveResult = await appState.simulation.fetchAndApplyLiveStates(46.8, 2.5);
    if (liveResult.success) {
      updateProgress(50, `✅ ${liveResult.count} appareils actifs (${liveResult.liveCount} vols réels en direct)`);
    } else {
      updateProgress(50, "Simulation tactique enrichie activée.");
    }

    // Step 3: Initialize 2D Live Radar Map
    await sleep(300);
    updateProgress(65, "Chargement de la carte radar 2D...");
    
    appState.map = new MapController((flight) => {
      if (flight) {
        appState.ui.selectFlight(flight);
      } else {
        appState.ui.deselectFlight();
      }
    });
    
    appState.map.init(46.8, 2.5, 6);

    // Step 3b: Initialize 3D Tactical Radar (WebGL Three.js - Lazy loaded)
    const { Radar3DController } = await import('./radar3d.js');
    appState.radar3d = new Radar3DController((flight) => {
      if (flight) {
        appState.ui.selectFlight(flight);
      } else {
        appState.ui.deselectFlight();
      }
    });
    appState.radar3d.init();


    // Helper: synchronize visible flight markers, counts, and alerts to the current zoom view
    let moveTimeout = null;
    const syncVisibleView = () => {
      if (!appState.map) return;
      const visible = appState.map.updateMarkers(
        appState.simulation.flights, 
        appState.selectedFlight?.id, 
        appState.filterCategory
      );
      const activeEl = document.getElementById('stat-active-flights');
      if (activeEl) activeEl.innerText = visible.length;
      const squawkEl = document.getElementById('stat-active-squawks');
      if (squawkEl) squawkEl.innerText = visible.filter(f => f.isEmergency).length;

      const logoTag = document.querySelector('.logo-text .tag');
      if (logoTag && appState.simulation.mode === 'live') {
        logoTag.innerText = `DIRECT RÉSEAU (${visible.length})`;
      }

      // Update emergency alerts badge count for visible emergencies only
      const badge = document.getElementById('alerts-badge');
      if (badge) {
        const visibleAlerts = appState.simulation.alerts.filter(alt => {
          const fl = appState.simulation.flights.find(f => f.id === alt.flightId);
          return fl && appState.map.isFlightInView(fl);
        });
        badge.innerText = visibleAlerts.length;
        if (visibleAlerts.length > 0) {
          badge.classList.remove('hidden');
        } else {
          badge.classList.add('hidden');
        }
      }

      // If alerts sidebar is open, refresh to visible alerts
      const alertsSidebar = document.getElementById('alerts-sidebar');
      if (alertsSidebar && alertsSidebar.classList.contains('open')) {
        appState.ui.renderAlertsSidebar();
      }

      // If bottom tactical panel is open, refresh counts
      const tacticalPanel = document.getElementById('bottom-panel');
      if (tacticalPanel && tacticalPanel.classList.contains('open') && appState.ui.activeBottomTab === 'tactical') {
        appState.ui.renderTacticalAlertsPanel();
      }
    };

    appState.map.map.on('zoomend', syncVisibleView);
    appState.map.map.on('moveend', () => {
      syncVisibleView();
      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(async () => {
        const center = appState.map.map.getCenter();
        const result = await appState.simulation.fetchAndApplyLiveStates(center.lat, center.lng);
        if (result.success) {
          syncVisibleView();
          if (appState.is3DMode && appState.radar3d && appState.radar3d.isActive) {
            appState.radar3d.update3DAirspace(
              appState.simulation.flights, 
              appState.selectedFlight?.id, 
              appState.filterCategory
            );
          }
          const visibleNow = appState.map.getVisibleFlights(appState.simulation.flights, appState.filterCategory);
          appState.ui.showToast(`🛰️ Secteur calé : ${visibleNow.length} vols visibles (${result.liveCount} réels).`);
        }
      }, 800); // 800ms debounce to prevent API spam while dragging
    });


    // Step 4: Initialize Augmented Reality HUD
    await sleep(300);
    updateProgress(78, "Chargement du HUD Réalité Augmentée...");
    appState.ar = new ARController(appState);
    appState.ar.initElements();

    // Step 5: Initialize UI panels and sidebars listeners
    await sleep(300);
    updateProgress(90, "Lancement du tableau de bord tactique...");
    appState.ui = new UIController(appState);
    appState.ui.init();

    // Render initial flight vectors
    const initialVisible = appState.map.updateMarkers(
      appState.simulation.flights, 
      null, 
      appState.filterCategory
    );
    const activeEl = document.getElementById('stat-active-flights');
    if (activeEl) activeEl.innerText = initialVisible.length;
    const squawkEl = document.getElementById('stat-active-squawks');
    if (squawkEl) squawkEl.innerText = initialVisible.filter(f => f.isEmergency).length;

    // Step 6: Finalize load and fade splash screen
    await sleep(500);
    const isLive = appState.simulation.mode === 'live';
    updateProgress(100, isLive
      ? `📡 ${initialVisible.length} vols visibles en direct.`
      : "🔵 Simulation tactique synchronisée.");
    
    const logoTag = document.querySelector('.logo-text .tag');
    if (logoTag) {
      if (isLive) {
        logoTag.innerText = `DIRECT ADS-B (${initialVisible.length})`;
        logoTag.style.color = 'var(--color-primary)';
      } else {
        logoTag.innerText = 'SIMULATION ADS-B';
        logoTag.style.color = 'var(--color-secondary)';
      }
    }
    
    const splash = document.getElementById('splash-screen');
    splash.classList.add('fade-out');
    setTimeout(() => splash.remove(), 800);

    // Trigger real emergency alerts if any found at startup (only if in visible zoom view)
    if (isLive) {
      appState.simulation.alerts.forEach(alert => {
        const flight = appState.simulation.flights.find(f => f.id === alert.flightId);
        if (flight && appState.map.isFlightInView(flight)) {
          appState.ui.triggerSquawkToast(alert);
        }
      });
    }

    // Step 7: Launch simulation loops
    startSimulationLoops();
    
  } catch (err) {
    console.error("Flyradar initialization crash", err);
    document.getElementById('splash-status').innerText = "ERREUR CRITIQUE: Échec de l'initialisation";
    document.getElementById('splash-status').style.color = "var(--color-emergency)";
  }
}

function startSimulationLoops() {
  const dt = 1; // 1 second increments

  // 1. Movement tick loop (every 1 second)
  setInterval(() => {
    appState.simulation.tick(dt);
    
    const visibleFlights = appState.map.updateMarkers(
      appState.simulation.flights, 
      appState.selectedFlight?.id, 
      appState.filterCategory
    );

    // Update 3D radar airspace if active
    if (appState.is3DMode && appState.radar3d && appState.radar3d.isActive) {
      appState.radar3d.update3DAirspace(
        appState.simulation.flights, 
        appState.selectedFlight?.id, 
        appState.filterCategory
      );
    }


    // Update Live sidebar telemetry if a flight is selected
    if (appState.selectedFlight) {
      const latestFlightState = appState.simulation.flights.find(
        f => f.id === appState.selectedFlight.id
      );
      
      if (latestFlightState) {
        appState.ui.updateFlightDetailsPanel(latestFlightState);
      } else {
        appState.ui.deselectFlight();
        appState.ui.showToast("📡 Le vol suivi a quitté le secteur radar.");
      }
    }

    // Refresh live statistics overlays strictly for aircraft visible in current zoom view
    const activeEl = document.getElementById('stat-active-flights');
    if (activeEl) activeEl.innerText = visibleFlights.length;
    const squawkEl = document.getElementById('stat-active-squawks');
    if (squawkEl) squawkEl.innerText = visibleFlights.filter(f => f.isEmergency).length;

    // Refresh Airport Arrivals/Departures lists (only if sidebar is actually open to optimize CPU)
    const airportsSidebar = document.getElementById('airports-sidebar');
    if (airportsSidebar && airportsSidebar.classList.contains('open')) {
      appState.ui.updateAirportStatsPanel();
    }

  }, 1000);

  // 2. Live ADS-B Network sync loop (every 15 seconds for adsb.lol)
  setInterval(async () => {
    if (appState.simulation.mode === 'live') {
      const center = appState.map.map.getCenter();
      const result = await appState.simulation.fetchAndApplyLiveStates(center.lat, center.lng);
      
      const logoTag = document.querySelector('.logo-text .tag');
      const visibleFlights = appState.map ? appState.map.getVisibleFlights(appState.simulation.flights, appState.filterCategory) : [];
      if (result.success && logoTag) {
        logoTag.innerText = `DIRECT RÉSEAU (${visibleFlights.length})`;
        logoTag.style.color = 'var(--color-primary)';
        
        // Trigger any NEW real emergency alerts detected in refresh - ONLY IF VISIBLE IN VIEW
        appState.simulation.alerts
          .filter(a => a.isReal)
          .slice(0, 5)
          .forEach(alert => {
            const flight = appState.simulation.flights.find(f => f.id === alert.flightId);
            if (flight && appState.map.isFlightInView(flight)) {
              // Only trigger if not already shown (check by checking if banner is hidden)
              const banner = document.getElementById('emergency-banner');
              if (banner.classList.contains('hidden')) {
                appState.ui.triggerSquawkToast(alert);
              }
            }
          });
      } else if (!result.success) {
        console.warn('[ADS-B] Refresh failed, dead reckoning active');
      }
    }
  }, 15000);

  // NOTE: Fake random squawk alert loop REMOVED.
  // Only real squawk alerts from ADS-B data are shown.

  // 3. Ambient weather toast (every 60 seconds, only when NOT live)
  setInterval(() => {
    if (appState.simulation.mode !== 'live') {
      const airports = Object.values(AIRPORTS);
      const randomAirport = airports[Math.floor(Math.random() * airports.length)];
      if (randomAirport?.delayIndex > 5.0) {
        appState.ui.showToast(
          `⛈️ Météo difficile à ${randomAirport.city} (${randomAirport.code}). Retards modérés en cours.`
        );
      }
    }
  }, 60000);
}

// Helper utility: async sleep
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
