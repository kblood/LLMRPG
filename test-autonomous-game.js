#!/usr/bin/env node
/**
 * Autonomous Game Test - Multiple AI agents playing the game
 * 
 * This test demonstrates the core concept of OllamaRPG:
 * ALL characters (including the protagonist) are AI-controlled,
 * creating emergent narratives through their interactions.
 * 
 * The test:
 * 1. Creates a protagonist AI and multiple NPC AIs
 * 2. Has the protagonist autonomously decide actions
 * 3. Lets NPCs respond naturally to protagonist
 * 4. Logs everything to a replay file
 * 5. Generates a session summary at the end
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
import { createAllNPCs } from './src/data/npc-roster.js';
import fs from 'fs';
import path from 'path';

console.log(chalk.cyan.bold('\n╔════════════════════════════════════════════════════════════╗'));
console.log(chalk.cyan.bold('║  AUTONOMOUS GAME TEST - AI vs AI                           ║'));
console.log(chalk.cyan.bold('║  All characters controlled by AI including protagonist     ║'));
console.log(chalk.cyan.bold('╚════════════════════════════════════════════════════════════╝\n'));

// Configuration
const CONFIG = {
  gameSeed: Date.now(),
  maxTurnsPerConversation: 10,
  maxConversations: 3,
  enableGameMaster: true,
  replayDir: './replays',
  model: 'llama3.1:8b',
  temperature: 0.8
};

// Initialize services
const ollama = OllamaService.getInstance();
const eventBus = EventBus.getInstance();
const replayLogger = new ReplayLogger(CONFIG.gameSeed);
const gameMaster = new GameMaster(ollama, eventBus);

// Game session
const session = new GameSession({
  seed: CONFIG.gameSeed,
  model: CONFIG.model,
  temperature: CONFIG.temperature
});

// Track events for replay
let eventCount = 0;

/**
 * Create an AI-controlled protagonist
 */
function createProtagonist() {
  const protagonist = new Character('protagonist', 'Kael', {
    role: 'protagonist',
    backstory: 'A curious wanderer who has just arrived in this village, seeking adventure and stories. ' +
               'Enjoys meeting new people and learning about their lives. Has a natural curiosity about mysteries.',
    personality: new Personality({
      friendliness: 70,
      intelligence: 75,
      caution: 55,
      honor: 80,
      greed: 35,
      aggression: 30
    }),
    age: 28
  });

  // Add some initial context/goals
  protagonist.memory.addMemory('goal', 'Learn about this village and its people', {
    importance: 80
  });
  protagonist.memory.addMemory('goal', 'Find interesting stories or opportunities for adventure', {
    importance: 75
  });
  protagonist.memory.addMemory('background', 'I am a traveling adventurer seeking purpose', {
    importance: 70
  });

  return protagonist;
}

/**
 * Have the protagonist AI decide what to say in a conversation
 */
async function protagonistDecideResponse(protagonist, npc, conversationHistory) {
  console.log(chalk.gray('  [Protagonist AI thinking...]'));
  
  // Build context for the protagonist's decision
  const recentHistory = conversationHistory.slice(-6); // Last 6 exchanges
  const historyText = recentHistory.map(turn => {
    return `${turn.speakerId === protagonist.id ? 'You' : npc.name}: ${turn.output || turn.input}`;
  }).join('\n');

  // Get protagonist's goals and memories
  const goals = protagonist.memory.getMemoriesByType('goal');
  const concerns = protagonist.memory.getMemoriesByType('concern');
  
  // Build prompt for protagonist to decide what to say
  const context = `You are ${protagonist.name}, ${protagonist.backstory}

Your personality:
${protagonist.personality.toDetailedDescription()}

Your current goals:
${goals.map(g => `- ${g.content}`).join('\n') || '- Learn more about this person'}

You are having a conversation with ${npc.name}, who is ${npc.occupation || 'a villager'}.
${npc.backstory ? `About them: ${npc.backstory}` : ''}

Recent conversation:
${historyText || '(conversation just started)'}

Based on your personality and goals, decide what to say next to ${npc.name}. 
${conversationHistory.length < 3 ? 'Keep it friendly and introduce yourself naturally.' : 'Continue the conversation meaningfully.'}
${conversationHistory.length > 7 ? 'Consider wrapping up the conversation politely if appropriate.' : ''}

Respond naturally in first person. Keep it concise (1-2 sentences).`;

  try {
    // Generate a deterministic seed for this protagonist's decision
    // Keep seed values reasonable for Ollama (positive 32-bit integer)
    const decisionSeed = Math.abs((CONFIG.gameSeed % 1000000) + conversationHistory.length);
    
    const response = await ollama.generate(context, {
      model: CONFIG.model,
      temperature: CONFIG.temperature,
      seed: decisionSeed
    });

    // Clean the response
    let text = response.response || response.text || '';
    text = text.trim();
    
    // Remove common LLM artifacts
    text = text.replace(/^(You say:|I say:|Response:|Protagonist:)\s*/i, '');
    text = text.replace(/^["']|["']$/g, '');
    text = text.split('\n')[0]; // Take first line only
    
    return text || 'Hello!';
  } catch (error) {
    console.log(chalk.yellow(`  ⚠ Protagonist AI error: ${error.message}`));
    // Fallback based on personality
    if (conversationHistory.length === 0) {
      return "Greetings! I'm new to this village.";
    } else if (conversationHistory.length > 7) {
      return "It was nice talking with you. I should be going.";
    } else {
      return "Tell me more about that.";
    }
  }
}

/**
 * Run an autonomous conversation between protagonist AI and NPC AI
 */
async function runAutonomousConversation(protagonist, npc, context = {}) {
  console.log(chalk.yellow(`\n═══ Starting Conversation: ${protagonist.name} → ${npc.name} ═══`));
  console.log(chalk.gray(`Location: ${context.location || 'Village'}`));
  console.log(chalk.gray(`Context: ${context.reason || 'Meeting for the first time'}\n`));

  // Log event
  replayLogger.logEvent(session.frame, 'conversation_started', {
    protagonistId: protagonist.id,
    npcId: npc.id,
    location: context.location
  }, protagonist.id);

  // Game Master sets the scene (if enabled)
  if (CONFIG.enableGameMaster) {
    const sceneContext = {
      location: context.location || 'village square',
      timeOfDay: session.getTimeOfDay(),
      npcsPresent: [npc.name],
      playerActions: [`approaching ${npc.name}`],
      mood: 'curious'
    };
    
    const narration = await gameMaster.narrateScene(sceneContext);
    console.log(chalk.cyan('🎭 Game Master:\n') + chalk.white.italic(narration) + '\n');
  }

  // Start the conversation
  const conversationId = await session.dialogueSystem.startConversation(npc, protagonist);
  const conversation = session.dialogueSystem.activeConversations.get(conversationId);

  if (!conversation) {
    console.log(chalk.red('✗ Failed to start conversation'));
    return;
  }

  // Show NPC's greeting
  if (conversation.history.length > 0) {
    const greeting = conversation.history[0];
    console.log(chalk.yellow(`${npc.name}: `) + chalk.white(greeting.output));
    
    replayLogger.logEvent(session.frame++, 'dialogue_line', {
      speakerId: npc.id,
      text: greeting.output
    }, npc.id);
  }

  // Conversation loop
  for (let turn = 0; turn < CONFIG.maxTurnsPerConversation; turn++) {
    // Protagonist decides what to say
    const protagonistResponse = await protagonistDecideResponse(
      protagonist, 
      npc, 
      conversation.history
    );

    // Check for exit intent
    const exitPhrases = ['goodbye', 'farewell', 'see you', 'be going', 'must go', 'should leave'];
    const wantsToExit = exitPhrases.some(phrase => 
      protagonistResponse.toLowerCase().includes(phrase)
    );

    console.log(chalk.cyan(`\n${protagonist.name}: `) + chalk.white(protagonistResponse));
    
    replayLogger.logEvent(session.frame++, 'dialogue_line', {
      speakerId: protagonist.id,
      text: protagonistResponse
    }, protagonist.id);

    if (wantsToExit) {
      console.log(chalk.gray(`\n${protagonist.name} decides to end the conversation.`));
      break;
    }

    // Small delay to show flow
    await new Promise(resolve => setTimeout(resolve, 500));

    // NPC responds
    console.log(chalk.gray('  [NPC AI thinking...]'));
    const npcResponse = await session.dialogueSystem.addTurn(
      conversationId, 
      npc.id, 
      protagonistResponse
    );

    if (npcResponse && npcResponse.text) {
      console.log(chalk.yellow(`${npc.name}: `) + chalk.white(npcResponse.text));
      
      replayLogger.logEvent(session.frame++, 'dialogue_line', {
        speakerId: npc.id,
        text: npcResponse.text
      }, npc.id);
    }

    // Check if NPC wants to end conversation
    const npcExitIntent = npcResponse && npcResponse.text && 
      exitPhrases.some(phrase => npcResponse.text.toLowerCase().includes(phrase));
    
    if (npcExitIntent) {
      console.log(chalk.gray(`\n${npc.name} politely ends the conversation.`));
      break;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // End conversation
  await session.dialogueSystem.endConversation(conversationId);
  
  replayLogger.logEvent(session.frame++, 'conversation_ended', {
    protagonistId: protagonist.id,
    npcId: npc.id,
    turns: conversation.history.length
  }, 'system');

  // Show relationship change
  const newRelationship = protagonist.relationships.getRelationship(npc.id);
  console.log(chalk.gray(`\nRelationship with ${npc.name}: ${newRelationship.value} (${newRelationship.level})`));
  
  // Create checkpoint
  replayLogger.logCheckpoint(session.frame, {
    frame: session.frame,
    conversationCompleted: conversationId,
    relationships: {
      [npc.id]: newRelationship.value
    }
  });

  console.log(chalk.yellow(`\n═══ Conversation Ended (${conversation.history.length} turns) ═══\n`));
}

/**
 * Have protagonist autonomously choose which NPC to talk to
 */
async function protagonistChooseNPC(protagonist, availableNPCs, pastConversations) {
  console.log(chalk.gray('  [Protagonist AI choosing who to talk to...]'));

  const npcsNotTalkedTo = availableNPCs.filter(npc => 
    !pastConversations.includes(npc.id)
  );

  // Build decision prompt
  const npcDescriptions = npcsNotTalkedTo.map((npc, i) => {
    return `${i + 1}. ${npc.name} - ${npc.occupation || 'Villager'}\n   ${npc.backstory || 'A local resident'}`;
  }).join('\n\n');

  const context = `You are ${protagonist.name}. ${protagonist.backstory}

You've arrived in a new village and want to meet the locals.

${pastConversations.length > 0 ? `You've already talked to: ${pastConversations.join(', ')}` : 'This is your first conversation in the village.'}

Available people to talk to:
${npcDescriptions}

Based on your personality and goals, which person seems most interesting to talk to?
${protagonist.personality.friendliness > 60 ? 'You enjoy meeting friendly people.' : ''}
${protagonist.personality.intelligence > 70 ? 'You prefer interesting, knowledgeable individuals.' : ''}
${protagonist.personality.caution > 60 ? 'You tend to approach people carefully.' : ''}

Choose by responding with just the number (1-${npcsNotTalkedTo.length}).`;

  try {
    // Generate a deterministic seed for this NPC choice
    // Keep seed values reasonable for Ollama (positive 32-bit integer)
    const choiceSeed = Math.abs((CONFIG.gameSeed % 1000000) + pastConversations.length * 100);
    
    const response = await ollama.generate(context, {
      model: CONFIG.model,
      temperature: 0.7,
      seed: choiceSeed
    });

    // Parse the choice
    const text = response.response || response.text || '1';
    const match = text.match(/(\d+)/);
    const choice = match ? parseInt(match[1]) : 1;
    
    // Validate choice
    const index = Math.max(0, Math.min(choice - 1, npcsNotTalkedTo.length - 1));
    return npcsNotTalkedTo[index];
    
  } catch (error) {
    console.log(chalk.yellow(`  ⚠ Decision error, choosing first NPC`));
    return npcsNotTalkedTo[0];
  }
}

/**
 * Main test execution
 */
async function runTest() {
  try {
    // Check Ollama availability
    console.log(chalk.gray('Checking Ollama service...\n'));
    const isAvailable = await ollama.isAvailable();
    
    if (!isAvailable) {
      console.log(chalk.red('✗ Ollama not available. Please start Ollama:'));
      console.log(chalk.gray('  ollama serve\n'));
      console.log(chalk.yellow('This test requires Ollama to simulate AI behavior.\n'));
      process.exit(1);
    }
    
    console.log(chalk.green('✓ Ollama is ready\n'));

    // Initialize replay logger
    console.log(chalk.gray('Initializing replay system...\n'));
    replayLogger.initialize({
      seed: CONFIG.gameSeed,
      startTime: Date.now(),
      characters: [],
      gameVersion: '1.0.0',
      testType: 'autonomous_ai_game'
    });

    replayLogger.logEvent(0, 'game_start', {
      seed: CONFIG.gameSeed,
      config: CONFIG
    }, 'system');

    // Create protagonist
    console.log(chalk.cyan('═══ Character Creation ═══\n'));
    const protagonist = createProtagonist();
    session.addCharacter(protagonist);
    
    console.log(chalk.white(`✓ Protagonist: ${protagonist.name}`));
    console.log(chalk.gray(`  ${protagonist.backstory}`));
    console.log(chalk.gray(`  Personality: Friendly (${protagonist.personality.friendliness}), ` +
                           `Intelligent (${protagonist.personality.intelligence}), ` +
                           `Honorable (${protagonist.personality.honor})\n`));

    // Create NPCs
    console.log(chalk.white('Creating NPCs...\n'));
    const npcsObject = createAllNPCs();
    const allNPCs = Object.values(npcsObject).slice(0, 5); // Use first 5 NPCs
    
    allNPCs.forEach(npc => {
      session.addCharacter(npc);
      console.log(chalk.gray(`  ✓ ${npc.name} - ${npc.occupation}`));
    });

    console.log(chalk.green(`\n✓ Created ${session.characters.size} characters\n`));

    // Start autonomous gameplay
    console.log(chalk.cyan.bold('\n╔════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║  AUTONOMOUS GAMEPLAY STARTING                              ║'));
    console.log(chalk.cyan.bold('║  All actions decided by AI                                 ║'));
    console.log(chalk.cyan.bold('╚════════════════════════════════════════════════════════════╝\n'));

    await new Promise(resolve => setTimeout(resolve, 2000));

    const pastConversations = [];

    // Run multiple conversations
    for (let i = 0; i < Math.min(CONFIG.maxConversations, allNPCs.length); i++) {
      console.log(chalk.magenta(`\n╔════ Autonomous Action ${i + 1}/${CONFIG.maxConversations} ════╗\n`));

      // Protagonist chooses an NPC
      const chosenNPC = await protagonistChooseNPC(protagonist, allNPCs, pastConversations);
      
      console.log(chalk.cyan(`${protagonist.name} decides to approach ${chosenNPC.name}.\n`));
      pastConversations.push(chosenNPC.id);

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Run autonomous conversation
      await runAutonomousConversation(protagonist, chosenNPC, {
        location: chosenNPC.location || 'village',
        reason: 'Meeting for the first time'
      });

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Game summary
    console.log(chalk.cyan.bold('\n╔════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║  GAME SESSION COMPLETE                                     ║'));
    console.log(chalk.cyan.bold('╚════════════════════════════════════════════════════════════╝\n'));

    // Show statistics
    const dialogueStats = session.dialogueSystem.getStatistics();
    const ollamaStats = ollama.getStatistics();

    console.log(chalk.yellow('Session Statistics:\n'));
    console.log(chalk.white('  Conversations: ') + chalk.gray(dialogueStats.totalConversations));
    console.log(chalk.white('  Dialogue turns: ') + chalk.gray(dialogueStats.totalDialogueTurns));
    console.log(chalk.white('  Avg conversation length: ') + 
                chalk.gray(`${dialogueStats.averageConversationLength?.toFixed(1) || 0} turns`));
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

    // Save replay
    console.log(chalk.yellow('\n═══ Saving Replay ═══\n'));
    
    if (!fs.existsSync(CONFIG.replayDir)) {
      fs.mkdirSync(CONFIG.replayDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = path.join(
      CONFIG.replayDir, 
      `autonomous_game_${timestamp}_${CONFIG.gameSeed}.json`
    );

    await replayLogger.save(filename);
    
    const stats = fs.statSync(filename);
    console.log(chalk.green(`✓ Replay saved: ${filename}`));
    console.log(chalk.gray(`  File size: ${(stats.size / 1024).toFixed(2)} KB\n`));

    // Show relationships
    console.log(chalk.yellow('═══ Final Relationships ═══\n'));
    allNPCs.forEach(npc => {
      if (pastConversations.includes(npc.id)) {
        const rel = protagonist.relationships.getRelationship(npc.id);
        console.log(chalk.white(`  ${npc.name}: `) + 
                    chalk.gray(`${rel.value} (${rel.level})`));
      }
    });

    console.log(chalk.green.bold('\n✓ AUTONOMOUS GAME TEST COMPLETE!\n'));
    console.log(chalk.cyan('This demonstrates the core OllamaRPG concept:'));
    console.log(chalk.white('• Protagonist AI autonomously makes decisions'));
    console.log(chalk.white('• NPCs respond with their own AI personalities'));
    console.log(chalk.white('• Emergent narrative develops from AI interactions'));
    console.log(chalk.white('• Everything is logged for replay\n'));

    console.log(chalk.gray(`View replay with: node view-replay.js\n`));

  } catch (error) {
    console.error(chalk.red('\n✗ Test failed:'), error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
runTest();
