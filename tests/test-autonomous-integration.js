/**
 * Comprehensive autonomous game integration test
 * Tests the full game loop including travel, combat, conversations, and rest
 */

import { GameService } from '../src/services/GameService.js';
import { StandaloneAutonomousGame } from '../src/services/StandaloneAutonomousGame.js';
import { OllamaService } from '../src/services/OllamaService.js';

const TEST_TIMEOUT = 300000; // 5 minutes

async function runTest() {
  console.log('='.repeat(80));
  console.log('AUTONOMOUS GAME INTEGRATION TEST');
  console.log('='.repeat(80));

  // Initialize services
  console.log('\n[1/5] Initializing services...');
  const ollamaService = OllamaService.getInstance({
    model: 'granite4:3b',
    baseURL: 'http://localhost:11434'
  });

  const isAvailable = await ollamaService.isAvailable();
  if (!isAvailable) {
    console.error('❌ Ollama service not available');
    process.exit(1);
  }
  console.log('✓ Ollama service available');

  // Create game service
  console.log('\n[2/5] Creating game session...');
  
  // Import necessary classes
  const { GameSession } = await import('../src/game/GameSession.js');
  const { Character } = await import('../src/entities/Character.js');
  const { CharacterStats } = await import('../src/systems/stats/CharacterStats.js');
  const { Personality } = await import('../src/ai/personality/Personality.js');
  
  const gameSession = new GameSession({
    seed: Date.now(),
    model: 'granite4:3b'
  });
  
  // Create protagonist
  const protagonist = new Character('player', 'Test Hero', {
    isProtagonist: true,
    personality: new Personality(),
    stats: new CharacterStats({
      strength: 12,
      dexterity: 11,
      constitution: 13,
      intelligence: 10,
      wisdom: 10,
      charisma: 11
    }),
    level: 1
  });
  
  gameSession.addCharacter(protagonist);
  
  // Create test NPCs
  const npc1 = new Character('npc_1', 'Elder Thomas', {
    role: 'quest_giver',
    personality: new Personality({ friendliness: 70, intelligence: 75, honor: 80 }),
    stats: new CharacterStats(),
    currentLocation: 'town_start'
  });
  gameSession.addCharacter(npc1);
  
  const npc2 = new Character('npc_2', 'Merchant Anna', {
    role: 'merchant',
    personality: new Personality({ friendliness: 60, intelligence: 65, greed: 55 }),
    stats: new CharacterStats(),
    currentLocation: 'town_start'
  });
  gameSession.addCharacter(npc2);
  
  // Create locations
  const startLocation = {
    id: 'town_start',
    name: 'Starting Town',
    description: 'A peaceful town',
    type: 'town',
    coordinates: { x: 0, y: 0 },
    environment: { safe: true, indoor: false },
    dangerLevel: 'safe'
  };
  
  const forestLocation = {
    id: 'forest_wild',
    name: 'Wild Forest',
    description: 'A dangerous forest',
    type: 'wilderness',
    coordinates: { x: 10, y: 10 },
    environment: { safe: false, indoor: false },
    dangerLevel: 'high'
  };
  
  gameSession.locationDatabase.set('town_start', startLocation);
  gameSession.locationDatabase.set('forest_wild', forestLocation);
  gameSession.discoveredLocations.add('town_start');
  gameSession.discoveredLocations.add('forest_wild');
  gameSession.currentLocation = startLocation;
  
  const gameService = new GameService(gameSession);
  await gameService.initialize();
  console.log('✓ Game session initialized');

  const gameState = gameService.getGameState();
  console.log(`  - Player: ${gameState.characters.protagonist?.name || 'No player'}`);
  console.log(`  - Location: ${gameState.location.current?.name || 'No location'}`);
  console.log(`  - NPCs: ${gameState.characters.npcs.length}`);
  console.log(`  - Locations: ${gameState.location.discovered.length}`);

  // Create autonomous game
  console.log('\n[3/5] Creating autonomous game...');
  const autonomousGame = new StandaloneAutonomousGame(gameService, {
    frameDelay: 500, // Fast for testing
    maxFrames: 50, // Run 50 frames
    enableEventCallback: true,
    eventCallback: (event) => {
      // Log key events
      if (event.type === 'action_decided') {
        console.log(`  [Frame ${event.data.frame}] Decided: ${event.data.action} - ${event.data.reason}`);
      } else if (event.type === 'action_completed') {
        console.log(`    ✓ Action completed: ${event.data.type} (success: ${event.data.success})`);
      } else if (event.type === 'conversation_started') {
        console.log(`  [Frame ${event.data.frame}] Starting conversation with ${event.data.npcName}`);
      } else if (event.type === 'combat_started') {
        console.log(`  [Frame ${event.data.frame}] ⚔️  Combat started with ${event.data.enemyName}`);
      } else if (event.type === 'combat_ended') {
        console.log(`    ✓ Combat ended: ${event.data.result} (${event.data.roundsFought} rounds)`);
      } else if (event.type === 'error') {
        console.error(`    ❌ Error in ${event.data.context}: ${event.data.message}`);
      }
    }
  });

  console.log('✓ Autonomous game created');

  // Run the game
  console.log('\n[4/5] Running autonomous game...');
  console.log('─'.repeat(80));

  const startTime = Date.now();
  const stats = await autonomousGame.run();
  const endTime = Date.now();

  console.log('─'.repeat(80));
  console.log('✓ Autonomous game completed');

  // Display results
  console.log('\n[5/5] Results:');
  console.log('─'.repeat(80));
  console.log(`Frames executed: ${stats.frame}`);
  console.log(`Total runtime: ${((endTime - startTime) / 1000).toFixed(2)}s`);
  console.log(`Average frame time: ${((endTime - startTime) / stats.frame).toFixed(0)}ms`);
  console.log('\nStats:');
  console.log(`  - Conversations: ${stats.conversations}`);
  console.log(`  - Actions taken: ${stats.actions}`);
  console.log(`  - Combat encounters: ${stats.combats}`);
  console.log(`  - Player health: ${stats.playerHP}/${stats.playerMaxHP}`);

  // Validate expectations
  console.log('\n' + '='.repeat(80));
  console.log('VALIDATION');
  console.log('='.repeat(80));

  const tests = [
    {
      name: 'Game completed without crashes',
      passed: stats.frame >= 1,
      details: `Ran ${stats.frame} frames`
    },
    {
      name: 'Player took actions',
      passed: stats.actions > 0,
      details: `${stats.actions} actions executed`
    },
    {
      name: 'Player had conversations',
      passed: stats.conversations > 0,
      details: `${stats.conversations} conversations`
    },
    {
      name: 'Time advanced',
      passed: gameService.getGameTime().gameTime > 0,
      details: `${gameService.getGameTime().gameTime} minutes elapsed`
    },
    {
      name: 'Player survived',
      passed: stats.playerHP > 0,
      details: `${stats.playerHP}/${stats.playerMaxHP} HP remaining`
    }
  ];

  let allPassed = true;
  tests.forEach(test => {
    const status = test.passed ? '✓ PASS' : '❌ FAIL';
    console.log(`${status}: ${test.name}`);
    if (test.details) {
      console.log(`         ${test.details}`);
    }
    if (!test.passed) {
      allPassed = false;
    }
  });

  console.log('\n' + '='.repeat(80));
  if (allPassed) {
    console.log('✓ ALL TESTS PASSED');
    console.log('='.repeat(80));
    process.exit(0);
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('='.repeat(80));
    process.exit(1);
  }
}

// Run the test with timeout
const timeout = setTimeout(() => {
  console.error('\n❌ Test timeout after 5 minutes');
  process.exit(1);
}, TEST_TIMEOUT);

runTest()
  .catch(error => {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  })
  .finally(() => {
    clearTimeout(timeout);
  });
