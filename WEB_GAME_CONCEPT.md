# OllamaRPG - Design Philosophy & Future Vision

**Last Updated**: November 19, 2025
**Status**: ⚠️ **TEXT-DRIVEN DESIGN** - Core Philosophy Document
**Current State**: CLI dialogue game with emergent narrative
**Note**: This document describes the design philosophy and optional future enhancements. See `GAME_CONCEPT_AND_DESIGN.md` for current implementation.

---

## Core Design Philosophy

**OllamaRPG is a TEXT-DRIVEN RPG where game systems exist in the background and emerge through natural narrative.**

### Design Principles

1. **Text-First, Always**: All game information comes through dialogue and narration
2. **Backend Systems**: Inventory, combat, stats exist but aren't displayed as UI elements
3. **Emergent Gameplay**: NPCs refer to items, combat happens narratively, stats influence dialogue
4. **LLM-Driven**: The AI weaves game mechanics into natural conversation
5. **No Explicit Panels**: No inventory screens, stat displays, or combat UI

### What IS working now:
- ✅ CLI dialogue game with 10 NPCs
- ✅ LLM-powered conversations
- ✅ Memory and relationships
- ✅ Game Master narration
- ✅ Replay logging
- ✅ Backend systems (inventory, combat frameworks exist)

### What is NOT planned (rejected approaches):
- ❌ Graphical inventory panels
- ❌ Explicit stat displays
- ❌ Combat UI with health bars
- ❌ Phaser rendering / sprites
- ❌ React UI panels
- ❌ Observer-mode with graphics

See `old/WEB_GAME_CONCEPT.md` for the complete original vision.

---

## Text-Driven Design Examples

### How Game Systems Emerge Through Narrative

**Inventory** - NPCs mention items naturally:
```
Mara: "I see you're carrying that old sword Grok made.
       It's seen better days, hasn't it?"

Grok: "Bring me three iron ingots and I'll forge you
       something proper. None of that rusty nonsense."
```

**Combat** - Battles described narratively:
```
Game Master: The bandit lunges with his dagger. Your
             reflexes kick in - you parry and counter.
             The fight is over in seconds.

Aldric: "I heard about your scuffle near the forest.
         Word travels fast. You handled yourself well."
```

**Stats** - Abilities influence dialogue options:
```
[Your high Intelligence allows you to notice...]
You: "That symbol on the wall - it's Old Elvish, isn't it?"
Thom: *raises eyebrow* "Few people would recognize that.
       You're more educated than you let on."
```

**Quests** - Emerge from conversation context:
```
Mara: "Someone's been stealing from my supplies..."
[This information now sits in your memory]

Later, with Finn:
You: "Do you know anything about thefts at the tavern?"
Finn: *looks nervous* "I... might have seen something."
```

### Technology Stack (Current)

```
Platform:     Node.js CLI
Rendering:    Pure text (terminal)
UI:           ANSI colors + formatting
Styling:      None needed
AI:           Ollama LLM (llama3.1:8b)
State:        In-memory game systems
```

---

## Implementation Roadmap (Text-Driven Focus)

### Phase 5: Deep Dialogue & Quest System (1-2 weeks) ⭐ PRIORITY

**What's Needed:**

1. **Quest System Integration**
   ```javascript
   - Quests emerge from dialogue naturally
   - NPCs track quest state in memory
   - Quest completion affects relationships
   - Rewards given through narrative
   ```

2. **Enhanced Dialogue Context**
   ```javascript
   - NPCs reference backend inventory state
   - Combat outcomes influence conversations
   - Stats affect available dialogue options
   - Time/weather affects NPC mood
   ```

3. **Group Conversations**
   ```javascript
   - 3+ character conversations
   - NPCs talk to each other
   - Player witnesses interactions
   - Overhear secrets and gossip
   ```

4. **Emergent Narrative Systems**
   ```javascript
   - NPCs gossip about player actions
   - Reputation system affects dialogue
   - Events propagate through NPC network
   - Story arcs track player choices
   ```

### Phase 6: Location & World Building (1 week)

**What's Needed:**

1. **Conceptual Location System** (not spatial pathfinding)
   ```javascript
   - Named locations (tavern, forge, market, etc)
   - Travel time between locations
   - Different NPCs at different places
   - Time-based NPC schedules
   ```

2. **Location-Aware Dialogue**
   ```javascript
   - NPCs comment on current location
   - Secrets discovered in specific places
   - Environmental descriptions
   - Points of interest to examine
   ```

3. **Dynamic NPC Presence**
   ```javascript
   - NPCs move based on schedule
   - Track down specific NPCs
   - Chance encounters
   - Location-specific events
   ```

### Phase 7: Backend Systems Integration (1-2 weeks)

**What's Needed:**

1. **Inventory Backend**
   ```javascript
   - Items tracked internally
   - NPCs reference what player carries
   - Weight/capacity affects mobility
   - Items influence dialogue options
   ```

2. **Narrative Combat**
   ```javascript
   - Combat resolved through LLM narration
   - Stats determine outcome probability
   - NPCs react to combat reputation
   - Injuries mentioned in dialogue
   ```

3. **Character Progression**
   ```javascript
   - Skills improve through use
   - NPCs notice character growth
   - Abilities unlock dialogue paths
   - Reputation affects quest availability
   ```

---

## Current vs Future

### What Works Now ✅

```
✅ Core Dialogue System
   - Natural conversations (20+ turns)
   - Personality-driven responses
   - Memory & relationships
   - Emotional states

✅ Game Master Narration
   - Scene descriptions
   - Event generation
   - Story orchestration
   - Adaptive pacing

✅ Backend Systems (Framework)
   - Inventory data structures
   - Combat framework
   - Quest tracking
   - Replay logging

✅ Text-First Interface
   - CLI with ANSI colors
   - Pure narrative gameplay
   - No graphics needed
```

### What's Being Built Next 🔄

```
🔄 Deep Dialogue Enhancement
   - Quests from conversation
   - Group conversations
   - NPC gossip networks
   - Context-aware responses

🔄 Location System
   - Conceptual locations (not spatial)
   - NPC schedules
   - Travel time
   - Location-based events

🔄 Backend Integration
   - Inventory in dialogue
   - Narrative combat
   - Stat-influenced options
   - Character progression
```

### What's NOT Planned ❌

```
❌ Graphical Elements
   - NO Phaser/sprites
   - NO visual inventory panels
   - NO combat UI
   - NO stat displays

❌ Spatial Systems
   - NO pathfinding/grid movement
   - NO tile-based maps
   - NO camera controls
   - Locations are conceptual only

❌ Observer Mode
   - Game remains player-driven
   - Text-based interaction only
```

---

## Why CLI First?

### Design Philosophy

**"Dialogue First, Movement Later"**

1. **Prove Core Concept**
   - Test LLM conversation quality ✅
   - Validate emergent storytelling ✅
   - Build unique gameplay ✅

2. **No Graphics Needed**
   - Faster iteration
   - Focus on AI quality
   - Text works perfectly

3. **Solid Foundation**
   - Core systems complete
   - Ready for expansion
   - Clean architecture

### What Was Gained

✅ **Working dialogue system** (100%)
✅ **10 unique NPCs** with personalities
✅ **Game Master AI** for narration
✅ **Replay system** for debugging
✅ **Playable game** right now

### What's Next

When ready to add:
- 🔄 Movement system
- 🔄 GOAP planner
- 🔄 Web UI
- 🔄 Visual assets

---

## Technology Stack Details

### Current (CLI)

```json
{
  "runtime": "Node.js 18+",
  "language": "JavaScript ES modules",
  "llm": "Ollama (llama3.1:8b)",
  "interface": "Terminal/CLI",
  "testing": "Vitest",

  "dependencies": {
    "ollama": "^0.5.0",
    "readline": "^1.3.0",
    "pako": "^2.1.0"
  }
}
```

### Planned (Web)

```json
{
  "runtime": "Electron + Node.js",
  "rendering": "Phaser 3",
  "ui": "React + Zustand",
  "styling": "TailwindCSS",

  "additionalDeps": {
    "electron": "^28.0.0",
    "phaser": "^3.70.0",
    "react": "^18.2.0",
    "pathfinding": "^0.4.18"
  }
}
```

---

## Project Structure (Planned)

### Additional Directories Needed

```
ollama-rpg/
├── src/
│   ├── rendering/        # ❌ Not yet created
│   │   ├── PhaserGame.js
│   │   ├── scenes/
│   │   │   ├── BootScene.js
│   │   │   ├── WorldScene.js
│   │   │   └── UIScene.js
│   │   └── camera/
│   │
│   ├── ai/goap/          # ❌ Empty directory
│   │   ├── GOAPPlanner.js
│   │   ├── GOAPAction.js
│   │   ├── GOAPGoal.js
│   │   └── actions/
│   │
│   ├── components/       # ✅ Partially exists
│   │   ├── MovementComponent.js  # Stub only
│   │   └── (others exist)
│   │
│   └── ui/               # ❌ Not started
│       ├── App.jsx
│       ├── components/
│       └── hooks/
```

---

## GOAP System (Future)

### Concept

**Goal-Oriented Action Planning** for autonomous AI:

```
High-Level Goal (from LLM):
"Visit the tavern to hear gossip"

       ↓ GOAP Planner

Action Sequence:
1. ExitBuilding (home)
2. MoveTo (tavern)
3. EnterBuilding (tavern)
4. ApproachNPC (tavern keeper)
5. TalkTo (tavern keeper)

       ↓ Execute

Character navigates autonomously
```

### Why Not Implemented Yet?

**Current approach works for dialogue:**
- LLM directly generates NPC responses
- No spatial navigation needed
- More flexible for conversations

**When GOAP is needed:**
- Autonomous protagonist movement
- Complex multi-step plans
- World exploration
- Simultaneous AI characters

### Implementation Plan

**Week 1: GOAP Planner**
```javascript
class GOAPPlanner {
  plan(currentState, goal, actions) {
    // A* search in state space
    // Returns sequence of actions
  }
}
```

**Week 2: Action Library**
```javascript
class MoveToAction extends GOAPAction {
  preconditions = { character_can_move: true }
  effects = { character_at_location: targetLocation }

  async execute(character, target) {
    // Use pathfinding to move
  }
}
```

---

## Observer Mode (Future)

### Gameplay Loop

```
1. AI protagonist wakes up
     ↓
2. LLM generates goal: "Check tavern for news"
     ↓
3. GOAP creates plan: Exit → Move → Enter → Talk
     ↓
4. Character executes automatically
     ↓
5. Player watches, can:
   - Follow with camera
   - Speed up/slow down
   - View thoughts
   - Inspect memories
     ↓
6. Dialogue happens (existing system)
     ↓
7. New goal generated
     ↓
8. Loop continues
```

### UI Panels (Planned)

```
┌─────────────────────────────────────────┐
│ [Menu] [Speed: 1x] [Pause] [Time]      │  Top Bar
├─────────────────────────────────────────┤
│                                         │
│        GAME WORLD (Phaser)              │  Main View
│                                         │
├──────────────┬──────────────────────────┤
│ Character    │ Current Activity         │  Bottom Panels
│ Info         │ & Thoughts               │
└──────────────┴──────────────────────────┘
```

---

## Integration Challenges

### Challenge 1: State Synchronization

**Problem**: Game state (JavaScript) → UI (React)

**Solution** (planned):
```javascript
// Zustand store
const useGameStore = create((set) => ({
  gameState: {},
  updateGameState: (updates) => set({ gameState: updates })
}));

// Game loop updates store
gameLoop() {
  // ... game logic
  useGameStore.getState().updateGameState(newState);
}

// React reads from store
function CharacterPanel() {
  const character = useGameStore(state => state.gameState.protagonist);
  return <div>{character.name}</div>;
}
```

### Challenge 2: Phaser + React

**Problem**: Phaser canvas + React UI overlay

**Solution** (planned):
```javascript
// Separate containers
<div className="app">
  <div id="phaser-container" />  {/* Phaser renders here */}
  <div className="ui-overlay">   {/* React renders here */}
    <HUD />
    <CharacterPanels />
  </div>
</div>
```

### Challenge 3: Performance

**Problem**: 60 FPS game loop + React rendering

**Solution** (planned):
- Throttle React updates (200ms)
- Use React.memo for expensive components
- Update only changed data
- Keep Phaser separate from React

---

## Why This Approach?

### Advantages of Web/Electron

1. **Cross-platform**: Windows, Mac, Linux
2. **Rich UI**: React ecosystem
3. **Hot reload**: Fast development
4. **Debugging**: Chrome DevTools
5. **Packaging**: Electron Builder

### Why Not Native?

**Considered alternatives:**
- Pure web (needs server for Ollama)
- Python + Pygame (original plan)
- Unity (overkill for 2D)

**Electron wins:**
- ✅ No server needed (Ollama local)
- ✅ Modern web tech
- ✅ Easy distribution
- ✅ Great tooling

---

## Migration Path

### From Current CLI to Web

**Phase 1: Core Systems ✅ COMPLETE**
- LLM integration ✅
- Dialogue system ✅
- Character AI ✅
- Game Master ✅
- Replay logging ✅

**Phase 2: Movement (Not Started)**
- Pathfinding integration
- World map
- Character navigation

**Phase 3: GOAP (Not Started)**
- Planner implementation
- Action library
- Autonomous AI

**Phase 4: Web UI (Not Started)**
- Phaser scenes
- React components
- Electron shell

**Phase 5: Polish**
- Visual assets
- Animations
- Sound
- Packaging

### Estimated Timeline

```
Movement:   1-2 weeks
GOAP:       1-2 weeks
Web UI:     2-3 weeks
Polish:     2-3 weeks
-----------
Total:      6-10 weeks
```

---

## Current Status

### What to Do NOW

**Options:**

1. **Continue Dialogue Depth**
   - More NPCs
   - Quest completion
   - Group conversations
   - *(Recommended for now)*

2. **Start Movement**
   - Integrate PathFinding.js
   - Create world map
   - Add character movement

3. **Start GOAP**
   - Implement planner
   - Build action library
   - Test autonomous AI

4. **Start Web UI**
   - Set up Phaser
   - Create React components
   - Build Electron shell

### Recommendation

**Stay CLI for now, then migrate:**

1. Complete quest system (2-3 hours)
2. Add group conversations (3-4 hours)
3. Polish CLI experience (2-3 hours)
4. THEN start web migration (6-10 weeks)

**Why:**
- Core systems are solid ✅
- Web UI is cosmetic upgrade
- CLI proves the concept
- Can always migrate later

---

## Summary

### This Document's Scope

⚠️ **Everything in this document is FUTURE VISION**

**Not implemented:**
- Web UI
- Phaser rendering
- Movement system
- GOAP system
- Observer mode

**What works now:**
- CLI dialogue game
- See `GAME_CONCEPT_AND_DESIGN.md`

### When to Implement?

**When you're ready to:**
- Add spatial world exploration
- Make AI fully autonomous
- Create visual experience
- Package for distribution

**Not needed yet if:**
- Focusing on dialogue quality
- Building more content
- Testing AI capabilities
- Proving gameplay concept

---

## Documentation References

### Current Implementation
- **GAME_CONCEPT_AND_DESIGN.md** - What's working NOW
- **README.md** - How to play now
- **START_HERE.md** - Quick start

### Future Vision (This Doc)
- **old/WEB_GAME_CONCEPT.md** - Full original vision
- **old/ARCHITECTURE.md** - Planned technical architecture
- **old/REPLAY_SYSTEM_DESIGN.md** - Full replay design

### Status Docs
- **FINAL_STATUS_SUMMARY.md** - Current vs planned
- **FEATURE_STATUS.md** - Feature breakdown
- **IMPLEMENTATION_STATUS.md** - What's done

---

**This is the future. The present is already amazing.** ✨

**Play it now:** `npm run play:gm`
