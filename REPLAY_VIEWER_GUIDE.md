# Replay Viewer Guide - Event Log & Inventory Tracking

**Last Updated**: 2025-11-21
**Status**: Complete with Inventory Tracking Support

---

## Overview

The OllamaRPG replay system now features a comprehensive event log viewer with full inventory tracking and event-driven UI updates. All inventory changes are captured and displayed in the replay viewer as formatted events.

---

## Features

### 1. Event-Driven Gameplay Reconstruction

The replay system now reconstructs the game UI state event-by-event, ensuring perfect fidelity to the original session:

- **Time Updates**: Clock updates ONLY when `time_changed` events occur
- **Inventory Changes**: Inventory panel updates show all items, gold, and capacity changes
- **UI Panels**: Character, NPC list, quests, and world all update automatically from gameState snapshots
- **No Auto-Initialization**: No automatic state setup means pure event-driven updates

### 2. Event Log Display

The replay viewer displays all important events in a formatted event log:

```
[Event Log]
─────────────────────────────────────────
💰 Gold gained: +25 (combat_reward)
📦 Found item: dragon_scale (combat_reward)
⚡ Action: Explored the forest - Searching for bandits
👥 Conversation began with Mara
"Let me tell you about the troubles we've had..."
─────────────────────────────────────────
```

### 3. Inventory Tracking

Full inventory state is captured with:

- **Item List**: Name, quantity, weight, rarity, type
- **Capacity**: Current/max weight and slot usage (e.g., 5/20 slots)
- **Gold**: Current gold amount
- **Inventory Events**: Changes logged as `inventory_changed` events

```javascript
// Logged inventory change example
{
  type: 'inventory_changed',
  data: {
    changeType: 'gold_gained',
    items: [{ gold: 25 }],
    reason: 'combat_reward'
  },
  gameState: {
    inventory: {
      items: [...],
      currentWeight: 45,
      maxWeight: 100,
      maxSlots: 20,
      gold: 150
    }
  }
}
```

---

## Inventory Change Events

### Supported Change Types

1. **gold_gained** - Player received gold
   - Display: `💰 Gold gained: +{amount} ({reason})`
   - Reasons: combat_reward, quest_reward, merchant_trade, etc.

2. **gold_lost** - Player lost gold
   - Display: `💰 Gold lost: -{amount} ({reason})`
   - Reasons: defeat, item_purchase, etc.

3. **item_found** - Item discovered (not yet added to inventory)
   - Display: `📦 Found item: {itemId} ({reason})`
   - Reasons: combat_reward, loot, quest_reward, etc.

4. **item_added** - Item added to inventory
   - Display: `📦 Item added: {name} x{quantity} ({reason})`
   - For future use with dynamic item systems

5. **item_removed** - Item removed from inventory
   - Display: `📦 Item removed: {name} x{quantity} ({reason})`
   - For future use with item consumption/trading

### Event Sources

Inventory events are emitted from:

- **CombatSystem.js** (lines 441-458)
  - `inventory:gold_gained` - When player wins combat
  - `inventory:item_found` - When loot is discovered
  - `combat:gold_lost` - When player is defeated

- **Future Systems** (when implemented)
  - Quest reward system
  - Trading/merchant system
  - Crafting system
  - Item consumption

---

## Replay Viewer Controls

### Playback Controls

```
▶️  Play      - Start playback at current frame
⏸️  Pause     - Pause playback
⏹️  Stop      - Stop playback and reset
⏮️  Prev      - Jump to previous frame
⏭️  Next      - Jump to next frame
```

### Speed Controls

```
0.5x - Slow motion
1x   - Normal speed
2x   - Fast playback
5x   - Very fast playback
```

### Timeline Scrubber

```
[====●════════] 45/100  (Current Frame / Total Frames)
```

- Click anywhere on the slider to jump to that frame
- Checkpoint markers show major events
- Visual feedback shows current position

### Information Display

```
📼 Replay File: autonomous_game_2025-11-21_1234567890.json
Events: 15 | LLM Calls: 3 | Frame: 45 / 100
```

---

## Game UI Panels

The following panels update from gameState snapshots during replay:

### Character Panel (⚔️ Character)
- Character name and level
- Current HP / Max HP (with bar)
- Stamina / Max Stamina (with bar)
- Magic / Max Magic (with bar)
- XP Progress (with bar)
- Gold amount

### Inventory Panel (🎒 Inventory)
- **Slots**: Current/Max (e.g., 5/20)
- **Weight**: Current/Max (e.g., 45/100)
- **Items List**:
  - Item name
  - Quantity (x5)
  - Rarity (if available)

### NPC Panel (📜 Characters)
- List of nearby NPCs
- Relationship status with each

### Quest Panel (⚡ Active Quests)
- Quest title
- Objectives
- Progress

### World Panel (🗺️ World Map)
- Discovered locations
- Current location

---

## Event Type Categories

### Displayed in Event Log

- **dialogue_line**: NPC speech with speaker name
- **conversation_started**: Conversation began
- **conversation_ended**: Conversation ended (turn count)
- **action_performed**: Action taken (description)
- **combat_encounter**: Combat started (enemies listed)
- **loot_obtained**: Item found with quantity
- **level_up**: Level increased
- **inventory_changed**: Inventory modification (items/gold)
- **quest_started**: Quest accepted
- **quest_objective_completed**: Objective progress

### Hidden from Event Log (But Update UI)

- **time_changed**: Updates clock/time of day (not shown in log)
- **position_changed**: Updates character position

---

## Implementation Details

### Architecture

```
GameBackend (electron/ipc/GameBackend.js)
  └─ _logInventoryChange()
     └─ replayLogger.logEvent()
        └─ event + gameState snapshot

Replay Viewer (ui/app.js)
  ├─ displayReplayEvent()  [formats and shows events]
  ├─ updateGameUIFromState()  [updates panels from gameState]
  └─ updateInventoryDisplay()  [renders inventory panel]

Event Sources
  ├─ CombatSystem.js  [emits inventory:* events]
  └─ GameBackend listeners  [wire to logging]
```

### Game State Snapshots

Each inventory_changed event includes a gameState snapshot containing:

```javascript
{
  player: { name, level, hp, maxHp, mp, maxMp, xp, gold, stats },
  time: { time, timeOfDay, weather, season, day, year },
  quests: [ { id, title, status, objectives, stage } ],
  world: { cities, dungeons, landmarks, specialLocations },
  npcs: [ { id, name, role, relationship } ],
  inventory: {
    items: [ { itemId, name, quantity, weight, rarity, type } ],
    currentWeight,
    maxWeight,
    maxSlots,
    gold
  },
  frame: sessionFrame
}
```

### File Structure

**Replay File Format** (.json.gz):

```json
{
  "header": {
    "version": "1.0.0",
    "timestamp": 1234567890,
    "gameSeed": 99999,
    "frameCount": 100,
    "eventCount": 25,
    "llmCallCount": 8,
    "checkpointCount": 5
  },
  "initialState": { /* gameState */ },
  "events": [
    {
      "frame": 10,
      "type": "inventory_changed",
      "actor": "system",
      "data": { "changeType": "gold_gained", "items": [{ "gold": 25 }], "reason": "combat_reward" },
      "gameState": { /* full game state */ },
      "timestamp": 1234567890
    },
    // ... more events
  ],
  "llmCalls": [ /* LLM prompts and responses */ ],
  "checkpoints": [ /* periodic state snapshots */ ]
}
```

---

## Usage Examples

### Viewing a Replay

1. Start the game: `npm start`
2. Run autonomous mode or load from main menu
3. Click "📼 View Replays" button
4. Select a replay from the list
5. Use controls to browse the session

### Analyzing Inventory Changes

1. Open replay viewer
2. Look for 💰 and 📦 icons in event log
3. Scroll through to see all inventory modifications
4. Check left panel for final inventory state
5. Use frame scrubber to jump between major inventory events

### Testing Inventory Capture

```javascript
// In autonomous mode:
// 1. Combat encounter → gold gained → inventory:gold_gained event
// 2. Loot dropped → item found → inventory:item_found event
// 3. Replay shows both in event log and left panel inventory
```

---

## Event Format Examples

### Gold Gained Event

```
Event Type: inventory_changed
Data: {
  changeType: "gold_gained",
  items: [{ gold: 50 }],
  reason: "combat_reward"
}
Display: 💰 Gold gained: +50 (combat_reward)
```

### Item Found Event

```
Event Type: inventory_changed
Data: {
  changeType: "item_found",
  items: [{ itemId: "dragon_scale" }],
  reason: "combat_reward"
}
Display: 📦 Found item: dragon_scale (combat_reward)
```

### Action Event

```
Event Type: action_performed
Data: {
  action: "investigate",
  description: "Searched the forest for clues",
  location: "Forest Clearing"
}
Display: ⚡ Action: investigate - Searched the forest for clues
```

### Dialogue Event

```
Event Type: dialogue_line
Data: {
  speakerId: "Mara",
  text: "Welcome, friend! What brings you to our tavern?"
}
Display: Mara: "Welcome, friend! What brings you to our tavern?"
```

---

## Technical Details

### Event Logging Flow

```
1. Inventory change occurs (e.g., gold gained from combat)
2. CombatSystem emits event: inventory:gold_gained
3. GameBackend event listener catches it
4. Calls _logInventoryChange(changeType, items, reason)
5. _logInventoryChange() captures gameState snapshot
6. replayLogger.logEvent() writes inventory_changed event
7. Event stored with gameState snapshot
```

### UI Update Flow (During Replay)

```
1. Replay playback advance to next frame
2. Find events at that frame
3. For each event:
   a. If not time_changed: display in event log
   b. If has gameState: call updateGameUIFromState()
   c. Update inventory panel from gameState.inventory
4. Render updated UI panels
```

### Time Update Behavior

```
Old behavior:
- Initialize with full gameState at replay start
- Time shows at start regardless of events

New behavior:
- Initialize with blank/default time ('--:--')
- Time updates ONLY when time_changed event occurs
- All UI updates driven by events
- Perfect replay fidelity
```

---

## Integration Points

### For Future Systems

When you add new inventory-modifying systems, follow this pattern:

```javascript
// In your system (e.g., MerchantSystem.js):
this.eventBus.emit('inventory:gold_spent', {
  character: 'Kael',
  amount: 100,
  reason: 'merchant_trade'
});

// In GameBackend (setupEventListeners):
this.eventBus.on('inventory:gold_spent', ({ character, amount, reason }) => {
  this._logInventoryChange('gold_spent', [{ gold: amount }], reason);
});
```

### Supported Change Types (Extensible)

- `gold_gained` ✅
- `gold_lost` ✅
- `item_found` ✅
- `item_added` (prepared)
- `item_removed` (prepared)
- `item_equipped` (prepared)
- `item_consumed` (prepared)

---

## Debugging

### Check Event Logging

```javascript
// In console during game:
console.log('Checking replayLogger:', this.replayLogger);
console.log('Events logged:', this.replayLogger.events.length);
```

### View Raw Event

```javascript
// In replay viewer:
const event = replay.events[frameNumber];
console.log('Event:', event);
console.log('GameState:', event.gameState);
console.log('Inventory:', event.gameState.inventory);
```

### Test Inventory Capture

1. Run autonomous mode
2. Trigger combat encounter
3. View replay
4. Check 💰 icon in event log
5. Verify inventory panel updated

---

## Future Enhancements

### Planned Features

1. **Inventory Comparison**
   - Before/after inventory state view
   - Highlight changes

2. **Event Filtering**
   - Show only inventory events
   - Filter by change type
   - Search by item name

3. **Statistics**
   - Total gold gained/lost
   - Items found/used
   - XP gained

4. **Timeline Markers**
   - Jump to first combat
   - Jump to first inventory change
   - Jump to level ups

5. **Export**
   - Save filtered event log as text
   - Export inventory history as CSV

---

## Summary

The replay system now provides:
- ✅ Complete event logging including inventory changes
- ✅ Event-driven UI reconstruction (no auto-initialization)
- ✅ Formatted event display with icons and descriptions
- ✅ Full game state capture with each event
- ✅ Inventory panel with real-time updates during replay
- ✅ Time updates tied to time_changed events only

This enables perfect replay fidelity and comprehensive gameplay analysis!

---

**For detailed code references, see:**
- `electron/ipc/GameBackend.js` - Event logging (lines 1452-1477, 233-247)
- `src/systems/combat/CombatSystem.js` - Event emissions (lines 441-458)
- `ui/app.js` - Event display (lines 1101-1119) and UI updates (lines 1255-1298)
- `ui/index.html` - Inventory panel (lines 93-109)
