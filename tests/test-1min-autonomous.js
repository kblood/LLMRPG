/**
 * 1-Minute Autonomous Test
 * Quick test to verify autonomous game works
 */

import { GameBackendIntegrated } from '../electron/ipc/GameBackendIntegrated.js';

console.log('=== 1-Minute Autonomous Test ===\n');

const events = {
  actions: [],
  locations: new Set(),
  combats: 0,
  conversations: 0
};

async function test() {
  const backend = new GameBackendIntegrated();
  
  try {
    console.log('Initializing...');
    await backend.initialize({
      playerName: 'TestHero',
      theme: 'fantasy',
      seed: 12345
    });
    
    const state = backend.getGameState();
    console.log(`✓ Init: ${state.characters.protagonist.name}, ${state.characters.npcs.length} NPCs`);
    console.log(`  Location: ${state.location.current}`);
    console.log(`  HP: ${state.characters.protagonist.stats.health}/${state.characters.protagonist.stats.maxHealth}\n`);
    
    backend.setUICallback((data) => {
      if (data.eventType === 'action_completed') {
        events.actions.push(data.actionType);
        if (data.actionType === 'travel' && data.result?.location) {
          events.locations.add(data.result.location.name);
        }
      }
      if (data.eventType === 'combat_started') {
        events.combats++;
      }
      if (data.eventType === 'conversation_started') {
        events.conversations++;
      }
    });
    
    console.log('Starting autonomous mode for 60 seconds...\n');
    backend.startAutonomousMode();
    
    // Monitor
    for (let i = 0; i < 6; i++) {
      await new Promise(r => setTimeout(r, 10000));
      const s = backend.getGameState();
      console.log(`[${i*10}s] Frame:${s.frame}, Actions:${events.actions.length}, Locations:${events.locations.size}, Combats:${events.combats}, Conversations:${events.conversations}`);
    }
    
    backend.stopAutonomousMode();
    
    console.log('\n=== Results ===');
    console.log(`Actions: ${events.actions.length} - [${[...new Set(events.actions)].slice(0,5).join(', ')}]`);
    console.log(`Locations visited: ${events.locations.size}`);
    console.log(`Combats: ${events.combats}`);
    console.log(`Conversations: ${events.conversations}`);
    
    const passed = events.actions.length >= 3 && 
                   (events.locations.size >= 2 || events.conversations >= 1 || events.combats >= 1);
    
    if (passed) {
      console.log('\n✅ TEST PASSED\n');
      return true;
    } else {
      console.log('\n❌ TEST FAILED - Insufficient activity\n');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    return false;
  }
}

test().then(success => process.exit(success ? 0 : 1));
