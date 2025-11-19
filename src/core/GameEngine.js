/**
 * GameEngine - Main game loop coordinator
 *
 * The central orchestrator for the game loop, managing frame timing,
 * system updates, and game state coordination.
 *
 * Features:
 * - 60 FPS game loop
 * - Delta time calculation
 * - Headless mode support for testing
 * - Integration with SystemRegistry and ServiceManager
 * - Pause/resume functionality
 * - Speed multiplier support
 */

import { EventBus } from '../services/EventBus.js';
import SystemRegistry from '../systems/SystemRegistry.js';

class GameEngine {
  /**
   * Initialize the GameEngine
   * @param {Object} options - Configuration options
   * @param {boolean} options.headless - Run without rendering (default: false)
   * @param {number} options.targetFPS - Target frames per second (default: 60)
   * @param {Object} options.gameState - Initial game state instance
   * @param {Object} options.systemRegistry - System registry instance
   * @param {Object} options.serviceManager - Service manager instance
   */
  constructor(options = {}) {
    /**
     * @type {boolean}
     * @private
     */
    this._headless = options.headless || false;

    /**
     * @type {number}
     * @private
     */
    this._targetFPS = options.targetFPS || 60;

    /**
     * @type {number}
     * @private
     */
    this._frameTime = 1000 / this._targetFPS;

    /**
     * @type {Object}
     * @private
     */
    this._gameState = options.gameState || null;

    /**
     * @type {SystemRegistry}
     * @private
     */
    this._systemRegistry = options.systemRegistry || new SystemRegistry();

    /**
     * @type {Object}
     * @private
     */
    this._serviceManager = options.serviceManager || null;

    /**
     * @type {boolean}
     * @private
     */
    this._isRunning = false;

    /**
     * @type {boolean}
     * @private
     */
    this._isPaused = false;

    /**
     * @type {number}
     * @private
     */
    this._lastFrameTime = 0;

    /**
     * @type {number}
     * @private
     */
    this._accumulatedTime = 0;

    /**
     * @type {number}
     * @private
     */
    this._frameCount = 0;

    /**
     * @type {number}
     * @private
     */
    this._animationFrameId = null;

    /**
     * @type {Function}
     * @private
     */
    this._gameLoopBound = this._gameLoop.bind(this);

    /**
     * @type {number}
     * @private
     */
    this._speed = 1.0;

    /**
     * @type {Object}
     * @private
     */
    this._debugStats = {
      frameCount: 0,
      totalTime: 0,
      avgDeltaTime: 0,
      lastSecondFrames: 0
    };
  }

  /**
   * Check if engine is in headless mode
   * @returns {boolean}
   */
  get headless() {
    return this._headless;
  }

  /**
   * Check if engine is currently running
   * @returns {boolean}
   */
  get isRunning() {
    return this._isRunning;
  }

  /**
   * Check if engine is paused
   * @returns {boolean}
   */
  get isPaused() {
    return this._isPaused;
  }

  /**
   * Get current frame count
   * @returns {number}
   */
  get frameCount() {
    return this._frameCount;
  }

  /**
   * Get playback speed multiplier
   * @returns {number}
   */
  get speed() {
    return this._speed;
  }

  /**
   * Set playback speed multiplier
   * @param {number} speed - Speed multiplier (0.1 to 4.0 recommended)
   */
  set speed(speed) {
    if (typeof speed !== 'number' || speed <= 0) {
      throw new Error('Speed must be a positive number');
    }
    this._speed = speed;
    EventBus.emit('engine:speedChanged', { speed: this._speed });
  }

  /**
   * Get debug statistics
   * @returns {Object}
   */
  get debugStats() {
    return { ...this._debugStats };
  }

  /**
   * Initialize the game engine
   * Sets up all systems and prepares for game loop
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      EventBus.emit('engine:initializing');

      // Validate required components
      if (!this._gameState) {
        throw new Error('GameState is required for engine initialization');
      }

      // Initialize all registered systems
      await this._systemRegistry.initializeAll(this);

      // Reset timing
      this._lastFrameTime = performance.now();
      this._accumulatedTime = 0;
      this._frameCount = 0;

      EventBus.emit('engine:initialized');
    } catch (error) {
      console.error('Failed to initialize GameEngine:', error);
      throw error;
    }
  }

  /**
   * Start the game engine
   * Begins the game loop
   * @returns {void}
   */
  start() {
    if (this._isRunning) {
      console.warn('GameEngine is already running');
      return;
    }

    this._isRunning = true;
    this._isPaused = false;
    this._lastFrameTime = performance.now();
    this._accumulatedTime = 0;

    EventBus.emit('engine:started');

    // Start game loop
    this._animationFrameId = requestAnimationFrame(this._gameLoopBound);
  }

  /**
   * Stop the game engine
   * Halts the game loop and cleans up resources
   * @returns {void}
   */
  stop() {
    if (!this._isRunning) {
      console.warn('GameEngine is not running');
      return;
    }

    this._isRunning = false;
    this._isPaused = false;

    // Cancel animation frame
    if (this._animationFrameId) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }

    // Destroy all systems
    this._systemRegistry.destroyAll();

    EventBus.emit('engine:stopped');
  }

  /**
   * Pause the game engine
   * @returns {void}
   */
  pause() {
    if (!this._isRunning) {
      console.warn('Cannot pause: engine is not running');
      return;
    }

    this._isPaused = true;
    this._gameState.isPaused = true;

    EventBus.emit('engine:paused');
  }

  /**
   * Resume the game engine
   * @returns {void}
   */
  resume() {
    if (!this._isRunning) {
      console.warn('Cannot resume: engine is not running');
      return;
    }

    this._isPaused = false;
    this._gameState.isPaused = false;
    this._lastFrameTime = performance.now();

    EventBus.emit('engine:resumed');
  }

  /**
   * Main game loop
   * Processes frame timing and updates all systems
   * @private
   */
  _gameLoop() {
    if (!this._isRunning) {
      return;
    }

    const currentTime = performance.now();
    const deltaTimeRaw = currentTime - this._lastFrameTime;
    this._lastFrameTime = currentTime;

    // Apply speed multiplier only if not paused
    const deltaTime = this._isPaused ? 0 : deltaTimeRaw * this._speed;

    // Accumulate time for fixed timestep (optional)
    this._accumulatedTime += deltaTime;

    // Update game state frame counter
    this._gameState.currentFrame = this._frameCount;

    // Update all systems
    this._update(deltaTime);

    // Update debug stats
    this._updateDebugStats(deltaTimeRaw);

    // Increment frame count
    this._frameCount++;

    // Schedule next frame
    this._animationFrameId = requestAnimationFrame(this._gameLoopBound);
  }

  /**
   * Update all systems with delta time
   * @private
   * @param {number} deltaTime - Delta time in milliseconds
   */
  _update(deltaTime) {
    try {
      // Update all systems
      this._systemRegistry.updateAll(deltaTime, this._gameState);

      // Emit frame update event
      EventBus.emit('engine:frameUpdate', {
        frameCount: this._frameCount,
        deltaTime,
        isPaused: this._isPaused,
        speed: this._speed
      });
    } catch (error) {
      console.error('Error during engine update:', error);
      // Continue running even on error
    }
  }

  /**
   * Update debug statistics
   * @private
   * @param {number} deltaTimeRaw - Raw delta time without speed multiplier
   */
  _updateDebugStats(deltaTimeRaw) {
    this._debugStats.frameCount++;
    this._debugStats.totalTime += deltaTimeRaw;
    this._debugStats.avgDeltaTime = this._debugStats.totalTime / this._debugStats.frameCount;
    this._debugStats.lastSecondFrames++;

    // Reset per-second counter
    if (this._debugStats.totalTime % 1000 < deltaTimeRaw) {
      // Emit FPS info every second
      EventBus.emit('engine:fps', {
        fps: this._debugStats.lastSecondFrames,
        avgDeltaTime: this._debugStats.avgDeltaTime
      });
      this._debugStats.lastSecondFrames = 0;
    }
  }

  /**
   * Set game state instance
   * @param {Object} gameState - GameState instance
   */
  setGameState(gameState) {
    this._gameState = gameState;
  }

  /**
   * Set system registry instance
   * @param {SystemRegistry} registry - SystemRegistry instance
   */
  setSystemRegistry(registry) {
    this._systemRegistry = registry;
  }

  /**
   * Set service manager instance
   * @param {Object} serviceManager - ServiceManager instance
   */
  setServiceManager(serviceManager) {
    this._serviceManager = serviceManager;
  }

  /**
   * Get system registry
   * @returns {SystemRegistry}
   */
  getSystemRegistry() {
    return this._systemRegistry;
  }

  /**
   * Get service manager
   * @returns {Object}
   */
  getServiceManager() {
    return this._serviceManager;
  }

  /**
   * Get game state
   * @returns {Object}
   */
  getGameState() {
    return this._gameState;
  }
}

export default GameEngine;
