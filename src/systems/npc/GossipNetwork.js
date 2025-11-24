import { EventBus } from '../../services/EventBus.js';

/**
 * Gossip Network System
 * NPCs share information about player actions and events through their social network
 * Information spreads based on relationships and time
 * 
 * @class GossipNetwork
 */
export class GossipNetwork {
  /**
   * Create a gossip network
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.events = []; // All gossip-worthy events
    this.spread = new Map(); // eventId -> Set of characterIds who know about it
    this.propagationDelay = options.propagationDelay || 300000; // 5 minutes default
    this.decayTime = options.decayTime || 3600000; // 1 hour until forgotten
    this.maxEvents = options.maxEvents || 50;
    
    // Listen for gossip-worthy events
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for gossip-worthy actions
   * @private
   */
  setupEventListeners() {
    const eventBus = EventBus.getInstance();
    
    // Quest-related events
    eventBus.on('quest:accepted', (data) => {
      this.addEvent({
        type: 'quest_accepted',
        subject: data.characterId,
        questId: data.questId,
        questTitle: data.questTitle,
        importance: 70,
        description: `${data.characterName} accepted the quest "${data.questTitle}"`
      });
    });

    eventBus.on('quest:completed', (data) => {
      this.addEvent({
        type: 'quest_completed',
        subject: data.characterId,
        questId: data.questId,
        questTitle: data.questTitle,
        importance: 90,
        description: `${data.characterName} completed the quest "${data.questTitle}"`
      });
    });

    // Dialogue events
    eventBus.on('dialogue:ended', (data) => {
      // Only gossip about interesting conversations
      if (data.turnCount >= 3) {
        this.addEvent({
          type: 'conversation',
          subject: data.characterId,
          target: data.npcId,
          importance: 40,
          description: `${data.characterName} had a long conversation with ${data.npcName}`
        });
      }
    });

    // Combat events
    eventBus.on('combat:ended', (data) => {
      this.addEvent({
        type: 'combat',
        subject: data.winnerId,
        target: data.loserId,
        importance: 80,
        description: `${data.winnerName} defeated ${data.loserName} in combat`
      });
    });

    // Relationship changes
    eventBus.on('relationship:major_change', (data) => {
      if (Math.abs(data.change) >= 20) {
        this.addEvent({
          type: 'relationship_change',
          subject: data.characterId,
          target: data.targetId,
          change: data.change,
          importance: 60,
          description: `${data.characterName}'s relationship with ${data.targetName} changed significantly`
        });
      }
    });

    // Location events
    eventBus.on('location:discovered', (data) => {
      this.addEvent({
        type: 'discovery',
        subject: data.characterId,
        locationId: data.locationId,
        importance: 50,
        description: `${data.characterName} discovered ${data.locationName}`
      });
    });

    // Item events
    eventBus.on('item:acquired', (data) => {
      if (data.rarity && data.rarity >= 3) { // Rare or better
        this.addEvent({
          type: 'item_acquired',
          subject: data.characterId,
          itemId: data.itemId,
          importance: 65,
          description: `${data.characterName} acquired a rare item: ${data.itemName}`
        });
      }
    });
  }

  /**
   * Add a new gossip-worthy event
   * @param {Object} eventData - Event information
   * @returns {string} Event ID
   */
  addEvent(eventData) {
    const event = {
      id: `gossip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...eventData
    };

    this.events.push(event);
    
    // Initialize spread tracking - subject knows immediately
    this.spread.set(event.id, new Set([event.subject]));
    
    // If there's a target, they also know
    if (event.target) {
      this.spread.get(event.id).add(event.target);
    }

    // Cleanup old events
    if (this.events.length > this.maxEvents) {
      this.cleanup();
    }

    return event.id;
  }

  /**
   * Propagate gossip between characters based on relationships
   * @param {Character[]} characters - All characters in the world
   * @param {number} currentTime - Current game time
   */
  propagate(characters, currentTime = Date.now()) {
    const characterMap = new Map(characters.map(c => [c.id, c]));

    for (const event of this.events) {
      // Skip if event is too old
      if (currentTime - event.timestamp > this.decayTime) {
        continue;
      }

      // Skip if too recent to have spread
      if (currentTime - event.timestamp < this.propagationDelay) {
        continue;
      }

      const knowers = this.spread.get(event.id);
      const newKnowers = new Set();

      // For each character who knows
      for (const knowerId of knowers) {
        const knower = characterMap.get(knowerId);
        if (!knower) continue;

        // Find their friends who might hear about it
        for (const [otherId, relationship] of knower.relationships.relationships) {
          // Only share with friends (relationship >= 20)
          if (relationship >= 20 && !knowers.has(otherId)) {
            const other = characterMap.get(otherId);
            if (!other) continue;

            // Chance to spread based on:
            // 1. Relationship strength (higher = more likely)
            // 2. Event importance (higher = more likely to share)
            // 3. Time since event (older = more likely to have spread)
            
            const relationshipFactor = relationship / 100; // 0.2 to 1.0
            const importanceFactor = event.importance / 100; // 0.4 to 1.0
            const timeFactor = Math.min(1.0, (currentTime - event.timestamp) / this.propagationDelay);
            
            const spreadChance = relationshipFactor * importanceFactor * timeFactor * 0.5;
            
            if (Math.random() < spreadChance) {
              newKnowers.add(otherId);
              
              // Add to their memory
              other.memory.addMemory('gossip', event.description, {
                importance: event.importance,
                relatedCharacters: [event.subject, event.target].filter(Boolean),
                metadata: { eventId: event.id, source: knowerId }
              });
            }
          }
        }
      }

      // Add new knowers to the spread set
      newKnowers.forEach(id => knowers.add(id));
    }
  }

  /**
   * Check if a character knows about an event
   * @param {string} characterId - Character ID
   * @param {string} eventId - Event ID
   * @returns {boolean}
   */
  characterKnows(characterId, eventId) {
    const knowers = this.spread.get(eventId);
    return knowers ? knowers.has(characterId) : false;
  }

  /**
   * Get all events a character knows about
   * @param {string} characterId - Character ID
   * @returns {Object[]} Events the character knows
   */
  getKnownEvents(characterId) {
    return this.events.filter(event => 
      this.characterKnows(characterId, event.id)
    );
  }

  /**
   * Get recent gossip for a character to potentially mention
   * @param {string} characterId - Character ID
   * @param {number} count - Max number of gossip items
   * @returns {Object[]} Recent gossip items
   */
  getRecentGossip(characterId, count = 3) {
    const known = this.getKnownEvents(characterId);
    
    // Sort by recency and importance
    return known
      .sort((a, b) => {
        const scoreA = (Date.now() - a.timestamp) * 0.001 + a.importance;
        const scoreB = (Date.now() - b.timestamp) * 0.001 + b.importance;
        return scoreB - scoreA;
      })
      .slice(0, count);
  }

  /**
   * Get reputation score for a character based on gossip
   * @param {string} characterId - Character ID
   * @returns {Object} Reputation scores by category
   */
  getReputation(characterId) {
    const reputation = {
      hero: 0,      // Positive actions (quests, helping)
      fighter: 0,   // Combat victories
      social: 0,    // Relationships and conversations
      explorer: 0   // Discoveries
    };

    // Count events where character is the subject
    for (const event of this.events) {
      if (event.subject !== characterId) continue;

      switch (event.type) {
        case 'quest_completed':
          reputation.hero += 10;
          break;
        case 'quest_accepted':
          reputation.hero += 5;
          break;
        case 'combat':
          reputation.fighter += 8;
          break;
        case 'conversation':
          reputation.social += 3;
          break;
        case 'discovery':
          reputation.explorer += 7;
          break;
        case 'relationship_change':
          if (event.change > 0) reputation.social += 5;
          break;
      }
    }

    return reputation;
  }

  /**
   * Generate gossip context for NPC dialogue prompts
   * @param {string} characterId - NPC ID
   * @param {string} aboutCharacterId - Character being talked about
   * @returns {string} Gossip context text
   */
  generateGossipContext(characterId, aboutCharacterId) {
    const gossip = this.getRecentGossip(characterId, 5);
    const aboutGossip = gossip.filter(g => g.subject === aboutCharacterId);
    
    if (aboutGossip.length === 0) {
      return '';
    }

    const lines = ['Recent gossip you\'ve heard:'];
    aboutGossip.forEach(g => {
      const age = Math.floor((Date.now() - g.timestamp) / 60000); // minutes
      lines.push(`- (${age}m ago) ${g.description}`);
    });

    return lines.join('\n');
  }

  /**
   * Remove old events
   * @private
   */
  cleanup() {
    const currentTime = Date.now();
    const cutoff = currentTime - this.decayTime;

    // Remove old events
    this.events = this.events.filter(event => {
      if (event.timestamp < cutoff) {
        this.spread.delete(event.id);
        return false;
      }
      return true;
    });

    // Keep only the most recent if still over max
    if (this.events.length > this.maxEvents) {
      this.events.sort((a, b) => b.timestamp - a.timestamp);
      const toRemove = this.events.slice(this.maxEvents);
      toRemove.forEach(event => this.spread.delete(event.id));
      this.events = this.events.slice(0, this.maxEvents);
    }
  }

  /**
   * Serialize to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      events: this.events,
      spread: Array.from(this.spread.entries()).map(([eventId, knowers]) => ({
        eventId,
        knowers: Array.from(knowers)
      }))
    };
  }

  /**
   * Deserialize from JSON
   * @param {Object} data - Serialized data
   * @returns {GossipNetwork}
   */
  static fromJSON(data) {
    const network = new GossipNetwork();
    network.events = data.events || [];
    
    if (data.spread) {
      data.spread.forEach(({ eventId, knowers }) => {
        network.spread.set(eventId, new Set(knowers));
      });
    }
    
    return network;
  }
}
