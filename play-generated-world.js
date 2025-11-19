/**
 * Play with Generated World
 *
 * Text-based RPG game loop using procedurally generated world
 * Features:
 * - World generation at game start (town, NPCs, quests, locations)
 * - Contextual UI commands (look, npcs, quests, locations)
 * - GM-driven dialogue and narration
 * - Backend game systems (only visible through narrative)
 */

import readline from 'readline';
import chalk from 'chalk';
import { GameMaster } from './src/systems/GameMaster.js';
import { WorldGenerator } from './src/systems/world/WorldGenerator.js';
import { ContextualCommands } from './src/ui/ContextualCommands.js';
import { DialogueContextBuilder } from './src/systems/dialogue/DialogueContextBuilder.js';
import { QuestProgressionManager } from './src/systems/quest/QuestProgressionManager.js';
import { LocationExpansionManager } from './src/systems/world/LocationExpansionManager.js';
import { QuestManager } from './src/systems/quest/QuestManager.js';
import { OllamaService } from './src/services/OllamaService.js';
import { EventBus } from './src/services/EventBus.js';

class GeneratedWorldGame {
  constructor() {
    this.world = null;
    this.gm = null;
    this.contextualCommands = null;
    this.dialogueContextBuilder = null;
    this.questManager = null;
    this.questProgressionManager = null;
    this.locationExpansionManager = null;
    this.eventBus = null;
    this.rl = null;
    this.running = false;
  }

  async initialize() {
    console.log(chalk.cyan('\n╔══════════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║              OLLAMA RPG - PROCEDURALLY GENERATED WORLD          ║'));
    console.log(chalk.cyan('╚══════════════════════════════════════════════════════════════════╝\n'));

    // Get player name
    const playerName = await this.prompt('Enter your character name: ');

    console.log(chalk.yellow('\n🌍 Generating world... This may take a moment.\n'));

    // Initialize services
    const ollama = OllamaService.getInstance();
    this.eventBus = EventBus.getInstance();

    // Initialize Game Master
    this.gm = new GameMaster(ollama, this.eventBus);

    // Initialize World Generator
    const worldGen = new WorldGenerator(this.gm, {
      seed: Date.now()
    });

    // Generate world
    this.world = await worldGen.generateWorld({
      playerName: playerName,
      difficulty: 'normal'
    });

    // Initialize contextual commands
    this.contextualCommands = new ContextualCommands(this.world);

    // Initialize dialogue context builder (Phase 1C)
    this.dialogueContextBuilder = new DialogueContextBuilder(this.world);

    // Initialize quest manager
    this.questManager = new QuestManager();
    if (this.world.mainQuest) {
      // Manually add pre-generated quest to manager
      this.questManager.quests.set(this.world.mainQuest.id || 'main_quest', this.world.mainQuest);
    }

    // Initialize quest progression manager (Phase 1C)
    this.questProgressionManager = new QuestProgressionManager(this.questManager);

    // Initialize location expansion manager (Phase 1C)
    this.locationExpansionManager = new LocationExpansionManager(this.gm, {
      getLocation: (id) => this.world.locations.get(id)
    });

    // Setup event listeners for quest notifications
    this.setupQuestEventListeners();

    console.log(chalk.green('\n✅ World generation complete!\n'));

    // Display initial scene
    this.displayWelcome();
  }

  setupQuestEventListeners() {
    // Listen for quest objective completion
    this.eventBus.on('quest:objective_completed', (data) => {
      console.log('');
      console.log(chalk.green('─'.repeat(70)));
      console.log(chalk.green.bold('✓ QUEST OBJECTIVE COMPLETED'));
      console.log(chalk.green('─'.repeat(70)));
      console.log(chalk.white(`${data.objective.description}`));
      console.log('');
    });

    // Listen for quest completion
    this.eventBus.on('quest:completed', (data) => {
      console.log('');
      console.log(chalk.yellow('═'.repeat(70)));
      console.log(chalk.yellow.bold('🎉 QUEST COMPLETED!'));
      console.log(chalk.yellow('═'.repeat(70)));
      console.log(chalk.white(`"${data.quest.title}"`));
      console.log('');
    });

    // Listen for quest guidance updates
    this.eventBus.on('quest:guidance_updated', (data) => {
      if (data.guidance && data.guidance.hint) {
        console.log(chalk.gray(`💡 Hint: ${data.guidance.hint}`));
        console.log('');
      }
    });

    // Listen for rewards
    this.eventBus.on('quest:rewards_granted', (data) => {
      if (data.rewards && data.rewards.length > 0) {
        console.log(chalk.yellow('Rewards received:'));
        data.rewards.forEach(reward => {
          console.log(chalk.yellow(`  + ${reward}`));
        });
        console.log('');
      }
    });
  }

  displayWelcome() {
    const town = this.world.startingTown;
    const player = this.world.player;

    console.log(chalk.cyan('═'.repeat(70)));
    console.log(chalk.cyan.bold(`           WELCOME TO ${this.world.name.toUpperCase()}`));
    console.log(chalk.cyan('═'.repeat(70)));
    console.log('');
    console.log(`You are ${chalk.bold(player.name)}, ${player.role}.`);
    console.log(`You find yourself in ${chalk.bold(town.name)}, ${town.customProperties.type || 'a small town'}.`);
    console.log('');
    console.log(town.description);
    console.log('');
    console.log(chalk.cyan('─'.repeat(70)));
    console.log('');

    // Show initial quest
    if (this.world.mainQuest) {
      console.log(chalk.yellow(`📜 ${this.world.mainQuest.title}`));
      console.log(`   ${this.world.mainQuest.description}`);
      console.log('');
    }

    console.log(chalk.gray('Type "help" for available commands, "look" to examine your surroundings.'));
    console.log('');
  }

  displayHelp() {
    console.log('');
    console.log(chalk.cyan('AVAILABLE COMMANDS:'));
    console.log('');
    console.log(chalk.white('  Navigation & Observation:'));
    console.log('    look              - Examine current location (NPCs, quests, nearby places)');
    console.log('    locations         - View discovered locations with travel times');
    console.log('    travel <place>    - Travel to a discovered location');
    console.log('');
    console.log(chalk.white('  People & Quests:'));
    console.log('    npcs              - View NPCs (at location, nearby, quest-related)');
    console.log('    talk <name>       - Talk to an NPC');
    console.log('    quests            - View active and completed quests');
    console.log('');
    console.log(chalk.white('  Character:'));
    console.log('    status            - View your character status');
    console.log('    inventory         - View your inventory');
    console.log('');
    console.log(chalk.white('  System:'));
    console.log('    help              - Show this help message');
    console.log('    quit / exit       - Exit the game');
    console.log('');
    console.log(chalk.gray('  Or just type naturally to interact with the world!'));
    console.log('');
  }

  async handleCommand(input) {
    const trimmed = input.trim().toLowerCase();
    const parts = trimmed.split(' ');
    const command = parts[0];
    const args = parts.slice(1);

    // System commands
    if (command === 'quit' || command === 'exit') {
      this.running = false;
      console.log(chalk.yellow('\n👋 Thanks for playing!\n'));
      return;
    }

    if (command === 'help') {
      this.displayHelp();
      return;
    }

    // Contextual UI commands
    if (command === 'look') {
      const result = this.contextualCommands.look();
      console.log('');
      console.log(result);
      console.log('');
      return;
    }

    if (command === 'npcs') {
      const result = this.contextualCommands.npcs();
      console.log('');
      console.log(result);
      console.log('');
      return;
    }

    if (command === 'quests') {
      const result = this.contextualCommands.quests();
      console.log('');
      console.log(result);
      console.log('');
      return;
    }

    if (command === 'locations') {
      const result = this.contextualCommands.locations();
      console.log('');
      console.log(result);
      console.log('');
      return;
    }

    // Talk to NPC
    if (command === 'talk') {
      if (args.length === 0) {
        console.log(chalk.red('\nPlease specify who to talk to. Example: talk Gareth\n'));
        return;
      }

      const npcName = args.join(' ');
      await this.talkToNPC(npcName);
      return;
    }

    // Travel
    if (command === 'travel') {
      if (args.length === 0) {
        console.log(chalk.red('\nPlease specify where to travel. Example: travel Whisperwood Forest\n'));
        return;
      }

      const locationName = args.join(' ');
      await this.travel(locationName);
      return;
    }

    // Status
    if (command === 'status') {
      this.displayStatus();
      return;
    }

    // Inventory
    if (command === 'inventory') {
      this.displayInventory();
      return;
    }

    // Natural language input - send to GM
    console.log(chalk.gray('\n[Sending to Game Master...]\n'));
    await this.handleNaturalInput(input);
  }

  async talkToNPC(npcName) {
    // Find NPC
    const npc = Array.from(this.world.npcs.values()).find(n =>
      n.name.toLowerCase() === npcName.toLowerCase() && !n.isPlayer
    );

    if (!npc) {
      console.log(chalk.red(`\n❌ Cannot find "${npcName}". Use "npcs" to see who is available.\n`));
      return;
    }

    // Check if at same location
    if (npc.currentLocation !== this.world.player.currentLocation) {
      const npcLocation = this.world.locations.get(npc.currentLocation);
      console.log(chalk.red(`\n❌ ${npc.name} is not here. They are at ${npcLocation?.name || 'another location'}.\n`));
      return;
    }

    console.log('');
    console.log(chalk.cyan('─'.repeat(70)));
    console.log(chalk.cyan.bold(`💬 Talking to ${npc.name}`));
    console.log(chalk.gray(`   ${npc.role} - ${npc.mood || 'neutral'}`));

    // Show NPC knowledge preview (Phase 1C)
    if (npc.knowledge && npc.knowledge.specialties && npc.knowledge.specialties.length > 0) {
      console.log(chalk.gray(`   Knows about: ${npc.knowledge.specialties.join(', ')}`));
    }

    console.log(chalk.cyan('─'.repeat(70)));
    console.log('');

    // Emit dialogue:started event for quest tracking
    const conversationId = `conv_${Date.now()}_${npc.id}`;
    this.eventBus.emit('dialogue:started', {
      npcId: npc.id,
      npc: npc,
      player: this.world.player,
      conversationId
    });

    // Build enhanced dialogue context (Phase 1C)
    const dialogueContext = this.dialogueContextBuilder.buildContext(npc, this.world.player, {
      conversationHistory: []
    });

    // Add conversationId to context
    dialogueContext.conversationId = conversationId;

    // Build enhanced prompt using DialogueContextBuilder
    const prompt = this.dialogueContextBuilder.buildPrompt(dialogueContext, {
      isGreeting: true
    });

    try {
      const response = await this.gm.ollama.generate(prompt, {
        temperature: 0.8,
        maxTokens: 200
      });

      console.log(chalk.white(response));
      console.log('');
      console.log(chalk.gray('Type your response, or "back" to end conversation:'));
      console.log('');

      // Simple conversation loop with enhanced context
      await this.conversationLoop(npc, dialogueContext);

    } catch (error) {
      console.log(chalk.red(`\n❌ Error talking to ${npc.name}: ${error.message}\n`));
    }
  }

  async conversationLoop(npc, dialogueContext) {
    // Get player input
    const playerInput = await this.prompt('> ');

    if (playerInput.trim().toLowerCase() === 'back') {
      console.log(chalk.gray(`\nYou step away from ${npc.name}.\n`));
      return;
    }

    // Update conversation history
    dialogueContext.conversationHistory.push(`${this.world.player.name}: ${playerInput}`);

    // Emit dialogue turn event for quest tracking
    this.eventBus.emit('dialogue:turn', {
      conversationId: dialogueContext.conversationId,
      npcId: npc.id,
      text: playerInput,
      speaker: 'player'
    });

    // Build enhanced prompt with player's question/statement (Phase 1C)
    const prompt = this.dialogueContextBuilder.buildPrompt(dialogueContext, {
      isGreeting: false,
      playerSaid: playerInput
    });

    try {
      const npcResponse = await this.gm.ollama.generate(prompt, {
        temperature: 0.8,
        maxTokens: 250
      });

      // Add NPC response to history
      dialogueContext.conversationHistory.push(`${npc.name}: ${npcResponse}`);

      // Emit NPC response for quest tracking
      this.eventBus.emit('dialogue:turn', {
        conversationId: dialogueContext.conversationId,
        npcId: npc.id,
        text: npcResponse,
        speaker: 'npc'
      });

      console.log('');
      console.log(chalk.white(`${npc.name}: ${npcResponse}`));
      console.log('');

      // Continue conversation
      await this.conversationLoop(npc, dialogueContext);

    } catch (error) {
      console.log(chalk.red(`\n❌ Error in conversation: ${error.message}\n`));
    }
  }

  async travel(locationName) {
    // Find location
    const location = Array.from(this.world.locations.values()).find(loc =>
      loc.name.toLowerCase().includes(locationName.toLowerCase())
    );

    if (!location) {
      console.log(chalk.red(`\n❌ Cannot find location "${locationName}". Use "locations" to see discovered places.\n`));
      return;
    }

    if (!location.discovered) {
      console.log(chalk.red(`\n❌ You haven't discovered ${location.name} yet.\n`));
      return;
    }

    if (location.id === this.world.player.currentLocation) {
      console.log(chalk.yellow(`\n⚠️  You are already at ${location.name}.\n`));
      return;
    }

    // Calculate travel time
    const currentLoc = this.world.locations.get(this.world.player.currentLocation);
    const travelTime = this.contextualCommands.calculateTravelTime(currentLoc, location);

    console.log('');
    console.log(chalk.cyan('─'.repeat(70)));
    console.log(chalk.yellow(`🚶 Traveling to ${location.name}...`));
    console.log(chalk.gray(`   (${this.contextualCommands.formatTravelTime(travelTime)} journey)`));
    console.log(chalk.cyan('─'.repeat(70)));
    console.log('');

    // Get GM narration for travel
    const prompt = `The player ${this.world.player.name} is traveling from ${currentLoc.name} to ${location.name}.

Journey details:
- Direction: ${this.contextualCommands.getDirectionTo(currentLoc, location)}
- Distance: ${Math.round(this.contextualCommands.calculateDistance(currentLoc, location))} km
- Travel time: ${this.contextualCommands.formatTravelTime(travelTime)}

Generate a brief (2-3 sentences) narration of the journey. What does the player see/experience along the way?`;

    try {
      const narration = await this.gm.narrateEvent(prompt, { currentLoc, location });
      console.log(chalk.white(narration));
      console.log('');
    } catch (error) {
      console.log(chalk.gray('You travel along the road...'));
      console.log('');
    }

    // Move player
    this.world.player.currentLocation = location.id;
    location.visited = true;

    // Emit location:visited event for quest tracking
    this.eventBus.emit('location:visited', {
      locationId: location.id,
      locationName: location.name,
      player: this.world.player
    });

    // Expand location to FULL detail (Phase 1C)
    try {
      const detailLevel = location.customProperties?.detailLevel || 'sparse';

      if (detailLevel === 'sparse' || detailLevel === 'partial') {
        console.log(chalk.gray(`\n[Expanding location details...]\n`));

        const expansion = await this.locationExpansionManager.expandToFull(location.id, {
          reason: 'player_visit',
          player: this.world.player
        });

        if (expansion.success && !expansion.alreadyExpanded) {
          console.log(chalk.green(`✨ You discover more about ${location.name}...\n`));
        }
      }
    } catch (error) {
      // Location expansion is optional - continue even if it fails
      console.log(chalk.gray(`[Note: Could not expand location details: ${error.message}]\n`));
    }

    // Show new location
    console.log(chalk.green(`✅ Arrived at ${location.name}\n`));

    // Auto-look at new location
    const result = this.contextualCommands.look();
    console.log(result);
    console.log('');
  }

  displayStatus() {
    const player = this.world.player;
    console.log('');
    console.log(chalk.cyan('═'.repeat(70)));
    console.log(chalk.cyan.bold('⚔️  CHARACTER STATUS'));
    console.log(chalk.cyan('═'.repeat(70)));
    console.log('');
    console.log(`Name: ${chalk.bold(player.name)}`);
    console.log(`Role: ${player.role}`);
    console.log(`Mood: ${player.mood || 'neutral'}`);
    console.log('');

    const location = this.world.locations.get(player.currentLocation);
    console.log(`Location: ${location.name}`);
    console.log('');

    // Show personality if available
    if (player.personality) {
      console.log('Personality:');
      Object.entries(player.personality).forEach(([trait, value]) => {
        console.log(`  ${trait}: ${value}/100`);
      });
      console.log('');
    }

    console.log(chalk.gray('Note: Stats and inventory are tracked behind the scenes'));
    console.log(chalk.gray('and emerge through narrative and GM responses.'));
    console.log('');
  }

  displayInventory() {
    console.log('');
    console.log(chalk.yellow('📦 INVENTORY'));
    console.log('');
    console.log(chalk.gray('Inventory is tracked internally and surfaces through narrative.'));
    console.log(chalk.gray('The GM will tell you what you have when relevant.'));
    console.log('');
    console.log(chalk.gray('Try asking about your belongings in natural language!'));
    console.log('');
  }

  async handleNaturalInput(input) {
    // Send to GM for interpretation
    const context = {
      player: this.world.player,
      location: this.world.locations.get(this.world.player.currentLocation),
      activeQuests: this.contextualCommands.getActiveQuests()
    };

    const prompt = `The player ${this.world.player.name} says/does: "${input}"

Current context:
- Location: ${context.location.name}
- Active quests: ${context.activeQuests.map(q => q.title).join(', ') || 'none'}

Interpret and narrate the result. If it's a question, answer it. If it's an action, describe what happens. Keep it concise (2-4 sentences).`;

    try {
      const response = await this.gm.narrateEvent(prompt, context);
      console.log(chalk.white(response));
      console.log('');
    } catch (error) {
      console.log(chalk.red(`\n❌ Error: ${error.message}\n`));
    }
  }

  async prompt(question) {
    return new Promise((resolve) => {
      this.rl.question(chalk.cyan(question), (answer) => {
        resolve(answer);
      });
    });
  }

  async gameLoop() {
    this.running = true;

    while (this.running) {
      const input = await this.prompt('> ');

      if (input.trim()) {
        await this.handleCommand(input);
      }
    }

    this.rl.close();
  }

  async start() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    try {
      await this.initialize();
      await this.gameLoop();
    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error.message);
      console.error(error.stack);
      this.rl.close();
      process.exit(1);
    }
  }
}

// Start the game
const game = new GeneratedWorldGame();
game.start();
