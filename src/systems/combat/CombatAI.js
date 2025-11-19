/**
 * CombatAI - Makes combat decisions for NPCs/enemies
 *
 * Features:
 * - Behavior patterns (aggressive, defensive, balanced, support)
 * - Action selection based on situation
 * - Target selection
 * - Tactical positioning
 *
 * @class CombatAI
 */
export class CombatAI {
  /**
   * Create combat AI
   * @param {Object} options - Configuration
   */
  constructor(options = {}) {
    this.behavior = options.behavior || 'balanced'; // aggressive, defensive, balanced, support, coward
  }

  /**
   * Decide action for a character
   * @param {Character} character - Character making decision
   * @param {CombatManager} combat - Combat manager
   * @returns {Object} Action to take
   */
  decideAction(character, combat) {
    const situation = this._analyzeSituation(character, combat);

    // Check if should flee (coward behavior or low HP)
    if (this._shouldFlee(character, situation)) {
      return { type: 'flee' };
    }

    // Check if should heal
    if (this._shouldHeal(character, situation)) {
      const healAction = this._selectHealAction(character, situation);
      if (healAction) return healAction;
    }

    // Check if should use ability
    if (this._shouldUseAbility(character, situation)) {
      const abilityAction = this._selectAbilityAction(character, situation, combat);
      if (abilityAction) return abilityAction;
    }

    // Check if should move
    if (this._shouldMove(character, situation, combat)) {
      const moveAction = this._selectMoveAction(character, situation, combat);
      if (moveAction) return moveAction;
    }

    // Default: basic attack
    const target = this._selectTarget(character, combat);
    return {
      type: 'attack',
      targetId: target?.character.id
    };
  }

  /**
   * Analyze combat situation
   * @param {Character} character
   * @param {CombatManager} combat
   * @returns {Object} Situation analysis
   * @private
   */
  _analyzeSituation(character, combat) {
    const stats = character.stats;
    const hpPercentage = stats.currentHP / stats.maxHP;
    const staminaPercentage = stats.currentStamina / stats.maxStamina;

    const allies = combat.combatants.filter(c =>
      c.team === combat.combatants.find(x => x.character.id === character.id)?.team &&
      c.character.id !== character.id &&
      c.character.stats.isAlive()
    );

    const enemies = combat.combatants.filter(c =>
      c.team !== combat.combatants.find(x => x.character.id === character.id)?.team &&
      c.character.stats.isAlive()
    );

    return {
      hpPercentage,
      staminaPercentage,
      hpLow: hpPercentage < 0.3,
      hpCritical: hpPercentage < 0.15,
      staminaLow: staminaPercentage < 0.2,
      alliesAlive: allies.length,
      enemiesAlive: enemies.length,
      allies,
      enemies
    };
  }

  /**
   * Check if should flee
   * @param {Character} character
   * @param {Object} situation
   * @returns {boolean}
   * @private
   */
  _shouldFlee(character, situation) {
    if (this.behavior === 'coward') {
      return situation.hpLow || situation.enemiesAlive > situation.alliesAlive + 1;
    }

    // Most enemies won't flee
    return false;
  }

  /**
   * Check if should heal
   * @param {Character} character
   * @param {Object} situation
   * @returns {boolean}
   * @private
   */
  _shouldHeal(character, situation) {
    if (this.behavior === 'support' && situation.hpPercentage < 0.6) {
      return true;
    }

    if (situation.hpCritical) {
      return true;
    }

    if (situation.hpLow && this.behavior === 'defensive') {
      return true;
    }

    return false;
  }

  /**
   * Select heal action
   * @param {Character} character
   * @param {Object} situation
   * @returns {Object|null}
   * @private
   */
  _selectHealAction(character, situation) {
    // Check for healing items
    if (character.inventory) {
      const healingItems = character.inventory.getAllItems().filter(entry =>
        entry.item.type === 'consumable' && entry.item.effects.heal
      );

      if (healingItems.length > 0) {
        return {
          type: 'item',
          itemId: healingItems[0].item.id,
          targetId: character.id
        };
      }
    }

    // Check for healing abilities
    if (character.abilities) {
      const healingAbilities = character.abilities.getReadyAbilities().filter(ability =>
        ability.type === 'heal'
      );

      if (healingAbilities.length > 0) {
        return {
          type: 'ability',
          abilityId: healingAbilities[0].id,
          targetId: character.id
        };
      }
    }

    return null;
  }

  /**
   * Check if should use ability
   * @param {Character} character
   * @param {Object} situation
   * @returns {boolean}
   * @private
   */
  _shouldUseAbility(character, situation) {
    if (!character.abilities) return false;

    const readyAbilities = character.abilities.getReadyAbilities();
    if (readyAbilities.length === 0) return false;

    // Aggressive: use abilities often
    if (this.behavior === 'aggressive') {
      return Math.random() < 0.7; // 70% chance
    }

    // Balanced: use abilities sometimes
    if (this.behavior === 'balanced') {
      return Math.random() < 0.4; // 40% chance
    }

    // Defensive: use abilities sparingly
    return Math.random() < 0.2; // 20% chance
  }

  /**
   * Select ability action
   * @param {Character} character
   * @param {Object} situation
   * @param {CombatManager} combat
   * @returns {Object|null}
   * @private
   */
  _selectAbilityAction(character, situation, combat) {
    const readyAbilities = character.abilities.getReadyAbilities();
    if (readyAbilities.length === 0) return null;

    // Filter by abilities we can afford
    const affordableAbilities = readyAbilities.filter(ability => {
      const canUse = ability.canUse(character.stats, character.equipment);
      return canUse.canUse;
    });

    if (affordableAbilities.length === 0) return null;

    // Prefer attack abilities for aggressive
    let selectedAbility;
    if (this.behavior === 'aggressive') {
      selectedAbility = affordableAbilities.find(a => a.type === 'attack') || affordableAbilities[0];
    } else {
      // Random selection for others
      selectedAbility = affordableAbilities[Math.floor(Math.random() * affordableAbilities.length)];
    }

    // Select target based on ability type
    let targetId;
    if (selectedAbility.targetType === 'self') {
      targetId = character.id;
    } else {
      const target = this._selectTarget(character, combat);
      targetId = target?.character.id;
    }

    return {
      type: 'ability',
      abilityId: selectedAbility.id,
      targetId
    };
  }

  /**
   * Check if should move
   * @param {Character} character
   * @param {Object} situation
   * @param {CombatManager} combat
   * @returns {boolean}
   * @private
   */
  _shouldMove(character, situation, combat) {
    if (situation.staminaLow) return false; // Save stamina

    const target = this._selectTarget(character, combat);
    if (!target) return false;

    const distance = combat.positions.getDistance(character.id, target.character.id);

    // Aggressive: move closer if not in melee
    if (this.behavior === 'aggressive') {
      return distance !== 'melee';
    }

    // Defensive: move farther if in melee and low HP
    if (this.behavior === 'defensive' && situation.hpLow) {
      return distance === 'melee';
    }

    // Balanced: move to optimal range for equipped weapon
    if (this.behavior === 'balanced') {
      // Check if we have a weapon equipped
      const weapon = character.equipment?.slots.weapon;
      if (weapon && weapon.range) {
        // If weapon requires melee but we're not in melee, move closer
        if (weapon.range === 'melee' && distance !== 'melee') {
          return true;
        }
        // If we're in melee but weapon is ranged, move back
        if (weapon.range !== 'melee' && distance === 'melee') {
          return true;
        }
      } else {
        // No weapon or no range specified, default to melee
        return distance !== 'melee';
      }
    }

    return false;
  }

  /**
   * Select move action
   * @param {Character} character
   * @param {Object} situation
   * @param {CombatManager} combat
   * @returns {Object|null}
   * @private
   */
  _selectMoveAction(character, situation, combat) {
    const target = this._selectTarget(character, combat);
    if (!target) return null;

    const distance = combat.positions.getDistance(character.id, target.character.id);

    // Aggressive: move closer
    if (this.behavior === 'aggressive') {
      return { type: 'move', direction: 'closer' };
    }

    // Defensive: move farther
    if (this.behavior === 'defensive') {
      return { type: 'move', direction: 'farther' };
    }

    // Balanced: move to optimal range
    if (this.behavior === 'balanced') {
      const weapon = character.equipment?.slots.weapon;
      if (weapon && weapon.range) {
        // If weapon requires melee but we're not in melee, move closer
        if (weapon.range === 'melee' && distance !== 'melee') {
          return { type: 'move', direction: 'closer' };
        }
        // If we're in melee but weapon is ranged, move back
        if (weapon.range !== 'melee' && distance === 'melee') {
          return { type: 'move', direction: 'farther' };
        }
      } else {
        // No weapon or no range specified, default to moving closer
        return { type: 'move', direction: 'closer' };
      }
    }

    return null;
  }

  /**
   * Select target for attack
   * @param {Character} character
   * @param {CombatManager} combat
   * @returns {Object|null} Combatant
   * @private
   */
  _selectTarget(character, combat) {
    const characterTeam = combat.combatants.find(c => c.character.id === character.id)?.team;
    const enemies = combat.combatants.filter(c =>
      c.team !== characterTeam && c.character.stats.isAlive()
    );

    if (enemies.length === 0) return null;

    // Different targeting strategies by behavior
    if (this.behavior === 'aggressive') {
      // Target lowest HP enemy
      return enemies.reduce((lowest, current) =>
        current.character.stats.currentHP < lowest.character.stats.currentHP ? current : lowest
      );
    }

    if (this.behavior === 'defensive') {
      // Target closest enemy
      const distances = enemies.map(enemy => ({
        enemy,
        distance: this._distanceValue(combat.positions.getDistance(character.id, enemy.character.id))
      }));

      return distances.reduce((closest, current) =>
        current.distance < closest.distance ? current : closest
      ).enemy;
    }

    // Balanced: random enemy
    return enemies[Math.floor(Math.random() * enemies.length)];
  }

  /**
   * Convert distance category to number
   * @param {string} distance
   * @returns {number}
   * @private
   */
  _distanceValue(distance) {
    const values = { melee: 0, close: 1, medium: 2, long: 3 };
    return values[distance] || 2;
  }
}

export default CombatAI;
