import { PositionManager } from './PositionManager.js';
import { EventBus } from '../../services/EventBus.js';

/**
 * CombatManager - Manages turn-based combat encounters
 *
 * Features:
 * - Turn-based combat with initiative order
 * - Distance-based positioning
 * - Combat actions (attack, ability, move, item, defend, flee)
 * - Experience and loot distribution
 * - Integration with Chronicler for narration
 *
 * @class CombatManager
 */
export class CombatManager {
  /**
   * Create combat manager
   * @param {Object} options - Configuration
   */
  constructor(options = {}) {
    this.inCombat = false;
    this.combatants = []; // Array of { character, team: 'player'|'enemy', isPlayer: boolean }
    this.turnOrder = []; // Sorted by initiative
    this.currentTurnIndex = 0;
    this.round = 0;

    // Combat state
    this.positions = new PositionManager();
    this.combatLog = [];
    this.defeatedEnemies = [];

    // Configuration
    this.eventBus = options.eventBus || EventBus.getInstance();
    this.chronicler = options.chronicler || null; // GameMaster for narration

    // Flee mechanics
    this.fleeAttempts = new Map(); // Map<characterId, attemptCount>
    this.maxFleeAttempts = 3;
    this.fleeBaseChance = 0.5; // 50% base chance
  }

  /**
   * Start a combat encounter
   * @param {Character} player - Player character
   * @param {Array<Character>} enemies - Enemy characters
   * @param {Object} options - Combat options
   * @returns {Object} Combat start result
   */
  startCombat(player, enemies, options = {}) {
    if (this.inCombat) {
      return { success: false, reason: 'Already in combat' };
    }

    this.inCombat = true;
    this.round = 1;
    this.combatLog = [];
    this.defeatedEnemies = [];
    this.fleeAttempts.clear();

    // Add player to combatants
    this.combatants.push({
      character: player,
      team: 'player',
      isPlayer: true
    });

    // Add enemies to combatants
    enemies.forEach(enemy => {
      this.combatants.push({
        character: enemy,
        team: 'enemy',
        isPlayer: false
      });
    });

    // Set up positions
    this.positions.setReferenceEntity(player.id);
    enemies.forEach((enemy, index) => {
      const distance = options.enemyDistances?.[index] || this._randomStartDistance();
      this.positions.addEntity(enemy.id, distance);
    });

    // Determine turn order (initiative)
    this._rollInitiative();

    // Log combat start
    this._log({
      type: 'combat_start',
      round: 1,
      participants: this.combatants.length,
      message: 'Combat has begun!'
    });

    // Emit event
    this.eventBus.emit('combat:started', {
      player,
      enemies,
      turnOrder: this.turnOrder
    });

    // Get initial narration from Chronicler
    if (this.chronicler) {
      this._narrateCombatStart();
    }

    return {
      success: true,
      turnOrder: this.turnOrder,
      currentTurn: this.getCurrentTurn()
    };
  }

  /**
   * Process a combat action
   * @param {string} characterId - Character performing action
   * @param {Object} action - Action to perform
   * @returns {Object} Action result
   */
  processAction(characterId, action) {
    if (!this.inCombat) {
      return { success: false, reason: 'Not in combat' };
    }

    const currentTurn = this.getCurrentTurn();
    if (currentTurn.character.id !== characterId) {
      return { success: false, reason: 'Not your turn' };
    }

    let result;

    switch (action.type) {
      case 'attack':
        result = this._processAttack(currentTurn.character, action.targetId);
        break;
      case 'ability':
        result = this._processAbility(currentTurn.character, action.abilityId, action.targetId);
        break;
      case 'move':
        result = this._processMove(currentTurn.character, action.direction);
        break;
      case 'item':
        result = this._processItem(currentTurn.character, action.itemId, action.targetId);
        break;
      case 'defend':
        result = this._processDefend(currentTurn.character);
        break;
      case 'flee':
        result = this._processFlee(currentTurn.character);
        break;
      default:
        return { success: false, reason: 'Unknown action type' };
    }

    if (result.success) {
      // Log action
      this._log({
        type: 'action',
        character: currentTurn.character.name,
        action: action.type,
        result
      });

      // Update cooldowns
      if (currentTurn.character.abilities) {
        currentTurn.character.abilities.updateCooldowns(1);
      }

      // Update status effects
      if (currentTurn.character.stats) {
        currentTurn.character.stats.updateStatusEffects(1);
      }

      // Check for defeated enemies
      this._checkDefeated();

      // Check combat end conditions
      const endCheck = this._checkCombatEnd();
      if (endCheck.ended) {
        return { ...result, combatEnded: true, outcome: endCheck.outcome };
      }

      // Advance to next turn if not fleeing
      if (action.type !== 'flee' || !result.fled) {
        this._nextTurn();
      }
    }

    return result;
  }

  /**
   * Process basic attack
   * @param {Character} attacker
   * @param {string} targetId
   * @returns {Object}
   * @private
   */
  _processAttack(attacker, targetId) {
    const target = this._getCombatant(targetId);
    if (!target) {
      return { success: false, reason: 'Target not found' };
    }

    // Check distance
    const distance = this.positions.getDistance(attacker.id, targetId);
    const weapon = attacker.equipment?.getEquipped('weapon');
    const weaponRange = weapon?.customProperties?.range || 'melee';

    if (!this.positions.isInRange(attacker.id, targetId, weaponRange)) {
      return {
        success: false,
        reason: `Target is too far away (at ${distance}, weapon requires ${weaponRange})`
      };
    }

    // Calculate hit chance
    const hitChance = this._calculateHitChance(attacker, target.character);
    const hit = Math.random() < hitChance;

    if (!hit) {
      return {
        success: true,
        hit: false,
        message: `${attacker.name} attacks ${target.character.name} but misses!`
      };
    }

    // Calculate damage
    const baseDamage = weapon?.stats?.attack || 5;
    const attackBonus = attacker.stats.getAttackBonus();
    let damage = baseDamage + attackBonus;

    // Critical hit check
    const isCritical = Math.random() < attacker.stats.criticalChance;
    if (isCritical) {
      damage = Math.floor(damage * attacker.stats.criticalMultiplier);
    }

    // Apply damage
    const damageResult = target.character.stats.takeDamage(damage, 'physical');

    return {
      success: true,
      hit: true,
      critical: isCritical,
      damage: damageResult.damageDealt,
      targetDead: damageResult.isDead,
      message: `${attacker.name} attacks ${target.character.name} for ${damageResult.damageDealt} damage!${isCritical ? ' CRITICAL HIT!' : ''}`
    };
  }

  /**
   * Process ability use
   * @param {Character} user
   * @param {string} abilityId
   * @param {string} targetId
   * @returns {Object}
   * @private
   */
  _processAbility(user, abilityId, targetId) {
    const ability = user.abilities?.getAbility(abilityId);
    if (!ability) {
      return { success: false, reason: 'Ability not found' };
    }

    const target = targetId ? this._getCombatant(targetId) : null;

    // Check if can use
    const canUse = ability.canUse(user.stats, user.equipment);
    if (!canUse.canUse) {
      return { success: false, reason: canUse.reason };
    }

    // Check distance
    if (target) {
      const distance = this.positions.getDistance(user.id, target.character.id);
      if (!this.positions.isInRange(user.id, target.character.id, ability.range)) {
        return {
          success: false,
          reason: `Target is too far away (at ${distance}, ability requires ${ability.range})`
        };
      }
    }

    // Use ability
    const result = ability.use(user, target?.character || user, {
      distance: target ? this.positions.getDistance(user.id, target.character.id) : 'self'
    });

    if (result.success) {
      return {
        success: true,
        ability: ability.name,
        effects: result.effects,
        message: this._formatAbilityResult(user, ability, target?.character, result)
      };
    }

    return result;
  }

  /**
   * Process movement
   * @param {Character} character
   * @param {string} direction - 'closer' or 'farther'
   * @returns {Object}
   * @private
   */
  _processMove(character, direction) {
    const moveFunc = direction === 'closer' ? 'moveCloser' : 'moveFarther';
    const result = this.positions[moveFunc](character.id, character.stats);

    if (result.success && result.moved) {
      return {
        success: true,
        from: result.from,
        to: result.to,
        staminaCost: result.staminaCost,
        message: `${character.name} moves ${direction} (${result.from} → ${result.to})`
      };
    }

    return result;
  }

  /**
   * Process item use
   * @param {Character} user
   * @param {string} itemId
   * @param {string} targetId
   * @returns {Object}
   * @private
   */
  _processItem(user, itemId, targetId) {
    const itemEntry = user.inventory?.getItem(itemId);
    if (!itemEntry) {
      return { success: false, reason: 'Item not found in inventory' };
    }

    const target = targetId ? this._getCombatant(targetId) : null;

    // Use item
    const result = itemEntry.item.use(target?.character || user);

    if (result.success) {
      // Remove item if consumed
      if (result.consumed) {
        user.inventory.removeItem(itemId, 1);
      }

      return {
        success: true,
        item: itemEntry.item.name,
        effects: result.effects,
        consumed: result.consumed,
        message: this._formatItemResult(user, itemEntry.item, target?.character, result)
      };
    }

    return result;
  }

  /**
   * Process defend action
   * @param {Character} character
   * @returns {Object}
   * @private
   */
  _processDefend(character) {
    // Add temporary defense buff
    character.stats.addStatusEffect({
      id: 'defending',
      type: 'buff',
      name: 'Defending',
      stat: 'defense',
      amount: 5,
      duration: 1 // Until next turn
    });

    return {
      success: true,
      message: `${character.name} takes a defensive stance!`
    };
  }

  /**
   * Process flee attempt
   * @param {Character} character
   * @returns {Object}
   * @private
   */
  _processFlee(character) {
    if (!character.isProtagonist?.() && !character.role === 'protagonist') {
      return { success: false, reason: 'Only the player can flee' };
    }

    const attempts = this.fleeAttempts.get(character.id) || 0;
    if (attempts >= this.maxFleeAttempts) {
      return { success: false, reason: 'Too many flee attempts' };
    }

    // Calculate flee chance (increases with each attempt)
    const fleeChance = this.fleeBaseChance + (attempts * 0.1);
    const success = Math.random() < fleeChance;

    this.fleeAttempts.set(character.id, attempts + 1);

    if (success) {
      return {
        success: true,
        fled: true,
        message: `${character.name} successfully flees from combat!`
      };
    }

    return {
      success: true,
      fled: false,
      message: `${character.name} tries to flee but fails!`
    };
  }

  /**
   * Calculate hit chance
   * @param {Character} attacker
   * @param {Character} defender
   * @returns {number} 0-1
   * @private
   */
  _calculateHitChance(attacker, defender) {
    const baseChance = 0.75; // 75% base
    const attackBonus = attacker.stats.getAttackBonus();
    const defenseBonus = defender.stats.getDefenseBonus();
    const dodgeChance = defender.stats.getDodgeChance();

    let chance = baseChance + (attackBonus * 0.02) - (defenseBonus * 0.02) - dodgeChance;

    return Math.max(0.1, Math.min(0.95, chance)); // Clamp between 10% and 95%
  }

  /**
   * Roll initiative for all combatants
   * @private
   */
  _rollInitiative() {
    this.turnOrder = this.combatants.map(combatant => {
      const dexterity = combatant.character.stats?.attributes?.dexterity || 10;
      const roll = Math.floor(Math.random() * 20) + 1; // d20
      const initiative = dexterity + roll;

      return {
        ...combatant,
        initiative
      };
    }).sort((a, b) => b.initiative - a.initiative);

    this.currentTurnIndex = 0;
  }

  /**
   * Advance to next turn
   * @private
   */
  _nextTurn() {
    this.currentTurnIndex++;

    if (this.currentTurnIndex >= this.turnOrder.length) {
      // New round
      this.currentTurnIndex = 0;
      this.round++;

      // Update all combatants
      this.turnOrder.forEach(combatant => {
        // Restore some stamina each round
        combatant.character.stats?.restoreStamina(10);
      });

      this._log({
        type: 'round_start',
        round: this.round,
        message: `--- Round ${this.round} ---`
      });
    }

    // Emit turn change event
    const currentTurn = this.getCurrentTurn();
    this.eventBus.emit('combat:turn_changed', {
      character: currentTurn.character,
      turnIndex: this.currentTurnIndex,
      round: this.round
    });
  }

  /**
   * Check for defeated combatants
   * @private
   */
  _checkDefeated() {
    const defeated = this.combatants.filter(c => c.character.stats.isDead());

    defeated.forEach(combatant => {
      if (combatant.team === 'enemy' && !this.defeatedEnemies.includes(combatant.character.id)) {
        this.defeatedEnemies.push(combatant.character.id);

        this._log({
          type: 'defeated',
          character: combatant.character.name,
          message: `${combatant.character.name} has been defeated!`
        });
      }
    });

    // Remove defeated from turn order
    this.turnOrder = this.turnOrder.filter(c => !c.character.stats.isDead());
    this.combatants = this.combatants.filter(c => !c.character.stats.isDead());
  }

  /**
   * Check if combat should end
   * @returns {Object} { ended: boolean, outcome: string }
   * @private
   */
  _checkCombatEnd() {
    const playerAlive = this.combatants.some(c => c.team === 'player' && c.character.stats.isAlive());
    const enemiesAlive = this.combatants.some(c => c.team === 'enemy' && c.character.stats.isAlive());

    if (!playerAlive) {
      return { ended: true, outcome: 'defeat' };
    }

    if (!enemiesAlive) {
      return { ended: true, outcome: 'victory' };
    }

    return { ended: false };
  }

  /**
   * End combat and distribute rewards
   * @param {string} outcome - 'victory', 'defeat', or 'fled'
   * @returns {Object} Combat end result
   */
  endCombat(outcome) {
    if (!this.inCombat) {
      return { success: false, reason: 'Not in combat' };
    }

    const result = {
      success: true,
      outcome,
      rounds: this.round,
      defeatedEnemies: this.defeatedEnemies.length,
      rewards: null
    };

    if (outcome === 'victory') {
      result.rewards = this._distributeRewards();
    }

    // Clean up
    this.inCombat = false;
    this.combatants = [];
    this.turnOrder = [];
    this.positions.clear();
    this.fleeAttempts.clear();

    // Log combat end
    this._log({
      type: 'combat_end',
      outcome,
      message: `Combat ended: ${outcome.toUpperCase()}`
    });

    // Emit event
    this.eventBus.emit('combat:ended', result);

    return result;
  }

  /**
   * Distribute rewards after victory
   * @returns {Object} Rewards
   * @private
   */
  _distributeRewards() {
    const player = this.combatants.find(c => c.isPlayer)?.character;
    if (!player) return null;

    let totalExp = 0;
    let totalGold = 0;
    const loot = [];

    // Calculate rewards from defeated enemies
    this.defeatedEnemies.forEach(enemyId => {
      // Base rewards (could be customized per enemy type)
      totalExp += 50;
      totalGold += Math.floor(Math.random() * 20) + 5;

      // Random loot chance (20%)
      if (Math.random() < 0.2) {
        loot.push({
          itemId: 'health_potion', // Placeholder
          quantity: 1
        });
      }
    });

    // Apply rewards
    const expResult = player.stats.gainExperience(totalExp);
    if (player.inventory) {
      player.inventory.addGold(totalGold);
    }

    return {
      experience: totalExp,
      leveledUp: expResult.leveledUp,
      newLevel: expResult.currentLevel,
      gold: totalGold,
      loot
    };
  }

  /**
   * Get current turn information
   * @returns {Object}
   */
  getCurrentTurn() {
    return this.turnOrder[this.currentTurnIndex] || null;
  }

  /**
   * Get available actions for current character
   * @returns {Array<string>}
   */
  getAvailableActions() {
    const currentTurn = this.getCurrentTurn();
    if (!currentTurn) return [];

    const actions = ['attack', 'defend', 'flee'];

    if (currentTurn.character.abilities?.getReadyAbilities().length > 0) {
      actions.push('ability');
    }

    if (currentTurn.character.inventory?.getAllItems().length > 0) {
      actions.push('item');
    }

    actions.push('move');

    return actions;
  }

  /**
   * Get combat summary
   * @returns {Object}
   */
  getSummary() {
    return {
      inCombat: this.inCombat,
      round: this.round,
      currentTurn: this.getCurrentTurn(),
      combatants: this.combatants.map(c => ({
        name: c.character.name,
        team: c.team,
        hp: c.character.stats?.currentHP,
        maxHP: c.character.stats?.maxHP,
        isAlive: c.character.stats?.isAlive()
      })),
      positions: this.positions.getPositionSummary(),
      log: this.combatLog.slice(-10) // Last 10 entries
    };
  }

  /**
   * Log combat event
   * @param {Object} entry
   * @private
   */
  _log(entry) {
    this.combatLog.push({
      ...entry,
      timestamp: Date.now()
    });
  }

  /**
   * Get random starting distance
   * @returns {string}
   * @private
   */
  _randomStartDistance() {
    const distances = ['close', 'medium', 'medium', 'long']; // Weighted toward medium
    return distances[Math.floor(Math.random() * distances.length)];
  }

  /**
   * Format ability result message
   * @param {Character} user
   * @param {Ability} ability
   * @param {Character} target
   * @param {Object} result
   * @returns {string}
   * @private
   */
  _formatAbilityResult(user, ability, target, result) {
    let message = `${user.name} uses ${ability.name}`;

    if (target) {
      message += ` on ${target.name}`;
    }

    message += '!';

    result.effects.forEach(effect => {
      if (effect.type === 'damage') {
        message += ` Deals ${effect.amount} ${effect.damageType} damage.`;
      } else if (effect.type === 'heal') {
        message += ` Heals ${effect.amount} HP.`;
      }
    });

    return message;
  }

  /**
   * Format item result message
   * @param {Character} user
   * @param {Item} item
   * @param {Character} target
   * @param {Object} result
   * @returns {string}
   * @private
   */
  _formatItemResult(user, item, target, result) {
    let message = `${user.name} uses ${item.name}`;

    if (target) {
      message += ` on ${target.name}`;
    }

    message += '!';

    result.effects.forEach(effect => {
      if (effect.type === 'heal') {
        message += ` Restores ${effect.amount} HP.`;
      } else if (effect.type === 'stamina') {
        message += ` Restores ${effect.amount} stamina.`;
      }
    });

    return message;
  }

  /**
   * Narrate combat start (uses Chronicler)
   * @private
   */
  async _narrateCombatStart() {
    if (!this.chronicler) return;

    // This will be implemented when we enhance the GameMaster
    // For now, just a placeholder
  }

  /**
   * Get combatant by character ID
   * @param {string} characterId
   * @returns {Object|null}
   * @private
   */
  _getCombatant(characterId) {
    return this.combatants.find(c => c.character.id === characterId) || null;
  }
}

export default CombatManager;
