// OllamaRPG - Autonomous Mode UI
// Watches AI characters interact with each other

class OllamaRPGApp {
  constructor() {
    this.gameAPI = window.gameAPI;
    this.initialized = false;
    this.autonomousMode = false;
    this.manualMode = false;
    this.conversationCount = 0;
    this.currentConversation = null;
    this.playerStats = null;
  }

  async init() {
    console.log('[App] Initializing OllamaRPG');

    // Setup event listeners
    this.setupEventListeners();
    this.setupAutonomousListeners();

    // Check Ollama
    this.showLoadingScreen('Checking Ollama service...');
    const ollamaReady = await this.checkOllama();

    if (!ollamaReady) {
      this.showError('Ollama service is not available. Please start Ollama and restart the app.');
      return;
    }

    // Initialize game
    this.showLoadingScreen('Initializing game world...');

    try {
      const result = await this.gameAPI.init({
        seed: Date.now(),
        playerName: 'Kael' // Protagonist name
      });

      if (result.success) {
        console.log('[App] Game initialized:', result.data);
        this.initialized = true;
        await this.loadGameData();
        this.showGameScreen();
      } else {
        this.showError(`Failed to initialize: ${result.error}`);
      }
    } catch (error) {
      console.error('[App] Initialization failed:', error);
      this.showError(`Error: ${error.message}`);
    }
  }

  async checkOllama() {
    // Retry up to 3 times with 2 second delays
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[App] Checking Ollama (attempt ${attempt}/3)...`);
        const result = await this.gameAPI.checkOllama();
        console.log('[App] Ollama check result:', result);

        if (result.success && result.data.available) {
          document.getElementById('ollama-status').textContent = 'Ollama: Connected ✓';
          return true;
        } else {
          console.log(`[App] Ollama not available on attempt ${attempt}`);
          if (attempt < 3) {
            this.showLoadingScreen(`Waiting for Ollama service (attempt ${attempt}/3)...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      } catch (error) {
        console.error(`[App] Ollama check failed (attempt ${attempt}):`, error);
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    document.getElementById('ollama-status').textContent = 'Ollama: Disconnected ✗';
    return false;
  }

  async loadGameData() {
    try {
      // Load NPCs
      const npcsResult = await this.gameAPI.getNPCs();
      if (npcsResult.success) {
        this.displayNPCs(npcsResult.data);
        document.getElementById('npc-count').textContent = npcsResult.data.length;
      }
    } catch (error) {
      console.error('[App] Failed to load game data:', error);
    }
  }

  displayNPCs(npcs) {
    const npcList = document.getElementById('npc-list');
    npcList.innerHTML = '';

    npcs.forEach(npc => {
      const npcCard = document.createElement('div');
      npcCard.className = 'npc-card';
      npcCard.dataset.npcId = npc.id;
      npcCard.innerHTML = `
        <div class="npc-name">${npc.name}</div>
        <div class="npc-role">${npc.role}</div>
      `;

      // Add click handler style hint for manual mode
      if (this.manualMode) {
        npcCard.style.cursor = 'pointer';
      }

      npcList.appendChild(npcCard);
    });
  }

  setupEventListeners() {
    // Time updates
    this.gameAPI.onTimeUpdate((data) => {
      this.updateTimeDisplay(data);
    });

    // Start Manual Mode button
    document.getElementById('start-manual-btn').addEventListener('click', () => {
      this.startManualMode();
    });

    // Start Autonomous Mode button
    document.getElementById('start-autonomous-btn').addEventListener('click', () => {
      this.startAutonomousMode();
    });

    // Stop Autonomous Mode buttons
    document.getElementById('stop-autonomous-btn').addEventListener('click', () => {
      this.stopAutonomousMode();
    });

    document.getElementById('stop-conversation-btn').addEventListener('click', () => {
      this.stopAutonomousMode();
    });

    // End conversation button
    document.getElementById('end-conversation-btn').addEventListener('click', () => {
      if (this.manualMode) {
        this.endManualConversation();
      } else {
        this.stopAutonomousMode();
      }
    });

    // Send message button (Manual mode)
    document.getElementById('send-message-btn').addEventListener('click', () => {
      this.sendManualMessage();
    });

    // Enter key to send message
    document.getElementById('message-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendManualMessage();
      }
    });

    // NPC click to start conversation (Manual mode)
    document.getElementById('npc-list').addEventListener('click', (e) => {
      if (!this.manualMode) return;

      const npcCard = e.target.closest('.npc-card');
      if (npcCard) {
        const npcId = npcCard.dataset.npcId;
        if (npcId) {
          this.startManualConversation(npcId);
        }
      }
    });
  }

  // ============ Manual Mode Methods ============

  async startManualMode() {
    console.log('[App] Starting manual mode');

    this.manualMode = true;
    document.getElementById('mode-status').textContent = 'Manual Play';

    // Show player panel
    document.getElementById('player-panel').classList.remove('hidden');

    // Hide welcome, show conversation panel in waiting state
    document.getElementById('welcome-panel').classList.add('hidden');
    document.getElementById('conversation-panel').classList.remove('hidden');

    // Hide autonomous controls, show manual input
    document.getElementById('autonomous-conversation-controls').classList.add('hidden');
    document.getElementById('manual-input-area').classList.remove('hidden');

    // Show GM narration
    document.getElementById('gm-narration').textContent = 'Welcome, adventurer! Click on any character to start a conversation.';

    // Clear dialogue history
    document.getElementById('dialogue-history').innerHTML = '';

    // Make NPCs clickable
    const npcCards = document.querySelectorAll('.npc-card');
    npcCards.forEach(card => {
      card.style.cursor = 'pointer';
      card.classList.add('clickable');
    });

    // Load player stats
    await this.updatePlayerStats();

    this.setStatus('Manual mode started - Click on an NPC to talk');
  }

  async startManualConversation(npcId) {
    if (this.currentConversation) {
      alert('Please end the current conversation first');
      return;
    }

    try {
      console.log('[App] Starting manual conversation with', npcId);

      const result = await this.gameAPI.startConversation(npcId);

      if (result.success) {
        const data = result.data;
        this.currentConversation = data.conversationId;

        // Update UI
        document.getElementById('current-npc-name').textContent = data.npc.name;
        document.getElementById('current-npc-role').textContent = data.npc.role;
        document.getElementById('relationship-value').textContent = data.relationshipLevel || 0;
        document.getElementById('gm-narration').textContent = data.narration;

        // Clear history
        document.getElementById('dialogue-history').innerHTML = '';

        // Focus input
        document.getElementById('message-input').focus();

        this.setStatus(`Talking to ${data.npc.name}`);

      } else {
        alert(`Failed to start conversation: ${result.error}`);
      }
    } catch (error) {
      console.error('[App] Failed to start conversation:', error);
      alert(`Error: ${error.message}`);
    }
  }

  async sendManualMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();

    if (!message) {
      return;
    }

    if (!this.currentConversation) {
      alert('No active conversation. Click on an NPC to start talking.');
      return;
    }

    try {
      // Clear input immediately
      input.value = '';

      // Add player message to history
      this.addMessageToHistory({
        speaker: 'player',
        speakerName: 'You',
        text: message
      });

      // Disable input while waiting
      input.disabled = true;
      document.getElementById('send-message-btn').disabled = true;
      this.setStatus('Waiting for response...');

      // Send message
      const result = await this.gameAPI.sendMessage(this.currentConversation, message);

      if (result.success) {
        const response = result.data;

        // Add NPC response to history
        this.addMessageToHistory({
          speaker: 'npc',
          speakerName: response.speaker,
          text: response.text
        });

        // Update relationship
        if (response.relationshipLevel !== undefined) {
          document.getElementById('relationship-value').textContent = response.relationshipLevel;
        }

        this.setStatus('Your turn');

      } else {
        alert(`Failed to send message: ${result.error}`);
      }

      // Re-enable input
      input.disabled = false;
      document.getElementById('send-message-btn').disabled = false;
      input.focus();

    } catch (error) {
      console.error('[App] Failed to send message:', error);
      alert(`Error: ${error.message}`);

      // Re-enable input
      input.disabled = false;
      document.getElementById('send-message-btn').disabled = false;
    }
  }

  async endManualConversation() {
    if (!this.currentConversation) {
      return;
    }

    try {
      console.log('[App] Ending manual conversation');

      const result = await this.gameAPI.endConversation(this.currentConversation);

      if (result.success) {
        this.currentConversation = null;

        // Show GM transition
        document.getElementById('gm-narration').textContent = 'The conversation ends. Click on another character to continue your adventure.';

        // Clear input
        document.getElementById('message-input').value = '';

        this.setStatus('Conversation ended - Click on an NPC to talk');
      }
    } catch (error) {
      console.error('[App] Failed to end conversation:', error);
    }
  }

  async updatePlayerStats() {
    try {
      const result = await this.gameAPI.getPlayerStats();

      if (result.success && result.data) {
        this.playerStats = result.data;
        this.displayPlayerStats(this.playerStats);
      }
    } catch (error) {
      console.error('[App] Failed to load player stats:', error);
    }
  }

  displayPlayerStats(stats) {
    // Update name and level
    document.getElementById('player-name').textContent = stats.name || 'Kael';
    document.getElementById('player-level').textContent = `Lv ${stats.level || 1}`;

    // Update Gold
    document.getElementById('player-gold').textContent = stats.gold || 0;

    // Update HP
    const hpPercent = (stats.currentHP / stats.maxHP) * 100;
    document.getElementById('hp-text').textContent = `${stats.currentHP}/${stats.maxHP}`;
    document.getElementById('hp-fill').style.width = `${hpPercent}%`;

    // Update Stamina
    const staminaPercent = (stats.currentStamina / stats.maxStamina) * 100;
    document.getElementById('stamina-text').textContent = `${stats.currentStamina}/${stats.maxStamina}`;
    document.getElementById('stamina-fill').style.width = `${staminaPercent}%`;

    // Update Magic
    const magicPercent = (stats.currentMagic / stats.maxMagic) * 100;
    document.getElementById('magic-text').textContent = `${stats.currentMagic}/${stats.maxMagic}`;
    document.getElementById('magic-fill').style.width = `${magicPercent}%`;

    // Update XP
    const xpPercent = (stats.currentXP / stats.xpToNextLevel) * 100;
    document.getElementById('xp-text').textContent = `${stats.currentXP}/${stats.xpToNextLevel}`;
    document.getElementById('xp-fill').style.width = `${xpPercent}%`;
  }

  // ============ Autonomous Mode Methods ============

  setupAutonomousListeners() {
    // World generated
    this.gameAPI.onWorldGenerated((data) => {
      console.log('[App] World generated:', data.world);
      this.displayWorld(data.world);
    });

    // Opening narration
    this.gameAPI.onOpeningNarration((data) => {
      console.log('[App] Opening narration received');
      this.showOpeningNarration(data.narration);
    });

    // Main quest
    this.gameAPI.onMainQuest((data) => {
      console.log('[App] Main quest received:', data.quest);
      this.showMainQuest(data.quest);
    });

    // Transition narration
    this.gameAPI.onTransition((data) => {
      console.log('[App] Transition received:', data);
      this.showTransition(data);
    });

    // Action chosen
    this.gameAPI.onAutonomousAction((data) => {
      console.log('[App] Autonomous action:', JSON.stringify(data));
      if (data.type === 'npc_chosen') {
        this.setStatus(`${data.npcName} was chosen for conversation`);
        document.getElementById('mode-status').textContent = `Talking to ${data.npcName}`;
      }
    });

    // Conversation started
    this.gameAPI.onAutonomousConversationStart((data) => {
      console.log('[App] Conversation started:', JSON.stringify(data));
      this.conversationCount++;
      document.getElementById('conversation-count').textContent = this.conversationCount;
      this.showConversationPanel(data);
    });

    // Message received
    this.gameAPI.onAutonomousMessage((data) => {
      console.log('[App] Message from', data.speakerName, ':', data.text);
      this.addMessageToHistory(data);
    });

    // Conversation ended
    this.gameAPI.onAutonomousConversationEnd((data) => {
      console.log('[App] Conversation ended with', data.npcName, '-', data.turns, 'turns');
      this.setStatus(`Conversation with ${data.npcName} ended (${data.turns} turns)`);

      // Clear dialogue history after a delay
      setTimeout(() => {
        document.getElementById('dialogue-history').innerHTML = '';
        document.getElementById('gm-narration').textContent = 'Waiting for next conversation...';
      }, 3000);
    });

    // Error
    this.gameAPI.onAutonomousError((data) => {
      console.error('[App] Autonomous error:', data.message);
      this.setStatus(`Error: ${data.message}`);
    });
  }

  async startAutonomousMode() {
    if (this.autonomousMode) {
      console.log('[App] Autonomous mode already running');
      return;
    }

    console.log('[App] Starting autonomous mode');

    try {
      const result = await this.gameAPI.startAutonomous();

      if (result.success) {
        this.autonomousMode = true;

        // Show player panel
        document.getElementById('player-panel').classList.remove('hidden');

        // Hide mode selector, show stop button
        document.querySelector('.mode-selector').classList.add('hidden');
        document.querySelector('.utility-controls').classList.add('hidden');
        document.querySelector('.autonomous-controls').classList.remove('hidden');
        document.getElementById('stop-autonomous-btn').classList.remove('hidden');

        document.getElementById('mode-status').textContent = 'Running';
        this.setStatus('Autonomous mode started - AI characters are interacting...');
      } else {
        alert(`Failed to start autonomous mode: ${result.error}`);
      }
    } catch (error) {
      console.error('[App] Failed to start autonomous mode:', error);
      alert(`Error: ${error.message}`);
    }
  }

  async stopAutonomousMode() {
    if (!this.autonomousMode) {
      return;
    }

    console.log('[App] Stopping autonomous mode');

    try {
      const result = await this.gameAPI.stopAutonomous();

      if (result.success) {
        this.autonomousMode = false;

        // Show mode selector and utility controls again
        document.querySelector('.mode-selector').classList.remove('hidden');
        document.querySelector('.utility-controls').classList.remove('hidden');
        document.querySelector('.autonomous-controls').classList.add('hidden');

        document.getElementById('mode-status').textContent = 'Stopped';
        this.setStatus('Autonomous mode stopped');

        // Hide conversation panel and show welcome
        document.getElementById('conversation-panel').classList.add('hidden');
        document.getElementById('welcome-panel').classList.remove('hidden');
      }
    } catch (error) {
      console.error('[App] Failed to stop autonomous mode:', error);
    }
  }

  showConversationPanel(conversationData) {
    // Hide welcome, show conversation
    document.getElementById('welcome-panel').classList.add('hidden');
    document.getElementById('conversation-panel').classList.remove('hidden');

    // Show autonomous controls, hide manual input
    document.getElementById('autonomous-conversation-controls').classList.remove('hidden');
    document.getElementById('manual-input-area').classList.add('hidden');

    // Set NPC info
    document.getElementById('current-npc-name').textContent = conversationData.npc.name;
    document.getElementById('current-npc-role').textContent = conversationData.npc.role;

    // Show GM narration
    const narrationEl = document.getElementById('gm-narration');
    narrationEl.textContent = conversationData.narration;

    // Clear dialogue history
    document.getElementById('dialogue-history').innerHTML = '';

    this.setStatus(`Watching conversation with ${conversationData.npc.name}`);
  }

  displayWorld(world) {
    // Store world data
    this.world = world;

    const worldLocations = document.getElementById('world-locations');
    worldLocations.innerHTML = '';

    // Add cities
    if (world.cities && world.cities.length > 0) {
      const citiesSection = document.createElement('div');
      citiesSection.className = 'location-category';
      citiesSection.innerHTML = '<h4 class="category-title">🏘️ Cities & Towns</h4>';

      world.cities.forEach(city => {
        const cityEl = document.createElement('div');
        cityEl.className = 'location-item';
        cityEl.innerHTML = `
          <div class="location-name">${city.name}</div>
          <div class="location-desc">${city.description}</div>
        `;
        citiesSection.appendChild(cityEl);
      });

      worldLocations.appendChild(citiesSection);
    }

    // Add dungeons
    if (world.dungeons && world.dungeons.length > 0) {
      const dungeonsSection = document.createElement('div');
      dungeonsSection.className = 'location-category';
      dungeonsSection.innerHTML = '<h4 class="category-title">⚔️ Dungeons</h4>';

      world.dungeons.slice(0, 3).forEach(dungeon => {
        const dungeonEl = document.createElement('div');
        dungeonEl.className = 'location-item dungeon';
        const dangerColor = dungeon.danger_level === 'low' ? '#90ee90' :
                           dungeon.danger_level === 'medium' ? '#ffd700' :
                           dungeon.danger_level === 'high' ? '#ff8c00' : '#ff4444';
        dungeonEl.innerHTML = `
          <div class="location-name">${dungeon.name}</div>
          <div class="location-meta" style="color: ${dangerColor};">⚠️ ${dungeon.danger_level} danger</div>
        `;
        dungeonsSection.appendChild(dungeonEl);
      });

      worldLocations.appendChild(dungeonsSection);
    }

    // Add landmarks
    if (world.landmarks && world.landmarks.length > 0) {
      const landmarksSection = document.createElement('div');
      landmarksSection.className = 'location-category';
      landmarksSection.innerHTML = '<h4 class="category-title">🏔️ Landmarks</h4>';

      world.landmarks.slice(0, 3).forEach(landmark => {
        const landmarkEl = document.createElement('div');
        landmarkEl.className = 'location-item';
        landmarkEl.innerHTML = `
          <div class="location-name">${landmark.name}</div>
        `;
        landmarksSection.appendChild(landmarkEl);
      });

      worldLocations.appendChild(landmarksSection);
    }

    console.log(`[App] World displayed in UI`);
  }

  showOpeningNarration(narration) {
    // Hide welcome panel, show conversation panel
    document.getElementById('welcome-panel').classList.add('hidden');
    document.getElementById('conversation-panel').classList.remove('hidden');

    // Hide controls during narration
    document.getElementById('autonomous-conversation-controls').classList.add('hidden');
    document.getElementById('manual-input-area').classList.add('hidden');

    // Show narration in the GM narration area
    const narrationEl = document.getElementById('gm-narration');
    narrationEl.textContent = narration;
    narrationEl.style.fontSize = '1.1em';
    narrationEl.style.lineHeight = '1.8';
    narrationEl.style.padding = '20px';

    // Set NPC info to "The Chronicler"
    document.getElementById('current-npc-name').textContent = 'The Chronicler';
    document.getElementById('current-npc-role').textContent = 'Narrator';

    // Clear dialogue history
    document.getElementById('dialogue-history').innerHTML = '';

    this.setStatus('The tale begins...');
  }

  showMainQuest(quest) {
    // Store quest
    this.mainQuest = quest;

    // Add quest info to dialogue history
    const history = document.getElementById('dialogue-history');

    const questEl = document.createElement('div');
    questEl.className = 'message message-system';
    questEl.innerHTML = `
      <div class="message-speaker" style="color: #ffd700;">⚔ Quest Received</div>
      <div class="message-text">
        <strong>${quest.title}</strong><br>
        <em>${quest.description}</em><br><br>
        ${quest.motivation ? `<em style="color: #88ccff;">"${quest.motivation}"</em>` : ''}
      </div>
    `;

    history.appendChild(questEl);
    history.scrollTop = history.scrollHeight;

    // Update quest panel
    this.updateQuestPanel(quest);

    this.setStatus(`Quest received: ${quest.title}`);
  }

  showTransition(transitionData) {
    // Display transition in the GM narration area with special styling
    const narrationEl = document.getElementById('gm-narration');
    narrationEl.textContent = transitionData.text;
    narrationEl.classList.add('transition-narration');

    // Remove transition styling after reading
    setTimeout(() => {
      narrationEl.classList.remove('transition-narration');
    }, 3000);

    // Also add to dialogue history for reference
    const history = document.getElementById('dialogue-history');
    const transitionEl = document.createElement('div');
    transitionEl.className = 'message message-transition';
    transitionEl.innerHTML = `
      <div class="message-speaker" style="color: #88ccff;">⏱️ Scene Transition</div>
      <div class="message-text">${transitionData.text}</div>
    `;

    history.appendChild(transitionEl);
    history.scrollTop = history.scrollHeight;

    this.setStatus(`Transitioning from ${transitionData.from} to ${transitionData.to}...`);
  }

  updateQuestPanel(quest) {
    const questList = document.getElementById('quest-list');
    questList.innerHTML = '';

    const questItem = document.createElement('div');
    questItem.className = 'quest-item active';
    questItem.innerHTML = `
      <div class="quest-title">${quest.title}</div>
      <div class="quest-objectives">
        ${quest.stages && quest.stages[0] ?
          quest.stages[0].objectives.map(obj =>
            `<div class="objective">• ${obj}</div>`
          ).join('') : ''}
      </div>
    `;

    questList.appendChild(questItem);
  }

  addMessageToHistory(messageData) {
    const history = document.getElementById('dialogue-history');

    const messageEl = document.createElement('div');
    messageEl.className = `message message-${messageData.speaker}`;

    const speakerEl = document.createElement('div');
    speakerEl.className = 'message-speaker';
    speakerEl.textContent = messageData.speakerName;

    const textEl = document.createElement('div');
    textEl.className = 'message-text';
    textEl.textContent = messageData.text;

    messageEl.appendChild(speakerEl);
    messageEl.appendChild(textEl);
    history.appendChild(messageEl);

    // Auto-scroll to bottom
    history.scrollTop = history.scrollHeight;
  }

  showLoadingScreen(message) {
    document.getElementById('loading-status').textContent = message;
    document.getElementById('loading-screen').classList.remove('hidden');
    document.getElementById('game-screen').classList.add('hidden');
  }

  showGameScreen() {
    document.getElementById('loading-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
  }

  showError(message) {
    document.getElementById('loading-status').textContent = `Error: ${message}`;
    document.getElementById('loading-status').style.color = '#ff6b6b';
  }

  setStatus(text) {
    document.getElementById('status-text').textContent = text;
  }

  updateTimeDisplay(timeData) {
    // Update time
    document.getElementById('game-time').textContent = timeData.time;

    // Update time of day with capitalization
    const timeOfDay = timeData.timeOfDay.charAt(0).toUpperCase() + timeData.timeOfDay.slice(1);
    document.getElementById('time-of-day').textContent = `${timeOfDay} | ${timeData.weather} | ${timeData.season}, Year ${timeData.year}`;
  }

  // ============ Replay Methods ============

  async showReplayViewer() {
    console.log('[App] Opening replay viewer');

    // Show game screen and hide other panels
    this.showGameScreen();
    document.getElementById('welcome-panel').classList.add('hidden');
    document.getElementById('conversation-panel').classList.add('hidden');
    document.getElementById('replay-panel').classList.remove('hidden');

    // Load replay list
    await this.loadReplayList();
  }

  async loadReplayList() {
    try {
      const result = await this.gameAPI.listReplays();

      if (result.success) {
        this.displayReplayList(result.data);
      } else {
        console.error('[App] Failed to load replays:', result.error);
      }
    } catch (error) {
      console.error('[App] Error loading replays:', error);
    }
  }

  displayReplayList(replays) {
    const replayList = document.getElementById('replay-list');

    if (replays.length === 0) {
      replayList.innerHTML = '<p class="no-replays">No replays available. Run autonomous mode to create replays!</p>';
      return;
    }

    replayList.innerHTML = '';

    replays.forEach(replay => {
      const item = document.createElement('div');
      item.className = 'replay-item';

      const date = new Date(replay.modified);
      const dateStr = date.toLocaleString();

      item.innerHTML = `
        <div class="replay-item-header">
          <div class="replay-item-filename">${replay.filename}</div>
          <div class="replay-item-date">${dateStr}</div>
        </div>
        <div class="replay-item-stats">
          <span>Size: ${(replay.size / 1024).toFixed(2)} KB</span>
        </div>
      `;

      item.addEventListener('click', () => {
        this.loadAndPlayReplay(replay.filename);
      });

      replayList.appendChild(item);
    });
  }

  async loadAndPlayReplay(filename) {
    try {
      console.log('[App] Loading replay:', filename);

      const result = await this.gameAPI.loadReplay(filename);

      if (result.success) {
        this.currentReplay = result.data;
        this.showReplayPlayback(filename);
      } else {
        alert(`Failed to load replay: ${result.error}`);
      }
    } catch (error) {
      console.error('[App] Error loading replay:', error);
      alert(`Error: ${error.message}`);
    }
  }

  showReplayPlayback(filename) {
    // Hide list, show playback
    document.getElementById('replay-list-section').classList.add('hidden');
    document.getElementById('replay-playback-section').classList.remove('hidden');

    // Show game UI panels for replay (player, quests, world, time)
    document.getElementById('player-panel').classList.remove('hidden');
    document.querySelector('.world-panel').classList.remove('hidden');
    document.querySelector('.quests-panel').classList.remove('hidden');

    // Set replay info
    document.getElementById('replay-filename').textContent = filename;
    document.getElementById('replay-events').textContent = this.currentReplay.events?.length || 0;
    document.getElementById('replay-llm-calls').textContent = this.currentReplay.llmCalls?.length || 0;
    document.getElementById('replay-total-frames').textContent = this.currentReplay.events?.length || 0;

    // Setup frame slider
    const slider = document.getElementById('frame-slider');
    slider.max = (this.currentReplay.events?.length || 1) - 1;
    slider.value = 0;

    // Add checkpoint markers
    this.addCheckpointMarkers();

    // Reset playback state
    this.replayCurrentFrame = 0;
    this.replayPlaying = false;
    this.replaySpeed = 1.0;
    document.getElementById('replay-content').innerHTML = '';

    // Initialize UI with initial state
    if (this.currentReplay.initialState) {
      this.updateGameUIFromState(this.currentReplay.initialState);
    }

    this.setStatus(`Replay loaded: ${filename}`);
  }

  addCheckpointMarkers() {
    const markersContainer = document.getElementById('frame-markers');
    markersContainer.innerHTML = '';

    if (!this.currentReplay.checkpoints || this.currentReplay.checkpoints.length === 0) {
      return;
    }

    const totalFrames = this.currentReplay.events?.length || 1;

    this.currentReplay.checkpoints.forEach((checkpoint, index) => {
      const marker = document.createElement('div');
      marker.className = 'checkpoint-marker';

      const position = (checkpoint.frame / totalFrames) * 100;
      marker.style.left = `${position}%`;
      marker.setAttribute('data-label', `Checkpoint ${index + 1} (Frame ${checkpoint.frame})`);

      markersContainer.appendChild(marker);
    });
  }

  playReplay() {
    if (!this.currentReplay || this.replayPlaying) return;

    console.log('[App] Playing replay');
    this.replayPlaying = true;

    document.getElementById('replay-play-btn').classList.add('hidden');
    document.getElementById('replay-pause-btn').classList.remove('hidden');

    this.replayPlaybackLoop();
  }

  pauseReplay() {
    console.log('[App] Pausing replay');
    this.replayPlaying = false;

    document.getElementById('replay-play-btn').classList.remove('hidden');
    document.getElementById('replay-pause-btn').classList.add('hidden');
  }

  stopReplay() {
    console.log('[App] Stopping replay');
    this.replayPlaying = false;
    this.replayCurrentFrame = 0;

    document.getElementById('replay-play-btn').classList.remove('hidden');
    document.getElementById('replay-pause-btn').classList.add('hidden');
    document.getElementById('replay-content').innerHTML = '';
    document.getElementById('replay-current-frame').textContent = '0';
    document.getElementById('frame-slider').value = 0;
  }

  seekToFrame(frameNumber) {
    if (!this.currentReplay || frameNumber < 0 || frameNumber >= this.currentReplay.events.length) {
      return;
    }

    console.log('[App] Seeking to frame:', frameNumber);

    // Stop playback if playing
    const wasPlaying = this.replayPlaying;
    if (wasPlaying) {
      this.pauseReplay();
    }

    // Clear content
    document.getElementById('replay-content').innerHTML = '';

    // Display all events up to the target frame
    for (let i = 0; i <= frameNumber; i++) {
      this.displayReplayEvent(this.currentReplay.events[i]);
    }

    // Update current frame
    this.replayCurrentFrame = frameNumber + 1; // Next frame to play
    document.getElementById('replay-current-frame').textContent = frameNumber + 1;
    document.getElementById('frame-slider').value = frameNumber;

    // Resume playback if it was playing
    if (wasPlaying) {
      this.playReplay();
    }
  }

  nextFrame() {
    if (!this.currentReplay) return;

    const nextFrame = Math.min(this.replayCurrentFrame, this.currentReplay.events.length - 1);
    this.seekToFrame(nextFrame);
  }

  prevFrame() {
    if (!this.currentReplay) return;

    const prevFrame = Math.max(this.replayCurrentFrame - 2, 0);
    this.seekToFrame(prevFrame);
  }

  async replayPlaybackLoop() {
    while (this.replayPlaying && this.replayCurrentFrame < this.currentReplay.events.length) {
      const event = this.currentReplay.events[this.replayCurrentFrame];

      // Display event
      this.displayReplayEvent(event);

      // Update frame counter and slider
      this.replayCurrentFrame++;
      document.getElementById('replay-current-frame').textContent = this.replayCurrentFrame;
      document.getElementById('frame-slider').value = this.replayCurrentFrame - 1;

      // Calculate delay based on speed
      const baseDelay = 1000; // 1 second between events
      const delay = baseDelay / this.replaySpeed;

      await new Promise(resolve => setTimeout(resolve, delay));
    }

    if (this.replayCurrentFrame >= this.currentReplay.events.length) {
      console.log('[App] Replay finished');
      this.pauseReplay();
    }
  }

  displayReplayEvent(event) {
    const content = document.getElementById('replay-content');

    const eventEl = document.createElement('div');
    eventEl.className = `replay-event ${event.type.includes('dialogue') ? 'dialogue' : 'conversation'}`;

    const header = document.createElement('div');
    header.className = 'replay-event-header';
    header.innerHTML = `
      <span class="replay-event-type">${event.type}</span>
      <span>Frame: ${event.frame}</span>
    `;

    const eventContent = document.createElement('div');
    eventContent.className = 'replay-event-content';

    // Format event data based on type
    if (event.type === 'dialogue_line') {
      eventContent.textContent = `${event.characterId || event.data.speakerId}: ${event.data.text || ''}`;
    } else if (event.type === 'conversation_started') {
      eventContent.textContent = `Conversation started between ${event.data.protagonistId} and ${event.data.npcId}`;
    } else if (event.type === 'conversation_ended') {
      eventContent.textContent = `Conversation ended (${event.data.turns} turns)`;
    } else {
      eventContent.textContent = JSON.stringify(event.data || {}, null, 2);
    }

    eventEl.appendChild(header);
    eventEl.appendChild(eventContent);
    content.appendChild(eventEl);

    // Auto-scroll to bottom
    content.scrollTop = content.scrollHeight;

    // Update game UI if this event has a game state snapshot
    if (event.gameState) {
      console.log(`[Replay] Updating UI from event ${event.type} with gameState:`, event.gameState);
      this.updateGameUIFromState(event.gameState);
    } else {
      console.log(`[Replay] Event ${event.type} has no gameState`);
    }
  }

  /**
   * Update game UI panels from a game state snapshot
   * @param {Object} state - Game state snapshot
   */
  updateGameUIFromState(state) {
    if (!state) return;

    // Update player panel
    if (state.player) {
      document.getElementById('player-name').textContent = state.player.name || 'Unknown';
      document.getElementById('player-level').textContent = `Lv ${state.player.level || 1}`;
      document.getElementById('player-gold').textContent = state.player.gold || 0;

      // HP
      if (state.player.maxHP > 0) {
        const hpPercent = (state.player.currentHP / state.player.maxHP) * 100;
        document.getElementById('hp-text').textContent = `${state.player.currentHP}/${state.player.maxHP}`;
        document.getElementById('hp-fill').style.width = `${hpPercent}%`;
      }

      // MP
      if (state.player.maxMP > 0) {
        const mpPercent = (state.player.currentMP / state.player.maxMP) * 100;
        document.getElementById('mp-text').textContent = `${state.player.currentMP}/${state.player.maxMP}`;
        document.getElementById('mp-fill').style.width = `${mpPercent}%`;
      }

      // XP
      if (state.player.xpToNextLevel > 0) {
        const xpPercent = (state.player.currentXP / state.player.xpToNextLevel) * 100;
        document.getElementById('xp-text').textContent = `${state.player.currentXP}/${state.player.xpToNextLevel}`;
        document.getElementById('xp-fill').style.width = `${xpPercent}%`;
      }
    }

    // Update time display
    if (state.time) {
      console.log('[App] Updating time display with:', state.time);
      this.updateTimeDisplay(state.time);
    } else {
      console.log('[App] No time data in state snapshot');
    }

    // Update quest panel
    if (state.quests && state.quests.length > 0) {
      const questList = document.getElementById('quest-list');
      questList.innerHTML = '';

      state.quests.forEach(quest => {
        const questItem = document.createElement('div');
        questItem.className = 'quest-item active';

        const currentStage = quest.stages?.[quest.currentStage || 0];
        questItem.innerHTML = `
          <div class="quest-title">${quest.title}</div>
          <div class="quest-objectives">
            ${currentStage && currentStage.objectives ?
              currentStage.objectives.map(obj =>
                `<div class="objective">• ${obj}</div>`
              ).join('') :
              '<div class="objective">No objectives</div>'
            }
          </div>
        `;

        questList.appendChild(questItem);
      });
    }

    // Update world panel
    if (state.world) {
      const worldLocations = document.getElementById('world-locations');
      worldLocations.innerHTML = '';

      // Cities
      if (state.world.cities && state.world.cities.length > 0) {
        const citiesSection = document.createElement('div');
        citiesSection.className = 'location-category';
        citiesSection.innerHTML = '<h4 class="category-title">🏘️ Cities & Towns</h4>';

        state.world.cities.forEach(city => {
          const cityEl = document.createElement('div');
          cityEl.className = 'location-item';
          cityEl.innerHTML = `
            <div class="location-name">${city.name}</div>
            <div class="location-meta">${city.characteristic || 'Settlement'}</div>
          `;
          citiesSection.appendChild(cityEl);
        });

        worldLocations.appendChild(citiesSection);
      }

      // Dungeons
      if (state.world.dungeons && state.world.dungeons.length > 0) {
        const dungeonsSection = document.createElement('div');
        dungeonsSection.className = 'location-category';
        dungeonsSection.innerHTML = '<h4 class="category-title">🏰 Dungeons</h4>';

        state.world.dungeons.forEach(dungeon => {
          const dungeonEl = document.createElement('div');
          dungeonEl.className = 'location-item danger';
          dungeonEl.innerHTML = `
            <div class="location-name">${dungeon.name}</div>
            <div class="location-meta">Danger: ${dungeon.danger}</div>
          `;
          dungeonsSection.appendChild(dungeonEl);
        });

        worldLocations.appendChild(dungeonsSection);
      }

      // Landmarks
      if (state.world.landmarks && state.world.landmarks.length > 0) {
        const landmarksSection = document.createElement('div');
        landmarksSection.className = 'location-category';
        landmarksSection.innerHTML = '<h4 class="category-title">🗻 Landmarks</h4>';

        state.world.landmarks.forEach(landmark => {
          const landmarkEl = document.createElement('div');
          landmarkEl.className = 'location-item';
          landmarkEl.innerHTML = `
            <div class="location-name">${landmark.name}</div>
            <div class="location-meta">${landmark.specialProperty || 'Place of interest'}</div>
          `;
          landmarksSection.appendChild(landmarkEl);
        });

        worldLocations.appendChild(landmarksSection);
      }
    }

    // Update NPC panel
    if (state.npcs && state.npcs.length > 0) {
      const npcList = document.getElementById('npc-list');
      npcList.innerHTML = '';

      state.npcs.slice(0, 10).forEach(npc => {
        const npcItem = document.createElement('div');
        npcItem.className = 'npc-item';
        npcItem.innerHTML = `
          <div class="npc-item-name">${npc.name}</div>
          <div class="npc-item-role">${npc.role}</div>
          <div class="npc-item-relationship">Relationship: ${npc.relationship || 0}</div>
        `;
        npcList.appendChild(npcItem);
      });
    }
  }

  closeReplayViewer() {
    console.log('[App] Closing replay viewer');

    // Stop playback if playing
    this.stopReplay();

    // Hide game UI panels
    document.getElementById('player-panel').classList.add('hidden');
    document.querySelector('.world-panel').classList.add('hidden');
    document.querySelector('.quests-panel').classList.add('hidden');

    // Hide replay panel, show welcome
    document.getElementById('replay-panel').classList.add('hidden');
    document.getElementById('welcome-panel').classList.remove('hidden');

    // Reset to list view
    document.getElementById('replay-list-section').classList.remove('hidden');
    document.getElementById('replay-playback-section').classList.add('hidden');
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new OllamaRPGApp();
  app.init();

  // Replay viewer button
  document.getElementById('view-replays-btn').addEventListener('click', () => {
    app.showReplayViewer();
  });

  // Close replay viewer
  document.getElementById('close-replay-btn').addEventListener('click', () => {
    app.closeReplayViewer();
  });

  // Replay playback controls
  document.getElementById('replay-play-btn').addEventListener('click', () => {
    app.playReplay();
  });

  document.getElementById('replay-pause-btn').addEventListener('click', () => {
    app.pauseReplay();
  });

  document.getElementById('replay-stop-btn').addEventListener('click', () => {
    app.stopReplay();
  });

  document.getElementById('replay-speed').addEventListener('change', (e) => {
    app.replaySpeed = parseFloat(e.target.value);
    console.log('[App] Replay speed changed to:', app.replaySpeed);
  });

  // Frame navigation
  document.getElementById('replay-prev-btn').addEventListener('click', () => {
    app.prevFrame();
  });

  document.getElementById('replay-next-btn').addEventListener('click', () => {
    app.nextFrame();
  });

  // Frame slider
  document.getElementById('frame-slider').addEventListener('input', (e) => {
    const frame = parseInt(e.target.value);
    app.seekToFrame(frame);
  });

  // Keyboard shortcuts for replay
  document.addEventListener('keydown', (e) => {
    // Only handle shortcuts when replay panel is visible
    if (!document.getElementById('replay-panel').classList.contains('hidden')) {
      if (e.code === 'Space') {
        e.preventDefault();
        if (app.replayPlaying) {
          app.pauseReplay();
        } else {
          app.playReplay();
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        app.prevFrame();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        app.nextFrame();
      }
    }
  });

  // Listen for replay saved events
  app.gameAPI.onReplaySaved((data) => {
    console.log('[App] Replay saved:', data);
    app.setStatus(`Replay saved: ${data.filename} (${data.events} events, ${data.llmCalls} LLM calls)`);
  });
});
