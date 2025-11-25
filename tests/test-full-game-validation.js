/**
 * Full Game Validation Test
 * Tests that the game can run autonomously with combat and exploration
 */

import { GameBackendIntegrated } from '../electron/ipc/GameBackendIntegrated.js';

console.log('=== Full Game Validation Test ===\n');

let gameBackend = null;
let sessionActive = false;

// Track game events
const events = {
  stateUpdates: 0,
  locations: new Set(),
  combats: 0,
  conversations: 0,
  actions: []
};

async function runTest() {
  try {
    console.log('Step 1: Initialize game backend...');
    gameBackend = new GameBackendIntegrated();
    
    // Subscribe to state updates
    gameBackend.subscribe((state, eventType, eventData) => {
      events.stateUpdates++;
      
      if (eventType === 'location_changed') {
        events.locations.add(eventData.locationName);
        console.log(`[Event] Location changed: ${eventData.locationName}`);
      }
      
      if (eventType === 'combat_started') {
        events.combats++;
        console.log(`[Event] Combat started with ${eventData.enemy?.name}`);
      }
      
      if (eventType === 'dialogue_started') {
        events.conversations++;
        console.log(`[Event] Conversation started with ${eventData.npcName}`);
      }
      
      if (eventType === 'action_completed') {
        events.actions.push(eventData.actionType);
        console.log(`[Event] Action completed: ${eventData.actionType}`);
      }
    });
    
    console.log('✓ Game backend initialized\n');
    
    console.log('Step 2: Initialize game with sci-fi theme...');
    const result = await gameBackend.initialize({
      playerName: 'Test Explorer',
      theme: 'sci-fi',
      seed: 12345
    });
    
    if (!result.success) {
      throw new Error(`Initialization failed: ${result.error}`);
    }
    
    console.log('✓ Game initialized successfully\n');
    
    console.log('Step 3: Get initial state...');
    const initialState = gameBackend.getGameState();
    console.log(`  Protagonist: ${initialState.protagonist?.name}`);
    console.log(`  Location: ${initialState.currentLocation?.name || 'Unknown'}`);
    console.log(`  NPCs: ${initialState.npcs?.length || 0}`);
    console.log(`  Frame: ${initialState.frame}`);
    console.log('✓ Initial state retrieved\n');
    
    console.log('Step 4: Start autonomous mode...');
    gameBackend.startAutonomous();
    sessionActive = true;
    console.log('✓ Autonomous mode started\n');
    
    console.log('Step 5: Run for 2 minutes to observe behavior...');
    console.log('  Watching for: location changes, combat, conversations\n');
    
    // Monitor every 10 seconds
    const monitorInterval = setInterval(() => {
      const state = gameBackend.getGameState();
      console.log(`[Monitor] Frame: ${state.frame}, Location: ${state.currentLocation?.name}, HP: ${state.protagonist?.stats?.currentHP}/${state.protagonist?.stats?.maxHP}`);
    }, 10000);
    
    // Run for 2 minutes
    await new Promise(resolve => setTimeout(resolve, 120000));
    
    clearInterval(monitorInterval);
    
    console.log('\nStep 6: Stop autonomous mode...');
    gameBackend.stopAutonomous();
    sessionActive = false;
    console.log('✓ Autonomous mode stopped\n');
    
    console.log('Step 7: Review results...');
    const finalState = gameBackend.getGameState();
    console.log(`  Final frame: ${finalState.frame}`);
    console.log(`  State updates received: ${events.stateUpdates}`);
    console.log(`  Locations visited: ${events.locations.size} - ${Array.from(events.locations).join(', ')}`);
    console.log(`  Combat encounters: ${events.combats}`);
    console.log(`  Conversations: ${events.conversations}`);
    console.log(`  Actions performed: ${events.actions.length}`);
    console.log(`  Action types: ${[...new Set(events.actions)].join(', ')}`);
    
    // Validate results
    const issues = [];
    
    if (events.stateUpdates === 0) {
      issues.push('No state updates received');
    }
    
    if (events.locations.size < 2) {
      issues.push(`Only visited ${events.locations.size} location(s) - expected protagonist to travel`);
    }
    
    if (events.combats === 0) {
      issues.push('No combat encounters - expected protagonist to enter combat');
    }
    
    if (events.actions.length === 0) {
      issues.push('No actions performed');
    }
    
    if (finalState.frame < 10) {
      issues.push(`Only ${finalState.frame} frames processed - game may not be running`);
    }
    
    console.log('\n=== Test Results ===');
    if (issues.length === 0) {
      console.log('✓ All validations passed!');
      console.log('✓ Game runs autonomously with proper state updates');
      console.log('✓ Protagonist travels between locations');
      console.log('✓ Combat system is working');
      console.log('\n✅ FULL GAME VALIDATION: PASSED\n');
      return true;
    } else {
      console.log('❌ Issues found:');
      issues.forEach(issue => console.log(`  - ${issue}`));
      console.log('\n❌ FULL GAME VALIDATION: FAILED\n');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    console.error(error.stack);
    return false;
  } finally {
    if (sessionActive && gameBackend) {
      console.log('\nCleaning up...');
      gameBackend.stopAutonomous();
    }
  }
}

// Run test
runTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
