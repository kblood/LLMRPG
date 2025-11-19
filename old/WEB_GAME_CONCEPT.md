# Ollama RPG - Autonomous Web-Based Game Concept

A fully autonomous web-based RPG using Electron, Phaser 3, and Ollama LLM integration. NPCs and the protagonist are controlled by AI using GOAP (Goal-Oriented Action Planning) systems, creating emergent gameplay where you observe rather than play.

---

## Table of Contents

1. [Core Concept & Vision](#core-concept--vision)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [GOAP AI System](#goap-ai-system)
5. [Game Systems](#game-systems)
6. [LLM Integration](#llm-integration)
7. [UI/UX Design](#uiux-design)
8. [Technical Implementation](#technical-implementation)
9. [Development Roadmap](#development-roadmap)

---

## Core Concept & Vision

### What Makes This Different

**Observer-Based Gameplay**: You don't control the protagonist. Instead, an LLM-driven AI controls the main character, making decisions about where to go, who to talk to, and what to do. You observe the story unfold.

**Fully Autonomous NPCs**: Every character (including the protagonist) uses a GOAP AI system that:
- Generates high-level goals from LLM suggestions
- Plans action sequences to achieve goals
- Executes actions with pathfinding and interaction
- Adapts to changing circumstances

**Emergent Storytelling**: No scripted events. The LLM generates goals for characters, and the GOAP system figures out how to achieve them. Stories emerge from interactions.

### Player Experience

You launch the game and watch as:
1. The protagonist wakes up in their home
2. LLM decides: "I should check the tavern for news"
3. GOAP plans: Navigate to door → Exit building → Navigate to tavern → Enter tavern → Find NPC → Initiate dialogue
4. Protagonist executes the plan automatically
5. Conversation unfolds with AI-generated dialogue
6. New goals emerge from the conversation
7. The cycle continues...

You can:
- Pause/resume the simulation
- Speed up/slow down time
- View character thoughts and goals
- Inspect character relationships and memories
- Save/load interesting moments
- (Optional) Occasionally suggest goals to the protagonist

---

## Technology Stack

### Core Technologies

```
┌─────────────────────────────────────────────┐
│              Electron Shell                 │
│  (Standalone app, no webserver needed)      │
├─────────────────────────────────────────────┤
│  Frontend (Renderer Process)                │
│  ├─ Phaser 3 (Game Rendering)              │
│  ├─ React (UI/HUD/Menus)                   │
│  ├─ Zustand (State Management)             │
│  └─ TailwindCSS (UI Styling)               │
├─────────────────────────────────────────────┤
│  Backend (Main Process)                     │
│  ├─ Node.js (Core Logic)                   │
│  ├─ Custom GOAP Engine                     │
│  ├─ PathFinding.js (A* Pathfinding)        │
│  ├─ Axios (Ollama HTTP Client)             │
│  └─ Better-SQLite3 (Save/Load)             │
├─────────────────────────────────────────────┤
│  External Services                          │
│  └─ Ollama (Local LLM Server)              │
└─────────────────────────────────────────────┘
```

### Dependencies

```json
{
  "dependencies": {
    "electron": "^28.0.0",
    "phaser": "^3.70.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.0",
    "axios": "^1.6.0",
    "pathfinding": "^0.4.18",
    "better-sqlite3": "^9.2.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "electron-builder": "^24.9.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0"
  }
}
```

---

## Project Structure

```
ollama-rpg-web/
├── electron/
│   ├── main.js                    # Electron main process entry
│   ├── preload.js                 # IPC bridge (security)
│   └── menu.js                    # Application menu
│
├── src/
│   ├── game/                      # Phaser game code
│   │   ├── scenes/
│   │   │   ├── BootScene.js       # Asset loading
│   │   │   ├── WorldScene.js      # Main game world
│   │   │   └── UIScene.js         # HUD overlay
│   │   │
│   │   ├── entities/
│   │   │   ├── Character.js       # Base character class
│   │   │   ├── Protagonist.js     # Main character
│   │   │   └── NPC.js             # Non-player characters
│   │   │
│   │   ├── world/
│   │   │   ├── Map.js             # Tilemap management
│   │   │   ├── Building.js        # Interior/exterior locations
│   │   │   └── WorldState.js      # Time, weather, global state
│   │   │
│   │   └── config.js              # Phaser configuration
│   │
│   ├── ai/                        # AI Systems
│   │   ├── goap/
│   │   │   ├── GOAPPlanner.js     # GOAP planning algorithm
│   │   │   ├── GOAPAction.js      # Base action class
│   │   │   ├── GOAPGoal.js        # Goal definitions
│   │   │   └── actions/           # Concrete actions
│   │   │       ├── MoveToAction.js
│   │   │       ├── TalkToAction.js
│   │   │       ├── EnterBuildingAction.js
│   │   │       ├── ExitBuildingAction.js
│   │   │       ├── WaitAction.js
│   │   │       └── ExploreAction.js
│   │   │
│   │   ├── llm/
│   │   │   ├── OllamaClient.js    # Ollama API wrapper
│   │   │   ├── GoalGenerator.js   # LLM → Goals
│   │   │   ├── DialogueGenerator.js # LLM → Dialogue
│   │   │   └── PromptTemplates.js # Prompt engineering
│   │   │
│   │   ├── pathfinding/
│   │   │   ├── PathfindingManager.js # A* wrapper
│   │   │   └── NavigationGrid.js     # Collision grid
│   │   │
│   │   └── memory/
│   │       ├── MemorySystem.js    # Character memories
│   │       ├── KnowledgeGraph.js  # World facts
│   │       └── RelationshipTracker.js # NPC relationships
│   │
│   ├── systems/                   # Game Systems
│   │   ├── PersonalitySystem.js   # Personality traits
│   │   ├── ScheduleSystem.js      # NPC daily routines
│   │   ├── DialogueSystem.js      # Conversation management
│   │   ├── QuestSystem.js         # Quest tracking
│   │   └── EventSystem.js         # World events
│   │
│   ├── ui/                        # React UI Components
│   │   ├── components/
│   │   │   ├── HUD.jsx            # Main HUD
│   │   │   ├── CharacterPanel.jsx # Character info
│   │   │   ├── ThoughtBubble.jsx  # Show character thoughts
│   │   │   ├── DialogueLog.jsx    # Conversation history
│   │   │   ├── ControlPanel.jsx   # Pause/speed/camera controls
│   │   │   ├── MemoryInspector.jsx # View memories
│   │   │   └── DebugPanel.jsx     # Dev tools
│   │   │
│   │   ├── App.jsx                # Root React component
│   │   └── index.jsx              # React entry point
│   │
│   ├── persistence/
│   │   ├── SaveManager.js         # Save/load system
│   │   ├── Database.js            # SQLite wrapper
│   │   └── Serializers.js         # Entity serialization
│   │
│   ├── utils/
│   │   ├── EventBus.js            # Global event system
│   │   ├── Config.js              # Configuration loader
│   │   └── Logger.js              # Debug logging
│   │
│   └── index.html                 # Electron renderer HTML
│
├── assets/                        # Game Assets
│   ├── tilesets/                  # Map tiles
│   ├── sprites/                   # Character sprites
│   ├── audio/                     # Sound effects & music
│   └── ui/                        # UI graphics
│
├── saves/                         # Save files (auto-created)
│
├── config/
│   └── settings.json              # Game configuration
│
├── package.json                   # NPM configuration
├── vite.config.js                 # Vite bundler config
├── electron-builder.json          # Electron packaging config
└── README.md                      # Documentation
```

---

## GOAP AI System

### What is GOAP?

**Goal-Oriented Action Planning** is an AI technique where:
1. Characters have **goals** (high-level desires)
2. Characters have **actions** (things they can do)
3. A **planner** finds a sequence of actions to achieve goals
4. Characters **execute** the plan step-by-step

### Benefits for This Game

- **High-level LLM integration**: LLM suggests "Talk to the blacksmith about rumors" → GOAP figures out how
- **Emergent behavior**: Characters adapt plans when situations change
- **Reusable actions**: Same actions work for all characters
- **Debuggable**: Can inspect plan, current action, goal

### GOAP Components

#### 1. World State

Current state of the world (key-value pairs):

```javascript
{
  "character_location": "home",
  "character_interior": true,
  "near_npc_id": null,
  "has_quest_item": false,
  "time_of_day": "morning",
  "npc_mara_location": "tavern",
  "door_nearby": true
}
```

#### 2. Goals

Desired world states with priorities:

```javascript
class GOAPGoal {
  constructor(name, desiredState, priority) {
    this.name = name;                    // "Talk to Mara"
    this.desiredState = desiredState;    // { near_npc_id: "mara", character_interior: false }
    this.priority = priority;            // 0-100
    this.isValid = (worldState) => {...} // Can this goal be pursued?
  }
}
```

**Example Goals**:
- "Explore the tavern" → `{ character_location: "tavern", character_interior: true }`
- "Talk to blacksmith" → `{ near_npc_id: "blacksmith", in_conversation: true }`
- "Return home" → `{ character_location: "home", character_interior: true }`

#### 3. Actions

Things characters can do:

```javascript
class GOAPAction {
  constructor(name, cost, preconditions, effects) {
    this.name = name;                 // "Move to Location"
    this.cost = cost;                 // Lower = preferred
    this.preconditions = preconditions; // What must be true to use this
    this.effects = effects;           // What changes after using this
  }

  isValid(worldState) {
    // Check if preconditions are met
  }

  execute(character, worldState) {
    // Perform the action
  }
}
```

**Example Actions**:

```javascript
// Move to a location
{
  name: "Move to Location",
  cost: 10,
  preconditions: { character_interior: false },
  effects: (targetLocation) => ({
    character_location: targetLocation,
    near_npc_id: null
  }),
  execute: (character, target) => {
    // Use pathfinding to move character
    return character.navigateTo(target.position);
  }
}

// Enter building
{
  name: "Enter Building",
  cost: 5,
  preconditions: { door_nearby: true, character_interior: false },
  effects: (building) => ({
    character_interior: true,
    character_location: building.name
  }),
  execute: (character, building) => {
    character.enterBuilding(building);
  }
}

// Exit building
{
  name: "Exit Building",
  cost: 5,
  preconditions: { character_interior: true },
  effects: { character_interior: false },
  execute: (character) => {
    character.exitBuilding();
  }
}

// Talk to NPC
{
  name: "Talk to NPC",
  cost: 1,
  preconditions: { near_npc_id: (npcId) => npcId !== null },
  effects: { in_conversation: true },
  execute: async (character, npcId) => {
    return await character.initiateDialogue(npcId);
  }
}

// Approach NPC
{
  name: "Approach NPC",
  cost: 8,
  preconditions: { character_interior: false }, // Same location as NPC
  effects: (npcId) => ({ near_npc_id: npcId }),
  execute: (character, npcId) => {
    const npc = getNPC(npcId);
    return character.navigateTo(npc.position);
  }
}

// Wait
{
  name: "Wait",
  cost: 2,
  preconditions: {},
  effects: {}, // Time passes
  execute: (character, duration) => {
    character.wait(duration);
  }
}
```

#### 4. GOAP Planner

Finds the cheapest sequence of actions to achieve a goal:

```javascript
class GOAPPlanner {
  /**
   * Find a plan to achieve a goal
   * @param {Object} currentState - Current world state
   * @param {GOAPGoal} goal - Goal to achieve
   * @param {GOAPAction[]} availableActions - Actions character can perform
   * @returns {GOAPAction[]} - Sequence of actions (or null if impossible)
   */
  plan(currentState, goal, availableActions) {
    // A* search through state space
    // Each node = a world state
    // Each edge = an action
    // Heuristic = distance to goal state

    // Returns path of actions from current state to goal state
  }
}
```

**Planning Algorithm** (A* in state space):

1. Start with current world state
2. For each available action:
   - Check if preconditions are met
   - Apply effects to create new state
   - Calculate cost (action cost + heuristic to goal)
3. Pick lowest-cost path
4. Repeat until goal state reached or no valid paths

**Example Plan**:

Goal: "Talk to Mara at the tavern"
- Current state: `{ character_location: "home", character_interior: true, near_npc_id: null }`
- Goal state: `{ near_npc_id: "mara", in_conversation: true }`

Generated plan:
1. Exit Building (home)
2. Move to Location (tavern exterior)
3. Enter Building (tavern)
4. Approach NPC (mara)
5. Talk to NPC (mara)

### Integration with LLM

#### Goal Generation

LLM generates high-level goals based on context:

```javascript
async function generateGoalForCharacter(character) {
  const context = {
    name: character.name,
    personality: character.personality,
    location: character.location,
    memories: character.recentMemories,
    relationships: character.relationships,
    time: worldState.time,
    currentGoal: character.currentGoal
  };

  const prompt = `
    You are ${character.name}, a character in a fantasy RPG.

    Personality: ${formatPersonality(context.personality)}
    Current location: ${context.location}
    Time of day: ${context.time}
    Recent events: ${formatMemories(context.memories)}

    What would be a good goal for you right now? Consider your personality,
    the time of day, and what you've been doing recently.

    Respond with a single goal in this format:
    GOAL: <goal description>
    TARGET: <target location or NPC name if applicable>
    PRIORITY: <0-100>
  `;

  const response = await ollamaClient.generate(prompt);
  return parseGoalFromLLM(response);
}
```

**LLM Output Example**:
```
GOAL: Check the tavern for evening gossip
TARGET: tavern
PRIORITY: 60
```

This gets converted to:
```javascript
new GOAPGoal(
  "Check the tavern for evening gossip",
  { character_location: "tavern", character_interior: true },
  60
)
```

#### Dialogue Generation

When "Talk to NPC" action executes:

```javascript
async function generateDialogue(speaker, listener) {
  const context = {
    speaker: speaker.name,
    speakerPersonality: speaker.personality,
    listener: listener.name,
    listenerPersonality: listener.personality,
    relationship: speaker.getRelationshipWith(listener),
    location: speaker.location,
    recentTopics: speaker.dialogueHistory(listener),
    speakerGoal: speaker.currentGoal
  };

  const prompt = `
    ${speaker.name} approaches ${listener.name} at ${context.location}.

    ${speaker.name}'s personality: ${formatPersonality(context.speakerPersonality)}
    ${listener.name}'s personality: ${formatPersonality(context.listenerPersonality)}
    Relationship: ${context.relationship}
    ${speaker.name}'s current goal: ${context.speakerGoal.name}

    Generate a natural conversation between them. ${speaker.name} initiates.
    Format:
    ${speaker.name}: <greeting or question>
    ${listener.name}: <response>
    ${speaker.name}: <follow-up>
    ${listener.name}: <response>
    [END]
  `;

  const response = await ollamaClient.generate(prompt);
  return parseDialogue(response);
}
```

### GOAP Execution Loop

```javascript
class CharacterAI {
  constructor(character) {
    this.character = character;
    this.currentGoal = null;
    this.currentPlan = [];
    this.currentActionIndex = 0;
  }

  async update(deltaTime) {
    // 1. Check if we need a new goal
    if (!this.currentGoal || this.isGoalComplete()) {
      this.currentGoal = await this.generateNewGoal();
      this.currentPlan = this.planForGoal(this.currentGoal);
      this.currentActionIndex = 0;
    }

    // 2. Check if plan is still valid
    if (!this.isPlanValid()) {
      this.currentPlan = this.replan();
      this.currentActionIndex = 0;
    }

    // 3. Execute current action
    const action = this.currentPlan[this.currentActionIndex];
    if (action) {
      const completed = await action.execute(this.character, deltaTime);

      if (completed) {
        this.currentActionIndex++;

        // Update world state
        this.updateWorldState(action.effects);
      }
    }

    // 4. Check if goal achieved
    if (this.currentActionIndex >= this.currentPlan.length) {
      this.onGoalComplete();
      this.currentGoal = null;
    }
  }

  async generateNewGoal() {
    // Ask LLM for a new goal
    return await generateGoalForCharacter(this.character);
  }

  planForGoal(goal) {
    const worldState = this.getWorldState();
    const planner = new GOAPPlanner();
    return planner.plan(worldState, goal, this.availableActions);
  }

  isPlanValid() {
    // Check if current plan still makes sense given world changes
    const worldState = this.getWorldState();
    const remainingActions = this.currentPlan.slice(this.currentActionIndex);

    for (const action of remainingActions) {
      if (!action.isValid(worldState)) {
        return false;
      }
      worldState = action.applyEffects(worldState);
    }

    return true;
  }

  replan() {
    // World changed, replan from current state
    return this.planForGoal(this.currentGoal);
  }
}
```

---

## Game Systems

### 1. Pathfinding System

Uses PathFinding.js with A* algorithm:

```javascript
import { Grid, AStarFinder } from 'pathfinding';

class PathfindingManager {
  constructor(map) {
    this.map = map;
    this.grid = this.createNavigationGrid(map);
    this.finder = new AStarFinder({
      allowDiagonal: true,
      dontCrossCorners: true
    });
  }

  createNavigationGrid(map) {
    // Convert tilemap to 0 (walkable) and 1 (blocked) grid
    const width = map.width;
    const height = map.height;
    const grid = new Grid(width, height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = map.getTileAt(x, y);
        grid.setWalkableAt(x, y, !tile.collides);
      }
    }

    return grid;
  }

  findPath(startX, startY, endX, endY) {
    const gridBackup = this.grid.clone();
    const path = this.finder.findPath(
      Math.floor(startX),
      Math.floor(startY),
      Math.floor(endX),
      Math.floor(endY),
      gridBackup
    );

    return path.map(([x, y]) => ({ x: x * 32, y: y * 32 })); // Convert to pixels
  }
}
```

### 2. Character Movement

```javascript
class Character extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, texture) {
    super(scene, x, y, texture);
    this.path = [];
    this.pathIndex = 0;
    this.speed = 100; // pixels per second
  }

  navigateTo(targetX, targetY) {
    const pathfinding = this.scene.pathfindingManager;
    this.path = pathfinding.findPath(this.x, this.y, targetX, targetY);
    this.pathIndex = 0;
    return this.path.length > 0;
  }

  update(deltaTime) {
    if (this.path.length === 0 || this.pathIndex >= this.path.length) {
      return { completed: true };
    }

    const target = this.path[this.pathIndex];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 5) {
      // Reached waypoint
      this.pathIndex++;
      return { completed: this.pathIndex >= this.path.length };
    }

    // Move towards waypoint
    const moveDistance = this.speed * deltaTime;
    const ratio = Math.min(moveDistance / distance, 1);

    this.x += dx * ratio;
    this.y += dy * ratio;

    // Update animation direction
    this.updateAnimation(dx, dy);

    return { completed: false };
  }

  updateAnimation(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) {
      this.play(dx > 0 ? 'walk-right' : 'walk-left', true);
    } else {
      this.play(dy > 0 ? 'walk-down' : 'walk-up', true);
    }
  }
}
```

### 3. Personality System

Same 6-trait system from original concept:

```javascript
class Personality {
  constructor() {
    this.aggression = Math.random() * 100;   // 0-100
    this.friendliness = Math.random() * 100;
    this.intelligence = Math.random() * 100;
    this.caution = Math.random() * 100;
    this.greed = Math.random() * 100;
    this.honor = Math.random() * 100;
  }

  toPromptString() {
    return `
      Aggression: ${this.getLevel(this.aggression)} (${this.aggression.toFixed(0)}/100)
      Friendliness: ${this.getLevel(this.friendliness)} (${this.friendliness.toFixed(0)}/100)
      Intelligence: ${this.getLevel(this.intelligence)} (${this.intelligence.toFixed(0)}/100)
      Caution: ${this.getLevel(this.caution)} (${this.caution.toFixed(0)}/100)
      Greed: ${this.getLevel(this.greed)} (${this.greed.toFixed(0)}/100)
      Honor: ${this.getLevel(this.honor)} (${this.honor.toFixed(0)}/100)
    `.trim();
  }

  getLevel(value) {
    if (value < 33) return 'Low';
    if (value < 66) return 'Medium';
    return 'High';
  }
}
```

### 4. Memory System

```javascript
class MemorySystem {
  constructor(character) {
    this.character = character;
    this.memories = [];
    this.maxMemories = 100;
    this.decayDays = 30;
  }

  addMemory(type, content, importance = 50) {
    const memory = {
      id: uuid(),
      type,              // 'dialogue', 'event', 'observation'
      content,
      importance,        // 0-100
      timestamp: Date.now(),
      dayCreated: worldState.currentDay
    };

    this.memories.unshift(memory);

    if (this.memories.length > this.maxMemories) {
      this.memories.pop();
    }

    return memory;
  }

  getRecentMemories(count = 5) {
    return this.memories
      .slice(0, count)
      .map(m => m.content);
  }

  getMemoriesAbout(subject) {
    return this.memories.filter(m =>
      m.content.toLowerCase().includes(subject.toLowerCase())
    );
  }

  getRelevance(memory) {
    // Decay based on time
    const daysPassed = worldState.currentDay - memory.dayCreated;
    const timeFactor = Math.max(0, 1 - (daysPassed / this.decayDays));

    // Combine with importance
    return (memory.importance / 100) * timeFactor;
  }

  getMostRelevantMemories(count = 10) {
    return this.memories
      .sort((a, b) => this.getRelevance(b) - this.getRelevance(a))
      .slice(0, count);
  }
}
```

### 5. Relationship System

```javascript
class RelationshipTracker {
  constructor(character) {
    this.character = character;
    this.relationships = new Map(); // npcId -> relationship value
  }

  getRelationship(npcId) {
    return this.relationships.get(npcId) || 0; // -100 to +100
  }

  modifyRelationship(npcId, delta) {
    const current = this.getRelationship(npcId);
    const newValue = Math.max(-100, Math.min(100, current + delta));
    this.relationships.set(npcId, newValue);

    // Log memory of interaction
    this.character.memory.addMemory(
      'relationship_change',
      `Relationship with ${npcId} changed by ${delta} (now ${newValue})`,
      Math.abs(delta)
    );

    return newValue;
  }

  getRelationshipLevel(npcId) {
    const value = this.getRelationship(npcId);
    if (value > 75) return 'Best Friend';
    if (value > 50) return 'Friend';
    if (value > 25) return 'Friendly';
    if (value > -25) return 'Neutral';
    if (value > -50) return 'Unfriendly';
    if (value > -75) return 'Enemy';
    return 'Nemesis';
  }
}
```

### 6. Schedule System (for NPCs)

```javascript
class ScheduleSystem {
  constructor(npc) {
    this.npc = npc;
    this.schedule = this.generateDefaultSchedule();
  }

  generateDefaultSchedule() {
    // Generate based on NPC role and personality
    return [
      { startHour: 6, endHour: 8, activity: 'wake_up', location: 'home' },
      { startHour: 8, endHour: 12, activity: 'work', location: 'workplace' },
      { startHour: 12, endHour: 13, activity: 'lunch', location: 'tavern' },
      { startHour: 13, endHour: 17, activity: 'work', location: 'workplace' },
      { startHour: 17, endHour: 20, activity: 'socialize', location: 'tavern' },
      { startHour: 20, endHour: 22, activity: 'relax', location: 'home' },
      { startHour: 22, endHour: 6, activity: 'sleep', location: 'home' }
    ];
  }

  getCurrentActivity() {
    const hour = worldState.hour;
    return this.schedule.find(s =>
      hour >= s.startHour && hour < s.endHour
    );
  }

  getScheduledLocation() {
    const activity = this.getCurrentActivity();
    return activity ? activity.location : 'home';
  }

  // Convert schedule into GOAP goals
  getScheduleGoal() {
    const activity = this.getCurrentActivity();
    if (!activity) return null;

    return new GOAPGoal(
      `Follow schedule: ${activity.activity}`,
      {
        character_location: activity.location,
        character_interior: activity.location !== 'outdoors'
      },
      30 // Lower priority than LLM-generated goals
    );
  }
}
```

---

## LLM Integration

### Ollama Client

```javascript
import axios from 'axios';

class OllamaClient {
  constructor(config) {
    this.baseURL = config.host || 'http://localhost:11434';
    this.model = config.model || 'mistral';
    this.temperature = config.temperature || 0.7;
    this.timeout = config.timeout || 30000;
  }

  async generate(prompt, options = {}) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/generate`,
        {
          model: this.model,
          prompt: prompt,
          temperature: options.temperature || this.temperature,
          stream: false
        },
        {
          timeout: this.timeout
        }
      );

      return response.data.response;
    } catch (error) {
      console.error('Ollama generation failed:', error);
      return this.getFallbackResponse(prompt);
    }
  }

  getFallbackResponse(prompt) {
    // Generic fallback if Ollama is unavailable
    if (prompt.includes('GOAL:')) {
      return 'GOAL: Explore the area\nTARGET: tavern\nPRIORITY: 50';
    }
    return 'I am currently busy with my thoughts.';
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
}
```

### Prompt Templates

```javascript
class PromptTemplates {
  static goalGeneration(character, context) {
    return `
You are ${character.name}, a character in a medieval fantasy village.

PERSONALITY:
${character.personality.toPromptString()}

CURRENT SITUATION:
- Location: ${context.location} (${context.interior ? 'inside' : 'outside'})
- Time: ${context.timeOfDay} (${context.hour}:00)
- Weather: ${context.weather}

RECENT MEMORIES:
${context.recentMemories.map((m, i) => `${i + 1}. ${m}`).join('\n')}

RELATIONSHIPS:
${context.relationships.map(r => `- ${r.name}: ${r.level} (${r.value})`).join('\n')}

Based on your personality, current situation, and memories, what would be a good goal for you right now?
Consider:
- Your personality traits (especially ${this.getDominantTraits(character.personality)})
- The time of day and what you might typically do
- Your relationships and recent interactions
- Any ongoing situations from your memories

Respond with ONLY:
GOAL: <one sentence describing what you want to do>
TARGET: <specific location or person, or "none">
PRIORITY: <number 0-100, higher = more urgent>

Example:
GOAL: Visit the tavern to hear the latest gossip
TARGET: tavern
PRIORITY: 60
`.trim();
  }

  static dialogueGeneration(speaker, listener, context) {
    return `
You are ${speaker.name}. You are approaching ${listener.name} to talk.

YOUR PERSONALITY:
${speaker.personality.toPromptString()}

${listener.name.toUpperCase()}'S PERSONALITY:
${listener.personality.toPromptString()}

RELATIONSHIP:
Your relationship with ${listener.name}: ${context.relationshipLevel} (${context.relationshipValue}/100)

CONTEXT:
- Location: ${context.location}
- Time: ${context.timeOfDay}
- Your current goal: ${context.speakerGoal}

YOUR RECENT MEMORIES:
${context.speakerMemories.join('\n')}

PAST CONVERSATIONS WITH ${listener.name.toUpperCase()}:
${context.dialogueHistory.length > 0 ? context.dialogueHistory.join('\n') : 'This is your first conversation.'}

Generate a natural conversation. You (${speaker.name}) start the conversation.
The conversation should:
- Reflect both personalities
- Consider your relationship (${context.relationshipLevel})
- Be relevant to your goal: ${context.speakerGoal}
- Reference shared memories if appropriate
- Be 4-8 exchanges total
- End naturally

Format (exactly like this):
${speaker.name}: <what you say>
${listener.name}: <their response>
${speaker.name}: <your response>
${listener.name}: <their response>
... (continue for 4-8 exchanges total)
[END]
`.trim();
  }

  static getDominantTraits(personality) {
    const traits = [
      { name: 'aggressive', value: personality.aggression },
      { name: 'friendly', value: personality.friendliness },
      { name: 'intelligent', value: personality.intelligence },
      { name: 'cautious', value: personality.caution },
      { name: 'greedy', value: personality.greed },
      { name: 'honorable', value: personality.honor }
    ];

    return traits
      .sort((a, b) => b.value - a.value)
      .slice(0, 2)
      .map(t => t.name)
      .join(' and ');
  }
}
```

---

## UI/UX Design

### Main UI Layout

```
┌─────────────────────────────────────────────────────────┐
│ [Menu] [Speed: 1x] [Pause] [Time: 14:32 Day 3]         │ Top Bar
├─────────────────────────────────────────────────────────┤
│                                                         │
│                                                         │
│                  GAME WORLD                            │ Game View
│                  (Phaser Canvas)                        │ (Phaser)
│                                                         │
│                                                         │
├──────────────────┬──────────────────────────────────────┤
│ Character Info   │  Current Activity / Thoughts        │ Bottom Panels
│ ──────────────   │  ─────────────────────────────      │
│ [Avatar]         │  Protagonist (John):                 │
│                  │  🎯 Goal: Talk to Mara               │
│ Name: John       │  📍 Action: Moving to tavern         │
│ Location: Road   │  💭 "I wonder if Mara has heard     │
│ Goal: Talk       │      about the missing supplies"     │
│                  │                                      │
│ Relationships:   │  ───────────────────────────────     │
│ • Mara: Friend   │  Recent Events:                      │
│ • Grok: Neutral  │  • John exited home                  │
│                  │  • John walking to tavern            │
└──────────────────┴──────────────────────────────────────┘
```

### UI Components (React)

#### 1. Control Panel

```jsx
function ControlPanel({ gameState, onPause, onSpeedChange }) {
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);

  const togglePause = () => {
    setIsPaused(!isPaused);
    onPause(!isPaused);
  };

  const changeSpeed = (newSpeed) => {
    setSpeed(newSpeed);
    onSpeedChange(newSpeed);
  };

  return (
    <div className="control-panel">
      <button onClick={togglePause}>
        {isPaused ? '▶ Play' : '⏸ Pause'}
      </button>

      <div className="speed-control">
        {[0.5, 1, 2, 5].map(s => (
          <button
            key={s}
            className={speed === s ? 'active' : ''}
            onClick={() => changeSpeed(s)}
          >
            {s}x
          </button>
        ))}
      </div>

      <div className="time-display">
        🕐 {gameState.hour}:{gameState.minute.toString().padStart(2, '0')}
        Day {gameState.day}
      </div>
    </div>
  );
}
```

#### 2. Character Panel

```jsx
function CharacterPanel({ character, following }) {
  return (
    <div className={`character-panel ${following ? 'following' : ''}`}>
      <div className="avatar">
        <img src={character.avatarUrl} alt={character.name} />
      </div>

      <div className="info">
        <h3>{character.name}</h3>
        <p className="location">📍 {character.location}</p>

        <div className="current-goal">
          <strong>Goal:</strong> {character.currentGoal?.name || 'None'}
        </div>

        <div className="current-action">
          <strong>Action:</strong> {character.currentAction || 'Idle'}
        </div>
      </div>

      <button onClick={() => followCharacter(character)}>
        👁 Follow
      </button>
    </div>
  );
}
```

#### 3. Thought Bubble

```jsx
function ThoughtBubble({ character, thought, duration = 5000 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [thought, duration]);

  if (!visible || !thought) return null;

  return (
    <div
      className="thought-bubble"
      style={{
        position: 'absolute',
        left: character.screenX,
        top: character.screenY - 60
      }}
    >
      <div className="bubble-content">
        💭 {thought}
      </div>
    </div>
  );
}
```

#### 4. Dialogue Log

```jsx
function DialogueLog({ dialogues, maxVisible = 10 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom when new dialogue appears
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [dialogues]);

  return (
    <div className="dialogue-log" ref={containerRef}>
      <h4>Recent Conversations</h4>
      {dialogues.slice(-maxVisible).map((dialogue, idx) => (
        <div key={idx} className="dialogue-entry">
          <span className="speaker">{dialogue.speaker}:</span>
          <span className="text">{dialogue.text}</span>
        </div>
      ))}
    </div>
  );
}
```

#### 5. Memory Inspector

```jsx
function MemoryInspector({ character }) {
  const [selectedMemory, setSelectedMemory] = useState(null);

  return (
    <div className="memory-inspector">
      <h3>{character.name}'s Memories</h3>

      <div className="memory-list">
        {character.memory.getMostRelevantMemories(20).map(memory => (
          <div
            key={memory.id}
            className="memory-item"
            onClick={() => setSelectedMemory(memory)}
          >
            <span className="type">{memory.type}</span>
            <span className="content">{memory.content}</span>
            <span className="relevance">
              {(memory.relevance * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>

      {selectedMemory && (
        <div className="memory-detail">
          <h4>Memory Detail</h4>
          <p><strong>Type:</strong> {selectedMemory.type}</p>
          <p><strong>Created:</strong> Day {selectedMemory.dayCreated}</p>
          <p><strong>Importance:</strong> {selectedMemory.importance}/100</p>
          <p><strong>Content:</strong> {selectedMemory.content}</p>
        </div>
      )}
    </div>
  );
}
```

### Camera System

```javascript
class CameraController {
  constructor(scene) {
    this.scene = scene;
    this.camera = scene.cameras.main;
    this.following = null;
    this.smoothing = 0.1;
  }

  follow(character) {
    this.following = character;
    this.camera.startFollow(character, true, this.smoothing, this.smoothing);
  }

  panTo(x, y, duration = 1000) {
    this.camera.pan(x, y, duration, 'Sine.easeInOut');
  }

  setZoom(zoom, duration = 500) {
    this.camera.zoomTo(zoom, duration);
  }

  update() {
    // Camera updates automatically with follow
  }
}
```

---

## Technical Implementation

### Electron Setup

#### main.js (Main Process)

```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // In development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers
ipcMain.handle('save-game', async (event, saveData) => {
  // Save game logic
  const fs = require('fs').promises;
  await fs.writeFile(
    path.join(app.getPath('userData'), 'save.json'),
    JSON.stringify(saveData)
  );
  return { success: true };
});

ipcMain.handle('load-game', async () => {
  const fs = require('fs').promises;
  try {
    const data = await fs.readFile(
      path.join(app.getPath('userData'), 'save.json'),
      'utf-8'
    );
    return JSON.parse(data);
  } catch {
    return null;
  }
});
```

#### preload.js (IPC Bridge)

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  saveGame: (data) => ipcRenderer.invoke('save-game', data),
  loadGame: () => ipcRenderer.invoke('load-game'),

  // Add more IPC methods as needed
  onAppReady: (callback) => ipcRenderer.on('app-ready', callback),
});
```

### Phaser Integration

#### Game Configuration

```javascript
// src/game/config.js
import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import WorldScene from './scenes/WorldScene';
import UIScene from './scenes/UIScene';

export const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1280,
  height: 720,
  backgroundColor: '#2d2d2d',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [BootScene, WorldScene, UIScene]
};
```

#### World Scene

```javascript
// src/game/scenes/WorldScene.js
import Phaser from 'phaser';
import Protagonist from '../entities/Protagonist';
import NPC from '../entities/NPC';
import PathfindingManager from '../../ai/pathfinding/PathfindingManager';

export default class WorldScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldScene' });
  }

  create() {
    // Create tilemap
    this.map = this.make.tilemap({ key: 'village-map' });
    const tileset = this.map.addTilesetImage('tileset', 'tiles');

    this.groundLayer = this.map.createLayer('Ground', tileset);
    this.buildingsLayer = this.map.createLayer('Buildings', tileset);

    // Set collision
    this.buildingsLayer.setCollisionByProperty({ collides: true });

    // Initialize pathfinding
    this.pathfindingManager = new PathfindingManager(this.map);

    // Create protagonist
    this.protagonist = new Protagonist(this, 400, 300);
    this.add.existing(this.protagonist);

    // Create NPCs
    this.npcs = [];
    this.spawnNPC('Mara', 600, 400, 'tavern_keeper');
    this.spawnNPC('Grok', 800, 500, 'blacksmith');

    // Camera
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.startFollow(this.protagonist);

    // Physics
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
  }

  spawnNPC(name, x, y, role) {
    const npc = new NPC(this, x, y, name, role);
    this.add.existing(npc);
    this.npcs.push(npc);
    return npc;
  }

  update(time, delta) {
    // Update protagonist AI
    this.protagonist.update(delta / 1000);

    // Update all NPCs
    this.npcs.forEach(npc => npc.update(delta / 1000));
  }
}
```

### React + Phaser Integration

```jsx
// src/App.jsx
import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { gameConfig } from './game/config';
import ControlPanel from './ui/components/ControlPanel';
import CharacterPanel from './ui/components/CharacterPanel';
import DialogueLog from './ui/components/DialogueLog';
import useGameStore from './store/gameStore';

function App() {
  const gameRef = useRef(null);
  const containerRef = useRef(null);
  const gameState = useGameStore(state => state.gameState);

  useEffect(() => {
    if (!gameRef.current && containerRef.current) {
      gameRef.current = new Phaser.Game({
        ...gameConfig,
        parent: containerRef.current
      });
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div className="app">
      <ControlPanel gameState={gameState} />

      <div className="game-area">
        <div ref={containerRef} id="game-container" />
      </div>

      <div className="bottom-panel">
        <CharacterPanel character={gameState.protagonist} following={true} />
        <DialogueLog dialogues={gameState.recentDialogues} />
      </div>
    </div>
  );
}

export default App;
```

### State Management (Zustand)

```javascript
// src/store/gameStore.js
import { create } from 'zustand';

const useGameStore = create((set) => ({
  gameState: {
    isPaused: false,
    speed: 1,
    day: 1,
    hour: 8,
    minute: 0,
    weather: 'clear',
    protagonist: null,
    npcs: [],
    recentDialogues: [],
    currentEvents: []
  },

  setGameState: (updates) => set((state) => ({
    gameState: { ...state.gameState, ...updates }
  })),

  addDialogue: (speaker, text) => set((state) => ({
    gameState: {
      ...state.gameState,
      recentDialogues: [
        ...state.gameState.recentDialogues,
        { speaker, text, timestamp: Date.now() }
      ].slice(-50) // Keep last 50
    }
  })),

  setPause: (paused) => set((state) => ({
    gameState: { ...state.gameState, isPaused: paused }
  })),

  setSpeed: (speed) => set((state) => ({
    gameState: { ...state.gameState, speed }
  }))
}));

export default useGameStore;
```

---

## Development Roadmap

### Phase 1: Core Foundation (Weeks 1-2)

**Goals**: Basic Electron app with Phaser rendering

- ✅ Set up Electron + Vite project
- ✅ Configure Phaser 3 integration
- ✅ Create basic tilemap and rendering
- ✅ Implement basic character movement
- ✅ Set up React UI overlay
- ✅ Connect to Ollama (test connection)

### Phase 2: Pathfinding & Movement (Week 3)

**Goals**: Characters can navigate the world

- ✅ Integrate PathFinding.js
- ✅ Create navigation grid from tilemap
- ✅ Implement character pathfinding
- ✅ Add movement animations
- ✅ Handle building entry/exit
- ✅ Camera following

### Phase 3: GOAP System (Weeks 4-5)

**Goals**: Basic AI planning

- ✅ Implement GOAP planner (A* in state space)
- ✅ Create core actions (Move, Talk, Enter, Exit, Wait)
- ✅ Define world state system
- ✅ Create goal system
- ✅ Test simple plans (move to location, talk to NPC)

### Phase 4: LLM Integration (Week 6)

**Goals**: AI-generated goals and dialogue

- ✅ Build Ollama client
- ✅ Create prompt templates
- ✅ Goal generation from LLM
- ✅ Dialogue generation from LLM
- ✅ Parse LLM outputs
- ✅ Fallback system for offline mode

### Phase 5: NPC Systems (Week 7)

**Goals**: Rich NPC behavior

- ✅ Personality system
- ✅ Memory system
- ✅ Relationship tracking
- ✅ Daily schedules
- ✅ NPC AI loop (GOAP + LLM)

### Phase 6: Protagonist AI (Week 8)

**Goals**: Autonomous protagonist

- ✅ Protagonist AI controller
- ✅ LLM-driven goal generation for protagonist
- ✅ Protagonist-NPC interactions
- ✅ Protagonist exploration behavior

### Phase 7: UI Polish (Week 9)

**Goals**: Informative, beautiful UI

- ✅ Character panels
- ✅ Thought bubbles
- ✅ Dialogue log
- ✅ Memory inspector
- ✅ Control panel (pause/speed)
- ✅ Event feed

### Phase 8: Persistence (Week 10)

**Goals**: Save/load system

- ✅ Save game state to JSON/SQLite
- ✅ Load game state
- ✅ Serialize characters, memories, relationships
- ✅ Restore GOAP plans

### Phase 9: Content & Polish (Weeks 11-12)

**Goals**: Rich world content

- ✅ Create detailed village map
- ✅ Add 10+ NPCs with unique personalities
- ✅ Add buildings (tavern, blacksmith, homes)
- ✅ Quest system integration
- ✅ World events
- ✅ Visual polish

### Phase 10: Testing & Release (Week 13)

**Goals**: Production-ready

- ✅ Performance optimization
- ✅ Bug fixes
- ✅ Package with Electron Builder
- ✅ Create installers (.exe, .dmg, .AppImage)
- ✅ Documentation
- ✅ Release v1.0

---

## Configuration

### settings.json

```json
{
  "game": {
    "title": "Ollama RPG: Autonomous Adventure",
    "version": "1.0.0",
    "width": 1280,
    "height": 720,
    "fps": 60,
    "debug": false
  },
  "ollama": {
    "enabled": true,
    "host": "http://localhost:11434",
    "model": "mistral",
    "timeout": 30000,
    "temperature": 0.7,
    "goalGenerationInterval": 30000,
    "dialogueEnabled": true
  },
  "ai": {
    "goapPlanningMaxDepth": 10,
    "goapReplanInterval": 5000,
    "pathfindingDiagonal": true,
    "pathfindingSmoothing": true
  },
  "world": {
    "timeScale": 1.0,
    "dayLength": 1440,
    "startingHour": 8,
    "weatherEnabled": true,
    "weatherChangeInterval": 120
  },
  "characters": {
    "maxNPCs": 20,
    "memoryRetentionDays": 30,
    "relationshipDecayRate": 0.01,
    "thoughtBubbleDuration": 5000
  },
  "ui": {
    "showThoughtBubbles": true,
    "showDebugInfo": false,
    "maxDialogueLogEntries": 100,
    "cameraSmoothing": 0.1
  }
}
```

---

## Summary

### Key Differences from Original Concept

| Aspect | Original (Python) | New (Web) |
|--------|------------------|-----------|
| **Platform** | Desktop (Pygame) | Desktop (Electron) |
| **Rendering** | Pygame | Phaser 3 |
| **UI** | Pygame UI | React |
| **Control** | Player-controlled | AI-controlled protagonist |
| **AI System** | Simple scheduling | GOAP planner |
| **Actions** | Manual (WASD) | Automatic (high-level goals) |
| **Pathfinding** | Basic A* | PathFinding.js A* |
| **Server** | N/A | No server needed (Electron) |

### Core Features

✅ **Fully Autonomous**: AI controls protagonist and NPCs
✅ **GOAP Planning**: High-level goals → action sequences
✅ **LLM Integration**: Goals and dialogue from Ollama
✅ **Simple Actions**: "Go talk to X" instead of manual movement
✅ **Pathfinding**: Automatic navigation
✅ **No Webserver**: Runs entirely in Electron
✅ **Observable Gameplay**: Watch the story unfold
✅ **Rich UI**: See thoughts, goals, memories, relationships
✅ **Persistent World**: Save/load complete state

This design creates a unique "AI aquarium" where you observe emergent stories rather than playing directly.
