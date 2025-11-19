/**
 * Base Component class that all other components should extend
 * Components are the building blocks of entities and define their properties and behaviors
 */
export class Component {
  /**
   * Creates a new Component instance
   * @param {string} name - The name/identifier for this component
   */
  constructor(name) {
    /** @type {string} */
    this.name = name;

    /** @type {object|null} Reference to the entity this component is attached to */
    this.entity = null;

    /** @type {boolean} Whether this component is currently enabled */
    this.enabled = true;
  }

  /**
   * Sets the entity reference for this component
   * @param {object} entity - The entity this component belongs to
   */
  setEntity(entity) {
    this.entity = entity;
  }

  /**
   * Enables this component
   */
  enable() {
    this.enabled = true;
  }

  /**
   * Disables this component
   */
  disable() {
    this.enabled = false;
  }

  /**
   * Checks if this component is enabled
   * @returns {boolean} True if enabled, false otherwise
   */
  isEnabled() {
    return this.enabled;
  }
}
