// Automated game test - runs a short conversation and exits

import { GameSession } from './src/game/GameSession.js';
import { GameMaster } from './src/systems/GameMaster.js';
import { OllamaService } from './src/services/OllamaService.js';
import { EventBus } from './src/services/EventBus.js';
import { Character } from './src/entities/Character.js';
import { Personality } from './src/ai/personality/Personality.js';
import { createAllNPCs } from './src/data/npc-roster.js';

async function runAutomatedTest() {
  console.log('=== Starting Automated Game Test ===\n');

  try {
    // Initialize services
    const ollama = OllamaService.getInstance();
    const eventBus = EventBus.getInstance();

    // Check Ollama
    console.log('Checking Ollama availability...');
    const available = await ollama.isAvailable();
    if (!available) {
      throw new Error('Ollama is not available');
    }
    console.log('✓ Ollama is available\n');

    // Create game session
    const session = new GameSession({
      seed: 12345,
      model: 'llama3.1:8b',
      temperature: 0.8
    });

    // Create player
    const player = new Character('player', 'Adventurer', {
      role: 'protagonist',
      personality: new Personality({
        friendliness: 60,
        intelligence: 70,
        caution: 50,
        honor: 75,
        greed: 40,
        aggression: 35
      }),
      backstory: 'A curious adventurer who has arrived in the village.'
    });

    // Create NPCs
    const npcsObject = createAllNPCs();
    const npcs = Object.values(npcsObject);

    // Register characters
    session.addCharacter(player);
    npcs.forEach(npc => session.addCharacter(npc));

    console.log(`✓ Loaded ${npcs.length} NPCs\n`);

    // Initialize Game Master
    const gameMaster = new GameMaster(ollama, eventBus);

    // Select first NPC
    const npc = npcs[0];
    console.log(`Starting conversation with ${npc.name} (${npc.role})\n`);

    // Start conversation
    const conversation = await session.startConversation(npc.id);
    console.log(`✓ Conversation started (ID: ${conversation.id})\n`);

    // Have a short conversation
    const messages = [
      "Hello! How are you today?",
      "What do you do in the village?",
      "Thank you for talking with me!"
    ];

    for (const message of messages) {
      console.log(`You: ${message}`);

      const response = await session.addConversationTurn(
        conversation.id,
        npc.id,
        message
      );

      console.log(`${npc.name}: ${response.text}`);

      if (response.relationshipChange) {
        console.log(`  [Relationship ${response.relationshipChange > 0 ? '+' : ''}${response.relationshipChange}]`);
      }
      console.log();

      // Small delay between messages
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // End conversation
    session.endConversation(conversation.id);
    console.log('✓ Conversation ended\n');

    // Get session stats
    const stats = session.getStats();
    console.log('=== Session Stats ===');
    console.log(`Session ID: ${stats.sessionId}`);
    console.log(`Replay file: ${stats.replayFile}`);
    console.log(`Total turns: ${conversation.turns?.length || 0}`);
    console.log(`Final relationship: ${npc.relationships.getRelationshipLevel(player.id)}`);
    console.log();

    console.log('✓ Test completed successfully!');
    console.log(`\nTo view replay, run: npm run replay:view ${stats.sessionId}`);

  } catch (error) {
    console.error('✗ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runAutomatedTest();
