# OllamaRPG - Architecture (Current & Planned)

**Last Updated**: November 17, 2025
**Status**: Core Systems 85% Complete | CLI Fully Functional
**Note**: This document shows CURRENT implementation. See `old/ARCHITECTURE.md` for complete future vision.

---

## Quick Reference

### What's Implemented ✅
- LLM integration (Ollama)
- Character system (personality, memory, relationships)
- Dialogue system (multi-turn conversations)
- Game Master AI
- Replay logging
- CLI interface

### What's NOT Implemented ❌
- Movement/pathfinding (0%)
- GOAP system (0%)
- Web UI (React/Phaser) (0%)
- ECS architecture (partial stubs only)

---

## Current Architecture

### Technology Stack

```
Runtime:      Node.js 18+
Language:     JavaScript (ES modules)
LLM:          Ollama (llama3.1:8b)
Interface:    CLI (terminal-based)
Testing:      Vitest
Build:        Vite
```

### Actual Project Structure

```
ollama-rpg/
├── src/
│   ├── core/               ✅ Basic classes
│   │   ├── GameEngine.js   (stub)
│   │   ├── GameState.js    (stub)
│   │   ├── World.js        (stub)
│   │   └── bootstrap.js    (stub)
│   │
│   ├── entities/           ✅ Character classes
│   │   ├── Entity.js
│   │   └── Character.js
│   │
│   ├── components/         🔄 Stubs only
│   │   ├── Component.js
│   │   ├── PositionComponent.js  (stub)
│   │   └── MovementComponent.js  (stub)
│   │
│   ├── systems/            🔄 Minimal
│   │   ├── System.js
│   │   ├── SystemRegistry.js
│   │   ├── WorldStateSystem.js  (stub)
│   │   ├── dialogue/       ✅ Working
│   │   │   └── DialogueSystem.js
│   │   ├── quest/          ✅ Partially working
│   │   │   ├── QuestManager.js
│   │   │   ├── Quest.js
│   │   │   └── QuestGenerator.js
│   │   └── GameMaster.js   ✅ Working
│   │
│   ├── ai/                 ✅ Core AI systems
│   │   ├── personality/
│   │   │   └── Personality.js
│   │   ├── memory/
│   │   │   ├── Memory.js
│   │   │   └── MemoryStore.js
│   │   ├── relationships/
│   │   │   └── RelationshipManager.js
│   │   ├── llm/
│   │   │   ├── DialogueGenerator.js
│   │   │   ├── PromptBuilder.js
│   │   │   └── ResponseParser.js
│   │   └── goap/           ❌ Empty directory
│   │
│   ├── services/           ✅ Working
│   │   ├── Service.js
│   │   ├── ServiceManager.js
│   │   ├── OllamaService.js
│   │   ├── EventBus.js
│   │   ├── ConfigService.js
│   │   └── SeedManager.js
│   │
│   ├── replay/             ✅ 90% complete
│   │   ├── ReplayLogger.js
│   │   ├── ReplayFile.js
│   │   └── CheckpointManager.js
│   │
│   ├── utils/              ✅ Working
│   │   ├── SeededRandom.js
│   │   ├── GameClock.js
│   │   ├── Logger.js
│   │   └── Vector2.js
│   │
│   ├── game/               ✅ Working
│   │   └── GameSession.js
│   │
│   ├── data/               ✅ Content
│   │   ├── npcs-expanded.js
│   │   └── npc-roster.js
│   │
│   ├── ui/                 ✅ CLI interface
│   │   └── DialogueInterface.js
│   │
│   └── rendering/          ❌ Not created
│       └── (planned for web version)
│
├── test-*.js               ✅ Test scripts
├── play*.js                ✅ Playable demos
├── view-replay.js          ✅ Replay tools
├── replays/                ✅ Replay files
└── config/                 ✅ Configuration
```

---

## Component Status

### Core Systems

| Component | Status | % | Notes |
|-----------|--------|---|-------|
| **LLM Integration** | ✅ Complete | 100% | Ollama with seeded generation |
| **Character AI** | ✅ Complete | 100% | Personality, memory, relationships |
| **Dialogue System** | ✅ Complete | 100% | Multi-turn, context-aware |
| **Game Master** | ✅ Complete | 100% | Narration and orchestration |
| **Quest System** | 🔄 Partial | 70% | Detection works, completion pending |
| **Replay Logging** | ✅ Complete | 100% | Event logging + LLM recording |
| **Replay Viewing** | ✅ Complete | 100% | 3 viewing tools |
| **CLI Interface** | ✅ Complete | 100% | Fully playable |

### Missing Systems

| Component | Status | % | Why Missing |
|-----------|--------|---|-------------|
| **GOAP Planner** | ❌ Not Started | 0% | LLM handles decisions directly |
| **Pathfinding** | ❌ Not Started | 0% | No spatial world yet |
| **Movement System** | ❌ Not Started | 0% | Dialogue-first approach |
| **ECS Architecture** | 🔄 Stubs | 10% | Basic structure, not used |
| **Web UI** | ❌ Not Started | 0% | CLI works well for now |
| **Phaser Rendering** | ❌ Not Started | 0% | Future web version |

---

## Current Design Patterns

### 1. Service-Based Architecture

**What's Implemented**:

```javascript
// Singletons for core services
const ollamaService = new OllamaService();
const eventBus = new EventBus();
const replayLogger = new ReplayLogger();

// Characters use services
class Character {
  async talk(message) {
    const response = await ollamaService.generate(prompt);
    eventBus.emit('dialogue_turn', { ... });
    replayLogger.logEvent({ ... });
    return response;
  }
}
```

**Not ECS**: Despite directory structure, doesn't use full ECS pattern

### 2. Event-Driven Communication

**What Works**:

```javascript
// EventBus for loose coupling
EventBus.emit('dialogue:completed', {
  characterId: 'player',
  npcId: 'mara',
  relationshipDelta: +10
});

// Multiple systems listen
EventBus.on('dialogue:completed', (data) => {
  memorySystem.recordDialogue(data);
  relationshipSystem.updateRelationship(data);
  replayLogger.logEvent(data);
});
```

### 3. LLM-Centric AI

**Current Approach**:

```
User input → Build prompt → LLM generates response → Parse → Display
```

**Not GOAP**: Direct LLM decision-making instead of goal planning

### 4. Deterministic Replay

**Implementation**:

```javascript
// Seeded RNG
const rng = new SeededRandom(gameSeed);

// Seeded LLM calls
const seed = gameSeed + callCounter * 1000;
const response = await ollama.generate(prompt, { seed });

// Log everything
replayLogger.logLLMCall({ callId, seed, prompt, response });
```

---

## Data Flow (Current)

### Dialogue Flow

```
1. Player types message
     ↓
2. DialogueSystem.handlePlayerMessage()
     ↓
3. Build context:
   - NPC personality
   - Relationship level
   - Conversation history
   - Shared memories
     ↓
4. PromptBuilder.buildDialoguePrompt()
     ↓
5. OllamaService.generate(prompt, seed)
     ↓
6. LLM generates response
     ↓
7. Parse & validate response
     ↓
8. Update relationship
     ↓
9. Create memory
     ↓
10. Log to replay
     ↓
11. Display to user
```

### Game Master Flow

```
1. Significant event occurs
     ↓
2. GameMaster.generateNarration()
     ↓
3. Build context:
   - Current location
   - Recent actions
   - Story state
   - Atmosphere
     ↓
4. LLM generates scene narration
     ↓
5. Display atmospheric text
     ↓
6. Log to replay
```

---

## Key Classes (Current)

### Character.js

```javascript
class Character {
  constructor(id, name, personality, backstory) {
    this.id = id;
    this.name = name;
    this.personality = personality;    // 6 traits
    this.backstory = backstory;
    this.memories = new MemoryStore();
    this.relationships = new RelationshipManager();
  }

  async generateDialogue(playerMessage, conversationHistory) {
    // Build context
    const context = {
      personality: this.personality,
      relationship: this.relationships.get('player'),
      recentMemories: this.memories.getRecent(5),
      conversationHistory
    };

    // Generate via LLM
    const prompt = PromptBuilder.buildDialoguePrompt(this, context);
    const response = await OllamaService.generate(prompt);

    // Update state
    this.memories.add(new Memory('dialogue', playerMessage));
    this.relationships.adjust('player', +5);

    return response;
  }
}
```

### DialogueSystem.js

```javascript
class DialogueSystem {
  constructor() {
    this.currentConversation = null;
    this.conversationHistory = [];
  }

  async startConversation(npc) {
    this.currentConversation = {
      npc,
      startTime: Date.now(),
      turns: []
    };

    // Emit event
    EventBus.emit('dialogue:started', { npcId: npc.id });

    // Game Master narrates
    await GameMaster.narrateDialogueStart(npc);
  }

  async handlePlayerMessage(message) {
    const npc = this.currentConversation.npc;

    // NPC generates response
    const response = await npc.generateDialogue(
      message,
      this.conversationHistory
    );

    // Track conversation
    this.conversationHistory.push(
      { speaker: 'player', text: message },
      { speaker: npc.id, text: response }
    );

    // Emit events
    EventBus.emit('dialogue:turn', {
      npcId: npc.id,
      playerMessage: message,
      npcResponse: response
    });

    return response;
  }

  endConversation() {
    EventBus.emit('dialogue:ended', {
      npcId: this.currentConversation.npc.id,
      turnCount: this.conversationHistory.length
    });

    this.currentConversation = null;
    this.conversationHistory = [];
  }
}
```

### OllamaService.js

```javascript
class OllamaService {
  constructor() {
    this.baseURL = 'http://localhost:11434';
    this.model = 'llama3.1:8b';
    this.callCounter = 0;
  }

  async generate(prompt, options = {}) {
    const seed = this.generateSeed();
    const callId = this.callCounter++;

    try {
      const response = await fetch(`${this.baseURL}/api/generate`, {
        method: 'POST',
        body: JSON.stringify({
          model: this.model,
          prompt,
          seed,
          temperature: options.temperature || 0.7,
          stream: false
        })
      });

      const data = await response.json();
      const result = data.response;

      // Log to replay
      ReplayLogger.logLLMCall({
        callId,
        seed,
        prompt,
        response: result,
        model: this.model
      });

      return result;

    } catch (error) {
      console.error('LLM call failed:', error);
      return this.getFallback(prompt);
    }
  }

  generateSeed() {
    const gameSeed = SeedManager.getGameSeed();
    return (gameSeed + this.callCounter * 997) % 2147483647;
  }
}
```

---

## Planned Architecture (Future)

### ECS Pattern (Not Implemented)

**Concept**:
```javascript
// Entities are just IDs
const entity = createEntity();

// Components are pure data
addComponent(entity, PositionComponent, { x: 100, y: 100 });
addComponent(entity, SpriteComponent, { texture: 'player' });
addComponent(entity, AIComponent, { personality: {...} });

// Systems process components
class MovementSystem {
  update(entities, deltaTime) {
    entities
      .filter(e => hasComponents(e, [Position, Movement]))
      .forEach(e => this.move(e, deltaTime));
  }
}
```

**Status**: ❌ Stub files exist but not used

**When Needed**: Web version with spatial movement

### GOAP AI (Not Implemented)

**Concept**:
```javascript
// LLM generates high-level goal
Goal: "Visit tavern to hear gossip"

// GOAP creates action plan
Plan:
  1. ExitBuilding (home)
  2. MoveTo (tavern)
  3. EnterBuilding (tavern)
  4. ApproachNPC (tavern keeper)
  5. TalkTo (tavern keeper)

// Execute autonomously
character.executePlan(plan);
```

**Status**: ❌ Empty directory

**When Needed**: Autonomous AI protagonist

## UI-Backend Communication (Electron Integration)

**Status**: ✅ Implemented with StatePublisher

### Communication Architecture

The game uses a **unidirectional, event-driven** architecture for UI updates:

```
Game Logic (Core)              Electron Bridge              UI (Renderer)
┌──────────────────────────┐   ┌──────────────────────┐   ┌──────────────┐
│ GameService              │   │ GameBackendIntegrated│   │ app.js       │
│ - tick()                 │   │ - Subscribes to      │   │ - Displays   │
│ - executeAction()        │──→│   StatePublisher     │───→│   state      │
│ - startConversation()    │   │ - Routes updates via │   │ - Updates    │
│ - addConversationTurn()  │   │   uiCallback         │   │   DOM        │
└──────────────────────────┘   └──────────────────────┘   └──────────────┘
         ↓
┌──────────────────────────┐
│ StatePublisher (Singleton)
│ - Pure observer pattern
│ - Framework-agnostic
│ - Publishes: (state, eventType)
└──────────────────────────┘
```

### Data Flow

#### Command Path (UI → Game)
```
UI clicks button (gameAPI.executeAction)
    ↓
preload.js (contextBridge)
    ↓
main-integrated.js (IPC handler)
    ↓
GameBackendIntegrated.executeAction()
    ↓
GameService.executeAction()
    ↓
Returns result immediately
```

#### State Update Path (Game → UI)
```
GameService.tick() or GameService.executeAction()
    ↓
statePublisher.publish(gameState, eventType, metadata)
    ↓
GameBackendIntegrated subscriber receives update
    ↓
GameBackendIntegrated.uiCallback({type, eventType, state, ...})
    ↓
main.js sends: webContents.send('game:update', update)
    ↓
preload.js: window.gameAPI.onGameUpdate(callback)
    ↓
app.js: handleStateUpdate(state, eventType)
    ↓
DOM updates with latest state
```

### Event Types Published

| Event Type | When Fired | Data Sent |
|------------|-----------|-----------|
| `FRAME_UPDATE` | Every game tick | Full state, deltaTime |
| `ACTION_EXECUTED` | After player/NPC action | Action type, result |
| `DIALOGUE_STARTED` | Conversation begins | conversationId, npcId |
| `DIALOGUE_LINE` | New dialogue added | conversationId, text |
| `DIALOGUE_ENDED` | Conversation ends | conversationId |
| `COMBAT_STARTED` | Combat encounter | Enemies, location |
| `COMBAT_ENDED` | Combat resolves | Outcome, XP, rewards |
| `QUEST_CREATED` | New quest discovered | Quest data |
| `QUEST_UPDATED` | Quest progress changes | Quest data |
| `QUEST_COMPLETED` | Quest finished | Quest data |
| `LOCATION_DISCOVERED` | New location found | Location data |
| `LOCATION_CHANGED` | Player moves | Location id, name |

### Key Components

**StatePublisher** (`src/services/StatePublisher.js`):
- Pure observer pattern (no Electron dependency)
- Maintains subscriber list
- Publishes state after each game update
- Returns full game state snapshot

**GameService** (`src/services/GameService.js`):
- Publishes to StatePublisher after every state change
- Calls: `statePublisher.publish(gameState, eventType, metadata)`
- No knowledge of UI or Electron

**GameBackendIntegrated** (`electron/ipc/GameBackendIntegrated.js`):
- Subscribes to StatePublisher for all updates
- Routes updates to Electron via `uiCallback()`
- Implements all IPC handler methods
- Manages game initialization and cleanup

**main-integrated.js** (`electron/main-integrated.js`):
- Creates BrowserWindow
- Sets up uiCallback to send updates to renderer
- Routes `webContents.send('game:update', update)` to UI

**app.js** (`ui/app.js`):
- Listens for `gameAPI.onGameUpdate()` events
- Processes state updates via `handleStateUpdate()`
- Updates DOM elements based on game state

### Design Benefits

✅ **Unidirectional Flow**: UI never manipulates game state directly
✅ **Loose Coupling**: Game logic doesn't know about UI
✅ **Framework Agnostic**: StatePublisher has no Electron dependency
✅ **Performance**: Batched updates via state snapshots
✅ **Debuggable**: All state changes flow through StatePublisher
✅ **Testable**: StatePublisher can be tested independently

### Integration Checklist

- ✅ StatePublisher imports in GameService
- ✅ statePublisher.publish() calls after tick()
- ✅ statePublisher.publish() calls after startConversation()
- ✅ statePublisher.publish() calls after addConversationTurn()
- ✅ statePublisher.publish() calls after endConversation()
- ✅ statePublisher.publish() calls after executeAction()
- ✅ GameBackendIntegrated subscribes to StatePublisher
- ✅ GameBackendIntegrated routes updates via uiCallback
- ✅ main.js sends updates to renderer via webContents.send()
- ✅ preload.js exposes onGameUpdate listener
- ✅ app.js registers listener and handles updates

---

### Web UI (Not Implemented)

**Concept**:
```javascript
// Phaser renders game world
const game = new Phaser.Game({
  scene: WorldScene,
  width: 1920,
  height: 1080
});

// React renders UI overlay
function App() {
  return (
    <div className="game-container">
      <div id="phaser-canvas" />
      <HUD />
      <CharacterPanels />
      <ReplayControls />
    </div>
  );
}
```

**Status**: ❌ Not started

**When Needed**: Visual experience desired

---

## Migration Path

### Phase 1: Core Dialogue ✅ COMPLETE

**What Was Built**:
- Character system
- Dialogue generation
- Memory & relationships
- Game Master
- Replay logging
- CLI interface

**Result**: Fully playable dialogue-focused RPG

### Phase 2: Spatial World (Not Started)

**What's Needed**:
- Integrate PathFinding.js
- Create tile-based world map
- Add character movement
- Building entry/exit

**Estimated**: 1-2 weeks

### Phase 3: GOAP AI (Not Started)

**What's Needed**:
- Implement GOAP planner
- Create action library
- LLM goal generation
- Autonomous execution

**Estimated**: 1-2 weeks

### Phase 4: Web UI (Not Started)

**What's Needed**:
- Phaser 3 integration
- React components
- Electron packaging
- State synchronization

**Estimated**: 2-3 weeks

---

## Design Principles

### 1. Dialogue First

**Philosophy**: Prove LLM conversation quality before adding complexity

**Result**:
- ✅ 20+ turn conversations work
- ✅ Emergent quests from dialogue
- ✅ Natural personality expression

### 2. Deterministic Design

**Why**: Perfect replay capability

**Implementation**:
- Seeded RNG everywhere
- Seeded LLM calls
- No system time
- Deterministic event ordering

### 3. Event-Driven

**Why**: Loose coupling, easy testing

**Implementation**:
- EventBus for communication
- Systems listen, don't call directly
- Replay logs all events

### 4. Service Layer

**Why**: Centralized, mockable dependencies

**Implementation**:
- Singletons for LLM, EventBus, etc.
- Easy to mock for testing
- Clean dependency injection

---

## Testing Strategy

### Current Tests

```bash
# Unit tests
npm run test         # Vitest

# Integration tests
node test-dialogue-system.js
node test-llm.js
node test-quest-system.js

# Feature tests
node test-all-npcs.js
node test-long-conversation.js
node test-game-master.js

# System tests
node test-autonomous-game.js
node test-replay-system.js
```

### Replay-Based Testing

```javascript
// Record session
const session = playGame();
saveReplay('test_session.replay');

// Verify determinism
const replay1 = runReplay('test_session.replay');
const replay2 = runReplay('test_session.replay');
assert(replay1.events === replay2.events);

// Regression testing
const result = runReplay('working_feature.replay');
assert(result.finalState.questCompleted === true);
```

---

## Performance

### Current (CLI)

**Metrics**:
- Startup: <1 second
- LLM call: 1-3 seconds
- Memory usage: ~100 MB
- No performance issues

### Future (Web)

**Considerations**:
- 60 FPS game loop
- React rendering (throttled to 200ms)
- Phaser canvas separate from React
- State updates batched

---

## Summary

### What Architecture Exists Now

✅ **Service-based** with singletons
✅ **Event-driven** communication
✅ **LLM-centric** AI decisions
✅ **Deterministic** replay
✅ **CLI-first** interface

### What's Planned But Not Built

❌ **Full ECS** pattern
❌ **GOAP** planning
❌ **Spatial movement**
❌ **Web UI** (React/Phaser)
❌ **Electron** packaging

### Why This Approach?

**"Dialogue First, Movement Later"**

1. Prove LLM concept ✅
2. Build unique gameplay ✅
3. Keep it simple ✅
4. Add complexity when needed

---

## Documentation

### This Doc
- **ARCHITECTURE.md** - Current architecture

### Original Vision
- **old/ARCHITECTURE.md** - Full planned architecture (9000+ lines)

### Related Docs
- **GAME_CONCEPT_AND_DESIGN.md** - What's implemented
- **WEB_GAME_CONCEPT.md** - Future web version
- **REPLAY_SYSTEM_DESIGN.md** - Replay system
- **FINAL_STATUS_SUMMARY.md** - Overall status

---

**Current architecture: Simple, working, and ready to expand.** ✨

**Play it now:** `npm run play:gm`
