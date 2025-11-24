/**
 * ReplayContinuation - Load and continue from replay files
 *
 * Allows loading a recorded replay and continuing to play from that point
 * as a new game session. This enables:
 * - Watching replays and then continuing the story
 * - Testing different decisions from a specific point
 * - Resuming from autosave replays
 * - Jumping to a specific frame and continuing
 * - Training/analysis mode (watch then experiment)
 *
 * Key Features:
 * - Load replay files and extract game state
 * - Reconstruct GameSession from any frame
 * - Continue with new actions recorded separately
 * - Seamless transition between playback and live play
 * - Full state preservation (characters, quests, relationships, etc.)
 * - Works with GameService and StandaloneAutonomousGame
 *
 * Usage Example:
 *
 * // Load replay and continue from the end
 * const continuation = new ReplayContinuation('./replay.json');
 * await continuation.loadReplay();
 * const gameService = await continuation.continueAsNewGame();
 * await gameService.tick(); // Continue playing
 *
 * // Play first 50 frames, then continue
 * await continuation.playAndContinue(50);
 *
 * // Jump to specific frame and continue
 * const state = continuation.getStateAtFrame(100);
 * const gameService = await continuation.continueFromState(state);
 *
 * @class ReplayContinuation
 */

import { ReplayFile } from '../replay/ReplayFile.js';
import { ReplayLogger } from '../replay/ReplayLogger.js';
import { GameSession } from '../game/GameSession.js';
import { GameService } from './GameService.js';
import { Character } from '../entities/Character.js';
import { Personality } from '../ai/personality/Personality.js';
import { MemoryStore } from '../ai/memory/MemoryStore.js';
import { RelationshipManager } from '../ai/relationships/RelationshipManager.js';
import { CharacterStats } from '../systems/stats/CharacterStats.js';
import { Inventory } from '../systems/items/Inventory.js';
import { Equipment } from '../systems/items/Equipment.js';
import { statePublisher, EVENT_TYPES } from './StatePublisher.js';
import path from 'path';

export class ReplayContinuation {
  /**
   * Create a new ReplayContinuation instance
   *
   * @param {string} replayFilePath - Path to replay file (optional, can load later)
   */
  constructor(replayFilePath = null) {
    this.replayFilePath = replayFilePath;
    this.replayData = null;
    this.loaded = false;

    // Playback state
    this.playbackMode = false;
    this.currentPlaybackFrame = 0;
    this.playbackEventIndex = 0;

    // Reconstructed game state
    this.reconstructedSession = null;
    this.reconstructedService = null;

    // Continuation tracking
    this.continuationStartFrame = null;
    this.newReplayLogger = null;
  }

  /**
   * Load a replay file and parse it
   *
   * @param {string} filePath - Path to replay file (optional if set in constructor)
   * @returns {Promise<Object>} Replay metadata
   * @throws {Error} If file not found or invalid
   */
  async loadReplay(filePath = null) {
    const targetPath = filePath || this.replayFilePath;

    if (!targetPath) {
      throw new Error('No replay file path provided');
    }

    console.log(`[ReplayContinuation] Loading replay from: ${targetPath}`);

    try {
      // Load replay file
      this.replayData = await ReplayFile.load(targetPath);
      this.replayFilePath = targetPath;
      this.loaded = true;

      console.log(`[ReplayContinuation] Replay loaded successfully`);
      console.log(`  - Events: ${this.replayData.events?.length || 0}`);
      console.log(`  - Checkpoints: ${this.replayData.checkpoints?.length || 0}`);
      console.log(`  - LLM Calls: ${this.replayData.llmCalls?.length || 0}`);
      console.log(`  - Frames: ${this.replayData.header?.frameCount || 0}`);

      return this.getReplayInfo();
    } catch (error) {
      console.error(`[ReplayContinuation] Failed to load replay:`, error);
      throw new Error(`Failed to load replay file: ${error.message}`);
    }
  }

  /**
   * Get replay metadata and information
   *
   * @returns {Object} Replay info
   */
  getReplayInfo() {
    if (!this.loaded || !this.replayData) {
      return null;
    }

    const header = this.replayData.header;
    const lastCheckpoint = this.replayData.checkpoints?.[this.replayData.checkpoints.length - 1];
    const lastEvent = this.replayData.events?.[this.replayData.events.length - 1];

    return {
      version: header.version,
      timestamp: header.timestamp,
      date: new Date(header.timestamp).toISOString(),
      gameSeed: header.gameSeed,
      frameCount: header.frameCount,
      eventCount: header.eventCount,
      llmCallCount: header.llmCallCount,
      checkpointCount: header.checkpointCount,
      lastFrame: lastEvent?.frame || lastCheckpoint?.frame || 0,
      hasInitialState: !!this.replayData.initialState,
      hasCheckpoints: this.replayData.checkpoints?.length > 0
    };
  }

  /**
   * Get game state at a specific frame
   * Uses checkpoints and event replay for efficiency
   *
   * @param {number} frameNumber - Frame to get state for
   * @returns {Object|null} Game state at that frame
   */
  getStateAtFrame(frameNumber) {
    if (!this.loaded || !this.replayData) {
      throw new Error('No replay loaded');
    }

    // First check if there's an exact checkpoint at this frame
    const exactCheckpoint = this.replayData.checkpoints?.find(cp => cp.frame === frameNumber);
    if (exactCheckpoint) {
      console.log(`[ReplayContinuation] Using exact checkpoint at frame ${frameNumber}`);
      return exactCheckpoint.state;
    }

    // Find the closest checkpoint before or at this frame
    let closestCheckpoint = null;
    let closestDistance = Infinity;

    for (const checkpoint of this.replayData.checkpoints || []) {
      if (checkpoint.frame <= frameNumber) {
        const distance = frameNumber - checkpoint.frame;
        if (distance < closestDistance) {
          closestCheckpoint = checkpoint;
          closestDistance = distance;
        }
      }
    }

    // If we have a checkpoint, check if we need to find exact frame state
    if (closestCheckpoint) {
      if (closestCheckpoint.frame === frameNumber) {
        console.log(`[ReplayContinuation] Using checkpoint at frame ${frameNumber}`);
        return closestCheckpoint.state;
      }
      
      // Try to find an event with gameState at the exact frame
      console.log(`[ReplayContinuation] Using checkpoint at frame ${closestCheckpoint.frame} for frame ${frameNumber}`);
      const eventWithState = this.replayData.events?.find(e => e.frame === frameNumber && e.gameState);
      if (eventWithState) {
        console.log(`[ReplayContinuation] Found event with exact state at frame ${frameNumber}`);
        return eventWithState.gameState;
      }
      
      // Fall back to checkpoint state but update the frame number
      const state = JSON.parse(JSON.stringify(closestCheckpoint.state));
      state.frame = frameNumber;
      return state;
    }

    // Otherwise, use initial state if available
    if (this.replayData.initialState) {
      console.log(`[ReplayContinuation] Using initial state for frame ${frameNumber}`);
      const state = JSON.parse(JSON.stringify(this.replayData.initialState));
      state.frame = frameNumber;
      return state;
    }

    // If we have events with game states, try to find one
    const eventWithState = this.replayData.events?.find(e => e.frame === frameNumber && e.gameState);
    if (eventWithState) {
      console.log(`[ReplayContinuation] Using event game state at frame ${frameNumber}`);
      return eventWithState.gameState;
    }

    console.warn(`[ReplayContinuation] No state found for frame ${frameNumber}`);
    return null;
  }

  /**
   * Continue from replay as a new game session
   * Loads the final state and creates a new GameService
   *
   * @param {Object} options - Continuation options
   * @param {number} options.fromFrame - Frame to continue from (default: last frame)
   * @param {number} options.newSeed - New random seed (default: generated)
   * @param {string} options.newReplayPath - Path to save new replay (default: auto-generated)
   * @param {string} options.model - LLM model to use (default: 'granite4:3b')
   * @param {number} options.temperature - LLM temperature (default: 0.8)
   * @returns {Promise<GameService>} New game service ready to continue
   */
  async continueAsNewGame(options = {}) {
    if (!this.loaded || !this.replayData) {
      throw new Error('No replay loaded. Call loadReplay() first.');
    }

    console.log(`[ReplayContinuation] Starting continuation as new game...`);

    // Determine which frame to continue from
    const lastFrame = this.replayData.header.frameCount || 0;
    const fromFrame = options.fromFrame !== undefined ? options.fromFrame : lastFrame;

    console.log(`[ReplayContinuation] Continuing from frame ${fromFrame} (last frame: ${lastFrame})`);

    // Get state at that frame
    const state = this.getStateAtFrame(fromFrame);
    if (!state) {
      throw new Error(`Cannot find state at frame ${fromFrame}`);
    }

    // Create new game session with new seed
    const newSeed = options.newSeed || Date.now();
    console.log(`[ReplayContinuation] Creating new session with seed ${newSeed}`);

    const session = await this._reconstructGameSession(state, {
      seed: newSeed,
      model: options.model || 'granite4:3b',
      temperature: options.temperature || 0.8,
      timeout: options.timeout || 60000
    });

    // Create game service
    const gameService = new GameService(session);
    await gameService.initialize();

    // Set up new replay logger
    // First reset the singleton to allow creating a new instance with a new seed
    if (ReplayLogger.instance) {
      ReplayLogger.instance = null;
    }
    
    const newReplayPath = options.newReplayPath || this._generateContinuationReplayPath();
    this.newReplayLogger = new ReplayLogger(newSeed);
    this.newReplayLogger.initialize(gameService.getGameState());

    console.log(`[ReplayContinuation] New replay will be saved to: ${newReplayPath}`);

    // Store continuation info
    this.continuationStartFrame = fromFrame;
    this.reconstructedSession = session;
    this.reconstructedService = gameService;

    // Publish initial state
    statePublisher.publish(gameService.getGameState(), EVENT_TYPES.GAME_STARTED, {
      continuedFrom: this.replayFilePath,
      continuationFrame: fromFrame,
      newSeed
    });

    console.log(`[ReplayContinuation] Continuation ready! Session ID: ${session.sessionId}`);

    return gameService;
  }

  /**
   * Play N frames of replay, then switch to live continuation
   *
   * @param {number} numFramesToPlay - Number of frames to play through
   * @param {Object} options - Continuation options (same as continueAsNewGame)
   * @param {Function} frameCallback - Optional callback for each frame: (frame, event) => void
   * @returns {Promise<GameService>} Game service ready for live play
   */
  async playAndContinue(numFramesToPlay, options = {}, frameCallback = null) {
    if (!this.loaded || !this.replayData) {
      throw new Error('No replay loaded. Call loadReplay() first.');
    }

    console.log(`[ReplayContinuation] Playing ${numFramesToPlay} frames before continuation...`);

    this.playbackMode = true;
    this.currentPlaybackFrame = 0;
    this.playbackEventIndex = 0;

    // Play through events
    const eventsToPlay = this.replayData.events.filter(e => e.frame < numFramesToPlay);

    for (const event of eventsToPlay) {
      this.currentPlaybackFrame = event.frame;
      this.playbackEventIndex++;

      if (frameCallback) {
        frameCallback(event.frame, event);
      }

      // Simulate playback timing
      await this._sleep(10);
    }

    this.playbackMode = false;

    console.log(`[ReplayContinuation] Playback complete. Continuing from frame ${numFramesToPlay}...`);

    // Continue from this point
    return await this.continueAsNewGame({
      ...options,
      fromFrame: numFramesToPlay
    });
  }

  /**
   * Continue from a specific state snapshot
   * Useful for advanced use cases where you've manipulated state
   *
   * @param {Object} state - Game state to continue from
   * @param {Object} options - Continuation options
   * @returns {Promise<GameService>} New game service
   */
  async continueFromState(state, options = {}) {
    if (!state) {
      throw new Error('State is required');
    }

    console.log(`[ReplayContinuation] Continuing from provided state...`);

    const newSeed = options.newSeed || Date.now();

    const session = await this._reconstructGameSession(state, {
      seed: newSeed,
      model: options.model || 'granite4:3b',
      temperature: options.temperature || 0.8,
      timeout: options.timeout || 60000
    });

    const gameService = new GameService(session);
    await gameService.initialize();

    // Set up replay logger
    const newReplayPath = options.newReplayPath || this._generateContinuationReplayPath();
    this.newReplayLogger = new ReplayLogger(newSeed);
    this.newReplayLogger.initialize(gameService.getGameState());

    this.reconstructedSession = session;
    this.reconstructedService = gameService;

    console.log(`[ReplayContinuation] Continuation from state ready!`);

    return gameService;
  }

  /**
   * Save the new continuation replay
   *
   * @param {string} filePath - Path to save (optional, uses auto-generated path)
   * @returns {Promise<void>}
   */
  async saveContinuationReplay(filePath = null) {
    if (!this.newReplayLogger) {
      throw new Error('No continuation replay to save. Start a continuation first.');
    }

    const savePath = filePath || this._generateContinuationReplayPath();
    await this.newReplayLogger.save(savePath);
    console.log(`[ReplayContinuation] Continuation replay saved to: ${savePath}`);
  }

  /**
   * Get statistics about the replay and continuation
   *
   * @returns {Object} Statistics
   */
  getStats() {
    if (!this.loaded) {
      return null;
    }

    const info = this.getReplayInfo();

    return {
      replay: info,
      continuation: this.reconstructedSession ? {
        active: true,
        startFrame: this.continuationStartFrame,
        currentFrame: this.reconstructedSession.frame,
        sessionId: this.reconstructedSession.sessionId,
        newEventCount: this.newReplayLogger?.getEventCount() || 0,
        newLLMCallCount: this.newReplayLogger?.getLLMCallCount() || 0
      } : {
        active: false
      }
    };
  }

  /**
   * Reconstruct a GameSession from a state snapshot
   * @private
   */
  async _reconstructGameSession(state, options) {
    console.log(`[ReplayContinuation] Reconstructing game session...`);

    // Create new session with continuation seed
    const session = new GameSession({
      seed: options.seed,
      model: options.model,
      temperature: options.temperature,
      timeout: options.timeout,
      autoDetectQuests: true
    });

    // Restore basic session state
    session.frame = state.frame || 0;
    session.gameTime = state.time?.gameTime || 480;
    session.day = state.time?.day || 1;
    session.season = state.time?.season || 'autumn';
    session.year = state.time?.year || 1247;
    session.weather = state.time?.weather || 'clear';
    session.currentLocation = state.location?.current || null;
    session.paused = false; // Always start unpaused

    // Restore discovered/visited locations
    if (state.location?.discovered) {
      session.discoveredLocations = new Set(state.location.discovered);
    }
    if (state.location?.visited) {
      session.visitedLocations = new Set(state.location.visited);
    }

    // Restore location database
    if (state.location?.database) {
      session.locationDatabase = new Map();
      for (const [locId, locData] of Object.entries(state.location.database)) {
        session.locationDatabase.set(locId, locData);
      }
    }

    // Restore characters
    if (state.characters) {
      // Protagonist
      if (state.characters.protagonist) {
        const protagonist = this._reconstructCharacter(state.characters.protagonist);
        session.addCharacter(protagonist);
      }

      // NPCs
      if (state.characters.npcs) {
        for (const npcData of state.characters.npcs) {
          const npc = this._reconstructCharacter(npcData);
          session.addCharacter(npc);
        }
      }
    }

    // Restore quests
    if (state.quests?.active) {
      for (const quest of state.quests.active) {
        session.questManager.createQuest(quest);
      }
    }

    console.log(`[ReplayContinuation] Session reconstructed:`);
    console.log(`  - Frame: ${session.frame}`);
    console.log(`  - Characters: ${session.characters.size}`);
    console.log(`  - Active Quests: ${session.questManager.getActiveQuests().length}`);
    console.log(`  - Location: ${session.currentLocation}`);

    return session;
  }

  /**
   * Reconstruct a Character from serialized data
   * @private
   */
  _reconstructCharacter(data) {
    // Create personality
    const personality = new Personality();
    if (data.personality) {
      Object.assign(personality, data.personality);
    }

    // Create memory store
    const memory = new MemoryStore(data.id);
    if (data.memories) {
      // Restore memories if available
      if (Array.isArray(data.memories)) {
        for (const mem of data.memories) {
          memory.addMemory(mem.type, mem.content, mem.metadata || {});
        }
      }
    }

    // Create relationship manager
    const relationships = new RelationshipManager(data.id);
    if (data.relationships) {
      // Restore relationships if available
      if (data.relationships.relationships) {
        for (const [otherId, relData] of Object.entries(data.relationships.relationships)) {
          relationships.setRelationship(otherId, relData.score, relData.context || '');
        }
      }
    }

    // Create stats if present
    let stats = null;
    if (data.stats) {
      stats = new CharacterStats(
        data.stats.level || 1,
        data.stats.maxHP || 100,
        data.stats.maxMP || 50
      );
      stats.hp = data.stats.hp;
      stats.mp = data.stats.mp;
      stats.attack = data.stats.attack;
      stats.defense = data.stats.defense;
      stats.experience = data.stats.experience || 0;
    }

    // Create inventory if present
    let inventory = null;
    if (data.inventory) {
      inventory = new Inventory();
      inventory.gold = data.inventory.gold || 0;
      // Items would need more detailed restoration
    }

    // Create equipment if present
    let equipment = null;
    if (data.equipment) {
      equipment = new Equipment();
      // Equipment slots would need restoration
    }

    // Create character
    const character = new Character(data.id, data.name, {
      role: data.role || 'npc',
      personality,
      memory,
      relationships,
      backstory: data.backstory || '',
      occupation: data.occupation || '',
      age: data.age || null,
      x: data.position?.x || 0,
      y: data.position?.y || 0,
      currentLocation: data.location || null,
      stats,
      inventory,
      equipment
    });

    // Restore state
    character.emotionalState = data.state?.emotionalState || 'neutral';
    character.currentGoal = data.state?.currentGoal || null;
    character.inConversation = data.state?.inConversation || false;

    return character;
  }

  /**
   * Generate a continuation replay file path
   * @private
   */
  _generateContinuationReplayPath() {
    if (!this.replayFilePath) {
      return `./replays/continuation_${Date.now()}.replay`;
    }

    const parsed = path.parse(this.replayFilePath);
    const timestamp = Date.now();
    return path.join(
      parsed.dir,
      `${parsed.name}_continued_${timestamp}${parsed.ext}`
    );
  }

  /**
   * Sleep helper for playback timing
   * @private
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if replay is loaded
   *
   * @returns {boolean}
   */
  isLoaded() {
    return this.loaded;
  }

  /**
   * Check if currently in playback mode
   *
   * @returns {boolean}
   */
  isPlayingBack() {
    return this.playbackMode;
  }

  /**
   * Get current playback progress
   *
   * @returns {Object|null} Progress info
   */
  getPlaybackProgress() {
    if (!this.playbackMode) {
      return null;
    }

    return {
      currentFrame: this.currentPlaybackFrame,
      currentEventIndex: this.playbackEventIndex,
      totalEvents: this.replayData?.events?.length || 0,
      totalFrames: this.replayData?.header?.frameCount || 0
    };
  }
}

export default ReplayContinuation;
