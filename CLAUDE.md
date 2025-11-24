# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**OllamaRPG** is an AI-powered dialogue-driven RPG where NPCs feel alive, stories emerge dynamically, and everything is deterministic for perfect replay. Built with Node.js and Electron, it uses Ollama (local LLM) for natural dialogue and is designed as a desktop game where players observe emergent narratives rather than directly controlling characters.

**Current Status**: Core systems 85% complete | 89 JavaScript source files (15,647 LOC) | 10 unique NPCs | 30+ tests | Fully playable CLI

## Technology Stack

- **Runtime**: Node.js 18+ with ES modules
- **LLM**: Ollama (local granite4:3b)
- **Desktop**: Electron 39.2.1
- **Game Engine**: Phaser 3.55.2
- **UI Framework**: React 18.2.0 + Zustand 4.4.0
- **Build Tool**: Vite 5.0.0
- **Testing**: Vitest 1.0.0
- **Styling**: TailwindCSS 3.4.0
- **Database**: better-sqlite3 9.0.0
- **Pathfinding**: pathfinding.js 0.4.18

## Architecture Principles

1. **Service-Based Singletons**: Core services (OllamaService, EventBus, ReplayLogger) are singletons
2. **Event-Driven Communication**: Systems communicate via EventBus with wildcard pattern support
3. **Deterministic Design**: All randomness uses SeededRandom; all LLM calls use deterministic seeds
4. **Headless First**: Game logic is separated from rendering; core can run without UI
5. **ECS-Inspired**: Systems process entities; components pattern available but not fully adopted

## Essential Commands

### Running the Game

```bash
node play-advanced.js              # ⭐ RECOMMENDED: Full 10-NPC demo
node play.js                       # Simple 3-NPC version
npm run play:gm                    # With Game Master narration
npm run dev                        # Electron desktop app
```

### Testing

```bash
npm run test                       # Vitest unit tests
node test-all-npcs.js             # Test all 10 NPCs
node test-dialogue-system.js       # Dialogue system
node test-long-conversation.js     # 20-turn conversation
node test-autonomous-game.js       # Watch AI play autonomously
```

### Replay Tools

```bash
npm run replay:auto 1 3            # Auto-play replay at 3x speed
npm run replay:play 1              # Interactive playback
npm run replay:view 1              # Static viewer
npm run replay:list                # List all replays
```

## Project Structure

```
src/
  ├── core/              # GameEngine, GameState, GameClock
  ├── entities/          # Character, Entity base classes
  ├── ai/                # Personality, Memory, Relationships, LLM integration
  ├── systems/           # Game subsystems (Dialogue, Quest, Combat, etc.)
  ├── services/          # Singletons (OllamaService, EventBus, ReplayLogger)
  ├── replay/            # Session recording and playback
  ├── data/              # NPC roster, locations, items, abilities
  ├── utils/             # SeededRandom, GameClock, Logger, EventBus
  └── ui/                # CLI interface

electron/               # Electron main process, IPC handlers
ui/                     # React web interface (partial)
test-*.js              # 30+ integration test scripts
play-*.js              # 4 playable demo variants
```

## Import Aliases (vite.config.js)

```javascript
@core      → ./src/core
@entities  → ./src/entities
@systems   → ./src/systems
@ai        → ./src/ai
@services  → ./src/services
@utils     → ./src/utils
@data      → ./src/data
```

## Key Systems & Patterns

### Event-Driven Communication

Systems communicate exclusively through EventBus:

```javascript
// Emit event
EventBus.emit('dialogue:completed', {
  type: 'dialogue:completed',
  frame: gameFrame,
  characterId: 'npc_id',
  relationshipDelta: +10
});

// Listen with wildcard patterns
EventBus.on('dialogue:*', handleDialogueEvent);
EventBus.on('*', handleAllEvents);

// Subscribe to specific event
EventBus.on('dialogue:completed', (data) => {
  replayLogger.logEvent(data);
  memorySystem.recordDialogue(data);
});
```

**Benefits**: Loose coupling, perfect event history for replay, systems don't need to know about each other.

### Deterministic Design

Everything uses deterministic seeding for reproducible gameplay:

```javascript
// ❌ NEVER use
Math.random()           // Not deterministic
Date.now()             // Not deterministic
setTimeout/setInterval // Timing issues

// ✅ ALWAYS use
const rng = new SeededRandom(gameSeed);
const value = rng.next();
const gameTime = gameClock.getGameTime();  // Frame count, not system time

// LLM calls use seeds
const response = await ollama.generate(prompt, {
  seed: seedManager.getNextSeed(characterId)
});
```

### Service Pattern (Singletons)

```javascript
class MyService {
  constructor(config) {
    this.config = config;
  }

  static getInstance(config) {
    if (!this.instance) {
      this.instance = new MyService(config);
    }
    return this.instance;
  }
}

// Usage
const service = MyService.getInstance();
```

### System Pattern

```javascript
class MySystem {
  constructor(priority = 50) {
    this.name = 'MySystem';
    this.priority = priority;  // Lower number = runs first
  }

  async update(deltaTime, gameState) {
    // Process game entities
  }
}
```

## Character System

Each character has:

```javascript
{
  // Identity
  id, name, role ('npc' | 'protagonist')

  // AI Systems
  personality: Personality         // 6 traits (aggression, friendliness, intelligence, caution, greed, honor)
  memory: MemoryStore              // Memories with time-based decay
  relationships: RelationshipManager // -100 to +100 scale with other NPCs

  // State
  currentGoal, currentPlan, currentAction
  emotionalState, inConversation

  // RPG Systems
  stats: CharacterStats            // HP, XP, attributes
  inventory: Inventory
  equipment: Equipment
  abilities: AbilityManager

  // World
  x, y, currentLocation
}
```

**Personality Traits (1-100 scale)**:
- **Aggression** - Violence/conflict tendency
- **Friendliness** - Social openness
- **Intelligence** - Reasoning ability
- **Caution** - Risk aversion
- **Greed** - Wealth desire
- **Honor** - Moral alignment

## Dialogue System

Flow:
1. Player input
2. `DialogueContextBuilder` assembles context (personality, memories, relationships)
3. `PromptBuilder` creates LLM prompt
4. `OllamaService.generate()` calls Ollama with seeded request
5. `ResponseParser` validates output
6. Update relationships, create memories, log to replay
7. Return response

Supports multi-turn conversations (20+ turns) with perfect context retention.

## Replay System

Perfect session recording with deterministic playback:

```javascript
// Record
ReplayLogger.logEvent({ type, frame, characterId, text });
ReplayLogger.logLLMCall({ frame, prompt, response, seed });

// Save
const replay = ReplayLogger.finalize();
ReplayFile.save('session.replay', replay);

// Load and playback
const saved = ReplayFile.load('session.replay');
const game = await GameSession.fromReplay(saved);
```

**Features**: Same seed = same replay; tiny file sizes (100-500 KB); LLM inspection; checkpointing; pause/rewind/fast-forward.

## Common Development Tasks

### Adding a New NPC

Edit `src/data/npc-roster.js`:

```javascript
const newNPC = new Character('id', 'Name', {
  personality: new Personality({
    aggression: 20,
    friendliness: 75,
    intelligence: 70,
    caution: 60,
    greed: 30,
    honor: 80
  }),
  backstory: '...',
  memories: [{ type: 'background', text: '...', importance: 70 }]
});
```

### Adding a System

Create `src/systems/MySystem.js`:

```javascript
export class MySystem {
  constructor(priority = 50) {
    this.name = 'MySystem';
    this.priority = priority;
  }

  async update(deltaTime, gameState) {
    // Process entities
  }
}

// Register in ServiceManager.js
this.systems.push(new MySystem());
```

### Logging Events

```javascript
replayLogger.logEvent({
  type: 'my:event',
  frame: gameFrame,
  characterId: 'char_id',
  data: { /* any custom data */ }
});

// Or emit through EventBus (automatically logged)
EventBus.emit('my:event', { /* data */ });
```

### LLM Integration

```javascript
const ollama = OllamaService.getInstance();
const response = await ollama.generate(prompt, {
  temperature: 0.7,
  seed: seedManager.getNextSeed(characterId, 'goal')
});

// Always log
replayLogger.logLLMCall({
  prompt,
  response,
  seed,
  frame: gameState.currentFrame
});
```

## Code Style & Conventions

- **Classes**: PascalCase (`GOAPPlanner`, `DialogueSystem`)
- **Files**: PascalCase for classes (`DialogueSystem.js`)
- **Functions**: camelCase (`generateDialogue`, `updateMemory`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_MEMORY_SIZE`)
- **React Components**: PascalCase (`.jsx` extension)

## Testing

- **Unit Tests**: Vitest (`npm run test`)
- **Integration Tests**: Node.js scripts (`test-*.js`)
- **Replay Tests**: Record and verify determinism (same seed = same output)
- **Demo Scripts**: Interactive playable tests (`play-*.js`)

Test in headless mode first (no rendering), then verify with full UI.

## Important Guardrails

1. **Never use `Math.random()`** - Always use `gameRNG.next()` via SeededRandom
2. **Never use `Date.now()` or `setTimeout`** - Always use `gameClock.getGameTime()` (frame count)
3. **Always log events** - Use `replayLogger.logEvent()` or EventBus
4. **Keep deterministic** - Same seed must produce same results
5. **Use service singletons** - Access via `Service.getInstance()`
6. **Use EventBus for communication** - No direct system-to-system calls
7. **Verify with replay** - Test that replays reproduce exact behavior

## Feature Status

### ✅ Implemented (85% complete)
- LLM integration with seeded generation
- Character system with personality & memory
- Dialogue system (multi-turn, group conversations)
- Quest detection from dialogue
- Game Master AI narrator
- Replay recording & playback
- 10 unique NPCs
- Relationship tracking
- Game loop with pause/resume
- CLI interface
- 30+ test scripts

### ❌ Not Yet Implemented
- GOAP action planning (0%)
- Character movement & pathfinding (0%)
- Phaser rendering (0%)
- Web UI (20%)
- NPC-to-NPC autonomous conversations (0%)
- Full combat system (70%)
- Dynamic world generation (20%)

## Documentation

Essential docs in the repository:
- `README.md` - Project overview
- `ARCHITECTURE.md` - Complete technical design
- `PROJECT_STATUS_2025-11-16.md` - Comprehensive status (9000+ lines)
- `START_HERE.md` - Quick start guide
- `.github/copilot-instructions.md` - Development guidelines
- `GAME_CONCEPT_AND_DESIGN.md` - Vision and design
- `SYSTEMS_OVERVIEW.md` - System descriptions

## Git Conventions

- Feature branches: `feature/feature-name`
- Bug fixes: `fix/bug-name`
- Commit format: Conventional commits
  - `feat: add dialogue system`
  - `fix: character pathfinding`
  - `docs: update architecture`

## Prerequisites for Development

1. **Node.js 18+** - JavaScript runtime
2. **npm** - Package manager
3. **Ollama** - Local LLM server
   - Install: https://ollama.ai/
   - Run: `ollama serve`
   - Pull model: `ollama pull llama3.1:8b`

## Performance Targets

- Frame budget: 16.67ms (60 FPS target)
- LLM response: 1-3 seconds
- Startup time: <1 second
- Memory: ~100 MB headless
- Conversation coherence: 20+ turns

## Key Achievements

- **Deterministic LLM Integration**: Seeded Ollama calls enable perfect replay
- **Multi-turn Coherence**: 20+ turn conversations with full context retention
- **Event-Driven Architecture**: Loose coupling via EventBus with wildcard patterns
- **Personality-Driven AI**: 6-trait system influences all character behavior
- **Emergent Storytelling**: No scripts, stories emerge from interactions
- **Perfect Replay**: Record entire sessions, rewind and rewatch anytime
