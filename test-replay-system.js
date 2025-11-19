#!/usr/bin/env node
/**
 * Test script to verify the replay logging system
 */

import { ReplayLogger } from './src/replay/ReplayLogger.js';
import { ReplayFile } from './src/replay/ReplayFile.js';
import { Character } from './src/entities/Character.js';
import { GameSession } from './src/game/GameSession.js';
import { DialogueInterface } from './src/ui/DialogueInterface.js';
import { Personality } from './src/ai/personality/Personality.js';
import fs from 'fs';
import path from 'path';

const ui = new DialogueInterface().initialize();

async function testReplaySystem() {
  ui.displayHeader('REPLAY SYSTEM TEST');
  ui.display('');
  
  // Test 1: Initialize replay logger
  ui.displayInfo('Test 1: Initializing ReplayLogger...');
  const gameSeed = 99999;
  const logger = new ReplayLogger(gameSeed);
  
  logger.initialize({
    seed: gameSeed,
    startTime: Date.now(),
    characters: ['player', 'npc1'],
    location: 'tavern'
  });
  
  ui.displaySuccess('✓ ReplayLogger initialized');
  ui.display('');
  
  // Test 2: Log some events
  ui.displayInfo('Test 2: Logging game events...');
  logger.logEvent(0, 'game_start', {}, 'system');
  logger.logEvent(10, 'dialogue_started', { npcId: 'npc1' }, 'player');
  logger.logEvent(15, 'dialogue_line', { speaker: 'player', text: 'Hello!' }, 'player');
  logger.logEvent(20, 'dialogue_line', { speaker: 'npc1', text: 'Hi there!' }, 'npc1');
  logger.logEvent(30, 'dialogue_ended', { duration: 20 }, 'player');
  
  ui.displaySuccess(`✓ Logged ${logger.getEventCount()} events`);
  ui.display('');
  
  // Test 3: Log LLM calls
  ui.displayInfo('Test 3: Logging LLM calls...');
  logger.logLLMCall({
    frame: 15,
    characterId: 'player',
    prompt: 'Generate greeting for tavern keeper',
    response: 'Hello! How are you today?',
    tokensUsed: 25
  });
  
  logger.logLLMCall({
    frame: 20,
    characterId: 'npc1',
    prompt: 'Respond to greeting',
    response: 'Hi there! Welcome to the tavern!',
    tokensUsed: 30
  });
  
  ui.displaySuccess(`✓ Logged ${logger.getLLMCallCount()} LLM calls`);
  ui.display('');
  
  // Test 4: Log a checkpoint
  ui.displayInfo('Test 4: Creating checkpoint...');
  logger.logCheckpoint(25, {
    frame: 25,
    characters: {
      player: { health: 100, location: 'tavern' },
      npc1: { mood: 'happy', relationship: 50 }
    },
    worldState: { time: 'afternoon', weather: 'clear' }
  });
  
  ui.displaySuccess(`✓ Created ${logger.getCheckpointCount()} checkpoint(s)`);
  ui.display('');
  
  // Test 5: Save replay file
  ui.displayInfo('Test 5: Saving replay to file...');
  const replayDir = './replays';
  if (!fs.existsSync(replayDir)) {
    fs.mkdirSync(replayDir, { recursive: true });
  }
  
  const filename = path.join(replayDir, `test_replay_${Date.now()}.json`);
  
  try {
    await logger.save(filename);
    ui.displaySuccess(`✓ Replay saved to: ${filename}`);
    
    // Verify file exists and show stats
    const stats = fs.statSync(filename);
    ui.display(`  File size: ${(stats.size / 1024).toFixed(2)} KB`, { color: 'gray' });
    
    // Read and display contents (compressed)
    const replayData = await ReplayFile.load(filename);
    ui.display('');
    ui.displayInfo('Replay file contents:');
    ui.display(`  Version: ${replayData.header.version}`, { color: 'gray' });
    ui.display(`  Seed: ${replayData.header.gameSeed}`, { color: 'gray' });
    ui.display(`  Frame count: ${replayData.header.frameCount}`, { color: 'gray' });
    ui.display(`  Events: ${replayData.header.eventCount}`, { color: 'gray' });
    ui.display(`  LLM calls: ${replayData.header.llmCallCount}`, { color: 'gray' });
    ui.display(`  Checkpoints: ${replayData.header.checkpointCount}`, { color: 'gray' });
    
  } catch (error) {
    ui.displayError(`✗ Failed to save replay: ${error.message}`);
    return false;
  }
  
  ui.display('');
  ui.displaySuccess('=== ALL REPLAY TESTS PASSED ===');
  
  return true;
}

async function testWithRealGame() {
  ui.display('');
  ui.displayHeader('TESTING WITH REAL GAME SESSION');
  ui.display('');
  
  ui.displayInfo('Initializing game session with replay logging...');
  
  const gameSeed = 42424242;
  const replayLogger = ReplayLogger.getInstance(gameSeed);
  
  const session = new GameSession({
    seed: gameSeed,
    model: 'llama3.1:8b',
    temperature: 0.8
  });
  
  // Initialize replay logger with game state
  replayLogger.initialize({
    seed: gameSeed,
    startTime: Date.now(),
    characters: [],
    gameVersion: '1.0.0'
  });
  
  ui.displaySuccess('✓ Game session created with replay logging');
  
  // Create characters
  const player = new Character('player', 'Hero', {
    role: 'protagonist',
    backstory: 'A brave adventurer'
  });
  session.addCharacter(player);
  
  const npc = new Character('tavern_keeper', 'Innkeeper', {
    role: 'npc',
    backstory: 'Runs the local tavern',
    occupation: 'Tavern Keeper',
    personality: Personality.createArchetype('cheerful_tavern_keeper')
  });
  session.addCharacter(npc);
  
  ui.displaySuccess(`✓ Created ${session.characters.size} characters`);
  
  // Log game start
  replayLogger.logEvent(0, 'game_start', {
    location: 'tavern',
    playerName: player.name
  }, 'system');
  
  ui.displayInfo('Starting conversation with NPC...');
  
  try {
    // Start a conversation (this should trigger dialogue logging)
    const conversation = await session.startConversation('tavern_keeper', {
      initialMessage: 'Hello, I need a room for the night.'
    });
    
    // Log conversation start
    replayLogger.logEvent(1, 'conversation_started', {
      npcId: npc.id,
      playerId: player.id
    }, player.id);
    
    ui.displaySuccess('✓ Conversation completed');
    
    // Get one response
    const response = await conversation.sendMessage('What do you have available?');
    
    // Log the exchange
    replayLogger.logEvent(2, 'player_message', {
      text: 'What do you have available?'
    }, player.id);
    
    replayLogger.logEvent(3, 'npc_response', {
      text: response
    }, npc.id);
    
    ui.display('');
    ui.display(`NPC says: "${response.substring(0, 100)}..."`, { color: 'cyan' });
    
    // Create checkpoint
    replayLogger.logCheckpoint(3, {
      frame: 3,
      session: {
        characters: session.characters.size,
        frame: session.frame
      }
    });
    
    ui.displaySuccess('✓ Checkpoint created');
    
  } catch (error) {
    ui.displayError(`Error during conversation: ${error.message}`);
    console.error(error);
  }
  
  // Save replay
  ui.display('');
  ui.displayInfo('Saving game replay...');
  
  const replayDir = './replays';
  if (!fs.existsSync(replayDir)) {
    fs.mkdirSync(replayDir, { recursive: true });
  }
  
  const filename = path.join(replayDir, `game_replay_${Date.now()}.json`);
  
  try {
    await replayLogger.save(filename);
    ui.displaySuccess(`✓ Game replay saved to: ${filename}`);
    
    const stats = fs.statSync(filename);
    ui.display(`  File size: ${(stats.size / 1024).toFixed(2)} KB`, { color: 'gray' });
    ui.display(`  Events: ${replayLogger.getEventCount()}`, { color: 'gray' });
    ui.display(`  LLM calls: ${replayLogger.getLLMCallCount()}`, { color: 'gray' });
    ui.display(`  Checkpoints: ${replayLogger.getCheckpointCount()}`, { color: 'gray' });
    
  } catch (error) {
    ui.displayError(`Failed to save replay: ${error.message}`);
  }
  
  ui.display('');
  ui.displaySuccess('=== REAL GAME REPLAY TEST COMPLETE ===');
}

// Run tests
async function main() {
  try {
    const basicTestPassed = await testReplaySystem();
    
    if (basicTestPassed) {
      await testWithRealGame();
    }
    
    ui.display('');
    ui.displaySuccess('All tests completed! Check the ./replays directory for saved files.');
    process.exit(0);
    
  } catch (error) {
    ui.displayError(`Test failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main();
