# Getting Started with OllamaRPG Development

Welcome to the OllamaRPG project! This guide will help you get started with development using the agent-based approach.

## 📋 What You Have

### Documentation Created

I've created comprehensive documentation and agent guidelines for this project:

#### Core Documentation
- **`README.md`** - Project overview, features, and quick start
- **`ARCHITECTURE.md`** - Complete technical architecture and system design
- **`GAME_CONCEPT_AND_DESIGN.md`** - Original Python-based concept and design
- **`WEB_GAME_CONCEPT.md`** - Electron/Web version concept with GOAP AI
- **`REPLAY_SYSTEM_DESIGN.md`** - Deterministic replay system design

#### Development Guides
- **`DEVELOPMENT_AGENTS.md`** - 10 specialized agent roles and responsibilities
- **`AGENT_SETUP_GUIDE.md`** - How to set up and use development agents
- **`.github/copilot-instructions.md`** - Development guidelines for GitHub Copilot

## 🚀 Quick Start Options

### Option 1: GitHub Copilot (Automatic)

If you have GitHub Copilot:

1. The `.github/copilot-instructions.md` file is automatically loaded
2. All Copilot suggestions will follow project patterns
3. Chat with Copilot for architecture-aware help
4. Code completions match the established style

**Just start coding!** Copilot will guide you based on the instructions.

### Option 2: Custom Agents (Manual)

If using Claude, ChatGPT, or other AI systems:

1. **Create 10 specialized agents** (one for each domain)
2. **Load documentation** into each agent's context
3. **Follow the agent workflow** from `AGENT_SETUP_GUIDE.md`

See [Setting Up Custom Agents](#setting-up-custom-agents) below.

### Option 3: Solo Development

If developing without AI assistance:

1. **Read core docs**: `README.md`, `ARCHITECTURE.md`, `.github/copilot-instructions.md`
2. **Follow patterns**: Use established code patterns
3. **Implement phase-by-phase**: Follow the roadmap in `README.md`

## 📚 Understanding the Project

### What Is OllamaRPG?

An **autonomous RPG** where:
- AI controls the protagonist (you observe, not play)
- NPCs have personalities, memories, and daily schedules
- GOAP (Goal-Oriented Action Planning) drives behavior
- LLM (Ollama) generates goals and dialogue
- Replay system records everything for playback

### Key Innovation: Observer Gameplay

Instead of playing, you **watch** the story unfold:
- Camera follows protagonist or any NPC
- Speed up/slow down/pause time
- Rewind to watch key moments again
- Inspect character thoughts, memories, relationships
- View exact LLM prompts and responses

### Tech Stack

```
Electron (Desktop App)
  ├─ Phaser 3 (Game Rendering)
  ├─ React + Zustand (UI)
  │   └─ TailwindCSS (Styling)
  │
  ├─ Custom GOAP Engine (AI Planning)
  ├─ Ollama LLM (Goals & Dialogue)
  ├─ PathFinding.js (Navigation)
  │
  └─ Deterministic Replay System
      ├─ SeededRandom (RNG)
      ├─ Event Logging
      └─ Checkpointing
```

## 🏗️ Architecture at a Glance

### Layer Structure

```
UI Layer (React)
    ↓
State Layer (Zustand)
    ↓
Game Logic Layer (Systems + Entities)
    ↓
AI Layer (GOAP + LLM)
    ↓
Service Layer (Ollama, Pathfinding, Replay)
    ↓
Utilities (SeededRandom, EventBus, Logger)
```

### Key Systems

1. **GOAP System**: AI planning (goals → actions)
2. **LLM Integration**: Ollama for goals and dialogue
3. **Replay System**: Record/playback with determinism
4. **Character Systems**: Personality, memory, relationships
5. **Movement System**: Pathfinding and navigation
6. **Rendering**: Phaser 3 scenes and sprites
7. **UI**: React observer interface

## 🎯 Development Phases

### Phase 1: Foundation (Weeks 1-2) ✅
- [x] Project structure created
- [x] Documentation complete
- [x] Agent guidelines written
- [ ] Base classes (Entity, System, Service)
- [ ] Utilities (SeededRandom, GameClock, EventBus)
- [ ] Test infrastructure

### Phase 2: Core Systems (Weeks 3-4)
- [ ] GOAP planner
- [ ] Basic actions (Move, Talk, Enter, Exit)
- [ ] Pathfinding integration
- [ ] Character movement
- [ ] World state system

### Phase 3: AI Integration (Weeks 5-6)
- [ ] Ollama service
- [ ] Goal generation
- [ ] Dialogue generation
- [ ] Personality system
- [ ] Memory system

### Phase 4-8: See `README.md` for full roadmap

## 🎨 The 10 Specialized Agents

Each agent focuses on one domain:

1. **GOAP AI Architect** - GOAP planner and actions
2. **LLM Integration Specialist** - Ollama integration and prompts
3. **Phaser Rendering Expert** - Game rendering and animations
4. **React UI Developer** - UI components and state
5. **Replay System Engineer** - Deterministic replay system
6. **Character Systems Architect** - Personality, memory, relationships
7. **Pathfinding & Movement** - Navigation and movement
8. **Electron & Build System** - App packaging and IPC
9. **Testing & QA** - Tests and quality assurance
10. **Game Content Designer** - Maps, NPCs, world content

See `DEVELOPMENT_AGENTS.md` for detailed responsibilities.

## 🛠️ Setting Up Development Environment

### Prerequisites

```bash
# Node.js 18+
node --version

# Ollama (for LLM integration)
ollama --version

# If Ollama not installed:
# Visit https://ollama.ai/ and install
# Then pull a model:
ollama pull mistral
```

### Installation

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd ollama-rpg

# Install dependencies
npm install

# Verify setup
npm run test
```

### Running the App

```bash
# Development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Package for distribution
npm run package
```

## 🤖 Setting Up Custom Agents

### Step 1: Choose Your AI Platform

- **Claude Projects**: Create 10 projects, one per agent
- **ChatGPT Custom GPTs**: Create 10 GPTs, one per agent
- **Other**: Use your preferred AI system

### Step 2: Load Agent Context

For each agent:

1. **Core Context** (all agents need):
   - `README.md`
   - `ARCHITECTURE.md`
   - `.github/copilot-instructions.md`
   - `DEVELOPMENT_AGENTS.md`

2. **Specialized Context** (per agent):
   - See `AGENT_SETUP_GUIDE.md` for specific documents per agent

### Step 3: Configure Agent Instructions

Copy the "Custom Instructions" from `AGENT_SETUP_GUIDE.md` for each agent.

Example for GOAP AI Architect:
```
You are an expert in Goal-Oriented Action Planning (GOAP) systems.

Key responsibilities:
- Design and implement GOAP actions
- Optimize A* planning
- Debug planning failures
- Ensure deterministic behavior

[... see AGENT_SETUP_GUIDE.md for full instructions]
```

### Step 4: Start Development

1. Choose which phase to start with (recommend Phase 1)
2. Assign tasks to appropriate agents
3. Follow the agent workflow from `AGENT_SETUP_GUIDE.md`
4. Use handoff protocols when agents interact

## 📖 Key Documents to Read

### Before Starting Any Code

1. **`README.md`** - Understand what you're building (15 min)
2. **`ARCHITECTURE.md`** - Understand how it's structured (30 min)
3. **`.github/copilot-instructions.md`** - Understand coding patterns (15 min)

### Before Working on Specific Systems

| Working on... | Read this... |
|--------------|-------------|
| GOAP AI | `WEB_GAME_CONCEPT.md` - GOAP section |
| LLM Integration | `WEB_GAME_CONCEPT.md` - LLM section |
| Replay System | `REPLAY_SYSTEM_DESIGN.md` - Complete |
| Character Systems | `GAME_CONCEPT_AND_DESIGN.md` - NPC section |
| Rendering | `WEB_GAME_CONCEPT.md` - Rendering section |
| UI | `WEB_GAME_CONCEPT.md` - UI section |

## 🎓 Learning Path

### For New Contributors

**Day 1**: Understand the vision
- Read `README.md`
- Watch Ollama demo: https://ollama.ai/
- Understand GOAP: Watch "Goal Oriented Action Planning" videos

**Day 2**: Learn the architecture
- Read `ARCHITECTURE.md`
- Review folder structure in `src/`
- Read `.github/copilot-instructions.md`

**Day 3**: Pick your agent
- Read `DEVELOPMENT_AGENTS.md`
- Choose a specialization
- Read agent-specific docs from `AGENT_SETUP_GUIDE.md`

**Day 4+**: Start coding
- Start with Phase 1 tasks
- Write tests first (TDD)
- Follow established patterns
- Document as you go

## 💡 Development Tips

### Do's ✅

- **Use seeded RNG**: Always use `SeededRandom`, never `Math.random()`
- **Use game time**: Always use `gameState.currentFrame`, never `Date.now()`
- **Log to replay**: Use `replayLogger.logEvent()` for important events
- **Follow patterns**: Look at similar existing code
- **Test thoroughly**: Write unit and integration tests
- **Document interfaces**: Clear JSDoc for public methods

### Don'ts ❌

- **Don't break determinism**: No random system time usage
- **Don't skip tests**: Tests are critical for this project
- **Don't ignore patterns**: Follow `.github/copilot-instructions.md`
- **Don't mix concerns**: Keep rendering, logic, and UI separated
- **Don't forget handoffs**: Document integration points

## 🐛 Debugging Guide

### Common Issues

**"Replay doesn't match original"**
→ Check for non-deterministic behavior
→ Verify all RNG uses SeededRandom
→ Check for system time usage

**"Character gets stuck"**
→ Check pathfinding grid
→ Verify collision detection
→ Test GOAP plan validity

**"LLM calls failing"**
→ Verify Ollama is running: `ollama list`
→ Check seed management
→ Review prompt format

**"Performance issues"**
→ Profile with Chrome DevTools
→ Check frame timing
→ Review system update order

## 📞 Getting Help

### Documentation

First, check:
1. `ARCHITECTURE.md` - Technical questions
2. `.github/copilot-instructions.md` - Code patterns
3. `AGENT_SETUP_GUIDE.md` - Agent workflow
4. `DEVELOPMENT_AGENTS.md` - Agent responsibilities

### Community

- Open GitHub issues for bugs
- Discussions for feature ideas
- Wiki for additional resources (TODO)

## 🎯 Your First Task

### Recommended Starting Point

**Task**: Implement base classes and utilities (Phase 1)

1. **Create SeededRandom class** (`src/utils/SeededRandom.js`)
   - Implement Mulberry32 PRNG
   - Add next(), nextInt(), nextFloat() methods
   - Write tests

2. **Create GameClock class** (`src/core/GameClock.js`)
   - Track frames and game time
   - Never use system time
   - Write tests

3. **Create EventBus class** (`src/services/EventBus.js`)
   - Simple pub/sub pattern
   - Support wildcards
   - Write tests

See `ARCHITECTURE.md` for implementation details.

## ✅ Success Checklist

Before considering a feature "done":

- [ ] Code follows patterns from `.github/copilot-instructions.md`
- [ ] Unit tests written and passing
- [ ] Integration tests passing (if applicable)
- [ ] Documentation updated (JSDoc comments)
- [ ] Deterministic (verified with replay test)
- [ ] Performance acceptable (<16.67ms per frame)
- [ ] Handoff comments added (if needed by other agents)
- [ ] No lint errors
- [ ] Committed with clear message

## 🚀 Ready to Start?

### Next Steps

1. **Set up environment**: Install Node.js, Ollama, dependencies
2. **Read core docs**: README, ARCHITECTURE, copilot-instructions
3. **Choose approach**: GitHub Copilot, Custom Agents, or Solo
4. **Pick a task**: Start with Phase 1 utilities
5. **Write tests first**: TDD approach
6. **Code**: Follow patterns and guidelines
7. **Test**: Run tests and verify
8. **Document**: Update docs and add comments
9. **Commit**: Clear commit message
10. **Repeat**: Move to next task

## 📚 Additional Resources

### External Documentation

- **Phaser 3**: https://photonstorm.github.io/phaser3-docs/
- **Ollama API**: https://github.com/ollama/ollama/blob/main/docs/api.md
- **PathFinding.js**: https://github.com/qiao/PathFinding.js
- **React**: https://react.dev/
- **Zustand**: https://zustand-demo.pmnd.rs/
- **Electron**: https://www.electronjs.org/docs/latest/
- **Vitest**: https://vitest.dev/

### Learning Resources

- **GOAP**: Search "Goal Oriented Action Planning" on YouTube
- **A* Pathfinding**: Red Blob Games pathfinding tutorials
- **Replay Systems**: StarCraft 2 replay system articles
- **Deterministic Systems**: Factorio "Determinism" blog posts

---

## 🎉 Welcome!

You're about to build something unique - an AI-driven RPG where stories emerge naturally from character interactions. This is a challenging but rewarding project that combines AI, games, and emergent gameplay.

**Let's create something amazing together!** 🚀✨

Have questions? Check the docs or open an issue. Happy coding!
