/**
 * Service - Base class for all services
 *
 * Provides a foundation for all services with lifecycle management.
 * Services must implement onInitialize() and onShutdown() methods.
 *
 * Features:
 * - Service name identification
 * - Initialization and shutdown lifecycle
 * - Initialization state tracking
 * - Error handling during lifecycle
 *
 * @example
 * class MyService extends Service {
 *   constructor() {
 *     super('MyService');
 *   }
 *
 *   async onInitialize() {
 *     // Custom initialization logic
 *     console.log('MyService initializing...');
 *   }
 *
 *   async onShutdown() {
 *     // Custom shutdown logic
 *     console.log('MyService shutting down...');
 *   }
 * }
 */
class Service {
  /**
   * Create a new Service instance
   * @param {string} name - The service name (used for identification)
   */
  constructor(name) {
    if (!name || typeof name !== 'string') {
      throw new Error('Service name must be a non-empty string');
    }

    /**
     * Service name
     * @type {string}
     */
    this.name = name;

    /**
     * Initialization state flag
     * @type {boolean}
     */
    this.initialized = false;
  }

  /**
   * Initialize the service
   * Calls onInitialize() hook for subclasses to implement custom logic
   * @async
   * @throws {Error} If service is already initialized or if onInitialize fails
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) {
      throw new Error(`Service "${this.name}" is already initialized`);
    }

    try {
      // Call the subclass implementation hook
      await this.onInitialize();

      // Mark as initialized
      this.initialized = true;

      console.log(`[Service] "${this.name}" initialized successfully`);
    } catch (error) {
      console.error(`[Service] Error initializing "${this.name}":`, error);
      throw error;
    }
  }

  /**
   * Subclasses should override this method for custom initialization logic
   * @async
   * @throws {Error} If initialization fails
   * @returns {Promise<void>}
   */
  async onInitialize() {
    // To be implemented by subclasses
    // Throw error if not implemented by required services
  }

  /**
   * Shutdown the service
   * Calls onShutdown() hook for subclasses to implement custom logic
   * @async
   * @throws {Error} If onShutdown fails
   * @returns {Promise<void>}
   */
  async shutdown() {
    if (!this.initialized) {
      console.warn(`[Service] "${this.name}" was not initialized, skipping shutdown`);
      return;
    }

    try {
      // Call the subclass implementation hook
      await this.onShutdown();

      // Mark as not initialized
      this.initialized = false;

      console.log(`[Service] "${this.name}" shutdown successfully`);
    } catch (error) {
      console.error(`[Service] Error shutting down "${this.name}":`, error);
      throw error;
    }
  }

  /**
   * Subclasses should override this method for custom shutdown logic
   * @async
   * @throws {Error} If shutdown fails
   * @returns {Promise<void>}
   */
  async onShutdown() {
    // To be implemented by subclasses
  }

  /**
   * Check if the service is initialized
   * @returns {boolean} True if service is initialized
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Get the service name
   * @returns {string} Service name
   */
  getName() {
    return this.name;
  }

  /**
   * Get service status information
   * @returns {Object} Status object with service information
   */
  getStatus() {
    return {
      name: this.name,
      initialized: this.initialized,
      timestamp: Date.now()
    };
  }
}

export { Service };
export default Service;
