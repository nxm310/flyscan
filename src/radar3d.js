/* ==========================================================================
   FLYRADAR — THREE.JS 3D TACTICAL RADAR VISUALIZATION
   ========================================================================== */

const THREE = window.THREE;
import { getDistance } from './simulation.js';

export class Radar3DController {
  constructor(onFlightSelectedCallback) {
    this.container = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.onFlightSelected = onFlightSelectedCallback;

    // Viewport control angles
    this.theta = -Math.PI / 4; // Horizontal rotation
    this.phi = Math.PI / 3;    // Vertical rotation
    this.distance = 55;        // Zoom distance
    
    // Limits
    this.minDistance = 15;
    this.maxDistance = 120;
    this.minPhi = 0.05;
    this.maxPhi = Math.PI / 2 - 0.02; // Prevent going below floor

    // Drag interaction states
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    
    // Scene objects mapping: flightId -> 3D meshes group
    this.aircraftGroups = new Map(); 
    this.selectedFlightId = null;
    this.filterCategory = 'all';

    // Center point (Paris CDG coords)
    this.centerLat = 46.8;
    this.centerLng = 2.5;
    
    // Ground floor coordinate
    this.floorY = -12;

    // Anim sweep line
    this.sweepBeam = null;
  }

  init() {
    this.container = document.getElementById('radar-3d-container');
    
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    // 1. Create Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x070a13, 0.008);

    // 2. Create Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.updateCameraPosition();

    // 3. Create WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x070a13, 0.0); // Transparent canvas overlaying CSS BG
    this.container.appendChild(this.renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0x0a1730, 1.2);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00f2fe, 1.5);
    dirLight.position.set(20, 60, 20);
    this.scene.add(dirLight);

    const dirLight2 = new THREE.DirectionalLight(0xff2e63, 0.5);
    dirLight2.position.set(-20, -10, -20);
    this.scene.add(dirLight2);

    // 5. Build Environment Grid and baseplate
    this.buildBaseplateGrid();
    this.buildHolographicGlobe();

    // 6. Bind events
    this.setupEventListeners();
    
    // Start animation loop
    this.animate();
  }

  updateCameraPosition() {
    // Spherical to Cartesian coordinates mapping
    this.camera.position.x = this.distance * Math.sin(this.phi) * Math.sin(this.theta);
    this.camera.position.y = this.distance * Math.cos(this.phi);
    this.camera.position.z = this.distance * Math.sin(this.phi) * Math.cos(this.theta);
    this.camera.lookAt(0, -2, 0);
  }

  // Conversions geographic coordinates -> 3D cartesian units
  latLngAltToVector3(lat, lng, alt) {
    // 1 degree latitude = ~111km. 1 Three.js unit = ~20km.
    // Scale down horizontal dimensions for radar scope display
    const scaleFactor = 0.09; 
    
    const x = (lng - this.centerLng) * 111 * Math.cos(this.centerLat * Math.PI / 180) * scaleFactor;
    const z = -(lat - this.centerLat) * 111 * scaleFactor;
    
    // Altitude conversion (ft to Y value)
    // 35,000 ft = ~10.6km. We scale it so Y sits nicely above the radar floor.
    const altScale = 0.55; 
    const y = this.floorY + (alt / 1000) * altScale;
    
    return new THREE.Vector3(x, y, z);
  }

  buildBaseplateGrid() {
    const gridColor = 0x00f2fe;
    
    // Circular Ground baseplate Group
    const baseplate = new THREE.Group();
    this.scene.add(baseplate);

    // Concentric range circles
    for (let r = 8; r <= 36; r += 7) {
      const ringGeo = new THREE.RingGeometry(r - 0.08, r + 0.08, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: gridColor,
        transparent: true,
        opacity: r === 36 ? 0.25 : 0.08,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = this.floorY;
      baseplate.add(ring);
    }

    // Radial grids azimuth axes
    const axisMat = new THREE.LineBasicMaterial({
      color: gridColor,
      transparent: true,
      opacity: 0.06
    });

    for (let angle = 0; angle < Math.PI; angle += Math.PI / 6) {
      const points = [];
      points.push(new THREE.Vector3(-36 * Math.sin(angle), this.floorY, -36 * Math.cos(angle)));
      points.push(new THREE.Vector3(36 * Math.sin(angle), this.floorY, 36 * Math.cos(angle)));
      
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(lineGeo, axisMat);
      baseplate.add(line);
    }

    // Sweeping radar scanning beam
    const beamGeo = new THREE.BufferGeometry();
    const beamPoints = [
      new THREE.Vector3(0, this.floorY + 0.05, 0),
      new THREE.Vector3(36, this.floorY + 0.05, 0)
    ];
    beamGeo.setFromPoints(beamPoints);
    const beamMat = new THREE.LineBasicMaterial({
      color: 0x00f2fe,
      linewidth: 2,
      transparent: true,
      opacity: 0.8
    });
    this.sweepBeam = new THREE.Line(beamGeo, beamMat);
    this.scene.add(this.sweepBeam);
  }

  buildHolographicGlobe() {
    const globeGroup = new THREE.Group();
    this.scene.add(globeGroup);

    // Wireframe Sphere
    const globeGeo = new THREE.SphereGeometry(12, 16, 16);
    const globeMat = new THREE.MeshBasicMaterial({
      color: 0x4facfe,
      wireframe: true,
      transparent: true,
      opacity: 0.04
    });
    const sphere = new THREE.Mesh(globeGeo, globeMat);
    sphere.position.y = this.floorY - 2; // Sits slightly below ground floor
    globeGroup.add(sphere);

    // Glowing core glow center
    const coreGeo = new THREE.SphereGeometry(7, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.015
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.copy(sphere.position);
    globeGroup.add(core);
  }

  setupEventListeners() {
    const dom = this.renderer.domElement;

    // Mouse drag viewport rotations
    const onMouseDown = (e) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!this.isDragging) return;
      
      const dx = e.clientX - this.previousMousePosition.x;
      const dy = e.clientY - this.previousMousePosition.y;
      
      const rotSpeed = 0.005;
      
      this.theta -= dx * rotSpeed;
      this.phi = Math.max(this.minPhi, Math.min(this.maxPhi, this.phi - dy * rotSpeed));
      
      this.updateCameraPosition();
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      this.isDragging = false;
    };

    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Touch events for mobile
    dom.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    });

    dom.addEventListener('touchmove', (e) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - this.previousMousePosition.x;
      const dy = e.touches[0].clientY - this.previousMousePosition.y;
      
      this.theta -= dx * 0.008;
      this.phi = Math.max(this.minPhi, Math.min(this.maxPhi, this.phi - dy * 0.008));
      
      this.updateCameraPosition();
      this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    });

    dom.addEventListener('touchend', onMouseUp);

    // Zoom mouse wheel
    dom.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance + e.deltaY * 0.05));
      this.updateCameraPosition();
    }, { passive: false });

    // Click raycasting selection
    dom.addEventListener('click', (e) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, this.camera);
      
      // Get all plane meshes
      const targetMeshes = [];
      const meshToIdMap = new Map(); // Mesh -> Flight ID
      
      for (const [id, group] of this.aircraftGroups.entries()) {
        const bodyMesh = group.getObjectByName('body');
        if (bodyMesh) {
          targetMeshes.push(bodyMesh);
          meshToIdMap.set(bodyMesh, id);
        }
      }

      const intersects = raycaster.intersectObjects(targetMeshes);
      
      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object;
        const flightId = meshToIdMap.get(clickedMesh);
        const flight = this.appStateFlights.find(f => f.id === flightId);
        
        if (flight) {
          this.onFlightSelected(flight);
        }
      } else {
        // Clicked empty space: deselect
        this.onFlightSelected(null);
      }
    });
  }

  // Synchronise simulated flights inside the Three.js 3D space
  update3DAirspace(flights, selectedFlightId, filterCategory) {
    this.appStateFlights = flights; // Cache for raycasting click handlers
    this.selectedFlightId = selectedFlightId;
    this.filterCategory = filterCategory;

    const activeIds = new Set();
    const isCivilFilter = filterCategory === 'all' || filterCategory === 'civil';
    const isMilFilter = filterCategory === 'all' || filterCategory === 'military';
    const isPrvFilter = filterCategory === 'all' || filterCategory === 'private';

    flights.forEach(f => {
      const matchesFilter = (f.category === 'CIVIL' && isCivilFilter) ||
                            (f.category === 'MILITARY' && isMilFilter) ||
                            (f.category === 'PRIVATE' && isPrvFilter);

      if (!matchesFilter) {
        this.removeAircraftGroup(f.id);
        return;
      }

      activeIds.add(f.id);
      
      // Compute 3D target coordinates
      const pos3D = this.latLngAltToVector3(f.lat, f.lng, f.altitude);
      const isSelected = f.id === selectedFlightId;

      if (this.aircraftGroups.has(f.id)) {
        // UPDATE EXISTING AIRCRAFT OBJECT
        const group = this.aircraftGroups.get(f.id);
        
        // 1. Move plane body mesh
        const planeBody = group.getObjectByName('body');
        planeBody.position.copy(pos3D);
        
        // Point in heading direction
        planeBody.rotation.y = - (f.heading * Math.PI / 180) + Math.PI;
        
        // Rotate body for climb/sink pitch
        const verticalRateFactor = f.verticalSpeed / 2500;
        planeBody.rotation.x = Math.max(-0.25, Math.min(0.25, verticalRateFactor * 0.35));

        // 2. Adjust vertical projection altitude line
        const line = group.getObjectByName('vectorLine');
        const linePositions = line.geometry.attributes.position.array;
        
        // Start point (ground)
        linePositions[0] = pos3D.x;
        linePositions[1] = this.floorY;
        linePositions[2] = pos3D.z;
        // End point (airplane)
        linePositions[3] = pos3D.x;
        linePositions[4] = pos3D.y;
        linePositions[5] = pos3D.z;
        line.geometry.attributes.position.needsUpdate = true;

        // 3. Move floor shadow indicator ring
        const shadow = group.getObjectByName('shadowRing');
        shadow.position.set(pos3D.x, this.floorY + 0.05, pos3D.z);

        // 4. Update dynamic selection glow geometry
        const selectorGlow = group.getObjectByName('selectorGlow');
        if (selectorGlow) {
          selectorGlow.position.copy(pos3D);
          selectorGlow.visible = isSelected;
        }

        // 5. Update trailing line paths in 3D
        this.updatePlaneTrailLine(group, f);

        // 6. Highlight colors if emergency occurs dynamically
        this.updatePlaneMaterialColors(group, f, isSelected);

      } else {
        // CREATE BRAND NEW 3D AIRCRAFT GROUP
        this.createNewAircraft3D(f, pos3D, isSelected);
      }
    });

    // Clean up outdated flights that left sector
    for (const [id, group] of this.aircraftGroups.entries()) {
      if (!activeIds.has(id)) {
        this.removeAircraftGroup(id);
      }
    }
  }

  createNewAircraft3D(flight, pos3D, isSelected) {
    const group = new THREE.Group();
    group.name = flight.id;
    this.scene.add(group);

    // 1. Core Aircraft representation: Glowing sleek cone geometry (looks like delta wing)
    const bodyGeo = new THREE.ConeGeometry(0.65, 1.6, 4);
    bodyGeo.rotateX(Math.PI / 2); // Point cone forward on Z axis
    
    const color = this.getCategoryColorHex(flight);
    const bodyMat = new THREE.MeshPhongMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.5,
      shininess: 100,
      flatShading: true
    });
    
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.name = 'body';
    bodyMesh.position.copy(pos3D);
    bodyMesh.rotation.y = - (flight.heading * Math.PI / 180) + Math.PI;
    group.add(bodyMesh);

    // 2. Vertical tactical projection vector line (ground -> plane)
    const points = [
      new THREE.Vector3(pos3D.x, this.floorY, pos3D.z),
      new THREE.Vector3(pos3D.x, pos3D.y, pos3D.z)
    ];
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineDashedMaterial({
      color: color,
      dashSize: 0.5,
      gapSize: 0.5,
      transparent: true,
      opacity: 0.35
    });
    const line = new THREE.Line(lineGeo, lineMat);
    line.computeLineDistances(); // Required for dashed line
    line.name = 'vectorLine';
    group.add(line);

    // 3. Flat shadow projection marker (circle on radar plate)
    const shadowGeo = new THREE.RingGeometry(0.3, 0.45, 16);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = Math.PI / 2;
    shadow.position.set(pos3D.x, this.floorY + 0.05, pos3D.z);
    shadow.name = 'shadowRing';
    group.add(shadow);

    // 4. Selection Ring indicator
    const selectGeo = new THREE.RingGeometry(1.6, 1.8, 32);
    const selectMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    const selectorMesh = new THREE.Mesh(selectGeo, selectMat);
    selectorMesh.rotation.x = Math.PI / 2;
    selectorMesh.position.copy(pos3D);
    selectorMesh.name = 'selectorGlow';
    selectorMesh.visible = isSelected;
    group.add(selectorMesh);

    // 5. Instanciate trailing line path
    const trailMat = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.65,
      linewidth: 1.5
    });
    
    // We pre-build history vertices converted to 3D space
    const trailPoints = [];
    flight.routeHistory.forEach((histPt, idx) => {
      // Map height history along progression curve
      const ratio = idx / flight.routeHistory.length;
      let height = flight.altitude;
      if (ratio < 0.15) height = (ratio / 0.15) * flight.cruiseAlt;
      
      const p3d = this.latLngAltToVector3(histPt[0], histPt[1], height);
      trailPoints.push(p3d);
    });
    
    const trailGeo = new THREE.BufferGeometry().setFromPoints(trailPoints);
    const trailLine = new THREE.Line(trailGeo, trailMat);
    trailLine.name = 'trailLine';
    group.add(trailLine);

    this.aircraftGroups.set(flight.id, group);
  }

  updatePlaneTrailLine(group, flight) {
    const trail = group.getObjectByName('trailLine');
    if (!trail) return;

    const trailPoints = [];
    flight.routeHistory.forEach((histPt, idx) => {
      const ratio = idx / flight.routeHistory.length;
      let height = flight.altitude;
      if (ratio < 0.15) height = (ratio / 0.15) * flight.cruiseAlt;
      
      const p3d = this.latLngAltToVector3(histPt[0], histPt[1], height);
      trailPoints.push(p3d);
    });

    // Make sure we append current actual live plane position to close the path
    const currentPos = this.latLngAltToVector3(flight.lat, flight.lng, flight.altitude);
    trailPoints.push(currentPos);

    trail.geometry.setFromPoints(trailPoints);
    trail.geometry.attributes.position.needsUpdate = true;
  }

  updatePlaneMaterialColors(group, flight, isSelected) {
    const body = group.getObjectByName('body');
    const color = this.getCategoryColorHex(flight);

    // Emergency pulsing color adjustments
    if (flight.isEmergency) {
      const pulseFactor = 0.5 + Math.abs(Math.sin(Date.now() * 0.007)) * 0.5;
      body.material.color.setHex(0xff3366);
      body.material.emissive.setHex(0xff3366);
      body.material.emissiveIntensity = pulseFactor;
      
      // Update vertical line color
      group.getObjectByName('vectorLine').material.color.setHex(0xff3366);
      group.getObjectByName('shadowRing').material.color.setHex(0xff3366);
    } else {
      body.material.color.setHex(color);
      body.material.emissive.setHex(color);
      body.material.emissiveIntensity = isSelected ? 0.8 : 0.4;
      
      group.getObjectByName('vectorLine').material.color.setHex(color);
      group.getObjectByName('shadowRing').material.color.setHex(color);
    }

    // Selected orbital highlights
    const selectorGlow = group.getObjectByName('selectorGlow');
    if (selectorGlow) {
      const selectColor = flight.isEmergency ? 0xff2e63 : 0x00f2fe;
      selectorGlow.material.color.setHex(selectColor);
      
      // Spin it
      selectorGlow.rotation.z += 0.02;
    }
  }

  getCategoryColorHex(flight) {
    if (flight.category === 'MILITARY') return 0x00ff66; // Emerald Green
    if (flight.category === 'PRIVATE') return 0xb57cff;  // Violet
    return 0x4facfe; // Cyan Civilian
  }

  removeAircraftGroup(id) {
    if (this.aircraftGroups.has(id)) {
      const group = this.aircraftGroups.get(id);
      this.scene.remove(group);
      
      // Deallocate geometries/materials
      group.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      
      this.aircraftGroups.delete(id);
    }
  }

  focusOnFlight(flight) {
    if (!flight) return;
    
    // Rotate viewport camera theta smoothly to target plane azimuth
    const pos3D = this.latLngAltToVector3(flight.lat, flight.lng, flight.altitude);
    const targetTheta = Math.atan2(pos3D.x, pos3D.z);
    
    // Animate camera orbital sweeps smoothly
    this.animateTransition(targetTheta, Math.PI / 4, 30);
  }

  focusOnAirport(airport) {
    if (!airport) return;
    
    // Convert airport coords to ground 3D offsets
    const pos3D = this.latLngAltToVector3(airport.lat, airport.lng, 0);
    const targetTheta = Math.atan2(pos3D.x, pos3D.z);
    
    this.animateTransition(targetTheta, Math.PI / 3.2, 45);
  }

  animateTransition(targetTheta, targetPhi, targetDist) {
    // Smooth interpolations over 35 ticks
    const steps = 30;
    let currentStep = 0;

    const startTheta = this.theta;
    const startPhi = this.phi;
    const startDist = this.distance;

    // Handle 360 wrap
    let diffTheta = targetTheta - startTheta;
    while (diffTheta < -Math.PI) diffTheta += Math.PI * 2;
    while (diffTheta > Math.PI) diffTheta -= Math.PI * 2;

    const stepFunc = () => {
      if (currentStep >= steps) return;
      currentStep++;
      const ratio = currentStep / steps;
      
      // Cubic easing out
      const ease = 1 - Math.pow(1 - ratio, 3);
      
      this.theta = startTheta + diffTheta * ease;
      this.phi = startPhi + (targetPhi - startPhi) * ease;
      this.distance = startDist + (targetDist - startDist) * ease;
      
      this.updateCameraPosition();
      
      requestAnimationFrame(stepFunc);
    };

    stepFunc();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    // Update sweeping radar line rotating around central baseplate
    if (this.sweepBeam) {
      this.sweepBeam.rotation.y += 0.015;
    }

    // Spin Globe slowly
    this.scene.traverse(obj => {
      if (obj instanceof THREE.Mesh && obj.geometry instanceof THREE.SphereGeometry) {
        obj.rotation.y += 0.001;
      }
    });

    // Render viewport camera Frame
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
