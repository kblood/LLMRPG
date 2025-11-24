#!/usr/bin/env node
/**
 * Test for Unnecessary Fallbacks
 * Check if fallbacks are being triggered when Ollama is available
 */

import chalk from 'chalk';
import { OllamaService } from './src/services/OllamaService.js';
import { DialogueGenerator } from './src/ai/llm/DialogueGenerator.js';
import { Character } from './src/entities/Character.js';
import { Personality } from './src/ai/personality/Personality.js';
import { FallbackLogger } from './src/services/FallbackLogger.js';

console.log(chalk.cyan.bold('\n╔════════════════════════════════════════════════════════════╗'));
console.log(chalk.cyan.bold('║  TESTING FOR UNNECESSARY FALLBACKS                         ║'));
console.log(chalk.cyan.bold('║  Checking if fallbacks trigger when LLM is available       ║'));
console.log(chalk.cyan.bold('╚════════════════════════════════════════════════════════════╝\n'));

const fallbackLogger = FallbackLogger.getInstance();

// Test 1: Check Ollama availability
console.log(chalk.yellow('Test 1: Checking Ollama Availability\n'));

const ollamaService = OllamaService.getInstance({
  defaultModel: 'llama3.1:8b',
  timeout: 30000
});

const isAvailable = await ollamaService.isAvailable();

if (!isAvailable) {
  console.log(chalk.red('✗ Ollama is NOT available'));
  console.log(chalk.yellow('Please start Ollama: ollama serve'));
  console.log(chalk.gray('This test requires Ollama to be running\n'));
  process.exit(1);
}

console.log(chalk.green('✓ Ollama is available'));
console.log(chalk.gray(`  URL: ${ollamaService.baseUrl}`));
console.log(chalk.gray(`  Model: ${ollamaService.defaultModel}\n`));

// Test 2: Simple LLM generation
console.log(chalk.yellow('Test 2: Simple LLM Generation\n'));

try {
  const simpleResponse = await ollamaService.generate('Say hello in one sentence.', {
    temperature: 0.7
  });
  
  console.log(chalk.green('✓ LLM generation successful'));
  console.log(chalk.blue(`  Response: "${simpleResponse.substring(0, 100)}${simpleResponse.length > 100 ? '...' : ''}"`));
  
  const statsBefore = fallbackLogger.getStats();
  if (statsBefore.total > 0) {
    console.log(chalk.red(`\n⚠️  WARNING: ${statsBefore.total} fallback(s) detected during simple generation!`));
  }
  console.log('');
} catch (error) {
  console.log(chalk.red('✗ LLM generation failed'));
  console.log(chalk.red(`  Error: ${error.message}\n`));
}

// Test 3: Dialogue generation with real setup
console.log(chalk.yellow('Test 3: Dialogue Generation (Greeting)\n'));

const dialogueGen = new DialogueGenerator(ollamaService);

const npc = new Character('mara', 'Mara', {
  role: 'Tavern Keeper',
  personality: new Personality({
    friendliness: 85,
    intelligence: 65,
    caution: 45,
    honor: 80,
    greed: 20,
    aggression: 25
  })
});

const player = new Character('player', 'Adventurer', {
  role: 'Wanderer',
  personality: new Personality({
    friendliness: 65,
    intelligence: 70,
    caution: 50
  })
});

npc.relationships.setRelationship(player.id, 45);

const statsBefore = fallbackLogger.getStats();

try {
  console.log(chalk.gray('Generating greeting...'));
  const greeting = await dialogueGen.generateGreeting(npc, player, {});
  
  const statsAfter = fallbackLogger.getStats();
  const newFallbacks = statsAfter.total - statsBefore.total;
  
  console.log(chalk.green('✓ Greeting generated'));
  console.log(chalk.blue(`  Text: "${greeting.text}"`));
  console.log(chalk.gray(`  Valid: ${greeting.valid}`));
  console.log(chalk.gray(`  Has error: ${!!greeting.error}`));
  
  if (newFallbacks > 0) {
    console.log(chalk.red(`\n⚠️  WARNING: ${newFallbacks} fallback(s) triggered during greeting!`));
    const recent = fallbackLogger.getRecentFallbacks(newFallbacks);
    recent.forEach(f => {
      console.log(chalk.yellow(`  - [${f.system}] ${f.operation}: ${f.reason}`));
    });
  } else {
    console.log(chalk.green('\n✓ No fallbacks triggered'));
  }
  console.log('');
} catch (error) {
  console.log(chalk.red('✗ Greeting generation failed'));
  console.log(chalk.red(`  Error: ${error.message}\n`));
}

// Test 4: Dialogue response
console.log(chalk.yellow('Test 4: Dialogue Generation (Response)\n'));

const statsBeforeResponse = fallbackLogger.getStats();

try {
  console.log(chalk.gray('Generating response...'));
  const response = await dialogueGen.generateResponse(npc, player, {
    playerSaid: "I heard there have been some problems lately.",
    conversationHistory: []
  });
  
  const statsAfterResponse = fallbackLogger.getStats();
  const newFallbacks = statsAfterResponse.total - statsBeforeResponse.total;
  
  console.log(chalk.green('✓ Response generated'));
  console.log(chalk.blue(`  Text: "${response.text}"`));
  console.log(chalk.gray(`  Valid: ${response.valid}`));
  console.log(chalk.gray(`  Has error: ${!!response.error}`));
  
  if (newFallbacks > 0) {
    console.log(chalk.red(`\n⚠️  WARNING: ${newFallbacks} fallback(s) triggered during response!`));
    const recent = fallbackLogger.getRecentFallbacks(newFallbacks);
    recent.forEach(f => {
      console.log(chalk.yellow(`  - [${f.system}] ${f.operation}: ${f.reason}`));
    });
  } else {
    console.log(chalk.green('\n✓ No fallbacks triggered'));
  }
  console.log('');
} catch (error) {
  console.log(chalk.red('✗ Response generation failed'));
  console.log(chalk.red(`  Error: ${error.message}\n`));
}

// Test 5: Multiple generations to check consistency
console.log(chalk.yellow('Test 5: Multiple Generations (Consistency Check)\n'));

const statsBeforeMultiple = fallbackLogger.getStats();
let successCount = 0;
let failCount = 0;

for (let i = 0; i < 5; i++) {
  try {
    const testGreeting = await dialogueGen.generateGreeting(npc, player, {});
    if (testGreeting.valid !== false) {
      successCount++;
    } else {
      failCount++;
    }
  } catch (error) {
    failCount++;
  }
}

const statsAfterMultiple = fallbackLogger.getStats();
const newFallbacks = statsAfterMultiple.total - statsBeforeMultiple.total;

console.log(chalk.cyan(`Generated 5 greetings:`));
console.log(chalk.green(`  Successful: ${successCount}`));
console.log(chalk.red(`  Failed: ${failCount}`));

if (newFallbacks > 0) {
  console.log(chalk.red(`\n⚠️  WARNING: ${newFallbacks} fallback(s) in ${successCount + failCount} generations!`));
  console.log(chalk.yellow(`  Fallback rate: ${((newFallbacks / 5) * 100).toFixed(1)}%`));
} else {
  console.log(chalk.green('\n✓ No fallbacks triggered in multiple generations'));
}
console.log('');

// Final Summary
console.log(chalk.yellow('═══ Test Summary ═══\n'));

const finalStats = fallbackLogger.getStats();

if (finalStats.total === 0) {
  console.log(chalk.green('🎉 EXCELLENT: No fallbacks detected!'));
  console.log(chalk.white('   All LLM generations worked correctly.'));
  console.log(chalk.white('   Fallback system is properly configured.\n'));
} else {
  console.log(chalk.red(`⚠️  ISSUE DETECTED: ${finalStats.total} fallback(s) occurred`));
  console.log(chalk.yellow('   Ollama is available but fallbacks were triggered.\n'));
  
  console.log(chalk.cyan('Fallback Breakdown:'));
  for (const [system, count] of Object.entries(finalStats.bySystem)) {
    console.log(chalk.white(`  ${system}: ${count}`));
  }
  
  console.log(chalk.cyan('\nReasons:'));
  for (const [reason, count] of Object.entries(finalStats.byReason)) {
    console.log(chalk.white(`  ${reason}: ${count}`));
  }
  
  console.log(chalk.cyan('\nRecent Fallbacks:'));
  const recent = fallbackLogger.getRecentFallbacks(5);
  recent.forEach((f, i) => {
    console.log(chalk.yellow(`  ${i + 1}. [${f.system}] ${f.operation}`));
    console.log(chalk.gray(`     Reason: ${f.reason}`));
    console.log(chalk.gray(`     Error: ${f.error?.message || 'none'}`));
  });
  
  console.log(chalk.yellow('\n📋 Possible Causes:'));
  console.log(chalk.white('  1. Model not loaded - first generation may be slow'));
  console.log(chalk.white('  2. Timeout too short - increase timeout setting'));
  console.log(chalk.white('  3. Network issue - check Ollama connection'));
  console.log(chalk.white('  4. Model mismatch - verify model is available'));
  console.log(chalk.white('  5. Prompt too large - reduce prompt size\n'));
}

// Service statistics
const serviceStats = ollamaService.stats;
console.log(chalk.cyan('OllamaService Statistics:'));
console.log(chalk.white(`  Total calls: ${serviceStats.totalCalls}`));
console.log(chalk.white(`  Cache hits: ${serviceStats.cacheHits}`));
console.log(chalk.white(`  Errors: ${serviceStats.errors}`));
console.log(chalk.white(`  Total tokens: ${serviceStats.totalTokens}`));

if (serviceStats.errors > 0 && finalStats.total === 0) {
  console.log(chalk.yellow('\n⚠️  Note: Errors occurred but fallbacks not logged'));
  console.log(chalk.yellow('   This may indicate inconsistent error handling\n'));
}

console.log('');
console.log(chalk.green.bold('Test Complete!\n'));
