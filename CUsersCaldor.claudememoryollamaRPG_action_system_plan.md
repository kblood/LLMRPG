# OllamaRPG Action System Implementation Plan

## Overview
Transform OllamaRPG from a dialogue-only game into a full RPG with time progression, actions, economy, and combat.

## 1. Time Progression System ⏰

### Current State
- GameSession has `tick()`, `getTimeOfDay()`, `getGameTimeString()` methods
- Time exists but never advances (tick() never called)
- UI shows "00:00 Evening" statically

### Implementation
**A. Fix Time Progression**
- Call `session.tick()` in autonomous loop (advance ~1-5 minutes per action)
- Send time updates to UI via IPC events
- Update UI to display real time

**B. Add Weather & Seasons**
- Add to GameSession:
  ```javascript
  weather: 'clear|rainy|foggy|snowy|stormy'
  season: 'spring|summer|autumn|winter'
  year: number (starting year)
  ```
- Weather changes based on time/season
- Affects NPC behavior and available actions

**C. UI Updates**
- Display: "14:23 Afternoon | Rainy | Autumn, Year 1"
- Update every game tick

---

## 2. Action System 🎬

### Problem
- Only conversations happen, no physical actions
- "Investigate office" quest can't be completed
- Characters can't move, search, or interact with environment

### Implementation
**A. Define Action Types**
```javascript
{
  CONVERSATION: 'conversation',
  MOVE: 'move',
  INVESTIGATE: 'investigate',
  SEARCH: 'search',
  REST: 'rest',
  TRADE: 'trade',
  COMBAT: 'combat',
  CRAFT: 'craft'
}
```

**B. Protagonist Action Selection**
- AI chooses between: talk to NPC, investigate location, search for items, rest, travel
- LLM prompt: "Given your quest objectives, what action do you take?"
- Returns: `{actionType, target, reasoning}`

**C. Action Execution**
- `GameBackend._executeAction(action)` dispatcher
- Each action type has execution logic
- Actions advance time appropriately
- Generate narration for each action

**D. Quest Action Integration**
- Parse quest objectives to identify required actions
- "Investigate X" → INVESTIGATE action
- "Find Y" → SEARCH action  
- "Talk to Z" → CONVERSATION action

---

## 3. Quest Action Execution 🔍

### Implementation
**A. Quest Objective Types**
```javascript
{
  type: 'talk_to_npc',
  type: 'investigate_location',
  type: 'find_item',
  type: 'travel_to',
  type: 'defeat_enemy'
}
```

**B. Action Handlers**

**INVESTIGATE:**
```javascript
async _executeInvestigate(protagonist, location) {
  // Generate what they find based on quest context
  const findings = await gameMaster.generateInvestigationResults(location, activeQuests)
  // Add to protagonist memory
  // Update quest progress
  // Advance time (30 minutes)
  // Generate narration
}
```

**SEARCH:**
```javascript
async _executeSearch(protagonist, area) {
  // Check for items/clues
  // Add to inventory if found
  // Update quest objectives
  // Advance time (15 minutes)
}
```

**C. Quest Progress Tracking**
- Check completed actions against objectives
- Auto-advance quest stages
- Notify player of progress

---

## 4. Economy System 💰

### Implementation
**A. Currency**
- Add to Character: `gold: number`
- Protagonist starts with 50-100 gold
- Display in UI character panel

**B. Item Values**
```javascript
{
  name: 'Health Potion',
  value: 25,
  type: 'consumable'
}
```

**C. Trading Action**
```javascript
async _executeTrade(protagonist, npc, item, quantity) {
  // Check if NPC offers this service
  // Check protagonist has enough gold
  // Transfer item and gold
  // Generate transaction narration
}
```

**D. NPC Inventory**
- Merchants have stock based on role
- Blacksmith: weapons, armor
- Healer: potions, antidotes
- Merchant: rare goods

**E. Quest Rewards**
- Quests give gold + items
- Display in quest panel

---

## 5. Combat System ⚔️

### Implementation
**A. Hostile NPCs/Creatures**
```javascript
{
  id: 'bandit_1',
  name: 'Bandit',
  hostile: true,
  level: 3,
  stats: CharacterStats,
  location: 'dangerous_area'
}
```

**B. Spawn System**
- Generate enemies in dungeons/dangerous areas
- Probability based on danger level
- More enemies at night

**C. Combat Encounter**
```javascript
async _executeCombat(protagonist, enemy) {
  // Turn-based AI combat
  // Use CharacterStats for calculations
  // Apply abilities
  // Generate round-by-round narration
  // Winner gets XP/loot
  // Loser gets consequences
}
```

**D. Combat AI**
- Protagonist decides: attack, defend, use ability, flee
- Enemy decides based on personality
- LLM generates combat narration

**E. Consequences**
- Defeat: lose gold, return to safe location
- Victory: gain XP, gold, possible items
- Update quest progress if relevant

---

## 6. Scene Transitions 🎬

### Problem
- Conversations end abruptly
- No explanation for why protagonist moves to next NPC
- Feels disjointed

### Implementation
**A. Transition Narration**
```javascript
async _generateTransition(fromAction, toAction) {
  const prompt = `
  Previous action: ${fromAction.type} with ${fromAction.target}
  Next action: ${toAction.type} with ${toAction.target}
  Time passed: ${timeDelta}
  
  Generate 2-3 sentences of transition narration explaining:
  - Why the conversation/action ended
  - What the protagonist does between actions
  - Why they approach the next target
  `
  return await gameMaster.generateTransition(...)
}
```

**B. Display Transitions**
- Show in dialogue panel with special styling
- "After learning about the thieves, Kael thanks Mara and steps outside. The afternoon rain has stopped, and he spots Grok working at the forge across the square..."

**C. Time Jumps**
- If significant time passes: "Several hours later..."
- "As night falls..."
- "The next morning..."

---

## Implementation Order

### Phase 1: Time & Actions (Critical Foundation)
1. Fix time progression - call tick() in autonomous loop
2. Send time updates to UI
3. Add weather/season system
4. Create action selection system
5. Implement basic actions (investigate, search, rest)

### Phase 2: Quest Actions & Economy
6. Parse quest objectives into actionable types
7. Execute quest-related actions
8. Add gold system to characters
9. Implement trading action
10. Create NPC inventory system

### Phase 3: Combat & Polish
11. Create hostile NPC/creature system
12. Spawn enemies in dangerous locations
13. Implement combat execution
14. Add transition narration system
15. Polish scene transitions

---

## File Changes Required

### Core Systems
- `src/game/GameSession.js` - Add weather, season, year
- `electron/ipc/GameBackend.js` - Action system, tick() calls
- `src/systems/GameMaster.js` - Action narration generation

### New Files
- `src/systems/actions/ActionSystem.js` - Action selection & execution
- `src/systems/actions/QuestActionResolver.js` - Quest → Action mapping
- `src/systems/combat/CombatSystem.js` - Combat encounters
- `src/systems/economy/TradeSystem.js` - Trading logic

### UI Updates
- `ui/app.js` - Time display, action narration
- `ui/index.html` - Economy display (gold)
- Character panel updates

---

## Success Criteria

✅ Time advances during gameplay
✅ Weather and seasons visible and changing
✅ Protagonist performs non-dialogue actions
✅ Quest actions can be completed (investigate, find, etc.)
✅ Protagonist has gold and can trade
✅ Combat encounters occur in dangerous areas
✅ Smooth transitions between scenes with narration
✅ Game feels like a living, breathing RPG world
