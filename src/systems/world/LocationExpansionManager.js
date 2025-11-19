import { GameMaster } from '../GameMaster.js';
import Logger from '../../utils/Logger.js';

/**
 * LocationExpansionManager - Progressive Detail Expansion for Locations
 *
 * Manages the progressive expansion of location details:
 * - SPARSE: Name, coordinates, narrative fuel (generated at world creation)
 * - PARTIAL: + Description, points of interest, dangers (when NPCs mention or player asks)
 * - FULL: + NPCs, items, secrets, detailed layout (when player visits)
 *
 * Uses GM (LLM) to generate details based on narrative fuel and location type.
 */
export class LocationExpansionManager {
  constructor(gameMaster, worldManager) {
    this.gm = gameMaster;
    this.worldManager = worldManager;
    this.logger = new Logger('LocationExpansionManager');

    // Track expansion history
    this.expansionHistory = new Map(); // locationId -> { sparse, partial, full }

    // Cache for generated content to avoid regeneration
    this.contentCache = new Map(); // locationId -> { partial, full }

    this.logger.info('LocationExpansionManager initialized');
  }

  /**
   * Get current detail level of a location
   */
  getDetailLevel(location) {
    if (!location.customProperties.detailLevel) {
      return 'sparse';
    }
    return location.customProperties.detailLevel;
  }

  /**
   * Expand location to PARTIAL detail level
   * Triggered when: NPC mentions location, player asks about location
   */
  async expandToPartial(locationId, context = {}) {
    const location = this.worldManager.getLocation(locationId);
    if (!location) {
      this.logger.error(`Location ${locationId} not found`);
      return { success: false, reason: 'Location not found' };
    }

    const currentLevel = this.getDetailLevel(location);

    // Already at partial or full level
    if (currentLevel === 'partial' || currentLevel === 'full') {
      this.logger.debug(`Location ${location.name} already at ${currentLevel} detail`);
      return { success: true, alreadyExpanded: true, location };
    }

    this.logger.info(`Expanding ${location.name} to PARTIAL detail (from ${currentLevel})`);

    try {
      // Generate partial details using GM
      const partialDetails = await this.generatePartialDetails(location, context);

      // Update location with partial details
      location.description = partialDetails.description;
      location.customProperties.detailLevel = 'partial';
      location.customProperties.pointsOfInterest = partialDetails.pointsOfInterest;
      location.customProperties.dangers = partialDetails.dangers;
      location.customProperties.opportunities = partialDetails.opportunities;
      location.customProperties.atmosphere = partialDetails.atmosphere;

      // Record expansion
      this.recordExpansion(locationId, 'partial', context);

      // Cache the content
      this.cacheContent(locationId, 'partial', partialDetails);

      this.logger.info(`${location.name} expanded to PARTIAL detail`);

      return {
        success: true,
        location,
        details: partialDetails,
        expansionLevel: 'partial'
      };

    } catch (error) {
      this.logger.error(`Failed to expand ${location.name} to partial:`, error);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Expand location to FULL detail level
   * Triggered when: Player visits/travels to location
   */
  async expandToFull(locationId, context = {}) {
    const location = this.worldManager.getLocation(locationId);
    if (!location) {
      this.logger.error(`Location ${locationId} not found`);
      return { success: false, reason: 'Location not found' };
    }

    const currentLevel = this.getDetailLevel(location);

    // Already at full level
    if (currentLevel === 'full') {
      this.logger.debug(`Location ${location.name} already at full detail`);
      return { success: true, alreadyExpanded: true, location };
    }

    this.logger.info(`Expanding ${location.name} to FULL detail (from ${currentLevel})`);

    try {
      // If still sparse, expand to partial first
      if (currentLevel === 'sparse') {
        await this.expandToPartial(locationId, context);
      }

      // Generate full details using GM
      const fullDetails = await this.generateFullDetails(location, context);

      // Update location with full details
      location.customProperties.detailLevel = 'full';
      location.customProperties.detailedLayout = fullDetails.detailedLayout;
      location.customProperties.secrets = fullDetails.secrets;
      location.customProperties.hiddenFeatures = fullDetails.hiddenFeatures;
      location.customProperties.ambience = fullDetails.ambience;

      // Add NPCs if generated
      if (fullDetails.npcs && fullDetails.npcs.length > 0) {
        fullDetails.npcs.forEach(npcId => {
          location.addCharacter(npcId);
        });
      }

      // Add items if generated
      if (fullDetails.items && fullDetails.items.length > 0) {
        fullDetails.items.forEach(itemData => {
          // Items would need to be created via item system
          // For now, store item descriptions
          if (!location.customProperties.itemDescriptions) {
            location.customProperties.itemDescriptions = [];
          }
          location.customProperties.itemDescriptions.push(itemData);
        });
      }

      // Record expansion
      this.recordExpansion(locationId, 'full', context);

      // Cache the content
      this.cacheContent(locationId, 'full', fullDetails);

      this.logger.info(`${location.name} expanded to FULL detail`);

      return {
        success: true,
        location,
        details: fullDetails,
        expansionLevel: 'full'
      };

    } catch (error) {
      this.logger.error(`Failed to expand ${location.name} to full:`, error);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Generate PARTIAL details using GM
   */
  async generatePartialDetails(location, context) {
    const narrativeFuel = location.customProperties.narrativeFuel || {};
    const locationType = location.type;

    const prompt = this.buildPartialExpansionPrompt(location, narrativeFuel, context);

    try {
      const response = await this.gm.ollama.generate(prompt, {
        temperature: 0.85,
        maxTokens: 400
      });

      // Parse response as JSON
      const details = this.parsePartialResponse(response, location);

      return details;

    } catch (error) {
      this.logger.error('Failed to generate partial details:', error);
      // Return fallback details
      return this.getFallbackPartialDetails(location);
    }
  }

  /**
   * Generate FULL details using GM
   */
  async generateFullDetails(location, context) {
    const narrativeFuel = location.customProperties.narrativeFuel || {};
    const partialDetails = {
      description: location.description,
      pointsOfInterest: location.customProperties.pointsOfInterest || [],
      dangers: location.customProperties.dangers || [],
      opportunities: location.customProperties.opportunities || []
    };

    const prompt = this.buildFullExpansionPrompt(location, narrativeFuel, partialDetails, context);

    try {
      const response = await this.gm.ollama.generate(prompt, {
        temperature: 0.85,
        maxTokens: 500
      });

      // Parse response as JSON
      const details = this.parseFullResponse(response, location);

      return details;

    } catch (error) {
      this.logger.error('Failed to generate full details:', error);
      // Return fallback details
      return this.getFallbackFullDetails(location);
    }
  }

  /**
   * Build prompt for PARTIAL expansion
   */
  buildPartialExpansionPrompt(location, narrativeFuel, context) {
    const commonKnowledge = narrativeFuel.commonKnowledge || ['Unknown location'];
    const rumors = narrativeFuel.rumors || [];
    const questHooks = narrativeFuel.questHooks || [];

    const typeGuidance = this.getTypeGuidance(location.type);

    return `You are the Chronicler, generating details for a location in a fantasy RPG.

Location: ${location.name}
Type: ${location.type}
Coordinates: (${location.coordinates.x}, ${location.coordinates.y})

What People Know:
${commonKnowledge.map(k => `- ${k}`).join('\n')}

Rumors:
${rumors.map(r => `- ${r.text} (likelihood: ${r.likelihood})`).join('\n') || 'None'}

Quest Hooks:
${questHooks.map(h => `- ${h}`).join('\n') || 'None'}

Type Guidance: ${typeGuidance}

Context: ${context.trigger || 'Player asked about this location'}

Generate PARTIAL details (as if heard from stories and descriptions). Respond with ONLY valid JSON:

{
  "description": "2-3 sentence atmospheric description of the location",
  "pointsOfInterest": ["Feature 1", "Feature 2", "Feature 3"],
  "dangers": ["Danger 1", "Danger 2"],
  "opportunities": ["Opportunity 1", "Opportunity 2"],
  "atmosphere": "Overall mood/feeling"
}

Make it consistent with the rumors and common knowledge. Keep it mysterious - the player hasn't visited yet.
Return ONLY the JSON object.`;
  }

  /**
   * Build prompt for FULL expansion
   */
  buildFullExpansionPrompt(location, narrativeFuel, partialDetails, context) {
    const typeGuidance = this.getTypeGuidance(location.type);

    return `You are the Chronicler, expanding a location to FULL detail as the player visits.

Location: ${location.name}
Type: ${location.type}

PARTIAL Details (already known):
Description: ${partialDetails.description}
Points of Interest: ${partialDetails.pointsOfInterest.join(', ')}
Known Dangers: ${partialDetails.dangers.join(', ')}
Opportunities: ${partialDetails.opportunities.join(', ')}

Type Guidance: ${typeGuidance}

Context: ${context.trigger || 'Player is visiting this location'}

Generate FULL details (the player is now HERE). Respond with ONLY valid JSON:

{
  "detailedLayout": "3-4 sentence detailed description of the layout and specific features",
  "secrets": ["Secret 1", "Secret 2"],
  "hiddenFeatures": ["Hidden feature 1", "Hidden feature 2"],
  "ambience": "Specific sensory details - sounds, smells, lighting, temperature",
  "npcs": [],
  "items": []
}

For NPCs and Items:
- Leave arrays empty for now (will be managed separately)
- Focus on secrets and hidden features the player might discover

Make it consistent with the partial details but ADD new discoveries.
Return ONLY the JSON object.`;
  }

  /**
   * Get type-specific guidance for location generation
   */
  getTypeGuidance(locationType) {
    const guidance = {
      'forest': 'Dense woods with ancient trees, natural paths, wildlife, possible clearings or hidden groves',
      'ruins': 'Crumbling ancient structures, hints of past civilization, potential treasures and dangers',
      'dungeon': 'Dark underground complex, rooms and corridors, monsters, traps, and valuable loot',
      'town': 'Settlement with buildings, streets, NPCs going about daily life, shops and services',
      'village': 'Small rural settlement, farms, simple buildings, close-knit community',
      'cave': 'Natural underground formation, rock formations, water features, possible inhabitants',
      'mountain': 'Elevated terrain, rocky paths, caves, scenic vistas, harsh weather',
      'wilderness': 'Open natural area, varied terrain, wildlife, survival challenges',
      'building': 'Constructed structure with rooms, specific purpose, architectural features',
      'default': 'Location with distinct features, potential for discovery and interaction'
    };

    return guidance[locationType] || guidance['default'];
  }

  /**
   * Parse PARTIAL response from GM
   */
  parsePartialResponse(response, location) {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      }

      throw new Error('No JSON found in response');

    } catch (error) {
      this.logger.warn('Failed to parse partial response, using fallback');
      return this.getFallbackPartialDetails(location);
    }
  }

  /**
   * Parse FULL response from GM
   */
  parseFullResponse(response, location) {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      }

      throw new Error('No JSON found in response');

    } catch (error) {
      this.logger.warn('Failed to parse full response, using fallback');
      return this.getFallbackFullDetails(location);
    }
  }

  /**
   * Get fallback PARTIAL details
   */
  getFallbackPartialDetails(location) {
    const narrativeFuel = location.customProperties.narrativeFuel || {};
    const commonKnowledge = narrativeFuel.commonKnowledge || [];

    return {
      description: commonKnowledge[0] || `${location.name} is a ${location.type} that you've heard about.`,
      pointsOfInterest: commonKnowledge.slice(0, 3),
      dangers: ['Unknown dangers may lurk here'],
      opportunities: ['Unexplored possibilities'],
      atmosphere: 'mysterious and unknown'
    };
  }

  /**
   * Get fallback FULL details
   */
  getFallbackFullDetails(location) {
    return {
      detailedLayout: `As you arrive at ${location.name}, you can see it is a ${location.type} with various features to explore.`,
      secrets: ['There may be hidden secrets here'],
      hiddenFeatures: ['Careful exploration might reveal more'],
      ambience: 'The air is still, and the atmosphere is thick with possibility.',
      npcs: [],
      items: []
    };
  }

  /**
   * Record expansion in history
   */
  recordExpansion(locationId, level, context) {
    if (!this.expansionHistory.has(locationId)) {
      this.expansionHistory.set(locationId, {});
    }

    const history = this.expansionHistory.get(locationId);
    history[level] = {
      timestamp: Date.now(),
      context: context,
      trigger: context.trigger || 'unknown'
    };
  }

  /**
   * Cache generated content
   */
  cacheContent(locationId, level, content) {
    if (!this.contentCache.has(locationId)) {
      this.contentCache.set(locationId, {});
    }

    const cache = this.contentCache.get(locationId);
    cache[level] = content;
  }

  /**
   * Get expansion history for a location
   */
  getExpansionHistory(locationId) {
    return this.expansionHistory.get(locationId) || null;
  }

  /**
   * Get formatted location description based on detail level
   */
  getLocationDescription(location) {
    const detailLevel = this.getDetailLevel(location);

    switch (detailLevel) {
      case 'sparse':
        return this.getSparseDescription(location);
      case 'partial':
        return this.getPartialDescription(location);
      case 'full':
        return this.getFullDescription(location);
      default:
        return location.description || location.name;
    }
  }

  /**
   * Get SPARSE description
   */
  getSparseDescription(location) {
    const narrativeFuel = location.customProperties.narrativeFuel || {};
    const commonKnowledge = narrativeFuel.commonKnowledge || [];

    if (commonKnowledge.length > 0) {
      return `${location.name} - ${commonKnowledge[0]} (Not yet visited)`;
    }

    return `${location.name} - A ${location.type} you've heard about. (Not yet visited)`;
  }

  /**
   * Get PARTIAL description
   */
  getPartialDescription(location) {
    const poi = location.customProperties.pointsOfInterest || [];
    const atmosphere = location.customProperties.atmosphere || '';

    let desc = location.description;

    if (poi.length > 0) {
      desc += `\n\nPoints of Interest: ${poi.join(', ')}`;
    }

    if (atmosphere) {
      desc += `\n\nAtmosphere: ${atmosphere}`;
    }

    desc += '\n\n(You have not visited this location yet)';

    return desc;
  }

  /**
   * Get FULL description
   */
  getFullDescription(location) {
    let desc = location.description;

    const layout = location.customProperties.detailedLayout;
    const ambience = location.customProperties.ambience;
    const poi = location.customProperties.pointsOfInterest || [];

    if (layout) {
      desc += `\n\n${layout}`;
    }

    if (ambience) {
      desc += `\n\n${ambience}`;
    }

    if (poi.length > 0) {
      desc += `\n\nNotable Features: ${poi.join(', ')}`;
    }

    return desc;
  }

  /**
   * Get detail level indicator
   */
  getDetailLevelIndicator(location) {
    const level = this.getDetailLevel(location);

    const indicators = {
      'sparse': '🌫️',    // Foggy/unclear
      'partial': '🌤️',   // Partially clear
      'full': '☀️'       // Fully revealed
    };

    return indicators[level] || '❓';
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const allLocations = this.worldManager.getAllLocations();

    const stats = {
      total: allLocations.length,
      sparse: 0,
      partial: 0,
      full: 0,
      totalExpansions: this.expansionHistory.size
    };

    allLocations.forEach(loc => {
      const level = this.getDetailLevel(loc);
      stats[level]++;
    });

    return stats;
  }

  /**
   * Clear caches (useful for testing)
   */
  clearCaches() {
    this.contentCache.clear();
    this.logger.info('Content caches cleared');
  }

  /**
   * Reset manager (useful for testing)
   */
  reset() {
    this.expansionHistory.clear();
    this.contentCache.clear();
    this.logger.info('LocationExpansionManager reset');
  }
}

export default LocationExpansionManager;
