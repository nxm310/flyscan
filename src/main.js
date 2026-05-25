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
  soundMuted: false
};

// Safe Lucide initializer — waits until the library is loaded (it uses defer)
function initLucide() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  } else {
    // Retry after a short delay if not loaded yet
    setTimeout(initLucide, 50);
  }
}

window.addEventListener('load', () => {
  // All scripts (including deferred ones) are guaranteed loaded at window.load
  initLucide();

  // Begin loading sequence
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
    await sleep(450);
    updateProgress(35, "Connexion au réseau ADS-B réel...");
    appState.simulation.initialize();
    
    // Attempt real live vector fetch
    const liveSuccess = await appState.simulation.fetchAndApplyLiveStates();
    if (liveSuccess) {
      updateProgress(45, "Données ADS-B réelles synchronisées.");
    } else {
      updateProgress(45, "Serveur ADS-B saturé, activation du simulateur tactique.");
    }

    // Step 3: Initialize 2D Live Radar Map
    await sleep(450);
    updateProgress(60, "Chargement de la carte radar 2D...");
    
    // Create Leaflet 2D Radar controller
    appState.map = new MapController((flight) => {
      if (flight) {
        appState.ui.selectFlight(flight);
      } else {
        appState.ui.deselectFlight();
      }
    });
    
    // Initialize 2D map
    appState.map.init(46.8, 2.5, 6);

    // Step 4: Initialize Augmented Reality HUD
    await sleep(450);
    updateProgress(75, "Chargement du HUD Réalité Augmentée...");
    appState.ar = new ARController(appState);
    appState.ar.initElements();

    // Step 5: Initialize UI panels and sidebars listeners
    await sleep(450);
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
    await sleep(650);
    const isLive = appState.simulation.mode === 'live';
    updateProgress(100, isLive ? "Systèmes ADS-B réels connectés." : "Systèmes de simulation synchronisés.");
    
    const logoTag = document.querySelector('.logo-text .tag');
    if (logoTag) {
      logoTag.innerText = isLive ? "DIRECT ADS-B" : "SIMULATION ADS-B";
      logoTag.style.color = isLive ? "var(--color-primary)" : "var(--color-secondary)";
    }
    
    const splash = document.getElementById('splash-screen');
    splash.classList.add('fade-out');
    
    // Remove element after transition ends to avoid blocking interaction
    setTimeout(() => splash.remove(), 800);

    // Step 7: Launch simulation loops
    startSimulationLoops();
    
  } catch (err) {
    console.error("Flyradar initialization crash", err);
    statusText.innerText = "CRITICAL ERROR: Échec de l'initialisation de la carte";
    statusText.style.color = "var(--color-emergency)";
  }
}

function startSimulationLoops() {
  const dt = 1; // 1 second increments in simulation time

  // 1. Simulation movement tick loop (every 1 second)
  setInterval(() => {
    // Tick airspace physics
    appState.simulation.tick(dt);
    
    // Update 2D plane markers and trails
    appState.map.updateMarkers(
      appState.simulation.flights, 
      appState.selectedFlight?.id, 
      appState.filterCategory
    );

    // Update Live sidebar telemetry elements if selected flight changes
    if (appState.selectedFlight) {
      // Find latest state of selected flight
      const latestFlightState = appState.simulation.flights.find(
        f => f.id === appState.selectedFlight.id
      );
      
      if (latestFlightState) {
        appState.ui.updateFlightDetailsPanel(latestFlightState);
      } else {
        // Flight landed/left sector
        appState.ui.deselectFlight();
        appState.ui.showToast("Le vol suivi a atterri et quitté le radar.");
      }
    }

    // Refresh general live statistics overlays
    document.getElementById('stat-active-flights').innerText = appState.simulation.flights.length;
    document.getElementById('stat-active-squawks').innerText = appState.simulation.activeSquawks;

    // Refresh Airport Arrivals/Departures lists
    appState.ui.updateAirportStatsPanel();

  }, 1000);

  // 4. Live ADS-B Network sync loop (every 12 seconds to respect OpenSky rate limits)
  setInterval(async () => {
    if (appState.simulation.mode === 'live') {
      const center = appState.map.map.getCenter();
      const liveSuccess = await appState.simulation.fetchAndApplyLiveStates(center.lat, center.lng);
      
      const logoTag = document.querySelector('.logo-text .tag');
      if (logoTag) {
        if (liveSuccess) {
          logoTag.innerText = "DIRECT ADS-B";
          logoTag.style.color = "var(--color-primary)";
        } else {
          // Keep existing state, let it dead-reckon
          console.warn("Live API rate limit or network warning, dead reckoning active");
        }
      }
    }
  }, 12000);

  // 2. Emergency occurrence rolling loop (every 15 seconds)
  // Has 18% chance to declare a new SQUAWK emergency, adding tension and animation
  setInterval(() => {
    // Only roll if active squawks is low to maintain airspace readability
    if (appState.simulation.activeSquawks < 3 && Math.random() < 0.18) {
      const alert = appState.simulation.triggerRandomSquawkAlert();
      if (alert) {
        appState.ui.triggerSquawkToast(alert);
      }
    }
  }, 15000);

  // 3. Spontaneous ambient toast warnings (every 40 seconds)
  // Re-occurring messages to signify general weather fluctuations
  setInterval(() => {
    const randomAirport = Object.values(AIRPORTS)[
      Math.floor(Math.random() * Object.values(AIRPORTS).length)
    ];
    
    if (randomAirport.delayIndex > 4.5) {
      appState.ui.showToast(
        `Météo difficile à ${randomAirport.city} (${randomAirport.code}). Retards modérés en cours.`
      );
    }
  }, 40000);
}

// Helper utility: async sleep
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
