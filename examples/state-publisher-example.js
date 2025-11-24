#!/usr/bin/env node

/**
 * StatePublisher Example - Complete Usage Guide
 *
 * This file demonstrates all features of the StatePublisher system:
 * - Basic subscription
 * - Partial subscribers (state-only or event-only)
 * - Debug mode
 * - Performance metrics
 * - Integration with StandaloneAutonomousGame
 * - Custom subscribers for different use cases
 *
 * Run: node examples/state-publisher-example.js
 */

import { GameService } from '../src/services/GameService.js';
import { StandaloneAutonomousGame } from '../src/services/StandaloneAutonomousGame.js';
import { statePublisher, EVENT_TYPES } from '../src/services/StatePublisher.js';
import { GameSession } from '../src/game/GameSession.js';

// ============================================================================
// Example 1: Simple State Logger
// ============================================================================

class SimpleStateLogger {
  constructor() {
    this.id = 'simple-logger';
  }

  onStateUpdate(state, eventType) {
    console.log(`[Frame ${state.frame}] ${eventType}: ${state.time.gameTimeString}`);
  }
}

// ============================================================================
// Example 2: Dialogue Tracker
// ============================================================================

class DialogueTracker {
  constructor() {
    this.id = 'dialogue-tracker';
    this.conversations = [];
    this.totalLines = 0;
  }

  onStateUpdate(state, eventType, metadata) {
    if (eventType === EVENT_TYPES.DIALOGUE_STARTED) {
      console.log(`\n=== Conversation Started with ${metadata.npcName} ===`);
      this.conversations.push({
        npc: metadata.npcName,
        startFrame: state.frame,
        lines: 0
      });
    }

    if (eventType === EVENT_TYPES.DIALOGUE_LINE) {
      console.log(`  ${metadata.speakerName}: "${metadata.text}"`);
      this.totalLines++;
      if (this.conversations.length > 0) {
        this.conversations[this.conversations.length - 1].lines++;
      }
    }

    if (eventType === EVENT_TYPES.DIALOGUE_ENDED) {
      console.log(`=== Conversation Ended (${metadata.turns} turns) ===\n`);
    }
  }

  getStats() {
    return {
      totalConversations: this.conversations.length,
      totalLines: this.totalLines,
      conversations: this.conversations
    };
  }
}

// ============================================================================
// Example 3: Performance Monitor
// ============================================================================

class PerformanceMonitor {
  constructor() {
    this.id = 'perf-monitor';
    this.frameCount = 0;
    this.startTime = Date.now();
    this.eventCounts = {};
  }

  onStateUpdate(state, eventType) {
    // Count events
    this.eventCounts[eventType] = (this.eventCounts[eventType] || 0) + 1;

    if (eventType === EVENT_TYPES.FRAME_UPDATE) {
      this.frameCount++;

      // Report every 10 frames
      if (this.frameCount % 10 === 0) {
        const elapsed = (Date.now() - this.startTime) / 1000;
        const fps = (this.frameCount / elapsed).toFixed(2);
        console.log(`\n[Performance] Frame ${this.frameCount}, FPS: ${fps}`);
      }
    }
  }

  getStats() {
    const elapsed = (Date.now() - this.startTime) / 1000;
    return {
      totalFrames: this.frameCount,
      averageFPS: (this.frameCount / elapsed).toFixed(2),
      elapsedSeconds: elapsed.toFixed(2),
      eventCounts: this.eventCounts
    };
  }
}

// ============================================================================
// Example 4: Event-Only Subscriber
// ============================================================================

class EventLogger {
  constructor() {
    this.id = 'event-logger';
    this.events = [];
  }

  // Only implements onGameEvent - partial subscriber!
  onGameEvent(event) {
    this.events.push(event);
    console.log(`[Event] ${event.type}:`, event);
  }

  getEvents() {
    return this.events;
  }
}

// ============================================================================
// Example 5: State Cache
// ============================================================================

class StateCache {
  constructor(maxSize = 50) {
    this.id = 'state-cache';
    this.cache = [];
    this.maxSize = maxSize;
  }

  onStateUpdate(state, eventType) {
    // Store state snapshot
    this.cache.push({
      state: JSON.parse(JSON.stringify(state)), // Deep copy
      eventType,
      timestamp: Date.now()
    });

    // Trim cache
    if (this.cache.length > this.maxSize) {
      this.cache.shift();
    }
  }

  getStateAt(frame) {
    return this.cache.find(entry => entry.state.frame === frame);
  }

  getStatesBetween(startFrame, endFrame) {
    return this.cache.filter(entry =>
      entry.state.frame >= startFrame &&
      entry.state.frame <= endFrame
    );
  }

  getLatestState() {
    return this.cache[this.cache.length - 1];
  }

  getStats() {
    return {
      cacheSize: this.cache.length,
      maxSize: this.maxSize,
      oldestFrame: this.cache[0]?.state.frame || 0,
      latestFrame: this.cache[this.cache.length - 1]?.state.frame || 0
    };
  }
}

// ============================================================================
// Example 6: Quest Tracker
// ============================================================================

class QuestTracker {
  constructor() {
    this.id = 'quest-tracker';
    this.quests = new Map();
  }

  onStateUpdate(state, eventType, metadata) {
    if (eventType === EVENT_TYPES.QUEST_CREATED) {
      console.log(`\n[Quest] New quest detected!`);
      // Track quests from state
      state.quests.active.forEach(quest => {
        if (!this.quests.has(quest.id)) {
          this.quests.set(quest.id, quest);
          console.log(`  ${quest.title}`);
          console.log(`  Description: ${quest.description}`);
        }
      });
    }

    if (eventType === EVENT_TYPES.QUEST_COMPLETED) {
      console.log(`\n[Quest] Quest completed!`);
    }
  }

  getStats() {
    return {
      totalQuestsTracked: this.quests.size,
      quests: Array.from(this.quests.values())
    };
  }
}

// ============================================================================
// Example 7: Action Statistics
// ============================================================================

class ActionStatistics {
  constructor() {
    this.id = 'action-stats';
    this.actions = {};
    this.totalActions = 0;
  }

  onStateUpdate(state, eventType, metadata) {
    if (eventType === EVENT_TYPES.ACTION_EXECUTED) {
      const actionType = metadata.actionType || 'unknown';
      this.actions[actionType] = (this.actions[actionType] || 0) + 1;
      this.totalActions++;

      console.log(`[Action] ${actionType} at ${metadata.location || 'unknown'}`);
    }
  }

  getStats() {
    return {
      totalActions: this.totalActions,
      actionBreakdown: this.actions,
      mostCommonAction: Object.entries(this.actions)
        .sort(([, a], [, b]) => b - a)[0]
    };
  }
}

// ============================================================================
// Main Example Runner
// ============================================================================

async function runExample() {
  console.log('='.repeat(80));
  console.log('StatePublisher Example - Complete Usage Guide');
  console.log('='.repeat(80));
  console.log();

  // Create game service
  console.log('Setting up game...');
  const gameSession = new GameSession({
    seed: 12345,
    llmService: null, // No LLM needed for basic testing
    worldTheme: {
      setting: 'Fantasy',
      tone: 'Adventure',
      timePeriod: 'Medieval'
    }
  });

  const gameService = new GameService(gameSession);
  await gameService.initialize();

  // Create autonomous game
  const game = new StandaloneAutonomousGame(gameService, {
    frameDelay: 500, // 500ms between frames
    maxFrames: 20, // Run for 20 frames
    maxTurnsPerConversation: 3, // Shorter conversations for demo
    pauseBetweenTurns: 500,
    pauseBetweenConversations: 1000,
    pauseBetweenActions: 500
  });

  console.log('Game setup complete!\n');

  // ============================================================================
  // Subscribe All Example Subscribers
  // ============================================================================

  console.log('Subscribing to state updates...\n');

  const simpleLogger = new SimpleStateLogger();
  const dialogueTracker = new DialogueTracker();
  const perfMonitor = new PerformanceMonitor();
  const eventLogger = new EventLogger();
  const stateCache = new StateCache(30);
  const questTracker = new QuestTracker();
  const actionStats = new ActionStatistics();

  // Subscribe all
  statePublisher.subscribe(simpleLogger);
  statePublisher.subscribe(dialogueTracker);
  statePublisher.subscribe(perfMonitor);
  statePublisher.subscribe(eventLogger);
  statePublisher.subscribe(stateCache);
  statePublisher.subscribe(questTracker);
  statePublisher.subscribe(actionStats);

  console.log('Subscribers registered:');
  statePublisher.getSubscribers().forEach(sub => {
    console.log(`  - ${sub.id} (state: ${sub.hasStateHandler}, events: ${sub.hasEventHandler})`);
  });
  console.log();

  // ============================================================================
  // Enable Debug Mode (Optional)
  // ============================================================================

  // Uncomment to see debug output
  // statePublisher.enableDebug({
  //   logStateUpdates: false,
  //   logEvents: false,
  //   logPerformance: true,
  //   logSubscribers: true
  // });

  // ============================================================================
  // Run the Game
  // ============================================================================

  console.log('Starting game...\n');
  console.log('='.repeat(80));
  console.log();

  const startTime = Date.now();

  try {
    const finalStats = await game.run();

    console.log();
    console.log('='.repeat(80));
    console.log('Game completed!');
    console.log('='.repeat(80));
    console.log();

  } catch (error) {
    console.error('Game error:', error);
  }

  const elapsed = Date.now() - startTime;

  // ============================================================================
  // Display Results
  // ============================================================================

  console.log('\n' + '='.repeat(80));
  console.log('RESULTS SUMMARY');
  console.log('='.repeat(80));
  console.log();

  // StatePublisher Metrics
  console.log('StatePublisher Metrics:');
  const metrics = statePublisher.getMetrics();
  console.log(`  Subscribers: ${metrics.subscriberCount}`);
  console.log(`  Total Publishes: ${metrics.publishCount}`);
  console.log(`  Total Broadcasts: ${metrics.broadcastCount}`);
  console.log(`  Events Sent: ${metrics.totalEventsSent}`);
  console.log(`  Average Publish Time: ${metrics.averagePublishTimeMs}ms`);
  console.log(`  Events Per Publish: ${metrics.eventsPerPublish}`);
  console.log();

  // Performance Monitor Stats
  console.log('Performance Monitor:');
  const perfStats = perfMonitor.getStats();
  console.log(`  Total Frames: ${perfStats.totalFrames}`);
  console.log(`  Average FPS: ${perfStats.averageFPS}`);
  console.log(`  Elapsed: ${perfStats.elapsedSeconds}s`);
  console.log(`  Event Counts:`, perfStats.eventCounts);
  console.log();

  // Dialogue Tracker Stats
  console.log('Dialogue Tracker:');
  const dialogueStats = dialogueTracker.getStats();
  console.log(`  Total Conversations: ${dialogueStats.totalConversations}`);
  console.log(`  Total Lines: ${dialogueStats.totalLines}`);
  if (dialogueStats.conversations.length > 0) {
    console.log('  Conversations:');
    dialogueStats.conversations.forEach((conv, i) => {
      console.log(`    ${i + 1}. ${conv.npc} (${conv.lines} lines, frame ${conv.startFrame})`);
    });
  }
  console.log();

  // Action Statistics
  console.log('Action Statistics:');
  const actionStatsData = actionStats.getStats();
  console.log(`  Total Actions: ${actionStatsData.totalActions}`);
  console.log(`  Action Breakdown:`, actionStatsData.actionBreakdown);
  if (actionStatsData.mostCommonAction) {
    console.log(`  Most Common: ${actionStatsData.mostCommonAction[0]} (${actionStatsData.mostCommonAction[1]}x)`);
  }
  console.log();

  // State Cache Stats
  console.log('State Cache:');
  const cacheStats = stateCache.getStats();
  console.log(`  Cache Size: ${cacheStats.cacheSize}/${cacheStats.maxSize}`);
  console.log(`  Frame Range: ${cacheStats.oldestFrame} - ${cacheStats.latestFrame}`);
  console.log();

  // Quest Tracker Stats
  console.log('Quest Tracker:');
  const questStats = questTracker.getStats();
  console.log(`  Quests Tracked: ${questStats.totalQuestsTracked}`);
  console.log();

  // Event Logger Stats
  console.log('Event Logger:');
  const events = eventLogger.getEvents();
  console.log(`  Total Events Logged: ${events.length}`);
  console.log();

  // ============================================================================
  // Demonstrate Additional Features
  // ============================================================================

  console.log('='.repeat(80));
  console.log('ADDITIONAL FEATURES DEMO');
  console.log('='.repeat(80));
  console.log();

  // Get event history
  console.log('Recent Events from StatePublisher:');
  const recentEvents = statePublisher.getEventHistory(5);
  recentEvents.forEach((event, i) => {
    console.log(`  ${i + 1}. [${event.id}] ${event.eventType} at frame ${event.frame}`);
  });
  console.log();

  // Query state cache
  if (cacheStats.latestFrame > 0) {
    console.log('State Cache Query:');
    const latestState = stateCache.getLatestState();
    console.log(`  Latest State: Frame ${latestState.state.frame}`);
    console.log(`  Time: ${latestState.state.time.gameTimeString}`);
    console.log(`  Location: ${latestState.state.location.current}`);
    console.log();
  }

  // ============================================================================
  // Demonstrate Unsubscribe
  // ============================================================================

  console.log('Demonstrating unsubscribe:');
  console.log(`  Before: ${statePublisher.getSubscribers().length} subscribers`);
  statePublisher.unsubscribe('simple-logger');
  console.log(`  After: ${statePublisher.getSubscribers().length} subscribers`);
  console.log();

  // ============================================================================
  // Manual State Publishing Example
  // ============================================================================

  console.log('Manual State Publishing Example:');
  console.log('  Publishing manual state update...');

  // Create a manual subscriber for this test
  const manualSubscriber = {
    id: 'manual-test',
    onStateUpdate: (state, eventType) => {
      console.log(`  Manual subscriber received: ${eventType}`);
    }
  };

  statePublisher.subscribe(manualSubscriber);

  // Manually publish state
  const currentState = gameService.getGameState();
  statePublisher.publish(currentState, EVENT_TYPES.FRAME_UPDATE, {
    manual: true,
    reason: 'Testing manual publish'
  });

  console.log();

  // ============================================================================
  // Broadcast Example
  // ============================================================================

  console.log('Broadcast Example:');
  console.log('  Broadcasting custom event...');

  statePublisher.broadcast({
    type: 'custom_event',
    message: 'This is a custom event!',
    data: { foo: 'bar' }
  });

  console.log();

  // ============================================================================
  // Final Summary
  // ============================================================================

  console.log('='.repeat(80));
  console.log('EXAMPLE COMPLETE');
  console.log('='.repeat(80));
  console.log();
  console.log('This example demonstrated:');
  console.log('  ✓ Multiple subscriber types (state-only, event-only, both)');
  console.log('  ✓ Automatic integration with StandaloneAutonomousGame');
  console.log('  ✓ Performance monitoring and metrics');
  console.log('  ✓ Event history tracking');
  console.log('  ✓ State caching');
  console.log('  ✓ Dialogue and quest tracking');
  console.log('  ✓ Manual state publishing');
  console.log('  ✓ Custom event broadcasting');
  console.log('  ✓ Subscribe/unsubscribe lifecycle');
  console.log();
  console.log('Total execution time:', (elapsed / 1000).toFixed(2) + 's');
  console.log();
  console.log('See docs/StatePublisher.md for complete documentation.');
  console.log();
}

// ============================================================================
// Run if executed directly
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  runExample().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export {
  SimpleStateLogger,
  DialogueTracker,
  PerformanceMonitor,
  EventLogger,
  StateCache,
  QuestTracker,
  ActionStatistics
};
