/**
 * Reputation System
 * Tracks per-NPC opinions about characters based on actions and gossip
 * Different NPCs may view the same action differently based on their personality
 * 
 * @class ReputationSystem
 */
export class ReputationSystem {
  /**
   * Create a reputation system
   * @param {GossipNetwork} gossipNetwork - Associated gossip network
   */
  constructor(gossipNetwork) {
    this.gossipNetwork = gossipNetwork;
    this.opinions = new Map(); // npcId -> Map(characterId -> opinion object)
  }

  /**
   * Get NPC's opinion of a character
   * @param {string} npcId - NPC judging
   * @param {string} characterId - Character being judged
   * @returns {Object} Opinion data
   */
  getOpinion(npcId, characterId) {
    if (!this.opinions.has(npcId)) {
      this.opinions.set(npcId, new Map());
    }
    
    const npcOpinions = this.opinions.get(npcId);
    
    if (!npcOpinions.has(characterId)) {
      npcOpinions.set(characterId, {
        overall: 0,
        traits: {
          trustworthy: 0,
          honorable: 0,
          helpful: 0,
          dangerous: 0,
          competent: 0
        },
        reasons: []
      });
    }
    
    return npcOpinions.get(characterId);
  }

  /**
   * Update NPC's opinion based on an action
   * @param {string} npcId - NPC judging
   * @param {string} characterId - Character who acted
   * @param {Object} action - Action details
   * @param {Character} npc - NPC character object (for personality filtering)
   */
  updateOpinion(npcId, characterId, action, npc) {
    const opinion = this.getOpinion(npcId, characterId);
    
    // Different NPCs react differently based on personality
    const personality = npc.personality;
    
    // Calculate opinion changes based on action type and NPC personality
    let change = 0;
    const traitChanges = {};
    let reason = '';

    switch (action.type) {
      case 'quest_completed':
        // Honorable NPCs respect quest completion more
        change = 5 + (personality.honor / 20);
        traitChanges.helpful = 5;
        traitChanges.competent = 5;
        traitChanges.trustworthy = 3;
        reason = `completed the quest "${action.questTitle}"`;
        break;

      case 'quest_failed':
        // Cautious NPCs judge failures harshly
        change = -3 - (personality.caution / 20);
        traitChanges.competent = -5;
        traitChanges.trustworthy = -2;
        reason = `failed the quest "${action.questTitle}"`;
        break;

      case 'combat':
        // Aggressive NPCs respect combat prowess
        // Friendly NPCs may dislike violence
        if (personality.aggression > 60) {
          change = 3;
          traitChanges.dangerous = 5;
          traitChanges.competent = 3;
        } else if (personality.friendliness > 70) {
          change = -2;
          traitChanges.dangerous = 3;
        } else {
          change = 1;
          traitChanges.competent = 2;
        }
        reason = 'won a fight';
        break;

      case 'helped_npc':
        // Friendly NPCs appreciate help
        change = 3 + (personality.friendliness / 20);
        traitChanges.helpful = 7;
        traitChanges.trustworthy = 4;
        reason = `helped ${action.targetName}`;
        break;

      case 'betrayed_npc':
        // Everyone dislikes betrayal, especially honorable NPCs
        change = -10 - (personality.honor / 10);
        traitChanges.trustworthy = -10;
        traitChanges.honorable = -8;
        reason = `betrayed ${action.targetName}`;
        break;

      case 'stole':
        // Greedy NPCs might be impressed, honorable NPCs disgusted
        if (personality.greed > 60) {
          change = 1;
          traitChanges.competent = 2;
        } else if (personality.honor > 60) {
          change = -5;
          traitChanges.honorable = -7;
          traitChanges.trustworthy = -5;
        }
        reason = 'was caught stealing';
        break;

      case 'defended_innocent':
        // Honorable and friendly NPCs appreciate this
        if (personality.honor > 50 || personality.friendliness > 50) {
          change = 5;
          traitChanges.honorable = 6;
          traitChanges.helpful = 4;
        }
        reason = 'defended an innocent person';
        break;

      case 'discovered_secret':
        // Intelligent NPCs are impressed by discoveries
        change = 1 + (personality.intelligence / 30);
        traitChanges.competent = 3;
        reason = 'discovered an important secret';
        break;

      case 'paid_debt':
        // Honorable NPCs respect keeping promises
        change = 2 + (personality.honor / 25);
        traitChanges.trustworthy = 4;
        traitChanges.honorable = 3;
        reason = 'paid back a debt';
        break;

      case 'broke_promise':
        // Honorable NPCs hate broken promises
        change = -4 - (personality.honor / 15);
        traitChanges.trustworthy = -6;
        traitChanges.honorable = -5;
        reason = 'broke a promise';
        break;

      default:
        // Unknown action type
        return;
    }

    // Apply changes
    opinion.overall = Math.max(-100, Math.min(100, opinion.overall + change));
    
    for (const [trait, delta] of Object.entries(traitChanges)) {
      opinion.traits[trait] = Math.max(-100, Math.min(100, opinion.traits[trait] + delta));
    }

    // Add reason
    opinion.reasons.push({
      timestamp: Date.now(),
      reason,
      change
    });

    // Keep only recent reasons (last 10)
    if (opinion.reasons.length > 10) {
      opinion.reasons = opinion.reasons.slice(-10);
    }
  }

  /**
   * Update all NPC opinions based on recent gossip
   * @param {Character[]} npcs - All NPCs
   * @param {string} aboutCharacterId - Character to update opinions about
   */
  updateFromGossip(npcs, aboutCharacterId) {
    for (const npc of npcs) {
      const gossip = this.gossipNetwork.getKnownEvents(npc.id);
      
      // Find gossip about the target character
      const relevantGossip = gossip.filter(g => 
        g.subject === aboutCharacterId && 
        !this.hasProcessedGossip(npc.id, g.id)
      );

      for (const gossipItem of relevantGossip) {
        this.updateOpinion(npc.id, aboutCharacterId, gossipItem, npc);
        this.markGossipProcessed(npc.id, gossipItem.id);
      }
    }
  }

  /**
   * Check if NPC has already formed an opinion from this gossip
   * @param {string} npcId - NPC ID
   * @param {string} gossipId - Gossip event ID
   * @returns {boolean}
   * @private
   */
  hasProcessedGossip(npcId, gossipId) {
    if (!this.processedGossip) {
      this.processedGossip = new Map();
    }
    
    if (!this.processedGossip.has(npcId)) {
      this.processedGossip.set(npcId, new Set());
    }
    
    return this.processedGossip.get(npcId).has(gossipId);
  }

  /**
   * Mark gossip as processed by NPC
   * @param {string} npcId - NPC ID
   * @param {string} gossipId - Gossip event ID
   * @private
   */
  markGossipProcessed(npcId, gossipId) {
    if (!this.processedGossip) {
      this.processedGossip = new Map();
    }
    
    if (!this.processedGossip.has(npcId)) {
      this.processedGossip.set(npcId, new Set());
    }
    
    this.processedGossip.get(npcId).add(gossipId);
  }

  /**
   * Get opinion summary for dialogue context
   * @param {string} npcId - NPC ID
   * @param {string} characterId - Character ID
   * @returns {string} Summary text
   */
  getOpinionSummary(npcId, characterId) {
    const opinion = this.getOpinion(npcId, characterId);
    
    if (opinion.overall === 0 && opinion.reasons.length === 0) {
      return '';
    }

    const lines = [];
    
    // Overall opinion
    if (opinion.overall > 50) {
      lines.push('You think highly of them.');
    } else if (opinion.overall > 20) {
      lines.push('You have a positive opinion of them.');
    } else if (opinion.overall < -50) {
      lines.push('You strongly distrust them.');
    } else if (opinion.overall < -20) {
      lines.push('You have a negative opinion of them.');
    }

    // Notable traits
    const notableTraits = Object.entries(opinion.traits)
      .filter(([_, value]) => Math.abs(value) > 30)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 2);

    if (notableTraits.length > 0) {
      const traitDescriptions = notableTraits.map(([trait, value]) => {
        if (value > 0) {
          return `very ${trait}`;
        } else {
          return `not ${trait}`;
        }
      });
      lines.push(`You believe they are ${traitDescriptions.join(' and ')}.`);
    }

    // Recent reasons
    if (opinion.reasons.length > 0) {
      const recentReasons = opinion.reasons.slice(-3);
      lines.push('This is because:');
      recentReasons.forEach(r => {
        lines.push(`- They ${r.reason}`);
      });
    }

    return lines.join('\n');
  }

  /**
   * Get the dominant reputation trait
   * @param {string} npcId - NPC ID
   * @param {string} characterId - Character ID
   * @returns {string} Dominant trait name
   */
  getDominantTrait(npcId, characterId) {
    const opinion = this.getOpinion(npcId, characterId);
    
    let maxTrait = 'unknown';
    let maxValue = 0;
    
    for (const [trait, value] of Object.entries(opinion.traits)) {
      if (Math.abs(value) > Math.abs(maxValue)) {
        maxValue = value;
        maxTrait = trait;
      }
    }
    
    return maxValue > 10 ? maxTrait : 'unknown';
  }

  /**
   * Serialize to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      opinions: Array.from(this.opinions.entries()).map(([npcId, opinions]) => ({
        npcId,
        opinions: Array.from(opinions.entries()).map(([charId, opinion]) => ({
          characterId: charId,
          ...opinion
        }))
      })),
      processedGossip: this.processedGossip ? 
        Array.from(this.processedGossip.entries()).map(([npcId, gossipIds]) => ({
          npcId,
          gossipIds: Array.from(gossipIds)
        })) : []
    };
  }

  /**
   * Deserialize from JSON
   * @param {Object} data - Serialized data
   * @param {GossipNetwork} gossipNetwork - Gossip network instance
   * @returns {ReputationSystem}
   */
  static fromJSON(data, gossipNetwork) {
    const system = new ReputationSystem(gossipNetwork);
    
    if (data.opinions) {
      data.opinions.forEach(({ npcId, opinions }) => {
        const npcOpinions = new Map();
        opinions.forEach(({ characterId, ...opinion }) => {
          npcOpinions.set(characterId, opinion);
        });
        system.opinions.set(npcId, npcOpinions);
      });
    }
    
    if (data.processedGossip) {
      system.processedGossip = new Map();
      data.processedGossip.forEach(({ npcId, gossipIds }) => {
        system.processedGossip.set(npcId, new Set(gossipIds));
      });
    }
    
    return system;
  }
}
