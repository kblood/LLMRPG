/**
 * GameService Usage Examples
 *
 * This file demonstrates how to use the GameService class
 * for various game operations.
 */

import { GameService } from '../src/services/GameService.js';
import { GameSession } from '../src/game/GameSession.js';

// ============================================================================
// BASIC SETUP
// ============================================================================

async function basicSetup() {
  console.log('=== Basic Setup ===\n');

  // Create game session
  const session = new GameSession({
    seed: 12345,
    model: 'granite4:3b',
    temperature: 0.8
  });

  // Create game service
  const gameService = new GameService(session);

  // Initialize
  await gameService.initialize();

  console.log('Session ID:', gameService.getSessionId());
  console.log('Seed:', gameService.getSeed());
  console.log('Initialized:', gameService.isInitialized());
  console.log();

  return gameService;
}

// ============================================================================
// GAME STATE QUERIES
// ============================================================================

async function queryGameState(gameService) {
  console.log('=== Game State Queries ===\n');

  // Get complete game state
  const state = gameService.getGameState();

  console.log('Current Frame:', state.frame);
  console.log('Game Time:', state.time.gameTimeString);
  console.log('Time of Day:', state.time.timeOfDay);
  console.log('Weather:', state.time.weather);
  console.log('Season:', state.time.season);
  console.log();

  // Get protagonist
  const protagonist = gameService.getProtagonist();
  if (protagonist) {
    console.log('Protagonist:', protagonist.name);
    console.log('Location:', protagonist.location);
  }
  console.log();

  // Get NPCs
  const npcs = gameService.getNPCs();
  console.log('NPCs in game:', npcs.length);
  npcs.slice(0, 3).forEach(npc => {
    console.log(`  - ${npc.name} (${npc.occupation})`);
  });
  console.log();

  // Get current location
  const location = gameService.getCurrentLocation();
  if (location) {
    console.log('Current Location:', location.name);
    console.log('Type:', location.type);
    console.log('Safe:', location.safe);
  }
  console.log();

  return state;
}

// ============================================================================
// TIME ADVANCEMENT
// ============================================================================

async function advanceTime(gameService) {
  console.log('=== Time Advancement ===\n');

  console.log('Starting time:', gameService.getGameState().time.gameTimeString);

  // Advance 15 minutes
  const timeState = gameService.tick(15);
  console.log('After 15 minutes:', timeState.time);

  // Advance 1 hour
  gameService.tick(60);
  console.log('After 1 hour:', gameService.getGameState().time.gameTimeString);

  // Advance to next day
  gameService.tick(1440); // 24 hours
  console.log('Next day:', gameService.getGameState().time.day);
  console.log();
}

// ============================================================================
// CONVERSATION EXAMPLE
// ============================================================================

async function conversationExample(gameService) {
  console.log('=== Conversation Example ===\n');

  // Get available NPCs
  const npcs = gameService.getCharactersAtLocation();
  if (npcs.length === 0) {
    console.log('No NPCs at current location');
    return;
  }

  const npc = npcs[0];
  console.log(`Starting conversation with ${npc.name}...\n`);

  // Start conversation
  const conversation = await gameService.startConversation(npc.id);
  console.log(`${npc.name}: ${conversation.greeting || 'Hello!'}\n`);

  // Player responds
  const response1 = await gameService.addConversationTurn(
    conversation.id,
    'Tell me about this place.',
    {}
  );
  console.log(`${npc.name}: ${response1.text}\n`);

  // Another turn
  const response2 = await gameService.addConversationTurn(
    conversation.id,
    'Do you need any help?',
    {}
  );
  console.log(`${npc.name}: ${response2.text}\n`);

  // End conversation
  gameService.endConversation(conversation.id);
  console.log('Conversation ended.\n');
}

// ============================================================================
// LOCATION MANAGEMENT
// ============================================================================

async function locationManagement(gameService) {
  console.log('=== Location Management ===\n');

  // Get discovered locations
  const discovered = gameService.getDiscoveredLocations();
  console.log('Discovered locations:', discovered.length);
  discovered.forEach(loc => {
    console.log(`  - ${loc.name} (${loc.type})`);
  });
  console.log();

  // Get current location
  const current = gameService.getCurrentLocation();
  if (current) {
    console.log('Current location:', current.name);
    console.log('Description:', current.description);
    console.log('Danger level:', current.dangerLevel);
    console.log();
  }

  // Discover a new location (example - location must exist in database)
  // gameService.discoverLocation('new_location_id', 'New Location Name');
}

// ============================================================================
// ACTION EXECUTION
// ============================================================================

async function actionExamples(gameService) {
  console.log('=== Action Execution ===\n');

  try {
    // Travel action
    const locations = gameService.getDiscoveredLocations();
    if (locations.length > 1) {
      const destination = locations[1];
      console.log(`Traveling to ${destination.name}...`);

      const travelResult = await gameService.executeAction({
        type: 'travel',
        data: {
          locationId: destination.id
        }
      });

      console.log('Travel complete!');
      console.log('Time spent:', travelResult.timeSpent, 'minutes');
      console.log('New location:', travelResult.location.name);
      console.log();
    }

    // Investigate action
    console.log('Investigating the area...');
    const investigateResult = await gameService.executeAction({
      type: 'investigate',
      data: {
        location: 'surrounding area'
      }
    });
    console.log('Investigation complete!');
    console.log('Time spent:', investigateResult.timeSpent, 'minutes');
    console.log();

    // Rest action
    console.log('Resting for 1 hour...');
    const restResult = await gameService.executeAction({
      type: 'rest',
      data: {
        duration: 60
      }
    });
    console.log('Rest complete!');
    console.log('Health restored:', restResult.restored);
    console.log();

  } catch (error) {
    console.error('Action failed:', error.message);
  }
}

// ============================================================================
// QUEST MANAGEMENT
// ============================================================================

async function questManagement(gameService) {
  console.log('=== Quest Management ===\n');

  // Get active quests
  const quests = gameService.getActiveQuests();
  console.log('Active quests:', quests.length);

  quests.forEach(quest => {
    console.log(`\nQuest: ${quest.title}`);
    console.log(`Status: ${quest.status}`);
    console.log(`Giver: ${quest.giver}`);
    if (quest.objectives) {
      console.log('Objectives:');
      quest.objectives.forEach(obj => {
        const status = obj.completed ? '[X]' : '[ ]';
        console.log(`  ${status} ${obj.description}`);
      });
    }
  });
  console.log();

  // Get quests by specific NPC
  const npcs = gameService.getNPCs();
  if (npcs.length > 0) {
    const npc = npcs[0];
    const npcQuests = gameService.getQuestsByNPC(npc.id);
    console.log(`Quests from ${npc.name}:`, npcQuests.length);
  }
  console.log();
}

// ============================================================================
// STATE SNAPSHOTS & REPLAY
// ============================================================================

async function snapshotExample(gameService) {
  console.log('=== State Snapshots ===\n');

  // Get current snapshots
  const snapshots = gameService.getStateSnapshots();
  console.log('State snapshots:', snapshots.length);

  snapshots.forEach((snapshot, idx) => {
    console.log(`Snapshot ${idx + 1}:`);
    console.log(`  Frame: ${snapshot.frame}`);
    console.log(`  Time: ${snapshot.state.time.gameTimeString}`);
    console.log(`  Location: ${snapshot.state.location.current}`);
  });
  console.log();

  // Get action history
  const history = gameService.getActionHistory();
  console.log('Action history entries:', history.length);

  history.slice(-5).forEach(action => {
    console.log(`  Frame ${action.frame}: ${action.type}`);
  });
  console.log();
}

// ============================================================================
// SAVE/LOAD EXAMPLE
// ============================================================================

async function saveLoadExample(gameService) {
  console.log('=== Save/Load Example ===\n');

  // Export complete state
  const saveData = gameService.exportState();

  console.log('Exported state:');
  console.log('  Session ID:', saveData.gameState.sessionId);
  console.log('  Frame:', saveData.gameState.frame);
  console.log('  Actions:', saveData.actionHistory.length);
  console.log('  Snapshots:', saveData.snapshots.length);
  console.log();

  // In a real application, you would save this to file/database
  // fs.writeFileSync('savegame.json', JSON.stringify(saveData));

  console.log('Save data size:', JSON.stringify(saveData).length, 'bytes');
  console.log();
}

// ============================================================================
// PAUSE/RESUME EXAMPLE
// ============================================================================

async function pauseResumeExample(gameService) {
  console.log('=== Pause/Resume Example ===\n');

  console.log('Is paused?', gameService.isPaused());

  // Pause game
  gameService.pause();
  console.log('Game paused');
  console.log('Is paused?', gameService.isPaused());

  // Try to tick while paused (no effect)
  const beforeFrame = gameService.getFrame();
  gameService.tick(10);
  const afterFrame = gameService.getFrame();
  console.log('Frame before tick:', beforeFrame);
  console.log('Frame after tick (while paused):', afterFrame);
  console.log('Frame changed?', beforeFrame !== afterFrame);

  // Resume game
  gameService.resume();
  console.log('Game resumed');
  console.log('Is paused?', gameService.isPaused());

  // Now tick works
  gameService.tick(10);
  console.log('Frame after resume and tick:', gameService.getFrame());
  console.log();
}

// ============================================================================
// STATISTICS EXAMPLE
// ============================================================================

async function statisticsExample(gameService) {
  console.log('=== Statistics ===\n');

  const stats = gameService.getStats();

  console.log('Session Statistics:');
  console.log('  Session ID:', stats.sessionId);
  console.log('  Seed:', stats.seed);
  console.log('  Frame:', stats.frame);
  console.log('  Game Time:', stats.gameTime);
  console.log('  Time of Day:', stats.timeOfDay);
  console.log('  Weather:', stats.weather);
  console.log('  Season:', stats.season);
  console.log('  Day:', stats.day);
  console.log('  Year:', stats.year);
  console.log('  Character Count:', stats.characterCount);
  console.log('  NPC Count:', stats.npcCount);
  console.log('  Real Time Played:', stats.realTimePlayed, 'seconds');
  console.log();
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  try {
    // Basic setup
    const gameService = await basicSetup();

    // Query state
    await queryGameState(gameService);

    // Advance time
    await advanceTime(gameService);

    // Pause/Resume
    await pauseResumeExample(gameService);

    // Location management
    await locationManagement(gameService);

    // Action execution
    await actionExamples(gameService);

    // Quest management
    await questManagement(gameService);

    // Conversations (if NPCs available)
    // Uncomment if you have NPCs set up
    // await conversationExample(gameService);

    // Snapshots
    await snapshotExample(gameService);

    // Statistics
    await statisticsExample(gameService);

    // Save/Load
    await saveLoadExample(gameService);

    console.log('=== All examples completed successfully! ===');

  } catch (error) {
    console.error('Error running examples:', error);
    console.error(error.stack);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  basicSetup,
  queryGameState,
  advanceTime,
  conversationExample,
  locationManagement,
  actionExamples,
  questManagement,
  snapshotExample,
  saveLoadExample,
  pauseResumeExample,
  statisticsExample
};
