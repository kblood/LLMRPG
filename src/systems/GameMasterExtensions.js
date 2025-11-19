/**
 * GameMasterExtensions - World-building powers for the Chronicler
 *
 * Extends GameMaster with dynamic content creation capabilities:
 * - Generate locations with LLM
 * - Generate enemies with stats
 * - Generate items with properties
 * - Combat narration
 *
 * These methods should be added to the existing GameMaster class
 */

import { Location } from './world/Location.js';
import { Item } from './items/Item.js';
import { Character } from '../entities/Character.js';
import { CharacterStats } from './stats/CharacterStats.js';
import { Equipment } from './items/Equipment.js';
import { Inventory } from './items/Inventory.js';
import { AbilityManager } from './abilities/AbilityManager.js';
import { Ability } from './abilities/Ability.js';
import { CombatAI } from './combat/CombatAI.js';

/**
 * Create a dynamic location using LLM
 * @param {Object} context - Context for generation
 * @returns {Promise<Location>}
 */
export async function createDynamicLocation(context = {}) {
  const {
    requestedBy = 'player', // Who's asking for this location
    purpose = 'exploration', // Why it's being created
    nearLocation = null, // Location ID this should be near
    suggestedName = null,
    suggestedType = 'area',
    playerLevel = 1,
    currentWeather = 'clear',
    currentSeason = 'spring'
  } = context;

  // Build LLM prompt
  const prompt = `You are the Chronicler, a masterful game master creating a new location for an RPG adventure.

Context:
- Requested by: ${requestedBy}
- Purpose: ${purpose}
${suggestedName ? `- Suggested name: ${suggestedName}` : ''}
${suggestedType ? `- Type: ${suggestedType}` : ''}
- Player level: ${playerLevel}
- Current weather: ${currentWeather}
- Current season: ${currentSeason}
${nearLocation ? `- Near: ${nearLocation}` : ''}

Create a new location that fits naturally into the world. Consider:
1. What makes this place interesting and memorable?
2. What dangers or opportunities exist here?
3. What is the atmosphere and mood?
4. Are there any hidden secrets or points of interest?

Respond in JSON format:
{
  "name": "Location Name",
  "type": "area|building|room|dungeon|wilderness|region",
  "description": "Vivid 2-3 sentence description",
  "indoor": true/false,
  "lit": true/false,
  "safe": true/false,
  "temperature": "cold|temperate|warm|hot",
  "hazards": ["list", "of", "hazards"],
  "tags": ["descriptive", "tags"],
  "lore": "Optional interesting backstory",
  "suggestedEncounters": ["enemy_type1", "enemy_type2"],
  "suggestedItems": ["item_type1", "item_type2"],
  "scale": 1 (size multiplier: 0.1=room, 1=building, 10=area, 100=town, 1000=region)
}`;

  try {
    // Call LLM (this.ollamaService should be available in GameMaster)
    const response = await this.ollamaService.generateCompletion(prompt, {
      temperature: 0.8,
      maxTokens: 500
    });

    // Parse LLM response
    let locationData;
    try {
      // Extract JSON from response (might be wrapped in markdown)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        locationData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse LLM response:', parseError);
      // Fallback to default location
      locationData = {
        name: suggestedName || 'Mysterious Place',
        type: suggestedType,
        description: 'An interesting location that has yet to reveal its secrets.',
        indoor: false,
        lit: true,
        safe: false,
        temperature: 'temperate',
        hazards: [],
        tags: ['mysterious'],
        scale: 1
      };
    }

    // Calculate coordinates (if near another location)
    let x = 0, y = 0, z = 0;
    if (nearLocation && this.worldManager) {
      const nearLoc = this.worldManager.getLocation(nearLocation);
      if (nearLoc) {
        // Place nearby with some randomness
        x = nearLoc.coordinates.x + (Math.random() * 20 - 10);
        y = nearLoc.coordinates.y + (Math.random() * 20 - 10);
        z = nearLoc.coordinates.z;
      }
    } else {
      // Random coordinates
      x = Math.random() * 100;
      y = Math.random() * 100;
    }

    // Create location
    const location = new Location({
      ...locationData,
      x,
      y,
      z,
      createdBy: 'chronicler',
      discovered: false,
      visited: false
    });

    // Add to world if worldManager is available
    if (this.worldManager) {
      this.worldManager.addLocation(location);
    }

    // Log creation event
    this.eventBus?.emit('location:created', {
      location,
      context
    });

    return location;

  } catch (error) {
    console.error('Failed to create dynamic location:', error);

    // Return a safe fallback location
    return new Location({
      name: suggestedName || 'Unknown Location',
      type: suggestedType || 'area',
      description: 'A place shrouded in mystery.',
      x: 0,
      y: 0,
      z: 0,
      indoor: false,
      lit: true,
      safe: true,
      createdBy: 'chronicler'
    });
  }
}

/**
 * Create a dynamic enemy using LLM
 * @param {Object} context - Context for generation
 * @returns {Promise<Character>}
 */
export async function createDynamicEnemy(context = {}) {
  const {
    playerLevel = 1,
    location = null,
    difficulty = 'medium', // easy, medium, hard, boss
    suggestedType = null,
    quantity = 1
  } = context;

  const prompt = `You are the Chronicler creating an enemy encounter for an RPG.

Context:
- Player level: ${playerLevel}
- Difficulty: ${difficulty}
- Location: ${location || 'unknown'}
${suggestedType ? `- Enemy type: ${suggestedType}` : ''}

Create an enemy that is challenging but fair for the player's level.

Respond in JSON format:
{
  "name": "Enemy Name",
  "description": "Brief description",
  "level": ${Math.max(1, playerLevel + (difficulty === 'easy' ? -1 : difficulty === 'hard' ? 1 : difficulty === 'boss' ? 3 : 0))},
  "stats": {
    "strength": 8-18,
    "dexterity": 8-18,
    "constitution": 8-18,
    "intelligence": 3-15,
    "wisdom": 3-15,
    "charisma": 3-15
  },
  "equipment": {
    "weapon": {"name": "weapon name", "attack": 5-15},
    "armor": {"name": "armor name", "defense": 2-10}
  },
  "abilities": [
    {"name": "ability name", "type": "attack|defense|buff", "damage": 10-30, "cooldown": 2-5}
  ],
  "behavior": "aggressive|defensive|balanced|coward",
  "loot": {
    "experienceValue": ${50 * playerLevel},
    "goldRange": [5, ${20 * playerLevel}],
    "items": ["possible_item_drops"]
  }
}`;

  try {
    const response = await this.ollamaService.generateCompletion(prompt, {
      temperature: 0.7,
      maxTokens: 600
    });

    let enemyData;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      enemyData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (parseError) {
      enemyData = null;
    }

    if (!enemyData) {
      // Fallback enemy
      enemyData = {
        name: suggestedType || 'Hostile Creature',
        description: 'A dangerous foe',
        level: playerLevel,
        stats: {
          strength: 10 + playerLevel,
          dexterity: 10 + playerLevel,
          constitution: 10 + playerLevel,
          intelligence: 8,
          wisdom: 8,
          charisma: 6
        },
        behavior: 'balanced',
        loot: {
          experienceValue: 50 * playerLevel,
          goldRange: [5, 20 * playerLevel]
        }
      };
    }

    // Create character
    const enemyId = `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const enemy = new Character(enemyId, enemyData.name, {
      role: 'npc',
      backstory: enemyData.description
    });

    // Add stats
    enemy.stats = new CharacterStats({
      ...enemyData.stats,
      level: enemyData.level
    });

    // Add equipment
    enemy.equipment = new Equipment();
    if (enemyData.equipment) {
      if (enemyData.equipment.weapon) {
        const weapon = new Item({
          ...enemyData.equipment.weapon,
          id: `${enemyId}_weapon`,
          type: 'weapon',
          equipSlot: 'weapon',
          equippable: true,
          stats: { attack: enemyData.equipment.weapon.attack || 5 }
        });
        enemy.equipment.equip(weapon, enemy.stats);
      }

      if (enemyData.equipment.armor) {
        const armor = new Item({
          ...enemyData.equipment.armor,
          id: `${enemyId}_armor`,
          type: 'armor',
          equipSlot: 'chest',
          equippable: true,
          stats: { defense: enemyData.equipment.armor.defense || 2 }
        });
        enemy.equipment.equip(armor, enemy.stats);
      }
    }

    // Add abilities
    enemy.abilities = new AbilityManager(enemy.id);
    if (enemyData.abilities) {
      enemyData.abilities.forEach((abilityData, index) => {
        const ability = new Ability({
          ...abilityData,
          id: `${enemyId}_ability_${index}`,
          range: abilityData.range || 'melee'
        });
        enemy.abilities.learnAbility(ability);
      });
    }

    // Add inventory and AI
    enemy.inventory = new Inventory({ maxSlots: 10 });
    enemy.ai = new CombatAI({ behavior: enemyData.behavior || 'balanced' });

    // Store loot data
    enemy.lootData = enemyData.loot;

    // Emit event
    this.eventBus?.emit('enemy:created', {
      enemy,
      context
    });

    return enemy;

  } catch (error) {
    console.error('Failed to create dynamic enemy:', error);

    // Return basic enemy
    const enemyId = `enemy_fallback_${Date.now()}`;
    const enemy = new Character(enemyId, 'Unknown Foe', { role: 'npc' });
    enemy.stats = new CharacterStats({ level: playerLevel });
    enemy.equipment = new Equipment();
    enemy.abilities = new AbilityManager(enemy.id);
    enemy.inventory = new Inventory();
    enemy.ai = new CombatAI({ behavior: 'balanced' });

    return enemy;
  }
}

/**
 * Create a dynamic item using LLM
 * @param {Object} context - Context for generation
 * @returns {Promise<Item>}
 */
export async function createDynamicItem(context = {}) {
  const {
    playerLevel = 1,
    itemType = 'weapon', // weapon, armor, consumable, quest, misc
    rarity = 'common', // common, uncommon, rare, epic, legendary
    purpose = null
  } = context;

  const prompt = `You are the Chronicler creating a magical item for an RPG.

Context:
- Player level: ${playerLevel}
- Item type: ${itemType}
- Rarity: ${rarity}
${purpose ? `- Purpose: ${purpose}` : ''}

Create an interesting item appropriate for the player's level and the specified rarity.

Respond in JSON format:
{
  "name": "Item Name",
  "type": "${itemType}",
  "description": "Flavor text description",
  "rarity": "${rarity}",
  "value": ${10 * playerLevel * (rarity === 'legendary' ? 10 : rarity === 'epic' ? 5 : rarity === 'rare' ? 3 : rarity === 'uncommon' ? 2 : 1)},
  "weight": 1-10,
  ${itemType === 'weapon' || itemType === 'armor' ? `"equippable": true,` : ''}
  ${itemType === 'weapon' ? `"equipSlot": "weapon",` : ''}
  ${itemType === 'armor' ? `"equipSlot": "chest|head|legs|hands|feet|offhand",` : ''}
  ${itemType === 'consumable' ? `"usable": true, "consumable": true,` : ''}
  "stats": {
    ${itemType === 'weapon' ? `"attack": ${5 + playerLevel * 2}` : ''}
    ${itemType === 'armor' ? `"defense": ${3 + playerLevel}` : ''}
  },
  "effects": {
    ${itemType === 'consumable' ? `"heal": ${20 + playerLevel * 5}` : ''}
  },
  "requirements": {
    "level": ${Math.max(1, playerLevel - 1)}
  },
  "tags": ["magical", "unique"],
  "lore": "Optional backstory"
}`;

  try {
    const response = await this.ollamaService.generateCompletion(prompt, {
      temperature: 0.8,
      maxTokens: 400
    });

    let itemData;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      itemData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (parseError) {
      itemData = null;
    }

    if (!itemData) {
      // Fallback item
      itemData = {
        name: `${rarity} ${itemType}`,
        type: itemType,
        description: 'A mysterious item',
        rarity,
        value: 10 * playerLevel,
        weight: 1
      };
    }

    const item = new Item({
      ...itemData,
      id: `dynamic_item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    // Emit event
    this.eventBus?.emit('item:created', {
      item,
      context
    });

    return item;

  } catch (error) {
    console.error('Failed to create dynamic item:', error);

    return new Item({
      name: 'Mysterious Object',
      type: itemType,
      description: 'An item of unknown origin',
      rarity,
      value: 10
    });
  }
}

/**
 * Narrate combat action with flair
 * @param {Object} action - Combat action
 * @param {Object} result - Action result
 * @param {Object} attacker - Character performing action
 * @param {Object} target - Target character
 * @returns {Promise<string>}
 */
export async function narrateCombatAction(action, result, attacker, target) {
  if (!result.success) {
    return `${attacker.name} attempts to act, but something goes wrong!`;
  }

  const prompt = `You are the Chronicler narrating combat in an epic RPG battle.

Action: ${action.type}
Attacker: ${attacker.name}
${target ? `Target: ${target.name}` : ''}
${result.hit !== undefined ? `Hit: ${result.hit}` : ''}
${result.critical ? `CRITICAL HIT!` : ''}
${result.damage ? `Damage: ${result.damage}` : ''}
${result.targetDead ? `Target defeated!` : ''}

Narrate this action in 1-2 dramatic sentences. Be vivid and exciting, but concise.`;

  try {
    const narration = await this.ollamaService.generateCompletion(prompt, {
      temperature: 0.9,
      maxTokens: 100
    });

    return narration.trim();
  } catch (error) {
    // Fallback narration
    if (action.type === 'attack') {
      if (result.hit === false) {
        return `${attacker.name} swings at ${target.name} but misses!`;
      } else if (result.critical) {
        return `${attacker.name} delivers a DEVASTATING blow to ${target.name} for ${result.damage} damage!`;
      } else {
        return `${attacker.name} strikes ${target.name} for ${result.damage} damage!`;
      }
    }
    return `${attacker.name} performs ${action.type}.`;
  }
}

/**
 * Narrate combat outcome
 * @param {string} outcome - 'victory', 'defeat', or 'fled'
 * @param {Object} context - Combat context
 * @returns {Promise<string>}
 */
export async function narrateCombatOutcome(outcome, context = {}) {
  const {
    player,
    defeatedEnemies = [],
    rewards = null,
    round = 0
  } = context;

  const prompt = `You are the Chronicler concluding an epic RPG battle.

Outcome: ${outcome}
Combat lasted: ${round} rounds
${outcome === 'victory' ? `Enemies defeated: ${defeatedEnemies.length}` : ''}
${rewards ? `Experience gained: ${rewards.experience}` : ''}
${rewards?.leveledUp ? `LEVEL UP to ${rewards.newLevel}!` : ''}

Narrate the conclusion in 2-3 sentences. Make it feel rewarding and epic.`;

  try {
    const narration = await this.ollamaService.generateCompletion(prompt, {
      temperature: 0.9,
      maxTokens: 150
    });

    return narration.trim();
  } catch (error) {
    // Fallback
    if (outcome === 'victory') {
      return `Victory! The battle is won after ${round} intense rounds of combat. ${rewards?.leveledUp ? `You feel yourself grow stronger - Level ${rewards.newLevel}!` : ''}`;
    } else if (outcome === 'defeat') {
      return `Defeat... You fall to the ground, overwhelmed by your foes.`;
    } else {
      return `You manage to escape from the battle, living to fight another day.`;
    }
  }
}

export default {
  createDynamicLocation,
  createDynamicEnemy,
  createDynamicItem,
  narrateCombatAction,
  narrateCombatOutcome
};
