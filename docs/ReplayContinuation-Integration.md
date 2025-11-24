# ReplayContinuation Integration Guide

How to integrate ReplayContinuation into your existing LLMRPG project.

## Prerequisites

Before integrating ReplayContinuation, ensure you have:

1. **ReplayLogger** set up and logging game events
2. **GameService** managing your game logic
3. **GameSession** containing game state
4. At least one saved replay file

## Step 1: Import ReplayContinuation

```javascript
import { ReplayContinuation } from './src/services/ReplayContinuation.js';
```

## Step 2: Basic Integration

### In Your Game Loop

If you're recording replays, you're already set up:

```javascript
import { ReplayLogger } from './src/replay/ReplayLogger.js';
import { GameService } from './src/services/GameService.js';
import { GameSession } from './src/game/GameSession.js';

// Your existing code
const session = new GameSession({ seed: 12345 });
const gameService = new GameService(session);
await gameService.initialize();

// Set up replay logging (you probably already have this)
const replayLogger = new ReplayLogger(12345);
replayLogger.initialize(gameService.getGameState());

// Game loop
for (let i = 0; i < 100; i++) {
  gameService.tick();

  // Log events (you probably already do this)
  replayLogger.logEvent(
    session.frame,
    'tick',
    { time: session.getGameTimeString() },
    'system',
    gameService.getGameState() // Important: include state
  );

  // Add checkpoints for better continuation performance
  if (i % 50 === 0) {
    replayLogger.logCheckpoint(session.frame, gameService.getGameState());
  }
}

// Save replay
await replayLogger.save('./replays/game.replay');
```

## Step 3: Add Continuation Feature

### Option A: Resume from Autosave

```javascript
async function resumeFromAutosave() {
  const autosavePath = './replays/autosave_latest.replay';

  const continuation = new ReplayContinuation(autosavePath);
  await continuation.loadReplay();

  const gameService = await continuation.continueAsNewGame({
    newSeed: Date.now(),
    model: 'granite4:3b'
  });

  return gameService;
}
```

### Option B: Load Saved Game

```javascript
async function loadSavedGame(savePath) {
  const continuation = new ReplayContinuation(savePath);
  await continuation.loadReplay();

  // Get info to show player
  const info = continuation.getReplayInfo();
  console.log(`Loading game from ${new Date(info.timestamp).toLocaleString()}`);
  console.log(`Session at frame ${info.lastFrame}`);

  const gameService = await continuation.continueAsNewGame({
    newSeed: Date.now(),
    model: 'granite4:3b'
  });

  return gameService;
}
```

### Option C: Time Travel / Undo Feature

```javascript
async function undoToFrame(replayPath, targetFrame) {
  const continuation = new ReplayContinuation(replayPath);
  await continuation.loadReplay();

  const gameService = await continuation.continueAsNewGame({
    fromFrame: targetFrame,
    newSeed: Date.now(),
    model: 'granite4:3b'
  });

  return gameService;
}
```

## Step 4: UI Integration

### With StatePublisher

```javascript
import { statePublisher, EVENT_TYPES } from './src/services/StatePublisher.js';

// Set up UI subscriber
statePublisher.subscribe({
  id: 'game-ui',
  onStateUpdate: (state, eventType) => {
    // Update UI with new state
    updateGameUI(state);

    if (eventType === EVENT_TYPES.GAME_STARTED) {
      showMessage('Game continued from replay!');
    }
  }
});

// Continue game - UI updates automatically
const gameService = await continuation.continueAsNewGame();
```

### Menu Integration

```javascript
// In your game menu
async function handleLoadGame(selectedSave) {
  try {
    showLoadingScreen('Loading saved game...');

    const continuation = new ReplayContinuation(selectedSave.path);
    await continuation.loadReplay();

    const info = continuation.getReplayInfo();
    const confirm = await showConfirmDialog(
      `Load game from ${new Date(info.timestamp).toLocaleString()}?\n` +
      `Frame: ${info.lastFrame}\n` +
      `Events: ${info.eventCount}`
    );

    if (!confirm) return;

    const gameService = await continuation.continueAsNewGame({
      newSeed: Date.now(),
      model: 'granite4:3b'
    });

    hideLoadingScreen();
    startGame(gameService);

  } catch (error) {
    showErrorDialog('Failed to load game: ' + error.message);
  }
}
```

## Step 5: Autonomous Game Integration

### Replay Viewer with Continuation

```javascript
import { StandaloneAutonomousGame } from './src/services/StandaloneAutonomousGame.js';

async function replayViewer(replayPath) {
  const continuation = new ReplayContinuation(replayPath);
  await continuation.loadReplay();

  const info = continuation.getReplayInfo();

  console.log('Watching replay...');

  // Play through replay
  let frameCount = 0;
  await continuation.playAndContinue(
    info.lastFrame,
    { newSeed: Date.now() },
    (frame, event) => {
      frameCount++;
      console.log(`[Frame ${frame}] ${event.type}`);
      // Update UI to show replay
    }
  );

  console.log(`\nReplay complete. Continue playing? (Y/n)`);
  const answer = await getUserInput();

  if (answer.toLowerCase() === 'y') {
    // Continue with autonomous game
    const gameService = continuation.reconstructedService;
    const autonomous = new StandaloneAutonomousGame(gameService, {
      maxFrames: 50
    });

    await autonomous.run();
  }
}
```

## Step 6: Error Handling

### Robust Loading

```javascript
async function safeLoadGame(savePath) {
  try {
    // Validate file exists
    if (!fs.existsSync(savePath)) {
      throw new Error('Save file not found');
    }

    // Validate it's a valid replay
    const isValid = await ReplayFile.isValidReplayFile(savePath);
    if (!isValid) {
      throw new Error('Invalid replay file format');
    }

    // Load and continue
    const continuation = new ReplayContinuation(savePath);
    await continuation.loadReplay();

    const gameService = await continuation.continueAsNewGame({
      newSeed: Date.now(),
      model: 'granite4:3b'
    });

    return { success: true, gameService };

  } catch (error) {
    console.error('Failed to load game:', error);

    // Fall back to new game
    return {
      success: false,
      error: error.message,
      fallback: true
    };
  }
}
```

## Step 7: Save Management

### Auto-save with Continuation Support

```javascript
class SaveManager {
  constructor() {
    this.autosaveInterval = 5 * 60 * 1000; // 5 minutes
    this.maxAutosaves = 3;
  }

  async autosave(gameService, replayLogger) {
    const timestamp = Date.now();
    const path = `./replays/autosave_${timestamp}.replay`;

    await replayLogger.save(path);

    // Clean up old autosaves
    await this.cleanupOldAutosaves();

    console.log(`Auto-saved to ${path}`);
  }

  async loadLatestAutosave() {
    const autosaves = await this.getAutosaves();
    if (autosaves.length === 0) {
      throw new Error('No autosaves found');
    }

    const latest = autosaves[0]; // Sorted by timestamp
    const continuation = new ReplayContinuation(latest.path);
    await continuation.loadReplay();

    return await continuation.continueAsNewGame({
      newSeed: Date.now(),
      model: 'granite4:3b'
    });
  }

  async getAutosaves() {
    // Get all autosave files, sorted by date
    const files = fs.readdirSync('./replays')
      .filter(f => f.startsWith('autosave_'))
      .map(f => ({
        path: path.join('./replays', f),
        timestamp: parseInt(f.match(/\d+/)[0])
      }))
      .sort((a, b) => b.timestamp - a.timestamp);

    return files;
  }

  async cleanupOldAutosaves() {
    const autosaves = await this.getAutosaves();

    // Keep only maxAutosaves
    for (let i = this.maxAutosaves; i < autosaves.length; i++) {
      fs.unlinkSync(autosaves[i].path);
    }
  }
}
```

## Step 8: Testing Your Integration

### Verify Continuation Works

```javascript
async function testContinuation() {
  console.log('Testing replay continuation...');

  // Create a test game
  const session = new GameSession({ seed: 12345 });
  const gameService = new GameService(session);
  await gameService.initialize();

  // Add characters
  const protagonist = new Character('player1', 'Test Hero', {
    role: 'protagonist'
  });
  session.addCharacter(protagonist);

  // Run for some frames
  const replayLogger = new ReplayLogger(12345);
  replayLogger.initialize(gameService.getGameState());

  for (let i = 0; i < 10; i++) {
    gameService.tick(5);
    replayLogger.logEvent(
      session.frame,
      'test',
      { frame: i },
      'player1',
      gameService.getGameState()
    );

    if (i % 3 === 0) {
      replayLogger.logCheckpoint(session.frame, gameService.getGameState());
    }
  }

  // Save replay
  const testPath = './replays/test.replay';
  await replayLogger.save(testPath);

  // Test continuation
  const continuation = new ReplayContinuation(testPath);
  await continuation.loadReplay();

  const continuedService = await continuation.continueAsNewGame({
    newSeed: 99999
  });

  console.log('✓ Continuation test passed!');
  console.log(`  Original frame: 10`);
  console.log(`  Continued frame: ${continuedService.getFrame()}`);
  console.log(`  Character count: ${continuedService.getAllCharacters().length}`);

  // Cleanup
  fs.unlinkSync(testPath);
}
```

## Common Integration Patterns

### Pattern 1: Save Slots

```javascript
class SaveSlotManager {
  async saveToSlot(slotNumber, gameService, replayLogger) {
    const path = `./saves/slot_${slotNumber}.replay`;
    await replayLogger.save(path);
  }

  async loadFromSlot(slotNumber) {
    const path = `./saves/slot_${slotNumber}.replay`;
    const continuation = new ReplayContinuation(path);
    await continuation.loadReplay();
    return await continuation.continueAsNewGame();
  }

  async getSlotInfo(slotNumber) {
    const path = `./saves/slot_${slotNumber}.replay`;
    if (!fs.existsSync(path)) return null;

    const continuation = new ReplayContinuation(path);
    await continuation.loadReplay();
    return continuation.getReplayInfo();
  }
}
```

### Pattern 2: Checkpoint System

```javascript
class CheckpointSystem {
  async createCheckpoint(name, gameService, replayLogger) {
    const path = `./checkpoints/${name}.replay`;
    await replayLogger.save(path);
  }

  async restoreCheckpoint(name) {
    const path = `./checkpoints/${name}.replay`;
    const continuation = new ReplayContinuation(path);
    await continuation.loadReplay();
    return await continuation.continueAsNewGame();
  }

  async listCheckpoints() {
    const files = fs.readdirSync('./checkpoints')
      .filter(f => f.endsWith('.replay'));

    const infos = [];
    for (const file of files) {
      const continuation = new ReplayContinuation(`./checkpoints/${file}`);
      await continuation.loadReplay();
      infos.push({
        name: file.replace('.replay', ''),
        info: continuation.getReplayInfo()
      });
    }

    return infos;
  }
}
```

### Pattern 3: Quick Save/Load

```javascript
class QuickSaveSystem {
  async quickSave(gameService, replayLogger) {
    const path = './replays/quicksave.replay';
    await replayLogger.save(path);
    console.log('Quick saved!');
  }

  async quickLoad() {
    const path = './replays/quicksave.replay';
    if (!fs.existsSync(path)) {
      throw new Error('No quick save found');
    }

    const continuation = new ReplayContinuation(path);
    await continuation.loadReplay();
    const gameService = await continuation.continueAsNewGame();

    console.log('Quick loaded!');
    return gameService;
  }

  hasQuickSave() {
    return fs.existsSync('./replays/quicksave.replay');
  }
}
```

## Best Practices for Integration

1. **Always include checkpoints** in your replay logging
2. **Validate replays** before attempting to load
3. **Handle errors gracefully** with fallback to new game
4. **Show progress** when loading large replays
5. **Clear old saves** to manage disk space
6. **Test continuation** after major state changes
7. **Use different seeds** for varied outcomes
8. **Save continuation replays** for debugging

## Complete Integration Example

See `examples/replay-continuation-example.js` for a complete, runnable integration example showing all features.

## Next Steps

1. Read [ReplayContinuation-QuickStart.md](ReplayContinuation-QuickStart.md)
2. Review [ReplayContinuation.md](ReplayContinuation.md) for full API
3. Run `node examples/replay-continuation-example.js`
4. Run `node tests/test-replay-continuation.js`
5. Integrate into your project using patterns above

## Support

For questions or issues with integration:
1. Check this guide
2. Review examples
3. Run tests
4. See main documentation
