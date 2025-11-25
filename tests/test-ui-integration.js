/**
 * UI Integration Test
 * 
 * Tests that the GameBackendIntegrated properly publishes state updates
 * and that the StatePublisher can deliver them to subscribers (simulating the UI).
 */

import { GameBackendIntegrated } from '../electron/ipc/GameBackendIntegrated.js';
import { statePublisher } from '../src/services/StatePublisher.js';

console.log('='.repeat(80));
console.log('UI INTEGRATION TEST');
console.log('Testing StatePublisher -> UI communication');
console.log('='.repeat(80));

// Track received updates
const receivedUpdates = [];
let updateCount = 0;

// Create a UI subscriber
const uiSubscriber = {
  id: 'test-ui',
  onStateUpdate: (state, eventType, metadata) => {
    updateCount++;
    receivedUpdates.push({
      type: 'state_update',
      eventType,
      frame: state.frame,
      time: state.time,
      hasProtagonist: !!(state.characters && state.characters.protagonist),
      metadata
    });
    
    console.log(`\n[UI] Update #${updateCount}: ${eventType} (Frame: ${state.frame})`);
    
    if (state.time) {
      const hours = Math.floor(state.time.gameTime / 60) % 24;
      const minutes = Math.floor(state.time.gameTime % 60);
      console.log(`  Time: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} - Day ${state.time.day}`);
    }
    
    if (state.characters && state.characters.protagonist) {
      const p = state.characters.protagonist;
      console.log(`  Protagonist: ${p.name} at ${p.currentLocation}`);
      if (p.stats) {
        console.log(`    HP: ${p.stats.currentHP}/${p.stats.maxHP}, Level: ${p.stats.level || 1}`);
      }
    }
    
    if (state.quests && state.quests.active) {
      console.log(`  Quests: ${state.quests.active.length} active`);
    }
    
    if (state.location) {
      console.log(`  Locations: ${state.location.discovered?.length || 0} discovered`);
    }
    
    if (metadata && Object.keys(metadata).length > 0) {
      console.log(`  Metadata:`, metadata);
    }
  },
  
  onGameEvent: (event) => {
    receivedUpdates.push({
      type: 'game_event',
      event: event.type
    });
    console.log(`\n[UI] Event: ${event.type}`);
  }
};

// Subscribe to state publisher
console.log('\n[Test] Subscribing UI to StatePublisher...');
statePublisher.subscribe(uiSubscriber);
console.log('[Test] UI subscribed successfully');

// Create game backend
console.log('\n[Test] Creating GameBackendIntegrated...');
const backend = new GameBackendIntegrated();

// Set UI callback (this is what main.js does)
backend.setUICallback((update) => {
  console.log('[Test] UI callback received update:', update.type, update.eventType || update.event?.type);
});

// Initialize game
console.log('\n[Test] Initializing game...');
const initResult = await backend.initialize({
  playerName: 'TestHero',
  seed: 12345,
  model: 'granite4:3b',
  theme: 'fantasy'
});

if (!initResult.initialized) {
  console.error('[Test] Failed to initialize:', initResult);
  process.exit(1);
}

console.log('[Test] Game initialized successfully');
console.log(`[Test] Received ${updateCount} updates during initialization`);

// Start autonomous mode
console.log('\n[Test] Starting autonomous mode for 30 seconds...');
console.log('[Test] Watch for state updates below:');
console.log('-'.repeat(80));

const startResult = await backend.startAutonomousMode({
  maxTurns: 10,
  frameDelay: 2000 // 2 seconds between frames
});

if (!startResult.success) {
  console.error('[Test] Failed to start autonomous:', startResult.error);
  process.exit(1);
}

// Wait 30 seconds
await new Promise(resolve => setTimeout(resolve, 30000));

// Stop autonomous mode
console.log('\n' + '-'.repeat(80));
console.log('[Test] Stopping autonomous mode...');
await backend.stopAutonomousMode();

// Show summary
console.log('\n' + '='.repeat(80));
console.log('TEST SUMMARY');
console.log('='.repeat(80));
console.log(`Total updates received: ${updateCount}`);
console.log('\nUpdate breakdown by type:');
const updatesByType = {};
receivedUpdates.forEach(u => {
  const key = u.type === 'state_update' ? u.eventType : u.event;
  updatesByType[key] = (updatesByType[key] || 0) + 1;
});
Object.entries(updatesByType).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
  console.log(`  ${type}: ${count}`);
});

// Validate
const hasFrameUpdates = updatesByType['frame_update'] > 0;
const hasDialogueUpdates = updatesByType['dialogue_line'] > 0;
const hasActionUpdates = updatesByType['action_executed'] > 0;

console.log('\nValidation:');
console.log(`  ✓ Frame updates: ${hasFrameUpdates ? 'PASS' : 'FAIL'}`);
console.log(`  ✓ Dialogue updates: ${hasDialogueUpdates ? 'PASS' : 'FAIL'}`);
console.log(`  ✓ Action updates: ${hasActionUpdates ? 'PASS' : 'FAIL'}`);

if (updateCount === 0) {
  console.log('\n❌ FAIL: No updates received! UI integration is broken.');
  process.exit(1);
} else if (updateCount < 5) {
  console.log('\n⚠️  WARNING: Very few updates received. Something might be wrong.');
} else {
  console.log('\n✅ SUCCESS: UI is receiving state updates!');
}

// Cleanup
await backend.cleanup();
console.log('\n[Test] Cleanup complete');
process.exit(0);
