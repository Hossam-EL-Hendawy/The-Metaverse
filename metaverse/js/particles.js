/* ═══════════════════════════════════
   particles.js — Particle System
═══════════════════════════════════ */
'use strict';

const Particles = (() => {
  let _scene;
  const systems = [];

  const TRAIL_COLORS = {
    fire:  [0xff4400, 0xff8800, 0xffcc00],
    ice:   [0x88ddff, 0x44aaff, 0xaaeeff],
    spark: [0xffff00, 0xffffff, 0xffcc00],
    none:  []
  };

  function init(scene) { _scene = scene; }

  // ── TRAIL ──
  function createTrail(type, maxParticles = 60) {
    if (type === 'none') return null;
    const colors = TRAIL_COLORS[type] || TRAIL_COLORS.fire;

    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(maxParticles * 3);
    const colorsArr = new Float32Array(maxParticles * 3);
    const sizes = new Float32Array(maxParticles);
    const ages = new Array(maxParticles).fill(0);
    const velocities = [];

    for (let i = 0; i < maxParticles; i++) {
      positions[i*3]   = 0;
      positions[i*3+1] = -999;
      positions[i*3+2] = 0;
      sizes[i] = 0;
      velocities.push(new THREE.Vector3());
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colorsArr, 3));
    geo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
      size: 0.25, vertexColors: true, transparent: true,
      opacity: 0.8, sizeAttenuation: true, depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geo, mat);
    _scene.add(points);

    const system = {
      points, geo, positions, colorsArr, sizes, ages, velocities,
      maxParticles, colors, type,
      emitTimer: 0, active: true
    };
    systems.push(system);
    return system;
  }

  function emitAt(system, x, y, z) {
    if (!system) return;
    system.emitTimer++;
    if (system.emitTimer % 3 !== 0) return;

    // Find dead particle
    for (let i = 0; i < system.maxParticles; i++) {
      if (system.ages[i] <= 0) {
        system.ages[i] = 1.0;
        system.positions[i*3]   = x;
        system.positions[i*3+1] = y;
        system.positions[i*3+2] = z;

        const spread = 0.3;
        system.velocities[i].set(
          (Math.random()-0.5)*spread,
          0.5 + Math.random()*1.0,
          (Math.random()-0.5)*spread
        );

        const col = new THREE.Color(system.colors[Math.floor(Math.random()*system.colors.length)]);
        system.colorsArr[i*3]   = col.r;
        system.colorsArr[i*3+1] = col.g;
        system.colorsArr[i*3+2] = col.b;
        break;
      }
    }
  }

  function updateSystem(system, delta) {
    let needsUpdate = false;
    for (let i = 0; i < system.maxParticles; i++) {
      if (system.ages[i] > 0) {
        system.ages[i] -= delta * 1.5;
        system.velocities[i].y -= (system.type === 'ice' ? 0.5 : 3) * delta;
        system.positions[i*3]   += system.velocities[i].x * delta;
        system.positions[i*3+1] += system.velocities[i].y * delta;
        system.positions[i*3+2] += system.velocities[i].z * delta;
        system.sizes[i] = Math.max(0, system.ages[i]) * 0.3;
        needsUpdate = true;
      } else {
        system.positions[i*3+1] = -999;
        system.sizes[i] = 0;
      }
    }
    if (needsUpdate) {
      system.geo.attributes.position.needsUpdate = true;
      system.geo.attributes.size.needsUpdate = true;
    }
  }

  // ── BURST / EXPLOSION ──
  function burst(x, y, z, color = 0x00f5ff, count = 40, spread = 2.5) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vel = [];
    const col = new THREE.Color(color);
    const cols = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i*3] = x; pos[i*3+1] = y; pos[i*3+2] = z;
      vel.push(new THREE.Vector3(
        (Math.random()-0.5)*spread,
        Math.random()*spread,
        (Math.random()-0.5)*spread
      ));
      cols[i*3] = col.r; cols[i*3+1] = col.g; cols[i*3+2] = col.b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(cols, 3));
    const mat = new THREE.PointsMaterial({size:0.35, vertexColors:true, transparent:true, opacity:1, blending:THREE.AdditiveBlending, depthWrite:false});
    const pts = new THREE.Points(geo, mat);
    _scene.add(pts);

    let life = 1.0;
    const tick = (dt) => {
      life -= dt * 1.8;
      if (life <= 0) { _scene.remove(pts); return; }
      mat.opacity = life;
      for (let i = 0; i < count; i++) {
        vel[i].y -= 4 * dt;
        pos[i*3]   += vel[i].x * dt;
        pos[i*3+1] += vel[i].y * dt;
        pos[i*3+2] += vel[i].z * dt;
      }
      geo.attributes.position.needsUpdate = true;
      requestAnimationFrame((ts) => tick(ts / 1000 - (Date.now()/1000 - ts/1000)));
    };

    // Use closure timer
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min((now - last)/1000, 0.05);
      last = now;
      life -= dt * 1.8;
      if (life <= 0) { _scene.remove(pts); return; }
      mat.opacity = life;
      for (let i = 0; i < count; i++) {
        vel[i].y -= 4 * dt;
        pos[i*3]   += vel[i].x * dt;
        pos[i*3+1] += vel[i].y * dt;
        pos[i*3+2] += vel[i].z * dt;
      }
      geo.attributes.position.needsUpdate = true;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // ── AMBIENT SPARKLE ──
  let sparkleSystem = null;
  function initSparkle() {
    const geo = new THREE.BufferGeometry();
    const count = 200;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sparkColors = [new THREE.Color(0x00f5ff), new THREE.Color(0xff6b00), new THREE.Color(0x9b59ff), new THREE.Color(0x00ff88)];
    for (let i = 0; i < count; i++) {
      pos[i*3]   = (Math.random()-0.5)*80;
      pos[i*3+1] = 0.3 + Math.random()*8;
      pos[i*3+2] = (Math.random()-0.5)*80;
      const c = sparkColors[Math.floor(Math.random()*sparkColors.length)];
      col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    sparkleSystem = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.12, vertexColors: true, transparent: true, opacity: 0.6,
      sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    _scene.add(sparkleSystem);
    return sparkleSystem;
  }

  function removeSparkle() {
    if (sparkleSystem) { _scene.remove(sparkleSystem); sparkleSystem = null; }
    systems.forEach(s => _scene.remove(s.points));
    systems.length = 0;
  }

  function update(delta) {
    systems.forEach(s => updateSystem(s, delta));
    // Animate sparkle
    if (sparkleSystem) {
      sparkleSystem.rotation.y += delta * 0.01;
    }
  }

  return { init, createTrail, emitAt, burst, initSparkle, removeSparkle, update };
})();
