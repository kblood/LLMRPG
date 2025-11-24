/**
 * StandaloneAutonomousGame - Completely standalone event-based autonomous game runner
 *
 * A pure, framework-agnostic autonomous game engine that runs entirely on events.
 * Can run headless, in Node.js, as a CLI tool, or with optional UI callbacks.
 *
 * Key Features:
 * - Zero Electron dependencies
 * - Optional event callbacks (can run silently)
 * - Completely standalone - only requires GameService
 * - Event-based architecture with full event history
 * - Pause/resume/stop controls
 * - Speed control (0.5x, 1x, 2x, etc.)
 * - Perfect for tests, CLI tools, and headless scenarios
 *
 * Usage Examples:
 *
 * // Headless mode (no callbacks, perfect for tests)
 * const game = new StandaloneAutonomousGame(gameService);
 * await game.run(100); // Run for 100 frames silently
 *
 * // With event callback (for UI or logging)
 * const game = new StandaloneAutonomousGame(gameService, {
 *   enableEventCallback: true,
 *   eventCallback: (event) => console.log(event)
 * });
 * await game.run();
 *
 * // With speed control
 * const game = new StandaloneAutonomousGame(gameService, {
 *   frameDelay: 500 // 500ms between frames
 * });
 * await game.run();
 * game.setSpeed(2); // Double speed (250ms)
 *
 * @class StandaloneAutonomousGame
 */

import { EventBus } from './EventBus.js';
import { statePublisher, EVENT_TYPES } from './StatePublisher.js';

export class StandaloneAutonomousGame {
  /**
   * Create a new standalone autonomous game
   *
   * @param {GameService} gameService - The game service instance
   * @param {Object} options - Configuration options
   * @param {boolean} options.enableEventCallback - Enable optional event callback
   * @param {Function} options.eventCallback - Optional callback for events (event) => void
   * @param {number} options.frameDelay - Delay between frames in milliseconds (default: 1000)
   * @param {number} options.maxFrames - Maximum frames to run (default: Infinity)
   * @param {number} options.seed - Random seed for reproducibility
   * @param {number} options.timeDeltaMin - Minimum time delta per frame (default: 5)
   * @param {number} options.timeDeltaMax - Maximum time delta per frame (default: 15)
   * @param {number} options.maxTurnsPerConversation - Max turns in conversation (default: 10)
   * @param {number} options.pauseBetweenTurns - Pause between conversation turns (default: 2000)
   * @param {number} options.pauseBetweenConversations - Pause between conversations (default: 3000)
   * @param {number} options.pauseBetweenActions - Pause between actions (default: 2000)
   */
  constructor(gameService, options = {}) {
    if (!gameService) {
      throw new Error('StandaloneAutonomousGame requires a GameService instance');
    }

    // Core dependency
    this.gameService = gameService;

    // Configuration
    this.enableEventCallback = options.enableEventCallback || false;
    this.eventCallback = options.eventCallback || null;
    this.frameDelay = options.frameDelay || 1000;
    this.maxFrames = options.maxFrames || Infinity;
    this.seed = options.seed || Date.now();
    this.timeDeltaMin = options.timeDeltaMin || 5;
    this.timeDeltaMax = options.timeDeltaMax || 15;

    // Conversation configuration
    this.maxTurnsPerConversation = options.maxTurnsPerConversation || 10;
    this.pauseBetweenTurns = options.pauseBetweenTurns || 2000;
    this.pauseBetweenConversations = options.pauseBetweenConversations || 3000;
    this.pauseBetweenActions = options.pauseBetweenActions || 2000;

    // State tracking
    this.isRunning = false;
    this.isPaused = false;
    this.currentFrame = 0;
    this.speedMultiplier = 1.0;

    // Game state tracking
    this.pastConversations = [];
    this.currentConversation = null;
    this.conversationHistory = [];

    // Event history for analysis/replay
    this.eventHistory = [];
    this.maxEventHistory = 10000;

    // Session reference (extracted from gameService)
    this.session = gameService.gameSession;
    this.player = this.session.protagonist || null;
    this.npcs = new Map();

    // Initialize NPCs map
    this._initializeNPCs();
    
    // Warn if no protagonist
    if (!this.player) {
      console.warn('[StandaloneAutonomousGame] No protagonist found in session');
    }
  }

  /**
   * Factory method to create StandaloneAutonomousGame from configuration
   * Handles creating GameSession and GameService automatically
   * 
   * @param {Object} config - Configuration
   * @param {Object} config.sessionConfig - GameSession configuration
   * @param {number} config.frameRate - Frame rate (frames per second)
   * @param {number} config.maxFrames - Maximum frames to run
   * @param {boolean} config.autoStart - Auto-start the game
   * @param {Object} config...rest - Other StandaloneAutonomousGame options
   * @returns {Promise<StandaloneAutonomousGame>}
   */
  static async create(config = {}) {
    const { sessionConfig = {}, ...options } = config;
    
    // Import dependencies dynamically to avoid circular deps
    const { GameSession } = await import('../game/GameSession.js');
    const { GameService } = await import('./GameService.js');
    
    // Create session and service
    const session = new GameSession(sessionConfig);
    const gameService = new GameService(session);
    await gameService.initialize();
    
    // Create and return game
    return new StandaloneAutonomousGame(gameService, options);
  }

  /**
   * Initialize NPCs map from session
   * @private
   */
  _initializeNPCs() {
    const allNPCs = this.gameService.getNPCs();
    for (const npc of allNPCs) {
      this.npcs.set(npc.id, npc);
    }
  }

  /**
   * Main game loop - runs autonomous game for N frames
   *
   * @param {number} maxFrames - Maximum frames to run (optional, uses constructor value)
   * @returns {Promise<Object>} Final statistics
   */
  async run(maxFrames = null) {
    const frameLimit = maxFrames !== null ? maxFrames : this.maxFrames;

    this.isRunning = true;
    this.currentFrame = 0;

    this._emitEvent('game_started', {
      frame: this.currentFrame,
      maxFrames: frameLimit,
      seed: this.seed
    });

    try {
      while (this.isRunning && this.currentFrame < frameLimit) {
        // Check if paused
        if (this.isPaused) {
          await this._sleep(100);
          continue;
        }

        // Run one frame
        await this._runFrame();

        this.currentFrame++;

        // Wait between frames (adjusted by speed multiplier)
        await this._sleep(this.frameDelay / this.speedMultiplier);
      }
    } catch (error) {
      console.error('[StandaloneAutonomousGame] Game loop error:', error);
      this._emitEvent('error', {
        frame: this.currentFrame,
        message: error.message,
        stack: error.stack
      });
      throw error;
    } finally {
      this.isRunning = false;
    }

    const finalStats = this._generateFinalStats();

    this._emitEvent('game_ended', {
      frame: this.currentFrame,
      stats: finalStats
    });

    return finalStats;
  }

  /**
   * Run a single game frame
   * @private
   */
  async _runFrame() {
    const frame = this.currentFrame;

    // 1. Advance time
    const timeDelta = this.timeDeltaMin + Math.floor(Math.random() * (this.timeDeltaMax - this.timeDeltaMin));
    const timeState = this.gameService.tick(timeDelta);

    this._emitEvent('time_advanced', {
      frame,
      delta: timeDelta,
      time: timeState
    });

    // Publish state after time advance
    const gameState = this.gameService.getGameState();
    statePublisher.publish(gameState, EVENT_TYPES.FRAME_UPDATE, {
      timeDelta,
      frame
    });

    // 2. Get available NPCs for conversation
    const availableNPCs = Array.from(this.npcs.values()).filter(npc =>
      !this.pastConversations.includes(npc.id)
    );

    // 3. Decide next action
    const action = await this._decideNextAction(availableNPCs);

    this._emitEvent('action_decided', {
      frame,
      action: action.type,
      reason: action.reason,
      target: action.target
    });

    // 4. Execute the action
    if (action.type === 'conversation' && availableNPCs.length > 0) {
      await this._handleConversation(availableNPCs, frame);
    } else if (['investigate', 'travel', 'search', 'rest'].includes(action.type)) {
      await this._handleAction(action, frame);
    } else {
      // Reset conversation history if all NPCs have been talked to
      if (availableNPCs.length === 0) {
        this.pastConversations = [];
      }
    }

    // 5. Check victory/end conditions
    await this._checkEndConditions(frame);
  }

  /**
   * Decide what action to take next
   * @private
   */
  async _decideNextAction(availableNPCs) {
    // Get active quests
    const activeQuests = this.gameService.getActiveQuests();
    const hasActiveQuest = activeQuests && activeQuests.length > 0;

    // Simple AI decision logic
    const random = Math.random();

    // If we have NPCs available to talk to, conversation is likely
    if (availableNPCs.length > 0 && random < 0.4) {
      return {
        type: 'conversation',
        reason: 'Meeting new people and gathering information',
        target: availableNPCs[0].name
      };
    }

    // Quest-driven actions
    if (hasActiveQuest && random < 0.7) {
      const quest = activeQuests[0];
      const actionTypes = ['investigate', 'travel', 'search'];
      const actionType = actionTypes[Math.floor(Math.random() * actionTypes.length)];

      return {
        type: actionType,
        reason: `Working on quest: ${quest.title}`,
        quest: quest.id
      };
    }

    // Exploration actions
    const explorationActions = [
      { type: 'investigate', reason: 'Exploring the area for clues' },
      { type: 'search', reason: 'Searching for items and secrets' },
      { type: 'travel', reason: 'Traveling to a new location' },
      { type: 'rest', reason: 'Taking a rest to recover' }
    ];

    return explorationActions[Math.floor(Math.random() * explorationActions.length)];
  }

  /**
   * Handle a conversation action
   * @private
   */
  async _handleConversation(availableNPCs, frame) {
    if (availableNPCs.length === 0) {
      return;
    }

    const chosenNPC = availableNPCs[0];
    const currentLocation = this.gameService.getCurrentLocation();

    this._emitEvent('conversation_started', {
      frame,
      npcId: chosenNPC.id,
      npcName: chosenNPC.name,
      location: currentLocation?.name || 'Unknown'
    });

    // Publish dialogue_started state
    statePublisher.publish(this.gameService.getGameState(), EVENT_TYPES.DIALOGUE_STARTED, {
      npcId: chosenNPC.id,
      npcName: chosenNPC.name,
      location: currentLocation?.name
    });

    this.pastConversations.push(chosenNPC.id);

    // Wait before starting conversation
    await this._sleep(this.pauseBetweenConversations / this.speedMultiplier);

    if (!this.isRunning) return;

    try {
      // Start the conversation via GameService
      const conversation = await this.gameService.startConversation(chosenNPC.id);
      const conversationId = conversation.id || conversation.conversationId;

      this.currentConversation = {
        id: conversationId,
        npcId: chosenNPC.id,
        npc: chosenNPC,
        turns: []
      };

      this.conversationHistory = [];

      // Handle initial greeting if present
      if (conversation.greeting) {
        this._emitEvent('dialogue_line', {
          frame,
          conversationId,
          speakerId: chosenNPC.id,
          speakerName: chosenNPC.name,
          text: conversation.greeting,
          turn: 0
        });

        // Publish dialogue line
        statePublisher.publish(this.gameService.getGameState(), EVENT_TYPES.DIALOGUE_LINE, {
          conversationId,
          speakerId: chosenNPC.id,
          speakerName: chosenNPC.name,
          text: conversation.greeting,
          turn: 0
        });

        this.conversationHistory.push({
          speakerId: chosenNPC.id,
          text: conversation.greeting,
          turn: 0
        });

        await this._sleep(this.pauseBetweenTurns / this.speedMultiplier);
      }

      // Run conversation turns
      for (let turn = 1; turn <= this.maxTurnsPerConversation && this.isRunning; turn++) {
        // Check pause
        while (this.isPaused && this.isRunning) {
          await this._sleep(100);
        }
        if (!this.isRunning) break;

        // Player responds
        const playerResponse = await this._generatePlayerResponse(chosenNPC, this.conversationHistory, turn);

        this._emitEvent('dialogue_line', {
          frame,
          conversationId,
          speakerId: this.player.id,
          speakerName: this.player.name,
          text: playerResponse,
          turn
        });

        // Publish player dialogue line
        statePublisher.publish(this.gameService.getGameState(), EVENT_TYPES.DIALOGUE_LINE, {
          conversationId,
          speakerId: this.player.id,
          speakerName: this.player.name,
          text: playerResponse,
          turn
        });

        this.conversationHistory.push({
          speakerId: this.player.id,
          text: playerResponse,
          turn
        });

        // Get NPC response via GameService
        const npcResponse = await this.gameService.addConversationTurn(
          conversationId,
          playerResponse
        );

        await this._sleep(this.pauseBetweenTurns / this.speedMultiplier);

        if (!this.isRunning) break;

        // Check pause again
        while (this.isPaused && this.isRunning) {
          await this._sleep(100);
        }
        if (!this.isRunning) break;

        this._emitEvent('dialogue_line', {
          frame,
          conversationId,
          speakerId: chosenNPC.id,
          speakerName: chosenNPC.name,
          text: npcResponse.text || npcResponse.output,
          turn
        });

        // Publish NPC dialogue line
        statePublisher.publish(this.gameService.getGameState(), EVENT_TYPES.DIALOGUE_LINE, {
          conversationId,
          speakerId: chosenNPC.id,
          speakerName: chosenNPC.name,
          text: npcResponse.text || npcResponse.output,
          turn
        });

        this.conversationHistory.push({
          speakerId: chosenNPC.id,
          text: npcResponse.text || npcResponse.output,
          turn
        });

        await this._sleep(this.pauseBetweenTurns / this.speedMultiplier);
      }

      // End conversation
      this.gameService.endConversation(conversationId);

      this._emitEvent('conversation_ended', {
        frame,
        conversationId,
        npcId: chosenNPC.id,
        npcName: chosenNPC.name,
        turns: this.conversationHistory.length
      });

      // Publish dialogue_ended state
      statePublisher.publish(this.gameService.getGameState(), EVENT_TYPES.DIALOGUE_ENDED, {
        conversationId,
        npcId: chosenNPC.id,
        npcName: chosenNPC.name,
        turns: this.conversationHistory.length
      });

      this.currentConversation = null;
      this.conversationHistory = [];

    } catch (error) {
      console.error('[StandaloneAutonomousGame] Conversation error:', error);
      this._emitEvent('error', {
        frame,
        context: 'conversation',
        message: error.message
      });
    }
  }

  /**
   * Generate a player response in conversation
   * @private
   */
  async _generatePlayerResponse(npc, conversationHistory, turn) {
    // Simple response generation (can be enhanced with LLM)
    const greetings = [
      `Hello ${npc.name}, I'm ${this.player.name}.`,
      `Greetings! I'm new here.`,
      `Nice to meet you.`
    ];

    const midConversation = [
      "Tell me more about this place.",
      "What do you know about the area?",
      "Have you heard any interesting rumors?",
      "Do you need any help?",
      "What can you tell me about the recent events?"
    ];

    const endings = [
      "Thank you for your time.",
      "I should be going. Farewell!",
      "It was nice talking to you."
    ];

    if (turn <= 2) {
      return greetings[Math.floor(Math.random() * greetings.length)];
    } else if (turn >= this.maxTurnsPerConversation - 1) {
      return endings[Math.floor(Math.random() * endings.length)];
    } else {
      return midConversation[Math.floor(Math.random() * midConversation.length)];
    }
  }

  /**
   * Handle a non-conversation action
   * @private
   */
  async _handleAction(action, frame) {
    const currentLocation = this.gameService.getCurrentLocation();

    this._emitEvent('action_started', {
      frame,
      type: action.type,
      reason: action.reason,
      location: currentLocation?.name || 'Unknown'
    });

    try {
      // Prepare action data
      const actionData = {
        location: currentLocation?.name,
        locationId: currentLocation?.id
      };

      // Special handling for travel action - need destination location
      if (action.type === 'travel') {
        // Get discovered locations
        const discoveredLocations = this.gameService.getDiscoveredLocations();

        // Filter out current location
        const availableDestinations = discoveredLocations.filter(
          loc => loc.id !== currentLocation?.id
        );

        if (availableDestinations.length > 0) {
          // Pick a random discovered location as destination
          const destination = availableDestinations[
            Math.floor(Math.random() * availableDestinations.length)
          ];

          actionData.locationId = destination.id;
          actionData.locationName = destination.name;
        } else {
          // No other locations to travel to, skip travel action
          this._emitEvent('action_skipped', {
            frame,
            type: action.type,
            reason: 'No other locations discovered to travel to'
          });
          return;
        }
      }

      // Execute action via GameService
      const result = await this.gameService.executeAction({
        type: action.type,
        data: actionData
      });

      this._emitEvent('action_completed', {
        frame,
        type: action.type,
        success: result.success,
        timeSpent: result.timeSpent,
        location: currentLocation?.name
      });

      // Publish action_executed state
      statePublisher.publish(this.gameService.getGameState(), EVENT_TYPES.ACTION_EXECUTED, {
        actionType: action.type,
        success: result.success,
        timeSpent: result.timeSpent,
        location: currentLocation?.name
      });

      // Check for combat encounters (pass the result which may contain encounter data)
      await this._checkForCombat(action, frame, result);

    } catch (error) {
      console.error('[StandaloneAutonomousGame] Action error:', error);
      this._emitEvent('error', {
        frame,
        context: 'action',
        actionType: action.type,
        message: error.message
      });
    }

    // Wait after action
    await this._sleep(this.pauseBetweenActions / this.speedMultiplier);
  }

  /**
   * Check for and execute combat encounters
   * @private
   * @param {Object} action - Action that triggered potential combat
   * @param {number} frame - Current frame number
   * @param {Object} actionResult - Result from action execution (may contain encounter)
   */
  async _checkForCombat(action, frame, actionResult) {
    // Check if the action result includes a combat encounter
    if (!actionResult || !actionResult.encounter) {
      return null;
    }

    const encounter = actionResult.encounter;
    
    console.log(`[StandaloneAutonomousGame] Combat encounter triggered by ${action.type}`);

    this._emitEvent('combat_started', {
      frame,
      trigger: action.type,
      enemies: encounter.enemies.map(e => e.name),
      location: this.gameService.getCurrentLocation()?.name
    });

    // Publish combat_started state
    statePublisher.publish(this.gameService.getGameState(), EVENT_TYPES.COMBAT_STARTED, {
      trigger: action.type,
      enemies: encounter.enemies.map(e => ({ id: e.id, name: e.name })),
      location: this.gameService.getCurrentLocation()?.name
    });

    try {
      // Execute real combat via GameService
      const combatResult = await this.gameService.executeCombat(
        encounter.enemies,
        encounter
      );

      console.log(`[StandaloneAutonomousGame] Combat completed: ${combatResult.outcome} in ${combatResult.rounds} rounds`);

      this._emitEvent('combat_ended', {
        frame,
        outcome: combatResult.outcome,
        rounds: combatResult.rounds,
        xpGained: combatResult.xpGained || 0,
        goldGained: combatResult.goldGained || 0,
        itemsGained: combatResult.itemsGained || []
      });

      // Publish combat_ended state
      statePublisher.publish(this.gameService.getGameState(), EVENT_TYPES.COMBAT_ENDED, {
        outcome: combatResult.outcome,
        rounds: combatResult.rounds,
        xpGained: combatResult.xpGained || 0,
        goldGained: combatResult.goldGained || 0,
        itemsGained: combatResult.itemsGained || []
      });

      return combatResult;
    } catch (error) {
      console.error('[StandaloneAutonomousGame] Combat execution error:', error);
      
      this._emitEvent('error', {
        frame,
        context: 'combat',
        message: error.message,
        stack: error.stack
      });

      // Publish error state
      statePublisher.publish(this.gameService.getGameState(), EVENT_TYPES.ERROR, {
        context: 'combat',
        message: error.message
      });

      return null;
    }
  }

  /**
   * Check for end conditions (victory, defeat, etc.)
   * @private
   */
  async _checkEndConditions(frame) {
    const activeQuests = this.gameService.getActiveQuests();

    // Check for main quest completion
    if (activeQuests && activeQuests.length > 0) {
      const mainQuest = activeQuests.find(q => q.isMainQuest);
      if (mainQuest && mainQuest.status === 'completed') {
        this._emitEvent('quest_completed', {
          frame,
          questId: mainQuest.id,
          questTitle: mainQuest.title,
          isMainQuest: true
        });

        this._emitEvent('victory', {
          frame,
          message: 'Main quest completed!',
          stats: this._generateFinalStats()
        });

        this.stop();
      }
    }
  }

  /**
   * Generate final statistics
   * @private
   */
  _generateFinalStats() {
    const gameState = this.gameService.getGameState();

    return {
      framesPlayed: this.currentFrame,
      timeElapsed: gameState.time,
      conversationsHeld: this.pastConversations.length,
      locationsVisited: gameState.location.visited.length,
      locationsDiscovered: gameState.location.discovered.length,
      questsActive: gameState.quests.active.length,
      eventCount: this.eventHistory.length
    };
  }

  /**
   * Pause the game
   */
  pause() {
    if (!this.isRunning) {
      console.warn('[StandaloneAutonomousGame] Cannot pause - game not running');
      return;
    }

    this.isPaused = true;
    this.gameService.pause();

    this._emitEvent('paused', {
      frame: this.currentFrame
    });

    // Publish pause_toggled state
    statePublisher.publish(this.gameService.getGameState(), EVENT_TYPES.PAUSE_TOGGLED, {
      paused: true
    });
  }

  /**
   * Resume the game from pause
   */
  resume() {
    if (!this.isRunning) {
      console.warn('[StandaloneAutonomousGame] Cannot resume - game not running');
      return;
    }

    if (!this.isPaused) {
      console.warn('[StandaloneAutonomousGame] Game is not paused');
      return;
    }

    this.isPaused = false;
    this.gameService.resume();

    this._emitEvent('resumed', {
      frame: this.currentFrame
    });

    // Publish pause_toggled state
    statePublisher.publish(this.gameService.getGameState(), EVENT_TYPES.PAUSE_TOGGLED, {
      paused: false
    });
  }

  /**
   * Stop the game completely
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    // End current conversation if any
    if (this.currentConversation) {
      try {
        this.gameService.endConversation(this.currentConversation.id);
      } catch (error) {
        console.error('[StandaloneAutonomousGame] Error ending conversation on stop:', error);
      }
    }

    this._emitEvent('stopped', {
      frame: this.currentFrame,
      stats: this._generateFinalStats()
    });
  }

  /**
   * Set speed multiplier (0.5x = slower, 2x = faster)
   *
   * @param {number} multiplier - Speed multiplier (0.1 to 10.0)
   */
  setSpeed(multiplier) {
    if (typeof multiplier !== 'number' || multiplier <= 0) {
      throw new Error('Speed multiplier must be a positive number');
    }

    if (multiplier < 0.1 || multiplier > 10.0) {
      console.warn('[StandaloneAutonomousGame] Speed multiplier outside recommended range (0.1-10.0)');
    }

    const oldSpeed = this.speedMultiplier;
    this.speedMultiplier = multiplier;

    this._emitEvent('speed_changed', {
      frame: this.currentFrame,
      oldSpeed,
      newSpeed: multiplier
    });
  }

  /**
   * Get current speed multiplier
   *
   * @returns {number} Current speed multiplier
   */
  getSpeed() {
    return this.speedMultiplier;
  }

  /**
   * Check if game is running
   *
   * @returns {boolean} True if running
   */
  isGameRunning() {
    return this.isRunning;
  }

  /**
   * Check if game is paused
   *
   * @returns {boolean} True if paused
   */
  isGamePaused() {
    return this.isPaused;
  }

  /**
   * Get current frame number
   *
   * @returns {number} Current frame
   */
  getCurrentFrame() {
    return this.currentFrame;
  }

  /**
   * Get event history
   *
   * @param {number} count - Number of recent events (optional, returns all if not specified)
   * @returns {Array<Object>} Array of events
   */
  getEventHistory(count = null) {
    if (count === null) {
      return [...this.eventHistory];
    }

    const start = Math.max(0, this.eventHistory.length - count);
    return this.eventHistory.slice(start);
  }

  /**
   * Get statistics about the current game
   *
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      currentFrame: this.currentFrame,
      speedMultiplier: this.speedMultiplier,
      conversationsHeld: this.pastConversations.length,
      eventHistorySize: this.eventHistory.length,
      ...this._generateFinalStats()
    };
  }

  /**
   * Emit an event (to callback and EventBus)
   * @private
   */
  _emitEvent(type, data) {
    const event = {
      type,
      frame: this.currentFrame,
      timestamp: Date.now(),
      data
    };

    // Add to history
    this.eventHistory.push(event);

    // Trim history if too large
    if (this.eventHistory.length > this.maxEventHistory) {
      this.eventHistory.shift();
    }

    // Call optional callback if enabled
    if (this.enableEventCallback && this.eventCallback && typeof this.eventCallback === 'function') {
      try {
        this.eventCallback(event);
      } catch (error) {
        console.error('[StandaloneAutonomousGame] Error in event callback:', error);
      }
    }

    // Emit to EventBus so other systems can listen
    EventBus.emit(`autonomous:${type}`, event);
  }

  /**
   * Sleep helper
   * @private
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default StandaloneAutonomousGame;
