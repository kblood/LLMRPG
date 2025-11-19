/**
 * GameClock - Deterministic time management system
 * Tracks game time with frame counter, elapsed time, and calendar time
 * @author Game Utils
 */

import SeededRandom from './SeededRandom.js';

/**
 * GameClock class - Manages deterministic game time progression
 * Provides frame counting, game time tracking, and calendar time (day/hour/minute)
 * Uses a seeded random number generator to ensure reproducible timing
 */
class GameClock {
  /**
   * Creates a new GameClock instance
   * @param {number} startSeed - Seed for the internal RNG (optional)
   * @param {number} startTime - Starting game time in milliseconds (default: 0)
   */
  constructor(startSeed = Date.now(), startTime = 0) {
    // Frame tracking
    this.frameCount = 0;
    this.gameTime = startTime; // in milliseconds

    // Time units (configurable)
    this.msPerMinute = 60000; // 60 seconds
    this.msPerHour = 3600000; // 60 minutes
    this.msPerDay = 86400000; // 24 hours

    // Internal RNG for deterministic behavior
    this.rng = new SeededRandom(startSeed >>> 0);

    // Performance tracking
    this.deltaTime = 0;
    this.previousTime = 0;
  }

  /**
   * Updates the game clock with elapsed delta time
   * @param {number} deltaTime - Elapsed time in milliseconds
   */
  update(deltaTime) {
    if (typeof deltaTime !== 'number' || deltaTime < 0) {
      throw new TypeError('deltaTime must be a non-negative number');
    }

    this.deltaTime = deltaTime;
    this.gameTime += deltaTime;
    this.frameCount++;
  }

  /**
   * Gets the current game time in various formats
   * @returns {Object} Object containing all time information
   *   - gameTime: Total elapsed time in milliseconds
   *   - frameCount: Total frames elapsed
   *   - deltaTime: Time since last update in milliseconds
   *   - days: Number of complete days
   *   - hours: Hour component (0-23)
   *   - minutes: Minute component (0-59)
   *   - seconds: Second component (0-59)
   *   - totalSeconds: Total seconds elapsed
   *   - totalMinutes: Total minutes elapsed
   *   - totalHours: Total hours elapsed
   */
  getCurrentTime() {
    const totalSeconds = Math.floor(this.gameTime / 1000);
    const totalMinutes = Math.floor(this.gameTime / this.msPerMinute);
    const totalHours = Math.floor(this.gameTime / this.msPerHour);
    const days = Math.floor(this.gameTime / this.msPerDay);

    // Calculate time within current day
    const timeInDay = this.gameTime % this.msPerDay;
    const hours = Math.floor(timeInDay / this.msPerHour);
    const timeInHour = timeInDay % this.msPerHour;
    const minutes = Math.floor(timeInHour / this.msPerMinute);
    const timeInMinute = timeInHour % this.msPerMinute;
    const seconds = Math.floor(timeInMinute / 1000);

    return {
      gameTime: this.gameTime,
      frameCount: this.frameCount,
      deltaTime: this.deltaTime,
      days,
      hours,
      minutes,
      seconds,
      totalSeconds,
      totalMinutes,
      totalHours,
    };
  }

  /**
   * Gets a formatted time string (HH:MM:SS format)
   * @returns {string} Time in format "HH:MM:SS"
   */
  getFormattedTime() {
    const time = this.getCurrentTime();
    const hours = String(time.hours).padStart(2, '0');
    const minutes = String(time.minutes).padStart(2, '0');
    const seconds = String(time.seconds).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  /**
   * Gets a formatted full date-time string
   * @returns {string} Time in format "Day X HH:MM:SS"
   */
  getFormattedDateTime() {
    const time = this.getCurrentTime();
    return `Day ${time.days + 1} ${this.getFormattedTime()}`;
  }

  /**
   * Resets the clock to initial state
   * @param {number} startTime - Optional starting time (default: 0)
   */
  reset(startTime = 0) {
    this.frameCount = 0;
    this.gameTime = startTime;
    this.deltaTime = 0;
    this.previousTime = 0;
  }

  /**
   * Sets the game time to a specific value
   * @param {number} ms - Time in milliseconds
   */
  setTime(ms) {
    if (typeof ms !== 'number' || ms < 0) {
      throw new TypeError('Time must be a non-negative number');
    }
    this.gameTime = ms;
  }

  /**
   * Advances the clock by a specific amount
   * @param {number} ms - Time to advance in milliseconds
   */
  advance(ms) {
    this.update(ms);
  }

  /**
   * Gets frame count
   * @returns {number} Total frames elapsed
   */
  getFrameCount() {
    return this.frameCount;
  }

  /**
   * Gets total elapsed time in seconds
   * @returns {number} Total seconds
   */
  getElapsedSeconds() {
    return Math.floor(this.gameTime / 1000);
  }

  /**
   * Gets total elapsed time in milliseconds
   * @returns {number} Total milliseconds
   */
  getElapsedMs() {
    return this.gameTime;
  }

  /**
   * Configures time scale for game calendar
   * @param {number} msPerDay - Milliseconds per game day
   * @param {number} msPerHour - Milliseconds per game hour
   * @param {number} msPerMinute - Milliseconds per game minute
   */
  setTimeScale(msPerDay, msPerHour, msPerMinute) {
    if (msPerDay > 0) this.msPerDay = msPerDay;
    if (msPerHour > 0) this.msPerHour = msPerHour;
    if (msPerMinute > 0) this.msPerMinute = msPerMinute;
  }
}

export default GameClock;
