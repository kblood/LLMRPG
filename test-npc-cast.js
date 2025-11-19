// Test the expanded NPC cast - Phase 2
import { createAllNPCs, applyNPCRelationships, getNPCSummary } from './src/data/npcs-expanded.js';
import { Character } from './src/entities/Character.js';
import { Personality } from './src/ai/personality/Personality.js';
import { DialogueSystem } from './src/systems/dialogue/DialogueSystem.js';
import { OllamaService } from './src/services/OllamaService.js';

console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║   PHASE 2: EXPANDED NPC CAST TESTING                  ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

// Check Ollama
const ollamaService = OllamaService.getInstance();
const available = await ollamaService.isAvailable();

if (!available) {
  console.log('⚠  Ollama not available. Running in showcase mode (no dialogue generation).\n');
} else {
  console.log('✓ Ollama connected\n');
}

// Create all NPCs
console.log('Creating NPC cast...\n');
const npcs = createAllNPCs();
applyNPCRelationships(npcs);

console.log(`✓ Created ${npcs.size} NPCs\n`);

console.log('═══════════════════════════════════════════════════════');
console.log(' NPC ROSTER');
console.log('═══════════════════════════════════════════════════════\n');

const summary = getNPCSummary();
for (const npc of summary) {
  const character = npcs.get(npc.id);
  const p = character.personality;
  
  console.log(`${npc.name.toUpperCase()} - ${npc.role}`);
  console.log(`  Archetype: ${npc.archetype}`);
  console.log(`  Age: ${character.age} | Occupation: ${character.occupation}`);
  console.log(`  Personality:`);
  console.log(`    Friendliness: ${p.friendliness} | Intelligence: ${p.intelligence}`);
  console.log(`    Caution: ${p.caution} | Honor: ${p.honor}`);
  console.log(`    Greed: ${p.greed} | Aggression: ${p.aggression}`);
  
  const topMemories = character.memory.getRecentMemories(2);
  if (topMemories.length > 0) {
    console.log(`  Key Concerns:`);
    for (const mem of topMemories) {
      console.log(`    • [${mem.type}] ${mem.content.substring(0, 70)}${mem.content.length > 70 ? '...' : ''}`);
    }
  }
  console.log();
}

console.log('═══════════════════════════════════════════════════════');
console.log(' RELATIONSHIP WEB');
console.log('═══════════════════════════════════════════════════════\n');

console.log('Key Relationships:\n');

// Helper to format relationship
const formatRel = (value) => {
  if (value >= 70) return `💚 ${value} (Strong)`;
  if (value >= 40) return `💛 ${value} (Friendly)`;
  if (value >= 0) return `⚪ ${value} (Neutral)`;
  if (value >= -30) return `🧡 ${value} (Tense)`;
  return `❤️ ${value} (Hostile)`;
};

// Show interesting relationship dynamics
console.log('🤝 ALLIANCES:');
console.log(`  Grok ↔ Thom: ${formatRel(npcs.get('grok').relationships.getRelationship('thom'))}`);
console.log(`    (Old adventuring companions, deep trust)\n`);
console.log(`  Cordelia ↔ Marcus: ${formatRel(npcs.get('cordelia').relationships.getRelationship('marcus'))}`);
console.log(`    (She confides in the priest)\n`);
console.log(`  Mara ↔ Aldric: ${formatRel(npcs.get('mara').relationships.getRelationship('aldric'))}`);
console.log(`    (Both honest, trust each other)\n`);

console.log('⚔️ CONFLICTS:');
console.log(`  Elara ↔ Roderick: ${formatRel(npcs.get('elara').relationships.getRelationship('roderick'))}`);
console.log(`    (Business rivals, he plays dirty)\n`);
console.log(`  Roderick → Mara: ${formatRel(npcs.get('roderick').relationships.getRelationship('mara'))}`);
console.log(`    (He wants to acquire her tavern)\n`);
console.log(`  Finn → Roderick: ${formatRel(npcs.get('finn').relationships.getRelationship('roderick'))}`);
console.log(`    (The urchin fears the cruel merchant)\n`);

console.log('🎭 COMPLEX DYNAMICS:');
console.log(`  Roderick → Cordelia: ${formatRel(npcs.get('roderick').relationships.getRelationship('cordelia'))}`);
console.log(`    (Controls her through debt leverage)\n`);
console.log(`  Aldric → Roderick: ${formatRel(npcs.get('aldric').relationships.getRelationship('roderick'))}`);
console.log(`    (Guard knows of corruption but lacks evidence)\n`);

// If Ollama is available, do quick dialogue tests
if (available) {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log(' PERSONALITY TESTS (Quick Dialogues)');
  console.log('═══════════════════════════════════════════════════════\n');

  const dialogueSystem = new DialogueSystem({
    model: 'llama3.1:8b',
    temperature: 0.8,
    timeout: 60000
  });

  // Create player
  const player = new Character('player', 'Adventurer', {
    role: 'protagonist',
    backstory: 'A traveling adventurer',
    age: 28,
    personality: Personality.createArchetype('hero')
  });

  // Test 3 contrasting personalities
  const testNPCs = [
    { id: 'finn', question: 'Tell me what you know about the tavern thefts.', trait: 'Cautious & Greedy' },
    { id: 'roderick', question: 'What is your business in this town?', trait: 'High Greed, Low Honor' },
    { id: 'marcus', question: 'Can you offer me any guidance?', trait: 'High Honor, High Friendliness' }
  ];

  for (const test of testNPCs) {
    const npc = npcs.get(test.id);
    console.log(`Testing ${npc.name.toUpperCase()} (${test.trait}):\n`);
    console.log(`Player: "${test.question}"`);

    try {
      const convId = await dialogueSystem.startConversation(npc, player, {
        situation: `The adventurer approaches ${npc.name}`,
        generateGreeting: false
      });

      const response = await dialogueSystem.addTurn(convId, npc.id, test.question, {
        temperature: 0.8
      });

      console.log(`${npc.name}: "${response.text}"\n`);

      dialogueSystem.endConversation(convId);

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(`  Error testing ${npc.name}: ${error.message}\n`);
    }
  }
}

console.log('═══════════════════════════════════════════════════════');
console.log(' POTENTIAL QUEST LINES');
console.log('═══════════════════════════════════════════════════════\n');

console.log('Based on NPC concerns and secrets, here are emergent quest possibilities:\n');

console.log('1. THE TAVERN THIEF');
console.log('   Trigger: Talk to Mara about her concern');
console.log('   Leads: Finn saw someone, Aldric suspects bigger plot');
console.log('   Twist: Roderick is behind it, trying to force Mara to sell');
console.log('   Stakes: Help Mara or side with Roderick for profit\n');

console.log('2. THE DEBT COLLECTOR');
console.log('   Trigger: Overhear Cordelia and Marcus talking');
console.log('   Leads: Roderick holds debt, Cordelia needs help');
console.log('   Options: Find leverage, earn money to pay debt, or confront Roderick');
console.log('   Stakes: Save the noble or let her fall to bankruptcy\n');

console.log('3. SHADOWS FROM THE PAST');
console.log('   Trigger: Talk to drunk Thom, he mentions sealed ruins');
console.log('   Leads: Grok knows the truth, Sienna senses disturbance');
console.log('   Twist: Magical seals are breaking, old evil awakening');
console.log('   Stakes: Investigate ruins before something escapes\n');

console.log('4. THE HERB THIEF');
console.log('   Trigger: Sienna complains about stolen rare herbs');
console.log('   Connection: Same thief as tavern? Or different culprit?');
console.log('   Leads: Finn might know, herbs used for potions');
console.log('   Stakes: Help herbalist or buy stolen herbs cheap\n');

console.log('5. TRADE ROUTE TROUBLE');
console.log('   Trigger: Elara mentions dangerous trade routes');
console.log('   Leads: Roderick may be hiring bandits, Aldric investigates');
console.log('   Twist: Roderick eliminating competition');
console.log('   Stakes: Protect traders or ignore growing danger\n');

console.log('6. THE HONEST GUARD');
console.log('   Trigger: Aldric confides about corruption');
console.log('   Leads: Guard captain is bribed, Roderick pulls strings');
console.log('   Options: Help gather evidence or stay neutral');
console.log('   Stakes: Justice system hangs in balance\n');

console.log('═══════════════════════════════════════════════════════');
console.log(' PHASE 2 COMPLETE ✓');
console.log('═══════════════════════════════════════════════════════\n');

const stats = ollamaService.getStats();
console.log('Session Statistics:');
console.log(`  NPCs Created: ${npcs.size}`);
let totalRelationships = 0;
for (const npc of npcs.values()) {
  const rels = npc.relationships;
  if (rels && typeof rels.getRelationship === 'function') {
    // Count non-zero relationships
    totalRelationships += Object.keys(rels.relationships || {}).length;
  }
}
console.log(`  Relationship Links: ${totalRelationships}`);
console.log(`  Total Memories: ${Array.from(npcs.values()).reduce((sum, npc) => sum + npc.memory.getRecentMemories(100).length, 0)}`);
if (available) {
  console.log(`  LLM Calls: ${stats.totalCalls}`);
  console.log(`  Tokens Generated: ${stats.totalTokens}`);
}

console.log('\nNext Steps:');
console.log('  → Phase 3: Implement quest detection and generation');
console.log('  → Create quest system that emerges from these NPC concerns');
console.log('  → Test multi-NPC interactions\n');
