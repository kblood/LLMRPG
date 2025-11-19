/**
 * @typedef {Object} GameStateCheckpoint
 * @property {number} frame - Frame number when checkpoint was created
 * @property {*} state - Serialized game state
 * @property {number} timestamp - When checkpoint was created
 * @property {number} sizeBytes - Size of serialized state in bytes
 */

/**
 * Manages periodic game state checkpoints for replay purposes.
 * Determines when checkpoints should be created and handles state serialization.
 */
class CheckpointManager {
  /**
   * Creates a checkpoint manager
   * @param {number} interval - Create checkpoint every N frames (default: 100)
   */
  constructor(interval = 100) {
    if (interval < 1) {
      throw new Error('Checkpoint interval must be at least 1');
    }

    this.interval = interval;
    this.lastCheckpointFrame = -1;
    this.checkpoints = [];
    this.maxCheckpoints = 1000; // Prevent memory bloat
  }

  /**
   * Determines if a checkpoint should be created at this frame
   * @param {number} currentFrame - Current frame number
   * @returns {boolean} - True if checkpoint should be created
   */
  shouldCheckpoint(currentFrame) {
    if (currentFrame < 0) {
      return false;
    }

    // Always checkpoint at frame 0
    if (currentFrame === 0 && this.lastCheckpointFrame === -1) {
      return true;
    }

    // Check if we've reached the next interval
    const framesSinceLastCheckpoint = currentFrame - this.lastCheckpointFrame;
    return framesSinceLastCheckpoint >= this.interval;
  }

  /**
   * Creates and stores a checkpoint
   * @param {number} frame - Frame number
   * @param {*} gameState - The game state to checkpoint
   * @returns {GameStateCheckpoint} - The created checkpoint
   */
  createCheckpoint(frame, gameState) {
    const serialized = this.captureGameState(gameState);

    const checkpoint = {
      frame,
      state: serialized.state,
      timestamp: Date.now(),
      sizeBytes: serialized.sizeBytes
    };

    this.checkpoints.push(checkpoint);
    this.lastCheckpointFrame = frame;

    // Trim old checkpoints if we exceed max
    if (this.checkpoints.length > this.maxCheckpoints) {
      this.checkpoints.shift();
    }

    return checkpoint;
  }

  /**
   * Serializes game state for storage
   * Creates a deep copy to avoid reference issues
   * @param {*} gameState - The game state object
   * @returns {{state: *, sizeBytes: number}} - Serialized state and size
   */
  captureGameState(gameState) {
    // Deep clone to avoid reference issues
    const state = JSON.parse(JSON.stringify(gameState));

    // Calculate approximate size
    const jsonString = JSON.stringify(state);
    const sizeBytes = Buffer.byteLength(jsonString, 'utf-8');

    return {
      state,
      sizeBytes
    };
  }

  /**
   * Gets the last checkpoint that was created
   * @returns {GameStateCheckpoint|null} - Last checkpoint or null
   */
  getLastCheckpoint() {
    return this.checkpoints.length > 0 ? this.checkpoints[this.checkpoints.length - 1] : null;
  }

  /**
   * Gets a checkpoint at a specific frame (returns closest checkpoint at or before frame)
   * @param {number} frame - Target frame
   * @returns {GameStateCheckpoint|null} - Closest checkpoint or null
   */
  getCheckpointAt(frame) {
    let closest = null;

    for (const checkpoint of this.checkpoints) {
      if (checkpoint.frame <= frame) {
        closest = checkpoint;
      } else {
        break;
      }
    }

    return closest;
  }

  /**
   * Gets all stored checkpoints
   * @returns {Array<GameStateCheckpoint>}
   */
  getAllCheckpoints() {
    return [...this.checkpoints];
  }

  /**
   * Gets the number of stored checkpoints
   * @returns {number}
   */
  getCheckpointCount() {
    return this.checkpoints.length;
  }

  /**
   * Gets the total size of all checkpoints in bytes
   * @returns {number}
   */
  getTotalSize() {
    return this.checkpoints.reduce((sum, cp) => sum + cp.sizeBytes, 0);
  }

  /**
   * Clears all stored checkpoints
   * @returns {void}
   */
  clear() {
    this.checkpoints = [];
    this.lastCheckpointFrame = -1;
  }

  /**
   * Sets the checkpoint interval
   * @param {number} interval - New interval in frames
   * @returns {void}
   */
  setInterval(interval) {
    if (interval < 1) {
      throw new Error('Checkpoint interval must be at least 1');
    }
    this.interval = interval;
  }

  /**
   * Gets the current checkpoint interval
   * @returns {number}
   */
  getInterval() {
    return this.interval;
  }

  /**
   * Gets the frame of the last checkpoint
   * @returns {number} - Frame number or -1 if no checkpoint exists
   */
  getLastCheckpointFrame() {
    return this.lastCheckpointFrame;
  }

  /**
   * Prunes checkpoints to keep memory usage reasonable
   * Keeps every Nth checkpoint based on total size
   * @param {number} maxTotalSize - Maximum total size in bytes (default: 50MB)
   * @returns {number} - Number of checkpoints removed
   */
  pruneCheckpoints(maxTotalSize = 50 * 1024 * 1024) {
    if (this.getTotalSize() <= maxTotalSize) {
      return 0;
    }

    const removed = [];
    let currentSize = 0;

    // Keep checkpoints, working backwards from most recent
    for (let i = this.checkpoints.length - 1; i >= 0; i--) {
      const checkpoint = this.checkpoints[i];
      currentSize += checkpoint.sizeBytes;

      if (currentSize > maxTotalSize && i > 0) {
        removed.push(this.checkpoints[i]);
        this.checkpoints.splice(i, 1);
      }
    }

    return removed.length;
  }
}

export { CheckpointManager };
