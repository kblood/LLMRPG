#!/usr/bin/env node
/**
 * Victory System Test
 * Tests whether the quest completion detection and victory narration work
 */

import { GameSession } from './src/game/GameSession.js';
import { QuestManager } from './src/systems/quest/QuestManager.js';
import { Quest } from './src/systems/quest/Quest.js';
import { GameMaster } from './src/systems/GameMaster.js';
import { OllamaService } from './src/services/OllamaService.js';
import { EventBus } from './src/services/EventBus.js';
import { Character } from './src/entities/Character.js';

console.log('\n🎮 VICTORY SYSTEM TEST\n');

// Create session
const session = new GameSession({ seed: Date.now() });
session.questManager = new QuestManager();

// Create a simple test quest
const testQuest = new Quest('test_quest', 'The Lost Chronicle', 'Find the lost chronicle artifact');
testQuest.addObjective('Find the artifact', 'Find the lost chronicle');
testQuest.addObjective('Return it home', 'Return to the tavern keeper');

console.log('✓ Created test quest:', testQuest.title);
console.log('  - Objectives:', testQuest.objectives.length);
console.log('  - Quest state:', testQuest.state);

// Mark objectives as complete one by one
console.log('\nMarking objectives as complete...');
testQuest.objectives[0].completed = true;
console.log('✓ Marked objective 1 as complete');
console.log('  - Quest state:', testQuest.state);

testQuest.objectives[1].completed = true;
console.log('✓ Marked objective 2 as complete');
console.log('  - Quest state:', testQuest.state);

// Check completion
testQuest.checkCompletion();
console.log('✓ Checked for completion');
console.log('  - Quest state:', testQuest.state);
console.log('  - Is completed?:', testQuest.isCompleted ? testQuest.isCompleted() : 'N/A');

// Test GameMaster victory narration
(async () => {
  console.log('\n📖 Testing Chronicler Victory Narration...\n');

  try {
    const ollama = OllamaService.getInstance();
    const eventBus = EventBus.getInstance();
    const gameMaster = new GameMaster(ollama, eventBus);

    const player = new Character('player', 'Kael', {
      role: 'protagonist',
      backstory: 'A curious wanderer seeking adventure',
      personality: { friendliness: 70 }
    });

    const world = { startingTown: { name: 'Millhaven' } };

    const stats = {
      daysElapsed: 15,
      locationsVisited: 5,
      npcsEncountered: 12
    };

    console.log('Requesting victory narration from Chronicler...');
    const narration = await gameMaster.generateVictoryNarration(player, testQuest, world, stats);

    console.log('\n✓ Victory Narration Received:\n');
    console.log(narration);
    
    console.log('\n✓ Test Complete!');
    console.log('  - Narration length:', narration.length, 'characters');
    console.log('  - Contains emotional language:', narration.toLowerCase().includes('legacy') || narration.toLowerCase().includes('triumph'));

  } catch (error) {
    console.error('✗ Error generating narration:', error.message);
  }

  process.exit(0);
})();
