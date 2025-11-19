# World-Building System 🗺️

The Chronicler (GameMaster) now has full world-building powers including:
- **Hierarchical locations** (locations within locations)
- **Grid-based positioning** with distance calculations
- **Dynamic content generation** using LLM
- **Combat narration**

---

## 📍 Hierarchical Location System

Locations can now contain other locations, creating a natural hierarchy:

```
Realm (Region)
├── Kingdom (Region)
│   ├── Capital City (Town)
│   │   ├── Castle District (Area)
│   │   │   ├── Throne Room (Room)
│   │   │   └── Armory (Room)
│   │   ├── Market District (Area)
│   │   │   ├── Blacksmith Shop (Building)
│   │   │   └── General Store (Building)
│   │   └── Slums (Area)
│   ├── Forest (Wilderness)
│   │   ├── Bandit Camp (Area)
│   │   └── Druid Grove (Area)
│   └── Mountains (Wilderness)
│       └── Dragon's Lair (Dungeon)
```

### Location Properties

```javascript
{
  id: 'throne_room',
  name: 'Royal Throne Room',
  type: 'room',

  // Coordinates (grid system)
  coordinates: { x: 50, y: 30, z: 2 }, // z = floor/elevation

  // Hierarchy
  parentLocation: 'castle_district', // ID of parent
  childLocations: ['royal_treasury', 'secret_passage'], // IDs of children
  scale: 0.1, // Size: 0.1=room, 1=building, 10=area, 100=town, 1000=region

  // ... other properties
}
```

---

## 🎲 Grid & Distance System

### Coordinate System

Locations have X, Y, Z coordinates:
- **X, Y**: Horizontal position on world map
- **Z**: Elevation/floor (0=ground, 1=first floor, -1=basement)
- **Scale**: Size multiplier determining how much space the location occupies

### Distance Calculation

```javascript
// Calculate straight-line distance
const distance = location1.distanceTo(location2);

// Calculate Manhattan distance (grid-based)
const gridDistance = location1.manhattanDistanceTo(location2);

// Find locations within radius
const nearby = world.getLocationsWithinRadius('town_square', 50);
// Returns: [{ location, distance }, ...]

// Calculate distance between any two locations
const dist = world.calculateDistance('inn', 'blacksmith');

// Find nearest location of type
const nearest = world.findNearestLocationType('player_loc', 'shop');
// Returns: { location, distance }
```

### Distance Meanings

| Grid Units | Description | Example |
|-----------|-------------|---------|
| 0-5 | Same building/area | Different rooms in an inn |
| 5-20 | Nearby | Buildings in same town district |
| 20-50 | Same region | Different districts in a town |
| 50-200 | Different regions | Town to nearby forest |
| 200+ | Distant | Different kingdoms |

---

## 🏗️ Working with Hierarchies

### Creating Hierarchical Locations

```javascript
// Create parent location (town)
const town = new Location({
  id: 'riverside_town',
  name: 'Riverside',
  type: 'area',
  x: 100,
  y: 100,
  z: 0,
  scale: 100 // Large area
});

world.addLocation(town);

// Create child location (inn)
const inn = new Location({
  id: 'riverside_inn',
  name: 'The Sleeping Dragon Inn',
  type: 'building',
  x: 105, // Slightly offset from town center
  y: 102,
  z: 0,
  parentLocation: 'riverside_town',
  scale: 1 // Building size
});

world.addLocation(inn);

// Establish relationship
town.addChildLocation(inn.id);

// Or use WorldManager helper
world.addChildToParent('riverside_town', 'riverside_inn');
```

### Navigating Hierarchies

```javascript
// Get top-level locations (continents, regions)
const topLevel = world.getTopLevelLocations();

// Get child locations of a parent
const townBuildings = world.getChildLocations('riverside_town');

// Get full hierarchy chain
const hierarchy = world.getLocationHierarchy('throne_room');
// Returns: [realm, kingdom, capital, castle_district, throne_room]

// Get location path as string
const path = world.getLocationPath('throne_room');
// Returns: "Realm > Kingdom > Capital City > Castle District > Throne Room"

// Check if location is top-level
if (location.isTopLevel()) {
  console.log('This is a region or continent');
}

// Check if location has children
if (location.childLocations.size > 0) {
  console.log('This location contains other locations');
}
```

### Navigation Commands

When in a location with children, players can:

```
go <direction>     - Use exits to move to connected locations
enter <name>       - Enter a child location
exit/leave         - Go to parent location
explore            - List child locations available
```

Example:
```
You are in: Riverside
  Available: The Sleeping Dragon Inn, Blacksmith's Forge, Market Square

> enter inn
You enter The Sleeping Dragon Inn.

> exit
You leave the inn and return to Riverside.
```

---

## 🎨 Dynamic Content Generation

The Chronicler can generate content on-the-fly using the LLM.

### Creating Dynamic Locations

```javascript
// In GameMaster instance with extensions
const location = await gameMaster.createDynamicLocation({
  requestedBy: 'player',
  purpose: 'Player asked about a hidden cave',
  nearLocation: 'forest_path', // Place near this location
  suggestedName: 'Hidden Cave',
  suggestedType: 'dungeon',
  playerLevel: 5,
  currentWeather: 'rainy',
  currentSeason: 'autumn'
});

// LLM generates:
// - Name, description, atmosphere
// - Environmental properties (dark, dangerous, cold)
// - Suggested encounters (enemies)
// - Suggested loot (items)
// - Coordinates (near specified location)

console.log(location.name); // "Whispering Cavern"
console.log(location.description); // "A damp cave hidden behind moss..."
```

### Creating Dynamic Enemies

```javascript
const enemy = await gameMaster.createDynamicEnemy({
  playerLevel: 5,
  location: 'dark_forest',
  difficulty: 'hard', // easy, medium, hard, boss
  suggestedType: 'undead warrior',
  quantity: 1
});

// LLM generates:
// - Name and description
// - Level-appropriate stats
// - Equipment
// - Abilities
// - Behavior (aggressive/defensive/etc)
// - Loot table

// Fully functional enemy ready for combat
combat.startCombat(player, [enemy]);
```

### Creating Dynamic Items

```javascript
const item = await gameMaster.createDynamicItem({
  playerLevel: 7,
  itemType: 'weapon', // weapon, armor, consumable, quest, misc
  rarity: 'rare', // common, uncommon, rare, epic, legendary
  purpose: 'Reward for defeating dragon'
});

// LLM generates:
// - Name and description
// - Stats appropriate for level and rarity
// - Special effects or abilities
// - Lore/backstory

player.inventory.addItem(item, 1);
```

### Combat Narration

```javascript
// After each combat action
const narration = await gameMaster.narrateCombatAction(
  { type: 'attack', targetId: enemy.id },
  { success: true, hit: true, critical: true, damage: 45 },
  player,
  enemy
);

console.log(narration);
// "With a mighty roar, Hero swings their blade in a perfect arc,
//  striking the bandit with devastating force for 45 damage!"

// After combat ends
const outcome = await gameMaster.narrateCombatOutcome('victory', {
  player,
  defeatedEnemies: [enemy1, enemy2],
  rewards: { experience: 250, leveledUp: true, newLevel: 6 },
  round: 8
});

console.log(outcome);
// "Victory! After 8 grueling rounds, you stand triumphant over your foes.
//  You feel a surge of power as you reach Level 6!"
```

---

## 🗺️ Example: Multi-Level World

```javascript
// Create a complete region hierarchy

// 1. Create continent (top-level)
const continent = new Location({
  id: 'valoria',
  name: 'Valoria',
  type: 'region',
  x: 0,
  y: 0,
  z: 0,
  scale: 10000,
  description: 'A vast continent filled with diverse kingdoms'
});

// 2. Create kingdom (child of continent)
const kingdom = new Location({
  id: 'eldoria',
  name: 'Kingdom of Eldoria',
  type: 'region',
  x: 500,
  y: 500,
  z: 0,
  scale: 1000,
  parentLocation: 'valoria',
  description: 'A prosperous kingdom known for its trade'
});

// 3. Create capital city (child of kingdom)
const capital = new Location({
  id: 'eldon_capital',
  name: 'Eldon',
  type: 'area',
  x: 520,
  y: 510,
  z: 0,
  scale: 100,
  parentLocation: 'eldoria',
  description: 'The bustling capital city'
});

// 4. Create market district (child of city)
const market = new Location({
  id: 'market_district',
  name: 'Market District',
  type: 'area',
  x: 522,
  y: 512,
  z: 0,
  scale: 10,
  parentLocation: 'eldon_capital',
  description: 'A vibrant marketplace filled with shops'
});

// 5. Create shop (child of district)
const shop = new Location({
  id: 'curious_shop',
  name: 'The Curious Curio Shop',
  type: 'building',
  x: 523,
  y: 512,
  z: 0,
  scale: 1,
  parentLocation: 'market_district',
  indoor: true,
  description: 'A mysterious shop selling rare items'
});

// Add all to world
[continent, kingdom, capital, market, shop].forEach(loc => {
  world.addLocation(loc);
  if (loc.parentLocation) {
    const parent = world.getLocation(loc.parentLocation);
    parent?.addChildLocation(loc.id);
  }
});

// Navigate
world.moveCharacterToLocation(player.id, 'curious_shop');

// Get full path
console.log(world.getLocationPath(player.currentLocation));
// "Valoria > Kingdom of Eldoria > Eldon > Market District > The Curious Curio Shop"

// Find all shops in kingdom
const kingdomHierarchy = world.getLocationHierarchy('curious_shop');
const kingdomId = kingdomHierarchy[1]?.id; // Get kingdom
const allShops = world.getAllLocations()
  .filter(loc => {
    const hierarchy = world.getLocationHierarchy(loc.id);
    return hierarchy.some(h => h.id === kingdomId) && loc.tags.includes('shop');
  });
```

---

## 🎯 Practical Use Cases

### Use Case 1: Player Explores Town

```javascript
// Player is in town square
console.log("You are in Riverside town square.");
console.log("Buildings nearby:");

const children = world.getChildLocations('riverside_town');
children.forEach(loc => {
  const distance = world.calculateDistance('town_square', loc.id);
  console.log(`- ${loc.name} (${Math.round(distance)} units away)`);
});

// Output:
// - The Sleeping Dragon Inn (5 units away)
// - Blacksmith's Forge (7 units away)
// - General Store (6 units away)
// - Temple (12 units away)
```

### Use Case 2: Dynamic Dungeon Creation

```javascript
// Player asks: "Is there a dungeon nearby?"

const nearbyDungeon = world.findNearestLocationType('player_loc', 'dungeon');

if (!nearbyDungeon || nearbyDungeon.distance > 100) {
  // No dungeon nearby, create one!
  const dungeon = await gameMaster.createDynamicLocation({
    requestedBy: 'player',
    purpose: 'Player seeking adventure',
    nearLocation: player.currentLocation,
    suggestedType: 'dungeon',
    playerLevel: player.stats.level
  });

  // Connect to current area
  const currentLoc = world.getLocation(player.currentLocation);
  currentLoc.addExit('hidden path', dungeon.id);
  dungeon.addExit('exit', currentLoc.id);

  console.log(`You notice ${dungeon.name}!`);
  console.log(dungeon.description);
}
```

### Use Case 3: Fast Travel

```javascript
// Find discovered towns
const towns = world.getAllLocations()
  .filter(loc => loc.type === 'area' && loc.discovered && loc.tags.includes('town'));

console.log("Fast travel to:");
towns.forEach((town, index) => {
  const distance = world.calculateDistance(player.currentLocation, town.id);
  const travelTime = Math.ceil(distance / 10); // 10 units per hour
  console.log(`${index + 1}. ${town.name} (${travelTime} hours)`);
});
```

### Use Case 4: Random Encounters Based on Location

```javascript
// Check if current location is dangerous
const location = world.getCharacterLocation(player.id);

if (!location.environment.safe) {
  const encounterChance = 0.3; // 30% per action

  if (Math.random() < encounterChance) {
    // Generate appropriate enemy for this location
    const enemy = await gameMaster.createDynamicEnemy({
      playerLevel: player.stats.level,
      location: location.name,
      difficulty: 'medium'
    });

    console.log(`A ${enemy.name} appears!`);
    // Start combat...
  }
}
```

---

## 📊 Location Scales Reference

| Scale | Type | Example | Contains |
|-------|------|---------|----------|
| 0.1 | Room | Bedroom, Storage | - |
| 1 | Building | Inn, Shop, House | Rooms |
| 10 | Area | Town District, Clearing | Buildings |
| 100 | Town/City | Settlement | Districts, Buildings |
| 1000 | Region | Kingdom, Forest | Towns, Areas |
| 10000 | Continent | Landmass | Regions |

---

## 🔧 Integration with GameMaster

To use these features in your GameMaster:

```javascript
// In src/systems/GameMaster.js
import * as GMExtensions from './GameMasterExtensions.js';

class GameMaster {
  constructor(options) {
    // ... existing code

    // Add extension methods
    this.createDynamicLocation = GMExtensions.createDynamicLocation.bind(this);
    this.createDynamicEnemy = GMExtensions.createDynamicEnemy.bind(this);
    this.createDynamicItem = GMExtensions.createDynamicItem.bind(this);
    this.narrateCombatAction = GMExtensions.narrateCombatAction.bind(this);
    this.narrateCombatOutcome = GMExtensions.narrateCombatOutcome.bind(this);

    // Add world manager reference
    this.worldManager = options.worldManager || null;
  }
}
```

---

## 🎮 Player Commands

### Navigation
- `go <direction>` - Move via exits
- `enter <location>` - Enter child location
- `exit` / `leave` - Go to parent location
- `explore` - List child locations
- `where` - Show current location + hierarchy
- `map` - Show nearby locations with distances

### Information
- `look` - Describe current location
- `exits` - List available exits
- `nearby` - List locations within 50 units
- `path to <location>` - Show directions to location

---

## ✨ Summary

You now have:
- ✅ **Hierarchical locations** - Locations within locations (towns contain buildings, buildings contain rooms)
- ✅ **Grid positioning** - X/Y/Z coordinates for all locations
- ✅ **Distance calculations** - Find nearest locations, calculate travel time
- ✅ **Dynamic generation** - Chronicler creates locations/enemies/items with LLM
- ✅ **Combat narration** - Epic descriptions of combat actions
- ✅ **Scale system** - Locations have size (room < building < area < town < region)

The Chronicler is now a true D&D-style Game Master with full world-building powers! 🎭✨
