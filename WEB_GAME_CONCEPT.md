# OllamaRPG - Web Game Concept (Future Vision)

**Last Updated**: November 17, 2025
**Status**: ⚠️ **FUTURE VISION** - Not Yet Implemented
**Current State**: CLI-only dialogue game
**Note**: This document describes the PLANNED web/Electron version. See `GAME_CONCEPT_AND_DESIGN.md` for current implementation.

---

## Important Notice

**This document describes a FUTURE version of OllamaRPG that is not yet implemented.**

**What IS working now:**
- ✅ CLI dialogue game with 10 NPCs
- ✅ LLM-powered conversations
- ✅ Memory and relationships
- ✅ Game Master narration
- ✅ Replay logging

**What is NOT working (this document's scope):**
- ❌ Web UI / Electron app
- ❌ Phaser rendering
- ❌ React components
- ❌ Movement/pathfinding
- ❌ GOAP autonomous AI
- ❌ Observer-mode gameplay

See `old/WEB_GAME_CONCEPT.md` for the complete original vision.

---

## Future Vision Summary

When fully implemented, OllamaRPG will be:

### Autonomous Observer Game

**Concept**: Watch AI characters live their lives
- AI protagonist makes all decisions
- NPCs interact autonomously
- You observe, don't control
- Camera follows action
- Speed controls for pacing

### Technology Stack (Planned)

```
Platform:     Electron (desktop app)
Rendering:    Phaser 3 (2D game engine)
UI:           React + Zustand
Styling:      TailwindCSS
AI:           GOAP planner + Ollama LLM
Pathfinding:  PathFinding.js (A*)
```

### Observer Controls (Planned)

```
Camera:
- Click character to follow
- Mouse drag to pan
- Wheel to zoom
- ESC for free camera

Playback:
- Space: Pause/Resume
- 1-5: Speed control (0.25x to 5x)
- Arrows: Rewind/Fast-forward

Inspection:
- Click character: View info panel
- M: Memory inspector
- R: Relationship viewer
- T: Toggle thought bubbles
- D: Debug panel
```

---

## Implementation Roadmap

### Phase 7: Web UI (Planned - 2-3 weeks)

**What's Needed:**

1. **Phaser Integration**
   ```javascript
   - World scene with tilemap
   - Character sprites
   - Camera system
   - Animations
   ```

2. **React UI Layer**
   ```javascript
   - HUD components
   - Character panels
   - Thought bubbles
   - Timeline visualization
   - Menu system
   ```

3. **Electron Packaging**
   ```javascript
   - Main process setup
   - IPC communication
   - Window management
   - Menu bar
   ```

4. **State Bridge**
   ```javascript
   - Game state → React
   - UI events → Game
   - Real-time updates
   ```

### Phase 5: Movement System (Needed first - 1-2 weeks)

**Prerequisites:**

1. **PathFinding Integration**
   ```javascript
   - Grid-based world map
   - Navigation mesh
   - A* pathfinding
   - Collision detection
   ```

2. **Spatial World**
   ```javascript
   - Tile-based map
   - Buildings with interiors
   - Doors and transitions
   - Location tracking
   ```

3. **Character Movement**
   ```javascript
   - Position components
   - Movement system
   - Path following
   - Smooth interpolation
   ```

### Phase 6: GOAP System (Needed for autonomy - 1-2 weeks)

**What's Needed:**

1. **GOAP Planner**
   ```javascript
   - A* in state space
   - Goal prioritization
   - Plan caching
   - Replanning logic
   ```

2. **Action Library**
   ```javascript
   - MoveTo action
   - TalkTo action
   - EnterBuilding action
   - ExitBuilding action
   - Wait action
   - Explore action
   ```

3. **Goal Generation**
   ```javascript
   - LLM generates high-level goals
   - GOAP creates action sequence
   - Execute plan step-by-step
   - Adapt to changes
   ```

---

## Current vs Future

### What Works Now (CLI Version)

```
✅ Dialogue System
   - Natural conversations
   - 20+ turn coherence
   - Personality-driven

✅ Character AI
   - Memory & relationships
   - Emotional states
   - Personality traits

✅ Game Master
   - Scene narration
   - Event generation
   - Story orchestration

✅ Replay System
   - Event logging
   - LLM call recording
   - Viewing tools
```

### What's Planned (Web Version)

```
❌ Visual Rendering
   - Phaser scenes
   - Character sprites
   - Map tileset
   - Animations

❌ Movement
   - Spatial navigation
   - Pathfinding
   - Building transitions
   - World exploration

❌ GOAP Autonomy
   - AI protagonist
   - Multi-step planning
   - Goal pursuit
   - Emergent behavior

❌ Observer Mode
   - Camera controls
   - Speed controls
   - UI panels
   - Timeline
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
