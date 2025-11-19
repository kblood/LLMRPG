import { Item } from './Item.js';

/**
 * Equipment - Manages equipped items and calculates stat bonuses
 *
 * Equipment Slots:
 * - head: Helmets, hats, crowns
 * - chest: Armor, robes, shirts
 * - legs: Pants, greaves
 * - hands: Gloves, gauntlets
 * - feet: Boots, shoes
 * - weapon: Primary weapon (right hand)
 * - offhand: Shield, secondary weapon (left hand)
 * - accessory1: Ring, amulet, etc.
 * - accessory2: Second accessory slot
 *
 * @class Equipment
 */
export class Equipment {
  /**
   * Create equipment manager
   */
  constructor() {
    this.slots = {
      head: null,
      chest: null,
      legs: null,
      hands: null,
      feet: null,
      weapon: null,
      offhand: null,
      accessory1: null,
      accessory2: null
    };
  }

  /**
   * Equip an item
   * @param {Item} item - Item to equip
   * @param {CharacterStats} characterStats - Character stats for requirement check
   * @returns {Object} Result with previous item if any
   */
  equip(item, characterStats) {
    if (!item.equippable) {
      return { success: false, reason: 'Item is not equippable' };
    }

    const canEquip = item.canEquip(characterStats);
    if (!canEquip.canEquip) {
      return { success: false, reason: canEquip.reason };
    }

    const slot = item.equipSlot;
    if (!this.slots.hasOwnProperty(slot)) {
      return { success: false, reason: `Invalid equipment slot: ${slot}` };
    }

    const previousItem = this.slots[slot];
    this.slots[slot] = item;

    // Apply stat bonuses
    this._applyItemStats(item, characterStats, true);

    return {
      success: true,
      previousItem,
      slot
    };
  }

  /**
   * Unequip an item from slot
   * @param {string} slot - Slot name
   * @param {CharacterStats} characterStats - Character stats
   * @returns {Object} Result with unequipped item
   */
  unequip(slot, characterStats) {
    if (!this.slots.hasOwnProperty(slot)) {
      return { success: false, reason: `Invalid slot: ${slot}` };
    }

    const item = this.slots[slot];
    if (!item) {
      return { success: false, reason: 'Slot is empty' };
    }

    this.slots[slot] = null;

    // Remove stat bonuses
    this._applyItemStats(item, characterStats, false);

    return {
      success: true,
      item
    };
  }

  /**
   * Get equipped item in slot
   * @param {string} slot
   * @returns {Item|null}
   */
  getEquipped(slot) {
    return this.slots[slot];
  }

  /**
   * Get all equipped items
   * @returns {Array} Array of { slot, item }
   */
  getAllEquipped() {
    const equipped = [];
    for (const [slot, item] of Object.entries(this.slots)) {
      if (item) {
        equipped.push({ slot, item });
      }
    }
    return equipped;
  }

  /**
   * Check if slot is occupied
   * @param {string} slot
   * @returns {boolean}
   */
  isSlotOccupied(slot) {
    return this.slots[slot] !== null;
  }

  /**
   * Get total stat bonuses from all equipment
   * @returns {Object} Stat bonuses
   */
  getTotalStats() {
    const totals = {
      attack: 0,
      defense: 0,
      magicPower: 0,
      criticalChance: 0,
      dodgeChance: 0,
      physicalResistance: 0,
      magicalResistance: 0,
      fireResistance: 0,
      coldResistance: 0,
      lightningResistance: 0,
      poisonResistance: 0
    };

    for (const item of Object.values(this.slots)) {
      if (item && item.stats) {
        for (const [stat, value] of Object.entries(item.stats)) {
          if (totals.hasOwnProperty(stat)) {
            totals[stat] += value;
          }
        }
      }
    }

    return totals;
  }

  /**
   * Get total weight of equipped items
   * @returns {number}
   */
  getTotalWeight() {
    let total = 0;
    for (const item of Object.values(this.slots)) {
      if (item) {
        total += item.weight;
      }
    }
    return total;
  }

  /**
   * Get total value of equipped items
   * @returns {number}
   */
  getTotalValue() {
    let total = 0;
    for (const item of Object.values(this.slots)) {
      if (item) {
        total += item.value;
      }
    }
    return total;
  }

  /**
   * Apply or remove item stats to character
   * @param {Item} item
   * @param {CharacterStats} characterStats
   * @param {boolean} apply - True to apply, false to remove
   * @private
   */
  _applyItemStats(item, characterStats, apply) {
    const multiplier = apply ? 1 : -1;

    if (item.stats) {
      // Apply combat stats
      if (item.stats.attack !== undefined) {
        characterStats.baseAttack += item.stats.attack * multiplier;
      }
      if (item.stats.defense !== undefined) {
        characterStats.baseDefense += item.stats.defense * multiplier;
      }
      if (item.stats.criticalChance !== undefined) {
        characterStats.criticalChance += item.stats.criticalChance * multiplier;
      }

      // Apply resistances
      const resistanceKeys = ['physical', 'magical', 'fire', 'cold', 'lightning', 'poison'];
      for (const key of resistanceKeys) {
        const statKey = `${key}Resistance`;
        if (item.stats[statKey] !== undefined) {
          characterStats.resistances[key] += item.stats[statKey] * multiplier;
        }
      }
    }
  }

  /**
   * Get equipment set bonuses (if wearing matching items)
   * @returns {Array} Array of active set bonuses
   */
  getSetBonuses() {
    const sets = new Map(); // Map<setName, count>

    // Count items per set
    for (const item of Object.values(this.slots)) {
      if (item && item.tags.includes('set')) {
        const setName = item.customProperties?.setName;
        if (setName) {
          sets.set(setName, (sets.get(setName) || 0) + 1);
        }
      }
    }

    // Determine active bonuses
    const bonuses = [];
    for (const [setName, count] of sets) {
      // Example: 2-piece bonus, 4-piece bonus, etc.
      if (count >= 2) {
        bonuses.push({
          setName,
          pieces: count,
          bonus: this._getSetBonus(setName, count)
        });
      }
    }

    return bonuses;
  }

  /**
   * Get set bonus for a set at specific piece count
   * @param {string} setName
   * @param {number} pieces
   * @returns {Object}
   * @private
   */
  _getSetBonus(setName, pieces) {
    // This would be expanded with actual set definitions
    // For now, just a placeholder structure
    return {
      description: `${pieces}-piece ${setName} bonus`,
      stats: {}
    };
  }

  /**
   * Unequip all items
   * @param {CharacterStats} characterStats
   * @returns {Array} Array of unequipped items
   */
  unequipAll(characterStats) {
    const unequipped = [];

    for (const slot of Object.keys(this.slots)) {
      const result = this.unequip(slot, characterStats);
      if (result.success) {
        unequipped.push(result.item);
      }
    }

    return unequipped;
  }

  /**
   * Get equipment summary
   * @returns {Object}
   */
  getSummary() {
    const equipped = this.getAllEquipped();
    return {
      equippedCount: equipped.length,
      totalStats: this.getTotalStats(),
      totalWeight: this.getTotalWeight(),
      totalValue: this.getTotalValue(),
      slots: Object.fromEntries(
        Object.entries(this.slots).map(([slot, item]) => [
          slot,
          item ? item.name : null
        ])
      ),
      setBonuses: this.getSetBonuses()
    };
  }

  /**
   * Serialize to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      slots: Object.fromEntries(
        Object.entries(this.slots).map(([slot, item]) => [
          slot,
          item ? item.toJSON() : null
        ])
      )
    };
  }

  /**
   * Deserialize from JSON
   * @param {Object} data
   * @returns {Equipment}
   */
  static fromJSON(data) {
    const equipment = new Equipment();

    if (data.slots) {
      for (const [slot, itemData] of Object.entries(data.slots)) {
        if (itemData) {
          equipment.slots[slot] = Item.fromJSON(itemData);
        }
      }
    }

    return equipment;
  }
}

export default Equipment;
