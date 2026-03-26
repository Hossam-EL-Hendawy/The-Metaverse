/* ═══════════════════════════════════
   avatar.js — Avatar System
═══════════════════════════════════ */
'use strict';

const AvatarSystem = (() => {
  let _scene, _camera;
  let playerGroup   = null;
  let previewCtx    = null;
  let animTime      = 0;

  const config = {
    shape:        'humanoid',
    primaryColor: 0x00f5ff,
    accentColor:  0xff6b00,
    glowIntensity: 0.5,
    size:         1.0,
    trail:        'none',
    name:         'NEXUS_01'
  };

  const COLORS_PRIMARY = [
    0x00f5ff, 0xff6b00, 0xff3355, 0xffcc00,
    0x00ff88, 0x9b59ff, 0xffffff, 0xff44bb
  ];
  const COLORS_ACCENT = [
    0xff6b00, 0x00f5ff, 0xffcc00, 0xff3355,
    0x9b59ff, 0x00ff88, 0xff44bb, 0x44aaff
  ];

  // NPC pool
  const npcs = [];

  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;
    _setupUI();
    build();
  }

  function _mat(color, emissiveIntensity = 0.15, metalness = 0.3, roughness = 0.6) {
    return new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: emissiveIntensity * config.glowIntensity,
      metalness, roughness
    });
  }

  function build() {
    if (playerGroup) _scene.remove(playerGroup);
    playerGroup = new THREE.Group();
    playerGroup.name = 'player-avatar';

    const pm = _mat(config.primaryColor);
    const am = _mat(config.accentColor, 0.3, 0.5, 0.4);

    switch (config.shape) {
      case 'humanoid': _buildHumanoid(pm, am); break;
      case 'robot':    _buildRobot(pm, am);    break;
      case 'ghost':    _buildGhost(pm, am);    break;
      case 'alien':    _buildAlien(pm, am);    break;
    }

    playerGroup.scale.setScalar(config.size);
    _scene.add(playerGroup);
    _updatePreview();
  }

  function _addPart(geo, mat, x, y, z, rx=0, ry=0, rz=0) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    m.castShadow = true;
    playerGroup.add(m);
    return m;
  }

  function _buildHumanoid(pm, am) {
    // Torso
    _addPart(new THREE.BoxGeometry(0.62, 0.82, 0.32), pm, 0, 1.1, 0);
    // Head
    _addPart(new THREE.BoxGeometry(0.48, 0.48, 0.48), am, 0, 1.72, 0);
    // Eyes
    const eyeMat = new THREE.MeshStandardMaterial({color: 0xffffff, emissive: config.accentColor, emissiveIntensity: 2});
    _addPart(new THREE.BoxGeometry(0.08, 0.06, 0.05), eyeMat, -0.12, 1.76,  0.24);
    _addPart(new THREE.BoxGeometry(0.08, 0.06, 0.05), eyeMat,  0.12, 1.76,  0.24);
    // Legs
    _addPart(new THREE.BoxGeometry(0.26, 0.72, 0.26), pm, -0.18, 0.36, 0);
    _addPart(new THREE.BoxGeometry(0.26, 0.72, 0.26), pm,  0.18, 0.36, 0);
    // Arms
    _addPart(new THREE.BoxGeometry(0.22, 0.68, 0.22), am, -0.44, 1.1, 0);
    _addPart(new THREE.BoxGeometry(0.22, 0.68, 0.22), am,  0.44, 1.1, 0);
  }

  function _buildRobot(pm, am) {
    _addPart(new THREE.BoxGeometry(0.72, 1.05, 0.44), pm, 0, 1.1, 0);
    _addPart(new THREE.BoxGeometry(0.58, 0.44, 0.44), am, 0, 1.72, 0);
    // Visor
    const visorMat = new THREE.MeshStandardMaterial({color: config.accentColor, emissive: config.accentColor, emissiveIntensity: 2, transparent: true, opacity: 0.8});
    _addPart(new THREE.BoxGeometry(0.40, 0.12, 0.02), visorMat, 0, 1.72, 0.23);
    // Antenna
    _addPart(new THREE.CylinderGeometry(0.02, 0.02, 0.3), am, 0, 2.06, 0);
    _addPart(new THREE.SphereGeometry(0.05), new THREE.MeshStandardMaterial({color: config.primaryColor, emissive: config.primaryColor, emissiveIntensity: 3}), 0, 2.24, 0);
    // Legs
    _addPart(new THREE.BoxGeometry(0.28, 0.75, 0.28), pm, -0.22, 0.37, 0);
    _addPart(new THREE.BoxGeometry(0.28, 0.75, 0.28), pm,  0.22, 0.37, 0);
    // Arms
    _addPart(new THREE.BoxGeometry(0.22, 0.72, 0.22), am, -0.50, 1.1, 0);
    _addPart(new THREE.BoxGeometry(0.22, 0.72, 0.22), am,  0.50, 1.1, 0);
  }

  function _buildGhost(pm, am) {
    const gMat = new THREE.MeshStandardMaterial({
      color: config.primaryColor, transparent: true, opacity: 0.72,
      emissive: config.primaryColor, emissiveIntensity: config.glowIntensity * 0.8,
      metalness: 0, roughness: 1
    });
    _addPart(new THREE.SphereGeometry(0.38, 14, 14), gMat, 0, 1.1, 0).scale.set(1, 1.5, 1);
    _addPart(new THREE.SphereGeometry(0.27, 12, 12), am,    0, 1.75, 0);
    // Ghost eyes
    const eMat = new THREE.MeshStandardMaterial({color: 0xffffff, emissive: config.accentColor, emissiveIntensity: 3});
    _addPart(new THREE.SphereGeometry(0.06, 8, 8), eMat, -0.1, 1.76, 0.24);
    _addPart(new THREE.SphereGeometry(0.06, 8, 8), eMat,  0.1, 1.76, 0.24);
    // Tail wisps
    for (let i = 0; i < 3; i++) {
      const wisp = new THREE.Mesh(
        new THREE.SphereGeometry(0.1 - i*0.025, 6, 6),
        new THREE.MeshStandardMaterial({color: config.primaryColor, transparent: true, opacity: 0.4 - i*0.1, emissive: config.primaryColor, emissiveIntensity: 0.5})
      );
      wisp.position.set((i-1)*0.15, 0.55 - i*0.18, 0);
      wisp.castShadow = false;
      playerGroup.add(wisp);
    }
  }

  function _buildAlien(pm, am) {
    // Elongated body
    const b = _addPart(new THREE.CylinderGeometry(0.25, 0.35, 1.0, 8), pm, 0, 1.1, 0);
    // Large head
    _addPart(new THREE.SphereGeometry(0.42, 12, 12), am, 0, 1.85, 0).scale.set(1, 1.2, 0.9);
    // Big alien eyes
    const eMat2 = new THREE.MeshStandardMaterial({color: config.accentColor, emissive: config.accentColor, emissiveIntensity: 2});
    _addPart(new THREE.SphereGeometry(0.12, 8, 8), eMat2, -0.18, 1.88, 0.32).scale.set(0.8, 1.2, 0.6);
    _addPart(new THREE.SphereGeometry(0.12, 8, 8), eMat2,  0.18, 1.88, 0.32).scale.set(0.8, 1.2, 0.6);
    // Thin legs x4
    const offsets = [[-0.15,-0.05],[-0.05,-0.15],[0.05,-0.15],[0.15,-0.05]];
    offsets.forEach(([ox,oz])=> _addPart(new THREE.CylinderGeometry(0.04,0.04,0.7,5), pm, ox, 0.35, oz));
    // Antenna x2
    _addPart(new THREE.CylinderGeometry(0.015,0.015,0.4,4), am, -0.15, 2.35, 0).rotation.z =  0.3;
    _addPart(new THREE.CylinderGeometry(0.015,0.015,0.4,4), am,  0.15, 2.35, 0).rotation.z = -0.3;
  }

  // ── NPC AVATARS ──
  function spawnNPC(x, z, shapeIdx) {
    const shapes = ['humanoid','robot','ghost','alien'];
    const colors = [0x00f5ff,0xff6b00,0x9b59ff,0x00ff88,0xff3355,0xffcc00];
    const npcGroup = new THREE.Group();

    const shape   = shapes[shapeIdx % shapes.length];
    const pColor  = colors[Math.floor(Math.random()*colors.length)];
    const aColor  = colors[Math.floor(Math.random()*colors.length)];
    const pm = new THREE.MeshStandardMaterial({color:pColor, emissive:pColor, emissiveIntensity:0.15, metalness:0.3, roughness:0.6});
    const am = new THREE.MeshStandardMaterial({color:aColor, emissive:aColor, emissiveIntensity:0.2, metalness:0.4, roughness:0.5});

    // Build simple NPC body based on shape
    const _p = (geo, mat, x2, y2, z2) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x2, y2, z2);
      m.castShadow = true;
      npcGroup.add(m);
      return m;
    };

    if (shape === 'humanoid') {
      _p(new THREE.BoxGeometry(0.56,0.75,0.28), pm, 0, 1.05, 0);
      _p(new THREE.BoxGeometry(0.42,0.42,0.42), am, 0, 1.62, 0);
      _p(new THREE.BoxGeometry(0.23,0.65,0.23), pm, -0.16, 0.32, 0);
      _p(new THREE.BoxGeometry(0.23,0.65,0.23), pm,  0.16, 0.32, 0);
      _p(new THREE.BoxGeometry(0.2,0.6,0.2), am, -0.4, 1.05, 0);
      _p(new THREE.BoxGeometry(0.2,0.6,0.2), am,  0.4, 1.05, 0);
    } else if (shape === 'robot') {
      _p(new THREE.BoxGeometry(0.65,0.95,0.4), pm, 0, 1.05, 0);
      _p(new THREE.BoxGeometry(0.52,0.40,0.40), am, 0, 1.67, 0);
      _p(new THREE.BoxGeometry(0.25,0.68,0.25), pm, -0.2, 0.34, 0);
      _p(new THREE.BoxGeometry(0.25,0.68,0.25), pm,  0.2, 0.34, 0);
    } else {
      const gm = new THREE.MeshStandardMaterial({color:pColor, transparent:true, opacity:0.7, emissive:pColor, emissiveIntensity:0.3});
      _p(new THREE.SphereGeometry(0.34,12,12), gm, 0, 1.1, 0).scale.set(1,1.4,1);
      _p(new THREE.SphereGeometry(0.23,10,10), am, 0, 1.7, 0);
    }

    // Name tag
    const canvas2d = document.createElement('canvas');
    canvas2d.width = 128; canvas2d.height = 32;
    const ctx2 = canvas2d.getContext('2d');
    ctx2.font = '14px "Share Tech Mono"';
    ctx2.fillStyle = '#00f5ff';
    ctx2.textAlign = 'center';
    ctx2.fillText(`NPC_${String(npcs.length).padStart(2,'0')}`, 64, 22);
    const tagTex = new THREE.CanvasTexture(canvas2d);
    const tag = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.3),
      new THREE.MeshBasicMaterial({map:tagTex, transparent:true, side:THREE.DoubleSide, depthWrite:false})
    );
    tag.position.set(0, 2.2, 0);
    npcGroup.add(tag);

    npcGroup.position.set(x, 0, z);
    npcGroup.userData = {
      startX: x, startZ: z,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.4,
      bobPhase: Math.random() * Math.PI * 2,
      tag
    };
    _scene.add(npcGroup);
    npcs.push(npcGroup);
    return npcGroup;
  }

  function clearNPCs() {
    npcs.forEach(n => _scene.remove(n));
    npcs.length = 0;
  }

  // ── ANIMATION ──
  function animate(delta, time, isMoving, isSprinting) {
    animTime = time;
    if (!playerGroup) return;

    // Follow camera (offset behind so it's visible from outside)
    playerGroup.position.set(
      _camera.position.x,
      _camera.position.y - 1.8,
      _camera.position.z
    );
    playerGroup.rotation.y = Physics.getEuler().y + Math.PI;

    // Walk animation
    if (isMoving) {
      const swing = Math.sin(time * (isSprinting ? 14 : 9)) * 0.35;
      playerGroup.children.forEach((c, i) => {
        if (c.geometry && c.geometry.type === 'BoxGeometry') {
          if (i >= 4 && i < 6) c.rotation.x =  swing * (i % 2 === 0 ? 1 : -1); // legs
          if (i >= 6 && i < 8) c.rotation.x = -swing * (i % 2 === 0 ? 1 : -1); // arms
        }
      });
    } else {
      playerGroup.children.forEach(c => { if (c.geometry) c.rotation.x *= 0.85; });
    }

    // Ghost / alien bob
    if (['ghost','alien'].includes(config.shape)) {
      playerGroup.position.y += Math.sin(time * 2) * 0.04;
    }

    // Animate NPCs
    npcs.forEach(n => {
      const d = n.userData;
      n.position.x = d.startX + Math.sin(time * d.speed + d.phase) * 5;
      n.position.z = d.startZ + Math.cos(time * d.speed * 0.8 + d.phase) * 5;
      n.position.y = Math.abs(Math.sin(time * 2.5 + d.bobPhase)) * 0.12;
      n.rotation.y = time * d.speed + d.phase;
      // Name tag always faces camera
      if (d.tag && _camera) {
        d.tag.lookAt(_camera.position);
      }
    });
  }

  // ── PREVIEW CANVAS ──
  function _updatePreview() {
    const canvas2 = document.getElementById('avatar-preview');
    if (!canvas2) return;
    const ctx = canvas2.getContext('2d');
    ctx.clearRect(0, 0, 160, 200);

    const pc = '#' + config.primaryColor.toString(16).padStart(6,'0');
    const ac = '#' + config.accentColor.toString(16).padStart(6,'0');

    ctx.fillStyle = '#0a0f1e';
    ctx.fillRect(0, 0, 160, 200);

    // Grid lines
    ctx.strokeStyle = 'rgba(0,245,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 160; i += 20) {
      ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,200); ctx.stroke();
    }
    for (let j = 0; j < 200; j += 20) {
      ctx.beginPath(); ctx.moveTo(0,j); ctx.lineTo(160,j); ctx.stroke();
    }

    const cx = 80;
    ctx.shadowColor = pc;
    ctx.shadowBlur  = Math.round(18 * config.glowIntensity);

    const draw = (color, x, y, w, h, r=2) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.fill();
    };

    if (config.shape === 'humanoid') {
      draw(ac, cx-22, 20, 44, 42, 3);    // head
      draw(pc, cx-28, 66, 56, 54, 3);    // torso
      draw(pc, cx-26, 122, 22, 46, 3);   // leg L
      draw(pc, cx+4,  122, 22, 46, 3);   // leg R
      draw(ac, cx-42, 68, 16, 46, 3);    // arm L
      draw(ac, cx+26, 68, 16, 46, 3);    // arm R
      // Eyes
      ctx.fillStyle = '#fff';
      ctx.shadowColor = ac;
      ctx.beginPath(); ctx.arc(cx-9, 39, 4, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx+9, 39, 4, 0, Math.PI*2); ctx.fill();
    } else if (config.shape === 'robot') {
      draw(ac, cx-26, 18, 52, 40, 2);    // head (boxy)
      draw(pc, cx-32, 62, 64, 60, 2);    // torso (wide)
      draw(pc, cx-28, 124, 24, 46, 2);   // leg L
      draw(pc, cx+4,  124, 24, 46, 2);   // leg R
      draw(ac, cx-48, 64, 18, 52, 2);    // arm L
      draw(ac, cx+30, 64, 18, 52, 2);    // arm R
      // Visor
      ctx.fillStyle = ac; ctx.shadowBlur = 20;
      ctx.fillRect(cx-18, 34, 36, 8);
      // Antenna
      ctx.strokeStyle = ac; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx,18); ctx.lineTo(cx,4); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, 4, 5, 0, Math.PI*2); ctx.fill();
    } else if (config.shape === 'ghost') {
      ctx.globalAlpha = 0.75;
      draw(pc, cx-30, 52, 60, 80, 30);   // body blob
      ctx.globalAlpha = 1;
      draw(ac, cx-22, 22, 44, 42, 22);   // head
      ctx.fillStyle = '#fff'; ctx.shadowColor = ac; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(cx-9,40,5,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx+9,40,5,0,Math.PI*2); ctx.fill();
      // Wisp bottom
      ctx.globalAlpha = 0.4;
      for (let i=0;i<3;i++) {
        ctx.fillStyle = pc;
        ctx.beginPath(); ctx.arc(cx+(i-1)*18, 142+i*10, 10-i*2, 0, Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if (config.shape === 'alien') {
      draw(ac, cx-35, 15, 70, 54, 35);   // big head
      draw(pc, cx-22, 72, 44, 58, 8);    // body
      // 4 thin legs
      for (let i=0;i<4;i++) {
        ctx.fillStyle = pc;
        ctx.fillRect(cx-18+i*12, 132, 5, 44);
      }
      // Big eyes
      ctx.fillStyle = ac; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.ellipse(cx-16, 37, 9, 13, 0.2, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx+16, 37, 9, 13, -0.2, 0, Math.PI*2); ctx.fill();
      // Antennae
      ctx.strokeStyle = ac; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx-14,15); ctx.lineTo(cx-22,2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx+14,15); ctx.lineTo(cx+22,2); ctx.stroke();
      ctx.fillStyle = ac;
      ctx.beginPath(); ctx.arc(cx-22,2,4,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx+22,2,4,0,Math.PI*2); ctx.fill();
    }

    ctx.shadowBlur = 0;

    // Name label
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 172, 160, 28);
    ctx.fillStyle = '#00f5ff';
    ctx.font = '12px "Share Tech Mono"';
    ctx.textAlign = 'center';
    ctx.fillText(config.name.toUpperCase(), 80, 191);
  }

  // ── UI SETUP ──
  function _setupUI() {
    // Primary swatches
    const pRow = document.getElementById('primary-swatches');
    COLORS_PRIMARY.forEach(c => {
      const sw = document.createElement('div');
      sw.className = 'swatch' + (c === config.primaryColor ? ' selected' : '');
      sw.style.background = '#' + c.toString(16).padStart(6,'0');
      sw.onclick = () => {
        config.primaryColor = c;
        pRow.querySelectorAll('.swatch').forEach(s => s.classList.remove('selected'));
        sw.classList.add('selected');
        _updatePreview();
      };
      pRow.appendChild(sw);
    });

    // Accent swatches
    const aRow = document.getElementById('accent-swatches');
    COLORS_ACCENT.forEach(c => {
      const sw = document.createElement('div');
      sw.className = 'swatch' + (c === config.accentColor ? ' selected' : '');
      sw.style.background = '#' + c.toString(16).padStart(6,'0');
      sw.onclick = () => {
        config.accentColor = c;
        aRow.querySelectorAll('.swatch').forEach(s => s.classList.remove('selected'));
        sw.classList.add('selected');
        _updatePreview();
      };
      aRow.appendChild(sw);
    });

    // Shape buttons
    document.getElementById('shape-btns').querySelectorAll('.seg-btn').forEach(btn => {
      btn.onclick = () => {
        config.shape = btn.dataset.shape;
        document.getElementById('shape-btns').querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _updatePreview();
      };
    });

    // Trail buttons
    document.getElementById('trail-btns').querySelectorAll('.seg-btn').forEach(btn => {
      btn.onclick = () => {
        config.trail = btn.dataset.trail;
        document.getElementById('trail-btns').querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      };
    });

    // Glow slider
    const glowSlider = document.getElementById('glow-slider');
    glowSlider.addEventListener('input', () => {
      config.glowIntensity = +glowSlider.value / 100;
      document.getElementById('glow-val').textContent = glowSlider.value + '%';
      _updatePreview();
    });

    // Size slider
    const sizeSlider = document.getElementById('size-slider');
    sizeSlider.addEventListener('input', () => {
      config.size = +sizeSlider.value / 10;
      document.getElementById('size-val').textContent = config.size.toFixed(1) + '×';
      _updatePreview();
    });

    // Name input
    document.getElementById('player-name').addEventListener('input', e => {
      config.name = e.target.value;
      _updatePreview();
    });

    // Apply button
    document.getElementById('apply-avatar').onclick = () => {
      build();
      UI.notify('Avatar updated!');
    };

    _updatePreview();
  }

  function getConfig()  { return config; }
  function getGroup()   { return playerGroup; }
  function getNPCs()    { return npcs; }

  return { init, build, animate, spawnNPC, clearNPCs, getConfig, getGroup, getNPCs };
})();
