/**
 * StatePublisher - Pure observer pattern state distribution system
 *
 * A framework-agnostic state publisher that allows UI components and other
 * systems to subscribe to game state updates without driving the game loop.
 * Implements a clean observer pattern where the game doesn't know about its observers.
 *
 * Key Features:
 * - Zero Electron dependencies
 * - Pure observer pattern (game unaware of UI)
 * - Type-safe event system with predefined event types
 * - Subscription management with unique IDs
 * - Broadcast system for custom events
 * - Optional debug mode with performance metrics
 * - Event history for debugging and replay
 * - Partial subscriber support (optional methods)
 *
 * Design Principles:
 * - UI never drives the game loop
 * - Game publishes state after changes
 * - Subscribers receive push updates
 * - No circular dependencies
 * - Framework-agnostic
 *
 * Usage Example:
 *
 * // Subscribe to state updates
 * const subscriber = {
 *   id: 'my-ui',
 *   onStateUpdate: (state, eventType) => {
 *     console.log('State updated:', eventType, state);
 *   },
 *   onGameEvent: (event) => {
 *     console.log('Game event:', event);
 *   }
 * };
 *
 * statePublisher.subscribe(subscriber);
 *
 * // Game publishes state after tick
 * gameService.tick();
 * statePublisher.publish(gameService.getGameState(), 'frame_update');
 *
 * // Broadcast custom events
 * statePublisher.broadcast({
 *   type: 'combat_started',
 *   data: { enemy: 'Dragon' }
 * });
 *
 * @class StatePublisher
 */

/**
 * Valid event types for state updates
 * These represent different game events that trigger state publications
 */
export const EVENT_TYPES = {
  FRAME_UPDATE: 'frame_update',                   // Game advanced 1 frame
  ACTION_EXECUTED: 'action_executed',             // Player/NPC action completed
  DIALOGUE_STARTED: 'dialogue_started',           // Conversation began
  DIALOGUE_LINE: 'dialogue_line',                 // New dialogue line
  DIALOGUE_ENDED: 'dialogue_ended',               // Conversation ended
  COMBAT_STARTED: 'combat_started',               // Combat encounter
  COMBAT_ENDED: 'combat_ended',                   // Combat resolution
  QUEST_CREATED: 'quest_created',                 // New quest generated
  QUEST_UPDATED: 'quest_updated',                 // Quest progress changed
  QUEST_COMPLETED: 'quest_completed',             // Quest finished
  LOCATION_DISCOVERED: 'location_discovered',     // New area found
  LOCATION_CHANGED: 'location_changed',           // Player moved
  CHARACTER_DIED: 'character_died',               // Character death
  PAUSE_TOGGLED: 'pause_toggled',                 // Game paused/resumed
  GAME_STARTED: 'game_started',                   // Game session started
  GAME_ENDED: 'game_ended',                       // Game session ended
  ERROR: 'error'                                  // Error occurred
};

/**
 * Subscriber interface (all methods optional)
 * @typedef {Object} Subscriber
 * @property {string} id - Unique subscriber identifier
 * @property {Function} [onStateUpdate] - Called with (state, eventType)
 * @property {Function} [onGameEvent] - Called with (event)
 */

class StatePublisher {
  static instance = null;

  constructor() {
    if (StatePublisher.instance) {
      return StatePublisher.instance;
    }

    // Subscriber management
    this.subscribers = new Map(); // id -> subscriber
    this.subscriberCount = 0;

    // Event tracking
    this.eventHistory = [];
    this.maxHistorySize = 1000;
    this.eventCounter = 0;

    // Performance metrics
    this.metrics = {
      publishCount: 0,
      broadcastCount: 0,
      subscribeCount: 0,
      unsubscribeCount: 0,
      totalEventsSent: 0,
      lastPublishTime: 0,
      publishTimes: [], // Track last 100 publish times for average
      maxPublishTimes: 100
    };

    // Debug configuration
    this.debug = false;
    this.debugOptions = {
      logStateUpdates: false,
      logEvents: false,
      logPerformance: false,
      logSubscribers: false
    };

    StatePublisher.instance = this;
  }

  /**
   * Get singleton instance
   * @returns {StatePublisher}
   */
  static getInstance() {
    if (!StatePublisher.instance) {
      StatePublisher.instance = new StatePublisher();
    }
    return StatePublisher.instance;
  }

  /**
   * Subscribe to state updates
   *
   * @param {Subscriber} subscriber - Subscriber object with optional onStateUpdate and onGameEvent methods
   * @returns {string} Subscriber ID for unsubscribing
   *
   * @example
   * const id = statePublisher.subscribe({
   *   id: 'my-component',
   *   onStateUpdate: (state, eventType) => updateUI(state),
   *   onGameEvent: (event) => handleEvent(event)
   * });
   */
  subscribe(subscriber) {
    if (!subscriber || typeof subscriber !== 'object') {
      throw new Error('Subscriber must be an object');
    }

    // Auto-generate ID if not provided
    if (!subscriber.id) {
      subscriber.id = `subscriber_${++this.subscriberCount}`;
    }

    // Validate at least one method exists
    if (!subscriber.onStateUpdate && !subscriber.onGameEvent) {
      console.warn(
        `[StatePublisher] Subscriber ${subscriber.id} has no handler methods. ` +
        'Consider adding onStateUpdate or onGameEvent.'
      );
    }

    // Check if already subscribed
    if (this.subscribers.has(subscriber.id)) {
      console.warn(`[StatePublisher] Subscriber ${subscriber.id} already exists. Replacing.`);
    }

    this.subscribers.set(subscriber.id, subscriber);
    this.metrics.subscribeCount++;

    if (this.debug && this.debugOptions.logSubscribers) {
      console.log(`[StatePublisher] Subscriber added: ${subscriber.id} (${this.subscribers.size} total)`);
    }

    return subscriber.id;
  }

  /**
   * Unsubscribe from state updates
   *
   * @param {string} subscriberId - Subscriber ID to remove
   * @returns {boolean} True if subscriber was removed
   *
   * @example
   * statePublisher.unsubscribe('my-component');
   */
  unsubscribe(subscriberId) {
    if (!subscriberId) {
      throw new Error('subscriberId is required');
    }

    const existed = this.subscribers.delete(subscriberId);

    if (existed) {
      this.metrics.unsubscribeCount++;

      if (this.debug && this.debugOptions.logSubscribers) {
        console.log(`[StatePublisher] Subscriber removed: ${subscriberId} (${this.subscribers.size} remaining)`);
      }
    } else {
      console.warn(`[StatePublisher] Attempted to unsubscribe non-existent subscriber: ${subscriberId}`);
    }

    return existed;
  }

  /**
   * Publish game state to all subscribers
   *
   * @param {Object} gameState - Complete game state snapshot
   * @param {string} eventType - Type of event that triggered this update (see EVENT_TYPES)
   * @param {Object} [metadata] - Optional additional metadata
   *
   * @example
   * const state = gameService.getGameState();
   * statePublisher.publish(state, EVENT_TYPES.FRAME_UPDATE);
   */
  publish(gameState, eventType, metadata = {}) {
    const startTime = performance.now();

    if (!gameState) {
      console.error('[StatePublisher] Cannot publish null/undefined state');
      return;
    }

    if (!eventType) {
      console.warn('[StatePublisher] Publishing without event type');
      eventType = 'unknown';
    }

    // Create event record
    const event = {
      id: this.eventCounter++,
      type: 'state_update',
      eventType,
      timestamp: Date.now(),
      frame: gameState.frame || 0,
      metadata
    };

    // Track in history
    this._addToHistory(event);

    // Notify all subscribers
    let notifiedCount = 0;
    for (const [id, subscriber] of this.subscribers) {
      if (subscriber.onStateUpdate && typeof subscriber.onStateUpdate === 'function') {
        try {
          subscriber.onStateUpdate(gameState, eventType, metadata);
          notifiedCount++;
        } catch (error) {
          console.error(`[StatePublisher] Error in subscriber ${id}.onStateUpdate:`, error);
        }
      }
    }

    // Update metrics
    this.metrics.publishCount++;
    this.metrics.totalEventsSent += notifiedCount;
    const publishTime = performance.now() - startTime;
    this._trackPublishTime(publishTime);

    // Debug logging
    if (this.debug) {
      if (this.debugOptions.logStateUpdates) {
        console.log(
          `[StatePublisher] Published ${eventType} to ${notifiedCount} subscribers ` +
          `(frame: ${gameState.frame || 0})`
        );
      }
      if (this.debugOptions.logPerformance) {
        console.log(`[StatePublisher] Publish took ${publishTime.toFixed(2)}ms`);
      }
    }
  }

  /**
   * Broadcast a custom event to all subscribers
   * Unlike publish(), this sends an event without full game state
   *
   * @param {Object} event - Event object with at least a 'type' property
   *
   * @example
   * statePublisher.broadcast({
   *   type: 'combat_started',
   *   enemy: 'Dragon',
   *   location: 'Dark Cave'
   * });
   */
  broadcast(event) {
    if (!event || typeof event !== 'object') {
      throw new Error('Event must be an object');
    }

    if (!event.type) {
      throw new Error('Event must have a type property');
    }

    // Enrich event
    const enrichedEvent = {
      ...event,
      id: this.eventCounter++,
      timestamp: Date.now()
    };

    // Track in history
    this._addToHistory({
      ...enrichedEvent,
      type: 'broadcast'
    });

    // Notify all subscribers
    let notifiedCount = 0;
    for (const [id, subscriber] of this.subscribers) {
      if (subscriber.onGameEvent && typeof subscriber.onGameEvent === 'function') {
        try {
          subscriber.onGameEvent(enrichedEvent);
          notifiedCount++;
        } catch (error) {
          console.error(`[StatePublisher] Error in subscriber ${id}.onGameEvent:`, error);
        }
      }
    }

    // Update metrics
    this.metrics.broadcastCount++;
    this.metrics.totalEventsSent += notifiedCount;

    // Debug logging
    if (this.debug && this.debugOptions.logEvents) {
      console.log(
        `[StatePublisher] Broadcast ${enrichedEvent.type} to ${notifiedCount} subscribers`
      );
    }
  }

  /**
   * Get all current subscribers
   * Returns a copy to prevent external modification
   *
   * @returns {Array<Object>} Array of subscriber info objects
   */
  getSubscribers() {
    return Array.from(this.subscribers.entries()).map(([id, subscriber]) => ({
      id,
      hasStateHandler: typeof subscriber.onStateUpdate === 'function',
      hasEventHandler: typeof subscriber.onGameEvent === 'function'
    }));
  }

  /**
   * Get a specific subscriber by ID
   *
   * @param {string} subscriberId - Subscriber ID
   * @returns {Subscriber|null} Subscriber object or null
   */
  getSubscriber(subscriberId) {
    return this.subscribers.get(subscriberId) || null;
  }

  /**
   * Check if a subscriber exists
   *
   * @param {string} subscriberId - Subscriber ID
   * @returns {boolean}
   */
  hasSubscriber(subscriberId) {
    return this.subscribers.has(subscriberId);
  }

  /**
   * Get event history
   *
   * @param {number} [count] - Number of recent events to return (optional)
   * @returns {Array<Object>} Event history
   */
  getEventHistory(count = null) {
    if (count === null) {
      return [...this.eventHistory];
    }

    const start = Math.max(0, this.eventHistory.length - count);
    return this.eventHistory.slice(start);
  }

  /**
   * Get performance metrics
   *
   * @returns {Object} Metrics object with performance data
   */
  getMetrics() {
    const avgPublishTime = this._calculateAveragePublishTime();

    return {
      ...this.metrics,
      subscriberCount: this.subscribers.size,
      eventHistorySize: this.eventHistory.length,
      averagePublishTimeMs: avgPublishTime,
      eventsPerPublish: this.metrics.publishCount > 0
        ? (this.metrics.totalEventsSent / this.metrics.publishCount).toFixed(2)
        : 0
    };
  }

  /**
   * Enable debug mode
   *
   * @param {Object} [options] - Debug options
   * @param {boolean} [options.logStateUpdates=true] - Log state publications
   * @param {boolean} [options.logEvents=true] - Log broadcast events
   * @param {boolean} [options.logPerformance=true] - Log performance metrics
   * @param {boolean} [options.logSubscribers=true] - Log subscriber changes
   */
  enableDebug(options = {}) {
    this.debug = true;
    this.debugOptions = {
      logStateUpdates: options.logStateUpdates !== false,
      logEvents: options.logEvents !== false,
      logPerformance: options.logPerformance !== false,
      logSubscribers: options.logSubscribers !== false
    };

    console.log('[StatePublisher] Debug mode enabled', this.debugOptions);
  }

  /**
   * Disable debug mode
   */
  disableDebug() {
    this.debug = false;
    console.log('[StatePublisher] Debug mode disabled');
  }

  /**
   * Clear all state (for testing)
   */
  clear() {
    this.subscribers.clear();
    this.eventHistory = [];
    this.eventCounter = 0;
    this.subscriberCount = 0;

    // Reset metrics
    this.metrics = {
      publishCount: 0,
      broadcastCount: 0,
      subscribeCount: 0,
      unsubscribeCount: 0,
      totalEventsSent: 0,
      lastPublishTime: 0,
      publishTimes: [],
      maxPublishTimes: 100
    };

    if (this.debug && this.debugOptions.logSubscribers) {
      console.log('[StatePublisher] Cleared all subscribers and history');
    }
  }

  /**
   * Get statistics summary
   *
   * @returns {Object} Summary statistics
   */
  getStats() {
    return {
      subscribers: this.subscribers.size,
      events: {
        total: this.eventCounter,
        published: this.metrics.publishCount,
        broadcast: this.metrics.broadcastCount,
        history: this.eventHistory.length
      },
      performance: {
        avgPublishTimeMs: this._calculateAveragePublishTime(),
        totalEventsSent: this.metrics.totalEventsSent
      },
      debug: this.debug
    };
  }

  // Private methods

  /**
   * Add event to history
   * @private
   */
  _addToHistory(event) {
    this.eventHistory.push(event);

    // Trim history if too large
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * Track publish time for metrics
   * @private
   */
  _trackPublishTime(time) {
    this.metrics.lastPublishTime = time;
    this.metrics.publishTimes.push(time);

    // Keep only last N times
    if (this.metrics.publishTimes.length > this.metrics.maxPublishTimes) {
      this.metrics.publishTimes.shift();
    }
  }

  /**
   * Calculate average publish time
   * @private
   */
  _calculateAveragePublishTime() {
    if (this.metrics.publishTimes.length === 0) {
      return 0;
    }

    const sum = this.metrics.publishTimes.reduce((acc, time) => acc + time, 0);
    return (sum / this.metrics.publishTimes.length).toFixed(3);
  }
}

// Export singleton instance
export const statePublisher = StatePublisher.getInstance();

// Export class for testing
export { StatePublisher };

export default statePublisher;
