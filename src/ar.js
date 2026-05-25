/* ==========================================================================
   FLYRADAR — AUGMENTED REALITY (AR) MODULE
   ========================================================================== */

import { getDistance, getBearing } from './simulation.js';

export class ARController {
  constructor(appState) {
    this.appState = appState; // Reference to core app state
    this.isActive = false;
    
    // Camera Stream
    this.videoEl = null;
    this.stream = null;
    this.usePhysicalCamera = false;
    
    // Canvas graphics
    this.canvas = null;
    this.ctx = null;
    this.animationFrameId = null;
    
    // Celestial / virtual sky simulation elements
    this.stars = [];
    this.clouds = [];
    this.cloudsDriftOffset = 0;
    
    // Orientation angles (in degrees)
    this.yaw = 0;   // Heading / Azimuth (0-360)
    this.pitch = 15; // Elevation (-90 to +90)
    
    // Calibration offset for gyroscope
    this.yawOffset = 0;
    
    // Mouse/Touch Drag state
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.startYaw = 0;
    this.startPitch = 0;
    
    // Camera field of view
    this.fovH = 65; // Horizontal Field of View (degrees)
    this.fovV = 45; // Vertical Field of View (degrees)
  }

  initElements() {
    this.videoEl = document.getElementById('ar-video');
    this.canvas = document.getElementById('ar-sky-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    // Generate virtual sky assets
    this.generateSkyAssets();
    
    // Set up dragging listeners for virtual sky
    this.setupInteractionListeners();
    
    // Set up gyroscope listeners
    this.setupSensorListeners();
  }

  resizeCanvas() {
    if (this.canvas) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  }

  generateSkyAssets() {
    // Twinckling stars
    this.stars = [];
    for (let i = 0; i < 150; i++) {
      this.stars.push({
        x: Math.random() * 360, // Azimuth 0-360
        y: Math.random() * 90,  // Elevation 0-90 (sky dome)
        size: 0.5 + Math.random() * 1.5,
        twinkleSpeed: 0.02 + Math.random() * 0.05,
        phase: Math.random() * Math.PI
      });
    }

    // Drifting clouds
    this.clouds = [];
    for (let i = 0; i < 8; i++) {
      this.clouds.push({
        azimuth: Math.random() * 360,
        elevation: 10 + Math.random() * 40,
        width: 150 + Math.random() * 250,
        height: 40 + Math.random() * 60,
        speed: 0.02 + Math.random() * 0.05,
        opacity: 0.15 + Math.random() * 0.2
      });
    }
  }

  setupInteractionListeners() {
    // Touch/Mouse Drag to pan simulated sky
    const onStart = (clientX, clientY) => {
      this.isDragging = true;
      this.startX = clientX;
      this.startY = clientY;
      this.startYaw = this.yaw;
      this.startPitch = this.pitch;
    };

    const onMove = (clientX, clientY) => {
      if (!this.isDragging) return;
      
      const dx = clientX - this.startX;
      const dy = clientY - this.startY;
      
      // Map pixels to angles (rough mapping: 10px = 1deg)
      const yawSensitivity = 0.15;
      const pitchSensitivity = 0.15;
      
      this.yaw = (this.startYaw - dx * yawSensitivity + 360) % 360;
      this.pitch = Math.max(-85, Math.min(85, this.startPitch + dy * pitchSensitivity));
    };

    const onEnd = () => {
      this.isDragging = false;
    };

    this.canvas.addEventListener('mousedown', (e) => onStart(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', onEnd);

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        onStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    });
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    });
    window.addEventListener('touchend', onEnd);
  }

  setupSensorListeners() {
    // Accelerometer & Gyroscope
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', (event) => {
        if (!this.isActive) return;
        
        // On iOS, permission for DeviceOrientation is requested in UI interaction
        // Check for WebKit compass heading (iOS Safari exclusive for real magnetic North)
        let heading = null;
        if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
          heading = event.webkitCompassHeading;
        } else if (event.alpha !== null) {
          // Android/Standard: 360 - alpha maps it to compass clockwise heading
          heading = (360 - event.alpha) % 360;
        }
        
        if (heading !== null) {
          document.getElementById('ar-gyro-status').innerText = 'ACTIF';
          document.getElementById('ar-gyro-status').classList.add('text-teal');
          
          // Determine yaw from heading (compensating calibration offset)
          this.yaw = (heading + this.yawOffset + 360) % 360;
          
          // Determine pitch from beta tilt
          // Standard vertical elevation: when holding phone upright beta is around 70-90
          this.pitch = Math.max(-85, Math.min(85, event.beta - 60));
        }
      }, true);
    }
  }

  calibrateHeading() {
    // Calibrate virtual compass offset based on active selected flight or default north
    const userPos = this.appState.userPos || { lat: 48.86, lng: 2.35 };
    const uLat = userPos.lat;
    const uLng = userPos.lng;

    if (this.appState.selectedFlight) {
      const f = this.appState.selectedFlight;
      const fBearing = getBearing(uLat, uLng, f.lat, f.lng);
      
      // Adjust offset so current looking yaw matches selected flight bearing
      this.yawOffset = (fBearing - this.yaw + 360) % 360;
      this.yaw = fBearing;
      
      this.appState.ui.showToast("Radar aligné sur la cible sélectionnée !");
    } else {
      this.yawOffset = (0 - this.yaw + 360) % 360;
      this.yaw = 0;
      this.appState.ui.showToast("Boussole réalignée sur le Nord.");
    }
  }

  async startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.appState.ui.showToast("Caméra physique indisponible (HTTPS requis). Mode virtuel activé.");
      this.usePhysicalCamera = false;
      this.videoEl.classList.add('hidden');
      document.getElementById('ar-mode-type').innerText = 'VIRTUEL';
      document.getElementById('ar-mode-type').className = 'value text-teal';
      return;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      this.videoEl.srcObject = this.stream;
      this.videoEl.classList.remove('hidden');
      this.usePhysicalCamera = true;
      document.getElementById('ar-mode-type').innerText = 'PHYSIQUE';
      document.getElementById('ar-mode-type').className = 'value text-cyan';
      this.appState.ui.showToast("Flux caméra AR connecté.");
    } catch (err) {
      console.warn("Camera access denied or failed", err);
      this.appState.ui.showToast("Accès caméra refusé. Utilisation du simulateur céleste.");
      this.usePhysicalCamera = false;
      this.videoEl.classList.add('hidden');
      document.getElementById('ar-mode-type').innerText = 'VIRTUEL';
      document.getElementById('ar-mode-type').className = 'value text-teal';
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoEl) {
      this.videoEl.srcObject = null;
    }
    this.usePhysicalCamera = false;
  }

  toggleCameraMode() {
    if (this.usePhysicalCamera) {
      this.stopCamera();
      this.videoEl.classList.add('hidden');
      this.usePhysicalCamera = false;
      document.getElementById('ar-mode-type').innerText = 'VIRTUEL';
      document.getElementById('ar-mode-type').className = 'value text-teal';
      this.appState.ui.showToast("Caméra désactivée. Mode dôme céleste.");
    } else {
      this.startCamera();
    }
  }

  async requestDeviceOrientationPermission() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permissionState = await DeviceOrientationEvent.requestPermission();
        if (permissionState === 'granted') {
          document.getElementById('ar-gyro-status').innerText = 'ACTIF';
          document.getElementById('ar-gyro-status').classList.add('text-teal');
          this.setupSensorListeners();
          this.appState.ui.showToast("Capteurs gyroscopiques iOS activés !");
        } else {
          document.getElementById('ar-gyro-status').innerText = 'INACTIF';
          document.getElementById('ar-gyro-status').classList.remove('text-teal');
          this.appState.ui.showToast("Permission gyroscopique refusée.");
        }
      } catch (error) {
        console.error("DeviceOrientation permission error", error);
        this.appState.ui.showToast("Erreur d'activation des capteurs.");
      }
    } else {
      // Non-iOS or standard device orientation support
      this.setupSensorListeners();
    }
  }

  start() {
    this.isActive = true;
    document.getElementById('ar-overlay').classList.remove('hidden');
    
    // Request permission for iOS gyroscope / sensors
    this.requestDeviceOrientationPermission();
    
    // Start camera stream
    this.startCamera();
    
    // Run canvas animation tick
    this.tick();
  }

  stop() {
    this.isActive = false;
    document.getElementById('ar-overlay').classList.add('hidden');
    
    // Stop camera
    this.stopCamera();
    
    // Cancel animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  tick() {
    if (!this.isActive) return;
    
    // Draw Simulated Sky / overlays
    this.drawSky();
    
    // Render Compass tapes and target overlays
    this.updateHUDValues();
    this.projectHUDTargets();
    
    this.animationFrameId = requestAnimationFrame(() => this.tick());
  }

  drawSky() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.ctx.clearRect(0, 0, w, h);
    
    // If physical camera active, the video stream is under the canvas, so canvas remains fully transparent except virtual overlays.
    if (this.usePhysicalCamera) {
      // Draw minimal radar grids directly on top of video feed!
      this.drawRadarGrid(w, h);
      return;
    }

    // DRAW FULL CELESTIAL BACKGROUND (when camera inactive)
    
    // 1. Deep space sky dome gradient
    const skyGrad = this.ctx.createRadialGradient(
      w / 2, h / 2 + (this.pitch * 3), 
      h * 0.1, 
      w / 2, h / 2 + (this.pitch * 3), 
      w * 0.8
    );
    skyGrad.addColorStop(0, '#0f172e');
    skyGrad.addColorStop(0.5, '#070a14');
    skyGrad.addColorStop(1, '#020306');
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, w, h);

    // 2. Stars
    this.ctx.fillStyle = '#ffffff';
    this.stars.forEach(star => {
      // project celestial spherical coordinates to current looking viewport
      const relYaw = (star.x - this.yaw + 360) % 360;
      const relPitch = star.y - this.pitch;
      
      const x = w/2 + (relYaw > 180 ? relYaw - 360 : relYaw) * (w / this.fovH);
      const y = h/2 - relPitch * (h / this.fovV);
      
      if (x >= 0 && x <= w && y >= 0 && y <= h) {
        // twinkle
        star.phase += star.twinkleSpeed;
        const alpha = 0.2 + Math.abs(Math.sin(star.phase)) * 0.8;
        this.ctx.globalAlpha = alpha;
        
        this.ctx.beginPath();
        this.ctx.arc(x, y, star.size, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
    this.ctx.globalAlpha = 1.0;

    // 3. Drifting Clouds
    this.cloudsDriftOffset += 0.02;
    this.clouds.forEach(cloud => {
      const currentAzimuth = (cloud.azimuth + this.cloudsDriftOffset * cloud.speed) % 360;
      const relYaw = (currentAzimuth - this.yaw + 360) % 360;
      const relPitch = cloud.elevation - this.pitch;
      
      const x = w/2 + (relYaw > 180 ? relYaw - 360 : relYaw) * (w / this.fovH);
      const y = h/2 - relPitch * (h / this.fovV);
      
      if (x >= -cloud.width && x <= w + cloud.width && y >= -cloud.height && y <= h + cloud.height) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.globalAlpha = cloud.opacity;
        
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, cloud.width, cloud.height, 0, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
    this.ctx.globalAlpha = 1.0;

    // 4. Ground/Horizon grid layer
    this.drawHorizonGrid(w, h);

    // 5. Radar grid lines
    this.drawRadarGrid(w, h);
  }

  drawHorizonGrid(w, h) {
    const horizonY = h/2 + this.pitch * (h / this.fovV);
    
    // Draw horizon glowing separator line
    if (horizonY >= 0 && horizonY <= h) {
      this.ctx.strokeStyle = 'rgba(0, 242, 254, 0.25)';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.moveTo(0, horizonY);
      this.ctx.lineTo(w, horizonY);
      this.ctx.stroke();

      // Ground green grid perspective
      this.ctx.fillStyle = 'rgba(0, 255, 102, 0.03)';
      this.ctx.fillRect(0, horizonY, w, h - horizonY);
    }
  }

  drawRadarGrid(w, h) {
    this.ctx.strokeStyle = 'rgba(0, 242, 254, 0.04)';
    this.ctx.lineWidth = 1;
    
    // concentric rings (elevation lines)
    for (let el = 15; el < 90; el += 15) {
      const relPitch = el - this.pitch;
      const y = h/2 - relPitch * (h / this.fovV);
      
      if (y >= 0 && y <= h) {
        this.ctx.beginPath();
        this.ctx.arc(w/2, h/2 + (this.pitch * (h / this.fovV)), Math.max(50, (90 - el) * 10), 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Add label
        this.ctx.fillStyle = 'rgba(0, 242, 254, 0.2)';
        this.ctx.font = '8px Space Mono';
        this.ctx.fillText(`${el}° EL`, w/2 + 5, y - 4);
      }
    }
  }

  updateHUDValues() {
    // 1. Top compass heading digits
    const roundedHeading = Math.round(this.yaw);
    let headingStr = String(roundedHeading).padStart(3, '0') + '° ';
    
    // Cardinal labels
    if (this.yaw >= 337.5 || this.yaw < 22.5) headingStr += 'N';
    else if (this.yaw >= 22.5 && this.yaw < 67.5) headingStr += 'NE';
    else if (this.yaw >= 67.5 && this.yaw < 112.5) headingStr += 'E';
    else if (this.yaw >= 112.5 && this.yaw < 157.5) headingStr += 'SE';
    else if (this.yaw >= 157.5 && this.yaw < 202.5) headingStr += 'S';
    else if (this.yaw >= 202.5 && this.yaw < 247.5) headingStr += 'SO';
    else if (this.yaw >= 247.5 && this.yaw < 292.5) headingStr += 'O';
    else headingStr += 'NO';
    
    document.getElementById('ar-compass-heading').innerText = headingStr;

    // 2. Compass Tape movement
    const tapeEl = document.getElementById('ar-compass-tape');
    tapeEl.innerHTML = '';
    
    const w = tapeEl.clientWidth;
    // We render ticks from (yaw - 30) to (yaw + 30)
    const viewRange = 30;
    
    for (let deg = Math.floor(this.yaw - viewRange); deg <= Math.ceil(this.yaw + viewRange); deg++) {
      const realDeg = (deg + 360) % 360;
      
      if (realDeg % 5 === 0) {
        const offsetPercent = ((deg - this.yaw) / (viewRange * 2)) * w + w/2;
        const tick = document.createElement('div');
        tick.className = `compass-tick ${realDeg % 10 === 0 ? 'major' : 'minor'}`;
        tick.style.left = `${offsetPercent}px`;
        
        if (realDeg % 10 === 0) {
          const lbl = document.createElement('span');
          lbl.className = 'compass-tick-lbl';
          
          if (realDeg === 0) lbl.innerText = 'N';
          else if (realDeg === 90) lbl.innerText = 'E';
          else if (realDeg === 180) lbl.innerText = 'S';
          else if (realDeg === 270) lbl.innerText = 'O';
          else lbl.innerText = realDeg;
          
          tick.appendChild(lbl);
        }
        tapeEl.appendChild(tick);
      }
    }

    // 3. Pitch scale updates
    const pitchValEl = document.getElementById('ar-pitch-angle');
    pitchValEl.innerText = `${Math.round(this.pitch)}°`;
    
    const pitchTapeEl = document.getElementById('ar-pitch-tape');
    pitchTapeEl.innerHTML = '';
    
    const h = pitchTapeEl.clientHeight;
    const pRange = 20; // tick range
    for (let pDeg = Math.floor(this.pitch - pRange); pDeg <= Math.ceil(this.pitch + pRange); pDeg++) {
      if (pDeg >= -85 && pDeg <= 85 && pDeg % 5 === 0) {
        const offsetPx = ((this.pitch - pDeg) / (pRange * 2)) * h + h/2;
        const pTick = document.createElement('div');
        pTick.className = `pitch-tick ${pDeg % 10 === 0 ? 'major' : ''}`;
        pTick.style.top = `${offsetPx}px`;
        
        if (pDeg % 10 === 0) {
          const pLbl = document.createElement('span');
          pLbl.className = 'pitch-tick-lbl';
          pLbl.innerText = `${pDeg}`;
          pTick.appendChild(pLbl);
        }
        pitchTapeEl.appendChild(pTick);
      }
    }
  }

  projectHUDTargets() {
    const container = document.getElementById('ar-targets-container');
    container.innerHTML = ''; // Clear target overlays
    
    const w = this.canvas.width;
    const h = this.canvas.height;
    
    // Observer coordinates (Simulated center around CDG, or real GPS location)
    const userPos = this.appState.userPos || { lat: 48.86, lng: 2.35 };
    const uLat = userPos.lat;
    const uLng = userPos.lng;
    
    let targetsVisible = 0;
    
    this.appState.simulation.flights.forEach(f => {
      // Calculate distance in km
      const distance = getDistance(uLat, uLng, f.lat, f.lng);
      
      // Limit AR scope to planes within 180km for realism
      if (distance > 180) return;
      
      // 1. Calculate azimuth bearing to the aircraft
      const fAzimuth = getBearing(uLat, uLng, f.lat, f.lng);
      
      // 2. Calculate elevation pitch to the aircraft
      const distanceM = distance * 1000;
      const altM = f.altitude * 0.3048; // ft to meters
      const fElevation = Math.atan2(altM, distanceM) * 180 / Math.PI;
      
      // 3. Check if target lies within field of view
      let relYaw = (fAzimuth - this.yaw + 360) % 360;
      if (relYaw > 180) relYaw -= 360; // range from -180 to 180
      
      const relPitch = fElevation - this.pitch;
      
      // If plane is within horizontal and vertical FOV limits
      if (Math.abs(relYaw) < this.fovH / 2 && Math.abs(relPitch) < this.fovV / 2) {
        targetsVisible++;
        
        // Calculate Canvas coordinates
        const x = w/2 + relYaw * (w / this.fovH);
        const y = h/2 - relPitch * (h / this.fovV);
        
        // Render target glassmorphic box card
        const card = document.createElement('div');
        const emgClass = f.isEmergency ? 'emg' : '';
        card.className = `ar-target-card ${emgClass}`;
        card.style.left = `${x}px`;
        card.style.top = `${y}px`;
        
        const airlineCode = f.airline.code;
        const modelShort = f.aircraftModel.split(' ')[0] + ' ' + (f.aircraftModel.split(' ')[1] || '');
        
        card.innerHTML = `
          <div class="ar-target-marker ${emgClass}"></div>
          <div class="ar-target-panel">
            <div class="flight-nr ${f.isEmergency ? 'emergency-text' : 'text-teal'}">${f.flightNumber}</div>
            <div class="plane-model">${f.airline.name} / ${modelShort}</div>
            <div class="route">${f.origin.code} <i data-lucide="arrow-right" style="width:10px;height:10px;vertical-align:middle;display:inline-block"></i> ${f.destination.code}</div>
            <div class="telemetry">
              <span class="lbl-alt">ALT ${Math.round(f.altitude).toLocaleString()} ft</span>
              <span>DST ${Math.round(distance)} km</span>
            </div>
          </div>
        `;
        
        // Click target card to inspect plane details
        card.querySelector('.ar-target-panel').addEventListener('click', (e) => {
          e.stopPropagation();
          this.stop(); // Exit AR mode
          this.appState.ui.selectFlight(f);
          this.appState.map.focusOnFlight(f);
        });

        container.appendChild(card);
      }
    });

    // Update statistics
    document.getElementById('ar-targets-visible').innerText = targetsVisible;
    
    // Lucide support for dynamically generated icons in AR
    lucide.createIcons();
  }
}
