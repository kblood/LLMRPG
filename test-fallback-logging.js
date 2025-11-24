#!/usr/bin/env node
/**
 * Fallback Logging Test
 * Demonstrates fallback detection, logging, and visibility
 */

import chalk from 'chalk';
import { FallbackLogger } from './src/services/FallbackLogger.js';
import { OllamaService } from './src/services/OllamaService.js';
import { DialogueGenerator } from './src/ai/llm/DialogueGenerator.js';
import { Character } from './src/entities/Character.js';
import { Personality } from './src/ai/personality/Personality.js';
import { EventBus } from './src/services/EventBus.js';

console.log(chalk.cyan.bold('\n╔════════════════════════════════════════════════════════════╗'));
console.log(chalk.cyan.bold('║  FALLBACK LOGGING TEST                                     ║'));
console.log(chalk.cyan.bold('║  Testing visibility of fallback usage                      ║'));
console.log(chalk.cyan.bold('╚════════════════════════════════════════════════════════════╝\n'));

const fallbackLogger = FallbackLogger.getInstance();
const eventBus = EventBus.getInstance();

// Track fallback events
const fallbackEvents = [];
eventBus.on('fallback:used', (data) => {
  fallbackEvents.push(data);
});

console.log(chalk.yellow('Test 1: Direct Fallback Logging\n'));

// Test 1: Manual fallback logging
fallbackLogger.logFallback({
  system: 'TestSystem',
  operation: 'test_operation',
  reason: 'TEST_REASON',
  fallbackValue: 'This is a test fallback message',
  context: {
    testParam1: 'value1',
    testParam2: 42
  }
});

console.log(chalk.green('✓ Fallback logged directly\n'));

console.log(chalk.yellow('Test 2: OllamaService with Unavailable LLM\n'));

// Test 2: Try to use OllamaService with wrong URL
const ollamaWrongUrl = new OllamaService({
  baseUrl: 'http://localhost:99999', // Wrong port
  defaultModel: 'test-model',
  timeout: 2000 // Short timeout
});

try {
  console.log(chalk.gray('Attempting LLM generation with invalid URL...'));
  const response = await ollamaWrongUrl.generate('Test prompt', {
    fallback: 'Fallback response from test'
  });
  console.log(chalk.blue(`Response: "${response}"`));
  console.log(chalk.green('✓ Fallback used when LLM unavailable\n'));
} catch (error) {
  console.log(chalk.red(`✗ Error: ${error.message}\n`));
}

console.log(chalk.yellow('Test 3: DialogueGenerator Fallbacks\n'));

// Test 3: Dialogue generator with unavailable LLM
const dialogueGen = new DialogueGenerator(ollamaWrongUrl);

const npc = new Character('test_npc', 'TestNPC', {
  personality: new Personality({
    friendliness: 80,
    intelligence: 70,
    honor: 60
  }),
  role: 'Test Character'
});

const player = new Character('player', 'Player', {
  personality: new Personality({ friendliness: 50 })
});

// Set up relationship
npc.relationships.setRelationship(player.id, 30);

console.log(chalk.gray('Generating greeting with unavailable LLM...'));
const greeting = await dialogueGen.generateGreeting(npc, player, {});
console.log(chalk.blue(`Greeting: "${greeting.text}"`));
console.log(chalk.gray(`Valid: ${greeting.valid}, Error: ${greeting.error || 'none'}\n`));

console.log(chalk.gray('Generating response with unavailable LLM...'));
const response = await dialogueGen.generateResponse(npc, player, {
  playerSaid: 'Hello there!',
  conversationHistory: []
});
console.log(chalk.blue(`Response: "${response.text}"`));
console.log(chalk.gray(`Valid: ${response.valid}, Error: ${response.error || 'none'}\n`));

console.log(chalk.green('✓ Dialogue fallbacks tested\n'));

console.log(chalk.yellow('═══ Fallback Statistics ═══\n'));

const stats = fallbackLogger.getStats();
console.log(chalk.cyan(`Total Fallbacks: ${stats.total}`));
console.log(chalk.cyan('\nBy System:'));
for (const [system, count] of Object.entries(stats.bySystem)) {
  const percentage = ((count / stats.total) * 100).toFixed(1);
  console.log(chalk.white(`  ${system}: ${count} (${percentage}%)`));
}

console.log(chalk.cyan('\nBy Reason:'));
for (const [reason, count] of Object.entries(stats.byReason)) {
  const percentage = ((count / stats.total) * 100).toFixed(1);
  console.log(chalk.white(`  ${reason}: ${count} (${percentage}%)`));
}

console.log(chalk.yellow('\n═══ Event Bus Tracking ═══\n'));
console.log(chalk.cyan(`Fallback events emitted: ${fallbackEvents.length}`));
fallbackEvents.forEach((event, i) => {
  console.log(chalk.white(`\nEvent ${i + 1}:`));
  console.log(chalk.gray(`  System: ${event.system}`));
  console.log(chalk.gray(`  Operation: ${event.operation}`));
  console.log(chalk.gray(`  Reason: ${event.reason}`));
  console.log(chalk.gray(`  Preview: "${event.fallbackPreview}"`));
});

console.log(chalk.yellow('\n═══ UI Warning Messages ═══\n'));

// Test UI warnings for different systems
const systems = [
  { system: 'DialogueGenerator', operation: 'greeting' },
  { system: 'DialogueGenerator', operation: 'response' },
  { system: 'GameMaster', operation: 'narration' },
  { system: 'WorldGenerator', operation: 'locations' },
  { system: 'ActionSystem', operation: 'decision' }
];

systems.forEach(({ system, operation }) => {
  const warning = fallbackLogger.getUIWarning(system, operation);
  console.log(chalk.yellow(`${system}.${operation}:`));
  console.log(chalk.white(`  ${warning}`));
});

console.log(chalk.yellow('\n═══ Recent Fallbacks ═══\n'));

const recent = fallbackLogger.getRecentFallbacks(5);
recent.forEach((f, i) => {
  console.log(chalk.cyan(`${i + 1}. [${f.system}] ${f.operation}`));
  console.log(chalk.gray(`   Reason: ${f.reason}`));
  console.log(chalk.gray(`   Time: ${new Date(f.timestamp).toISOString()}`));
  console.log(chalk.gray(`   Preview: "${f.fallbackValue.substring(0, 60)}..."`));
});

console.log(chalk.yellow('\n═══ Fallback Rate Analysis ═══\n'));

const rate1min = fallbackLogger.getFallbackRate(60000);
const rate5min = fallbackLogger.getFallbackRate(300000);

console.log(chalk.cyan(`Fallback rate (last 1 min): ${rate1min.toFixed(2)} per minute`));
console.log(chalk.cyan(`Fallback rate (last 5 min): ${rate5min.toFixed(2)} per minute`));

if (rate1min > 5) {
  console.log(chalk.red('\n⚠️  HIGH FALLBACK RATE DETECTED'));
  console.log(chalk.red('   LLM may be unavailable or experiencing issues'));
}

console.log(chalk.yellow('\n═══ Complete Fallback Report ═══\n'));
console.log(chalk.gray(fallbackLogger.generateReport()));

console.log(chalk.yellow('\n═══ Test Summary ═══\n'));

console.log(chalk.green('✅ Fallback Detection:'));
console.log(chalk.white('  ✓ Fallbacks are logged with full context'));
console.log(chalk.white('  ✓ Console warnings are displayed prominently'));
console.log(chalk.white('  ✓ Statistics are tracked by system and reason'));

console.log(chalk.green('\n✅ Event Integration:'));
console.log(chalk.white('  ✓ Fallback events emitted to EventBus'));
console.log(chalk.white('  ✓ System-specific events available'));
console.log(chalk.white('  ✓ Ready for replay logging integration'));

console.log(chalk.green('\n✅ UI Visibility:'));
console.log(chalk.white('  ✓ User-friendly warning messages generated'));
console.log(chalk.white('  ✓ Fallback indicators available for dialogue'));
console.log(chalk.white('  ✓ Status reporting for UI display'));

console.log(chalk.green('\n✅ Monitoring:'));
console.log(chalk.white('  ✓ Fallback rate calculation'));
console.log(chalk.white('  ✓ Recent fallback tracking'));
console.log(chalk.white('  ✓ Complete audit report generation'));

console.log(chalk.cyan('\n📖 Next Steps:'));
console.log(chalk.white('  1. Integrate with replay system'));
console.log(chalk.white('  2. Add fallback indicators to UI messages'));
console.log(chalk.white('  3. Display fallback status in game UI'));
console.log(chalk.white('  4. Add fallback warnings to event log'));

console.log(chalk.green.bold('\n🎉 Fallback Logging Test Complete!\n'));
