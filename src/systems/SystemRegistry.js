/**
 * Registry for managing all game systems
 * Handles system registration, initialization, updates, and cleanup
 */
class SystemRegistry {
  /**
   * Initialize the system registry
   */
  constructor() {
    /**
     * @type {Map<string, System>}
     * @private
     */
    this._systems = new Map();

    /**
     * @type {System[]}
     * @private
     */
    this._sortedSystems = [];
  }

  /**
   * Register a new system
   * @param {System} system - The system to register
   * @throws {Error} If a system with the same name already exists
   * @returns {SystemRegistry} - For method chaining
   */
  register(system) {
    if (this._systems.has(system.name)) {
      throw new Error(`System with name "${system.name}" is already registered`);
    }

    this._systems.set(system.name, system);
    this._updateSortedSystems();

    return this;
  }

  /**
   * Get a system by name
   * @param {string} name - The system name
   * @returns {System|null} - The system or null if not found
   */
  get(name) {
    return this._systems.get(name) || null;
  }

  /**
   * Get all systems sorted by priority
   * Lower priority values are returned first
   * @returns {System[]} - Array of systems sorted by priority
   */
  getAll() {
    return [...this._sortedSystems];
  }

  /**
   * Initialize all registered systems
   * @param {Object} engine - The game engine instance
   * @returns {Promise<void>}
   */
  async initializeAll(engine) {
    for (const system of this._sortedSystems) {
      if (system.enabled) {
        try {
          await system.initialize(engine);
        } catch (error) {
          console.error(`Failed to initialize system "${system.name}":`, error);
          throw error;
        }
      }
    }
  }

  /**
   * Update all enabled systems
   * Systems are updated in priority order
   * @param {number} deltaTime - Time elapsed since last frame in milliseconds
   * @param {Object} gameState - Current game state
   * @returns {void}
   */
  updateAll(deltaTime, gameState) {
    for (const system of this._sortedSystems) {
      if (system.enabled) {
        try {
          system.update(deltaTime, gameState);
        } catch (error) {
          console.error(`Error updating system "${system.name}":`, error);
        }
      }
    }
  }

  /**
   * Destroy all systems in reverse priority order
   * @returns {void}
   */
  destroyAll() {
    // Destroy in reverse order
    for (let i = this._sortedSystems.length - 1; i >= 0; i--) {
      const system = this._sortedSystems[i];
      try {
        system.destroy();
      } catch (error) {
        console.error(`Error destroying system "${system.name}":`, error);
      }
    }

    this._systems.clear();
    this._sortedSystems = [];
  }

  /**
   * Update the internally sorted systems array
   * @private
   */
  _updateSortedSystems() {
    this._sortedSystems = Array.from(this._systems.values()).sort(
      (a, b) => a.priority - b.priority
    );
  }
}

export default SystemRegistry;
