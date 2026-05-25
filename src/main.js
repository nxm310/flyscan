/* ==========================================================================
   FLYRADAR — MAIN COORDINATOR ENTRY POINT
   ========================================================================== */

import { AirspaceSimulator, AIRPORTS } from './simulation.js';
import { Radar3DController } from './radar3d.js';
import { ARController } from './ar.js';
import { UIController } from './ui.js';

// Global application state object
const appState = {
  simulation: null,
  radar3D: null,
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
    await sleep(450);
    updateProgress(35, "Génération de l'espace aérien en temps réel...");
    appState.simulation.initialize();

    // Step 3: Initialize Three.js 3D Radar Space
    await sleep(450);
    updateProgress(60, "Chargement du dôme radar 3D WebGL...");
    
    // Create Three.js 3D Radar controller
    appState.radar3D = new Radar3DController((flight) => {
      // Click selection callback on 3D flights
      if (flight) {
        appState.ui.selectFlight(flight);
      } else {
        appState.ui.deselectFlight();
      }
    });
    
    // Initialize 3D renderer and camera orbit mechanics
    appState.radar3D.appState = appState; // inject reference
    appState.radar3D.init();

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

    // Render initial flight vectors in 3D
    appState.radar3D.update3DAirspace(
      appState.simulation.flights, 
      null, 
      appState.filterCategory
    );

    // Step 6: Finalize load and fade splash screen
    await sleep(650);
    updateProgress(100, "Systèmes ADSB 3D synchronisés.");
    
    const splash = document.getElementById('splash-screen');
    splash.classList.add('fade-out');
    
    // Remove element after transition ends to avoid blocking interaction
    setTimeout(() => splash.remove(), 800);

    // Step 7: Launch simulation loops
    startSimulationLoops();
    
  } catch (err) {
    console.error("Flyradar initialization crash", err);
    statusText.innerText = "CRITICAL ERROR: Échec de l'initialisation WebGL";
    statusText.style.color = "var(--color-emergency)";
  }
}

function startSimulationLoops() {
  const dt = 1; // 1 second increments in simulation time

  // 1. Simulation movement tick loop (every 1 second)
  setInterval(() => {
    // Tick airspace physics
    appState.simulation.tick(dt);
    
    // Update Three.js 3D positions, altitude vectors, and flight trails
    appState.radar3D.update3DAirspace(
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
