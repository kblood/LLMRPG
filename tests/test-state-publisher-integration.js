#!/usr/bin/env node

/**
 * StatePublisher Integration Test Suite
 *
 * Comprehensive tests for StatePublisher integration with StandaloneAutonomousGame
 *
 * Tests cover:
 * - Basic subscription lifecycle
 * - State publishing during game loop
 * - Event type accuracy
 * - Multiple subscribers
 * - Subscribe/unsubscribe during game
 * - Performance metrics
 * - Debug mode
 * - Error handling
 *
 * Run: node tests/test-state-publisher-integration.js
 */

import { GameService } from '../src/services/GameService.js';
import { StandaloneAutonomousGame } from '../src/services/StandaloneAutonomousGame.js';
import { statePublisher, EVENT_TYPES, StatePublisher } from '../src/services/StatePublisher.js';
import { GameSession } from '../src/game/GameSession.js';

// Test utilities
const tests = [];
let passCount = 0;
let failCount = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('='.repeat(80));
  console.log('StatePublisher Integration Test Suite');
  console.log('='.repeat(80));
  console.log();

  for (const { name, fn } of tests) {
    try {
      // Clear state between tests
      statePublisher.clear();

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

// ============================================================================
// Test Suite
// ============================================================================

test('StatePublisher singleton works correctly', () => {
  const instance1 = StatePublisher.getInstance();
  const instance2 = StatePublisher.getInstance();

  assert(instance1 === instance2, 'Singleton should return same instance');
  assert(instance1 === statePublisher, 'Export should match singleton');
});

test('Subscribe and unsubscribe work', () => {
  const subscriber = {
    id: 'test-sub',
    onStateUpdate: () => {}
  };

  const id = statePublisher.subscribe(subscriber);
  assert(statePublisher.hasSubscriber(id), 'Subscriber should be registered');

  const removed = statePublisher.unsubscribe(id);
  assert(removed === true, 'Unsubscribe should return true');
  assert(!statePublisher.hasSubscriber(id), 'Subscriber should be removed');
});

test('Auto-generated IDs work', () => {
  const subscriber = {
    onStateUpdate: () => {}
  };

  const id = statePublisher.subscribe(subscriber);
  assert(id, 'ID should be generated');
  assert(statePublisher.hasSubscriber(id), 'Subscriber should be registered');
});

test('Partial subscribers work (state-only)', () => {
  let called = false;

  const subscriber = {
    id: 'state-only',
    onStateUpdate: () => { called = true; }
  };

  statePublisher.subscribe(subscriber);
  statePublisher.publish({ frame: 1 }, EVENT_TYPES.FRAME_UPDATE);

  assert(called, 'State handler should be called');
});

test('Partial subscribers work (event-only)', () => {
  let called = false;

  const subscriber = {
    id: 'event-only',
    onGameEvent: () => { called = true; }
  };

  statePublisher.subscribe(subscriber);
  statePublisher.broadcast({ type: 'test_event' });

  assert(called, 'Event handler should be called');
});

test('Multiple subscribers receive updates', () => {
  const calls = [];

  statePublisher.subscribe({
    id: 'sub1',
    onStateUpdate: () => calls.push('sub1')
  });

  statePublisher.subscribe({
    id: 'sub2',
    onStateUpdate: () => calls.push('sub2')
  });

  statePublisher.subscribe({
    id: 'sub3',
    onStateUpdate: () => calls.push('sub3')
  });

  statePublisher.publish({ frame: 1 }, EVENT_TYPES.FRAME_UPDATE);

  assertEqual(calls.length, 3, 'All subscribers should be called');
  assert(calls.includes('sub1'), 'Sub1 should be called');
  assert(calls.includes('sub2'), 'Sub2 should be called');
  assert(calls.includes('sub3'), 'Sub3 should be called');
});

test('Publish sends correct event type', () => {
  let receivedEventType = null;

  statePublisher.subscribe({
    id: 'event-checker',
    onStateUpdate: (state, eventType) => {
      receivedEventType = eventType;
    }
  });

  statePublisher.publish({ frame: 1 }, EVENT_TYPES.DIALOGUE_STARTED);

  assertEqual(
    receivedEventType,
    EVENT_TYPES.DIALOGUE_STARTED,
    'Event type should match'
  );
});

test('Publish sends metadata', () => {
  let receivedMetadata = null;

  statePublisher.subscribe({
    id: 'metadata-checker',
    onStateUpdate: (state, eventType, metadata) => {
      receivedMetadata = metadata;
    }
  });

  const testMetadata = { foo: 'bar', num: 42 };
  statePublisher.publish({ frame: 1 }, EVENT_TYPES.FRAME_UPDATE, testMetadata);

  assert(receivedMetadata, 'Metadata should be received');
  assertEqual(receivedMetadata.foo, 'bar', 'Metadata.foo should match');
  assertEqual(receivedMetadata.num, 42, 'Metadata.num should match');
});

test('Broadcast works', () => {
  let receivedEvent = null;

  statePublisher.subscribe({
    id: 'broadcast-checker',
    onGameEvent: (event) => {
      receivedEvent = event;
    }
  });

  statePublisher.broadcast({ type: 'custom_event', data: 'test' });

  assert(receivedEvent, 'Event should be received');
  assertEqual(receivedEvent.type, 'custom_event', 'Event type should match');
  assertEqual(receivedEvent.data, 'test', 'Event data should match');
});

test('Event history is tracked', () => {
  statePublisher.publish({ frame: 1 }, EVENT_TYPES.FRAME_UPDATE);
  statePublisher.publish({ frame: 2 }, EVENT_TYPES.FRAME_UPDATE);
  statePublisher.broadcast({ type: 'test' });

  const history = statePublisher.getEventHistory();
  assertGreaterThan(history.length, 0, 'History should have events');

  const recent = statePublisher.getEventHistory(2);
  assertEqual(recent.length, 2, 'Should return last 2 events');
});

test('Metrics are tracked', () => {
  statePublisher.subscribe({
    id: 'metrics-test',
    onStateUpdate: () => {}
  });

  statePublisher.publish({ frame: 1 }, EVENT_TYPES.FRAME_UPDATE);
  statePublisher.publish({ frame: 2 }, EVENT_TYPES.FRAME_UPDATE);
  statePublisher.broadcast({ type: 'test' });

  const metrics = statePublisher.getMetrics();

  assertEqual(metrics.subscriberCount, 1, 'Should have 1 subscriber');
  assertGreaterThan(metrics.publishCount, 0, 'Should have publishes');
  assertGreaterThan(metrics.broadcastCount, 0, 'Should have broadcasts');
  assertGreaterThan(metrics.totalEventsSent, 0, 'Should have sent events');
});

test('Debug mode works', () => {
  statePublisher.enableDebug({
    logStateUpdates: false,
    logEvents: false
  });

  assert(statePublisher.debug === true, 'Debug should be enabled');

  statePublisher.disableDebug();
  assert(statePublisher.debug === false, 'Debug should be disabled');
});

test('Error in subscriber does not crash system', () => {
  let goodSubscriberCalled = false;

  statePublisher.subscribe({
    id: 'bad-subscriber',
    onStateUpdate: () => {
      throw new Error('Test error');
    }
  });

  statePublisher.subscribe({
    id: 'good-subscriber',
    onStateUpdate: () => {
      goodSubscriberCalled = true;
    }
  });

  // Should not throw
  statePublisher.publish({ frame: 1 }, EVENT_TYPES.FRAME_UPDATE);

  assert(goodSubscriberCalled, 'Good subscriber should still be called');
});

test('getSubscribers returns correct info', () => {
  statePublisher.subscribe({
    id: 'full-sub',
    onStateUpdate: () => {},
    onGameEvent: () => {}
  });

  statePublisher.subscribe({
    id: 'state-only-sub',
    onStateUpdate: () => {}
  });

  const subs = statePublisher.getSubscribers();

  assertEqual(subs.length, 2, 'Should have 2 subscribers');

  const fullSub = subs.find(s => s.id === 'full-sub');
  assert(fullSub.hasStateHandler, 'Full sub should have state handler');
  assert(fullSub.hasEventHandler, 'Full sub should have event handler');

  const stateSub = subs.find(s => s.id === 'state-only-sub');
  assert(stateSub.hasStateHandler, 'State sub should have state handler');
  assert(!stateSub.hasEventHandler, 'State sub should not have event handler');
});

test('Clear removes all subscribers and history', () => {
  statePublisher.subscribe({ id: 'test1', onStateUpdate: () => {} });
  statePublisher.subscribe({ id: 'test2', onStateUpdate: () => {} });
  statePublisher.publish({ frame: 1 }, EVENT_TYPES.FRAME_UPDATE);

  statePublisher.clear();

  assertEqual(statePublisher.getSubscribers().length, 0, 'Should have no subscribers');
  assertEqual(statePublisher.getEventHistory().length, 0, 'Should have no history');
});

// ============================================================================
// Integration Tests with StandaloneAutonomousGame
// ============================================================================

test('Integration: StatePublisher receives updates from game', async () => {
  const gameSession = new GameSession({
    seed: 12345,
    llmService: null
  });

  const gameService = new GameService(gameSession);
  await gameService.initialize();

  const game = new StandaloneAutonomousGame(gameService, {
    frameDelay: 100,
    maxFrames: 5,
    maxTurnsPerConversation: 2
  });

  let updateCount = 0;
  const receivedEventTypes = [];

  statePublisher.subscribe({
    id: 'integration-test',
    onStateUpdate: (state, eventType) => {
      updateCount++;
      receivedEventTypes.push(eventType);
    }
  });

  await game.run();

  assertGreaterThan(updateCount, 0, 'Should receive updates');
  assert(
    receivedEventTypes.includes(EVENT_TYPES.FRAME_UPDATE),
    'Should receive frame updates'
  );
});

test('Integration: Multiple subscribers during game', async () => {
  const gameSession = new GameSession({
    seed: 12345,
    llmService: null
  });

  const gameService = new GameService(gameSession);
  await gameService.initialize();

  const game = new StandaloneAutonomousGame(gameService, {
    frameDelay: 100,
    maxFrames: 5
  });

  const counts = { sub1: 0, sub2: 0, sub3: 0 };

  statePublisher.subscribe({
    id: 'multi-1',
    onStateUpdate: () => counts.sub1++
  });

  statePublisher.subscribe({
    id: 'multi-2',
    onStateUpdate: () => counts.sub2++
  });

  statePublisher.subscribe({
    id: 'multi-3',
    onStateUpdate: () => counts.sub3++
  });

  await game.run();

  assertGreaterThan(counts.sub1, 0, 'Sub1 should receive updates');
  assertGreaterThan(counts.sub2, 0, 'Sub2 should receive updates');
  assertGreaterThan(counts.sub3, 0, 'Sub3 should receive updates');
  assertEqual(counts.sub1, counts.sub2, 'All subs should receive same count');
  assertEqual(counts.sub2, counts.sub3, 'All subs should receive same count');
});

test('Integration: Subscribe during game', async () => {
  const gameSession = new GameSession({
    seed: 12345,
    llmService: null
  });

  const gameService = new GameService(gameSession);
  await gameService.initialize();

  const game = new StandaloneAutonomousGame(gameService, {
    frameDelay: 100,
    maxFrames: 10
  });

  let earlyCount = 0;
  let lateCount = 0;

  statePublisher.subscribe({
    id: 'early-sub',
    onStateUpdate: () => earlyCount++
  });

  // Start game
  const gamePromise = game.run();

  // Subscribe after 300ms (should miss ~3 frames)
  await new Promise(resolve => setTimeout(resolve, 300));

  statePublisher.subscribe({
    id: 'late-sub',
    onStateUpdate: () => lateCount++
  });

  await gamePromise;

  assertGreaterThan(earlyCount, lateCount, 'Early sub should have more updates');
  assertGreaterThan(lateCount, 0, 'Late sub should still get updates');
});

test('Integration: Unsubscribe during game', async () => {
  const gameSession = new GameSession({
    seed: 12345,
    llmService: null
  });

  const gameService = new GameService(gameSession);
  await gameService.initialize();

  const game = new StandaloneAutonomousGame(gameService, {
    frameDelay: 100,
    maxFrames: 10
  });

  let count = 0;

  const id = statePublisher.subscribe({
    id: 'unsub-test',
    onStateUpdate: () => count++
  });

  // Start game
  const gamePromise = game.run();

  // Unsubscribe after 300ms
  await new Promise(resolve => setTimeout(resolve, 300));
  const countAtUnsubscribe = count;
  statePublisher.unsubscribe(id);

  await gamePromise;

  const finalCount = count;
  assertEqual(countAtUnsubscribe, finalCount, 'Count should not increase after unsubscribe');
});

test('Integration: Event types are correct', async () => {
  const gameSession = new GameSession({
    seed: 12345,
    llmService: null
  });

  const gameService = new GameService(gameSession);
  await gameService.initialize();

  const game = new StandaloneAutonomousGame(gameService, {
    frameDelay: 100,
    maxFrames: 10,
    maxTurnsPerConversation: 2
  });

  const eventTypes = new Set();

  statePublisher.subscribe({
    id: 'event-type-checker',
    onStateUpdate: (state, eventType) => {
      eventTypes.add(eventType);
    }
  });

  await game.run();

  assert(eventTypes.has(EVENT_TYPES.FRAME_UPDATE), 'Should have frame updates');
  // Other events depend on game behavior
});

test('Integration: State is valid', async () => {
  const gameSession = new GameSession({
    seed: 12345,
    llmService: null
  });

  const gameService = new GameService(gameSession);
  await gameService.initialize();

  const game = new StandaloneAutonomousGame(gameService, {
    frameDelay: 100,
    maxFrames: 5
  });

  let lastState = null;

  statePublisher.subscribe({
    id: 'state-validator',
    onStateUpdate: (state, eventType) => {
      // Validate state structure
      assert(state, 'State should exist');
      assert(state.frame !== undefined, 'State should have frame');
      assert(state.time, 'State should have time');
      assert(state.characters, 'State should have characters');
      assert(state.location, 'State should have location');

      lastState = state;
    }
  });

  await game.run();

  assert(lastState, 'Should have received state');
  assertGreaterThan(lastState.frame, 0, 'Frame should have advanced');
});

test('Integration: Performance metrics work', async () => {
  const gameSession = new GameSession({
    seed: 12345,
    llmService: null
  });

  const gameService = new GameService(gameSession);
  await gameService.initialize();

  const game = new StandaloneAutonomousGame(gameService, {
    frameDelay: 100,
    maxFrames: 10
  });

  statePublisher.subscribe({
    id: 'perf-test',
    onStateUpdate: () => {}
  });

  await game.run();

  const metrics = statePublisher.getMetrics();

  assertGreaterThan(metrics.publishCount, 0, 'Should have publishes');
  assertGreaterThan(metrics.totalEventsSent, 0, 'Should have sent events');
  assert(metrics.averagePublishTimeMs >= 0, 'Average time should be >= 0');
});

test('Integration: Pause/resume publishes correct events', async () => {
  const gameSession = new GameSession({
    seed: 12345,
    llmService: null
  });

  const gameService = new GameService(gameSession);
  await gameService.initialize();

  const game = new StandaloneAutonomousGame(gameService, {
    frameDelay: 100,
    maxFrames: 20
  });

  const pauseEvents = [];

  statePublisher.subscribe({
    id: 'pause-test',
    onStateUpdate: (state, eventType, metadata) => {
      if (eventType === EVENT_TYPES.PAUSE_TOGGLED) {
        pauseEvents.push(metadata);
      }
    }
  });

  // Start game
  const gamePromise = game.run();

  // Pause after 200ms
  await new Promise(resolve => setTimeout(resolve, 200));
  game.pause();

  // Resume after 200ms
  await new Promise(resolve => setTimeout(resolve, 200));
  game.resume();

  await gamePromise;

  assertGreaterThan(pauseEvents.length, 0, 'Should have pause events');

  const pauseEvent = pauseEvents.find(e => e.paused === true);
  const resumeEvent = pauseEvents.find(e => e.paused === false);

  assert(pauseEvent, 'Should have pause event');
  assert(resumeEvent, 'Should have resume event');
});

// ============================================================================
// Run Tests
// ============================================================================

runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
