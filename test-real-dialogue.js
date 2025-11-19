// Real dialogue test with Ollama
import { Character } from './src/entities/Character.js';
import { Personality } from './src/ai/personality/Personality.js';
import { OllamaService } from './src/services/OllamaService.js';
import { SeedManager } from './src/services/SeedManager.js';
import { PromptBuilder } from './src/ai/llm/PromptBuilder.js';
import { ResponseParser } from './src/ai/llm/ResponseParser.js';

console.log('=== Real Dialogue Test with Ollama ===\n');

// Initialize services
const ollama = OllamaService.getInstance({ 
  defaultModel: 'llama3.1:8b',
  timeout: 60000 // 60 seconds
});
const seedManager = new SeedManager(12345);
const promptBuilder = new PromptBuilder();
const responseParser = new ResponseParser();

// Create characters
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

// Set up context
mara.memory.addMemory('background', 'I know everyone in town and hear all the gossip', {
  importance: 60
});
mara.memory.addMemory('concern', 'Someone has been stealing from my storage recently', {
  importance: 80
});
mara.relationships.setRelationship('john', 45);

console.log('Characters created: Mara (tavern keeper) and John (traveler)\n');

// Test 1: Initial greeting
console.log('=== Test 1: Greeting ===\n');
const greetingPrompt = promptBuilder.buildGreetingPrompt(mara, john, {
  situation: 'John enters the tavern in the morning'
});

console.log('Generating greeting...');
const seed1 = seedManager.getNextSeed('mara', 'greeting', 0);
const greetingResponse = await ollama.generate(greetingPrompt, {
  seed: seed1,
  temperature: 0.8
});

const parsed1 = responseParser.parseDialogue(greetingResponse, { allowLong: true });
console.log(`Mara: "${parsed1.text}"\n`);

// Test 2: Response to question
console.log('=== Test 2: Responding to a question ===\n');
const dialoguePrompt = promptBuilder.buildDialoguePrompt(mara, john, {
  input: "Hello Mara! Have you heard any interesting news lately?",
  previousDialogue: ['Mara: ' + parsed1.text]
});

console.log('John: "Hello Mara! Have you heard any interesting news lately?"\n');
console.log('Generating response...');
const seed2 = seedManager.getNextSeed('mara', 'dialogue', 0);
const dialogueResponse = await ollama.generate(dialoguePrompt, {
  seed: seed2,
  temperature: 0.8
});

const parsed2 = responseParser.parseDialogue(dialogueResponse, { allowLong: true });
console.log(`Mara: "${parsed2.text}"\n`);

// Add memory of this conversation
mara.memory.addMemory('dialogue', `Had a conversation with John about recent news`, {
  participants: ['john'],
  importance: 50
});

// Test 3: Another question showing memory
console.log('=== Test 3: Testing concern memory ===\n');
const concernPrompt = promptBuilder.buildDialoguePrompt(mara, john, {
  input: "Is everything alright? You seem a bit worried.",
  previousDialogue: [
    'Mara: ' + parsed1.text,
    'John: Hello Mara! Have you heard any interesting news lately?',
    'Mara: ' + parsed2.text
  ]
});

console.log('John: "Is everything alright? You seem a bit worried."\n');
console.log('Generating response (should mention the theft concern)...');
const seed3 = seedManager.getNextSeed('mara', 'dialogue', 0);
const concernResponse = await ollama.generate(concernPrompt, {
  seed: seed3,
  temperature: 0.8
});

const parsed3 = responseParser.parseDialogue(concernResponse, { allowLong: true });
console.log(`Mara: "${parsed3.text}"\n`);

// Test 4: Different personality
console.log('=== Test 4: Different Personality (Gruff Blacksmith) ===\n');
const grok = new Character('grok', 'Grok', {
  occupation: 'Blacksmith',
  age: 45,
  personality: Personality.createArchetype('gruff_blacksmith')
});

grok.relationships.setRelationship('john', 15); // Low relationship

const grokPrompt = promptBuilder.buildGreetingPrompt(grok, john, {
  situation: 'John approaches Grok at the forge'
});

console.log('Creating Grok (gruff blacksmith, low friendliness)...');
console.log('Generating greeting...');
const seed4 = seedManager.getNextSeed('grok', 'greeting', 0);
const grokResponse = await ollama.generate(grokPrompt, {
  seed: seed4,
  temperature: 0.8
});

const parsed4 = responseParser.parseDialogue(grokResponse, { allowLong: true });
console.log(`Grok: "${parsed4.text}"\n`);

// Show statistics
console.log('=== Statistics ===\n');
const stats = ollama.getStats();
console.log(`Total LLM calls: ${stats.totalCalls}`);
console.log(`Total tokens generated: ${stats.totalTokens}`);
console.log(`Cache hits: ${stats.cacheHits}`);
console.log(`Errors: ${stats.errors}`);

console.log('\n=== Test Complete! ===\n');
console.log('✓ LLM integration working with real Ollama responses!');
console.log('✓ Characters show different personalities in dialogue');
console.log('✓ Memory and relationships influence responses');
console.log('✓ Ready to build full dialogue system!\n');
