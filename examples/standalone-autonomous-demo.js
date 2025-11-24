/**
 * Standalone Autonomous Game Demo
 *
 * This demonstrates how to use StandaloneAutonomousGame in a headless
 * Node.js environment without any Electron or UI dependencies.
 *
 * Usage:
 *   node examples/standalone-autonomous-demo.js
 */

import { StandaloneAutonomousGame } from '../src/services/StandaloneAutonomousGame.js';
import { GameService } from '../src/services/GameService.js';
import { GameSession } from '../src/game/GameSession.js';

// ANSI color codes for pretty terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

/**
 * Example 1: Headless mode (no callbacks)
 * Perfect for automated tests or batch processing
 */
async function example1_headless() {
  console.log('\n' + colors.bright + colors.cyan + '=== Example 1: Headless Mode ===' + colors.reset);
  console.log('Running game silently for 10 frames...\n');

  // Create game session and service
  const session = new GameSession({ seed: 12345 });
  await session.initialize();
  const gameService = new GameService(session);
  await gameService.initialize();

  // Create autonomous game with NO callbacks
  const game = new StandaloneAutonomousGame(gameService, {
    frameDelay: 100, // Fast for demo
    timeDeltaMin: 5,
    timeDeltaMax: 10
  });

  const startTime = Date.now();
  const stats = await game.run(10); // Run for 10 frames silently
  const elapsed = Date.now() - startTime;

  console.log(colors.green + '✓ Completed!' + colors.reset);
  console.log(colors.dim + `  Frames: ${stats.framesPlayed}` + colors.reset);
  console.log(colors.dim + `  Time: ${elapsed}ms` + colors.reset);
  console.log(colors.dim + `  Events: ${stats.eventCount}` + colors.reset);
  console.log(colors.dim + `  Conversations: ${stats.conversationsHeld}` + colors.reset);
}

/**
 * Example 2: With event callback for logging
 * Great for CLI tools and debugging
 */
async function example2_withLogging() {
  console.log('\n' + colors.bright + colors.cyan + '=== Example 2: With Event Logging ===' + colors.reset);
  console.log('Running game with event logging for 5 frames...\n');

  const session = new GameSession({ seed: 67890 });
  await session.initialize();
  const gameService = new GameService(session);
  await gameService.initialize();

  // Event counter for stats
  const eventCounts = {};

  // Create autonomous game WITH callback
  const game = new StandaloneAutonomousGame(gameService, {
    enableEventCallback: true,
    eventCallback: (event) => {
      // Count events by type
      eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;

      // Log key events
      if (event.type === 'time_advanced') {
        console.log(colors.dim + `  [Frame ${event.frame}] Time advanced +${event.data.delta}min` + colors.reset);
      } else if (event.type === 'action_decided') {
        console.log(colors.yellow + `  [Frame ${event.frame}] Decision: ${event.data.action}` + colors.reset);
        console.log(colors.dim + `    Reason: ${event.data.reason}` + colors.reset);
      } else if (event.type === 'conversation_started') {
        console.log(colors.magenta + `  [Frame ${event.frame}] Conversation with ${event.data.npcName}` + colors.reset);
      } else if (event.type === 'dialogue_line') {
        const speaker = event.data.speakerName;
        const text = event.data.text.substring(0, 60) + (event.data.text.length > 60 ? '...' : '');
        console.log(colors.blue + `    ${speaker}: ${text}` + colors.reset);
      }
    },
    frameDelay: 500,
    maxTurnsPerConversation: 3,
    pauseBetweenTurns: 200,
    pauseBetweenConversations: 300,
    pauseBetweenActions: 200
  });

  const stats = await game.run(5);

  console.log('\n' + colors.green + '✓ Completed!' + colors.reset);
  console.log(colors.bright + 'Event Summary:' + colors.reset);
  for (const [type, count] of Object.entries(eventCounts)) {
    console.log(colors.dim + `  ${type}: ${count}` + colors.reset);
  }
  console.log(colors.bright + '\nGame Stats:' + colors.reset);
  console.log(colors.dim + `  Frames: ${stats.framesPlayed}` + colors.reset);
  console.log(colors.dim + `  Events: ${stats.eventCount}` + colors.reset);
  console.log(colors.dim + `  Conversations: ${stats.conversationsHeld}` + colors.reset);
}

/**
 * Example 3: Pause/Resume/Speed control
 * Shows how to control the game dynamically
 */
async function example3_controls() {
  console.log('\n' + colors.bright + colors.cyan + '=== Example 3: Pause/Resume/Speed Control ===' + colors.reset);
  console.log('Running game with dynamic controls...\n');

  const session = new GameSession({ seed: 11111 });
  await session.initialize();
  const gameService = new GameService(session);
  await gameService.initialize();

  const game = new StandaloneAutonomousGame(gameService, {
    enableEventCallback: true,
    eventCallback: (event) => {
      if (event.type === 'paused') {
        console.log(colors.yellow + `  [Frame ${event.frame}] ⏸ PAUSED` + colors.reset);
      } else if (event.type === 'resumed') {
        console.log(colors.green + `  [Frame ${event.frame}] ▶ RESUMED` + colors.reset);
      } else if (event.type === 'speed_changed') {
        console.log(colors.cyan + `  [Frame ${event.frame}] Speed: ${event.data.oldSpeed}x → ${event.data.newSpeed}x` + colors.reset);
      }
    },
    frameDelay: 1000
  });

  // Run in background
  const runPromise = game.run(20);

  // Schedule controls
  setTimeout(() => {
    console.log(colors.bright + '\n→ Speeding up to 2x...' + colors.reset);
    game.setSpeed(2);
  }, 2000);

  setTimeout(() => {
    console.log(colors.bright + '\n→ Pausing game...' + colors.reset);
    game.pause();
  }, 4000);

  setTimeout(() => {
    console.log(colors.bright + '\n→ Resuming game...' + colors.reset);
    game.resume();
  }, 6000);

  setTimeout(() => {
    console.log(colors.bright + '\n→ Slowing down to 0.5x...' + colors.reset);
    game.setSpeed(0.5);
  }, 8000);

  setTimeout(() => {
    console.log(colors.bright + '\n→ Stopping game early...' + colors.reset);
    game.stop();
  }, 10000);

  const stats = await runPromise;

  console.log('\n' + colors.green + '✓ Completed!' + colors.reset);
  console.log(colors.dim + `  Frames completed: ${stats.framesPlayed} / 20` + colors.reset);
}

/**
 * Example 4: Event history analysis
 * Shows how to capture and analyze all events
 */
async function example4_eventHistory() {
  console.log('\n' + colors.bright + colors.cyan + '=== Example 4: Event History Analysis ===' + colors.reset);
  console.log('Running game and analyzing event history...\n');

  const session = new GameSession({ seed: 22222 });
  await session.initialize();
  const gameService = new GameService(session);
  await gameService.initialize();

  const game = new StandaloneAutonomousGame(gameService, {
    frameDelay: 100,
    timeDeltaMin: 5,
    timeDeltaMax: 10
  });

  await game.run(10);

  // Analyze event history
  const history = game.getEventHistory();
  const eventTypes = {};

  for (const event of history) {
    eventTypes[event.type] = (eventTypes[event.type] || 0) + 1;
  }

  console.log(colors.green + '✓ Completed!' + colors.reset);
  console.log(colors.bright + '\nEvent Type Distribution:' + colors.reset);

  const sortedTypes = Object.entries(eventTypes).sort((a, b) => b[1] - a[1]);
  for (const [type, count] of sortedTypes) {
    const bar = '█'.repeat(Math.ceil(count / 2));
    console.log(colors.dim + `  ${type.padEnd(25)} ${bar} ${count}` + colors.reset);
  }

  console.log(colors.bright + '\nTotal Events:' + colors.reset + colors.dim + ` ${history.length}` + colors.reset);
}

/**
 * Main function
 */
async function main() {
  console.log(colors.bright + colors.green);
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║     Standalone Autonomous Game - Demo & Examples         ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  try {
    await example1_headless();
    await example2_withLogging();
    await example3_controls();
    await example4_eventHistory();

    console.log('\n' + colors.bright + colors.green + '✓ All examples completed successfully!' + colors.reset);
    console.log(colors.dim + '\nKey takeaways:' + colors.reset);
    console.log(colors.dim + '  • No Electron or UI dependencies required' + colors.reset);
    console.log(colors.dim + '  • Can run completely headless (perfect for tests)' + colors.reset);
    console.log(colors.dim + '  • Optional event callbacks for logging/monitoring' + colors.reset);
    console.log(colors.dim + '  • Full control: pause, resume, speed, stop' + colors.reset);
    console.log(colors.dim + '  • Complete event history for analysis' + colors.reset);

  } catch (error) {
    console.error(colors.red + '\n✗ Error running examples:' + colors.reset, error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { example1_headless, example2_withLogging, example3_controls, example4_eventHistory };
