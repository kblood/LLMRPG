# UI System - Autonomous Mode Event Log Design

**Last Updated**: 2025-11-22
**Status**: Complete - Unified continuous event log

---

## Overview

The UI has been completely redesigned to display all autonomous mode events in a **single unified, continuous event log**. This represents a fundamental shift from the previous model where chronicler narrations were shown in a separate box that only displayed the most recent message.

Now all events flow into a **chronological, scrollable event log** where nothing is lost:

- ✅ All chronicler narrations (from game narrator system)
- ✅ Action decisions (what AI chose to do)
- ✅ Action results (outcomes with narrative)
- ✅ Combat encounters (enemies encountered)
- ✅ Combat results (victory/defeat with rewards)
- ✅ Conversations (dialogue with timestamps)
- ✅ Scene transitions (time passing, location changes)
- ✅ Quest updates (new quests, completions)

---

## Actions Now Visible in UI

### 1. Action Decision Phase
**Event**: `autonomous:action-decision`
- **What**: AI decides what action to take
- **Display**: Status bar shows `"Deciding: {reason}"`
- **Example**: `"Deciding: Explore the ancient ruins for treasure"`

### 2. Action Execution Phase
**Event**: `autonomous:action`
- **What**: Specific action chosen (conversation, travel, search, etc.)
- **Display**: Mode status or status bar updated
- **Example**: `"Talking to Mara"` or `"Searching the area"`

### 3. Action Result Phase
**Event**: `autonomous:action-result`
- **What**: Outcome of the action with narrative description
- **Display**:
  - GM narration panel shows full narrative
  - Status bar shows: `"Action completed: {action}"`
- **Example**:
  ```
  "You approach the tavern keeper Mara. She shares stories
   of recent merchant troubles in the region, mentioning
   bandits on the roads north."
  ```

### 4. Combat Encounter Phase
**Event**: `autonomous:combat-encounter`
- **What**: Combat begins with specific enemy list
- **Display**:
  - GM narration shows: `"⚔️ Combat! Encountered {enemies}"`
  - Status bar shows: `"Combat started: {enemies}"`
- **Example**: `"⚔️ Combat! Encountered Orc Warrior, Goblin"`

### 5. Combat Result Phase
**Event**: `autonomous:combat-result`
- **What**: Combat outcome with rewards or losses
- **Display**:
  - GM narration shows outcome narrative
  - Status bar shows rewards (victory) or losses (defeat)
- **Victory Example**:
  ```
  Status: "Combat victory! Gained 150 XP and 50 gold"
  Narration: "After a fierce battle, you stand victorious!
             The creatures fall before your blade..."
  ```
- **Defeat Example**:
  ```
  Status: "Combat defeated. Lost 10 gold."
  Narration: "The enemy was too strong... You fall and
            wake in a safe location, your health partially restored."
  ```

### 6. Conversation Phases
**Events**: `autonomous:conversation-start`, `autonomous:message`, `autonomous:conversation-end`
- **What**: Multi-turn dialogue with NPCs
- **Display**:
  - Conversation panel opens showing NPC info
  - Messages stream in as dialogue happens
  - Turn count increments with each exchange
- **Example**:
  ```
  Conversation with Mara (4 turns)
  Kael: "What news of the kingdom?"
  Mara: "Ah, there have been troubles with bandits recently..."
  Kael: "Interesting, where are they located?"
  Mara: "Mostly north, in the old ruins..."
  ```

---

## UI Display Locations

### Status Bar (Top Center)
Shows current action being taken and outcome:
- `"Deciding: Explore the mysterious tower"`
- `"Combat started: 3 bandits"`
- `"Combat victory! Gained 120 XP and 35 gold"`
- `"Action completed: Investigated the ruins"`

### GM Narration Panel (Center)
Shows detailed narrative descriptions:
- Action descriptions and outcomes
- Combat start and end narrations
- Rewards and consequences
- NPC dialogue

### Dialogue History Panel (If in Conversation)
Shows:
- Conversation turn count
- NPC name and dialogue
- Player responses
- Multi-turn conversation flow

### Character Panel (Left Sidebar)
Always visible showing:
- Character name and level
- HP, MP, Stamina bars
- XP progress
- Gold amount (updates after combat)
- Attributes and stats

### Quest Panel (Left Sidebar)
Shows active quests and progress:
- Quest objectives
- Completion status
- Related rewards

### Inventory Panel (Left Sidebar)
Shows inventory status:
- Item list
- Slot usage (e.g., 8/20)
- Weight (e.g., 35/100 lbs)
- Items gained from combat

---

## Event Data Structures

### autonomous:action-decision
```javascript
{
  type: "action_type",           // investigate, travel, search, rest, etc.
  reason: "string"               // Why this action was chosen
}
```

### autonomous:action-result
```javascript
{
  action: "string",              // Type of action performed
  narrative: "string",           // Detailed description of result
  location: "string"             // Where the action occurred
}
```

### autonomous:combat-encounter
```javascript
{
  enemies: [
    { name: "string", level: number },
    { name: "string", level: number },
    ...
  ],
  location: "string"             // Where combat occurred
}
```

### autonomous:combat-result
```javascript
{
  outcome: "victory" | "defeat", // Combat outcome
  narrative: "string",           // Story description of combat result
  xpGained: number,              // XP earned (if victory)
  goldGained: number,            // Gold earned (if victory)
  goldLost: number,              // Gold lost (if defeat)
  enemiesDefeated: number,       // Count of defeated enemies
  health: number                 // Player's remaining HP
}
```

---

## Timeline Example

Here's what you see during a few minutes of autonomous play:

```
[00:05] "Deciding: Gather information from locals"
[00:06] "Talking to Mara"
[00:07] [Conversation panel opens - Mara the Tavern Keeper]
        Kael: "Have you heard any news?"
        Mara: "Ah yes, there's been trouble with bandits..."
[00:15] [Conversation ended - 4 turns]
[00:16] "Deciding: Travel north to investigate"
[00:17] Action result shown: "You head north, finding evidence
         of recent bandit activity in the forest..."
[00:18] "⚔️ Combat! Encountered Bandit Captain, Bandit, Thug"
[00:25] "Combat victory! Gained 150 XP and 45 gold"
        Combat result: "After a fierce battle, you stand
        victorious over the bandits..."
[00:26] "Action completed: Search bandits' camp"
        Action result: "You find valuable items among
        their supplies..."
[00:27] "Deciding: Return to town and report success"
[00:28] "Talking to Mara"
[00:29] [Conversation panel opens]
        Kael: "The bandits have been dealt with"
        Mara: "Excellent! Here's your reward..."
```

---

## UI Components Updated

### Preload Bridge (electron/preload.js)
Added 5 new event listeners:
- `onAutonomousActionDecision` - Decision making
- `onAutonomousActionResult` - Action outcomes
- `onAutonomousCombatEncounter` - Combat start
- `onAutonomousCombatResult` - Combat end

### App Handlers (ui/app.js)
Added 5 new event handlers that:
- Update status bar with action info
- Display narratives in GM panel
- Show combat information with enemy list
- Display rewards after combat
- Handle both victory and defeat scenarios

---

## Visual Indicators

The UI uses visual symbols to indicate event types:
- **⚔️** Combat events
- **💬** Conversations
- **📖** Narration
- **⚡** Quests
- **🎒** Inventory
- **💰** Gold/rewards
- **✓** Completed actions
- **○** Pending actions

---

## Complete Action Flow

```
Decision Phase
    ↓
AI chooses action: investigate, travel, search, rest, etc.
    ↓ (Status: "Deciding: {reason}")
    ↓
Action Execution Phase
    ↓
Perform the action: move, talk, fight, etc.
    ↓
Result Phase
    ↓
Get outcome with narrative
    ↓ (GM panel shows narrative, Status: "Action completed")
    ↓
Loop back to Decision Phase
```

---

## What Was Missing Before

Before this update:
- ❌ Actions happened silently
- ❌ No feedback when AI made decisions
- ❌ Combat starts/results not visible
- ❌ Players didn't know what AI was doing
- ❌ Rewards appeared without context

After this update:
- ✅ All decisions visible in real-time
- ✅ Action narratives shown as they happen
- ✅ Combat encounters clearly displayed
- ✅ Rewards and losses shown with context
- ✅ Complete transparency into AI behavior

---

## For Developers

The UI now properly implements the complete autonomous event loop:

1. **Backend** (GameBackend.js) emits events via `_sendToUI()`
2. **IPC Channel** (main.js) forwards events to renderer
3. **Preload Bridge** (preload.js) exposes event listeners
4. **App Handlers** (app.js) process and display events
5. **UI Updates** in real-time as events occur

This architecture allows for:
- Complete action visibility
- Real-time narrative feedback
- Dynamic UI updates
- Easy addition of new event types

---

## Unified Event Log Architecture

**Key Feature**: All game events flow into a **single persistent, continuous event log** where nothing is lost.

### What Changed

**Before**:
- Chronicler narrations appeared in a separate "GM Narration" box that only showed the latest message
- All other events (actions, combat, dialogue) accumulated in the dialogue history
- Narrator commentary was only captured for replay, not shown to the player
- Result: Only the most recent narration was visible; all previous narrator voice was lost

**After**:
- All narrations are now captured and added to the unified event log
- The GM narration box is hidden in autonomous mode
- Everything flows chronologically into one scrollable log
- Players can scroll back to see complete narrator commentary alongside all other events
- Complete transparency into both the game world's events AND the narrator's reactions to them

### Event Types in the Log

Each event type has a unique emoji and color for visual scanning:

| Event Type | Emoji | Color | Source |
|-----------|-------|-------|--------|
| Chronicler Narration | 📖 | Red/Pink (italic) | GameMaster narrator system |
| Action Decision | 🤔 | Blue | Autonomous action loop decision phase |
| Action Result | 📖 | Orange | Action execution result with narrative |
| Combat Encounter | ⚔️ | Dark Red | Combat system when enemies appear |
| Combat Result | ⚔️ | Orange-Red | Combat conclusion with outcome |
| Reward/Treasure | 💰 | Yellow | XP/gold/item gains |
| Conversation Start | 💬 | Purple | NPC dialogue beginning |
| Quest Update | ⚡ | Light Blue | Quest created or completed |
| Conversation End | ─── | Gray | Separator marking end of dialogue |
| Scene Transition | ⏱️ | Cyan | Location/time changes |

### Event Log Flow Example

```
📖 The morning sun breaks over the tavern. A tense silence grips the common room.
🤔 Deciding: Investigate the tavern for rumors and opportunities
💬 Starting conversation with Mara
[Kael]: "What news of the kingdom?"
[Mara]: "Ah, there have been troubles with bandits recently..."
[Kael]: "Where are they located?"
[Mara]: "Mostly north, in the old ruins beyond the forest..."
─── Conversation ended (2 turns) ───
📖 The tavern keeper's words weigh heavy on your mind. Bandits? In the ruins?
🤔 Deciding: Travel north to investigate the bandit threat
⚔️ Combat! Encountered Bandit Scout, Bandit Archer
📖 The bandits emerge from behind fallen trees, weapons drawn!
⚔️ After a fierce battle, you stand victorious!
💰 Combat victory! Gained 150 XP and 75 gold
⚡ Quest Updated: "Defeat the Bandits"
🤔 Deciding: Return to town to report your success
💬 Starting conversation with Mara
[Kael]: "I have slain the bandits threatening your roads."
[Mara]: "By the gods! You are a true hero! Here, take this as reward..."
─── Conversation ended (2 turns) ───
⚡ Quest Completed: "Defeat the Bandits"
💰 Quest Reward: 500 gold, gained level!
```

### How Chronicler Messages Now Work

**Old System**:
- Internal `gm:narration` events → Captured only for replay logging → NOT sent to UI
- Result: Narrator voice only available in replay viewer, not during gameplay

**New System**:
- Internal `gm:narration` events → Captured for replay logging → ALSO sent to UI via `autonomous:chronicler`
- UI receives chronicler events → Logs them to event log with 📖 emoji and red/pink styling
- Result: Narrator voice is preserved and visible chronologically alongside all other events

The chronicler messages provide crucial context and atmosphere:
- World state descriptions
- Emotional tone setting
- Thematic commentary
- Environmental descriptions
- Plot development narration

By integrating these into the event log, players get the complete authored experience the game designer intended.

---

## Testing the Unified Event Log

To experience the unified event log with chronicler messages:

1. **Start the game**: `npm start`
2. **Begin autonomous mode**: Click "Start Autonomous Mode"
3. **Observe the event log flow**:
   - Watch for 📖 chronicler messages interspersed with other events
   - See how narrator commentary provides context for AI decisions
   - Notice action decisions (🤔) are followed by narrator reactions
   - Combat encounters show both the system description (⚔️) and narrator voice (📖)
4. **Scroll through history**: The entire chronological adventure is preserved
5. **Read the complete story**: You get both the mechanical events AND the literary narration

### Expected Event Log Pattern

When you see an event log entry like this, it indicates successful integration:

```
🤔 Deciding: Search the ruins for treasure
📖 You push through the ancient stone doorway. The air is thick with dust
   and the scent of age. Scattered coins and gems lie among the rubble.
💬 Starting conversation with Ancient Guardian
```

The 📖 chronicler message between the decision and the next event shows the narrator is now properly integrated!

---

## Implementation Details

### Files Modified

**Backend**:
- `electron/ipc/GameBackend.js` - Expose gm:narration to UI in autonomous mode

**IPC Bridge**:
- `electron/preload.js` - Add onAutonomousChronicler listener

**UI**:
- `ui/app.js` - Add chronicler listener and integrate into event log
- `ui/index.html` - Mark gm-narration as manual-only mode
- `ui/styles.css` - Add event-chronicler styling, hide gm-narration in autonomous mode

### Event Flow Diagram

```
GameMaster system
  ↓
Emits: gm:narration event
  ↓
GameBackend.setupEventListeners()
  ├→ Log to replay system
  └→ If autonomous mode: _sendToUI('autonomous:chronicler')
       ↓
       IPC channel
       ↓
       preload.js: onAutonomousChronicler
       ↓
       app.js: Listen for chronicler events
       ↓
       addEventToLog(📖 text, 'chronicler')
       ↓
       Rendered in dialogue-history with event-chronicler styling
```

---

**Status**: ✅ Complete - Unified Event Log System Implemented

### Achievements
- ✅ All chronicler narrations now visible in autonomous mode
- ✅ Unified event log removes the separate gm-narration box
- ✅ Event log is continuous and persistent across all gameplay
- ✅ No events are lost between conversations
- ✅ Complete adventure history with narrator voice visible and scrollable
- ✅ Real-time feedback system fully implemented
- ✅ Player sees complete story unfold - both mechanical events AND literary narration
- ✅ Emotional context and world atmosphere preserved through narrator commentary
