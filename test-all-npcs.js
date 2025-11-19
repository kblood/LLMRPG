import chalk from 'chalk';
import { createAllNPCs, NPC_DATA } from './src/data/npc-roster.js';
import { Character } from './src/entities/Character.js';
import { Personality } from './src/ai/personality/Personality.js';
import { DialogueSystem } from './src/systems/dialogue/DialogueSystem.js';
import { OllamaService } from './src/services/OllamaService.js';

console.log(chalk.bold.cyan('\n═══════════════════════════════════════════════════════'));
console.log(chalk.bold.cyan('  COMPLETE NPC ROSTER TEST'));
console.log(chalk.bold.cyan('  Testing All NPCs with Different Personalities'));
console.log(chalk.bold.cyan('═══════════════════════════════════════════════════════\n'));

// Check Ollama
const ollamaService = OllamaService.getInstance();
const available = await ollamaService.isAvailable();

if (!available) {
  console.log(chalk.yellow('⚠ Ollama not available. Please start Ollama first.'));
  console.log(chalk.yellow('Run: ollama serve'));
  process.exit(1);
}

console.log(chalk.green('✓ Ollama connected\n'));

// Create player
const player = new Character('player', {
  name: 'Adventurer',
  personality: new Personality({
    friendliness: 65,
    intelligence: 70,
    caution: 50
  })
});

// Create all NPCs
console.log(chalk.bold('Creating all NPCs from roster...\n'));
const npcs = createAllNPCs();
const npcList = Object.values(npcs);

console.log(chalk.green(`✓ Created ${npcList.length} NPCs\n`));

// Display NPC summary
console.log(chalk.bold.cyan('═══════════════════════════════════════════════════════'));
console.log(chalk.bold.cyan('  NPC ROSTER'));
console.log(chalk.bold.cyan('═══════════════════════════════════════════════════════\n'));

for (const npc of npcList) {
  const data = NPC_DATA[npc.id];
  console.log(chalk.bold.yellow(`${npc.name}`) + chalk.gray(` - ${npc.role}`));
  
  // Show personality highlights
  const traits = [];
  const p = data.personality;
  if (p.friendliness >= 70) traits.push(chalk.green('Friendly'));
  else if (p.friendliness <= 40) traits.push(chalk.red('Unfriendly'));
  
  if (p.intelligence >= 70) traits.push(chalk.blue('Intelligent'));
  if (p.honor >= 70) traits.push(chalk.cyan('Honorable'));
  else if (p.honor <= 40) traits.push(chalk.magenta('Questionable'));
  
  if (p.greed >= 70) traits.push(chalk.yellow('Greedy'));
  if (p.caution >= 70) traits.push(chalk.gray('Cautious'));
  if (p.aggression >= 60) traits.push(chalk.red('Aggressive'));
  
  console.log('  Traits: ' + traits.join(', '));
  
  // Show main concern
  const mainConcern = data.memories.find(m => m.type === 'concern');
  if (mainConcern) {
    console.log(chalk.gray(`  Concern: ${mainConcern.content}`));
  }
  
  // Show relationships
  const relationCount = Object.keys(data.relationships || {}).length;
  if (relationCount > 0) {
    console.log(chalk.gray(`  Relationships: ${relationCount} connections`));
  }
  
  console.log();
}

// Test dialogue with several NPCs
console.log(chalk.bold.cyan('═══════════════════════════════════════════════════════'));
console.log(chalk.bold.cyan('  DIALOGUE TESTS'));
console.log(chalk.bold.cyan('  Testing Different Personality Responses'));
console.log(chalk.bold.cyan('═══════════════════════════════════════════════════════\n'));

const dialogueSystem = new DialogueSystem();

// Test NPCs representing different personality types
const testNPCs = [
  { npc: npcs.mara, question: "Hello! I've heard you run a great tavern." },
  { npc: npcs.grok, question: "Hello! I've heard you're the best blacksmith around." },
  { npc: npcs.aldric, question: "Good day, officer. How are things in town?" },
  { npc: npcs.finn, question: "Hey there! You look like you know what's going on around here." },
  { npc: npcs.cordelia, question: "Good day, my lady. It's an honor to meet you." },
  { npc: npcs.roderick, question: "Greetings. I hear you're the one to talk to about business." }
];

for (const { npc, question } of testNPCs) {
  console.log(chalk.bold.yellow(`\n--- ${npc.name} (${npc.role}) ---`));
  console.log(chalk.gray(`Personality: F:${NPC_DATA[npc.id].personality.friendliness} H:${NPC_DATA[npc.id].personality.honor} G:${NPC_DATA[npc.id].personality.greed}`));
  
  console.log(chalk.cyan(`\nYou: "${question}"`));
  console.log(chalk.gray('Generating response...\n'));
  
  try {
    const conversationId = await dialogueSystem.startConversation(npc, player, {
      situation: 'The adventurer approaches'
    });
    
    const conversation = dialogueSystem.activeConversations.get(conversationId);
    const greeting = conversation.history[0]?.output || 'No response';
    
    console.log(chalk.bold.white(`${npc.name}:`), greeting);
    
    // Ask the question
    await dialogueSystem.addTurn(conversationId, player.id, question);
    await dialogueSystem.addTurn(conversationId, npc.id, question);
    
    const response = conversation.history[conversation.history.length - 1].output;
    console.log(chalk.bold.white(`${npc.name}:`), response);
    
    await dialogueSystem.endConversation(conversationId);
    
  } catch (error) {
    console.log(chalk.red(`Error: ${error.message}`));
  }
  
  // Small delay
  await new Promise(resolve => setTimeout(resolve, 800));
}

// Test relationship web
console.log(chalk.bold.cyan('\n═══════════════════════════════════════════════════════'));
console.log(chalk.bold.cyan('  RELATIONSHIP WEB'));
console.log(chalk.bold.cyan('═══════════════════════════════════════════════════════\n'));

console.log(chalk.bold('Notable Relationships:\n'));

const relationships = [
  { from: 'mara', to: 'aldric', value: NPC_DATA.mara.relationships.aldric, note: 'Mara respects Aldric' },
  { from: 'grok', to: 'thom', value: NPC_DATA.grok.relationships.thom, note: 'Old adventuring buddies' },
  { from: 'elara', to: 'roderick', value: NPC_DATA.elara.relationships.roderick, note: 'Business rivals' },
  { from: 'cordelia', to: 'marcus', value: NPC_DATA.cordelia.relationships.marcus, note: 'She trusts him' },
  { from: 'finn', to: 'roderick', value: NPC_DATA.finn.relationships.roderick, note: 'Finn fears Roderick' },
  { from: 'aldric', to: 'finn', value: NPC_DATA.aldric.relationships.finn, note: 'Aldric is suspicious' }
];

for (const rel of relationships) {
  const fromName = NPC_DATA[rel.from].name;
  const toName = NPC_DATA[rel.to].name;
  const color = rel.value >= 60 ? chalk.green : rel.value >= 40 ? chalk.yellow : chalk.red;
  console.log(`  ${fromName} → ${toName}: ${color(rel.value.toString())} - ${chalk.gray(rel.note)}`);
}

// Quest potential
console.log(chalk.bold.cyan('\n═══════════════════════════════════════════════════════'));
console.log(chalk.bold.cyan('  QUEST POTENTIAL'));
console.log(chalk.bold.cyan('═══════════════════════════════════════════════════════\n'));

const questGivers = [
  { npc: 'mara', quest: 'The Tavern Thief', concern: 'Storage thefts' },
  { npc: 'aldric', quest: 'Mysterious Travelers', concern: 'Suspicious activity' },
  { npc: 'sienna', quest: 'Stolen Herbs', concern: 'Missing rare herbs' },
  { npc: 'cordelia', quest: 'Political Intrigue', concern: 'Territorial tensions' },
  { npc: 'grok', quest: 'The Ore Problem', concern: 'Declining ore quality' }
];

for (const { npc, quest, concern } of questGivers) {
  const npcData = NPC_DATA[npc];
  console.log(chalk.bold.yellow(npcData.name) + chalk.gray(` - ${npcData.role}`));
  console.log(chalk.cyan(`  Quest: "${quest}"`));
  console.log(chalk.gray(`  Hook: ${concern}`));
  console.log();
}

// Statistics
console.log(chalk.bold.cyan('═══════════════════════════════════════════════════════'));
console.log(chalk.bold.cyan('  SESSION STATISTICS'));
console.log(chalk.bold.cyan('═══════════════════════════════════════════════════════\n'));

const stats = ollamaService.getStats();
console.log(`NPCs Created: ${chalk.bold(npcList.length.toString())}`);
console.log(`Total Relationships: ${chalk.bold(relationships.length.toString())}`);
console.log(`LLM Calls: ${chalk.bold(stats.totalCalls.toString())}`);
console.log(`Tokens Generated: ${chalk.bold(stats.totalTokens.toString())}`);

console.log(chalk.bold.cyan('\n═══════════════════════════════════════════════════════'));
console.log(chalk.bold.green('  ✓ NPC ROSTER TEST COMPLETE'));
console.log(chalk.bold.cyan('═══════════════════════════════════════════════════════\n'));

console.log(chalk.bold('Ready for:'));
console.log(chalk.gray('  • Group conversations'));
console.log(chalk.gray('  • Quest generation from NPC concerns'));
console.log(chalk.gray('  • Emergent storylines through relationships'));
console.log(chalk.gray('  • Dynamic world simulation\n'));
