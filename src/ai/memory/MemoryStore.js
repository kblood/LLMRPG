import { Memory } from './Memory.js';

/**
 * Memory storage and retrieval system
 * Manages all memories for a character with decay and relevance scoring
 * 
 * @class MemoryStore
 */
export class MemoryStore {
  /**
   * Create a memory store
   * @param {string} characterId - Owner character ID
   * @param {Object} options - Configuration options
   */
  constructor(characterId, options = {}) {
    this.characterId = characterId;
    this.memories = [];
    this.maxMemories = options.maxMemories || 100;
    this.minRelevance = options.minRelevance || 10; // Forget memories below this
    this.lastUpdate = Date.now();
  }

  /**
   * Add a new memory
   * @param {string} type - Memory type
   * @param {string} content - Memory content
   * @param {Object} options - Additional options
   * @returns {Memory} Created memory
   */
  addMemory(type, content, options = {}) {
    const memory = new Memory({
      type,
      content,
      ...options
    });

    this.memories.push(memory);

    // Cleanup if too many memories
    if (this.memories.length > this.maxMemories) {
      this.cleanup();
    }

    return memory;
  }

  /**
   * Get recent memories
   * @param {number} count - Number of memories to retrieve
   * @returns {Memory[]} Most recent memories
   */
  getRecentMemories(count = 5) {
    return [...this.memories]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count)
      .map(m => {
        m.access();
        return m;
      });
  }

  /**
   * Get most relevant memories
   * @param {number} count - Number of memories to retrieve
   * @param {number} currentTime - Current game time
   * @returns {Memory[]} Most relevant memories
   */
  getRelevantMemories(count = 5, currentTime = Date.now()) {
    // Update relevance for all memories
    this.memories.forEach(m => m.calculateRelevance(currentTime));

    return [...this.memories]
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, count)
      .map(m => {
        m.access();
        return m;
      });
  }

  /**
   * Get memories about a specific character
   * @param {string} characterId - Character to search for
   * @param {number} count - Number of memories to retrieve
   * @returns {Memory[]} Memories involving that character
   */
  getMemoriesAbout(characterId, count = 5) {
    return this.memories
      .filter(m => m.involvesCharacter(characterId))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, count)
      .map(m => {
        m.access();
        return m;
      });
  }

  /**
   * Get memories by type
   * @param {string} type - Memory type
   * @param {number} count - Number of memories to retrieve
   * @returns {Memory[]} Memories of that type
   */
  getMemoriesByType(type, count = 10) {
    return this.memories
      .filter(m => m.type === type)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, count)
      .map(m => {
        m.access();
        return m;
      });
  }

  /**
   * Search memories by query
   * @param {string} query - Search query
   * @param {number} count - Number of memories to retrieve
   * @returns {Memory[]} Matching memories
   */
  searchMemories(query, count = 10) {
    return this.memories
      .filter(m => m.matches(query))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, count)
      .map(m => {
        m.access();
        return m;
      });
  }

  /**
   * Get all memories (for debugging)
   * @returns {Memory[]}
   */
  getAllMemories() {
    return [...this.memories];
  }

  /**
   * Update memory relevance scores
   * Called periodically by character update
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    const currentTime = Date.now();
    
    // Update relevance for all memories
    this.memories.forEach(m => m.calculateRelevance(currentTime));

    // Periodic cleanup (every ~1 minute of game time)
    if (currentTime - this.lastUpdate > 60000) {
      this.cleanup();
      this.lastUpdate = currentTime;
    }
  }

  /**
   * Remove low-relevance memories to maintain performance
   */
  cleanup() {
    const currentTime = Date.now();

    // Remove memories below minimum relevance
    this.memories = this.memories.filter(m => {
      m.calculateRelevance(currentTime);
      return m.relevance >= this.minRelevance;
    });

    // If still over limit, remove least relevant
    if (this.memories.length > this.maxMemories) {
      this.memories.sort((a, b) => b.relevance - a.relevance);
      this.memories = this.memories.slice(0, this.maxMemories);
    }
  }

  /**
   * Format memories for LLM prompt
   * @param {Memory[]} memories - Memories to format
   * @returns {string} Formatted string
   */
  formatForPrompt(memories) {
    if (memories.length === 0) {
      return 'No relevant memories.';
    }

    return memories
      .map((m, i) => `${i + 1}. ${m.toPromptString()}`)
      .join('\n');
  }

  /**
   * Get memory statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const currentTime = Date.now();
    
    return {
      total: this.memories.length,
      byType: Memory.TYPE.reduce((acc, type) => {
        acc[type] = this.memories.filter(m => m.type === type).length;
        return acc;
      }, {}),
      averageRelevance: this.memories.reduce((sum, m) => {
        m.calculateRelevance(currentTime);
        return sum + m.relevance;
      }, 0) / this.memories.length || 0
    };
  }

  /**
   * Convert to plain object
   * @returns {Object}
   */
  toJSON() {
    return {
      characterId: this.characterId,
      memories: this.memories.map(m => m.toJSON()),
      maxMemories: this.maxMemories,
      minRelevance: this.minRelevance
    };
  }

  /**
   * Create from plain object
   * @param {Object} obj
   * @returns {MemoryStore}
   */
  static fromJSON(obj) {
    const store = new MemoryStore(obj.characterId, {
      maxMemories: obj.maxMemories,
      minRelevance: obj.minRelevance
    });

    store.memories = obj.memories.map(m => Memory.fromJSON(m));

    return store;
  }
}

export default MemoryStore;
