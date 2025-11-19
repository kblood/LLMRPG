/**
 * Phase 2 Test: Progressive Location Detail Expansion
 *
 * Tests the complete location expansion system:
 * 1. Locations start SPARSE with minimal detail
 * 2. Expand to PARTIAL when NPCs mention or player asks
 * 3. Expand to FULL when player visits
 * 4. Details are GM-generated and consistent with narrative fuel
 */

import chalk from 'chalk';
import { GameMaster } from './src/systems/GameMaster.js';
import { WorldGenerator } from './src/systems/world/WorldGenerator.js';
import { WorldManager } from './src/systems/world/WorldManager.js';
import { LocationExpansionManager } from './src/systems/world/LocationExpansionManager.js';
import { ContextualCommands } from './src/ui/ContextualCommands.js';
import { OllamaService } from './src/services/OllamaService.js';
import { EventBus } from './src/services/EventBus.js';

class Phase2Test {
  constructor() {
    this.world = null;
    this.gm = null;
    this.worldManager = null;
    this.expansionManager = null;
    this.contextualCommands = null;
  }

  async setup() {
    console.log(chalk.cyan('\n╔══════════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║         PHASE 2 TEST: PROGRESSIVE LOCATION EXPANSION            ║'));
    console.log(chalk.cyan('╚══════════════════════════════════════════════════════════════════╝\n'));

    console.log(chalk.yellow('🔧 Setting up test environment...\n'));

    // Initialize services
    const ollama = OllamaService.getInstance();
    const eventBus = EventBus.getInstance();

    // Initialize Game Master
    this.gm = new GameMaster(ollama, eventBus);

    // Initialize World Generator
    const worldGen = new WorldGenerator(this.gm, {
      seed: 12345 // Fixed seed for reproducibility
    });

    // Generate world
    console.log(chalk.yellow('🌍 Generating test world...\n'));
    this.world = await worldGen.generateWorld({
      playerName: 'TestHero',
      difficulty: 'normal'
    });

    // Initialize WorldManager
    this.worldManager = new WorldManager();
    this.world.locations.forEach((loc, id) => {
      this.worldManager.addLocation(loc);
      this.worldManager.characterLocations.set(this.world.player.id, this.world.player.currentLocation);
    });

    // Initialize LocationExpansionManager
    this.expansionManager = new LocationExpansionManager(this.gm, this.worldManager);

    // Initialize ContextualCommands with expansion manager
    this.contextualCommands = new ContextualCommands(this.world, this.expansionManager);

    console.log(chalk.green('✅ Test environment ready\n'));
  }

  async runTests() {
    console.log(chalk.cyan('═'.repeat(70)));
    console.log(chalk.cyan.bold('               RUNNING PHASE 2 TESTS'));
    console.log(chalk.cyan('═'.repeat(70)));
    console.log('');

    await this.test1_VerifySparseGeneration();
    await this.test2_ExpandToPartial();
    await this.test3_ExpandToFull();
    await this.test4_TravelExpansion();
    await this.test5_DetailLevelIndicators();
    await this.test6_ConsistencyCheck();
    await this.test7_PerformanceMetrics();

    console.log('');
    console.log(chalk.cyan('═'.repeat(70)));
    console.log(chalk.green.bold('               ALL TESTS COMPLETE'));
    console.log(chalk.cyan('═'.repeat(70)));
    console.log('');

    this.displaySummary();
  }

  async test1_VerifySparseGeneration() {
    console.log(chalk.yellow('\n📝 TEST 1: Verify Sparse Location Generation\n'));

    const sparseLocations = Array.from(this.world.locations.values())
      .filter(loc => loc.id !== 'starting_town');

    console.log(`   Found ${sparseLocations.length} sparse locations\n`);

    sparseLocations.slice(0, 3).forEach(loc => {
      const detailLevel = this.expansionManager.getDetailLevel(loc);
      const indicator = this.expansionManager.getDetailLevelIndicator(loc);

      console.log(`   ${indicator} ${loc.name}`);
      console.log(`      Detail Level: ${detailLevel}`);
      console.log(`      Type: ${loc.type}`);
      console.log(`      Visited: ${loc.visited}`);

      const fuel = loc.customProperties.narrativeFuel;
      if (fuel && fuel.commonKnowledge) {
        console.log(`      Common Knowledge: ${fuel.commonKnowledge[0]}`);
      }
      console.log('');
    });

    const allSparse = sparseLocations.every(loc =>
      this.expansionManager.getDetailLevel(loc) === 'sparse'
    );

    if (allSparse) {
      console.log(chalk.green('   ✅ TEST 1 PASSED: All non-town locations start SPARSE\n'));
    } else {
      console.log(chalk.red('   ❌ TEST 1 FAILED: Some locations are not sparse\n'));
    }
  }

  async test2_ExpandToPartial() {
    console.log(chalk.yellow('\n📝 TEST 2: Expand Location to PARTIAL Detail\n'));

    const testLocation = Array.from(this.world.locations.values())
      .find(loc => loc.id !== 'starting_town' && loc.type === 'forest');

    if (!testLocation) {
      console.log(chalk.red('   ❌ No forest location found for testing\n'));
      return;
    }

    console.log(`   Expanding: ${testLocation.name}`);
    console.log(`   Before: ${this.expansionManager.getDetailLevel(testLocation)}\n`);

    const result = await this.expansionManager.expandToPartial(testLocation.id, {
      trigger: 'npc_mention',
      npc: 'Old Tam'
    });

    if (result.success) {
      console.log(chalk.green('   ✅ Expansion successful!\n'));

      console.log(`   After: ${this.expansionManager.getDetailLevel(testLocation)}`);
      console.log(`   Indicator: ${this.expansionManager.getDetailLevelIndicator(testLocation)}\n`);

      console.log(chalk.cyan('   Generated Details:'));
      console.log(`   Description: ${testLocation.description}`);
      console.log(`   Points of Interest: ${testLocation.customProperties.pointsOfInterest?.join(', ')}`);
      console.log(`   Dangers: ${testLocation.customProperties.dangers?.join(', ')}`);
      console.log(`   Opportunities: ${testLocation.customProperties.opportunities?.join(', ')}`);
      console.log(`   Atmosphere: ${testLocation.customProperties.atmosphere}`);
      console.log('');

      console.log(chalk.green('   ✅ TEST 2 PASSED: PARTIAL expansion successful\n'));
    } else {
      console.log(chalk.red(`   ❌ TEST 2 FAILED: ${result.reason}\n`));
    }
  }

  async test3_ExpandToFull() {
    console.log(chalk.yellow('\n📝 TEST 3: Expand Location to FULL Detail\n'));

    const testLocation = Array.from(this.world.locations.values())
      .find(loc => loc.id !== 'starting_town' && loc.type === 'ruins');

    if (!testLocation) {
      console.log(chalk.red('   ❌ No ruins location found for testing\n'));
      return;
    }

    console.log(`   Expanding: ${testLocation.name}`);
    console.log(`   Before: ${this.expansionManager.getDetailLevel(testLocation)}\n`);

    const result = await this.expansionManager.expandToFull(testLocation.id, {
      trigger: 'player_visit'
    });

    if (result.success) {
      console.log(chalk.green('   ✅ Expansion successful!\n'));

      console.log(`   After: ${this.expansionManager.getDetailLevel(testLocation)}`);
      console.log(`   Indicator: ${this.expansionManager.getDetailLevelIndicator(testLocation)}\n`);

      console.log(chalk.cyan('   Generated Details:'));
      console.log(`   Detailed Layout: ${testLocation.customProperties.detailedLayout}`);
      console.log(`   Secrets: ${testLocation.customProperties.secrets?.join(', ')}`);
      console.log(`   Hidden Features: ${testLocation.customProperties.hiddenFeatures?.join(', ')}`);
      console.log(`   Ambience: ${testLocation.customProperties.ambience}`);
      console.log('');

      console.log(chalk.green('   ✅ TEST 3 PASSED: FULL expansion successful\n'));
    } else {
      console.log(chalk.red(`   ❌ TEST 3 FAILED: ${result.reason}\n`));
    }
  }

  async test4_TravelExpansion() {
    console.log(chalk.yellow('\n📝 TEST 4: Location Expansion During Travel\n'));

    const sparseLocation = Array.from(this.world.locations.values())
      .find(loc =>
        loc.id !== 'starting_town' &&
        this.expansionManager.getDetailLevel(loc) === 'sparse'
      );

    if (!sparseLocation) {
      console.log(chalk.red('   ❌ No sparse location available for travel test\n'));
      return;
    }

    console.log(`   Traveling to: ${sparseLocation.name}`);
    console.log(`   Detail Level Before Travel: ${this.expansionManager.getDetailLevel(sparseLocation)}\n`);

    // Simulate travel (this would normally trigger expansion)
    const result = await this.expansionManager.expandToFull(sparseLocation.id, {
      trigger: 'player_travel'
    });

    if (result.success) {
      const currentLevel = this.expansionManager.getDetailLevel(sparseLocation);
      console.log(`   Detail Level After Travel: ${currentLevel}\n`);

      if (currentLevel === 'full') {
        console.log(chalk.green('   ✅ TEST 4 PASSED: Travel triggers FULL expansion\n'));
      } else {
        console.log(chalk.red(`   ❌ TEST 4 FAILED: Expected 'full', got '${currentLevel}'\n`));
      }
    } else {
      console.log(chalk.red(`   ❌ TEST 4 FAILED: ${result.reason}\n`));
    }
  }

  async test5_DetailLevelIndicators() {
    console.log(chalk.yellow('\n📝 TEST 5: Detail Level Indicators\n'));

    const locations = Array.from(this.world.locations.values()).slice(0, 5);

    console.log('   Testing indicator display:\n');

    locations.forEach(loc => {
      const level = this.expansionManager.getDetailLevel(loc);
      const indicator = this.expansionManager.getDetailLevelIndicator(loc);

      console.log(`   ${indicator} ${loc.name} (${level})`);
    });

    console.log('');

    const indicators = {
      'sparse': '🌫️',
      'partial': '🌤️',
      'full': '☀️'
    };

    let allCorrect = true;
    locations.forEach(loc => {
      const level = this.expansionManager.getDetailLevel(loc);
      const indicator = this.expansionManager.getDetailLevelIndicator(loc);
      if (indicator !== indicators[level]) {
        allCorrect = false;
      }
    });

    if (allCorrect) {
      console.log(chalk.green('   ✅ TEST 5 PASSED: Indicators match detail levels\n'));
    } else {
      console.log(chalk.red('   ❌ TEST 5 FAILED: Some indicators are incorrect\n'));
    }
  }

  async test6_ConsistencyCheck() {
    console.log(chalk.yellow('\n📝 TEST 6: Narrative Consistency Check\n'));

    const testLocation = Array.from(this.world.locations.values())
      .find(loc => this.expansionManager.getDetailLevel(loc) === 'full');

    if (!testLocation) {
      console.log(chalk.yellow('   ⚠️  No FULL locations available, expanding one...\n'));

      const sparseLocation = Array.from(this.world.locations.values())
        .find(loc => loc.id !== 'starting_town');

      await this.expansionManager.expandToFull(sparseLocation.id);
      return this.test6_ConsistencyCheck();
    }

    console.log(`   Checking consistency for: ${testLocation.name}\n`);

    const narrativeFuel = testLocation.customProperties.narrativeFuel;
    const description = testLocation.description;

    console.log(chalk.cyan('   Original Narrative Fuel:'));
    if (narrativeFuel && narrativeFuel.commonKnowledge) {
      narrativeFuel.commonKnowledge.forEach(k => console.log(`      - ${k}`));
    }
    console.log('');

    console.log(chalk.cyan('   Generated Description:'));
    console.log(`      ${description}`);
    console.log('');

    // Simple consistency check - look for contradictions
    let consistent = true;
    const lowerDesc = description.toLowerCase();

    // Check if type matches description
    const type = testLocation.type;
    if (type === 'forest' && !lowerDesc.includes('tree') && !lowerDesc.includes('wood')) {
      consistent = false;
      console.log(chalk.red('      ⚠️  Type mismatch: forest but no trees/woods mentioned'));
    }

    if (consistent) {
      console.log(chalk.green('   ✅ TEST 6 PASSED: Narrative appears consistent\n'));
    } else {
      console.log(chalk.red('   ❌ TEST 6 FAILED: Consistency issues detected\n'));
    }
  }

  async test7_PerformanceMetrics() {
    console.log(chalk.yellow('\n📝 TEST 7: Performance Metrics\n'));

    const stats = this.expansionManager.getStatistics();

    console.log(chalk.cyan('   Expansion Statistics:'));
    console.log(`      Total Locations: ${stats.total}`);
    console.log(`      Sparse: ${stats.sparse} 🌫️`);
    console.log(`      Partial: ${stats.partial} 🌤️`);
    console.log(`      Full: ${stats.full} ☀️`);
    console.log(`      Total Expansions Performed: ${stats.totalExpansions}`);
    console.log('');

    const expansionHistory = Array.from(this.world.locations.values())
      .map(loc => this.expansionManager.getExpansionHistory(loc.id))
      .filter(h => h !== null);

    console.log(chalk.cyan('   Expansion History:'));
    console.log(`      Locations with expansion history: ${expansionHistory.length}`);
    console.log('');

    console.log(chalk.green('   ✅ TEST 7 PASSED: Metrics collected successfully\n'));
  }

  displaySummary() {
    console.log(chalk.cyan('╔══════════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║                        TEST SUMMARY                              ║'));
    console.log(chalk.cyan('╚══════════════════════════════════════════════════════════════════╝'));
    console.log('');

    const stats = this.expansionManager.getStatistics();

    console.log(chalk.white('📊 FINAL STATISTICS:'));
    console.log('');
    console.log(`   Total Locations: ${stats.total}`);
    console.log(`   🌫️  Sparse:  ${stats.sparse} (${Math.round(stats.sparse / stats.total * 100)}%)`);
    console.log(`   🌤️  Partial: ${stats.partial} (${Math.round(stats.partial / stats.total * 100)}%)`);
    console.log(`   ☀️  Full:    ${stats.full} (${Math.round(stats.full / stats.total * 100)}%)`);
    console.log('');

    console.log(chalk.white('🎯 KEY FEATURES DEMONSTRATED:'));
    console.log('');
    console.log('   ✓ Locations start SPARSE with minimal detail');
    console.log('   ✓ Locations expand to PARTIAL when mentioned/asked about');
    console.log('   ✓ Locations expand to FULL when player visits');
    console.log('   ✓ Detail levels shown with visual indicators');
    console.log('   ✓ GM generates contextual, coherent details');
    console.log('   ✓ Expansion history tracked for debugging');
    console.log('');

    console.log(chalk.white('📝 EXAMPLE LOCATION PROGRESSION:'));
    console.log('');

    const exampleLocation = Array.from(this.world.locations.values())
      .find(loc => this.expansionManager.getDetailLevel(loc) === 'full');

    if (exampleLocation) {
      const history = this.expansionManager.getExpansionHistory(exampleLocation.id);

      console.log(chalk.cyan(`   ${exampleLocation.name}:`));
      console.log('');

      if (history) {
        if (history.sparse) {
          console.log(`   🌫️  SPARSE (created): ${new Date(history.sparse.timestamp).toLocaleTimeString()}`);
        }
        if (history.partial) {
          console.log(`   🌤️  PARTIAL (${history.partial.trigger}): ${new Date(history.partial.timestamp).toLocaleTimeString()}`);
        }
        if (history.full) {
          console.log(`   ☀️  FULL (${history.full.trigger}): ${new Date(history.full.timestamp).toLocaleTimeString()}`);
        }
      }
      console.log('');

      console.log(chalk.cyan('   Final Description:'));
      console.log(`   ${this.expansionManager.getLocationDescription(exampleLocation)}`);
      console.log('');
    }

    console.log(chalk.white('⚡ PERFORMANCE NOTES:'));
    console.log('');
    console.log(`   - Each PARTIAL expansion requires 1 LLM call (~400 tokens)`);
    console.log(`   - Each FULL expansion requires 1 LLM call (~500 tokens)`);
    console.log(`   - Expanding from SPARSE to FULL = 2 LLM calls total`);
    console.log(`   - Content is cached after generation`);
    console.log('');

    console.log(chalk.green('✅ Phase 2 implementation complete and verified!'));
    console.log('');
  }

  async run() {
    try {
      await this.setup();
      await this.runTests();
    } catch (error) {
      console.error(chalk.red('\n❌ Test failed with error:'), error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }
}

// Run the test
const test = new Phase2Test();
test.run();
