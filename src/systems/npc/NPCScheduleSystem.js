/**
 * NPCScheduleSystem - Manages NPC daily routines and movement
 *
 * Handles:
 * - NPC daily schedules based on time of day
 * - NPC location changes throughout the day
 * - Activity-based positioning
 * - Schedule synchronization with game time
 *
 * @class NPCScheduleSystem
 */
export class NPCScheduleSystem {
  constructor() {
    // Map<npcId, {schedule, currentScheduleIndex, currentLocation, activity}>
    this.npcSchedules = new Map();
  }

  /**
   * Register an NPC with their schedule
   * @param {string} npcId - NPC character ID
   * @param {Object} npc - NPC character object with schedule property
   */
  registerNPC(npcId, npc) {
    if (!npc.schedule || npc.schedule.length === 0) {
      // Create default schedule if none provided
      npc.schedule = this.createDefaultSchedule(npc.currentLocation || 'starting_town');
    }

    this.npcSchedules.set(npcId, {
      schedule: npc.schedule,
      currentScheduleIndex: 0,
      currentLocation: npc.currentLocation || 'starting_town',
      currentActivity: npc.schedule[0]?.activity || 'idle',
      gridX: npc.gridPosition?.x || 10,
      gridY: npc.gridPosition?.y || 10,
      npc: npc
    });
  }

  /**
   * Create a default schedule for an NPC
   * @param {string} locationId - NPC's home location
   * @returns {Array} Default schedule
   */
  createDefaultSchedule(locationId) {
    return [
      { timeOfDay: 'morning', location: locationId, activity: 'work', gridX: 10, gridY: 10 },
      { timeOfDay: 'afternoon', location: locationId, activity: 'work', gridX: 10, gridY: 10 },
      { timeOfDay: 'evening', location: locationId, activity: 'rest', gridX: 12, gridY: 5 }
    ];
  }

  /**
   * Update NPC schedule based on current time of day
   * @param {string} npcId - NPC character ID
   * @param {string} timeOfDay - Current time ('morning', 'afternoon', 'evening', 'night')
   * @returns {Object} Updated schedule info
   */
  updateSchedule(npcId, timeOfDay) {
    const npcData = this.npcSchedules.get(npcId);
    if (!npcData) return null;

    // Find matching schedule entry for this time of day
    const scheduleEntry = npcData.schedule.find(s => s.timeOfDay === timeOfDay);

    if (scheduleEntry) {
      npcData.currentLocation = scheduleEntry.location;
      npcData.currentActivity = scheduleEntry.activity;
      npcData.gridX = scheduleEntry.gridX || 10;
      npcData.gridY = scheduleEntry.gridY || 10;

      return {
        npcId,
        timeOfDay,
        location: npcData.currentLocation,
        activity: npcData.currentActivity,
        position: { x: npcData.gridX, y: npcData.gridY }
      };
    }

    return null;
  }

  /**
   * Get NPC's current location based on schedule
   * @param {string} npcId - NPC character ID
   * @returns {Object|null} Location info or null
   */
  getNPCLocation(npcId) {
    const npcData = this.npcSchedules.get(npcId);
    if (!npcData) return null;

    return {
      npcId,
      location: npcData.currentLocation,
      activity: npcData.currentActivity,
      gridPosition: { x: npcData.gridX, y: npcData.gridY }
    };
  }

  /**
   * Get NPC's activity
   * @param {string} npcId - NPC character ID
   * @returns {string} Current activity
   */
  getNPCActivity(npcId) {
    const npcData = this.npcSchedules.get(npcId);
    return npcData ? npcData.currentActivity : 'idle';
  }

  /**
   * Get all NPCs at a specific location with their activities
   * @param {string} locationId - Location ID
   * @returns {Array} NPCs at location with their info
   */
  getNPCsAt(locationId) {
    const npcs = [];

    for (const [npcId, npcData] of this.npcSchedules.entries()) {
      if (npcData.currentLocation === locationId) {
        npcs.push({
          npcId,
          name: npcData.npc?.name || 'Unknown',
          location: npcData.currentLocation,
          activity: npcData.currentActivity,
          gridPosition: { x: npcData.gridX, y: npcData.gridY }
        });
      }
    }

    return npcs;
  }

  /**
   * Get all NPCs within range of a position
   * @param {string} locationId - Location to check
   * @param {number} gridX - Reference X coordinate
   * @param {number} gridY - Reference Y coordinate
   * @param {number} range - Maximum distance (Manhattan distance)
   * @returns {Array} NPCs in range
   */
  getNPCsInRange(locationId, gridX, gridY, range = 5) {
    const nearby = [];

    for (const [npcId, npcData] of this.npcSchedules.entries()) {
      if (npcData.currentLocation === locationId) {
        const distance = Math.abs(npcData.gridX - gridX) + Math.abs(npcData.gridY - gridY);
        if (distance <= range && distance > 0) {
          nearby.push({
            npcId,
            name: npcData.npc?.name || 'Unknown',
            activity: npcData.currentActivity,
            distance,
            gridPosition: { x: npcData.gridX, y: npcData.gridY }
          });
        }
      }
    }

    // Sort by distance (nearest first)
    nearby.sort((a, b) => a.distance - b.distance);

    return nearby;
  }

  /**
   * Check if NPC is available for conversation
   * @param {string} npcId - NPC character ID
   * @param {string} timeOfDay - Current time of day
   * @returns {boolean} Is NPC available
   */
  isNPCAvailable(npcId, timeOfDay) {
    const npcData = this.npcSchedules.get(npcId);
    if (!npcData) return false;

    // Available if not sleeping (night time) and not in critical activity
    const unavailableActivities = ['sleeping', 'traveling'];
    const isNight = timeOfDay === 'night';

    return !isNight && !unavailableActivities.includes(npcData.currentActivity);
  }

  /**
   * Move NPC to specific location and update their schedule
   * @param {string} npcId - NPC character ID
   * @param {string} targetLocationId - Target location
   * @param {number} gridX - Grid X coordinate
   * @param {number} gridY - Grid Y coordinate
   * @param {string} activity - Current activity
   * @returns {Object} Movement result
   */
  moveNPC(npcId, targetLocationId, gridX = 10, gridY = 10, activity = 'traveling') {
    const npcData = this.npcSchedules.get(npcId);
    if (!npcData) {
      return { success: false, reason: 'NPC not registered' };
    }

    const oldLocation = npcData.currentLocation;
    npcData.currentLocation = targetLocationId;
    npcData.gridX = gridX;
    npcData.gridY = gridY;
    npcData.currentActivity = activity;

    return {
      success: true,
      npcId,
      oldLocation,
      newLocation: targetLocationId,
      position: { x: gridX, y: gridY },
      activity
    };
  }

  /**
   * Get all registered NPCs
   * @returns {Array} All NPC data
   */
  getAllNPCs() {
    const all = [];
    for (const [npcId, npcData] of this.npcSchedules.entries()) {
      all.push({
        npcId,
        name: npcData.npc?.name || 'Unknown',
        location: npcData.currentLocation,
        activity: npcData.currentActivity,
        gridPosition: { x: npcData.gridX, y: npcData.gridY }
      });
    }
    return all;
  }

  /**
   * Get schedule statistics
   * @returns {Object} Stats about NPC schedules
   */
  getStats() {
    const stats = {
      totalNPCs: this.npcSchedules.size,
      byLocation: {},
      byActivity: {}
    };

    for (const [npcId, npcData] of this.npcSchedules.entries()) {
      const loc = npcData.currentLocation;
      const activity = npcData.currentActivity;

      stats.byLocation[loc] = (stats.byLocation[loc] || 0) + 1;
      stats.byActivity[activity] = (stats.byActivity[activity] || 0) + 1;
    }

    return stats;
  }

  /**
   * Serialize schedule state
   * @returns {Object}
   */
  toJSON() {
    const data = {};
    for (const [npcId, npcData] of this.npcSchedules.entries()) {
      data[npcId] = {
        location: npcData.currentLocation,
        activity: npcData.currentActivity,
        gridX: npcData.gridX,
        gridY: npcData.gridY
      };
    }
    return data;
  }

  /**
   * Deserialize schedule state
   * @param {Object} data - Serialized data
   */
  fromJSON(data) {
    for (const [npcId, npcData] of Object.entries(data)) {
      const existing = this.npcSchedules.get(npcId);
      if (existing) {
        existing.currentLocation = npcData.location;
        existing.currentActivity = npcData.activity;
        existing.gridX = npcData.gridX;
        existing.gridY = npcData.gridY;
      }
    }
  }
}

export default NPCScheduleSystem;
