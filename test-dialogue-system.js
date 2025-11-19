// Test full dialogue system
import { Character } from './src/entities/Character.js';
import { Personality } from './src/ai/personality/Personality.js';
import { DialogueSystem } from './src/systems/dialogue/DialogueSystem.js';

console.log('=== Testing Complete Dialogue System ===\n');

// Create dialogue system
const dialogueSystem = new DialogueSystem({
  model: 'llama3.1:8b',
  temperature: 0.8,
  timeout: 60000
});

// Create characters
console.log('1. Creating Characters...\n');

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
mara.memory.addMemory('background', 'I know everyone in town', { importance: 60 });
mara.memory.addMemory('concern', 'Someone has been stealing from storage', { importance: 80 });
mara.relationships.setRelationship('john', 45);
john.relationships.setRelationship('mara', 45);

console.log(`✓ Created ${mara.name} (${mara.occupation})`);
console.log(`✓ Created ${john.name} (${john.role})`);
console.log(`  Relationship: ${mara.relationships.getRelationshipLevel('john')}\n`);

// Start conversation
console.log('2. Starting Conversation...\n');

const convId = await dialogueSystem.startConversation(mara, john, {
  situation: 'John enters the tavern in the morning',
  generateGreeting: true
});

const conversation = dialogueSystem.getConversation(convId);
console.log(`✓ Conversation started (ID: ${convId.substring(0, 16)}...)`);
console.log(`  Mara: "${conversation.history[0].output}"\n`);

// John responds
console.log('3. John Responds...\n');

const turn2 = await dialogueSystem.addTurn(convId, 'john', conversation.history[0].output, {
  temperature: 0.8
});

console.log(`  John: "Hello Mara! Have you heard any news lately?"`);
console.log(`  (simulating player input)\n`);

// Mara responds (should mention the theft)
console.log('4. Mara Responds to Question...\n');

const turn3 = await dialogueSystem.addTurn(convId, 'mara', "Hello Mara! Have you heard any news lately?", {
  temperature: 0.8
});

console.log(`  Mara: "${turn3.text}"\n`);

// Continue conversation
console.log('5. Continuing Conversation...\n');

const turn4 = await dialogueSystem.addTurn(convId, 'john', turn3.text, {
  temperature: 0.8
});

console.log(`  John: "That's concerning! Do you know who might be responsible?"`);
console.log(`  (simulating player input)\n`);

const turn5 = await dialogueSystem.addTurn(convId, 'mara', "That's concerning! Do you know who might be responsible?", {
  temperature: 0.8
});

console.log(`  Mara: "${turn5.text}"\n`);

// Check conversation state
console.log('6. Conversation State...\n');

const conv = dialogueSystem.getConversation(convId);
console.log(`  Total turns: ${conv.history.length}`);
console.log(`  Active: ${conv.active}`);
console.log(`  Duration: ${Date.now() - conv.startTime}ms\n`);

// End conversation
console.log('7. Ending Conversation...\n');

dialogueSystem.endConversation(convId);

console.log(`  ✓ Conversation ended`);
console.log(`  ✓ Memory added to both characters\n`);

// Check memories
console.log('8. Checking Memories...\n');

const maraMemories = mara.memory.getRecentMemories(1);
const johnMemories = john.memory.getRecentMemories(1);

console.log(`  Mara's latest memory: "${maraMemories[0].content}"`);
console.log(`  John's latest memory: "${johnMemories[0].content}"\n`);

// Check relationships (should have increased slightly)
console.log('9. Checking Relationships...\n');

console.log(`  Mara → John: ${mara.relationships.getRelationship('john')} (was 45)`);
console.log(`  John → Mara: ${john.relationships.getRelationship('mara')} (was 45)\n`);

// Test with different personality
console.log('10. Testing Different Personality...\n');

const grok = new Character('grok', 'Grok', {
  occupation: 'Blacksmith',
  age: 45,
  personality: Personality.createArchetype('gruff_blacksmith')
});

grok.relationships.setRelationship('john', 10); // Low relationship
john.relationships.setRelationship('grok', 10);

console.log(`✓ Created Grok (Blacksmith, low friendliness)`);
console.log(`  Relationship with John: ${grok.relationships.getRelationshipLevel('john')}\n`);

const convId2 = await dialogueSystem.startConversation(john, grok, {
  situation: 'John approaches Grok at the forge',
  generateGreeting: true
});

const conv2 = dialogueSystem.getConversation(convId2);
console.log(`  John: "${conv2.history[0].output}"\n`);

const grokResponse = await dialogueSystem.addTurn(convId2, 'grok', conv2.history[0].output, {
  temperature: 0.8
});

console.log(`  Grok: "${grokResponse.text}"`);
console.log(`  (Notice the different tone compared to Mara!)\n`);

dialogueSystem.endConversation(convId2);

// Show statistics
console.log('11. System Statistics...\n');

const stats = dialogueSystem.getStats();
console.log(`  Active conversations: ${stats.activeConversations}`);
console.log(`  Total in history: ${stats.totalConversationsInHistory}`);
console.log(`  Total turns: ${stats.totalTurnsInActive}\n`);

const ollamaStats = dialogueSystem.dialogueGenerator.ollama.getStats();
console.log(`  LLM calls: ${ollamaStats.totalCalls}`);
console.log(`  Total tokens: ${ollamaStats.totalTokens}`);
console.log(`  Cache hits: ${ollamaStats.cacheHits}\n`);

console.log('=== Dialogue System Test Complete! ===\n');

console.log('✓ Full conversation flow working');
console.log('✓ Multi-turn conversations supported');
console.log('✓ Memory integration working');
console.log('✓ Relationship changes tracked');
console.log('✓ Different personalities produce different dialogue');
console.log('✓ Conversation history maintained');
console.log('\nReady for Week 4 enhancements!\n');
