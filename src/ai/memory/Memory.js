/**
 * Single memory object
 * Represents one memory stored by a character
 * 
 * @class Memory
 */
export class Memory {
  static TYPE = {
    DIALOGUE: 'dialogue',
    EVENT: 'event',
    BACKGROUND: 'background',
    OBSERVATION: 'observation',
    CONCERN: 'concern',
    GOAL: 'goal'
  };

  /**
   * Create a memory
   * @param {Object} options - Memory options
   */
  constructor(options = {}) {
    this.id = options.id || `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.type = options.type || Memory.TYPE.EVENT;
    this.content = options.content || '';
    this.importance = options.importance || 50; // 0-100
    this.timestamp = options.timestamp || Date.now();
    this.participants = options.participants || []; // Character IDs involved
    this.location = options.location || null;
    this.emotions = options.emotions || []; // Tags like 'happy', 'angry', etc.
    this.tags = options.tags || []; // Custom tags for filtering
    
    // Decay tracking
    this.relevance = options.relevance || this.importance;
    this.accessCount = options.accessCount || 0;
    this.lastAccessed = options.lastAccessed || this.timestamp;
  }

  /**
   * Access this memory (updates access tracking)
   */
  access() {
    this.accessCount++;
    this.lastAccessed = Date.now();
  }

  /**
   * Calculate relevance score based on time decay and importance
   * @param {number} currentTime - Current game time in ms
   * @returns {number} Relevance score (0-100)
   */
  calculateRelevance(currentTime) {
    const ageMs = currentTime - this.timestamp;
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    
    // Decay function: relevance = importance * e^(-decay * age)
    // High importance memories decay slower
    const decayRate = 0.1 / (this.importance / 50); // Slower decay for important memories
    const decayFactor = Math.exp(-decayRate * ageDays);
    
    // Access frequency boosts relevance
    const accessBonus = Math.min(this.accessCount * 2, 20);
    
    this.relevance = Math.max(0, Math.min(100, this.importance * decayFactor + accessBonus));
    return this.relevance;
  }

  /**
   * Check if memory is about a specific character
   * @param {string} characterId
   * @returns {boolean}
   */
  involvesCharacter(characterId) {
    return this.participants.includes(characterId);
  }

  /**
   * Check if memory matches search terms
   * @param {string} query - Search query
   * @returns {boolean}
   */
  matches(query) {
    const lowerQuery = query.toLowerCase();
    return this.content.toLowerCase().includes(lowerQuery) ||
           this.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
           this.emotions.some(emotion => emotion.toLowerCase().includes(lowerQuery));
  }

  /**
   * Format for LLM prompts
   * @returns {string}
   */
  toPromptString() {
    const parts = [this.content];
    
    if (this.participants.length > 0) {
      parts.push(`(involving ${this.participants.join(', ')})`);
    }
    
    if (this.emotions.length > 0) {
      parts.push(`[felt: ${this.emotions.join(', ')}]`);
    }
    
    return parts.join(' ');
  }

  /**
   * Convert to plain object
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      content: this.content,
      importance: this.importance,
      timestamp: this.timestamp,
      participants: this.participants,
      location: this.location,
      emotions: this.emotions,
      tags: this.tags,
      relevance: this.relevance,
      accessCount: this.accessCount,
      lastAccessed: this.lastAccessed
    };
  }

  /**
   * Create from plain object
   * @param {Object} obj
   * @returns {Memory}
   */
  static fromJSON(obj) {
    return new Memory(obj);
  }
}

export default Memory;
