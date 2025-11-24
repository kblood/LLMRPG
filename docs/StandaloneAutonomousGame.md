# StandaloneAutonomousGame

A completely standalone, event-based autonomous game engine that runs without any Electron or UI dependencies.

## Overview

`StandaloneAutonomousGame` is a pure Node.js implementation of an autonomous RPG game loop. It's designed to be:

- **Standalone**: Zero dependencies on Electron, IPC, or UI frameworks
- **Event-Based**: All game events are emitted and can be captured
- **Optional Callbacks**: Can run completely silently or with event callbacks
- **Testable**: Perfect for automated testing and CI/CD
- **Controllable**: Pause, resume, stop, and speed control
- **Headless**: Runs in Node.js without any graphical interface

## Architecture

```
┌─────────────────────────────────────┐
│  StandaloneAutonomousGame           │
│                                     │
│  - Completely standalone            │
│  - Event-based architecture         │
│  - Optional callbacks               │
│  - Pause/Resume/Stop controls       │
└─────────────────┬───────────────────┘
                  │
                  │ Uses
                  ▼
          ┌───────────────┐
          │  GameService  │
          │               │
          │  Pure game    │
          │  logic layer  │
          └───────┬───────┘
                  │
                  │ Manages
                  ▼
          ┌───────────────┐
          │  GameSession  │
          │               │
          │  Core game    │
          │  state        │
          └───────────────┘
```

## Installation

```javascript
import { StandaloneAutonomousGame } from './src/services/StandaloneAutonomousGame.js';
import { GameService } from './src/services/GameService.js';
import { GameSession } from './src/game/GameSession.js';
```

## Basic Usage

### Headless Mode (No Callbacks)

Perfect for automated tests or batch processing:

```javascript
// Create game session and service
const session = new GameSession({ seed: 12345 });
await session.initialize();
const gameService = new GameService(session);
await gameService.initialize();

// Create autonomous game with NO callbacks
const game = new StandaloneAutonomousGame(gameService, {
  frameDelay: 100,  // 100ms between frames
  maxFrames: 100    // Run for 100 frames
});

// Run silently
const stats = await game.run();

console.log(`Completed ${stats.framesPlayed} frames`);
console.log(`Held ${stats.conversationsHeld} conversations`);
```

### With Event Callbacks

Great for logging, monitoring, or UI updates:

```javascript
const game = new StandaloneAutonomousGame(gameService, {
  enableEventCallback: true,
  eventCallback: (event) => {
    console.log(`[${event.type}] Frame ${event.frame}:`, event.data);
  },
  frameDelay: 500
});

await game.run();
```

### With Controls

Dynamic control during gameplay:

```javascript
const game = new StandaloneAutonomousGame(gameService, {
  frameDelay: 1000
});

// Run in background
const runPromise = game.run(1000);

// Control the game while running
setTimeout(() => game.setSpeed(2), 2000);     // Double speed
setTimeout(() => game.pause(), 5000);          // Pause
setTimeout(() => game.resume(), 8000);         // Resume
setTimeout(() => game.stop(), 10000);          // Stop early

await runPromise;
```

## Configuration Options

```javascript
const options = {
  // Event System
  enableEventCallback: false,      // Enable optional event callback
  eventCallback: null,             // Function(event) - called for each event

  // Timing
  frameDelay: 1000,                // Milliseconds between frames
  maxFrames: Infinity,             // Maximum frames to run
  timeDeltaMin: 5,                 // Minimum time advance per frame (minutes)
  timeDeltaMax: 15,                // Maximum time advance per frame (minutes)

  // Conversation Settings
  maxTurnsPerConversation: 10,     // Max conversation turns
  pauseBetweenTurns: 2000,         // MS between conversation turns
  pauseBetweenConversations: 3000, // MS between conversations
  pauseBetweenActions: 2000,       // MS between actions

  // Reproducibility
  seed: Date.now()                 // Random seed
};

const game = new StandaloneAutonomousGame(gameService, options);
```

## API Reference

### Main Methods

#### `async run(maxFrames)`
Run the autonomous game loop for N frames.

```javascript
const stats = await game.run(100);
// Returns: { framesPlayed, timeElapsed, conversationsHeld, ... }
```

#### `pause()`
Pause the game loop.

```javascript
game.pause();
```

#### `resume()`
Resume from pause.

```javascript
game.resume();
```

#### `stop()`
Stop the game completely.

```javascript
game.stop();
```

#### `setSpeed(multiplier)`
Change game speed (0.1x to 10.0x).

```javascript
game.setSpeed(2.0);   // 2x speed
game.setSpeed(0.5);   // Half speed
```

### Query Methods

#### `getStats()`
Get current game statistics.

```javascript
const stats = game.getStats();
// Returns: { isRunning, isPaused, currentFrame, speedMultiplier, ... }
```

#### `getEventHistory(count)`
Get event history.

```javascript
const allEvents = game.getEventHistory();
const last10 = game.getEventHistory(10);
```

#### `getCurrentFrame()`
Get current frame number.

```javascript
const frame = game.getCurrentFrame();
```

#### `getSpeed()`
Get current speed multiplier.

```javascript
const speed = game.getSpeed();
```

#### `isGameRunning()`
Check if game is running.

```javascript
if (game.isGameRunning()) {
  // Game is active
}
```

#### `isGamePaused()`
Check if game is paused.

```javascript
if (game.isGamePaused()) {
  // Game is paused
}
```

## Event System

All events are emitted in this format:

```javascript
{
  type: 'event_name',
  frame: 42,
  timestamp: 1234567890,
  data: {
    // Event-specific data
  }
}
```

### Event Types

#### Lifecycle Events
- `game_started` - Game loop started
- `game_ended` - Game loop completed
- `stopped` - Game stopped early
- `paused` - Game paused
- `resumed` - Game resumed
- `speed_changed` - Speed multiplier changed

#### Game Events
- `time_advanced` - Time progressed
- `action_decided` - AI decided on action
- `action_started` - Action execution began
- `action_completed` - Action execution finished

#### Conversation Events
- `conversation_started` - Conversation initiated
- `conversation_ended` - Conversation finished
- `dialogue_line` - Someone spoke

#### Combat Events
- `combat_started` - Combat encounter began
- `combat_ended` - Combat encounter finished

#### Quest Events
- `quest_created` - New quest created
- `quest_completed` - Quest completed
- `victory` - Main quest completed (game won)

#### Error Events
- `error` - Error occurred

### Event Bus Integration

All events are also emitted to the global `EventBus`:

```javascript
import { EventBus } from './src/services/EventBus.js';

// Listen for specific autonomous events
EventBus.on('autonomous:conversation_started', (event) => {
  console.log('Conversation started:', event);
});

// Listen for all autonomous events
EventBus.on('autonomous:*', (event) => {
  console.log('Autonomous event:', event.type);
});
```

## Use Cases

### 1. Automated Testing

```javascript
describe('Game Balance Tests', () => {
  it('should complete 100 frames without errors', async () => {
    const session = new GameSession({ seed: 12345 });
    await session.initialize();
    const gameService = new GameService(session);
    await gameService.initialize();

    const game = new StandaloneAutonomousGame(gameService, {
      frameDelay: 0,  // No delay for fast testing
      maxFrames: 100
    });

    const stats = await game.run();

    expect(stats.framesPlayed).toBe(100);
    expect(stats.eventCount).toBeGreaterThan(0);
  });
});
```

### 2. CLI Game Runner

```javascript
#!/usr/bin/env node

const game = new StandaloneAutonomousGame(gameService, {
  enableEventCallback: true,
  eventCallback: (event) => {
    if (event.type === 'dialogue_line') {
      console.log(`${event.data.speakerName}: ${event.data.text}`);
    }
  }
});

await game.run(1000);
```

### 3. Game AI Training

```javascript
const trainingData = [];

const game = new StandaloneAutonomousGame(gameService, {
  enableEventCallback: true,
  eventCallback: (event) => {
    trainingData.push({
      state: game.getStats(),
      action: event.type,
      data: event.data
    });
  },
  frameDelay: 0
});

await game.run(10000);

// Use trainingData for ML training
```

### 4. Performance Benchmarking

```javascript
const startTime = Date.now();
const startMemory = process.memoryUsage();

const game = new StandaloneAutonomousGame(gameService, {
  frameDelay: 0
});

const stats = await game.run(1000);

const endTime = Date.now();
const endMemory = process.memoryUsage();

console.log(`Time: ${endTime - startTime}ms`);
console.log(`Memory: ${(endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024}MB`);
console.log(`Frames/sec: ${1000 / ((endTime - startTime) / 1000)}`);
```

### 5. Replay Recording

```javascript
const replayData = {
  seed: 12345,
  events: []
};

const game = new StandaloneAutonomousGame(gameService, {
  enableEventCallback: true,
  eventCallback: (event) => {
    replayData.events.push(event);
  },
  seed: replayData.seed
});

await game.run(100);

// Save replay
fs.writeFileSync('replay.json', JSON.stringify(replayData));
```

## Integration with Existing Systems

### With GameBackend (Backward Compatible)

The existing `GameBackend` can use `StandaloneAutonomousGame`:

```javascript
import { StandaloneAutonomousGame } from '../services/StandaloneAutonomousGame.js';

class GameBackend {
  startAutonomousMode() {
    this.autonomousGame = new StandaloneAutonomousGame(this.gameService, {
      enableEventCallback: true,
      eventCallback: (event) => {
        // Forward to Electron IPC
        this.mainWindow.webContents.send('autonomous-event', event);
      }
    });

    this.autonomousGame.run();
  }
}
```

### With Testing Framework

```javascript
import { StandaloneAutonomousGame } from '../src/services/StandaloneAutonomousGame.js';

class GameTestHarness {
  constructor() {
    this.game = null;
    this.events = [];
  }

  async runTest(frames) {
    this.game = new StandaloneAutonomousGame(this.gameService, {
      enableEventCallback: true,
      eventCallback: (event) => this.events.push(event),
      frameDelay: 0
    });

    return await this.game.run(frames);
  }

  assertEvent(type) {
    return this.events.some(e => e.type === type);
  }
}
```

## Best Practices

### 1. Use Headless Mode for Tests

```javascript
// ✅ Good - Fast, no overhead
const game = new StandaloneAutonomousGame(gameService, {
  frameDelay: 0
});

// ❌ Bad - Unnecessary callbacks in tests
const game = new StandaloneAutonomousGame(gameService, {
  enableEventCallback: true,
  eventCallback: (event) => console.log(event)
});
```

### 2. Set Appropriate Frame Delays

```javascript
// For real-time play
const game = new StandaloneAutonomousGame(gameService, {
  frameDelay: 1000  // 1 second per frame
});

// For testing
const game = new StandaloneAutonomousGame(gameService, {
  frameDelay: 0  // No delay
});

// For CLI display
const game = new StandaloneAutonomousGame(gameService, {
  frameDelay: 500  // Half second per frame
});
```

### 3. Handle Errors Gracefully

```javascript
const game = new StandaloneAutonomousGame(gameService, {
  enableEventCallback: true,
  eventCallback: (event) => {
    if (event.type === 'error') {
      console.error('Game error:', event.data.message);
      game.stop();
    }
  }
});

try {
  await game.run();
} catch (error) {
  console.error('Fatal error:', error);
}
```

### 4. Clean Up After Stop

```javascript
const game = new StandaloneAutonomousGame(gameService);

try {
  await game.run(1000);
} finally {
  // Always clean up
  if (game.isGameRunning()) {
    game.stop();
  }
}
```

## Performance Characteristics

- **Memory**: ~1-2MB per 1000 events (configurable history limit)
- **CPU**: Minimal overhead (~1-5ms per frame)
- **Speed**: Can process 100+ frames per second with `frameDelay: 0`
- **Scalability**: Tested up to 10,000+ frames

## Comparison with AutonomousGameService

| Feature | StandaloneAutonomousGame | AutonomousGameService |
|---------|-------------------------|----------------------|
| Electron dependency | ❌ No | ✅ Yes |
| Optional callbacks | ✅ Yes | ❌ No (required) |
| Headless mode | ✅ Yes | ❌ No |
| EventBus integration | ✅ Yes | ⚠️ Partial |
| Speed control | ✅ Yes | ❌ No |
| Pause/Resume | ✅ Yes | ✅ Yes |
| Event history | ✅ Yes | ❌ No |
| Test-friendly | ✅ Yes | ⚠️ Difficult |

## Migration Guide

### From AutonomousGameService

```javascript
// Before (AutonomousGameService)
const autonomousService = new AutonomousGameService({
  session,
  player,
  npcs,
  gameMaster,
  actionSystem,
  onEvent: (type, data) => { /* ... */ }
});

await autonomousService.runGameLoop({ maxIterations: 100 });

// After (StandaloneAutonomousGame)
const gameService = new GameService(session);
await gameService.initialize();

const game = new StandaloneAutonomousGame(gameService, {
  enableEventCallback: true,
  eventCallback: (event) => { /* ... */ },
  maxFrames: 100
});

await game.run();
```

## Examples

See the `examples/standalone-autonomous-demo.js` file for complete working examples:

```bash
node examples/standalone-autonomous-demo.js
```

This runs 4 different examples:
1. Headless mode (no callbacks)
2. With event logging
3. Pause/Resume/Speed control
4. Event history analysis

## Testing

Run the test suite:

```bash
npm test tests/standalone-autonomous-game.test.js
```

Tests cover:
- Headless mode operation
- Event callback system
- Pause/Resume functionality
- Speed control
- Event history
- Statistics tracking
- Integration with GameService

## Troubleshooting

### Game doesn't start

```javascript
// Make sure to initialize GameService first
const gameService = new GameService(session);
await gameService.initialize();  // ← Don't forget this!

const game = new StandaloneAutonomousGame(gameService);
```

### Events not firing

```javascript
// Make sure to enable callbacks
const game = new StandaloneAutonomousGame(gameService, {
  enableEventCallback: true,  // ← Must be true
  eventCallback: (event) => console.log(event)
});
```

### Game runs too fast/slow

```javascript
// Adjust frameDelay
const game = new StandaloneAutonomousGame(gameService, {
  frameDelay: 1000  // Milliseconds between frames
});

// Or use speed control
game.setSpeed(0.5);  // Half speed
game.setSpeed(2.0);  // Double speed
```

## License

Same as parent project.

## Contributing

When contributing to StandaloneAutonomousGame:

1. **No Electron dependencies** - This must remain framework-agnostic
2. **Keep callbacks optional** - Headless mode must always work
3. **Add tests** - All new features need test coverage
4. **Document events** - New event types must be documented
5. **Maintain backwards compatibility** - Don't break existing integrations
