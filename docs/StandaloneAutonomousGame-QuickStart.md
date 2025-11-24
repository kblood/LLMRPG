# StandaloneAutonomousGame - Quick Start Guide

A 5-minute guide to get you running autonomous games without any UI dependencies.

## Installation

```javascript
import { StandaloneAutonomousGame } from './src/services/StandaloneAutonomousGame.js';
import { GameService } from './src/services/GameService.js';
import { GameSession } from './src/game/GameSession.js';
```

## Quick Start (30 seconds)

```javascript
// 1. Create game session
const session = new GameSession({ seed: 12345 });
await session.initialize();

// 2. Create game service
const gameService = new GameService(session);
await gameService.initialize();

// 3. Create autonomous game
const game = new StandaloneAutonomousGame(gameService);

// 4. Run!
const stats = await game.run(100);

console.log(`Completed ${stats.framesPlayed} frames!`);
```

## Common Scenarios

### Scenario 1: Automated Testing

```javascript
// Fast, silent, perfect for CI/CD
const game = new StandaloneAutonomousGame(gameService, {
  frameDelay: 0  // No delay = maximum speed
});

const stats = await game.run(1000);

expect(stats.framesPlayed).toBe(1000);
```

### Scenario 2: CLI Game with Logging

```javascript
// Pretty console output
const game = new StandaloneAutonomousGame(gameService, {
  enableEventCallback: true,
  eventCallback: (event) => {
    if (event.type === 'dialogue_line') {
      console.log(`${event.data.speakerName}: ${event.data.text}`);
    }
  }
});

await game.run();
```

### Scenario 3: UI Integration

```javascript
// Forward events to your UI
const game = new StandaloneAutonomousGame(gameService, {
  enableEventCallback: true,
  eventCallback: (event) => {
    window.electron.send('game-event', event);
  }
});

await game.run();
```

### Scenario 4: Interactive Control

```javascript
const game = new StandaloneAutonomousGame(gameService);

// Start running
const runPromise = game.run(1000);

// Control during gameplay
document.getElementById('pause').onclick = () => game.pause();
document.getElementById('resume').onclick = () => game.resume();
document.getElementById('stop').onclick = () => game.stop();
document.getElementById('fast').onclick = () => game.setSpeed(2);

await runPromise;
```

## Event Types Cheat Sheet

```javascript
const game = new StandaloneAutonomousGame(gameService, {
  enableEventCallback: true,
  eventCallback: (event) => {
    switch (event.type) {
      case 'game_started':      // Game begins
      case 'game_ended':        // Game completes
      case 'time_advanced':     // Time progresses
      case 'action_decided':    // AI decides action
      case 'action_started':    // Action begins
      case 'action_completed':  // Action finishes
      case 'conversation_started':  // Dialogue begins
      case 'dialogue_line':     // Someone speaks
      case 'conversation_ended':    // Dialogue ends
      case 'combat_started':    // Combat begins
      case 'combat_ended':      // Combat ends
      case 'quest_completed':   // Quest done
      case 'victory':           // Game won!
      case 'paused':            // Game paused
      case 'resumed':           // Game resumed
      case 'stopped':           // Game stopped
      case 'speed_changed':     // Speed adjusted
      case 'error':             // Error occurred
    }
  }
});
```

## Control Methods Cheat Sheet

```javascript
const game = new StandaloneAutonomousGame(gameService);

// Running
game.run()              // Run until stopped
game.run(100)           // Run for 100 frames
game.stop()             // Stop completely

// Pausing
game.pause()            // Pause
game.resume()           // Resume

// Speed
game.setSpeed(2.0)      // 2x speed
game.setSpeed(0.5)      // Half speed
game.getSpeed()         // Get current speed

// Queries
game.isGameRunning()    // Is running?
game.isGamePaused()     // Is paused?
game.getCurrentFrame()  // Current frame
game.getStats()         // Game statistics
game.getEventHistory()  // All events
game.getEventHistory(10) // Last 10 events
```

## Configuration Cheat Sheet

```javascript
const game = new StandaloneAutonomousGame(gameService, {
  // Events
  enableEventCallback: false,     // Enable callback?
  eventCallback: (e) => {},       // Callback function

  // Timing
  frameDelay: 1000,               // MS between frames
  maxFrames: Infinity,            // Max frames to run
  timeDeltaMin: 5,                // Min time advance (minutes)
  timeDeltaMax: 15,               // Max time advance (minutes)

  // Conversation
  maxTurnsPerConversation: 10,    // Max conversation turns
  pauseBetweenTurns: 2000,        // MS between turns
  pauseBetweenConversations: 3000, // MS between conversations
  pauseBetweenActions: 2000,      // MS between actions

  // Reproducibility
  seed: Date.now()                // Random seed
});
```

## Testing Pattern

```javascript
describe('My Game Test', () => {
  let game;

  beforeEach(async () => {
    const session = new GameSession({ seed: 12345 });
    await session.initialize();
    const gameService = new GameService(session);
    await gameService.initialize();

    game = new StandaloneAutonomousGame(gameService, {
      frameDelay: 0
    });
  });

  afterEach(() => {
    if (game.isGameRunning()) {
      game.stop();
    }
  });

  it('should run successfully', async () => {
    const stats = await game.run(10);
    expect(stats.framesPlayed).toBe(10);
  });
});
```

## Common Patterns

### Pattern 1: Event Filtering

```javascript
const importantEvents = [];

const game = new StandaloneAutonomousGame(gameService, {
  enableEventCallback: true,
  eventCallback: (event) => {
    // Only track dialogue and combat
    if (event.type.includes('dialogue') || event.type.includes('combat')) {
      importantEvents.push(event);
    }
  }
});

await game.run();
```

### Pattern 2: Performance Monitoring

```javascript
let eventCount = 0;
const startTime = Date.now();

const game = new StandaloneAutonomousGame(gameService, {
  enableEventCallback: true,
  eventCallback: () => eventCount++,
  frameDelay: 0
});

await game.run(1000);

const elapsed = Date.now() - startTime;
console.log(`Events/sec: ${eventCount / (elapsed / 1000)}`);
```

### Pattern 3: Conditional Stop

```javascript
const game = new StandaloneAutonomousGame(gameService, {
  enableEventCallback: true,
  eventCallback: (event) => {
    if (event.type === 'victory') {
      console.log('🎉 Victory achieved!');
      game.stop();
    }
    if (event.type === 'error') {
      console.error('Error:', event.data.message);
      game.stop();
    }
  }
});

await game.run(Infinity); // Run until victory or error
```

### Pattern 4: Multi-Game Benchmark

```javascript
const seeds = [12345, 67890, 11111];
const results = [];

for (const seed of seeds) {
  const session = new GameSession({ seed });
  await session.initialize();
  const gameService = new GameService(session);
  await gameService.initialize();

  const game = new StandaloneAutonomousGame(gameService, {
    frameDelay: 0,
    seed
  });

  const stats = await game.run(100);
  results.push({ seed, stats });
}

console.table(results);
```

## Debugging

### Enable verbose logging

```javascript
const game = new StandaloneAutonomousGame(gameService, {
  enableEventCallback: true,
  eventCallback: (event) => {
    console.log(
      `[Frame ${event.frame}] ${event.type}`,
      JSON.stringify(event.data, null, 2)
    );
  }
});
```

### Track specific events

```javascript
const dialogueLines = [];

const game = new StandaloneAutonomousGame(gameService, {
  enableEventCallback: true,
  eventCallback: (event) => {
    if (event.type === 'dialogue_line') {
      dialogueLines.push(`${event.data.speakerName}: ${event.data.text}`);
    }
  }
});

await game.run(10);

console.log('Dialogue transcript:');
console.log(dialogueLines.join('\n'));
```

### Analyze event distribution

```javascript
const eventCounts = {};

const game = new StandaloneAutonomousGame(gameService, {
  enableEventCallback: true,
  eventCallback: (event) => {
    eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
  }
});

await game.run(100);

console.log('Event distribution:');
console.table(eventCounts);
```

## Troubleshooting

### Problem: Game doesn't start

**Solution:** Make sure to initialize GameService first:

```javascript
const gameService = new GameService(session);
await gameService.initialize();  // ← Don't forget!
```

### Problem: Callbacks not firing

**Solution:** Enable event callbacks:

```javascript
const game = new StandaloneAutonomousGame(gameService, {
  enableEventCallback: true,  // ← Must be true
  eventCallback: (event) => console.log(event)
});
```

### Problem: Game runs too fast

**Solution:** Increase frame delay or reduce speed:

```javascript
const game = new StandaloneAutonomousGame(gameService, {
  frameDelay: 2000  // 2 seconds per frame
});

// Or
game.setSpeed(0.5);  // Half speed
```

### Problem: Game runs too slow

**Solution:** Decrease frame delay or increase speed:

```javascript
const game = new StandaloneAutonomousGame(gameService, {
  frameDelay: 100  // 100ms per frame
});

// Or
game.setSpeed(2.0);  // Double speed
```

### Problem: Memory usage growing

**Solution:** Limit event history size:

```javascript
const game = new StandaloneAutonomousGame(gameService);
game.maxEventHistory = 1000;  // Keep only last 1000 events
```

## Best Practices

✅ **DO:**
- Use `frameDelay: 0` for tests
- Set `seed` for reproducible tests
- Clean up with `game.stop()` in finally blocks
- Use headless mode when you don't need events
- Monitor event history size for long-running games

❌ **DON'T:**
- Don't enable callbacks in unit tests unless needed
- Don't forget to initialize GameService
- Don't let event history grow unbounded
- Don't use `frameDelay: 0` for real-time gameplay
- Don't call methods on stopped games

## Next Steps

- Read full documentation: `docs/StandaloneAutonomousGame.md`
- Run examples: `node examples/standalone-autonomous-demo.js`
- Run tests: `npm test tests/standalone-autonomous-game.test.js`
- See integration example: `examples/integrate-with-gamebackend.js`

## Help

If you get stuck:
1. Check the error message
2. Verify GameService is initialized
3. Look at the examples
4. Check event history for clues
5. Enable verbose logging

Happy autonomous gaming! 🎮
