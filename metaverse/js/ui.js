/* ═══════════════════════════════════
   ui.js — HUD & Interface Layer
═══════════════════════════════════ */
'use strict';

const UI = (() => {
  let _camera;
  let minimapCtx;
  let chatActive = false;
  let panelState = { avatar: true, inventory: false, map: true };
  let notifTimeout;
  let clockInterval;

  const NPC_MESSAGES = [
    'Welcome to the Metaverse!',
    'Have you visited the Cosmos world?',
    'The portal to Ocean Realm is nearby.',
    'I love exploring different worlds!',
    'Try sprinting with SHIFT for speed!',
    'The forest is beautiful at night.',
    'You can customize your avatar in the panel.',
    'Found any rare portals yet?',
    'The desert ruins hold many secrets...',
    'I\'ve been here since world v0.1!',
  ];

  function init(camera) {
    _camera = camera;
    minimapCtx = document.getElementById('minimap').getContext('2d');
    _buildWorldTabs();
    _setupChatInput();
    _setupKeyboardShortcuts();
    _setupButtonHandlers();
    _startClock();
    _populateInventory();

    addChatMsg('SYSTEM', 'Welcome to METAVERSE NEXUS', 'system');
    addChatMsg('SYSTEM', 'Click canvas to capture mouse · ESC to release', 'system');
    setTimeout(() => addNPCChat(), 5000);
  }

  function _buildWorldTabs() {
    const container = document.getElementById('world-tabs');
    container.innerHTML = '';
    Worlds.getWorldData().forEach((w, i) => {
      const btn = document.createElement('button');
      btn.className = 'world-tab' + (i === 0 ? ' active' : '');
      btn.textContent = `${w.emoji} ${w.name}`;
      btn.onclick = () => Engine.switchWorld(i);
      container.appendChild(btn);
    });
  }

  function setActiveWorld(idx) {
    const name = Worlds.getWorldData()[idx].name;
    document.getElementById('current-world-name').textContent = name;
    document.getElementById('map-world-label').textContent = name;
    document.querySelectorAll('.world-tab').forEach((b, i) => b.classList.toggle('active', i === idx));
    addChatMsg('SYSTEM', `Teleported to ${name}`, 'system');
    notify(`ENTERING ${name}`);
  }

  function _setupChatInput() {
    const input = document.getElementById('chat-input');
    document.getElementById('chat-send').onclick = sendChat;
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { sendChat(); e.stopPropagation(); }
      if (e.key === 'Escape') { deactivateChat(); }
      e.stopPropagation();
    });
  }

  function activateChat() {
    chatActive = true;
    const input = document.getElementById('chat-input');
    input.removeAttribute('readonly');
    input.focus();
    input.placeholder = 'Type message...';
  }

  function deactivateChat() {
    chatActive = false;
    const input = document.getElementById('chat-input');
    input.setAttribute('readonly', true);
    input.blur();
    input.placeholder = 'Press T to chat...';
    document.getElementById('canvas').requestPointerLock();
  }

  function sendChat() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) { deactivateChat(); return; }
    const name = document.getElementById('player-name').value || 'NEXUS_01';
    addChatMsg(name, msg, 'player');
    input.value = '';
    deactivateChat();
    // Random NPC reply
    if (Math.random() > 0.5) {
      setTimeout(() => addNPCChat(), 1200 + Math.random()*2000);
    }
  }

  function addNPCChat() {
    const npcNames = [`NPC_0${Math.floor(Math.random()*9)}`, 'NEXUS_GUIDE', 'WANDERER', 'PORTAL_KEEPER'];
    const name = npcNames[Math.floor(Math.random()*npcNames.length)];
    const msg  = NPC_MESSAGES[Math.floor(Math.random()*NPC_MESSAGES.length)];
    addChatMsg(name, msg, 'npc');
    setTimeout(() => addNPCChat(), 15000 + Math.random()*20000);
  }

  function addChatMsg(from, msg, type = 'player') {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'chat-msg';
    const span = document.createElement('span');
    span.className = 'chat-from ' + type;
    span.textContent = `[${from}]`;
    const text = document.createElement('span');
    text.className = 'chat-text';
    text.textContent = ' ' + msg;
    div.appendChild(span);
    div.appendChild(text);
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    if (container.children.length > 30) container.removeChild(container.firstChild);
  }

  function notify(msg, color = '#00f5ff', duration = 2500) {
    clearTimeout(notifTimeout);
    const el = document.getElementById('notif');
    el.textContent = msg;
    el.style.color = color;
    el.style.borderColor = color;
    el.style.display = 'block';
    notifTimeout = setTimeout(() => { el.style.display = 'none'; }, duration);
  }

  function _setupKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
      if (chatActive) return;
      switch (e.code) {
        case 'KeyT': activateChat(); e.preventDefault(); break;
        case 'Tab':  togglePanel('avatar'); e.preventDefault(); break;
        case 'KeyM': togglePanel('map'); e.preventDefault(); break;
        case 'KeyI': togglePanel('inventory'); e.preventDefault(); break;
      }
    });
  }

  function togglePanel(name) {
    if (name === 'avatar') {
      const p = document.getElementById('panel-avatar');
      const show = p.style.display === 'none';
      p.style.display = show ? 'flex' : 'none';
    } else if (name === 'inventory') {
      const p = document.getElementById('panel-inventory');
      const show = p.style.display === 'none';
      p.style.display = show ? 'flex' : 'none';
    } else if (name === 'map') {
      const m = document.getElementById('minimap-wrap');
      m.style.display = m.style.display === 'none' ? 'block' : 'none';
    }
  }

  function _setupButtonHandlers() {
    document.getElementById('btn-map').onclick = () => togglePanel('map');
    document.getElementById('btn-inv').onclick = () => togglePanel('inventory');
    document.getElementById('btn-settings').onclick = () => togglePanel('avatar');
  }

  function _startClock() {
    const el = document.getElementById('nav-time');
    clockInterval = setInterval(() => {
      const d = new Date();
      el.textContent = String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
    }, 1000);
  }

  function _populateInventory() {
    const items = [
      {emoji:'⚡',label:'Speed Boost',qty:3},
      {emoji:'🛡',label:'Shield',qty:1},
      {emoji:'🌟',label:'Star Dust',qty:12},
      {emoji:'🔮',label:'Portal Key',qty:2},
      {emoji:'💎',label:'Crystal',qty:5},
      {emoji:'🗡',label:'Sword',qty:1},
      {emoji:'🎭',label:'Mask',qty:1},
      {emoji:'👑',label:'Crown',qty:1},
    ];
    const grid = document.getElementById('inv-grid');
    const total = 32;
    for (let i = 0; i < total; i++) {
      const slot = document.createElement('div');
      slot.className = 'inv-slot';
      if (i < items.length) {
        slot.classList.add('filled');
        slot.textContent = items[i].emoji;
        const qty = document.createElement('div');
        qty.className = 'inv-qty';
        qty.textContent = items[i].qty;
        slot.appendChild(qty);
        slot.title = items[i].label;
      }
      slot.onclick = () => { slot.style.borderColor = slot.style.borderColor === 'rgb(255, 204, 0)' ? '' : '#ffcc00'; };
      grid.appendChild(slot);
    }
    document.getElementById('inv-count').textContent = `${items.length}/32 items`;
  }

  // ── MINIMAP ──
  function drawMinimap(portals, npcs) {
    const ctx = minimapCtx;
    const W = 150, H = 150, cx = W/2, cy = H/2;
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = 'rgba(5,10,24,0.92)';
    ctx.fillRect(0, 0, W, H);

    // Concentric rings
    ctx.strokeStyle = 'rgba(0,245,255,0.06)';
    ctx.lineWidth = 1;
    [25,50,60].forEach(r => {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
    });

    // Cardinal lines
    ctx.strokeStyle = 'rgba(0,245,255,0.04)';
    ctx.beginPath(); ctx.moveTo(cx,0); ctx.lineTo(cx,H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,cy); ctx.lineTo(W,cy); ctx.stroke();

    const SCALE = 2.2;
    const project = (wx, wz) => {
      const nx = cx + wx/SCALE;
      const ny = cy + wz/SCALE;
      return [Math.max(4, Math.min(W-4, nx)), Math.max(4, Math.min(H-4, ny))];
    };

    // Portals
    portals.forEach(p => {
      const [mx, my] = project(p.x, p.z);
      const c = '#' + p.color.toString(16).padStart(6,'0');
      ctx.fillStyle = c;
      ctx.shadowColor = c; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(mx, my, 5, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
    });

    // NPCs
    npcs.forEach(n => {
      const [mx, my] = project(n.position.x, n.position.z);
      ctx.fillStyle = '#ff8800';
      ctx.beginPath(); ctx.arc(mx, my, 3, 0, Math.PI*2); ctx.fill();
    });

    // Player direction cone
    const euler = Physics.getEuler();
    const dx = Math.sin(euler.y), dz = -Math.cos(euler.y);
    ctx.fillStyle = 'rgba(0,245,255,0.12)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const coneLen = 22, coneW = 0.4;
    ctx.lineTo(cx + (dx*Math.cos(coneW)-dz*Math.sin(coneW))*coneLen, cy + (dz*Math.cos(coneW)+dx*Math.sin(coneW))*coneLen);
    ctx.lineTo(cx + (dx*Math.cos(-coneW)-dz*Math.sin(-coneW))*coneLen, cy + (dz*Math.cos(-coneW)+dx*Math.sin(-coneW))*coneLen);
    ctx.closePath(); ctx.fill();

    // Player dot
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#fff'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;

    // North label
    ctx.fillStyle = 'rgba(0,245,255,0.3)';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('N', cx, 10);
    ctx.fillText('S', cx, H-3);
    ctx.fillText('E', W-4, cy+3);
    ctx.fillText('W', 8, cy+3);
  }

  // ── STATS ──
  let fpsFrames = 0, fpsClock = performance.now(), fps = 60;
  function updateStats(camera) {
    fpsFrames++;
    const now = performance.now();
    if (now - fpsClock > 500) {
      fps = Math.round(fpsFrames / ((now - fpsClock) / 1000));
      fpsFrames = 0; fpsClock = now;
    }
    const p = camera.position;
    document.getElementById('stat-pos').textContent   = `${p.x.toFixed(0)}, ${p.y.toFixed(0)}, ${p.z.toFixed(0)}`;
    document.getElementById('stat-speed').textContent = Physics.getSpeed().toFixed(1) + ' m/s';
    document.getElementById('stat-fps').textContent   = fps;
    document.getElementById('stat-online').textContent = 1 + AvatarSystem.getNPCs().length;
  }

  // ── PORTAL HINT ──
  function setPortalHint(visible) {
    document.getElementById('portal-hint').style.display = visible ? 'block' : 'none';
  }
  function setInteractHint(visible) {
    document.getElementById('interact-hint').style.display = visible ? 'block' : 'none';
  }

  // ── WORLD FLASH ──
  function flashTransition() {
    const el = document.getElementById('world-flash');
    el.style.display = 'block';
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = 'flash 0.6s ease forwards';
    setTimeout(() => { el.style.display = 'none'; }, 700);
  }

  function isChatActive() { return chatActive; }

  return {
    init, setActiveWorld, notify, togglePanel, addChatMsg,
    drawMinimap, updateStats, setPortalHint, setInteractHint,
    flashTransition, isChatActive
  };
})();
