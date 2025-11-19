# Combat System Guide

This guide explains how to use the new combat system in OllamaRPG.

---

## Quick Start

### Test the Combat System

```bash
npm run test:combat
```

This will run a simulated combat between the player and two bandits, showcasing:
- Turn-based combat with initiative
- Distance-based positioning
- Abilities with cooldowns
- Enemy AI
- Experience and loot rewards

---

## Combat Flow

### 1. **Combat Initialization**

```javascript
import { CombatManager } from './src/systems/combat/CombatManager.js';

const combat = new CombatManager();
combat.startCombat(player, [enemy1, enemy2], {
  enemyDistances: ['close', 'medium'] // Optional starting distances
});
```

### 2. **Turn-Based Loop**

Combat proceeds in turns based on initiative (Dexterity + d20 roll):

```javascript
while (combat.inCombat) {
  const currentTurn = combat.getCurrentTurn();

  // Get action (from player input or AI)
  const action = currentTurn.isPlayer
    ? getPlayerAction()
    : currentTurn.character.ai.decideAction(currentTurn.character, combat);

  // Process action
  const result = combat.processAction(currentTurn.character.id, action);

  // Check if combat ended
  if (result.combatEnded) {
    const endResult = combat.endCombat(result.outcome);
    break;
  }
}
```

### 3. **Combat End**

When all enemies or the player is defeated:

```javascript
const endResult = combat.endCombat('victory');
// endResult contains:
// - outcome: 'victory' | 'defeat' | 'fled'
// - rewards: { experience, gold, loot, leveledUp }
// - defeatedEnemies: count
```

---

## Combat Actions

### Attack

Basic attack with equipped weapon:

```javascript
{
  type: 'attack',
  targetId: enemy.id
}
```

- Hit chance based on attacker's attack bonus vs. defender's defense
- Damage = weapon attack + attack bonus
- Critical hits possible (based on character's critical chance)
- Range determined by weapon (melee, close, medium, long)

### Ability

Use a learned ability:

```javascript
{
  type: 'ability',
  abilityId: 'power_strike',
  targetId: enemy.id
}
```

- Costs resources (stamina, magic, or HP)
- Has cooldown (turns before can use again)
- Range requirements (melee, close, medium, long, any)
- Effects: damage, healing, buffs, debuffs, status effects

### Item

Use a consumable item:

```javascript
{
  type: 'item',
  itemId: 'health_potion',
  targetId: character.id // Can be self or ally
}
```

- Items can heal, restore resources, apply buffs
- Consumed items are removed from inventory

### Move

Change distance from enemies:

```javascript
{
  type: 'move',
  direction: 'closer' // or 'farther'
}
```

- Costs stamina (varies by distance change)
- Allows tactical positioning
- Melee → Close → Medium → Long

### Defend

Take defensive stance:

```javascript
{
  type: 'defend'
}
```

- Adds temporary defense buff until next turn
- No resource cost
- Good for conserving stamina/magic

### Flee

Attempt to escape combat (player only):

```javascript
{
  type: 'flee'
}
```

- 50% base chance, increases with each attempt
- Maximum 3 attempts
- Success ends combat without rewards

---

## Distance System

Combat uses four distance categories instead of a grid:

| Distance | Range | Description |
|----------|-------|-------------|
| **Melee** | 0-5 ft | Direct combat range |
| **Close** | 5-15 ft | Short range |
| **Medium** | 15-30 ft | Medium range |
| **Long** | 30+ ft | Long range |

### Ability Ranges

Abilities have range requirements:
- **melee**: Only works at melee distance
- **close**: Works at melee and close
- **medium**: Works at melee, close, and medium
- **long**: Works at melee, close, medium, and long
- **any**: Works at any distance

### Movement Costs

| Movement | Stamina Cost |
|----------|--------------|
| Melee → Close | 5 |
| Close → Medium | 10 |
| Medium → Long | 15 |
| (Reverse) | Same cost |

---

## Creating Enemies

### From Database

```javascript
import { createEnemy } from './test-combat.js';

const bandit = createEnemy('bandit');
const orc = createEnemy('orc_warrior');
```

### Custom Enemy

```javascript
const customEnemy = new Character('custom_enemy', 'Elite Guard', {
  role: 'npc'
});

customEnemy.stats = new CharacterStats({
  strength: 15,
  dexterity: 12,
  constitution: 14,
  intelligence: 10,
  wisdom: 11,
  charisma: 10,
  level: 5
});

customEnemy.equipment = new Equipment();
// Equip items...

customEnemy.abilities = new AbilityManager(customEnemy.id);
// Learn abilities...

customEnemy.ai = new CombatAI({ behavior: 'aggressive' });
```

---

## AI Behaviors

Enemies use AI to make combat decisions:

### Aggressive
- Prefers attacking
- Moves closer to enemies
- Uses offensive abilities frequently
- Targets lowest HP enemy

### Defensive
- Prioritizes survival
- Moves away when low HP
- Uses healing items/abilities
- Targets closest enemy

### Balanced
- Mix of offense and defense
- Uses abilities moderately
- Random target selection
- Adapts to situation

### Support
- Focuses on healing and buffs
- Stays at distance
- Protects low-HP allies

### Coward
- Attempts to flee when outnumbered or low HP
- Keeps maximum distance
- Rarely uses offensive abilities

---

## Available Enemies

### Weak (Level 1-3)
- **Goblin** (Lv 1): Small, aggressive, weak
- **Giant Rat** (Lv 1): Fast, disease carrier
- **Bandit** (Lv 2): Balanced fighter, basic equipment

### Medium (Level 3-5)
- **Wolf** (Lv 3): Fast predator with Pounce ability
- **Skeleton** (Lv 3): Undead, resistant to physical/poison
- **Orc Warrior** (Lv 4): Strong, uses Cleave ability

### Strong (Level 5-7)
- **Dark Mage** (Lv 6): Magic user with Shadow Bolt and Drain Life
- **Troll** (Lv 7): Regenerating tank with high HP

### Boss (Level 8+)
- **Dragon Wyrmling** (Lv 10): Fire breath, multiple abilities, high rewards

---

## Creating Custom Abilities

```javascript
const fireBlast = new Ability({
  id: 'fire_blast',
  name: 'Fire Blast',
  description: 'Launch a ball of fire at the enemy',
  type: 'attack',

  // Costs
  staminaCost: 15,
  magicCost: 25,

  // Effects
  damage: 25,
  damageType: 'fire',
  damageMultiplier: 1.3,

  // Targeting
  targetType: 'single',
  range: 'medium',

  // Cooldown
  cooldown: 4,

  // Requirements
  requirements: {
    level: 5,
    intelligence: 14
  },

  tags: ['magical', 'fire']
});

character.abilities.learnAbility(fireBlast);
```

---

## Creating Custom Items

```javascript
const superPotion = new Item({
  name: 'Super Health Potion',
  description: 'A powerful healing potion',
  type: 'consumable',
  usable: true,
  consumable: true,

  effects: {
    heal: 100,
    restoreStamina: 50
  },

  value: 100,
  weight: 0.5,
  rarity: 'rare',
  stackable: true,
  maxStack: 5
});

character.inventory.addItem(superPotion, 3);
```

---

## Integrating with Your Game

### 1. Add Combat to Character

```javascript
// In src/entities/Character.js
import { CharacterStats } from '../systems/stats/CharacterStats.js';
import { Inventory } from '../systems/items/Inventory.js';
import { Equipment } from '../systems/items/Equipment.js';
import { AbilityManager } from '../systems/abilities/AbilityManager.js';

class Character extends Entity {
  constructor(id, name, options = {}) {
    super(id, 'character');

    // Existing systems
    this.personality = ...;
    this.memory = ...;
    this.relationships = ...;

    // NEW: Add combat systems
    this.stats = options.stats || new CharacterStats(options.statsConfig);
    this.inventory = options.inventory || new Inventory();
    this.equipment = options.equipment || new Equipment();
    this.abilities = options.abilities || new AbilityManager(id);

    // NEW: Add AI if NPC
    if (this.role === 'npc' && options.aiConfig) {
      this.ai = new CombatAI(options.aiConfig);
    }
  }

  // Update toJSON to include new systems
  toJSON() {
    return {
      ...existing,
      stats: this.stats?.toJSON(),
      inventory: this.inventory?.toJSON(),
      equipment: this.equipment?.toJSON(),
      abilities: this.abilities?.toJSON()
    };
  }
}
```

### 2. Trigger Combat from Exploration

```javascript
// When player encounters enemies
async function handleEnemyEncounter(player, location) {
  // Generate enemies based on location
  const enemies = generateEnemiesForLocation(location);

  // Start combat
  const combat = new CombatManager({ chronicler: gameMaster });
  combat.startCombat(player, enemies);

  // Enter combat mode
  await runCombatLoop(combat);
}
```

### 3. Chronicler Integration

The CombatManager supports a Chronicler (GameMaster) for narration:

```javascript
const combat = new CombatManager({
  chronicler: gameMaster,
  eventBus: EventBus.getInstance()
});

// Combat emits events:
// - combat:started
// - combat:turn_changed
// - combat:ended

// Chronicler can narrate:
gameMaster.narrateCombatAction(action, result);
gameMaster.narrateCombatOutcome(outcome);
```

---

## Combat Statistics

Track combat performance:

```javascript
const summary = combat.getSummary();

// Returns:
// {
//   inCombat: boolean,
//   round: number,
//   currentTurn: { character, team, initiative },
//   combatants: [{ name, team, hp, maxHP, isAlive }],
//   positions: { melee: [], close: [], medium: [], long: [] },
//   log: [recent combat events]
// }
```

---

## Next Steps

1. **Integrate with existing Character class** - Add stats/inventory/equipment
2. **Create encounter system** - Spawn enemies based on location/level
3. **Add combat UI** - Create CLI or web interface for combat
4. **Enhance Chronicler** - Add combat narration to GameMaster
5. **Implement loot tables** - Define specific drops for each enemy
6. **Add more abilities** - Create class-specific ability trees
7. **Create boss encounters** - Special multi-phase boss fights

---

## Tips

- **Balance**: Start enemies at 1-2 levels below player for fair fights
- **Distance**: Give ranged enemies starting distance, melee enemies start close
- **Abilities**: Ensure player has 2-3 abilities by level 3
- **Healing**: Player should have healing potions before tough encounters
- **AI**: Mix enemy behaviors for more interesting encounters
- **Rewards**: Scale XP and gold based on enemy level and difficulty

---

## Troubleshooting

### Combat Never Ends
- Check that enemies/player have HP and can take damage
- Ensure AI is making valid actions
- Add turn limit safety check (see test-combat.js)

### Actions Always Fail
- Verify character has required resources (stamina/magic)
- Check distance requirements for abilities
- Ensure targets are valid and alive

### No Damage Dealt
- Check that weapon/ability has attack value
- Verify stats are calculating bonuses correctly
- Ensure resistances aren't too high

---

## Example: Full Combat Encounter

```javascript
// Create player
const player = createPlayer();

// Create enemies
const wolf1 = createEnemy('wolf', '_1');
const wolf2 = createEnemy('wolf', '_2');

// Start combat
const combat = new CombatManager();
combat.startCombat(player, [wolf1, wolf2], {
  enemyDistances: ['close', 'close']
});

// Combat loop
while (combat.inCombat) {
  const turn = combat.getCurrentTurn();

  let action;
  if (turn.isPlayer) {
    // Player decides action
    action = await getPlayerInput();
  } else {
    // AI decides action
    action = turn.character.ai.decideAction(turn.character, combat);
  }

  // Process action
  const result = combat.processAction(turn.character.id, action);

  // Display result
  console.log(result.message);

  // Check for combat end
  if (result.combatEnded) {
    const endResult = combat.endCombat(result.outcome);

    if (endResult.outcome === 'victory') {
      applyRewards(player, endResult.rewards);
    }

    break;
  }
}
```

---

Enjoy the combat system! For more details, see `SYSTEMS_OVERVIEW.md`.
