
/* ═══════════════════════════════════
   ui.js — HUD, Interface Layer & AI NPC System
════════════════════════════════════ */
'use strict';

const UI = (() => {
  let _camera;
  let minimapCtx;
  let chatActive = false;
  let chatMode = 'global';
  let currentTargetNPC = null;
  let panelState = { avatar: true, inventory: false, map: true };
  let notifTimeout;
  let clockInterval;
  let npcAmbientTimer = null;
  let aiStatus = { online: false, lastPing: null };
  let inventoryItems = [];
  let questLog = [];

  const STORAGE_KEYS = {
    inventory: 'mx_inventory_v2',
    quests: 'mx_quests_v2',
    memory: 'mx_npc_memory_v2'
  };

  const NPC_FALLBACK_MESSAGES = {
    guide: [
      'I can guide you. Portals glow brighter when you are close.',
      'Check the minimap for nearby portals and NPC markers.',
      'Use SHIFT to sprint if you need to cross the zone faster.'
    ],
    merchant: [
      'I sell boosts, relics, and a few shiny secrets.',
      'Bring me crystals and portal keys if you want rare items.',
      'My best stock appears when explorers finish quests.'
    ],
    quest: [
      'I have work for brave explorers: collect relics or scout hidden routes.',
      'A fresh quest is waiting: scan the nearby zone and return safely.',
      'Try helping another world first, then come back for a rare reward.'
    ],
    wanderer: [
      'This place changes every time someone explores it.',
      'The worlds feel more alive when you talk to the locals.',
      'I heard there is a rare secret hidden near a portal.'
    ]
  };

  const WORLD_LORE = {
    'NEXUS CITY': 'A neon hub world full of portals, systems, traders, and onboarding guides.',
    'OCEAN REALM': 'An aquatic biome with reefs, bubbles, currents, and glowing sea life.',
    'COSMOS': 'A low-gravity cosmic sector with planets, orbit paths, and stellar anomalies.',
    'FOREST': 'A dense natural biome with fireflies, ruins, and hidden grove paths.',
    'DESERT RUINS': 'A hot relic zone with buried vaults, old temples, and drifting sand.'
  };

  const WORLD_REWARDS = {
    'NEXUS CITY': { label: 'Portal Key', emoji: '🔮', qty: 1 },
    'OCEAN REALM': { label: 'Coral Shard', emoji: '🪸', qty: 2 },
    'COSMOS': { label: 'Star Dust', emoji: '🌟', qty: 4 },
    'FOREST': { label: 'Herbal Charm', emoji: '🍃', qty: 1 },
    'DESERT RUINS': { label: 'Relic Fragment', emoji: '🏺', qty: 2 }
  };

  const AI = {
    endpoint: 'http://127.0.0.1:8765/npc/chat',
    async ping() {
      const started = performance.now();
      try {
        const res = await fetch('http://127.0.0.1:8765/health', { method: 'GET' });
        const data = await res.json();
        aiStatus.online = !!data.ok;
        aiStatus.lastPing = Math.round(performance.now() - started);
      } catch (err) {
        aiStatus.online = false;
        aiStatus.lastPing = null;
      }
      _renderAIStatus();
      return aiStatus.online;
    },
    async chat(payload) {
      const started = performance.now();
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      aiStatus.online = !!data.ok;
      aiStatus.lastPing = Math.round(performance.now() - started);
      _renderAIStatus();
      return data;
    }
  };

  function init(camera) {
    _camera = camera;
    minimapCtx = document.getElementById('minimap').getContext('2d');
    inventoryItems = _loadJSON(STORAGE_KEYS.inventory, _defaultInventory());
    questLog = _loadJSON(STORAGE_KEYS.quests, []);

    _buildWorldTabs();
    _setupChatInput();
    _setupKeyboardShortcuts();
    _setupButtonHandlers();
    _setupNPCCommandChips();
    _startClock();
    _populateInventory();
    _renderQuestLog();
    _renderAIStatus();

    addChatMsg('SYSTEM', 'Welcome to METAVERSE NEXUS', 'system');
    addChatMsg('SYSTEM', 'Click canvas to capture mouse · ESC to release', 'system');
    addChatMsg('SYSTEM', 'Press F near an NPC for direct conversation.', 'system');
    addChatMsg('SYSTEM', 'NPC commands: /guide /quest /merchant /remember', 'system');

    AI.ping();
    setInterval(() => AI.ping(), 15000);
    _scheduleAmbientChat();
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
    _scheduleAmbientChat();
    _autoAdvanceQuests(name);
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

  function _setupNPCCommandChips() {
    document.querySelectorAll('[data-chat-cmd]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!currentTargetNPC) return;
        activateChat('npc', currentTargetNPC);
        const input = document.getElementById('chat-input');
        input.value = btn.dataset.chatCmd;
        input.focus();
      });
    });
  }

  function activateChat(mode = 'global', npc = null) {
    chatActive = true;
    chatMode = mode;
    currentTargetNPC = npc || currentTargetNPC;
    const input = document.getElementById('chat-input');
    input.removeAttribute('readonly');
    input.focus();
    input.placeholder = mode === 'npc' && currentTargetNPC
      ? `Talk to ${currentTargetNPC.userData.name}...`
      : 'Type message...';
    _renderNPCChannel();
  }

  function deactivateChat() {
    chatActive = false;
    chatMode = 'global';
    const input = document.getElementById('chat-input');
    input.setAttribute('readonly', true);
    input.blur();
    input.placeholder = 'Press T to chat or F near an NPC...';
    _renderNPCChannel();
    if (document.getElementById('canvas')) {
      document.getElementById('canvas').requestPointerLock();
    }
  }

  async function sendChat() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) { deactivateChat(); return; }
    const name = document.getElementById('player-name').value || 'NEXUS_01';
    const wasNpcMode = chatMode === 'npc';
    const lockedNpc = currentTargetNPC;
    addChatMsg(name, msg, 'player');
    input.value = '';
    deactivateChat();

    const target = wasNpcMode ? lockedNpc : getNearestNPC(4.25) || lockedNpc;
    if (target && (wasNpcMode || _looksLikeNPCIntent(msg))) {
      await talkToNPC(target, msg);
      return;
    }

    if (Math.random() > 0.5) {
      const randomNPC = _pickAmbientNPC();
      if (randomNPC) {
        setTimeout(() => talkToNPC(randomNPC, _worldIdlePrompt(randomNPC), true), 1000 + Math.random()*1500);
      }
    }
  }

  function _looksLikeNPCIntent(msg) {
    const s = msg.toLowerCase();
    return s.startsWith('/guide') || s.startsWith('/quest') || s.startsWith('/merchant') || s.startsWith('/remember') || s.includes('npc') || s.includes('guide') || s.includes('quest') || s.includes('merchant');
  }

  async function talkToNPC(npc, playerMessage = '', ambient = false) {
    if (!npc) return;
    currentTargetNPC = npc;
    _hydrateNPCMemory(npc);
    const npcData = npc.userData || {};
    const world = Worlds.getWorldData()[npcData.worldId] || Worlds.getWorldData()[0];
    const command = _extractCommand(playerMessage, npcData.role);
    const activeQuest = _findQuestForNPC(npcData.npcId);
    const systemContext = {
      npc_name: npcData.name,
      role: npcData.role || 'wanderer',
      mood: npcData.mood || 'neutral',
      bio: npcData.bio || '',
      world_name: world.name,
      world_lore: WORLD_LORE[world.name] || '',
      system_prompt: npcData.systemPrompt || '',
      player_name: document.getElementById('player-name').value || 'NEXUS_01',
      player_position: {
        x: Number(_camera.position.x.toFixed(2)),
        y: Number(_camera.position.y.toFixed(2)),
        z: Number(_camera.position.z.toFixed(2))
      },
      command,
      active_quest: activeQuest,
      inventory_summary: inventoryItems.slice(0, 10).map(i => `${i.label} x${i.qty}`).join(', ')
    };

    const memory = Array.isArray(npcData.memory) ? npcData.memory.slice(-8) : [];
    let reply = '';

    if (command === 'quest' || command === 'accept' || command === 'complete') {
      const scripted = _handleQuestCommand(npc, playerMessage, world.name);
      if (scripted) {
        addChatMsg(npcData.name || 'NPC', scripted, 'npc');
        _rememberExchange(npc, playerMessage || '[quest]', scripted);
        _renderNPCChannel();
        return;
      }
    }

    if (command === 'merchant') {
      const scripted = _handleMerchantCommand(npc, playerMessage, world.name);
      if (scripted && playerMessage.trim().toLowerCase().startsWith('/merchant')) {
        addChatMsg(npcData.name || 'NPC', scripted, 'npc');
        _rememberExchange(npc, playerMessage || '[merchant]', scripted);
        _renderNPCChannel();
        return;
      }
    }

    if (command === 'remember') {
      reply = _memorySummaryForNPC(npc);
      addChatMsg(npcData.name || 'NPC', reply, 'npc');
      _rememberExchange(npc, playerMessage || '[remember]', reply);
      _renderNPCChannel();
      return;
    }

    if (aiStatus.online) {
      try {
        const data = await AI.chat({
          npc: systemContext,
          history: memory,
          player_message: playerMessage || _worldIdlePrompt(npc),
          command
        });
        reply = (data.reply || '').trim();
        if (!data.ok && data.error && !ambient) {
          addChatMsg('SYSTEM', `AI proxy error: ${data.error}`, 'system');
        }
      } catch (err) {
        aiStatus.online = false;
        _renderAIStatus();
        if (!ambient) addChatMsg('SYSTEM', `AI request failed: ${err.message}`, 'system');
      }
    }

    if (!reply) {
      reply = _fallbackNPCReply(npc, playerMessage, command, ambient);
    }

    _rememberExchange(npc, playerMessage || '[ambient]', reply);
    addChatMsg(npcData.name || 'NPC', reply, 'npc');
    _renderNPCChannel();
  }

  function _extractCommand(message, defaultRole = 'wanderer') {
    const m = (message || '').trim().toLowerCase();
    if (m.startsWith('/guide')) return 'guide';
    if (m.startsWith('/quest')) return 'quest';
    if (m.startsWith('/merchant')) return 'merchant';
    if (m.startsWith('/remember')) return 'remember';
    if (m.startsWith('/accept')) return 'accept';
    if (m.startsWith('/complete')) return 'complete';
    if (m.includes('guide') || m.includes('help')) return 'guide';
    if (m.includes('quest') || m.includes('mission')) return 'quest';
    if (m.includes('buy') || m.includes('sell') || m.includes('shop') || m.includes('merchant')) return 'merchant';
    return defaultRole;
  }

  function _rememberExchange(npc, playerMsg, npcReply) {
    npc.userData.memory = Array.isArray(npc.userData.memory) ? npc.userData.memory : [];
    npc.userData.memory.push({ role: 'user', content: playerMsg });
    npc.userData.memory.push({ role: 'assistant', content: npcReply });
    npc.userData.memory = npc.userData.memory.slice(-12);
    _saveNPCMemory(npc);
  }

  function _memorySummaryForNPC(npc) {
    _hydrateNPCMemory(npc);
    const history = npc.userData.memory || [];
    if (!history.length) return 'I do not know you yet. Say something, and I will remember this encounter.';
    const snippets = history.slice(-4).map(x => x.content.replace(/\s+/g, ' ').slice(0, 70));
    return `I remember ${Math.ceil(history.length/2)} recent exchange(s): ${snippets.join(' | ')}`;
  }

  function _fallbackNPCReply(npc, playerMessage, command, ambient = false) {
    const npcData = npc.userData || {};
    const world = Worlds.getWorldData()[npcData.worldId] || Worlds.getWorldData()[0];
    const memory = npcData.memory || [];
    const rolePool = NPC_FALLBACK_MESSAGES[command] || NPC_FALLBACK_MESSAGES[npcData.role] || NPC_FALLBACK_MESSAGES.wanderer;
    let reply = rolePool[Math.floor(Math.random() * rolePool.length)];

    if (command === 'guide') {
      reply = `${reply} You are in ${world.name}. ${WORLD_LORE[world.name] || ''}`;
    } else if (command === 'merchant') {
      reply = `Shop stock for ${world.name}: ${_merchantStockForWorld(world.name)}.`;
    } else if (ambient) {
      reply = `${reply} ${world.name} feels active today.`;
    }

    if (playerMessage && memory.length > 0 && !ambient) {
      reply += ` I remember our recent conversation.`;
    }
    return reply;
  }

  function _handleQuestCommand(npc, playerMessage, worldName) {
    const npcData = npc.userData || {};
    const lower = (playerMessage || '').trim().toLowerCase();
    let quest = _findQuestForNPC(npcData.npcId);

    if ((lower === '/complete' || lower.includes('complete')) && quest && quest.status === 'ready_to_turn_in') {
      quest.status = 'done';
      quest.completedAt = Date.now();
      _awardRewardForWorld(worldName);
      _saveQuests();
      _renderQuestLog();
      notify(`QUEST COMPLETE: ${quest.title}`, '#7CFF8A');
      return `Quest complete. Reward granted: ${quest.reward}. Check your inventory.`;
    }

    if ((lower === '/complete' || lower.includes('complete')) && quest && quest.status === 'active') {
      return `Not yet. Travel to ${quest.objectiveWorld} first, then return to me and use /complete.`;
    }

    if (!quest) {
      quest = {
        id: `quest_${npcData.npcId}`,
        npcId: npcData.npcId,
        npcName: npcData.name,
        worldName,
        title: `${worldName} Field Assignment`,
        description: `Travel through ${worldName}, inspect one point of interest, then return to ${npcData.name}.`,
        objectiveWorld: worldName,
        reward: _questRewardForWorld(worldName),
        status: 'active',
        createdAt: Date.now()
      };
      questLog.unshift(quest);
      _saveQuests();
      _renderQuestLog();
      notify(`NEW QUEST: ${quest.title}`, '#ffcc00');
      return `Quest accepted: ${quest.title}. Objective: explore ${worldName}, then come back and use /complete. Reward: ${quest.reward}.`;
    }

    if (quest.status === 'done') {
      return `You already finished my last mission. Ask again later for another contract.`;
    }

    return `Current mission: ${quest.description} Reward: ${quest.reward}. Use /complete when you return.`;
  }

  function _autoAdvanceQuests(worldName) {
    let changed = false;
    questLog.forEach(q => {
      if (q.status === 'active' && q.objectiveWorld === worldName) {
        q.status = 'ready_to_turn_in';
        changed = true;
      }
    });
    if (changed) {
      _saveQuests();
      _renderQuestLog();
      notify(`Quest progress updated in ${worldName}`, '#00f5ff');
    }
  }

  function _handleMerchantCommand(npc, playerMessage, worldName) {
    const stock = _merchantStockForWorld(worldName).split(',').map(s => s.trim());
    const lower = (playerMessage || '').toLowerCase();
    if (!lower.includes('buy')) {
      return `Shop stock for ${worldName}: ${stock.join(', ')}. Say “buy portal key” or “buy star dust”.`;
    }
    const wanted = stock.find(item => lower.includes(item.toLowerCase().split(' ')[0]));
    if (!wanted) return `I can offer: ${stock.join(', ')}.`;
    const reward = _rewardFromLabel(wanted);
    _addInventoryItem(reward.label, reward.emoji, reward.qty || 1);
    return `Trade complete. Added ${reward.label} x${reward.qty || 1} to your inventory.`;
  }

  function _questRewardForWorld(worldName) {
    const reward = WORLD_REWARDS[worldName];
    return reward ? `${reward.label} x${reward.qty}` : 'Credits';
  }

  function _merchantStockForWorld(worldName) {
    const stock = {
      'NEXUS CITY': 'Portal Key, Speed Boost, Neon Mask',
      'OCEAN REALM': 'Coral Shard, Bubble Shield, Tide Boots',
      'COSMOS': 'Star Dust, Moon Crystal, Comet Trail',
      'FOREST': 'Herbal Charm, Stealth Charm, Grove Hood',
      'DESERT RUINS': 'Relic Fragment, Ancient Key, Sand Shield'
    };
    return stock[worldName] || 'Basic supplies';
  }

  function _rewardFromLabel(label) {
    const lookup = {
      'Portal Key': { label: 'Portal Key', emoji: '🔮', qty: 1 },
      'Speed Boost': { label: 'Speed Boost', emoji: '⚡', qty: 1 },
      'Neon Mask': { label: 'Mask', emoji: '🎭', qty: 1 },
      'Coral Shard': { label: 'Coral Shard', emoji: '🪸', qty: 1 },
      'Bubble Shield': { label: 'Shield', emoji: '🛡', qty: 1 },
      'Tide Boots': { label: 'Tide Boots', emoji: '🥾', qty: 1 },
      'Star Dust': { label: 'Star Dust', emoji: '🌟', qty: 2 },
      'Moon Crystal': { label: 'Crystal', emoji: '💎', qty: 1 },
      'Comet Trail': { label: 'Comet Trail', emoji: '☄️', qty: 1 },
      'Herbal Charm': { label: 'Herbal Charm', emoji: '🍃', qty: 1 },
      'Stealth Charm': { label: 'Stealth Charm', emoji: '🫥', qty: 1 },
      'Grove Hood': { label: 'Grove Hood', emoji: '🧥', qty: 1 },
      'Relic Fragment': { label: 'Relic Fragment', emoji: '🏺', qty: 1 },
      'Ancient Key': { label: 'Ancient Key', emoji: '🗝', qty: 1 },
      'Sand Shield': { label: 'Sand Shield', emoji: '🛡', qty: 1 }
    };
    return lookup[label] || { label, emoji: '📦', qty: 1 };
  }

  function _awardRewardForWorld(worldName) {
    const reward = WORLD_REWARDS[worldName];
    if (reward) _addInventoryItem(reward.label, reward.emoji, reward.qty);
  }

  function addNPCChat() {
    const npc = _pickAmbientNPC();
    if (!npc) return;
    talkToNPC(npc, _worldIdlePrompt(npc), true);
  }

  function _pickAmbientNPC() {
    const npcs = AvatarSystem.getNPCs();
    if (!npcs || !npcs.length) return null;
    return npcs[Math.floor(Math.random() * npcs.length)];
  }

  function _worldIdlePrompt(npc) {
    const world = Worlds.getWorldData()[npc.userData.worldId] || Worlds.getWorldData()[0];
    return `Say one short in-world line about ${world.name}.`;
  }

  function _scheduleAmbientChat() {
    if (npcAmbientTimer) clearTimeout(npcAmbientTimer);
    npcAmbientTimer = setTimeout(() => {
      addNPCChat();
      _scheduleAmbientChat();
    }, 14000 + Math.random() * 16000);
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
    if (container.children.length > 60) container.removeChild(container.firstChild);
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
        case 'KeyT': activateChat('global'); e.preventDefault(); break;
        case 'KeyF':
          const npc = getNearestNPC(4.25);
          if (npc) {
            currentTargetNPC = npc;
            activateChat('npc', npc);
            addChatMsg('SYSTEM', `Direct channel open with ${npc.userData.name}`, 'system');
            e.preventDefault();
          }
          break;
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
    const update = () => {
      const d = new Date();
      el.textContent = String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
    };
    update();
    clockInterval = setInterval(update, 1000);
  }

  function _defaultInventory() {
    return [
      {emoji:'⚡',label:'Speed Boost',qty:3},
      {emoji:'🛡',label:'Shield',qty:1},
      {emoji:'🌟',label:'Star Dust',qty:12},
      {emoji:'🔮',label:'Portal Key',qty:2},
      {emoji:'💎',label:'Crystal',qty:5},
      {emoji:'🗡',label:'Sword',qty:1},
      {emoji:'🎭',label:'Mask',qty:1},
      {emoji:'👑',label:'Crown',qty:1},
    ];
  }

  function _populateInventory() {
    const grid = document.getElementById('inv-grid');
    const total = 32;
    grid.innerHTML = '';
    for (let i = 0; i < total; i++) {
      const slot = document.createElement('div');
      slot.className = 'inv-slot';
      if (i < inventoryItems.length) {
        slot.classList.add('filled');
        slot.textContent = inventoryItems[i].emoji;
        const qty = document.createElement('div');
        qty.className = 'inv-qty';
        qty.textContent = inventoryItems[i].qty;
        slot.appendChild(qty);
        slot.title = inventoryItems[i].label;
      }
      slot.onclick = () => { slot.style.borderColor = slot.style.borderColor === 'rgb(255, 204, 0)' ? '' : '#ffcc00'; };
      grid.appendChild(slot);
    }
    document.getElementById('inv-count').textContent = `${inventoryItems.length}/32 items`;
  }

  function _addInventoryItem(label, emoji, qty = 1) {
    const existing = inventoryItems.find(i => i.label === label);
    if (existing) existing.qty += qty;
    else inventoryItems.push({ label, emoji, qty });
    _saveJSON(STORAGE_KEYS.inventory, inventoryItems);
    _populateInventory();
    notify(`ITEM ADDED: ${label} x${qty}`, '#7CFF8A');
  }

  function _renderQuestLog() {
    const el = document.getElementById('quest-list');
    if (!el) return;
    if (!questLog.length) {
      el.innerHTML = '<div class="quest-empty">No active quests yet. Ask a quest NPC with /quest.</div>';
      return;
    }
    el.innerHTML = '';
    questLog.slice(0, 6).forEach(q => {
      const div = document.createElement('div');
      div.className = 'quest-item' + (q.status === 'done' ? ' done' : '');
      const status = q.status === 'ready_to_turn_in' ? 'READY TO TURN IN' : q.status.toUpperCase().replace(/_/g, ' ');
      div.innerHTML = `
        <div class="quest-title">${q.title}</div>
        <div>${q.description}</div>
        <div class="quest-meta">${q.npcName} · ${status} · Reward: ${q.reward}</div>
      `;
      el.appendChild(div);
    });
  }

  function _findQuestForNPC(npcId) {
    return questLog.find(q => q.npcId === npcId && q.status !== 'done') || null;
  }

  function _saveQuests() {
    _saveJSON(STORAGE_KEYS.quests, questLog);
  }

  function _renderNPCChannel() {
    const box = document.getElementById('npc-channel');
    const name = document.getElementById('npc-channel-name');
    const role = document.getElementById('npc-channel-role');
    if (!box || !name || !role) return;
    const show = chatMode === 'npc' && currentTargetNPC;
    box.style.display = show ? 'block' : 'none';
    if (show) {
      name.textContent = currentTargetNPC.userData.name || 'NPC';
      role.textContent = currentTargetNPC.userData.role || 'wanderer';
    }
  }

  function _loadNPCMemoryMap() {
    return _loadJSON(STORAGE_KEYS.memory, {});
  }

  function _hydrateNPCMemory(npc) {
    const all = _loadNPCMemoryMap();
    npc.userData.memory = Array.isArray(all[npc.userData.npcId]) ? all[npc.userData.npcId] : (npc.userData.memory || []);
  }

  function _saveNPCMemory(npc) {
    const all = _loadNPCMemoryMap();
    all[npc.userData.npcId] = npc.userData.memory || [];
    _saveJSON(STORAGE_KEYS.memory, all);
  }

  function _saveJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  function _loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function drawMinimap(portals, npcs) {
    const ctx = minimapCtx;
    const W = 150, H = 150, cx = W/2, cy = H/2;
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(5,10,24,0.92)';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(0,245,255,0.06)';
    ctx.lineWidth = 1;
    [25,50,60].forEach(r => {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
    });

    ctx.strokeStyle = 'rgba(0,245,255,0.04)';
    ctx.beginPath(); ctx.moveTo(cx,0); ctx.lineTo(cx,H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,cy); ctx.lineTo(W,cy); ctx.stroke();

    const SCALE = 2.2;
    const project = (wx, wz) => {
      const nx = cx + wx/SCALE;
      const ny = cy + wz/SCALE;
      return [Math.max(4, Math.min(W-4, nx)), Math.max(4, Math.min(H-4, ny))];
    };

    portals.forEach(p => {
      const [mx, my] = project(p.x, p.z);
      const c = '#' + p.color.toString(16).padStart(6,'0');
      ctx.fillStyle = c;
      ctx.shadowColor = c; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(mx, my, 5, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
    });

    npcs.forEach(n => {
      const [mx, my] = project(n.position.x, n.position.z);
      ctx.fillStyle = n === currentTargetNPC ? '#ffffff' : '#ff8800';
      ctx.beginPath(); ctx.arc(mx, my, n === currentTargetNPC ? 4 : 3, 0, Math.PI*2); ctx.fill();
    });

    const euler = Physics.getEuler();
    const dx = Math.sin(euler.y), dz = -Math.cos(euler.y);
    ctx.fillStyle = 'rgba(0,245,255,0.12)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const coneLen = 22, coneW = 0.4;
    ctx.lineTo(cx + (dx*Math.cos(coneW)-dz*Math.sin(coneW))*coneLen, cy + (dz*Math.cos(coneW)+dx*Math.sin(coneW))*coneLen);
    ctx.lineTo(cx + (dx*Math.cos(-coneW)-dz*Math.sin(-coneW))*coneLen, cy + (dz*Math.cos(-coneW)+dx*Math.sin(-coneW))*coneLen);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#fff'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(0,245,255,0.3)';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('N', cx, 10);
    ctx.fillText('S', cx, H-3);
    ctx.fillText('E', W-4, cy+3);
    ctx.fillText('W', 8, cy+3);
  }

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
    _renderAIStatus();
  }

  function _renderAIStatus() {
    const el = document.getElementById('stat-ai');
    const ping = document.getElementById('stat-ping');
    if (!el || !ping) return;
    el.textContent = aiStatus.online ? 'ONLINE' : 'OFFLINE';
    el.style.color = aiStatus.online ? '#7CFF8A' : '#ff6b6b';
    ping.textContent = aiStatus.lastPing ? `${aiStatus.lastPing} ms` : '—';
  }

  function setPortalHint(visible) {
    document.getElementById('portal-hint').style.display = visible ? 'block' : 'none';
  }

  function setInteractHint(visible, npc = null) {
    const hint = document.getElementById('interact-hint');
    hint.style.display = visible ? 'block' : 'none';
    const target = document.getElementById('interact-target');
    if (visible && target && npc) target.textContent = `${npc.userData.name || 'NPC'} · ${npc.userData.role || 'wanderer'}`;
  }

  function flashTransition() {
    const el = document.getElementById('world-flash');
    el.style.display = 'block';
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = 'flash 0.6s ease forwards';
    setTimeout(() => { el.style.display = 'none'; }, 700);
  }

  function getNearestNPC(maxDistance = 4.25) {
    const npcs = AvatarSystem.getNPCs();
    let nearest = null;
    let best = maxDistance;
    npcs.forEach(npc => {
      const dx = _camera.position.x - npc.position.x;
      const dz = _camera.position.z - npc.position.z;
      const dist = Math.sqrt(dx*dx + dz*dz);
      if (dist < best) {
        best = dist;
        nearest = npc;
      }
    });
    return nearest;
  }

  function isChatActive() { return chatActive; }

  return {
    init, setActiveWorld, notify, togglePanel, addChatMsg,
    drawMinimap, updateStats, setPortalHint, setInteractHint,
    flashTransition, isChatActive, getNearestNPC, activateChat
  };
})();
