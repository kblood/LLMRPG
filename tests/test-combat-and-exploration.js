/**
 * Long-running test for combat and exploration
 * Verifies protagonist travels between locations and enters combat
 */

import { GameBackendIntegrated } from '../electron/ipc/GameBackendIntegrated.js';
import { StatePublisher, EVENT_TYPES } from '../src/services/StatePublisher.js';

const TEST_CONFIG = {
  playerName: 'Test Hero',
  seed: 12345,
  model: 'granite4:3b',
  maxFrames: 100, // Run for 100 frames
  frameDelay: 500 // 500ms between frames
};

class TestMonitor {
  constructor() {
    this.stats = {
      frames: 0,
      locations: new Set(),
      combatEncounters: 0,
      travels: 0,
      conversations: 0,
      explorations: 0,
      rests: 0,
      errors: []
    };
    this.lastLocation = null;
  }

  onStateUpdate(state, eventType) {
    console.log(`[Monitor] onStateUpdate called! Frame: ${this.stats.frames + 1}, EventType: ${eventType}`);
    this.stats.frames++;
    
    // Debug: Log full protagonist object on first frame
    if (this.stats.frames === 1 && state.protagonist) {
      console.log('[Monitor] Protagonist object:', JSON.stringify(state.protagonist, null, 2));
    }
    
    // Track combat from state updates
    if (eventType === 'combat_started' || eventType === EVENT_TYPES.COMBAT_STARTED) {
      this.stats.combatEncounters++;
      console.log(`[Monitor] Combat started! Total encounters: ${this.stats.combatEncounters}`);
    }
    
    // Track actions from state updates
    if (eventType === 'action_executed' || eventType === EVENT_TYPES.ACTION_EXECUTED) {
      // Actions are tracked via events, but log here for visibility
      console.log(`[Monitor] Action executed at frame ${this.stats.frames}`);
    }
    
    // Access protagonist from characters object
    const protagonist = state.characters?.protagonist || state.protagonist;
    
    if (protagonist) {
      const currentLocation = protagonist.location || protagonist.currentLocation || protagonist.locationId;
      
      // Debug logging every 20 frames
      if (this.stats.frames % 20 === 0) {
        console.log('[Monitor] Protagonist state:', {
          name: protagonist.name,
          location: protagonist.location,
          currentLocation: protagonist.currentLocation,
          locationId: protagonist.locationId,
          detectedLocation: currentLocation
        });
      }
      
      if (currentLocation) {
        this.stats.locations.add(currentLocation);
        
        if (this.lastLocation && this.lastLocation !== currentLocation) {
          this.stats.travels++;
          console.log(`[Monitor] Travel detected: ${this.lastLocation} -> ${currentLocation}`);
        }
        
        this.lastLocation = currentLocation;
      } else {
        // Log when no location is found
        if (this.stats.frames % 20 === 0) {
          console.log('[Monitor] WARNING: Protagonist has no location!');
        }
      }
      
      // Log protagonist state
      if (this.stats.frames % 10 === 0) {
        console.log(`[Monitor] Frame ${this.stats.frames}: ${protagonist.name} at ${currentLocation || 'UNKNOWN'}`);
        console.log(`  HP: ${protagonist.stats?.health || protagonist.stats?.hp || 0}/${protagonist.stats?.maxHealth || protagonist.stats?.maxHP || 0}`);
        console.log(`  Status: ${protagonist.status || 'unknown'}`);
      }
    }
    
    // Check for combat in state
    if (state.combat) {
      console.log(`[Monitor] Combat state detected in frame ${this.stats.frames}`);
      console.log(`  Enemies: ${state.combat.enemies?.map(e => e.name).join(', ') || 'unknown'}`);
    }
  }

  onEvent(event) {
    console.log(`[Monitor] onGameEvent called! Type: ${event.type}`);
    switch (event.type) {
      case 'action_executed':
        const action = event.data?.actionType || event.data?.action;
        if (action === 'travel') this.stats.travels++;
        if (action === 'converse') this.stats.conversations++;
        if (action === 'explore') this.stats.explorations++;
        if (action === 'rest') this.stats.rests++;
        break;
        
      case 'combat_started':
        this.stats.combatEncounters++;
        console.log(`[Monitor] Combat started via event!`);
        break;
        
      case 'error':
        this.stats.errors.push(event.data);
        console.error(`[Monitor] Error: ${event.data?.message || 'unknown'}`);
        break;
    }
  }

  printSummary() {
    console.log('\n========================================');
    console.log('TEST SUMMARY');
    console.log('========================================');
    console.log(`Frames executed: ${this.stats.frames}`);
    console.log(`Unique locations visited: ${this.stats.locations.size}`);
    console.log(`Locations: ${Array.from(this.stats.locations).join(', ')}`);
    console.log(`Travel actions: ${this.stats.travels}`);
    console.log(`Combat encounters: ${this.stats.combatEncounters}`);
    console.log(`Conversations: ${this.stats.conversations}`);
    console.log(`Explorations: ${this.stats.explorations}`);
    console.log(`Rests: ${this.stats.rests}`);
    console.log(`Errors: ${this.stats.errors.length}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\nErrors encountered:');
      this.stats.errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.message || JSON.stringify(err)}`);
      });
    }
    
    console.log('\n========================================');
    console.log('TEST RESULTS');
    console.log('========================================');
    
    const passed = [];
    const failed = [];
    
    if (this.stats.locations.size > 1) {
      passed.push('✓ Protagonist visited multiple locations');
    } else {
      failed.push('✗ Protagonist did not visit multiple locations');
    }
    
    if (this.stats.travels > 0) {
      passed.push('✓ Protagonist traveled between locations');
    } else {
      failed.push('✗ No travel actions detected');
    }
    
    if (this.stats.combatEncounters > 0) {
      passed.push('✓ Combat encounters occurred');
    } else {
      failed.push('✗ No combat encounters detected');
    }
    
    if (this.stats.explorations > 0) {
      passed.push('✓ Exploration actions occurred');
    } else {
      failed.push('✗ No exploration actions detected');
    }
    
    if (this.stats.errors.length === 0) {
      passed.push('✓ No errors during execution');
    } else {
      failed.push(`✗ ${this.stats.errors.length} errors occurred`);
    }
    
    passed.forEach(msg => console.log(msg));
    failed.forEach(msg => console.log(msg));
    
    console.log('\n========================================\n');
    
    return failed.length === 0;
  }
}

async function runTest() {
  console.log('Starting long-running combat and exploration test...');
  console.log(`Configuration: ${JSON.stringify(TEST_CONFIG, null, 2)}\n`);
  
  const monitor = new TestMonitor();
  const backend = new GameBackendIntegrated();
  const statePublisher = StatePublisher.getInstance();
  
  // Subscribe to state updates
  const subscriberId = statePublisher.subscribe({
    id: 'test-monitor',
    onStateUpdate: (state, eventType) => {
      console.log(`[Monitor] Subscriber callback! EventType: ${eventType}`);
      monitor.onStateUpdate(state, eventType);
    },
    onGameEvent: (event) => {
      console.log(`[Monitor] Event callback! Event type: ${event.type}`);
      monitor.onEvent(event);
    }
  });
  
  console.log(`[Test] Subscribed to StatePublisher with ID: ${subscriberId}`);
  
  try {
    // Initialize the game
    console.log('[Test] Initializing game...');
    await backend.initialize({
      playerName: TEST_CONFIG.playerName,
      seed: TEST_CONFIG.seed,
      model: TEST_CONFIG.model,
      theme: 'fantasy'
    });
    
    console.log('[Test] Starting autonomous mode...');
    await backend.startAutonomousMode();
    
    // Let it run for a while
    console.log(`[Test] Running for ${TEST_CONFIG.maxFrames} frames...\n`);
    
    const startTime = Date.now();
    const maxDuration = TEST_CONFIG.maxFrames * TEST_CONFIG.frameDelay + 60000; // Extra minute for processing
    
    // Wait for either maxFrames or timeout
    await new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        
        if (monitor.stats.frames >= TEST_CONFIG.maxFrames || elapsed > maxDuration) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 1000);
    });
    
    console.log('\n[Test] Stopping autonomous mode...');
    await backend.stopAutonomousMode();
    
    // Give it a moment to finish
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Print summary
    const success = monitor.printSummary();
    
    // Cleanup
    await backend.cleanup();
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('[Test] Fatal error:', error);
    monitor.stats.errors.push({ message: error.message, stack: error.stack });
    monitor.printSummary();
    
    try {
      await backend.cleanup();
    } catch (cleanupError) {
      console.error('[Test] Cleanup error:', cleanupError);
    }
    
    process.exit(1);
  }
}

// Run the test
runTest().catch(error => {
  console.error('[Test] Unhandled error:', error);
  process.exit(1);
});
