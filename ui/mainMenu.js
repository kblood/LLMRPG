/**
 * Main Menu System
 * Handles theme selection, LLM configuration, and dynamic world generation
 */

class MainMenu {
  constructor(gameAPI) {
    this.gameAPI = gameAPI;
    this.config = this.loadConfig();
    this.availableThemes = [];
    this.availableModels = [];
    this.generatedWorld = null;
    this.currentStep = 'welcome'; // welcome, llm-select, theme-select, world-gen, world-edit
    this.init();
  }

  init() {
    console.log('[MainMenu] Initializing main menu system');
    this.setupEventListeners();
    this.loadAvailableModels();
  }

  /**
   * Load saved configuration from localStorage
   */
  loadConfig() {
    const saved = localStorage.getItem('ollama_rpg_config');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      selectedLLM: null,
      selectedTheme: null,
      gameTitle: null,
      playerName: 'Kael'
    };
  }

  /**
   * Save configuration to localStorage
   */
  saveConfig() {
    localStorage.setItem('ollama_rpg_config', JSON.stringify(this.config));
    console.log('[MainMenu] Configuration saved');
  }

  /**
   * Load available models from Ollama
   */
  async loadAvailableModels() {
    try {
      const models = await this.gameAPI.getAvailableModels();
      if (models.success) {
        this.availableModels = models.data;
        console.log('[MainMenu] Available models:', this.availableModels);
      }
    } catch (error) {
      console.error('[MainMenu] Failed to load models:', error);
      this.availableModels = [];
    }
  }

  /**
   * Load available themes
   */
  async loadAvailableThemes() {
    try {
      const themes = await this.gameAPI.getAvailableThemes();
      if (themes.success) {
        this.availableThemes = themes.data;
        console.log('[MainMenu] Available themes:', this.availableThemes);
      }
    } catch (error) {
      console.error('[MainMenu] Failed to load themes:', error);
      this.availableThemes = [
        { key: 'fantasy', name: 'Fantasy', description: 'A classic fantasy world with magic and adventure' },
        { key: 'sci-fi', name: 'Science Fiction', description: 'A futuristic world with advanced technology' },
        { key: 'cthulhu', name: 'Cosmic Horror', description: 'A dark world of cosmic horror and madness' },
        { key: 'steampunk', name: 'Steampunk', description: 'A Victorian-era steam-powered world' },
        { key: 'dark_fantasy', name: 'Dark Fantasy', description: 'A grim world of dark magic and suffering' }
      ];
    }
  }

  /**
   * Show welcome screen
   */
  showWelcome() {
    this.currentStep = 'welcome';
    const menu = document.getElementById('main-menu');
    menu.innerHTML = `
      <div class="menu-container">
        <div class="menu-header">
          <h1 class="menu-title">⚔️ OllamaRPG ⚔️</h1>
          <p class="menu-subtitle">AI-Powered Dynamic Storytelling</p>
        </div>

        <div class="menu-content">
          <div class="welcome-section">
            <h2>Welcome, Adventurer!</h2>
            <p>Welcome to OllamaRPG, where the Chronicler generates entire worlds for you to explore.</p>
            <p>Configure your game settings and embark on a unique adventure.</p>
          </div>

          <div class="menu-actions">
            <button class="menu-button primary" onclick="mainMenu.showLLMSelection()">
              ⚙️ Configure & Play
            </button>
            <button class="menu-button secondary" onclick="mainMenu.showQuickStart()">
              ⚡ Quick Start
            </button>
          </div>

          <div class="menu-info">
            <h3>Game Features:</h3>
            <ul>
              <li>🎮 Multiple themed worlds (Fantasy, Sci-Fi, Horror, Steampunk, Dark Fantasy)</li>
              <li>🤖 Choose your preferred LLM from Ollama</li>
              <li>🎲 Dynamic world generation with AI</li>
              <li>👥 Unique NPCs with auto-generated backstories</li>
              <li>⚔️ Theme-specific quests and items</li>
              <li>📖 Continuous event log for your adventure</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Show LLM selection screen
   */
  showLLMSelection() {
    this.currentStep = 'llm-select';
    const menu = document.getElementById('main-menu');

    let modelsHTML = '';
    if (this.availableModels.length === 0) {
      modelsHTML = `<p class="error-text">⚠️ No Ollama models found. Make sure Ollama is running.</p>`;
    } else {
      modelsHTML = this.availableModels.map((model, idx) => `
        <div class="model-option ${this.config.selectedLLM === model ? 'selected' : ''}"
             onclick="mainMenu.selectLLM('${model}')">
          <div class="model-name">🤖 ${model}</div>
          <div class="model-check">✓</div>
        </div>
      `).join('');
    }

    menu.innerHTML = `
      <div class="menu-container">
        <div class="menu-header">
          <h1>Select Your LLM</h1>
          <p>Choose which Ollama model to use for world generation</p>
        </div>

        <div class="menu-content">
          <div class="models-grid">
            ${modelsHTML}
          </div>

          <div class="model-info">
            <p>💡 <strong>Tip:</strong> Larger models like llama2 or mistral provide better storytelling, but require more resources.</p>
          </div>

          ${this.config.selectedLLM ? `
            <div class="selected-model">
              <h3>Selected: <strong>${this.config.selectedLLM}</strong></h3>
              <p>This LLM will be used for all content generation.</p>
            </div>
          ` : ''}
        </div>

        <div class="menu-actions">
          <button class="menu-button secondary" onclick="mainMenu.showWelcome()">
            ← Back
          </button>
          <button class="menu-button primary" ${!this.config.selectedLLM ? 'disabled' : ''}
                  onclick="mainMenu.showThemeSelection()">
            Next: Choose Theme →
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Select an LLM
   */
  selectLLM(model) {
    this.config.selectedLLM = model;
    this.saveConfig();
    this.showLLMSelection(); // Refresh to show selection
    console.log('[MainMenu] Selected LLM:', model);
  }

  /**
   * Show theme selection screen
   */
  async showThemeSelection() {
    this.currentStep = 'theme-select';
    await this.loadAvailableThemes();

    const menu = document.getElementById('main-menu');
    const themesHTML = this.availableThemes.map(theme => `
      <div class="theme-card ${this.config.selectedTheme === theme.key ? 'selected' : ''}"
           onclick="mainMenu.selectTheme('${theme.key}')">
        <div class="theme-header">
          ${this.getThemeEmoji(theme.key)} ${theme.name}
        </div>
        <p class="theme-description">${theme.description}</p>
        <div class="theme-check">✓</div>
      </div>
    `).join('');

    menu.innerHTML = `
      <div class="menu-container">
        <div class="menu-header">
          <h1>Select Game Theme</h1>
          <p>Choose the world's atmosphere and tone</p>
        </div>

        <div class="menu-content">
          <div class="themes-grid">
            ${themesHTML}
          </div>

          ${this.config.selectedTheme ? `
            <div class="theme-preview">
              <h3>${this.getThemeEmoji(this.config.selectedTheme)} ${this.getThemeName(this.config.selectedTheme)}</h3>
              <p>${this.getThemePreview(this.config.selectedTheme)}</p>
            </div>
          ` : ''}
        </div>

        <div class="menu-actions">
          <button class="menu-button secondary" onclick="mainMenu.showLLMSelection()">
            ← Back
          </button>
          <button class="menu-button primary" ${!this.config.selectedTheme ? 'disabled' : ''}
                  onclick="mainMenu.showWorldGeneration()">
            Next: Generate World →
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Select a theme
   */
  selectTheme(themeKey) {
    this.config.selectedTheme = themeKey;
    this.saveConfig();
    this.showThemeSelection(); // Refresh to show selection
    console.log('[MainMenu] Selected theme:', themeKey);
  }

  /**
   * Show world generation screen
   */
  async showWorldGeneration() {
    this.currentStep = 'world-gen';
    const menu = document.getElementById('main-menu');

    menu.innerHTML = `
      <div class="menu-container">
        <div class="menu-header">
          <h1>Generate World</h1>
          <p>Configuring your unique world...</p>
        </div>

        <div class="menu-content">
          <div class="generation-settings">
            <div class="input-group">
              <label for="game-title">Game Title:</label>
              <input type="text" id="game-title" placeholder="Enter a title for your game"
                     value="${this.config.gameTitle || ''}" />
            </div>

            <div class="input-group">
              <label for="player-name">Protagonist Name:</label>
              <input type="text" id="player-name" placeholder="Enter your character name"
                     value="${this.config.playerName || 'Kael'}" />
            </div>

            <div class="generation-options">
              <label>
                <input type="checkbox" id="gen-npcs" checked />
                Generate NPCs (5 unique characters with backstories)
              </label>
              <label>
                <input type="checkbox" id="gen-quests" checked />
                Generate Quests (main quest + side quests)
              </label>
              <label>
                <input type="checkbox" id="gen-items" checked />
                Generate Items (weapons, armor, artifacts)
              </label>
              <label>
                <input type="checkbox" id="gen-locations" checked />
                Generate Locations (themed world locations)
              </label>
            </div>

            <div class="generation-info">
              <p>🔄 Generation will use your selected LLM (<strong>${this.config.selectedLLM}</strong>)</p>
              <p>⏱️ This may take a minute or two depending on your model and hardware.</p>
            </div>
          </div>
        </div>

        <div class="menu-actions">
          <button class="menu-button secondary" onclick="mainMenu.showThemeSelection()">
            ← Back
          </button>
          <button class="menu-button primary" onclick="mainMenu.generateWorld()">
            🎲 Generate World
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Generate the world using the theme and LLM
   */
  async generateWorld() {
    const menu = document.getElementById('main-menu');

    // Get settings
    const gameTitle = document.getElementById('game-title').value || `${this.config.selectedTheme} Adventure`;
    const playerName = document.getElementById('player-name').value || 'Kael';
    const generateNPCs = document.getElementById('gen-npcs').checked;
    const generateQuests = document.getElementById('gen-quests').checked;
    const generateItems = document.getElementById('gen-items').checked;
    const generateLocations = document.getElementById('gen-locations').checked;

    this.config.gameTitle = gameTitle;
    this.config.playerName = playerName;
    this.saveConfig();

    // Show progress
    menu.innerHTML = `
      <div class="menu-container">
        <div class="menu-header">
          <h1>Generating Your World...</h1>
          <p>The Chronicler is weaving your destiny</p>
        </div>

        <div class="menu-content">
          <div class="generation-progress">
            <div class="progress-item">
              <span class="progress-spinner">⏳</span>
              <span>Initializing ${this.config.selectedTheme} world...</span>
            </div>
            ${generateNPCs ? '<div class="progress-item"><span class="progress-spinner">⏳</span><span>Generating NPCs with backstories...</span></div>' : ''}
            ${generateQuests ? '<div class="progress-item"><span class="progress-spinner">⏳</span><span>Crafting your main quest...</span></div>' : ''}
            ${generateItems ? '<div class="progress-item"><span class="progress-spinner">⏳</span><span>Creating themed items and artifacts...</span></div>' : ''}
            ${generateLocations ? '<div class="progress-item"><span class="progress-spinner">⏳</span><span>Mapping world locations...</span></div>' : ''}
          </div>

          <p class="generation-message">
            🎮 Please wait while your unique world is being generated...
          </p>
        </div>
      </div>
    `;

    try {
      // Call the game API to generate world
      const result = await this.gameAPI.generateThemedWorld({
        theme: this.config.selectedTheme,
        playerName: playerName,
        llmModel: this.config.selectedLLM,
        generateNPCs: generateNPCs,
        generateQuests: generateQuests,
        generateItems: generateItems,
        generateLocations: generateLocations,
        gameTitle: gameTitle
      });

      if (result.success) {
        this.generatedWorld = result.data;
        this.showWorldEditor();
      } else {
        this.showError(`Failed to generate world: ${result.error}`);
      }
    } catch (error) {
      console.error('[MainMenu] Generation error:', error);
      this.showError(`Generation failed: ${error.message}`);
    }
  }

  /**
   * Show world editor for reviewing/editing generated content
   */
  showWorldEditor() {
    this.currentStep = 'world-edit';
    const menu = document.getElementById('main-menu');

    if (!this.generatedWorld) {
      this.showError('No world data available');
      return;
    }

    const world = this.generatedWorld;

    menu.innerHTML = `
      <div class="menu-container">
        <div class="menu-header">
          <h1>Review Your World</h1>
          <p>Edit details before beginning your adventure</p>
        </div>

        <div class="menu-content world-editor">
          <div class="editor-section">
            <h2>📖 Game Title</h2>
            <input type="text" class="editor-input" id="edit-title"
                   value="${world.gameTitle || this.config.gameTitle}" />
          </div>

          <div class="editor-section">
            <h2>👤 Protagonist</h2>
            <input type="text" class="editor-input" id="edit-player"
                   value="${world.playerName || this.config.playerName}" />
          </div>

          ${world.npcs && world.npcs.length > 0 ? `
            <div class="editor-section">
              <h2>👥 NPCs (${world.npcs.length})</h2>
              <div class="npcs-list">
                ${world.npcs.map((npc, idx) => `
                  <div class="npc-card">
                    <input type="text" class="npc-name" data-idx="${idx}" value="${npc.name}" />
                    <textarea class="npc-backstory" data-idx="${idx}"
                              placeholder="Character backstory">${npc.backstory || ''}</textarea>
                    <button class="btn-small" onclick="mainMenu.removeNPC(${idx})">🗑️ Remove</button>
                  </div>
                `).join('')}
              </div>
              <button class="btn-add" onclick="mainMenu.addNPC()">➕ Add NPC</button>
            </div>
          ` : ''}

          ${world.mainQuest ? `
            <div class="editor-section">
              <h2>⚔️ Main Quest</h2>
              <input type="text" class="editor-input" id="edit-quest-title"
                     value="${world.mainQuest.title || ''}" />
              <textarea class="editor-input" id="edit-quest-desc"
                        rows="3">${world.mainQuest.description || ''}</textarea>
            </div>
          ` : ''}

          ${world.items && world.items.length > 0 ? `
            <div class="editor-section">
              <h2>🎁 Items (${world.items.length})</h2>
              <div class="items-list">
                ${world.items.slice(0, 5).map((item, idx) => `
                  <div class="item-card">
                    <strong>${item.name}</strong> (${item.rarity})
                    <p>${item.description}</p>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${world.locations && world.locations.length > 0 ? `
            <div class="editor-section">
              <h2>🏰 Locations (${world.locations.length})</h2>
              <div class="locations-list">
                ${world.locations.slice(0, 5).map((loc, idx) => `
                  <div class="location-card">
                    <strong>${loc.name}</strong> (${loc.type})
                    <p>${loc.description}</p>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div class="editor-section">
            <h2>📝 Opening Narration</h2>
            <div class="narration-box">
              ${world.openingNarration || 'The Chronicler is preparing your story...'}
            </div>
          </div>
        </div>

        <div class="menu-actions">
          <button class="menu-button secondary" onclick="mainMenu.showWorldGeneration()">
            ← Back
          </button>
          <button class="menu-button primary" onclick="mainMenu.startGame()">
            🎮 Start Game
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Add a new NPC to the world
   */
  addNPC() {
    if (!this.generatedWorld.npcs) {
      this.generatedWorld.npcs = [];
    }
    this.generatedWorld.npcs.push({
      name: 'New NPC',
      backstory: ''
    });
    this.showWorldEditor();
  }

  /**
   * Remove an NPC from the world
   */
  removeNPC(idx) {
    if (this.generatedWorld.npcs) {
      this.generatedWorld.npcs.splice(idx, 1);
      this.showWorldEditor();
    }
  }

  /**
   * Start the game with the configured world
   */
  async startGame() {
    // Collect edited values
    if (this.generatedWorld.gameTitle) {
      this.generatedWorld.gameTitle = document.getElementById('edit-title')?.value || this.generatedWorld.gameTitle;
    }
    if (this.generatedWorld.playerName) {
      this.generatedWorld.playerName = document.getElementById('edit-player')?.value || this.generatedWorld.playerName;
    }

    // Store world config for game backend
    localStorage.setItem('game_world_config', JSON.stringify(this.generatedWorld));

    // Hide menu and start game
    const menuDiv = document.getElementById('main-menu');
    if (menuDiv) {
      menuDiv.style.display = 'none';
    }

    // Start the game with the world config
    await this.gameAPI.initGame({
      theme: this.config.selectedTheme,
      playerName: this.generatedWorld.playerName,
      gameTitle: this.generatedWorld.gameTitle,
      worldConfig: this.generatedWorld
    });
  }

  /**
   * Quick start with default settings
   */
  async showQuickStart() {
    this.config.selectedLLM = this.availableModels[0] || 'llama2';
    this.config.selectedTheme = 'fantasy';
    this.saveConfig();
    await this.showWorldGeneration();
  }

  /**
   * Show error screen
   */
  showError(message) {
    const menu = document.getElementById('main-menu');
    menu.innerHTML = `
      <div class="menu-container">
        <div class="menu-header">
          <h1>⚠️ Error</h1>
        </div>

        <div class="menu-content">
          <p class="error-message">${message}</p>
        </div>

        <div class="menu-actions">
          <button class="menu-button primary" onclick="mainMenu.showWelcome()">
            ← Return to Menu
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Helper: Get theme emoji
   */
  getThemeEmoji(themeKey) {
    const emojis = {
      fantasy: '🐉',
      'sci-fi': '🚀',
      cthulhu: '👁️',
      steampunk: '⚙️',
      dark_fantasy: '⚫'
    };
    return emojis[themeKey] || '🎮';
  }

  /**
   * Helper: Get theme name
   */
  getThemeName(themeKey) {
    const themes = {
      fantasy: 'Fantasy',
      'sci-fi': 'Science Fiction',
      cthulhu: 'Cosmic Horror',
      steampunk: 'Steampunk',
      dark_fantasy: 'Dark Fantasy'
    };
    return themes[themeKey] || 'Unknown Theme';
  }

  /**
   * Helper: Get theme preview text
   */
  getThemePreview(themeKey) {
    const previews = {
      fantasy: 'Experience a world of magic, kingdoms, and legendary quests. Battle dragons, uncover ancient secrets, and become a hero.',
      'sci-fi': 'Journey through a high-tech future with AI, space travel, and technological wonders. Explore distant worlds and cosmic mysteries.',
      cthulhu: 'Delve into cosmic horror where sanity is fragile and ancient evils lurk beyond reality. Investigate cults and forbidden knowledge.',
      steampunk: 'Navigate a steam-powered Victorian world of gears, airships, and mechanical marvels. Revolution awaits.',
      dark_fantasy: 'Survive in a grim world of dark magic and moral ambiguity. Power corrupts, but it might be necessary.'
    };
    return previews[themeKey] || 'An unknown world awaits...';
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Handle escape key to return to menu
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.currentStep !== 'welcome') {
        this.showWelcome();
      }
    });
  }

  /**
   * Show the menu (make it visible)
   */
  show() {
    const menuDiv = document.getElementById('main-menu');
    if (menuDiv) {
      menuDiv.style.display = 'block';
    }
    this.showWelcome();
  }

  /**
   * Hide the menu
   */
  hide() {
    const menuDiv = document.getElementById('main-menu');
    if (menuDiv) {
      menuDiv.style.display = 'none';
    }
  }
}

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MainMenu;
}
