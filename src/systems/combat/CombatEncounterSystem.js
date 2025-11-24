import { Character } from '../../entities/Character.js';
import { CharacterStats } from '../stats/CharacterStats.js';
import { Personality } from '../../ai/personality/Personality.js';
import { CombatAI } from './CombatAI.js';
import { Equipment } from '../items/Equipment.js';
import { AbilityManager } from '../abilities/AbilityManager.js';
import { Ability } from '../abilities/Ability.js';
import { getRandomEnemyByDanger, getEnemyData, calculateEnemyCount } from '../../data/enemy-types.js';
import Logger from '../../utils/Logger.js';

/**
 * CombatEncounterSystem - Manages enemy spawning and combat encounters
 *
 * Features:
 * - Enemy spawning based on location danger level
 * - More enemies spawn at night
 * - Encounter probability calculations
 * - Enemy generation with proper stats and equipment
 * - Session-based enemy storage
 *
 * @class CombatEncounterSystem
 */
export class CombatEncounterSystem {
  /**
   * Create combat encounter system
   * @param {Object} session - Game session
   * @param {Object} options - Configuration options
   */
  constructor(session, options = {}) {
    this.session = session;
    this.logger = new Logger('CombatEncounterSystem');

    // Configuration
    this.config = {
      baseEncounterChance: options.baseEncounterChance || 0.3, // 30% base chance
      nightMultiplier: options.nightMultiplier || 1.5, // 50% more encounters at night
      dangerMultipliers: {
        safe: 0.0,      // No encounters in safe zones
        low: 0.5,       // 50% of base
        medium: 1.0,    // 100% of base
        high: 1.5,      // 150% of base
        deadly: 2.0     // 200% of base
      },
      ...options
    };

    // Store spawned enemies in session
    if (!this.session.enemies) {
      this.session.enemies = new Map();
    }

    this.logger.info('CombatEncounterSystem initialized');
  }

  /**
   * Check if an enemy should spawn
   * @param {Object} location - Location data
   * @param {string} timeOfDay - Current time of day
   * @returns {boolean}
   */
  shouldSpawnEnemy(location, timeOfDay) {
    const dangerLevel = location.dangerLevel || location.danger_level || 'low';

    // No spawns in safe areas
    if (dangerLevel === 'safe') {
      return false;
    }

    // Calculate spawn chance
    const dangerMultiplier = this.config.dangerMultipliers[dangerLevel] || 1.0;
    const nightMultiplier = (timeOfDay === 'night') ? this.config.nightMultiplier : 1.0;

    const spawnChance = this.config.baseEncounterChance * dangerMultiplier * nightMultiplier;

    // Use session seed for deterministic randomness
    const roll = this._seededRandom();

    const shouldSpawn = roll < spawnChance;

    if (shouldSpawn) {
      this.logger.info(`Enemy encounter triggered at ${location.name} (${dangerLevel} danger, ${timeOfDay})`);
    }

    return shouldSpawn;
  }

  /**
   * Spawn enemy or enemies based on location danger level
   * @param {Object} location - Location data
   * @param {number} playerLevel - Player's level for scaling
   * @returns {Array<Character>} Spawned enemies
   */
  spawnEnemy(location, playerLevel = 1) {
    const dangerLevel = location.dangerLevel || location.danger_level || 'low';

    // Determine number of enemies
    const enemyCount = calculateEnemyCount(dangerLevel, playerLevel);

    this.logger.info(`Spawning ${enemyCount} enemies for ${dangerLevel} danger level`);

    const enemies = [];

    for (let i = 0; i < enemyCount; i++) {
      try {
        const enemy = this._generateEnemy(dangerLevel, playerLevel);
        if (enemy) {
          enemies.push(enemy);
          if (this.session && this.session.enemies) {
            this.session.enemies.set(enemy.id, enemy);
          }
          this.logger.info(`Generated enemy: ${enemy.name} (Level ${enemy.stats.level})`);
        } else {
          this.logger.warn('Failed to generate enemy (returned null)');
        }
      } catch (error) {
        this.logger.error(`Error generating enemy: ${error.message}`);
      }
    }

    return enemies;
  }

  /**
   * Generate a complete combat encounter
   * @param {Object} protagonist - The player character
   * @param {Object} location - Location data
   * @param {string} timeOfDay - Current time of day
   * @returns {Object|null} Combat encounter data or null if no encounter
   */
  generateCombatEncounter(protagonist, location, timeOfDay) {
    // Note: shouldSpawnEnemy() should have already been checked by the caller
    // We don't check again here to avoid double randomness

    const dangerLevel = location.dangerLevel || location.danger_level || 'low';
    const playerLevel = protagonist.stats?.level || 1;

    // Spawn enemies
    const enemies = this.spawnEnemy(location, playerLevel);

    if (enemies.length === 0) {
      return null;
    }

    // Generate encounter description
    const encounterType = this._selectEncounterType();
    const description = this._generateEncounterDescription(enemies, location, timeOfDay, encounterType);

    return {
      enemies,
      location,
      timeOfDay,
      dangerLevel,
      encounterType,
      description,
      timestamp: Date.now()
    };
  }

  /**
   * Generate a single enemy character
   * @param {string} dangerLevel - Danger level of location
   * @param {number} playerLevel - Player's level for scaling
   * @returns {Character} Enemy character
   * @private
   */
  _generateEnemy(dangerLevel, playerLevel = 1) {
    // Select enemy type based on danger
    const seed = this._seededRandom();
    const enemyId = getRandomEnemyByDanger(dangerLevel, seed);
    const enemyTemplate = getEnemyData(enemyId);

    if (!enemyTemplate) {
      this.logger.error(`Failed to get enemy template for ${enemyId}`);
      return null;
    }

    // Generate unique ID
    const uniqueId = `enemy_${enemyId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // Create stats
    const stats = new CharacterStats({
      ...enemyTemplate.stats,
      level: enemyTemplate.level,
      baseAttack: 0,
      baseDefense: 0,
      ...enemyTemplate.resistances
    });

    // Create personality (aggressive enemies are less friendly)
    const personality = new Personality({
      friendliness: 20,
      intelligence: enemyTemplate.stats.intelligence * 5,
      caution: enemyTemplate.behavior === 'defensive' ? 70 : 30,
      honor: 30,
      greed: 60,
      aggression: enemyTemplate.behavior === 'aggressive' ? 80 : 50
    });

    // Create equipment
    const equipment = new Equipment();
    if (enemyTemplate.equipment) {
      Object.entries(enemyTemplate.equipment).forEach(([slot, item]) => {
        equipment.equip(item);
      });
    }

    // Create abilities
    const abilities = new AbilityManager(uniqueId);
    if (enemyTemplate.abilities && enemyTemplate.abilities.length > 0) {
      enemyTemplate.abilities.forEach(abilityData => {
        // Create Ability object from data
        const ability = new Ability({
          id: abilityData.id || abilityData.name?.toLowerCase().replace(/\s+/g, '_'),
          name: abilityData.name,
          description: abilityData.description || '',
          type: abilityData.type || 'active',
          category: abilityData.category || 'combat',
          cooldown: abilityData.cooldown || 0,
          mpCost: abilityData.mpCost || abilityData.cost || 0,
          effect: abilityData.effect || {},
          learnable: false // Enemies don't "learn" abilities
        });
        abilities.learnAbility(ability);
      });
    }

    // Create combat AI
    const combatAI = new CombatAI({
      behavior: enemyTemplate.behavior || 'balanced'
    });

    // Create enemy character
    const enemy = new Character(uniqueId, enemyTemplate.name, {
      role: 'enemy',
      personality,
      backstory: enemyTemplate.description,
      stats,
      equipment,
      abilities,
      combatAI
    });

    // Store loot information
    enemy.loot = enemyTemplate.loot;

    this.logger.info(`Generated enemy: ${enemy.name} (Level ${stats.level})`);

    return enemy;
  }

  /**
   * Select encounter type
   * @returns {string}
   * @private
   */
  _selectEncounterType() {
    const types = ['ambush', 'patrol', 'lair', 'chance_encounter'];
    const weights = [0.15, 0.25, 0.20, 0.40]; // Weighted probabilities

    const roll = this._seededRandom();
    let cumulative = 0;

    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i];
      if (roll < cumulative) {
        return types[i];
      }
    }

    return 'chance_encounter';
  }

  /**
   * Generate encounter description
   * @param {Array<Character>} enemies
   * @param {Object} location
   * @param {string} timeOfDay
   * @param {string} encounterType
   * @returns {string}
   * @private
   */
  _generateEncounterDescription(enemies, location, timeOfDay, encounterType) {
    const enemyNames = enemies.length === 1
      ? `a ${enemies[0].name}`
      : enemies.length === 2
      ? `${enemies[0].name} and ${enemies[1].name}`
      : `${enemies.length} enemies`;

    const timeDesc = timeOfDay === 'night' ? 'in the darkness' : timeOfDay === 'evening' ? 'as dusk falls' : '';

    const encounterDescriptions = {
      ambush: `${enemyNames} ambush you from hiding ${timeDesc}!`,
      patrol: `You encounter ${enemyNames} on patrol ${timeDesc}!`,
      lair: `${enemyNames} emerge to defend their territory ${timeDesc}!`,
      chance_encounter: `You come face to face with ${enemyNames} ${timeDesc}!`
    };

    return encounterDescriptions[encounterType] || `You encounter ${enemyNames}!`;
  }

  /**
   * Generate seeded random number for deterministic behavior
   * @returns {number} Random number between 0 and 1
   * @private
   */
  _seededRandom() {
    if (!this.session.seed) {
      return Math.random();
    }

    // Simple LCG (Linear Congruential Generator) for deterministic randomness
    const seed = (this.session.seed + this.session.frame) % 2147483647;
    this.session.seed = (seed * 16807) % 2147483647;
    return (this.session.seed - 1) / 2147483646;
  }

  /**
   * Get encounter statistics
   * @returns {Object}
   */
  getStats() {
    return {
      totalEnemiesSpawned: this.session.enemies ? this.session.enemies.size : 0,
      config: this.config
    };
  }

  /**
   * Clear all enemies from session
   */
  clearEnemies() {
    if (this.session.enemies) {
      this.session.enemies.clear();
    }
    this.logger.info('All enemies cleared from session');
  }

  /**
   * Get enemy by ID
   * @param {string} enemyId
   * @returns {Character|null}
   */
  getEnemy(enemyId) {
    return this.session.enemies ? this.session.enemies.get(enemyId) : null;
  }
}

export default CombatEncounterSystem;
