/**
 * GridPositionComponent - Tracks character position on a grid
 *
 * Manages fine-grained positioning within a location's grid.
 * Each character can be at {locationId, gridX, gridY} coordinates.
 *
 * @class GridPositionComponent
 */
export class GridPositionComponent {
  constructor(characterId, locationId = null, gridX = 0, gridY = 0) {
    this.characterId = characterId;
    this.locationId = locationId;    // Which location's grid they're on
    this.gridX = gridX;              // X position in that location's grid
    this.gridY = gridY;              // Y position in that location's grid
  }

  /**
   * Move to a grid position
   * @param {number} x - Target X coordinate
   * @param {number} y - Target Y coordinate
   * @returns {Object} Result with old and new positions
   */
  moveTo(x, y) {
    const oldPos = { x: this.gridX, y: this.gridY };
    this.gridX = Math.max(0, Math.min(x, 19)); // Clamp to 0-19 (20x20 grid default)
    this.gridY = Math.max(0, Math.min(y, 19));

    return {
      success: true,
      oldPosition: oldPos,
      newPosition: { x: this.gridX, y: this.gridY }
    };
  }

  /**
   * Move to a different location with starting coordinates
   * @param {string} newLocationId - New location ID
   * @param {number} startX - Starting X in new location (default: center)
   * @param {number} startY - Starting Y in new location (default: center)
   */
  moveToLocation(newLocationId, startX = 10, startY = 10) {
    const oldLocation = this.locationId;
    this.locationId = newLocationId;
    this.gridX = startX;
    this.gridY = startY;

    return {
      success: true,
      oldLocation,
      newLocation: newLocationId,
      startPosition: { x: this.gridX, y: this.gridY }
    };
  }

  /**
   * Get current position
   * @returns {Object} Position with location and grid coordinates
   */
  getPosition() {
    return {
      locationId: this.locationId,
      gridX: this.gridX,
      gridY: this.gridY
    };
  }

  /**
   * Calculate distance to another character's position
   * @param {GridPositionComponent} otherPosition - Other character's position component
   * @returns {number|null} Distance if same location, null otherwise
   */
  distanceTo(otherPosition) {
    // Only calculate distance if in same location
    if (this.locationId !== otherPosition.locationId) {
      return null;
    }

    const dx = this.gridX - otherPosition.gridX;
    const dy = this.gridY - otherPosition.gridY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get Manhattan distance (grid-based)
   * @param {GridPositionComponent} otherPosition - Other character's position component
   * @returns {number|null} Manhattan distance if same location, null otherwise
   */
  manhattanDistanceTo(otherPosition) {
    if (this.locationId !== otherPosition.locationId) {
      return null;
    }

    return Math.abs(this.gridX - otherPosition.gridX) +
           Math.abs(this.gridY - otherPosition.gridY);
  }

  /**
   * Check if character is at a specific location
   * @param {string} locationId - Location to check
   * @returns {boolean}
   */
  isAt(locationId) {
    return this.locationId === locationId;
  }

  /**
   * Check if character is within range of another in same location
   * @param {GridPositionComponent} otherPosition - Other character's position
   * @param {number} range - Maximum distance (uses Euclidean distance)
   * @returns {boolean}
   */
  isWithinRange(otherPosition, range = 5) {
    const distance = this.distanceTo(otherPosition);
    return distance !== null && distance <= range;
  }

  /**
   * Serialize position
   * @returns {Object}
   */
  toJSON() {
    return {
      characterId: this.characterId,
      locationId: this.locationId,
      gridX: this.gridX,
      gridY: this.gridY
    };
  }

  /**
   * Deserialize position
   * @param {Object} data
   * @returns {GridPositionComponent}
   */
  static fromJSON(data) {
    return new GridPositionComponent(
      data.characterId,
      data.locationId,
      data.gridX,
      data.gridY
    );
  }
}

export default GridPositionComponent;
