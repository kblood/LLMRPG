/**
 * Enemy type definitions for OllamaRPG
 *
 * This file extends the base ENEMIES data with categorization by difficulty
 * and provides utilities for enemy spawning based on location danger level
 */

import { ENEMIES } from './enemies.js';

/**
 * Enemy categories by difficulty
 */
export const ENEMY_CATEGORIES = {
  weak: ['goblin', 'giant_rat', 'bandit'],
  medium: ['wolf', 'skeleton', 'orc_warrior'],
  strong: ['dark_mage', 'troll'],
  boss: ['dragon_wyrmling']
};

/**
 * Enemy spawn weights by danger level
 * Higher danger = more difficult enemies
 */
export const SPAWN_TABLES = {
  low: {
    weak: 0.7,     // 70% chance of weak enemy
    medium: 0.25,  // 25% chance of medium enemy
    strong: 0.05,  // 5% chance of strong enemy
    boss: 0.0      // No boss enemies
  },
  medium: {
    weak: 0.4,     // 40% chance of weak enemy
    medium: 0.45,  // 45% chance of medium enemy
    strong: 0.15,  // 15% chance of strong enemy
    boss: 0.0      // No boss enemies
  },
  high: {
    weak: 0.1,     // 10% chance of weak enemy
    medium: 0.5,   // 50% chance of medium enemy
    strong: 0.35,  // 35% chance of strong enemy
    boss: 0.05     // 5% chance of boss enemy
  },
  deadly: {
    weak: 0.0,     // No weak enemies
    medium: 0.3,   // 30% chance of medium enemy
    strong: 0.6,   // 60% chance of strong enemy
    boss: 0.1      // 10% chance of boss enemy
  }
};

/**
 * Get enemy difficulty category
 * @param {string} enemyId
 * @returns {string} Category name
 */
export function getEnemyCategory(enemyId) {
  for (const [category, enemies] of Object.entries(ENEMY_CATEGORIES)) {
    if (enemies.includes(enemyId)) {
      return category;
    }
  }
  return 'medium'; // Default
}

/**
 * Get enemies by category
 * @param {string} category - 'weak', 'medium', 'strong', or 'boss'
 * @returns {Array<string>} Array of enemy IDs
 */
export function getEnemiesByCategory(category) {
  return ENEMY_CATEGORIES[category] || [];
}

/**
 * Select random enemy from category
 * @param {string} category
 * @returns {string} Enemy ID
 */
export function getRandomEnemyFromCategory(category) {
  const enemies = getEnemiesByCategory(category);
  if (enemies.length === 0) return 'goblin'; // Fallback

  return enemies[Math.floor(Math.random() * enemies.length)];
}

/**
 * Select random enemy based on danger level
 * @param {string} dangerLevel - 'low', 'medium', 'high', or 'deadly'
 * @param {number} seed - Optional seed for deterministic randomness
 * @returns {string} Enemy ID
 */
export function getRandomEnemyByDanger(dangerLevel, seed = Math.random()) {
  const spawnTable = SPAWN_TABLES[dangerLevel] || SPAWN_TABLES.medium;

  // Generate weighted random selection
  const roll = typeof seed === 'number' && seed < 1 ? seed : Math.random();
  let cumulative = 0;

  for (const [category, weight] of Object.entries(spawnTable)) {
    cumulative += weight;
    if (roll < cumulative) {
      return getRandomEnemyFromCategory(category);
    }
  }

  // Fallback to medium category
  return getRandomEnemyFromCategory('medium');
}

/**
 * Get enemy data by ID
 * @param {string} enemyId
 * @returns {Object} Enemy definition
 */
export function getEnemyData(enemyId) {
  return ENEMIES[enemyId] || ENEMIES.goblin;
}

/**
 * Calculate number of enemies for encounter
 * @param {string} dangerLevel
 * @param {number} playerLevel
 * @returns {number} Number of enemies to spawn
 */
export function calculateEnemyCount(dangerLevel, playerLevel = 1) {
  const baseCount = {
    low: 1,
    medium: 2,
    high: 3,
    deadly: 4
  }[dangerLevel] || 1;

  // Scale with player level (but cap it)
  const scaledCount = Math.min(baseCount + Math.floor(playerLevel / 3), baseCount + 2);

  // Add some randomness
  const variance = Math.floor(Math.random() * 2); // 0 or 1

  return Math.max(1, scaledCount + variance - 1);
}

/**
 * Get enemy behavior description
 * @param {string} behavior
 * @returns {string}
 */
export function getEnemyBehaviorDescription(behavior) {
  const descriptions = {
    aggressive: 'attacks relentlessly and prioritizes offense',
    defensive: 'plays cautiously and protects itself',
    balanced: 'adapts tactics based on the situation',
    coward: 'flees when threatened',
    support: 'focuses on healing and buffing'
  };

  return descriptions[behavior] || 'fights unpredictably';
}

/**
 * Enemy encounter templates for specific scenarios
 */
export const ENCOUNTER_TEMPLATES = {
  ambush: {
    description: 'An ambush from hiding',
    enemyDistances: ['melee', 'close'],
    surpriseRound: true
  },
  patrol: {
    description: 'A patrol group',
    enemyDistances: ['medium', 'medium'],
    surpriseRound: false
  },
  lair: {
    description: 'Enemies defending their lair',
    enemyDistances: ['medium', 'long'],
    surpriseRound: false,
    advantageBonus: 'enemy' // Enemies have advantage
  },
  chance_encounter: {
    description: 'A random encounter',
    enemyDistances: ['close', 'medium'],
    surpriseRound: false
  }
};

export default {
  ENEMY_CATEGORIES,
  SPAWN_TABLES,
  ENCOUNTER_TEMPLATES,
  getEnemyCategory,
  getEnemiesByCategory,
  getRandomEnemyFromCategory,
  getRandomEnemyByDanger,
  getEnemyData,
  calculateEnemyCount,
  getEnemyBehaviorDescription
};
