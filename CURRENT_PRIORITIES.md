# OllamaRPG - Current Development Priorities

**Last Updated**: November 19, 2025
**Design Philosophy**: Text-driven narrative gameplay - backend systems emerge through dialogue

---

## ✅ Roadmap Update Complete

The project roadmap has been updated to reflect the **text-driven design philosophy**:

- ❌ **Removed**: Graphical UI plans (Phaser, React panels, sprites, visual inventory)
- ❌ **Removed**: Spatial pathfinding and grid-based movement
- ✅ **Focused**: Backend systems that surface through LLM-generated narrative
- ✅ **Focused**: Deep dialogue mechanics and emergent storytelling

---

## 🎯 Next Priority Features

### Phase 5: Deep Dialogue & Quest System ⭐ **IN PROGRESS**

**Status**: Phase 5.1 Complete ✅ | Phase 5.2 Complete ✅ | Phase 5.3 Next  
**Time Spent**: 4 hours total

**Why This First:**
- Builds on existing dialogue strengths
- Tests LLM capabilities at scale
- Creates unique, emergent gameplay
- Pure narrative - no graphics needed
- Most impactful for player experience

**What to Build:**

#### 1. Quest Detection from Dialogue ✅ COMPLETE (2 hours)
```javascript
// NPCs naturally mention problems in conversation
Mara: "Someone's been stealing from my supplies..."

// System detects quest opportunity
→ Quest created: "The Tavern Thief"
→ Stored in backend (no UI panel)
→ NPCs reference quest state in future dialogue
```

**✅ Implementation Complete:**
- ✅ Quest detection patterns (keyword-based + LLM)
- ✅ Quest state tracking in NPC memory
- ✅ LLM prompts include active quests as context
- ✅ NPCs reference quest progress naturally
- ✅ Confidence scoring (60%+ threshold)
- ✅ Quest metadata tracking
- ✅ Test suite created and passing

**Files Created:**
- `src/systems/quest/QuestDetector.js`
- `src/systems/quest/QuestContextBuilder.js`
- `test-enhanced-quest-detection.js`
- `PHASE_5_PROGRESS.md`

**Test Results:**
- ✅ Natural quest discovery without explicit requests
- ✅ Quest context in follow-up conversations
- ✅ 80% detection confidence on test cases
- ✅ Multiple NPCs with quest awareness

#### 2. Group Conversations ✅ COMPLETE (2 hours)
```javascript
// Multiple NPCs in one conversation
> start group conversation with mara, aldric, finn

Mara: "I'm worried about the thefts..."
Aldric: "We're investigating, but no leads yet."
Finn: "I saw some suspicious people near the market."
Player: "Finn, tell us more about what you saw."

→ Natural group dynamics
→ Quest detection in group settings
→ Turn-taking suggestions
```

**✅ Implementation Complete:**
- ✅ GroupConversation system (3+ participants)
- ✅ ConversationManager for unified handling
- ✅ Smart turn-taking and speaker rotation
- ✅ Quest detection in group context
- ✅ Relationship updates for all participants
- ✅ Statistics and analytics

**Files Created:**
- `src/systems/dialogue/GroupConversation.js`
- `src/systems/dialogue/ConversationManager.js`
- `test-group-conversations.js`

**Test Results:**
- ✅ 4-participant conversation working
- ✅ 2 quests detected in group setting
- ✅ Turn balance maintained
- ✅ All relationships updated

#### 3. NPC Gossip Network (2-3 hours)
```javascript
// NPCs share information with each other
PlayerActions: helped Mara investigate thefts

// Later, with Grok:
Grok: "Heard you're helping Mara with her problem.
       Good. Someone needs to look into it."

// NPCs have opinions about your actions
Finn: *nervous* "People are saying you're asking
       questions about the thefts..."
```

**Implementation:**
- NPC memory sharing system
- Reputation tracking (per-NPC opinions)
- Gossip propagates through relationship network
- Events become "common knowledge" over time

#### 4. Enhanced Dialogue Context (2-3 hours)
```javascript
// Time affects NPC responses
Morning: "Good morning! You're up early."
Night: "Bit late to be wandering, isn't it?"

// Weather influences mood
Rainy: NPCs more gloomy, mention the weather
Sunny: NPCs more cheerful

// Recent events color dialogue
After combat: "You look hurt. What happened?"
After quest completion: "I heard about what you did!"
```

**Implementation:**
- Add time-of-day to world state
- Weather system (simple state)
- Recent event tracking
- Context injected into LLM prompts

**Total Estimated Time: 10-14 hours**

---

## 🎮 Phase 6: Conceptual Location System (Next After Phase 5)

**What to Build:**

#### 1. Named Locations (2-3 hours)
```javascript
Locations:
- Red Griffin Tavern
- Grok's Forge
- Town Market
- Temple of Light
- Forest Edge
- Noble Quarter

// Not spatial grids - just named places
// No pathfinding - just "travel to X"
```

#### 2. NPC Schedules (2-3 hours)
```javascript
Mara's Schedule:
- Morning (6-12): At tavern (working)
- Afternoon (12-18): At market (shopping)
- Evening (18-24): At tavern (busy time)
- Night (0-6): At home (sleeping)

// Players must find NPCs
> talk mara
"Mara isn't here right now. She's probably at the market."

> travel market
[Time passes: 15 minutes]
> talk mara
Mara: "Oh, hello! Fancy meeting you here!"
```

#### 3. Travel Time & Events (2-3 hours)
```javascript
> travel forest
[Traveling to Forest Edge... 20 minutes pass]

Game Master: As you walk through the forest path,
             you hear rustling in the bushes...

[Random encounter triggered]
[Time advanced by travel duration]
[World state updated]
```

**Total Estimated Time: 6-9 hours**

---

## 🔧 Phase 7: Backend System Integration (After Phases 5-6)

**What to Build:**

#### 1. Inventory → Dialogue Integration (3-4 hours)
```javascript
// Player inventory tracked in backend
PlayerInventory: {
  weapon: "Rusty Sword",
  armor: "Leather Jerkin",
  items: ["Health Potion", "Letter from Mara"]
}

// NPCs reference items naturally
Grok: "That sword's seen better days. Bring me
       some iron and I'll forge you a proper blade."

Aldric: "I see you're carrying a letter. From Mara,
         I presume? What does she say?"

// Items unlock dialogue options
[You have "Guard's Badge"]
> show badge
Shady NPC: "Ah! I didn't realize you were with
            the guard. My apologies..."
```

#### 2. Narrative Combat Integration (4-5 hours)
```javascript
// Combat happens, resolved by LLM
> attack bandit

Game Master: You draw your rusty sword and charge.
             The bandit is surprised but quick to
             react. He deflects your first strike
             and counters...

[Combat resolved based on stats + RNG]
[Outcome: Victory, took 15 damage]

// NPCs react to combat reputation
Aldric: "Heard you dealt with those bandits.
         Good work. The roads are safer now."

Mara: "You're hurt! Let me get you something
       for those wounds..."

// Injuries persist
[HP: 45/60 - bruised ribs]
Any NPC: "You're moving stiffly. Still hurt
          from that fight?"
```

#### 3. Stat-Influenced Dialogue (2-3 hours)
```javascript
// Player stats unlock options
PlayerStats: {
  intelligence: 15,
  charisma: 8,
  strength: 12
}

// High INT unlocks dialogue
[Intelligence 15+]
You: "That rune is Ancient Elvish, meaning 'sanctuary'"
Thom: *impressed* "You know your history. Impressive."

// Low CHA limits persuasion
> persuade guard
Guard: "Nice try, but I'm not convinced. Move along."
[Persuasion failed - Charisma too low]

// Attributes noticed by NPCs
Grok: "You've got a smith's hands. Done forge
       work before?"
[Strength 12+ detected]
```

**Total Estimated Time: 9-12 hours**

---

## 📊 Development Timeline

### Week 1: Deep Dialogue (Phase 5)
- Day 1-2: Quest detection and tracking
- Day 3-4: Group conversations
- Day 5: NPC gossip network
- Day 6: Enhanced context (time/weather/events)
- Day 7: Testing and polish

### Week 2: Locations (Phase 6)
- Day 1-2: Location system and travel
- Day 3-4: NPC schedules
- Day 5: Travel events and encounters
- Day 6-7: Testing and content creation

### Week 3: Backend Integration (Phase 7)
- Day 1-2: Inventory dialogue integration
- Day 3-4: Narrative combat system
- Day 5: Stat-influenced dialogue
- Day 6-7: Testing and balancing

**Total: 3 weeks to complete all priority features**

---

## 🎯 Success Criteria

### Phase 5 Complete When:
- ✅ Quests emerge from natural conversation
- ✅ NPCs track quest state and reference progress
- ✅ Group conversations work (3+ characters)
- ✅ NPCs gossip about player actions
- ✅ Time/weather affects dialogue

### Phase 6 Complete When:
- ✅ Multiple locations implemented
- ✅ NPCs follow schedules
- ✅ Player can travel between locations
- ✅ Travel takes time and triggers events
- ✅ Location affects available NPCs/dialogue

### Phase 7 Complete When:
- ✅ NPCs reference player inventory naturally
- ✅ Combat resolved through LLM narration
- ✅ Stats unlock/restrict dialogue options
- ✅ Character progression visible through NPC reactions
- ✅ Reputation system affects interactions

---

## 🚀 Getting Started

**Current Status: Phase 5.1 ✅ | Starting Phase 5.2**

### ✅ Completed (Phase 5.1)
1. ✅ Quest Detection Enhanced
   - Natural quest discovery
   - Confidence-based detection
   - Quest context in all dialogue
   - Test suite passing

### 🎯 Next Steps (Phase 5.3)

1. **Build Gossip Network** ⭐ START HERE (2-3 hours)
   - Add information sharing between NPCs
   - Create reputation tracking
   - Implement gossip propagation

3. **Enhanced Dialogue Context** (2-3 hours)
   - Add time-of-day awareness
   - Weather system integration
   - Recent event tracking

**Once Phase 5 completes, move to Phase 6 (Locations)**

---

## 💡 Design Notes

### Key Principles:
1. **Everything is text** - No visual UI elements
2. **Backend exists** - Systems track state invisibly
3. **LLM surfaces info** - NPCs mention mechanics naturally
4. **Player discovers** - Learn through conversation, not panels
5. **Emergence over explicit** - Quests arise, aren't assigned

### Example Flow:
```
Player talks to Mara → She mentions thefts (quest detected)
           ↓
Player investigates → Talks to Finn, Grok, Aldric
           ↓
NPCs gossip → "I heard you're asking about thefts"
           ↓
Player finds evidence → Returns to Mara
           ↓
Quest completes → Relationship +20, NPCs react
           ↓
New quests unlock → Story continues naturally
```

---

## 📝 Notes

- **No UI panels needed** - Everything through dialogue
- **Backend systems exist** - Just need LLM integration
- **Focus on narrative** - Mechanics serve the story
- **Test with Ollama** - Ensure LLM handles complexity
- **Iterate based on play** - Adjust based on what feels natural

---

**Ready to start Phase 5: Deep Dialogue & Quest System!**
