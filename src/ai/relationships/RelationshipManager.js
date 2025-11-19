/**
 * Relationship management system
 * Tracks relationships between characters on a -100 to +100 scale
 * 
 * @class RelationshipManager
 */
export class RelationshipManager {
  /**
   * Create a relationship manager
   * @param {string} characterId - Owner character ID
   */
  constructor(characterId) {
    this.characterId = characterId;
    this.relationships = new Map(); // characterId -> relationship value
    this.history = new Map(); // characterId -> array of changes
  }

  /**
   * Get relationship level with another character
   * @param {string} characterId - Other character ID
   * @returns {number} Relationship value (-100 to +100)
   */
  getRelationship(characterId) {
    return this.relationships.get(characterId) || 0;
  }

  /**
   * Set relationship level
   * @param {string} characterId - Other character ID
   * @param {number} value - Relationship value (-100 to +100)
   */
  setRelationship(characterId, value) {
    const clamped = Math.max(-100, Math.min(100, value));
    const previous = this.getRelationship(characterId);
    
    this.relationships.set(characterId, clamped);

    // Track history
    if (!this.history.has(characterId)) {
      this.history.set(characterId, []);
    }
    
    this.history.get(characterId).push({
      timestamp: Date.now(),
      previous,
      new: clamped,
      change: clamped - previous
    });
  }

  /**
   * Modify relationship by delta
   * @param {string} characterId - Other character ID
   * @param {number} delta - Amount to change (-100 to +100)
   * @param {string} reason - Optional reason for change
   */
  modifyRelationship(characterId, delta, reason = null) {
    const current = this.getRelationship(characterId);
    const newValue = Math.max(-100, Math.min(100, current + delta));
    
    this.setRelationship(characterId, newValue);

    // Store reason if provided
    if (reason) {
      const history = this.history.get(characterId);
      if (history && history.length > 0) {
        history[history.length - 1].reason = reason;
      }
    }
  }

  /**
   * Get relationship level description
   * @param {string} characterId - Other character ID
   * @returns {string} Description
   */
  getRelationshipLevel(characterId) {
    const value = this.getRelationship(characterId);
    
    if (value >= 80) return 'Devoted Friend';
    if (value >= 60) return 'Good Friend';
    if (value >= 40) return 'Friendly';
    if (value >= 20) return 'Acquaintance';
    if (value >= -20) return 'Neutral';
    if (value >= -40) return 'Dislike';
    if (value >= -60) return 'Hostile';
    if (value >= -80) return 'Enemy';
    return 'Sworn Enemy';
  }

  /**
   * Get detailed relationship description for prompts
   * @param {string} characterId - Other character ID
   * @param {string} characterName - Other character name
   * @returns {string} Description
   */
  getRelationshipDescription(characterId, characterName) {
    const value = this.getRelationship(characterId);
    const level = this.getRelationshipLevel(characterId);
    
    const parts = [`${characterName}: ${level} (${value > 0 ? '+' : ''}${value})`];

    // Add recent changes
    const history = this.history.get(characterId);
    if (history && history.length > 0) {
      const recent = history.slice(-3); // Last 3 changes
      const totalChange = recent.reduce((sum, h) => sum + h.change, 0);
      
      if (totalChange > 0) {
        parts.push('- relationship improving');
      } else if (totalChange < 0) {
        parts.push('- relationship declining');
      }

      // Add reasons if available
      const reasons = recent
        .filter(h => h.reason)
        .map(h => h.reason);
      
      if (reasons.length > 0) {
        parts.push(`- recent: ${reasons.join(', ')}`);
      }
    }

    return parts.join(' ');
  }

  /**
   * Get all relationships
   * @returns {Object} Map of characterId to value
   */
  getAll() {
    const result = {};
    this.relationships.forEach((value, characterId) => {
      result[characterId] = value;
    });
    return result;
  }

  /**
   * Get all relationships with descriptions
   * @param {Function} getCharacterName - Function to get character name by ID
   * @returns {Array} Array of relationship descriptions
   */
  getAllDescriptions(getCharacterName) {
    const descriptions = [];
    
    this.relationships.forEach((value, characterId) => {
      const name = getCharacterName ? getCharacterName(characterId) : characterId;
      descriptions.push({
        characterId,
        name,
        value,
        level: this.getRelationshipLevel(characterId),
        description: this.getRelationshipDescription(characterId, name)
      });
    });

    return descriptions.sort((a, b) => b.value - a.value);
  }

  /**
   * Format relationships for LLM prompt
   * @param {Function} getCharacterName - Function to get character name by ID
   * @returns {string} Formatted string
   */
  formatForPrompt(getCharacterName) {
    if (this.relationships.size === 0) {
      return 'No established relationships.';
    }

    const descriptions = this.getAllDescriptions(getCharacterName);
    
    return descriptions
      .map(d => `- ${d.description}`)
      .join('\n');
  }

  /**
   * Get relationship history
   * @param {string} characterId - Other character ID
   * @returns {Array} History of changes
   */
  getHistory(characterId) {
    return this.history.get(characterId) || [];
  }

  /**
   * Check if knows character
   * @param {string} characterId - Other character ID
   * @returns {boolean} True if has any relationship
   */
  knowsCharacter(characterId) {
    return this.relationships.has(characterId);
  }

  /**
   * Get friends (relationship > 40)
   * @returns {string[]} Array of character IDs
   */
  getFriends() {
    const friends = [];
    this.relationships.forEach((value, characterId) => {
      if (value > 40) friends.push(characterId);
    });
    return friends;
  }

  /**
   * Get enemies (relationship < -40)
   * @returns {string[]} Array of character IDs
   */
  getEnemies() {
    const enemies = [];
    this.relationships.forEach((value, characterId) => {
      if (value < -40) enemies.push(characterId);
    });
    return enemies;
  }

  /**
   * Apply natural decay over time
   * Relationships slowly drift toward neutral if not interacted with
   * @param {number} deltaTime - Time since last update
   */
  applyDecay(deltaTime) {
    const decayRate = 0.1; // Points per day toward neutral
    const dayMs = 1000 * 60 * 60 * 24;
    const decayAmount = (deltaTime / dayMs) * decayRate;

    this.relationships.forEach((value, characterId) => {
      if (value > 0) {
        this.relationships.set(characterId, Math.max(0, value - decayAmount));
      } else if (value < 0) {
        this.relationships.set(characterId, Math.min(0, value + decayAmount));
      }
    });
  }

  /**
   * Convert to plain object
   * @returns {Object}
   */
  toJSON() {
    return {
      characterId: this.characterId,
      relationships: Object.fromEntries(this.relationships),
      history: Object.fromEntries(
        Array.from(this.history.entries()).map(([id, hist]) => [id, hist])
      )
    };
  }

  /**
   * Create from plain object
   * @param {Object} obj
   * @returns {RelationshipManager}
   */
  static fromJSON(obj) {
    const manager = new RelationshipManager(obj.characterId);
    
    manager.relationships = new Map(Object.entries(obj.relationships || {}));
    manager.history = new Map(Object.entries(obj.history || {}));

    return manager;
  }
}

export default RelationshipManager;
