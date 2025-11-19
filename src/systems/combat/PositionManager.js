/**
 * PositionManager - Manages distance-based positioning in encounters
 *
 * Distance categories:
 * - melee: 0-5 feet (direct combat range)
 * - close: 5-15 feet (short range)
 * - medium: 15-30 feet (medium range)
 * - long: 30+ feet (long range)
 *
 * This system tracks relative distances between combatants without needing
 * a grid system. Perfect for text-based combat.
 *
 * @class PositionManager
 */
export class PositionManager {
  /**
   * Create position manager
   * @param {Object} options - Configuration
   */
  constructor(options = {}) {
    // Map of entity positions: Map<entityId, { distance: 'melee'|'close'|'medium'|'long', relativeTo: entityId }>
    this.positions = new Map();

    // Reference point (usually the player)
    this.referenceEntityId = options.referenceEntityId || null;

    // Movement costs (stamina per distance change)
    this.movementCosts = {
      melee_to_close: 5,
      close_to_medium: 10,
      medium_to_long: 15,
      long_to_medium: 10,
      medium_to_close: 5,
      close_to_melee: 5
    };
  }

  /**
   * Set reference entity (usually the player)
   * @param {string} entityId
   */
  setReferenceEntity(entityId) {
    this.referenceEntityId = entityId;
    this.positions.set(entityId, {
      distance: 'melee', // Reference is always at self
      relativeTo: entityId
    });
  }

  /**
   * Add entity at a specific distance from reference
   * @param {string} entityId
   * @param {string} distance - 'melee', 'close', 'medium', 'long'
   */
  addEntity(entityId, distance = 'medium') {
    if (!this.referenceEntityId) {
      throw new Error('Reference entity not set');
    }

    this.positions.set(entityId, {
      distance,
      relativeTo: this.referenceEntityId
    });
  }

  /**
   * Remove entity from position tracking
   * @param {string} entityId
   */
  removeEntity(entityId) {
    this.positions.delete(entityId);
  }

  /**
   * Get distance between two entities
   * @param {string} entityId1
   * @param {string} entityId2
   * @returns {string|null} Distance category or null if not found
   */
  getDistance(entityId1, entityId2) {
    // If same entity, distance is melee (self)
    if (entityId1 === entityId2) {
      return 'melee';
    }

    const pos1 = this.positions.get(entityId1);
    const pos2 = this.positions.get(entityId2);

    if (!pos1 || !pos2) {
      return null;
    }

    // If one is the reference entity
    if (entityId1 === this.referenceEntityId) {
      return pos2.distance;
    }
    if (entityId2 === this.referenceEntityId) {
      return pos1.distance;
    }

    // Both entities are relative to reference, calculate distance between them
    // This is an approximation for text-based combat
    const dist1 = this._distanceToNumber(pos1.distance);
    const dist2 = this._distanceToNumber(pos2.distance);
    const diff = Math.abs(dist1 - dist2);

    return this._numberToDistance(diff);
  }

  /**
   * Move entity to new distance
   * @param {string} entityId
   * @param {string} newDistance
   * @param {CharacterStats} characterStats - For stamina cost
   * @returns {Object} Result
   */
  moveEntity(entityId, newDistance, characterStats = null) {
    const position = this.positions.get(entityId);
    if (!position) {
      return { success: false, reason: 'Entity not found' };
    }

    const oldDistance = position.distance;

    if (oldDistance === newDistance) {
      return { success: true, moved: false, reason: 'Already at that distance' };
    }

    // Calculate stamina cost
    const movementKey = `${oldDistance}_to_${newDistance}`;
    const staminaCost = this.movementCosts[movementKey] || 10;

    // Check if character has enough stamina
    if (characterStats && !characterStats.useStamina(staminaCost)) {
      return { success: false, reason: 'Not enough stamina', costRequired: staminaCost };
    }

    // Move entity
    position.distance = newDistance;

    return {
      success: true,
      moved: true,
      from: oldDistance,
      to: newDistance,
      staminaCost
    };
  }

  /**
   * Move entity closer to reference
   * @param {string} entityId
   * @param {CharacterStats} characterStats
   * @returns {Object} Result
   */
  moveCloser(entityId, characterStats = null) {
    const position = this.positions.get(entityId);
    if (!position) {
      return { success: false, reason: 'Entity not found' };
    }

    const currentDistance = position.distance;
    const newDistance = this._getCloserDistance(currentDistance);

    if (!newDistance) {
      return { success: false, reason: 'Already at minimum distance' };
    }

    return this.moveEntity(entityId, newDistance, characterStats);
  }

  /**
   * Move entity farther from reference
   * @param {string} entityId
   * @param {CharacterStats} characterStats
   * @returns {Object} Result
   */
  moveFarther(entityId, characterStats = null) {
    const position = this.positions.get(entityId);
    if (!position) {
      return { success: false, reason: 'Entity not found' };
    }

    const currentDistance = position.distance;
    const newDistance = this._getFartherDistance(currentDistance);

    if (!newDistance) {
      return { success: false, reason: 'Already at maximum distance' };
    }

    return this.moveEntity(entityId, newDistance, characterStats);
  }

  /**
   * Check if entity is in range for ability
   * @param {string} entityId
   * @param {string} targetId
   * @param {string} abilityRange - 'melee', 'close', 'medium', 'long', 'any'
   * @returns {boolean}
   */
  isInRange(entityId, targetId, abilityRange) {
    if (abilityRange === 'any') {
      return true;
    }

    const distance = this.getDistance(entityId, targetId);
    if (!distance) {
      return false;
    }

    // Check if distance matches ability range
    const rangeOrder = ['melee', 'close', 'medium', 'long'];
    const distanceIndex = rangeOrder.indexOf(distance);
    const rangeIndex = rangeOrder.indexOf(abilityRange);

    // Ability works at its range and all closer ranges
    return distanceIndex <= rangeIndex;
  }

  /**
   * Get all entities at a specific distance from reference
   * @param {string} distance
   * @returns {Array<string>} Array of entity IDs
   */
  getEntitiesAtDistance(distance) {
    const entities = [];
    for (const [entityId, position] of this.positions) {
      if (position.distance === distance && entityId !== this.referenceEntityId) {
        entities.push(entityId);
      }
    }
    return entities;
  }

  /**
   * Get all entities within range
   * @param {string} maxDistance - Maximum distance
   * @returns {Array<string>} Array of entity IDs
   */
  getEntitiesWithinRange(maxDistance) {
    const rangeOrder = ['melee', 'close', 'medium', 'long'];
    const maxIndex = rangeOrder.indexOf(maxDistance);

    const entities = [];
    for (const [entityId, position] of this.positions) {
      if (entityId === this.referenceEntityId) continue;

      const distanceIndex = rangeOrder.indexOf(position.distance);
      if (distanceIndex <= maxIndex) {
        entities.push(entityId);
      }
    }

    return entities;
  }

  /**
   * Get position summary
   * @returns {Object}
   */
  getPositionSummary() {
    const summary = {
      melee: [],
      close: [],
      medium: [],
      long: []
    };

    for (const [entityId, position] of this.positions) {
      if (entityId === this.referenceEntityId) continue;
      summary[position.distance].push(entityId);
    }

    return summary;
  }

  /**
   * Convert distance category to number for calculations
   * @param {string} distance
   * @returns {number}
   * @private
   */
  _distanceToNumber(distance) {
    const mapping = { melee: 0, close: 1, medium: 2, long: 3 };
    return mapping[distance] || 0;
  }

  /**
   * Convert number to distance category
   * @param {number} num
   * @returns {string}
   * @private
   */
  _numberToDistance(num) {
    const mapping = ['melee', 'close', 'medium', 'long'];
    return mapping[Math.min(num, 3)];
  }

  /**
   * Get closer distance category
   * @param {string} currentDistance
   * @returns {string|null}
   * @private
   */
  _getCloserDistance(currentDistance) {
    const order = ['melee', 'close', 'medium', 'long'];
    const index = order.indexOf(currentDistance);
    return index > 0 ? order[index - 1] : null;
  }

  /**
   * Get farther distance category
   * @param {string} currentDistance
   * @returns {string|null}
   * @private
   */
  _getFartherDistance(currentDistance) {
    const order = ['melee', 'close', 'medium', 'long'];
    const index = order.indexOf(currentDistance);
    return index < order.length - 1 ? order[index + 1] : null;
  }

  /**
   * Clear all positions
   */
  clear() {
    this.positions.clear();
    this.referenceEntityId = null;
  }

  /**
   * Serialize to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      positions: Array.from(this.positions.entries()),
      referenceEntityId: this.referenceEntityId,
      movementCosts: { ...this.movementCosts }
    };
  }

  /**
   * Deserialize from JSON
   * @param {Object} data
   * @returns {PositionManager}
   */
  static fromJSON(data) {
    const manager = new PositionManager({
      referenceEntityId: data.referenceEntityId
    });

    if (data.positions) {
      manager.positions = new Map(data.positions);
    }

    if (data.movementCosts) {
      manager.movementCosts = { ...data.movementCosts };
    }

    return manager;
  }
}

export default PositionManager;
