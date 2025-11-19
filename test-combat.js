/**
 * Combat System Test Script
 *
 * Tests the new combat system with stats, items, abilities, and positioning
 */

import { Character } from './src/entities/Character.js';
import { CharacterStats } from './src/systems/stats/CharacterStats.js';
import { Inventory } from './src/systems/items/Inventory.js';
import { Equipment } from './src/systems/items/Equipment.js';
import { Item } from './src/systems/items/Item.js';
import { AbilityManager } from './src/systems/abilities/AbilityManager.js';
import { Ability } from './src/systems/abilities/Ability.js';
import { CombatManager } from './src/systems/combat/CombatManager.js';
import { CombatAI } from './src/systems/combat/CombatAI.js';
import { getItem } from './src/data/items.js';
import { getEnemy } from './src/data/enemies.js';
import chalk from 'chalk';

/**
 * Create a player character with stats and equipment
 */
function createPlayer() {
  const player = new Character('player', 'Hero', {
    role: 'protagonist'
  });

  // Add stats
  player.stats = new CharacterStats({
    strength: 14,
    dexterity: 12,
    constitution: 13,
    intelligence: 10,
    wisdom: 11,
    charisma: 14,
    level: 3
  });

  // Add inventory
  player.inventory = new Inventory({ maxSlots: 20, gold: 50 });

  // Add equipment
  player.equipment = new Equipment();

  // Add abilities
  player.abilities = new AbilityManager(player.id);

  // Equip starter gear
  const sword = new Item(getItem('iron_sword'));
  const armor = new Item(getItem('leather_armor'));
  const boots = new Item(getItem('leather_boots'));

  player.equipment.equip(sword, player.stats);
  player.equipment.equip(armor, player.stats);
  player.equipment.equip(boots, player.stats);

  // Add items to inventory
  player.inventory.addItem(new Item(getItem('health_potion')), 3);
  player.inventory.addItem(new Item(getItem('stamina_potion')), 2);

  // Learn abilities
  const powerStrike = new Ability({
    id: 'power_strike',
    name: 'Power Strike',
    type: 'attack',
    staminaCost: 20,
    damage: 15,
    damageType: 'physical',
    damageMultiplier: 1.5,
    range: 'melee',
    cooldown: 3,
    description: 'A powerful strike that deals extra damage'
  });

  player.abilities.learnAbility(powerStrike);
  player.abilities.slotAbility('power_strike', 0);

  return player;
}

/**
 * Create an enemy from database
 */
function createEnemy(enemyId, idSuffix = '') {
  const enemyData = getEnemy(enemyId);
  if (!enemyData) {
    throw new Error(`Enemy ${enemyId} not found`);
  }

  const enemy = new Character(
    `enemy_${enemyId}${idSuffix}`,
    enemyData.name,
    { role: 'npc' }
  );

  // Add stats
  enemy.stats = new CharacterStats({
    ...enemyData.stats,
    level: enemyData.level,
    ...(enemyData.resistances || {})
  });

  // Add equipment
  enemy.equipment = new Equipment();
  if (enemyData.equipment) {
    for (const [slot, itemData] of Object.entries(enemyData.equipment)) {
      const item = new Item({ ...itemData, id: `${enemyId}_${slot}` });
      enemy.equipment.equip(item, enemy.stats);
    }
  }

  // Add abilities
  enemy.abilities = new AbilityManager(enemy.id);
  if (enemyData.abilities) {
    enemyData.abilities.forEach((abilityData, index) => {
      const ability = new Ability({
        ...abilityData,
        id: `${enemyId}_ability_${index}`
      });
      enemy.abilities.learnAbility(ability);
    });
  }

  // Add inventory (for AI to use items)
  enemy.inventory = new Inventory({ maxSlots: 10 });

  // Add AI
  enemy.ai = new CombatAI({ behavior: enemyData.behavior });

  return enemy;
}

/**
 * Display character status
 */
function displayStatus(character) {
  const stats = character.stats;
  const hpBar = createBar(stats.currentHP, stats.maxHP, 20, 'green', 'red');
  const staminaBar = createBar(stats.currentStamina, stats.maxStamina, 20, 'yellow', 'gray');

  console.log(chalk.bold(`\n${character.name} (Level ${stats.level})`));
  console.log(`HP:      ${hpBar} ${stats.currentHP}/${stats.maxHP}`);
  console.log(`Stamina: ${staminaBar} ${stats.currentStamina}/${stats.maxStamina}`);

  if (stats.statusEffects.size > 0) {
    console.log(chalk.cyan(`Effects: ${Array.from(stats.statusEffects.values()).map(e => e.name).join(', ')}`));
  }
}

/**
 * Create a progress bar
 */
function createBar(current, max, length, fullColor, emptyColor) {
  const percentage = current / max;
  const filled = Math.floor(percentage * length);
  const empty = length - filled;

  return chalk[fullColor]('█'.repeat(filled)) + chalk[emptyColor]('░'.repeat(empty));
}

/**
 * Display combat summary
 */
function displayCombatSummary(combat) {
  console.log(chalk.bold.blue('\n=== COMBAT STATUS ==='));
  console.log(`Round: ${combat.round}`);

  const summary = combat.getSummary();
  console.log(chalk.bold('\nCombatants:'));
  summary.combatants.forEach(c => {
    const color = c.team === 'player' ? 'green' : 'red';
    const status = c.isAlive ? '✓' : '✗';
    console.log(chalk[color](`  ${status} ${c.name}: ${c.hp}/${c.maxHP} HP`));
  });

  console.log(chalk.bold('\nPositions:'));
  const positions = summary.positions;
  ['melee', 'close', 'medium', 'long'].forEach(distance => {
    if (positions[distance].length > 0) {
      console.log(`  ${distance.toUpperCase()}: ${positions[distance].length} enemies`);
    }
  });
}

/**
 * Player action menu
 */
async function getPlayerAction(player, combat) {
  console.log(chalk.bold.cyan('\n--- Your Turn ---'));
  console.log('Available actions:');
  console.log('  1. Attack');
  console.log('  2. Use Ability');
  console.log('  3. Use Item');
  console.log('  4. Move');
  console.log('  5. Defend');
  console.log('  6. Flee');

  // Get first living enemy
  const enemies = combat.combatants.filter(c => c.team === 'enemy' && c.character.stats.isAlive());
  if (enemies.length === 0) return null;

  const targetId = enemies[0].character.id;
  const distance = combat.positions.getDistance(player.id, targetId);

  // Check if we can attack from current distance
  const weapon = player.equipment?.slots.weapon;
  const weaponRange = weapon?.range || 'melee';

  // If we're not in range, move closer
  if (!combat.positions.isInRange(player.id, targetId, weaponRange)) {
    return {
      type: 'move',
      direction: 'closer'
    };
  }

  // For testing, we'll simulate player choosing actions
  // In a real game, this would be user input
  const choice = Math.random() < 0.5 ? 1 : 2; // Randomly attack or use ability

  if (choice === 1) {
    return {
      type: 'attack',
      targetId: targetId
    };
  } else if (choice === 2) {
    // Use power strike if available
    const ability = player.abilities.getAbility('power_strike');
    if (ability && ability.isReady()) {
      return {
        type: 'ability',
        abilityId: 'power_strike',
        targetId: targetId
      };
    }

    // Fallback to attack
    return {
      type: 'attack',
      targetId: targetId
    };
  }
}

/**
 * Enemy AI turn
 */
function getEnemyAction(enemy, combat) {
  return enemy.ai.decideAction(enemy, combat);
}

/**
 * Main test function
 */
async function runCombatTest() {
  console.log(chalk.bold.yellow('\n╔════════════════════════════════════════╗'));
  console.log(chalk.bold.yellow('║     OLLAMARPM COMBAT SYSTEM TEST      ║'));
  console.log(chalk.bold.yellow('╚════════════════════════════════════════╝\n'));

  // Create player
  console.log(chalk.green('Creating player...'));
  const player = createPlayer();
  displayStatus(player);

  // Create enemies
  console.log(chalk.red('\nCreating enemies...'));
  const bandit1 = createEnemy('bandit', '_1');
  const bandit2 = createEnemy('bandit', '_2');

  displayStatus(bandit1);
  displayStatus(bandit2);

  // Start combat
  console.log(chalk.bold.yellow('\n⚔️  COMBAT BEGINS! ⚔️\n'));

  const combat = new CombatManager();
  const startResult = combat.startCombat(player, [bandit1, bandit2], {
    enemyDistances: ['close', 'medium']
  });

  console.log(chalk.cyan('Initiative order:'));
  startResult.turnOrder.forEach((combatant, index) => {
    console.log(`  ${index + 1}. ${combatant.character.name} (Initiative: ${combatant.initiative})`);
  });

  // Combat loop
  let turnCount = 0;
  const maxTurns = 100; // Safety limit

  while (combat.inCombat && turnCount < maxTurns) {
    turnCount++;

    const currentTurn = combat.getCurrentTurn();
    if (!currentTurn) break;

    // Display combat status every few turns
    if (turnCount % 3 === 1) {
      displayCombatSummary(combat);
    }

    console.log(chalk.bold(`\n--- Turn ${turnCount}: ${currentTurn.character.name} ---`));

    let action;
    if (currentTurn.isPlayer) {
      action = await getPlayerAction(currentTurn.character, combat);
    } else {
      action = getEnemyAction(currentTurn.character, combat);
    }

    if (!action) {
      console.log(chalk.gray('No valid action available, skipping turn'));
      combat.processAction(currentTurn.character.id, { type: 'defend' });
      continue;
    }

    console.log(chalk.gray(`Action: ${action.type}${action.targetId ? ` -> ${combat._getCombatant(action.targetId)?.character.name}` : ''}`));

    const result = combat.processAction(currentTurn.character.id, action);

    if (result.success) {
      if (result.message) {
        console.log(chalk.white(result.message));
      }

      if (result.hit === false) {
        console.log(chalk.yellow('  ❌ Miss!'));
      } else if (result.critical) {
        console.log(chalk.red('  💥 CRITICAL HIT!'));
      } else if (result.damage) {
        console.log(chalk.red(`  💥 ${result.damage} damage`));
      }

      if (result.targetDead) {
        console.log(chalk.red(`  ☠️  ${combat._getCombatant(action.targetId)?.character.name} has been defeated!`));
      }

      if (result.combatEnded) {
        break;
      }
    } else {
      console.log(chalk.red(`  ❌ Failed: ${result.reason}`));
    }

    // Small delay for readability
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Combat end
  console.log(chalk.bold.yellow('\n⚔️  COMBAT ENDED! ⚔️\n'));

  const endResult = combat.endCombat('victory');

  if (endResult.outcome === 'victory') {
    console.log(chalk.bold.green('🎉 VICTORY! 🎉'));

    if (endResult.rewards) {
      console.log(chalk.yellow('\nRewards:'));
      console.log(`  Experience: +${endResult.rewards.experience}`);
      console.log(`  Gold: +${endResult.rewards.gold}`);

      if (endResult.rewards.leveledUp) {
        console.log(chalk.bold.green(`  ⭐ LEVEL UP! Now level ${endResult.rewards.newLevel}!`));
      }

      if (endResult.rewards.loot.length > 0) {
        console.log(`  Loot: ${endResult.rewards.loot.map(l => l.itemId).join(', ')}`);
      }
    }
  } else {
    console.log(chalk.bold.red('💀 DEFEAT 💀'));
  }

  // Final status
  console.log(chalk.bold('\n=== FINAL STATUS ==='));
  displayStatus(player);

  console.log(chalk.gray(`\nCombat lasted ${turnCount} turns over ${combat.round} rounds`));
}

// Run the test
runCombatTest().catch(console.error);
