/**
 * SeededRandom - Deterministic pseudo-random number generator
 * Uses the Mulberry32 algorithm for consistent, reproducible randomness
 * @author Game Utils
 */

/**
 * Mulberry32 PRNG algorithm
 * @param {number} seed - The seed value
 * @returns {Function} A function that returns random numbers 0-1
 */
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * SeededRandom class - Deterministic RNG for reproducible gameplay
 * Implements the Mulberry32 algorithm for consistent randomness across
 * different systems and replay scenarios
 */
class SeededRandom {
  /**
   * Creates a new SeededRandom instance
   * @param {number} seed - The seed value for deterministic randomness
   */
  constructor(seed) {
    if (typeof seed !== 'number') {
      throw new TypeError('Seed must be a number');
    }
    this.seed = seed >>> 0; // Convert to unsigned 32-bit integer
    this.generator = mulberry32(this.seed);
  }

  /**
   * Returns the next random number between 0 and 1
   * @returns {number} Random number in range [0, 1)
   */
  next() {
    return this.generator();
  }

  /**
   * Returns a random integer between min and max (inclusive)
   * @param {number} min - Minimum value (inclusive)
   * @param {number} max - Maximum value (inclusive)
   * @returns {number} Random integer in range [min, max]
   */
  nextInt(min, max) {
    if (typeof min !== 'number' || typeof max !== 'number') {
      throw new TypeError('Both min and max must be numbers');
    }
    if (min > max) {
      throw new RangeError('min must be less than or equal to max');
    }
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Returns a random float between min and max
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Random float in range [min, max]
   */
  nextFloat(min, max) {
    if (typeof min !== 'number' || typeof max !== 'number') {
      throw new TypeError('Both min and max must be numbers');
    }
    if (min > max) {
      throw new RangeError('min must be less than or equal to max');
    }
    return this.next() * (max - min) + min;
  }

  /**
   * Gets the current seed value
   * @returns {number} The current seed
   */
  getSeed() {
    return this.seed;
  }

  /**
   * Resets the generator to the original seed
   */
  reset() {
    this.generator = mulberry32(this.seed);
  }
}

export default SeededRandom;
