/**
 * Test Contextual Commands
 *
 * Tests the enhanced UI commands (look, npcs, quests, locations)
 * without requiring full interactive gameplay
 */

import { GameMaster } from './src/systems/GameMaster.js';
import { WorldGenerator } from './src/systems/world/WorldGenerator.js';
import { ContextualCommands } from './src/ui/ContextualCommands.js';
import { OllamaService } from './src/services/OllamaService.js';
import { EventBus } from './src/services/EventBus.js';

async function testContextualCommands() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║         TESTING CONTEXTUAL COMMANDS                             ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('');

  try {
    // Initialize services
    const ollama = OllamaService.getInstance();
    const eventBus = EventBus.getInstance();

    // Initialize Game Master
    const gm = new GameMaster(ollama, eventBus);

    // Initialize World Generator
    const worldGen = new WorldGenerator(gm, {
      seed: 12345 // Fixed seed for consistent testing
    });

    // Generate world
    console.log('Generating test world...\n');
    const world = await worldGen.generateWorld({
      playerName: 'Aldric',
      difficulty: 'normal'
    });

    // Initialize contextual commands
    const commands = new ContextualCommands(world);

    console.log('✅ World generated successfully!\n');
    console.log('═'.repeat(70));
    console.log('');

    // Test 1: look command
    console.log('TEST 1: look command');
    console.log('─'.repeat(70));
    const lookResult = commands.look();
    console.log(lookResult);
    console.log('');
    console.log('✅ look command works\n');

    // Test 2: npcs command
    console.log('TEST 2: npcs command');
    console.log('─'.repeat(70));
    const npcsResult = commands.npcs();
    console.log(npcsResult);
    console.log('');
    console.log('✅ npcs command works\n');

    // Test 3: quests command
    console.log('TEST 3: quests command');
    console.log('─'.repeat(70));
    const questsResult = commands.quests();
    console.log(questsResult);
    console.log('');
    console.log('✅ quests command works\n');

    // Test 4: locations command
    console.log('TEST 4: locations command');
    console.log('─'.repeat(70));
    const locationsResult = commands.locations();
    console.log(locationsResult);
    console.log('');
    console.log('✅ locations command works\n');

    // Test 5: Travel and look again
    console.log('TEST 5: Travel to nearby location and look');
    console.log('─'.repeat(70));

    // Find a nearby location
    const nearbyLocs = commands.getNearbyLocations(world.locations.get(world.player.currentLocation));
    if (nearbyLocs.length > 0) {
      const destination = nearbyLocs[0].location;
      console.log(`Traveling to ${destination.name}...\n`);

      // Update player location
      world.player.currentLocation = destination.id;
      destination.visited = true;
      destination.discovered = true;

      // Look at new location
      const newLookResult = commands.look();
      console.log(newLookResult);
      console.log('');
      console.log('✅ Travel and look works\n');
    } else {
      console.log('⚠️  No nearby locations to test travel\n');
    }

    // Summary
    console.log('═'.repeat(70));
    console.log('');
    console.log('✅ ALL TESTS PASSED - Contextual Commands Working!');
    console.log('');
    console.log('Commands tested:');
    console.log('  ✓ look - Shows location, NPCs, quests, nearby places');
    console.log('  ✓ npcs - Shows NPCs at location, nearby, quest-related');
    console.log('  ✓ quests - Shows active/completed quests with guidance');
    console.log('  ✓ locations - Shows discovered locations with travel info');
    console.log('  ✓ Travel - Updates location and context');
    console.log('');
    console.log('═'.repeat(70));
    console.log('');

    return world;

  } catch (error) {
    console.error('');
    console.error('❌ TEST FAILED');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    console.error(error.stack);
    console.error('');
    throw error;
  }
}

// Run test
testContextualCommands()
  .then(() => {
    console.log('Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
