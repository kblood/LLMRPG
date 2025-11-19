import System from './System.js';

/**
 * Weather types available in the game
 * @enum {string}
 */
const WeatherType = {
  CLEAR: 'clear',
  CLOUDY: 'cloudy',
  RAINY: 'rainy',
  STORMY: 'stormy',
  SNOWY: 'snowy'
};

/**
 * System that manages world state including time and weather
 * Executes with priority 0 to ensure it runs first
 */
class WorldStateSystem extends System {
  /**
   * Initialize the WorldStateSystem
   */
  constructor() {
    super('WorldState', 0); // Priority 0 ensures it runs first

    /**
     * @type {number}
     * @private
     */
    this._gameTime = 0; // milliseconds since game start

    /**
     * @type {string}
     * @private
     */
    this._currentWeather = WeatherType.CLEAR;

    /**
     * @type {number}
     * @private
     */
    this._weatherChangeTimer = 0;

    /**
     * @type {number}
     * @private
     */
    this._weatherChangeDuration = 30000; // Change weather every 30 seconds

    /**
     * @type {Object[]}
     * @private
     */
    this._weatherListeners = [];
  }

  /**
   * Initialize the world state system
   * @param {Object} engine - The game engine instance
   * @returns {void}
   */
  initialize(engine) {
    console.log('WorldStateSystem initialized');
  }

  /**
   * Update the world state each frame
   * @param {number} deltaTime - Time elapsed since last frame in milliseconds
   * @param {Object} gameState - Current game state
   * @returns {void}
   */
  update(deltaTime, gameState) {
    // Update game time
    this._gameTime += deltaTime;

    // Update weather timer
    this._weatherChangeTimer += deltaTime;

    // Check if we should change weather
    if (this._weatherChangeTimer >= this._weatherChangeDuration) {
      this._changeWeather();
      this._weatherChangeTimer = 0;
    }

    // Update game state with current values
    if (gameState) {
      gameState.time = this._gameTime;
      gameState.weather = this._currentWeather;
      gameState.daysCycle = this._getDaysCycle();
      gameState.hoursCycle = this._getHoursCycle();
    }
  }

  /**
   * Clean up resources
   * @returns {void}
   */
  destroy() {
    this._weatherListeners = [];
  }

  /**
   * Get the current game time in milliseconds
   * @returns {number}
   */
  getGameTime() {
    return this._gameTime;
  }

  /**
   * Get the current weather
   * @returns {string}
   */
  getWeather() {
    return this._currentWeather;
  }

  /**
   * Set the weather manually
   * @param {string} weatherType - The weather type
   * @returns {void}
   */
  setWeather(weatherType) {
    if (!Object.values(WeatherType).includes(weatherType)) {
      console.warn(`Unknown weather type: ${weatherType}`);
      return;
    }

    const oldWeather = this._currentWeather;
    this._currentWeather = weatherType;
    this._notifyWeatherChange(oldWeather, weatherType);
  }

  /**
   * Subscribe to weather changes
   * @param {Function} callback - Callback function
   * @returns {void}
   */
  onWeatherChanged(callback) {
    this._weatherListeners.push(callback);
  }

  /**
   * Get the day cycle (0-1) where 0 is midnight and 1 is next midnight
   * Assumes a game day is 60 seconds real time
   * @private
   * @returns {number}
   */
  _getDaysCycle() {
    const GAME_DAY_MS = 60000; // 60 seconds = 1 game day
    return (this._gameTime % GAME_DAY_MS) / GAME_DAY_MS;
  }

  /**
   * Get the hour cycle (0-24) within a day
   * @private
   * @returns {number}
   */
  _getHoursCycle() {
    return this._getDaysCycle() * 24;
  }

  /**
   * Randomly change the weather
   * @private
   * @returns {void}
   */
  _changeWeather() {
    const weatherTypes = Object.values(WeatherType);
    const randomIndex = Math.floor(Math.random() * weatherTypes.length);
    const newWeather = weatherTypes[randomIndex];

    const oldWeather = this._currentWeather;

    if (newWeather !== oldWeather) {
      this._currentWeather = newWeather;
      this._notifyWeatherChange(oldWeather, newWeather);
    }
  }

  /**
   * Notify all listeners of a weather change
   * @private
   * @param {string} oldWeather - Previous weather
   * @param {string} newWeather - New weather
   * @returns {void}
   */
  _notifyWeatherChange(oldWeather, newWeather) {
    for (const listener of this._weatherListeners) {
      try {
        listener({ oldWeather, newWeather });
      } catch (error) {
        console.error('Error in weather change listener:', error);
      }
    }
  }
}

export default WorldStateSystem;
export { WeatherType };
