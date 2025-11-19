/**
 * CharacterFactory - Helper functions for creating fully-equipped characters
 *
 * Simplifies creating player characters and NPCs with all RPG systems initialized
 */

import { Character } from '../entities/Character.js';
import { CharacterStats } from '../systems/stats/CharacterStats.js';
import { Inventory } from '../systems/items/Inventory.js';
import { Equipment } from '../systems/items/Equipment.js';
import { Item } from '../systems/items/Item.js';
import { AbilityManager } from '../systems/abilities/AbilityManager.js';
import { Ability } from '../systems/abilities/Ability.js';
import { CombatAI } from '../systems/combat/CombatAI.js';
import { Personality } from '../ai/personality/Personality.js';
import { getItem, getStarterEquipment } from '../data/items.js';
import { getEnemy } from '../data/enemies.js';
import { getStarterAbilities } from '../data/abilities.js';

/**
 * Create a player character with stats and starter equipment
 * @param {string} name - Character name
 * @param {Object} options - Configuration options
 * @returns {Character}
 */
export function createPlayer(name = 'Hero', options = {}) {
  const player = new Character('player', name, {
    role: 'protagonist',
    backstory: options.backstory || 'A brave adventurer seeking fortune and glory',
    occupation: options.occupation || 'Adventurer',
    age: options.age || 25
  });

  // Initialize stats
  player.stats = new CharacterStats({
    strength: options.strength || 12,
    dexterity: options.dexterity || 12,
    constitution: options.constitution || 12,
    intelligence: options.intelligence || 12,
    wisdom: options.wisdom || 12,
    charisma: options.charisma || 12,
    level: options.level || 1
  });

  // Initialize inventory
  player.inventory = new Inventory({
    maxSlots: options.inventorySlots || 20,
    gold: options.startingGold || 100
  });

  // Initialize equipment
  player.equipment = new Equipment();

  // Add starter equipment
  const starterItems = options.starterEquipment || getStarterEquipment();
  starterItems.forEach(itemId => {
    const itemData = getItem(itemId);
    if (itemData) {
      const item = new Item(itemData);

      // Try to equip if equippable
      if (item.equippable) {
        const equipResult = player.equipment.equip(item, player.stats);
        if (!equipResult.success) {
          // If can't equip, add to inventory
          player.inventory.addItem(item, 1);
        }
      } else {
        // Add consumables and other items to inventory
        player.inventory.addItem(item, 1);
      }
    }
  });

  // Initialize abilities
  player.abilities = new AbilityManager(player.id);

  // Learn starter abilities based on stats
  const starterAbilities = getStarterAbilities(player.stats.level, player.stats.attributes);
  starterAbilities.forEach(ability => {
    player.abilities.learnAbility(ability);
  });

  // Learn custom abilities if provided
  if (options.starterAbilities) {
    options.starterAbilities.forEach(abilityData => {
      const ability = new Ability(abilityData);
      player.abilities.learnAbility(ability);
    });
  }

  return player;
}

/**
 * Create an NPC from enemy database
 * @param {string} enemyId - Enemy ID from database
 * @param {Object} options - Override options
 * @returns {Character}
 */
export function createEnemyCharacter(enemyId, options = {}) {
  const enemyData = getEnemy(enemyId);
  if (!enemyData) {
    throw new Error(`Enemy ${enemyId} not found in database`);
  }

  const uniqueId = options.id || `enemy_${enemyId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const enemy = new Character(uniqueId, options.name || enemyData.name, {
    role: 'npc',
    backstory: enemyData.description,
    occupation: 'Enemy',
    age: options.age
  });

  // Set up stats
  enemy.stats = new CharacterStats({
    ...enemyData.stats,
    level: enemyData.level,
    physicalResistance: enemyData.resistances?.physical || 0,
    magicalResistance: enemyData.resistances?.magical || 0,
    fireResistance: enemyData.resistances?.fire || 0,
    coldResistance: enemyData.resistances?.cold || 0,
    lightningResistance: enemyData.resistances?.lightning || 0,
    poisonResistance: enemyData.resistances?.poison || 0
  });

  // Set up equipment
  enemy.equipment = new Equipment();
  if (enemyData.equipment) {
    for (const [slot, itemData] of Object.entries(enemyData.equipment)) {
      const item = new Item({ ...itemData, id: `${uniqueId}_${slot}` });
      enemy.equipment.equip(item, enemy.stats);
    }
  }

  // Set up abilities
  enemy.abilities = new AbilityManager(enemy.id);
  if (enemyData.abilities) {
    enemyData.abilities.forEach((abilityData, index) => {
      const ability = new Ability({
        ...abilityData,
        id: `${uniqueId}_ability_${index}`
      });
      enemy.abilities.learnAbility(ability);
    });
  }

  // Set up inventory
  enemy.inventory = new Inventory({ maxSlots: 10 });

  // Set up AI
  enemy.ai = new CombatAI({ behavior: enemyData.behavior || 'balanced' });

  // Store loot data for when enemy is defeated
  enemy.lootData = enemyData.loot;

  return enemy;
}

/**
 * Create a custom NPC with specified stats
 * @param {string} name - NPC name
 * @param {Object} config - NPC configuration
 * @returns {Character}
 */
export function createNPC(name, config = {}) {
  const npc = new Character(config.id || `npc_${Date.now()}`, name, {
    role: 'npc',
    backstory: config.backstory || '',
    occupation: config.occupation || 'Citizen',
    age: config.age || 30,
    personality: config.personality || new Personality()
  });

  // Add stats if specified
  if (config.withCombat) {
    npc.stats = new CharacterStats({
      strength: config.strength || 10,
      dexterity: config.dexterity || 10,
      constitution: config.constitution || 10,
      intelligence: config.intelligence || 10,
      wisdom: config.wisdom || 10,
      charisma: config.charisma || 10,
      level: config.level || 1
    });

    npc.inventory = new Inventory({ maxSlots: 15 });
    npc.equipment = new Equipment();
    npc.abilities = new AbilityManager(npc.id);

    // Add AI if behavior specified
    if (config.behavior) {
      npc.ai = new CombatAI({ behavior: config.behavior });
    }
  }

  return npc;
}

/**
 * Equip item to character
 * @param {Character} character
 * @param {string} itemId
 * @returns {Object} Result
 */
export function equipItem(character, itemId) {
  if (!character.equipment) {
    return { success: false, reason: 'Character has no equipment system' };
  }

  const itemEntry = character.inventory?.getItem(itemId);
  if (!itemEntry) {
    return { success: false, reason: 'Item not in inventory' };
  }

  const result = character.equipment.equip(itemEntry.item, character.stats);

  if (result.success) {
    // Remove from inventory
    character.inventory.removeItem(itemId, 1);

    // Add previous item back to inventory if there was one
    if (result.previousItem) {
      character.inventory.addItem(result.previousItem, 1);
    }
  }

  return result;
}

/**
 * Unequip item from character
 * @param {Character} character
 * @param {string} slot
 * @returns {Object} Result
 */
export function unequipItem(character, slot) {
  if (!character.equipment) {
    return { success: false, reason: 'Character has no equipment system' };
  }

  const result = character.equipment.unequip(slot, character.stats);

  if (result.success && result.item) {
    // Add to inventory
    character.inventory?.addItem(result.item, 1);
  }

  return result;
}

/**
 * Give item to character
 * @param {Character} character
 * @param {string} itemId
 * @param {number} quantity
 * @returns {Object} Result
 */
export function giveItem(character, itemId, quantity = 1) {
  if (!character.inventory) {
    return { success: false, reason: 'Character has no inventory' };
  }

  const itemData = getItem(itemId);
  if (!itemData) {
    return { success: false, reason: 'Item not found' };
  }

  const item = new Item(itemData);
  return character.inventory.addItem(item, quantity);
}

/**
 * Teach ability to character
 * @param {Character} character
 * @param {Object} abilityData - Ability configuration
 * @returns {boolean} Success
 */
export function teachAbility(character, abilityData) {
  if (!character.abilities) {
    return false;
  }

  const ability = new Ability(abilityData);
  return character.abilities.learnAbility(ability);
}

/**
 * Apply experience to character
 * @param {Character} character
 * @param {number} amount
 * @returns {Object} Result with level up info
 */
export function giveExperience(character, amount) {
  if (!character.stats) {
    return { success: false, reason: 'Character has no stats' };
  }

  return character.stats.gainExperience(amount);
}

/**
 * Fully restore character (heal, restore resources, remove status effects)
 * @param {Character} character
 */
export function restoreCharacter(character) {
  if (character.stats) {
    character.stats.rest();
  }

  if (character.abilities) {
    character.abilities.resetAllCooldowns();
  }
}

/**
 * Get character display info
 * @param {Character} character
 * @returns {Object}
 */
export function getCharacterInfo(character) {
  const info = {
    name: character.name,
    role: character.role,
    occupation: character.occupation,
    backstory: character.backstory
  };

  if (character.stats) {
    info.level = character.stats.level;
    info.hp = `${character.stats.currentHP}/${character.stats.maxHP}`;
    info.stats = {
      strength: character.stats.attributes.strength,
      dexterity: character.stats.attributes.dexterity,
      constitution: character.stats.attributes.constitution,
      intelligence: character.stats.attributes.intelligence,
      wisdom: character.stats.attributes.wisdom,
      charisma: character.stats.attributes.charisma
    };
  }

  if (character.inventory) {
    info.gold = character.inventory.gold;
    info.itemCount = character.inventory.items.size;
  }

  if (character.equipment) {
    info.equipment = character.equipment.getAllEquipped().map(e => ({
      slot: e.slot,
      item: e.item.name
    }));
  }

  if (character.abilities) {
    info.abilities = character.abilities.getAllAbilities().map(a => a.name);
  }

  return info;
}

export default {
  createPlayer,
  createEnemyCharacter,
  createNPC,
  equipItem,
  unequipItem,
  giveItem,
  teachAbility,
  giveExperience,
  restoreCharacter,
  getCharacterInfo
};
