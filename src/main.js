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
    
    // Step 2: Initialize Airspace flight vectors (Try Live ADS-B first!)
    await sleep(300);
    updateProgress(30, "Connexion au réseau ADS-B (adsb.lol)...");
    appState.simulation.initialize(); // populate sim flights as background
    
    // Attempt real live vector fetch from adsb.lol
    const liveResult = await appState.simulation.fetchAndApplyLiveStates();
    if (liveResult.success) {
      updateProgress(50, `✅ ${liveResult.count} vols ADS-B réels — source: ${liveResult.source}`);
    } else {
      updateProgress(50, "Réseau ADS-B indisponible — simulation tactique activée.");
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
    appState.map.updateMarkers(
      appState.simulation.flights, 
      null, 
      appState.filterCategory
    );

    // Step 6: Finalize load and fade splash screen
    await sleep(500);
    const isLive = appState.simulation.mode === 'live';
    updateProgress(100, isLive
      ? `📡 ${appState.simulation.flights.length} vols ADS-B réels en direct.`
      : "🔵 Simulation tactique synchronisée.");
    
    const logoTag = document.querySelector('.logo-text .tag');
    if (logoTag) {
      if (isLive) {
        logoTag.innerText = `DIRECT ADS-B`;
        logoTag.style.color = 'var(--color-primary)';
      } else {
        logoTag.innerText = 'SIMULATION ADS-B';
        logoTag.style.color = 'var(--color-secondary)';
      }
    }
    
    const splash = document.getElementById('splash-screen');
    splash.classList.add('fade-out');
    setTimeout(() => splash.remove(), 800);

    // Trigger real emergency alerts if any found at startup
    if (isLive) {
      appState.simulation.alerts.forEach(alert => {
        appState.ui.triggerSquawkToast(alert);
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
    
    appState.map.updateMarkers(
      appState.simulation.flights, 
      appState.selectedFlight?.id, 
      appState.filterCategory
    );

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

    // Refresh live statistics overlays
    document.getElementById('stat-active-flights').innerText = appState.simulation.flights.length;
    document.getElementById('stat-active-squawks').innerText = appState.simulation.activeSquawks;

    // Refresh Airport Arrivals/Departures lists
    appState.ui.updateAirportStatsPanel();

  }, 1000);

  // 2. Live ADS-B Network sync loop (every 15 seconds for adsb.lol)
  setInterval(async () => {
    if (appState.simulation.mode === 'live') {
      const center = appState.map.map.getCenter();
      const result = await appState.simulation.fetchAndApplyLiveStates(center.lat, center.lng);
      
      const logoTag = document.querySelector('.logo-text .tag');
      if (result.success && logoTag) {
        logoTag.innerText = `DIRECT ADS-B (${result.count})`;
        logoTag.style.color = 'var(--color-primary)';
        
        // Trigger any NEW real emergency alerts detected in refresh
        appState.simulation.alerts
          .filter(a => a.isReal)
          .slice(0, 3)
          .forEach(alert => {
            // Only trigger if not already shown (check by checking if banner is hidden)
            const banner = document.getElementById('emergency-banner');
            if (banner.classList.contains('hidden')) {
              appState.ui.triggerSquawkToast(alert);
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
