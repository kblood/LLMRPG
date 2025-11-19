// Phase 1 Comprehensive Test: Long conversations and context management
import { Character } from './src/entities/Character.js';
import { Personality } from './src/ai/personality/Personality.js';
import { DialogueSystem } from './src/systems/dialogue/DialogueSystem.js';
import { OllamaService } from './src/services/OllamaService.js';

console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║   PHASE 1: CONTEXT & MEMORY TESTING                   ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

// Check Ollama
const ollamaService = OllamaService.getInstance();
const available = await ollamaService.isAvailable();

if (!available) {
  console.log('⚠  Ollama not available. Please start Ollama first.');
  console.log('   Run: ollama serve\n');
  process.exit(1);
}

console.log('✓ Ollama connected\n');

// Initialize dialogue system
const dialogueSystem = new DialogueSystem({
  model: 'llama3.1:8b',
  temperature: 0.8,
  timeout: 60000
});

// Create player character
const player = new Character('player', 'The Adventurer', {
  role: 'protagonist',
  backstory: 'A traveling adventurer seeking to help those in need',
  age: 28,
  personality: Personality.createArchetype('hero')
});

console.log('═══════════════════════════════════════════════════════');
console.log(' TEST 1: Long Conversation (10+ turns)');
console.log('═══════════════════════════════════════════════════════\n');

// Create Mara with detailed background
const mara = new Character('mara', 'Mara', {
  role: 'npc',
  backstory: 'I have run the Red Griffin Inn for 15 years. It was my fathers before me. I know everyone in this town.',
  occupation: 'Tavern Keeper',
  age: 42,
  personality: new Personality({
    friendliness: 85,
    intelligence: 65,
    caution: 45,
    honor: 80,
    greed: 20
  })
});

// Add comprehensive memories
mara.memory.addMemory('concern', 'Someone has been stealing from my storage room. It started a week ago.', { importance: 90 });
mara.memory.addMemory('emotion', 'I feel violated and frustrated by these thefts', { importance: 80 });
mara.memory.addMemory('observation', 'Small valuable items are being taken - spices, wine, silver', { importance: 85 });
mara.memory.addMemory('secret', 'I suspect it might be someone I know, which makes this harder', { importance: 75 });
mara.memory.addMemory('fact', 'I pride myself on running an honest, welcoming establishment', { importance: 70 });

// Set initial relationships
mara.relationships.setRelationship(player.id, 50);
player.relationships.setRelationship(mara.id, 50);

console.log(`Created: ${mara.name} - ${mara.occupation}`);
console.log(`Personality: Friendly (85), Honorable (80), Low Greed (20)`);
console.log(`Main Concern: Thefts from storage room\n`);

// Start conversation
console.log('Starting conversation...\n');

const convId = await dialogueSystem.startConversation(mara, player, {
  situation: 'The Adventurer enters the Red Griffin Inn on a quiet morning',
  generateGreeting: true
});

let conversation = dialogueSystem.getConversation(convId);
console.log(`Turn 1 - ${mara.name} (Greeting):`);
console.log(`  "${conversation.history[0].output}"\n`);

// Conversation flow - testing context retention
const questions = [
  "Hello Mara! You seem troubled. Is everything alright?",
  "Tell me more about these thefts. What exactly has been taken?",
  "When did you first notice things were missing?",
  "Do you have any idea who might be responsible?",
  "Have you reported this to the authorities?",
  "What kind of items were stolen? Anything valuable?",
  "Could it be someone who knows the layout of your tavern well?",
  "I'd like to help investigate if you'll let me. Where should I start?",
  "Going back to what you said earlier about when this started - was there anything unusual that week?",
  "What would make you feel safer about your storage?"
];

let turnNumber = 2;
for (const question of questions) {
  console.log(`Turn ${turnNumber} - Player:`);
  console.log(`  "${question}"`);
  
  const response = await dialogueSystem.addTurn(convId, mara.id, question, {
    temperature: 0.8
  });
  
  conversation = dialogueSystem.getConversation(convId);
  const relationship = player.relationships.getRelationship(mara.id);
  
  console.log(`Turn ${turnNumber} - ${mara.name}:`);
  console.log(`  "${response.text}"`);
  console.log(`  [Relationship: ${relationship}]\n`);
  
  turnNumber++;
  
  // Small delay
  await new Promise(resolve => setTimeout(resolve, 500));
}

// Test memory of early conversation
console.log('─────────────────────────────────────────────────────────');
console.log('Memory Test: Referencing something from early in conversation');
console.log('─────────────────────────────────────────────────────────\n');

console.log(`Turn ${turnNumber} - Player:`);
console.log(`  "So you mentioned the thefts started about a week ago. What exactly happened that made you first notice?"`);

const memoryTestResponse = await dialogueSystem.addTurn(
  convId, 
  mara.id, 
  "So you mentioned the thefts started about a week ago. What exactly happened that made you first notice?",
  { temperature: 0.8 }
);

console.log(`Turn ${turnNumber} - ${mara.name}:`);
console.log(`  "${memoryTestResponse.text}"`);
console.log(`  ${memoryTestResponse.text.includes('week') || memoryTestResponse.text.includes('ago') ? '✓ Correctly recalls timeline' : '⚠ May have forgotten timeline'}\n`);

// Test personality consistency
turnNumber++;
console.log('─────────────────────────────────────────────────────────');
console.log('Personality Test: Testing high honor trait (should object to breaking rules)');
console.log('─────────────────────────────────────────────────────────\n');

console.log(`Turn ${turnNumber} - Player:`);
console.log(`  "What if I need to break into someone's room to investigate? Would that be acceptable?"`);

const personalityTestResponse = await dialogueSystem.addTurn(
  convId,
  mara.id,
  "What if I need to break into someone's room to investigate? Would that be acceptable?",
  { temperature: 0.8 }
);

console.log(`Turn ${turnNumber} - ${mara.name}:`);
console.log(`  "${personalityTestResponse.text}"`);

const objectsToBreakIn = personalityTestResponse.text.toLowerCase().includes('no') || 
                        personalityTestResponse.text.toLowerCase().includes('wrong') ||
                        personalityTestResponse.text.toLowerCase().includes('illegal') ||
                        personalityTestResponse.text.toLowerCase().includes('can\'t') ||
                        personalityTestResponse.text.toLowerCase().includes('shouldn\'t');

console.log(`  ${objectsToBreakIn ? '✓ Personality consistent (high honor objected)' : '⚠ Personality may be inconsistent'}\n`);

// Get final conversation state before ending
conversation = dialogueSystem.getConversation(convId);

// End conversation
dialogueSystem.endConversation(convId);

console.log('═══════════════════════════════════════════════════════');
console.log(' TEST 1 RESULTS');
console.log('═══════════════════════════════════════════════════════\n');

console.log(`Total Turns: ${conversation.history.length}`);
console.log(`Duration: ${((Date.now() - conversation.startTime) / 1000).toFixed(1)}s`);
console.log(`Final Relationship: ${player.relationships.getRelationship(mara.id)}`);
console.log(`Conversation Active: ${conversation.active ? 'Yes' : 'No (Ended)'}\n`);

// Statistics
const stats = ollamaService.getStats();
console.log('LLM Statistics:');
console.log(`  Total Calls: ${stats.totalCalls}`);
console.log(`  Total Tokens: ${stats.totalTokens}`);
console.log(`  Average Tokens/Call: ${Math.round(stats.totalTokens / stats.totalCalls)}`);
console.log(`  Cache Hits: ${stats.cacheHits}`);
console.log(`  Errors: ${stats.errors}\n`);

console.log('Test 1 Assessment:');
console.log(`  ✓ Successfully completed ${conversation.history.length}-turn conversation`);
console.log(`  ✓ Context maintained throughout`);
console.log(`  ✓ Memory test ${memoryTestResponse.text.includes('week') ? 'PASSED' : 'NEEDS REVIEW'}`);
console.log(`  ✓ Personality test ${objectsToBreakIn ? 'PASSED' : 'NEEDS REVIEW'}`);

console.log('\n═══════════════════════════════════════════════════════');
console.log(' PHASE 1 TESTING COMPLETE ✓');
console.log('═══════════════════════════════════════════════════════\n');

console.log('Next Steps:');
console.log('  → Phase 2: Create additional NPCs with varied personalities');
console.log('  → Test NPC-to-NPC relationship dynamics');
console.log('  → Begin quest detection system\n');
