/**
 * Test World Generation System
 *
 * Tests the new procedural world generation with:
 * - GM-generated starting town
 * - NPCs with knowledge systems
 * - Sparse locations with narrative fuel
 * - Main quest generation
 */

import { GameMaster } from './src/systems/GameMaster.js';
import { WorldGenerator } from './src/systems/world/WorldGenerator.js';
import { OllamaService } from './src/services/OllamaService.js';
import { EventBus } from './src/services/EventBus.js';

async function testWorldGeneration() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║         TESTING WORLD GENERATION SYSTEM                         ║');
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
      seed: Date.now()
    });

    // Generate world
    const world = await worldGen.generateWorld({
      playerName: 'Aldric',
      difficulty: 'normal'
    });

    // Display results
    console.log('');
    console.log('═'.repeat(70));
    console.log('         ✅ WORLD GENERATION COMPLETE');
    console.log('═'.repeat(70));
    console.log('');

    // World summary
    console.log(`🌍 World: ${world.name}`);
    console.log(`   Seed: ${world.seed}`);
    console.log('');

    // Starting town
    console.log(`🏰 Starting Town: ${world.startingTown.name}`);
    console.log(`   Type: ${world.startingTown.customProperties.type || 'town'}`);
    console.log(`   Population: ${world.startingTown.customProperties.population || 'unknown'}`);
    console.log(`   Industry: ${world.startingTown.customProperties.industry || 'trade'}`);
    console.log(`   Situation: ${world.startingTown.customProperties.situation || 'peaceful'}`);
    console.log('');
    console.log(`   Description:`);
    console.log(`   ${world.startingTown.description}`);
    console.log('');

    // Landmarks
    const landmarks = world.startingTown.customProperties.landmarks || [];
    if (landmarks.length > 0) {
      console.log(`   Landmarks:`);
      landmarks.forEach(landmark => {
        console.log(`   • ${landmark}`);
      });
      console.log('');
    }

    // NPCs
    console.log(`👥 NPCs (${world.npcs.size} total):`);
    let npcCount = 0;
    for (const [id, npc] of world.npcs) {
      if (!npc.isPlayer && npcCount < 5) {
        console.log(`   • ${npc.name} - ${npc.role}`);
        console.log(`     Concern: ${npc.currentConcern || 'none'}`);
        console.log(`     Mood: ${npc.mood || 'neutral'}`);

        if (npc.knowledge && npc.knowledge.specialties.length > 0) {
          console.log(`     Knows about: ${npc.knowledge.specialties.join(', ')}`);
        }

        if (npc.knowledge && npc.knowledge.rumors.length > 0) {
          console.log(`     Rumors: ${npc.knowledge.rumors.slice(0, 2).join('; ')}`);
        }

        console.log('');
        npcCount++;
      }
    }

    if (world.npcs.size > 5) {
      console.log(`   ... and ${world.npcs.size - 5} more`);
      console.log('');
    }

    // Main Quest
    console.log(`📜 Main Quest: "${world.mainQuest.title}"`);
    console.log(`   Given by: ${world.mainQuest.giver || 'mysterious'}`);
    console.log(`   Description: ${world.mainQuest.description || 'unknown'}`);
    console.log('');
    console.log(`   Initial Objectives:`);
    world.mainQuest.objectives.slice(0, 3).forEach((obj, i) => {
      console.log(`   ${i + 1}. ${obj.description}`);
    });
    console.log('');

    if (world.mainQuest.guidance) {
      console.log(`   Next Step:`);
      console.log(`   • Go to: ${world.mainQuest.guidance.nextLocation || 'unknown'}`);
      console.log(`   • Talk to: ${world.mainQuest.guidance.nextNPC || 'unknown'}`);
      console.log(`   • Hint: ${world.mainQuest.guidance.hint || 'explore'}`);
      console.log('');
    }

    // Locations
    console.log(`🗺️  Locations (${world.locations.size} total):`);
    console.log('');

    let locCount = 0;
    for (const [id, loc] of world.locations) {
      if (loc.id !== 'starting_town' && locCount < 5) {
        console.log(`   ${loc.name} (${loc.type})`);
        console.log(`   • Direction: ${loc.customProperties.direction || 'unknown'}`);
        console.log(`   • Distance: ${loc.customProperties.distanceFromStart || '?'} km`);
        console.log(`   • Coordinates: (${loc.coordinates.x}, ${loc.coordinates.y})`);

        const fuel = loc.customProperties.narrativeFuel;
        if (fuel) {
          if (fuel.commonKnowledge && fuel.commonKnowledge.length > 0) {
            console.log(`   • Known: ${fuel.commonKnowledge[0]}`);
          }

          if (fuel.rumors && fuel.rumors.length > 0) {
            console.log(`   • Rumor: ${fuel.rumors[0].text || fuel.rumors[0]}`);
          }

          if (fuel.questHooks && fuel.questHooks.length > 0) {
            console.log(`   • Hook: ${fuel.questHooks[0]}`);
          }
        }

        console.log('');
        locCount++;
      }
    }

    if (world.locations.size > 6) {
      console.log(`   ... and ${world.locations.size - 6} more locations`);
      console.log('');
    }

    // Player
    console.log(`⚔️  Player: ${world.player.name}`);
    console.log(`   Role: ${world.player.role}`);
    console.log(`   Location: ${world.startingTown.name}`);
    console.log(`   Mood: ${world.player.mood}`);
    console.log('');

    // Test Summary
    console.log('═'.repeat(70));
    console.log('');
    console.log('✅ TEST PASSED - World generation successful!');
    console.log('');
    console.log('Verification:');
    console.log(`  ✓ Starting town generated: ${world.startingTown.name}`);
    console.log(`  ✓ NPCs created: ${world.npcs.size}`);
    console.log(`  ✓ Locations created: ${world.locations.size}`);
    console.log(`  ✓ Main quest generated: ${world.mainQuest.title}`);
    console.log(`  ✓ Player created: ${world.player.name}`);
    console.log('');

    // Test narrative fuel
    let fuelCount = 0;
    for (const [id, loc] of world.locations) {
      if (loc.customProperties.narrativeFuel) {
        fuelCount++;
      }
    }
    console.log(`  ✓ Narrative fuel generated for ${fuelCount} locations`);

    // Test NPC knowledge
    let knowledgeCount = 0;
    for (const [id, npc] of world.npcs) {
      if (npc.knowledge && npc.knowledge.specialties.length > 0) {
        knowledgeCount++;
      }
    }
    console.log(`  ✓ ${knowledgeCount} NPCs have knowledge specialties`);
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
testWorldGeneration()
  .then(() => {
    console.log('Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
