/**
 * CharacterStats - Manages character attributes, derived stats, and resources
 *
 * Core Attributes (1-20 scale, 10 is average):
 * - Strength: Physical power, melee damage
 * - Dexterity: Agility, ranged damage, dodge
 * - Constitution: Health, stamina, endurance
 * - Intelligence: Magic power, learning
 * - Wisdom: Perception, willpower, insight
 * - Charisma: Social influence, leadership
 *
 * Derived Stats:
 * - HP (Health Points): Based on Constitution
 * - Stamina: Based on Constitution and Dexterity
 * - Magic: Based on Intelligence and Wisdom
 *
 * @class CharacterStats
 */
export class CharacterStats {
  /**
   * Create character stats
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    // Core attributes (1-20, default 10)
    this.attributes = {
      strength: options.strength || 10,
      dexterity: options.dexterity || 10,
      constitution: options.constitution || 10,
      intelligence: options.intelligence || 10,
      wisdom: options.wisdom || 10,
      charisma: options.charisma || 10
    };

    // Level and experience
    this.level = options.level || 1;
    this.experience = options.experience || 0;
    this.experienceToNextLevel = this._calculateExpRequired(this.level + 1);

    // Combat stats
    this.baseAttack = options.baseAttack || 0;
    this.baseDefense = options.baseDefense || 0;
    this.criticalChance = options.criticalChance || 0.05; // 5% base
    this.criticalMultiplier = options.criticalMultiplier || 2.0;

    // Resources (calculated from attributes)
    this.maxHP = this._calculateMaxHP();
    this.currentHP = options.currentHP !== undefined ? options.currentHP : this.maxHP;

    this.maxStamina = this._calculateMaxStamina();
    this.currentStamina = options.currentStamina !== undefined ? options.currentStamina : this.maxStamina;

    this.maxMagic = this._calculateMaxMagic();
    this.currentMagic = options.currentMagic !== undefined ? options.currentMagic : this.maxMagic;

    // Resistances (0-100, percentage reduction)
    this.resistances = {
      physical: options.physicalResistance || 0,
      magical: options.magicalResistance || 0,
      fire: options.fireResistance || 0,
      cold: options.coldResistance || 0,
      lightning: options.lightningResistance || 0,
      poison: options.poisonResistance || 0
    };

    // Status effects
    this.statusEffects = new Map(); // Map<effectId, effect>

    // Attribute points available for spending
    this.attributePoints = options.attributePoints || 0;
  }

  /**
   * Calculate maximum HP based on constitution
   * Formula: 50 + (constitution * 10) + (level * 5)
   * @returns {number}
   */
  _calculateMaxHP() {
    return 50 + (this.attributes.constitution * 10) + (this.level * 5);
  }

  /**
   * Calculate maximum stamina based on constitution and dexterity
   * Formula: 100 + (constitution * 5) + (dexterity * 3)
   * @returns {number}
   */
  _calculateMaxStamina() {
    return 100 + (this.attributes.constitution * 5) + (this.attributes.dexterity * 3);
  }

  /**
   * Calculate maximum magic based on intelligence and wisdom
   * Formula: (intelligence + wisdom) * 5
   * @returns {number}
   */
  _calculateMaxMagic() {
    return (this.attributes.intelligence + this.attributes.wisdom) * 5;
  }

  /**
   * Calculate experience required for a given level
   * Formula: 100 * level^1.5
   * @param {number} level
   * @returns {number}
   */
  _calculateExpRequired(level) {
    return Math.floor(100 * Math.pow(level, 1.5));
  }

  /**
   * Get attack bonus from strength
   * @returns {number}
   */
  getAttackBonus() {
    return Math.floor((this.attributes.strength - 10) / 2) + this.baseAttack;
  }

  /**
   * Get defense bonus from constitution and dexterity
   * @returns {number}
   */
  getDefenseBonus() {
    const conBonus = Math.floor((this.attributes.constitution - 10) / 2);
    const dexBonus = Math.floor((this.attributes.dexterity - 10) / 2);
    return conBonus + dexBonus + this.baseDefense;
  }

  /**
   * Get magic power from intelligence
   * @returns {number}
   */
  getMagicPower() {
    return Math.floor((this.attributes.intelligence - 10) / 2);
  }

  /**
   * Get dodge chance from dexterity (0-1)
   * @returns {number}
   */
  getDodgeChance() {
    const dexBonus = this.attributes.dexterity - 10;
    return Math.max(0, Math.min(0.5, dexBonus * 0.02)); // 2% per point, max 50%
  }

  /**
   * Take damage
   * @param {number} amount - Damage amount
   * @param {string} type - Damage type ('physical', 'magical', etc.)
   * @returns {Object} Result with actual damage dealt
   */
  takeDamage(amount, type = 'physical') {
    // Apply resistance
    const resistance = this.resistances[type] || 0;
    const reduction = 1 - (resistance / 100);
    const actualDamage = Math.max(0, Math.floor(amount * reduction));

    this.currentHP = Math.max(0, this.currentHP - actualDamage);

    return {
      damageDealt: actualDamage,
      damageReduced: amount - actualDamage,
      isDead: this.currentHP === 0,
      remainingHP: this.currentHP
    };
  }

  /**
   * Heal HP
   * @param {number} amount
   * @returns {number} Actual amount healed
   */
  heal(amount) {
    const oldHP = this.currentHP;
    this.currentHP = Math.min(this.maxHP, this.currentHP + amount);
    return this.currentHP - oldHP;
  }

  /**
   * Use stamina
   * @param {number} amount
   * @returns {boolean} True if had enough stamina
   */
  useStamina(amount) {
    if (this.currentStamina >= amount) {
      this.currentStamina -= amount;
      return true;
    }
    return false;
  }

  /**
   * Restore stamina
   * @param {number} amount
   * @returns {number} Actual amount restored
   */
  restoreStamina(amount) {
    const oldStamina = this.currentStamina;
    this.currentStamina = Math.min(this.maxStamina, this.currentStamina + amount);
    return this.currentStamina - oldStamina;
  }

  /**
   * Use magic
   * @param {number} amount
   * @returns {boolean} True if had enough magic
   */
  useMagic(amount) {
    if (this.currentMagic >= amount) {
      this.currentMagic -= amount;
      return true;
    }
    return false;
  }

  /**
   * Restore magic
   * @param {number} amount
   * @returns {number} Actual amount restored
   */
  restoreMagic(amount) {
    const oldMagic = this.currentMagic;
    this.currentMagic = Math.min(this.maxMagic, this.currentMagic + amount);
    return this.currentMagic - oldMagic;
  }

  /**
   * Gain experience
   * @param {number} amount
   * @returns {Object} Result with levelUp flag
   */
  gainExperience(amount) {
    this.experience += amount;
    const levelsGained = [];

    while (this.experience >= this.experienceToNextLevel) {
      this.experience -= this.experienceToNextLevel;
      this.level++;
      levelsGained.push(this.level);
      this.experienceToNextLevel = this._calculateExpRequired(this.level + 1);

      // Gain attribute points on level up
      this.attributePoints += 3;

      // Recalculate max resources
      this.maxHP = this._calculateMaxHP();
      this.maxStamina = this._calculateMaxStamina();
      this.maxMagic = this._calculateMaxMagic();

      // Restore resources on level up
      this.currentHP = this.maxHP;
      this.currentStamina = this.maxStamina;
      this.currentMagic = this.maxMagic;
    }

    return {
      leveledUp: levelsGained.length > 0,
      levelsGained,
      currentLevel: this.level,
      attributePointsGained: levelsGained.length * 3
    };
  }

  /**
   * Allocate attribute point
   * @param {string} attribute - Attribute name
   * @param {number} points - Points to allocate (default 1)
   * @returns {boolean} Success
   */
  allocateAttribute(attribute, points = 1) {
    if (!this.attributes.hasOwnProperty(attribute)) {
      return false;
    }

    if (this.attributePoints < points) {
      return false;
    }

    if (this.attributes[attribute] + points > 20) {
      return false;
    }

    this.attributes[attribute] += points;
    this.attributePoints -= points;

    // Recalculate derived stats
    this.maxHP = this._calculateMaxHP();
    this.maxStamina = this._calculateMaxStamina();
    this.maxMagic = this._calculateMaxMagic();

    return true;
  }

  /**
   * Add status effect
   * @param {Object} effect - Status effect
   */
  addStatusEffect(effect) {
    this.statusEffects.set(effect.id, {
      ...effect,
      appliedAt: Date.now()
    });
  }

  /**
   * Remove status effect
   * @param {string} effectId
   */
  removeStatusEffect(effectId) {
    this.statusEffects.delete(effectId);
  }

  /**
   * Check if character has a status effect
   * @param {string} effectId
   * @returns {boolean}
   */
  hasStatusEffect(effectId) {
    return this.statusEffects.has(effectId);
  }

  /**
   * Get all active status effects
   * @returns {Array}
   */
  getStatusEffects() {
    return Array.from(this.statusEffects.values());
  }

  /**
   * Update status effects (called each turn/frame)
   * @param {number} deltaTime - Time elapsed
   */
  updateStatusEffects(deltaTime) {
    const toRemove = [];

    for (const [id, effect] of this.statusEffects) {
      // Update duration
      if (effect.duration !== undefined) {
        effect.duration -= deltaTime;
        if (effect.duration <= 0) {
          toRemove.push(id);
          continue;
        }
      }

      // Apply effect
      if (effect.type === 'damage_over_time') {
        this.takeDamage(effect.damagePerTick, effect.damageType);
      } else if (effect.type === 'heal_over_time') {
        this.heal(effect.healPerTick);
      }
    }

    // Remove expired effects
    toRemove.forEach(id => this.removeStatusEffect(id));
  }

  /**
   * Check if character is alive
   * @returns {boolean}
   */
  isAlive() {
    return this.currentHP > 0;
  }

  /**
   * Check if character is dead
   * @returns {boolean}
   */
  isDead() {
    return this.currentHP === 0;
  }

  /**
   * Get maximum health
   * @returns {number}
   */
  getMaxHealth() {
    return this.maxHP;
  }

  /**
   * Get maximum stamina
   * @returns {number}
   */
  getMaxStamina() {
    return this.maxStamina;
  }

  /**
   * Get current health
   * @returns {number}
   */
  getHealth() {
    return this.currentHP;
  }

  /**
   * Get defense value (alias for getDefenseBonus)
   * @returns {number}
   */
  getDefense() {
    return this.getDefenseBonus();
  }

  /**
   * Full rest - restore all resources
   */
  rest() {
    this.currentHP = this.maxHP;
    this.currentStamina = this.maxStamina;
    this.currentMagic = this.maxMagic;
    this.statusEffects.clear();
  }

  /**
   * Get character stats summary
   * @returns {Object}
   */
  getSummary() {
    return {
      level: this.level,
      experience: this.experience,
      experienceToNextLevel: this.experienceToNextLevel,
      attributes: { ...this.attributes },
      hp: { current: this.currentHP, max: this.maxHP },
      stamina: { current: this.currentStamina, max: this.maxStamina },
      magic: { current: this.currentMagic, max: this.maxMagic },
      attackBonus: this.getAttackBonus(),
      defenseBonus: this.getDefenseBonus(),
      magicPower: this.getMagicPower(),
      dodgeChance: this.getDodgeChance(),
      criticalChance: this.criticalChance,
      resistances: { ...this.resistances },
      statusEffects: this.getStatusEffects(),
      attributePoints: this.attributePoints
    };
  }

  /**
   * Serialize to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      attributes: { ...this.attributes },
      level: this.level,
      experience: this.experience,
      baseAttack: this.baseAttack,
      baseDefense: this.baseDefense,
      criticalChance: this.criticalChance,
      criticalMultiplier: this.criticalMultiplier,
      currentHP: this.currentHP,
      maxHP: this.maxHP,
      currentStamina: this.currentStamina,
      maxStamina: this.maxStamina,
      currentMagic: this.currentMagic,
      maxMagic: this.maxMagic,
      resistances: { ...this.resistances },
      statusEffects: Array.from(this.statusEffects.entries()),
      attributePoints: this.attributePoints
    };
  }

  /**
   * Deserialize from JSON
   * @param {Object} data
   * @returns {CharacterStats}
   */
  static fromJSON(data) {
    const stats = new CharacterStats(data);

    if (data.statusEffects) {
      stats.statusEffects = new Map(data.statusEffects);
    }

    return stats;
  }
}

export default CharacterStats;
