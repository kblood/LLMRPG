# Replay System Enhancements

## Overview
The replay system has been enhanced to capture all new gameplay features including time progression, economy, quests, combat, and world exploration.

## New Event Types

### Time & Weather Events

#### `time_changed`
Logged every time the game advances.
```javascript
{
  time: "14:23",
  timeOfDay: "afternoon",
  weather: "rainy",
  season: "autumn",
  day: 5,
  year: 1247,
  minutesAdvanced: 15
}
```

### Economy Events

#### `gold_changed`
Logged whenever a character gains or loses gold.
```javascript
{
  characterId: "player",
  characterName: "Kael",
  amount: 50,
  operation: "gain", // or "lose"
  reason: "Combat victory",
  newTotal: 125
}
```

#### `loot_obtained`
Logged when items are acquired.
```javascript
{
  items: [
    { itemId: "health_potion", quantity: 1 }
  ],
  source: "combat" // or "search", "quest", etc.
}
```

### Quest Events

#### `quest_started`
Logged when a quest is created/accepted.
```javascript
{
  questId: "quest_123456",
  title: "Echoes of the Forgotten",
  description: "Investigate strange occurrences...",
  objectives: [
    "Speak with at least 3 different villagers",
    "Learn about the dreams and missing memories"
  ]
}
```

#### `quest_objective_completed`
Logged when a quest objective is completed.
```javascript
{
  questId: "quest_123456",
  objectiveId: "obj_1",
  description: "Speak with at least 3 different villagers"
}
```

#### `quest_completed`
Logged when a quest is finished.
```javascript
{
  questId: "quest_123456",
  title: "Echoes of the Forgotten",
  rewards: {
    gold: 150,
    experience: 200,
    items: ["ancient_medallion"]
  }
}
```

### Combat Events

#### `combat_encounter` (Enhanced)
Now includes more detailed information.
```javascript
{
  location: "The Thornwood",
  enemies: [
    { name: "Bandit", level: 3 },
    { name: "Wolf", level: 2 }
  ],
  outcome: "victory", // or "defeat", "fled"
  rounds: 8,
  rewards: {
    experience: 75,
    gold: 30,
    loot: [...]
  }
}
```

#### `level_up`
Logged when a character levels up.
```javascript
{
  characterName: "Kael",
  newLevel: 4,
  statsRestored: true
}
```

### Action Events (Already Existed, Enhanced)

#### `action_performed`
Logged for all non-conversation actions.
```javascript
{
  actionType: "investigate",
  reason: "Looking for clues about the quest",
  timeAdvanced: 20,
  result: {
    narration: "You search the area carefully...",
    findings: ["old_journal", "torn_map"]
  }
}
```

## Event Logging Locations

### GameBackend.js
- **Time Events**: Logged in `_runAutonomousLoop()` after each `tick()`
- **Gold Events**: Logged via `_logGoldChange()` helper method
- **Combat Rewards**: Logged after combat results
- **Quest Events**: Logged via EventBus listeners in `setupEventListeners()`
- **Level Up**: Logged via EventBus listener

### Event Flow
1. Game systems emit events via EventBus
2. GameBackend listens to EventBus events
3. Events are logged to ReplayLogger with frame number
4. ReplayLogger stores events in memory
5. On autonomous mode stop, replay is saved to file

## Replay File Structure

```javascript
{
  header: {
    version: "1.0.0",
    timestamp: 1700000000000,
    gameSeed: 12345,
    frameCount: 1500,
    eventCount: 250,
    llmCallCount: 45
  },
  initialState: {...},
  events: [
    {
      frame: 10,
      type: "time_changed",
      data: {...},
      characterId: "system",
      timestamp: 1700000010000
    },
    {
      frame: 50,
      type: "gold_changed",
      data: {...},
      characterId: "player",
      timestamp: 1700000050000
    },
    ...
  ],
  llmCalls: [...],
  checkpoints: [...]
}
```

## Backward Compatibility

All existing replay functionality remains intact:
- `game_start`
- `conversation_started`
- `dialogue_line`
- `conversation_ended`
- `combat_encounter` (enhanced, not breaking)

New event types are additive and don't affect existing replays.

## Future Enhancements

### Planned
- Weather change events (when weather transitions)
- Season change events (when seasons advance)
- Trading events (completed transactions)
- Rest completion events (HP restored)
- Travel completion events (location changes)

### Replay Viewer UI
The replay viewer UI (`ui/app.js`) will be enhanced to:
- Display time/weather/season timeline
- Show gold changes with running total
- Highlight quest progress
- Visualize combat rounds
- Color-code different event types
- Add filtering by event category

## Statistics Tracking

Future enhancement will add session statistics to replay headers:
- Total conversations
- Total combat encounters
- Quests completed
- Gold earned/spent
- Enemies defeated
- Locations visited
- Deaths
- Items traded

This will enable replay analysis and session summaries.
