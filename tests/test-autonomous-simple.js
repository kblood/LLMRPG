/**
 * Simple Autonomous Test
 * Tests autonomous game for 3 minutes to verify combat and exploration
 */

import { GameBackendIntegrated } from '../electron/ipc/GameBackendIntegrated.js';

console.log('=== Simple Autonomous Test (3 minutes) ===\n');

const events = {
  frames: 0,
  actions: [],
  locations: new Set(),
  combats: 0,
  conversations: 0,
  errors: []
};

async function test() {
  let backend = null;
  let isRunning = false;
  
  try {
    console.log('[1/6] Creating backend...');
    backend = new GameBackendIntegrated();
    
    // Set UI callback to receive events
    backend.setUICallback((data) => {
      if (data.type === 'state_update') {
        const { state, eventType } = data;
        events.frames = state.frame;
        
        if (eventType === 'action_completed') {
          events.actions.push(data.actionType);
          if (data.actionType === 'travel') {
            const loc = data.result?.location?.name || 'Unknown';
            events.locations.add(loc);
            console.log(`  → Travel to: ${loc}`);
          }
        }
        
        if (eventType === 'combat_started') {
          events.combats++;
          console.log(`  → Combat with: ${data.enemy?.name}`);
        }
        
        if (eventType === 'conversation_started') {
          events.conversations++;
          console.log(`  → Conversation with: ${data.npcName}`);
        }
      }
    });
    
    console.log('✓ Backend created\n');
    
    console.log('[2/6] Initializing game...');
    const init = await backend.initialize({
      playerName: 'Test Adventurer',
      theme: 'fantasy',
      seed: 999,
      model: 'granite4:3b'
    });
    
    console.log('Init result:', init);
    
    if (!init || !init.initialized) {
      throw new Error(`Init failed: ${JSON.stringify(init)}`);
    }
    
    console.log('✓ Game initialized\n');
    
    console.log('[3/6] Checking initial state...');
    const state = backend.getGameState();
    console.log(`  Protagonist: ${state.characters?.protagonist?.name}`);
    console.log(`  Location: ${state.location?.current}`);
    console.log(`  HP: ${state.characters?.protagonist?.stats?.currentHP}/${state.characters?.protagonist?.stats?.maxHP}`);
    console.log('✓ State valid\n');
    
    console.log('[4/6] Starting autonomous mode...');
    backend.startAutonomousMode();
    isRunning = true;
    console.log('✓ Autonomous mode started\n');
    
    console.log('[5/6] Running for 3 minutes...');
    const startTime = Date.now();
    const duration = 3 * 60 * 1000; // 3 minutes
    
    while (Date.now() - startTime < duration) {
      await new Promise(resolve => setTimeout(resolve, 30000)); // Check every 30s
      const currentState = backend.getGameState();
      console.log(`  [${Math.floor((Date.now() - startTime) / 1000)}s] Frame: ${currentState.frame}, Actions: ${events.actions.length}, Locations: ${events.locations.size}, Combats: ${events.combats}`);
    }
    
    console.log('\n[6/6] Stopping...');
    backend.stopAutonomousMode();
    isRunning = false;
    console.log('✓ Stopped\n');
    
    // Results
    console.log('=== RESULTS ===');
    console.log(`Frames processed: ${events.frames}`);
    console.log(`Actions: ${events.actions.length} - [${[...new Set(events.actions)].join(', ')}]`);
    console.log(`Locations: ${events.locations.size} - [${Array.from(events.locations).join(', ')}]`);
    console.log(`Combats: ${events.combats}`);
    console.log(`Conversations: ${events.conversations}`);
    
    //Validation
    console.log('\n=== VALIDATION ===');
    const passed = [];
    const failed = [];
    
    if (events.frames >= 10) {
      passed.push('Game processed frames');
    } else {
      failed.push(`Only ${events.frames} frames processed`);
    }
    
    if (events.actions.length >= 5) {
      passed.push('Actions were performed');
    } else {
      failed.push(`Only ${events.actions.length} actions performed`);
    }
    
    if (events.locations.size >= 2) {
      passed.push('Protagonist traveled to multiple locations');
    } else {
      failed.push(`Only visited ${events.locations.size} location(s)`);
    }
    
    if (events.combats >= 1) {
      passed.push('Combat occurred');
    } else {
      failed.push('No combat encounters');
    }
    
    passed.forEach(p => console.log(`✓ ${p}`));
    failed.forEach(f => console.log(`✗ ${f}`));
    
    if (failed.length === 0) {
      console.log('\n✅ ALL VALIDATIONS PASSED\n');
      return true;
    } else {
      console.log(`\n❌ ${failed.length} VALIDATION(S) FAILED\n`);
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    console.error(error.stack);
    return false;
  } finally {
    if (isRunning && backend) {
      backend.stopAutonomousMode();
    }
  }
}

test().then(success => process.exit(success ? 0 : 1));
