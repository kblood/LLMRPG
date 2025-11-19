# Replay Playback System Guide

The OllamaRPG features a complete replay system that records gameplay and allows you to play it back in multiple ways.

## Overview

Every game session is automatically recorded to a replay file in the `./replays/` directory. These files contain:
- All game events (dialogue, movement, actions, etc.)
- All LLM calls (prompts and responses)
- Game state checkpoints
- Metadata (timestamp, game seed, duration, etc.)

Replay files are compressed using gzip to minimize storage space.

## Available Playback Tools

### 1. View Replay (view-replay.js)
**Static viewer** - Shows replay information and a timeline of events

```bash
# List all available replays
node view-replay.js

# View a specific replay
node view-replay.js game_replay_123456.json

# View by index number
node view-replay.js 1
```

**Features:**
- Shows header information (version, timestamp, seed, counts)
- Displays complete event timeline
- Shows all LLM calls with prompts and responses
- Lists all checkpoints
- File size and compression stats

**npm script:**
```bash
npm run replay:view
npm run replay:view game_replay_123456.json
```

---

### 2. Interactive Replay Player (play-replay.js)
**Interactive player** - Full playback controls like a video player

```bash
# List replays
node play-replay.js

# Play a replay interactively
node play-replay.js game_replay_123456.json

# Play by index
node play-replay.js 1
```

**Controls:**
- `[SPACE]` - Play/Pause
- `[→]` - Next frame
- `[←]` - Previous frame  
- `[N]` - Jump to next event
- `[P]` - Jump to previous event
- `[J]` - Jump to specific frame
- `[S]` - Change playback speed (0.5x, 1x, 2x, 4x)
- `[I]` - Show replay information
- `[Q]` - Quit

**Features:**
- Frame-by-frame navigation
- Event-based navigation (skip empty frames)
- Variable playback speed
- Detailed event display with formatting
- LLM call visualization
- Progress tracking

**npm script:**
```bash
npm run replay:play 1
```

---

### 3. Automated Replay (auto-replay.js)
**Automated playback** - Automatically plays through the entire replay

```bash
# List replays
node auto-replay.js

# Auto-play at default speed (2x)
node auto-replay.js 1

# Auto-play at custom speed
node auto-replay.js 1 1.0   # Normal speed
node auto-replay.js 1 3.0   # 3x speed
node auto-replay.js 1 0.5   # Half speed
```

**Features:**
- Automatic playback with timing
- Configurable speed multiplier
- Beautiful formatted output with frames
- Shows events, dialogue, and LLM calls
- Progress indicators

**npm script:**
```bash
npm run replay:auto 1
npm run replay:auto 1 3.0
```

---

## Replay File Format

Replays are stored as compressed JSON files with this structure:

```json
{
  "header": {
    "version": "1.0.0",
    "timestamp": 1234567890,
    "gameSeed": 99999,
    "frameCount": 3600,
    "eventCount": 150,
    "llmCallCount": 45,
    "checkpointCount": 10
  },
  "initialState": {
    // Initial game state
  },
  "events": [
    {
      "frame": 0,
      "type": "game_start",
      "characterId": "system",
      "data": { "location": "tavern" }
    },
    {
      "frame": 15,
      "type": "dialogue_line",
      "characterId": "player",
      "data": {
        "speaker": "player",
        "text": "Hello!"
      }
    }
  ],
  "llmCalls": [
    {
      "frame": 15,
      "characterId": "npc1",
      "prompt": "Generate response...",
      "response": "Hello there!",
      "tokensUsed": 25
    }
  ],
  "checkpoints": [
    {
      "frame": 600,
      "state": { /* game state snapshot */ }
    }
  ]
}
```

## Event Types

The replay system captures these event types:

- `game_start` - Game initialization
- `dialogue_started` - Conversation begins
- `dialogue_line` - Spoken dialogue
- `dialogue_ended` - Conversation ends
- `conversation_started` - Alternative conversation format
- `movement` - Character movement
- `action` - Character actions
- `quest_started` - Quest begins
- `quest_completed` - Quest finished
- `state_change` - Game state changes

## Use Cases

### 1. Debugging
Use the interactive player to step through problematic game sessions:
```bash
node play-replay.js problematic_session.json
# Use [N] to jump between events
# Use [→]/[←] for frame-by-frame analysis
```

### 2. Showcasing
Use auto-replay to demonstrate gameplay:
```bash
node auto-replay.js demo_session.json 2.0
```

### 3. Testing
Verify game behavior by reviewing replays:
```bash
node view-replay.js test_session.json
# Check event counts, LLM call sequences, etc.
```

### 4. Analysis
Extract LLM prompts and responses for tuning:
```bash
node view-replay.js session.json | grep "LLM Call"
```

## Compression Stats

Replay files are automatically compressed using gzip:
- **Uncompressed:** ~100-500 KB per minute of gameplay
- **Compressed:** ~10-50 KB per minute (90% reduction)
- **Format:** JSON + gzip

## Tips

1. **Storage:** Replays are kept in `./replays/` - clean up old files periodically
2. **Performance:** Use auto-replay for quick reviews, interactive for deep analysis
3. **Speed:** Higher speeds (3-4x) work well for long sessions
4. **Events:** Use event navigation ([N]/[P]) to skip boring parts
5. **Export:** Replay files can be shared - they're standalone and portable

## NPM Scripts Summary

```bash
npm run replay:list      # List all replays
npm run replay:view 1    # View replay details
npm run replay:play 1    # Interactive playback
npm run replay:auto 1    # Automated playback (2x speed)
npm run replay:auto 1 4.0  # Automated playback (4x speed)
```

## Implementation Details

### Recording
- Replays are recorded by `ReplayLogger`
- Events logged in real-time during gameplay
- Minimal performance overhead (~1-2%)
- Automatic file creation and compression

### Playback
- Three independent playback tools
- Each optimized for different use cases
- No dependencies on game engine
- Pure data playback (deterministic)

### Format
- Version-controlled format (currently 1.0.0)
- Backward compatible
- Extensible for future features
- Validation on load

## Future Enhancements

Potential features to add:
- Export to video format
- Web-based replay viewer
- Replay editing/trimming
- Replay comparison tool
- Statistics extraction
- LLM conversation export
- Jump to specific dialogue/quest
- Bookmarks/annotations
- Slow-motion on important events

---

**The replay system is fully functional and ready to use!** 🎮✨
