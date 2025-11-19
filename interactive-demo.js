import readline from 'readline';
import chalk from 'chalk';
import { Character } from './src/entities/Character.js';
import { Personality } from './src/ai/personality/Personality.js';
import { DialogueSystem } from './src/systems/dialogue/DialogueSystem.js';
import { QuestManager } from './src/systems/quest/QuestManager.js';
import { OllamaService } from './src/services/OllamaService.js';
import { EventBus } from './src/services/EventBus.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

class InteractiveDemo {
  constructor() {
    this.dialogueSystem = new DialogueSystem();
    this.questManager = new QuestManager();
    this.eventBus = EventBus.getInstance();
    this.npcs = new Map();
    this.player = null;
    this.currentConversation = null;
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.eventBus.on('quest:created', ({ quest }) => {
      console.log(chalk.yellow('\n🎯 NEW QUEST: ') + chalk.bold(quest.title));
      console.log(chalk.gray('   ' + quest.description));
    });

    this.eventBus.on('quest:objective_completed', ({ questId, objectiveId }) => {
      console.log(chalk.green('\n✓ Quest objective completed!'));
    });

    this.eventBus.on('quest:completed', ({ quest }) => {
      console.log(chalk.green.bold('\n🎉 QUEST COMPLETED: ' + quest.title));
    });
  }

  async initialize() {
    console.clear();
    console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════'));
    console.log(chalk.cyan.bold('  OLLAMARKG - INTERACTIVE DIALOGUE DEMO'));
    console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════\n'));

    // Check Ollama
    const ollamaService = OllamaService.getInstance();
    const available = await ollamaService.isAvailable();
    
    if (!available) {
      console.log(chalk.red('⚠ Ollama not available. Using fallback responses.'));
      console.log(chalk.gray('Start Ollama with: ollama serve\n'));
    } else {
      console.log(chalk.green('✓ Ollama connected\n'));
    }

    // Create player
    this.player = new Character('player', 'Adventurer', {
      role: 'protagonist',
      personality: new Personality({
        friendliness: 60,
        intelligence: 70,
        caution: 50
      })
    });

    // Create NPCs
    this.createNPCs();
    
    console.log(chalk.white('Welcome to the Red Griffin Inn!\n'));
    console.log(chalk.gray('Type the NPC name to talk to them, or type a command:\n'));
    console.log(chalk.gray('  talk [name] - Start conversation'));
    console.log(chalk.gray('  quests      - View active quests'));
    console.log(chalk.gray('  npcs        - List all NPCs'));
    console.log(chalk.gray('  help        - Show commands'));
    console.log(chalk.gray('  quit        - Exit demo\n'));
    
    this.showNPCs();
  }

  createNPCs() {
    // Mara - Friendly tavern keeper
    const mara = new Character('mara', 'Mara', {
      role: 'Tavern Keeper',
      personality: new Personality({
        friendliness: 85,
        intelligence: 65,
        caution: 45,
        honor: 80,
        greed: 20
      }),
      backstory: 'Owns the Red Griffin Inn. Warm and welcoming, but worried about recent thefts from her storage room.'
    });
    mara.memory.addMemory('concern', 'Someone has been stealing from the tavern storage', 8);
    mara.memory.addMemory('fact', 'I run the Red Griffin Inn with pride', 6);
    this.npcs.set('mara', mara);

    // Grok - Gruff blacksmith
    const grok = new Character('grok', 'Grok', {
      role: 'Blacksmith',
      personality: new Personality({
        friendliness: 30,
        intelligence: 70,
        caution: 60,
        honor: 75,
        greed: 50,
        aggression: 55
      }),
      backstory: 'Village blacksmith. Direct and no-nonsense, but skilled at his craft.'
    });
    grok.memory.addMemory('fact', 'I forge the finest blades in the region', 7);
    grok.memory.addMemory('observation', 'Strange people have been around town lately', 5);
    this.npcs.set('grok', grok);

    // Elara - Mysterious merchant
    const elara = new Character('elara', 'Elara', {
      role: 'Traveling Merchant',
      personality: new Personality({
        friendliness: 65,
        intelligence: 80,
        caution: 75,
        honor: 60,
        greed: 65
      }),
      backstory: 'Traveling merchant dealing in rare goods. Knows many secrets but shares them carefully.'
    });
    elara.memory.addMemory('secret', 'I know about the underground market in the city', 8);
    elara.memory.addMemory('observation', 'The tavern keeper seems troubled', 4);
    this.npcs.set('elara', elara);
  }

  showNPCs() {
    console.log(chalk.cyan('\n📍 NPCs in the Red Griffin Inn:\n'));
    
    for (const [id, npc] of this.npcs) {
      const relationship = this.player.relationships.getRelationship(id);
      const relColor = relationship >= 70 ? chalk.green(`❤ ${relationship}`) :
                       relationship >= 40 ? chalk.yellow(`✓ ${relationship}`) :
                       relationship >= 0 ? chalk.gray(`- ${relationship}`) :
                       chalk.red(`✗ ${relationship}`);
      
      console.log(chalk.white(`  ${npc.name}`) + 
                  chalk.gray(` - ${npc.role}`) +
                  ` [${relColor}]`);
      console.log(chalk.gray(`    ${npc.backstory}\n`));
    }
  }

  getRelationshipColor(value) {
    if (value >= 70) return chalk.green(`❤ ${value} Friendly`);
    if (value >= 40) return chalk.yellow(`✓ ${value} Neutral`);
    if (value >= 0) return chalk.gray(`- ${value} Distant`);
    return chalk.red(`✗ ${value} Hostile`);
  }

  async startConversation(npcId) {
    const npc = this.npcs.get(npcId);
    if (!npc) {
      console.log(chalk.red(`\n✗ NPC "${npcId}" not found.\n`));
      return;
    }

    console.log(chalk.cyan(`\n${'═'.repeat(60)}`));
    console.log(chalk.cyan(`  Conversation with ${npc.name}`));
    console.log(chalk.cyan(`${'═'.repeat(60)}\n`));

    // Start dialogue - it will generate greeting automatically
    const conversationId = await this.dialogueSystem.startConversation(
      this.player,
      npc,
      { 
        situation: 'in the Red Griffin Inn',
        generateGreeting: true
      }
    );

    const conversation = this.dialogueSystem.activeConversations.get(conversationId);
    this.currentConversation = { id: conversationId, npc };
    
    // Display the greeting
    if (conversation.history.length > 0) {
      const lastTurn = conversation.history[conversation.history.length - 1];
      console.log(chalk.blue(`${npc.name}: `) + chalk.white(`"${lastTurn.output}"\n`));
    }

    // Conversation loop
    await this.conversationLoop(npc, conversationId);
  }

  async conversationLoop(npc, conversationId) {
    while (this.currentConversation) {
      const input = await question(chalk.green('You: '));
      
      if (!input.trim()) continue;
      
      const command = input.trim().toLowerCase();
      
      if (command === 'end' || command === 'bye' || command === 'quit') {
        await this.endConversation(conversationId);
        break;
      }

      if (command === 'quests') {
        this.showQuests();
        continue;
      }

      if (command === 'memory') {
        this.showMemory(npc);
        continue;
      }

      if (command === 'relationship') {
        this.showRelationship(npc);
        continue;
      }

      // Generate response using the dialogue system
      console.log(chalk.gray('\n[Thinking...]\n'));
      
      const result = await this.dialogueSystem.addTurn(conversationId, this.player.id, input);
      console.log(chalk.gray(`  Player: "${input}"\n`));
      
      const response = await this.dialogueSystem.addTurn(conversationId, npc.id, input);
      console.log(chalk.blue(`${npc.name}: `) + chalk.white(`"${response.text}"\n`));
    }
  }

  async endConversation(conversationId) {
    const conversation = this.dialogueSystem.activeConversations.get(conversationId);
    const turns = conversation ? conversation.history.length : 0;
    const npc = this.currentConversation.npc;
    
    console.log(chalk.gray(`\n[Conversation ended - ${turns} exchanges]\n`));

    // Add conversation memory
    this.player.memory.addMemory(
      'interaction',
      `Had a conversation with ${npc.name}: ${turns} exchanges`,
      5
    );

    npc.memory.addMemory(
      'interaction',
      `Had a conversation with ${this.player.name}: ${turns} exchanges`,
      5
    );

    this.dialogueSystem.endConversation(conversationId);
    this.currentConversation = null;
  }

  showQuests() {
    const active = this.questManager.getActiveQuests();
    const completed = this.questManager.getCompletedQuests();

    console.log(chalk.cyan('\n📜 Quest Log:\n'));

    if (active.length === 0 && completed.length === 0) {
      console.log(chalk.gray('  No quests yet.\n'));
      return;
    }

    if (active.length > 0) {
      console.log(chalk.yellow('  Active Quests:\n'));
      for (const quest of active) {
        console.log(chalk.white(`    ${quest.title}`));
        console.log(chalk.gray(`    ${quest.description}`));
        console.log(chalk.gray(`    Progress: ${quest.getProgress()}%\n`));
        
        const objectives = quest.getVisibleObjectives();
        if (objectives.length > 0) {
          console.log(chalk.gray('    Objectives:'));
          for (const obj of objectives) {
            const status = obj.completed ? chalk.green('✓') : chalk.gray('○');
            console.log(chalk.gray(`      ${status} ${obj.description}`));
          }
          console.log();
        }
      }
    }

    if (completed.length > 0) {
      console.log(chalk.green('  Completed Quests:\n'));
      for (const quest of completed) {
        console.log(chalk.green(`    ✓ ${quest.title}\n`));
      }
    }
  }

  showMemory(npc) {
    console.log(chalk.cyan(`\n🧠 ${npc.name}'s Recent Memories:\n`));
    
    const memories = npc.memory.getRecentMemories(5);
    for (const mem of memories) {
      console.log(chalk.gray(`  [${mem.type}] ${mem.content}`));
    }
    console.log();
  }

  showRelationship(npc) {
    const playerToNpc = this.player.relationships.getRelationship(npc.id);
    const npcToPlayer = npc.relationships.getRelationship(this.player.id);

    console.log(chalk.cyan(`\n💫 Relationship with ${npc.name}:\n`));
    console.log(chalk.white(`  Your view: ${this.getRelationshipColor(playerToNpc)}`));
    console.log(chalk.white(`  Their view: ${this.getRelationshipColor(npcToPlayer)}\n`));
  }

  showHelp() {
    console.log(chalk.cyan('\n📖 Commands:\n'));
    console.log(chalk.white('  talk [name]') + chalk.gray(' - Start conversation with NPC'));
    console.log(chalk.white('  quests') + chalk.gray('     - View active and completed quests'));
    console.log(chalk.white('  npcs') + chalk.gray('       - List all NPCs'));
    console.log(chalk.white('  stats') + chalk.gray('      - Show game statistics'));
    console.log(chalk.white('  help') + chalk.gray('       - Show this help message'));
    console.log(chalk.white('  quit') + chalk.gray('       - Exit demo'));
    console.log();
    console.log(chalk.cyan('  During conversation:\n'));
    console.log(chalk.white('  end') + chalk.gray('        - End current conversation'));
    console.log(chalk.white('  quests') + chalk.gray('     - View quests (without ending conversation)'));
    console.log(chalk.white('  memory') + chalk.gray('     - View NPC memories'));
    console.log(chalk.white('  relationship') + chalk.gray(' - View relationship status'));
    console.log();
  }

  showStats() {
    const ollamaService = OllamaService.getInstance();
    const stats = ollamaService.getStats();

    console.log(chalk.cyan('\n📊 Session Statistics:\n'));
    console.log(chalk.white(`  LLM Calls: ${stats.totalCalls}`));
    console.log(chalk.white(`  Tokens Generated: ${stats.totalTokens}`));
    console.log(chalk.white(`  Cache Hits: ${stats.cacheHits}`));
    console.log(chalk.white(`  Active Quests: ${this.questManager.getActiveQuests().length}`));
    console.log(chalk.white(`  Completed Quests: ${this.questManager.getCompletedQuests().length}`));
    console.log();
  }

  async run() {
    await this.initialize();

    while (true) {
      const input = await question(chalk.white('\n> '));
      const command = input.trim().toLowerCase();

      if (!command) continue;

      if (command === 'quit' || command === 'exit') {
        console.log(chalk.cyan('\n👋 Thanks for playing! Goodbye.\n'));
        break;
      }

      if (command === 'help') {
        this.showHelp();
        continue;
      }

      if (command === 'npcs') {
        this.showNPCs();
        continue;
      }

      if (command === 'quests') {
        this.showQuests();
        continue;
      }

      if (command === 'stats') {
        this.showStats();
        continue;
      }

      // Check if it's a talk command
      if (command.startsWith('talk ')) {
        const npcName = command.substring(5).trim();
        const npcId = Array.from(this.npcs.keys()).find(
          id => this.npcs.get(id).name.toLowerCase() === npcName
        );
        
        if (npcId) {
          await this.startConversation(npcId);
        } else {
          console.log(chalk.red(`\n✗ NPC "${npcName}" not found.\n`));
        }
        continue;
      }

      // Try direct NPC name
      const npcId = Array.from(this.npcs.keys()).find(
        id => this.npcs.get(id).name.toLowerCase() === command
      );

      if (npcId) {
        await this.startConversation(npcId);
      } else {
        console.log(chalk.red(`\n✗ Unknown command: "${command}"`));
        console.log(chalk.gray('Type "help" for available commands.\n'));
      }
    }

    rl.close();
  }
}

// Run the demo
const demo = new InteractiveDemo();
demo.run().catch(error => {
  console.error(chalk.red('\n✗ Error:'), error);
  rl.close();
  process.exit(1);
});
