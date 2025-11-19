/**
 * ServiceManager - Manages all services in the application
 *
 * Provides centralized service registration, initialization, and lifecycle management.
 * Uses the singleton pattern for global access.
 *
 * Features:
 * - Service registration and retrieval
 * - Batch initialization and shutdown
 * - Service dependency management
 * - Singleton pattern for global access
 * - Error handling and recovery
 *
 * @example
 * // Get the singleton instance
 * const serviceManager = ServiceManager.getInstance();
 *
 * // Register a service
 * serviceManager.register(configService);
 * serviceManager.register(eventBusService);
 *
 * // Initialize all services
 * await serviceManager.initializeAll();
 *
 * // Get a service
 * const config = serviceManager.get('ConfigService');
 *
 * // Shutdown all services
 * await serviceManager.shutdownAll();
 */

class ServiceManagerImpl {
  constructor() {
    /**
     * Map of service name -> service instance
     * @type {Map<string, Service>}
     */
    this.services = new Map();

    /**
     * Set to track services being initialized
     * @type {Set<string>}
     */
    this.initializingServices = new Set();

    /**
     * Set to track services being shut down
     * @type {Set<string>}
     */
    this.shuttingDownServices = new Set();
  }

  /**
   * Register a service in the manager
   * @param {Service} service - The service instance to register
   * @throws {Error} If service name already exists
   * @returns {ServiceManager} Returns this for method chaining
   */
  register(service) {
    if (!service || !service.name) {
      throw new Error('Invalid service: must have a name property');
    }

    if (this.services.has(service.name)) {
      throw new Error(
        `Service "${service.name}" is already registered. Use update() to replace it.`
      );
    }

    this.services.set(service.name, service);
    console.log(`[ServiceManager] Service "${service.name}" registered`);

    return this; // Allow chaining
  }

  /**
   * Update or replace an existing service
   * @param {Service} service - The service instance to update
   * @returns {ServiceManager} Returns this for method chaining
   */
  update(service) {
    if (!service || !service.name) {
      throw new Error('Invalid service: must have a name property');
    }

    if (!this.services.has(service.name)) {
      throw new Error(`Service "${service.name}" is not registered`);
    }

    this.services.set(service.name, service);
    console.log(`[ServiceManager] Service "${service.name}" updated`);

    return this;
  }

  /**
   * Get a registered service by name
   * @param {string} name - The service name
   * @throws {Error} If service is not found
   * @returns {Service} The service instance
   */
  get(name) {
    if (!this.services.has(name)) {
      throw new Error(`Service "${name}" is not registered`);
    }

    return this.services.get(name);
  }

  /**
   * Get a registered service by name (returns null if not found)
   * @param {string} name - The service name
   * @returns {Service|null} The service instance or null
   */
  getOrNull(name) {
    return this.services.get(name) || null;
  }

  /**
   * Check if a service is registered
   * @param {string} name - The service name
   * @returns {boolean} True if service is registered
   */
  has(name) {
    return this.services.has(name);
  }

  /**
   * Unregister a service
   * @param {string} name - The service name
   * @throws {Error} If service is not found or is currently running
   * @returns {Service} The unregistered service
   */
  unregister(name) {
    if (!this.services.has(name)) {
      throw new Error(`Service "${name}" is not registered`);
    }

    if (this.initializingServices.has(name) || this.shuttingDownServices.has(name)) {
      throw new Error(`Cannot unregister service "${name}" while it is running`);
    }

    const service = this.services.get(name);
    this.services.delete(name);
    console.log(`[ServiceManager] Service "${name}" unregistered`);

    return service;
  }

  /**
   * Initialize all registered services in order
   * @async
   * @throws {Error} If any service fails to initialize
   * @returns {Promise<void>}
   */
  async initializeAll() {
    const serviceNames = Array.from(this.services.keys());

    if (serviceNames.length === 0) {
      console.warn('[ServiceManager] No services registered to initialize');
      return;
    }

    console.log(
      `[ServiceManager] Initializing ${serviceNames.length} service(s): ${serviceNames.join(', ')}`
    );

    const failedServices = [];

    for (const name of serviceNames) {
      const service = this.services.get(name);

      if (service.initialized) {
        console.warn(`[ServiceManager] Service "${name}" is already initialized, skipping`);
        continue;
      }

      try {
        this.initializingServices.add(name);
        await service.initialize();
        this.initializingServices.delete(name);
      } catch (error) {
        this.initializingServices.delete(name);
        console.error(`[ServiceManager] Failed to initialize "${name}":`, error.message);
        failedServices.push({ name, error });
      }
    }

    if (failedServices.length > 0) {
      const failedNames = failedServices.map((f) => f.name).join(', ');
      throw new Error(
        `[ServiceManager] Failed to initialize services: ${failedNames}. Check logs for details.`
      );
    }

    console.log('[ServiceManager] All services initialized successfully');
  }

  /**
   * Shutdown all registered services in reverse order
   * Attempts to shutdown all services even if some fail
   * @async
   * @returns {Promise<void>}
   */
  async shutdownAll() {
    const serviceNames = Array.from(this.services.keys()).reverse();

    if (serviceNames.length === 0) {
      console.warn('[ServiceManager] No services registered to shutdown');
      return;
    }

    console.log(
      `[ServiceManager] Shutting down ${serviceNames.length} service(s) in reverse order`
    );

    const failedServices = [];

    for (const name of serviceNames) {
      const service = this.services.get(name);

      if (!service.initialized) {
        console.warn(`[ServiceManager] Service "${name}" is not initialized, skipping`);
        continue;
      }

      try {
        this.shuttingDownServices.add(name);
        await service.shutdown();
        this.shuttingDownServices.delete(name);
      } catch (error) {
        this.shuttingDownServices.delete(name);
        console.error(`[ServiceManager] Failed to shutdown "${name}":`, error.message);
        failedServices.push({ name, error });
      }
    }

    if (failedServices.length > 0) {
      const failedNames = failedServices.map((f) => f.name).join(', ');
      console.warn(`[ServiceManager] Some services failed to shutdown: ${failedNames}`);
    } else {
      console.log('[ServiceManager] All services shutdown successfully');
    }
  }

  /**
   * Get all registered service names
   * @returns {Array<string>} Array of service names
   */
  getServiceNames() {
    return Array.from(this.services.keys());
  }

  /**
   * Get all registered services
   * @returns {Array<Service>} Array of service instances
   */
  getAllServices() {
    return Array.from(this.services.values());
  }

  /**
   * Get status of all services
   * @returns {Object} Object with service statuses
   */
  getStatus() {
    const status = {};

    for (const [name, service] of this.services.entries()) {
      status[name] = service.getStatus();
    }

    return {
      totalServices: this.services.size,
      initializedCount: Array.from(this.services.values()).filter((s) => s.initialized)
        .length,
      services: status,
      timestamp: Date.now()
    };
  }

  /**
   * Clear all services (for testing)
   * Warns if any services are still initialized
   * @returns {void}
   */
  clear() {
    const initializedServices = Array.from(this.services.values()).filter(
      (s) => s.initialized
    );

    if (initializedServices.length > 0) {
      console.warn(
        '[ServiceManager] Clearing services with some still initialized. Call shutdownAll() first!'
      );
    }

    this.services.clear();
    this.initializingServices.clear();
    this.shuttingDownServices.clear();
    console.log('[ServiceManager] All services cleared');
  }
}

/**
 * Singleton instance
 * @type {ServiceManagerImpl|null}
 */
let instance = null;

/**
 * Get the ServiceManager singleton instance
 * @returns {ServiceManagerImpl} The ServiceManager instance
 */
function getInstance() {
  if (!instance) {
    instance = new ServiceManagerImpl();
  }
  return instance;
}

/**
 * Export singleton with direct method access for convenience
 */
export const ServiceManager = {
  getInstance,
  register: (service) => getInstance().register(service),
  update: (service) => getInstance().update(service),
  get: (name) => getInstance().get(name),
  getOrNull: (name) => getInstance().getOrNull(name),
  has: (name) => getInstance().has(name),
  unregister: (name) => getInstance().unregister(name),
  initializeAll: () => getInstance().initializeAll(),
  shutdownAll: () => getInstance().shutdownAll(),
  getServiceNames: () => getInstance().getServiceNames(),
  getAllServices: () => getInstance().getAllServices(),
  getStatus: () => getInstance().getStatus(),
  clear: () => getInstance().clear()
};

/**
 * Export the class for testing/advanced usage
 */
export { ServiceManagerImpl };

export default ServiceManager;
