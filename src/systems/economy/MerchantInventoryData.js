import { Item } from '../items/Item.js';

/**
 * Sample merchant inventories for various NPCs
 * This defines what items merchants have for sale and their base prices
 */

/**
 * Create a basic item
 */
function createItem(data) {
  return new Item(data);
}

/**
 * Elara's Merchant Inventory (Traveling Merchant)
 * Sells rare goods, potions, and trade items
 */
export const ELARA_INVENTORY = [
  {
    item: createItem({
      id: 'health_potion',
      name: 'Health Potion',
      description: 'Restores 50 HP',
      type: 'consumable',
      value: 25,
      weight: 0.5,
      rarity: 'common',
      stackable: true,
      maxStack: 10,
      usable: true,
      consumable: true,
      effects: { heal: 50 }
    }),
    quantity: 10,
    basePrice: 25
  },
  {
    item: createItem({
      id: 'stamina_draught',
      name: 'Stamina Draught',
      description: 'Restores 30 Stamina',
      type: 'consumable',
      value: 20,
      weight: 0.5,
      rarity: 'common',
      stackable: true,
      maxStack: 10,
      usable: true,
      consumable: true,
      effects: { restoreStamina: 30 }
    }),
    quantity: 8,
    basePrice: 20
  },
  {
    item: createItem({
      id: 'travelers_cloak',
      name: "Traveler's Cloak",
      description: 'A sturdy cloak for long journeys',
      type: 'armor',
      value: 50,
      weight: 3,
      rarity: 'common',
      equippable: true,
      equipSlot: 'chest',
      stats: { defense: 2 }
    }),
    quantity: 3,
    basePrice: 50
  },
  {
    item: createItem({
      id: 'rare_spice',
      name: 'Exotic Spice',
      description: 'A rare spice from distant lands',
      type: 'misc',
      value: 40,
      weight: 0.2,
      rarity: 'uncommon',
      stackable: true,
      maxStack: 20,
      tradeable: true
    }),
    quantity: 15,
    basePrice: 40
  }
];

/**
 * Grok's Blacksmith Inventory
 * Sells weapons, armor, and repairs items
 */
export const GROK_INVENTORY = [
  {
    item: createItem({
      id: 'iron_sword',
      name: 'Iron Sword',
      description: 'A well-crafted iron sword',
      type: 'weapon',
      value: 75,
      weight: 5,
      rarity: 'common',
      equippable: true,
      equipSlot: 'weapon',
      stats: { attack: 10, strength: 2 }
    }),
    quantity: 5,
    basePrice: 75
  },
  {
    item: createItem({
      id: 'leather_armor',
      name: 'Leather Armor',
      description: 'Basic leather protection',
      type: 'armor',
      value: 60,
      weight: 8,
      rarity: 'common',
      equippable: true,
      equipSlot: 'chest',
      stats: { defense: 5 }
    }),
    quantity: 3,
    basePrice: 60
  },
  {
    item: createItem({
      id: 'steel_dagger',
      name: 'Steel Dagger',
      description: 'A sharp steel dagger',
      type: 'weapon',
      value: 45,
      weight: 2,
      rarity: 'common',
      equippable: true,
      equipSlot: 'weapon',
      stats: { attack: 6, dexterity: 1 }
    }),
    quantity: 7,
    basePrice: 45
  },
  {
    item: createItem({
      id: 'iron_ingot',
      name: 'Iron Ingot',
      description: 'Raw iron for crafting',
      type: 'material',
      value: 15,
      weight: 5,
      rarity: 'common',
      stackable: true,
      maxStack: 50
    }),
    quantity: 30,
    basePrice: 15
  }
];

/**
 * Mara's Tavern Inventory (Red Griffin Inn)
 * Sells food, drink, and lodging
 */
export const MARA_INVENTORY = [
  {
    item: createItem({
      id: 'bread_loaf',
      name: 'Loaf of Bread',
      description: 'Fresh baked bread',
      type: 'consumable',
      value: 3,
      weight: 1,
      rarity: 'common',
      stackable: true,
      maxStack: 20,
      usable: true,
      consumable: true,
      effects: { heal: 10 }
    }),
    quantity: 30,
    basePrice: 3
  },
  {
    item: createItem({
      id: 'ale_mug',
      name: 'Mug of Ale',
      description: 'Refreshing tavern ale',
      type: 'consumable',
      value: 5,
      weight: 1,
      rarity: 'common',
      stackable: true,
      maxStack: 10,
      usable: true,
      consumable: true,
      effects: { restoreStamina: 10 }
    }),
    quantity: 50,
    basePrice: 5
  },
  {
    item: createItem({
      id: 'cooked_meal',
      name: 'Hot Meal',
      description: 'A hearty cooked meal',
      type: 'consumable',
      value: 10,
      weight: 1.5,
      rarity: 'common',
      stackable: true,
      maxStack: 10,
      usable: true,
      consumable: true,
      effects: { heal: 25, restoreStamina: 15 }
    }),
    quantity: 20,
    basePrice: 10
  }
];

/**
 * Initialize merchant inventories
 * Call this function to set up merchant inventories for NPCs
 * @param {TradingSystem} tradingSystem - Trading system instance
 * @param {Map} npcs - Map of NPCs
 */
export function initializeMerchantInventories(tradingSystem, npcs) {
  // Set up Elara's inventory
  const elara = npcs.get('elara');
  if (elara) {
    tradingSystem.setMerchantInventory('elara', ELARA_INVENTORY);
    // Give Elara starting gold
    elara.addGold(500);
  }

  // Set up Grok's inventory
  const grok = npcs.get('grok');
  if (grok) {
    tradingSystem.setMerchantInventory('grok', GROK_INVENTORY);
    // Give Grok starting gold
    grok.addGold(300);
  }

  // Set up Mara's inventory
  const mara = npcs.get('mara');
  if (mara) {
    tradingSystem.setMerchantInventory('mara', MARA_INVENTORY);
    // Give Mara starting gold
    mara.addGold(200);
  }

  console.log('[MerchantInventory] Initialized merchant inventories for Elara, Grok, and Mara');
}

export default {
  ELARA_INVENTORY,
  GROK_INVENTORY,
  MARA_INVENTORY,
  initializeMerchantInventories
};
