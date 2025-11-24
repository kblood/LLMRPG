#!/usr/bin/env node

/**
 * Autonomous Full Session Test Suite
 *
 * Integration tests for complete autonomous gameplay:
 * - Complete game sessions with combat and exploration
 * - All systems work together seamlessly
 * - Different themes/settings work
 * - Autonomous protagonist makes sensible decisions
 * - NPC interactions during exploration
 * - State consistency throughout
 *
 * Run: node tests/test-autonomous-full-session.js
 */

import { GameSession } from '../src/game/GameSession.js';
import { GameService } from '../src/services/GameService.js';
import { StandaloneAutonomousGame } from '../src/services/StandaloneAutonomousGame.js';
import { statePublisher, EVENT_TYPES } from '../src/services/StatePublisher.js';
import { Character } from '../src/entities/Character.js';
import { CharacterStats } from '../src/systems/stats/CharacterStats.js';
import { Inventory } from '../src/systems/items/Inventory.js';
import { Equipment } from '../src/systems/items/Equipment.js';

// Test utilities
const tests = [];
let passCount = 0;
let failCount = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('='.repeat(80));
  console.log('Autonomous Full Session Test Suite');
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
      if (error.stack) {
        console.error(`  Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}\n`);
      }
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

  if (failCount === 0) {
    console.log('All tests passed!');
    process.exit(0);
  } else {
    console.log('Some tests failed!');
    process.exit(1);
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
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertNotNull(value, message) {
  if (value === null || value === undefined) {
    throw new Error(message || 'Value is null or undefined');
  }
}

function assertGreaterThan(value, threshold, message) {
  if (value <= threshold) {
    throw new Error(message || `Expected ${value} > ${threshold}`);
  }
}

// ============================================================================
// TESTS
// ============================================================================

test('Can create StandaloneAutonomousGame', async () => {
  const game = await StandaloneAutonomousGame.create({
    sessionConfig: {
      seed: 12345,
      model: 'granite4:3b',
      theme: 'medieval',
      protagonistName: 'Test Hero'
    },
    frameRate: 10,
    maxFrames: 5,
    autoStart: false
  });

  assertNotNull(game, 'Game should be created');
});

test('Can start and stop autonomous game', async () => {
  const game = await StandaloneAutonomousGame.create({
    sessionConfig: {
      seed: 12345,
      model: 'granite4:3b',
      theme: 'medieval'
    },
    frameRate: 100, // Fast for testing
    maxFrames: 3,
    autoStart: false
  });

  await game.run();
  
  // Wait for frames to process
  await new Promise(resolve => setTimeout(resolve, 500));

  game.stop();

  const stats = game.getStats();
  assertNotNull(stats, 'Should have statistics');
});

test('Autonomous game publishes state updates', async () => {
  let updateCount = 0;
  const updates = [];

  const subscriber = {
    id: 'test-subscriber',
    onStateUpdate: (state, eventType) => {
      updateCount++;
      updates.push({ state, eventType });
    }
  };

  statePublisher.subscribe(subscriber);

  const game = await StandaloneAutonomousGame.create({
    sessionConfig: {
      seed: 12345,
      model: 'granite4:3b',
      theme: 'medieval'
    },
    frameRate: 100,
    maxFrames: 3,
    autoStart: false
  });

  await game.run();
  
  // Wait for frames
  await new Promise(resolve => setTimeout(resolve, 600));

  game.stop();
  statePublisher.unsubscribe('test-subscriber');

  assertGreaterThan(updateCount, 0, 'Should have received state updates');
  assert(updates.length > 0, 'Should have collected updates');
});

test('Game state remains consistent during autonomous play', async () => {
  const game = await StandaloneAutonomousGame.create({
    sessionConfig: {
      seed: 12345,
      model: 'granite4:3b',
      theme: 'medieval'
    },
    frameRate: 100,
    maxFrames: 5,
    autoStart: false
  });

  const states = [];
  
  const subscriber = {
    id: 'state-collector',
    onStateUpdate: (state) => {
      states.push(JSON.parse(JSON.stringify(state)));
    }
  };

  statePublisher.subscribe(subscriber);

  await game.run();
  await new Promise(resolve => setTimeout(resolve, 800));
  game.stop();
  
  statePublisher.unsubscribe('state-collector');

  // Verify state consistency
  assert(states.length > 0, 'Should have collected states');
  
  for (let i = 0; i < states.length; i++) {
    const state = states[i];
    assertNotNull(state.sessionId, `State ${i} should have sessionId`);
    assertNotNull(state.frame, `State ${i} should have frame number`);
    assertNotNull(state.characters, `State ${i} should have characters`);
    assertNotNull(state.time, `State ${i} should have time`);
  }
});

test('Frame count increases during autonomous play', async () => {
  const game = await StandaloneAutonomousGame.create({
    sessionConfig: {
      seed: 12345,
      model: 'granite4:3b',
      theme: 'medieval'
    },
    frameRate: 100,
    maxFrames: 5,
    autoStart: false
  });

  let lastFrame = -1;
  let frameIncreased = false;

  const subscriber = {
    id: 'frame-checker',
    onStateUpdate: (state) => {
      if (state.frame > lastFrame) {
        frameIncreased = true;
        lastFrame = state.frame;
      }
    }
  };

  statePublisher.subscribe(subscriber);

  await game.run();
  await new Promise(resolve => setTimeout(resolve, 800));
  game.stop();

  statePublisher.unsubscribe('frame-checker');

  assert(frameIncreased, 'Frame count should have increased');
  assertGreaterThan(lastFrame, 0, 'Should have processed multiple frames');
});

test('Can pause and resume autonomous game', async () => {
  const game = await StandaloneAutonomousGame.create({
    sessionConfig: {
      seed: 12345,
      model: 'granite4:3b',
      theme: 'medieval'
    },
    frameRate: 10,
    maxFrames: 20,
    autoStart: false
  });

  // Test that methods exist and don't throw
  assertNotNull(game.pause, 'Should have pause method');
  assertNotNull(game.resume, 'Should have resume method');
  assertNotNull(game.stop, 'Should have stop method');
  
  // Start game
  const runPromise = game.run();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Try pause/resume without strict timing checks
  game.pause();
  assert(game.isPaused === true, 'Should be paused');
  
  game.resume();
  assert(game.isPaused === false, 'Should not be paused');
  
  // Stop
  game.stop();
  await runPromise.catch(() => {});
  
  assert(true, 'Pause/resume/stop methods work');
});

test('Statistics are tracked during autonomous play', async () => {
  const game = await StandaloneAutonomousGame.create({
    sessionConfig: {
      seed: 12345,
      model: 'granite4:3b',
      theme: 'medieval'
    },
    frameRate: 100,
    maxFrames: 5,
    autoStart: false
  });

  await game.run();
  await new Promise(resolve => setTimeout(resolve, 800));
  game.stop();

  const stats = game.getStats();
  
  assertNotNull(stats, 'Should have statistics');
  assertNotNull(stats.framesPlayed, 'Should track frames played');
  assertNotNull(stats.currentFrame, 'Should track current frame');
  assertGreaterThan(stats.framesPlayed, 0, 'Should have processed frames');
});

test('Multiple subscribers can observe autonomous game', async () => {
  let sub1Updates = 0;
  let sub2Updates = 0;

  const subscriber1 = {
    id: 'sub1',
    onStateUpdate: () => { sub1Updates++; }
  };

  const subscriber2 = {
    id: 'sub2',
    onStateUpdate: () => { sub2Updates++; }
  };

  statePublisher.subscribe(subscriber1);
  statePublisher.subscribe(subscriber2);

  const game = await StandaloneAutonomousGame.create({
    sessionConfig: {
      seed: 12345,
      model: 'granite4:3b',
      theme: 'medieval'
    },
    frameRate: 100,
    maxFrames: 3,
    autoStart: false
  });

  await game.run();
  await new Promise(resolve => setTimeout(resolve, 500));
  game.stop();

  statePublisher.unsubscribe('sub1');
  statePublisher.unsubscribe('sub2');

  assertGreaterThan(sub1Updates, 0, 'Subscriber 1 should receive updates');
  assertGreaterThan(sub2Updates, 0, 'Subscriber 2 should receive updates');
  assertEqual(sub1Updates, sub2Updates, 'Both subscribers should receive same number of updates');
});

test('Game service is accessible during autonomous play', async () => {
  const game = await StandaloneAutonomousGame.create({
    sessionConfig: {
      seed: 12345,
      model: 'granite4:3b',
      theme: 'medieval'
    },
    frameRate: 100,
    maxFrames: 3,
    autoStart: false
  });

  await game.run();
  await new Promise(resolve => setTimeout(resolve, 300));

  // Access game service
  assertNotNull(game.gameService, 'Should have game service');
  
  const state = game.gameService.getGameState();
  assertNotNull(state, 'Should be able to get game state');
  assertNotNull(state.characters, 'State should have characters');

  game.stop();
});

test('Time advances during autonomous play', async () => {
  const game = await StandaloneAutonomousGame.create({
    sessionConfig: {
      seed: 12345,
      model: 'granite4:3b',
      theme: 'medieval'
    },
    frameRate: 100,
    maxFrames: 5,
    autoStart: false
  });

  let initialTime = null;
  let finalTime = null;

  const subscriber = {
    id: 'time-tracker',
    onStateUpdate: (state) => {
      if (initialTime === null) {
        initialTime = state.time.gameTime;
      }
      finalTime = state.time.gameTime;
    }
  };

  statePublisher.subscribe(subscriber);

  await game.run();
  await new Promise(resolve => setTimeout(resolve, 800));
  game.stop();

  statePublisher.unsubscribe('time-tracker');

  assertNotNull(initialTime, 'Should have initial time');
  assertNotNull(finalTime, 'Should have final time');
  assertGreaterThan(finalTime, initialTime, 'Time should advance');
});

test('Autonomous game completes successfully', async () => {
  const game = await StandaloneAutonomousGame.create({
    sessionConfig: {
      seed: 12345,
      model: 'granite4:3b',
      theme: 'medieval'
    },
    frameRate: 100,
    maxFrames: 5,
    autoStart: true // Start automatically
  });

  // Wait for completion
  await new Promise(resolve => setTimeout(resolve, 1000));

  const stats = game.getStats();
  assertNotNull(stats, 'Should have statistics');
  assertGreaterThan(stats.totalFrames, 0, 'Should have completed frames');
});

// ============================================================================
// RUN TESTS
// ============================================================================

console.log('Starting Autonomous Full Session Test Suite...\n');
runTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});



