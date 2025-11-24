/**
 * Direct combat test - bypasses autonomous mode to test combat systems directly
 */

import { GameBackendIntegrated } from '../electron/ipc/GameBackendIntegrated.js';

async function testCombat() {
  console.log('=== Direct Combat Test ===\n');
  
  const backend = new GameBackendIntegrated();
  
  const seed = Date.now();
  console.log(`Using seed: ${seed}`);
  
  const worldConfig = {
    title: 'Combat Test World',
    theme: 'fantasy',
    playerName: 'TestHero',
    openingNarration: 'Testing combat...',
    npcs: [],
    locations: [
      {
        id: 'arena',
        name: 'Combat Arena',
        description: 'A dangerous arena',
        type: 'wilderness',
        x: 0,
        y: 0,
        dangerLevel: 'deadly'
      }
    ],
    items: [],
    quests: { main: { id: 'test', title: 'Test' }, side: [] }
  };
  
  try {
    // Initialize
    await backend.initialize({
      seed,
      playerName: 'TestHero',
      theme: 'fantasy',
      worldConfig
    });
    
    console.log('✓ Game initialized\n');
    
    // Get initial state
    const state = backend.gameService.getGameState();
    const protagonist = state.characters.protagonist;
    const location = state.location.database['arena'];
    
    console.log(`Protagonist: ${protagonist.name}`);
    console.log(`HP: ${protagonist.stats.health}/${protagonist.stats.maxHealth}`);
    console.log(`Location: ${location.name} (${location.dangerLevel} danger)\n`);
    
    // Test 1: Try generating combat encounter multiple times (it's probabilistic)
    console.log('Test 1: Generate combat encounter (may take a few tries due to RNG)');
    let encounter = null;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!encounter && attempts < maxAttempts) {
      attempts++;
      encounter = await backend.gameService.generateCombatEncounter(location);
      if (!encounter) {
        console.log(`  Attempt ${attempts}: No encounter`);
      }
    }
    
    if (!encounter) {
      console.log(`❌ No encounter generated after ${maxAttempts} attempts`);
      console.log('Note: This can happen with RNG, but should be rare with deadly danger level');
      process.exit(1);
    }
    
    console.log(`✓ Encounter generated on attempt ${attempts} with ${encounter.enemies.length} enemies:`);
    encounter.enemies.forEach(e => {
      console.log(`  - ${e.name} (Level ${e.stats.level})`);
    });
    console.log();
    
    // Test 2: Execute combat
    console.log('Test 2: Execute combat');
    const result = await backend.gameService.executeCombat(encounter.enemies, encounter);
    
    console.log(`✓ Combat completed: ${result.outcome} in ${result.rounds} rounds`);
    
    if (result.xpGained) {
      console.log(`  XP Gained: ${result.xpGained}`);
    }
    if (result.goldGained) {
      console.log(`  Gold Gained: ${result.goldGained}`);
    }
    
    // Check final state
    const finalState = backend.gameService.getGameState();
    const finalProtagonist = finalState.characters.protagonist;
    console.log(`\nFinal HP: ${finalProtagonist.stats.health}/${finalProtagonist.stats.maxHealth}`);
    
    console.log('\n✅ ALL COMBAT TESTS PASSED');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

testCombat().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
