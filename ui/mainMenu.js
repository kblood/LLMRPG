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
        console.log('[MainMenu] Available models count:', this.availableModels.length);
        if (this.availableModels.length > 0) {
          console.log('[MainMenu] First model structure:', JSON.stringify(this.availableModels[0], null, 2));
        }
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
   * Show welcome screen with main menu options
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
            <p>Choose your path and embark on a legendary adventure.</p>
          </div>

          <!-- Main Menu Grid - 8 Buttons -->
          <div class="main-menu-grid">
            <button class="menu-button primary large" onclick="mainMenu.startGame()">
              🎮 Start Game
            </button>
            <button class="menu-button secondary large" onclick="mainMenu.showReplayViewer()">
              📼 Play Replay
            </button>
            <button class="menu-button secondary large" onclick="mainMenu.showGenerateThemeAdvanced()">
              🌍 Generate New Theme
            </button>
            <button class="menu-button secondary large" onclick="mainMenu.showConfigureTheme()">
              ⚙️ Configure Theme
            </button>
            <button class="menu-button secondary large" onclick="mainMenu.showSetLLMEngine()">
              🤖 Set LLM Engine
            </button>
            <button class="menu-button secondary large" onclick="mainMenu.showSaveTheme()">
              💾 Save Theme
            </button>
            <button class="menu-button secondary large" onclick="mainMenu.showLoadTheme()">
              📂 Load Theme
            </button>
            <button class="menu-button danger large" onclick="mainMenu.quitGame()">
              🚪 Quit Game
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
   * Show LLM selection screen (Set LLM Engine)
   */
  showSetLLMEngine() {
    this.currentStep = 'llm-select';
    const menu = document.getElementById('main-menu');

    let modelsHTML = '';
    if (this.availableModels.length === 0) {
      modelsHTML = `<p class="error-text">⚠️ No Ollama models found. Make sure Ollama is running.</p>`;
    } else {
      modelsHTML = this.availableModels.map((model, idx) => {
        // Handle both string and object formats
        const modelName = typeof model === 'string' ? model : (model.name || model.Model || JSON.stringify(model));
        const isSelected = this.config.selectedLLM === modelName;
        return `
          <div class="model-option ${isSelected ? 'selected' : ''}"
               onclick="mainMenu.selectLLM('${modelName}')">
            <div class="model-name">🤖 ${modelName}</div>
            <div class="model-check">✓</div>
          </div>
        `;
      }).join('');
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
   * Select an LLM and show confirmation
   */
  selectLLM(model) {
    this.config.selectedLLM = model;
    this.saveConfig();
    console.log('[MainMenu] Selected LLM:', model);

    // Show confirmation and return to menu
    const menu = document.getElementById('main-menu');
    menu.innerHTML = `
      <div class="menu-container">
        <div class="menu-header">
          <h1>✓ LLM Engine Set!</h1>
        </div>

        <div class="menu-content">
          <div class="success-message">
            <p>LLM Engine has been set to <strong>${model}</strong></p>
            <p>This model will be used for all world generation and will be your default for future sessions.</p>
          </div>
        </div>

        <div class="menu-actions">
          <button class="menu-button primary" onclick="mainMenu.showWelcome()">
            ← Back to Main Menu
          </button>
        </div>
      </div>
    `;
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
          <button class="menu-button secondary" onclick="mainMenu.showSaveTheme()">
            💾 Save Theme
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
   * Quick start with default settings
   */
  async showQuickStart() {
    // Get the first model name (handle both string and object formats)
    if (this.availableModels.length > 0) {
      const firstModel = this.availableModels[0];
      this.config.selectedLLM = typeof firstModel === 'string' ? firstModel : (firstModel.name || firstModel.model || 'llama2');
    } else {
      this.config.selectedLLM = 'llama2';
    }
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
   * Show save theme screen
   */
  async showSaveTheme() {
    this.currentStep = 'save-theme';
    const menu = document.getElementById('main-menu');

    if (!this.generatedWorld) {
      this.showError('No world to save. Generate a world first.');
      return;
    }

    menu.innerHTML = `
      <div class="menu-container">
        <div class="menu-header">
          <h1>Save Your Theme</h1>
          <p>Save this world configuration to load later</p>
        </div>

        <div class="menu-content">
          <div class="generation-settings">
            <div class="input-group">
              <label for="save-theme-name">Theme Name:</label>
              <input type="text" id="save-theme-name" placeholder="e.g., My Epic Adventure"
                     value="${this.generatedWorld.gameTitle || 'My World'}" />
            </div>

            <div class="input-group">
              <label for="save-theme-id">Theme ID (folder name):</label>
              <input type="text" id="save-theme-id" placeholder="e.g., my-world-001"
                     value="${this.generatedWorld.gameTitle?.toLowerCase().replace(/\s+/g, '-') || 'my-world'}" />
            </div>

            <div class="input-group">
              <label for="save-theme-desc">Description:</label>
              <textarea id="save-theme-desc" placeholder="Describe this world..."
                        rows="3">${this.generatedWorld.description || ''}</textarea>
            </div>

            <div class="generation-info">
              <p>📦 This will save all world data: NPCs, items, locations, quests, and introduction narration</p>
            </div>
          </div>
        </div>

        <div class="menu-actions">
          <button class="menu-button secondary" onclick="mainMenu.showWorldEditor()">
            ← Back
          </button>
          <button class="menu-button primary" onclick="mainMenu.saveThemeToFile()">
            💾 Save Theme
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Save theme to file
   */
  async saveThemeToFile() {
    const themeName = document.getElementById('save-theme-name').value || 'My World';
    const themeId = document.getElementById('save-theme-id').value || 'my-world';
    const description = document.getElementById('save-theme-desc').value || '';

    if (!themeId.trim()) {
      this.showError('Theme ID cannot be empty');
      return;
    }

    const menu = document.getElementById('main-menu');
    menu.innerHTML = `
      <div class="menu-container">
        <div class="menu-header">
          <h1>Saving Theme...</h1>
          <p>Please wait</p>
        </div>
        <div class="menu-content">
          <div class="generation-progress">
            <div class="progress-item">
              <span class="progress-spinner">⏳</span>
              <span>Saving theme "${themeName}" as "${themeId}"...</span>
            </div>
          </div>
        </div>
      </div>
    `;

    try {
      const themeData = {
        theme: {
          name: themeName,
          description: description,
          theme: this.config.selectedTheme
        },
        config: {
          name: themeName,
          description: description,
          theme: this.config.selectedTheme,
          playerName: this.generatedWorld.playerName,
          gameTitle: this.generatedWorld.gameTitle
        },
        characters: this.generatedWorld.npcs || [],
        items: this.generatedWorld.items || [],
        locations: this.generatedWorld.locations || [],
        introduction: {
          playerName: this.generatedWorld.playerName,
          gameTitle: this.generatedWorld.gameTitle,
          openingNarration: this.generatedWorld.openingNarration || '',
          theme: this.config.selectedTheme
        }
      };

      const result = await this.gameAPI.saveTheme(themeId, themeData);

      if (result.success) {
        menu.innerHTML = `
          <div class="menu-container">
            <div class="menu-header">
              <h1>✓ Theme Saved!</h1>
            </div>

            <div class="menu-content">
              <div class="success-message">
                <p>Theme "<strong>${themeName}</strong>" has been saved successfully!</p>
                <p>You can load this theme later from the load menu.</p>
              </div>
            </div>

            <div class="menu-actions">
              <button class="menu-button secondary" onclick="mainMenu.showWelcome()">
                ← Back to Menu
              </button>
              <button class="menu-button primary" onclick="mainMenu.startGame()">
                🎮 Start Game
              </button>
            </div>
          </div>
        `;
      } else {
        this.showError(`Failed to save theme: ${result.error}`);
      }
    } catch (error) {
      console.error('[MainMenu] Save theme error:', error);
      this.showError(`Save failed: ${error.message}`);
    }
  }

  /**
   * Show load theme screen
   */
  async showLoadTheme() {
    this.currentStep = 'load-theme';
    const menu = document.getElementById('main-menu');

    menu.innerHTML = `
      <div class="menu-container">
        <div class="menu-header">
          <h1>Load a Saved Theme</h1>
          <p>Choose a previously saved world to play</p>
        </div>

        <div class="menu-content">
          <div class="generation-progress">
            <div class="progress-item">
              <span class="progress-spinner">⏳</span>
              <span>Loading saved themes...</span>
            </div>
          </div>
        </div>
      </div>
    `;

    try {
      const result = await this.gameAPI.listThemes();

      if (!result.success || !result.themes || result.themes.length === 0) {
        menu.innerHTML = `
          <div class="menu-container">
            <div class="menu-header">
              <h1>Load Theme</h1>
              <p>No saved themes found</p>
            </div>

            <div class="menu-content">
              <div class="error-text">
                No saved themes found. Create a new world and save it first!
              </div>
            </div>

            <div class="menu-actions">
              <button class="menu-button secondary" onclick="mainMenu.showWelcome()">
                ← Back
              </button>
            </div>
          </div>
        `;
        return;
      }

      const themesHTML = result.themes.map(theme => `
        <div class="theme-card" onclick="mainMenu.loadThemeData('${theme.id}')">
          <div class="theme-header">${theme.name || theme.id}</div>
          <p class="theme-description">${theme.description || 'No description'}</p>
          <small style="color: var(--text-muted);">Theme: ${theme.theme || 'Unknown'}</small>
        </div>
      `).join('');

      menu.innerHTML = `
        <div class="menu-container">
          <div class="menu-header">
            <h1>Load a Saved Theme</h1>
            <p>Choose a previously saved world to play</p>
          </div>

          <div class="menu-content">
            <div class="themes-grid">
              ${themesHTML}
            </div>
          </div>

          <div class="menu-actions">
            <button class="menu-button secondary" onclick="mainMenu.showWelcome()">
              ← Back
            </button>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('[MainMenu] Load themes error:', error);
      this.showError(`Failed to load themes: ${error.message}`);
    }
  }

  /**
   * Load theme data and set as default
   */
  async loadThemeData(themeId) {
    const menu = document.getElementById('main-menu');
    menu.innerHTML = `
      <div class="menu-container">
        <div class="menu-header">
          <h1>Loading Theme...</h1>
          <p>Please wait</p>
        </div>
        <div class="menu-content">
          <div class="generation-progress">
            <div class="progress-item">
              <span class="progress-spinner">⏳</span>
              <span>Loading theme "${themeId}"...</span>
            </div>
          </div>
        </div>
      </div>
    `;

    try {
      const result = await this.gameAPI.loadTheme(themeId);

      if (result.success && result.data) {
        const themeData = result.data;
        const config = themeData.config || {};

        // Reconstruct the world object from saved data
        this.generatedWorld = {
          gameTitle: config.gameTitle || themeId,
          playerName: config.playerName || 'Kael',
          description: config.description || '',
          npcs: themeData.characters || [],
          items: themeData.items || [],
          locations: themeData.locations || [],
          openingNarration: themeData.introduction?.openingNarration || '',
          theme: config.theme || 'fantasy'
        };

        // Set selected theme as default and save
        this.config.selectedTheme = this.generatedWorld.theme;
        this.saveConfig();

        // Show confirmation and return to menu
        const themeName = config.name || themeId;
        menu.innerHTML = `
          <div class="menu-container">
            <div class="menu-header">
              <h1>✓ Theme Loaded!</h1>
            </div>

            <div class="menu-content">
              <div class="success-message">
                <p><strong>${themeName}</strong> has been loaded and set as your default theme.</p>
                <p>You can now start the game, configure it further, or return to the menu.</p>
              </div>
            </div>

            <div class="menu-actions">
              <button class="menu-button secondary" onclick="mainMenu.showWelcome()">
                ← Back to Menu
              </button>
              <button class="menu-button secondary" onclick="mainMenu.showConfigureTheme()">
                ⚙️ Configure Theme
              </button>
              <button class="menu-button primary" onclick="mainMenu.startGame()">
                🎮 Start Game
              </button>
            </div>
          </div>
        `;
      } else {
        this.showError(`Failed to load theme: ${result.error}`);
      }
    } catch (error) {
      console.error('[MainMenu] Load theme data error:', error);
      this.showError(`Failed to load theme: ${error.message}`);
    }
  }

  /**
   * Start game immediately with current configuration
   */
  async startGame() {
    if (!this.generatedWorld) {
      this.showError('No world loaded. Generate or load a theme first.');
      return;
    }

    // Initialize the game backend with world config
    await this.initializeGameBackend();

    // Then show mode selector
    this.showGameplayModeSelector();
  }

  /**
   * Initialize game backend with loaded world
   */
  async initializeGameBackend() {
    // Collect edited values if from world editor
    if (document.getElementById('edit-title')) {
      this.generatedWorld.gameTitle = document.getElementById('edit-title')?.value || this.generatedWorld.gameTitle;
    }
    if (document.getElementById('edit-player')) {
      this.generatedWorld.playerName = document.getElementById('edit-player')?.value || this.generatedWorld.playerName;
    }

    // Store world config for game backend
    localStorage.setItem('game_world_config', JSON.stringify(this.generatedWorld));

    try {
      console.log('[MainMenu] Initializing backend with world config...');
      console.log('[MainMenu] Player name:', this.generatedWorld.playerName);
      console.log('[MainMenu] Game title:', this.generatedWorld.gameTitle);

      const result = await this.gameAPI.init({
        seed: Date.now(),
        playerName: this.generatedWorld.playerName,
        gameTitle: this.generatedWorld.gameTitle,
        theme: this.config.selectedTheme,
        worldConfig: this.generatedWorld
      });

      console.log('[MainMenu] Backend initialized:', result);

      // Initialize the UI (skip backend init since we already did it)
      if (typeof app !== 'undefined' && app) {
        console.log('[MainMenu] Initializing app...');
        await app.init(true);
      } else {
        console.error('[MainMenu] App not found');
      }
    } catch (error) {
      console.error('[MainMenu] Failed to initialize game:', error);
      this.showError(`Failed to initialize game: ${error.message}`);
    }
  }

  /**
   * Show replay viewer
   */
  async showReplayViewer() {
    this.currentStep = 'replay-viewer';
    const menu = document.getElementById('main-menu');

    menu.innerHTML = `
      <div class="menu-container">
        <div class="menu-header">
          <h1>📼 Replay Viewer</h1>
          <p>Watch recorded autonomous mode adventures</p>
        </div>

        <div class="menu-content">
          <div class="generation-progress">
            <div class="progress-item">
              <span class="progress-spinner">⏳</span>
              <span>Loading replays...</span>
            </div>
          </div>
        </div>

        <div class="menu-actions">
          <button class="menu-button secondary" onclick="mainMenu.showWelcome()">
            ← Back
          </button>
        </div>
      </div>
    `;

    try {
      const result = await this.gameAPI.listReplays();

      if (!result.success || !result.data || result.data.length === 0) {
        menu.innerHTML = `
          <div class="menu-container">
            <div class="menu-header">
              <h1>📼 Replay Viewer</h1>
              <p>No replays available</p>
            </div>

            <div class="menu-content">
              <div class="error-text">
                No replays found. Run autonomous mode to create replays!
              </div>
            </div>

            <div class="menu-actions">
              <button class="menu-button secondary" onclick="mainMenu.showWelcome()">
                ← Back
              </button>
            </div>
          </div>
        `;
        return;
      }

      const replaysHTML = result.data.map(replay => `
        <div class="theme-card" onclick="mainMenu.loadReplay('${replay}')">
          <div class="theme-header">📼 ${replay}</div>
          <p class="theme-description">Click to play this replay</p>
        </div>
      `).join('');

      menu.innerHTML = `
        <div class="menu-container">
          <div class="menu-header">
            <h1>📼 Replay Viewer</h1>
            <p>Select a replay to watch</p>
          </div>

          <div class="menu-content">
            <div class="themes-grid">
              ${replaysHTML}
            </div>
          </div>

          <div class="menu-actions">
            <button class="menu-button secondary" onclick="mainMenu.showWelcome()">
              ← Back
            </button>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('[MainMenu] Error loading replays:', error);
      this.showError(`Failed to load replays: ${error.message}`);
    }
  }

  /**
   * Load and play a replay
   */
  async loadReplay(filename) {
    const menu = document.getElementById('main-menu');

    menu.innerHTML = `
      <div class="menu-container">
        <div class="menu-header">
          <h1>📼 Loading Replay...</h1>
          <p>Please wait</p>
        </div>
        <div class="menu-content">
          <div class="generation-progress">
            <div class="progress-item">
              <span class="progress-spinner">⏳</span>
              <span>Loading ${filename}...</span>
            </div>
          </div>
        </div>
      </div>
    `;

    try {
      const result = await this.gameAPI.loadReplay(filename);

      if (result.success) {
        // Hide menu and start replay viewer in app
        menu.style.display = 'none';

        if (typeof app !== 'undefined' && app) {
          await app.showReplayViewer();
        }
      } else {
        this.showError(`Failed to load replay: ${result.error}`);
      }
    } catch (error) {
      console.error('[MainMenu] Error loading replay:', error);
      this.showError(`Failed to load replay: ${error.message}`);
    }
  }

  /**
   * Show advanced generate theme screen with custom instructions
   */
  async showGenerateThemeAdvanced() {
    this.currentStep = 'gen-theme-advanced';
    const menu = document.getElementById('main-menu');

    menu.innerHTML = `
      <div class="menu-container">
        <div class="menu-header">
          <h1>🌍 Generate New Theme</h1>
          <p>Create a unique world with optional custom instructions</p>
        </div>

        <div class="menu-content">
          <div class="generation-settings">
            <div class="input-group">
              <label for="adv-theme-select">Theme:</label>
              <select id="adv-theme-select" class="theme-select">
                <option value="fantasy">🐉 Fantasy</option>
                <option value="sci-fi">🚀 Science Fiction</option>
                <option value="cthulhu">👁️ Cosmic Horror</option>
                <option value="steampunk">⚙️ Steampunk</option>
                <option value="dark_fantasy">⚫ Dark Fantasy</option>
              </select>
            </div>

            <div class="input-group">
              <label for="adv-game-title">Game Title:</label>
              <input type="text" id="adv-game-title" placeholder="Enter a title for your game" />
            </div>

            <div class="input-group">
              <label for="adv-player-name">Player Name:</label>
              <input type="text" id="adv-player-name" placeholder="Enter your character name" value="Kael" />
            </div>

            <div class="generation-options">
              <label>
                <input type="checkbox" id="adv-gen-npcs" checked />
                Generate NPCs (5 unique characters with backstories)
              </label>
              <label>
                <input type="checkbox" id="adv-gen-quests" checked />
                Generate Quests (main quest + side quests)
              </label>
              <label>
                <input type="checkbox" id="adv-gen-items" checked />
                Generate Items (weapons, armor, artifacts)
              </label>
              <label>
                <input type="checkbox" id="adv-gen-locations" checked />
                Generate Locations (themed world locations)
              </label>
            </div>

            <div class="input-group">
              <label for="adv-custom-instructions">Custom LLM Instructions (Optional):</label>
              <textarea id="adv-custom-instructions" placeholder="Provide custom instructions for how the LLM should generate this world. For example: 'Make the NPCs comedic and sarcastic' or 'Focus on horror and dread'"
                        rows="4"></textarea>
              <small style="color: var(--text-muted);">Leave empty to use default generation style</small>
            </div>

            <div class="generation-info">
              <p>🔄 Generation will use your selected LLM</p>
              <p>⏱️ This may take a minute or two depending on your model and hardware.</p>
            </div>
          </div>
        </div>

        <div class="menu-actions">
          <button class="menu-button secondary" onclick="mainMenu.showWelcome()">
            ← Back
          </button>
          <button class="menu-button primary" onclick="mainMenu.generateWorldAdvanced()">
            🎲 Generate World
          </button>
        </div>
      </div>
    `;

    // Pre-select current theme if any
    if (this.config.selectedTheme) {
      setTimeout(() => {
        const select = document.getElementById('adv-theme-select');
        if (select) {
          select.value = this.config.selectedTheme;
        }
      }, 100);
    }
  }

  /**
   * Generate world with advanced options
   */
  async generateWorldAdvanced() {
    const theme = document.getElementById('adv-theme-select').value;
    const gameTitle = document.getElementById('adv-game-title').value || `${theme} Adventure`;
    const playerName = document.getElementById('adv-player-name').value || 'Kael';
    const customInstructions = document.getElementById('adv-custom-instructions').value || null;
    const generateNPCs = document.getElementById('adv-gen-npcs').checked;
    const generateQuests = document.getElementById('adv-gen-quests').checked;
    const generateItems = document.getElementById('adv-gen-items').checked;
    const generateLocations = document.getElementById('adv-gen-locations').checked;

    this.config.selectedTheme = theme;
    this.config.selectedLLM = this.config.selectedLLM || 'llama2';
    this.saveConfig();

    const menu = document.getElementById('main-menu');
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
              <span>Initializing ${theme} world...</span>
            </div>
            ${generateNPCs ? '<div class="progress-item"><span class="progress-spinner">⏳</span><span>Generating NPCs with backstories...</span></div>' : ''}
            ${generateQuests ? '<div class="progress-item"><span class="progress-spinner">⏳</span><span>Crafting your main quest...</span></div>' : ''}
            ${generateItems ? '<div class="progress-item"><span class="progress-spinner">⏳</span><span>Creating themed items and artifacts...</span></div>' : ''}
            ${generateLocations ? '<div class="progress-item"><span class="progress-spinner">⏳</span><span>Mapping world locations...</span></div>' : ''}
            ${customInstructions ? '<div class="progress-item"><span class="progress-spinner">⏳</span><span>Applying custom instructions...</span></div>' : ''}
          </div>

          <p class="generation-message">
            🎮 Please wait while your unique world is being generated...
          </p>
        </div>
      </div>
    `;

    try {
      const generationConfig = {
        theme: theme,
        playerName: playerName,
        llmModel: this.config.selectedLLM,
        generateNPCs: generateNPCs,
        generateQuests: generateQuests,
        generateItems: generateItems,
        generateLocations: generateLocations,
        gameTitle: gameTitle
      };

      // Add custom instructions if provided
      if (customInstructions && customInstructions.trim()) {
        generationConfig.customInstructions = customInstructions;
      }

      const result = await this.gameAPI.generateThemedWorld(generationConfig);

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
   * Show configure theme main menu
   */
  async showConfigureTheme() {
    this.currentStep = 'configure-theme';
    const menu = document.getElementById('main-menu');

    if (!this.generatedWorld) {
      this.showError('No world loaded. Generate or load a theme first.');
      return;
    }

    menu.innerHTML = `
      <div class="menu-container">
        <div class="menu-header">
          <h1>⚙️ Configure Theme</h1>
          <p>Customize your world</p>
        </div>

        <div class="menu-content">
          <div class="config-info">
            <p>Current Theme: <strong>${this.getThemeName(this.config.selectedTheme || 'unknown')}</strong></p>
            <p>Game Title: <strong>${this.generatedWorld.gameTitle || 'Untitled'}</strong></p>
            <p>Player: <strong>${this.generatedWorld.playerName || 'Kael'}</strong></p>
            <p>NPCs: <strong>${this.generatedWorld.npcs?.length || 0}</strong></p>
            <p>Items: <strong>${this.generatedWorld.items?.length || 0}</strong></p>
            <p>Locations: <strong>${this.generatedWorld.locations?.length || 0}</strong></p>
          </div>

          <div class="config-menu-grid">
            <button class="menu-button secondary large" onclick="mainMenu.showSetupWorld()">
              🗺️ Setup World
            </button>
            <button class="menu-button secondary large" onclick="mainMenu.showNPCManager()">
              👥 NPCs
            </button>
            <button class="menu-button secondary large" onclick="mainMenu.showItemsEditor()">
              🎁 Items
            </button>
            <button class="menu-button secondary large" onclick="mainMenu.showPlayerConfig()">
              👤 Player
            </button>
          </div>
        </div>

        <div class="menu-actions">
          <button class="menu-button secondary" onclick="mainMenu.showWelcome()">
            ← Back
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Show setup world (locations editor)
   */
  showSetupWorld() {
    this.currentStep = 'setup-world';
    const menu = document.getElementById('main-menu');

    const locations = this.generatedWorld.locations || [];
    const locationsHTML = locations.map((loc, idx) => `
      <div class="location-card">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div style="flex: 1;">
            <input type="text" class="editor-input" data-loc-idx="${idx}" data-loc-field="name" value="${loc.name || ''}" placeholder="Location name" />
            <input type="text" class="editor-input" data-loc-idx="${idx}" data-loc-field="type" value="${loc.type || ''}" placeholder="Location type (e.g., Forest, Castle)" />
            <textarea class="editor-input" data-loc-idx="${idx}" data-loc-field="description" placeholder="Location description" rows="2">${loc.description || ''}</textarea>
          </div>
          <button class="btn-small" onclick="mainMenu.removeLocation(${idx})" style="margin-left: 1rem;">🗑️ Remove</button>
        </div>
      </div>
    `).join('');

    menu.innerHTML = `
      <div class="menu-container">
        <div class="menu-header">
          <h1>🗺️ Setup World - Locations</h1>
          <p>Edit world locations</p>
        </div>

        <div class="menu-content world-editor">
          ${locationsHTML}
        </div>

        <div class="menu-actions">
          <button class="menu-button secondary" onclick="mainMenu.showConfigureTheme()">
            ← Back
          </button>
          <button class="menu-button secondary" onclick="mainMenu.addLocation()">
            ➕ Add Location
          </button>
          <button class="menu-button primary" onclick="mainMenu.showConfigureTheme()">
            Save & Continue
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Add a new location
   */
  addLocation() {
    if (!this.generatedWorld.locations) {
      this.generatedWorld.locations = [];
    }
    this.generatedWorld.locations.push({
      name: 'New Location',
      type: 'Unknown',
      description: ''
    });
    this.showSetupWorld();
  }

  /**
   * Remove a location
   */
  removeLocation(idx) {
    if (this.generatedWorld.locations) {
      this.generatedWorld.locations.splice(idx, 1);
      this.showSetupWorld();
    }
  }

  /**
   * Show NPC manager
   */
  showNPCManager() {
    this.currentStep = 'npc-manager';
    const menu = document.getElementById('main-menu');

    const npcs = this.generatedWorld.npcs || [];
    const npcsHTML = npcs.map((npc, idx) => `
      <div class="npc-card">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div style="flex: 1;">
            <input type="text" class="npc-name" data-npc-idx="${idx}" value="${npc.name || ''}" placeholder="NPC name" />
            <input type="text" class="editor-input" data-npc-idx="${idx}" data-npc-field="role" value="${npc.role || ''}" placeholder="Role (e.g., Warrior, Mage)" />
            <textarea class="npc-backstory" data-npc-idx="${idx}" placeholder="Character backstory">${npc.backstory || ''}</textarea>
          </div>
          <button class="btn-small" onclick="mainMenu.removeNPC(${idx})" style="margin-left: 1rem;">🗑️ Remove</button>
        </div>
      </div>
    `).join('');

    menu.innerHTML = `
      <div class="menu-container">
        <div class="menu-header">
          <h1>👥 NPC Manager</h1>
          <p>Add, edit, or remove NPCs</p>
        </div>

        <div class="menu-content world-editor">
          ${npcsHTML}
        </div>

        <div class="menu-actions">
          <button class="menu-button secondary" onclick="mainMenu.showConfigureTheme()">
            ← Back
          </button>
          <button class="menu-button secondary" onclick="mainMenu.addNPCFromConfig()">
            ➕ Add NPC
          </button>
          <button class="menu-button primary" onclick="mainMenu.showConfigureTheme()">
            Save & Continue
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Add a new NPC (from configure menu)
   */
  addNPCFromConfig() {
    if (!this.generatedWorld.npcs) {
      this.generatedWorld.npcs = [];
    }
    this.generatedWorld.npcs.push({
      name: 'New NPC',
      role: 'Adventurer',
      backstory: ''
    });
    this.showNPCManager();
  }

  /**
   * Remove an NPC (from configure menu)
   */
  removeNPCFromConfig(idx) {
    if (this.generatedWorld.npcs) {
      this.generatedWorld.npcs.splice(idx, 1);
      this.showNPCManager();
    }
  }

  /**
   * Show items editor
   */
  showItemsEditor() {
    this.currentStep = 'items-editor';
    const menu = document.getElementById('main-menu');

    const items = this.generatedWorld.items || [];
    const itemsHTML = items.map((item, idx) => `
      <div class="item-card">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div style="flex: 1;">
            <input type="text" class="editor-input" data-item-idx="${idx}" data-item-field="name" value="${item.name || ''}" placeholder="Item name" />
            <input type="text" class="editor-input" data-item-idx="${idx}" data-item-field="rarity" value="${item.rarity || 'common'}" placeholder="Rarity (common, rare, epic, legendary)" />
            <textarea class="editor-input" data-item-idx="${idx}" data-item-field="description" placeholder="Item description" rows="2">${item.description || ''}</textarea>
          </div>
          <button class="btn-small" onclick="mainMenu.removeItem(${idx})" style="margin-left: 1rem;">🗑️ Remove</button>
        </div>
      </div>
    `).join('');

    menu.innerHTML = `
      <div class="menu-container">
        <div class="menu-header">
          <h1>🎁 Items Editor</h1>
          <p>Manage world items and artifacts</p>
        </div>

        <div class="menu-content world-editor">
          ${itemsHTML}
        </div>

        <div class="menu-actions">
          <button class="menu-button secondary" onclick="mainMenu.showConfigureTheme()">
            ← Back
          </button>
          <button class="menu-button secondary" onclick="mainMenu.addItem()">
            ➕ Add Item
          </button>
          <button class="menu-button primary" onclick="mainMenu.showConfigureTheme()">
            Save & Continue
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Add a new item
   */
  addItem() {
    if (!this.generatedWorld.items) {
      this.generatedWorld.items = [];
    }
    this.generatedWorld.items.push({
      name: 'New Item',
      rarity: 'common',
      description: ''
    });
    this.showItemsEditor();
  }

  /**
   * Remove an item
   */
  removeItem(idx) {
    if (this.generatedWorld.items) {
      this.generatedWorld.items.splice(idx, 1);
      this.showItemsEditor();
    }
  }

  /**
   * Show player configuration
   */
  showPlayerConfig() {
    this.currentStep = 'player-config';
    const menu = document.getElementById('main-menu');

    menu.innerHTML = `
      <div class="menu-container">
        <div class="menu-header">
          <h1>👤 Player Configuration</h1>
          <p>Customize your character</p>
        </div>

        <div class="menu-content">
          <div class="player-config-panel">
            <div class="input-group">
              <label for="config-player-name">Player Name:</label>
              <input type="text" id="config-player-name" placeholder="Enter player name"
                     value="${this.generatedWorld.playerName || 'Kael'}" />
            </div>

            <div class="input-group">
              <label for="config-player-backstory">Player Backstory:</label>
              <textarea id="config-player-backstory" placeholder="Describe your character's background and motivations"
                        rows="4">${this.generatedWorld.playerBackstory || 'A curious adventurer who has arrived in the village.'}</textarea>
            </div>

            <div class="generation-info">
              <p>💡 Your player name and backstory will appear in the game and affect NPC interactions.</p>
            </div>
          </div>
        </div>

        <div class="menu-actions">
          <button class="menu-button secondary" onclick="mainMenu.showConfigureTheme()">
            ← Back
          </button>
          <button class="menu-button primary" onclick="mainMenu.savePlayerConfig()">
            ✓ Save Changes
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Save player configuration
   */
  savePlayerConfig() {
    const playerName = document.getElementById('config-player-name').value || 'Kael';
    const playerBackstory = document.getElementById('config-player-backstory').value || '';

    this.generatedWorld.playerName = playerName;
    this.generatedWorld.playerBackstory = playerBackstory;

    console.log('[MainMenu] Player config saved:', { playerName, playerBackstory });

    this.showConfigureTheme();
  }

  /**
   * Quit the game
   */
  quitGame() {
    console.log('[MainMenu] Quitting game...');

    // Try electron quit first
    try {
      // eslint-disable-next-line no-undef
      if (typeof electron !== 'undefined') {
        const { ipcRenderer } = electron;
        ipcRenderer.invoke('window:quit');
        return;
      }
    } catch (e) {
      // Fallback
    }

    // Fallback to window close
    try {
      window.close();
    } catch (e) {
      // Final fallback
      this.showError('Cannot quit directly. Please close the application window.');
    }
  }

  /**
   * Show gameplay mode selector (between menu and game initialization)
   */
  showGameplayModeSelector() {
    this.currentStep = 'gameplay-mode';
    const menu = document.getElementById('main-menu');

    menu.innerHTML = `
      <div class="menu-container">
        <div class="menu-header">
          <h1>🎮 Choose Your Gameplay Mode</h1>
          <p>How would you like to experience your adventure?</p>
        </div>

        <div class="menu-content">
          <div class="gameplay-mode-grid">
            <div class="mode-card">
              <h2>🕹️ Manual Mode</h2>
              <p>You control the protagonist and make all decisions. Interact with AI-powered NPCs and shape the story through your choices.</p>
              <button class="menu-button primary large" onclick="mainMenu.startGameInMode('manual')">
                ▶️ Play Manually
              </button>
            </div>

            <div class="mode-card">
              <h2>🤖 Autonomous Mode</h2>
              <p>Watch AI characters interact with each other in emergent narratives. Perfect for enjoying the storytelling without controlling the action.</p>
              <button class="menu-button primary large" onclick="mainMenu.startGameInMode('autonomous')">
                ▶️ Watch AI Play
              </button>
            </div>
          </div>
        </div>

        <div class="menu-actions">
          <button class="menu-button secondary" onclick="mainMenu.showWelcome()">
            ← Back to Menu
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Start game in specified mode
   */
  async startGameInMode(mode) {
    console.log('[MainMenu] Starting game in', mode, 'mode');

    // Hide menu
    const menuDiv = document.getElementById('main-menu');
    if (menuDiv) {
      menuDiv.style.display = 'none';
    }

    // Initialize app with mode preference
    if (typeof app !== 'undefined' && app) {
      console.log('[MainMenu] App initializing with mode:', mode);

      if (mode === 'manual') {
        await app.showGameScreen();
        await app.startManualMode();
      } else if (mode === 'autonomous') {
        await app.showGameScreen();
        await app.startAutonomousMode();
      }
    } else {
      console.error('[MainMenu] App not found');
      this.showError('Failed to start game: App not initialized');
      menuDiv.style.display = 'block';
    }
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
