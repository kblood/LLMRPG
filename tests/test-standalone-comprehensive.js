/**
 * Comprehensive Standalone Test
 * Tests the complete standalone autonomous game flow without UI
 */

import { GameService } from '../src/services/GameService.js';
import { StandaloneAutonomousGame } from '../src/services/StandaloneAutonomousGame.js';

console.log('=== Comprehensive Standalone Test ===\n');

const events = {
  actions: [],
  locations: new Set(),
  combats: 0,
  conversations: 0,
  dialogueLines: 0
};

async function test() {
  let standaloneGame = null;
  
  try {
    console.log('Step 1: Initialize GameService with world config...');
    const gameService = new GameService();
    
    await gameService.initialize({
      playerName: 'Test Hero',
      theme: 'fantasy',
      seed: 54321,
      model: 'granite4:3b'
    });
    
    console.log('✓ GameService initialized\n');
    
    console.log('Step 2: Create StandaloneAutonomousGame...');
    standaloneGame = new StandaloneAutonomousGame(gameService, {
      maxFrames: 300, // Run for 300 frames (~10 minutes at 2s/frame)
      pauseBetweenActions: 2000,
      speedMultiplier: 1
    });
    
    // Subscribe to events
    standaloneGame.on('action_completed', (data) => {
      events.actions.push(data.actionType);
      console.log(`[Event] Action: ${data.actionType}`);
      
      if (data.actionType === 'travel' && data.result?.location) {
        events.locations.add(data.result.location.name);
      }
    });
    
    standaloneGame.on('combat_started', (data) => {
      events.combats++;
      console.log(`[Event] Combat started with ${data.enemy?.name}`);
    });
    
    standaloneGame.on('conversation_started', (data) => {
      events.conversations++;
      console.log(`[Event] Conversation with ${data.npcName}`);
    });
    
    standaloneGame.on('dialogue_line', (data) => {
      events.dialogueLines++;
    });
    
    console.log('✓ StandaloneAutonomousGame created\n');
    
    console.log('Step 3: Run autonomous game...');
    console.log('  Running for up to 300 frames (monitoring every 30 frames)\n');
    
    // Monitor progress
    const monitorInterval = setInterval(() => {
      const state = gameService.getGameState();
      console.log(`[Monitor] Frame ${state.frame}: Location=${state.location?.current}, Actions=${events.actions.length}, Combats=${events.combats}, Conversations=${events.conversations}`);
    }, 60000); // Every minute
    
    // Run the game
    await standaloneGame.run();
    
    clearInterval(monitorInterval);
    
    console.log('\n✓ Autonomous game completed\n');
    
    console.log('Step 4: Analyze results...');
    const finalState = gameService.getGameState();
    console.log(`  Total frames: ${finalState.frame}`);
    console.log(`  Actions performed: ${events.actions.length}`);
    console.log(`  Unique action types: ${[...new Set(events.actions)].join(', ')}`);
    console.log(`  Locations visited: ${events.locations.size} - ${Array.from(events.locations).join(', ')}`);
    console.log(`  Combat encounters: ${events.combats}`);
    console.log(`  Conversations: ${events.conversations}`);
    console.log(`  Dialogue lines: ${events.dialogueLines}`);
    console.log(`  Final HP: ${finalState.characters.protagonist?.stats?.currentHP}/${finalState.characters.protagonist?.stats?.maxHP}`);
    
    // Validate
    console.log('\nStep 5: Validate results...');
    const issues = [];
    
    if (events.actions.length === 0) {
      issues.push('No actions were performed');
    }
    
    if (events.locations.size < 2) {
      issues.push(`Only visited ${events.locations.size} location(s) - expected travel to multiple locations`);
    }
    
    if (events.combats === 0) {
      issues.push('No combat encounters occurred - combat system may not be triggering');
    }
    
    if (events.conversations === 0) {
      issues.push('No conversations occurred');
    }
    
    if (finalState.frame < 10) {
      issues.push(`Only ${finalState.frame} frames processed - game may have stopped early`);
    }
    
    if (!events.actions.includes('travel')) {
      issues.push('No travel actions - protagonist did not move');
    }
    
    console.log('\n=== Test Results ===');
    if (issues.length === 0) {
      console.log('✅ ALL TESTS PASSED');
      console.log('✓ Protagonist performs actions autonomously');
      console.log('✓ Protagonist travels between locations');
      console.log('✓ Combat system generates and resolves encounters');
      console.log('✓ Dialogue system handles conversations');
      console.log('✓ Game runs without UI successfully');
      console.log('\n✅ COMPREHENSIVE STANDALONE TEST: PASSED\n');
      return true;
    } else {
      console.log('❌ TESTS FAILED - Issues found:');
      issues.forEach(issue => console.log(`  ❌ ${issue}`));
      console.log('\n❌ COMPREHENSIVE STANDALONE TEST: FAILED\n');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    console.error(error.stack);
    return false;
  } finally {
    if (standaloneGame && standaloneGame.isRunning) {
      standaloneGame.stop();
    }
  }
}

// Run test
test()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
