/**
 * Detailed Combat Test
 * Tests combat system to verify damage is dealt and enemies die
 */

import { GameService } from '../src/services/GameService.js';
import { Character } from '../src/entities/Character.js';
import { CombatSystem } from '../src/systems/combat/CombatSystem.js';
import { CombatEncounterSystem } from '../src/systems/combat/CombatEncounterSystem.js';
import { GameMaster } from '../src/systems/GameMaster.js';

console.log('\n=== Detailed Combat Test ===\n');

// Create a simple game session
const gameService = new GameService({
  seed: 12345,
  playerName: 'TestHero',
  model: 'granite4:3b'
});

gameService.createSession();
const session = gameService.gameSession;

// Create and add protagonist
const protagonist = new Character({
  id: 'protagonist_1',
  name: 'TestHero',
  role: 'Warrior',
  backstory: 'A test hero',
  personality: {
    aggression: 0.7,
    friendliness: 0.5,
    intelligence: 0.5,
    caution: 0.3,
    greed: 0.3,
    honor: 0.7
  },
  attributes: {
    strength: 15,
    dexterity: 12,
    constitution: 14,
    intelligence: 10,
    wisdom: 10,
    charisma: 10
  }
});

protagonist.isPlayer = true;
session.addCharacter(protagonist);
session.protagonist = protagonist;

console.log('[Test] Protagonist created');
console.log(`  HP: ${protagonist.stats.currentHP}/${protagonist.stats.maxHP}`);
console.log(`  Attack Bonus: ${protagonist.stats.getAttackBonus()}`);
console.log(`  Defense Bonus: ${protagonist.stats.getDefenseBonus()}`);
console.log(`  Is Alive: ${protagonist.stats.isAlive()}`);
console.log(`  Is Dead: ${protagonist.stats.isDead()}`);

// Initialize combat systems
const gameMaster = new GameMaster({
  chroniclerName: 'Test Master',
  model: 'granite4:3b',
  seedManager: session.seedManager
});

const combatSystem = new CombatSystem({
  model: 'granite4:3b',
  seedManager: session.seedManager,
  gameMaster,
  maxRounds: 10  // Lower for testing
});

// Register systems with GameService
gameService.combatSystem = combatSystem;

console.log('\n[Test] Combat system initialized\n');

// Generate a combat encounter
const combatEncounterSystem = new CombatEncounterSystem({
  model: 'granite4:3b',
  seedManager: session.seedManager
});

const encounter = await combatEncounterSystem.generateEncounter('test_location', {
  name: 'Test Area',
  dangerLevel: 'low',
  type: 'wilderness'
});

console.log('[Test] Encounter generated');
console.log(`  Enemy count: ${encounter.enemies.length}`);
encounter.enemies.forEach(enemy => {
  console.log(`  - ${enemy.name} (Level ${enemy.level})`);
  console.log(`    HP: ${enemy.stats.currentHP}/${enemy.stats.maxHP}`);
  console.log(`    Attack: ${enemy.stats.getAttackBonus()}`);
  console.log(`    Defense: ${enemy.stats.getDefenseBonus()}`);
  console.log(`    Is Alive: ${enemy.stats.isAlive()}`);
});

console.log('\n[Test] Starting combat...\n');

// Execute combat
const combatResult = await combatSystem.executeCombat(protagonist, encounter.enemies);

console.log('\n[Test] Combat completed');
console.log(`  Outcome: ${combatResult.outcome}`);
console.log(`  Rounds: ${combatResult.rounds}`);
console.log(`  Success: ${combatResult.success}`);

console.log('\n[Test] Final State:');
console.log(`  Protagonist HP: ${protagonist.stats.currentHP}/${protagonist.stats.maxHP}`);
console.log(`  Protagonist Alive: ${protagonist.stats.isAlive()}`);

encounter.enemies.forEach((enemy, idx) => {
  console.log(`  Enemy ${idx + 1} (${enemy.name}):`);
  console.log(`    HP: ${enemy.stats.currentHP}/${enemy.stats.maxHP}`);
  console.log(`    Alive: ${enemy.stats.isAlive()}`);
  console.log(`    Dead: ${enemy.stats.isDead()}`);
});

if (combatResult.rewards) {
  console.log('\n[Test] Rewards:');
  console.log(`  XP: ${combatResult.rewards.xp}`);
  console.log(`  Gold: ${combatResult.rewards.gold}`);
}

// Check for issues
console.log('\n[Test] Analysis:');
if (combatResult.outcome === 'timeout') {
  console.log('  ⚠️  Combat timed out - investigating why...');
  
  // Check if anyone actually took damage
  const protDamaged = protagonist.stats.currentHP < protagonist.stats.maxHP;
  const enemiesDamaged = encounter.enemies.some(e => e.stats.currentHP < e.stats.maxHP);
  
  console.log(`  Protagonist took damage: ${protDamaged}`);
  console.log(`  Enemies took damage: ${enemiesDamaged}`);
  
  if (!protDamaged && !enemiesDamaged) {
    console.log('  ❌ NO DAMAGE WAS DEALT - Combat system is broken!');
  } else {
    console.log(`  Protagonist final HP: ${protagonist.stats.currentHP}/${protagonist.stats.maxHP}`);
    encounter.enemies.forEach((e, i) => {
      console.log(`  Enemy ${i + 1} final HP: ${e.stats.currentHP}/${e.stats.maxHP}`);
    });
  }
} else if (combatResult.outcome === 'victory') {
  console.log('  ✅ Combat ended in victory');
} else if (combatResult.outcome === 'defeat') {
  console.log('  ⚠️  Combat ended in defeat');
}

console.log('\n=== Test Complete ===\n');

process.exit(0);
