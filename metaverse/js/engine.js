/* ═══════════════════════════════════
   engine.js — Main Engine & Game Loop
═══════════════════════════════════ */
'use strict';

const Engine = (() => {
  let renderer, scene, camera;
  let animId;
  let time = 0;
  let lastTime = performance.now();
  let currentWorldIdx = 0;
  let trailSystem = null;

  // Portal proximity state
  let nearPortalId = null;
  const PORTAL_TRIGGER_DIST = 2.8;

  function init() {
    _initRenderer();
    _initScene();
    _initCamera();
    _runLoader();
  }

  function _initRenderer() {
    renderer = new THREE.WebGLRenderer({
      canvas: document.getElementById('canvas'),
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputEncoding = THREE.sRGBEncoding;

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  function _initScene() {
    scene = new THREE.Scene();
  }

  function _initCamera() {
    camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.05, 500);
    camera.position.set(0, 2.2, 6);
  }

  // ── LOADER SEQUENCE ──
  function _runLoader() {
    const fill   = document.getElementById('loader-fill');
    const status = document.getElementById('loader-status');
    const steps  = ['step-1','step-2','step-3','step-4','step-5'];
    const msgs   = ['WEBGL ENGINE','PHYSICS SYSTEM','WORLD LOADER','AVATAR STUDIO','NETWORK LAYER'];
    let step = 0;

    const advance = () => {
      if (step >= steps.length) {
        _startGame();
        return;
      }
      document.getElementById(steps[step]).classList.add('done');
      status.textContent = msgs[step] + ' OK';
      fill.style.width = ((step + 1) / steps.length * 100) + '%';
      step++;
      setTimeout(advance, 320);
    };

    // Init subsystems while loading
    setTimeout(() => {
      Physics.init(camera, scene);
      Particles.init(scene);
      Worlds.init(scene, camera);
      AvatarSystem.init(scene, camera);
      UI.init(camera);
      advance();
    }, 400);
  }

  function _startGame() {
    const loader = document.getElementById('loader');
    loader.style.opacity = '0';
    loader.style.transition = 'opacity 0.7s';
    setTimeout(() => loader.remove(), 750);

    switchWorld(0);
    _loop();

    // Click to lock pointer
    document.getElementById('canvas').addEventListener('click', () => {
      if (!Physics.isLocked()) {
        document.getElementById('canvas').requestPointerLock();
      }
    });

    // E key = enter portal
    document.addEventListener('keydown', e => {
      if (UI.isChatActive()) return;
      if (e.code === 'KeyE' && nearPortalId !== null) {
        switchWorld(nearPortalId);
      }
    });
  }

  // ── WORLD SWITCH ──
  function switchWorld(idx) {
    if (idx === currentWorldIdx && animId) return; // same world only skip if already loaded

    UI.flashTransition();

    // Small delay for flash effect
    setTimeout(() => {
      currentWorldIdx = idx;

      // Reset physics
      Physics.resetVelocity();
      camera.position.set(0, 2.2, 6);

      // Clear old particles
      Particles.removeSparkle();
      if (trailSystem) { trailSystem = null; }

      // Load new world
      Worlds.load(idx);

      // Rebuild avatar in new world
      AvatarSystem.build();

      // Respawn sparkles
      Particles.initSparkle();

      // Rebuild trail if needed
      const cfg = AvatarSystem.getConfig();
      if (cfg.trail !== 'none') {
        trailSystem = Particles.createTrail(cfg.trail);
      }

      UI.setActiveWorld(idx);
      nearPortalId = null;
      UI.setPortalHint(false);
    }, 200);
  }

  // ── MAIN LOOP ──
  function _loop() {
    animId = requestAnimationFrame(_loop);

    const now   = performance.now();
    const delta = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    time += delta;

    // Physics update
    Physics.update(delta);

    // Avatar animation
    AvatarSystem.animate(delta, time, Physics.isMoving(), Physics.isSprinting());

    // World animation
    Worlds.animate(time, delta);

    // Particles
    Particles.update(delta);

    // Trail emit
    if (trailSystem && Physics.isMoving() && AvatarSystem.getGroup()) {
      const g = AvatarSystem.getGroup();
      Particles.emitAt(trailSystem, g.position.x, g.position.y + 0.3, g.position.z);
    }

    // Portal proximity check
    const portals = Worlds.getPortals();
    let foundPortal = null;
    portals.forEach(p => {
      const dx = camera.position.x - p.x;
      const dz = camera.position.z - p.z;
      if (Math.sqrt(dx*dx + dz*dz) < PORTAL_TRIGGER_DIST) {
        foundPortal = p.toWorldId;
      }
    });
    if (foundPortal !== nearPortalId) {
      nearPortalId = foundPortal;
      UI.setPortalHint(nearPortalId !== null);
      if (nearPortalId !== null) {
        const wname = Worlds.getWorldData()[nearPortalId].name;
        UI.setInteractHint(false);
      }
    }

    // Minimap
    UI.drawMinimap(portals, AvatarSystem.getNPCs());

    // Stats
    UI.updateStats(camera);

    // Render
    renderer.render(scene, camera);
  }

  return { init, switchWorld };
})();

// ── BOOTSTRAP ──
window.addEventListener('DOMContentLoaded', () => Engine.init());

// Expose togglePanel globally for inline HTML handlers
function togglePanel(name) { UI.togglePanel(name); }
