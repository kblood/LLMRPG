import { CombatManager } from './CombatManager.js';
import { EventBus } from '../../services/EventBus.js';
import Logger from '../../utils/Logger.js';

/**
 * CombatSystem - High-level combat orchestration for autonomous gameplay
 *
 * Features:
 * - Manages full combat encounters from start to finish
 * - AI decides actions for protagonist using CharacterStats
 * - Enemy AI based on personality/behavior (using CombatAI)
 * - Round-by-round narration via GameMaster
 * - HP tracking and damage calculation
 * - Victory rewards (XP, gold, items)
 * - Defeat consequences (lose gold, respawn at safe location)
 * - Time advancement during combat
 *
 * @class CombatSystem
 */
export class CombatSystem {
  /**
   * Create combat system
   * @param {Object} gameMaster - GameMaster instance for narration
   * @param {Object} session - Game session
   * @param {Object} options - Configuration options
   */
  constructor(gameMaster, session, options = {}) {
    this.gameMaster = gameMaster;
    this.session = session;
    this.eventBus = EventBus.getInstance();
    this.logger = new Logger('CombatSystem');

    // Create combat manager
    this.combatManager = new CombatManager({
      eventBus: this.eventBus,
      chronicler: gameMaster
    });

    // Combat state
    this.currentCombat = null;
    this.combatHistory = [];

    // Configuration
    this.config = {
      maxRounds: options.maxRounds || 20, // Combat ends after 20 rounds
      pauseBetweenRounds: options.pauseBetweenRounds || 1000, // 1 second between rounds
      timePerRound: options.timePerRound || 1, // 1 minute per combat round
      defeatGoldLoss: options.defeatGoldLoss || 0.3, // Lose 30% of gold on defeat
      ...options
    };

    this.logger.info('CombatSystem initialized');
  }

  /**
   * Execute a full combat encounter
   * @param {Character} protagonist - Player character
   * @param {Array<Character>} enemies - Enemy characters
   * @param {Object} encounterData - Encounter context
   * @returns {Object} Combat result
   */
  async executeCombat(protagonist, enemies, encounterData = {}) {
    this.logger.info(`Starting combat: ${protagonist.name} vs ${enemies.map(e => e.name).join(', ')}`);

    // Start combat
    const startResult = this.combatManager.startCombat(protagonist, enemies, {
      enemyDistances: encounterData.enemyDistances
    });

    if (!startResult.success) {
      this.logger.error('Failed to start combat:', startResult.reason);
      return { success: false, reason: startResult.reason };
    }

    this.currentCombat = {
      protagonist,
      enemies,
      encounterData,
      startTime: Date.now(),
      rounds: []
    };

    // Generate opening narration
    const openingNarration = await this.gameMaster.generateCombatStartNarration(
      protagonist,
      enemies,
      encounterData
    );

    this.currentCombat.openingNarration = openingNarration;

    // Emit combat started event
    this.eventBus.emit('combat:encounter_started', {
      protagonist: protagonist.name,
      enemies: enemies.map(e => e.name),
      narration: openingNarration
    });

    // Combat loop - process rounds
    let combatResult = null;
    let round = 0;

    while (round < this.config.maxRounds) {
      round++;
      this.logger.info(`Combat Round ${round}`);

      // Process all turns in this round
      const roundResult = await this._processCombatRound(protagonist, round);

      // Store round data
      this.currentCombat.rounds.push(roundResult);

      // Check if combat ended
      if (roundResult.combatEnded) {
        combatResult = {
          success: true,
          outcome: roundResult.outcome,
          rounds: round,
          narration: roundResult.narration,
          rewards: roundResult.rewards || null
        };
        break;
      }

      // Advance time
      this.session.tick(this.config.timePerRound);

      // Pause between rounds (for autonomous mode)
      if (this.config.pauseBetweenRounds > 0) {
        await this._sleep(this.config.pauseBetweenRounds);
      }
    }

    // Handle max rounds reached
    if (!combatResult) {
      combatResult = {
        success: true,
        outcome: 'timeout',
        rounds: round,
        narration: 'The battle drags on, and both sides withdraw, exhausted.',
        rewards: null
      };
    }

    // Process combat end
    const finalResult = await this._endCombat(combatResult);

    // Store combat in history
    this.combatHistory.push({
      ...this.currentCombat,
      result: finalResult,
      endTime: Date.now()
    });

    this.currentCombat = null;

    return finalResult;
  }

  /**
   * Process a single combat round
   * @param {Character} protagonist
   * @param {number} roundNumber
   * @returns {Object} Round result
   * @private
   */
  async _processCombatRound(protagonist, roundNumber) {
    const roundActions = [];
    const roundResults = [];

    // Get turn order
    const turnOrder = this.combatManager.turnOrder;

    for (const combatant of turnOrder) {
      if (!combatant.character.stats.isAlive()) {
        continue;
      }

      // Decide action
      let action;
      if (combatant.isPlayer) {
        action = await this._protagonistDecideAction(combatant.character);
      } else {
        action = this._enemyDecideAction(combatant.character);
      }

      // Process action
      const result = this.combatManager.processAction(combatant.character.id, action);

      // Record action and result
      roundActions.push({
        character: combatant.character.name,
        action: action.type,
        target: action.targetId ? this._getCharacterName(action.targetId) : null
      });

      roundResults.push({
        character: combatant.character.name,
        action: action.type,
        result
      });

      // Emit turn event
      this.eventBus.emit('combat:turn_executed', {
        character: combatant.character.name,
        action,
        result
      });

      // Check if combat ended
      if (result.combatEnded) {
        // Generate ending narration
        const narration = await this.gameMaster.generateCombatEndNarration(
          protagonist,
          result.outcome,
          {
            rounds: roundNumber,
            actions: roundActions,
            results: roundResults
          }
        );

        // Process rewards or defeat
        let rewards = null;
        if (result.outcome === 'victory') {
          rewards = this._calculateRewards();
          this._applyRewards(protagonist, rewards);
        } else if (result.outcome === 'defeat') {
          this._handleDefeat(protagonist);
        }

        return {
          roundNumber,
          actions: roundActions,
          results: roundResults,
          combatEnded: true,
          outcome: result.outcome,
          narration,
          rewards
        };
      }
    }

    // Generate round narration
    const narration = await this.gameMaster.generateCombatRoundNarration(
      roundNumber,
      roundActions,
      roundResults
    );

    return {
      roundNumber,
      actions: roundActions,
      results: roundResults,
      narration,
      combatEnded: false
    };
  }

  /**
   * Protagonist AI decides combat action
   * @param {Character} protagonist
   * @returns {Object} Action
   * @private
   */
  async _protagonistDecideAction(protagonist) {
    // Use combat AI if available
    if (protagonist.combatAI) {
      return protagonist.combatAI.decideAction(protagonist, this.combatManager);
    }

    // Fallback: basic decision making
    const stats = protagonist.stats;
    const hpPercentage = stats.currentHP / stats.maxHP;

    // Check if should flee (low HP)
    if (hpPercentage < 0.2) {
      const fleeChance = 0.3; // 30% chance to flee when low HP
      if (Math.random() < fleeChance) {
        this.logger.info(`${protagonist.name} decides to flee (low HP)`);
        return { type: 'flee' };
      }
    }

    // Check if should use ability
    if (protagonist.abilities && protagonist.abilities.getReadyAbilities().length > 0) {
      const abilityChance = 0.4; // 40% chance to use ability
      if (Math.random() < abilityChance) {
        const abilities = protagonist.abilities.getReadyAbilities();
        const ability = abilities[Math.floor(Math.random() * abilities.length)];
        const target = this._selectEnemyTarget();

        this.logger.info(`${protagonist.name} decides to use ${ability.name}`);
        return {
          type: 'ability',
          abilityId: ability.id,
          targetId: target?.character.id
        };
      }
    }

    // Default: attack
    const target = this._selectEnemyTarget();
    this.logger.info(`${protagonist.name} decides to attack ${target?.character.name}`);
    return {
      type: 'attack',
      targetId: target?.character.id
    };
  }

  /**
   * Enemy AI decides combat action
   * @param {Character} enemy
   * @returns {Object} Action
   * @private
   */
  _enemyDecideAction(enemy) {
    // Use combat AI
    if (enemy.combatAI) {
      return enemy.combatAI.decideAction(enemy, this.combatManager);
    }

    // Fallback: basic attack
    const target = this._selectPlayerTarget();
    return {
      type: 'attack',
      targetId: target?.character.id
    };
  }

  /**
   * Select random enemy target
   * @returns {Object|null} Combatant
   * @private
   */
  _selectEnemyTarget() {
    const enemies = this.combatManager.combatants.filter(
      c => c.team === 'enemy' && c.character.stats.isAlive()
    );

    if (enemies.length === 0) return null;

    return enemies[Math.floor(Math.random() * enemies.length)];
  }

  /**
   * Select random player target
   * @returns {Object|null} Combatant
   * @private
   */
  _selectPlayerTarget() {
    const players = this.combatManager.combatants.filter(
      c => c.team === 'player' && c.character.stats.isAlive()
    );

    if (players.length === 0) return null;

    return players[Math.floor(Math.random() * players.length)];
  }

  /**
   * Get character name by ID
   * @param {string} characterId
   * @returns {string}
   * @private
   */
  _getCharacterName(characterId) {
    const combatant = this.combatManager.combatants.find(c => c.character.id === characterId);
    return combatant ? combatant.character.name : 'Unknown';
  }

  /**
   * Calculate rewards for victory
   * @returns {Object} Rewards
   * @private
   */
  _calculateRewards() {
    const defeatedEnemies = this.currentCombat.enemies.filter(e => e.stats.isDead());

    let totalExp = 0;
    let totalGold = 0;
    const loot = [];

    defeatedEnemies.forEach(enemy => {
      if (enemy.loot) {
        // Experience
        totalExp += enemy.loot.experienceValue || 50;

        // Gold
        const goldMin = enemy.loot.goldRange ? enemy.loot.goldRange[0] : 5;
        const goldMax = enemy.loot.goldRange ? enemy.loot.goldRange[1] : 20;
        totalGold += Math.floor(Math.random() * (goldMax - goldMin + 1)) + goldMin;

        // Items (check drop chances)
        if (enemy.loot.items) {
          enemy.loot.items.forEach(itemDrop => {
            if (Math.random() < itemDrop.chance) {
              loot.push({
                itemId: itemDrop.id,
                quantity: 1
              });
            }
          });
        }
      }
    });

    return {
      experience: totalExp,
      gold: totalGold,
      loot
    };
  }

  /**
   * Apply rewards to protagonist
   * @param {Character} protagonist
   * @param {Object} rewards
   * @private
   */
  _applyRewards(protagonist, rewards) {
    if (!rewards) return;

    // Apply experience
    if (rewards.experience > 0) {
      const expResult = protagonist.stats.gainExperience(rewards.experience);

      if (expResult.leveledUp) {
        this.logger.info(`${protagonist.name} leveled up to level ${expResult.currentLevel}!`);
        this.eventBus.emit('combat:level_up', {
          character: protagonist.name,
          newLevel: expResult.currentLevel
        });
      }
    }

    // Apply gold
    if (rewards.gold > 0 && protagonist.inventory) {
      protagonist.inventory.addGold(rewards.gold);
      this.logger.info(`${protagonist.name} gained ${rewards.gold} gold`);
    }

    // Apply loot
    if (rewards.loot && rewards.loot.length > 0 && protagonist.inventory) {
      rewards.loot.forEach(item => {
        // TODO: Add actual items to inventory when item system is ready
        this.logger.info(`${protagonist.name} found ${item.itemId}`);
      });
    }
  }

  /**
   * Handle protagonist defeat
   * @param {Character} protagonist
   * @private
   */
  _handleDefeat(protagonist) {
    // Lose gold
    if (protagonist.inventory) {
      const currentGold = protagonist.getGold();
      const goldLost = Math.floor(currentGold * this.config.defeatGoldLoss);

      if (goldLost > 0) {
        protagonist.inventory.removeGold(goldLost);
        this.logger.info(`${protagonist.name} lost ${goldLost} gold`);

        this.eventBus.emit('combat:gold_lost', {
          character: protagonist.name,
          goldLost
        });
      }
    }

    // Restore HP to 25%
    const restoreAmount = Math.floor(protagonist.stats.maxHP * 0.25);
    protagonist.stats.heal(restoreAmount);

    this.logger.info(`${protagonist.name} was defeated and wakes up with minimal HP`);

    // TODO: Respawn at safe location (implement when world system is ready)
  }

  /**
   * End combat and cleanup
   * @param {Object} result
   * @returns {Object} Final result
   * @private
   */
  async _endCombat(result) {
    // End combat in manager
    this.combatManager.endCombat(result.outcome);

    // Emit combat ended event
    this.eventBus.emit('combat:encounter_ended', {
      outcome: result.outcome,
      rounds: result.rounds,
      rewards: result.rewards
    });

    // Calculate total time
    const timeElapsed = result.rounds * this.config.timePerRound;

    return {
      ...result,
      timeElapsed
    };
  }

  /**
   * Sleep helper for autonomous mode
   * @param {number} ms
   * @returns {Promise}
   * @private
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if currently in combat
   * @returns {boolean}
   */
  isInCombat() {
    return this.combatManager.inCombat;
  }

  /**
   * Get combat statistics
   * @returns {Object}
   */
  getStats() {
    return {
      isInCombat: this.isInCombat(),
      totalCombats: this.combatHistory.length,
      currentCombat: this.currentCombat ? {
        protagonist: this.currentCombat.protagonist.name,
        enemies: this.currentCombat.enemies.map(e => e.name),
        rounds: this.currentCombat.rounds.length
      } : null
    };
  }

  /**
   * Get combat history
   * @param {number} limit
   * @returns {Array}
   */
  getCombatHistory(limit = 10) {
    return this.combatHistory.slice(-limit);
  }
}

export default CombatSystem;
