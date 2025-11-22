/**
 * LocationGrid - Manages grid-based positioning for all locations
 *
 * Tracks character positions across all locations and provides
 * pathfinding, distance calculations, and grid utilities.
 *
 * @class LocationGrid
 */
export class LocationGrid {
  constructor() {
    // Map<characterId, GridPositionComponent>
    this.characterPositions = new Map();

    // Map<locationId, Set<characterId>>
    this.locationCharacters = new Map();

    // Cache for pathfinding
    this.pathCache = new Map();
  }

  /**
   * Register a character on the grid
   * @param {string} characterId - Character ID
   * @param {GridPositionComponent} position - Character's grid position
   */
  addCharacter(characterId, position) {
    this.characterPositions.set(characterId, position);

    // Add to location's character list
    if (!this.locationCharacters.has(position.locationId)) {
      this.locationCharacters.set(position.locationId, new Set());
    }
    this.locationCharacters.get(position.locationId).add(characterId);
  }

  /**
   * Remove character from grid
   * @param {string} characterId - Character ID
   * @returns {boolean} Success
   */
  removeCharacter(characterId) {
    const position = this.characterPositions.get(characterId);
    if (!position) return false;

    this.characterPositions.delete(characterId);
    const locationChars = this.locationCharacters.get(position.locationId);
    if (locationChars) {
      locationChars.delete(characterId);
    }

    return true;
  }

  /**
   * Move character to new position
   * @param {string} characterId - Character ID
   * @param {number} gridX - New X coordinate
   * @param {number} gridY - New Y coordinate
   * @returns {Object} Movement result
   */
  moveCharacter(characterId, gridX, gridY) {
    const position = this.characterPositions.get(characterId);
    if (!position) {
      return { success: false, reason: 'Character not on grid' };
    }

    return position.moveTo(gridX, gridY);
  }

  /**
   * Teleport character to different location
   * @param {string} characterId - Character ID
   * @param {string} targetLocationId - Target location ID
   * @param {number} startX - Starting X in new location
   * @param {number} startY - Starting Y in new location
   * @returns {Object} Movement result
   */
  teleportCharacter(characterId, targetLocationId, startX = 10, startY = 10) {
    const position = this.characterPositions.get(characterId);
    if (!position) {
      return { success: false, reason: 'Character not on grid' };
    }

    // Remove from old location's list
    const oldLocationChars = this.locationCharacters.get(position.locationId);
    if (oldLocationChars) {
      oldLocationChars.delete(characterId);
    }

    // Move to new location
    position.moveToLocation(targetLocationId, startX, startY);

    // Add to new location's list
    if (!this.locationCharacters.has(targetLocationId)) {
      this.locationCharacters.set(targetLocationId, new Set());
    }
    this.locationCharacters.get(targetLocationId).add(characterId);

    return {
      success: true,
      oldLocation: position.locationId,
      newLocation: targetLocationId,
      position: { x: startX, y: startY }
    };
  }

  /**
   * Get character's position
   * @param {string} characterId - Character ID
   * @returns {Object|null} Position object or null
   */
  getPosition(characterId) {
    const position = this.characterPositions.get(characterId);
    return position ? position.getPosition() : null;
  }

  /**
   * Get all characters at a location
   * @param {string} locationId - Location ID
   * @returns {Array<string>} Array of character IDs
   */
  getCharactersAt(locationId) {
    const chars = this.locationCharacters.get(locationId);
    return chars ? Array.from(chars) : [];
  }

  /**
   * Get characters within range of a position
   * @param {string} characterId - Reference character ID
   * @param {number} range - Distance range
   * @returns {Array<string>} Array of nearby character IDs (excluding self)
   */
  getCharactersInRange(characterId, range = 5) {
    const position = this.characterPositions.get(characterId);
    if (!position) return [];

    const nearbyChars = [];
    const locationChars = this.locationCharacters.get(position.locationId);

    if (!locationChars) return [];

    for (const charId of locationChars) {
      if (charId === characterId) continue;

      const otherPos = this.characterPositions.get(charId);
      if (otherPos && position.isWithinRange(otherPos, range)) {
        nearbyChars.push(charId);
      }
    }

    return nearbyChars;
  }

  /**
   * Calculate distance between two characters
   * @param {string} char1Id - First character ID
   * @param {string} char2Id - Second character ID
   * @returns {number|null} Distance (Euclidean) or null if different locations
   */
  getDistance(char1Id, char2Id) {
    const pos1 = this.characterPositions.get(char1Id);
    const pos2 = this.characterPositions.get(char2Id);

    if (!pos1 || !pos2) return null;
    return pos1.distanceTo(pos2);
  }

  /**
   * Calculate Manhattan distance (grid-based)
   * @param {string} char1Id - First character ID
   * @param {string} char2Id - Second character ID
   * @returns {number|null} Manhattan distance or null if different locations
   */
  getManhattanDistance(char1Id, char2Id) {
    const pos1 = this.characterPositions.get(char1Id);
    const pos2 = this.characterPositions.get(char2Id);

    if (!pos1 || !pos2) return null;
    return pos1.manhattanDistanceTo(pos2);
  }

  /**
   * Simple pathfinding using BFS within a location
   * Returns list of positions from start to target
   * @param {number} startX - Starting X
   * @param {number} startY - Starting Y
   * @param {number} targetX - Target X
   * @param {number} targetY - Target Y
   * @param {number} gridWidth - Location grid width
   * @param {number} gridHeight - Location grid height
   * @returns {Array<{x, y}>} Path as array of coordinates
   */
  findPath(startX, startY, targetX, targetY, gridWidth = 20, gridHeight = 20) {
    const cacheKey = `${startX},${startY}->${targetX},${targetY}`;

    if (this.pathCache.has(cacheKey)) {
      return this.pathCache.get(cacheKey);
    }

    const queue = [[startX, startY]];
    const visited = new Set([`${startX},${startY}`]);
    const parent = new Map();

    while (queue.length > 0) {
      const [x, y] = queue.shift();

      if (x === targetX && y === targetY) {
        // Reconstruct path
        const path = [];
        let current = `${targetX},${targetY}`;

        while (current !== `${startX},${startY}`) {
          const [px, py] = current.split(',').map(Number);
          path.unshift({ x: px, y: py });
          current = parent.get(current);
        }

        path.unshift({ x: startX, y: startY });
        this.pathCache.set(cacheKey, path);
        return path;
      }

      // Check 4 adjacent cells (N, S, E, W)
      const neighbors = [
        [x, y - 1], // North
        [x, y + 1], // South
        [x + 1, y], // East
        [x - 1, y]  // West
      ];

      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
          const key = `${nx},${ny}`;
          if (!visited.has(key)) {
            visited.add(key);
            parent.set(key, `${x},${y}`);
            queue.push([nx, ny]);
          }
        }
      }
    }

    // No path found
    return [];
  }

  /**
   * Clear pathfinding cache
   */
  clearPathCache() {
    this.pathCache.clear();
  }

  /**
   * Get grid statistics
   * @returns {Object} Stats about grid usage
   */
  getStats() {
    return {
      totalCharacters: this.characterPositions.size,
      locationsWithCharacters: this.locationCharacters.size,
      charactersByLocation: Object.fromEntries(
        Array.from(this.locationCharacters.entries()).map(([locId, chars]) => [
          locId,
          chars.size
        ])
      )
    };
  }

  /**
   * Serialize grid state
   * @returns {Object}
   */
  toJSON() {
    return {
      positions: Array.from(this.characterPositions.values()).map(p => p.toJSON())
    };
  }

  /**
   * Deserialize grid state
   * @param {Object} data
   * @param {GridPositionComponent} GridPositionComponent - For reconstruction
   */
  fromJSON(data, GridPositionComponent) {
    this.characterPositions.clear();
    this.locationCharacters.clear();

    for (const posData of data.positions) {
      const position = GridPositionComponent.fromJSON(posData);
      this.addCharacter(posData.characterId, position);
    }
  }
}

export default LocationGrid;
