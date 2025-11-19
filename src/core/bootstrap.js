/**
 * bootstrap.js - Game initialization helper
 *
 * Provides factory functions for creating and loading games.
 * Handles initialization of all systems, services, and state.
 *
 * Features:
 * - Create new games with seed
 * - Load games from save data
 * - Full system and service initialization
 * - Error handling and validation
 */

import GameEngine from './GameEngine.js';
import GameState from './GameState.js';
import SystemRegistry from '../systems/SystemRegistry.js';
import { EventBus } from '../services/EventBus.js';

/**
 * Create a new game with default initialization
 *
 * @param {Object} options - Game creation options
 * @param {number} options.seed - Random seed for the game (optional)
 * @param {boolean} options.headless - Run in headless mode (default: false)
 * @param {number} options.targetFPS - Target FPS (default: 60)
 * @param {Function} options.onWorldCreate - Callback to create world instance
 * @param {Function} options.onClockCreate - Callback to create clock instance
 * @param {Function} options.onSystemSetup - Callback to set up systems
 * @param {Object} options.serviceManager - Service manager instance
 * @returns {Promise<Object>} Game instance with engine, state, and systems
 * @throws {Error} If initialization fails
 *
 * @example
 * const game = await createNewGame({
 *   seed: 12345,
 *   headless: false,
 *   onWorldCreate: (state) => new World(state),
 *   onClockCreate: (state) => new GameClock(state),
 *   onSystemSetup: (registry) => {
 *     registry.register(new MovementSystem());
 *     registry.register(new RenderSystem());
 *   }
 * });
 */
async function createNewGame(options = {}) {
  try {
    EventBus.emit('bootstrap:gameCreation:started');

    // Generate or use provided seed
    const seed = options.seed !== undefined ? options.seed : Math.floor(Math.random() * 0xffffffff);

    // Create game state
    const gameState = new GameState({
      seed,
      gameId: undefined // Will auto-generate
    });

    // Create World instance if callback provided
    if (options.onWorldCreate && typeof options.onWorldCreate === 'function') {
      try {
        gameState.world = options.onWorldCreate(gameState);
      } catch (error) {
        console.error('Failed to create World:', error);
        throw new Error(`World creation failed: ${error.message}`);
      }
    }

    // Create GameClock instance if callback provided
    if (options.onClockCreate && typeof options.onClockCreate === 'function') {
      try {
        gameState.clock = options.onClockCreate(gameState);
      } catch (error) {
        console.error('Failed to create GameClock:', error);
        throw new Error(`GameClock creation failed: ${error.message}`);
      }
    }

    // Create system registry
    const systemRegistry = new SystemRegistry();

    // Set up systems via callback if provided
    if (options.onSystemSetup && typeof options.onSystemSetup === 'function') {
      try {
        options.onSystemSetup(systemRegistry, gameState);
      } catch (error) {
        console.error('Failed to set up systems:', error);
        throw new Error(`System setup failed: ${error.message}`);
      }
    }

    // Create game engine
    const engine = new GameEngine({
      headless: options.headless || false,
      targetFPS: options.targetFPS || 60,
      gameState,
      systemRegistry,
      serviceManager: options.serviceManager || null
    });

    // Initialize engine
    try {
      await engine.initialize();
    } catch (error) {
      console.error('Failed to initialize engine:', error);
      throw new Error(`Engine initialization failed: ${error.message}`);
    }

    // Validate game state
    const validation = gameState.validate();
    if (!validation.isValid) {
      throw new Error(`Invalid game state: ${validation.issues.join(', ')}`);
    }

    EventBus.emit('bootstrap:gameCreation:completed', {
      gameId: gameState.gameId,
      seed
    });

    return {
      engine,
      gameState,
      systemRegistry,
      seed
    };
  } catch (error) {
    EventBus.emit('bootstrap:gameCreation:failed', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Load a game from save data
 *
 * @param {Object} options - Load options
 * @param {Object} options.saveData - Serialized game state data
 * @param {boolean} options.headless - Run in headless mode (default: false)
 * @param {number} options.targetFPS - Target FPS (default: 60)
 * @param {Function} options.onWorldCreate - Callback to create world instance
 * @param {Function} options.onClockCreate - Callback to create clock instance
 * @param {Function} options.onSystemSetup - Callback to set up systems
 * @param {Object} options.serviceManager - Service manager instance
 * @returns {Promise<Object>} Game instance with engine and state
 * @throws {Error} If save data is invalid or loading fails
 *
 * @example
 * const game = await loadGame({
 *   saveData: savedGameData,
 *   headless: false,
 *   onWorldCreate: (state) => new World(state),
 *   onClockCreate: (state) => new GameClock(state),
 *   onSystemSetup: (registry, state) => {
 *     registry.register(new MovementSystem());
 *     registry.register(new RenderSystem());
 *   }
 * });
 */
async function loadGame(options = {}) {
  try {
    EventBus.emit('bootstrap:gameLoad:started');

    const { saveData } = options;

    // Validate save data
    if (!saveData || typeof saveData !== 'object') {
      throw new Error('Invalid save data: must be an object');
    }

    if (!saveData.gameId) {
      throw new Error('Invalid save data: missing gameId');
    }

    // Create game state and deserialize
    const gameState = new GameState({
      gameId: saveData.gameId,
      seed: saveData.seed
    });

    // Restore state from save data
    try {
      gameState.fromJSON(saveData);
    } catch (error) {
      console.error('Failed to deserialize game state:', error);
      throw new Error(`Failed to load game state: ${error.message}`);
    }

    // Create World instance if callback provided
    if (options.onWorldCreate && typeof options.onWorldCreate === 'function') {
      try {
        gameState.world = options.onWorldCreate(gameState);
      } catch (error) {
        console.error('Failed to create World:', error);
        throw new Error(`World creation failed: ${error.message}`);
      }
    }

    // Create GameClock instance if callback provided
    if (options.onClockCreate && typeof options.onClockCreate === 'function') {
      try {
        gameState.clock = options.onClockCreate(gameState);
      } catch (error) {
        console.error('Failed to create GameClock:', error);
        throw new Error(`GameClock creation failed: ${error.message}`);
      }
    }

    // Create system registry
    const systemRegistry = new SystemRegistry();

    // Set up systems via callback if provided
    if (options.onSystemSetup && typeof options.onSystemSetup === 'function') {
      try {
        options.onSystemSetup(systemRegistry, gameState);
      } catch (error) {
        console.error('Failed to set up systems:', error);
        throw new Error(`System setup failed: ${error.message}`);
      }
    }

    // Create game engine
    const engine = new GameEngine({
      headless: options.headless || false,
      targetFPS: options.targetFPS || 60,
      gameState,
      systemRegistry,
      serviceManager: options.serviceManager || null
    });

    // Initialize engine
    try {
      await engine.initialize();
    } catch (error) {
      console.error('Failed to initialize engine:', error);
      throw new Error(`Engine initialization failed: ${error.message}`);
    }

    // Validate loaded game state
    const validation = gameState.validate();
    if (!validation.isValid) {
      throw new Error(`Invalid loaded game state: ${validation.issues.join(', ')}`);
    }

    EventBus.emit('bootstrap:gameLoad:completed', {
      gameId: gameState.gameId,
      frame: gameState.currentFrame,
      seed: gameState.seed
    });

    return {
      engine,
      gameState,
      systemRegistry
    };
  } catch (error) {
    EventBus.emit('bootstrap:gameLoad:failed', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Get default game creation options
 * Provides a template for game setup
 *
 * @returns {Object} Default options object
 */
function getDefaultGameOptions() {
  return {
    headless: false,
    targetFPS: 60,
    seed: undefined,
    onWorldCreate: null,
    onClockCreate: null,
    onSystemSetup: null,
    serviceManager: null
  };
}

/**
 * Validate save data structure
 *
 * @param {Object} saveData - Save data to validate
 * @returns {Object} Validation result with issues array
 */
function validateSaveData(saveData) {
  const issues = [];

  if (!saveData || typeof saveData !== 'object') {
    issues.push('Save data must be an object');
    return { isValid: false, issues };
  }

  if (!saveData.gameId || typeof saveData.gameId !== 'string') {
    issues.push('Missing or invalid gameId');
  }

  if (typeof saveData.seed !== 'number') {
    issues.push('Missing or invalid seed');
  }

  if (typeof saveData.currentFrame !== 'number') {
    issues.push('Missing or invalid currentFrame');
  }

  if (typeof saveData.isPaused !== 'boolean') {
    issues.push('Missing or invalid isPaused');
  }

  if (!saveData.metadata || typeof saveData.metadata !== 'object') {
    issues.push('Missing or invalid metadata');
  }

  if (!saveData.stats || typeof saveData.stats !== 'object') {
    issues.push('Missing or invalid stats');
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}

export {
  createNewGame,
  loadGame,
  getDefaultGameOptions,
  validateSaveData
};

export default {
  createNewGame,
  loadGame,
  getDefaultGameOptions,
  validateSaveData
};
