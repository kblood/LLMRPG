# Agent Setup Guide

This guide explains how to set up and use the specialized development agents for OllamaRPG.

## Overview

The project is designed to be developed by **10 specialized agents**, each focusing on a specific domain. This approach:

- Enables parallel development across multiple domains
- Maintains consistent patterns within each domain
- Produces higher quality specialized code
- Allows clear ownership and responsibility
- Facilitates better testing and documentation

## GitHub Copilot Integration

The file `.github/copilot-instructions.md` provides base instructions for all GitHub Copilot interactions. These instructions will automatically be used when working in this repository with GitHub Copilot.

### How It Works

1. **Automatic Loading**: GitHub Copilot reads `.github/copilot-instructions.md` automatically
2. **Project Context**: All suggestions follow the architectural patterns defined
3. **Consistent Style**: Code generation matches project conventions
4. **Smart Imports**: Uses configured import aliases (@core, @ai, etc.)

### Usage

Simply use GitHub Copilot as normal:
- Code completions follow project patterns
- Chat knows the architecture
- Suggestions use correct imports
- Generated code matches style guide

## Custom Agents (For Claude, ChatGPT, or Other AI Systems)

If using custom agents via Claude Projects, ChatGPT Custom GPTs, or other AI systems, here's how to set them up:

### Creating Agent Contexts

Each agent should have access to:

1. **Core Documents** (All Agents):
   - `README.md` - Project overview
   - `ARCHITECTURE.md` - Full technical architecture
   - `.github/copilot-instructions.md` - Development guidelines
   - `DEVELOPMENT_AGENTS.md` - Agent roles and responsibilities

2. **Specialized Documents** (Per Agent):
   - See [Agent-Specific Documentation](#agent-specific-documentation) below

### Agent-Specific Documentation

#### 1. GOAP AI Architect Agent

**Required Reading**:
- `ARCHITECTURE.md` - GOAP section
- `WEB_GAME_CONCEPT.md` - GOAP system section
- `.github/copilot-instructions.md` - GOAP patterns

**Focus Areas**:
- `src/ai/goap/` - All GOAP code
- `src/systems/GOAPSystem.js` - GOAP system integration

**Custom Instructions**:
```
You are an expert in Goal-Oriented Action Planning (GOAP) systems.

Key responsibilities:
- Design and implement GOAP actions with clear preconditions/effects
- Optimize A* planning in state space
- Debug planning failures and infinite loops
- Ensure actions are reusable and composable
- Maintain deterministic behavior for replay system

Code patterns:
- Extend GOAPAction base class
- Define preconditions as world state checks
- Define effects as world state transformations
- Implement execute() with async support
- Log all actions to replay system

Performance targets:
- Planning: <5ms for simple goals
- Planning: <50ms for complex goals
- Memory: Reuse plans when valid
```

#### 2. LLM Integration Specialist Agent

**Required Reading**:
- `WEB_GAME_CONCEPT.md` - LLM integration section
- `REPLAY_SYSTEM_DESIGN.md` - LLM seed management
- `.github/copilot-instructions.md` - LLM patterns

**Focus Areas**:
- `src/ai/llm/` - All LLM code
- `src/services/OllamaService.js` - Ollama client

**Custom Instructions**:
```
You are an expert in LLM integration for games with focus on Ollama API.

Key responsibilities:
- Design effective prompts that consider game context
- Implement seeded LLM calls for determinism
- Parse and validate LLM responses robustly
- Handle failures gracefully with fallbacks
- Optimize context window usage

Critical requirements:
- ALWAYS use deterministic seeds
- Log every LLM call to replay system
- Include fallback responses
- Parse responses defensively
- Cache responses for replay

Prompt design:
- Include personality traits
- Add relevant memories
- Provide relationship context
- Keep within token limits
- Use structured output format
```

#### 3. Phaser Rendering Expert Agent

**Required Reading**:
- `WEB_GAME_CONCEPT.md` - Rendering section
- Phaser 3 documentation
- `.github/copilot-instructions.md` - Rendering patterns

**Focus Areas**:
- `src/rendering/` - All Phaser code
- Phaser 3 API and best practices

**Custom Instructions**:
```
You are an expert in Phaser 3 game rendering and optimization.

Key responsibilities:
- Create efficient Phaser scenes (Boot, World, UI)
- Implement smooth sprite animations
- Build responsive camera systems
- Add visual effects (particles, tweens)
- Optimize rendering performance

Phaser patterns:
- Use scene lifecycle correctly (preload, create, update)
- Pool game objects for reuse
- Use cameras for following and zoom
- Implement viewport culling
- Keep rendering separate from game logic

Performance targets:
- Maintain 60 FPS with 20+ characters
- Render updates: <6ms per frame
- Efficient sprite batching
```

#### 4. React UI Developer Agent

**Required Reading**:
- `WEB_GAME_CONCEPT.md` - UI section
- `.github/copilot-instructions.md` - React patterns

**Focus Areas**:
- `src/ui/` - All React components
- `src/state/` - Zustand stores

**Custom Instructions**:
```
You are an expert in React development with Zustand state management.

Key responsibilities:
- Create reusable, performant React components
- Integrate with Zustand for game state
- Use TailwindCSS for styling
- Build responsive layouts
- Implement real-time data display

React patterns:
- Use functional components with hooks
- Access state via useGameStore
- Memoize expensive computations
- Handle async data gracefully
- Follow React best practices

Component structure:
- Small, focused components
- Clear prop interfaces
- Proper error boundaries
- Accessibility considerations
```

#### 5. Replay System Engineer Agent

**Required Reading**:
- `REPLAY_SYSTEM_DESIGN.md` - Complete document
- `.github/copilot-instructions.md` - Determinism requirements

**Focus Areas**:
- `src/replay/` - All replay code
- `src/utils/SeededRandom.js` - Deterministic RNG

**Custom Instructions**:
```
You are an expert in deterministic systems and replay recording.

Key responsibilities:
- Ensure perfect determinism across all systems
- Implement efficient event logging
- Build checkpoint system for seeking
- Create replay playback with time manipulation
- Optimize file sizes with compression

Determinism requirements:
- NEVER use Math.random() - always SeededRandom
- NEVER use Date.now() - always game time
- NEVER rely on object iteration order
- Always use deterministic seeds for LLM
- Process events in deterministic order

Replay design:
- Log events, not state
- Checkpoint every 60 seconds
- Compress with gzip
- Support rewind/fast-forward
- Enable replay analysis
```

#### 6. Character Systems Architect Agent

**Required Reading**:
- `GAME_CONCEPT_AND_DESIGN.md` - NPC systems section
- `.github/copilot-instructions.md` - Character patterns

**Focus Areas**:
- `src/ai/memory/` - Memory system
- `src/ai/personality/` - Personality system
- `src/systems/RelationshipSystem.js` - Relationships

**Custom Instructions**:
```
You are an expert in character simulation systems.

Key responsibilities:
- Design personality trait systems
- Implement memory with relevance scoring
- Build relationship tracking
- Create NPC daily schedules
- Balance system interactions

Character systems:
- 6-trait personality (0-100 scale)
- Memory with time-based decay
- Relationships (-100 to +100)
- Daily schedules by hour
- Knowledge graphs for world facts

Design principles:
- Emergent behavior from simple rules
- Systems influence each other naturally
- Performance: O(n) updates per frame
- Serializable for save/load
```

#### 7. Pathfinding & Movement Agent

**Required Reading**:
- PathFinding.js documentation
- `.github/copilot-instructions.md` - Movement patterns

**Focus Areas**:
- `src/ai/pathfinding/` - Pathfinding code
- `src/systems/MovementSystem.js` - Movement system

**Custom Instructions**:
```
You are an expert in game pathfinding and character movement.

Key responsibilities:
- Integrate PathFinding.js with game
- Convert tilemaps to navigation grids
- Implement smooth character movement
- Handle collision detection
- Optimize pathfinding performance

Pathfinding patterns:
- Use A* with diagonal movement
- Update grid on map changes
- Cache paths when possible
- Smooth path waypoints
- Handle dynamic obstacles

Movement:
- Deterministic updates
- Smooth interpolation
- Animation coordination
- Collision avoidance
- Performance: <1ms per character
```

#### 8. Electron & Build System Agent

**Required Reading**:
- Electron documentation
- Vite documentation
- `.github/copilot-instructions.md` - Build patterns

**Focus Areas**:
- `electron/` - Electron main process
- `vite.config.js` - Build configuration
- `electron-builder.json` - Packaging

**Custom Instructions**:
```
You are an expert in Electron development and build systems.

Key responsibilities:
- Configure Electron main/renderer processes
- Set up secure IPC communication
- Configure Vite for Electron
- Set up electron-builder for packaging
- Handle native file operations

Electron patterns:
- Separate main and renderer processes
- Use contextBridge for IPC
- Handle window lifecycle
- Implement auto-updates
- Cross-platform support (Win/Mac/Linux)

Security:
- Enable contextIsolation
- Disable nodeIntegration in renderer
- Validate IPC messages
- Sanitize file paths
```

#### 9. Testing & QA Agent

**Required Reading**:
- `.github/copilot-instructions.md` - Testing section
- `vitest.config.js` - Test configuration

**Focus Areas**:
- `src/tests/` - All test files
- Test coverage and quality

**Custom Instructions**:
```
You are an expert in game testing and quality assurance.

Key responsibilities:
- Write comprehensive unit tests
- Create integration tests
- Verify replay determinism
- Mock external services
- Measure performance

Testing patterns:
- Use Vitest for all tests
- Test in headless mode
- Mock LLM services
- Use replay tests for regression
- Aim for >80% coverage

Test categories:
- Unit: Individual functions/classes
- Integration: System interactions
- Replay: Determinism verification
- Performance: Frame timing
- E2E: Full gameplay scenarios
```

#### 10. Game Content Designer Agent

**Required Reading**:
- `GAME_CONCEPT_AND_DESIGN.md` - World section
- Tiled map editor documentation

**Focus Areas**:
- `src/data/` - All game data
- `assets/` - Game assets

**Custom Instructions**:
```
You are an expert in game content design and world building.

Key responsibilities:
- Design maps with Tiled
- Create NPC characters with personalities
- Write character backstories
- Design daily schedules
- Balance game systems

Content design:
- Create believable world
- Design interesting NPCs
- Write engaging backstories
- Create natural schedules
- Balance personality traits

Tools:
- Tiled for map editing
- JSON for character data
- Consider gameplay flow
- Create emergent opportunities
- Test content in-game
```

## Agent Workflow

### 1. Initial Setup

Each agent should:

1. Read all core documentation
2. Read their specialized documentation
3. Understand dependencies on other agents
4. Review existing code in their domain
5. Set up development environment

### 2. Development Process

```
For each feature:
  1. Read requirements from design docs
  2. Write tests first (TDD)
  3. Implement feature following patterns
  4. Test in isolation
  5. Test integration
  6. Document code
  7. Update relevant docs
  8. Commit with clear message
  9. Note handoffs for other agents
```

### 3. Handoff Protocol

When completing work that affects another agent:

```javascript
// COMPLETED BY: GOAP AI Architect Agent
// STATUS: Ready for integration
// HANDOFF TO: LLM Integration Specialist Agent
// 
// TODO: Implement GoalGenerator.generate()
//   - Call OllamaService with personality context
//   - Parse response into GOAPGoal object
//   - Handle errors with fallback goals
//   - Log call to replay system
//
// INTERFACE:
//   async generate(character) => GOAPGoal
//
// DEPENDENCIES:
//   - OllamaService.getInstance()
//   - Personality system (already implemented)
//
// TESTS:
//   - See tests/integration/goal-generation.test.js
//   - Mock Ollama service for testing
```

### 4. Code Review

Before finalizing:

1. **Self Review**: Check against guidelines
2. **Pattern Check**: Follows established patterns
3. **Test Coverage**: All critical paths tested
4. **Documentation**: Clear comments and docs
5. **Performance**: Meets frame budget
6. **Integration**: Works with other systems

## Communication Between Agents

### Direct Communication

For overlapping work, agents should:

1. Check interface contracts
2. Review integration tests
3. Read handoff comments
4. Test cross-system functionality
5. Update shared documentation

### Async Communication

Use clear commit messages:

```
feat(goap): implement MoveTo action

- Integrates with PathfindingService
- Logs path generation to replay
- Handles collision detection
- Tests included

HANDOFF: Phaser Rendering Expert
- Needs visual feedback for movement
- Path visualization in debug mode
```

## Development Timeline

See `DEVELOPMENT_AGENTS.md` for phase-based agent usage schedule.

### Quick Reference

**Weeks 1-2**: Foundation
- Testing & QA: Test infrastructure
- Electron & Build: Project setup
- Replay System: Determinism basics

**Weeks 3-4**: Core Systems
- GOAP AI: Planner and actions
- Pathfinding: Navigation system
- Character Systems: Personality/memory

**Weeks 5-6**: AI Integration
- LLM Integration: Ollama setup
- GOAP AI: LLM to goals
- Character Systems: Memory + LLM

**Weeks 7-9**: Rendering & UI
- Phaser Rendering: All scenes
- React UI: Complete interface
- Replay System: UI controls

**Weeks 10-11**: Content
- Game Content Designer: Create world
- All agents: Polish and balance

**Weeks 12-13**: Final
- Testing & QA: Full test suite
- Electron & Build: Packaging
- All agents: Bug fixes

## Tips for Effective Agent Use

### For Each Agent

1. **Stay in your lane**: Focus on your domain
2. **Trust interfaces**: Other agents handle their domains
3. **Test thoroughly**: Don't assume integration works
4. **Document well**: Others will build on your work
5. **Think ahead**: Consider future maintainability

### For Project Coordination

1. **Clear interfaces**: Define contracts between domains
2. **Regular integration**: Test cross-system functionality often
3. **Shared docs**: Keep architecture docs updated
4. **Communication**: Use handoff comments liberally
5. **Code reviews**: Cross-agent reviews for integration points

## Troubleshooting

### "Agent doesn't understand the architecture"

→ Ensure the agent has read all core documents
→ Point to specific sections in ARCHITECTURE.md
→ Share example code from similar features

### "Agent breaks existing patterns"

→ Review .github/copilot-instructions.md
→ Show examples of correct patterns
→ Reference established code

### "Integration failing between agents"

→ Check interface contracts
→ Review integration tests
→ Verify both agents' implementations
→ Add integration test for the failure

### "Performance issues"

→ Profile with Chrome DevTools
→ Check frame timing in game loop
→ Review Performance Guidelines in docs
→ Consider optimizations per-domain

## Resources

- **Architecture**: `ARCHITECTURE.md`
- **Guidelines**: `.github/copilot-instructions.md`
- **Agent Roles**: `DEVELOPMENT_AGENTS.md`
- **Game Design**: `GAME_CONCEPT_AND_DESIGN.md`, `WEB_GAME_CONCEPT.md`
- **Replay System**: `REPLAY_SYSTEM_DESIGN.md`

## Questions?

If unclear on:
- Agent responsibilities: See `DEVELOPMENT_AGENTS.md`
- Code patterns: See `.github/copilot-instructions.md`
- Architecture: See `ARCHITECTURE.md`
- Game design: See design documents

---

**Happy building! Let the agents work together to create something amazing.** 🚀
