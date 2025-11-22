/**
 * Location - Represents a place in the game world
 *
 * Locations can be:
 * - Pre-defined (taverns, towns, dungeons)
 * - Dynamically created by the Chronicler
 * - Connected in a graph structure
 *
 * @class Location
 */
export class Location {
  /**
   * Create a location
   * @param {Object} data - Location data
   */
  constructor(data = {}) {
    this.id = data.id || this._generateId();
    this.name = data.name || 'Unknown Location';
    this.description = data.description || '';
    this.type = data.type || 'area'; // area, building, room, dungeon, wilderness, region

    // Spatial positioning (grid coordinates)
    this.coordinates = {
      x: data.x !== undefined ? data.x : 0,
      y: data.y !== undefined ? data.y : 0,
      z: data.z !== undefined ? data.z : 0 // For elevation/floors
    };

    // Hierarchical structure
    this.parentLocation = data.parentLocation || null; // ID of parent location
    this.childLocations = new Set(data.childLocations || []); // IDs of child locations
    this.scale = data.scale || 1; // Size multiplier (town=100, building=1, room=0.1)

    // Grid dimensions for this location (fine-grained positioning within location)
    this.grid = {
      width: data.gridWidth || 20,   // Default 20x20 grid per location
      height: data.gridHeight || 20,
      cellSize: data.cellSize || 1   // Distance unit per cell
    };

    // Connections to other locations
    this.exits = new Map(); // Map<direction, locationId> or Map<name, locationId>
    if (data.exits) {
      this.exits = new Map(Object.entries(data.exits));
    }

    // Characters present at this location
    this.characters = new Set(data.characters || []);

    // Items present at this location
    this.items = new Map(); // Map<itemId, { item, quantity }>
    if (data.items) {
      data.items.forEach(item => {
        this.items.set(item.id, { item, quantity: item.quantity || 1 });
      });
    }

    // Environmental properties
    this.environment = {
      indoor: data.indoor !== undefined ? data.indoor : false,
      lit: data.lit !== undefined ? data.lit : true,
      safe: data.safe !== undefined ? data.safe : true,
      temperature: data.temperature || 'temperate', // cold, temperate, warm, hot
      hazards: data.hazards || [] // fire, poison, trap, etc.
    };

    // Location properties
    this.tags = data.tags || []; // ['shop', 'inn', 'dangerous', 'hidden']
    this.discovered = data.discovered !== undefined ? data.discovered : false;
    this.visited = data.visited !== undefined ? data.visited : false;

    // Dynamic properties (set by Chronicler)
    this.lore = data.lore || '';
    this.customProperties = data.customProperties || {};

    // Creation metadata
    this.createdBy = data.createdBy || 'system'; // 'system', 'chronicler', 'player'
    this.createdAt = data.createdAt || Date.now();
  }

  /**
   * Generate unique location ID
   * @returns {string}
   */
  _generateId() {
    return `location_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add exit to another location
   * @param {string} direction - Direction or exit name ('north', 'upstairs', 'secret door')
   * @param {string} locationId - Target location ID
   */
  addExit(direction, locationId) {
    this.exits.set(direction, locationId);
  }

  /**
   * Remove exit
   * @param {string} direction
   * @returns {boolean} Success
   */
  removeExit(direction) {
    return this.exits.delete(direction);
  }

  /**
   * Get exit destination
   * @param {string} direction
   * @returns {string|null} Location ID or null
   */
  getExit(direction) {
    return this.exits.get(direction) || null;
  }

  /**
   * Get all exits
   * @returns {Array<{direction: string, locationId: string}>}
   */
  getExits() {
    return Array.from(this.exits.entries()).map(([direction, locationId]) => ({
      direction,
      locationId
    }));
  }

  /**
   * Add child location (location within this location)
   * @param {string} childLocationId
   */
  addChildLocation(childLocationId) {
    this.childLocations.add(childLocationId);
  }

  /**
   * Remove child location
   * @param {string} childLocationId
   * @returns {boolean} Success
   */
  removeChildLocation(childLocationId) {
    return this.childLocations.delete(childLocationId);
  }

  /**
   * Get all child locations
   * @returns {Array<string>} Child location IDs
   */
  getChildLocations() {
    return Array.from(this.childLocations);
  }

  /**
   * Check if this location contains another location
   * @param {string} locationId
   * @returns {boolean}
   */
  hasChildLocation(locationId) {
    return this.childLocations.has(locationId);
  }

  /**
   * Check if this is a top-level location
   * @returns {boolean}
   */
  isTopLevel() {
    return this.parentLocation === null;
  }

  /**
   * Calculate distance to another location
   * @param {Location} otherLocation
   * @returns {number} Distance in grid units
   */
  distanceTo(otherLocation) {
    const dx = this.coordinates.x - otherLocation.coordinates.x;
    const dy = this.coordinates.y - otherLocation.coordinates.y;
    const dz = this.coordinates.z - otherLocation.coordinates.z;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Calculate Manhattan distance to another location
   * @param {Location} otherLocation
   * @returns {number} Manhattan distance
   */
  manhattanDistanceTo(otherLocation) {
    const dx = Math.abs(this.coordinates.x - otherLocation.coordinates.x);
    const dy = Math.abs(this.coordinates.y - otherLocation.coordinates.y);
    const dz = Math.abs(this.coordinates.z - otherLocation.coordinates.z);

    return dx + dy + dz;
  }

  /**
   * Add character to location
   * @param {string} characterId
   */
  addCharacter(characterId) {
    this.characters.add(characterId);
  }

  /**
   * Remove character from location
   * @param {string} characterId
   * @returns {boolean} Success
   */
  removeCharacter(characterId) {
    return this.characters.delete(characterId);
  }

  /**
   * Check if character is at this location
   * @param {string} characterId
   * @returns {boolean}
   */
  hasCharacter(characterId) {
    return this.characters.has(characterId);
  }

  /**
   * Get all characters at location
   * @returns {Array<string>} Array of character IDs
   */
  getCharacters() {
    return Array.from(this.characters);
  }

  /**
   * Add item to location
   * @param {Item} item
   * @param {number} quantity
   */
  addItem(item, quantity = 1) {
    if (this.items.has(item.id)) {
      const existing = this.items.get(item.id);
      existing.quantity += quantity;
    } else {
      this.items.set(item.id, { item, quantity });
    }
  }

  /**
   * Remove item from location
   * @param {string} itemId
   * @param {number} quantity
   * @returns {Object} Result with removed item
   */
  removeItem(itemId, quantity = 1) {
    if (!this.items.has(itemId)) {
      return { success: false, reason: 'Item not found' };
    }

    const entry = this.items.get(itemId);
    const actualRemoved = Math.min(quantity, entry.quantity);
    entry.quantity -= actualRemoved;

    if (entry.quantity === 0) {
      this.items.delete(itemId);
    }

    return {
      success: true,
      item: entry.item,
      quantityRemoved: actualRemoved
    };
  }

  /**
   * Get all items at location
   * @returns {Array<{item: Item, quantity: number}>}
   */
  getItems() {
    return Array.from(this.items.values());
  }

  /**
   * Mark location as discovered
   */
  discover() {
    this.discovered = true;
  }

  /**
   * Mark location as visited
   */
  visit() {
    this.visited = true;
    this.discovered = true;
  }

  /**
   * Check if location is safe
   * @returns {boolean}
   */
  isSafe() {
    return this.environment.safe && this.environment.hazards.length === 0;
  }

  /**
   * Get location description with environmental details
   * @param {Object} gameState - Current game state for weather/time
   * @returns {string}
   */
  getFullDescription(gameState = null) {
    let desc = this.description;

    // Add environmental context
    if (gameState) {
      if (!this.environment.indoor && gameState.weather !== 'clear') {
        desc += ` The weather is ${gameState.weather}.`;
      }

      if (!this.environment.lit) {
        desc += ` The area is dark.`;
      }
    }

    // Add character presence
    if (this.characters.size > 0) {
      desc += ` You see ${this.characters.size} character(s) here.`;
    }

    // Add item presence
    if (this.items.size > 0) {
      desc += ` There are items here.`;
    }

    return desc;
  }

  /**
   * Get location info
   * @returns {Object}
   */
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      exits: this.getExits(),
      characterCount: this.characters.size,
      itemCount: this.items.size,
      environment: { ...this.environment },
      tags: [...this.tags],
      discovered: this.discovered,
      visited: this.visited,
      createdBy: this.createdBy
    };
  }

  /**
   * Serialize to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      x: this.coordinates.x,
      y: this.coordinates.y,
      z: this.coordinates.z,
      parentLocation: this.parentLocation,
      childLocations: Array.from(this.childLocations),
      scale: this.scale,
      gridWidth: this.grid.width,
      gridHeight: this.grid.height,
      cellSize: this.grid.cellSize,
      exits: Object.fromEntries(this.exits),
      characters: Array.from(this.characters),
      items: Array.from(this.items.values()).map(entry => ({
        ...entry.item.toJSON(),
        quantity: entry.quantity
      })),
      indoor: this.environment.indoor,
      lit: this.environment.lit,
      safe: this.environment.safe,
      temperature: this.environment.temperature,
      hazards: this.environment.hazards,
      tags: [...this.tags],
      discovered: this.discovered,
      visited: this.visited,
      lore: this.lore,
      customProperties: { ...this.customProperties },
      createdBy: this.createdBy,
      createdAt: this.createdAt
    };
  }

  /**
   * Deserialize from JSON
   * @param {Object} data
   * @returns {Location}
   */
  static fromJSON(data) {
    return new Location(data);
  }
}

export default Location;
