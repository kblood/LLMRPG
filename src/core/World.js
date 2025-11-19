/**
 * World class that manages all entities in the game world
 * Provides methods for adding, removing, and querying entities
 */
export class World {
  /**
   * Creates a new World instance
   */
  constructor() {
    /** @type {Map<string, object>} All entities in the world, indexed by ID */
    this.entities = new Map();
  }

  /**
   * Adds an entity to the world
   * @param {object} entity - The entity to add (should be an Entity instance)
   * @returns {object} The added entity for method chaining
   * @throws {Error} If entity is null/undefined or has no ID
   */
  addEntity(entity) {
    if (!entity || !entity.id) {
      throw new Error('Entity must have a valid id property');
    }
    this.entities.set(entity.id, entity);
    return entity;
  }

  /**
   * Removes an entity from the world by ID
   * @param {string} id - The ID of the entity to remove
   * @returns {boolean} True if entity was removed, false if not found
   */
  removeEntity(id) {
    return this.entities.delete(id);
  }

  /**
   * Retrieves an entity from the world by ID
   * @param {string} id - The ID of the entity to retrieve
   * @returns {object|undefined} The entity instance or undefined if not found
   */
  getEntity(id) {
    return this.entities.get(id);
  }

  /**
   * Gets all entities of a specific type
   * @param {string} type - The type of entities to retrieve
   * @returns {Array<object>} Array of entities matching the type
   */
  getEntitiesByType(type) {
    const result = [];
    for (const entity of this.entities.values()) {
      if (entity.type === type) {
        result.push(entity);
      }
    }
    return result;
  }

  /**
   * Gets all entities that have a specific component
   * @param {string} componentName - The name of the component to search for
   * @returns {Array<object>} Array of entities that have the component
   */
  getEntitiesByComponent(componentName) {
    const result = [];
    for (const entity of this.entities.values()) {
      if (entity.hasComponent(componentName)) {
        result.push(entity);
      }
    }
    return result;
  }

  /**
   * Gets all entities in the world
   * @returns {Array<object>} Array of all entities
   */
  getAllEntities() {
    return Array.from(this.entities.values());
  }

  /**
   * Gets the total number of entities in the world
   * @returns {number} Number of entities
   */
  getEntityCount() {
    return this.entities.size;
  }

  /**
   * Checks if an entity exists in the world
   * @param {string} id - The ID of the entity to check
   * @returns {boolean} True if entity exists, false otherwise
   */
  hasEntity(id) {
    return this.entities.has(id);
  }

  /**
   * Clears all entities from the world
   */
  clear() {
    this.entities.clear();
  }

  /**
   * Iterates over all entities and applies a callback function
   * @param {Function} callback - Function to call for each entity (receives entity as parameter)
   */
  forEach(callback) {
    for (const entity of this.entities.values()) {
      callback(entity);
    }
  }
}
