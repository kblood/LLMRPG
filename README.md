# OllamaRPG - Autonomous AI-Driven RPG

An autonomous RPG where AI controls both the protagonist and NPCs using GOAP (Goal-Oriented Action Planning) and Ollama LLM integration. Watch emergent stories unfold as AI-driven characters interact, make decisions, and pursue their own goals.

## 🎮 Core Concept

Unlike traditional RPGs where you control the character, in OllamaRPG you **observe** the story. An LLM-powered AI controls the protagonist, deciding where to go, who to talk to, and what to do. Every character has their own personality, memories, relationships, and daily schedule, creating truly emergent gameplay.

## 🚀 Key Features

### AI-Driven Gameplay
- **GOAP AI System**: Characters use Goal-Oriented Action Planning to achieve high-level goals
- **LLM Integration**: Ollama generates natural goals and dialogue based on personality and context
- **Emergent Stories**: No scripted events - stories emerge from character interactions

### Rich Character Systems
- **Personality**: 6-trait system (aggression, friendliness, intelligence, caution, greed, honor)
- **Memory**: Characters remember conversations and events with time-based decay
- **Relationships**: Dynamic relationship tracking (-100 to +100 scale)
- **Schedules**: NPCs follow daily routines (work, rest, socialize)

### Game Master / Dungeon Master ✨ NEW!
- **AI Narrator**: "The Chronicler" provides atmospheric narration using LLM
- **Scene Descriptions**: Rich, atmospheric descriptions of locations and moments
- **Event Generation**: Dynamic events that respond to player actions
- **NPC Orchestration**: NPCs interact with each other naturally
- **Story Arc Tracking**: Intelligent progression through narrative acts
- **Adaptive Pacing**: Adjusts narration frequency based on action density

### Advanced Replay System
- **Deterministic Recording**: Record entire sessions with tiny file sizes (100-500 KB)
- **Time Manipulation**: Pause, rewind, fast-forward, slow-motion
- **LLM Inspection**: View exact prompts and responses from any moment
- **Checkpointing**: Jump to any point in the replay instantly

### Observer Controls
- **Camera Controls**: Follow any character or free-roam
- **Speed Control**: 0.25x to 10x playback speed
- **Thought Bubbles**: See what characters are thinking
- **Memory Inspector**: Dive into character memories and relationships
- **Event Timeline**: Track goals, dialogues, and actions

## 🛠️ Technology Stack

- **Platform**: Electron (cross-platform desktop app)
- **Game Engine**: Phaser 3 (2D rendering)
- **UI Framework**: React + Zustand (state management)
- **Styling**: TailwindCSS
- **AI**: Custom GOAP planner + Ollama LLM (local)
- **Pathfinding**: PathFinding.js (A* algorithm)
- **Build Tool**: Vite
- **Testing**: Vitest
- **Language**: JavaScript (ES modules)

## 📁 Project Structure

```
ollama-rpg/
├── src/
│   ├── core/           # Game engine, clock, state management
│   ├── entities/       # Character, NPC, Protagonist, Building
│   ├── components/     # ECS-style components
│   ├── systems/        # Game systems (Movement, GOAP, Dialogue, etc.)
│   ├── ai/             # GOAP planner, LLM integration, pathfinding
│   ├── services/       # Singleton services (Ollama, Replay, etc.)
│   ├── state/          # Zustand state stores
│   ├── ui/             # React components
│   ├── rendering/      # Phaser scenes and renderers
│   ├── replay/         # Replay recording and playback
│   └── utils/          # SeededRandom, EventBus, Logger
├── electron/           # Electron main process
├── assets/             # Sprites, tilesets, audio
├── config/             # Game configuration
└── tests/              # Unit and integration tests
```

## 🎯 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Ollama installed and running locally (`http://localhost:11434`)
  - Install from: https://ollama.ai/
  - Pull a model: `ollama pull mistral`

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ollama-rpg

# Install dependencies
npm install

# Run in development mode
npm run dev
```

### Development Commands

```bash
# Play the game (fully playable right now!)
npm run play:gm              # With Game Master narration ⭐ RECOMMENDED
node play-advanced.js        # Full 10-NPC experience
node play.js                 # Simple 3-NPC version
node test-autonomous-game.js # Watch AI play autonomously

# View replays
npm run replay:list      # List all replays
npm run replay:auto 1 3  # Auto-play replay at 3x speed
npm run replay:play 1    # Interactive playback
npm run replay:view 1    # Static viewer

# Test systems
npm run test:llm        # Test LLM integration
npm run test:dialogue   # Test dialogue system
npm run test:gm         # Test Game Master
npm run test:quest      # Test quest system
node test-all-npcs.js   # Test all 10 NPCs

# Development
npm run dev          # Start dev server (future web UI)
npm run build        # Build for production
npm run test         # Run test suite
```

## 📚 Documentation

### Essential Docs
- **[PROJECT_STATUS_2025-11-16.md](./PROJECT_STATUS_2025-11-16.md)** - 🆕 **Comprehensive status report**
- **[START_HERE.md](./START_HERE.md)** - Quick start guide
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete technical architecture
- **[FEATURE_STATUS.md](./FEATURE_STATUS.md)** - Detailed feature breakdown

### System Documentation
- **[GAME_MASTER_COMPLETE.md](./GAME_MASTER_COMPLETE.md)** - Game Master / DM system
- **[REPLAY_SYSTEM_COMPLETE.md](./REPLAY_SYSTEM_COMPLETE.md)** - Replay recording and playback
- **[QUEST_SYSTEM_IMPLEMENTED.md](./QUEST_SYSTEM_IMPLEMENTED.md)** - Quest system
- **[AUTONOMOUS_TEST_SUMMARY.md](./AUTONOMOUS_TEST_SUMMARY.md)** - AI autonomous gameplay

### Design Docs
- **[GAME_CONCEPT_AND_DESIGN.md](./GAME_CONCEPT_AND_DESIGN.md)** - Original concept
- **[WEB_GAME_CONCEPT.md](./WEB_GAME_CONCEPT.md)** - Web/Electron version design
- **[DEVELOPMENT_AGENTS.md](./DEVELOPMENT_AGENTS.md)** - Development approach

## 🏗️ Architecture Overview

### GOAP AI System

The heart of the autonomous behavior:

```javascript
// LLM generates high-level goal
Goal: "Visit the tavern to hear gossip"

// GOAP planner creates action sequence
Plan:
  1. ExitBuilding (home)
  2. MoveTo (tavern exterior)
  3. EnterBuilding (tavern)
  4. ApproachNPC (tavern keeper)
  5. TalkTo (tavern keeper)

// Actions execute automatically
Character navigates, enters tavern, talks to NPC
```

### Deterministic Design

Everything is deterministic for perfect replay:

- **Seeded RNG**: All randomness uses `SeededRandom` class
- **LLM Seeds**: Every Ollama call uses a deterministic seed
- **Game Time**: Never uses system time, only game frames
- **Event Ordering**: Events processed in deterministic order

### Event-Driven Communication

Systems communicate via EventBus:

```javascript
// System emits event
EventBus.emit('dialogue:completed', { characterId, npcId });

// Other systems listen
EventBus.on('dialogue:completed', (data) => {
  memorySystem.recordDialogue(data);
  relationshipSystem.updateRelationship(data);
});
```

## 🎨 Key Concepts

### Observer Gameplay

You don't play the game - you watch it:

1. **Follow Mode**: Camera follows protagonist or any NPC
2. **Speed Control**: Speed up boring parts, slow down interesting moments
3. **Inspect Tools**: View character thoughts, memories, relationships
4. **Replay System**: Rewind to re-watch key moments

### Emergent Storytelling

No scripted events. Stories emerge from:

- **LLM Goals**: Characters decide what they want to do
- **Personalities**: Traits influence decisions and dialogue
- **Memories**: Past events shape future behavior
- **Relationships**: Characters react based on how they feel about each other
- **Schedules**: Time-based routines create natural encounters

### Deterministic Replays

Perfect replay accuracy:

- Only inputs/decisions are recorded, not state
- Same seed → same LLM responses → same behavior
- Tiny file sizes (100-500 KB for hours of gameplay)
- Rewind, fast-forward, pause anytime
- Export segments, share replays

## 🔧 Development

### Adding a New GOAP Action

```javascript
// src/ai/goap/actions/MyAction.js
import { GOAPAction } from '../GOAPAction';

export class MyAction extends GOAPAction {
  constructor() {
    super('MyAction', 5); // name, cost
    this.preconditions = { /* world state requirements */ };
    this.effects = { /* world state changes */ };
  }

  async execute(character, params) {
    // Implement action logic
    // Return { completed: true/false }
  }
}
```

### Adding a New System

```javascript
// src/systems/MySystem.js
export class MySystem {
  constructor(priority = 50) {
    this.name = 'MySystem';
    this.priority = priority; // Lower = runs first
  }

  update(deltaTime, gameState) {
    // Process entities
  }
}
```

### Creating a React Component

```jsx
// src/ui/components/MyComponent.jsx
import { useGameStore } from '@state/gameStore';

export function MyComponent() {
  const gameState = useGameStore(state => state.gameState);
  
  return (
    <div className="my-component">
      {/* Use TailwindCSS */}
    </div>
  );
}
```

## 🧪 Testing

### Unit Tests

```javascript
// tests/unit/goap/GOAPPlanner.test.js
import { GOAPPlanner } from '@ai/goap/GOAPPlanner';

describe('GOAPPlanner', () => {
  test('should find path to goal', () => {
    const planner = new GOAPPlanner();
    const plan = planner.plan(currentState, goal, actions);
    expect(plan).toBeDefined();
  });
});
```

### Replay Tests

```javascript
// Verify determinism
const replay1 = await runReplay('test.replay');
const replay2 = await runReplay('test.replay');
expect(replay1.finalState).toEqual(replay2.finalState);
```

## 🎮 Game Controls (Observer Mode)

### Camera
- **Click character**: Follow that character
- **Mouse drag**: Pan camera
- **Mouse wheel**: Zoom in/out
- **ESC**: Free camera mode

### Playback
- **Space**: Pause/Resume
- **1-5**: Speed control (0.25x to 5x)
- **Left arrow**: Rewind 10 seconds
- **Right arrow**: Fast-forward 10 seconds

### Inspection
- **Click character**: View their info panel
- **M key**: Open memory inspector
- **R key**: Open relationship viewer
- **T key**: Toggle thought bubbles
- **D key**: Toggle debug panel

## 🌟 Roadmap

### Phase 1: Foundation ✅ COMPLETE
- [x] Project structure
- [x] Design documents
- [x] Agent guidelines
- [x] Base classes (Entity, System, Service)
- [x] Deterministic utilities (SeededRandom, GameClock)

### Phase 2: Core AI Systems ✅ COMPLETE
- [x] Ollama service with seeded generation
- [x] Dialogue generation
- [x] Personality system (6 traits)
- [x] Memory system with time decay
- [x] Relationship tracking
- [x] 10 unique NPCs created

### Phase 3: Game Systems ✅ COMPLETE
- [x] Dialogue system (multi-turn conversations)
- [x] Quest system (detection and tracking)
- [x] Game Master / Dungeon Master AI
- [x] Event system (EventBus)
- [x] Replay logging system

### Phase 4: Playability ✅ COMPLETE
- [x] CLI interface
- [x] Interactive demos (3 versions)
- [x] Autonomous gameplay (AI protagonist)
- [x] Replay viewer tools (3 modes)
- [x] Comprehensive testing

### Phase 5: Movement & GOAP (Not Started)
- [ ] GOAP planner implementation
- [ ] Basic actions (Move, Talk, Enter, Exit)
- [ ] Pathfinding integration
- [ ] Character movement in world space
- [ ] World state system

### Phase 6: Rendering (Planned)
- [ ] Phaser scenes integration
- [ ] Character rendering
- [ ] Camera system
- [ ] Animations

### Phase 7: Web UI (Planned)
- [ ] React HUD
- [ ] Character panels
- [ ] Thought bubbles
- [ ] Timeline visualization
- [ ] Visual novel style interface

### Phase 8: Content Expansion (Ongoing)
- [x] 10 NPCs with rich backstories
- [ ] 20+ NPCs (target)
- [ ] Village map
- [ ] Multiple buildings
- [ ] Daily NPC schedules
- [ ] Quest chains

### Phase 9: Polish (Future)
- [ ] Performance optimization
- [ ] Electron packaging
- [ ] Visual assets
- [ ] Save/load system

## 🤝 Contributing

This is an experimental project exploring autonomous AI-driven gameplay. Contributions are welcome!

### Development Guidelines

1. Read [.github/copilot-instructions.md](./.github/copilot-instructions.md)
2. Follow established patterns (System, Service, Entity)
3. Use import aliases (`@core`, `@ai`, `@ui`, etc.)
4. Write tests for new features
5. Keep systems deterministic
6. Log events for replay
7. Document complex logic

### Agent-Based Development

See [DEVELOPMENT_AGENTS.md](./DEVELOPMENT_AGENTS.md) for specialized agent roles and responsibilities.

## 📝 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- **Ollama** - Local LLM inference
- **Phaser 3** - Game engine
- **PathFinding.js** - A* pathfinding
- **React** - UI framework
- **Electron** - Desktop app framework

## 📧 Contact

For questions, suggestions, or discussions about autonomous AI gameplay, please open an issue.

---

**Watch the future of AI-driven storytelling unfold before your eyes.** 🎭✨
