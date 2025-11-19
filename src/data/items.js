/**
 * Item definitions for OllamaRPG
 *
 * Base items that can be found, crafted, or purchased
 */

export const ITEMS = {
  // Consumables
  'health_potion': {
    name: 'Health Potion',
    type: 'consumable',
    description: 'A red potion that restores health',
    usable: true,
    consumable: true,
    effects: { heal: 50 },
    value: 25,
    weight: 0.5,
    stackable: true,
    maxStack: 10,
    rarity: 'common'
  },

  'mana_potion': {
    name: 'Mana Potion',
    type: 'consumable',
    description: 'A blue potion that restores magic',
    usable: true,
    consumable: true,
    effects: { restoreMagic: 40 },
    value: 30,
    weight: 0.5,
    stackable: true,
    maxStack: 10,
    rarity: 'common'
  },

  'stamina_potion': {
    name: 'Stamina Potion',
    type: 'consumable',
    description: 'A green potion that restores stamina',
    usable: true,
    consumable: true,
    effects: { restoreStamina: 60 },
    value: 20,
    weight: 0.5,
    stackable: true,
    maxStack: 10,
    rarity: 'common'
  },

  'elixir_of_strength': {
    name: 'Elixir of Strength',
    type: 'consumable',
    description: 'Temporarily increases strength',
    usable: true,
    consumable: true,
    effects: {
      buff: { stat: 'strength', amount: 3, duration: 5 }
    },
    value: 50,
    weight: 0.5,
    rarity: 'uncommon'
  },

  // Weapons
  'wooden_club': {
    name: 'Wooden Club',
    type: 'weapon',
    description: 'A simple wooden club',
    equippable: true,
    equipSlot: 'weapon',
    stats: { attack: 5 },
    value: 5,
    weight: 3,
    rarity: 'common',
    customProperties: { range: 'melee' }
  },

  'iron_sword': {
    name: 'Iron Sword',
    type: 'weapon',
    description: 'A well-made iron sword',
    equippable: true,
    equipSlot: 'weapon',
    stats: { attack: 10, criticalChance: 0.05 },
    requirements: { strength: 10 },
    value: 50,
    weight: 5,
    rarity: 'common',
    customProperties: { range: 'melee' }
  },

  'steel_longsword': {
    name: 'Steel Longsword',
    type: 'weapon',
    description: 'A finely crafted steel longsword',
    equippable: true,
    equipSlot: 'weapon',
    stats: { attack: 15, criticalChance: 0.08 },
    requirements: { strength: 12, level: 3 },
    value: 120,
    weight: 6,
    rarity: 'uncommon',
    customProperties: { range: 'melee' }
  },

  'battle_axe': {
    name: 'Battle Axe',
    type: 'weapon',
    description: 'A heavy axe designed for warfare',
    equippable: true,
    equipSlot: 'weapon',
    stats: { attack: 18, criticalChance: 0.12 },
    requirements: { strength: 14, level: 4 },
    value: 150,
    weight: 8,
    rarity: 'uncommon',
    customProperties: { range: 'melee' }
  },

  'wooden_bow': {
    name: 'Wooden Bow',
    type: 'weapon',
    description: 'A simple hunting bow',
    equippable: true,
    equipSlot: 'weapon',
    stats: { attack: 8 },
    requirements: { dexterity: 10 },
    value: 40,
    weight: 2,
    rarity: 'common',
    customProperties: { range: 'long' }
  },

  'staff_of_fire': {
    name: 'Staff of Fire',
    type: 'weapon',
    description: 'A magical staff imbued with flame',
    equippable: true,
    equipSlot: 'weapon',
    stats: { attack: 6, magicPower: 12 },
    requirements: { intelligence: 12, level: 4 },
    value: 200,
    weight: 3,
    rarity: 'rare',
    customProperties: { range: 'medium' },
    tags: ['magical', 'fire']
  },

  // Armor - Chest
  'cloth_shirt': {
    name: 'Cloth Shirt',
    type: 'armor',
    description: 'A simple cloth shirt',
    equippable: true,
    equipSlot: 'chest',
    stats: { defense: 1 },
    value: 5,
    weight: 1,
    rarity: 'common'
  },

  'leather_armor': {
    name: 'Leather Armor',
    type: 'armor',
    description: 'Sturdy leather armor',
    equippable: true,
    equipSlot: 'chest',
    stats: { defense: 4 },
    requirements: { level: 2 },
    value: 50,
    weight: 8,
    rarity: 'common'
  },

  'chainmail': {
    name: 'Chainmail',
    type: 'armor',
    description: 'Interlocking metal rings provide good protection',
    equippable: true,
    equipSlot: 'chest',
    stats: { defense: 7, physicalResistance: 10 },
    requirements: { strength: 11, level: 4 },
    value: 150,
    weight: 20,
    rarity: 'uncommon'
  },

  'plate_armor': {
    name: 'Plate Armor',
    type: 'armor',
    description: 'Heavy steel plate armor',
    equippable: true,
    equipSlot: 'chest',
    stats: { defense: 12, physicalResistance: 20 },
    requirements: { strength: 14, level: 6 },
    value: 400,
    weight: 35,
    rarity: 'rare'
  },

  'dark_robes': {
    name: 'Dark Robes',
    type: 'armor',
    description: 'Enchanted robes favored by mages',
    equippable: true,
    equipSlot: 'chest',
    stats: { defense: 3, magicalResistance: 15, magicPower: 5 },
    requirements: { intelligence: 12, level: 5 },
    value: 250,
    weight: 3,
    rarity: 'rare',
    tags: ['magical']
  },

  // Armor - Other slots
  'leather_boots': {
    name: 'Leather Boots',
    type: 'armor',
    description: 'Comfortable leather boots',
    equippable: true,
    equipSlot: 'feet',
    stats: { defense: 1 },
    value: 15,
    weight: 2,
    rarity: 'common'
  },

  'iron_helm': {
    name: 'Iron Helm',
    type: 'armor',
    description: 'A solid iron helmet',
    equippable: true,
    equipSlot: 'head',
    stats: { defense: 3 },
    requirements: { strength: 10 },
    value: 40,
    weight: 5,
    rarity: 'common'
  },

  'leather_gloves': {
    name: 'Leather Gloves',
    type: 'armor',
    description: 'Flexible leather gloves',
    equippable: true,
    equipSlot: 'hands',
    stats: { defense: 1 },
    value: 12,
    weight: 1,
    rarity: 'common'
  },

  // Shields
  'wooden_shield': {
    name: 'Wooden Shield',
    type: 'armor',
    description: 'A simple wooden shield',
    equippable: true,
    equipSlot: 'offhand',
    stats: { defense: 3 },
    value: 20,
    weight: 5,
    rarity: 'common'
  },

  'steel_shield': {
    name: 'Steel Shield',
    type: 'armor',
    description: 'A sturdy steel shield',
    equippable: true,
    equipSlot: 'offhand',
    stats: { defense: 6, physicalResistance: 5 },
    requirements: { strength: 11 },
    value: 100,
    weight: 10,
    rarity: 'uncommon'
  },

  // Accessories
  'ring_of_protection': {
    name: 'Ring of Protection',
    type: 'armor',
    description: 'A magical ring that wards off harm',
    equippable: true,
    equipSlot: 'accessory1',
    stats: { defense: 2, physicalResistance: 5, magicalResistance: 5 },
    value: 200,
    weight: 0.1,
    rarity: 'rare',
    tags: ['magical']
  },

  'amulet_of_health': {
    name: 'Amulet of Health',
    type: 'armor',
    description: 'An amulet that enhances vitality',
    equippable: true,
    equipSlot: 'accessory2',
    stats: { maxHPBonus: 20 },
    customProperties: {
      applyOnEquip: (character) => {
        character.stats.maxHP += 20;
        character.stats.currentHP += 20;
      },
      removeOnUnequip: (character) => {
        character.stats.maxHP -= 20;
        if (character.stats.currentHP > character.stats.maxHP) {
          character.stats.currentHP = character.stats.maxHP;
        }
      }
    },
    value: 300,
    weight: 0.2,
    rarity: 'rare',
    tags: ['magical']
  },

  // Materials and quest items
  'wolf_pelt': {
    name: 'Wolf Pelt',
    type: 'material',
    description: 'The pelt of a wolf, useful for crafting',
    value: 10,
    weight: 2,
    stackable: true,
    maxStack: 20,
    rarity: 'common'
  },

  'bone_dust': {
    name: 'Bone Dust',
    type: 'material',
    description: 'Powdered bone, used in alchemy',
    value: 5,
    weight: 0.1,
    stackable: true,
    maxStack: 50,
    rarity: 'common'
  },

  'dragon_scale': {
    name: 'Dragon Scale',
    type: 'material',
    description: 'A shimmering scale from a dragon',
    value: 150,
    weight: 1,
    stackable: true,
    maxStack: 10,
    rarity: 'rare',
    lore: 'Dragon scales are prized for their beauty and magical properties'
  },

  'dragon_tooth': {
    name: 'Dragon Tooth',
    type: 'material',
    description: 'A fearsome tooth from a dragon',
    value: 100,
    weight: 1,
    stackable: true,
    maxStack: 10,
    rarity: 'rare'
  },

  'troll_blood': {
    name: 'Troll Blood',
    type: 'material',
    description: 'The regenerative blood of a troll',
    value: 80,
    weight: 0.5,
    stackable: true,
    maxStack: 5,
    rarity: 'uncommon'
  },

  'rare_gem': {
    name: 'Rare Gem',
    type: 'misc',
    description: 'A valuable gemstone',
    value: 200,
    weight: 0.1,
    stackable: true,
    maxStack: 10,
    rarity: 'rare'
  }
};

/**
 * Get item by ID
 * @param {string} itemId
 * @returns {Object|null}
 */
export function getItem(itemId) {
  return ITEMS[itemId] ? { ...ITEMS[itemId], id: itemId } : null;
}

/**
 * Get items by type
 * @param {string} type
 * @returns {Array}
 */
export function getItemsByType(type) {
  return Object.entries(ITEMS)
    .filter(([_, item]) => item.type === type)
    .map(([id, item]) => ({ ...item, id }));
}

/**
 * Get items by rarity
 * @param {string} rarity
 * @returns {Array}
 */
export function getItemsByRarity(rarity) {
  return Object.entries(ITEMS)
    .filter(([_, item]) => item.rarity === rarity)
    .map(([id, item]) => ({ ...item, id }));
}

/**
 * Create starter equipment for new player
 * @returns {Array} Array of item IDs
 */
export function getStarterEquipment() {
  return [
    'wooden_club',
    'cloth_shirt',
    'leather_boots',
    'health_potion',
    'health_potion'
  ];
}

export default ITEMS;
