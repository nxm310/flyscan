/* ==========================================================================
   FLYRADAR — MAIN COORDINATOR ENTRY POINT
   ========================================================================== */

import './style.css';
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
  filterCategory: 'all'
};

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons on start
  lucide.createIcons();

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
    
    // Step 2: Initialize Airspace flight vectors
    await sleep(400);
    updateProgress(35, "Génération de l'espace aérien en temps réel...");
    appState.simulation.initialize();

    // Step 3: Initialize Interactive Leaflet Map
    await sleep(400);
    updateProgress(55, "Chargement des cartes radar tactiques...");
    
    // Create map controller
    appState.map = new MapController((flight) => {
      // Click callback on map flights
      if (flight) {
        appState.ui.selectFlight(flight);
      } else {
        appState.ui.deselectFlight();
      }
    });
    
    // Focus around central France/Europe coordinates (Paris hubs)
    appState.map.init(46.8, 2.5, 6);

    // Step 4: Initialize Augmented Reality HUD
    await sleep(400);
    updateProgress(75, "Chargement du HUD Réalité Augmentée...");
    appState.ar = new ARController(appState);
    appState.ar.initElements();

    // Step 5: Initialize UI panels and sidebars listeners
    await sleep(400);
    updateProgress(90, "Lancement du tableau de bord...");
    appState.ui = new UIController(appState);
    appState.ui.init();

    // Render initial flight markers
    appState.map.updateMarkers(
      appState.simulation.flights, 
      null, 
      appState.filterCategory
    );

    // Step 6: Finalize load and fade splash screen
    await sleep(600);
    updateProgress(100, "Systèmes ADSB synchronisés.");
    
    const splash = document.getElementById('splash-screen');
    splash.classList.add('fade-out');
    
    // Remove element after transition ends to avoid blocking interaction
    setTimeout(() => splash.remove(), 800);

    // Step 7: Launch simulation loops
    startSimulationLoops();
    
  } catch (err) {
    console.error("Flyradar initialization crash", err);
    statusText.innerText = "CRITICAL ERROR: Échec de l'ADS-B";
    statusText.style.color = "var(--color-emergency)";
  }
}

function startSimulationLoops() {
  const dt = 1; // 1 second increments in simulation time

  // 1. Simulation movement tick loop (every 1 second)
  setInterval(() => {
    // Tick airspace physics
    appState.simulation.tick(dt);
    
    // Update map positions
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
