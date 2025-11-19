/**
 * Ability - Represents skills, spells, and special actions
 *
 * Ability Types:
 * - attack: Offensive abilities (Power Strike, Fireball)
 * - defense: Defensive abilities (Shield Block, Dodge Roll)
 * - buff: Buff abilities (Strength Boost, Haste)
 * - heal: Healing abilities (Heal, Regeneration)
 * - utility: Utility abilities (Lockpick, Persuade)
 * - passive: Passive abilities (Always active)
 *
 * @class Ability
 */
export class Ability {
  /**
   * Create an ability
   * @param {Object} data - Ability data
   */
  constructor(data = {}) {
    this.id = data.id || this._generateId();
    this.name = data.name || 'Unknown Ability';
    this.description = data.description || '';
    this.type = data.type || 'attack'; // attack, defense, buff, heal, utility, passive

    // Resource costs (support both old and new format)
    this.costs = data.costs || {
      stamina: data.staminaCost || 0,
      magic: data.magicCost || 0,
      hp: data.hpCost || 0
    };

    // Cooldown (in turns/seconds)
    this.cooldown = data.cooldown || 0;
    this.currentCooldown = 0;

    // Requirements (support both old and new format)
    this.requirements = data.requirements || {
      level: data.levelRequirement || 1,
      attributes: data.attributeRequirements || {}, // { strength: 12, intelligence: 10 }
      weapon: data.weaponRequirement || null, // 'sword', 'staff', etc.
      equipment: data.equipmentRequirement || null
    };

    // Effects (support both old and new format)
    this.effects = data.effects || {
      damage: data.damage || 0,
      damageType: data.damageType || 'physical', // physical, magical, fire, cold, lightning, poison
      damageMultiplier: data.damageMultiplier || 1.0, // Multiplier based on character stats
      heal: data.heal || 0,
      buff: data.buff || null, // { stat: 'strength', amount: 5, duration: 3 }
      debuff: data.debuff || null, // { stat: 'defense', amount: -3, duration: 2 }
      statusEffect: data.statusEffect || null // poison, stun, slow, etc.
    };

    // Targeting
    this.targetType = data.targetType || 'single'; // single, self, area, all_enemies, all_allies
    this.range = data.range || 'melee'; // melee, close, medium, long, any
    this.areaSize = data.areaSize || 0; // For area effects

    // Success chance (0-1, 1 = always succeeds)
    this.baseSuccessChance = data.successChance !== undefined ? data.successChance : 1.0;

    // Metadata
    this.tags = data.tags || []; // ['magical', 'fire', 'powerful']
    this.learnable = data.learnable !== undefined ? data.learnable : true;
    this.category = data.category || 'combat'; // combat, social, exploration

    // Dynamic properties (set by Chronicler)
    this.lore = data.lore || '';
    this.customProperties = data.customProperties || {};
  }

  /**
   * Generate unique ability ID
   * @returns {string}
   */
  _generateId() {
    return `ability_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if ability can be used
   * @param {CharacterStats} characterStats
   * @param {Equipment} equipment
   * @returns {Object} { canUse: boolean, reason: string }
   */
  canUse(characterStats, equipment = null) {
    // Check if on cooldown
    if (this.currentCooldown > 0) {
      return { canUse: false, reason: `On cooldown (${this.currentCooldown} turns remaining)` };
    }

    // Check level requirement
    if (characterStats.level < this.requirements.level) {
      return { canUse: false, reason: `Requires level ${this.requirements.level}` };
    }

    // Check attribute requirements
    for (const [attr, value] of Object.entries(this.requirements.attributes)) {
      if (characterStats.attributes[attr] < value) {
        return { canUse: false, reason: `Requires ${attr} ${value}` };
      }
    }

    // Check weapon requirement
    if (this.requirements.weapon && equipment) {
      const weapon = equipment.getEquipped('weapon');
      if (!weapon || !weapon.tags.includes(this.requirements.weapon)) {
        return { canUse: false, reason: `Requires ${this.requirements.weapon}` };
      }
    }

    // Check resource costs
    if (this.costs.stamina > 0 && characterStats.currentStamina < this.costs.stamina) {
      return { canUse: false, reason: `Not enough stamina (need ${this.costs.stamina})` };
    }

    if (this.costs.magic > 0 && characterStats.currentMagic < this.costs.magic) {
      return { canUse: false, reason: `Not enough magic (need ${this.costs.magic})` };
    }

    if (this.costs.hp > 0 && characterStats.currentHP <= this.costs.hp) {
      return { canUse: false, reason: 'Not enough HP' };
    }

    return { canUse: true };
  }

  /**
   * Use the ability
   * @param {Object} user - Character using the ability
   * @param {Object} target - Target(s) of the ability
   * @param {Object} context - Additional context (distance, equipment, etc.)
   * @returns {Object} Result of using the ability
   */
  use(user, target, context = {}) {
    const canUse = this.canUse(user.stats, user.equipment);
    if (!canUse.canUse) {
      return { success: false, reason: canUse.reason };
    }

    // Pay costs
    user.stats.useStamina(this.costs.stamina);
    user.stats.useMagic(this.costs.magic);
    if (this.costs.hp > 0) {
      user.stats.takeDamage(this.costs.hp, 'self');
    }

    // Set cooldown
    this.currentCooldown = this.cooldown;

    // Calculate success
    const successChance = this._calculateSuccessChance(user, target, context);
    const success = Math.random() < successChance;

    if (!success) {
      return {
        success: false,
        missed: true,
        reason: 'Ability failed',
        cooldownSet: true
      };
    }

    const results = {
      success: true,
      effects: []
    };

    // Apply damage
    if (this.effects.damage > 0) {
      const damage = this._calculateDamage(user, target, context);
      const damageResult = target.stats.takeDamage(damage, this.effects.damageType);

      results.effects.push({
        type: 'damage',
        amount: damageResult.damageDealt,
        damageType: this.effects.damageType,
        targetDead: damageResult.isDead
      });
    }

    // Apply healing
    if (this.effects.heal > 0) {
      const healAmount = this._calculateHealing(user, context);
      const actualHealed = (target || user).stats.heal(healAmount);

      results.effects.push({
        type: 'heal',
        amount: actualHealed
      });
    }

    // Apply buff
    if (this.effects.buff) {
      const buffTarget = this.targetType === 'self' ? user : target;
      this._applyBuff(buffTarget, this.effects.buff);

      results.effects.push({
        type: 'buff',
        buff: this.effects.buff
      });
    }

    // Apply debuff
    if (this.effects.debuff) {
      this._applyDebuff(target, this.effects.debuff);

      results.effects.push({
        type: 'debuff',
        debuff: this.effects.debuff
      });
    }

    // Apply status effect
    if (this.effects.statusEffect) {
      target.stats.addStatusEffect(this.effects.statusEffect);

      results.effects.push({
        type: 'status',
        status: this.effects.statusEffect
      });
    }

    return results;
  }

  /**
   * Calculate success chance
   * @param {Object} user
   * @param {Object} target
   * @param {Object} context
   * @returns {number} 0-1
   * @private
   */
  _calculateSuccessChance(user, target, context) {
    let chance = this.baseSuccessChance;

    // Modify based on user attributes
    if (this.type === 'attack' && user.stats) {
      const attackBonus = user.stats.getAttackBonus();
      chance += attackBonus * 0.02; // +2% per attack bonus
    }

    // Modify based on target defense
    if (target && target.stats) {
      const dodgeChance = target.stats.getDodgeChance();
      chance -= dodgeChance;
    }

    // Modify based on distance
    if (context.distance && this.range !== 'any') {
      const distancePenalty = this._getDistancePenalty(context.distance);
      chance -= distancePenalty;
    }

    return Math.max(0, Math.min(1, chance));
  }

  /**
   * Calculate damage
   * @param {Object} user
   * @param {Object} target
   * @param {Object} context
   * @returns {number}
   * @private
   */
  _calculateDamage(user, target, context) {
    let damage = this.effects.damage;

    // Apply user stat multiplier
    if (user.stats) {
      if (this.effects.damageType === 'physical') {
        const attackBonus = user.stats.getAttackBonus();
        damage += attackBonus * 2; // Each attack bonus point adds 2 damage
      } else if (this.effects.damageType === 'magical') {
        const magicPower = user.stats.getMagicPower();
        damage += magicPower * 3; // Each magic power point adds 3 damage
      }
    }

    // Apply ability multiplier
    damage = Math.floor(damage * this.effects.damageMultiplier);

    // Critical hit chance
    if (user.stats && Math.random() < user.stats.criticalChance) {
      damage = Math.floor(damage * user.stats.criticalMultiplier);
    }

    return damage;
  }

  /**
   * Calculate healing
   * @param {Object} user
   * @param {Object} context
   * @returns {number}
   * @private
   */
  _calculateHealing(user, context) {
    let heal = this.effects.heal;

    // Modify based on wisdom
    if (user.stats) {
      const wisdomBonus = Math.floor((user.stats.attributes.wisdom - 10) / 2);
      heal += wisdomBonus * 2;
    }

    return Math.max(1, heal);
  }

  /**
   * Apply buff to character
   * @param {Object} character
   * @param {Object} buff
   * @private
   */
  _applyBuff(character, buff) {
    character.stats.addStatusEffect({
      id: `${this.id}_buff`,
      type: 'buff',
      name: `${this.name} Buff`,
      stat: buff.stat,
      amount: buff.amount,
      duration: buff.duration
    });
  }

  /**
   * Apply debuff to character
   * @param {Object} character
   * @param {Object} debuff
   * @private
   */
  _applyDebuff(character, debuff) {
    character.stats.addStatusEffect({
      id: `${this.id}_debuff`,
      type: 'debuff',
      name: `${this.name} Debuff`,
      stat: debuff.stat,
      amount: debuff.amount,
      duration: debuff.duration
    });
  }

  /**
   * Get distance penalty for ability
   * @param {string} distance
   * @returns {number} Penalty (0-1)
   * @private
   */
  _getDistancePenalty(distance) {
    const penalties = {
      melee: { close: 0, medium: 0.2, long: 0.5 },
      close: { melee: 0.1, medium: 0, long: 0.2 },
      medium: { melee: 0.3, close: 0.1, long: 0 },
      long: { melee: 0.5, close: 0.3, medium: 0.1 }
    };

    return penalties[this.range]?.[distance] || 0;
  }

  /**
   * Reduce cooldown (called each turn)
   * @param {number} amount - Amount to reduce (default 1)
   */
  reduceCooldown(amount = 1) {
    this.currentCooldown = Math.max(0, this.currentCooldown - amount);
  }

  /**
   * Reset cooldown
   */
  resetCooldown() {
    this.currentCooldown = 0;
  }

  /**
   * Check if ability is ready
   * @returns {boolean}
   */
  isReady() {
    return this.currentCooldown === 0;
  }

  /**
   * Get ability info
   * @returns {Object}
   */
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      costs: this.costs,
      cooldown: this.cooldown,
      currentCooldown: this.currentCooldown,
      requirements: this.requirements,
      effects: this.effects,
      targetType: this.targetType,
      range: this.range,
      tags: this.tags,
      lore: this.lore
    };
  }

  /**
   * Serialize to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      staminaCost: this.costs.stamina,
      magicCost: this.costs.magic,
      hpCost: this.costs.hp,
      cooldown: this.cooldown,
      currentCooldown: this.currentCooldown,
      levelRequirement: this.requirements.level,
      attributeRequirements: { ...this.requirements.attributes },
      weaponRequirement: this.requirements.weapon,
      damage: this.effects.damage,
      damageType: this.effects.damageType,
      damageMultiplier: this.effects.damageMultiplier,
      heal: this.effects.heal,
      buff: this.effects.buff,
      debuff: this.effects.debuff,
      statusEffect: this.effects.statusEffect,
      targetType: this.targetType,
      range: this.range,
      areaSize: this.areaSize,
      successChance: this.baseSuccessChance,
      tags: [...this.tags],
      learnable: this.learnable,
      category: this.category,
      lore: this.lore,
      customProperties: { ...this.customProperties }
    };
  }

  /**
   * Deserialize from JSON
   * @param {Object} data
   * @returns {Ability}
   */
  static fromJSON(data) {
    return new Ability(data);
  }
}

export default Ability;
