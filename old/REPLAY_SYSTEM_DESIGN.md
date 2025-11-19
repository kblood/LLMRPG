# Replay System Design - Deterministic Game Recording

A comprehensive replay system that records only actions, decisions, and LLM responses with timing information, enabling perfect replay, rewind, fast-forward, and checkpoint-based save/load functionality.

---

## Table of Contents

1. [Core Concept](#core-concept)
2. [Determinism Requirements](#determinism-requirements)
3. [Replay File Format](#replay-file-format)
4. [Action Logging System](#action-logging-system)
5. [LLM Seed Management](#llm-seed-management)
6. [Replay Engine](#replay-engine)
7. [Checkpointing System](#checkpointing-system)
8. [UI Integration](#ui-integration)
9. [Technical Implementation](#technical-implementation)
10. [Performance Considerations](#performance-considerations)

---

## Core Concept

### How It Works

Like StarCraft 2's replay system, we achieve small file sizes and perfect accuracy by:

1. **Record only inputs, not state**: Log actions, decisions, LLM calls, and seeds
2. **Deterministic simulation**: Same inputs always produce same outputs
3. **Time-based playback**: Replay events at their exact timestamps
4. **Checkpoint for seeking**: Periodic state snapshots enable rewind/fast-forward

### Benefits

✅ **Tiny file sizes**: 100KB-1MB for hours of gameplay (vs 10MB+ for full state saves)
✅ **Perfect accuracy**: Exact reproduction of all AI decisions and dialogue
✅ **Time manipulation**: Pause, play, rewind, fast-forward, slow-mo
✅ **Debugging**: See exactly what LLM decided at each moment
✅ **Save/load**: Restart from any point by replaying to that frame
✅ **Sharing**: Share replays with others to watch
✅ **Analysis**: Export decision trees, conversation logs, character paths

---

## Determinism Requirements

For replays to work, **everything must be deterministic**:

### 1. Random Number Generation

All randomness must use **seeded RNG**:

```javascript
class SeededRandom {
  constructor(seed) {
    this.seed = seed;
  }

  // Mulberry32 PRNG - fast and deterministic
  next() {
    let t = this.seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min, max) {
    return this.next() * (max - min) + min;
  }
}

// Global game RNG - seeded at game start
let gameRNG = new SeededRandom(initialSeed);

// NEVER use Math.random() - always use gameRNG.next()
```

### 2. LLM Calls with Seeds

Every LLM call must have a **deterministic seed**:

```javascript
class OllamaClient {
  constructor(config) {
    this.baseURL = config.host || 'http://localhost:11434';
    this.model = config.model || 'mistral';
    this.callCounter = 0; // Increments with each call
  }

  async generate(prompt, gameSeed, options = {}) {
    // Generate deterministic seed for this specific call
    const callSeed = this.generateCallSeed(gameSeed, this.callCounter);
    this.callCounter++;

    const response = await axios.post(
      `${this.baseURL}/api/generate`,
      {
        model: this.model,
        prompt: prompt,
        temperature: options.temperature || 0.7,
        seed: callSeed, // CRITICAL: Ollama uses this seed
        stream: false
      },
      { timeout: this.timeout }
    );

    // Log this call for replay
    replayLogger.logLLMCall({
      callId: this.callCounter - 1,
      prompt: prompt,
      seed: callSeed,
      response: response.data.response,
      timestamp: gameState.currentFrame
    });

    return response.data.response;
  }

  generateCallSeed(gameSeed, callCounter) {
    // Deterministic: same gameSeed + callCounter = same callSeed
    return (gameSeed + callCounter * 997) % 2147483647;
  }
}
```

### 3. Time Management

Use **game time**, never system time:

```javascript
class GameClock {
  constructor(startSeed) {
    this.frame = 0;           // Frame counter (60 FPS)
    this.gameTime = 0;        // Milliseconds since game start
    this.day = 1;
    this.hour = 8;
    this.minute = 0;
  }

  update(deltaTime) {
    this.frame++;
    this.gameTime += deltaTime;

    // Update in-game time
    const minutesElapsed = Math.floor(this.gameTime / 1000);
    this.minute = minutesElapsed % 60;
    this.hour = Math.floor(minutesElapsed / 60) % 24;
    this.day = Math.floor(minutesElapsed / 1440) + 1;
  }

  // NEVER use Date.now() or performance.now() for game logic
}
```

### 4. Physics & Pathfinding

Must be deterministic:

```javascript
// Ensure consistent floating point operations
class DeterministicPhysics {
  moveCharacter(character, targetX, targetY, deltaTime) {
    // Use fixed-point math or consistent rounding
    const dx = targetX - character.x;
    const dy = targetY - character.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 0.01) {
      character.x = targetX;
      character.y = targetY;
      return true;
    }

    // Fixed delta to avoid floating point drift
    const moveDistance = character.speed * deltaTime;
    const ratio = Math.min(moveDistance / distance, 1.0);

    // Round to avoid accumulation errors
    character.x = this.round(character.x + dx * ratio, 6);
    character.y = this.round(character.y + dy * ratio, 6);

    return false;
  }

  round(value, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }
}
```

### 5. Event Ordering

Events must be processed in **deterministic order**:

```javascript
class EventQueue {
  constructor() {
    this.events = [];
  }

  addEvent(event) {
    this.events.push(event);
    // Sort by frame, then by event type (deterministic tiebreaker)
    this.events.sort((a, b) => {
      if (a.frame !== b.frame) return a.frame - b.frame;
      return a.type.localeCompare(b.type);
    });
  }

  processFrame(currentFrame) {
    const frameEvents = [];
    while (this.events.length > 0 && this.events[0].frame === currentFrame) {
      frameEvents.push(this.events.shift());
    }
    return frameEvents;
  }
}
```

---

## Replay File Format

### File Structure

```javascript
{
  "header": {
    "version": "1.0.0",
    "gameSeed": 1234567890,          // Master seed for entire game
    "startTimestamp": "2025-01-15T10:30:00Z",
    "endFrame": 108000,              // 30 minutes at 60 FPS
    "duration": 1800000,             // 30 minutes in ms
    "gameVersion": "1.0.0",
    "mapName": "Millbrook",
    "characters": [
      {
        "id": "protagonist",
        "name": "John",
        "initialPosition": { "x": 400, "y": 300 },
        "personality": { /* ... */ }
      },
      {
        "id": "npc_mara",
        "name": "Mara",
        "initialPosition": { "x": 600, "y": 400 },
        "personality": { /* ... */ }
      }
    ],
    "initialWorldState": {
      "weather": "clear",
      "hour": 8,
      "minute": 0,
      "day": 1
    }
  },

  "events": [
    {
      "frame": 0,
      "type": "game_start",
      "data": {}
    },
    {
      "frame": 120,
      "type": "goal_generated",
      "characterId": "protagonist",
      "data": {
        "goal": "Visit the tavern",
        "priority": 60,
        "llmCallId": 0
      }
    },
    {
      "frame": 121,
      "type": "plan_created",
      "characterId": "protagonist",
      "data": {
        "actions": [
          { "type": "ExitBuilding", "params": {} },
          { "type": "MoveTo", "params": { "location": "tavern", "x": 600, "y": 400 } },
          { "type": "EnterBuilding", "params": { "buildingId": "tavern" } }
        ]
      }
    },
    {
      "frame": 122,
      "type": "action_started",
      "characterId": "protagonist",
      "data": {
        "actionType": "ExitBuilding",
        "actionIndex": 0
      }
    },
    {
      "frame": 180,
      "type": "action_completed",
      "characterId": "protagonist",
      "data": {
        "actionType": "ExitBuilding",
        "actionIndex": 0
      }
    },
    {
      "frame": 181,
      "type": "action_started",
      "characterId": "protagonist",
      "data": {
        "actionType": "MoveTo",
        "actionIndex": 1,
        "path": [[400, 300], [450, 320], [500, 350], [550, 380], [600, 400]]
      }
    },
    {
      "frame": 540,
      "type": "action_completed",
      "characterId": "protagonist",
      "data": {
        "actionType": "MoveTo",
        "actionIndex": 1
      }
    },
    {
      "frame": 600,
      "type": "dialogue_started",
      "characterId": "protagonist",
      "targetId": "npc_mara",
      "data": {
        "llmCallId": 1
      }
    },
    {
      "frame": 605,
      "type": "dialogue_line",
      "speaker": "protagonist",
      "data": {
        "text": "Good morning, Mara! How's business?"
      }
    },
    {
      "frame": 610,
      "type": "dialogue_line",
      "speaker": "npc_mara",
      "data": {
        "text": "Morning, John! Busy as always. What brings you here?"
      }
    },
    {
      "frame": 900,
      "type": "dialogue_ended",
      "characterId": "protagonist",
      "targetId": "npc_mara",
      "data": {
        "relationshipChange": +5
      }
    },
    {
      "frame": 1200,
      "type": "memory_created",
      "characterId": "protagonist",
      "data": {
        "memoryType": "dialogue",
        "content": "Had a pleasant conversation with Mara at the tavern",
        "importance": 60
      }
    }
  ],

  "llmCalls": [
    {
      "callId": 0,
      "frame": 120,
      "characterId": "protagonist",
      "type": "goal_generation",
      "prompt": "You are John, a character in...",
      "seed": 1235564887,
      "response": "GOAL: Visit the tavern\nTARGET: tavern\nPRIORITY: 60",
      "temperature": 0.7,
      "model": "mistral"
    },
    {
      "callId": 1,
      "frame": 600,
      "characterId": "protagonist",
      "type": "dialogue_generation",
      "prompt": "John approaches Mara at the tavern...",
      "seed": 1235565884,
      "response": "John: Good morning, Mara!...",
      "temperature": 0.7,
      "model": "mistral"
    }
  ],

  "checkpoints": [
    {
      "frame": 0,
      "fileOffset": 0
    },
    {
      "frame": 3600,     // Every 60 seconds
      "fileOffset": 15234,
      "compressedState": "<binary snapshot>"
    },
    {
      "frame": 7200,
      "fileOffset": 28456,
      "compressedState": "<binary snapshot>"
    }
  ],

  "metadata": {
    "totalLLMCalls": 25,
    "totalEvents": 1523,
    "totalDialogueExchanges": 8,
    "charactersInvolved": ["protagonist", "npc_mara", "npc_grok"],
    "locations": ["home", "tavern", "blacksmith"],
    "fileSize": 156789,
    "compression": "gzip"
  }
}
```

### File Size Analysis

**Example 30-minute session:**
- Events: ~2,000 events × 150 bytes avg = 300 KB
- LLM calls: ~30 calls × 2 KB avg = 60 KB
- Checkpoints: 30 checkpoints × 10 KB = 300 KB
- Header: 5 KB
- **Total**: ~665 KB uncompressed, ~150 KB gzipped

Compare to full state save: ~5-10 MB

---

## Action Logging System

### Event Logger

```javascript
class ReplayLogger {
  constructor(gameSeed) {
    this.gameSeed = gameSeed;
    this.events = [];
    this.llmCalls = [];
    this.checkpoints = [];
    this.header = null;
  }

  initialize(initialState) {
    this.header = {
      version: "1.0.0",
      gameSeed: this.gameSeed,
      startTimestamp: new Date().toISOString(),
      gameVersion: "1.0.0",
      mapName: initialState.mapName,
      characters: initialState.characters,
      initialWorldState: initialState.worldState
    };

    this.logEvent(0, 'game_start', {});
  }

  logEvent(frame, type, data, characterId = null) {
    const event = {
      frame,
      type,
      data,
      ...(characterId && { characterId })
    };

    this.events.push(event);

    // Real-time streaming to disk (for long sessions)
    if (this.events.length % 100 === 0) {
      this.flushToDisk();
    }
  }

  logLLMCall(llmData) {
    this.llmCalls.push(llmData);
  }

  logCheckpoint(frame, gameState) {
    const checkpoint = {
      frame,
      fileOffset: this.getCurrentFileOffset(),
      compressedState: this.compressState(gameState)
    };

    this.checkpoints.push(checkpoint);
  }

  compressState(state) {
    // Compress game state snapshot
    const json = JSON.stringify(state);
    return pako.gzip(json); // Use pako for gzip compression
  }

  async save(filename) {
    const replay = {
      header: {
        ...this.header,
        endFrame: gameState.currentFrame,
        duration: gameState.gameTime
      },
      events: this.events,
      llmCalls: this.llmCalls,
      checkpoints: this.checkpoints,
      metadata: this.generateMetadata()
    };

    const json = JSON.stringify(replay);
    const compressed = pako.gzip(json);

    await window.electron.saveReplay(filename, compressed);
  }

  generateMetadata() {
    return {
      totalLLMCalls: this.llmCalls.length,
      totalEvents: this.events.length,
      totalDialogueExchanges: this.events.filter(e => e.type === 'dialogue_started').length,
      charactersInvolved: [...new Set(this.events.map(e => e.characterId).filter(Boolean))],
      locations: [...new Set(this.events
        .filter(e => e.type === 'action_started' && e.data.actionType === 'MoveTo')
        .map(e => e.data.params.location))],
      fileSize: new Blob([JSON.stringify(this)]).size,
      compression: "gzip"
    };
  }
}

// Global logger
let replayLogger = null;

function startNewGame(seed) {
  replayLogger = new ReplayLogger(seed);
  gameRNG = new SeededRandom(seed);
  // ... rest of game initialization
}
```

### Automatic Event Logging

Integrate logging into game systems:

```javascript
class GOAPAction {
  async execute(character, params) {
    // Log action start
    replayLogger.logEvent(
      gameState.currentFrame,
      'action_started',
      {
        actionType: this.constructor.name,
        actionIndex: character.currentActionIndex,
        params: params
      },
      character.id
    );

    // Execute action
    const result = await this.doExecute(character, params);

    // Log action completion
    replayLogger.logEvent(
      gameState.currentFrame,
      'action_completed',
      {
        actionType: this.constructor.name,
        actionIndex: character.currentActionIndex,
        result: result
      },
      character.id
    );

    return result;
  }
}
```

```javascript
class CharacterAI {
  async generateNewGoal() {
    const goal = await goalGenerator.generate(this.character);

    // Logging happens inside OllamaClient.generate()
    // Also log the resulting goal
    replayLogger.logEvent(
      gameState.currentFrame,
      'goal_generated',
      {
        goal: goal.name,
        priority: goal.priority,
        llmCallId: ollamaClient.callCounter - 1
      },
      this.character.id
    );

    return goal;
  }

  planForGoal(goal) {
    const plan = this.planner.plan(this.worldState, goal, this.actions);

    replayLogger.logEvent(
      gameState.currentFrame,
      'plan_created',
      {
        goalName: goal.name,
        actions: plan.map(a => ({
          type: a.constructor.name,
          params: a.params
        }))
      },
      this.character.id
    );

    return plan;
  }
}
```

---

## LLM Seed Management

### Seed Generation Strategy

```javascript
class LLMSeedManager {
  constructor(masterSeed) {
    this.masterSeed = masterSeed;
    this.seedSequence = new SeededRandom(masterSeed);
    this.callSeeds = new Map(); // callId -> seed
  }

  getNextSeed(characterId, callType) {
    // Generate deterministic seed based on:
    // 1. Master seed
    // 2. Character ID (ensures different characters get different results)
    // 3. Call type (goal vs dialogue vs other)
    // 4. Sequence number

    const charHash = this.hashString(characterId);
    const typeHash = this.hashString(callType);
    const seqNum = this.seedSequence.nextInt(0, 2147483647);

    const seed = (this.masterSeed + charHash + typeHash + seqNum) % 2147483647;

    // Store for replay
    const callId = this.callSeeds.size;
    this.callSeeds.set(callId, seed);

    return { callId, seed };
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  getSeed(callId) {
    return this.callSeeds.get(callId);
  }
}

// Usage
const seedManager = new LLMSeedManager(gameSeed);

async function generateGoal(character) {
  const { callId, seed } = seedManager.getNextSeed(character.id, 'goal_generation');

  const response = await ollamaClient.generate(
    prompt,
    seed, // Use this seed
    { callId }
  );

  return response;
}
```

### Seed Verification

During replay, verify seeds match:

```javascript
class ReplayEngine {
  async replayLLMCall(callData) {
    // In replay mode, we can either:
    // 1. Use cached response (fast, no LLM needed)
    // 2. Re-generate with same seed (slower, verifies determinism)

    if (this.mode === 'fast') {
      // Use cached response
      return callData.response;
    } else if (this.mode === 'verify') {
      // Re-generate and compare
      const response = await ollamaClient.generate(
        callData.prompt,
        callData.seed,
        { temperature: callData.temperature }
      );

      if (response !== callData.response) {
        console.warn(`LLM response mismatch at call ${callData.callId}`);
        console.log('Expected:', callData.response);
        console.log('Got:', response);
      }

      return callData.response; // Use original to maintain determinism
    }
  }
}
```

### Handling LLM Non-Determinism

Even with seeds, some LLM backends might not be 100% deterministic:

```javascript
class LLMCallCache {
  constructor() {
    this.cache = new Map(); // callId -> response
  }

  // During recording, cache all responses
  recordResponse(callId, prompt, seed, response) {
    this.cache.set(callId, {
      prompt,
      seed,
      response,
      hash: this.hashResponse(response)
    });
  }

  // During replay, use cached response
  getResponse(callId) {
    const cached = this.cache.get(callId);
    if (!cached) {
      throw new Error(`No cached response for call ${callId}`);
    }
    return cached.response;
  }

  hashResponse(response) {
    // Simple hash for verification
    return crypto.createHash('sha256').update(response).digest('hex').slice(0, 16);
  }
}

// During replay, ALWAYS use cached LLM responses
// This ensures perfect determinism even if LLM backend changes
```

---

## Replay Engine

### Core Replay System

```javascript
class ReplayEngine {
  constructor() {
    this.replayData = null;
    this.currentFrame = 0;
    this.eventQueue = [];
    this.llmCache = new Map();
    this.isReplaying = false;
    this.playbackSpeed = 1.0; // 1x normal speed
    this.checkpointStates = new Map();
  }

  async loadReplay(filename) {
    const compressed = await window.electron.loadReplay(filename);
    const json = pako.ungzip(compressed, { to: 'string' });
    this.replayData = JSON.parse(json);

    // Load LLM responses into cache
    this.replayData.llmCalls.forEach(call => {
      this.llmCache.set(call.callId, call.response);
    });

    // Prepare event queue
    this.eventQueue = [...this.replayData.events];

    return this.replayData.header;
  }

  start() {
    this.isReplaying = true;
    this.currentFrame = 0;

    // Initialize game to starting state
    this.initializeGameState(this.replayData.header);

    // Start playback loop
    this.playbackLoop();
  }

  initializeGameState(header) {
    // Reset game to initial state from header
    gameState.reset();
    gameState.seed = header.gameSeed;
    gameRNG = new SeededRandom(header.gameSeed);

    // Spawn characters at initial positions
    header.characters.forEach(charData => {
      const char = spawnCharacter(
        charData.id,
        charData.name,
        charData.initialPosition.x,
        charData.initialPosition.y,
        charData.personality
      );
    });

    // Set world state
    gameState.weather = header.initialWorldState.weather;
    gameState.hour = header.initialWorldState.hour;
    gameState.minute = header.initialWorldState.minute;
    gameState.day = header.initialWorldState.day;
  }

  playbackLoop() {
    if (!this.isReplaying) return;

    const frameTime = 16.67; // 60 FPS
    const adjustedFrameTime = frameTime / this.playbackSpeed;

    const update = () => {
      // Process all events for current frame
      this.processFrame(this.currentFrame);

      // Update game simulation
      gameState.update(frameTime);

      // Advance frame
      this.currentFrame++;

      // Check if replay finished
      if (this.currentFrame >= this.replayData.header.endFrame) {
        this.stop();
        return;
      }

      // Schedule next frame
      setTimeout(update, adjustedFrameTime);
    };

    update();
  }

  processFrame(frame) {
    // Get all events for this frame
    const frameEvents = this.eventQueue.filter(e => e.frame === frame);

    frameEvents.forEach(event => {
      this.processEvent(event);
    });
  }

  processEvent(event) {
    switch (event.type) {
      case 'goal_generated':
        const char = getCharacter(event.characterId);
        const goal = this.reconstructGoal(event.data);
        char.ai.currentGoal = goal;
        break;

      case 'plan_created':
        const character = getCharacter(event.characterId);
        const plan = this.reconstructPlan(event.data);
        character.ai.currentPlan = plan;
        break;

      case 'action_started':
        const c = getCharacter(event.characterId);
        c.ai.executeAction(event.data.actionType, event.data.params);
        break;

      case 'dialogue_started':
        const speaker = getCharacter(event.characterId);
        const listener = getCharacter(event.targetId);
        this.startDialogue(speaker, listener, event.data.llmCallId);
        break;

      case 'dialogue_line':
        ui.displayDialogueLine(event.speaker, event.data.text);
        break;

      case 'memory_created':
        const char2 = getCharacter(event.characterId);
        char2.memory.addMemory(
          event.data.memoryType,
          event.data.content,
          event.data.importance
        );
        break;

      // ... handle other event types
    }
  }

  reconstructGoal(data) {
    return new GOAPGoal(data.goal, {}, data.priority);
  }

  reconstructPlan(data) {
    return data.actions.map(a => {
      const ActionClass = getActionClass(a.type);
      return new ActionClass(a.params);
    });
  }

  startDialogue(speaker, listener, llmCallId) {
    // Get cached LLM response
    const response = this.llmCache.get(llmCallId);
    const dialogue = parseDialogue(response);

    // Play dialogue
    dialogue.forEach((line, idx) => {
      // Schedule each line
      setTimeout(() => {
        ui.displayDialogueLine(line.speaker, line.text);
      }, idx * 2000); // 2 seconds per line
    });
  }

  // Playback controls
  pause() {
    this.isReplaying = false;
  }

  resume() {
    this.isReplaying = true;
    this.playbackLoop();
  }

  setSpeed(speed) {
    this.playbackSpeed = speed; // 0.5x, 1x, 2x, 5x, 10x
  }

  seek(targetFrame) {
    // Find nearest checkpoint before target
    const checkpoint = this.findNearestCheckpoint(targetFrame);

    if (checkpoint) {
      // Load checkpoint state
      this.loadCheckpoint(checkpoint);

      // Replay from checkpoint to target frame
      this.fastReplayToFrame(checkpoint.frame, targetFrame);
    } else {
      // No checkpoint, replay from beginning
      this.initializeGameState(this.replayData.header);
      this.fastReplayToFrame(0, targetFrame);
    }

    this.currentFrame = targetFrame;
  }

  findNearestCheckpoint(targetFrame) {
    // Binary search for nearest checkpoint
    const checkpoints = this.replayData.checkpoints;
    let left = 0;
    let right = checkpoints.length - 1;
    let nearest = null;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);

      if (checkpoints[mid].frame <= targetFrame) {
        nearest = checkpoints[mid];
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    return nearest;
  }

  loadCheckpoint(checkpoint) {
    const decompressed = pako.ungzip(checkpoint.compressedState, { to: 'string' });
    const state = JSON.parse(decompressed);

    // Restore game state
    gameState.restore(state);
  }

  fastReplayToFrame(startFrame, endFrame) {
    // Replay without rendering (fast-forward)
    for (let frame = startFrame; frame < endFrame; frame++) {
      this.processFrame(frame);
      gameState.updateSilent(16.67); // Update without rendering
    }
  }

  rewind(frames = 360) {
    // Rewind by 360 frames (6 seconds at 60 FPS)
    const targetFrame = Math.max(0, this.currentFrame - frames);
    this.seek(targetFrame);
  }

  fastForward(frames = 360) {
    const targetFrame = Math.min(
      this.replayData.header.endFrame,
      this.currentFrame + frames
    );
    this.seek(targetFrame);
  }

  stop() {
    this.isReplaying = false;
    this.currentFrame = 0;
  }

  exportSegment(startFrame, endFrame, filename) {
    // Export a segment of the replay
    const segmentEvents = this.replayData.events.filter(
      e => e.frame >= startFrame && e.frame <= endFrame
    );

    const llmCallIds = new Set(
      segmentEvents
        .filter(e => e.data && e.data.llmCallId !== undefined)
        .map(e => e.data.llmCallId)
    );

    const segmentLLMCalls = this.replayData.llmCalls.filter(
      c => llmCallIds.has(c.callId)
    );

    const segment = {
      header: {
        ...this.replayData.header,
        startFrame,
        endFrame
      },
      events: segmentEvents,
      llmCalls: segmentLLMCalls,
      checkpoints: this.replayData.checkpoints.filter(
        c => c.frame >= startFrame && c.frame <= endFrame
      )
    };

    const json = JSON.stringify(segment);
    const compressed = pako.gzip(json);

    return window.electron.saveReplay(filename, compressed);
  }
}
```

---

## Checkpointing System

### Automatic Checkpointing

```javascript
class CheckpointManager {
  constructor(interval = 3600) {
    this.interval = interval; // Checkpoint every 60 seconds (3600 frames at 60 FPS)
    this.lastCheckpointFrame = 0;
  }

  shouldCheckpoint(currentFrame) {
    return currentFrame - this.lastCheckpointFrame >= this.interval;
  }

  createCheckpoint(currentFrame) {
    const state = this.captureGameState();

    replayLogger.logCheckpoint(currentFrame, state);

    this.lastCheckpointFrame = currentFrame;
  }

  captureGameState() {
    return {
      frame: gameState.currentFrame,
      gameTime: gameState.gameTime,
      worldState: {
        weather: gameState.weather,
        hour: gameState.hour,
        minute: gameState.minute,
        day: gameState.day
      },
      characters: gameState.characters.map(char => ({
        id: char.id,
        position: { x: char.x, y: char.y },
        currentGoal: char.ai.currentGoal,
        currentPlan: char.ai.currentPlan.map(a => ({
          type: a.constructor.name,
          params: a.params
        })),
        currentActionIndex: char.ai.currentActionIndex,
        memories: char.memory.memories.slice(0, 20), // Last 20 memories
        relationships: Array.from(char.relationships.relationships.entries())
      })),
      // Only essential state - enough to resume from here
    };
  }
}

// In game loop
function gameUpdate(deltaTime) {
  gameState.update(deltaTime);

  // Checkpoint periodically
  if (checkpointManager.shouldCheckpoint(gameState.currentFrame)) {
    checkpointManager.createCheckpoint(gameState.currentFrame);
  }
}
```

---

## UI Integration

### Replay Controls Component

```jsx
import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Rewind, FastForward } from 'lucide-react';

function ReplayControls({ replayEngine, maxFrame }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [speed, setSpeed] = useState(1);

  const togglePlayPause = () => {
    if (isPlaying) {
      replayEngine.pause();
    } else {
      replayEngine.resume();
    }
    setIsPlaying(!isPlaying);
  };

  const seekToFrame = (frame) => {
    replayEngine.seek(frame);
    setCurrentFrame(frame);
  };

  const changeSpeed = (newSpeed) => {
    replayEngine.setSpeed(newSpeed);
    setSpeed(newSpeed);
  };

  const rewind = () => {
    replayEngine.rewind(360); // 6 seconds
    setCurrentFrame(replayEngine.currentFrame);
  };

  const fastForward = () => {
    replayEngine.fastForward(360);
    setCurrentFrame(replayEngine.currentFrame);
  };

  const formatTime = (frame) => {
    const seconds = Math.floor(frame / 60);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="replay-controls">
      {/* Timeline Slider */}
      <div className="timeline">
        <input
          type="range"
          min={0}
          max={maxFrame}
          value={currentFrame}
          onChange={(e) => seekToFrame(parseInt(e.target.value))}
          className="timeline-slider"
        />
        <div className="time-display">
          {formatTime(currentFrame)} / {formatTime(maxFrame)}
        </div>
      </div>

      {/* Playback Controls */}
      <div className="playback-controls">
        <button onClick={() => seekToFrame(0)} title="Skip to Start">
          <SkipBack size={24} />
        </button>

        <button onClick={rewind} title="Rewind 6s">
          <Rewind size={24} />
        </button>

        <button onClick={togglePlayPause} title={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? <Pause size={32} /> : <Play size={32} />}
        </button>

        <button onClick={fastForward} title="Fast Forward 6s">
          <FastForward size={24} />
        </button>

        <button onClick={() => seekToFrame(maxFrame)} title="Skip to End">
          <SkipForward size={24} />
        </button>
      </div>

      {/* Speed Control */}
      <div className="speed-control">
        <label>Speed:</label>
        {[0.25, 0.5, 1, 2, 5, 10].map(s => (
          <button
            key={s}
            className={speed === s ? 'active' : ''}
            onClick={() => changeSpeed(s)}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}

export default ReplayControls;
```

### Event Timeline Viewer

```jsx
function EventTimeline({ replayData, currentFrame, onSeekToEvent }) {
  const [filter, setFilter] = useState('all');

  const eventTypes = {
    goal_generated: { color: '#4CAF50', icon: '🎯', label: 'Goal' },
    dialogue_started: { color: '#2196F3', icon: '💬', label: 'Dialogue' },
    action_started: { color: '#FF9800', icon: '⚡', label: 'Action' },
    memory_created: { color: '#9C27B0', icon: '💭', label: 'Memory' }
  };

  const filteredEvents = replayData.events.filter(e => {
    if (filter === 'all') return true;
    return e.type === filter;
  });

  return (
    <div className="event-timeline">
      <div className="filter-tabs">
        <button onClick={() => setFilter('all')}>All</button>
        {Object.entries(eventTypes).map(([type, config]) => (
          <button key={type} onClick={() => setFilter(type)}>
            {config.icon} {config.label}
          </button>
        ))}
      </div>

      <div className="timeline-track">
        {filteredEvents.map((event, idx) => {
          const config = eventTypes[event.type] || { color: '#999', icon: '●' };
          const position = (event.frame / replayData.header.endFrame) * 100;

          return (
            <div
              key={idx}
              className="timeline-marker"
              style={{
                left: `${position}%`,
                backgroundColor: config.color
              }}
              onClick={() => onSeekToEvent(event.frame)}
              title={`${event.type} @ ${formatTime(event.frame)}`}
            >
              {config.icon}
            </div>
          );
        })}

        {/* Current position indicator */}
        <div
          className="current-position"
          style={{ left: `${(currentFrame / replayData.header.endFrame) * 100}%` }}
        />
      </div>
    </div>
  );
}
```

### LLM Call Inspector

```jsx
function LLMCallInspector({ llmCalls, currentFrame }) {
  const [selectedCall, setSelectedCall] = useState(null);

  const relevantCalls = llmCalls.filter(
    call => call.frame <= currentFrame
  ).slice(-10); // Last 10 calls

  return (
    <div className="llm-inspector">
      <h3>LLM Calls</h3>

      <div className="call-list">
        {relevantCalls.map(call => (
          <div
            key={call.callId}
            className="call-item"
            onClick={() => setSelectedCall(call)}
          >
            <div className="call-header">
              <span className="call-type">{call.type}</span>
              <span className="call-character">{call.characterId}</span>
              <span className="call-time">{formatTime(call.frame)}</span>
            </div>
          </div>
        ))}
      </div>

      {selectedCall && (
        <div className="call-detail">
          <h4>Call #{selectedCall.callId}</h4>

          <div className="detail-section">
            <strong>Type:</strong> {selectedCall.type}
          </div>

          <div className="detail-section">
            <strong>Character:</strong> {selectedCall.characterId}
          </div>

          <div className="detail-section">
            <strong>Seed:</strong> {selectedCall.seed}
          </div>

          <div className="detail-section">
            <strong>Model:</strong> {selectedCall.model}
          </div>

          <div className="detail-section">
            <strong>Temperature:</strong> {selectedCall.temperature}
          </div>

          <div className="detail-section">
            <strong>Prompt:</strong>
            <pre className="code-block">{selectedCall.prompt}</pre>
          </div>

          <div className="detail-section">
            <strong>Response:</strong>
            <pre className="code-block">{selectedCall.response}</pre>
          </div>

          <button onClick={() => copyToClipboard(selectedCall.prompt)}>
            Copy Prompt
          </button>
          <button onClick={() => copyToClipboard(selectedCall.response)}>
            Copy Response
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## Technical Implementation

### Integration with Game Loop

```javascript
class Game {
  constructor(config) {
    this.config = config;
    this.mode = config.mode; // 'play' or 'replay'
    this.replayLogger = null;
    this.replayEngine = null;
  }

  startNewGame(seed) {
    this.mode = 'play';
    this.seed = seed;

    // Initialize replay logging
    this.replayLogger = new ReplayLogger(seed);
    this.replayLogger.initialize({
      mapName: 'Millbrook',
      characters: this.createInitialCharacters(),
      worldState: { weather: 'clear', hour: 8, minute: 0, day: 1 }
    });

    // Initialize deterministic systems
    gameRNG = new SeededRandom(seed);
    seedManager = new LLMSeedManager(seed);
    checkpointManager = new CheckpointManager(3600);

    this.gameLoop();
  }

  async loadReplay(filename) {
    this.mode = 'replay';
    this.replayEngine = new ReplayEngine();

    const header = await this.replayEngine.loadReplay(filename);

    // Show replay UI
    this.showReplayUI();

    this.replayEngine.start();
  }

  gameLoop() {
    const lastTime = performance.now();

    const loop = (currentTime) => {
      const deltaTime = currentTime - lastTime;

      if (this.mode === 'play') {
        // Normal game loop with logging
        this.update(deltaTime);
        this.render();

        // Checkpoint if needed
        if (checkpointManager.shouldCheckpoint(gameState.currentFrame)) {
          checkpointManager.createCheckpoint(gameState.currentFrame);
        }
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  async saveReplay(filename) {
    if (this.replayLogger) {
      await this.replayLogger.save(filename);
      console.log(`Replay saved: ${filename}`);
    }
  }
}
```

### Deterministic Action Execution

```javascript
class MoveToAction extends GOAPAction {
  constructor() {
    super('MoveTo', 10, {}, {});
  }

  async execute(character, params, deltaTime) {
    // Use deterministic pathfinding
    if (!character.path) {
      // Generate path deterministically
      character.path = pathfindingManager.findPath(
        character.x,
        character.y,
        params.targetX,
        params.targetY
      );

      // Log path for replay
      replayLogger.logEvent(
        gameState.currentFrame,
        'path_generated',
        { path: character.path },
        character.id
      );
    }

    // Move along path deterministically
    const completed = character.moveAlongPath(deltaTime);

    if (completed) {
      character.path = null;
      return { completed: true };
    }

    return { completed: false };
  }
}
```

---

## Performance Considerations

### Memory Management

```javascript
class ReplayLogger {
  constructor(gameSeed, config = {}) {
    this.maxEventsInMemory = config.maxEventsInMemory || 10000;
    this.streamToDisk = config.streamToDisk || true;
    this.compressionLevel = config.compressionLevel || 6;
  }

  logEvent(frame, type, data, characterId) {
    const event = { frame, type, data, characterId };
    this.events.push(event);

    // Stream to disk periodically
    if (this.streamToDisk && this.events.length >= this.maxEventsInMemory) {
      this.flushToDisk();
    }
  }

  async flushToDisk() {
    // Write oldest events to disk
    const toFlush = this.events.splice(0, 5000);

    await window.electron.appendReplayEvents(toFlush);

    console.log(`Flushed ${toFlush.length} events to disk`);
  }
}
```

### Fast Replay Mode

```javascript
class ReplayEngine {
  fastReplayToFrame(startFrame, endFrame) {
    // Disable rendering during fast replay
    const wasRendering = gameState.rendering;
    gameState.rendering = false;

    // Process frames in batches
    const batchSize = 100;

    for (let frame = startFrame; frame < endFrame; frame += batchSize) {
      const batchEnd = Math.min(frame + batchSize, endFrame);

      // Process batch
      for (let f = frame; f < batchEnd; f++) {
        this.processFrame(f);
        gameState.updateSilent(16.67);
      }

      // Yield to UI every 100 frames
      if (frame % 1000 === 0) {
        this.updateProgress(frame, endFrame);
      }
    }

    gameState.rendering = wasRendering;
  }

  updateProgress(current, total) {
    const progress = (current / total) * 100;
    ui.updateReplayProgress(progress);
  }
}
```

### Compression Strategies

```javascript
class ReplayCompressor {
  static compress(replayData) {
    // 1. Remove redundant data
    const optimized = this.optimizeEvents(replayData.events);

    // 2. Use delta encoding for positions
    const deltaEncoded = this.deltaEncodePositions(optimized);

    // 3. Compress with gzip
    const json = JSON.stringify({
      ...replayData,
      events: deltaEncoded
    });

    return pako.gzip(json, { level: 6 });
  }

  static optimizeEvents(events) {
    // Remove redundant frame updates for same action
    const optimized = [];
    let lastAction = null;

    events.forEach(event => {
      if (event.type === 'action_progress' &&
          lastAction?.type === 'action_progress' &&
          lastAction?.characterId === event.characterId) {
        // Skip redundant progress updates
        return;
      }

      optimized.push(event);
      lastAction = event;
    });

    return optimized;
  }

  static deltaEncodePositions(events) {
    // Store positions as deltas from previous position
    const encoded = [];
    const lastPositions = new Map(); // characterId -> {x, y}

    events.forEach(event => {
      if (event.data?.position) {
        const charId = event.characterId;
        const last = lastPositions.get(charId) || { x: 0, y: 0 };

        encoded.push({
          ...event,
          data: {
            ...event.data,
            position: {
              dx: event.data.position.x - last.x,
              dy: event.data.position.y - last.y
            }
          }
        });

        lastPositions.set(charId, event.data.position);
      } else {
        encoded.push(event);
      }
    });

    return encoded;
  }
}
```

---

## Use Cases

### 1. Debugging AI Behavior

```javascript
// Find all goals generated for a character
const goals = replayData.events.filter(
  e => e.type === 'goal_generated' && e.characterId === 'protagonist'
);

// Find why a character made a specific decision
const decision = replayData.llmCalls.find(c => c.callId === 15);
console.log('Prompt:', decision.prompt);
console.log('Response:', decision.response);
console.log('Seed:', decision.seed);
```

### 2. Creating Highlight Clips

```javascript
// Find interesting moments (dialogues)
const dialogues = replayData.events.filter(e => e.type === 'dialogue_started');

// Export 30-second clip around first dialogue
const firstDialogue = dialogues[0];
await replayEngine.exportSegment(
  firstDialogue.frame - 1800, // 30 seconds before
  firstDialogue.frame + 1800, // 30 seconds after
  'interesting_dialogue.replay'
);
```

### 3. A/B Testing LLM Prompts

```javascript
// Load replay
await replayEngine.loadReplay('test_session.replay');

// Modify LLM prompt template
PromptTemplates.goalGeneration = newPromptTemplate;

// Re-run with verification mode
replayEngine.mode = 'verify';
await replayEngine.start();

// Compare results
const differences = replayEngine.getDifferences();
console.log('Behavior changed in', differences.length, 'places');
```

---

## Summary

This replay system provides:

✅ **Deterministic replays**: Perfect reproduction of gameplay
✅ **Small file sizes**: 100-500 KB for hours of gameplay
✅ **LLM seed control**: Reproducible LLM responses
✅ **Time manipulation**: Rewind, fast-forward, slow-mo
✅ **Checkpoint seeking**: Jump to any point instantly
✅ **Debug visibility**: Inspect AI decisions, goals, plans
✅ **Save/load**: Restart from any frame
✅ **Sharing**: Share replays with others
✅ **Analysis**: Export data, create highlights

This transforms the game into not just an autonomous RPG, but a **laboratory for AI behavior**, where every decision can be inspected, analyzed, and understood.
