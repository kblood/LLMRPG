#!/usr/bin/env node

/**
 * ReplayContinuation Examples
 *
 * This file demonstrates how to use the ReplayContinuation system to:
 * 1. Load a replay and continue from the end
 * 2. Play N frames then continue as new game
 * 3. Jump to specific frame and continue
 * 4. Save continuation replays
 * 5. Use with StandaloneAutonomousGame
 *
 * Run: node examples/replay-continuation-example.js
 */

import { ReplayContinuation } from '../src/services/ReplayContinuation.js';
import { StandaloneAutonomousGame } from '../src/services/StandaloneAutonomousGame.js';
import { GameSession } from '../src/game/GameSession.js';
import { GameService } from '../src/services/GameService.js';
import { Character } from '../src/entities/Character.js';
import { ReplayLogger } from '../src/replay/ReplayLogger.js';
import path from 'path';
import fs from 'fs';

// ============================================================================
// Example 1: Create a sample replay for testing
// ============================================================================

async function createSampleReplay() {
  console.log('\n' + '='.repeat(80));
  console.log('Example 1: Creating Sample Replay');
  console.log('='.repeat(80) + '\n');

  // Create a simple game session
  const seed = 12345;
  const session = new GameSession({
    seed,
    model: 'granite4:3b',
    temperature: 0.8
  });

  // Add some characters
  const protagonist = new Character('player1', 'Test Hero', {
    role: 'protagonist',
    backstory: 'A brave adventurer',
    occupation: 'Adventurer',
    age: 25,
    currentLocation: 'town_square'
  });
  session.addCharacter(protagonist);

  const npc = new Character('npc1', 'Village Elder', {
    role: 'npc',
    backstory: 'The wise elder of the village',
    occupation: 'Elder',
    age: 65,
    currentLocation: 'town_square'
  });
  session.addCharacter(npc);

  // Create game service
  const gameService = new GameService(session);
  await gameService.initialize();

  // Create replay logger
  const replayLogger = new ReplayLogger(seed);
  replayLogger.initialize(gameService.getGameState());

  console.log('Running game for 10 frames...');

  // Run for a few frames and log events
  for (let i = 0; i < 10; i++) {
    gameService.tick(5); // Advance 5 minutes

    // Log some events
    replayLogger.logEvent(
      session.frame,
      'time_advance',
      { minutes: 5, time: session.getGameTimeString() },
      protagonist.id,
      gameService.getGameState() // Include full state snapshot
    );

    // Add checkpoint every 3 frames
    if (i % 3 === 0) {
      replayLogger.logCheckpoint(session.frame, gameService.getGameState());
    }

    console.log(`Frame ${session.frame}: ${session.getGameTimeString()} - ${session.getTimeOfDay()}`);
  }

  // Save replay
  const replayPath = './replays/test-replay.replay';
  await replayLogger.save(replayPath);

  console.log(`\nSample replay saved to: ${replayPath}`);
  console.log(`Final frame: ${session.frame}`);
  console.log(`Events logged: ${replayLogger.getEventCount()}`);
  console.log(`Checkpoints: ${replayLogger.getCheckpointCount()}`);

  return replayPath;
}

// ============================================================================
// Example 2: Load replay and get information
// ============================================================================

async function loadAndInspectReplay(replayPath) {
  console.log('\n' + '='.repeat(80));
  console.log('Example 2: Load and Inspect Replay');
  console.log('='.repeat(80) + '\n');

  const continuation = new ReplayContinuation(replayPath);
  await continuation.loadReplay();

  const info = continuation.getReplayInfo();
  console.log('Replay Information:');
  console.log(JSON.stringify(info, null, 2));

  return continuation;
}

// ============================================================================
// Example 3: Continue from end of replay
// ============================================================================

async function continueFromEnd(continuation) {
  console.log('\n' + '='.repeat(80));
  console.log('Example 3: Continue From End of Replay');
  console.log('='.repeat(80) + '\n');

  console.log('Continuing replay as new game session...');

  const gameService = await continuation.continueAsNewGame({
    newSeed: 99999, // Use different seed for different outcomes
    model: 'granite4:3b',
    temperature: 0.8
  });

  console.log('\nGame continuation started!');
  console.log(`Session ID: ${gameService.getSessionId()}`);
  console.log(`Current Frame: ${gameService.getFrame()}`);
  console.log(`Seed: ${gameService.getSeed()}`);

  // Continue for a few more frames
  console.log('\nContinuing for 5 more frames...');
  for (let i = 0; i < 5; i++) {
    const timeState = gameService.tick(5);
    console.log(`Frame ${gameService.getFrame()}: ${timeState.time} - ${timeState.timeOfDay}`);

    // Log to new replay
    if (continuation.newReplayLogger) {
      continuation.newReplayLogger.logEvent(
        gameService.getFrame(),
        'continued_time_advance',
        { minutes: 5, time: timeState.time },
        'player1'
      );
    }
  }

  console.log('\nContinuation complete!');
  console.log(`New events logged: ${continuation.newReplayLogger?.getEventCount() || 0}`);

  return gameService;
}

// ============================================================================
// Example 4: Play and Continue (Watch N frames then continue)
// ============================================================================

async function playAndContinueExample(replayPath) {
  console.log('\n' + '='.repeat(80));
  console.log('Example 4: Play and Continue');
  console.log('='.repeat(80) + '\n');

  const continuation = new ReplayContinuation(replayPath);
  await continuation.loadReplay();

  console.log('Playing first 5 frames, then continuing...');

  let frameCount = 0;
  const gameService = await continuation.playAndContinue(
    5, // Play 5 frames
    {
      newSeed: 77777,
      model: 'granite4:3b'
    },
    (frame, event) => {
      // Callback for each played frame
      frameCount++;
      console.log(`  Playback frame ${frame}: ${event.type}`);
    }
  );

  console.log(`\nPlayback complete! Played ${frameCount} frames.`);
  console.log(`Now continuing as new game from frame 5...`);
  console.log(`Current frame: ${gameService.getFrame()}`);

  // Continue for a few frames
  for (let i = 0; i < 3; i++) {
    const timeState = gameService.tick(5);
    console.log(`Continuation frame ${gameService.getFrame()}: ${timeState.time}`);
  }

  return gameService;
}

// ============================================================================
// Example 5: Get state at specific frame
// ============================================================================

async function getStateAtFrameExample(replayPath) {
  console.log('\n' + '='.repeat(80));
  console.log('Example 5: Get State at Specific Frame');
  console.log('='.repeat(80) + '\n');

  const continuation = new ReplayContinuation(replayPath);
  await continuation.loadReplay();

  console.log('Retrieving state at different frames...\n');

  // Get state at frame 3
  const state3 = continuation.getStateAtFrame(3);
  if (state3) {
    console.log(`State at frame 3:`);
    console.log(`  - Frame: ${state3.frame}`);
    console.log(`  - Time: ${state3.time?.gameTimeString}`);
    console.log(`  - Characters: ${state3.characters?.npcs?.length || 0} NPCs`);
  }

  // Get state at frame 6
  const state6 = continuation.getStateAtFrame(6);
  if (state6) {
    console.log(`\nState at frame 6:`);
    console.log(`  - Frame: ${state6.frame}`);
    console.log(`  - Time: ${state6.time?.gameTimeString}`);
    console.log(`  - Day: ${state6.time?.day}`);
  }

  // Get state at frame 9
  const state9 = continuation.getStateAtFrame(9);
  if (state9) {
    console.log(`\nState at frame 9:`);
    console.log(`  - Frame: ${state9.frame}`);
    console.log(`  - Time: ${state9.time?.gameTimeString}`);
    console.log(`  - Weather: ${state9.time?.weather}`);
  }

  return continuation;
}

// ============================================================================
// Example 6: Continue from specific state
// ============================================================================

async function continueFromSpecificState(replayPath) {
  console.log('\n' + '='.repeat(80));
  console.log('Example 6: Continue from Specific State');
  console.log('='.repeat(80) + '\n');

  const continuation = new ReplayContinuation(replayPath);
  await continuation.loadReplay();

  // Get state at frame 5
  const state = continuation.getStateAtFrame(5);
  console.log(`Retrieved state at frame 5`);
  console.log(`Time: ${state.time?.gameTimeString}`);

  // Continue from this state
  console.log('\nContinuing from frame 5 state...');
  const gameService = await continuation.continueFromState(state, {
    newSeed: 55555,
    model: 'granite4:3b'
  });

  console.log(`\nContinuation started from frame 5!`);
  console.log(`Current frame: ${gameService.getFrame()}`);
  console.log(`Session ID: ${gameService.getSessionId()}`);

  // Continue playing
  for (let i = 0; i < 3; i++) {
    const timeState = gameService.tick(10);
    console.log(`Frame ${gameService.getFrame()}: ${timeState.time}`);
  }

  return gameService;
}

// ============================================================================
// Example 7: Use with StandaloneAutonomousGame
// ============================================================================

async function continueWithAutonomousGame(replayPath) {
  console.log('\n' + '='.repeat(80));
  console.log('Example 7: Continue with Autonomous Game');
  console.log('='.repeat(80) + '\n');

  const continuation = new ReplayContinuation(replayPath);
  await continuation.loadReplay();

  console.log('Loading replay and continuing with autonomous game...');

  // Continue as new game
  const gameService = await continuation.continueAsNewGame({
    newSeed: 33333,
    model: 'granite4:3b'
  });

  console.log('Starting autonomous game from continuation...');

  // Create autonomous game
  const autonomousGame = new StandaloneAutonomousGame(gameService, {
    frameDelay: 100, // Fast for demo
    maxFrames: 5,
    timeDeltaMin: 5,
    timeDeltaMax: 10,
    enableEventCallback: true,
    eventCallback: (event) => {
      console.log(`  [${event.type}] Frame ${event.frame}`);
    }
  });

  // Run autonomous game
  const stats = await autonomousGame.run();

  console.log('\nAutonomous game completed!');
  console.log(`Frames played: ${stats.framesPlayed}`);
  console.log(`Events recorded: ${stats.eventCount}`);

  return stats;
}

// ============================================================================
// Example 8: Save continuation replay
// ============================================================================

async function saveContinuationReplayExample(continuation) {
  console.log('\n' + '='.repeat(80));
  console.log('Example 8: Save Continuation Replay');
  console.log('='.repeat(80) + '\n');

  if (!continuation.newReplayLogger) {
    console.log('No continuation replay to save (continuation not started)');
    return;
  }

  const savePath = './replays/test-replay_continued.replay';
  await continuation.saveContinuationReplay(savePath);

  console.log(`Continuation replay saved to: ${savePath}`);
  console.log(`Events in continuation: ${continuation.newReplayLogger.getEventCount()}`);

  return savePath;
}

// ============================================================================
// Example 9: Statistics and info
// ============================================================================

async function showStatisticsExample(continuation) {
  console.log('\n' + '='.repeat(80));
  console.log('Example 9: Statistics and Information');
  console.log('='.repeat(80) + '\n');

  const stats = continuation.getStats();
  console.log('Replay Statistics:');
  console.log(JSON.stringify(stats, null, 2));
}

// ============================================================================
// Main execution
// ============================================================================

async function runAllExamples() {
  console.log('\n\n');
  console.log('*'.repeat(80));
  console.log('ReplayContinuation System Examples');
  console.log('*'.repeat(80));

  try {
    // Example 1: Create sample replay
    const replayPath = await createSampleReplay();

    // Example 2: Load and inspect
    const continuation = await loadAndInspectReplay(replayPath);

    // Example 3: Continue from end
    await continueFromEnd(continuation);

    // Example 4: Play and continue
    await playAndContinueExample(replayPath);

    // Example 5: Get state at frame
    await getStateAtFrameExample(replayPath);

    // Example 6: Continue from specific state
    await continueFromSpecificState(replayPath);

    // Example 7: Use with autonomous game
    await continueWithAutonomousGame(replayPath);

    // Example 8: Save continuation
    const continuation2 = await loadAndInspectReplay(replayPath);
    await continueFromEnd(continuation2);
    await saveContinuationReplayExample(continuation2);

    // Example 9: Statistics
    await showStatisticsExample(continuation2);

    console.log('\n\n');
    console.log('*'.repeat(80));
    console.log('All examples completed successfully!');
    console.log('*'.repeat(80));
    console.log('\n');

  } catch (error) {
    console.error('\n\nError running examples:');
    console.error(error);
    process.exit(1);
  }
}

// Run examples if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}

export {
  createSampleReplay,
  loadAndInspectReplay,
  continueFromEnd,
  playAndContinueExample,
  getStateAtFrameExample,
  continueFromSpecificState,
  continueWithAutonomousGame,
  saveContinuationReplayExample,
  showStatisticsExample
};
