import { Ability } from './Ability.js';

/**
 * AbilityManager - Manages character abilities and skill progression
 *
 * Features:
 * - Learn/forget abilities
 * - Track known abilities
 * - Cooldown management
 * - Ability categories
 *
 * @class AbilityManager
 */
export class AbilityManager {
  /**
   * Create ability manager
   * @param {string} characterId - Character this manager belongs to
   */
  constructor(characterId) {
    this.characterId = characterId;
    this.knownAbilities = new Map(); // Map<abilityId, Ability>
    this.abilitySlots = []; // Quick-access slots (like hotbar)
    this.maxSlots = 8;
  }

  /**
   * Learn a new ability
   * @param {Ability} ability
   * @returns {boolean} Success
   */
  learnAbility(ability) {
    if (this.hasAbility(ability.id)) {
      return false;
    }

    if (!ability.learnable) {
      return false;
    }

    this.knownAbilities.set(ability.id, ability);
    return true;
  }

  /**
   * Forget an ability
   * @param {string} abilityId
   * @returns {boolean} Success
   */
  forgetAbility(abilityId) {
    if (!this.hasAbility(abilityId)) {
      return false;
    }

    // Remove from slots if slotted
    const slotIndex = this.abilitySlots.indexOf(abilityId);
    if (slotIndex !== -1) {
      this.abilitySlots[slotIndex] = null;
    }

    return this.knownAbilities.delete(abilityId);
  }

  /**
   * Check if character knows an ability
   * @param {string} abilityId
   * @returns {boolean}
   */
  hasAbility(abilityId) {
    return this.knownAbilities.has(abilityId);
  }

  /**
   * Get an ability
   * @param {string} abilityId
   * @returns {Ability|null}
   */
  getAbility(abilityId) {
    return this.knownAbilities.get(abilityId) || null;
  }

  /**
   * Get all known abilities
   * @returns {Array<Ability>}
   */
  getAllAbilities() {
    return Array.from(this.knownAbilities.values());
  }

  /**
   * Get abilities by type
   * @param {string} type
   * @returns {Array<Ability>}
   */
  getAbilitiesByType(type) {
    return this.getAllAbilities().filter(ability => ability.type === type);
  }

  /**
   * Get abilities by category
   * @param {string} category
   * @returns {Array<Ability>}
   */
  getAbilitiesByCategory(category) {
    return this.getAllAbilities().filter(ability => ability.category === category);
  }

  /**
   * Get ready abilities (not on cooldown)
   * @returns {Array<Ability>}
   */
  getReadyAbilities() {
    return this.getAllAbilities().filter(ability => ability.isReady());
  }

  /**
   * Slot an ability for quick access
   * @param {string} abilityId
   * @param {number} slotIndex
   * @returns {boolean} Success
   */
  slotAbility(abilityId, slotIndex) {
    if (slotIndex < 0 || slotIndex >= this.maxSlots) {
      return false;
    }

    if (!this.hasAbility(abilityId)) {
      return false;
    }

    // Ensure slots array has enough space
    while (this.abilitySlots.length <= slotIndex) {
      this.abilitySlots.push(null);
    }

    this.abilitySlots[slotIndex] = abilityId;
    return true;
  }

  /**
   * Unslot an ability
   * @param {number} slotIndex
   * @returns {boolean} Success
   */
  unslotAbility(slotIndex) {
    if (slotIndex < 0 || slotIndex >= this.abilitySlots.length) {
      return false;
    }

    this.abilitySlots[slotIndex] = null;
    return true;
  }

  /**
   * Get ability in slot
   * @param {number} slotIndex
   * @returns {Ability|null}
   */
  getSlottedAbility(slotIndex) {
    const abilityId = this.abilitySlots[slotIndex];
    return abilityId ? this.getAbility(abilityId) : null;
  }

  /**
   * Get all slotted abilities
   * @returns {Array<{slot: number, ability: Ability}>}
   */
  getSlottedAbilities() {
    const slotted = [];
    for (let i = 0; i < this.abilitySlots.length; i++) {
      const ability = this.getSlottedAbility(i);
      if (ability) {
        slotted.push({ slot: i, ability });
      }
    }
    return slotted;
  }

  /**
   * Update all ability cooldowns
   * @param {number} amount - Amount to reduce cooldowns by
   */
  updateCooldowns(amount = 1) {
    for (const ability of this.knownAbilities.values()) {
      ability.reduceCooldown(amount);
    }
  }

  /**
   * Reset all cooldowns
   */
  resetAllCooldowns() {
    for (const ability of this.knownAbilities.values()) {
      ability.resetCooldown();
    }
  }

  /**
   * Get abilities summary
   * @returns {Object}
   */
  getSummary() {
    return {
      totalAbilities: this.knownAbilities.size,
      readyAbilities: this.getReadyAbilities().length,
      slottedAbilities: this.getSlottedAbilities().length,
      abilitiesByType: {
        attack: this.getAbilitiesByType('attack').length,
        defense: this.getAbilitiesByType('defense').length,
        buff: this.getAbilitiesByType('buff').length,
        heal: this.getAbilitiesByType('heal').length,
        utility: this.getAbilitiesByType('utility').length,
        passive: this.getAbilitiesByType('passive').length
      }
    };
  }

  /**
   * Serialize to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      characterId: this.characterId,
      knownAbilities: Array.from(this.knownAbilities.entries()).map(([id, ability]) => ({
        id,
        ability: ability.toJSON()
      })),
      abilitySlots: [...this.abilitySlots],
      maxSlots: this.maxSlots
    };
  }

  /**
   * Deserialize from JSON
   * @param {Object} data
   * @returns {AbilityManager}
   */
  static fromJSON(data) {
    const manager = new AbilityManager(data.characterId);
    manager.maxSlots = data.maxSlots || 8;
    manager.abilitySlots = data.abilitySlots || [];

    if (data.knownAbilities) {
      data.knownAbilities.forEach(entry => {
        const ability = Ability.fromJSON(entry.ability);
        manager.knownAbilities.set(entry.id, ability);
      });
    }

    return manager;
  }
}

export default AbilityManager;
