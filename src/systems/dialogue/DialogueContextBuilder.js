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
        background: npc.backstory || npc.background || ''
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
    if (!npc.knowledge) {
      return {
        specialties: [],
        rumors: [],
        secrets: [],
        hasKnowledge: false
      };
    }

    return {
      specialties: npc.knowledge.specialties || [],
      rumors: npc.knowledge.rumors || [],
      secrets: npc.knowledge.secrets || [],
      hasKnowledge: (npc.knowledge.specialties?.length > 0) ||
                    (npc.knowledge.rumors?.length > 0) ||
                    (npc.knowledge.secrets?.length > 0)
    };
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
      parts.push('Keep it brief (1-2 sentences) and in character.');
    } else if (options.playerSaid) {
      parts.push(`${context.player.name} says: "${options.playerSaid}"`);
      parts.push('\nRespond naturally as your character would. Stay in character.');
      parts.push('If they ask about something you know about, share your knowledge.');
      parts.push('If they ask about rumors, share what you have heard.');
      parts.push('If they ask about quests, provide relevant information.');
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
