import { Item } from '../items/Item.js';

/**
 * Trading System - Handles buying, selling, and bartering between characters
 *
 * Features:
 * - Buy/Sell items with NPCs
 * - Dynamic pricing based on NPC traits and relationships
 * - Merchant inventories
 * - Service purchasing (healing, repairs, etc.)
 *
 * @class TradingSystem
 */
export class TradingSystem {
  constructor() {
    this.merchantInventories = new Map(); // Map<merchantId, Array<{item, quantity, basePrice}>>
  }

  /**
   * Initialize a merchant's inventory
   * @param {string} merchantId - NPC ID
   * @param {Array} items - Array of {item, quantity, basePrice}
   */
  setMerchantInventory(merchantId, items) {
    this.merchantInventories.set(merchantId, items);
  }

  /**
   * Get merchant's inventory
   * @param {string} merchantId
   * @returns {Array}
   */
  getMerchantInventory(merchantId) {
    return this.merchantInventories.get(merchantId) || [];
  }

  /**
   * Calculate buy price for an item
   * @param {Item} item - Item to buy
   * @param {Character} merchant - Merchant NPC
   * @param {Character} buyer - Buyer character
   * @returns {number} Price
   */
  calculateBuyPrice(item, merchant, buyer) {
    let price = item.value;

    // Apply merchant's greed modifier
    if (merchant.personality) {
      const greedFactor = 1 + (merchant.personality.traits.greed / 200); // 0% greed = 1.0x, 100% greed = 1.5x
      price *= greedFactor;
    }

    // Apply relationship discount
    if (merchant.relationships && buyer) {
      const relationship = merchant.relationships.getRelationshipLevel(buyer.id);
      const discount = Math.max(0, relationship / 200); // Max 50% discount at 100 relationship
      price *= (1 - discount);
    }

    // Apply rarity multiplier
    const rarityMultipliers = {
      common: 1.0,
      uncommon: 1.5,
      rare: 2.5,
      epic: 5.0,
      legendary: 10.0
    };
    price *= (rarityMultipliers[item.rarity] || 1.0);

    return Math.ceil(price);
  }

  /**
   * Calculate sell price for an item (player selling to merchant)
   * @param {Item} item - Item to sell
   * @param {Character} merchant - Merchant NPC
   * @param {Character} seller - Seller character
   * @returns {number} Price
   */
  calculateSellPrice(item, merchant, seller) {
    // Merchants typically buy for 40-60% of base value
    let price = item.value * 0.5;

    // Apply merchant's greed (reduces buy-back price)
    if (merchant.personality) {
      const greedFactor = 1 - (merchant.personality.traits.greed / 200); // Higher greed = lower buyback
      price *= greedFactor;
    }

    // Apply relationship bonus
    if (merchant.relationships && seller) {
      const relationship = merchant.relationships.getRelationshipLevel(seller.id);
      const bonus = relationship / 200; // Max 50% bonus at 100 relationship
      price *= (1 + bonus);
    }

    // Apply rarity multiplier
    const rarityMultipliers = {
      common: 1.0,
      uncommon: 1.3,
      rare: 2.0,
      epic: 4.0,
      legendary: 8.0
    };
    price *= (rarityMultipliers[item.rarity] || 1.0);

    return Math.floor(price);
  }

  /**
   * Buy item from merchant
   * @param {Character} buyer - Buyer character
   * @param {Character} merchant - Merchant NPC
   * @param {Item} item - Item to buy
   * @param {number} quantity - Quantity to buy
   * @returns {Object} Result
   */
  buyItem(buyer, merchant, item, quantity = 1) {
    const price = this.calculateBuyPrice(item, merchant, buyer);
    const totalCost = price * quantity;

    // Check if buyer has enough gold
    if (!buyer.hasGold(totalCost)) {
      return {
        success: false,
        reason: 'Not enough gold',
        requiredGold: totalCost,
        currentGold: buyer.getGold()
      };
    }

    // Check if merchant has the item
    const merchantInventory = this.getMerchantInventory(merchant.id);
    const merchantItem = merchantInventory.find(entry => entry.item.id === item.id);

    if (!merchantItem || merchantItem.quantity < quantity) {
      return {
        success: false,
        reason: 'Merchant does not have enough of that item',
        available: merchantItem ? merchantItem.quantity : 0
      };
    }

    // Check if buyer has inventory space
    const addResult = buyer.inventory.addItem(item, quantity);
    if (!addResult.success) {
      return {
        success: false,
        reason: addResult.reason
      };
    }

    // Complete transaction
    buyer.removeGold(totalCost);
    merchant.addGold(totalCost);

    // Remove from merchant inventory
    merchantItem.quantity -= quantity;
    if (merchantItem.quantity === 0) {
      const index = merchantInventory.indexOf(merchantItem);
      merchantInventory.splice(index, 1);
    }

    // Improve relationship slightly
    if (merchant.relationships) {
      merchant.relationships.adjustRelationship(buyer.id, 1);
    }

    return {
      success: true,
      item: item,
      quantity: quantity,
      totalCost: totalCost,
      remainingGold: buyer.getGold()
    };
  }

  /**
   * Sell item to merchant
   * @param {Character} seller - Seller character
   * @param {Character} merchant - Merchant NPC
   * @param {string} itemId - Item ID to sell
   * @param {number} quantity - Quantity to sell
   * @returns {Object} Result
   */
  sellItem(seller, merchant, itemId, quantity = 1) {
    // Check if seller has the item
    if (!seller.inventory.hasItem(itemId, quantity)) {
      return {
        success: false,
        reason: 'You do not have that item'
      };
    }

    const itemEntry = seller.inventory.getItem(itemId);
    const item = itemEntry.item;

    // Check if item is tradeable
    if (!item.tradeable) {
      return {
        success: false,
        reason: 'This item cannot be sold'
      };
    }

    const price = this.calculateSellPrice(item, merchant, seller);
    const totalValue = price * quantity;

    // Check if merchant has enough gold
    if (!merchant.hasGold(totalValue)) {
      return {
        success: false,
        reason: 'Merchant does not have enough gold',
        merchantGold: merchant.getGold()
      };
    }

    // Remove item from seller
    const removeResult = seller.inventory.removeItem(itemId, quantity);
    if (!removeResult.success) {
      return {
        success: false,
        reason: removeResult.reason
      };
    }

    // Complete transaction
    seller.addGold(totalValue);
    merchant.removeGold(totalValue);

    // Add to merchant inventory
    const merchantInventory = this.getMerchantInventory(merchant.id);
    const existingEntry = merchantInventory.find(entry => entry.item.id === item.id);

    if (existingEntry) {
      existingEntry.quantity += quantity;
    } else {
      merchantInventory.push({
        item: item,
        quantity: quantity,
        basePrice: item.value
      });
    }

    // Improve relationship
    if (merchant.relationships) {
      merchant.relationships.adjustRelationship(seller.id, 1);
    }

    return {
      success: true,
      item: item,
      quantity: quantity,
      totalValue: totalValue,
      remainingGold: seller.getGold()
    };
  }

  /**
   * Purchase a service from an NPC
   * @param {Character} customer - Customer character
   * @param {Character} serviceProvider - Service provider NPC
   * @param {string} serviceType - Type of service ('heal', 'repair', 'identify', etc.)
   * @param {Object} options - Service options
   * @returns {Object} Result
   */
  purchaseService(customer, serviceProvider, serviceType, options = {}) {
    const servicePrices = {
      heal: 10, // per HP restored
      fullHeal: 50,
      repair: 20, // per item
      identify: 15,
      blessing: 100,
      training: 50
    };

    let cost = servicePrices[serviceType] || 50;

    // Apply relationship discount
    if (serviceProvider.relationships) {
      const relationship = serviceProvider.relationships.getRelationshipLevel(customer.id);
      const discount = relationship / 200; // Max 50% discount
      cost *= (1 - discount);
    }

    // Apply service-specific multipliers
    if (serviceType === 'heal' && options.amount) {
      cost *= options.amount;
    }

    cost = Math.ceil(cost);

    // Check if customer has enough gold
    if (!customer.hasGold(cost)) {
      return {
        success: false,
        reason: 'Not enough gold',
        requiredGold: cost,
        currentGold: customer.getGold()
      };
    }

    // Complete transaction
    customer.removeGold(cost);
    serviceProvider.addGold(cost);

    // Apply service effect
    const effect = this._applyServiceEffect(customer, serviceType, options);

    // Improve relationship
    if (serviceProvider.relationships) {
      serviceProvider.relationships.adjustRelationship(customer.id, 2);
    }

    return {
      success: true,
      serviceType: serviceType,
      cost: cost,
      effect: effect,
      remainingGold: customer.getGold()
    };
  }

  /**
   * Apply service effect to customer
   * @private
   */
  _applyServiceEffect(customer, serviceType, options) {
    switch (serviceType) {
      case 'heal':
        if (customer.stats && options.amount) {
          const healed = customer.stats.heal(options.amount);
          return { healed: healed };
        }
        break;

      case 'fullHeal':
        if (customer.stats) {
          customer.stats.currentHP = customer.stats.maxHP;
          customer.stats.currentStamina = customer.stats.maxStamina;
          customer.stats.currentMagic = customer.stats.maxMagic;
          return { restored: 'full' };
        }
        break;

      case 'repair':
        // TODO: Implement item repair
        return { repaired: true };

      case 'identify':
        // TODO: Implement item identification
        return { identified: true };

      default:
        return { applied: true };
    }

    return null;
  }

  /**
   * Get trade summary between two characters
   * @param {Character} character1
   * @param {Character} character2
   * @returns {Object}
   */
  getTradeSummary(character1, character2) {
    return {
      character1: {
        name: character1.name,
        gold: character1.getGold(),
        inventoryCount: character1.inventory ? character1.inventory.items.size : 0
      },
      character2: {
        name: character2.name,
        gold: character2.getGold(),
        inventoryCount: character2.inventory ? character2.inventory.items.size : 0
      },
      relationship: character2.relationships ?
        character2.relationships.getRelationshipLevel(character1.id) : 0
    };
  }
}

export default TradingSystem;
