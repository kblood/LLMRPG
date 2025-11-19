// Test LLM call logging in replay system

import { GameSession } from './src/game/GameSession.js';
import { OllamaService } from './src/services/OllamaService.js';
import { Character } from './src/entities/Character.js';
import { Personality } from './src/ai/personality/Personality.js';
import { createAllNPCs } from './src/data/npc-roster.js';
import { ReplayLogger } from './src/replay/ReplayLogger.js';
import fs from 'fs';

async function testLLMLogging() {
  console.log('=== Testing LLM Call Logging ===\n');

  try {
    // Check Ollama
    console.log('1. Checking Ollama...');
    const ollama = OllamaService.getInstance();
    const available = await ollama.isAvailable();
    if (!available) {
      throw new Error('Ollama is not available');
    }
    console.log('   ✓ Ollama is available\n');

    // Create game session with a specific seed for reproducibility
    console.log('2. Creating game session...');
    const testSeed = Date.now();
    const session = new GameSession({
      seed: testSeed,
      model: 'llama3.1:8b',
      temperature: 0.8
    });
    console.log(`   ✓ Session created (seed: ${testSeed})\n`);

    // Create player
    const player = new Character('player', 'Tester', {
      role: 'protagonist',
      personality: new Personality({
        friendliness: 60,
        intelligence: 70,
        caution: 50,
        honor: 75,
        greed: 40,
        aggression: 35
      }),
      backstory: 'A tester checking LLM logging.'
    });

    // Create NPCs and register
    const npcsObject = createAllNPCs();
    const npcs = Object.values(npcsObject);

    session.addCharacter(player);
    npcs.forEach(npc => session.addCharacter(npc));
    console.log(`3. Loaded ${npcs.length} NPCs\n`);

    // Start conversation with first NPC
    const npc = npcs[0];
    console.log(`4. Starting conversation with ${npc.name}...`);

    const conversationId = await session.startConversation(npc.id);
    console.log(`   ✓ Conversation started (ID: ${conversationId})\n`);

    // Have a short conversation (2 turns)
    console.log('5. Having conversation...');

    console.log('   Player: Hello, how are you?');
    const response1 = await session.addConversationTurn(
      conversationId,
      npc.id,
      'Hello, how are you?'
    );
    console.log(`   ${npc.name}: ${response1.text.substring(0, 80)}...\n`);

    console.log('   Player: Thank you!');
    const response2 = await session.addConversationTurn(
      conversationId,
      npc.id,
      'Thank you!'
    );
    console.log(`   ${npc.name}: ${response2.text.substring(0, 80)}...\n`);

    // End conversation
    session.endConversation(conversationId);
    console.log('6. Conversation ended\n');

    // Get session stats
    const stats = session.getStats();
    console.log('7. Session Stats:');
    console.log(`   Session ID: ${stats.sessionId}`);
    console.log(`   Replay file: ${stats.replayFile}\n`);

    // Wait a moment for file write
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if replay file exists and has LLM calls
    console.log('8. Checking replay file...');
    if (!stats.replayFile) {
      throw new Error('No replay file created!');
    }

    const replayPath = `./replays/${stats.replayFile}`;
    if (!fs.existsSync(replayPath)) {
      throw new Error(`Replay file not found: ${replayPath}`);
    }
    console.log(`   ✓ Replay file exists: ${stats.replayFile}\n`);

    // Read and parse replay file
    console.log('9. Analyzing replay content...');
    const { ReplayFile } = await import('./src/replay/ReplayFile.js');
    const replayFile = new ReplayFile(replayPath);
    const replayData = await replayFile.load();

    console.log(`   Total events: ${replayData.events?.length || 0}`);
    console.log(`   LLM calls: ${replayData.llmCalls?.length || 0}`);
    console.log(`   Checkpoints: ${replayData.checkpoints?.length || 0}\n`);

    // Verify LLM calls were logged
    if (!replayData.llmCalls || replayData.llmCalls.length === 0) {
      console.error('   ✗ FAILED: No LLM calls logged in replay!');
      console.error('   Expected at least 3 LLM calls (greeting + 2 responses)\n');
      return false;
    }

    if (replayData.llmCalls.length < 3) {
      console.error(`   ✗ FAILED: Only ${replayData.llmCalls.length} LLM calls logged`);
      console.error('   Expected at least 3 LLM calls (greeting + 2 responses)\n');
      return false;
    }

    // Show sample LLM call
    console.log('   Sample LLM call:');
    const sampleCall = replayData.llmCalls[0];
    console.log(`     Frame: ${sampleCall.frame}`);
    console.log(`     Character: ${sampleCall.characterId}`);
    console.log(`     Prompt: ${sampleCall.prompt?.substring(0, 100)}...`);
    console.log(`     Response: ${sampleCall.response?.substring(0, 100)}...`);
    console.log();

    console.log('=== TEST PASSED ===');
    console.log(`✓ LLM calls are being logged correctly!`);
    console.log(`✓ Found ${replayData.llmCalls.length} LLM calls in replay\n`);

    return true;

  } catch (error) {
    console.error('\n=== TEST FAILED ===');
    console.error('✗ Error:', error.message);
    console.error(error.stack);
    return false;
  }
}

testLLMLogging().then(success => {
  process.exit(success ? 0 : 1);
});
