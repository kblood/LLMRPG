/**
 * Test Enhanced Dialogue System - Phase 1C
 *
 * Tests the DialogueContextBuilder and enhanced NPC knowledge integration
 *
 * Test scenarios:
 * 1. Talk to NPCs with different knowledge specialties
 * 2. Ask NPCs about locations they know about
 * 3. Ask about rumors they've heard
 * 4. Ask about quests
 * 5. Verify NPCs reference their concerns and mood
 */

import chalk from 'chalk';
import { GameMaster } from './src/systems/GameMaster.js';
import { WorldGenerator } from './src/systems/world/WorldGenerator.js';
import { DialogueContextBuilder } from './src/systems/dialogue/DialogueContextBuilder.js';
import { OllamaService } from './src/services/OllamaService.js';
import { EventBus } from './src/services/EventBus.js';

class EnhancedDialogueTest {
  constructor() {
    this.world = null;
    this.gm = null;
    this.dialogueContextBuilder = null;
    this.testResults = [];
  }

  async initialize() {
    console.log(chalk.cyan('\n╔══════════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║         PHASE 1C: ENHANCED DIALOGUE SYSTEM TEST                 ║'));
    console.log(chalk.cyan('╚══════════════════════════════════════════════════════════════════╝\n'));

    console.log(chalk.yellow('Initializing game systems...\n'));

    const ollama = OllamaService.getInstance();
    const eventBus = EventBus.getInstance();

    this.gm = new GameMaster(ollama, eventBus);

    console.log(chalk.yellow('Generating test world...\n'));

    const worldGen = new WorldGenerator(this.gm, { seed: 12345 });
    this.world = await worldGen.generateWorld({
      playerName: 'TestHero',
      difficulty: 'normal'
    });

    this.dialogueContextBuilder = new DialogueContextBuilder(this.world);

    console.log(chalk.green('✅ Initialization complete!\n'));
  }

  /**
   * Log test result
   */
  logTest(testName, passed, details = '') {
    const result = {
      name: testName,
      passed,
      details
    };

    this.testResults.push(result);

    const icon = passed ? chalk.green('✓') : chalk.red('✗');
    console.log(`${icon} ${testName}`);
    if (details) {
      console.log(chalk.gray(`  ${details}`));
    }
    console.log('');
  }

  /**
   * Test 1: Context builder extracts NPC knowledge
   */
  async testKnowledgeExtraction() {
    console.log(chalk.cyan('═'.repeat(70)));
    console.log(chalk.cyan.bold('TEST 1: Knowledge Extraction'));
    console.log(chalk.cyan('═'.repeat(70)));
    console.log('');

    // Find Gareth (should have knowledge about milling and quarry)
    const gareth = Array.from(this.world.npcs.values()).find(n => n.name === 'Gareth');

    if (!gareth) {
      this.logTest('Find Gareth', false, 'Gareth not found in world');
      return;
    }

    this.logTest('Find Gareth', true, `Found ${gareth.name}, ${gareth.role}`);

    // Build context
    const context = this.dialogueContextBuilder.buildContext(gareth, this.world.player);

    // Verify knowledge extraction
    const hasSpecialties = context.knowledge.specialties.length > 0;
    this.logTest(
      'Extract specialties',
      hasSpecialties,
      hasSpecialties ? `Found: ${context.knowledge.specialties.join(', ')}` : 'No specialties found'
    );

    const hasRumors = context.knowledge.rumors.length > 0;
    this.logTest(
      'Extract rumors',
      hasRumors,
      hasRumors ? `Found ${context.knowledge.rumors.length} rumors` : 'No rumors found'
    );

    // Verify mood and concern
    const hasConcern = !!context.npc.currentConcern;
    this.logTest(
      'Extract current concern',
      hasConcern,
      hasConcern ? `Concern: ${context.npc.currentConcern}` : 'No concern found'
    );

    console.log(chalk.gray('Full context preview:'));
    console.log(chalk.gray(JSON.stringify(context, null, 2).substring(0, 500) + '...'));
    console.log('');
  }

  /**
   * Test 2: Location narrative fuel integration
   */
  async testLocationNarrativeFuel() {
    console.log(chalk.cyan('═'.repeat(70)));
    console.log(chalk.cyan.bold('TEST 2: Location Narrative Fuel'));
    console.log(chalk.cyan('═'.repeat(70)));
    console.log('');

    // Check if locations have narrative fuel
    let locationsWithFuel = 0;

    for (const [id, location] of this.world.locations.entries()) {
      if (location.customProperties?.narrativeFuel) {
        locationsWithFuel++;

        const fuel = location.customProperties.narrativeFuel;
        console.log(chalk.white(`Location: ${location.name}`));
        console.log(chalk.gray(`  Common knowledge: ${fuel.commonKnowledge?.length || 0} items`));
        console.log(chalk.gray(`  Rumors: ${fuel.rumors?.length || 0} items`));
        console.log(chalk.gray(`  Quest hooks: ${fuel.questHooks?.length || 0} items`));
        console.log(chalk.gray(`  Specialists: ${fuel.specialists?.join(', ') || 'none'}`));
        console.log('');
      }
    }

    this.logTest(
      'Locations have narrative fuel',
      locationsWithFuel > 0,
      `${locationsWithFuel} locations with narrative fuel`
    );
  }

  /**
   * Test 3: Quest context integration
   */
  async testQuestContext() {
    console.log(chalk.cyan('═'.repeat(70)));
    console.log(chalk.cyan.bold('TEST 3: Quest Context Integration'));
    console.log(chalk.cyan('═'.repeat(70)));
    console.log('');

    const gareth = Array.from(this.world.npcs.values()).find(n => n.name === 'Gareth');

    if (!gareth) {
      this.logTest('Quest context test', false, 'Gareth not found');
      return;
    }

    const context = this.dialogueContextBuilder.buildContext(gareth, this.world.player);

    const hasActiveQuests = context.quests.activeQuests.length > 0;
    this.logTest(
      'Extract active quests',
      hasActiveQuests,
      hasActiveQuests ? `Found ${context.quests.activeQuests.length} active quests` : 'No active quests'
    );

    const hasRelevantQuests = context.quests.hasRelevantQuests;
    this.logTest(
      'Identify relevant quests for NPC',
      hasRelevantQuests,
      hasRelevantQuests ? `${context.quests.relevantQuests.length} quests relevant to ${gareth.name}` : 'No relevant quests'
    );

    if (hasActiveQuests) {
      console.log(chalk.white('Active quests:'));
      context.quests.activeQuests.forEach(quest => {
        console.log(chalk.gray(`  - ${quest.title} (Relevant: ${quest.isRelevantToNPC ? 'Yes' : 'No'})`));
      });
      console.log('');
    }
  }

  /**
   * Test 4: Generate dialogue with knowledge
   */
  async testDialogueGeneration() {
    console.log(chalk.cyan('═'.repeat(70)));
    console.log(chalk.cyan.bold('TEST 4: Dialogue Generation with Knowledge'));
    console.log(chalk.cyan('═'.repeat(70)));
    console.log('');

    // Test with multiple NPCs
    const testNPCs = ['Gareth', 'Lyssa', 'Old Tam'];

    for (const npcName of testNPCs) {
      const npc = Array.from(this.world.npcs.values()).find(n => n.name === npcName);

      if (!npc) {
        console.log(chalk.yellow(`⚠️  NPC ${npcName} not found, skipping\n`));
        continue;
      }

      console.log(chalk.white(`\n━━━ Talking to ${npc.name} (${npc.role}) ━━━\n`));

      // Build context
      const context = this.dialogueContextBuilder.buildContext(npc, this.world.player);

      // Generate greeting
      console.log(chalk.cyan('Generating greeting...\n'));

      const greetingPrompt = this.dialogueContextBuilder.buildPrompt(context, {
        isGreeting: true
      });

      try {
        const greeting = await this.gm.ollama.generate(greetingPrompt, {
          temperature: 0.8,
          maxTokens: 150
        });

        console.log(chalk.white(`${npc.name}: ${greeting}`));
        console.log('');

        // Check if greeting references concern
        const mentionsConcern = npc.currentConcern &&
          greeting.toLowerCase().includes(npc.currentConcern.toLowerCase().substring(0, 15));

        this.logTest(
          `${npc.name} greeting references concern`,
          mentionsConcern || !npc.currentConcern,
          mentionsConcern ? 'Concern mentioned' : (npc.currentConcern ? 'Concern not mentioned' : 'No concern to mention')
        );

      } catch (error) {
        console.log(chalk.red(`Error: ${error.message}\n`));
        this.logTest(`${npc.name} greeting generation`, false, error.message);
      }
    }
  }

  /**
   * Test 5: Ask about specialties
   */
  async testAskAboutSpecialties() {
    console.log(chalk.cyan('═'.repeat(70)));
    console.log(chalk.cyan.bold('TEST 5: Asking About NPC Specialties'));
    console.log(chalk.cyan('═'.repeat(70)));
    console.log('');

    const gareth = Array.from(this.world.npcs.values()).find(n => n.name === 'Gareth');

    if (!gareth || !gareth.knowledge?.specialties || gareth.knowledge.specialties.length === 0) {
      this.logTest('Ask about specialties', false, 'No NPC with specialties found');
      return;
    }

    console.log(chalk.white(`Asking ${gareth.name} about: ${gareth.knowledge.specialties[0]}\n`));

    const context = this.dialogueContextBuilder.buildContext(gareth, this.world.player);

    const question = `Tell me about ${gareth.knowledge.specialties[0]}`;

    const prompt = this.dialogueContextBuilder.buildPrompt(context, {
      isGreeting: false,
      playerSaid: question
    });

    try {
      const response = await this.gm.ollama.generate(prompt, {
        temperature: 0.8,
        maxTokens: 200
      });

      console.log(chalk.cyan(`${this.world.player.name}: ${question}`));
      console.log(chalk.white(`${gareth.name}: ${response}`));
      console.log('');

      // Check if response mentions the specialty
      const mentionsSpecialty = response.toLowerCase().includes(gareth.knowledge.specialties[0].toLowerCase());

      this.logTest(
        'Response references specialty',
        mentionsSpecialty,
        mentionsSpecialty ? 'Specialty mentioned in response' : 'Specialty not clearly referenced'
      );

    } catch (error) {
      console.log(chalk.red(`Error: ${error.message}\n`));
      this.logTest('Ask about specialty', false, error.message);
    }
  }

  /**
   * Test 6: Ask about rumors
   */
  async testAskAboutRumors() {
    console.log(chalk.cyan('═'.repeat(70)));
    console.log(chalk.cyan.bold('TEST 6: Asking About Rumors'));
    console.log(chalk.cyan('═'.repeat(70)));
    console.log('');

    // Find NPC with rumors
    const npcWithRumors = Array.from(this.world.npcs.values()).find(n =>
      n.knowledge?.rumors && n.knowledge.rumors.length > 0
    );

    if (!npcWithRumors) {
      this.logTest('Ask about rumors', false, 'No NPC with rumors found');
      return;
    }

    console.log(chalk.white(`Asking ${npcWithRumors.name} about rumors\n`));
    console.log(chalk.gray(`NPC has ${npcWithRumors.knowledge.rumors.length} rumors\n`));

    const context = this.dialogueContextBuilder.buildContext(npcWithRumors, this.world.player);

    const question = 'What rumors have you heard?';

    const prompt = this.dialogueContextBuilder.buildPrompt(context, {
      isGreeting: false,
      playerSaid: question
    });

    try {
      const response = await this.gm.ollama.generate(prompt, {
        temperature: 0.8,
        maxTokens: 250
      });

      console.log(chalk.cyan(`${this.world.player.name}: ${question}`));
      console.log(chalk.white(`${npcWithRumors.name}: ${response}`));
      console.log('');

      // Check if response mentions any rumor
      const mentionsRumor = npcWithRumors.knowledge.rumors.some(rumor =>
        response.toLowerCase().includes(rumor.toLowerCase().substring(0, 20))
      );

      this.logTest(
        'Response shares rumors',
        mentionsRumor,
        mentionsRumor ? 'Rumor shared in response' : 'No rumor clearly shared (but may be paraphrased)'
      );

    } catch (error) {
      console.log(chalk.red(`Error: ${error.message}\n`));
      this.logTest('Ask about rumors', false, error.message);
    }
  }

  /**
   * Test 7: Ask about locations
   */
  async testAskAboutLocations() {
    console.log(chalk.cyan('═'.repeat(70)));
    console.log(chalk.cyan.bold('TEST 7: Asking About Locations'));
    console.log(chalk.cyan('═'.repeat(70)));
    console.log('');

    // Find a location with narrative fuel and a specialist
    let testLocation = null;
    let specialist = null;

    for (const [id, location] of this.world.locations.entries()) {
      const fuel = location.customProperties?.narrativeFuel;
      if (fuel?.specialists && fuel.specialists.length > 0) {
        testLocation = location;
        const specialistName = fuel.specialists[0];
        specialist = Array.from(this.world.npcs.values()).find(n => n.name === specialistName);

        if (specialist) {
          break;
        }
      }
    }

    if (!specialist || !testLocation) {
      this.logTest('Ask about locations', false, 'No specialist for any location found');
      return;
    }

    console.log(chalk.white(`Asking ${specialist.name} (specialist) about ${testLocation.name}\n`));

    const context = this.dialogueContextBuilder.buildContext(specialist, this.world.player);

    const question = `What do you know about ${testLocation.name}?`;

    const prompt = this.dialogueContextBuilder.buildPrompt(context, {
      isGreeting: false,
      playerSaid: question
    });

    try {
      const response = await this.gm.ollama.generate(prompt, {
        temperature: 0.8,
        maxTokens: 250
      });

      console.log(chalk.cyan(`${this.world.player.name}: ${question}`));
      console.log(chalk.white(`${specialist.name}: ${response}`));
      console.log('');

      // Check if response mentions the location
      const mentionsLocation = response.toLowerCase().includes(testLocation.name.toLowerCase().substring(0, 8));

      this.logTest(
        'Specialist shares location knowledge',
        mentionsLocation,
        mentionsLocation ? 'Location knowledge shared' : 'Location not clearly referenced'
      );

    } catch (error) {
      console.log(chalk.red(`Error: ${error.message}\n`));
      this.logTest('Ask about location', false, error.message);
    }
  }

  /**
   * Display test summary
   */
  displaySummary() {
    console.log(chalk.cyan('\n═'.repeat(70)));
    console.log(chalk.cyan.bold('TEST SUMMARY'));
    console.log(chalk.cyan('═'.repeat(70)));
    console.log('');

    const total = this.testResults.length;
    const passed = this.testResults.filter(t => t.passed).length;
    const failed = total - passed;

    console.log(`Total Tests: ${total}`);
    console.log(chalk.green(`Passed: ${passed}`));
    if (failed > 0) {
      console.log(chalk.red(`Failed: ${failed}`));
    }

    const successRate = ((passed / total) * 100).toFixed(1);
    console.log(`\nSuccess Rate: ${successRate}%`);

    if (failed > 0) {
      console.log(chalk.yellow('\nFailed Tests:'));
      this.testResults
        .filter(t => !t.passed)
        .forEach(t => {
          console.log(chalk.red(`  - ${t.name}: ${t.details}`));
        });
    }

    console.log('');
  }

  async run() {
    try {
      await this.initialize();

      await this.testKnowledgeExtraction();
      await this.testLocationNarrativeFuel();
      await this.testQuestContext();
      await this.testDialogueGeneration();
      await this.testAskAboutSpecialties();
      await this.testAskAboutRumors();
      await this.testAskAboutLocations();

      this.displaySummary();

      console.log(chalk.green('\n✅ All tests complete!\n'));

    } catch (error) {
      console.error(chalk.red('\n❌ Test suite error:'), error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }
}

// Run tests
const test = new EnhancedDialogueTest();
test.run();
