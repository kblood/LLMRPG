# ReplayContinuation Quick Start Guide

Get up and running with ReplayContinuation in 5 minutes.

## What is ReplayContinuation?

A system that lets you load a recorded game replay and continue playing from any point as a new game session. Think of it as "time travel" for your game - you can go back to any moment and make different choices.

## Installation

```javascript
import { ReplayContinuation } from './src/services/ReplayContinuation.js';
```

## Basic Usage

### Step 1: Load a Replay

```javascript
const continuation = new ReplayContinuation('./replays/mygame.replay');
await continuation.loadReplay();
```

### Step 2: Continue Playing

```javascript
const gameService = await continuation.continueAsNewGame({
  newSeed: Date.now(), // Different seed = different outcomes
  model: 'granite4:3b'
});

// Continue playing
gameService.tick(10); // Advance 10 minutes
```

That's it! You're now playing from where the replay ended.

## Common Use Cases

### 1. Watch Then Continue

Play through a replay, then continue:

```javascript
await continuation.playAndContinue(
  50, // Play 50 frames
  { newSeed: 99999 },
  (frame, event) => console.log(`Frame ${frame}: ${event.type}`)
);
```

### 2. Jump to Specific Frame

```javascript
const state = continuation.getStateAtFrame(100);
const gameService = await continuation.continueFromState(state, {
  newSeed: 12345
});
```

### 3. Test Different Decisions

```javascript
// Try 3 different approaches from frame 50
for (let i = 0; i < 3; i++) {
  const gameService = await continuation.continueAsNewGame({
    fromFrame: 50,
    newSeed: 10000 + i
  });

  // Each will have different outcomes
}
```

### 4. Get Replay Info

```javascript
const info = continuation.getReplayInfo();
console.log(`Frames: ${info.frameCount}`);
console.log(`Events: ${info.eventCount}`);
console.log(`Last Frame: ${info.lastFrame}`);
```

### 5. Save Continuation

```javascript
// After continuing and playing
await continuation.saveContinuationReplay('./replays/continued.replay');
```

## What Gets Preserved?

When you continue from a replay, everything is preserved:

- All characters (protagonist and NPCs)
- Character stats, inventory, and equipment
- Personality, memory, and relationships
- Active quests and progress
- Discovered and visited locations
- Game time and weather
- Frame counter

## Integration Examples

### With Autonomous Game

```javascript
const gameService = await continuation.continueAsNewGame();

const autonomousGame = new StandaloneAutonomousGame(gameService, {
  maxFrames: 100
});

await autonomousGame.run();
```

### With UI Updates

```javascript
import { statePublisher } from './src/services/StatePublisher.js';

statePublisher.subscribe({
  id: 'ui',
  onStateUpdate: (state) => updateUI(state)
});

const gameService = await continuation.continueAsNewGame();
// UI will receive updates automatically
```

## Running Examples

```bash
# Run full example suite
node examples/replay-continuation-example.js

# Run tests
node tests/test-replay-continuation.js
```

## Key Concepts

1. **New Seed** - Continuation uses a different random seed, so events unfold differently
2. **Separate Replays** - Original replay stays intact, new actions go to a new replay file
3. **Checkpoints** - Replays with checkpoints load faster (add checkpoints every 50-100 frames)
4. **State Snapshots** - Each frame can have a complete state snapshot for accurate recovery

## Troubleshooting

**Problem: "No replay loaded"**
- Always call `await continuation.loadReplay()` before continuing

**Problem: Slow loading**
- Use checkpoints in your replay (save state every 50-100 frames)
- Reduce number of characters if possible

**Problem: State not found**
- Ensure frame number is within replay range
- Check `getReplayInfo()` for valid frame numbers

## Next Steps

- Read full documentation: `docs/ReplayContinuation.md`
- Explore examples: `examples/replay-continuation-example.js`
- Run tests: `tests/test-replay-continuation.js`

## API Quick Reference

```javascript
// Create and load
const continuation = new ReplayContinuation(path);
await continuation.loadReplay();

// Get info
const info = continuation.getReplayInfo();
const state = continuation.getStateAtFrame(frameNum);
const stats = continuation.getStats();

// Continue
const gameService = await continuation.continueAsNewGame(options);
const gameService = await continuation.playAndContinue(frames, options, callback);
const gameService = await continuation.continueFromState(state, options);

// Save
await continuation.saveContinuationReplay(path);

// Status
const loaded = continuation.isLoaded();
const playing = continuation.isPlayingBack();
const progress = continuation.getPlaybackProgress();
```

## Tips for Best Results

1. **Include checkpoints** when recording replays
2. **Use different seeds** for different outcomes
3. **Save continuation replays** for later analysis
4. **Test from multiple frames** to explore alternatives
5. **Monitor stats** to verify state preservation

Happy time traveling!
