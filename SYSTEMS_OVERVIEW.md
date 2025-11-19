# OllamaRPG Systems Overview

This document provides an overview of the new game systems that have been implemented to transform OllamaRPG into a full-featured, stat-driven RPG with dynamic world-building capabilities for the Chronicler.

---

## 🎯 Core Systems

### 1. **Character Stats System** (`src/systems/stats/CharacterStats.js`)

A comprehensive RPG stats system with:

#### Core Attributes (1-20 scale, 10 = average)
- **Strength**: Physical power, melee damage
- **Dexterity**: Agility, ranged damage, dodge chance
- **Constitution**: Health, stamina, endurance
- **Intelligence**: Magic power, spell effectiveness
- **Wisdom**: Perception, willpower, insight, healing
- **Charisma**: Social influence, leadership (used in dialogue)

#### Derived Resources
- **HP (Health Points)**: `50 + (constitution × 10) + (level × 5)`
- **Stamina**: `100 + (constitution × 5) + (dexterity × 3)` - Used for abilities and movement
- **Magic**: `(intelligence + wisdom) × 5` - Used for spells and magic abilities

#### Combat Stats
- Attack bonus, defense bonus, critical chance
- Dodge chance (based on dexterity)
- Resistances (physical, magical, fire, cold, lightning, poison)

#### Progression
- Experience and leveling system
- Attribute points gained on level up (3 per level)
- Status effects (buffs, debuffs, damage over time)

**Usage Example:**
```javascript
const stats = new CharacterStats({
  strength: 14,
  dexterity: 10,
  constitution: 12,
  intelligence: 8,
  wisdom: 10,
  charisma: 15
});

// In combat
stats.takeDamage(25, 'physical');
stats.gainExperience(150); // May level up
stats.allocateAttribute('strength', 2); // Spend attribute points
```

---

### 2. **Item System** (`src/systems/items/`)

#### Item Class (`Item.js`)
Flexible item system supporting:

**Item Types:**
- `weapon`: Melee and ranged weapons
- `armor`: Protective gear
- `consumable`: Potions, food, scrolls
- `quest`: Quest-specific items
- `misc`: Miscellaneous items
- `material`: Crafting materials

**Item Properties:**
- Stats (attack, defense, resistances)
- Effects (heal, restore stamina/magic, buffs)
- Requirements (level, attributes)
- Rarity (common, uncommon, rare, epic, legendary)
- Weight and value
- Custom properties (for Chronicler-created items)

**Usage Example:**
```javascript
const sword = new Item({
  name: 'Iron Longsword',
  type: 'weapon',
  equipSlot: 'weapon',
  equippable: true,
  stats: { attack: 12, criticalChance: 0.05 },
  requirements: { strength: 10 },
  value: 50,
  weight: 5,
  rarity: 'common'
});
```

#### Inventory System (`Inventory.js`)
- Slot-based storage (default 20 slots)
- Weight limits
- Item stacking
- Gold management
- Quest item protection

#### Equipment System (`Equipment.js`)
Equipment slots:
- head, chest, legs, hands, feet
- weapon, offhand (shield/dual-wield)
- accessory1, accessory2

Automatically applies/removes stat bonuses when equipping/unequipping.

---

### 3. **Ability System** (`src/systems/abilities/`)

#### Ability Class (`Ability.js`)
Skills, spells, and special actions.

**Ability Types:**
- `attack`: Offensive abilities (Power Strike, Fireball)
- `defense`: Defensive abilities (Shield Block, Parry)
- `buff`: Enhancement abilities (Strength Boost, Haste)
- `heal`: Healing abilities (Cure Wounds, Regeneration)
- `utility`: Non-combat abilities (Lockpick, Persuade)
- `passive`: Always-active bonuses

**Ability Properties:**
- Resource costs (stamina, magic, HP)
- Cooldowns (turns/seconds)
- Effects (damage, healing, buffs, status effects)
- Range (melee, close, medium, long, any)
- Target type (single, self, area, all)
- Requirements (level, attributes, weapon type)

**Usage Example:**
```javascript
const powerStrike = new Ability({
  name: 'Power Strike',
  type: 'attack',
  staminaCost: 20,
  damage: 30,
  damageType: 'physical',
  damageMultiplier: 1.5,
  range: 'melee',
  cooldown: 2,
  requirements: { strength: 12 }
});

// Use in combat
const result = powerStrike.use(player, enemy, { distance: 'melee' });
```

#### AbilityManager Class (`AbilityManager.js`)
- Learn/forget abilities
- Track known abilities
- Ability slots (hotbar-style quick access)
- Cooldown management

---

### 4. **Distance-Based Positioning** (`src/systems/combat/PositionManager.js`)

Text-friendly combat positioning without grids.

**Distance Categories:**
- **melee**: 0-5 feet (direct combat)
- **close**: 5-15 feet (short range)
- **medium**: 15-30 feet (medium range)
- **long**: 30+ feet (long range)

**Features:**
- Tracks relative distances between combatants
- Movement costs stamina
- Abilities have range requirements
- Can move closer/farther during combat

**Usage Example:**
```javascript
const positions = new PositionManager();
positions.setReferenceEntity(player.id); // Player is reference point
positions.addEntity(bandit1.id, 'medium'); // Bandit starts at medium range
positions.addEntity(bandit2.id, 'close');

// In combat
positions.moveCloser(player.id, player.stats); // Move toward enemy
const distance = positions.getDistance(player.id, bandit1.id); // 'close'
const inRange = positions.isInRange(player.id, bandit1.id, 'melee'); // false
```

---

### 5. **Location & World System** (`src/systems/world/`)

#### Location Class (`Location.js`)
Represents places in the game world.

**Location Types:**
- `area`: Outdoor areas
- `building`: Structures (taverns, shops)
- `room`: Interior rooms
- `dungeon`: Dangerous locations
- `wilderness`: Natural areas

**Features:**
- Graph-based connections (exits)
- Tracks characters and items present
- Environmental properties (indoor/outdoor, lit/dark, safe/dangerous, temperature, hazards)
- Discovery and visit tracking
- Dynamic creation support (Chronicler can create on-the-fly)

**Usage Example:**
```javascript
const tavern = new Location({
  name: 'Red Griffin Inn',
  type: 'building',
  description: 'A cozy tavern with a crackling fireplace...',
  indoor: true,
  safe: true,
  exits: {
    'outside': 'town_square',
    'upstairs': 'inn_rooms'
  }
});

tavern.addCharacter(mara.id);
tavern.addItem(keyItem, 1);
```

#### WorldManager Class (`WorldManager.js`)
Manages the entire game world.

**Features:**
- Location graph management
- Character movement and navigation
- Pathfinding between locations
- Dynamic location creation (by Chronicler)
- World statistics

**Usage Example:**
```javascript
const world = new WorldManager();
world.addLocation(tavern);
world.addLocation(townSquare);
world.connectLocations(tavern.id, 'outside', townSquare.id, 'enter tavern');

// Move player
world.moveCharacterToLocation(player.id, tavern.id);

// Navigation
const path = world.findPath(tavern.id, dungeon.id);
world.moveCharacterInDirection(player.id, 'outside');
```

---

## 🎮 Integration with Existing Systems

### Enhanced Character Entity

The existing `Character` class (`src/entities/Character.js`) should be extended to include:

```javascript
class Character extends Entity {
  constructor(id, name, options = {}) {
    super(id, 'character');

    // Existing systems
    this.personality = ...;
    this.memory = ...;
    this.relationships = ...;

    // NEW: Add these systems
    this.stats = new CharacterStats(options.stats);
    this.inventory = new Inventory(options.inventory);
    this.equipment = new Equipment();
    this.abilities = new AbilityManager(id);
  }
}
```

### Chronicler Enhancements Needed

The `GameMaster` (`src/systems/GameMaster.js`) needs new methods:

```javascript
class GameMaster {
  // Existing methods: narrateScene, generateEvent, etc.

  // NEW: World-building powers
  async createDynamicLocation(context) {
    // Use LLM to generate location based on context
    // Add to WorldManager
  }

  async createDynamicNPC(context) {
    // Generate NPC with personality, backstory
    // Add to game world
  }

  async createDynamicItem(context) {
    // Generate item with stats/effects
    // Place in world or give to player
  }

  async createEncounter(difficulty, location) {
    // Generate combat encounter
    // Spawn enemies, set positions
  }

  async createQuest(context) {
    // Generate multi-stage quest
    // Set objectives, rewards
  }
}
```

---

## 🔮 Combat System (To Be Implemented)

### CombatManager (Recommended Structure)

```javascript
class CombatManager {
  constructor() {
    this.inCombat = false;
    this.combatants = []; // Array of characters
    this.turnOrder = [];
    this.currentTurn = 0;
    this.positions = new PositionManager();
  }

  startCombat(player, enemies, location) {
    // Initialize combat
    // Set up positions
    // Determine turn order
  }

  processTurn(characterId, action) {
    // Execute action (attack, move, ability, item, flee)
    // Update cooldowns
    // Check victory/defeat
  }

  endCombat(result) {
    // Distribute rewards (XP, gold, loot)
    // Update stats
    // Return to exploration mode
  }
}
```

**Combat Actions:**
- **Attack**: Basic attack with equipped weapon
- **Ability**: Use learned ability
- **Move**: Change distance (closer/farther)
- **Item**: Use consumable item
- **Defend**: Reduce damage next turn
- **Flee**: Attempt to escape

**Turn-Based Flow:**
1. Determine initiative order (based on dexterity)
2. Each combatant takes turn
3. Player chooses action via text commands
4. Chronicler narrates results
5. Repeat until victory/defeat/flee

---

## 💾 Save/Replay System Updates

To support dynamic content, the replay system needs to track:

### Dynamic Entity Log

```javascript
class DynamicEntityTracker {
  constructor() {
    this.createdEntities = {
      locations: [],
      characters: [],
      items: [],
      quests: []
    };
  }

  trackCreation(entityType, entity, createdBy) {
    this.createdEntities[entityType].push({
      entity: entity.toJSON(),
      createdBy,
      createdAt: Date.now(),
      frame: gameState.currentFrame
    });
  }

  toJSON() {
    return this.createdEntities;
  }
}
```

### Updated GameState Serialization

```javascript
toJSON() {
  return {
    // Existing
    gameId, seed, currentFrame, weather, etc.,

    // NEW: Include dynamic systems
    worldManager: this.worldManager.toJSON(),
    playerStats: this.player.stats.toJSON(),
    playerInventory: this.player.inventory.toJSON(),
    playerEquipment: this.player.equipment.toJSON(),
    playerAbilities: this.player.abilities.toJSON(),
    dynamicEntities: this.dynamicTracker.toJSON()
  };
}
```

---

## 🎭 Usage Scenarios

### Scenario 1: Player Levels Up

```javascript
// Combat ends, player gains XP
const result = player.stats.gainExperience(250);

if (result.leveledUp) {
  console.log(`Level up! Now level ${result.currentLevel}`);
  console.log(`You have ${result.attributePointsGained} points to allocate`);

  // Player allocates points
  player.stats.allocateAttribute('strength', 2);
  player.stats.allocateAttribute('constitution', 1);

  // Chronicler narrates
  const narration = await gameMaster.narrateLevelUp(player, result);
}
```

### Scenario 2: Chronicler Creates Dynamic Location

```javascript
// Player asks: "Is there a hidden cave nearby?"

// Chronicler decides: Yes!
const cave = await gameMaster.createDynamicLocation({
  playerContext: player.getContext(),
  currentLocation: currentLocation,
  request: 'hidden cave',
  difficulty: 'medium'
});

// LLM generates:
// {
//   name: 'Whispering Cavern',
//   description: 'A dark cave hidden behind vines...',
//   type: 'dungeon',
//   indoor: true,
//   lit: false,
//   safe: false,
//   hazards: ['darkness', 'unstable rocks']
// }

world.addLocation(cave);
world.connectLocations(currentLocation.id, 'hidden cave entrance', cave.id, 'exit');

// Chronicler narrates discovery
```

### Scenario 3: Text-Based Combat

```javascript
// Combat starts
const combat = new CombatManager();
combat.startCombat(player, [bandit1, bandit2], currentLocation);

// Chronicler narrates: "Two bandits ambush you! One at medium range, one closing in!"

// Player's turn
// Input: "use power strike on bandit1"

const ability = player.abilities.getAbility('power_strike');
const distance = combat.positions.getDistance(player.id, bandit1.id);

if (!combat.positions.isInRange(player.id, bandit1.id, ability.range)) {
  // "You're too far away! Move closer first."
} else {
  const result = ability.use(player, bandit1, { distance });
  // Chronicler narrates: "You charge forward and deliver a devastating blow!
  // The bandit takes 45 damage and staggers back!"
}
```

---

## 🔄 Next Steps

### High Priority (Core Gameplay Loop)
1. **Implement CombatManager** - Turn-based combat system
2. **Enhance GameMaster** - Add world-building methods
3. **Integrate with Character** - Add stats/inventory/equipment to existing Character class
4. **Create starter items/abilities** - Build initial database
5. **Update CLI commands** - Add inventory, stats, equipment, combat commands

### Medium Priority (Polish & Content)
6. **Create initial locations** - Build starting world (town, wilderness, dungeon)
7. **Generate NPC schedules** - NPCs move between locations by time
8. **Dynamic weather/time** - Make environment change
9. **Quest completion hooks** - Tie quests to item collection, combat victories
10. **Loot system** - Drop items from enemies

### Low Priority (Advanced Features)
11. **Crafting system** - Combine materials into items
12. **Trading system** - Buy/sell with NPCs
13. **Skill trees** - Unlock abilities through progression
14. **Set bonuses** - Equipment sets with bonuses
15. **Elemental interactions** - Fire melts ice, water conducts lightning

---

## 📝 Design Philosophy

### Why Text-Based Combat?
- **Narrative Focus**: Chronicler describes dramatic moments
- **Accessible**: No complex UI needed
- **Flexible**: Easy to add new abilities and mechanics
- **AI-Friendly**: LLM can interpret and narrate naturally

### Why Distance Instead of Grid?
- **Simplified**: Four distance categories vs. grid coordinates
- **Tactical**: Still allows strategic positioning
- **Text-Friendly**: Easy to communicate ("the archer moves to long range")
- **Fast**: No pathfinding calculations needed

### Why Dynamic Creation?
- **Replayability**: Each playthrough can be unique
- **AI-Driven**: Chronicler acts as true D&D DM
- **Player Agency**: World responds to player questions/actions
- **Emergent Stories**: Unexpected locations and NPCs can appear

---

## 🎯 Core Game Loop (Updated)

```
1. Player is in a location
   ↓
2. Chronicler describes scene (weather, time, NPCs present, available actions)
   ↓
3. Player chooses action:
   - Talk to NPC → Dialogue System (existing)
   - Move to location → WorldManager
   - Use item → Inventory System
   - Attack enemy → CombatManager
   - Use ability → Ability System
   - Examine area → Chronicler narrates
   - Ask question → Chronicler may create dynamic content
   ↓
4. Systems update (stats, relationships, quests, time)
   ↓
5. Chronicler narrates outcome
   ↓
6. Check for events (level up, quest complete, time-based events)
   ↓
7. Return to step 1
```

---

## 🔧 Technical Notes

### Serialization
All systems implement `toJSON()` and `static fromJSON()` for save/load support.

### Determinism
- Stats calculations are deterministic
- Random events should use `SeededRandom` from `src/utils/SeededRandom.js`
- Ensures replays work correctly

### Modularity
- Each system is independent
- Can be tested in isolation
- Easy to extend or replace

### Performance
- Maps used for O(1) lookups
- BFS pathfinding is efficient for small-medium graphs
- Status effects cleaned up automatically

---

## 📚 Additional Resources

- `src/data/npc-roster.js` - Existing NPC definitions (can add stats/abilities)
- `src/systems/quest/` - Quest system (integrate with combat/items)
- `src/systems/GameMaster.js` - Chronicler (needs world-building extensions)
- `src/utils/GameClock.js` - Time system (already working, just needs hooks)

---

This foundation provides everything needed for a full RPG experience while maintaining the unique AI-driven narrative focus of OllamaRPG. The Chronicler can now dynamically shape the world, create challenges, and respond to player actions with full mechanical support!
