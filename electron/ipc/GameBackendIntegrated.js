/**
 * GameBackendIntegrated - New architecture using GameService + StatePublisher
 * 
 * This replaces the old GameBackend with the new architecture:
 * - Uses GameService for all game logic
 * - Uses StandaloneAutonomousGame for autonomous mode
 * - Uses StatePublisher for UI updates
 * - No direct manipulation of game state from UI
 */

import { GameSession } from '../../src/game/GameSession.js';
import { GameService } from '../../src/services/GameService.js';
import { StandaloneAutonomousGame } from '../../src/services/StandaloneAutonomousGame.js';
import { statePublisher, EVENT_TYPES } from '../../src/services/StatePublisher.js';
import { OllamaService } from '../../src/services/OllamaService.js';
import { Character } from '../../src/entities/Character.js';
import { Personality } from '../../src/ai/personality/Personality.js';
import { CharacterStats } from '../../src/systems/stats/CharacterStats.js';
import { Inventory } from '../../src/systems/items/Inventory.js';
import { Equipment } from '../../src/systems/items/Equipment.js';
import { AbilityManager } from '../../src/systems/abilities/AbilityManager.js';
import { CombatEncounterSystem } from '../../src/systems/combat/CombatEncounterSystem.js';
import { CombatSystem } from '../../src/systems/combat/CombatSystem.js';
import { CombatAI } from '../../src/systems/combat/CombatAI.js';
import { GameMaster } from '../../src/systems/GameMaster.js';
import { ThemeEngine } from '../../src/systems/theme/ThemeEngine.js';
import { ReplayLogger } from '../../src/replay/ReplayLogger.js';
import { ReplayFile } from '../../src/replay/ReplayFile.js';
import fs from 'fs';
import path from 'path';

export class GameBackendIntegrated {
  constructor() {
    this.gameService = null;
    this.gameSession = null;
    this.autonomousGame = null;
    this.ollama = null;
    this.initialized = false;
    this.autonomousMode = false;
    
    // UI subscriber
    this.uiSubscriberId = 'electron-ui';
    this.uiCallback = null; // Set by setUICallback
    
    // Replay system
    this.replayLogger = null;
    this.replayDir = './replays';
    this.currentReplayFile = null;
    
    // World configuration
    this.worldConfig = null;
  }

  /**
   * Set the callback for UI updates
   * This will be called whenever game state changes
   */
  setUICallback(callback) {
    this.uiCallback = callback;
    
    // Subscribe to state publisher if game is initialized
    if (this.gameService) {
      this._subscribeToStatePublisher();
    }
  }

  /**
   * Subscribe to StatePublisher for UI updates
   * @private
   */
  _subscribeToStatePublisher() {
    // Unsubscribe first if already subscribed
    if (statePublisher.getSubscribers().some(s => s.id === this.uiSubscriberId)) {
      statePublisher.unsubscribe(this.uiSubscriberId);
    }

    statePublisher.subscribe({
      id: this.uiSubscriberId,
      onStateUpdate: (state, eventType, metadata = {}) => {
        if (this.uiCallback) {
          this.uiCallback({
            type: 'state_update',
            eventType,
            state,
            ...metadata // Spread metadata into the callback object
          });
        }
      },
      onGameEvent: (event) => {
        if (this.uiCallback) {
          this.uiCallback({
            type: 'game_event',
            event
          });
        }
      }
    });

    console.log('[GameBackendIntegrated] Subscribed to StatePublisher');
  }

  /**
   * Initialize game backend
   */
  async initialize(options = {}) {
    if (this.initialized) {
      return this.getStatus();
    }

    try {
      console.log('[GameBackendIntegrated] Initializing with options:', {
        playerName: options.playerName,
        seed: options.seed,
        model: options.model || 'granite4:3b',
        hasWorldConfig: !!options.worldConfig
      });

      // Initialize Ollama service
      this.ollama = OllamaService.getInstance();
      
      // Check Ollama availability
      const ollamaAvailable = await this.ollama.isAvailable();
      console.log('[GameBackendIntegrated] Ollama available:', ollamaAvailable);

      if (!ollamaAvailable) {
        throw new Error('Ollama is not available. Please start Ollama service.');
      }

      // Create game session
      this.gameSession = new GameSession({
        seed: options.seed || Date.now(),
        model: options.model || 'granite4:3b',
        protagonistName: options.playerName || 'Hero',
        theme: options.theme || 'medieval',
        worldConfig: options.worldConfig
      });

      // Create protagonist character
      const playerName = options.playerName || 'Hero';
      console.log('[GameBackendIntegrated] Creating protagonist:', playerName);
      
      const playerStats = new CharacterStats({
        strength: 12,
        dexterity: 10,
        constitution: 14,
        intelligence: 11,
        wisdom: 10,
        charisma: 13
      });

      const playerInventory = new Inventory({ maxSlots: 20, maxWeight: 100, gold: 75 });
      const playerEquipment = new Equipment();
      const playerAbilities = new AbilityManager();

      const protagonist = new Character('protagonist', playerName, {
        role: 'protagonist',
        personality: new Personality({
          friendliness: 60,
          intelligence: 70,
          caution: 50,
          honor: 75,
          greed: 40,
          aggression: 35
        }),
        backstory: options.worldConfig?.openingNarration || 'A curious adventurer who has arrived in this world.',
        stats: playerStats,
        inventory: playerInventory,
        equipment: playerEquipment,
        abilities: playerAbilities
      });

      // Add protagonist to session
      this.gameSession.addCharacter(protagonist);
      console.log('[GameBackendIntegrated] Protagonist created and added to session');

      // Create NPCs from worldConfig if provided
      if (options.worldConfig?.npcs && options.worldConfig.npcs.length > 0) {
        console.log('[GameBackendIntegrated] Creating NPCs from world config:', options.worldConfig.npcs.length);
        options.worldConfig.npcs.forEach((npcData, idx) => {
          const npcId = `npc_${idx}`;
          const npc = new Character(npcId, npcData.name, {
            role: npcData.role || 'villager',
            archetype: npcData.archetype,
            personality: new Personality(npcData.personality || {
              friendliness: 50,
              intelligence: 50,
              caution: 50,
              honor: 50,
              greed: 50,
              aggression: 50
            }),
            backstory: npcData.backstory || 'A mysterious figure',
            stats: new CharacterStats()
          });
          this.gameSession.addCharacter(npc);
        });
        console.log('[GameBackendIntegrated] NPCs created and added to session');
      }

      // Create game service
      this.gameService = new GameService(this.gameSession);
      await this.gameService.initialize();

      // Load locations from worldConfig if provided, otherwise create defaults
      if (options.worldConfig?.locations && options.worldConfig.locations.length > 0) {
        console.log('[GameBackendIntegrated] Loading locations from worldConfig:', options.worldConfig.locations.length);
        
        // Convert array to Map format expected by initializeLocations
        const locationsMap = new Map();
        options.worldConfig.locations.forEach((loc, idx) => {
          const locationId = loc.id || `location_${idx}`;
          locationsMap.set(locationId, {
            id: locationId,
            name: loc.name,
            description: loc.description || `A ${loc.type || 'location'}`,
            type: loc.type || 'generic',
            coordinates: loc.coordinates || { x: idx * 10, y: idx * 10 },
            environment: {
              safe: loc.dangerLevel === 'safe',
              indoor: loc.type === 'building' || loc.type === 'building'
            },
            dangerLevel: loc.dangerLevel || 'low'
          });
        });
        
        // Create world object and initialize locations
        const worldData = {
          locations: locationsMap,
          startingTown: locationsMap.values().next().value // First location as starting point
        };
        
        this.gameSession.initializeLocations(worldData);
        
        // Discover all locations for testing (normally they'd be discovered through exploration)
        for (const [locId, locData] of locationsMap) {
          this.gameSession.discoverLocation(locId, locData.name);
        }
        
        // Set protagonist's starting location
        const firstLocation = Array.from(locationsMap.keys())[0];
        protagonist.currentLocation = firstLocation;
        console.log('[GameBackendIntegrated] Protagonist placed in starting location:', firstLocation);
        
        console.log('[GameBackendIntegrated] Locations initialized and discovered');
      } else {
        // Create default locations for testing
        console.log('[GameBackendIntegrated] No worldConfig locations, creating defaults');
        const theme = options.theme || 'fantasy';
        
        const defaultLocations = new Map();
        
        // Starting town
        defaultLocations.set('town_start', {
          id: 'town_start',
          name: theme === 'sci-fi' ? 'Nova Station' : 'Riverside Town',
          description: theme === 'sci-fi' 
            ? 'A bustling space station with shops and services' 
            : 'A peaceful town on the riverbank with shops and an inn',
          type: 'town',
          coordinates: { x: 0, y: 0 },
          environment: { safe: true, indoor: false },
          dangerLevel: 'safe'
        });
        
        // Forest/wilderness area
        defaultLocations.set('wilderness_forest', {
          id: 'wilderness_forest',
          name: theme === 'sci-fi' ? 'Sector 7 Ruins' : 'Dark Forest',
          description: theme === 'sci-fi'
            ? 'Abandoned ruins with hostile security drones'
            : 'A dense forest where bandits and creatures lurk',
          type: 'wilderness',
          coordinates: { x: 10, y: 5 },
          environment: { safe: false, indoor: false },
          dangerLevel: 'medium'
        });
        
        // Dungeon/dangerous area
        defaultLocations.set('dungeon_caves', {
          id: 'dungeon_caves',
          name: theme === 'sci-fi' ? 'Derelict Mining Complex' : 'Ancient Caves',
          description: theme === 'sci-fi'
            ? 'A dark complex filled with malfunctioning robots and alien creatures'
            : 'Dark caves rumored to house ancient treasures and fierce monsters',
          type: 'dungeon',
          coordinates: { x: 15, y: 15 },
          environment: { safe: false, indoor: true },
          dangerLevel: 'high'
        });
        
        // Merchant area
        defaultLocations.set('merchant_district', {
          id: 'merchant_district',
          name: theme === 'sci-fi' ? 'Trade Hub' : 'Market District',
          description: theme === 'sci-fi'
            ? 'A commercial zone with various merchants and traders'
            : 'A bustling marketplace with merchants selling wares',
          type: 'town',
          coordinates: { x: 5, y: 0 },
          environment: { safe: true, indoor: false },
          dangerLevel: 'safe'
        });
        
        // Mountain/elevated area
        defaultLocations.set('mountain_pass', {
          id: 'mountain_pass',
          name: theme === 'sci-fi' ? 'Orbital Platform' : 'Mountain Pass',
          description: theme === 'sci-fi'
            ? 'A high-altitude platform with thin atmosphere and aggressive wildlife'
            : 'A treacherous mountain path with unpredictable weather and dangerous creatures',
          type: 'wilderness',
          coordinates: { x: 20, y: 10 },
          environment: { safe: false, indoor: false },
          dangerLevel: 'high'
        });
        
        const worldData = {
          locations: defaultLocations,
          startingTown: defaultLocations.get('town_start')
        };
        
        this.gameSession.initializeLocations(worldData);
        
        // Discover all locations for testing
        for (const [locId, locData] of defaultLocations) {
          this.gameSession.discoverLocation(locId, locData.name);
        }
        
        // Set protagonist's starting location
        protagonist.currentLocation = 'town_start';
        console.log('[GameBackendIntegrated] Default locations created, protagonist starts in town_start');
      }

      // Initialize theme engine for game master
      const themeEngine = new ThemeEngine();
      themeEngine.setTheme(options.theme || 'fantasy');
      const theme = themeEngine.getTheme();

      // Initialize GameMaster for combat narration
      this.gameMaster = new GameMaster(this.ollama, null, theme);

      // Initialize Combat Systems
      console.log('[GameBackendIntegrated] Initializing combat systems...');
      this.combatEncounterSystem = new CombatEncounterSystem(this.gameSession, {
        baseEncounterChance: 0.3 // 30% base encounter chance for testing
      });

      this.combatSystem = new CombatSystem(this.gameMaster, this.gameSession, {
        pauseBetweenRounds: 0, // No pause in autonomous mode
        maxRounds: 20
      });

      // Add combat AI to protagonist
      protagonist.combatAI = new CombatAI(protagonist, { behavior: 'balanced' });

      // Pass combat systems to GameService
      this.gameService.setCombatSystems(this.combatEncounterSystem, this.combatSystem);
      console.log('[GameBackendIntegrated] Combat systems initialized');

      // Initialize replay logger
      if (!fs.existsSync(this.replayDir)) {
        fs.mkdirSync(this.replayDir, { recursive: true });
      }
      
      this.replayLogger = new ReplayLogger(this.gameSession.seed);
      this.replayLogger.initialize(this.gameService.getGameState());

      // Subscribe to state publisher if UI callback is set
      if (this.uiCallback) {
        this._subscribeToStatePublisher();
      }

      this.initialized = true;
      this.worldConfig = options.worldConfig;

      console.log('[GameBackendIntegrated] Initialization complete');

      // Publish initial state
      statePublisher.publish(
        this.gameService.getGameState(),
        EVENT_TYPES.GAME_STARTED,
        { seed: this.gameSession.seed }
      );

      return this.getStatus();
    } catch (error) {
      console.error('[GameBackendIntegrated] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get current game status
   */
  getStatus() {
    if (!this.initialized) {
      return {
        initialized: false,
        autonomousMode: false
      };
    }

    const state = this.gameService.getGameState();
    
    return {
      initialized: true,
      autonomousMode: this.autonomousMode,
      seed: this.gameSession.seed,
      frame: state.frame,
      protagonist: state.characters.protagonist,
      npcs: state.characters.npcs,
      location: state.location,
      time: state.time,
      quests: state.quests
    };
  }

  /**
   * Get NPCs
   */
  getNPCs() {
    if (!this.gameService) {
      throw new Error('Game not initialized');
    }

    return this.gameService.getNPCs();
  }

  /**
   * Get protagonist
   */
  getProtagonist() {
    if (!this.gameService) {
      throw new Error('Game not initialized');
    }

    return this.gameService.getProtagonist();
  }

  /**
   * Get current game state
   */
  getGameState() {
    if (!this.gameService) {
      throw new Error('Game not initialized');
    }

    return this.gameService.getGameState();
  }

  /**
   * Start a conversation
   */
  async startConversation(npcId, options = {}) {
    if (!this.gameService) {
      throw new Error('Game not initialized');
    }

    return await this.gameService.startConversation(npcId, options);
  }

  /**
   * Send message in conversation
   */
  async sendMessage(conversationId, text, options = {}) {
    if (!this.gameService) {
      throw new Error('Game not initialized');
    }

    return await this.gameService.addConversationTurn(conversationId, text, options);
  }

  /**
   * End conversation
   */
  async endConversation(conversationId) {
    if (!this.gameService) {
      throw new Error('Game not initialized');
    }

    return await this.gameService.endConversation(conversationId);
  }

  /**
   * Execute an action
   */
  async executeAction(action) {
    if (!this.gameService) {
      throw new Error('Game not initialized');
    }

    return await this.gameService.executeAction(action);
  }

  /**
   * Advance time
   */
  tick(minutes = 5) {
    if (!this.gameService) {
      throw new Error('Game not initialized');
    }

    return this.gameService.tick(minutes);
  }

  /**
   * Start autonomous mode
   */
  async startAutonomousMode(options = {}) {
    if (!this.gameService) {
      throw new Error('Game not initialized');
    }

    if (this.autonomousMode) {
      console.log('[GameBackendIntegrated] Autonomous mode already running');
      return { success: true, message: 'Already running' };
    }

    try {
      console.log('[GameBackendIntegrated] Starting autonomous mode...');

      // Create autonomous game with current game service
      this.autonomousGame = new StandaloneAutonomousGame(this.gameService, {
        frameRate: options.frameRate || 1, // 1 FPS for visible updates
        maxFrames: options.maxFrames || Infinity,
        maxTurnsPerConversation: options.maxTurnsPerConversation || 10,
        pauseBetweenTurns: options.pauseBetweenTurns || 2000,
        pauseBetweenConversations: options.pauseBetweenConversations || 3000,
        pauseBetweenActions: options.pauseBetweenActions || 2000
      });

      this.autonomousMode = true;

      // Start the game loop (non-blocking)
      this.autonomousGame.run().then(() => {
        console.log('[GameBackendIntegrated] Autonomous mode completed');
        this.autonomousMode = false;
      }).catch(error => {
        console.error('[GameBackendIntegrated] Autonomous mode error:', error);
        this.autonomousMode = false;
      });

      // Publish autonomous mode started event
      statePublisher.broadcast({
        type: 'autonomous_mode_started',
        timestamp: Date.now()
      });

      return { success: true, message: 'Autonomous mode started' };
    } catch (error) {
      console.error('[GameBackendIntegrated] Failed to start autonomous mode:', error);
      this.autonomousMode = false;
      throw error;
    }
  }

  /**
   * Stop autonomous mode
   */
  stopAutonomousMode() {
    if (!this.autonomousMode || !this.autonomousGame) {
      return { success: true, message: 'Not running' };
    }

    console.log('[GameBackendIntegrated] Stopping autonomous mode...');
    this.autonomousGame.stop();
    this.autonomousMode = false;

    statePublisher.broadcast({
      type: 'autonomous_mode_stopped',
      timestamp: Date.now()
    });

    return { success: true, message: 'Autonomous mode stopped' };
  }

  /**
   * Pause autonomous mode
   */
  pauseAutonomousMode() {
    if (!this.autonomousMode || !this.autonomousGame) {
      return { success: false, message: 'Not running' };
    }

    this.autonomousGame.pause();
    
    statePublisher.publish(
      this.gameService.getGameState(),
      EVENT_TYPES.PAUSE_TOGGLED,
      { paused: true }
    );

    return { success: true, message: 'Paused' };
  }

  /**
   * Resume autonomous mode
   */
  resumeAutonomousMode() {
    if (!this.autonomousMode || !this.autonomousGame) {
      return { success: false, message: 'Not running' };
    }

    this.autonomousGame.resume();
    
    statePublisher.publish(
      this.gameService.getGameState(),
      EVENT_TYPES.PAUSE_TOGGLED,
      { paused: false }
    );

    return { success: true, message: 'Resumed' };
  }

  /**
   * Get autonomous mode status
   */
  getAutonomousStatus() {
    if (!this.autonomousGame) {
      return {
        running: false,
        paused: false
      };
    }

    return {
      running: this.autonomousMode,
      paused: this.autonomousGame.isPaused,
      stats: this.autonomousGame.getStats()
    };
  }

  /**
   * Save replay
   */
  async saveReplay(filename) {
    if (!this.replayLogger) {
      throw new Error('Replay logger not initialized');
    }

    if (!filename) {
      filename = `replay_${Date.now()}.replay`;
    }

    const filepath = path.join(this.replayDir, filename);
    
    // ReplayLogger has its own save method
    await this.replayLogger.save(filepath);
    
    this.currentReplayFile = filepath;
    console.log('[GameBackendIntegrated] Replay saved:', filepath);

    return { success: true, filepath };
  }

  /**
   * Check Ollama availability
   */
  async checkOllama() {
    try {
      const ollama = OllamaService.getInstance();
      const available = await ollama.isAvailable();
      return {
        available,
        url: ollama.baseUrl
      };
    } catch (error) {
      console.error('[GameBackendIntegrated] Ollama check failed:', error);
      return {
        available: false,
        error: error.message
      };
    }
  }

  /**
   * Cleanup
   */
  cleanup() {
    console.log('[GameBackendIntegrated] Cleaning up...');

    // Stop autonomous mode if running
    if (this.autonomousMode) {
      this.stopAutonomousMode();
    }

    // Unsubscribe from state publisher
    if (statePublisher.getSubscribers().some(s => s.id === this.uiSubscriberId)) {
      statePublisher.unsubscribe(this.uiSubscriberId);
    }

    // Save replay if exists
    if (this.replayLogger && this.initialized) {
      try {
        this.saveReplay();
      } catch (error) {
        console.error('[GameBackendIntegrated] Failed to save replay on cleanup:', error);
      }
    }

    this.initialized = false;
    console.log('[GameBackendIntegrated] Cleanup complete');
  }
}
