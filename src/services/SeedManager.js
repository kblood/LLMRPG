/**
 * Seed Manager for deterministic LLM calls
 * Generates consistent seeds for replay system
 * 
 * @class SeedManager
 */
export class SeedManager {
  /**
   * Create seed manager
   * @param {number} baseSeed - Base seed for the game session
   */
  constructor(baseSeed = 0) {
    this.baseSeed = baseSeed;
    this.callCounts = new Map(); // Track calls per character/context
  }

  /**
   * Simple hash function for strings
   * @param {string} str - String to hash
   * @returns {number} Hash value
   */
  hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get next seed for a specific context
   * @param {string} characterId - Character making the call
   * @param {string} callType - Type of call ('dialogue', 'goal', 'thought', etc.)
   * @param {number} frame - Current game frame (optional)
   * @returns {number} Deterministic seed
   */
  getNextSeed(characterId, callType, frame = 0) {
    const key = `${characterId}:${callType}`;
    
    // Get current call count for this context
    const callCount = this.callCounts.get(key) || 0;
    this.callCounts.set(key, callCount + 1);

    // Combine base seed, character hash, call type hash, call count, and frame
    const characterHash = this.hash(characterId);
    const typeHash = this.hash(callType);
    
    const seed = this.baseSeed + characterHash + typeHash + callCount * 1000 + frame;
    
    return seed >>> 0; // Convert to unsigned 32-bit integer
  }

  /**
   * Get seed for a specific call ID (for exact replay)
   * @param {string} callId - Unique call identifier
   * @returns {number} Seed
   */
  getSeedForCall(callId) {
    return this.baseSeed + this.hash(callId);
  }

  /**
   * Generate unique call ID
   * @param {string} characterId - Character making the call
   * @param {string} callType - Type of call
   * @param {number} frame - Current game frame
   * @returns {string} Unique call ID
   */
  generateCallId(characterId, callType, frame) {
    const key = `${characterId}:${callType}`;
    const callCount = this.callCounts.get(key) || 0;
    return `${characterId}_${callType}_${frame}_${callCount}`;
  }

  /**
   * Reset call counts (for new game session)
   */
  reset() {
    this.callCounts.clear();
  }

  /**
   * Set new base seed
   * @param {number} seed - New base seed
   */
  setBaseSeed(seed) {
    this.baseSeed = seed;
    this.reset();
  }

  /**
   * Get call count for a context
   * @param {string} characterId - Character ID
   * @param {string} callType - Call type
   * @returns {number} Number of calls made
   */
  getCallCount(characterId, callType) {
    const key = `${characterId}:${callType}`;
    return this.callCounts.get(key) || 0;
  }

  /**
   * Serialize state
   * @returns {Object}
   */
  toJSON() {
    return {
      baseSeed: this.baseSeed,
      callCounts: Object.fromEntries(this.callCounts)
    };
  }

  /**
   * Deserialize state
   * @param {Object} obj
   * @returns {SeedManager}
   */
  static fromJSON(obj) {
    const manager = new SeedManager(obj.baseSeed);
    manager.callCounts = new Map(Object.entries(obj.callCounts || {}));
    return manager;
  }
}

export default SeedManager;
