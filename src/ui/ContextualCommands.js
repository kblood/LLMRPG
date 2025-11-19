/**
 * ContextualCommands - Location-aware UI commands
 *
 * Provides enhanced commands that show contextual information:
 * - look: Current location with NPCs, quests, nearby locations
 * - npcs: NPCs at current location and nearby
 * - quests: Active quests with progress and guidance
 * - locations: Discovered locations with travel info
 */

export class ContextualCommands {
  constructor(world, locationExpansionManager = null) {
    this.world = world;
    this.locationExpansionManager = locationExpansionManager;
  }

  /**
   * Enhanced look command - shows current location context
   */
  look() {
    const player = this.world.player;
    const location = this.world.locations.get(player.currentLocation);

    if (!location) {
      return 'You are nowhere...';
    }

    const output = [];

    // Header with detail level indicator
    const detailIndicator = this.locationExpansionManager
      ? this.locationExpansionManager.getDetailLevelIndicator(location)
      : '';

    output.push('═'.repeat(70));
    output.push(`📍 ${location.name.toUpperCase()} ${detailIndicator}`);
    output.push('═'.repeat(70));
    output.push('');

    // Description (use expansion manager if available)
    const description = this.locationExpansionManager
      ? this.locationExpansionManager.getLocationDescription(location)
      : location.description;

    output.push(description);
    output.push('');

    // NPCs at this location
    const npcsHere = this.getNPCsAtLocation(location);
    if (npcsHere.length > 0) {
      output.push('👥 PEOPLE HERE:');
      npcsHere.forEach(npc => {
        const mood = npc.mood || 'neutral';
        const concern = npc.currentConcern ? ` - ${npc.currentConcern}` : '';
        output.push(`  • ${npc.name} (${npc.role}) - ${mood}${concern}`);
      });
      output.push('');
    }

    // Active quests
    const activeQuests = this.getActiveQuests();
    if (activeQuests.length > 0) {
      output.push('📜 ACTIVE QUESTS:');
      activeQuests.forEach(quest => {
        const icon = quest.type === 'main' ? '⭐' : '📋';
        output.push(`  ${icon} ${quest.title} (${quest.type})`);

        // Show first 3 objectives
        const objectives = quest.objectives.slice(0, 3);
        objectives.forEach((obj, i) => {
          const check = obj.completed ? '✓' : ' ';
          const prefix = i === objectives.length - 1 && quest.objectives.length <= 3 ? '└─' : '├─';
          output.push(`     ${prefix} [${check}] ${obj.description}`);
        });

        if (quest.objectives.length > 3) {
          output.push(`     └─ ... and ${quest.objectives.length - 3} more`);
        }

        // Show guidance if available
        if (quest.guidance && quest.guidance.nextNPC) {
          output.push(`     💡 Hint: ${quest.guidance.hint || 'Talk to ' + quest.guidance.nextNPC}`);
        }
      });
      output.push('');
    }

    // Nearby locations
    const nearbyLocations = this.getNearbyLocations(location);
    if (nearbyLocations.length > 0) {
      output.push('🗺️  NEARBY LOCATIONS:');
      nearbyLocations.forEach(nearby => {
        const direction = nearby.direction;
        const distance = nearby.distance;
        const travelTime = this.formatTravelTime(nearby.travelMinutes);
        const rumor = nearby.location.customProperties.narrativeFuel?.commonKnowledge[0] || '';

        output.push(`  ${direction}: ${nearby.location.name} (${travelTime}) - ${rumor}`);
      });
      output.push('');
    }

    output.push('═'.repeat(70));

    return output.join('\n');
  }

  /**
   * Location-aware npcs command
   */
  npcs() {
    const player = this.world.player;
    const currentLocation = this.world.locations.get(player.currentLocation);

    const output = [];
    output.push('👥 PEOPLE\n');

    // NPCs at current location
    const npcsHere = this.getNPCsAtLocation(currentLocation);
    if (npcsHere.length > 0) {
      output.push('AT THIS LOCATION:');
      npcsHere.forEach(npc => {
        const rel = this.getRelationshipString(npc, player);
        const concern = npc.currentConcern || 'Available to talk';

        output.push(`  • ${npc.name} - ${npc.role}`);
        output.push(`    ${rel} | ${concern}`);

        // Show what they know about
        if (npc.knowledge && npc.knowledge.specialties.length > 0) {
          output.push(`    Knows about: ${npc.knowledge.specialties.slice(0, 3).join(', ')}`);
        }
      });
      output.push('');
    }

    // NPCs nearby
    const npcsNearby = this.getNPCsNearby(currentLocation);
    if (npcsNearby.length > 0) {
      output.push('NEARBY:');
      npcsNearby.slice(0, 5).forEach(obj => {
        output.push(`  • ${obj.npc.name} - at ${obj.location.name}`);
      });
      output.push('');
    }

    // Quest-related NPCs
    const questNPCs = this.getQuestRelatedNPCs();
    if (questNPCs.length > 0) {
      output.push('QUEST RELATED:');
      questNPCs.forEach(npc => {
        const loc = this.getNPCLocation(npc);
        output.push(`  • ${npc.name} - ${loc ? loc.name : 'unknown location'}`);
      });
      output.push('');
    }

    output.push(`Type 'talk <name>' to start a conversation`);

    return output.join('\n');
  }

  /**
   * Quests command with progress and guidance
   */
  quests() {
    const activeQuests = this.getActiveQuests();
    const completedQuests = this.getCompletedQuests();

    const output = [];
    output.push('📜 QUESTS\n');

    if (activeQuests.length > 0) {
      output.push('ACTIVE:');
      activeQuests.forEach(quest => {
        const icon = quest.type === 'main' ? '⭐' : '📋';
        const progress = this.getQuestProgress(quest);

        output.push(`\n${icon} ${quest.title} [${progress}% complete]`);
        output.push(`   ${quest.description}`);
        output.push('');

        // Objectives
        output.push('   Objectives:');
        quest.objectives.forEach((obj, i) => {
          const check = obj.completed ? '✓' : ' ';
          output.push(`   ${i + 1}. [${check}] ${obj.description}`);
        });

        // Guidance
        if (quest.guidance) {
          output.push('');
          output.push('   Next Steps:');
          if (quest.guidance.nextLocation) {
            output.push(`   → Go to: ${quest.guidance.nextLocation}`);
          }
          if (quest.guidance.nextNPC) {
            output.push(`   → Talk to: ${quest.guidance.nextNPC}`);
          }
          if (quest.guidance.hint) {
            output.push(`   💡 ${quest.guidance.hint}`);
          }
        }
      });
      output.push('');
    }

    if (completedQuests.length > 0) {
      output.push('COMPLETED:');
      completedQuests.forEach(quest => {
        output.push(`  ✓ ${quest.title}`);
      });
      output.push('');
    }

    if (activeQuests.length === 0 && completedQuests.length === 0) {
      output.push('No quests yet. Explore and talk to people!');
    }

    return output.join('\n');
  }

  /**
   * Locations command - discovered locations
   */
  locations() {
    const player = this.world.player;
    const currentLocation = this.world.locations.get(player.currentLocation);

    const discovered = Array.from(this.world.locations.values())
      .filter(loc => loc.discovered || loc.visited);

    const output = [];
    output.push('🗺️  LOCATIONS\n');

    output.push(`CURRENT: ${currentLocation.name}`);
    output.push('');

    if (discovered.length > 1) {
      output.push('DISCOVERED:');
      discovered.forEach(loc => {
        if (loc.id === player.currentLocation) return; // Skip current

        const visited = loc.visited ? '✓' : ' ';
        const detailIndicator = this.locationExpansionManager
          ? this.locationExpansionManager.getDetailLevelIndicator(loc)
          : '';
        const direction = loc.customProperties.direction || '?';
        const distance = loc.customProperties.distanceFromStart || 0;
        const travelTime = this.calculateTravelTime(currentLocation, loc);

        output.push(`  [${visited}] ${loc.name} ${detailIndicator} (${loc.type})`);
        output.push(`      Direction: ${direction} | Distance: ${distance}km | Travel: ${this.formatTravelTime(travelTime)}`);

        // Show rumor if available
        const fuel = loc.customProperties.narrativeFuel;
        if (fuel && fuel.commonKnowledge && fuel.commonKnowledge.length > 0) {
          output.push(`      Known: ${fuel.commonKnowledge[0]}`);
        }

        output.push('');
      });
    } else {
      output.push('Explore to discover more locations!');
      output.push('');
    }

    output.push(`Type 'travel <location>' to journey to a discovered location`);

    return output.join('\n');
  }

  // Helper methods

  getNPCsAtLocation(location) {
    if (!location) return [];

    return Array.from(this.world.npcs.values())
      .filter(npc => !npc.isPlayer && npc.currentLocation === location.id);
  }

  getNPCsNearby(currentLocation) {
    const nearbyLocs = this.getNearbyLocations(currentLocation);

    return nearbyLocs.flatMap(nearby =>
      this.getNPCsAtLocation(nearby.location).map(npc => ({
        npc,
        location: nearby.location
      }))
    );
  }

  getNearbyLocations(currentLocation, maxDistance = 50) {
    return Array.from(this.world.locations.values())
      .filter(loc => loc.id !== currentLocation.id && loc.discovered)
      .map(loc => {
        const distance = this.calculateDistance(currentLocation, loc);
        const direction = this.getDirectionTo(currentLocation, loc);
        const travelMinutes = this.calculateTravelTime(currentLocation, loc);

        return {
          location: loc,
          distance,
          direction,
          travelMinutes
        };
      })
      .filter(obj => obj.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  }

  getActiveQuests() {
    if (!this.world.mainQuest) return [];

    const quests = [];
    if (this.world.mainQuest.state === 'active') {
      quests.push(this.world.mainQuest);
    }

    // Add side quests if they exist
    if (this.world.sideQuests) {
      this.world.sideQuests.forEach(q => {
        if (q.state === 'active') {
          quests.push(q);
        }
      });
    }

    return quests;
  }

  getCompletedQuests() {
    const quests = [];

    if (this.world.mainQuest && this.world.mainQuest.state === 'completed') {
      quests.push(this.world.mainQuest);
    }

    if (this.world.sideQuests) {
      this.world.sideQuests.forEach(q => {
        if (q.state === 'completed') {
          quests.push(q);
        }
      });
    }

    return quests;
  }

  getQuestRelatedNPCs() {
    const npcs = [];
    const activeQuests = this.getActiveQuests();

    activeQuests.forEach(quest => {
      if (quest.guidance && quest.guidance.nextNPC) {
        const npc = Array.from(this.world.npcs.values())
          .find(n => n.name === quest.guidance.nextNPC);

        if (npc && !npcs.includes(npc)) {
          npcs.push(npc);
        }
      }
    });

    return npcs;
  }

  getNPCLocation(npc) {
    return this.world.locations.get(npc.currentLocation);
  }

  getQuestProgress(quest) {
    if (!quest.objectives || quest.objectives.length === 0) return 0;

    const completed = quest.objectives.filter(obj => obj.completed).length;
    return Math.round((completed / quest.objectives.length) * 100);
  }

  getRelationshipString(npc, player) {
    if (!npc.relationships) return 'Neutral';

    const level = npc.relationships.getRelationship(player.id);

    if (level >= 75) return '💚 Best Friend';
    if (level >= 50) return '💙 Friend';
    if (level >= 25) return '💛 Friendly';
    if (level >= -25) return '⚪ Neutral';
    if (level >= -50) return '🧡 Unfriendly';
    if (level >= -75) return '❤️ Enemy';
    return '💔 Nemesis';
  }

  calculateDistance(loc1, loc2) {
    const dx = loc1.coordinates.x - loc2.coordinates.x;
    const dy = loc1.coordinates.y - loc2.coordinates.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  getDirectionTo(from, to) {
    const dx = to.coordinates.x - from.coordinates.x;
    const dy = to.coordinates.y - from.coordinates.y;

    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    if (angle >= -22.5 && angle < 22.5) return 'East';
    if (angle >= 22.5 && angle < 67.5) return 'Northeast';
    if (angle >= 67.5 && angle < 112.5) return 'North';
    if (angle >= 112.5 && angle < 157.5) return 'Northwest';
    if (angle >= 157.5 || angle < -157.5) return 'West';
    if (angle >= -157.5 && angle < -112.5) return 'Southwest';
    if (angle >= -112.5 && angle < -67.5) return 'South';
    if (angle >= -67.5 && angle < -22.5) return 'Southeast';

    return 'Unknown';
  }

  calculateTravelTime(from, to) {
    const distance = this.calculateDistance(from, to);
    // 1 grid unit = 1km, walking speed ~5km/h = 12 min per km
    return Math.round(distance * 12);
  }

  formatTravelTime(minutes) {
    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (mins === 0) {
      return `${hours} hr`;
    }

    return `${hours} hr ${mins} min`;
  }
}

export default ContextualCommands;
