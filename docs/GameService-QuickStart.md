# GameService Quick Start Guide

## 5-Minute Setup

### 1. Import and Initialize

```javascript
import { GameService } from './src/services/GameService.js';
import { GameSession } from './src/game/GameSession.js';

// Create session
const session = new GameSession({ seed: 12345 });

// Create service
const gameService = new GameService(session);

// Initialize
await gameService.initialize();
```

### 2. Get Game State

```javascript
// Get complete game state (use this for UI updates)
const state = gameService.getGameState();

console.log(state.time.gameTimeString);  // "08:00"
console.log(state.weather);               // "clear"
console.log(state.characters.npcs);       // Array of NPCs
console.log(state.location.current);      // Current location ID
```

### 3. Advance Time

```javascript
// Advance by 15 minutes
gameService.tick(15);

// Advance by 1 hour
gameService.tick(60);
```

### 4. Talk to NPCs

```javascript
// Start conversation
const conv = await gameService.startConversation('blacksmith_01');
console.log(conv.greeting);

// Add turn
const response = await gameService.addConversationTurn(
  conv.id,
  'Tell me about the town',
  {}
);
console.log(response.text);

// End conversation
gameService.endConversation(conv.id);
```

### 5. Execute Actions

```javascript
// Travel
await gameService.executeAction({
  type: 'travel',
  data: { locationId: 'ancient_ruins' }
});

// Investigate
await gameService.executeAction({
  type: 'investigate',
  data: { location: 'tavern' }
});

// Rest
await gameService.executeAction({
  type: 'rest',
  data: { duration: 60 }
});
```

### 6. Query Locations

```javascript
// Get discovered locations
const locations = gameService.getDiscoveredLocations();

// Get current location
const current = gameService.getCurrentLocation();

// Discover new location
gameService.discoverLocation('cave_id', 'Hidden Cave');
```

### 7. Query Characters

```javascript
// Get protagonist
const player = gameService.getProtagonist();

// Get all NPCs
const npcs = gameService.getNPCs();

// Get NPCs at current location
const nearby = gameService.getCharactersAtLocation();

// Get specific character
const npc = gameService.getCharacter('blacksmith_01');
```

### 8. Manage Quests

```javascript
// Get active quests
const quests = gameService.getActiveQuests();

// Get quests by NPC
const npcQuests = gameService.getQuestsByNPC('elder_01');

// Complete quest
await gameService.completeQuest('quest_001');
```

### 9. Save/Load

```javascript
// Save game
const saveData = gameService.exportState();
localStorage.setItem('savegame', JSON.stringify(saveData));

// Load game (create new session from save data)
const loadData = JSON.parse(localStorage.getItem('savegame'));
const session = GameSession.fromJSON(loadData.sessionData);
const gameService = new GameService(session);
await gameService.initialize();
```

### 10. Pause/Resume

```javascript
// Pause
gameService.pause();

// Check if paused
if (gameService.isPaused()) {
  console.log('Game is paused');
}

// Resume
gameService.resume();
```

## Common Patterns

### Game Loop

```javascript
// Update every second
setInterval(() => {
  if (!gameService.isPaused()) {
    gameService.tick(1);
    const state = gameService.getGameState();
    updateUI(state);
  }
}, 1000);
```

### Action Handler

```javascript
async function handleAction(actionType, actionData) {
  try {
    const result = await gameService.executeAction({
      type: actionType,
      data: actionData
    });
    console.log('Success:', result);
    return result;
  } catch (error) {
    console.error('Failed:', error.message);
    throw error;
  }
}
```

### Conversation Flow

```javascript
async function talkToNPC(npcId) {
  // Start
  const conv = await gameService.startConversation(npcId);
  displayMessage(conv.greeting);

  // Loop for multiple turns
  while (playerWantsToContinue) {
    const playerInput = await getPlayerInput();

    const response = await gameService.addConversationTurn(
      conv.id,
      playerInput,
      {}
    );

    displayMessage(response.text);
  }

  // End
  gameService.endConversation(conv.id);
}
```

### Location Explorer

```javascript
function showAvailableLocations() {
  const locations = gameService.getDiscoveredLocations();

  locations.forEach(loc => {
    console.log(`${loc.name} - ${loc.type}`);
    console.log(`  Danger: ${loc.dangerLevel}`);
    console.log(`  Accessible: ${gameService.isLocationAccessible(loc.id)}`);
  });
}

async function travelTo(locationName) {
  const locationId = gameService.resolveLocationByName(locationName);

  if (!locationId) {
    console.error('Location not found');
    return;
  }

  if (!gameService.isLocationAccessible(locationId)) {
    console.error('Location not yet discovered');
    return;
  }

  await gameService.executeAction({
    type: 'travel',
    data: { locationId }
  });

  console.log('Arrived at', locationName);
}
```

## Action Types Reference

| Action Type | Required Data | Description |
|-------------|---------------|-------------|
| `travel` | `locationId` or `locationName` | Travel to a location |
| `investigate` | `location` (string) | Investigate an area |
| `rest` | `duration` (minutes) | Rest to restore HP/MP |
| `search` | `location` (string) | Search for items |
| `trade` | `npcId`, `action`, `itemId`, `quantity` | Trade with NPC |
| `use_item` | `itemId` | Use an item |
| `equip` | `itemId` | Equip an item |
| `unequip` | `slot` | Unequip from slot |

## State Structure Quick Reference

```javascript
state = {
  sessionId: string,
  seed: number,
  frame: number,

  time: {
    gameTime: number,
    gameTimeString: string,    // "HH:MM"
    timeOfDay: string,         // morning/afternoon/evening/night
    day: number,
    season: string,
    year: number,
    weather: string
  },

  characters: {
    protagonist: Character,
    npcs: Character[],
    atLocation: Character[]
  },

  location: {
    current: string,
    discovered: string[],
    visited: string[],
    database: { [id]: LocationData }
  },

  quests: {
    active: Quest[],
    stats: QuestStats
  },

  dialogue: {
    stats: DialogueStats,
    activeConversations: Conversation[]
  },

  system: {
    paused: boolean,
    autoDetectQuests: boolean,
    realTimePlayed: number
  }
}
```

## Error Handling

```javascript
try {
  await gameService.executeAction(action);
} catch (error) {
  if (error.message.includes('not initialized')) {
    await gameService.initialize();
  } else if (error.message.includes('not found')) {
    console.error('Invalid target');
  } else if (error.message.includes('not yet discovered')) {
    console.error('Cannot access location');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Tips

1. **Always initialize before use**
   ```javascript
   await gameService.initialize();
   ```

2. **Use getGameState() for UI**
   ```javascript
   const state = gameService.getGameState();
   updateUI(state);
   ```

3. **Check paused state in game loop**
   ```javascript
   if (!gameService.isPaused()) {
     gameService.tick(1);
   }
   ```

4. **Handle async actions with await**
   ```javascript
   await gameService.executeAction(action);
   ```

5. **Use try-catch for error handling**
   ```javascript
   try {
     await gameService.executeAction(action);
   } catch (error) {
     console.error(error.message);
   }
   ```

## Complete Example

```javascript
import { GameService } from './src/services/GameService.js';
import { GameSession } from './src/game/GameSession.js';

async function playGame() {
  // Setup
  const session = new GameSession({ seed: 12345 });
  const gameService = new GameService(session);
  await gameService.initialize();

  // Start game loop
  setInterval(() => {
    if (!gameService.isPaused()) {
      gameService.tick(1);
    }
  }, 1000);

  // Get initial state
  let state = gameService.getGameState();
  console.log('Game started at', state.time.gameTimeString);

  // Travel somewhere
  const locations = gameService.getDiscoveredLocations();
  if (locations.length > 1) {
    await gameService.executeAction({
      type: 'travel',
      data: { locationId: locations[1].id }
    });
  }

  // Talk to NPC
  const npcs = gameService.getCharactersAtLocation();
  if (npcs.length > 0) {
    const conv = await gameService.startConversation(npcs[0].id);
    console.log('NPC says:', conv.greeting);

    const response = await gameService.addConversationTurn(
      conv.id,
      'Hello!',
      {}
    );
    console.log('NPC responds:', response.text);

    gameService.endConversation(conv.id);
  }

  // Rest
  await gameService.executeAction({
    type: 'rest',
    data: { duration: 60 }
  });

  // Get final state
  state = gameService.getGameState();
  console.log('Game time now:', state.time.gameTimeString);

  // Save
  const saveData = gameService.exportState();
  console.log('Game saved!');
}

playGame().catch(console.error);
```

## More Information

- **Full API Documentation**: `docs/GameService-API.md`
- **Overview & Guide**: `docs/GameService-README.md`
- **Complete Examples**: `examples/game-service-usage.js`

## Need Help?

1. Check the API documentation for detailed method signatures
2. Run the example file to see all features in action
3. Review error messages - they're descriptive and helpful
4. Look at the GameService source code - it's well-commented

---

**Quick Start complete! You're ready to use GameService.**
