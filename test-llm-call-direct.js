// Direct test of LLM call logging

import { DialogueGenerator } from './src/ai/llm/DialogueGenerator.js';
import { OllamaService } from './src/services/OllamaService.js';
import { Character } from './src/entities/Character.js';
import { Personality } from './src/ai/personality/Personality.js';
import { ReplayLogger } from './src/replay/ReplayLogger.js';

async function testLLMCallLogging() {
  console.log('=== Direct LLM Call Logging Test ===\n');

  try {
    // Check Ollama
    console.log('1. Checking Ollama...');
    const ollama = OllamaService.getInstance();
    const available = await ollama.isAvailable();
    if (!available) {
      throw new Error('Ollama not available');
    }
    console.log('   ✓ Ollama available\n');

    // Create ReplayLogger
    console.log('2. Creating ReplayLogger...');
    const testSeed = Date.now();
    const replayLogger = new ReplayLogger(testSeed);
    replayLogger.initialize({ seed: testSeed });
    console.log(`   ✓ ReplayLogger created (seed: ${testSeed})\n`);

    // Create dialogue generator
    console.log('3. Creating DialogueGenerator...');
    const generator = new DialogueGenerator({
      ollama,
      model: 'llama3.1:8b',
      temperature: 0.8
    });
    console.log('   ✓ DialogueGenerator created\n');

    // Create test characters
    const speaker = new Character('speaker', 'TestSpeaker', {
      role: 'merchant',
      personality: new Personality({
        friendliness: 70,
        intelligence: 60,
        caution: 50,
        honor: 75,
        greed: 40,
        aggression: 30
      }),
      backstory: 'A test character'
    });

    const listener = new Character('listener', 'TestListener', {
      role: 'protagonist',
      personality: new Personality({
        friendliness: 60,
        intelligence: 70,
        caution: 50,
        honor: 75,
        greed: 40,
        aggression: 35
      }),
      backstory: 'A test listener'
    });

    console.log('4. Generating greeting (should log LLM call)...');
    const greeting = await generator.generateGreeting(speaker, listener, { frame: 0 });
    console.log(`   Generated: "${greeting.text.substring(0, 80)}..."`);
    console.log();

    console.log('5. Generating response (should log LLM call)...');
    const response = await generator.generateResponse(speaker, listener, 'Hello!', { frame: 1 });
    console.log(`   Generated: "${response.text.substring(0, 80)}..."`);
    console.log();

    // Check if LLM calls were logged
    console.log('6. Checking ReplayLogger...');
    console.log(`   LLM calls logged: ${replayLogger.llmCalls.length}`);

    if (replayLogger.llmCalls.length === 0) {
      console.error('   ✗ FAILED: No LLM calls logged!\n');
      return false;
    }

    if (replayLogger.llmCalls.length < 2) {
      console.error(`   ✗ FAILED: Only ${replayLogger.llmCalls.length} LLM call logged`);
      console.error('   Expected 2 LLM calls (greeting + response)\n');
      return false;
    }

    console.log(`   ✓ Found ${replayLogger.llmCalls.length} LLM calls\n`);

    // Show details
    console.log('7. LLM Call Details:');
    replayLogger.llmCalls.forEach((call, i) => {
      console.log(`   Call ${i + 1}:`);
      console.log(`     Frame: ${call.frame}`);
      console.log(`     Character: ${call.characterId}`);
      console.log(`     Prompt: ${call.prompt.substring(0, 60)}...`);
      console.log(`     Response: ${call.response.substring(0, 60)}...`);
      console.log();
    });

    console.log('=== TEST PASSED ===');
    console.log('✓ LLM call logging is working correctly!\n');
    return true;

  } catch (error) {
    console.error('\n=== TEST FAILED ===');
    console.error('✗ Error:', error.message);
    console.error(error.stack);
    return false;
  }
}

testLLMCallLogging().then(success => {
  process.exit(success ? 0 : 1);
});
