/**
 * Test UI State Flow - Verify complete state publishing chain
 * 
 * This test simulates what happens when the UI starts an autonomous game
 * and verifies that all state updates are properly published.
 */

import { GameSession } from '../src/game/GameSession.js';
import { GameService } from '../src/services/GameService.js';
import { StandaloneAutonomousGame } from '../src/services/StandaloneAutonomousGame.js';
import { statePublisher } from '../src/services/StatePublisher.js';
import { OllamaService } from '../src/services/OllamaService.js';
import { Character } from '../src/entities/Character.js';
import { Personality } from '../src/ai/personality/Personality.js';
import { CharacterStats } from '../src/systems/stats/CharacterStats.js';
import { Inventory } from '../src/systems/items/Inventory.js';
import { Equipment } from '../src/systems/items/Equipment.js';
import { AbilityManager } from '../src/systems/abilities/AbilityManager.js';

/**
 * Simulate UI Subscriber
 */
class UISimulator {
  constructor() {
    this.stateUpdates = [];
    this.gameEvents = [];
    this.lastState = null;
  }

  onStateUpdate(state, eventType, metadata = {}) {
    this.stateUpdates.push({ state, eventType, metadata, timestamp: Date.now() });
    this.lastState = state;
    
    console.log(`\n[UISimulator] State Update #${this.stateUpdates.length}: ${eventType}`);
    console.log('  Frame:', state.frame);
    console.log('  Has Time:', !!state.time);
    console.log('  Has Protagonist:', !!(state.characters?.protagonist));
    console.log('  Quest Count:', state.quests?.active?.length || 0);
    console.log('  Locations Discovered:', state.location?.discovered?.length || 0);
    console.log('  Last Action:', state.lastAction?.action || 'none');
    console.log('  Active Combat:', !!state.activeCombat);
    
    // Detailed quest logging
    if (state.quests?.active?.length > 0) {
      console.log('  Active Quests:');
      state.quests.active.forEach(q => {
        console.log(`    - ${q.title} (${q.status})`);
      });
    }
    
    // Detailed location logging
    if (state.location?.discovered?.length > 0) {
      console.log('  Discovered Locations:', state.location.discovered.join(', '));
    }
    
    // Combat logging
    if (state.activeCombat) {
      console.log('  ⚔️ Combat Active:', state.activeCombat.enemies?.map(e => e.name).join(', '));
    }
    
    if (state.lastCombatResult) {
      console.log('  ⚔️ Last Combat:', state.lastCombatResult.outcome, `(${state.lastCombatResult.rounds} rounds)`);
    }
    
    // Dialogue logging
    if (state.lastDialogue) {
      console.log(`  💬 Dialogue: ${state.lastDialogue.speakerName}: "${state.lastDialogue.text.substring(0, 60)}..."`);
    }
  }

  onGameEvent(event) {
    this.gameEvents.push({ event, timestamp: Date.now() });
    console.log(`[UISimulator] Game Event: ${event.type}`);
  }

  getStats() {
    return {
      totalStateUpdates: this.stateUpdates.length,
      totalGameEvents: this.gameEvents.length,
      questsCreated: this.lastState?.quests?.active?.length || 0,
      locationsDiscovered: this.lastState?.location?.discovered?.length || 0,
      currentFrame: this.lastState?.frame || 0
    };
  }
}

/**
 * Main test function
 */
async function testUIStateFlow() {
  console.log('='.repeat(80));
  console.log('UI State Flow Test - Full Integration');
  console.log('='.repeat(80));

  try {
    // 1. Check Ollama
    console.log('\n[Test] Step 1: Checking Ollama...');
    const ollama = OllamaService.getInstance();
    const available = await ollama.isAvailable();
    if (!available) {
      throw new Error('Ollama is not available');
    }
    console.log('[Test] ✅ Ollama is available');

    // 2. Create UI Simulator
    console.log('\n[Test] Step 2: Creating UI Simulator...');
    const uiSim = new UISimulator();
    const subscriberId = statePublisher.subscribe({
      id: 'ui-simulator',
      onStateUpdate: (state, eventType, metadata) => uiSim.onStateUpdate(state, eventType, metadata),
      onGameEvent: (event) => uiSim.onGameEvent(event)
    });
    console.log('[Test] ✅ UI Simulator subscribed:', subscriberId);

    // 3. Create Game Session
    console.log('\n[Test] Step 3: Creating Game Session...');
    const gameSession = new GameSession({
      seed: Date.now(),
      model: 'granite4:3b',
      protagonistName: 'TestHero',
      theme: 'fantasy'
    });

    // 4. Create Protagonist
    console.log('\n[Test] Step 4: Creating Protagonist...');
    const protagonist = new Character('protagonist', 'TestHero', {
      role: 'protagonist',
      personality: new Personality({
        friendliness: 60,
        intelligence: 70,
        caution: 50,
        honor: 75,
        greed: 40,
        aggression: 35
      }),
      backstory: 'A test hero on a quest',
      stats: new CharacterStats({
        strength: 12,
        dexterity: 10,
        constitution: 14,
        intelligence: 11,
        wisdom: 10,
        charisma: 13
      }),
      inventory: new Inventory({ maxSlots: 20, maxWeight: 100, gold: 75 }),
      equipment: new Equipment(),
      abilities: new AbilityManager()
    });
    gameSession.addCharacter(protagonist);
    console.log('[Test] ✅ Protagonist created');

    // 5. Create NPCs
    console.log('\n[Test] Step 5: Creating NPCs...');
    const npcNames = ['Merchant Anna', 'Guard Marcus', 'Wise Elder'];
    npcNames.forEach((name, idx) => {
      const npc = new Character(`npc_${idx}`, name, {
        role: idx === 2 ? 'quest_giver' : 'merchant',
        personality: new Personality({
          friendliness: 60 + idx * 10,
          intelligence: 50 + idx * 15,
          caution: 40,
          honor: 70,
          greed: 30,
          aggression: 20
        }),
        backstory: `A ${name} in the town`,
        stats: new CharacterStats()
      });
      gameSession.addCharacter(npc);
    });
    console.log(`[Test] ✅ Created ${npcNames.length} NPCs`);

    // 6. Initialize locations
    console.log('\n[Test] Step 6: Initializing Locations...');
    const locations = new Map();
    [
      { id: 'town_square', name: 'Town Square', type: 'town', dangerLevel: 'safe' },
      { id: 'dark_forest', name: 'Dark Forest', type: 'wilderness', dangerLevel: 'high' },
      { id: 'ancient_ruins', name: 'Ancient Ruins', type: 'dungeon', dangerLevel: 'very_high' }
    ].forEach((loc, idx) => {
      locations.set(loc.id, {
        ...loc,
        description: `A ${loc.type} location`,
        coordinates: { x: idx * 10, y: idx * 10 },
        environment: { safe: loc.dangerLevel === 'safe', indoor: false }
      });
    });
    
    gameSession.initializeLocations({ locations, startingTown: locations.get('town_square') });
    locations.forEach((loc, id) => {
      gameSession.discoverLocation(id, loc.name);
    });
    protagonist.currentLocation = 'town_square';
    console.log(`[Test] ✅ Initialized ${locations.size} locations`);

    // 7. Create GameService
    console.log('\n[Test] Step 7: Creating GameService...');
    const gameService = new GameService(gameSession);
    await gameService.initialize();
    console.log('[Test] ✅ GameService initialized');

    // 8. Publish initial state
    console.log('\n[Test] Step 8: Publishing initial state...');
    statePublisher.publish(gameService.getGameState(), 'game_started');
    console.log('[Test] ✅ Initial state published');

    // 9. Create and run Standalone Autonomous Game
    console.log('\n[Test] Step 9: Starting Autonomous Mode...');
    const autonomousGame = new StandaloneAutonomousGame(gameService, {
      model: 'granite4:3b',
      maxFrames: 30, // Run for 30 frames
      frameDuration: 5000 // 5 seconds per frame
    });

    // Run autonomous mode
    statePublisher.broadcast({ type: 'autonomous_mode_started' });
    await autonomousGame.run();
    console.log('[Test] ✅ Autonomous mode completed');

    // 10. Display Results
    console.log('\n' + '='.repeat(80));
    console.log('TEST RESULTS');
    console.log('='.repeat(80));
    const stats = uiSim.getStats();
    console.log('UI State Updates:', stats.totalStateUpdates);
    console.log('Game Events:', stats.totalGameEvents);
    console.log('Quests Created:', stats.questsCreated);
    console.log('Locations Discovered:', stats.locationsDiscovered);
    console.log('Final Frame:', stats.currentFrame);

    // 11. Verify Critical Updates
    console.log('\n' + '='.repeat(80));
    console.log('VERIFICATION');
    console.log('='.repeat(80));
    
    const hasStateUpdates = stats.totalStateUpdates > 0;
    const hasQuests = stats.questsCreated > 0;
    const hasLocations = stats.locationsDiscovered > 0;
    
    console.log('✓ State Updates Received:', hasStateUpdates ? '✅ YES' : '❌ NO');
    console.log('✓ Quests Generated:', hasQuests ? '✅ YES' : '❌ NO');
    console.log('✓ Locations Discovered:', hasLocations ? '✅ YES' : '❌ NO');
    
    if (hasStateUpdates && hasQuests && hasLocations) {
      console.log('\n🎉 SUCCESS: All UI state updates are working correctly!');
    } else {
      console.log('\n⚠️  WARNING: Some UI state updates may not be working');
    }

    // 12. Cleanup
    statePublisher.unsubscribe(subscriberId);
    console.log('\n[Test] Cleanup complete');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testUIStateFlow()
  .then(() => {
    console.log('\n[Test] Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n[Test] Test failed with error:', error);
    process.exit(1);
  });
