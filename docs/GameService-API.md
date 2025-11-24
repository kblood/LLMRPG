# GameService API Documentation

## Overview

`GameService` is a pure JavaScript service that encapsulates all core game logic without any Electron dependencies. It provides a clean, framework-agnostic API for game state management, actions, and queries.

## Design Principles

1. **Zero Electron Dependencies** - Can be used in any JavaScript environment
2. **Pure JavaScript Objects** - Returns plain objects, not JSON strings
3. **Stateless Where Possible** - Predictable behavior
4. **Complete State Snapshots** - Full game state available at any time
5. **Replay-Friendly** - Action history enables game replays

## Installation

```javascript
import { GameService } from './services/GameService.js';
import { GameSession } from './game/GameSession.js';

// Create a game session
const session = new GameSession({ seed: 12345 });

// Create the game service
const gameService = new GameService(session);

// Initialize
await gameService.initialize();
```

## Core API

### Initialization

#### `initialize()`
Initializes the game service and prepares it for use.

```javascript
await gameService.initialize();
```

**Returns:** `Promise<boolean>` - Success status

---

### Game Loop

#### `tick(deltaTime)`
Advances game time by the specified delta.

```javascript
const timeState = gameService.tick(15); // Advance 15 minutes

console.log(timeState);
// {
//   time: "08:15",
//   timeOfDay: "morning",
//   weather: "clear",
//   season: "autumn",
//   day: 1,
//   year: 1247
// }
```

**Parameters:**
- `deltaTime` (number) - Minutes to advance (default: 1)

**Returns:** Object with time and weather state

#### `pause()` / `resume()`
Pause or resume the game.

```javascript
gameService.pause();
// Game is paused, tick() calls will have no effect

gameService.resume();
// Game resumes
```

#### `isPaused()`
Check if game is paused.

```javascript
const paused = gameService.isPaused(); // boolean
```

---

### State Management

#### `getGameState()`
Returns a complete snapshot of the current game state. This is the **primary method** for getting all game data.

```javascript
const state = gameService.getGameState();

console.log(state);
// {
//   sessionId: "session_12345",
//   seed: 12345,
//   frame: 42,
//
//   time: {
//     gameTime: 480,
//     gameTimeString: "08:00",
//     timeOfDay: "morning",
//     day: 1,
//     season: "autumn",
//     year: 1247,
//     weather: "clear"
//   },
//
//   characters: {
//     protagonist: { ... },
//     npcs: [ ... ],
//     atLocation: [ ... ]
//   },
//
//   location: {
//     current: "millhaven_town",
//     discovered: [ ... ],
//     visited: [ ... ],
//     database: { ... }
//   },
//
//   quests: {
//     active: [ ... ],
//     stats: { ... }
//   },
//
//   dialogue: {
//     stats: { ... },
//     activeConversations: [ ... ]
//   },
//
//   system: {
//     paused: false,
//     autoDetectQuests: true,
//     realTimePlayed: 300
//   }
// }
```

**Returns:** `StateSnapshot` object (see StateSnapshot schema below)

#### `getStats()`
Get session statistics.

```javascript
const stats = gameService.getStats();
// Includes frame count, character count, dialogue stats, quest stats, etc.
```

#### `getStateSnapshots()`
Get all state snapshots taken during the session.

```javascript
const snapshots = gameService.getStateSnapshots();
// Array of snapshots taken at regular intervals
```

---

### Conversation Management

#### `startConversation(npcId, options)`
Start a conversation with an NPC.

```javascript
const conversation = await gameService.startConversation('blacksmith_01', {
  context: 'greeting'
});

console.log(conversation);
// {
//   id: "conv_123",
//   npc: { ... },
//   greeting: "Welcome to my forge!"
// }
```

**Parameters:**
- `npcId` (string) - NPC identifier
- `options` (Object) - Conversation options

**Returns:** `Promise<Object>` - Conversation data

#### `addConversationTurn(conversationId, text, options)`
Add a turn to an ongoing conversation.

```javascript
const response = await gameService.addConversationTurn(
  'conv_123',
  'I need a sword',
  {}
);

console.log(response);
// {
//   text: "I can forge you a fine blade...",
//   emotion: "interested"
// }
```

**Parameters:**
- `conversationId` (string) - Conversation ID
- `text` (string) - Player's input
- `options` (Object) - Additional options

**Returns:** `Promise<Object>` - NPC's response

#### `endConversation(conversationId)`
End a conversation.

```javascript
gameService.endConversation('conv_123');
```

#### `startGroupConversation(participantIds, options)`
Start a conversation with multiple NPCs.

```javascript
const convId = await gameService.startGroupConversation(
  ['merchant_01', 'guard_02', 'protagonist'],
  { topic: 'town_rumors' }
);
```

#### `addGroupConversationTurn(conversationId, speakerId, input, options)`
Add a turn to a group conversation.

```javascript
const response = await gameService.addGroupConversationTurn(
  convId,
  'merchant_01',
  'Have you heard the news?',
  {}
);
```

---

### Action Execution

#### `executeAction(action)`
Execute any player action. This is the **main method** for handling all gameplay actions.

```javascript
// Travel to a location
const result = await gameService.executeAction({
  type: 'travel',
  data: {
    locationId: 'ancient_ruins',
    // or locationName: 'Ancient Ruins'
  }
});

console.log(result);
// {
//   success: true,
//   location: { ... },
//   timeSpent: 30
// }
```

**Supported Action Types:**

##### `travel`
Travel to a location.

```javascript
await gameService.executeAction({
  type: 'travel',
  data: {
    locationId: 'forest_grove',
    // or locationName: 'Forest Grove'
  }
});
```

##### `investigate`
Investigate an area.

```javascript
await gameService.executeAction({
  type: 'investigate',
  data: {
    location: 'tavern'
  }
});
```

##### `rest`
Rest to restore health/energy.

```javascript
await gameService.executeAction({
  type: 'rest',
  data: {
    duration: 60 // minutes
  }
});
```

##### `search`
Search for items.

```javascript
await gameService.executeAction({
  type: 'search',
  data: {
    location: 'old_chest'
  }
});
```

##### `trade`
Trade with an NPC.

```javascript
await gameService.executeAction({
  type: 'trade',
  data: {
    npcId: 'merchant_01',
    action: 'buy',
    itemId: 'sword_01',
    quantity: 1
  }
});
```

##### `use_item`
Use an item from inventory.

```javascript
await gameService.executeAction({
  type: 'use_item',
  data: {
    itemId: 'potion_health'
  }
});
```

##### `equip`
Equip an item.

```javascript
await gameService.executeAction({
  type: 'equip',
  data: {
    itemId: 'sword_01'
  }
});
```

##### `unequip`
Unequip an item.

```javascript
await gameService.executeAction({
  type: 'unequip',
  data: {
    slot: 'weapon'
  }
});
```

**Returns:** `Promise<Object>` - Action result (structure varies by action type)

---

### Location Management

#### `getDiscoveredLocations()`
Get all locations the player has discovered.

```javascript
const locations = gameService.getDiscoveredLocations();
// [
//   { id: 'millhaven', name: 'Millhaven', type: 'town', ... },
//   { id: 'forest', name: 'Dark Forest', type: 'wilderness', ... }
// ]
```

#### `discoverLocation(locationId, locationName)`
Discover a new location.

```javascript
gameService.discoverLocation('hidden_cave', 'Hidden Cave');
```

#### `getLocation(locationId)`
Get location data by ID.

```javascript
const location = gameService.getLocation('millhaven');
// {
//   id: 'millhaven',
//   name: 'Millhaven',
//   description: '...',
//   type: 'town',
//   safe: true,
//   dangerLevel: 'safe'
// }
```

#### `resolveLocationByName(locationName)`
Find location ID by name (partial match supported).

```javascript
const id = gameService.resolveLocationByName('mill'); // Returns 'millhaven'
const id2 = gameService.resolveLocationByName('Millhaven'); // Also works
```

#### `isLocationAccessible(locationId)`
Check if a location is accessible (discovered).

```javascript
const accessible = gameService.isLocationAccessible('secret_dungeon');
// false - not yet discovered
```

#### `getCurrentLocation()`
Get current location data.

```javascript
const current = gameService.getCurrentLocation();
// { id: 'millhaven', name: 'Millhaven', ... }
```

---

### Character Management

#### `getCharacter(characterId)`
Get character by ID.

```javascript
const character = gameService.getCharacter('blacksmith_01');
// {
//   id: 'blacksmith_01',
//   name: 'Bjorn',
//   role: 'npc',
//   occupation: 'Blacksmith',
//   personality: { ... },
//   stats: { ... }
// }
```

#### `getAllCharacters()`
Get all characters (protagonist + NPCs).

```javascript
const all = gameService.getAllCharacters();
```

#### `getNPCs()`
Get all NPCs.

```javascript
const npcs = gameService.getNPCs();
```

#### `getCharactersAtLocation()`
Get characters at the current location.

```javascript
const nearby = gameService.getCharactersAtLocation();
// Only returns NPCs at the current location
```

#### `getProtagonist()`
Get the protagonist character.

```javascript
const player = gameService.getProtagonist();
// {
//   id: 'protagonist',
//   name: 'Arin',
//   role: 'protagonist',
//   stats: { ... }
// }
```

---

### Quest Management

#### `getActiveQuests()`
Get all active quests.

```javascript
const quests = gameService.getActiveQuests();
// [
//   {
//     id: 'quest_001',
//     title: 'Find the Lost Artifact',
//     status: 'active',
//     objectives: [ ... ]
//   }
// ]
```

#### `getQuestsByNPC(npcId)`
Get quests given by a specific NPC.

```javascript
const quests = gameService.getQuestsByNPC('elder_01');
```

#### `completeQuest(questId)`
Complete a quest.

```javascript
const result = await gameService.completeQuest('quest_001');
// Quest rewards are automatically applied
```

#### `checkForQuestInDialogue(npcId, dialogue, conversationId)`
Manually check if dialogue contains quest hints.

```javascript
const questId = await gameService.checkForQuestInDialogue(
  'elder_01',
  'Could you help me find my lost ring?',
  'conv_123'
);

if (questId) {
  console.log('Quest detected:', questId);
}
```

---

### Replay & Recovery

#### `getActionHistory()`
Get complete action history for replay.

```javascript
const history = gameService.getActionHistory();
// [
//   { type: 'start_conversation', npcId: '...', frame: 10, timestamp: ... },
//   { type: 'conversation_turn', text: '...', frame: 15, timestamp: ... },
//   { type: 'action_travel', data: { ... }, frame: 20, timestamp: ... }
// ]
```

#### `exportState()`
Export complete game state for saving.

```javascript
const saveData = gameService.exportState();
// {
//   gameState: { ... },
//   actionHistory: [ ... ],
//   snapshots: [ ... ],
//   sessionData: { ... }
// }

// Save to file/database
localStorage.setItem('savegame', JSON.stringify(saveData));
```

---

### Utility Methods

#### `getFrame()`
Get current frame number.

```javascript
const frame = gameService.getFrame(); // 42
```

#### `getSeed()`
Get random seed.

```javascript
const seed = gameService.getSeed(); // 12345
```

#### `getSessionId()`
Get session ID.

```javascript
const id = gameService.getSessionId(); // "session_12345"
```

#### `isInitialized()`
Check if service is initialized.

```javascript
const ready = gameService.isInitialized(); // true
```

---

## StateSnapshot Schema

The `StateSnapshot` object returned by `getGameState()` has the following structure:

```typescript
{
  // Core identifiers
  sessionId: string,
  seed: number,
  frame: number,

  // Time and environment
  time: {
    gameTime: number,           // Minutes since start
    gameTimeString: string,     // "HH:MM" format
    timeOfDay: string,          // morning/afternoon/evening/night
    day: number,
    season: string,             // spring/summer/autumn/winter
    year: number,
    weather: string             // clear/rainy/snowy/etc
  },

  // Characters
  characters: {
    protagonist: Character | null,
    npcs: Character[],
    atLocation: Character[]
  },

  // Location
  location: {
    current: string,            // Current location ID
    discovered: string[],       // Discovered location IDs
    visited: string[],          // Visited location IDs
    database: {                 // All location data
      [locationId]: LocationData
    }
  },

  // Quests
  quests: {
    active: Quest[],
    stats: QuestStats
  },

  // Dialogue
  dialogue: {
    stats: DialogueStats,
    activeConversations: Conversation[]
  },

  // System
  system: {
    paused: boolean,
    autoDetectQuests: boolean,
    realTimePlayed: number      // Seconds
  }
}
```

### Character Object Structure

```typescript
{
  id: string,
  name: string,
  role: string,                 // 'protagonist' or 'npc'
  backstory: string,
  occupation: string,
  age: number | null,
  location: string,             // Current location ID
  position: {
    x: number,
    y: number
  },
  personality: {
    friendliness: number,       // 0-100
    intelligence: number,
    caution: number,
    honor: number,
    greed: number,
    aggression: number
  },
  state: {
    emotionalState: string,
    currentGoal: string | null,
    inConversation: boolean
  },
  stats: {
    level: number,
    hp: number,
    maxHP: number,
    mp: number,
    maxMP: number,
    attack: number,
    defense: number,
    experience: number
  } | null,
  inventory: {
    gold: number,
    itemCount: number
  } | null
}
```

---

## Usage Examples

### Complete Game Loop Example

```javascript
import { GameService } from './services/GameService.js';
import { GameSession } from './game/GameSession.js';

// Initialize
const session = new GameSession({ seed: 12345 });
const gameService = new GameService(session);
await gameService.initialize();

// Main game loop
setInterval(() => {
  if (!gameService.isPaused()) {
    // Advance time by 1 minute
    const timeState = gameService.tick(1);

    // Get complete state for UI update
    const state = gameService.getGameState();
    updateUI(state);
  }
}, 1000); // Every second

// Player actions
async function handlePlayerAction(action) {
  try {
    const result = await gameService.executeAction(action);
    console.log('Action result:', result);

    // Update UI
    const state = gameService.getGameState();
    updateUI(state);
  } catch (error) {
    console.error('Action failed:', error);
  }
}

// Start conversation
async function talkToNPC(npcId) {
  const conv = await gameService.startConversation(npcId);
  console.log('NPC says:', conv.greeting);

  // Player responds
  const response = await gameService.addConversationTurn(
    conv.id,
    'Tell me about the town',
    {}
  );

  console.log('NPC responds:', response.text);
}
```

### Save/Load Example

```javascript
// Save game
function saveGame() {
  const saveData = gameService.exportState();
  localStorage.setItem('savegame', JSON.stringify(saveData));
  console.log('Game saved!');
}

// Load game
function loadGame() {
  const saveData = JSON.parse(localStorage.getItem('savegame'));

  // Create new session from saved data
  const session = GameSession.fromJSON(saveData.sessionData);
  const gameService = new GameService(session);
  await gameService.initialize();

  console.log('Game loaded!');
  return gameService;
}
```

### Action Queue Example

```javascript
// Queue multiple actions
const actionQueue = [
  { type: 'travel', data: { locationName: 'Ancient Ruins' } },
  { type: 'investigate', data: { location: 'ruins entrance' } },
  { type: 'search', data: { location: 'treasure chest' } },
  { type: 'rest', data: { duration: 60 } }
];

// Execute actions sequentially
for (const action of actionQueue) {
  const result = await gameService.executeAction(action);
  console.log(`Completed ${action.type}:`, result);

  // Wait a moment between actions
  await new Promise(resolve => setTimeout(resolve, 1000));
}
```

### Replay Example

```javascript
// Record a play session
const gameService = new GameService(session);
await gameService.initialize();

// ... play the game ...

// Export action history
const history = gameService.getActionHistory();
localStorage.setItem('replay', JSON.stringify(history));

// Later, replay the session
const replayData = JSON.parse(localStorage.getItem('replay'));

// Create new session with same seed
const replaySession = new GameSession({ seed: originalSeed });
const replayService = new GameService(replaySession);
await replayService.initialize();

// Replay actions
for (const action of replayData) {
  // Execute action at the recorded frame
  while (replayService.getFrame() < action.frame) {
    replayService.tick(1);
  }

  // Execute the recorded action
  if (action.type.startsWith('action_')) {
    await replayService.executeAction({
      type: action.type.replace('action_', ''),
      data: action.data
    });
  } else if (action.type === 'start_conversation') {
    await replayService.startConversation(action.npcId, action.options);
  }
  // ... handle other action types
}
```

---

## Best Practices

1. **Always check initialization**
   ```javascript
   if (!gameService.isInitialized()) {
     await gameService.initialize();
   }
   ```

2. **Use getGameState() for UI updates**
   ```javascript
   // Get complete state in one call
   const state = gameService.getGameState();
   updateUI(state);
   ```

3. **Handle errors gracefully**
   ```javascript
   try {
     await gameService.executeAction(action);
   } catch (error) {
     console.error('Action failed:', error.message);
     showErrorToUser(error.message);
   }
   ```

4. **Take snapshots before risky actions**
   ```javascript
   // Manual snapshot before important decision
   const snapshot = gameService.getGameState();

   // Try risky action
   const result = await gameService.executeAction(riskyAction);

   // Can restore from snapshot if needed
   ```

5. **Use action queue for AI/autonomous play**
   ```javascript
   const aiActions = generateAIActions(gameService.getGameState());
   for (const action of aiActions) {
     await gameService.executeAction(action);
   }
   ```

---

## Error Handling

All async methods may throw errors. Common error scenarios:

```javascript
// Service not initialized
try {
  gameService.tick(1);
} catch (error) {
  // Error: GameService not initialized. Call initialize() first.
}

// Invalid action
try {
  await gameService.executeAction({
    type: 'invalid_type',
    data: {}
  });
} catch (error) {
  // Error: Unknown action type: invalid_type
}

// Character not found
try {
  await gameService.startConversation('nonexistent_npc');
} catch (error) {
  // Error: Character nonexistent_npc not found
}

// Location not accessible
try {
  await gameService.executeAction({
    type: 'travel',
    data: { locationId: 'secret_location' }
  });
} catch (error) {
  // Error: Location not yet discovered: secret_location
}
```

---

## Integration with Existing Code

The GameService is designed to wrap the existing GameSession without modifying it:

```javascript
// Before (direct GameSession usage)
const session = new GameSession({ seed: 12345 });
session.tick(10);
const stats = session.getStats();

// After (with GameService)
const session = new GameSession({ seed: 12345 });
const gameService = new GameService(session);
await gameService.initialize();

gameService.tick(10);
const state = gameService.getGameState(); // Much richer data
```

You can still access the underlying GameSession if needed:

```javascript
const session = gameService.gameSession;
// Use session directly if necessary
```

---

## Future Extensions

The GameService is designed to be extended. Possible additions:

- Combat system integration
- Item crafting
- Party management
- Skill/ability system
- Event system
- Weather effects on gameplay
- Day/night cycle effects

To extend GameService:

```javascript
class ExtendedGameService extends GameService {
  async executeCombat(enemyIds) {
    // Custom combat logic
  }

  async craftItem(recipe) {
    // Custom crafting logic
  }
}
```

---

## Performance Considerations

- **State snapshots** are taken every 100 frames by default
- Only last 10 snapshots are kept in memory
- Character serialization is lightweight (no circular references)
- Action history grows over time - consider limiting or archiving

To adjust snapshot frequency:

```javascript
gameService.snapshotInterval = 200; // Take snapshot every 200 frames
```

---

## Testing

Example test setup:

```javascript
import { GameService } from './services/GameService.js';
import { GameSession } from './game/GameSession.js';

describe('GameService', () => {
  let gameService;

  beforeEach(async () => {
    const session = new GameSession({ seed: 12345 });
    gameService = new GameService(session);
    await gameService.initialize();
  });

  test('should advance time', () => {
    const before = gameService.getFrame();
    gameService.tick(10);
    const after = gameService.getFrame();
    expect(after).toBe(before + 1);
  });

  test('should get complete state', () => {
    const state = gameService.getGameState();
    expect(state).toHaveProperty('sessionId');
    expect(state).toHaveProperty('time');
    expect(state).toHaveProperty('characters');
  });
});
```

---

## License

This is part of the LLMRPG project.
