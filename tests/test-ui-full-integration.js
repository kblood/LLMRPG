/**
 * Full UI Integration Test
 * Tests that UI updates properly receive game state including dialogue, actions, and combat
 */

import { GameSession } from '../src/game/GameSession.js';
import { GameService } from '../src/services/GameService.js';
import { StandaloneAutonomousGame } from '../src/services/StandaloneAutonomousGame.js';
import { statePublisher, EVENT_TYPES } from '../src/services/StatePublisher.js';
import { OllamaService } from '../src/services/OllamaService.js';
import { CombatEncounterSystem } from '../src/systems/combat/CombatEncounterSystem.js';
import { CombatSystem } from '../src/systems/combat/CombatSystem.js';
import { GameMaster } from '../src/systems/GameMaster.js';
import { EventBus } from '../src/services/EventBus.js';

// Track all updates received
const updates = {
  stateUpdates: [],
  gameEvents: [],
  dialogueLines: [],
  actions: [],
  combats: []
};

/**
 * Simulate what the UI does
 */
function setupUISubscriber() {
  statePublisher.subscribe({
    id: 'test-ui',
    onStateUpdate: (state, eventType, metadata) => {
      updates.stateUpdates.push({ eventType, state, metadata, timestamp: Date.now() });
      
      // Log what UI would display
      switch (eventType) {
        case 'dialogue_line':
          if (state.lastDialogue) {
            const line = `${state.lastDialogue.speakerName}: ${state.lastDialogue.text}`;
            console.log(`  💬 ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
            updates.dialogueLines.push(state.lastDialogue);
          }
          break;
          
        case 'action_executed':
          if (state.lastAction) {
            console.log(`  ⚡ Action: ${state.lastAction.type}`);
            updates.actions.push(state.lastAction);
          }
          break;
          
        case 'combat_started':
          if (state.activeCombat) {
            const enemies = state.activeCombat.enemies.map(e => e.name).join(', ');
            console.log(`  ⚔️  Combat Started: vs ${enemies}`);
          }
          break;
          
        case 'combat_ended':
          if (state.lastCombatResult) {
            console.log(`  ⚔️  Combat Ended: ${state.lastCombatResult.outcome}`);
            updates.combats.push(state.lastCombatResult);
          }
          break;
          
        case 'frame_update':
          if (state.frame && state.frame % 5 === 0) {
            console.log(`  🎮 Frame ${state.frame}`);
          }
          break;
      }
    },
    onGameEvent: (event) => {
      updates.gameEvents.push(event);
      console.log(`  📢 Event: ${event.type}`);
    }
  });
}

/**
 * Main test function
 */
async function runTest() {
  console.log('='.repeat(80));
  console.log(' Full UI Integration Test - Verifying State Updates');
  console.log('='.repeat(80));
  console.log();

  try {
    // 1. Initialize services
    console.log('🔧 Initializing services...');
    const ollama = OllamaService.getInstance({
      baseUrl: 'http://localhost:11434',
      model: 'granite4:3b'
    });

    const available = await ollama.isAvailable();
    if (!available) {
      console.error('❌ Ollama service not available');
      process.exit(1);
    }
    console.log('✅ Ollama service available');

    // 2. Create simple world config
    console.log('\n🌍 Creating world config...');
    const worldConfig = {
      title: 'Test World',
      theme: 'fantasy',
      playerName: 'Aldric',
      openingNarration: 'A brave adventurer sets forth...',
      npcs: [
        { name: 'Elara', role: 'Wizard', location: 'location_0' },
        { name: 'Thorne', role: 'Warrior', location: 'location_0' },
        { name: 'Mira', role: 'Merchant', location: 'location_1' }
      ],
      quests: {
        main: { title: 'Save the Kingdom', description: 'Defeat the dark lord' },
        side: []
      },
      items: [],
      locations: [
        { id: 'location_0', name: 'Village Square', description: 'A bustling village', danger: 'low' },
        { id: 'location_1', name: 'Dark Forest', description: 'A dangerous forest', danger: 'medium' }
      ]
    };
    console.log(`✅ World created: ${worldConfig.title}`);

    // 3. Create game session
    console.log('\n🎮 Creating game session...');
    const gameSession = new GameSession(worldConfig, Date.now());
    // GameSession initializes in constructor
    console.log('✅ Game session initialized');

    // 4. Create game service
    const gameService = new GameService(gameSession);
    
    // Initialize combat systems
    const eventBus = EventBus.getInstance();
    const gameMaster = new GameMaster(ollama, eventBus, worldConfig.theme);
    const combatEncounterSystem = new CombatEncounterSystem(gameSession, gameMaster);
    const combatSystem = new CombatSystem(gameSession, gameMaster);
    
    gameService.combatEncounterSystem = combatEncounterSystem;
    gameService.combatSystem = combatSystem;
    
    await gameService.initialize();
    console.log('✅ Game service initialized');

    // 5. Setup UI subscriber
    console.log('\n📺 Setting up UI subscriber...');
    setupUISubscriber();
    console.log('✅ UI subscriber active');

    // 6. Create and run autonomous game
    console.log('\n🤖 Starting autonomous mode...');
    console.log('   (Will run for 30 frames or until first combat)');
    console.log();
    
    const autonomousGame = new StandaloneAutonomousGame(gameService, {
      frameDelay: 100, // Fast for testing
      maxFrames: 30,
      enableEventCallback: false // We're using StatePublisher instead
    });

    await autonomousGame.run();

    // 7. Print results
    console.log('\n' + '='.repeat(80));
    console.log(' TEST RESULTS');
    console.log('='.repeat(80));
    
    console.log(`\n📊 Total state updates received: ${updates.stateUpdates.length}`);
    console.log(`   💬 Dialogue lines: ${updates.dialogueLines.length}`);
    console.log(`   ⚡ Actions: ${updates.actions.length}`);
    console.log(`   ⚔️  Combats: ${updates.combats.length}`);
    console.log(`   📢 Game events: ${updates.gameEvents.length}`);

    // Verify we got data
    let passed = true;
    
    if (updates.stateUpdates.length === 0) {
      console.log('\n❌ FAIL: No state updates received!');
      passed = false;
    } else {
      console.log('\n✅ PASS: State updates received');
    }

    if (updates.dialogueLines.length === 0) {
      console.log('❌ FAIL: No dialogue lines received!');
      passed = false;
    } else {
      console.log(`✅ PASS: Dialogue lines received (${updates.dialogueLines.length})`);
      
      // Show first few dialogue lines
      console.log('\n   Sample dialogue:');
      updates.dialogueLines.slice(0, 3).forEach(d => {
        console.log(`     ${d.speakerName}: ${d.text.substring(0, 80)}...`);
      });
    }

    if (updates.actions.length === 0) {
      console.log('❌ FAIL: No actions received!');
      passed = false;
    } else {
      console.log(`✅ PASS: Actions received (${updates.actions.length})`);
      
      // Show action types
      const actionTypes = [...new Set(updates.actions.map(a => a.type))];
      console.log(`   Action types: ${actionTypes.join(', ')}`);
    }

    // Combat is optional but nice to have
    if (updates.combats.length > 0) {
      console.log(`✅ BONUS: Combat occurred (${updates.combats.length})`);
    } else {
      console.log('ℹ️  INFO: No combat occurred (may be random)');
    }

    // Final verdict
    console.log('\n' + '='.repeat(80));
    if (passed) {
      console.log('✅ TEST PASSED: UI integration working correctly!');
      console.log('   - State updates are being published');
      console.log('   - Dialogue is tracked in state.lastDialogue');
      console.log('   - Actions are tracked in state.lastAction');
      console.log('   - UI would display all game events');
      console.log('='.repeat(80));
      process.exit(0);
    } else {
      console.log('❌ TEST FAILED: UI integration has issues');
      console.log('   See errors above for details');
      console.log('='.repeat(80));
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ TEST ERROR:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Add String.prototype.center for formatting
String.prototype.center = function(width) {
  const padding = Math.max(0, Math.floor((width - this.length) / 2));
  return ' '.repeat(padding) + this + ' '.repeat(padding);
};

// Run test
runTest();
