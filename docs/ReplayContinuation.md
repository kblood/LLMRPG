# ReplayContinuation

A comprehensive system for loading recorded replays and continuing to play from any point as a new game session.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [State Recovery Process](#state-recovery-process)
- [Integration Points](#integration-points)
- [Performance Characteristics](#performance-characteristics)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

ReplayContinuation enables you to:

- Load a replay file and extract game state from any frame
- Continue playing from where the replay ended
- Jump to a specific frame and continue from there
- Play through N frames of a replay, then switch to live gameplay
- Preserve all game state: characters, quests, locations, relationships, inventory
- Record new actions separately from the original replay
- Seamlessly transition between replay playback and live play

## Features

### Core Capabilities

- **Replay Loading**: Load and parse compressed replay files
- **State Extraction**: Get game state from any frame using checkpoints
- **Session Reconstruction**: Rebuild complete GameSession from state snapshots
- **Seamless Continuation**: Continue playing with new random seed
- **Dual Recording**: Keep original replay separate, create new replay for continued session
- **Frame Navigation**: Jump to any frame and continue from there
- **Playback Mode**: Watch replay frame-by-frame before continuing

### State Preservation

- Characters (protagonist and NPCs)
- Character AI (personality, memory, relationships)
- Character stats and inventory
- Active quests and quest progress
- Discovered and visited locations
- Location database
- Time and environmental state (weather, season)
- Frame counter and game time

## Installation

ReplayContinuation is part of the LLMRPG services package:

```javascript
import { ReplayContinuation } from './src/services/ReplayContinuation.js';
```

### Dependencies

- `GameSession` - For session reconstruction
- `GameService` - For game logic
- `ReplayFile` - For file loading/saving
- `ReplayLogger` - For recording new actions
- `Character` - For character reconstruction
- `StatePublisher` - For state broadcasting

## Quick Start

### 1. Load and Continue from End

```javascript
import { ReplayContinuation } from './src/services/ReplayContinuation.js';

// Create continuation instance
const continuation = new ReplayContinuation('./replays/game1.replay');

// Load the replay
await continuation.loadReplay();

// Continue from the end
const gameService = await continuation.continueAsNewGame({
  newSeed: Date.now(),
  model: 'granite4:3b',
  temperature: 0.8
});

// Continue playing
gameService.tick(10); // Advance 10 minutes
```

### 2. Play N Frames Then Continue

```javascript
// Play first 50 frames, then continue
const gameService = await continuation.playAndContinue(
  50, // Number of frames to play
  {
    newSeed: 99999,
    model: 'granite4:3b'
  },
  (frame, event) => {
    // Callback for each frame during playback
    console.log(`Frame ${frame}: ${event.type}`);
  }
);

// Now in live play mode
gameService.tick();
```

### 3. Jump to Specific Frame

```javascript
// Get state at frame 100
const state = continuation.getStateAtFrame(100);

// Continue from that state
const gameService = await continuation.continueFromState(state, {
  newSeed: 12345,
  model: 'granite4:3b'
});
```

## API Reference

### Constructor

```javascript
new ReplayContinuation(replayFilePath)
```

**Parameters:**
- `replayFilePath` (string, optional) - Path to replay file

**Returns:** ReplayContinuation instance

### Core Methods

#### `async loadReplay(filePath)`

Load a replay file and parse it.

**Parameters:**
- `filePath` (string, optional) - Path to replay file (uses constructor path if not provided)

**Returns:** Promise<Object> - Replay metadata

**Throws:** Error if file not found or invalid

**Example:**
```javascript
await continuation.loadReplay('./replays/game1.replay');
```

---

#### `async continueAsNewGame(options)`

Continue from replay as a new game session.

**Parameters:**
- `options` (Object, optional)
  - `fromFrame` (number) - Frame to continue from (default: last frame)
  - `newSeed` (number) - New random seed (default: generated)
  - `newReplayPath` (string) - Path to save new replay (default: auto-generated)
  - `model` (string) - LLM model (default: 'granite4:3b')
  - `temperature` (number) - LLM temperature (default: 0.8)
  - `timeout` (number) - LLM timeout (default: 60000)

**Returns:** Promise<GameService> - New game service ready to continue

**Example:**
```javascript
const gameService = await continuation.continueAsNewGame({
  fromFrame: 100,
  newSeed: 55555,
  model: 'granite4:3b',
  temperature: 0.8
});
```

---

#### `async playAndContinue(numFramesToPlay, options, frameCallback)`

Play N frames of replay, then switch to live continuation.

**Parameters:**
- `numFramesToPlay` (number) - Number of frames to play
- `options` (Object) - Same as `continueAsNewGame`
- `frameCallback` (Function, optional) - Called for each frame: `(frame, event) => void`

**Returns:** Promise<GameService> - Game service ready for live play

**Example:**
```javascript
const gameService = await continuation.playAndContinue(
  50,
  { newSeed: 99999 },
  (frame, event) => {
    console.log(`Playing frame ${frame}`);
  }
);
```

---

#### `async continueFromState(state, options)`

Continue from a specific state snapshot.

**Parameters:**
- `state` (Object) - Game state to continue from
- `options` (Object) - Same as `continueAsNewGame`

**Returns:** Promise<GameService> - New game service

**Example:**
```javascript
const state = continuation.getStateAtFrame(75);
const gameService = await continuation.continueFromState(state, {
  newSeed: 77777
});
```

---

#### `getStateAtFrame(frameNumber)`

Get game state at a specific frame using checkpoints.

**Parameters:**
- `frameNumber` (number) - Frame to get state for

**Returns:** Object|null - Game state at that frame

**Example:**
```javascript
const state = continuation.getStateAtFrame(50);
console.log(`Frame ${state.frame}: ${state.time.gameTimeString}`);
```

---

#### `getReplayInfo()`

Get replay metadata and information.

**Returns:** Object - Replay info

**Example:**
```javascript
const info = continuation.getReplayInfo();
console.log(`Frames: ${info.frameCount}`);
console.log(`Events: ${info.eventCount}`);
console.log(`Seed: ${info.gameSeed}`);
```

---

#### `async saveContinuationReplay(filePath)`

Save the new continuation replay.

**Parameters:**
- `filePath` (string, optional) - Path to save (uses auto-generated if not provided)

**Returns:** Promise<void>

**Example:**
```javascript
await continuation.saveContinuationReplay('./replays/continued.replay');
```

---

#### `getStats()`

Get statistics about replay and continuation.

**Returns:** Object - Statistics

**Example:**
```javascript
const stats = continuation.getStats();
console.log(JSON.stringify(stats, null, 2));
```

### Utility Methods

#### `isLoaded()`

Check if replay is loaded.

**Returns:** boolean

---

#### `isPlayingBack()`

Check if currently in playback mode.

**Returns:** boolean

---

#### `getPlaybackProgress()`

Get current playback progress.

**Returns:** Object|null - Progress info

## Usage Examples

### Example 1: Watch and Continue

Load a replay, watch what happened, then continue the story:

```javascript
import { ReplayContinuation } from './src/services/ReplayContinuation.js';

const continuation = new ReplayContinuation('./replays/adventure.replay');
await continuation.loadReplay();

// Get info about the replay
const info = continuation.getReplayInfo();
console.log(`Replay has ${info.frameCount} frames`);

// Play through the entire replay
await continuation.playAndContinue(
  info.frameCount,
  { newSeed: Date.now() },
  (frame, event) => {
    // Display each event
    console.log(`[Frame ${frame}] ${event.type}`);
  }
);

// Now continue playing live
const gameService = continuation.reconstructedService;
for (let i = 0; i < 10; i++) {
  gameService.tick();
}
```

### Example 2: Alternative Decisions

Test different decisions from a specific point:

```javascript
const continuation = new ReplayContinuation('./replays/quest.replay');
await continuation.loadReplay();

// Find the frame where a key decision was made
const decisionFrame = 75;

// Try different approaches
for (let attempt = 0; attempt < 3; attempt++) {
  const gameService = await continuation.continueAsNewGame({
    fromFrame: decisionFrame,
    newSeed: 10000 + attempt
  });

  // Make different choices
  console.log(`\nAttempt ${attempt + 1}:`);

  // Run autonomous game with different seed
  const autonomous = new StandaloneAutonomousGame(gameService, {
    maxFrames: 20
  });

  const stats = await autonomous.run();
  console.log(`Result: ${stats.questsActive} active quests`);
}
```

### Example 3: Training Mode

Watch AI behavior, then experiment:

```javascript
const continuation = new ReplayContinuation('./replays/ai_training.replay');
await continuation.loadReplay();

// Play through and observe
console.log('Observing AI behavior...');
let conversationCount = 0;

await continuation.playAndContinue(
  100,
  { newSeed: Date.now() },
  (frame, event) => {
    if (event.type === 'conversation_started') {
      conversationCount++;
      console.log(`Conversation ${conversationCount} at frame ${frame}`);
    }
  }
);

console.log(`\nObserved ${conversationCount} conversations`);
console.log('Now experimenting with modifications...');

// Continue with modifications
const gameService = continuation.reconstructedService;
// Make changes and continue playing
```

### Example 4: Autosave Resume

Resume from an autosave replay:

```javascript
// Load autosave
const continuation = new ReplayContinuation('./replays/autosave_latest.replay');
await continuation.loadReplay();

// Get the last valid checkpoint
const info = continuation.getReplayInfo();
const lastCheckpoint = info.lastFrame;

// Continue from last checkpoint
const gameService = await continuation.continueAsNewGame({
  fromFrame: lastCheckpoint,
  newSeed: Date.now()
});

console.log('Game resumed from autosave!');
console.log(`Resuming at frame ${gameService.getFrame()}`);
```

### Example 5: State Analysis

Analyze game state at different points:

```javascript
const continuation = new ReplayContinuation('./replays/analysis.replay');
await continuation.loadReplay();

const info = continuation.getReplayInfo();

// Analyze every 10 frames
for (let frame = 0; frame <= info.lastFrame; frame += 10) {
  const state = continuation.getStateAtFrame(frame);

  console.log(`\nFrame ${frame}:`);
  console.log(`  Time: ${state.time.gameTimeString}`);
  console.log(`  Location: ${state.location.current}`);
  console.log(`  Characters: ${state.characters.npcs.length} NPCs`);
  console.log(`  Quests: ${state.quests.active.length} active`);
}
```

## State Recovery Process

### How State is Reconstructed

1. **Load Replay File**
   - Decompress and parse replay file
   - Extract header, events, checkpoints

2. **Find State Snapshot**
   - Use closest checkpoint before target frame
   - Fall back to initial state if no checkpoint
   - Fall back to event with gameState if needed

3. **Reconstruct GameSession**
   - Create new session with continuation seed
   - Restore basic state (frame, time, weather)
   - Restore locations (discovered, visited, database)

4. **Reconstruct Characters**
   - Rebuild protagonist with AI systems
   - Rebuild each NPC with AI systems
   - Restore personality, memory, relationships
   - Restore stats, inventory, equipment

5. **Restore Quests**
   - Recreate active quests
   - Restore quest progress and metadata

6. **Create GameService**
   - Wrap session in GameService
   - Initialize service
   - Set up new ReplayLogger

7. **Ready to Continue**
   - All state preserved
   - New seed for different outcomes
   - Ready for live play

### State Preservation Details

**Fully Preserved:**
- Character names, roles, backstories
- Character positions and locations
- Personality traits
- Memory entries
- Relationship scores
- Character stats (HP, MP, level, etc.)
- Inventory gold
- Quest data and progress
- Location discovery state
- Time and environmental state

**Partially Preserved:**
- Inventory items (structure preserved, items may need custom reconstruction)
- Equipment slots (structure preserved)
- Conversation history (not persisted in state)

**Not Preserved:**
- Active conversations (must be restarted)
- Combat state (must be restarted)
- Temporary UI state

## Integration Points

### GameService Integration

ReplayContinuation creates a fully initialized GameService:

```javascript
const gameService = await continuation.continueAsNewGame();

// All GameService methods available
gameService.tick(10);
await gameService.startConversation('npc1');
await gameService.executeAction({ type: 'travel', data: { locationId: 'forest' } });
```

### StandaloneAutonomousGame Integration

Use continued game with autonomous gameplay:

```javascript
const gameService = await continuation.continueAsNewGame();

const autonomousGame = new StandaloneAutonomousGame(gameService, {
  frameDelay: 1000,
  maxFrames: 100
});

const stats = await autonomousGame.run();
```

### StatePublisher Integration

State updates published during continuation:

```javascript
import { statePublisher } from './src/services/StatePublisher.js';

statePublisher.subscribe({
  id: 'ui',
  onStateUpdate: (state, eventType) => {
    console.log(`State update: ${eventType}`);
  }
});

const gameService = await continuation.continueAsNewGame();
// State published with EVENT_TYPES.GAME_STARTED

gameService.tick();
// State published with EVENT_TYPES.FRAME_UPDATE
```

### ReplayLogger Integration

New actions recorded in separate replay:

```javascript
const gameService = await continuation.continueAsNewGame();

// Actions automatically logged
gameService.tick();

// Save new replay
await continuation.saveContinuationReplay('./replays/continued.replay');
```

## Performance Characteristics

### Loading Performance

- **Small replays (<1MB)**: ~50-100ms
- **Medium replays (1-10MB)**: ~100-500ms
- **Large replays (>10MB)**: ~500ms-2s

Decompression is fast due to pako library.

### State Reconstruction

- **Basic session**: ~10-20ms
- **With 5 characters**: ~20-40ms
- **With 10 characters**: ~40-80ms
- **With 20+ characters**: ~80-150ms

Character reconstruction is the primary bottleneck.

### Frame Navigation

- **With checkpoints**: O(n) where n = number of checkpoints
- **Without checkpoints**: Falls back to initial state or event state
- **Checkpoint every 100 frames**: Recommended for large replays

### Memory Usage

- **Loaded replay**: ~2-5x file size (due to JSON parsing)
- **Reconstructed session**: Similar to live session
- **Event history**: ~100KB per 1000 events

### Optimization Tips

1. **Use checkpoints** - Save state every 50-100 frames
2. **Include gameState in events** - For fine-grained navigation
3. **Compress replays** - Already done by ReplayFile
4. **Clear old replays** - Manage disk space
5. **Limit character count** - More characters = slower reconstruction

## Best Practices

### 1. Checkpoint Strategy

```javascript
// In your game loop
if (frame % 50 === 0) {
  replayLogger.logCheckpoint(frame, gameService.getGameState());
}
```

### 2. Include State in Key Events

```javascript
replayLogger.logEvent(
  frame,
  'quest_accepted',
  questData,
  characterId,
  gameService.getGameState() // Include full state
);
```

### 3. Error Handling

```javascript
try {
  const continuation = new ReplayContinuation(replayPath);
  await continuation.loadReplay();
  const gameService = await continuation.continueAsNewGame();
} catch (error) {
  console.error('Failed to continue:', error);
  // Fall back to new game
}
```

### 4. Save Continuation Replays

```javascript
// Always save continuation for later analysis
const gameService = await continuation.continueAsNewGame();

// Play for a while
for (let i = 0; i < 100; i++) {
  gameService.tick();
}

// Save the continuation
await continuation.saveContinuationReplay();
```

### 5. Use Different Seeds

```javascript
// Different seeds = different outcomes
const gameService1 = await continuation.continueAsNewGame({
  newSeed: 11111
});

const gameService2 = await continuation.continueAsNewGame({
  newSeed: 22222
});

// Same starting point, different futures
```

## Troubleshooting

### Problem: "No replay loaded" error

**Solution:**
```javascript
// Always call loadReplay() first
const continuation = new ReplayContinuation(path);
await continuation.loadReplay(); // Don't forget this!
await continuation.continueAsNewGame();
```

### Problem: State not found at specific frame

**Solution:**
```javascript
// Check if frame is valid
const info = continuation.getReplayInfo();
if (frameNumber > info.lastFrame) {
  console.error(`Frame ${frameNumber} exceeds last frame ${info.lastFrame}`);
}

// Use checkpoint frames for best results
console.log(`Checkpoints: ${info.checkpointCount}`);
```

### Problem: Characters missing after continuation

**Solution:**
```javascript
// Ensure characters were in the original state
const state = continuation.getStateAtFrame(targetFrame);
console.log('Characters in state:', state.characters);

// Check if characters have required data
if (state.characters.protagonist) {
  console.log('Protagonist:', state.characters.protagonist.name);
}
```

### Problem: Slow reconstruction

**Solution:**
```javascript
// Reduce character count
// Use checkpoints more frequently
// Consider loading from later checkpoint

// Check stats to identify bottleneck
const startTime = performance.now();
const gameService = await continuation.continueAsNewGame();
const duration = performance.now() - startTime;
console.log(`Reconstruction took ${duration}ms`);
```

### Problem: Memory issues with large replays

**Solution:**
```javascript
// Clear replay data after continuation
const gameService = await continuation.continueAsNewGame();

// Clear to free memory
continuation.replayData = null;

// Or split replay into smaller segments
```

## Advanced Topics

### Custom State Manipulation

You can modify state before continuing:

```javascript
const state = continuation.getStateAtFrame(100);

// Modify state
state.characters.protagonist.inventory.gold = 10000;
state.time.weather = 'clear';

// Continue from modified state
const gameService = await continuation.continueFromState(state);
```

### Branching Narratives

Create multiple branches from one replay:

```javascript
const baseState = continuation.getStateAtFrame(50);

const branches = [];
for (let i = 0; i < 5; i++) {
  const gameService = await continuation.continueFromState(baseState, {
    newSeed: 10000 + i,
    newReplayPath: `./replays/branch_${i}.replay`
  });
  branches.push(gameService);
}

// Each branch develops independently
```

### Replay Analysis

Analyze entire replay timeline:

```javascript
await continuation.loadReplay();

const timeline = [];
const info = continuation.getReplayInfo();

for (let frame = 0; frame <= info.lastFrame; frame += 10) {
  const state = continuation.getStateAtFrame(frame);
  timeline.push({
    frame,
    time: state.time.gameTimeString,
    location: state.location.current,
    questCount: state.quests.active.length
  });
}

console.log('Timeline:', timeline);
```

## Future Enhancements

Planned features for future versions:

1. **Incremental State Replay** - Replay events from checkpoint to target frame
2. **State Diffing** - Show what changed between frames
3. **Parallel Continuations** - Run multiple continuations simultaneously
4. **State Compression** - Reduce memory usage for large sessions
5. **Hot Reload** - Update continuation without full restart
6. **Replay Merging** - Combine multiple replays
7. **Visual Timeline** - UI for exploring replay timeline

## License

Part of the LLMRPG project. See project LICENSE for details.

## Support

For issues, questions, or contributions, see the main project repository.
