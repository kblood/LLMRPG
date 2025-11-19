/**
 * EventBus - A singleton event dispatcher system
 *
 * Features:
 * - Deterministic event processing (events processed in emission order)
 * - Event queue for ordered delivery
 * - Wildcard pattern matching (e.g., "character:*")
 * - Multiple listener support per event
 * - One-time listeners with 'once'
 * - Full event history tracking for replay
 * - Clear method for testing
 *
 * @example
 * // Listen for events
 * EventBus.on('character:moved', (data) => {
 *   console.log('Character moved:', data);
 * });
 *
 * // Listen to wildcards
 * EventBus.on('character:*', (data) => {
 *   console.log('Any character event:', data);
 * });
 *
 * // One-time listener
 * EventBus.once('game:started', () => {
 *   console.log('Game started!');
 * });
 *
 * // Emit events
 * EventBus.emit('character:moved', { characterId: 1, x: 100, y: 200 });
 *
 * // Remove listeners
 * EventBus.off('character:moved', myCallback);
 *
 * // Get event history (for replay/logging)
 * const history = EventBus.getHistory();
 * const lastNEvents = EventBus.getHistory(10); // Last 10 events
 *
 * // Clear (for testing)
 * EventBus.clear();
 */

class EventBusImpl {
  constructor() {
    this.listeners = new Map(); // eventName -> Set of callbacks
    this.eventQueue = []; // Queue for ordered processing
    this.isProcessing = false;
    this.eventHistory = []; // Track all events for replay
    this.maxHistorySize = 10000; // Prevent unbounded memory growth
    this.eventCounter = 0; // Unique ID for each event
  }

  /**
   * Register a listener for an event
   * @param {string} eventName - Event name (supports wildcards: "category:*")
   * @param {Function} callback - Function to call when event fires
   * @returns {Function} Unsubscribe function
   */
  on(eventName, callback) {
    if (typeof eventName !== 'string') {
      throw new Error('Event name must be a string');
    }
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    this.listeners.get(eventName).add(callback);

    // Return unsubscribe function
    return () => this.off(eventName, callback);
  }

  /**
   * Register a one-time listener that fires only once
   * @param {string} eventName - Event name
   * @param {Function} callback - Function to call
   * @returns {Function} Unsubscribe function
   */
  once(eventName, callback) {
    if (typeof eventName !== 'string') {
      throw new Error('Event name must be a string');
    }
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    const wrappedCallback = (data) => {
      callback(data);
      this.off(eventName, wrappedCallback);
    };

    return this.on(eventName, wrappedCallback);
  }

  /**
   * Remove a listener for an event
   * @param {string} eventName - Event name
   * @param {Function} callback - The callback to remove
   * @returns {boolean} True if callback was removed, false if not found
   */
  off(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      return false;
    }

    const callbacks = this.listeners.get(eventName);
    const hadCallback = callbacks.has(callback);

    if (hadCallback) {
      callbacks.delete(callback);

      // Clean up empty listener sets
      if (callbacks.size === 0) {
        this.listeners.delete(eventName);
      }
    }

    return hadCallback;
  }

  /**
   * Emit an event (queues it for processing)
   * @param {string} eventName - Event name
   * @param {any} data - Data to pass to listeners
   */
  emit(eventName, data) {
    if (typeof eventName !== 'string') {
      throw new Error('Event name must be a string');
    }

    // Add to queue for ordered processing
    const event = {
      id: this.eventCounter++,
      name: eventName,
      data: data,
      timestamp: Date.now()
    };

    this.eventQueue.push(event);

    // Add to history
    this.trackEvent(event);

    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Process all queued events in order
   * This ensures deterministic event handling
   */
  processQueue() {
    if (this.isProcessing) {
      return; // Already processing, avoid re-entrancy
    }

    this.isProcessing = true;

    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift();
        this.dispatchEvent(event);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Dispatch a single event to all matching listeners
   * @private
   */
  dispatchEvent(event) {
    const { name, data } = event;

    // Get exact listeners
    const exactListeners = this.listeners.get(name) || new Set();

    // Get wildcard listeners
    const wildcardListeners = this.getWildcardListeners(name);

    // Call all listeners
    const allListeners = new Set([...exactListeners, ...wildcardListeners]);

    for (const callback of allListeners) {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for "${name}":`, error);
      }
    }
  }

  /**
   * Get all wildcard listeners that match an event name
   * @private
   * @example
   * "character:moved" matches "character:*" and "*"
   */
  getWildcardListeners(eventName) {
    const wildcardListeners = new Set();

    for (const [pattern, callbacks] of this.listeners.entries()) {
      if (this.matchesWildcard(eventName, pattern)) {
        for (const callback of callbacks) {
          wildcardListeners.add(callback);
        }
      }
    }

    return wildcardListeners;
  }

  /**
   * Check if an event name matches a wildcard pattern
   * @private
   * @example
   * matchesWildcard("character:moved", "character:*") // true
   * matchesWildcard("character:moved", "character:*:sub") // false
   * matchesWildcard("anything", "*") // true
   */
  matchesWildcard(eventName, pattern) {
    if (pattern === '*') {
      return true; // Matches all events
    }

    if (!pattern.includes('*')) {
      return false; // Not a wildcard pattern
    }

    // Simple prefix wildcard: "character:*" matches "character:anything"
    const prefix = pattern.replace('*', '');
    return eventName.startsWith(prefix);
  }

  /**
   * Track event in history
   * @private
   */
  trackEvent(event) {
    this.eventHistory.push({
      ...event,
      index: this.eventHistory.length
    });

    // Prevent unbounded growth
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * Get event history (for replay/logging)
   * @param {number} count - Number of recent events to return (optional)
   * @returns {Array} Array of event objects
   * @example
   * const allEvents = EventBus.getHistory();
   * const lastTen = EventBus.getHistory(10);
   */
  getHistory(count = null) {
    if (count === null) {
      return [...this.eventHistory]; // Return copy of all events
    }

    const start = Math.max(0, this.eventHistory.length - count);
    return this.eventHistory.slice(start);
  }

  /**
   * Get event history as a string for logging
   * @returns {string} Formatted event history
   */
  getHistoryLog(count = 100) {
    const events = this.getHistory(count);
    return events
      .map((e) => `[${e.id}] ${e.name} - ${JSON.stringify(e.data)}`)
      .join('\n');
  }

  /**
   * Get current listener count for debugging
   * @param {string} eventName - Event name (optional, returns all if not provided)
   * @returns {number|Object} Listener count
   */
  getListenerCount(eventName = null) {
    if (eventName) {
      const listeners = this.listeners.get(eventName);
      return listeners ? listeners.size : 0;
    }

    // Return all listener counts
    const counts = {};
    for (const [name, callbacks] of this.listeners.entries()) {
      counts[name] = callbacks.size;
    }
    return counts;
  }

  /**
   * Get all registered event names
   * @returns {Array} Array of event names with listeners
   */
  getEventNames() {
    return Array.from(this.listeners.keys());
  }

  /**
   * Clear all listeners and history (for testing)
   */
  clear() {
    this.listeners.clear();
    this.eventQueue = [];
    this.eventHistory = [];
    this.eventCounter = 0;
    this.isProcessing = false;
  }

  /**
   * Get statistics about the event bus
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      listenerCount: Array.from(this.listeners.values()).reduce(
        (sum, set) => sum + set.size,
        0
      ),
      eventNamesCount: this.listeners.size,
      historySize: this.eventHistory.length,
      maxHistorySize: this.maxHistorySize,
      eventCounter: this.eventCounter,
      queueSize: this.eventQueue.length,
      isProcessing: this.isProcessing
    };
  }

  /**
   * Verify event bus integrity (for testing)
   * @returns {Object} Verification result with any issues found
   */
  verify() {
    const issues = [];

    if (this.eventQueue.length > 0) {
      issues.push(`Event queue not empty: ${this.eventQueue.length} events pending`);
    }

    if (this.isProcessing) {
      issues.push('Event bus is currently processing');
    }

    return {
      isHealthy: issues.length === 0,
      issues
    };
  }
}

// Singleton instance
let instance = null;

/**
 * Get the EventBus singleton instance
 * @returns {EventBusImpl} The EventBus instance
 */
function getInstance() {
  if (!instance) {
    instance = new EventBusImpl();
  }
  return instance;
}

// Export singleton with all methods
export const EventBus = {
  getInstance,
  on: (eventName, callback) => getInstance().on(eventName, callback),
  once: (eventName, callback) => getInstance().once(eventName, callback),
  off: (eventName, callback) => getInstance().off(eventName, callback),
  emit: (eventName, data) => getInstance().emit(eventName, data),
  getHistory: (count) => getInstance().getHistory(count),
  getHistoryLog: (count) => getInstance().getHistoryLog(count),
  getListenerCount: (eventName) => getInstance().getListenerCount(eventName),
  getEventNames: () => getInstance().getEventNames(),
  getStats: () => getInstance().getStats(),
  verify: () => getInstance().verify(),
  clear: () => getInstance().clear()
};

// Also export the class for testing/advanced usage
export { EventBusImpl };

export default EventBus;
