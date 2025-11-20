import { Entity } from './Entity.js';
import { Personality } from '../ai/personality/Personality.js';
import { MemoryStore } from '../ai/memory/MemoryStore.js';
import { RelationshipManager } from '../ai/relationships/RelationshipManager.js';
import { CharacterStats } from '../systems/stats/CharacterStats.js';
import { Inventory } from '../systems/items/Inventory.js';
import { Equipment } from '../systems/items/Equipment.js';
import { AbilityManager } from '../systems/abilities/AbilityManager.js';
import { CombatAI } from '../systems/combat/CombatAI.js';

/**
 * Character entity - represents NPCs and the protagonist
 * Contains personality, memory, relationship systems, and RPG stats/combat systems
 *
 * @class Character
 * @extends Entity
 */
export class Character extends Entity {
  /**
   * Create a character
   * @param {string} id - Unique identifier
   * @param {string} name - Character display name
   * @param {Object} options - Additional options
   */
  constructor(id, name, options = {}) {
    super(id, 'character');
    
    this.name = name;
    this.role = options.role || 'npc'; // 'protagonist' or 'npc'
    
    // AI systems
    this.personality = options.personality || new Personality();
    this.memory = options.memory || new MemoryStore(id);
    this.relationships = options.relationships || new RelationshipManager(id);
    
    // Current state
    this.currentGoal = null;
    this.currentPlan = [];
    this.currentAction = null;
    this.emotionalState = 'neutral';
    
    // Dialogue state
    this.inConversation = false;
    this.conversationWith = null;
    
    // Backstory and description
    this.backstory = options.backstory || '';
    this.occupation = options.occupation || '';
    this.age = options.age || null;

    // Position and location
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.currentLocation = options.currentLocation || null; // Location ID

    // RPG Combat Systems
    this.stats = options.stats || null; // CharacterStats instance
    this.inventory = options.inventory || null; // Inventory instance
    this.equipment = options.equipment || null; // Equipment instance
    this.abilities = options.abilities || null; // AbilityManager instance

    // Combat AI (for NPCs)
    this.ai = options.ai || null; // CombatAI instance
  }

  /**
   * Get character's gold amount
   * @returns {number}
   */
  getGold() {
    return this.inventory ? this.inventory.gold : 0;
  }

  /**
   * Add gold to character
   * @param {number} amount
   */
  addGold(amount) {
    if (this.inventory) {
      this.inventory.addGold(amount);
    }
  }

  /**
   * Remove gold from character
   * @param {number} amount
   * @returns {boolean} Success
   */
  removeGold(amount) {
    if (this.inventory) {
      return this.inventory.removeGold(amount);
    }
    return false;
  }

  /**
   * Check if character has enough gold
   * @param {number} amount
   * @returns {boolean}
   */
  hasGold(amount) {
    return this.getGold() >= amount;
  }

  /**
   * Get character context for LLM prompts
   * @returns {Object} Context object
   */
  getContext() {
    const context = {
      id: this.id,
      name: this.name,
      role: this.role,
      personality: this.personality.toObject(),
      recentMemories: this.memory.getRecentMemories(5),
      relationships: this.relationships.getAll(),
      currentGoal: this.currentGoal,
      emotionalState: this.emotionalState,
      backstory: this.backstory,
      occupation: this.occupation,
      age: this.age
    };

    // Add combat stats if available
    if (this.stats) {
      context.level = this.stats.level;
      context.health = {
        current: this.stats.currentHP,
        max: this.stats.maxHP,
        percentage: this.stats.currentHP / this.stats.maxHP
      };
      context.isAlive = this.stats.isAlive();
    }

    // Add equipment summary if available
    if (this.equipment) {
      const equipped = this.equipment.getAllEquipped();
      context.equipment = equipped.map(e => e.item.name);
    }

    // Add gold if available
    if (this.inventory) {
      context.gold = this.inventory.gold;
    }

    return context;
  }

  /**
   * Check if this is the protagonist
   * @returns {boolean}
   */
  isProtagonist() {
    return this.role === 'protagonist';
  }

  /**
   * Check if character is currently in a conversation
   * @returns {boolean}
   */
  isBusy() {
    return this.inConversation || this.currentAction !== null;
  }

  /**
   * Start a conversation with another character
   * @param {Character} otherCharacter
   */
  startConversation(otherCharacter) {
    this.inConversation = true;
    this.conversationWith = otherCharacter.id;
  }

  /**
   * End current conversation
   */
  endConversation() {
    this.inConversation = false;
    this.conversationWith = null;
  }

  /**
   * Update character (called each frame)
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    // Memory decay happens here
    this.memory.update(deltaTime);

    // Update status effects if stats exist
    if (this.stats) {
      this.stats.updateStatusEffects(deltaTime);
    }

    // Update ability cooldowns if in combat
    if (this.abilities) {
      this.abilities.updateCooldowns(deltaTime);
    }

    // Future: GOAP planning and action execution
  }

  /**
   * Check if character is alive
   * @returns {boolean}
   */
  isAlive() {
    return this.stats ? this.stats.isAlive() : true;
  }

  /**
   * Check if character is dead
   * @returns {boolean}
   */
  isDead() {
    return this.stats ? this.stats.isDead() : false;
  }

  /**
   * Serialize character state for saving
   * @returns {Object}
   */
  toJSON() {
    const data = {
      id: this.id,
      name: this.name,
      role: this.role,
      personality: this.personality.toObject(),
      memories: this.memory.toJSON(),
      relationships: this.relationships.toJSON(),
      currentGoal: this.currentGoal,
      emotionalState: this.emotionalState,
      backstory: this.backstory,
      occupation: this.occupation,
      age: this.age,
      position: { x: this.x, y: this.y },
      currentLocation: this.currentLocation
    };

    // Include RPG systems if they exist
    if (this.stats) {
      data.stats = this.stats.toJSON();
    }

    if (this.inventory) {
      data.inventory = this.inventory.toJSON();
    }

    if (this.equipment) {
      data.equipment = this.equipment.toJSON();
    }

    if (this.abilities) {
      data.abilities = this.abilities.toJSON();
    }

    if (this.ai) {
      data.aiConfig = {
        behavior: this.ai.behavior
      };
    }

    return data;
  }

  /**
   * Deserialize character state from saved data
   * @param {Object} data - Saved character data
   * @returns {Character}
   */
  static fromJSON(data) {
    const character = new Character(data.id, data.name, {
      role: data.role,
      backstory: data.backstory,
      occupation: data.occupation,
      age: data.age,
      x: data.position?.x || 0,
      y: data.position?.y || 0,
      currentLocation: data.currentLocation
    });

    // Restore AI systems
    if (data.personality) {
      character.personality = Personality.fromObject(data.personality);
    }

    if (data.memories) {
      character.memory = MemoryStore.fromJSON(data.memories);
    }

    if (data.relationships) {
      character.relationships = RelationshipManager.fromJSON(data.relationships);
    }

    character.currentGoal = data.currentGoal;
    character.emotionalState = data.emotionalState;

    // Restore RPG systems
    if (data.stats) {
      character.stats = CharacterStats.fromJSON(data.stats);
    }

    if (data.inventory) {
      character.inventory = Inventory.fromJSON(data.inventory);
    }

    if (data.equipment) {
      character.equipment = Equipment.fromJSON(data.equipment);
    }

    if (data.abilities) {
      character.abilities = AbilityManager.fromJSON(data.abilities);
    }

    if (data.aiConfig) {
      character.ai = new CombatAI(data.aiConfig);
    }

    return character;
  }
}

export default Character;
