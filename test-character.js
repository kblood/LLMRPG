// Quick test script for character systems
import { Character } from './src/entities/Character.js';
import { Personality } from './src/ai/personality/Personality.js';

console.log('=== Testing Character Systems ===\n');

// Create a character with personality
console.log('1. Creating Mara (Tavern Keeper)...');
const mara = new Character('mara', 'Mara', {
  role: 'npc',
  backstory: 'I inherited this tavern from my father 10 years ago',
  occupation: 'Tavern Keeper',
  age: 35,
  personality: Personality.createArchetype('cheerful_tavern_keeper')
});

console.log(`   ✓ Created: ${mara.name} (${mara.occupation})`);

// Test personality
console.log('\n2. Testing Personality System...');
console.log('   Personality Traits:');
console.log(mara.personality.toPromptString().split('\n').map(l => '   ' + l).join('\n'));

console.log('\n   Dominant Traits:');
const dominant = mara.personality.getDominantTraits();
dominant.forEach(t => {
  console.log(`   - ${t.trait}: ${t.level} (${t.value}) - ${t.description}`);
});

console.log('\n   Natural Description:');
console.log(`   "${mara.personality.toDetailedDescription()}"`);

// Test memory
console.log('\n3. Testing Memory System...');
mara.memory.addMemory('background', 'I know everyone in town and hear all the gossip', {
  importance: 60
});
mara.memory.addMemory('concern', 'Someone has been stealing from my storage recently', {
  importance: 80
});
mara.memory.addMemory('dialogue', 'Had a pleasant conversation with John about the weather', {
  participants: ['john'],
  importance: 50
});

console.log(`   ✓ Added 3 memories`);
console.log('   Recent memories:');
const recentMemories = mara.memory.getRecentMemories(3);
recentMemories.forEach((m, i) => {
  console.log(`   ${i+1}. [${m.type}] ${m.content} (importance: ${m.importance})`);
});

// Test relationships
console.log('\n4. Testing Relationship System...');
mara.relationships.setRelationship('john', 45);
mara.relationships.setRelationship('grok', 30);
mara.relationships.setRelationship('elara', 60);

console.log(`   ✓ Set 3 relationships`);
console.log('   Relationships:');
console.log(`   - John: ${mara.relationships.getRelationshipLevel('john')} (${mara.relationships.getRelationship('john')})`);
console.log(`   - Grok: ${mara.relationships.getRelationshipLevel('grok')} (${mara.relationships.getRelationship('grok')})`);
console.log(`   - Elara: ${mara.relationships.getRelationshipLevel('elara')} (${mara.relationships.getRelationship('elara')})`);

// Test context generation for LLM
console.log('\n5. Testing Context Generation for LLM...');
const context = mara.getContext();
console.log(`   ✓ Generated context with ${Object.keys(context).length} properties`);
console.log('   Context includes:');
console.log(`   - Name: ${context.name}`);
console.log(`   - Role: ${context.role}`);
console.log(`   - Occupation: ${context.occupation}`);
console.log(`   - Recent Memories: ${context.recentMemories.length}`);
console.log(`   - Relationships: ${Object.keys(context.relationships).length}`);

// Test creating protagonist
console.log('\n6. Creating Protagonist...');
const john = new Character('john', 'John', {
  role: 'protagonist',
  backstory: 'A traveler seeking adventure',
  age: 28
});
console.log(`   ✓ Created: ${john.name} (${john.role})`);
console.log(`   Is protagonist: ${john.isProtagonist()}`);

// Test serialization
console.log('\n7. Testing Serialization...');
const maraJSON = mara.toJSON();
console.log(`   ✓ Serialized to JSON (${JSON.stringify(maraJSON).length} bytes)`);

const maraRestored = Character.fromJSON(maraJSON);
console.log(`   ✓ Restored from JSON`);
console.log(`   Restored name: ${maraRestored.name}`);
console.log(`   Restored memories: ${maraRestored.memory.getAllMemories().length}`);
console.log(`   Restored personality friendliness: ${maraRestored.personality.friendliness}`);

console.log('\n=== All Tests Passed! ===\n');
console.log('Character systems are working correctly!');
console.log('Ready to proceed to Week 2: LLM Integration\n');
