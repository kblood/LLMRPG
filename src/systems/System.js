/**
 * Base class for all game systems
 * Systems handle core game logic like physics, rendering, AI, etc.
 */
class System {
  /**
   * Initialize a system
   * @param {string} name - Unique identifier for this system
   * @param {number} priority - Execution order (lower = executed first)
   */
  constructor(name, priority = 0) {
    /**
     * @type {string}
     * @private
     */
    this._name = name;

    /**
     * @type {number}
     * @private
     */
    this._priority = priority;

    /**
     * @type {boolean}
     */
    this.enabled = true;
  }

  /**
   * Get the system's name
   * @returns {string}
   */
  get name() {
    return this._name;
  }

  /**
   * Get the system's priority
   * @returns {number}
   */
  get priority() {
    return this._priority;
  }

  /**
   * Initialize the system with the engine
   * Called once when the system is registered
   * @param {Object} engine - The game engine instance
   * @returns {void}
   */
  initialize(engine) {
    // Override in subclasses if needed
  }

  /**
   * Update the system each frame
   * Must be implemented by subclasses
   * @abstract
   * @param {number} deltaTime - Time elapsed since last frame in milliseconds
   * @param {Object} gameState - Current game state
   * @returns {void}
   */
  update(deltaTime, gameState) {
    throw new Error(`update() method must be implemented in ${this.name}`);
  }

  /**
   * Clean up resources
   * Called when the system is destroyed
   * @returns {void}
   */
  destroy() {
    // Override in subclasses if needed
  }
}

export default System;
