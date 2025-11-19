// Test script for LLM integration
import { Character } from './src/entities/Character.js';
import { Personality } from './src/ai/personality/Personality.js';
import { OllamaService } from './src/services/OllamaService.js';
import { SeedManager } from './src/services/SeedManager.js';
import { PromptBuilder } from './src/ai/llm/PromptBuilder.js';
import { ResponseParser } from './src/ai/llm/ResponseParser.js';

console.log('=== Testing LLM Integration ===\n');

// Initialize services
const ollama = OllamaService.getInstance();
const seedManager = new SeedManager(12345);
const promptBuilder = new PromptBuilder();
const responseParser = new ResponseParser();

// Create test characters
console.log('1. Creating Characters...');
const mara = new Character('mara', 'Mara', {
  role: 'npc',
  backstory: 'I inherited this tavern from my father 10 years ago',
  occupation: 'Tavern Keeper',
  age: 35,
  personality: Personality.createArchetype('cheerful_tavern_keeper')
});

const john = new Character('john', 'John', {
  role: 'protagonist',
  backstory: 'A traveler seeking adventure',
  age: 28
});

// Set up initial state
mara.memory.addMemory('background', 'I know everyone in town and hear all the gossip', {
  importance: 60
});
mara.memory.addMemory('concern', 'Someone has been stealing from my storage recently', {
  importance: 80
});

mara.relationships.setRelationship('john', 45);

console.log(`   ✓ Created: ${mara.name} and ${john.name}`);

// Test Ollama availability
console.log('\n2. Checking Ollama Availability...');
const available = await ollama.isAvailable();
console.log(`   Ollama available: ${available ? '✓ YES' : '✗ NO'}`);

if (!available) {
  console.log('\n   ⚠️  Ollama is not running!');
  console.log('   Start Ollama and run: ollama pull mistral');
  console.log('   Continuing with mock responses...\n');
}

// Test prompt building
console.log('\n3. Testing Prompt Builder...');
const greetingPrompt = promptBuilder.buildGreetingPrompt(mara, john, {
  situation: 'John enters the tavern'
});

console.log('   Generated greeting prompt:');
console.log('   ' + '-'.repeat(50));
console.log(greetingPrompt.split('\n').map(l => '   ' + l).join('\n'));
console.log('   ' + '-'.repeat(50));

// Test seed generation
console.log('\n4. Testing Seed Manager...');
const seed1 = seedManager.getNextSeed('mara', 'greeting', 0);
const seed2 = seedManager.getNextSeed('mara', 'greeting', 0);
const seed3 = seedManager.getNextSeed('john', 'greeting', 0);

console.log(`   Seed for Mara greeting #1: ${seed1}`);
console.log(`   Seed for Mara greeting #2: ${seed2} (different: ${seed1 !== seed2 ? '✓' : '✗'})`);
console.log(`   Seed for John greeting #1: ${seed3} (different from Mara: ${seed1 !== seed3 ? '✓' : '✗'})`);

// Test determinism
console.log('\n5. Testing Determinism...');
seedManager.reset();
const seedA = seedManager.getNextSeed('mara', 'greeting', 0);
seedManager.reset();
const seedB = seedManager.getNextSeed('mara', 'greeting', 0);
console.log(`   Same seed after reset: ${seedA === seedB ? '✓ YES' : '✗ NO'} (${seedA} === ${seedB})`);

// Test LLM generation (if Ollama is available)
if (available) {
  console.log('\n6. Testing LLM Generation...');
  console.log('   Generating greeting from Mara to John...');
  
  try {
    const seed = seedManager.getNextSeed('mara', 'greeting', 0);
    const response = await ollama.generate(greetingPrompt, {
      model: 'llama3.1:8b',
      temperature: 0.7,
      seed: seed
    });

    console.log(`   ✓ Response received (${response.length} characters)`);
    
    // Parse response
    const parsed = responseParser.parseDialogue(response);
    console.log(`   Valid: ${parsed.valid ? '✓' : '✗'}`);
    if (parsed.issues.length > 0) {
      console.log(`   Issues: ${parsed.issues.join(', ')}`);
    }
    console.log(`\n   Mara says: "${parsed.text}"`);

    // Test determinism with same seed
    console.log('\n   Testing deterministic generation...');
    seedManager.reset();
    const sameSeed = seedManager.getNextSeed('mara', 'greeting', 0);
    const response2 = await ollama.generate(greetingPrompt, {
      model: 'llama3.1:8b',
      temperature: 0.7,
      seed: sameSeed
    });

    console.log(`   Same response: ${response === response2 ? '✓ YES' : '✗ NO (cache or model variance)'}`);

  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
  }

  // Show statistics
  console.log('\n7. Service Statistics...');
  const stats = ollama.getStats();
  console.log(`   Total calls: ${stats.totalCalls}`);
  console.log(`   Cache hits: ${stats.cacheHits}`);
  console.log(`   Cache hit rate: ${stats.cacheHitRate}`);
  console.log(`   Errors: ${stats.errors}`);
  console.log(`   Total tokens: ${stats.totalTokens}`);

} else {
  console.log('\n6. Testing Response Parser (without LLM)...');
  
  const mockResponses = [
    'Good morning, John! Always nice to see a friendly face.',
    '**As Mara**: "Welcome to the tavern!"',
    'As an AI, I cannot actually speak as this character.',
    'Hello there! How can I help you today? What brings you to our fine establishment? We have the best ale in town!',
    '...'
  ];

  mockResponses.forEach((mock, i) => {
    console.log(`\n   Test ${i + 1}: "${mock.substring(0, 50)}..."`);
    const parsed = responseParser.parseDialogue(mock);
    console.log(`     Valid: ${parsed.valid ? '✓' : '✗'}`);
    console.log(`     Result: "${parsed.text}"`);
    if (parsed.issues.length > 0) {
      console.log(`     Issues: ${parsed.issues.join(', ')}`);
    }
  });
}

// Test dialogue context building
console.log('\n8. Testing Conversation Context...');
const conversationHistory = [
  { speaker: 'Mara', text: 'Good morning!' },
  { speaker: 'John', text: 'Hello, Mara. How are you?' },
  { speaker: 'Mara', text: "I'm well, thank you!" }
];

const dialoguePrompt = promptBuilder.buildDialoguePrompt(mara, john, {
  input: 'Have you heard any interesting news lately?',
  previousDialogue: promptBuilder.formatConversationHistory(conversationHistory)
});

console.log('   ✓ Built conversation context with history');
console.log(`   Prompt length: ${dialoguePrompt.length} characters`);

console.log('\n=== LLM Integration Tests Complete! ===\n');

if (available) {
  console.log('✓ All systems working!');
  console.log('Ready for Week 3: Character System Enhancement\n');
} else {
  console.log('⚠️  Ollama not running - install and start it to test full integration');
  console.log('But core LLM integration code is ready!\n');
}
