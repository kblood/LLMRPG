/**
 * GameState - Central game state container
 *
 * Holds all game state data including world, clock, and environmental state.
 * Provides serialization/deserialization for save/load functionality.
 *
 * Features:
 * - World instance management
 * - GameClock instance management
 * - Frame tracking
 * - Pause state
 * - Playback speed
 * - Weather and season system
 * - JSON serialization
 */

class GameState {
  /**
   * Initialize GameState
   * @param {Object} options - Configuration options
   * @param {Object} options.world - World instance
   * @param {Object} options.clock - GameClock instance
   * @param {string} options.gameId - Unique game identifier
   * @param {number} options.seed - Random seed for the game
   */
  constructor(options = {}) {
    /**
     * @type {string}
     * @private
     */
    this._gameId = options.gameId || this._generateGameId();

    /**
     * @type {Object}
     * @public
     */
    this.world = options.world || null;

    /**
     * @type {Object}
     * @public
     */
    this.clock = options.clock || null;

    /**
     * @type {number}
     * @public
     */
    this.currentFrame = 0;

    /**
     * @type {boolean}
     * @public
     */
    this.isPaused = false;

    /**
     * @type {number}
     * @public
     */
    this.speed = 1.0;

    /**
     * @type {number}
     * @private
     */
    this._seed = options.seed || Math.floor(Math.random() * 0xffffffff);

    /**
     * @type {string}
     * @public
     */
    this.weather = 'clear'; // 'clear', 'rainy', 'stormy', 'foggy', 'snowy'

    /**
     * @type {number}
     * @public
     */
    this.weatherIntensity = 0; // 0-1

    /**
     * @type {string}
     * @public
     */
    this.season = 'spring'; // 'spring', 'summer', 'autumn', 'winter'

    /**
     * @type {number}
     * @public
     */
    this.dayOfYear = 1; // 1-365

    /**
     * @type {number}
     * @public
     */
    this.year = 1;

    /**
     * @type {Object}
     * @private
     */
    this._metadata = {
      createdAt: new Date().toISOString(),
      lastSavedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    /**
     * @type {Object}
     * @private
     */
    this._stats = {
      totalPlayTime: 0, // milliseconds
      questsCompleted: 0,
      enemiesDefeated: 0,
      itemsCollected: 0,
      distanceTraveled: 0
    };
  }

  /**
   * Get unique game identifier
   * @returns {string}
   */
  get gameId() {
    return this._gameId;
  }

  /**
   * Get random seed
   * @returns {number}
   */
  get seed() {
    return this._seed;
  }

  /**
   * Get metadata
   * @returns {Object}
   */
  get metadata() {
    return { ...this._metadata };
  }

  /**
   * Get game statistics
   * @returns {Object}
   */
  get stats() {
    return { ...this._stats };
  }

  /**
   * Update game statistics
   * @param {Object} updates - Statistics to update
   */
  updateStats(updates) {
    if (typeof updates !== 'object') {
      throw new Error('Stats updates must be an object');
    }

    Object.assign(this._stats, updates);
  }

  /**
   * Get current game time (hour of day)
   * @returns {number}
   */
  getTimeOfDay() {
    if (!this.clock) {
      return 0;
    }
    return this.clock.getHour ? this.clock.getHour() : 0;
  }

  /**
   * Get current date string
   * @returns {string}
   */
  getDateString() {
    return `Year ${this.year}, Day ${this.dayOfYear} (${this.season})`;
  }

  /**
   * Get environmental state
   * @returns {Object}
   */
  getEnvironmentState() {
    return {
      weather: this.weather,
      weatherIntensity: this.weatherIntensity,
      season: this.season,
      dayOfYear: this.dayOfYear,
      year: this.year,
      timeOfDay: this.getTimeOfDay()
    };
  }

  /**
   * Update environmental state
   * @param {Object} state - Environmental state updates
   */
  updateEnvironmentState(state) {
    if (state.weather !== undefined) this.weather = state.weather;
    if (state.weatherIntensity !== undefined) this.weatherIntensity = state.weatherIntensity;
    if (state.season !== undefined) this.season = state.season;
    if (state.dayOfYear !== undefined) this.dayOfYear = state.dayOfYear;
    if (state.year !== undefined) this.year = state.year;
  }

  /**
   * Serialize game state to JSON
   * @returns {Object} Serialized state
   */
  toJSON() {
    return {
      gameId: this._gameId,
      seed: this._seed,
      currentFrame: this.currentFrame,
      isPaused: this.isPaused,
      speed: this.speed,
      weather: this.weather,
      weatherIntensity: this.weatherIntensity,
      season: this.season,
      dayOfYear: this.dayOfYear,
      year: this.year,
      world: this.world ? this.world.toJSON?.() : null,
      clock: this.clock ? this.clock.toJSON?.() : null,
      metadata: { ...this._metadata },
      stats: { ...this._stats }
    };
  }

  /**
   * Deserialize game state from JSON
   * @param {Object} data - Serialized state data
   * @returns {GameState} Returns this for chaining
   */
  fromJSON(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid game state data');
    }

    this._gameId = data.gameId || this._gameId;
    this._seed = data.seed !== undefined ? data.seed : this._seed;
    this.currentFrame = data.currentFrame || 0;
    this.isPaused = data.isPaused || false;
    this.speed = data.speed || 1.0;
    this.weather = data.weather || 'clear';
    this.weatherIntensity = data.weatherIntensity || 0;
    this.season = data.season || 'spring';
    this.dayOfYear = data.dayOfYear || 1;
    this.year = data.year || 1;

    // Deserialize world if available
    if (data.world && this.world && this.world.fromJSON) {
      this.world.fromJSON(data.world);
    }

    // Deserialize clock if available
    if (data.clock && this.clock && this.clock.fromJSON) {
      this.clock.fromJSON(data.clock);
    }

    // Restore metadata and stats
    if (data.metadata) {
      this._metadata = { ...data.metadata };
    }

    if (data.stats) {
      this._stats = { ...data.stats };
    }

    return this;
  }

  /**
   * Create a deep copy of game state
   * Useful for snapshots and undo/redo
   * @returns {GameState}
   */
  clone() {
    const cloned = new GameState({
      gameId: this._gameId,
      seed: this._seed,
      world: this.world ? this.world.clone?.() : null,
      clock: this.clock ? this.clock.clone?.() : null
    });

    cloned.currentFrame = this.currentFrame;
    cloned.isPaused = this.isPaused;
    cloned.speed = this.speed;
    cloned.weather = this.weather;
    cloned.weatherIntensity = this.weatherIntensity;
    cloned.season = this.season;
    cloned.dayOfYear = this.dayOfYear;
    cloned.year = this.year;
    cloned._metadata = { ...this._metadata };
    cloned._stats = { ...this._stats };

    return cloned;
  }

  /**
   * Reset game state to initial values
   * @param {Object} options - Options for reset
   * @param {boolean} options.hard - Hard reset (clears world and clock)
   */
  reset(options = {}) {
    this.currentFrame = 0;
    this.isPaused = false;
    this.speed = 1.0;
    this.weather = 'clear';
    this.weatherIntensity = 0;
    this.season = 'spring';
    this.dayOfYear = 1;
    this.year = 1;

    if (options.hard) {
      this.world = null;
      this.clock = null;
      this._stats = {
        totalPlayTime: 0,
        questsCompleted: 0,
        enemiesDefeated: 0,
        itemsCollected: 0,
        distanceTraveled: 0
      };
    }

    this._metadata.lastSavedAt = new Date().toISOString();
  }

  /**
   * Generate a unique game ID
   * @private
   * @returns {string}
   */
  _generateGameId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `game_${timestamp}_${random}`;
  }

  /**
   * Validate game state
   * @returns {Object} Validation result with issues array
   */
  validate() {
    const issues = [];

    if (!this._gameId || typeof this._gameId !== 'string') {
      issues.push('Invalid gameId');
    }

    if (typeof this._seed !== 'number') {
      issues.push('Invalid seed');
    }

    if (typeof this.currentFrame !== 'number') {
      issues.push('Invalid currentFrame');
    }

    if (typeof this.isPaused !== 'boolean') {
      issues.push('Invalid isPaused');
    }

    if (typeof this.speed !== 'number' || this.speed <= 0) {
      issues.push('Invalid speed multiplier');
    }

    const validWeather = ['clear', 'rainy', 'stormy', 'foggy', 'snowy'];
    if (!validWeather.includes(this.weather)) {
      issues.push('Invalid weather state');
    }

    const validSeasons = ['spring', 'summer', 'autumn', 'winter'];
    if (!validSeasons.includes(this.season)) {
      issues.push('Invalid season');
    }

    if (this.dayOfYear < 1 || this.dayOfYear > 365) {
      issues.push('Invalid dayOfYear');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

export default GameState;
