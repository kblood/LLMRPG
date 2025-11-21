import fs from 'fs';
import path from 'path';
import { ReplayFile } from './ReplayFile.js';

/**
 * @typedef {Object} Event
 * @property {number} frame - The frame number when the event occurred
 * @property {string} type - Type of event (e.g., 'movement', 'interaction', 'combat')
 * @property {*} data - Event-specific data
 * @property {string} characterId - ID of the character involved
 * @property {number} timestamp - Timestamp when event was logged
 */

/**
 * @typedef {Object} LLMCall
 * @property {number} frame - Frame when LLM was called
 * @property {string} characterId - Character that triggered the LLM call
 * @property {string} prompt - The prompt sent to LLM
 * @property {string} response - The LLM response
 * @property {number} tokensUsed - Number of tokens used
 * @property {number} timestamp - When the call was made
 */

/**
 * Singleton class that records events for replay functionality.
 * Maintains a complete log of game events, LLM calls, and state checkpoints.
 */
class ReplayLogger {
  static instance = null;

  /**
   * Creates a ReplayLogger instance or returns existing singleton
   * @param {number} gameSeed - Seed used for RNG initialization
   * @returns {ReplayLogger}
   */
  constructor(gameSeed) {
    if (ReplayLogger.instance) {
      return ReplayLogger.instance;
    }

    this.gameSeed = gameSeed;
    this.events = [];
    this.llmCalls = [];
    this.checkpoints = [];
    this.isInitialized = false;
    this.initialState = null;
    this.currentFrame = 0;

    ReplayLogger.instance = this;
  }

  /**
   * Initializes the replay logger with the game's initial state
   * @param {*} initialState - The game's starting state
   * @returns {void}
   */
  initialize(initialState) {
    if (this.isInitialized) {
      console.warn('ReplayLogger already initialized');
      return;
    }

    this.initialState = JSON.parse(JSON.stringify(initialState));
    this.isInitialized = true;
    this.currentFrame = 0;
  }

  /**
   * Logs an event to the replay log
   * @param {number} frame - Frame number when event occurred
   * @param {string} type - Type of event
   * @param {*} data - Event data
   * @param {string} characterId - ID of character involved
   * @param {Object} gameState - Optional full game state snapshot for this event
   * @returns {void}
   */
  logEvent(frame, type, data, characterId, gameState = null) {
    if (!this.isInitialized) {
      console.warn('ReplayLogger not initialized, skipping event log');
      return;
    }

    const event = {
      frame,
      type,
      data: JSON.parse(JSON.stringify(data)),
      characterId,
      timestamp: Date.now()
    };

    // Add game state snapshot if provided
    if (gameState) {
      event.gameState = JSON.parse(JSON.stringify(gameState));
    }

    this.events.push(event);
    this.currentFrame = Math.max(this.currentFrame, frame);
  }

  /**
   * Logs an LLM API call and response
   * @param {LLMCall} llmData - LLM call data
   * @returns {void}
   */
  logLLMCall(llmData) {
    if (!this.isInitialized) {
      console.warn('ReplayLogger not initialized, skipping LLM log');
      return;
    }

    const call = {
      ...llmData,
      timestamp: Date.now()
    };

    this.llmCalls.push(call);
  }

  /**
   * Logs a game state checkpoint
   * @param {number} frame - Frame number for checkpoint
   * @param {*} gameState - The game state to checkpoint
   * @returns {void}
   */
  logCheckpoint(frame, gameState) {
    if (!this.isInitialized) {
      console.warn('ReplayLogger not initialized, skipping checkpoint');
      return;
    }

    const checkpoint = {
      frame,
      state: JSON.parse(JSON.stringify(gameState)),
      timestamp: Date.now()
    };

    this.checkpoints.push(checkpoint);
  }

  /**
   * Saves the replay log to a file
   * @param {string} filename - Path to save the replay file
   * @returns {Promise<void>}
   */
  async save(filename) {
    if (!this.isInitialized) {
      throw new Error('ReplayLogger not initialized, cannot save');
    }

    const replayData = {
      header: {
        version: '1.0.0',
        timestamp: Date.now(),
        gameSeed: this.gameSeed,
        frameCount: this.currentFrame,
        eventCount: this.events.length,
        llmCallCount: this.llmCalls.length,
        checkpointCount: this.checkpoints.length
      },
      initialState: this.initialState,
      events: this.events,
      llmCalls: this.llmCalls,
      checkpoints: this.checkpoints
    };

    try {
      await ReplayFile.save(filename, replayData);
      console.log(`Replay saved to ${filename}`);
    } catch (error) {
      console.error(`Failed to save replay to ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Gets the current frame number
   * @returns {number}
   */
  getCurrentFrame() {
    return this.currentFrame;
  }

  /**
   * Gets the count of logged events
   * @returns {number}
   */
  getEventCount() {
    return this.events.length;
  }

  /**
   * Gets the count of logged LLM calls
   * @returns {number}
   */
  getLLMCallCount() {
    return this.llmCalls.length;
  }

  /**
   * Gets the count of checkpoints
   * @returns {number}
   */
  getCheckpointCount() {
    return this.checkpoints.length;
  }

  /**
   * Resets the logger to initial state (mainly for testing)
   * @returns {void}
   */
  reset() {
    this.events = [];
    this.llmCalls = [];
    this.checkpoints = [];
    this.isInitialized = false;
    this.initialState = null;
    this.currentFrame = 0;
  }

  /**
   * Gets the singleton instance
   * @returns {ReplayLogger}
   */
  static getInstance(gameSeed = null) {
    if (!ReplayLogger.instance && gameSeed !== null) {
      return new ReplayLogger(gameSeed);
    }
    return ReplayLogger.instance;
  }
}

export { ReplayLogger };
