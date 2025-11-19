import readline from 'readline';
import chalk from 'chalk';
import { createAllNPCs, NPC_DATA } from './src/data/npc-roster.js';
import { Character } from './src/entities/Character.js';
import { Personality } from './src/ai/personality/Personality.js';
import { DialogueSystem } from './src/systems/dialogue/DialogueSystem.js';
import { QuestManager } from './src/systems/quest/QuestManager.js';
import { OllamaService } from './src/services/OllamaService.js';

// Setup readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (question) => new Promise((resolve) => rl.question(question, resolve));

// Game state
let player;
let npcs;
let dialogueSystem;
let questManager;
let currentConversation = null;
let currentNPC = null;

console.clear();
console.log(chalk.bold.cyan('\n╔═══════════════════════════════════════════════════════════╗'));
console.log(chalk.bold.cyan('║          OLLAMARPPG - ADVANCED DIALOGUE DEMO          ║'));
console.log(chalk.bold.cyan('║      Talk to NPCs, Build Relationships, Get Quests   ║'));
console.log(chalk.bold.cyan('╚═══════════════════════════════════════════════════════════╝\n'));

// Check Ollama
const ollamaService = OllamaService.getInstance();
const available = await ollamaService.isAvailable();

if (!available) {
  console.log(chalk.red('✗ Ollama not available'));
  console.log(chalk.yellow('Please start Ollama first: ollama serve'));
  process.exit(1);
}

console.log(chalk.green('✓ Ollama connected\n'));

// Initialize game
console.log(chalk.gray('Initializing game world...\n'));

player = new Character('player', {
  name: 'Adventurer',
  role: 'Wanderer',
  personality: new Personality({
    friendliness: 65,
    intelligence: 70,
    caution: 50
  })
});

npcs = createAllNPCs();
dialogueSystem = new DialogueSystem();
questManager = new QuestManager();

console.log(chalk.green(`✓ Created ${Object.keys(npcs).length} NPCs`));
console.log(chalk.gray('Type "help" for commands\n'));

// Main game loop
let running = true;

while (running) {
  if (currentConversation) {
    // In conversation mode
    const input = await ask(chalk.cyan('You: '));
    
    if (!input.trim()) continue;
    
    const command = input.trim().toLowerCase();
    
    if (command === 'exit' || command === 'bye' || command === 'goodbye') {
      console.log(chalk.gray(`\nEnding conversation with ${currentNPC.name}...\n`));
      await dialogueSystem.endConversation(currentConversation);
      currentConversation = null;
      currentNPC = null;
      continue;
    }
    
    // Player speaks
    await dialogueSystem.addTurn(currentConversation, player.id, input);
    
    // NPC responds
    await dialogueSystem.addTurn(currentConversation, currentNPC.id, input);
    
    const conversation = dialogueSystem.activeConversations.get(currentConversation);
    const response = conversation.history[conversation.history.length - 1].output;
    
    console.log(chalk.bold.white(`\n${currentNPC.name}:`), response);
    
    // Check for quest generation
    const activeQuests = questManager.getActiveQuests();
    const newQuestCount = activeQuests.length;
    
    // Show relationship
    const rel = player.relationships.getRelationship(currentNPC.id);
    const relColor = rel >= 60 ? chalk.green : rel >= 30 ? chalk.yellow : rel >= 0 ? chalk.gray : chalk.red;
    console.log(chalk.gray(`[Relationship: ${relColor(rel)}]`));
    console.log();
    
  } else {
    // In main menu mode
    const input = await ask(chalk.bold('> '));
    
    if (!input.trim()) continue;
    
    const parts = input.trim().split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    
    switch (command) {
      case 'help':
        showHelp();
        break;
        
      case 'npcs':
      case 'list':
        listNPCs();
        break;
        
      case 'talk':
        if (args.length === 0) {
          console.log(chalk.yellow('Usage: talk <npc name>'));
          console.log(chalk.gray('Example: talk mara\n'));
        } else {
          await startConversation(args.join(' ').toLowerCase());
        }
        break;
        
      case 'info':
        if (args.length === 0) {
          console.log(chalk.yellow('Usage: info <npc name>'));
          console.log(chalk.gray('Example: info finn\n'));
        } else {
          showNPCInfo(args.join(' ').toLowerCase());
        }
        break;
        
      case 'quests':
        showQuests();
        break;
        
      case 'relationships':
      case 'rels':
        showRelationships();
        break;
        
      case 'stats':
        showStats();
        break;
        
      case 'clear':
        console.clear();
        break;
        
      case 'exit':
      case 'quit':
        running = false;
        break;
        
      default:
        console.log(chalk.red(`Unknown command: ${command}`));
        console.log(chalk.gray('Type "help" for available commands\n'));
    }
  }
}

console.log(chalk.cyan('\nThanks for playing!\n'));
rl.close();

// Helper functions

function showHelp() {
  console.log(chalk.bold.cyan('\n═══ COMMANDS ═══\n'));
  console.log(chalk.bold('talk <name>') + chalk.gray(' - Start conversation with an NPC'));
  console.log(chalk.bold('npcs') + chalk.gray(' - List all NPCs and their roles'));
  console.log(chalk.bold('info <name>') + chalk.gray(' - View detailed info about an NPC'));
  console.log(chalk.bold('quests') + chalk.gray(' - View active and completed quests'));
  console.log(chalk.bold('relationships') + chalk.gray(' - View relationships with NPCs'));
  console.log(chalk.bold('stats') + chalk.gray(' - View session statistics'));
  console.log(chalk.bold('clear') + chalk.gray(' - Clear the screen'));
  console.log(chalk.bold('exit') + chalk.gray(' - Exit the game'));
  console.log();
  console.log(chalk.gray('During conversation:'));
  console.log(chalk.gray('  • Type normally to talk'));
  console.log(chalk.gray('  • Type "exit" or "bye" to end conversation'));
  console.log();
}

function listNPCs() {
  console.log(chalk.bold.cyan('\n═══ NPCs IN TOWN ═══\n'));
  
  const npcList = Object.values(npcs).sort((a, b) => a.name.localeCompare(b.name));
  
  for (const npc of npcList) {
    const data = NPC_DATA[npc.id];
    const rel = player.relationships.getRelationship(npc.id) || 0;
    const relColor = rel >= 60 ? chalk.green : rel >= 30 ? chalk.yellow : rel >= 0 ? chalk.gray : chalk.red;
    
    console.log(chalk.bold.yellow(npc.name.padEnd(20)) + chalk.gray(npc.role.padEnd(25)) + relColor(`[${rel}]`));
  }
  
  console.log();
  console.log(chalk.gray('Use "talk <name>" to start a conversation'));
  console.log(chalk.gray('Use "info <name>" for more details\n'));
}

function showNPCInfo(searchName) {
  const npc = Object.values(npcs).find(n => 
    n.name.toLowerCase() === searchName || n.id === searchName
  );
  
  if (!npc) {
    console.log(chalk.red(`NPC "${searchName}" not found\n`));
    return;
  }
  
  const data = NPC_DATA[npc.id];
  const rel = player.relationships.getRelationship(npc.id) || 0;
  const relColor = rel >= 60 ? chalk.green : rel >= 30 ? chalk.yellow : rel >= 0 ? chalk.gray : chalk.red;
  
  console.log(chalk.bold.cyan(`\n═══ ${npc.name.toUpperCase()} ═══\n`));
  console.log(chalk.bold('Role: ') + chalk.gray(npc.role));
  console.log(chalk.bold('Relationship: ') + relColor(rel.toString()));
  console.log();
  console.log(chalk.bold('Background:'));
  console.log(chalk.gray(data.background));
  console.log();
  
  console.log(chalk.bold('Personality:'));
  const p = data.personality;
  console.log(chalk.gray(`  Friendliness: ${p.friendliness}/100`));
  console.log(chalk.gray(`  Intelligence: ${p.intelligence}/100`));
  console.log(chalk.gray(`  Honor: ${p.honor}/100`));
  console.log(chalk.gray(`  Caution: ${p.caution}/100`));
  console.log(chalk.gray(`  Greed: ${p.greed}/100`));
  console.log(chalk.gray(`  Aggression: ${p.aggression}/100`));
  console.log();
  
  const concern = data.memories.find(m => m.type === 'concern');
  if (concern) {
    console.log(chalk.bold('Current Concern:'));
    console.log(chalk.yellow(`  ${concern.content}`));
    console.log();
  }
  
  if (data.relationships && Object.keys(data.relationships).length > 0) {
    console.log(chalk.bold('Known Relationships:'));
    Object.entries(data.relationships).forEach(([targetId, value]) => {
      const target = npcs[targetId];
      if (target) {
        const color = value >= 60 ? chalk.green : value >= 40 ? chalk.yellow : chalk.red;
        console.log(chalk.gray(`  ${target.name}: `) + color(value.toString()));
      }
    });
    console.log();
  }
}

async function startConversation(searchName) {
  const npc = Object.values(npcs).find(n => 
    n.name.toLowerCase() === searchName || n.id === searchName
  );
  
  if (!npc) {
    console.log(chalk.red(`NPC "${searchName}" not found\n`));
    return;
  }
  
  console.log(chalk.cyan(`\n[Starting conversation with ${npc.name}...]`));
  console.log(chalk.gray('Type "exit" or "bye" to end the conversation\n'));
  
  currentConversation = await dialogueSystem.startConversation(npc, player, {
    situation: 'The adventurer approaches'
  });
  currentNPC = npc;
  
  const conversation = dialogueSystem.activeConversations.get(currentConversation);
  const greeting = conversation.history[0]?.output;
  
  if (greeting) {
    console.log(chalk.bold.white(`${npc.name}:`), greeting);
    console.log();
  }
}

function showQuests() {
  const activeQuests = questManager.getActiveQuests();
  const completedQuests = questManager.getCompletedQuests();
  
  console.log(chalk.bold.cyan('\n═══ QUEST LOG ═══\n'));
  
  if (activeQuests.length > 0) {
    console.log(chalk.bold.yellow('Active Quests:\n'));
    activeQuests.forEach(quest => {
      console.log(chalk.bold(`• ${quest.title}`) + chalk.gray(` (from ${npcs[quest.giverId]?.name || quest.giverId})`));
      console.log(chalk.gray(`  ${quest.description}`));
      
      if (quest.objectives && quest.objectives.length > 0) {
        console.log(chalk.gray('  Objectives:'));
        quest.objectives.forEach(obj => {
          const status = obj.completed ? chalk.green('✓') : chalk.gray('○');
          console.log(`    ${status} ${obj.description}`);
        });
      }
      console.log();
    });
  } else {
    console.log(chalk.gray('No active quests'));
    console.log(chalk.gray('Talk to NPCs to discover quests\n'));
  }
  
  if (completedQuests.length > 0) {
    console.log(chalk.bold.green('Completed Quests:\n'));
    completedQuests.forEach(quest => {
      console.log(chalk.green(`✓ ${quest.title}`));
    });
    console.log();
  }
}

function showRelationships() {
  console.log(chalk.bold.cyan('\n═══ RELATIONSHIPS ═══\n'));
  
  const relationships = [];
  Object.values(npcs).forEach(npc => {
    const rel = player.relationships.getRelationship(npc.id) || 0;
    if (rel !== 0) {
      relationships.push({ npc, rel });
    }
  });
  
  if (relationships.length === 0) {
    console.log(chalk.gray('No relationships yet'));
    console.log(chalk.gray('Talk to NPCs to build relationships\n'));
    return;
  }
  
  relationships.sort((a, b) => b.rel - a.rel);
  
  relationships.forEach(({ npc, rel }) => {
    const color = rel >= 60 ? chalk.green : rel >= 30 ? chalk.yellow : rel >= 0 ? chalk.gray : chalk.red;
    const status = rel >= 60 ? 'Friend' : rel >= 30 ? 'Acquaintance' : rel >= 0 ? 'Neutral' : 'Unfriendly';
    
    console.log(color(`${npc.name.padEnd(20)} ${rel.toString().padStart(4)} - ${status}`));
  });
  
  console.log();
}

function showStats() {
  const stats = ollamaService.getStats();
  const conversationCount = dialogueSystem.conversationHistory.length;
  const activeQuests = questManager.getActiveQuests().length;
  const completedQuests = questManager.getCompletedQuests().length;
  
  console.log(chalk.bold.cyan('\n═══ SESSION STATISTICS ═══\n'));
  console.log(chalk.bold('NPCs in world: ') + chalk.gray(Object.keys(npcs).length));
  console.log(chalk.bold('Conversations: ') + chalk.gray(conversationCount));
  console.log(chalk.bold('Active quests: ') + chalk.gray(activeQuests));
  console.log(chalk.bold('Completed quests: ') + chalk.gray(completedQuests));
  console.log();
  console.log(chalk.bold('LLM Statistics:'));
  console.log(chalk.gray(`  Total calls: ${stats.totalCalls}`));
  console.log(chalk.gray(`  Tokens: ${stats.totalTokens}`));
  console.log(chalk.gray(`  Cache hits: ${stats.cacheHits}`));
  console.log(chalk.gray(`  Errors: ${stats.errors}`));
  console.log();
}
