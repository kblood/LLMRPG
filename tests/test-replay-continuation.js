#!/usr/bin/env node

/**
 * ReplayContinuation Test Suite
 *
 * Comprehensive tests for the ReplayContinuation system
 *
 * Tests cover:
 * - Loading replay files
 * - State extraction at different frames
 * - Continuing from replay end
 * - Continuing from specific frames
 * - State reconstruction accuracy
 * - Character preservation
 * - Quest preservation
 * - Location preservation
 * - New replay logging
 * - Integration with GameService
 * - Integration with StandaloneAutonomousGame
 * - Error handling
 *
 * Run: node tests/test-replay-continuation.js
 */

import { ReplayContinuation } from '../src/services/ReplayContinuation.js';
import { GameSession } from '../src/game/GameSession.js';
import { GameService } from '../src/services/GameService.js';
import { Character } from '../src/entities/Character.js';
import { ReplayLogger } from '../src/replay/ReplayLogger.js';
import { StandaloneAutonomousGame } from '../src/services/StandaloneAutonomousGame.js';
import fs from 'fs';
import path from 'path';

// Test utilities
const tests = [];
let passCount = 0;
let failCount = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('='.repeat(80));
  console.log('ReplayContinuation Test Suite');
  console.log('='.repeat(80));
  console.log();

  for (const { name, fn } of tests) {
    try {
      console.log(`Testing: ${name}`);
      await fn();
      console.log(`✓ PASS: ${name}\n`);
      passCount++;
    } catch (error) {
      console.error(`✗ FAIL: ${name}`);
      console.error(`  Error: ${error.message}`);
      console.error(`  Stack: ${error.stack}\n`);
      failCount++;
    }
  }

  console.log('='.repeat(80));
  console.log('Test Results');
  console.log('='.repeat(80));
  console.log(`Total: ${tests.length}`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${failCount}`);
  console.log();

  if (failCount > 0) {
    console.error('Some tests failed!');
    process.exit(1);
  } else {
    console.log('All tests passed!');
    process.exit(0);
  }
}

// Assertion helpers
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      message || `Expected ${expected} but got ${actual}`
    );
  }
}

function assertGreaterThan(actual, expected, message) {
  if (actual <= expected) {
    throw new Error(
      message || `Expected ${actual} to be greater than ${expected}`
    );
  }
}

function assertNotNull(value, message) {
  if (value === null || value === undefined) {
    throw new Error(message || 'Expected non-null value');
  }
}

// ============================================================================
// Test Helpers
// ============================================================================

async function createTestReplay(options = {}) {
  const seed = options.seed || 12345;
  const frames = options.frames || 10;
  const checkpointInterval = options.checkpointInterval || 3;

  const session = new GameSession({
    seed,
    model: 'granite4:3b',
    temperature: 0.8
  });

  // Add protagonist
  const protagonist = new Character('player1', 'Test Hero', {
    role: 'protagonist',
    backstory: 'A brave adventurer',
    occupation: 'Adventurer',
    age: 25,
    currentLocation: 'town_square'
  });
  session.addCharacter(protagonist);

  // Add NPCs
  const npc1 = new Character('npc1', 'Village Elder', {
    role: 'npc',
    backstory: 'The wise elder',
    occupation: 'Elder',
    age: 65,
    currentLocation: 'town_square'
  });
  session.addCharacter(npc1);

  const npc2 = new Character('npc2', 'Town Guard', {
    role: 'npc',
    backstory: 'Protects the town',
    occupation: 'Guard',
    age: 30,
    currentLocation: 'town_square'
  });
  session.addCharacter(npc2);

  // Add discovered locations
  session.discoveredLocations.add('town_square');
  session.discoveredLocations.add('forest');
  session.visitedLocations.add('town_square');
  session.currentLocation = 'town_square'; // Set the current location

  session.locationDatabase.set('town_square', {
    id: 'town_square',
    name: 'Town Square',
    description: 'The heart of the village',
    type: 'settlement',
    safe: true
  });

  session.locationDatabase.set('forest', {
    id: 'forest',
    name: 'Dark Forest',
    description: 'A mysterious forest',
    type: 'wilderness',
    safe: false
  });

  const gameService = new GameService(session);
  await gameService.initialize();

  const replayLogger = new ReplayLogger(seed);
  replayLogger.initialize(gameService.getGameState());

  // Run game and log events
  for (let i = 0; i < frames; i++) {
    gameService.tick(5);

    replayLogger.logEvent(
      session.frame,
      'time_advance',
      { minutes: 5, time: session.getGameTimeString() },
      protagonist.id,
      gameService.getGameState()
    );

    if (i % checkpointInterval === 0) {
      replayLogger.logCheckpoint(session.frame, gameService.getGameState());
    }
  }

  const replayPath = `./replays/test_${Date.now()}.replay`;
  await replayLogger.save(replayPath);

  return { replayPath, session, gameService, replayLogger };
}

async function cleanupTestReplay(replayPath) {
  if (fs.existsSync(replayPath)) {
    fs.unlinkSync(replayPath);
  }
}

// ============================================================================
// Tests
// ============================================================================

test('ReplayContinuation constructor', async () => {
  const continuation = new ReplayContinuation();
  assert(continuation !== null, 'Should create instance');
  assertEqual(continuation.loaded, false, 'Should not be loaded initially');
  assertEqual(continuation.replayFilePath, null, 'Should have no path initially');
});

test('Load replay file', async () => {
  const { replayPath } = await createTestReplay();

  try {
    const continuation = new ReplayContinuation(replayPath);
    await continuation.loadReplay();

    assert(continuation.isLoaded(), 'Should be loaded');
    assertNotNull(continuation.replayData, 'Should have replay data');
    assertNotNull(continuation.replayData.header, 'Should have header');
    assertGreaterThan(continuation.replayData.events.length, 0, 'Should have events');

  } finally {
    await cleanupTestReplay(replayPath);
  }
});

test('Get replay info', async () => {
  const { replayPath } = await createTestReplay({ frames: 10 });

  try {
    const continuation = new ReplayContinuation(replayPath);
    await continuation.loadReplay();

    const info = continuation.getReplayInfo();
    assertNotNull(info, 'Should return info');
    assertEqual(info.gameSeed, 12345, 'Should have correct seed');
    assertGreaterThan(info.eventCount, 0, 'Should have events');
    assertGreaterThan(info.checkpointCount, 0, 'Should have checkpoints');
    assertEqual(info.lastFrame, 10, 'Should have correct last frame');

  } finally {
    await cleanupTestReplay(replayPath);
  }
});

test('Get state at specific frame', async () => {
  const { replayPath } = await createTestReplay({ frames: 10 });

  try {
    const continuation = new ReplayContinuation(replayPath);
    await continuation.loadReplay();

    const state3 = continuation.getStateAtFrame(3);
    assertNotNull(state3, 'Should get state at frame 3');
    assertEqual(state3.frame, 3, 'Should be frame 3');

    const state6 = continuation.getStateAtFrame(6);
    assertNotNull(state6, 'Should get state at frame 6');
    assertEqual(state6.frame, 6, 'Should be frame 6');

  } finally {
    await cleanupTestReplay(replayPath);
  }
});

test('Continue from end of replay', async () => {
  const { replayPath } = await createTestReplay({ frames: 10 });

  try {
    const continuation = new ReplayContinuation(replayPath);
    await continuation.loadReplay();

    const gameService = await continuation.continueAsNewGame({
      newSeed: 99999,
      model: 'granite4:3b'
    });

    assertNotNull(gameService, 'Should create game service');
    assertEqual(gameService.getFrame(), 10, 'Should start at frame 10');
    assertNotNull(gameService.getProtagonist(), 'Should have protagonist');
    assertGreaterThan(gameService.getNPCs().length, 0, 'Should have NPCs');

  } finally {
    await cleanupTestReplay(replayPath);
  }
});

test('Continue from specific frame', async () => {
  const { replayPath } = await createTestReplay({ frames: 10 });

  try {
    const continuation = new ReplayContinuation(replayPath);
    await continuation.loadReplay();

    const gameService = await continuation.continueAsNewGame({
      fromFrame: 5,
      newSeed: 88888,
      model: 'granite4:3b'
    });

    assertNotNull(gameService, 'Should create game service');
    assertEqual(gameService.getFrame(), 5, 'Should start at frame 5');

  } finally {
    await cleanupTestReplay(replayPath);
  }
});

test('Character preservation during continuation', async () => {
  const { replayPath, session } = await createTestReplay({ frames: 10 });

  try {
    const originalCharacterCount = session.characters.size;
    const originalProtagonist = session.protagonist;

    const continuation = new ReplayContinuation(replayPath);
    await continuation.loadReplay();

    const gameService = await continuation.continueAsNewGame({
      newSeed: 77777,
      model: 'granite4:3b'
    });

    const protagonist = gameService.getProtagonist();
    assertNotNull(protagonist, 'Should have protagonist');
    assertEqual(protagonist.name, originalProtagonist.name, 'Should preserve name');
    assertEqual(protagonist.role, 'protagonist', 'Should preserve role');

    const npcs = gameService.getNPCs();
    assertEqual(npcs.length, originalCharacterCount - 1, 'Should have correct NPC count');

  } finally {
    await cleanupTestReplay(replayPath);
  }
});

test('Location preservation during continuation', async () => {
  const { replayPath, session } = await createTestReplay({ frames: 10 });

  try {
    const continuation = new ReplayContinuation(replayPath);
    await continuation.loadReplay();

    const gameService = await continuation.continueAsNewGame({
      newSeed: 66666,
      model: 'granite4:3b'
    });

    const discovered = gameService.getDiscoveredLocations();
    assertGreaterThan(discovered.length, 0, 'Should have discovered locations');

    const currentLocation = gameService.getCurrentLocation();
    assertNotNull(currentLocation, 'Should have current location');

  } finally {
    await cleanupTestReplay(replayPath);
  }
});

test('Time state preservation during continuation', async () => {
  const { replayPath, session } = await createTestReplay({ frames: 10 });

  try {
    const originalTime = session.gameTime;
    const originalDay = session.day;
    const originalSeason = session.season;

    const continuation = new ReplayContinuation(replayPath);
    await continuation.loadReplay();

    const gameService = await continuation.continueAsNewGame({
      newSeed: 55555,
      model: 'granite4:3b'
    });

    const state = gameService.getGameState();
    assertEqual(state.time.gameTime, originalTime, 'Should preserve game time');
    assertEqual(state.time.day, originalDay, 'Should preserve day');
    assertEqual(state.time.season, originalSeason, 'Should preserve season');

  } finally {
    await cleanupTestReplay(replayPath);
  }
});

test('Continue and advance time', async () => {
  const { replayPath } = await createTestReplay({ frames: 10 });

  try {
    const continuation = new ReplayContinuation(replayPath);
    await continuation.loadReplay();

    const gameService = await continuation.continueAsNewGame({
      newSeed: 44444,
      model: 'granite4:3b'
    });

    const frameBefore = gameService.getFrame();
    const timeBefore = gameService.getGameState().time.gameTime;

    // Advance time
    gameService.tick(10);

    const frameAfter = gameService.getFrame();
    const timeAfter = gameService.getGameState().time.gameTime;

    assertEqual(frameAfter, frameBefore + 1, 'Should advance frame');
    assertEqual(timeAfter, timeBefore + 10, 'Should advance time by 10 minutes');

  } finally {
    await cleanupTestReplay(replayPath);
  }
});

test('Play and continue', async () => {
  const { replayPath } = await createTestReplay({ frames: 10 });

  try {
    const continuation = new ReplayContinuation(replayPath);
    await continuation.loadReplay();

    let playbackFrames = 0;
    const gameService = await continuation.playAndContinue(
      5,
      { newSeed: 33333 },
      (frame, event) => {
        playbackFrames++;
      }
    );

    assertGreaterThan(playbackFrames, 0, 'Should play some frames');
    assertEqual(gameService.getFrame(), 5, 'Should start at frame 5');

  } finally {
    await cleanupTestReplay(replayPath);
  }
});

test('Continue from state', async () => {
  const { replayPath } = await createTestReplay({ frames: 10 });

  try {
    const continuation = new ReplayContinuation(replayPath);
    await continuation.loadReplay();

    const state = continuation.getStateAtFrame(7);
    assertNotNull(state, 'Should get state');

    const gameService = await continuation.continueFromState(state, {
      newSeed: 22222,
      model: 'granite4:3b'
    });

    assertNotNull(gameService, 'Should create game service');
    assertEqual(gameService.getFrame(), 7, 'Should start at frame 7');

  } finally {
    await cleanupTestReplay(replayPath);
  }
});

test('New replay logger created on continuation', async () => {
  const { replayPath } = await createTestReplay({ frames: 10 });

  try {
    const continuation = new ReplayContinuation(replayPath);
    await continuation.loadReplay();

    const gameService = await continuation.continueAsNewGame({
      newSeed: 11111,
      model: 'granite4:3b'
    });

    assertNotNull(continuation.newReplayLogger, 'Should create new replay logger');
    assertEqual(continuation.newReplayLogger.gameSeed, 11111, 'Should use new seed');

  } finally {
    await cleanupTestReplay(replayPath);
  }
});

test('Statistics after continuation', async () => {
  const { replayPath } = await createTestReplay({ frames: 10 });

  try {
    const continuation = new ReplayContinuation(replayPath);
    await continuation.loadReplay();

    await continuation.continueAsNewGame({
      newSeed: 10000,
      model: 'granite4:3b'
    });

    const stats = continuation.getStats();
    assertNotNull(stats, 'Should get stats');
    assertNotNull(stats.replay, 'Should have replay stats');
    assertNotNull(stats.continuation, 'Should have continuation stats');
    assertEqual(stats.continuation.active, true, 'Should be active');
    assertEqual(stats.continuation.startFrame, 10, 'Should start at frame 10');

  } finally {
    await cleanupTestReplay(replayPath);
  }
});

test('Integration with StandaloneAutonomousGame', async () => {
  const { replayPath } = await createTestReplay({ frames: 5 });

  try {
    const continuation = new ReplayContinuation(replayPath);
    await continuation.loadReplay();

    const gameService = await continuation.continueAsNewGame({
      newSeed: 20000,
      model: 'granite4:3b'
    });

    // Run autonomous game for a few frames
    const autonomousGame = new StandaloneAutonomousGame(gameService, {
      frameDelay: 10,
      maxFrames: 3,
      timeDeltaMin: 5,
      timeDeltaMax: 10
    });

    const stats = await autonomousGame.run();

    assertEqual(stats.framesPlayed, 3, 'Should play 3 frames');
    assertGreaterThan(gameService.getFrame(), 5, 'Should advance beyond continuation point');

  } finally {
    await cleanupTestReplay(replayPath);
  }
});

test('Error handling - no replay loaded', async () => {
  const continuation = new ReplayContinuation();

  let errorThrown = false;
  try {
    await continuation.continueAsNewGame();
  } catch (error) {
    errorThrown = true;
    assert(error.message.includes('No replay loaded'), 'Should throw appropriate error');
  }

  assert(errorThrown, 'Should throw error');
});

test('Error handling - invalid file path', async () => {
  const continuation = new ReplayContinuation('./nonexistent.replay');

  let errorThrown = false;
  try {
    await continuation.loadReplay();
  } catch (error) {
    errorThrown = true;
  }

  assert(errorThrown, 'Should throw error for nonexistent file');
});

test('Error handling - get state before loading', async () => {
  const continuation = new ReplayContinuation();

  let errorThrown = false;
  try {
    continuation.getStateAtFrame(5);
  } catch (error) {
    errorThrown = true;
    assert(error.message.includes('No replay loaded'), 'Should throw appropriate error');
  }

  assert(errorThrown, 'Should throw error');
});

test('Multiple continuations from same replay', async () => {
  const { replayPath } = await createTestReplay({ frames: 10 });

  try {
    // First continuation
    const continuation1 = new ReplayContinuation(replayPath);
    await continuation1.loadReplay();
    const gameService1 = await continuation1.continueAsNewGame({ newSeed: 1111 });

    // Second continuation
    const continuation2 = new ReplayContinuation(replayPath);
    await continuation2.loadReplay();
    const gameService2 = await continuation2.continueAsNewGame({ newSeed: 2222 });

    assertNotNull(gameService1, 'Should create first service');
    assertNotNull(gameService2, 'Should create second service');
    assertEqual(gameService1.getFrame(), 10, 'First should start at frame 10');
    assertEqual(gameService2.getFrame(), 10, 'Second should start at frame 10');
    assertEqual(gameService1.getSeed(), 1111, 'Should have different seeds');
    assertEqual(gameService2.getSeed(), 2222, 'Should have different seeds');

  } finally {
    await cleanupTestReplay(replayPath);
  }
});

test('Playback progress tracking', async () => {
  const { replayPath } = await createTestReplay({ frames: 10 });

  try {
    const continuation = new ReplayContinuation(replayPath);
    await continuation.loadReplay();

    assertEqual(continuation.isPlayingBack(), false, 'Should not be playing back initially');

    let progressChecked = false;
    await continuation.playAndContinue(
      5,
      { newSeed: 3333 },
      (frame, event) => {
        if (!progressChecked && continuation.isPlayingBack()) {
          const progress = continuation.getPlaybackProgress();
          assertNotNull(progress, 'Should have progress');
          assertGreaterThan(progress.currentFrame, 0, 'Should have current frame');
          progressChecked = true;
        }
      }
    );

    assertEqual(continuation.isPlayingBack(), false, 'Should not be playing back after completion');

  } finally {
    await cleanupTestReplay(replayPath);
  }
});

// ============================================================================
// Run Tests
// ============================================================================

runTests();
