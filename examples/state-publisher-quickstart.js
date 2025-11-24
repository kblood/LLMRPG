#!/usr/bin/env node

/**
 * StatePublisher Quick Start Example
 *
 * A minimal example showing how to use StatePublisher
 * Run: node examples/state-publisher-quickstart.js
 */

import { statePublisher, EVENT_TYPES } from '../src/services/StatePublisher.js';

console.log('StatePublisher Quick Start Example');
console.log('='.repeat(50));
console.log();

// ============================================================================
// 1. Basic Subscription
// ============================================================================

console.log('1. Creating a simple subscriber...');

const mySubscriber = {
  id: 'my-ui',

  onStateUpdate: (state, eventType, metadata) => {
    console.log(`  [State Update] ${eventType}`);
    console.log(`    Frame: ${state.frame}`);
    if (metadata) {
      console.log(`    Metadata:`, metadata);
    }
  },

  onGameEvent: (event) => {
    console.log(`  [Game Event] ${event.type}`, event);
  }
};

statePublisher.subscribe(mySubscriber);
console.log('  Subscribed!\n');

// ============================================================================
// 2. Publish State
// ============================================================================

console.log('2. Publishing state updates...');

// Simulate game state
const gameState1 = {
  frame: 1,
  time: { gameTimeString: '08:00', day: 1 },
  characters: { npcs: [] },
  location: { current: 'Town Square' },
  quests: { active: [] }
};

statePublisher.publish(gameState1, EVENT_TYPES.FRAME_UPDATE, {
  timeDelta: 1
});

console.log();

// ============================================================================
// 3. Different Event Types
// ============================================================================

console.log('3. Publishing different event types...');

const gameState2 = { ...gameState1, frame: 2 };
statePublisher.publish(gameState2, EVENT_TYPES.DIALOGUE_STARTED, {
  npcName: 'John',
  location: 'Town Square'
});

console.log();

// ============================================================================
// 4. Broadcast Custom Events
// ============================================================================

console.log('4. Broadcasting custom events...');

statePublisher.broadcast({
  type: 'custom_notification',
  message: 'Player leveled up!',
  level: 2
});

console.log();

// ============================================================================
// 5. Check Metrics
// ============================================================================

console.log('5. Checking metrics...');

const metrics = statePublisher.getMetrics();
console.log('  Metrics:', {
  subscribers: metrics.subscriberCount,
  publishes: metrics.publishCount,
  broadcasts: metrics.broadcastCount,
  avgTime: metrics.averagePublishTimeMs + 'ms'
});

console.log();

// ============================================================================
// 6. Multiple Subscribers
// ============================================================================

console.log('6. Adding more subscribers...');

statePublisher.subscribe({
  id: 'logger',
  onStateUpdate: (state, eventType) => {
    console.log(`  [Logger] Frame ${state.frame}: ${eventType}`);
  }
});

const gameState3 = { ...gameState1, frame: 3 };
statePublisher.publish(gameState3, EVENT_TYPES.FRAME_UPDATE);

console.log();

// ============================================================================
// 7. Unsubscribe
// ============================================================================

console.log('7. Unsubscribing...');

statePublisher.unsubscribe('my-ui');
console.log('  Unsubscribed "my-ui"');

const gameState4 = { ...gameState1, frame: 4 };
statePublisher.publish(gameState4, EVENT_TYPES.FRAME_UPDATE);
console.log('  (Only logger received this update)\n');

// ============================================================================
// Summary
// ============================================================================

console.log('='.repeat(50));
console.log('Quick Start Complete!');
console.log();
console.log('Key Takeaways:');
console.log('  ✓ Subscribe with onStateUpdate and/or onGameEvent');
console.log('  ✓ Publish state with event type');
console.log('  ✓ Broadcast custom events');
console.log('  ✓ Check metrics and manage subscribers');
console.log();
console.log('Next Steps:');
console.log('  - See examples/state-publisher-example.js for full demos');
console.log('  - See docs/StatePublisher.md for documentation');
console.log('  - Run tests/test-state-publisher-integration.js for tests');
console.log();
