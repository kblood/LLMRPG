# Development Agents for OllamaRPG

This document outlines specialized agents that would be highly beneficial for implementing this autonomous RPG project.

## Overview

The OllamaRPG project is complex with multiple specialized domains. Custom agents would significantly accelerate development and maintain code quality across these domains.

---

## Recommended Agents

### 1. **GOAP AI Architect Agent**

**Purpose**: Design and implement GOAP (Goal-Oriented Action Planning) system components

**Expertise**:
- A* pathfinding algorithms
- State space planning
- Action precondition/effect systems
- Goal prioritization and selection
- Plan validation and replanning

**Responsibilities**:
- Create new GOAP actions with proper preconditions/effects
- Optimize GOAP planner performance
- Debug planning failures
- Design world state representation
- Implement complex multi-step behaviors

**Example Tasks**:
- "Create a new GOAP action for character trading items"
- "Optimize the planner to reduce planning time for complex goals"
- "Debug why character gets stuck in planning loop"

---

### 2. **LLM Integration Specialist Agent**

**Purpose**: Handle all Ollama LLM integration, prompt engineering, and deterministic seeding

**Expertise**:
- Ollama API and configuration
- Prompt engineering for games
- Context building from game state
- Response parsing and validation
- Seed management for determinism
- Caching strategies

**Responsibilities**:
- Design effective prompts for goals and dialogue
- Implement seeded LLM calls for replay system
- Parse and validate LLM responses
- Handle LLM failures gracefully
- Optimize context window usage
- Create fallback systems

**Example Tasks**:
- "Create a prompt template for NPC memory-based dialogue"
- "Implement deterministic seeding for goal generation"
- "Add fallback dialogue when LLM is unavailable"

---

### 3. **Phaser Rendering Expert Agent**

**Purpose**: Implement Phaser 3 game rendering, animations, and visual effects

**Expertise**:
- Phaser 3 scenes and game objects
- Sprite management and animations
- Tilemap rendering
- Camera systems
- Particle effects
- Performance optimization

**Responsibilities**:
- Create Phaser scenes (Boot, World, UI)
- Implement character and NPC rendering
- Build camera following system
- Add visual effects (speech bubbles, thought indicators)
- Optimize rendering performance
- Integrate with game logic layer

**Example Tasks**:
- "Create smooth camera following with lerping"
- "Implement 8-directional character animations"
- "Add thought bubble visual effects"

---

### 4. **React UI Developer Agent**

**Purpose**: Build React UI components and integrate with Zustand state management

**Expertise**:
- React hooks and components
- Zustand state management
- TailwindCSS styling
- Real-time data display
- Component optimization
- Responsive layouts

**Responsibilities**:
- Create HUD components
- Build replay control interface
- Design character info panels
- Implement debug tools
- Create menu systems
- Integrate with game state

**Example Tasks**:
- "Create a replay timeline with event markers"
- "Build a character memory inspector component"
- "Design responsive HUD for game state"

---

### 5. **Replay System Engineer Agent**

**Purpose**: Implement deterministic replay recording and playback system

**Expertise**:
- Deterministic systems design
- Event logging and serialization
- State checkpointing
- File compression (gzip/pako)
- Time manipulation (rewind/fast-forward)
- Seed management

**Responsibilities**:
- Implement ReplayLogger for event recording
- Build ReplayEngine with playback controls
- Create checkpoint system
- Ensure determinism across systems
- Optimize file size and performance
- Build replay analysis tools

**Example Tasks**:
- "Implement rewind functionality with checkpoints"
- "Add event filtering for replay export"
- "Debug non-deterministic behavior in replays"

---

### 6. **Character Systems Architect Agent**

**Purpose**: Design and implement character-related systems (memory, personality, relationships)

**Expertise**:
- Personality modeling
- Memory systems with decay
- Relationship tracking
- NPC scheduling
- Knowledge graphs
- Behavioral psychology

**Responsibilities**:
- Implement personality trait system
- Build memory storage with relevance scoring
- Create relationship tracking
- Design daily schedules for NPCs
- Implement knowledge graph
- Balance system interactions

**Example Tasks**:
- "Create memory decay algorithm with time-based relevance"
- "Implement relationship change events"
- "Design NPC daily schedule system"

---

### 7. **Pathfinding & Movement Agent**

**Purpose**: Implement pathfinding, collision detection, and character movement

**Expertise**:
- A* pathfinding algorithms
- Grid-based navigation
- Collision detection
- Movement smoothing
- Steering behaviors
- Performance optimization

**Responsibilities**:
- Integrate PathFinding.js
- Convert tilemaps to navigation grids
- Implement smooth character movement
- Handle collision detection
- Optimize pathfinding performance
- Debug stuck characters

**Example Tasks**:
- "Implement diagonal movement with corner cutting prevention"
- "Optimize pathfinding grid updates"
- "Fix characters getting stuck at doors"

---

### 8. **Electron & Build System Agent**

**Purpose**: Configure Electron, build process, and packaging

**Expertise**:
- Electron main/renderer processes
- IPC communication
- Vite bundling
- Electron Builder packaging
- File system integration
- Native OS features

**Responsibilities**:
- Configure Electron main process
- Set up IPC handlers
- Configure Vite for Electron
- Set up electron-builder
- Handle save/load file operations
- Create installers

**Example Tasks**:
- "Set up IPC for save/load game functionality"
- "Configure electron-builder for Windows/Mac/Linux"
- "Implement native file picker integration"

---

### 9. **Testing & QA Agent**

**Purpose**: Write tests, ensure code quality, and verify determinism

**Expertise**:
- Vitest unit testing
- Integration testing
- Replay-based testing
- Test mocking
- Performance testing
- Code coverage analysis

**Responsibilities**:
- Write unit tests for systems
- Create integration tests
- Verify replay determinism
- Mock LLM services
- Test headless mode
- Measure performance

**Example Tasks**:
- "Write unit tests for GOAP planner"
- "Create replay determinism test suite"
- "Test character movement in headless mode"

---

### 10. **Game Content Designer Agent**

**Purpose**: Create game content (maps, characters, dialogues, quests)

**Expertise**:
- Tiled map editor
- Character design
- Quest design
- Narrative structure
- World building
- Game balance

**Responsibilities**:
- Design village maps
- Create NPC characters with personalities
- Write character backstories
- Design daily schedules
- Create initial game world state
- Balance game systems

**Example Tasks**:
- "Design Millbrook village map with Tiled"
- "Create 5 unique NPCs with personalities and backstories"
- "Design tavern interior layout"

---

## Agent Integration Strategy

### Phase-Based Agent Usage

**Phase 1: Foundation (Weeks 1-2)**
- Testing & QA Agent: Set up test infrastructure
- Electron & Build System Agent: Configure project
- Replay System Engineer: Implement basic determinism

**Phase 2: Core Systems (Weeks 3-4)**
- GOAP AI Architect: Build planner and actions
- Pathfinding & Movement Agent: Implement navigation
- Character Systems Architect: Design personality/memory

**Phase 3: AI & LLM (Weeks 5-6)**
- LLM Integration Specialist: Set up Ollama integration
- GOAP AI Architect: Connect LLM to goals
- Character Systems Architect: Integrate memories with LLM

**Phase 4: Rendering (Week 7)**
- Phaser Rendering Expert: Build all scenes
- React UI Developer: Create basic HUD
- Pathfinding & Movement Agent: Visual feedback

**Phase 5: UI & Polish (Weeks 8-9)**
- React UI Developer: Complete all UI components
- Replay System Engineer: Finalize replay UI
- Testing & QA Agent: Integration tests

**Phase 6: Content (Weeks 10-11)**
- Game Content Designer: Create all game content
- Character Systems Architect: Balance systems
- LLM Integration Specialist: Tune prompts

**Phase 7: Final (Weeks 12-13)**
- Testing & QA Agent: Full test suite
- Electron & Build System Agent: Packaging
- All agents: Bug fixes and optimization

---

## Communication Protocols

### Agent Handoffs

When one agent completes work that affects another:

1. **Document interfaces**: Clear API/contract documentation
2. **Update architecture docs**: Keep ARCHITECTURE.md current
3. **Write integration tests**: Verify cross-system functionality
4. **Tag hand-off points**: Clear TODO comments for next agent

### Example Handoff

```javascript
// Completed by GOAP AI Architect Agent
// HANDOFF to LLM Integration Specialist Agent:
// - Implement goalGenerator.generate() to call Ollama
// - Parse LLM response into GOAPGoal format
// - Handle errors with fallback goals
class GOAPGoal {
  constructor(name, desiredState, priority) {
    this.name = name;
    this.desiredState = desiredState; 
    this.priority = priority;
  }
}
```

---

## Agent Specialization Benefits

### Why Specialized Agents?

1. **Domain Expertise**: Each agent deeply understands their domain
2. **Consistent Patterns**: Agents maintain style within their domain
3. **Parallel Work**: Multiple agents can work simultaneously
4. **Quality**: Specialized agents produce higher quality code
5. **Documentation**: Agents maintain domain-specific docs
6. **Testing**: Each agent tests their own components thoroughly

### Cross-Domain Coordination

- **Shared Architecture**: All agents follow ARCHITECTURE.md
- **Common Patterns**: All use established patterns (Services, Systems, Events)
- **Integration Points**: Clear interfaces between domains
- **Code Reviews**: Agents review each other's integration points

---

## Getting Started with Agents

### For Each Agent

1. **Read all design docs**: Understand the full project vision
2. **Review your domain section**: Deep dive into your specialty
3. **Check dependencies**: Understand what you depend on
4. **Start with tests**: Write tests before implementation
5. **Document as you go**: Keep docs updated
6. **Think about handoffs**: Make your work easy to integrate

### Communication

- Use clear commit messages
- Add inline comments for complex logic
- Update relevant design docs
- Create integration test examples
- Leave TODO comments for handoffs

---

## Implementation Checklist

### Before Starting

- [ ] All agents have read design documents
- [ ] Architecture is agreed upon
- [ ] Test infrastructure is ready
- [ ] Import aliases are configured
- [ ] Base classes are created (System, Service, Entity)

### During Development

- [ ] Follow established patterns
- [ ] Write tests for new features
- [ ] Update documentation
- [ ] Use deterministic systems
- [ ] Log events for replay
- [ ] Communicate handoffs

### Before Handoff

- [ ] All tests passing
- [ ] Code documented
- [ ] Integration points clear
- [ ] Performance acceptable
- [ ] No breaking changes

---

## Success Metrics

### Per Agent

- **Code Quality**: Clean, maintainable, follows patterns
- **Test Coverage**: >80% for critical systems
- **Performance**: Meets frame budget (16.67ms)
- **Documentation**: Complete and accurate
- **Integration**: Works seamlessly with other systems

### Project Overall

- **Determinism**: Replays are 100% accurate
- **Performance**: Stable 60 FPS with 20+ NPCs
- **Reliability**: No crashes, graceful error handling
- **User Experience**: Smooth, responsive, enjoyable
- **Content**: Rich world with emergent stories

---

## Conclusion

This agent-based development approach allows for:

1. **Rapid parallel development** across multiple domains
2. **High-quality specialized implementations** 
3. **Clear responsibilities and ownership**
4. **Efficient problem-solving** with domain experts
5. **Maintainable codebase** with consistent patterns

Each agent is an expert in their domain, following shared architectural principles while maintaining their specialized knowledge. This creates a powerful development workflow for this complex autonomous RPG project.
