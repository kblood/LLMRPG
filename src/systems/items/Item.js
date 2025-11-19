/**
 * Item - Base class for all items in the game
 *
 * Item Types:
 * - weapon: Melee or ranged weapons
 * - armor: Protective gear
 * - consumable: Potions, food, scrolls
 * - quest: Quest-specific items
 * - misc: Miscellaneous items
 * - material: Crafting materials
 *
 * @class Item
 */
export class Item {
  /**
   * Create an item
   * @param {Object} data - Item data
   */
  constructor(data = {}) {
    this.id = data.id || this._generateId();
    this.name = data.name || 'Unknown Item';
    this.description = data.description || '';
    this.type = data.type || 'misc'; // weapon, armor, consumable, quest, misc, material

    // Item properties
    this.stackable = data.stackable !== undefined ? data.stackable : false;
    this.maxStack = data.maxStack || 99;
    this.value = data.value || 0; // Gold value
    this.weight = data.weight || 0; // Weight in pounds
    this.rarity = data.rarity || 'common'; // common, uncommon, rare, epic, legendary

    // Usage
    this.usable = data.usable !== undefined ? data.usable : false;
    this.consumable = data.consumable !== undefined ? data.consumable : false;
    this.equippable = data.equippable !== undefined ? data.equippable : false;

    // Equipment slot (if equippable)
    this.equipSlot = data.equipSlot || null; // head, chest, legs, hands, feet, weapon, offhand, accessory

    // Item stats/effects
    this.effects = data.effects || {}; // { heal: 20, mana: 10, buff: 'strength+2' }
    this.stats = data.stats || {}; // { attack: 5, defense: 3 }

    // Requirements
    this.requirements = data.requirements || {}; // { level: 5, strength: 12 }

    // Metadata
    this.tags = data.tags || []; // ['magical', 'cursed', 'heavy']
    this.questItem = data.questItem || false;
    this.tradeable = data.tradeable !== undefined ? data.tradeable : true;

    // Dynamic properties (set by Chronicler)
    this.lore = data.lore || '';
    this.customProperties = data.customProperties || {};
  }

  /**
   * Generate unique item ID
   * @returns {string}
   */
  _generateId() {
    return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if item can be used
   * @param {CharacterStats} characterStats - Character attempting to use
   * @returns {Object} { canUse: boolean, reason: string }
   */
  canUse(characterStats) {
    if (!this.usable) {
      return { canUse: false, reason: 'Item is not usable' };
    }

    // Check requirements
    if (this.requirements.level && characterStats.level < this.requirements.level) {
      return { canUse: false, reason: `Requires level ${this.requirements.level}` };
    }

    for (const [attr, value] of Object.entries(this.requirements)) {
      if (attr !== 'level' && characterStats.attributes[attr] < value) {
        return { canUse: false, reason: `Requires ${attr} ${value}` };
      }
    }

    return { canUse: true };
  }

  /**
   * Check if item can be equipped
   * @param {CharacterStats} characterStats - Character attempting to equip
   * @returns {Object} { canEquip: boolean, reason: string }
   */
  canEquip(characterStats) {
    if (!this.equippable) {
      return { canEquip: false, reason: 'Item is not equippable' };
    }

    if (!this.equipSlot) {
      return { canEquip: false, reason: 'Item has no equipment slot' };
    }

    // Check requirements
    const useCheck = this.canUse(characterStats);
    if (!useCheck.canUse) {
      return { canEquip: false, reason: useCheck.reason };
    }

    return { canEquip: true };
  }

  /**
   * Use the item
   * @param {Character} character - Character using the item
   * @returns {Object} Result of using the item
   */
  use(character) {
    if (!this.usable) {
      return { success: false, message: 'Item cannot be used' };
    }

    const results = {
      success: true,
      effects: [],
      consumed: this.consumable
    };

    // Apply effects
    if (this.effects.heal) {
      const healed = character.stats.heal(this.effects.heal);
      results.effects.push({ type: 'heal', amount: healed });
    }

    if (this.effects.restoreStamina) {
      const restored = character.stats.restoreStamina(this.effects.restoreStamina);
      results.effects.push({ type: 'stamina', amount: restored });
    }

    if (this.effects.restoreMagic) {
      const restored = character.stats.restoreMagic(this.effects.restoreMagic);
      results.effects.push({ type: 'magic', amount: restored });
    }

    if (this.effects.buff) {
      // Add temporary buff
      results.effects.push({ type: 'buff', buff: this.effects.buff });
    }

    return results;
  }

  /**
   * Get item info for display
   * @returns {Object}
   */
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      rarity: this.rarity,
      value: this.value,
      weight: this.weight,
      stackable: this.stackable,
      usable: this.usable,
      equippable: this.equippable,
      equipSlot: this.equipSlot,
      stats: this.stats,
      effects: this.effects,
      requirements: this.requirements,
      tags: this.tags,
      questItem: this.questItem,
      lore: this.lore
    };
  }

  /**
   * Create a copy of this item
   * @returns {Item}
   */
  clone() {
    return new Item(this.toJSON());
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
      stackable: this.stackable,
      maxStack: this.maxStack,
      value: this.value,
      weight: this.weight,
      rarity: this.rarity,
      usable: this.usable,
      consumable: this.consumable,
      equippable: this.equippable,
      equipSlot: this.equipSlot,
      effects: { ...this.effects },
      stats: { ...this.stats },
      requirements: { ...this.requirements },
      tags: [...this.tags],
      questItem: this.questItem,
      tradeable: this.tradeable,
      lore: this.lore,
      customProperties: { ...this.customProperties }
    };
  }

  /**
   * Deserialize from JSON
   * @param {Object} data
   * @returns {Item}
   */
  static fromJSON(data) {
    return new Item(data);
  }
}

export default Item;
