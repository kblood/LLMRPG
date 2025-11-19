# OllamaRPG - Game Concept and Current Implementation

**Last Updated**: November 17, 2025
**Status**: Core Dialogue Systems Complete (85%) | Fully Playable
**Note**: This document describes the CURRENT implementation. See `old/GAME_CONCEPT_AND_DESIGN.md` for original vision.

---

## Table of Contents

1. [Current Game Concept](#current-game-concept)
2. [What's Implemented](#whats-implemented)
3. [Technology Stack](#technology-stack)
4. [Core Systems](#core-systems)
5. [Character AI](#character-ai)
6. [Dialogue System](#dialogue-system)
7. [Game Master System](#game-master-system)
8. [Replay System](#replay-system)
9. [How to Play](#how-to-play)
10. [Future Expansion](#future-expansion)

---

## Current Game Concept

### What OllamaRPG Is Right Now

A **dialogue-focused AI RPG** where you engage in natural conversations with NPCs powered by local LLM (Ollama). The game emphasizes:

- **Natural Language Dialogue**: Free-form conversation, no dialogue trees
- **Persistent Personalities**: 10 unique NPCs with distinct traits
- **Memory & Relationships**: NPCs remember everything and relationships evolve
- **Emergent Quests**: Quests arise naturally from conversations
- **AI Game Master**: "The Chronicler" narrates scenes and orchestrates events
- **Autonomous Mode**: Watch AI protagonist interact with NPCs

### Key Differentiators

**What Makes It Special:**
- ✅ 20+ turn conversations without coherence loss
- ✅ Deterministic LLM generation (perfect replays)
- ✅ AI-to-AI emergent narratives
- ✅ Three-layer AI (protagonist + NPCs + Game Master)
- ✅ Text-based CLI gameplay (works NOW, no graphics needed)

**What It's NOT (yet):**
- ❌ Not a spatial exploration game (no movement/pathfinding)
- ❌ Not autonomous GOAP-based (uses direct LLM decisions)
- ❌ Not web-based (CLI only for now)
- ❌ Not combat-focused (dialogue-driven)

---

## What's Implemented

### ✅ Fully Working (100%)

1. **LLM Integration**
   - Ollama service with seeded generation
   - Fallback responses if offline
   - Deterministic for perfect replays

2. **Character System**
   - Personality traits (6-dimensional)
   - Memory system with time decay
   - Relationship tracking (-100 to +100)
   - 10 unique NPCs with backstories

3. **Dialogue System**
   - Multi-turn natural conversations
   - Context retention (20+ turns)
   - Personality-driven responses
   - Relationship-aware dialogue

4. **Game Master (Dungeon Master)**
   - Scene narration
   - Atmospheric descriptions
   - Event generation
   - Story arc tracking
   - Adaptive pacing

5. **Replay System**
   - Event logging (100%)
   - LLM call recording
   - Checkpoint system
   - 3 viewing tools
   - Gzip compression

6. **Playable Demos**
   - CLI interface
   - Interactive commands
   - 3 demo versions
   - Autonomous gameplay mode

### 🔄 Partially Working (70%+)

1. **Quest System**
   - Quest detection from dialogue ✅
   - Quest tracking ✅
   - Quest completion (pending)
   - Reward distribution (pending)

2. **Replay Playback**
   - Event viewing ✅
   - LLM inspection ✅
   - Full re-simulation (partial)

### 🔄 Backend Systems (Frameworks Exist, Not UI-Exposed)

1. **Inventory System**
   - Data structures exist (src/systems/items/)
   - Items, equipment, inventory classes ready
   - **Design**: Backend only - surfaces through NPC dialogue
   - NPCs will reference what player carries
   - No inventory screen planned

2. **Combat System**
   - Framework exists (src/systems/combat/)
   - Combat manager, AI, position tracking ready
   - **Design**: Narrative-driven - LLM describes combat
   - Stats influence outcomes, not explicit UI
   - NPCs react to combat reputation

3. **Quest System**
   - Basic structure exists (src/systems/quest/)
   - Quest manager, quest generator classes ready
   - **Design**: Emerges from dialogue naturally
   - Tracked in backend, referenced in conversation
   - No explicit quest log UI

### ❌ Not Planned (Rejected Approaches)

1. **Spatial Movement/Pathfinding**
   - PathFinding.js installed but won't be used for grid movement
   - Will use conceptual locations instead
   - Time-based travel, not pathfinding

2. **GOAP System**
   - Directory exists but not priority
   - Current LLM-direct approach works well
   - May revisit for NPC autonomy later

3. **Graphical UI (Phaser/React)**
   - Originally planned, now rejected
   - Text-driven design philosophy adopted
   - CLI with ANSI colors is the interface

---

## Technology Stack

### Current Implementation

```
Runtime:     Node.js 18+
Language:    JavaScript (ES modules)
LLM:         Ollama (llama3.1:8b)
Interface:   CLI (terminal-based)
Testing:     Vitest
Build:       Vite
```

### Core Libraries

```javascript
{
  "ollama": "^0.5.0",        // LLM integration
  "pathfinding": "^0.4.18",  // Installed but not used yet
  "pako": "^2.1.0",          // Replay compression
  "readline": "^1.3.0"       // CLI interface
}
```

### Future Additions

```
Phaser 3:     Game rendering (planned)
React:        UI framework (planned)
Electron:     Desktop packaging (planned)
```

---

## Core Systems

### 1. Character System

**File**: `src/entities/Character.js`

Every character has:

```javascript
{
  id: "mara",
  name: "Mara",
  role: "Tavern Keeper",

  personality: {
    aggression: 15,      // 0-100
    friendliness: 85,
    intelligence: 70,
    caution: 60,
    greed: 20,
    honor: 90
  },

  memory: {
    conversations: [],   // Past dialogues
    events: [],          // Witnessed events
    relationships: Map   // feelings about others
  },

  state: {
    location: "tavern",  // Conceptual, not spatial
    activity: "working",
    mood: "worried"
  }
}
```

**Key Features:**
- 6-trait personality system
- Memory with time-based decay
- Dynamic relationships
- Emotional states

### 2. Dialogue System

**File**: `src/systems/dialogue/DialogueSystem.js`

**How It Works:**

```
1. Player initiates conversation with NPC
     ↓
2. System gathers context:
   - NPC personality
   - Relationship level
   - Conversation history
   - Shared memories
     ↓
3. LLM generates NPC response
     ↓
4. Player responds (free-form text)
     ↓
5. Relationship updated based on interaction
     ↓
6. Memory created of conversation
     ↓
7. Loop continues for 20+ turns
```

**Context Generation:**

```javascript
const context = {
  npc: {
    name: npc.name,
    personality: npc.personality,
    role: npc.role,
    mood: npc.state.mood
  },
  relationship: relationship.level,
  history: last5Conversations,
  sharedMemories: relevantMemories,
  worldKnowledge: knownFacts
};
```

**LLM Prompt:**

```
You are Mara, the tavern keeper.

Personality: Friendly (85), Cautious (60), Honorable (90)
Current mood: Worried
Relationship with player: Friendly (+45)

Recent conversation:
[Player asked about thefts]
[You mentioned missing supplies]
[Player offered to help]

The player just said: "I'll investigate the thefts."

Respond naturally as Mara would, considering your personality
and the conversation context.
```

**Features:**
- ✅ No dialogue trees
- ✅ Natural free-form responses
- ✅ 20+ turn coherence
- ✅ Personality consistency
- ✅ Context awareness

### 3. Memory System

**File**: `src/ai/memory/MemoryStore.js`

**Memory Types:**

1. **Conversation Memories**
   ```javascript
   {
     type: "conversation",
     with: "player",
     summary: "Player offered to investigate thefts",
     importance: 80,
     timestamp: gameTime,
     emotionalContext: "grateful"
   }
   ```

2. **Event Memories**
   ```javascript
   {
     type: "event",
     description: "Tavern supplies went missing",
     importance: 90,
     timestamp: gameTime
   }
   ```

3. **Relationship Memories**
   ```javascript
   {
     type: "relationship_change",
     character: "player",
     delta: +10,
     reason: "Offered help with theft investigation"
   }
   ```

**Memory Decay:**

```javascript
relevance = importance * (1 - daysPassed / retentionDays)
```

- Memories fade over 30 in-game days
- Important memories last longer
- Never fully deleted, just less relevant

### 4. Relationship System

**File**: `src/ai/relationships/RelationshipManager.js`

**Relationship Levels:**

```
+75 to +100: Best Friend
+50 to +75:  Friend
+25 to +50:  Friendly
-25 to +25:  Neutral
-50 to -25:  Unfriendly
-75 to -50:  Enemy
-100 to -75: Nemesis
```

**How Relationships Change:**

```javascript
// Positive interactions
playerOfferedHelp() → +10
playerCompletedQuest() → +20
playerSharedInformation() → +5

// Negative interactions
playerLied() → -15
playerBetrayedTrust() → -30
playerInsulted() → -20
```

**Effects:**

- Higher relationship → More trust → Better dialogue
- NPCs share problems when relationship is high
- Quests unlock at certain thresholds
- Dialogue tone changes with relationship

---

## Character AI

### Personality-Driven Responses

Each NPC's personality affects:

1. **Dialogue Tone**
   - High friendliness → Warm, welcoming
   - High aggression → Confrontational, terse
   - High intelligence → Complex language
   - High caution → Suspicious questions

2. **Decision Making**
   - High honor → Refuses immoral requests
   - High greed → Demands payment
   - Low caution → Takes risks

3. **Memory Formation**
   - High intelligence → Remembers details
   - Low intelligence → Forgets faster

**Example: Same Question, Different NPCs**

*Player asks: "How are you?"*

**Mara (Friendly 85, Honorable 90):**
> "Oh, welcome! I'm doing well enough, though I've been worried about those supply thefts lately. How can I help you today?"

**Grok (Aggression 65, Friendliness 30):**
> "Busy. Got work to do. What do you want?"

**Thom (Intelligence 85, Cautious 80):**
> "Ah, the eternal question. Doing well as one can when times are uncertain. And yourself?"

### The 10 NPCs

1. **Mara** - Tavern Keeper
   - Friendly, honorable, worried about thefts

2. **Grok** - Blacksmith
   - Gruff, direct, high skill but low patience

3. **Sienna** - Herbalist
   - Friendly, knowledgeable, loves nature

4. **Brother Marcus** - Priest
   - Honorable, intelligent, listening ear

5. **Aldric** - Town Guard Captain
   - Cautious, dutiful, protective

6. **Elara** - Traveling Merchant
   - Intelligent, greedy, shrewd

7. **Finn** - Street Urchin
   - Intelligent, cautious, sees everything

8. **Thom** - "Drunk" Regular
   - High intelligence hidden, observant

9. **Lady Cordelia** - Noble
   - Honorable but burdened, complex

10. **Roderick** - Merchant Guild Master
    - Greedy, manipulative, low honor

**Relationship Web:**

```
Mara ←→ Grok (supplier relationship)
Mara ←→ Finn (she feeds him)
Aldric ←→ Cordelia (duty relationship)
Roderick ←X→ Grok (business rival)
Thom → [observes everyone]
```

---

## Dialogue System

### Multi-Turn Conversations

**Example Session:**

```
You: Hi Mara!
Mara: Good evening! Welcome to the Red Griffin. What brings you in tonight?

You: I heard there have been some problems lately?
Mara: *sighs* Yes... we've had supplies going missing. Wine, food, even some of my good silver.
      I don't know who could be doing this. The guards are investigating, but...

You: That sounds serious. Do you have any suspects?
Mara: Well, I hate to accuse anyone, but I've noticed some suspicious activity late at night.
      Finn - you know, the street kid - he's been hanging around more than usual. Though he's
      never caused trouble before...

You: Maybe I could help investigate?
Mara: *looks hopeful* Would you really? That would be wonderful! Aldric and his guards are
      stretched thin. If you could talk to some people, maybe find out what's happening...
      I'd be ever so grateful.

[Relationship +10 → Friendly (+55)]
[Quest Detected: "The Missing Supplies"]

You: I'll do my best. Who should I talk to first?
Mara: Finn would be a good start - he's usually near the market during the day. And maybe
      Thom, the regular here - he sees more than people think...

[Conversation continues for 20+ turns]
```

**Technical Details:**

- Each turn builds context
- No information is lost
- Personality stays consistent
- Relationships update in real-time
- Quests emerge naturally

### Context Management

**What's Tracked:**

```javascript
conversationContext = {
  turns: [
    { speaker: "player", text: "Hi Mara!", turn: 1 },
    { speaker: "mara", text: "Good evening...", turn: 2 },
    // ... up to 50 turns stored
  ],

  relationshipAtStart: 45,
  relationshipCurrent: 55,

  topicsDiscussed: [
    "greetings",
    "thefts",
    "suspects",
    "investigation_offer"
  ],

  questsTriggered: [
    "missing_supplies_investigation"
  ],

  emotionalArc: [
    "worried" → "hopeful" → "grateful"
  ]
}
```

---

## Game Master System

### The Chronicler

**Role**: AI Dungeon Master that narrates the world

**File**: `src/systems/GameMaster.js`

**What It Does:**

1. **Scene Setting**
   ```
   The Red Griffin Inn stands warm against the evening chill.
   Lantern light spills from windows onto rain-slicked cobblestones.
   Inside, Mara tends bar with practiced efficiency, though worry
   clouds her normally bright expression...
   ```

2. **Event Narration**
   ```
   As you enter, conversations hush. The guard captain Aldric
   looks up from his table, hand resting unconsciously on his
   sword hilt. Tension hangs thick in the air.
   ```

3. **Atmosphere**
   ```
   Night has fallen fully now. The market square lies empty,
   save for shadows that dance in the flickering torchlight.
   Somewhere in the darkness, you hear footsteps...
   ```

4. **NPC Orchestration**
   ```
   Finn appears from an alley, eyes darting nervously. He's
   carrying something wrapped in cloth, moving quickly toward
   the tavern back door...
   ```

**Technical Implementation:**

```javascript
class GameMaster {
  async generateNarration(event, context) {
    const prompt = `
      You are "The Chronicler", an AI dungeon master.

      Scene: ${context.location}
      Time: ${context.timeOfDay}
      Atmosphere: ${context.mood}
      Recent Events: ${context.recentActions}

      Narrate what happens next in 2-3 atmospheric sentences.
      Focus on mood, senses, and building tension.
    `;

    return await ollamaService.generate(prompt);
  }
}
```

**Features:**
- ✅ Atmospheric scene descriptions
- ✅ Event generation based on story state
- ✅ NPC action orchestration
- ✅ Adaptive pacing
- ✅ Story arc tracking (Acts 1-3)

---

## Replay System

### How It Works

**Recording:**

Every event is logged:

```javascript
{
  frame: 1234,
  type: "dialogue_turn",
  character: "mara",
  data: {
    playerSaid: "I'll help investigate",
    npcResponse: "Thank you so much!",
    relationshipDelta: +10,
    llmCallId: 42
  }
}
```

**LLM Calls Logged:**

```javascript
{
  callId: 42,
  seed: 1234567890,  // Deterministic!
  prompt: "You are Mara...",
  response: "Thank you so much!",
  model: "llama3.1:8b"
}
```

**File Size:**

```
30 minute session:
- Events: ~300 KB
- LLM calls: ~60 KB
- Checkpoints: ~100 KB
- Total: ~460 KB
- Gzipped: ~50 KB
```

**Compare to full state save: ~5 MB**

### Viewing Replays

**Three Tools:**

1. **Static Viewer** (`view-replay.js`)
   ```bash
   npm run replay:view 1
   ```
   - Shows event sequence
   - Displays LLM calls
   - Quick inspection

2. **Interactive Player** (`play-replay.js`)
   ```bash
   npm run replay:play 1
   ```
   - Pause/resume
   - Speed control
   - Step through events

3. **Auto Player** (`auto-replay.js`)
   ```bash
   npm run replay:auto 1 3  # 3x speed
   ```
   - Automated playback
   - Narrated output
   - Good for demos

**Use Cases:**
- Debug dialogue flow
- Inspect LLM decisions
- Verify determinism
- Create test cases
- Analyze player behavior

---

## How to Play

### Prerequisites

1. **Install Ollama**
   ```bash
   # Download from ollama.ai
   ollama pull llama3.1:8b
   ollama serve
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

### Play Now

**Option 1: Full Experience (RECOMMENDED)**
```bash
npm run play:gm
```
- 10 NPCs available
- Game Master narration
- All features enabled

**Option 2: Advanced Interactive**
```bash
node play-advanced.js
```
- Full NPC roster
- Interactive commands
- Quest tracking

**Option 3: Simple Version**
```bash
node play.js
```
- 3 NPCs (Mara, Grok, Finn)
- Core features
- Faster startup

### Commands

```
talk <name>     - Start conversation with NPC
npcs            - List all NPCs
info <name>     - Detailed NPC information
quests          - View quest log
relationships   - See all relationships
stats           - Session statistics
help            - Show all commands
exit            - Quit game
```

### During Conversation

```
- Type naturally to respond to NPC
- Type 'exit' or 'bye' to end conversation
- NPCs remember everything
- Relationships update in real-time
- Quests emerge from dialogue
```

### Example Session

```bash
$ npm run play:gm

Welcome to OllamaRPG!
10 NPCs available. Type 'npcs' to see them.
Type 'help' for commands.

> npcs

Available NPCs:
1. Mara - Tavern Keeper (Friendly, Honorable)
2. Grok - Blacksmith (Gruff, Skilled)
3. Finn - Street Urchin (Clever, Observant)
...

> talk mara

[Game Master]: The Red Griffin Inn glows warmly against
the evening chill. Mara looks up as you enter, concern
etched on her face...

Mara: Good evening! Welcome. I'm glad to see you...

You: Hi Mara, you look worried. What's wrong?
```

---

## Future Expansion (Text-Driven Focus)

### Phase 5: Deep Dialogue & Quest System ⭐ PRIORITY

**What's Needed:**
- Quest detection from natural dialogue
- Quest state tracking in NPC memory
- Quest completion affects relationships
- Group conversations (3+ characters)
- NPC gossip networks
- Context-aware dialogue enhancements

**Estimated**: 1-2 weeks
**Status**: Next priority

### Phase 6: Conceptual Location System

**What's Needed:**
- Named locations (not spatial grids)
- Time-based travel between locations
- NPC schedules and presence tracking
- Location-aware dialogue
- Environmental descriptions through GM
- Points of interest (examine command)

**Estimated**: 1 week
**Approach**: Conceptual, not pathfinding-based

### Phase 7: Backend System Integration

**What's Needed:**
- Inventory backend → LLM context
- NPCs reference player items naturally
- Combat outcomes → dialogue influence
- Stats unlock dialogue options
- Character progression through narrative
- Reputation system

**Estimated**: 1-2 weeks
**Philosophy**: Systems exist in background, emerge through text

### Phase 8: Content Expansion (Ongoing)

**What's Needed:**
- 10 more NPCs (target: 20 total)
- Interconnected quest chains
- Dynamic events propagating through NPC network
- More conceptual locations
- Richer backstories and relationships
- Secrets and mysteries to discover

**Estimated**: Ongoing

### Phase 9: Polish & Infrastructure

**What's Needed:**
- Save/load system
- Better CLI formatting
- Performance optimization
- Replay system enhancements
- Settings/configuration
- Testing and balancing

**Estimated**: 1-2 weeks

---

## Summary

### What OllamaRPG Is Today

✅ **Fully playable CLI RPG**
✅ **AI-driven dialogue with 10 NPCs**
✅ **Emergent storytelling**
✅ **Game Master narration**
✅ **Memory & relationships**
✅ **Replay analysis**
✅ **Autonomous gameplay mode**

### What Makes It Special

1. **Natural Conversations**: No dialogue trees, pure LLM
2. **Persistent World**: NPCs remember everything
3. **Emergent Quests**: Arise from natural dialogue
4. **Three-Layer AI**: Protagonist + NPCs + Game Master
5. **Deterministic**: Perfect replay capability
6. **Text-First**: Works NOW without graphics

### Development Philosophy

**"Dialogue First, Movement Later"**

- Prove core AI concept ✅
- Build unique gameplay ✅
- Add spatial navigation when needed
- Graphics are enhancement, not requirement

### Current Status

**Core Systems**: 85% complete
**Playability**: 100% (fully playable now)
**Foundation**: Solid for expansion
**Recommendation**: Continue development

---

## Documentation

### Essential Docs
- **README.md** - Project overview
- **START_HERE.md** - Quick start guide
- **FINAL_STATUS_SUMMARY.md** - Current status
- **FEATURE_STATUS.md** - Feature breakdown

### System Docs
- **GAME_MASTER_COMPLETE.md** - Game Master system
- **REPLAY_SYSTEM_COMPLETE.md** - Replay system
- **AUTONOMOUS_TEST_SUMMARY.md** - Autonomous gameplay

### Design Docs (Aspirational)
- **old/GAME_CONCEPT_AND_DESIGN.md** - Original vision
- **old/WEB_GAME_CONCEPT.md** - Future web version
- **old/ARCHITECTURE.md** - Planned architecture

---

**OllamaRPG: Where dialogue drives the story, and AI creates the magic.** ✨
