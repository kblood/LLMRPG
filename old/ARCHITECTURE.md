# Game Architecture & Code Structure

A comprehensive architecture plan for the autonomous RPG, emphasizing testability, clean separation of concerns, and replay-driven development.

---

## Table of Contents

1. [Architectural Principles](#architectural-principles)
2. [High-Level Architecture](#high-level-architecture)
3. [Project Structure](#project-structure)
4. [Core Systems](#core-systems)
5. [Service Layer](#service-layer)
6. [Data Flow](#data-flow)
7. [Testing Strategy](#testing-strategy)
8. [Dependency Graph](#dependency-graph)
9. [Implementation Phases](#implementation-phases)

---

## Architectural Principles

### 1. **Separation of Concerns**

```
┌─────────────────────────────────────────────────┐
│                   UI Layer                      │
│         (React Components, Phaser Scenes)       │
└─────────────────┬───────────────────────────────┘
                  │ (reads state, dispatches events)
┌─────────────────▼───────────────────────────────┐
│              Presentation Layer                 │
│        (State Management, View Models)          │
└─────────────────┬───────────────────────────────┘
                  │ (observes, formats)
┌─────────────────▼───────────────────────────────┐
│               Game Logic Layer                  │
│    (Systems, Entities, Game Loop, GOAP)         │
└─────────────────┬───────────────────────────────┘
                  │ (uses)
┌─────────────────▼───────────────────────────────┐
│               Service Layer                     │
│  (Ollama, Pathfinding, Replay, Persistence)     │
└─────────────────┬───────────────────────────────┘
                  │ (uses)
┌─────────────────▼───────────────────────────────┐
│              Core Utilities                     │
│      (RNG, EventBus, Logger, Config)            │
└─────────────────────────────────────────────────┘
```

### 2. **Testability First**

- **Headless Mode**: Game logic runs without rendering
- **Deterministic**: Same inputs → same outputs
- **Replay-Driven**: Tests can use replay files
- **Mockable Services**: All external dependencies can be mocked

### 3. **Event-Driven Communication**

- Systems don't directly call each other
- All communication via EventBus
- Enables loose coupling and easy testing
- Replay system logs all events

### 4. **Immutable State Where Possible**

- State changes create new objects (for time-travel debugging)
- Mutable only where performance critical (positions, physics)
- Clear state ownership

### 5. **Single Responsibility**

- Each system does ONE thing well
- Clear interfaces between systems
- Easy to test in isolation

---

## High-Level Architecture

### Core Components

```
┌──────────────────────────────────────────────────────────┐
│                     ELECTRON MAIN PROCESS                │
│  - Window Management                                     │
│  - IPC Handlers (Save/Load, Settings)                    │
│  - Native OS Integration                                 │
└──────────────────────────────────────────────────────────┘
                           │
                           │ IPC
                           ▼
┌──────────────────────────────────────────────────────────┐
│                  ELECTRON RENDERER PROCESS               │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │                   React UI Layer                   │ │
│  │  - HUD Components                                  │ │
│  │  - Menu System                                     │ │
│  │  - Replay Controls                                 │ │
│  │  - Debug Panels                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                           │                              │
│                           │ (observes)                   │
│                           ▼                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │              State Management (Zustand)            │ │
│  │  - Game State Store                                │ │
│  │  - UI State Store                                  │ │
│  │  - Replay State Store                              │ │
│  └────────────────────────────────────────────────────┘ │
│                           │                              │
│                           │ (updates)                    │
│                           ▼                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │               Phaser Game Engine                   │ │
│  │  - WorldScene (renders game)                       │ │
│  │  - Sprite management                               │ │
│  │  - Animation                                       │ │
│  └────────────────────────────────────────────────────┘ │
│                           │                              │
│                           │ (calls)                      │
│                           ▼                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │                  Game Core                         │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │            Game Loop (GameEngine)            │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │          Systems (ECS-style)                 │ │ │
│  │  │  - MovementSystem                            │ │ │
│  │  │  - GOAPSystem                                │ │ │
│  │  │  - DialogueSystem                            │ │ │
│  │  │  - MemorySystem                              │ │ │
│  │  │  - RelationshipSystem                        │ │ │
│  │  │  - ScheduleSystem                            │ │ │
│  │  │  - WorldStateSystem                          │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │          Entities & Components               │ │ │
│  │  │  - Character (base)                          │ │ │
│  │  │    - Position, Sprite, AI, Memory, etc.      │ │ │
│  │  │  - World                                     │ │ │
│  │  │  - Building                                  │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────┘ │
│                           │                              │
│                           │ (uses)                       │
│                           ▼                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │                Services (Singletons)               │ │
│  │  - OllamaService                                   │ │
│  │  - PathfindingService                              │ │
│  │  - ReplayService                                   │ │
│  │  - PersistenceService                              │ │
│  │  - EventBus                                        │ │
│  └────────────────────────────────────────────────────┘ │
│                           │                              │
│                           │ (uses)                       │
│                           ▼                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │                Core Utilities                      │ │
│  │  - SeededRandom                                    │ │
│  │  - GameClock                                       │ │
│  │  - Logger                                          │ │
│  │  - Config                                          │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
ollama-rpg/
├── electron/                          # Electron main process
│   ├── main.js                        # Entry point, window creation
│   ├── preload.js                     # IPC bridge (security)
│   ├── ipc/                           # IPC handlers
│   │   ├── saveHandler.js
│   │   ├── replayHandler.js
│   │   └── settingsHandler.js
│   └── menu.js                        # Application menu
│
├── src/
│   ├── core/                          # Core game engine
│   │   ├── GameEngine.js              # Main game loop coordinator
│   │   ├── GameClock.js               # Deterministic time management
│   │   ├── GameState.js               # Central game state
│   │   ├── World.js                   # World entity container
│   │   └── bootstrap.js               # Game initialization
│   │
│   ├── entities/                      # Game entities (ECS-style)
│   │   ├── Entity.js                  # Base entity class
│   │   ├── Character.js               # Character entity
│   │   ├── Protagonist.js             # Player character
│   │   ├── NPC.js                     # Non-player character
│   │   ├── Building.js                # Building entity
│   │   └── Door.js                    # Door entity
│   │
│   ├── components/                    # Entity components (ECS)
│   │   ├── PositionComponent.js
│   │   ├── SpriteComponent.js
│   │   ├── AIComponent.js
│   │   ├── MemoryComponent.js
│   │   ├── PersonalityComponent.js
│   │   ├── RelationshipComponent.js
│   │   ├── ScheduleComponent.js
│   │   ├── MovementComponent.js
│   │   └── DialogueComponent.js
│   │
│   ├── systems/                       # Game systems (ECS)
│   │   ├── System.js                  # Base system class
│   │   ├── MovementSystem.js          # Handle character movement
│   │   ├── GOAPSystem.js              # Execute GOAP AI
│   │   ├── DialogueSystem.js          # Manage conversations
│   │   ├── MemorySystem.js            # Process memories
│   │   ├── RelationshipSystem.js      # Update relationships
│   │   ├── ScheduleSystem.js          # NPC daily schedules
│   │   ├── WorldStateSystem.js        # Time, weather, day/night
│   │   ├── InteractionSystem.js       # Handle entity interactions
│   │   └── PhysicsSystem.js           # Collision detection
│   │
│   ├── ai/                            # AI subsystems
│   │   ├── goap/
│   │   │   ├── GOAPPlanner.js         # A* planning in state space
│   │   │   ├── GOAPAction.js          # Base action class
│   │   │   ├── GOAPGoal.js            # Goal class
│   │   │   ├── WorldState.js          # World state representation
│   │   │   └── actions/               # Concrete actions
│   │   │       ├── MoveToAction.js
│   │   │       ├── ApproachNPCAction.js
│   │   │       ├── TalkToAction.js
│   │   │       ├── EnterBuildingAction.js
│   │   │       ├── ExitBuildingAction.js
│   │   │       ├── WaitAction.js
│   │   │       └── ExploreAction.js
│   │   │
│   │   ├── llm/
│   │   │   ├── GoalGenerator.js       # LLM → Goals
│   │   │   ├── DialogueGenerator.js   # LLM → Dialogue
│   │   │   ├── PromptBuilder.js       # Build prompts from context
│   │   │   ├── ResponseParser.js      # Parse LLM responses
│   │   │   └── templates/             # Prompt templates
│   │   │       ├── goalTemplate.js
│   │   │       ├── dialogueTemplate.js
│   │   │       └── thoughtTemplate.js
│   │   │
│   │   ├── memory/
│   │   │   ├── Memory.js              # Memory object
│   │   │   ├── MemoryStore.js         # Character memory storage
│   │   │   ├── MemoryRetrieval.js     # Query memories
│   │   │   └── MemoryDecay.js         # Time-based decay
│   │   │
│   │   └── personality/
│   │       ├── Personality.js         # Personality trait system
│   │       └── PersonalityGenerator.js
│   │
│   ├── services/                      # Singleton services
│   │   ├── Service.js                 # Base service class
│   │   ├── OllamaService.js           # Ollama LLM client
│   │   ├── PathfindingService.js      # A* pathfinding
│   │   ├── ReplayService.js           # Replay recording/playback
│   │   ├── PersistenceService.js      # Save/load
│   │   ├── EventBus.js                # Global event bus
│   │   ├── AssetService.js            # Asset loading/caching
│   │   └── ConfigService.js           # Configuration management
│   │
│   ├── replay/                        # Replay system
│   │   ├── ReplayLogger.js            # Record events
│   │   ├── ReplayEngine.js            # Playback engine
│   │   ├── CheckpointManager.js       # State snapshots
│   │   ├── ReplayFile.js              # File format handling
│   │   ├── EventSerializer.js         # Serialize events
│   │   └── ReplayCompressor.js        # Compression utilities
│   │
│   ├── utils/                         # Core utilities
│   │   ├── SeededRandom.js            # Deterministic RNG
│   │   ├── Logger.js                  # Logging utility
│   │   ├── Vector2.js                 # 2D vector math
│   │   ├── Grid.js                    # Grid utilities
│   │   ├── AStar.js                   # A* algorithm
│   │   ├── Dijkstra.js                # Dijkstra pathfinding
│   │   └── helpers.js                 # Misc helpers
│   │
│   ├── rendering/                     # Phaser rendering layer
│   │   ├── PhaserGame.js              # Phaser game instance
│   │   ├── scenes/
│   │   │   ├── BootScene.js           # Asset loading
│   │   │   ├── WorldScene.js          # Main game world
│   │   │   └── UIScene.js             # HUD overlay
│   │   │
│   │   ├── renderers/                 # Entity renderers
│   │   │   ├── CharacterRenderer.js
│   │   │   ├── BuildingRenderer.js
│   │   │   ├── EffectRenderer.js
│   │   │   └── UIRenderer.js
│   │   │
│   │   └── camera/
│   │       ├── CameraController.js
│   │       └── CameraTargets.js
│   │
│   ├── state/                         # State management (Zustand)
│   │   ├── gameStore.js               # Game state store
│   │   ├── uiStore.js                 # UI state store
│   │   ├── replayStore.js             # Replay state store
│   │   └── debugStore.js              # Debug state store
│   │
│   ├── ui/                            # React UI components
│   │   ├── App.jsx                    # Root component
│   │   ├── components/
│   │   │   ├── HUD/
│   │   │   │   ├── HUD.jsx
│   │   │   │   ├── StatusBar.jsx
│   │   │   │   ├── TimeDisplay.jsx
│   │   │   │   └── FPSCounter.jsx
│   │   │   │
│   │   │   ├── Character/
│   │   │   │   ├── CharacterPanel.jsx
│   │   │   │   ├── ThoughtBubble.jsx
│   │   │   │   ├── GoalDisplay.jsx
│   │   │   │   └── RelationshipView.jsx
│   │   │   │
│   │   │   ├── Dialogue/
│   │   │   │   ├── DialogueLog.jsx
│   │   │   │   ├── DialogueViewer.jsx
│   │   │   │   └── ConversationHistory.jsx
│   │   │   │
│   │   │   ├── Replay/
│   │   │   │   ├── ReplayControls.jsx
│   │   │   │   ├── Timeline.jsx
│   │   │   │   ├── EventMarkers.jsx
│   │   │   │   ├── LLMCallInspector.jsx
│   │   │   │   └── SpeedControl.jsx
│   │   │   │
│   │   │   ├── Debug/
│   │   │   │   ├── DebugPanel.jsx
│   │   │   │   ├── EntityInspector.jsx
│   │   │   │   ├── SystemMonitor.jsx
│   │   │   │   ├── MemoryInspector.jsx
│   │   │   │   └── EventLog.jsx
│   │   │   │
│   │   │   └── Menu/
│   │   │       ├── MainMenu.jsx
│   │   │       ├── SettingsMenu.jsx
│   │   │       ├── SaveLoadMenu.jsx
│   │   │       └── ReplayBrowser.jsx
│   │   │
│   │   └── hooks/                     # React hooks
│   │       ├── useGameState.js
│   │       ├── useReplayControl.js
│   │       ├── useCharacter.js
│   │       └── useEventListener.js
│   │
│   ├── data/                          # Game data & config
│   │   ├── maps/
│   │   │   ├── millbrook.json         # Tiled map data
│   │   │   └── interiors/
│   │   │       ├── tavern.json
│   │   │       └── home.json
│   │   │
│   │   ├── characters/
│   │   │   ├── protagonist.json
│   │   │   ├── mara.json
│   │   │   └── grok.json
│   │   │
│   │   ├── schedules/
│   │   │   ├── tavern_keeper.json
│   │   │   ├── blacksmith.json
│   │   │   └── villager.json
│   │   │
│   │   └── world/
│   │       ├── buildings.json
│   │       ├── locations.json
│   │       └── knowledge.json
│   │
│   ├── tests/                         # Test files
│   │   ├── unit/
│   │   │   ├── goap/
│   │   │   │   ├── GOAPPlanner.test.js
│   │   │   │   └── actions.test.js
│   │   │   ├── systems/
│   │   │   │   ├── MovementSystem.test.js
│   │   │   │   └── DialogueSystem.test.js
│   │   │   ├── utils/
│   │   │   │   ├── SeededRandom.test.js
│   │   │   │   └── AStar.test.js
│   │   │   └── replay/
│   │   │       ├── ReplayLogger.test.js
│   │   │       └── ReplayEngine.test.js
│   │   │
│   │   ├── integration/
│   │   │   ├── character-movement.test.js
│   │   │   ├── dialogue-flow.test.js
│   │   │   ├── goal-planning.test.js
│   │   │   └── replay-determinism.test.js
│   │   │
│   │   ├── replay/                    # Replay-based tests
│   │   │   ├── replays/               # Test replay files
│   │   │   │   ├── simple-movement.replay
│   │   │   │   ├── dialogue-test.replay
│   │   │   │   └── full-session.replay
│   │   │   └── replay-tests.js
│   │   │
│   │   └── helpers/
│   │       ├── mockOllama.js
│   │       ├── testWorld.js
│   │       └── assertions.js
│   │
│   └── index.js                       # Renderer process entry
│
├── assets/                            # Game assets
│   ├── sprites/
│   │   ├── characters/
│   │   ├── buildings/
│   │   └── effects/
│   ├── tilesets/
│   ├── audio/
│   └── ui/
│
├── config/
│   ├── settings.json                  # Game configuration
│   ├── ollama.json                    # LLM configuration
│   └── keybindings.json               # Control mappings
│
├── saves/                             # Save files (auto-created)
├── replays/                           # Replay files (auto-created)
├── logs/                              # Log files (auto-created)
│
├── package.json
├── vite.config.js                     # Vite bundler config
├── electron-builder.json              # Electron packaging
├── tsconfig.json                      # TypeScript config (optional)
├── .eslintrc.js                       # Linting rules
└── README.md
```

---

## Core Systems

### System Base Class

```javascript
// src/systems/System.js

export class System {
  constructor(name, priority = 0) {
    this.name = name;
    this.priority = priority; // Lower = runs first
    this.enabled = true;
  }

  /**
   * Called once when system is initialized
   * @param {GameEngine} engine
   */
  initialize(engine) {
    this.engine = engine;
  }

  /**
   * Called every frame
   * @param {number} deltaTime - Time since last frame (seconds)
   * @param {GameState} gameState
   */
  update(deltaTime, gameState) {
    throw new Error('System.update() must be implemented');
  }

  /**
   * Called when system is destroyed
   */
  destroy() {
    // Override if cleanup needed
  }
}
```

### System Registry

```javascript
// src/core/SystemRegistry.js

export class SystemRegistry {
  constructor() {
    this.systems = new Map();
  }

  register(system) {
    this.systems.set(system.name, system);
  }

  get(name) {
    return this.systems.get(name);
  }

  getAll() {
    // Return systems sorted by priority
    return Array.from(this.systems.values())
      .sort((a, b) => a.priority - b.priority);
  }

  initializeAll(engine) {
    this.getAll().forEach(system => system.initialize(engine));
  }

  updateAll(deltaTime, gameState) {
    this.getAll()
      .filter(s => s.enabled)
      .forEach(system => system.update(deltaTime, gameState));
  }

  destroyAll() {
    this.getAll().forEach(system => system.destroy());
  }
}
```

### Example System: MovementSystem

```javascript
// src/systems/MovementSystem.js

import { System } from './System.js';
import { EventBus } from '../services/EventBus.js';

export class MovementSystem extends System {
  constructor() {
    super('MovementSystem', 10); // Priority 10
  }

  update(deltaTime, gameState) {
    const characters = gameState.world.getEntitiesByType('Character');

    for (const character of characters) {
      if (!character.movement) continue;

      const result = this.updateCharacterMovement(character, deltaTime);

      if (result.pathCompleted) {
        EventBus.emit('movement:path_completed', {
          characterId: character.id,
          position: { x: character.position.x, y: character.position.y }
        });
      }
    }
  }

  updateCharacterMovement(character, deltaTime) {
    const movement = character.movement;

    if (!movement.path || movement.path.length === 0) {
      return { pathCompleted: false };
    }

    const target = movement.path[movement.pathIndex];
    const dx = target.x - character.position.x;
    const dy = target.y - character.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 2) {
      // Reached waypoint
      movement.pathIndex++;

      if (movement.pathIndex >= movement.path.length) {
        // Path completed
        movement.path = null;
        movement.pathIndex = 0;
        return { pathCompleted: true };
      }

      return { pathCompleted: false };
    }

    // Move towards waypoint
    const speed = movement.speed || 100;
    const moveDistance = speed * deltaTime;
    const ratio = Math.min(moveDistance / distance, 1);

    character.position.x += dx * ratio;
    character.position.y += dy * ratio;

    return { pathCompleted: false };
  }
}
```

---

## Service Layer

### Service Base Class

```javascript
// src/services/Service.js

export class Service {
  constructor(name) {
    this.name = name;
    this.initialized = false;
  }

  /**
   * Initialize the service
   */
  async initialize() {
    if (this.initialized) {
      console.warn(`Service ${this.name} already initialized`);
      return;
    }

    await this.onInitialize();
    this.initialized = true;
  }

  /**
   * Override this in subclasses
   */
  async onInitialize() {
    // Override
  }

  /**
   * Shutdown the service
   */
  async shutdown() {
    if (!this.initialized) return;

    await this.onShutdown();
    this.initialized = false;
  }

  /**
   * Override this in subclasses
   */
  async onShutdown() {
    // Override
  }
}
```

### Example Service: OllamaService

```javascript
// src/services/OllamaService.js

import axios from 'axios';
import { Service } from './Service.js';
import { ReplayService } from './ReplayService.js';
import { SeededRandom } from '../utils/SeededRandom.js';

export class OllamaService extends Service {
  constructor(config = {}) {
    super('OllamaService');

    this.baseURL = config.host || 'http://localhost:11434';
    this.model = config.model || 'mistral';
    this.temperature = config.temperature || 0.7;
    this.timeout = config.timeout || 30000;

    this.callCounter = 0;
    this.seedRNG = null;
  }

  async onInitialize() {
    // Test connection
    const connected = await this.testConnection();
    if (!connected) {
      console.warn('Ollama service not available, will use fallback responses');
    }

    // Initialize seed RNG for this session
    const gameSeed = ReplayService.getInstance().getGameSeed();
    this.seedRNG = new SeededRandom(gameSeed + 12345);
  }

  async testConnection() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async generate(prompt, options = {}) {
    const callId = this.callCounter++;
    const seed = this.generateSeed();

    try {
      const response = await axios.post(
        `${this.baseURL}/api/generate`,
        {
          model: options.model || this.model,
          prompt: prompt,
          temperature: options.temperature || this.temperature,
          seed: seed,
          stream: false
        },
        { timeout: this.timeout }
      );

      const result = response.data.response;

      // Log to replay
      ReplayService.getInstance().logLLMCall({
        callId,
        seed,
        prompt,
        response: result,
        model: options.model || this.model,
        temperature: options.temperature || this.temperature
      });

      return result;

    } catch (error) {
      console.error('Ollama generation failed:', error);

      const fallback = this.getFallbackResponse(prompt);

      // Still log the call (with fallback)
      ReplayService.getInstance().logLLMCall({
        callId,
        seed,
        prompt,
        response: fallback,
        model: 'fallback',
        temperature: 0,
        error: error.message
      });

      return fallback;
    }
  }

  generateSeed() {
    // Generate deterministic seed
    return this.seedRNG.nextInt(0, 2147483647);
  }

  getFallbackResponse(prompt) {
    if (prompt.includes('GOAL:')) {
      return 'GOAL: Wait and observe\nTARGET: none\nPRIORITY: 30';
    }
    return 'I am thinking about what to do next.';
  }
}

// Singleton instance
let instance = null;

OllamaService.getInstance = function(config) {
  if (!instance) {
    instance = new OllamaService(config);
  }
  return instance;
};
```

### Service Manager

```javascript
// src/services/ServiceManager.js

export class ServiceManager {
  constructor() {
    this.services = new Map();
  }

  register(service) {
    this.services.set(service.name, service);
  }

  get(name) {
    return this.services.get(name);
  }

  async initializeAll() {
    const services = Array.from(this.services.values());

    for (const service of services) {
      console.log(`Initializing ${service.name}...`);
      await service.initialize();
    }
  }

  async shutdownAll() {
    const services = Array.from(this.services.values());

    for (const service of services) {
      console.log(`Shutting down ${service.name}...`);
      await service.shutdown();
    }
  }
}
```

---

## Data Flow

### Game Loop Flow

```
┌─────────────────────────────────────────────────┐
│              Game Loop (60 FPS)                 │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  1. Process Input Events (if in play mode)      │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  2. Update Game Clock                           │
│     - Increment frame counter                   │
│     - Update game time                          │
│     - Update in-game hour/day                   │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  3. Update Systems (in priority order)          │
│     a. WorldStateSystem (time, weather)         │
│     b. ScheduleSystem (NPC schedules)           │
│     c. GOAPSystem (AI planning & execution)     │
│     d. MovementSystem (character movement)      │
│     e. PhysicsSystem (collision detection)      │
│     f. DialogueSystem (conversations)           │
│     g. MemorySystem (memory processing)         │
│     h. RelationshipSystem (relationship decay)  │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  4. Process Event Queue                         │
│     - Dispatch all queued events                │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  5. Checkpoint (if needed)                      │
│     - Every 3600 frames (60 seconds)            │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  6. Update State Store (Zustand)                │
│     - Push updates to React                     │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  7. Render                                      │
│     a. Phaser renders game world                │
│     b. React renders UI overlay                 │
└─────────────────────────────────────────────────┘
```

### Event Flow

```
┌─────────────────────────────────────────────────┐
│         Something happens in game               │
│    (e.g., character completes movement)         │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│    System emits event via EventBus              │
│    EventBus.emit('movement:completed', {...})   │
└─────────────────────────────────────────────────┘
                     │
                     ├──────────────────────┬──────────────────┐
                     ▼                      ▼                  ▼
┌──────────────────────────┐  ┌─────────────────────┐  ┌─────────────┐
│  ReplayService           │  │  Other Systems      │  │  UI Store   │
│  (logs event)            │  │  (listening)        │  │  (updates)  │
└──────────────────────────┘  └─────────────────────┘  └─────────────┘
```

### LLM Call Flow

```
┌─────────────────────────────────────────────────┐
│  GOAPSystem needs new goal for character        │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  GoalGenerator.generate(character)              │
│  - Builds prompt from character state           │
│  - Includes personality, memories, context      │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  OllamaService.generate(prompt)                 │
│  - Generates deterministic seed                 │
│  - Calls Ollama API with seed                   │
│  - Logs call to ReplayService                   │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  ResponseParser.parseGoal(response)             │
│  - Extracts goal from LLM response              │
│  - Returns structured Goal object               │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  GOAPSystem receives goal                       │
│  - Passes to character's AI component           │
│  - Triggers planning                            │
└─────────────────────────────────────────────────┘
```

---

## Testing Strategy

### 1. Unit Tests

Test individual components in isolation:

```javascript
// tests/unit/goap/GOAPPlanner.test.js

import { GOAPPlanner } from '../../../src/ai/goap/GOAPPlanner.js';
import { MoveToAction } from '../../../src/ai/goap/actions/MoveToAction.js';

describe('GOAPPlanner', () => {
  let planner;

  beforeEach(() => {
    planner = new GOAPPlanner();
  });

  test('should find simple path to goal', () => {
    const currentState = {
      character_location: 'home',
      character_interior: true
    };

    const goal = {
      desiredState: {
        character_location: 'tavern',
        character_interior: false
      }
    };

    const actions = [
      new ExitBuildingAction(),
      new MoveToAction()
    ];

    const plan = planner.plan(currentState, goal, actions);

    expect(plan).toHaveLength(2);
    expect(plan[0].name).toBe('ExitBuilding');
    expect(plan[1].name).toBe('MoveTo');
  });
});
```

### 2. Integration Tests

Test system interactions:

```javascript
// tests/integration/character-movement.test.js

import { GameEngine } from '../../src/core/GameEngine.js';
import { Character } from '../../src/entities/Character.js';

describe('Character Movement Integration', () => {
  let engine;
  let character;

  beforeEach(() => {
    engine = new GameEngine({ headless: true });
    engine.initialize();

    character = new Character('test', 100, 100);
    engine.gameState.world.addEntity(character);
  });

  test('character should move to target position', () => {
    character.navigateTo(200, 200);

    // Run simulation for 5 seconds
    for (let i = 0; i < 300; i++) {
      engine.update(1/60);
    }

    expect(character.position.x).toBeCloseTo(200, 1);
    expect(character.position.y).toBeCloseTo(200, 1);
  });
});
```

### 3. Replay-Based Tests

Use replay files for regression testing:

```javascript
// tests/replay/replay-tests.js

import { ReplayEngine } from '../../src/replay/ReplayEngine.js';
import { loadReplayFile } from '../helpers/loadReplay.js';

describe('Replay Determinism Tests', () => {
  test('replay should produce identical results', async () => {
    const replayData = await loadReplayFile('simple-movement.replay');

    const engine1 = new ReplayEngine();
    await engine1.loadReplay(replayData);
    const result1 = await engine1.runToCompletion();

    const engine2 = new ReplayEngine();
    await engine2.loadReplay(replayData);
    const result2 = await engine2.runToCompletion();

    // Should produce identical final states
    expect(result1.finalState).toEqual(result2.finalState);
  });

  test('LLM responses should be cached correctly', async () => {
    const replayData = await loadReplayFile('dialogue-test.replay');

    const engine = new ReplayEngine();
    await engine.loadReplay(replayData);

    // Mock Ollama to ensure we're using cached responses
    const ollamaSpy = jest.spyOn(engine.ollamaService, 'generate');

    await engine.runToCompletion();

    // Should never call Ollama (uses cache)
    expect(ollamaSpy).not.toHaveBeenCalled();
  });
});
```

### 4. Headless Mode

Run game without rendering for fast testing:

```javascript
// src/core/GameEngine.js

export class GameEngine {
  constructor(options = {}) {
    this.headless = options.headless || false;
    this.renderingEnabled = !this.headless;
  }

  initialize() {
    // Initialize systems
    this.initializeSystems();

    // Skip Phaser if headless
    if (!this.headless) {
      this.initializeRenderer();
    }
  }

  update(deltaTime) {
    // Update systems (works in headless mode)
    this.systemRegistry.updateAll(deltaTime, this.gameState);

    // Render only if not headless
    if (this.renderingEnabled) {
      this.render();
    }
  }
}
```

---

## Dependency Graph

```
Core Utilities (no dependencies)
    ↑
    │
Services (depend on utilities)
    ↑
    │
AI Subsystems (depend on services)
    ↑
    │
Components (depend on AI subsystems)
    ↑
    │
Entities (depend on components)
    ↑
    │
Systems (depend on entities, services)
    ↑
    │
GameEngine (depends on systems)
    ↑
    │
Rendering Layer (depends on GameEngine)
    ↑
    │
UI Layer (depends on state from GameEngine)
```

**Key Rules:**
- Lower layers never import from higher layers
- Services are singletons, never imported by components/entities
- Systems communicate via EventBus, not direct calls
- UI reads state, never modifies game state directly

---

## Implementation Phases

### Phase 1: Foundation (Week 1)

**Goal**: Basic structure and determinism

```javascript
// Implement:
- Core utilities (SeededRandom, GameClock, Logger)
- EventBus
- GameEngine skeleton
- System base classes
- Entity base classes
- ReplayLogger (basic)
- Basic unit tests

// Deliverable:
// A headless game loop that runs deterministically
```

### Phase 2: Movement & World (Week 2)

**Goal**: Characters can move in a world

```javascript
// Implement:
- World entity
- Character entity
- PositionComponent, MovementComponent
- MovementSystem
- PathfindingService
- Simple Phaser rendering
- Movement tests

// Deliverable:
// Characters navigate a simple map
```

### Phase 3: GOAP AI (Week 3)

**Goal**: AI planning works

```javascript
// Implement:
- GOAPPlanner
- GOAPAction base
- Core actions (MoveTo, Wait, EnterBuilding, etc.)
- GOAPSystem
- WorldState representation
- GOAP unit tests

// Deliverable:
// Characters can plan and execute multi-step actions
```

### Phase 4: LLM Integration (Week 4)

**Goal**: LLM generates goals

```javascript
// Implement:
- OllamaService
- GoalGenerator
- PromptBuilder
- ResponseParser
- Seed management
- LLM call logging

// Deliverable:
// Characters receive goals from LLM and plan actions
```

### Phase 5: Social Systems (Week 5)

**Goal**: Dialogue and relationships

```javascript
// Implement:
- DialogueSystem
- DialogueGenerator
- MemoryComponent, MemorySystem
- RelationshipComponent, RelationshipSystem
- PersonalityComponent
- Dialogue tests

// Deliverable:
// Characters have conversations, remember, form relationships
```

### Phase 6: Replay System (Week 6)

**Goal**: Full replay functionality

```javascript
// Implement:
- ReplayEngine
- CheckpointManager
- ReplayFile format
- Compression
- Playback controls
- Replay tests

// Deliverable:
// Can record, save, load, and replay sessions
```

### Phase 7: UI (Week 7)

**Goal**: Beautiful React UI

```javascript
// Implement:
- All React components
- State management (Zustand)
- Replay controls UI
- Debug panels
- HUD

// Deliverable:
// Full UI for observing and controlling game
```

### Phase 8: Content & Polish (Weeks 8-10)

**Goal**: Full game content

```javascript
// Implement:
- Complete map
- Multiple NPCs
- Schedules
- Buildings
- Visual polish
- Sound effects
- Settings menu

// Deliverable:
// Feature-complete game
```

---

## Summary

This architecture provides:

✅ **Clean separation**: Logic, rendering, UI separated
✅ **Testable**: Headless mode, replay tests, mocked services
✅ **Deterministic**: Seeded RNG, controlled LLM calls
✅ **Scalable**: ECS-style systems, easy to add features
✅ **Maintainable**: Clear dependencies, single responsibility
✅ **Debuggable**: EventBus, replay system, inspector tools
✅ **Performant**: Efficient systems, optional rendering

The key innovation is the **replay system as a testing tool** - instead of writing complex mocks, we record real gameplay and use it for regression testing.
