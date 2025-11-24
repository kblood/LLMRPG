#!/usr/bin/env node
/**
 * Autonomous Themed Game Test
 * Uses the same theme system as the UI to generate a complete themed world
 * with dynamic NPCs, then runs autonomous gameplay
 */

import chalk from 'chalk';
import { GameSession } from './src/game/GameSession.js';
import { Character } from './src/entities/Character.js';
import { Personality } from './src/ai/personality/Personality.js';
import { DialogueSystem } from './src/systems/dialogue/DialogueSystem.js';
import { GameMaster } from './src/systems/GameMaster.js';
import { OllamaService } from './src/services/OllamaService.js';
import { EventBus } from './src/services/EventBus.js';
import { ReplayLogger } from './src/replay/ReplayLogger.js';
import { DialogueGenerator } from './src/ai/llm/DialogueGenerator.js';
import { FallbackLogger } from './src/services/FallbackLogger.js';
import { FallbackReplayIntegration } from './src/services/FallbackReplayIntegration.js';
import { ThemedWorldGenerator } from './src/services/ThemedWorldGenerator.js';
import { AutonomousGameService } from './src/services/AutonomousGameService.js';
import { ActionSystem } from './src/systems/actions/ActionSystem.js';
import { CombatSystem } from './src/systems/combat/CombatSystem.js';
import { CombatEncounterSystem } from './src/systems/combat/CombatEncounterSystem.js';
import { LocationGrid } from './src/systems/grid/LocationGrid.js';
import fs from 'fs';
import path from 'path';

console.log(chalk.cyan.bold('\n╔════════════════════════════════════════════════════════════╗'));
console.log(chalk.cyan.bold('║  AUTONOMOUS THEMED GAME TEST                               ║'));
console.log(chalk.cyan.bold('║  Using SHARED autonomous game loop (same as UI)            ║'));
console.log(chalk.cyan.bold('╚════════════════════════════════════════════════════════════╝\n'));

// Configuration
const CONFIG = {
  gameSeed: Date.now(),
  maxTurnsPerConversation: 8,
  maxIterations: 10, // Test runs fixed number of iterations
  replayDir: './replays',
  model: 'llama3.1:8b',
  temperature: 0.8,
  theme: 'fantasy', // Can be: fantasy, sci-fi, cthulhu, steampunk, dark_fantasy
  npcCount: 5
};

// Initialize services
const ollama = OllamaService.getInstance();
const eventBus = EventBus.getInstance();
const replayLogger = new ReplayLogger(CONFIG.gameSeed);
const fallbackLogger = FallbackLogger.getInstance();

// Initialize fallback replay integration
FallbackReplayIntegration.initialize(replayLogger);

// Game session
const session = new GameSession({
  seed: CONFIG.gameSeed,
  model: CONFIG.model,
  temperature: CONFIG.temperature
});

/**
 * Main test function
 */
async function runTest() {
  try {
    // Check Ollama
    console.log('🔌 Checking Ollama service...\n');
    const ollamaReady = await ollama.isAvailable();
    
    if (!ollamaReady) {
      console.log(chalk.red('✗ Ollama not available'));
      console.log(chalk.yellow('Please start Ollama: ollama serve\n'));
      process.exit(1);
    }
    
    console.log(chalk.green('✓ Ollama is ready\n'));

    // Initialize replay
    console.log('Initializing replay system...\n');
    const initialState = {
      seed: CONFIG.gameSeed,
      theme: CONFIG.theme,
      model: CONFIG.model,
      frame: 0,
      time: 0
    };
    replayLogger.initialize(initialState);
    replayLogger.logEvent(0, 'game_start', {
      seed: CONFIG.gameSeed,
      theme: CONFIG.theme,
      model: CONFIG.model
    });

    // Generate themed world using shared service (same as UI!)
    console.log(chalk.cyan('═══ Generating Themed World ═══\n'));
    console.log(chalk.gray(`Using ThemedWorldGenerator service (shared with UI)\n`));
    
    const worldGenerator = new ThemedWorldGenerator(ollama, eventBus);
    const worldData = await worldGenerator.generateMinimalThemedWorld({
      theme: CONFIG.theme,
      playerName: 'Kael',
      npcCount: CONFIG.npcCount
    });

    // Extract generated data
    const protagonist = worldData.player;
    const allNPCs = worldData.npcs;
    const gameMaster = worldData.gameMaster;

    console.log(chalk.magenta('\n📖 Opening Narration:\n'));
    console.log(chalk.gray(worldData.openingNarration));
    console.log('');

    // Add characters to session
    console.log(chalk.yellow('═══ Character Creation ═══\n'));
    session.addCharacter(protagonist);
    
    console.log(chalk.green(`✓ Protagonist: ${protagonist.name}`));
    console.log(chalk.gray(`  ${protagonist.backstory}`));
    console.log(chalk.gray(`  Personality: Friendly (${protagonist.personality.friendliness}), ` +
                           `Intelligent (${protagonist.personality.intelligence}), ` +
                           `Honorable (${protagonist.personality.honor})\n`));

    console.log(chalk.white(`Adding ${allNPCs.length} themed NPCs to game...\n`));
    
    allNPCs.forEach(npc => {
      session.addCharacter(npc);
      console.log(chalk.gray(`  ✓ ${npc.name} - ${npc.role} (${npc.customProperties?.archetype || 'unknown'})`));
    });

    console.log(chalk.green(`\n✓ Created ${session.characters.size} characters\n`));

    // Initialize combat and action systems (same as UI!)
    console.log(chalk.yellow('═══ Initializing Game Systems ═══\n'));
    
    const locationGrid = new LocationGrid();
    
    // Initialize quest manager if not present
    if (!session.questManager) {
      const { QuestManager } = await import('./src/systems/quest/QuestManager.js');
      session.questManager = new QuestManager(session);
    }
    
    const actionSystem = new ActionSystem(gameMaster, session);
    const combatEncounterSystem = new CombatEncounterSystem(session, {
      baseEncounterChance: 0.2 // 20% base encounter chance
    });
    const combatSystem = new CombatSystem(gameMaster, session, {
      pauseBetweenRounds: 0 // No pause in test mode
    });
    
    // Create NPC map for service
    const npcsMap = new Map();
    allNPCs.forEach(npc => npcsMap.set(npc.id, npc));
    
    console.log(chalk.green('✓ Action System initialized'));
    console.log(chalk.green('✓ Combat System initialized'));
    console.log(chalk.green('✓ Combat Encounter System initialized\n'));

    // Start autonomous gameplay using shared service
    console.log(chalk.cyan.bold('\n╔════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║  AUTONOMOUS GAMEPLAY STARTING                              ║'));
    console.log(chalk.cyan.bold('║  Using shared AutonomousGameService (same as UI!)          ║'));
    console.log(chalk.cyan.bold('╚════════════════════════════════════════════════════════════╝\n'));

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Track statistics
    let conversationCount = 0;
    let combatCount = 0;
    let actionCount = 0;
    let iteration = 0;

    // Create autonomous service (SAME AS UI!)
    const autonomousService = new AutonomousGameService({
      session: session,
      player: protagonist,
      npcs: npcsMap,
      gameMaster: gameMaster,
      actionSystem: actionSystem,
      combatSystem: combatSystem,
      combatEncounterSystem: combatEncounterSystem,
      replayLogger: replayLogger,
      ollama: ollama,
      eventBus: eventBus,
      locationGrid: locationGrid,
      autonomousConfig: {
        maxTurnsPerConversation: CONFIG.maxTurnsPerConversation,
        pauseBetweenTurns: 1000,
        pauseBetweenConversations: 1500,
        pauseBetweenActions: 1000
      },
      mainQuest: null,
      onEvent: (event, data) => {
        // Log events to console
        if (event === 'conversation_start') {
          conversationCount++;
          console.log(chalk.cyan(`\n╔════ Conversation ${conversationCount} ════╗`));
          console.log(chalk.cyan(`${protagonist.name} → ${data.npc.name}`));
          console.log(chalk.gray(data.narration));
        } else if (event === 'dialogue_line') {
          const prefix = data.speakerId === protagonist.id ? chalk.cyan('●') : chalk.yellow('●');
          console.log(`${prefix} ${chalk.white(data.speakerName)}: ${chalk.gray(data.text)}`);
        } else if (event === 'conversation_end') {
          console.log(chalk.cyan(`\n╚════ Conversation Ended (${data.turns} turns) ════╝`));
          console.log(chalk.gray(`Relationship: ${data.relationship.value} (${data.relationship.level})\n`));
        } else if (event === 'combat_encounter') {
          combatCount++;
          console.log(chalk.red(`\n⚔️  COMBAT ENCOUNTER ${combatCount}!`));
          console.log(chalk.red(data.description));
          data.enemies.forEach(enemy => {
            console.log(chalk.gray(`  • ${enemy.name} (Level ${enemy.level}) - ${enemy.hp}/${enemy.maxHP} HP`));
          });
        } else if (event === 'combat_result') {
          console.log(chalk.green(`\n✓ Combat ${data.outcome.toUpperCase()}!`));
          if (data.rewards) {
            console.log(chalk.yellow(`  Rewards: ${data.rewards.gold || 0} gold, ${data.rewards.xp || 0} XP`));
          }
          console.log('');
        } else if (event === 'action_decision') {
          iteration = data.iteration;
          actionCount++;
          console.log(chalk.magenta(`\n[Iteration ${iteration}] Action: ${data.type}`));
          console.log(chalk.gray(`  Reason: ${data.reason}`));
        } else if (event === 'action_result') {
          if (data.narration) {
            console.log(chalk.gray(`  ${data.narration}`));
          }
        } else if (event === 'error') {
          console.log(chalk.red(`\n✗ Error: ${data.message}`));
        }
      }
    });

    // Run game loop (SAME AS UI!)
    await autonomousService.runGameLoop({
      maxIterations: CONFIG.maxIterations
    });

    // Game summary
    console.log(chalk.cyan.bold('\n╔════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║  GAME SESSION COMPLETE                                     ║'));
    console.log(chalk.cyan.bold('╚════════════════════════════════════════════════════════════╝\n'));

    // Statistics
    const dialogueStats = session.dialogueSystem.getStatistics();
    const ollamaStats = ollama.getStatistics();

    console.log(chalk.yellow('Session Statistics:\n'));
    console.log(chalk.white('  Theme: ') + chalk.gray(worldData.theme));
    console.log(chalk.white('  Iterations: ') + chalk.gray(iteration));
    console.log(chalk.white('  Conversations: ') + chalk.gray(conversationCount));
    console.log(chalk.white('  Combat encounters: ') + chalk.gray(combatCount));
    console.log(chalk.white('  Actions: ') + chalk.gray(actionCount));
    console.log(chalk.white('  Dialogue turns: ') + chalk.gray(dialogueStats.totalDialogueTurns));
    console.log(chalk.white('  Game frames: ') + chalk.gray(session.frame));
    console.log(chalk.white('  Game time: ') + chalk.gray(session.getGameTimeString()));
    
    console.log(chalk.yellow('\nLLM Statistics:\n'));
    console.log(chalk.white('  Total LLM calls: ') + chalk.gray(ollamaStats.totalCalls));
    console.log(chalk.white('  Total tokens: ') + chalk.gray(ollamaStats.totalTokens));
    console.log(chalk.white('  Avg response time: ') + 
                chalk.gray(`${ollamaStats.averageResponseTime?.toFixed(0) || 0}ms`));

    console.log(chalk.yellow('\nReplay Statistics:\n'));
    console.log(chalk.white('  Events logged: ') + chalk.gray(replayLogger.getEventCount()));
    console.log(chalk.white('  LLM calls logged: ') + chalk.gray(replayLogger.getLLMCallCount()));
    console.log(chalk.white('  Checkpoints: ') + chalk.gray(replayLogger.getCheckpointCount()));

    // Fallback statistics
    const fallbackStats = fallbackLogger.getStats();
    console.log(chalk.yellow('\nFallback Statistics:\n'));
    console.log(chalk.white('  Total fallbacks: ') + 
                (fallbackStats.total > 0 ? chalk.red(fallbackStats.total) : chalk.green(fallbackStats.total)));
    
    if (fallbackStats.total > 0) {
      console.log(chalk.red('\n⚠️  WARNING: Fallbacks were used during gameplay!'));
      console.log(chalk.yellow('  By System:'));
      for (const [system, count] of Object.entries(fallbackStats.bySystem)) {
        console.log(chalk.gray(`    ${system}: ${count}`));
      }
      console.log(chalk.yellow('  By Reason:'));
      for (const [reason, count] of Object.entries(fallbackStats.byReason)) {
        console.log(chalk.gray(`    ${reason}: ${count}`));
      }
      
      const rate = fallbackLogger.getFallbackRate(300000);
      console.log(chalk.yellow(`  Fallback rate: ${rate.toFixed(2)}/min\n`));
      
      console.log(chalk.gray('  See console output above for detailed fallback warnings.\n'));
    } else {
      console.log(chalk.green('  ✓ No fallbacks used - all LLM generations successful!\n'));
    }

    // Save replay
    console.log(chalk.yellow('\n═══ Saving Replay ═══\n'));
    
    if (!fs.existsSync(CONFIG.replayDir)) {
      fs.mkdirSync(CONFIG.replayDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = path.join(
      CONFIG.replayDir, 
      `themed_${CONFIG.theme}_${timestamp}_${CONFIG.gameSeed}.json`
    );

    await replayLogger.save(filename);
    
    const stats = fs.statSync(filename);
    console.log(chalk.green(`✓ Replay saved: ${filename}`));
    console.log(chalk.gray(`  File size: ${(stats.size / 1024).toFixed(2)} KB\n`));

    // Show themed NPCs
    console.log(chalk.yellow('═══ Themed NPCs Generated ═══\n'));
    allNPCs.forEach(npc => {
      const rel = protagonist.relationships.getRelationship(npc.id);
      console.log(chalk.white(`  ${npc.name} (${npc.role})`));
      console.log(chalk.gray(`    Archetype: ${npc.customProperties?.archetype || 'Unknown'}`));
      console.log(chalk.gray(`    Relationship: ${rel.value} (${rel.level})`));
    });

    console.log(chalk.green.bold('\n✓ THEMED AUTONOMOUS GAME TEST COMPLETE!\n'));
    console.log(chalk.cyan('This test uses the SAME code as the UI:'));
    console.log(chalk.white(`• Theme: ${worldData.theme}`));
    console.log(chalk.white('• Shared ThemedWorldGenerator'));
    console.log(chalk.white('• Shared AutonomousGameService'));
    console.log(chalk.white('• Complete gameplay loop (dialogue + combat)'));
    console.log(chalk.white('• Combat encounter system'));
    console.log(chalk.white('• Action decision AI'));
    console.log(chalk.white('• Fallback logging and monitoring\n'));
    console.log(chalk.cyan(`Test completed with:`));
    console.log(chalk.white(`• ${conversationCount} conversations`));
    console.log(chalk.white(`• ${combatCount} combat encounters`));
    console.log(chalk.white(`• ${actionCount} total actions\n`));

    console.log(chalk.gray(`View replay with: node view-replay.js ${filename}\n`));

  } catch (error) {
    console.error(chalk.red('\n✗ Test failed:'), error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
runTest();
