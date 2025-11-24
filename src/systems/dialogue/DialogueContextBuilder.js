/**
 * DialogueContextBuilder - Phase 1C Enhancement
 *
 * Builds rich contextual information for NPC dialogue by extracting:
 * - NPC knowledge (specialties, rumors, secrets)
 * - Location narrative fuel (common knowledge, rumors, quest hooks)
 * - Active quest information
 * - Relationship context
 * - NPC mood and concerns
 *
 * This context is used to generate more intelligent, contextual NPC dialogue.
 */
export class DialogueContextBuilder {
  constructor(world) {
    this.world = world;
  }

  /**
   * Build complete dialogue context for an NPC conversation
   * @param {Character} npc - The NPC being talked to
   * @param {Character} player - The player character
   * @param {Object} options - Additional options
   * @returns {Object} Rich context for dialogue generation
   */
  buildContext(npc, player, options = {}) {
    const context = {
      // Basic NPC info
      npc: {
        id: npc.id,
        name: npc.name,
        role: npc.role,
        mood: npc.mood || 'neutral',
        currentConcern: npc.currentConcern || null,
        personality: this._summarizePersonality(npc.personality),
        background: npc.backstory || npc.background || '',
        services: this._determineServices(npc.role)
      },

      // Player info
      player: {
        id: player.id,
        name: player.name,
        role: player.role
      },

      // Relationship
      relationship: this._buildRelationshipContext(npc, player),

      // NPC Knowledge
      knowledge: this._extractNPCKnowledge(npc),

      // Location context
      location: this._buildLocationContext(npc.currentLocation),

      // Quest context
      quests: this._buildQuestContext(npc),

      // Gossip and reputation context
      gossip: this._buildGossipContext(npc, player, options),

      // World state
      worldState: this.world.worldState || {},

      // Conversation history (if provided)
      conversationHistory: options.conversationHistory || []
    };

    return context;
  }

  /**
   * Extract NPC's knowledge system
   * @private
   */
  _extractNPCKnowledge(npc) {
    const knowledge = {
      specialties: [],
      rumors: [],
      secrets: [],
      locations: [],
      hasKnowledge: false
    };

    // Legacy knowledge system
    if (npc.knowledge) {
      knowledge.specialties = npc.knowledge.specialties || [];
      knowledge.rumors = npc.knowledge.rumors || [];
      knowledge.secrets = npc.knowledge.secrets || [];
    }

    // Extract from memory system (where world knowledge is stored)
    if (npc.memory) {
      // Get location knowledge
      const locationMemories = npc.memory.getMemoriesByType('knowledge')
        .filter(m => m.category === 'location');
      knowledge.locations = locationMemories.map(m => m.content).slice(0, 5); // Top 5

      // Get rumors from memory
      const rumorMemories = npc.memory.getMemoriesByType('rumor');
      const memoryRumors = rumorMemories.map(m => m.content).slice(0, 3); // Top 3
      knowledge.rumors = [...knowledge.rumors, ...memoryRumors];

      // Get mystery knowledge
      const mysteryMemories = npc.memory.getMemoriesByCategory('mystery');
      if (mysteryMemories && mysteryMemories.length > 0) {
        knowledge.secrets = [...knowledge.secrets, ...mysteryMemories.map(m => m.content).slice(0, 2)];
      }
    }

    knowledge.hasKnowledge = (knowledge.specialties.length > 0) ||
                              (knowledge.rumors.length > 0) ||
                              (knowledge.secrets.length > 0) ||
                              (knowledge.locations.length > 0);

    return knowledge;
  }

  /**
   * Build location context including narrative fuel
   * @private
   */
  _buildLocationContext(locationId) {
    const location = this.world.locations.get(locationId);

    if (!location) {
      return { name: 'Unknown', hasNarrativeFuel: false };
    }

    const narrativeFuel = location.customProperties?.narrativeFuel;

    return {
      id: location.id,
      name: location.name,
      type: location.type,
      description: location.description,
      atmosphere: location.customProperties?.atmosphere || 'normal',
      situation: location.customProperties?.situation || null,

      // Narrative fuel
      narrativeFuel: narrativeFuel ? {
        commonKnowledge: narrativeFuel.commonKnowledge || [],
        rumors: narrativeFuel.rumors || [],
        questHooks: narrativeFuel.questHooks || [],
        specialists: narrativeFuel.specialists || []
      } : null,

      hasNarrativeFuel: !!narrativeFuel
    };
  }

  /**
   * Build quest context
   * @private
   */
  _buildQuestContext(npc) {
    const activeQuests = [];
    const relevantQuests = [];

    // Get quests from world
    if (this.world.mainQuest) {
      const quest = this.world.mainQuest;
      activeQuests.push({
        id: quest.id,
        title: quest.title,
        description: quest.description,
        isMain: true,
        giver: quest.giver,
        isRelevantToNPC: this._isQuestRelevantToNPC(quest, npc),
        currentObjectives: quest.objectives?.filter(o => !o.completed).map(o => o.description) || []
      });

      if (this._isQuestRelevantToNPC(quest, npc)) {
        relevantQuests.push(quest.title);
      }
    }

    // Side quests
    if (this.world.sideQuests) {
      this.world.sideQuests.forEach(quest => {
        if (quest.state === 'active') {
          activeQuests.push({
            id: quest.id,
            title: quest.title,
            description: quest.description,
            isMain: false,
            giver: quest.giver,
            isRelevantToNPC: this._isQuestRelevantToNPC(quest, npc)
          });

          if (this._isQuestRelevantToNPC(quest, npc)) {
            relevantQuests.push(quest.title);
          }
        }
      });
    }

    return {
      activeQuests,
      relevantQuests,
      hasRelevantQuests: relevantQuests.length > 0
    };
  }

  /**
   * Check if a quest is relevant to an NPC
   * @private
   */
  _isQuestRelevantToNPC(quest, npc) {
    // Quest giver
    if (quest.giver === npc.name) {
      return true;
    }

    // Quest mentions NPC
    if (quest.description?.includes(npc.name)) {
      return true;
    }

    // Quest involves NPC's specialty
    if (npc.knowledge?.specialties) {
      for (const specialty of npc.knowledge.specialties) {
        if (quest.title?.toLowerCase().includes(specialty.toLowerCase()) ||
            quest.description?.toLowerCase().includes(specialty.toLowerCase())) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Build relationship context
   * @private
   */
  _buildRelationshipContext(npc, player) {
    if (!npc.relationships) {
      return {
        level: 0,
        description: 'stranger',
        hasRelationship: false
      };
    }

    const level = npc.relationships.getRelationship(player.id) || 0;
    const description = this._getRelationshipDescription(level);

    return {
      level,
      description,
      hasRelationship: level !== 0
    };
  }

  /**
   * Build gossip and reputation context
   * @private
   */
  _buildGossipContext(npc, player, options) {
    const context = {
      hasGossip: false,
      recentGossip: [],
      opinion: null,
      reputation: null
    };

    // Get gossip network from options or world
    const gossipNetwork = options.gossipNetwork || this.world.gossipNetwork;
    if (!gossipNetwork) {
      return context;
    }

    // Get recent gossip NPC knows
    const recentGossip = gossipNetwork.getRecentGossip(npc.id, 3);
    if (recentGossip.length > 0) {
      context.hasGossip = true;
      context.recentGossip = recentGossip.map(g => ({
        description: g.description,
        type: g.type,
        importance: g.importance,
        age: Math.floor((Date.now() - g.timestamp) / 60000) // minutes ago
      }));
    }

    // Get reputation system from options or world
    const reputationSystem = options.reputationSystem || this.world.reputationSystem;
    if (reputationSystem) {
      const opinion = reputationSystem.getOpinion(npc.id, player.id);
      if (opinion.overall !== 0 || opinion.reasons.length > 0) {
        context.opinion = {
          overall: opinion.overall,
          traits: opinion.traits,
          reasons: opinion.reasons.slice(-2).map(r => r.reason), // Last 2 reasons
          dominantTrait: reputationSystem.getDominantTrait(npc.id, player.id)
        };
      }

      // Get overall reputation
      context.reputation = gossipNetwork.getReputation(player.id);
    }

    return context;
  }

  /**
   * Get relationship description from level
   * @private
   */
  _getRelationshipDescription(level) {
    if (level >= 80) return 'close friend';
    if (level >= 50) return 'friend';
    if (level >= 20) return 'friendly acquaintance';
    if (level >= -20) return 'neutral';
    if (level >= -50) return 'unfriendly';
    if (level >= -80) return 'hostile';
    return 'enemy';
  }

  /**
   * Determine what services an NPC provides based on their role
   * @private
   */
  _determineServices(role) {
    const serviceMap = {
      'Blacksmith': ['Weapon and armor repair', 'Custom weapon forging', 'Metal working'],
      'Traveling Merchant': ['Rare goods trading', 'Item appraisal', 'Information brokering'],
      'Tavern Keeper': ['Food and lodging', 'Local gossip', 'Job board access'],
      'Guard': ['Town security', 'Protection services', 'Legal information'],
      'Healer': ['Healing services', 'Potion crafting', 'Disease treatment'],
      'Scholar': ['Research assistance', 'Book lending', 'Ancient lore'],
      'Farmer': ['Food supplies', 'Local produce', 'Farm work opportunities'],
      'Hunter': ['Hunting guides', 'Wildlife tracking', 'Leather goods'],
      'Priest': ['Blessings', 'Religious guidance', 'Sanctuary'],
      'Thief': ['Lockpicking', 'Underworld contacts', 'Stealth training']
    };

    return serviceMap[role] || ['General conversation', 'Local information'];
  }

  /**
   * Summarize personality for context
   * @private
   */
  _summarizePersonality(personality) {
    if (!personality) return { traits: [], summary: 'neutral' };

    const traits = [];
    const summary = [];

    if (personality.friendliness > 70) {
      traits.push('very friendly');
      summary.push('warm and welcoming');
    } else if (personality.friendliness > 50) {
      traits.push('friendly');
      summary.push('pleasant');
    } else if (personality.friendliness < 30) {
      traits.push('unfriendly');
      summary.push('cold and distant');
    }

    if (personality.intelligence > 70) {
      traits.push('intelligent');
      summary.push('sharp-minded');
    }

    if (personality.caution > 70) {
      traits.push('cautious');
      summary.push('careful with words');
    } else if (personality.caution < 30) {
      traits.push('bold');
      summary.push('speaks freely');
    }

    if (personality.honor > 70) {
      traits.push('honorable');
      summary.push('trustworthy');
    }

    if (personality.greed > 70) {
      traits.push('greedy');
      summary.push('motivated by profit');
    }

    return {
      traits,
      summary: summary.join(', ') || 'neutral',
      raw: personality
    };
  }

  /**
   * Build prompt string from context
   * @param {Object} context - Context from buildContext()
   * @param {Object} options - Additional options
   * @returns {string} Formatted prompt for LLM
   */
  buildPrompt(context, options = {}) {
    const parts = [];

    // Character identity
    parts.push(`You are ${context.npc.name}, ${context.npc.role}.`);

    if (context.npc.background) {
      parts.push(`\nBackground: ${context.npc.background}`);
    }

    // Services offered
    if (context.npc.services && context.npc.services.length > 0) {
      parts.push(`\nServices you offer: ${context.npc.services.join(', ')}`);
    }

    // Personality
    if (context.npc.personality.summary) {
      parts.push(`\nPersonality: ${context.npc.personality.summary}`);
    }

    // Current state
    if (context.npc.mood && context.npc.mood !== 'neutral') {
      parts.push(`\nCurrent mood: ${context.npc.mood}`);
    }

    if (context.npc.currentConcern) {
      parts.push(`\nCurrent concern: ${context.npc.currentConcern}`);
    }

    // Location context
    parts.push(`\nLocation: ${context.location.name}`);
    if (context.location.atmosphere && context.location.atmosphere !== 'normal') {
      parts.push(`Atmosphere: ${context.location.atmosphere}`);
    }

    // Knowledge section - ENHANCED!
    if (context.knowledge.hasKnowledge) {
      parts.push('\n--- Your Knowledge ---');

      if (context.knowledge.specialties.length > 0) {
        parts.push(`You are knowledgeable about: ${context.knowledge.specialties.join(', ')}`);
      }

      if (context.knowledge.locations && context.knowledge.locations.length > 0) {
        parts.push('\nLocations you know about:');
        context.knowledge.locations.forEach((location, i) => {
          parts.push(`${i + 1}. ${location}`);
        });
      }

      if (context.knowledge.rumors.length > 0) {
        parts.push('\nRumors you have heard:');
        context.knowledge.rumors.forEach((rumor, i) => {
          parts.push(`${i + 1}. ${rumor}`);
        });
      }

      if (context.knowledge.secrets.length > 0) {
        parts.push('\nSecrets you know (be careful who you tell):');
        context.knowledge.secrets.forEach((secret, i) => {
          parts.push(`${i + 1}. ${secret}`);
        });
      }
    }

    // Location narrative fuel
    if (context.location.hasNarrativeFuel && context.location.narrativeFuel) {
      const fuel = context.location.narrativeFuel;

      if (fuel.commonKnowledge.length > 0) {
        parts.push('\n--- Common Knowledge About Nearby Places ---');
        fuel.commonKnowledge.forEach(fact => {
          parts.push(`- ${fact}`);
        });
      }

      // Check if this NPC is a specialist for other locations
      const otherLocations = this._getLocationsWhereNPCIsSpecialist(context.npc.name);
      if (otherLocations.length > 0) {
        parts.push('\n--- Places You Know Well ---');
        otherLocations.forEach(loc => {
          parts.push(`- ${loc.name}: ${loc.knowledge}`);
        });
      }
    }

    // Quest context
    if (context.quests.hasRelevantQuests) {
      parts.push('\n--- Relevant Quests ---');
      context.quests.activeQuests
        .filter(q => q.isRelevantToNPC)
        .forEach(quest => {
          if (quest.giver === context.npc.name) {
            parts.push(`- "${quest.title}" - You gave this quest`);
          } else {
            parts.push(`- "${quest.title}" - This is relevant to you`);
          }
          if (quest.currentObjectives && quest.currentObjectives.length > 0) {
            parts.push(`  Current objectives: ${quest.currentObjectives.join('; ')}`);
          }
        });
    }

    // Gossip and Reputation
    if (context.gossip && context.gossip.hasGossip) {
      parts.push('\n--- Recent Gossip You\'ve Heard ---');
      context.gossip.recentGossip.forEach(g => {
        parts.push(`- (${g.age} minutes ago) ${g.description}`);
      });
    }

    // Opinion of the player
    if (context.gossip && context.gossip.opinion) {
      parts.push(`\n--- Your Opinion of ${context.player.name} ---`);
      const op = context.gossip.opinion;
      
      if (op.overall > 20) {
        parts.push(`You think positively of them (${op.overall}/100).`);
      } else if (op.overall < -20) {
        parts.push(`You think negatively of them (${op.overall}/100).`);
      } else {
        parts.push(`You have a neutral opinion of them (${op.overall}/100).`);
      }

      if (op.dominantTrait && op.dominantTrait !== 'unknown') {
        parts.push(`You believe they are: ${op.dominantTrait}`);
      }

      if (op.reasons && op.reasons.length > 0) {
        parts.push('This is based on:');
        op.reasons.forEach(reason => {
          parts.push(`- They ${reason}`);
        });
      }
    }

    // Player's reputation
    if (context.gossip && context.gossip.reputation) {
      const rep = context.gossip.reputation;
      const repItems = [];
      
      if (rep.hero > 20) repItems.push('known for helping others');
      if (rep.fighter > 20) repItems.push('reputed as a fighter');
      if (rep.social > 20) repItems.push('well-connected socially');
      if (rep.explorer > 20) repItems.push('known as an explorer');
      
      if (repItems.length > 0) {
        parts.push(`\nWhat people say about ${context.player.name}: ${repItems.join(', ')}`);
      }
    }

    // Relationship
    parts.push(`\n--- Relationship with ${context.player.name} ---`);
    parts.push(`You view them as: ${context.relationship.description} (${context.relationship.level})`);

    // Conversation history
    if (context.conversationHistory && context.conversationHistory.length > 0) {
      parts.push('\n--- Conversation So Far ---');
      context.conversationHistory.forEach(line => {
        parts.push(line);
      });
    }

    // Instructions
    parts.push('\n--- Instructions ---');

    if (options.isGreeting) {
      parts.push(`Greet ${context.player.name} naturally. Reference your current concern if you have one.`);
      parts.push('Occasionally mention interesting locations, rumors, or services you offer.');
      parts.push('Keep it brief (1-2 sentences) and in character.');
    } else if (options.playerSaid) {
      parts.push(`${context.player.name} says: "${options.playerSaid}"`);
      parts.push('\nRespond naturally as your character would. Stay in character.');
      parts.push('If they ask about something you know about, share your knowledge.');
      parts.push('If they ask about locations/cities/dungeons, mention what you know from your knowledge.');
      parts.push('If they ask about rumors, share what you have heard.');
      parts.push('If they ask about quests, provide relevant information.');
      parts.push('If they seem interested in trading or services, mention what you can offer.');
      parts.push('Naturally weave in information about the world, other locations, and things happening around.');
      parts.push('Keep your response concise (1-3 sentences).');
    }

    return parts.join('\n');
  }

  /**
   * Get locations where this NPC is listed as a specialist
   * @private
   */
  _getLocationsWhereNPCIsSpecialist(npcName) {
    const locations = [];

    for (const [id, location] of this.world.locations.entries()) {
      const fuel = location.customProperties?.narrativeFuel;
      if (fuel && fuel.specialists?.includes(npcName)) {
        // This NPC knows about this location
        let knowledge = [];

        if (fuel.commonKnowledge) {
          knowledge = fuel.commonKnowledge;
        }

        locations.push({
          id,
          name: location.name,
          knowledge: knowledge.join('; ') || 'General knowledge'
        });
      }
    }

    return locations;
  }

  /**
   * Format context for debugging
   * @param {Object} context
   * @returns {string}
   */
  formatDebugOutput(context) {
    return JSON.stringify(context, null, 2);
  }
}

export default DialogueContextBuilder;
