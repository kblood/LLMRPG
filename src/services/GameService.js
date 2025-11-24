/**
 * GameService - Pure game logic service with zero Electron dependencies
 *
 * This service encapsulates all core game logic and provides a clean API
 * for game state management, actions, and queries. It's designed to be
 * framework-agnostic and returns pure JavaScript objects.
 *
 * Key Design Principles:
 * - No Electron dependencies
 * - Returns pure JS objects (not JSON strings)
 * - Stateless where possible
 * - Complete state snapshot support
 * - Replay-friendly architecture
 *
 * @class GameService
 */
export class GameService {
  /**
   * Create a new GameService
   * @param {GameSession} gameSession - The game session to manage
   */
  constructor(gameSession) {
    if (!gameSession) {
      throw new Error('GameService requires a GameSession instance');
    }

    this.gameSession = gameSession;
    this.initialized = false;

    // Track action history for replays
    this.actionHistory = [];

    // Track state snapshots
    this.stateSnapshots = [];
    this.snapshotInterval = 100; // Take snapshot every 100 frames
    this.lastSnapshotFrame = 0;

    // Combat systems (set by GameBackendIntegrated)
    this.combatEncounterSystem = null;
    this.combatSystem = null;
  }

  /**
   * Initialize the game service
   * Performs any necessary setup before game loop starts
   *
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    if (this.initialized) {
      console.warn('[GameService] Already initialized');
      return true;
    }

    try {
      // Initialize any systems that need async setup
      // Currently GameSession handles its own initialization
      this.initialized = true;

      // Take initial snapshot
      this.takeSnapshot();

      return true;
    } catch (error) {
      console.error('[GameService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Advance game time by delta
   * This is the main game loop tick method
   *
   * @param {number} deltaTime - Time to advance in minutes (default: 1)
   * @returns {Object} Time state after tick
   */
  tick(deltaTime = 1) {
    if (!this.initialized) {
      throw new Error('GameService not initialized. Call initialize() first.');
    }

    const timeState = this.gameSession.tick(deltaTime);

    // Check if we should take a snapshot
    if (this.gameSession.frame - this.lastSnapshotFrame >= this.snapshotInterval) {
      this.takeSnapshot();
    }

    return timeState;
  }

  /**
   * Pause the game
   */
  pause() {
    this.gameSession.paused = true;
  }

  /**
   * Resume the game
   */
  resume() {
    this.gameSession.paused = false;
  }

  /**
   * Check if game is paused
   * @returns {boolean}
   */
  isPaused() {
    return this.gameSession.paused;
  }

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  /**
   * Get complete game state snapshot
   * Returns all state needed for UI display and replay reconstruction
   *
   * @returns {StateSnapshot} Complete game state
   */
  getGameState() {
    const session = this.gameSession;

    return {
      // Core identifiers
      sessionId: session.sessionId,
      seed: session.seed,
      frame: session.frame,

      // Time and environment
      time: {
        gameTime: session.gameTime,
        gameTimeString: session.getGameTimeString(),
        timeOfDay: session.getTimeOfDay(),
        day: session.day,
        season: session.season,
        year: session.year,
        weather: session.weather
      },

      // Characters
      characters: {
        protagonist: session.protagonist ? this._serializeCharacter(session.protagonist) : null,
        npcs: session.getNPCs().map(npc => this._serializeCharacter(npc)),
        atLocation: session.getCharactersAtLocation().map(c => this._serializeCharacter(c))
      },

      // Location
      location: {
        current: session.currentLocation,
        discovered: Array.from(session.discoveredLocations),
        visited: Array.from(session.visitedLocations),
        database: this._serializeLocationDatabase()
      },

      // Quests
      quests: {
        active: session.getActiveQuests(),
        stats: session.questManager.getStats()
      },

      // Dialogue
      dialogue: {
        stats: session.dialogueSystem.getStats(),
        activeConversations: session.conversationManager.getActiveConversations()
      },

      // System state
      system: {
        paused: session.paused,
        autoDetectQuests: session.autoDetectQuests,
        realTimePlayed: Math.floor((Date.now() - session.startTime) / 1000)
      }
    };
  }

  /**
   * Take a state snapshot for replay/recovery
   * @private
   */
  takeSnapshot() {
    const snapshot = this.getGameState();
    this.stateSnapshots.push({
      frame: snapshot.frame,
      timestamp: Date.now(),
      state: snapshot
    });

    this.lastSnapshotFrame = snapshot.frame;

    // Keep only last 10 snapshots to manage memory
    if (this.stateSnapshots.length > 10) {
      this.stateSnapshots.shift();
    }
  }

  /**
   * Get all state snapshots
   * @returns {Array<Object>} Array of snapshots
   */
  getStateSnapshots() {
    return [...this.stateSnapshots];
  }

  /**
   * Get statistics about the game session
   * @returns {Object} Session statistics
   */
  getStats() {
    return this.gameSession.getStats();
  }

  // ============================================================================
  // CONVERSATION MANAGEMENT
  // ============================================================================

  /**
   * Start a conversation with an NPC
   *
   * @param {string} npcId - NPC identifier
   * @param {Object} options - Conversation options
   * @returns {Promise<Object>} Conversation data including id and initial greeting
   */
  async startConversation(npcId, options = {}) {
    if (!this.initialized) {
      throw new Error('GameService not initialized');
    }

    try {
      // Record action
      this.recordAction({
        type: 'start_conversation',
        npcId,
        options,
        frame: this.gameSession.frame
      });

      const conversationId = await this.gameSession.startConversation(npcId, options);
      
      // Return object with conversationId for consistency
      return {
        id: conversationId,
        conversationId: conversationId, // Both for compatibility
        npcId,
        frame: this.gameSession.frame
      };
    } catch (error) {
      console.error('[GameService] Failed to start conversation:', error);
      throw error;
    }
  }

  /**
   * Add a turn to an ongoing conversation
   *
   * @param {string} conversationId - Conversation identifier
   * @param {string} text - Player's input text
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} NPC's response
   */
  async addConversationTurn(conversationId, text, options = {}) {
    if (!this.initialized) {
      throw new Error('GameService not initialized');
    }

    try {
      // Get conversation to find NPC
      const conversation = this.gameSession.dialogueSystem.getConversation(conversationId);
      if (!conversation) {
        throw new Error(`Conversation ${conversationId} not found`);
      }

      const npcId = conversation.participants.find(id => id !== this.gameSession.protagonist?.id);

      // Record action
      this.recordAction({
        type: 'conversation_turn',
        conversationId,
        npcId,
        text,
        options,
        frame: this.gameSession.frame
      });

      const response = await this.gameSession.addConversationTurn(
        conversationId,
        npcId,
        text,
        options
      );

      return response;
    } catch (error) {
      console.error('[GameService] Failed to add conversation turn:', error);
      throw error;
    }
  }

  /**
   * End a conversation
   *
   * @param {string} conversationId - Conversation identifier
   */
  endConversation(conversationId) {
    this.recordAction({
      type: 'end_conversation',
      conversationId,
      frame: this.gameSession.frame
    });

    this.gameSession.endConversation(conversationId);
  }

  /**
   * Start a group conversation
   *
   * @param {Array<string>} participantIds - Array of character IDs
   * @param {Object} options - Conversation options
   * @returns {Promise<string>} Conversation ID
   */
  async startGroupConversation(participantIds, options = {}) {
    if (!this.initialized) {
      throw new Error('GameService not initialized');
    }

    try {
      this.recordAction({
        type: 'start_group_conversation',
        participantIds,
        options,
        frame: this.gameSession.frame
      });

      const conversationId = await this.gameSession.startGroupConversation(
        participantIds,
        options
      );

      return conversationId;
    } catch (error) {
      console.error('[GameService] Failed to start group conversation:', error);
      throw error;
    }
  }

  /**
   * Add a turn to a group conversation
   *
   * @param {string} conversationId - Conversation identifier
   * @param {string} speakerId - Character who is speaking
   * @param {string} input - What they say
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Response
   */
  async addGroupConversationTurn(conversationId, speakerId, input, options = {}) {
    if (!this.initialized) {
      throw new Error('GameService not initialized');
    }

    try {
      this.recordAction({
        type: 'group_conversation_turn',
        conversationId,
        speakerId,
        input,
        options,
        frame: this.gameSession.frame
      });

      const response = await this.gameSession.addGroupConversationTurn(
        conversationId,
        speakerId,
        input,
        options
      );

      return response;
    } catch (error) {
      console.error('[GameService] Failed to add group conversation turn:', error);
      throw error;
    }
  }

  // ============================================================================
  // ACTION EXECUTION
  // ============================================================================

  /**
   * Execute a player action
   * This is the main method for handling all player actions like travel,
   * investigate, rest, combat, etc.
   *
   * @param {Object} action - Action to execute
   * @param {string} action.type - Action type (travel, investigate, rest, combat, etc.)
   * @param {Object} action.data - Action-specific data (optional, can also be at action level)
   * @returns {Promise<Object>} Action result
   */
  async executeAction(action) {
    if (!this.initialized) {
      throw new Error('GameService not initialized');
    }

    const { type, data, ...rest } = action;
    
    // Support both patterns: data nested or at top level
    const actionData = data || rest;

    // Record action
    this.recordAction({
      type: `action_${type}`,
      data: actionData,
      frame: this.gameSession.frame
    });

    try {
      switch (type) {
        case 'travel':
          return await this._executeTravel(actionData);

        case 'investigate':
          return await this._executeInvestigate(actionData);

        case 'rest':
          return await this._executeRest(actionData);

        case 'search':
          return await this._executeSearch(actionData);

        case 'trade':
          return await this._executeTrade(actionData);

        case 'use_item':
          return await this._executeUseItem(actionData);

        case 'equip':
          return await this._executeEquip(actionData);

        case 'unequip':
          return await this._executeUnequip(actionData);

        default:
          throw new Error(`Unknown action type: ${type}`);
      }
    } catch (error) {
      console.error(`[GameService] Failed to execute action ${type}:`, error);
      throw error;
    }
  }

  /**
   * Execute travel action
   * @private
   */
  async _executeTravel(data) {
    // Handle both direct properties and nested data object
    const locationId = data?.locationId;
    const locationName = data?.locationName;

    if (!locationId && !locationName) {
      throw new Error('Travel requires locationId or locationName');
    }

    // Resolve location
    const resolvedId = locationId || this.gameSession.resolveLocationByName(locationName);

    if (!resolvedId) {
      throw new Error(`Location not found: ${locationName || locationId}`);
    }

    // Check if accessible
    if (!this.gameSession.isLocationAccessible(resolvedId)) {
      throw new Error(`Location not yet discovered: ${locationName || locationId}`);
    }

    const location = this.gameSession.getLocation(resolvedId);

    // Visit the location
    this.gameSession.visitLocation(resolvedId, location.name);
    
    // Update protagonist's location
    if (this.gameSession.protagonist) {
      this.gameSession.protagonist.currentLocation = resolvedId;
    }

    // Advance time based on distance (simple calculation)
    const travelTime = this._calculateTravelTime(location);
    this.tick(travelTime);

    // Check for combat encounter at destination
    let encounter = null;
    if (this.shouldCheckForCombat(location)) {
      encounter = await this.generateCombatEncounter(location);
    }

    return {
      success: true,
      location: location,
      timeSpent: travelTime,
      encounter // Return encounter if one was generated
    };
  }

  /**
   * Execute investigate action
   * @private
   */
  async _executeInvestigate(data) {
    const { location } = data;

    // Investigating takes time
    this.tick(15); // 15 minutes

    return {
      success: true,
      location,
      timeSpent: 15,
      findings: [] // Can be expanded with actual findings
    };
  }

  /**
   * Execute rest action
   * @private
   */
  async _executeRest(data) {
    const { duration = 60 } = data; // Default 1 hour

    // Resting advances time
    this.tick(duration);

    // Restore resources
    const protagonist = this.gameSession.protagonist;
    if (protagonist?.stats) {
      const maxHealth = protagonist.stats.getMaxHealth();
      const maxStamina = protagonist.stats.getMaxStamina();
      
      // Heal HP and restore stamina
      protagonist.stats.heal(Math.floor(maxHealth * 0.5));
      protagonist.stats.restoreStamina(Math.floor(maxStamina * 0.5));
      
      // Restore magic if available
      if (protagonist.stats.currentMagic !== undefined) {
        protagonist.stats.restoreMagic(Math.floor(protagonist.stats.maxMagic * 0.5));
      }
    }

    return {
      success: true,
      timeSpent: duration,
      restored: true
    };
  }

  /**
   * Execute search action
   * @private
   */
  async _executeSearch(data) {
    const { location } = data;

    // Searching takes time
    this.tick(10); // 10 minutes

    return {
      success: true,
      location,
      timeSpent: 10,
      itemsFound: [] // Can be expanded
    };
  }

  /**
   * Execute trade action
   * @private
   */
  async _executeTrade(data) {
    const { npcId, action: tradeAction, itemId, quantity = 1 } = data;

    const npc = this.gameSession.getCharacter(npcId);
    const protagonist = this.gameSession.protagonist;

    if (!npc || !protagonist) {
      throw new Error('Invalid trade participants');
    }

    // Trading takes a little time
    this.tick(5);

    return {
      success: true,
      action: tradeAction,
      timeSpent: 5
    };
  }

  /**
   * Execute use item action
   * @private
   */
  async _executeUseItem(data) {
    const { itemId } = data;
    const protagonist = this.gameSession.protagonist;

    if (!protagonist?.inventory) {
      throw new Error('No inventory available');
    }

    // Using items can be implemented based on item type
    this.tick(1);

    return {
      success: true,
      itemId,
      timeSpent: 1
    };
  }

  /**
   * Execute equip action
   * @private
   */
  async _executeEquip(data) {
    const { itemId } = data;
    const protagonist = this.gameSession.protagonist;

    if (!protagonist?.equipment) {
      throw new Error('No equipment system available');
    }

    return {
      success: true,
      itemId
    };
  }

  /**
   * Execute unequip action
   * @private
   */
  async _executeUnequip(data) {
    const { slot } = data;
    const protagonist = this.gameSession.protagonist;

    if (!protagonist?.equipment) {
      throw new Error('No equipment system available');
    }

    return {
      success: true,
      slot
    };
  }

  /**
   * Calculate travel time based on location
   * @private
   */
  _calculateTravelTime(location) {
    // Simple calculation, can be made more sophisticated
    const baseTime = 30; // 30 minutes base

    if (location.dangerLevel === 'high' || location.dangerLevel === 'deadly') {
      return baseTime * 2;
    }

    return baseTime;
  }

  // ============================================================================
  // LOCATION MANAGEMENT
  // ============================================================================

  /**
   * Get all discovered locations
   * @returns {Array<Object>} Array of discovered locations
   */
  getDiscoveredLocations() {
    return this.gameSession.getDiscoveredLocations();
  }

  /**
   * Discover a new location
   *
   * @param {string} locationId - Location identifier
   * @param {string} locationName - Location name
   */
  discoverLocation(locationId, locationName) {
    this.recordAction({
      type: 'discover_location',
      locationId,
      locationName,
      frame: this.gameSession.frame
    });

    this.gameSession.discoverLocation(locationId, locationName);
  }

  /**
   * Get location by ID
   *
   * @param {string} locationId - Location identifier
   * @returns {Object|null} Location data or null
   */
  getLocation(locationId) {
    return this.gameSession.getLocation(locationId);
  }

  /**
   * Resolve location by name (partial match supported)
   *
   * @param {string} locationName - Location name
   * @returns {string|null} Location ID or null
   */
  resolveLocationByName(locationName) {
    return this.gameSession.resolveLocationByName(locationName);
  }

  /**
   * Check if location is accessible
   *
   * @param {string} locationId - Location identifier
   * @returns {boolean}
   */
  isLocationAccessible(locationId) {
    return this.gameSession.isLocationAccessible(locationId);
  }

  /**
   * Get current location
   * @returns {Object|null} Current location data
   */
  getCurrentLocation() {
    if (!this.gameSession.currentLocation) {
      return null;
    }
    return this.gameSession.getLocation(this.gameSession.currentLocation);
  }

  // ============================================================================
  // CHARACTER MANAGEMENT
  // ============================================================================

  /**
   * Get character by ID
   *
   * @param {string} characterId - Character identifier
   * @returns {Object|null} Serialized character or null
   */
  getCharacter(characterId) {
    const character = this.gameSession.getCharacter(characterId);
    return character ? this._serializeCharacter(character) : null;
  }

  /**
   * Get all characters
   * @returns {Array<Object>} Array of serialized characters
   */
  getAllCharacters() {
    return this.gameSession.getAllCharacters()
      .map(c => this._serializeCharacter(c));
  }

  /**
   * Get all NPCs
   * @returns {Array<Object>} Array of serialized NPCs
   */
  getNPCs() {
    return this.gameSession.getNPCs()
      .map(c => this._serializeCharacter(c));
  }

  /**
   * Get characters at current location
   * @returns {Array<Object>} Array of serialized characters
   */
  getCharactersAtLocation() {
    return this.gameSession.getCharactersAtLocation()
      .map(c => this._serializeCharacter(c));
  }

  /**
   * Get protagonist
   * @returns {Object|null} Serialized protagonist
   */
  getProtagonist() {
    return this.gameSession.protagonist
      ? this._serializeCharacter(this.gameSession.protagonist)
      : null;
  }

  /**
   * Get available actions for a character
   * @param {string} characterId - Character identifier
   * @returns {Array<Object>} Array of available actions
   */
  getAvailableActions(characterId) {
    const character = this.gameSession.getCharacter(characterId);
    if (!character) {
      return [];
    }

    const actions = [];
    
    // Basic actions available to all characters
    actions.push(
      { type: 'talk', name: 'Talk to NPC', available: true },
      { type: 'explore', name: 'Explore Area', available: true },
      { type: 'wait', name: 'Wait', available: true }
    );

    // Travel action if locations exist
    if (this.gameSession.locationDatabase && this.gameSession.locationDatabase.size > 0) {
      actions.push({ type: 'travel', name: 'Travel', available: true });
    }

    // Combat actions if character has stats
    if (character.stats) {
      actions.push(
        { type: 'attack', name: 'Attack', available: true },
        { type: 'defend', name: 'Defend', available: true }
      );
    }

    return actions;
  }

  // ============================================================================
  // QUEST MANAGEMENT
  // ============================================================================

  /**
   * Get active quests
   * @returns {Array<Object>} Array of active quests
   */
  getActiveQuests() {
    return this.gameSession.getActiveQuests();
  }

  /**
   * Get quests by NPC
   *
   * @param {string} npcId - NPC identifier
   * @returns {Array<Object>} Array of quests
   */
  getQuestsByNPC(npcId) {
    return this.gameSession.getQuestsByNPC(npcId);
  }

  /**
   * Complete a quest
   *
   * @param {string} questId - Quest identifier
   * @returns {Object} Completion result
   */
  async completeQuest(questId) {
    this.recordAction({
      type: 'complete_quest',
      questId,
      frame: this.gameSession.frame
    });

    return await this.gameSession.completeQuest(questId);
  }

  /**
   * Check for quest in dialogue (manual trigger)
   *
   * @param {string} npcId - NPC identifier
   * @param {string} dialogue - Dialogue text
   * @param {string} conversationId - Conversation identifier
   * @returns {Promise<string|null>} Quest ID if detected
   */
  async checkForQuestInDialogue(npcId, dialogue, conversationId) {
    return await this.gameSession.checkForQuestInDialogueEnhanced(
      npcId,
      dialogue,
      conversationId
    );
  }

  // ============================================================================
  // COMBAT SYSTEM INTEGRATION
  // ============================================================================

  /**
   * Set combat systems (called by GameBackendIntegrated during initialization)
   * @param {CombatEncounterSystem} encounterSystem - Combat encounter system
   * @param {CombatSystem} combatSystem - Combat system
   */
  setCombatSystems(encounterSystem, combatSystem) {
    this.combatEncounterSystem = encounterSystem;
    this.combatSystem = combatSystem;
    console.log('[GameService] Combat systems registered');
  }

  /**
   * Check if combat should occur at a location
   * @param {Object} location - Location data
   * @returns {boolean} True if combat should be checked
   */
  shouldCheckForCombat(location) {
    if (!this.combatEncounterSystem) {
      return false;
    }
    if (!location) {
      return false;
    }
    
    const timeOfDay = this.gameSession.getTimeOfDay();
    return this.combatEncounterSystem.shouldSpawnEnemy(location, timeOfDay);
  }

  /**
   * Generate a combat encounter at a location
   * @param {Object} location - Location data
   * @returns {Promise<Object|null>} Encounter data with enemies, or null if no encounter
   */
  async generateCombatEncounter(location) {
    if (!this.combatEncounterSystem) {
      console.warn('[GameService] Combat encounter system not initialized');
      return null;
    }
    
    const timeOfDay = this.gameSession.getTimeOfDay();
    const protagonist = this.gameSession.protagonist;

    if (!protagonist) {
      console.error('[GameService] No protagonist found for combat encounter');
      return null;
    }

    try {
      console.log('[GameService] Generating combat encounter at', location.name);
      const encounter = this.combatEncounterSystem.generateCombatEncounter(
        protagonist,
        location,
        timeOfDay
      );
      
      if (encounter) {
        console.log(`[GameService] Combat encounter generated: ${encounter.enemies.length} enemies`);
      } else {
        console.log('[GameService] No encounter generated (returned null)');
      }
      
      return encounter;
    } catch (error) {
      console.error('[GameService] Failed to generate combat encounter:', error);
      return null;
    }
  }

  /**
   * Execute a combat encounter
   * @param {Array<Character>} enemies - Enemy characters
   * @param {Object} encounterData - Encounter context data
   * @returns {Promise<Object>} Combat result (outcome, rounds, xp, gold, etc.)
   */
  async executeCombat(enemies, encounterData) {
    if (!this.combatSystem) {
      throw new Error('Combat system not initialized');
    }

    const protagonist = this.gameSession.protagonist;
    if (!protagonist) {
      throw new Error('No protagonist found for combat');
    }

    console.log(`[GameService] Executing combat: ${protagonist.name} vs ${enemies.map(e => e.name).join(', ')}`);

    try {
      const result = await this.combatSystem.executeCombat(
        protagonist,
        enemies,
        encounterData
      );

      // Record combat action
      this.recordAction({
        type: 'combat',
        enemies: enemies.map(e => ({ id: e.id, name: e.name })),
        outcome: result.outcome,
        rounds: result.rounds,
        frame: this.gameSession.frame
      });

      console.log(`[GameService] Combat ended: ${result.outcome} in ${result.rounds} rounds`);
      
      return result;
    } catch (error) {
      console.error('[GameService] Combat execution failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // REPLAY & RECOVERY SUPPORT
  // ============================================================================

  /**
   * Get action history for replay
   * @returns {Array<Object>} Array of recorded actions
   */
  getActionHistory() {
    return [...this.actionHistory];
  }

  /**
   * Record an action for replay
   * @private
   */
  recordAction(action) {
    this.actionHistory.push({
      ...action,
      timestamp: Date.now()
    });
  }

  /**
   * Export game state for saving
   * @returns {Object} Serialized game state
   */
  exportState() {
    return {
      gameState: this.getGameState(),
      actionHistory: this.getActionHistory(),
      snapshots: this.getStateSnapshots(),
      sessionData: this.gameSession.toJSON()
    };
  }

  // ============================================================================
  // SERIALIZATION HELPERS
  // ============================================================================

  /**
   * Serialize a character to a plain object
   * @private
   */
  _serializeCharacter(character) {
    return {
      id: character.id,
      name: character.name,
      role: character.role,
      backstory: character.backstory,
      occupation: character.occupation,
      age: character.age,
      location: character.currentLocation,
      position: {
        x: character.x,
        y: character.y
      },
      personality: character.personality ? {
        friendliness: character.personality.friendliness,
        intelligence: character.personality.intelligence,
        caution: character.personality.caution,
        honor: character.personality.honor,
        greed: character.personality.greed,
        aggression: character.personality.aggression
      } : null,
      state: {
        emotionalState: character.emotionalState,
        currentGoal: character.currentGoal,
        inConversation: character.inConversation
      },
      stats: character.stats ? {
        level: character.stats.level || 1,
        health: character.stats.current?.health || character.stats.hp || 100,
        maxHealth: character.stats.max?.health || character.stats.maxHP || 100,
        stamina: character.stats.current?.stamina || character.stats.mp || 100,
        maxStamina: character.stats.max?.stamina || character.stats.maxMP || 100,
        strength: character.stats.strength || 10,
        dexterity: character.stats.dexterity || 10,
        constitution: character.stats.constitution || 10,
        intelligence: character.stats.intelligence || 10,
        wisdom: character.stats.wisdom || 10,
        charisma: character.stats.charisma || 10,
        attack: character.stats.attack || 0,
        defense: character.stats.defense || 0,
        experience: character.stats.experience || 0
      } : null,
      inventory: character.inventory ? {
        gold: character.inventory.gold || 0,
        items: character.inventory.items ? 
          Array.from(character.inventory.items.values()).map(entry => ({
            id: entry.item.id,
            name: entry.item.name,
            type: entry.item.type,
            quantity: entry.quantity
          })) : [],
        itemCount: character.inventory.items ? character.inventory.items.size : 0,
        maxSlots: character.inventory.maxSlots || 20
      } : null,
      equipment: character.equipment ? {
        weapon: character.equipment.weapon ? {
          id: character.equipment.weapon.id,
          name: character.equipment.weapon.name
        } : null,
        armor: character.equipment.armor ? {
          id: character.equipment.armor.id,
          name: character.equipment.armor.name
        } : null,
        accessory: character.equipment.accessory ? {
          id: character.equipment.accessory.id,
          name: character.equipment.accessory.name
        } : null
      } : null
    };
  }

  /**
   * Serialize location database
   * @private
   */
  _serializeLocationDatabase() {
    const db = {};
    for (const [locationId, locationData] of this.gameSession.locationDatabase) {
      db[locationId] = { ...locationData };
    }
    return db;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get current frame number
   * @returns {number}
   */
  getFrame() {
    return this.gameSession.frame;
  }

  /**
   * Get seed
   * @returns {number}
   */
  getSeed() {
    return this.gameSession.seed;
  }

  /**
   * Get session ID
   * @returns {string}
   */
  getSessionId() {
    return this.gameSession.sessionId;
  }

  /**
   * Check if service is initialized
   * @returns {boolean}
   */
  isInitialized() {
    return this.initialized;
  }
}

/**
 * StateSnapshot Type Definition
 *
 * Complete game state snapshot that can be used for:
 * - UI rendering
 * - Replay reconstruction
 * - Save/load functionality
 * - State recovery
 *
 * @typedef {Object} StateSnapshot
 * @property {string} sessionId - Session identifier
 * @property {number} seed - Random seed
 * @property {number} frame - Current frame number
 *
 * @property {Object} time - Time and environment state
 * @property {number} time.gameTime - Game time in minutes
 * @property {string} time.gameTimeString - Formatted time string (HH:MM)
 * @property {string} time.timeOfDay - Time of day (morning/afternoon/evening/night)
 * @property {number} time.day - Current day
 * @property {string} time.season - Current season
 * @property {number} time.year - Current year
 * @property {string} time.weather - Current weather
 *
 * @property {Object} characters - Character state
 * @property {Object|null} characters.protagonist - Protagonist data
 * @property {Array<Object>} characters.npcs - All NPCs
 * @property {Array<Object>} characters.atLocation - Characters at current location
 *
 * @property {Object} location - Location state
 * @property {string} location.current - Current location ID
 * @property {Array<string>} location.discovered - Discovered location IDs
 * @property {Array<string>} location.visited - Visited location IDs
 * @property {Object} location.database - Location database
 *
 * @property {Object} quests - Quest state
 * @property {Array<Object>} quests.active - Active quests
 * @property {Object} quests.stats - Quest statistics
 *
 * @property {Object} dialogue - Dialogue state
 * @property {Object} dialogue.stats - Dialogue statistics
 * @property {Array<Object>} dialogue.activeConversations - Active conversations
 *
 * @property {Object} system - System state
 * @property {boolean} system.paused - Game paused status
 * @property {boolean} system.autoDetectQuests - Auto quest detection enabled
 * @property {number} system.realTimePlayed - Real time played in seconds
 */

export default GameService;
