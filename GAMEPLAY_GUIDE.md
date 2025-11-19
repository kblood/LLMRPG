# OllamaRPG - Gameplay Guide

**AI-Powered Text-Based RPG with Procedural Generation**

---

## Quick Start

```bash
# Install dependencies
npm install

# Play the game
npm run play:gen

# Run tests
npm run test:e2e
```

---

## What You Get

### 🌍 Procedurally Generated Worlds

Every playthrough creates a unique world:
- **Starting Town**: Fully detailed with industry, landmarks, and atmosphere
- **NPCs**: 3-7 characters with unique personalities, knowledge, and concerns
- **Locations**: 5-10 discoverable places with progressive detail
- **Main Quest**: Generated storyline with objectives and guidance
- **Grid-Based Map**: Realistic travel times between locations

### 🗨️ Intelligent NPCs

NPCs are context-aware and knowledgeable:
- **Specialties**: Each NPC knows about specific topics (milling, trade routes, etc.)
- **Rumors**: NPCs have heard things and will share them
- **Quest Awareness**: NPCs know about quests they're involved in
- **Relationship Tracking**: NPCs remember their interactions with you
- **Contextual Dialogue**: Responses reference their knowledge and concerns

### 📜 Dynamic Quests

Quests progress automatically through gameplay:
- **"Talk to NPC"** objectives complete when you start conversations
- **"Visit Location"** objectives complete when you travel there
- **"Learn about X"** objectives complete when topics are discussed
- **Dynamic Guidance**: Next steps update as you progress
- **Rewards**: Experience, reputation, items (tracked internally)

### 🗺️ Progressive Locations

Locations expand as you explore:
- **SPARSE**: Initial state - name, distance, rumors
- **PARTIAL**: Description and points of interest (when asked about)
- **FULL**: Complete details with NPCs, items, secrets (when visited)

---

## Available Commands

### Navigation & Observation

```
look
  Shows current location with:
  - Location description
  - NPCs present (with moods and concerns)
  - Active quests with progress
  - Nearby locations with travel times and rumors

locations
  Shows all discovered locations with:
  - Visit status
  - Direction and distance from current location
  - Travel time estimate
  - Known information/rumors

travel <location name>
  Travel to a discovered location
  - GM narrates the journey
  - Location automatically expands to FULL detail
  - Quest objectives may auto-complete
  Examples:
    travel Whisperwood Forest
    travel Old Quarry
```

### People & Quests

```
npcs
  Shows all NPCs with context:
  - NPCs at your current location (detailed)
  - NPCs nearby (brief)
  - Quest-related NPCs
  - Knowledge specialties for each NPC

talk <npc name>
  Start a conversation with an NPC
  - NPC uses their knowledge in responses
  - References their current concern
  - Provides quest guidance if relevant
  - Quest objectives may auto-complete
  Examples:
    talk Gareth
    talk Old Tam

quests
  Shows quest information:
  - Active quests with progress percentage
  - Objectives with completion status
  - Next steps and hints
  - Completed quests
```

### Character

```
status
  View your character:
  - Name and role
  - Current location
  - Mood
  - Personality traits

inventory
  View items you possess
  (Tracked internally, surfaces through narrative)
```

### System

```
help
  Show available commands

quit / exit
  Exit the game
```

### Natural Language

You can also type naturally:
```
> Tell me about the grain thefts
> What do you know about the forest?
> Where can I find clues?
```

The Game Master will interpret your intent and respond accordingly!

---

## Example Gameplay Session

### 1. Starting the Game

```
$ npm run play:gen

╔══════════════════════════════════════════════════════════════════╗
║              OLLAMA RPG - PROCEDURALLY GENERATED WORLD          ║
╚══════════════════════════════════════════════════════════════════╝

Enter your character name: Aldric

🌍 Generating world... This may take a moment.

[World generation happens - ~10 seconds]

✅ World generation complete!

═══════════════════════════════════════════════════════════════════
           WELCOME TO THE LANDS OF MILLHAVEN
═══════════════════════════════════════════════════════════════════

You are Aldric, Adventurer.
You find yourself in Millhaven, a small mill town.

A quaint mill town beside a winding river, known for grain
production and its industrious townsfolk.

─────────────────────────────────────────────────────────────────────

📜 The Shadow Trade
   Uncover the conspiracy behind the grain thefts plaguing Millhaven

Type "help" for available commands, "look" to examine your surroundings.

>
```

### 2. Exploring Your Surroundings

```
> look

══════════════════════════════════════════════════════════════════════
📍 MILLHAVEN
══════════════════════════════════════════════════════════════════════

A quaint mill town beside a winding river, known for grain
production and its industrious townsfolk.

👥 PEOPLE HERE:
  • Gareth (Master Miller) - worried - Missing grain shipments
  • Lyssa (Grain Merchant) - calculating - Protecting profit margins
  • Old Tam (Bridge Keeper) - friendly - Worried about strangers

📜 ACTIVE QUESTS:
  📋 The Shadow Trade (side)
     ├─ [ ] Talk to Gareth about the missing grain
     ├─ [ ] Investigate suspicious activity around the mill
     └─ [ ] Question townsfolk who might have information

🗺️  NEARBY LOCATIONS:
  North: Whisperwood Forest (1 hr 36 min) - Strange lights at night
  East: Old Granite Quarry (2 hr 24 min) - Abandoned mine
  South: Crossroads Inn (4 hr) - Meeting place for travelers

══════════════════════════════════════════════════════════════════════

>
```

### 3. Talking to NPCs

```
> talk Gareth

──────────────────────────────────────────────────────────────────────
💬 Talking to Gareth
   Master Miller - worried
   Knows about: Milling, Grain trade, Old Granite Quarry
──────────────────────────────────────────────────────────────────────

Gareth looks up from his ledger, his brow furrowed with concern.
"Ah, a new face. Times are troubled, friend. The grain shipments...
they keep disappearing. Twenty years I've run this mill, never seen
the like."

Type your response, or "back" to end conversation:

> Tell me about the grain thefts

Gareth sighs heavily. "It's organized, I'm certain of it. Not just
random bandits - someone knows the schedules, the routes. The last
three shipments to Thornvale, all vanished without a trace. Lyssa
won't admit it, but her profit margins are suffering too."

> What do you know about the Old Quarry?

"The Old Granite Quarry? Abandoned for near a decade now. Strange
place - folks say they've seen lights there at night, same as in the
Whisperwood. I don't put much stock in rumors, but... something
doesn't sit right."

> back

You step away from Gareth.

──────────────────────────────────────────────────────────────────────
✓ QUEST OBJECTIVE COMPLETED
──────────────────────────────────────────────────────────────────────
Talk to Gareth about the missing grain

💡 Hint: Investigate suspicious activity around the mill

>
```

### 4. Checking Quest Progress

```
> quests

📜 QUESTS

ACTIVE:

📋 The Shadow Trade [33% complete]
   Uncover the conspiracy behind the grain thefts plaguing Millhaven

   Objectives:
   1. [✓] Talk to Gareth about the missing grain
   2. [ ] Investigate suspicious activity around the mill
   3. [ ] Question townsfolk who might have information

   Next Steps:
   → Go to: The Mill
   💡 Investigate suspicious activity around the mill

>
```

### 5. Traveling to New Locations

```
> travel Whisperwood Forest

──────────────────────────────────────────────────────────────────────
🚶 Traveling to Whisperwood Forest...
   (1 hr 36 min journey)
──────────────────────────────────────────────────────────────────────

You follow the northern road as it winds through farmland, gradually
giving way to dense woodland. The ancient trees create a canopy of
twisted branches overhead, and mist clings to the forest floor.

[Expanding location details...]

✨ You discover more about Whisperwood Forest...

✅ Arrived at Whisperwood Forest

══════════════════════════════════════════════════════════════════════
📍 WHISPERWOOD FOREST
══════════════════════════════════════════════════════════════════════

A primeval forest of towering oaks and dense underbrush. The air
is thick with mist and the scent of moss. An eerie silence pervades,
broken only by the occasional rustle in the undergrowth.

📜 ACTIVE QUESTS:
  📋 The Shadow Trade (side)
     ├─ [✓] Talk to Gareth about the missing grain
     ├─ [ ] Investigate suspicious activity around the mill
     └─ [ ] Question townsfolk who might have information

🗺️  NEARBY LOCATIONS:
  Southwest: Millhaven (1 hr 36 min)
  Southeast: Old Granite Quarry (1 hr 47 min)

══════════════════════════════════════════════════════════════════════

>
```

---

## Tips for Playing

### 1. Talk to Everyone

NPCs have valuable information based on their knowledge:
- Ask specialists about their expertise
- NPCs will share rumors they've heard
- Quest-related NPCs provide guidance

### 2. Pay Attention to Context

The `look` command shows:
- NPCs' current moods and concerns
- Quest progress and next steps
- Nearby locations with hints

### 3. Let Quests Progress Naturally

Objectives complete automatically:
- Just talk to the NPC
- Just visit the location
- No need to manually mark objectives

### 4. Explore Discovered Locations

Use the `locations` command to see where you can go:
- Travel times help you plan
- Rumors give hints about what you'll find

### 5. Use Natural Language

Don't just use commands - talk naturally:
- "Tell me about the forest"
- "What's happening with the grain?"
- "Where should I investigate?"

---

## Understanding the System

### Quest Progression

Quests use an event-driven system:

1. **You talk to Gareth**
2. EventBus emits `'dialogue:started'`
3. QuestProgressionManager checks objectives
4. Finds: "Talk to Gareth about the missing grain"
5. Completes objective automatically
6. Updates quest guidance to next objective

### Location Expansion

Locations expand progressively:

1. **SPARSE** (initial): "Strange lights seen at night"
2. **PARTIAL** (asked about): Description + points of interest
3. **FULL** (visited): Complete details, NPCs, secrets

### NPC Knowledge

NPCs use DialogueContextBuilder:

1. Context includes NPC's specialties
2. Context includes relevant quests
3. Context includes rumors they've heard
4. GM generates response using all context
5. NPC naturally references their knowledge

---

## Testing Your Changes

```bash
# Test world generation
npm run test:worldgen

# Test UI commands
npm run test:commands

# Test NPC context integration
npm run test:phase1c

# Test full gameplay flow
npm run test:e2e
```

All tests should pass ✅

---

## Troubleshooting

### "Cannot connect to Ollama"

Make sure Ollama is running:
```bash
ollama serve
```

### "Slow dialogue responses"

- Use a faster model in `src/services/OllamaService.js`
- Reduce `maxTokens` setting
- Increase `temperature` for faster generation

### "Quest objectives not completing"

- Check console for EventBus logs
- Verify NPC names match exactly
- Ensure QuestProgressionManager is initialized

### "Location expansion fails"

- This is optional and will gracefully fail
- Game continues normally even if expansion doesn't work
- Check Ollama connection

---

## What Makes This Special

### 1. True Procedural Generation

Every world is unique:
- No hand-crafted content
- GM generates everything from scratch
- Deterministic (same seed = same world)

### 2. Intelligent NPCs

NPCs aren't scripted:
- They know things
- They reference their knowledge
- They're aware of quests
- Dialogue is contextual

### 3. Emergent Gameplay

Quests progress naturally:
- No "quest turn-in" buttons
- Objectives detect your actions
- Guidance updates automatically
- Feels organic, not mechanical

### 4. Progressive Detail

World expands as you explore:
- Starts sparse
- Grows detailed when relevant
- Efficient (only generates what's needed)

### 5. Pure Text, Pure Imagination

No graphics to constrain vision:
- Rich descriptions
- Your imagination fills the gaps
- Focus on narrative

---

## Advanced Usage

### Custom World Seeds

```javascript
// In play-generated-world.js
const worldGen = new WorldGenerator(gm, {
  seed: 12345  // Same seed = same world
});
```

### Adjusting Difficulty

```javascript
const world = await worldGen.generateWorld({
  playerName: playerName,
  difficulty: 'hard'  // 'easy', 'normal', 'hard'
});
```

### Changing AI Model

```javascript
// In src/services/OllamaService.js
{
  model: 'mistral',  // or 'llama2', 'neural-chat', etc.
  temperature: 0.8,
  maxTokens: 300
}
```

---

## Future Enhancements (Phase 2)

- Dynamic location generation during gameplay
- NPC schedules and routines
- Weather and time systems
- Random encounters
- Procedural dungeons
- Side quest generation from conversations
- World state changes over time

---

**Have fun exploring AI-generated worlds!** 🎮✨

**Questions?** Check `IMPLEMENTATION_STATUS.md` for technical details.
