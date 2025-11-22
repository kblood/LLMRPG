#!/usr/bin/env node
/**
 * Theme Generation Test
 * Tests the dynamic theme-based content generation system
 */

import chalk from 'chalk';
import { ThemeEngine } from './src/systems/theme/ThemeEngine.js';
import { DynamicContentGenerator } from './src/systems/theme/DynamicContentGenerator.js';
import { GameMaster } from './src/systems/GameMaster.js';
import { OllamaService } from './src/services/OllamaService.js';
import { EventBus } from './src/services/EventBus.js';
import { Character } from './src/entities/Character.js';

console.log(chalk.cyan.bold('\n╔════════════════════════════════════════════════════════════╗'));
console.log(chalk.cyan.bold('║  THEME GENERATION TEST                                     ║'));
console.log(chalk.cyan.bold('║  Dynamic storytelling with theme-aware content             ║'));
console.log(chalk.cyan.bold('╚════════════════════════════════════════════════════════════╝\n'));

// Initialize services
const ollama = OllamaService.getInstance();
const eventBus = EventBus.getInstance();

// Create systems
const themeEngine = new ThemeEngine();
const contentGenerator = new DynamicContentGenerator(themeEngine, ollama);
const gameMaster = new GameMaster(ollama, eventBus);

// Configure game master
gameMaster.setThemeEngine(themeEngine);
gameMaster.setContentGenerator(contentGenerator);

// Create player
const player = new Character('player', 'Kael', {
  role: 'protagonist',
  backstory: 'A curious wanderer seeking their destiny',
  personality: { friendliness: 70 }
});

async function testTheme(themeKey) {
  console.log(chalk.yellow.bold(`\n═══ Testing Theme: ${themeKey.toUpperCase()} ═══\n`));

  try {
    // Set theme
    const theme = themeEngine.setTheme(themeKey);
    console.log(chalk.green(`✓ Theme Set: ${theme.name}`));
    console.log(`  Description: ${theme.description}\n`);

    // Generate themed opening narration
    console.log(chalk.cyan('📖 Generating Themed Opening Narration...'));
    const opening = await gameMaster.generateThemedOpeningNarration(player, themeKey);
    console.log(chalk.gray(`\n${opening}\n`));

    // Generate NPCs
    console.log(chalk.cyan('👥 Generating Themed NPCs...'));
    const npcs = await contentGenerator.generateNPCRoster(2, {});
    npcs.forEach((npc, idx) => {
      console.log(chalk.green(`\n  NPC ${idx + 1}: ${npc.name}`));
      console.log(`  Role: ${npc.role}`);
      console.log(`  Archetype: ${npc.archetype}`);
      console.log(`  Backstory: ${npc.backstory}`);
    });

    // Generate quest
    console.log(chalk.cyan('\n⚔️  Generating Themed Quest...'));
    const quest = await contentGenerator.generateQuest({});
    console.log(chalk.green(`  Title: ${quest.title}`));
    console.log(`  Type: ${quest.type}`);
    console.log(`  Description: ${quest.description}`);
    console.log(`  Objectives:`);
    quest.objectives.forEach(obj => console.log(`    - ${obj}`));

    // Generate item
    console.log(chalk.cyan('\n🎁 Generating Themed Item...'));
    const item = await contentGenerator.generateItem({ category: 'artifacts' });
    console.log(chalk.green(`  Name: ${item.name}`));
    console.log(`  Type: ${item.type}`);
    console.log(`  Rarity: ${item.rarity}`);
    console.log(`  Description: ${item.description}`);

    // Generate location
    console.log(chalk.cyan('\n🏰 Generating Themed Location...'));
    const location = await contentGenerator.generateLocation({});
    console.log(chalk.green(`  Name: ${location.name}`));
    console.log(`  Type: ${location.type}`);
    console.log(`  Atmosphere: ${location.atmosphere}`);
    console.log(`  Description: ${location.description}`);

    console.log(chalk.green('\n✓ Theme test completed successfully!\n'));

  } catch (error) {
    console.error(chalk.red(`✗ Error testing theme: ${error.message}\n`));
  }
}

async function testAvailableThemes() {
  console.log(chalk.cyan.bold('\n═══ Available Themes ═══\n'));

  const themes = themeEngine.getAvailableThemes();
  themes.forEach((theme, idx) => {
    console.log(chalk.green(`${idx + 1}. ${theme.name}`));
    console.log(`   ${theme.description}\n`);
  });
}

async function runTests() {
  try {
    // Check Ollama
    console.log('🔌 Checking Ollama service...');
    const ollamaReady = await ollama.isAvailable();
    if (!ollamaReady) {
      console.warn(chalk.yellow('⚠️  Ollama not available - using fallback narrations'));
    } else {
      console.log(chalk.green('✓ Ollama is ready\n'));
    }

    // Show available themes
    await testAvailableThemes();

    // Test Fantasy theme
    await testTheme('fantasy');

    // Test Sci-Fi theme
    await testTheme('sci-fi');

    // Test Cthulhu theme
    await testTheme('cthulhu');

    // Test Steampunk theme
    await testTheme('steampunk');

    console.log(chalk.green.bold('\n✓ All theme tests completed successfully!\n'));

  } catch (error) {
    console.error(chalk.red(`\n✗ Test failed: ${error.message}\n`));
    process.exit(1);
  }

  process.exit(0);
}

runTests();
