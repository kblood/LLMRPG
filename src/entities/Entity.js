/**
 * Base Entity class representing an object in the game world
 * Entities are containers for components that define their behavior and properties
 */
export class Entity {
  /**
   * Creates a new Entity instance
   * @param {string} id - Unique identifier for the entity
   * @param {string} type - Type of entity (e.g., 'player', 'npc', 'enemy')
   */
  constructor(id, type) {
    /** @type {string} */
    this.id = id;

    /** @type {string} */
    this.type = type;

    /** @type {Map<string, object>} Components attached to this entity */
    this.components = new Map();
  }

  /**
   * Adds a component to this entity
   * @param {string} name - The name/identifier for the component
   * @param {object} component - The component instance
   * @returns {Entity} Returns this for method chaining
   */
  addComponent(name, component) {
    this.components.set(name, component);
    if (component && typeof component.setEntity === 'function') {
      component.setEntity(this);
    }
    return this;
  }

  /**
   * Retrieves a component from this entity
   * @param {string} name - The name of the component to retrieve
   * @returns {object|undefined} The component instance or undefined if not found
   */
  getComponent(name) {
    return this.components.get(name);
  }

  /**
   * Checks if this entity has a specific component
   * @param {string} name - The name of the component to check for
   * @returns {boolean} True if the entity has the component, false otherwise
   */
  hasComponent(name) {
    return this.components.has(name);
  }

  /**
   * Removes a component from this entity
   * @param {string} name - The name of the component to remove
   * @returns {boolean} True if the component was removed, false if not found
   */
  removeComponent(name) {
    return this.components.delete(name);
  }
}
