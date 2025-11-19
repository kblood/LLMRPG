/**
 * Character Serialization Test
 */

import { createPlayer } from './src/utils/CharacterFactory.js';

console.log('╔════════════════════════════════════════╗');
console.log('║  CHARACTER SERIALIZATION TEST          ║');
console.log('╚════════════════════════════════════════╝\n');

// Create a player character
console.log('Creating player character...');
const player = createPlayer('TestHero', {
  level: 5,
  strength: 15,
  dexterity: 14,
  constitution: 13,
  intelligence: 10,
  wisdom: 11,
  charisma: 12
});

// Modify character state
console.log('Modifying character state...');
player.stats.takeDamage(50);
player.stats.useStamina(30);
player.inventory.addGold(250);
player.currentLocation = 'test_location';

console.log(`\n📊 Original Character:`);
console.log(`  Name: ${player.name}`);
console.log(`  Level: ${player.stats.level}`);
console.log(`  HP: ${player.stats.currentHP}/${player.stats.maxHP}`);
console.log(`  Stamina: ${player.stats.currentStamina}/${player.stats.maxStamina}`);
console.log(`  Gold: ${player.inventory.gold}`);
console.log(`  Items: ${player.inventory.getAllItems().length}`);
console.log(`  Equipment: ${Object.values(player.equipment.slots).filter(s => s !== null).length} equipped`);
console.log(`  Abilities: ${player.abilities.getAllAbilities().length}`);
console.log(`  Location: ${player.currentLocation}`);

// Serialize
console.log('\n💾 Serializing character...');
const json = player.toJSON();
console.log(`JSON size: ${JSON.stringify(json).length} bytes`);

// Check key properties
console.log('\n🔍 Checking serialized data:');
console.log(`  ✓ Has id: ${!!json.id}`);
console.log(`  ✓ Has name: ${!!json.name}`);
console.log(`  ✓ Has personality: ${!!json.personality}`);
console.log(`  ✓ Has stats: ${!!json.stats}`);
console.log(`  ✓ Has inventory: ${!!json.inventory}`);
console.log(`  ✓ Has equipment: ${!!json.equipment}`);
console.log(`  ✓ Has abilities: ${!!json.abilities}`);
console.log(`  ✓ Has relationships: ${!!json.relationships}`);
console.log(`  ✓ Has memory: ${!!json.memory}`);
console.log(`  ✓ Has location: ${!!json.currentLocation}`);

// Deserialize
console.log('\n📥 Deserializing character...');
const Character = (await import('./src/entities/Character.js')).Character;
const restored = Character.fromJSON(json);

console.log(`\n📊 Restored Character:`);
console.log(`  Name: ${restored.name}`);
console.log(`  Level: ${restored.stats.level}`);
console.log(`  HP: ${restored.stats.currentHP}/${restored.stats.maxHP}`);
console.log(`  Stamina: ${restored.stats.currentStamina}/${restored.stats.maxStamina}`);
console.log(`  Gold: ${restored.inventory.gold}`);
console.log(`  Items: ${restored.inventory.getAllItems().length}`);
console.log(`  Equipment: ${Object.values(restored.equipment.slots).filter(s => s !== null).length} equipped`);
console.log(`  Abilities: ${restored.abilities.getAllAbilities().length}`);
console.log(`  Location: ${restored.currentLocation}`);

// Verify data integrity
console.log('\n✅ Verifying data integrity:');
const checks = [
  { name: 'Name matches', pass: player.name === restored.name },
  { name: 'Level matches', pass: player.stats.level === restored.stats.level },
  { name: 'HP matches', pass: player.stats.currentHP === restored.stats.currentHP },
  { name: 'Stamina matches', pass: player.stats.currentStamina === restored.stats.currentStamina },
  { name: 'Gold matches', pass: player.inventory.gold === restored.inventory.gold },
  { name: 'Item count matches', pass: player.inventory.getAllItems().length === restored.inventory.getAllItems().length },
  { name: 'Equipment count matches', pass: Object.values(player.equipment.slots).filter(s => s !== null).length === Object.values(restored.equipment.slots).filter(s => s !== null).length },
  { name: 'Ability count matches', pass: player.abilities.getAllAbilities().length === restored.abilities.getAllAbilities().length },
  { name: 'Location matches', pass: player.currentLocation === restored.currentLocation }
];

let allPassed = true;
checks.forEach(check => {
  console.log(`  ${check.pass ? '✓' : '✗'} ${check.name}`);
  if (!check.pass) allPassed = false;
});

if (allPassed) {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  ✅ SERIALIZATION TEST PASSED!        ║');
  console.log('╚════════════════════════════════════════╝');
} else {
  console.log('\n❌ Some checks failed!');
  process.exit(1);
}
