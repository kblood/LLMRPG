import { Item } from './Item.js';

/**
 * Inventory - Manages character inventory with weight/slot limits
 *
 * Features:
 * - Slot-based storage
 * - Weight limits
 * - Item stacking
 * - Quest item protection
 *
 * @class Inventory
 */
export class Inventory {
  /**
   * Create an inventory
   * @param {Object} options - Configuration
   */
  constructor(options = {}) {
    this.maxSlots = options.maxSlots || 20;
    this.maxWeight = options.maxWeight || 100; // pounds
    this.items = new Map(); // Map<itemId, { item: Item, quantity: number }>
    this.gold = options.gold || 0;
  }

  /**
   * Add item to inventory
   * @param {Item} item - Item to add
   * @param {number} quantity - Quantity to add
   * @returns {Object} Result
   */
  addItem(item, quantity = 1) {
    // Check if we have space
    if (this.isFull() && !this.hasItem(item.id)) {
      return { success: false, reason: 'Inventory full', quantityAdded: 0 };
    }

    // Check weight limit
    const newWeight = this.getTotalWeight() + (item.weight * quantity);
    if (newWeight > this.maxWeight) {
      const canAdd = Math.floor((this.maxWeight - this.getTotalWeight()) / item.weight);
      if (canAdd === 0) {
        return { success: false, reason: 'Too heavy', quantityAdded: 0 };
      }
      quantity = canAdd;
    }

    // Handle stacking
    if (item.stackable && this.hasItem(item.id)) {
      const existing = this.items.get(item.id);
      const newQuantity = Math.min(existing.quantity + quantity, item.maxStack);
      const actualAdded = newQuantity - existing.quantity;

      existing.quantity = newQuantity;

      return {
        success: true,
        quantityAdded: actualAdded,
        message: actualAdded < quantity ? 'Stack limit reached' : 'Added to stack'
      };
    }

    // Add new item
    this.items.set(item.id, {
      item: item,
      quantity: quantity
    });

    return { success: true, quantityAdded: quantity };
  }

  /**
   * Remove item from inventory
   * @param {string} itemId - Item ID
   * @param {number} quantity - Quantity to remove
   * @returns {Object} Result with removed items
   */
  removeItem(itemId, quantity = 1) {
    if (!this.hasItem(itemId)) {
      return { success: false, reason: 'Item not found', quantityRemoved: 0 };
    }

    const entry = this.items.get(itemId);

    // Check if it's a quest item
    if (entry.item.questItem && entry.item.customProperties?.preventRemoval) {
      return { success: false, reason: 'Quest item cannot be removed', quantityRemoved: 0 };
    }

    const actualRemoved = Math.min(quantity, entry.quantity);
    entry.quantity -= actualRemoved;

    if (entry.quantity === 0) {
      this.items.delete(itemId);
    }

    return {
      success: true,
      quantityRemoved: actualRemoved,
      item: entry.item
    };
  }

  /**
   * Check if inventory has item
   * @param {string} itemId
   * @param {number} quantity - Minimum quantity
   * @returns {boolean}
   */
  hasItem(itemId, quantity = 1) {
    const entry = this.items.get(itemId);
    return entry && entry.quantity >= quantity;
  }

  /**
   * Get item from inventory
   * @param {string} itemId
   * @returns {Object|null} { item, quantity }
   */
  getItem(itemId) {
    return this.items.get(itemId) || null;
  }

  /**
   * Get item quantity
   * @param {string} itemId
   * @returns {number}
   */
  getQuantity(itemId) {
    const entry = this.items.get(itemId);
    return entry ? entry.quantity : 0;
  }

  /**
   * Get all items
   * @returns {Array} Array of { item, quantity }
   */
  getAllItems() {
    return Array.from(this.items.values());
  }

  /**
   * Get items by type
   * @param {string} type
   * @returns {Array}
   */
  getItemsByType(type) {
    return this.getAllItems().filter(entry => entry.item.type === type);
  }

  /**
   * Get quest items
   * @returns {Array}
   */
  getQuestItems() {
    return this.getAllItems().filter(entry => entry.item.questItem);
  }

  /**
   * Check if inventory is full
   * @returns {boolean}
   */
  isFull() {
    return this.items.size >= this.maxSlots;
  }

  /**
   * Get total weight
   * @returns {number}
   */
  getTotalWeight() {
    let total = 0;
    for (const entry of this.items.values()) {
      total += entry.item.weight * entry.quantity;
    }
    return total;
  }

  /**
   * Get remaining weight capacity
   * @returns {number}
   */
  getRemainingWeight() {
    return this.maxWeight - this.getTotalWeight();
  }

  /**
   * Get total item value
   * @returns {number}
   */
  getTotalValue() {
    let total = 0;
    for (const entry of this.items.values()) {
      total += entry.item.value * entry.quantity;
    }
    return total + this.gold;
  }

  /**
   * Add gold
   * @param {number} amount
   */
  addGold(amount) {
    this.gold += amount;
  }

  /**
   * Remove gold
   * @param {number} amount
   * @returns {boolean} Success
   */
  removeGold(amount) {
    if (this.gold >= amount) {
      this.gold -= amount;
      return true;
    }
    return false;
  }

  /**
   * Sort inventory by criteria
   * @param {string} criteria - 'name', 'type', 'value', 'weight', 'rarity'
   */
  sort(criteria = 'name') {
    const entries = Array.from(this.items.entries());

    entries.sort((a, b) => {
      const itemA = a[1].item;
      const itemB = b[1].item;

      switch (criteria) {
        case 'name':
          return itemA.name.localeCompare(itemB.name);
        case 'type':
          return itemA.type.localeCompare(itemB.type);
        case 'value':
          return itemB.value - itemA.value;
        case 'weight':
          return itemB.weight - itemA.weight;
        case 'rarity':
          const rarityOrder = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
          return rarityOrder[itemB.rarity] - rarityOrder[itemA.rarity];
        default:
          return 0;
      }
    });

    this.items = new Map(entries);
  }

  /**
   * Clear inventory
   */
  clear() {
    this.items.clear();
    this.gold = 0;
  }

  /**
   * Get inventory summary
   * @returns {Object}
   */
  getSummary() {
    return {
      itemCount: this.items.size,
      maxSlots: this.maxSlots,
      totalWeight: this.getTotalWeight(),
      maxWeight: this.maxWeight,
      gold: this.gold,
      totalValue: this.getTotalValue()
    };
  }

  /**
   * Serialize to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      maxSlots: this.maxSlots,
      maxWeight: this.maxWeight,
      items: Array.from(this.items.entries()).map(([id, entry]) => ({
        id,
        item: entry.item.toJSON(),
        quantity: entry.quantity
      })),
      gold: this.gold
    };
  }

  /**
   * Deserialize from JSON
   * @param {Object} data
   * @returns {Inventory}
   */
  static fromJSON(data) {
    const inventory = new Inventory({
      maxSlots: data.maxSlots,
      maxWeight: data.maxWeight,
      gold: data.gold
    });

    if (data.items) {
      data.items.forEach(entry => {
        const item = Item.fromJSON(entry.item);
        inventory.items.set(entry.id, {
          item,
          quantity: entry.quantity
        });
      });
    }

    return inventory;
  }
}

export default Inventory;
