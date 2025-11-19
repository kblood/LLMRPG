import { Location } from './Location.js';

/**
 * WorldManager - Manages the game world, locations, and navigation
 *
 * Features:
 * - Location graph management
 * - Character movement between locations
 * - Dynamic location creation (by Chronicler)
 * - World state tracking
 *
 * @class WorldManager
 */
export class WorldManager {
  /**
   * Create world manager
   */
  constructor() {
    this.locations = new Map(); // Map<locationId, Location>
    this.characterLocations = new Map(); // Map<characterId, locationId>
  }

  /**
   * Add location to world
   * @param {Location} location
   * @returns {Location}
   */
  addLocation(location) {
    this.locations.set(location.id, location);
    return location;
  }

  /**
   * Remove location from world
   * @param {string} locationId
   * @returns {boolean} Success
   */
  removeLocation(locationId) {
    // Remove all exits pointing to this location
    for (const location of this.locations.values()) {
      for (const [direction, targetId] of location.exits) {
        if (targetId === locationId) {
          location.removeExit(direction);
        }
      }
    }

    // Move characters out of this location
    const location = this.locations.get(locationId);
    if (location) {
      for (const characterId of location.characters) {
        this.characterLocations.delete(characterId);
      }
    }

    return this.locations.delete(locationId);
  }

  /**
   * Get location by ID
   * @param {string} locationId
   * @returns {Location|null}
   */
  getLocation(locationId) {
    return this.locations.get(locationId) || null;
  }

  /**
   * Get all locations
   * @returns {Array<Location>}
   */
  getAllLocations() {
    return Array.from(this.locations.values());
  }

  /**
   * Get locations by type
   * @param {string} type
   * @returns {Array<Location>}
   */
  getLocationsByType(type) {
    return this.getAllLocations().filter(loc => loc.type === type);
  }

  /**
   * Get discovered locations
   * @returns {Array<Location>}
   */
  getDiscoveredLocations() {
    return this.getAllLocations().filter(loc => loc.discovered);
  }

  /**
   * Get visited locations
   * @returns {Array<Location>}
   */
  getVisitedLocations() {
    return this.getAllLocations().filter(loc => loc.visited);
  }

  /**
   * Connect two locations with exits
   * @param {string} locationId1
   * @param {string} direction1 - Direction from location1 to location2
   * @param {string} locationId2
   * @param {string} direction2 - Direction from location2 to location1 (optional, for two-way)
   */
  connectLocations(locationId1, direction1, locationId2, direction2 = null) {
    const location1 = this.getLocation(locationId1);
    const location2 = this.getLocation(locationId2);

    if (!location1 || !location2) {
      throw new Error('One or both locations not found');
    }

    location1.addExit(direction1, locationId2);

    if (direction2) {
      location2.addExit(direction2, locationId1);
    }
  }

  /**
   * Move character to location
   * @param {string} characterId
   * @param {string} locationId
   * @returns {Object} Result
   */
  moveCharacterToLocation(characterId, locationId) {
    const location = this.getLocation(locationId);
    if (!location) {
      return { success: false, reason: 'Location not found' };
    }

    // Remove from old location
    const oldLocationId = this.characterLocations.get(characterId);
    if (oldLocationId) {
      const oldLocation = this.getLocation(oldLocationId);
      if (oldLocation) {
        oldLocation.removeCharacter(characterId);
      }
    }

    // Add to new location
    location.addCharacter(characterId);
    location.visit(); // Mark as visited
    this.characterLocations.set(characterId, locationId);

    return {
      success: true,
      from: oldLocationId,
      to: locationId,
      location
    };
  }

  /**
   * Get character's current location
   * @param {string} characterId
   * @returns {Location|null}
   */
  getCharacterLocation(characterId) {
    const locationId = this.characterLocations.get(characterId);
    return locationId ? this.getLocation(locationId) : null;
  }

  /**
   * Get characters at location
   * @param {string} locationId
   * @returns {Array<string>} Character IDs
   */
  getCharactersAtLocation(locationId) {
    const location = this.getLocation(locationId);
    return location ? location.getCharacters() : [];
  }

  /**
   * Move character in direction
   * @param {string} characterId
   * @param {string} direction
   * @returns {Object} Result
   */
  moveCharacterInDirection(characterId, direction) {
    const currentLocation = this.getCharacterLocation(characterId);
    if (!currentLocation) {
      return { success: false, reason: 'Character location not found' };
    }

    const targetLocationId = currentLocation.getExit(direction);
    if (!targetLocationId) {
      return { success: false, reason: `No exit in direction: ${direction}` };
    }

    return this.moveCharacterToLocation(characterId, targetLocationId);
  }

  /**
   * Find path between two locations (BFS)
   * @param {string} startLocationId
   * @param {string} endLocationId
   * @returns {Array<{locationId: string, direction: string}>|null} Path or null if not found
   */
  findPath(startLocationId, endLocationId) {
    if (startLocationId === endLocationId) {
      return [];
    }

    const queue = [[startLocationId]];
    const visited = new Set([startLocationId]);

    while (queue.length > 0) {
      const path = queue.shift();
      const currentId = path[path.length - 1];
      const location = this.getLocation(currentId);

      if (!location) continue;

      for (const { direction, locationId } of location.getExits()) {
        if (locationId === endLocationId) {
          return [...path, locationId].map((id, i) => {
            if (i === 0) return null;
            const prevLocation = this.getLocation(path[i - 1]);
            const dir = Array.from(prevLocation.exits.entries())
              .find(([, targetId]) => targetId === id)?.[0];
            return { locationId: id, direction: dir };
          }).filter(step => step !== null);
        }

        if (!visited.has(locationId)) {
          visited.add(locationId);
          queue.push([...path, locationId]);
        }
      }
    }

    return null; // No path found
  }

  /**
   * Get nearby locations (1 exit away)
   * @param {string} locationId
   * @returns {Array<{direction: string, location: Location}>}
   */
  getNearbyLocations(locationId) {
    const location = this.getLocation(locationId);
    if (!location) return [];

    return location.getExits().map(({ direction, locationId: targetId }) => ({
      direction,
      location: this.getLocation(targetId)
    })).filter(item => item.location !== null);
  }

  /**
   * Create a new location dynamically (used by Chronicler)
   * @param {Object} data - Location data
   * @param {string} createdBy - 'chronicler', 'player', or 'system'
   * @returns {Location}
   */
  createDynamicLocation(data, createdBy = 'chronicler') {
    const location = new Location({
      ...data,
      createdBy,
      createdAt: Date.now()
    });

    // Handle parent-child relationship
    if (data.parentLocation) {
      const parent = this.getLocation(data.parentLocation);
      if (parent) {
        parent.addChildLocation(location.id);
      }
    }

    return this.addLocation(location);
  }

  /**
   * Add child location to parent
   * @param {string} parentId - Parent location ID
   * @param {string} childId - Child location ID
   * @returns {boolean} Success
   */
  addChildToParent(parentId, childId) {
    const parent = this.getLocation(parentId);
    const child = this.getLocation(childId);

    if (!parent || !child) {
      return false;
    }

    parent.addChildLocation(childId);
    child.parentLocation = parentId;

    return true;
  }

  /**
   * Get top-level locations (no parent)
   * @returns {Array<Location>}
   */
  getTopLevelLocations() {
    return this.getAllLocations().filter(loc => loc.isTopLevel());
  }

  /**
   * Get child locations of a parent
   * @param {string} parentId
   * @returns {Array<Location>}
   */
  getChildLocations(parentId) {
    const parent = this.getLocation(parentId);
    if (!parent) return [];

    return parent.getChildLocations()
      .map(childId => this.getLocation(childId))
      .filter(loc => loc !== null);
  }

  /**
   * Get location hierarchy (parent chain)
   * @param {string} locationId
   * @returns {Array<Location>} From top-level to current location
   */
  getLocationHierarchy(locationId) {
    const hierarchy = [];
    let current = this.getLocation(locationId);

    while (current) {
      hierarchy.unshift(current);
      if (current.parentLocation) {
        current = this.getLocation(current.parentLocation);
      } else {
        break;
      }
    }

    return hierarchy;
  }

  /**
   * Get full location path as string
   * @param {string} locationId
   * @returns {string} e.g., "Region > Town > Inn > Room"
   */
  getLocationPath(locationId) {
    const hierarchy = this.getLocationHierarchy(locationId);
    return hierarchy.map(loc => loc.name).join(' > ');
  }

  /**
   * Calculate distance between two locations
   * @param {string} locationId1
   * @param {string} locationId2
   * @returns {number|null} Distance in grid units, or null if not found
   */
  calculateDistance(locationId1, locationId2) {
    const loc1 = this.getLocation(locationId1);
    const loc2 = this.getLocation(locationId2);

    if (!loc1 || !loc2) return null;

    return loc1.distanceTo(loc2);
  }

  /**
   * Get locations within radius
   * @param {string} centerLocationId - Center location
   * @param {number} radius - Radius in grid units
   * @returns {Array<{location: Location, distance: number}>}
   */
  getLocationsWithinRadius(centerLocationId, radius) {
    const center = this.getLocation(centerLocationId);
    if (!center) return [];

    const nearbyLocations = [];

    for (const location of this.locations.values()) {
      if (location.id === centerLocationId) continue;

      const distance = center.distanceTo(location);
      if (distance <= radius) {
        nearbyLocations.push({ location, distance });
      }
    }

    // Sort by distance
    nearbyLocations.sort((a, b) => a.distance - b.distance);

    return nearbyLocations;
  }

  /**
   * Find nearest location of a specific type
   * @param {string} fromLocationId
   * @param {string} type - Location type
   * @returns {Object|null} { location, distance }
   */
  findNearestLocationType(fromLocationId, type) {
    const fromLocation = this.getLocation(fromLocationId);
    if (!fromLocation) return null;

    let nearest = null;
    let nearestDistance = Infinity;

    for (const location of this.locations.values()) {
      if (location.type === type) {
        const distance = fromLocation.distanceTo(location);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = location;
        }
      }
    }

    return nearest ? { location: nearest, distance: nearestDistance } : null;
  }

  /**
   * Get world statistics
   * @returns {Object}
   */
  getStatistics() {
    return {
      totalLocations: this.locations.size,
      discoveredLocations: this.getDiscoveredLocations().length,
      visitedLocations: this.getVisitedLocations().length,
      locationsByType: this._getLocationTypeCount(),
      charactersInWorld: this.characterLocations.size,
      dynamicLocations: this.getAllLocations().filter(l => l.createdBy !== 'system').length
    };
  }

  /**
   * Get location count by type
   * @returns {Object}
   * @private
   */
  _getLocationTypeCount() {
    const counts = {};
    for (const location of this.locations.values()) {
      counts[location.type] = (counts[location.type] || 0) + 1;
    }
    return counts;
  }

  /**
   * Clear all locations
   */
  clear() {
    this.locations.clear();
    this.characterLocations.clear();
  }

  /**
   * Serialize to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      locations: Array.from(this.locations.entries()).map(([id, location]) => ({
        id,
        location: location.toJSON()
      })),
      characterLocations: Array.from(this.characterLocations.entries())
    };
  }

  /**
   * Deserialize from JSON
   * @param {Object} data
   * @returns {WorldManager}
   */
  static fromJSON(data) {
    const manager = new WorldManager();

    if (data.locations) {
      data.locations.forEach(entry => {
        const location = Location.fromJSON(entry.location);
        manager.locations.set(entry.id, location);
      });
    }

    if (data.characterLocations) {
      manager.characterLocations = new Map(data.characterLocations);
    }

    return manager;
  }
}

export default WorldManager;
