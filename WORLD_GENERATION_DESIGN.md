# OllamaRPG - World Generation System Design

**Created**: November 19, 2025
**Design Philosophy**: GM generates entire world dynamically, starting sparse and filling in details as needed

---

## 🌍 Core Concept: Progressive World Generation

### The Big Idea

**Everything is Game Master generated, starting from nothing:**

1. **Game Start**: GM generates one starting town with NPCs and initial quest
2. **Sparse World**: Locations exist as "names on a map" until visited/explored
3. **Progressive Detail**: GM fills in details when player asks or visits
4. **Emergent Narrative**: World grows organically based on player actions

### Why This Is Brilliant

✅ **Infinite Replayability** - Every game starts with different town/NPCs/quest
✅ **Dynamic Content** - No pre-written content, all emergent
✅ **Efficient** - Only generate what's needed
✅ **Narrative Coherence** - GM ensures everything makes sense
✅ **Player-Driven** - World expands based on player curiosity

---

## 🎲 Game Initialization Flow

### Phase 1: World Seed

```javascript
// When player starts new game
async function startNewGame(playerName, worldSeed = null) {
  const seed = worldSeed || generateRandomSeed();
  const gm = new GameMaster({ seed });

  console.log(`🎭 The Chronicler awakens...`);
  console.log(`   Creating a new world for ${playerName}...`);

  // GM generates the entire starting state
  const world = await gm.generateWorld({
    playerName: playerName,
    seed: seed,
    difficulty: 'normal'
  });

  return world;
}
```

### Phase 2: GM World Generation

```javascript
class GameMaster {
  async generateWorld(options) {
    const world = {
      seed: options.seed,
      name: await this.generateWorldName(),
      player: this.createPlayer(options.playerName),
      locations: new Map(),
      npcs: new Map(),
      quests: [],
      worldState: new WorldState()
    };

    // Step 1: Generate starting town (detailed)
    const startingTown = await this.generateStartingTown(world.seed);
    world.locations.set(startingTown.id, startingTown);

    // Step 2: Generate NPCs in starting town (5-10)
    const npcs = await this.generateStartingNPCs(startingTown, 7);
    npcs.forEach(npc => {
      world.npcs.set(npc.id, npc);
      startingTown.addCharacter(npc.id);
    });

    // Step 3: Generate main quest (overarching goal)
    const mainQuest = await this.generateMainQuest({
      town: startingTown,
      npcs: npcs,
      player: world.player
    });
    world.quests.push(mainQuest);

    // Step 4: Generate sparse surrounding locations (just names + coords)
    const surroundingLocations = await this.generateSparseLocations(startingTown);
    surroundingLocations.forEach(loc => {
      world.locations.set(loc.id, loc);
    });

    // Step 5: Narrate world introduction
    const introduction = await this.narrateWorldIntroduction({
      world: world,
      town: startingTown,
      mainQuest: mainQuest
    });

    console.log('\n' + introduction + '\n');

    return world;
  }
}
```

---

## 🏰 Starting Town Generation

### GM Creates Complete Town

```javascript
async generateStartingTown(seed) {
  const prompt = `
    You are the Game Master creating a new fantasy RPG world.

    Generate a starting town with these details:

    1. Town name (fantasy-themed, memorable)
    2. Town description (2-3 sentences, atmospheric)
    3. Town type (mining town, port city, farming village, trade hub, etc.)
    4. Population size (small: 50-200, medium: 200-1000, large: 1000+)
    5. Notable features (3-5 key landmarks)
    6. Current situation (peaceful? troubled? mysterious events?)
    7. Main industry (what drives the economy?)

    Make it interesting and give it personality. This is where the hero's
    journey begins.

    Respond in JSON format.
  `;

  const response = await this.llm.generate(prompt, { seed });
  const townData = JSON.parse(response);

  // Create location with generated data
  const town = new Location({
    id: 'starting_town',
    name: townData.name,
    description: townData.description,
    type: 'town',
    x: 100, // Center of world grid
    y: 100,
    z: 0,
    scale: 50,
    indoor: false,
    lit: true,
    safe: true,
    tags: ['town', 'starting_location', townData.type],
    customProperties: {
      population: townData.population,
      industry: townData.industry,
      situation: townData.situation,
      landmarks: townData.landmarks
    },
    discovered: true,
    visited: true,
    createdBy: 'chronicler'
  });

  return town;
}
```

**Example Generated Town**:
```json
{
  "name": "Millhaven",
  "description": "A prosperous mill town built along a rushing river. Water wheels turn constantly, grinding grain from the surrounding farmlands. Stone bridges connect the two sides of town, and the smell of fresh bread fills the air.",
  "type": "mill_town",
  "population": 450,
  "landmarks": [
    "The Grand Mill",
    "River Bridge",
    "Market Square",
    "The Grain Keeper's Guild",
    "Old Stone Chapel"
  ],
  "situation": "Recently, shipments of grain have been going missing, and tensions are rising between the mill owners and farmers.",
  "industry": "Grain milling and trade"
}
```

---

## 👥 Starting NPC Generation

### GM Creates Town NPCs with Personalities

```javascript
async generateStartingNPCs(town, count = 7) {
  const prompt = `
    Generate ${count} NPCs for ${town.name}.

    Town context:
    - Type: ${town.customProperties.type}
    - Industry: ${town.customProperties.industry}
    - Situation: ${town.customProperties.situation}

    Create diverse NPCs with:
    1. Name
    2. Role/occupation (tied to town industry)
    3. Personality traits (friendly, gruff, mysterious, etc.)
    4. Brief background (1-2 sentences)
    5. Current concern or goal
    6. Relationship to town situation

    Make them feel real and interconnected. Some should be helpful,
    some neutral, some potentially troublesome.

    Respond with JSON array of NPCs.
  `;

  const response = await this.llm.generate(prompt, { seed: town.seed });
  const npcData = JSON.parse(response);

  return npcData.map((data, index) => {
    return new Character({
      id: `npc_${index}`,
      name: data.name,
      role: data.role,
      personality: this.parsePersonalityTraits(data.personality),
      backstory: data.background,
      state: {
        location: town.id,
        currentConcern: data.concern,
        mood: 'neutral'
      },
      relationships: new Map()
    });
  });
}
```

**Example Generated NPCs**:
```json
[
  {
    "name": "Gareth",
    "role": "Master Miller",
    "personality": "hardworking, worried, honest",
    "background": "Runs the Grand Mill, inherited from his father. He's proud of his work but concerned about the missing grain shipments.",
    "concern": "Missing grain threatening his business and reputation",
    "relationToSituation": "Primary victim of the thefts"
  },
  {
    "name": "Lyssa",
    "role": "Grain Merchant",
    "personality": "shrewd, observant, secretive",
    "background": "Manages grain trade between farmers and the mill. She knows more about the thefts than she lets on.",
    "concern": "Protecting her profit margins during the crisis",
    "relationToSituation": "Knows who might be behind it"
  },
  {
    "name": "Old Tam",
    "role": "Bridge Keeper",
    "personality": "friendly, talkative, wise",
    "background": "An elderly man who maintains the stone bridges and watches travelers. He sees everything that happens in town.",
    "concern": "Worried about strangers he's seen recently",
    "relationToSituation": "Potential witness, has clues"
  }
  // ... 4 more NPCs
]
```

---

## 🎯 Main Quest Generation

### GM Creates Overarching Goal

```javascript
async generateMainQuest(context) {
  const prompt = `
    Create the main quest for the hero's journey.

    Context:
    - Town: ${context.town.name} (${context.town.customProperties.situation})
    - Industry: ${context.town.customProperties.industry}
    - NPCs: ${context.npcs.map(n => n.name + ' (' + n.role + ')').join(', ')}

    Create a compelling main quest with:
    1. Title (epic and memorable)
    2. Description (what is the overarching goal?)
    3. Why it matters (stakes - what happens if hero fails?)
    4. Initial objectives (2-3 starting steps)
    5. Quest giver (which NPC or mysterious source?)
    6. Long-term arc (3-5 major milestones)

    This quest should:
    - Connect to the town's situation
    - Involve multiple NPCs
    - Have escalating stakes
    - Lead the player to explore beyond the starting town

    Respond in JSON format.
  `;

  const response = await this.llm.generate(prompt, { temperature: 0.9 });
  const questData = JSON.parse(response);

  return new Quest('main_quest', {
    title: questData.title,
    description: questData.description,
    type: 'main',
    giver: questData.questGiver,
    objectives: questData.initialObjectives.map((desc, i) => ({
      id: `obj_${i}`,
      description: desc,
      completed: false
    })),
    rewards: {
      experience: 500,
      reputation: 50,
      narrative: questData.why_it_matters
    },
    arc: questData.longTermArc,
    state: 'active'
  });
}
```

**Example Generated Main Quest**:
```json
{
  "title": "The Shadow Trade",
  "description": "Uncover the conspiracy behind the grain thefts in Millhaven and stop the shadowy organization before the town falls into chaos and starvation.",
  "questGiver": "Gareth (Master Miller)",
  "why_it_matters": "If the thefts continue, Millhaven will run out of grain within weeks. The town will collapse, people will starve, and a mysterious criminal network will tighten its grip on the region.",
  "initialObjectives": [
    "Talk to Gareth about the missing grain",
    "Investigate the mill and look for clues",
    "Question townsfolk who might have seen something"
  ],
  "longTermArc": [
    "Discover the thefts are organized, not random",
    "Trace the grain to a hidden warehouse in the forest",
    "Uncover that a rival town is sabotaging Millhaven",
    "Confront the mastermind behind the conspiracy",
    "Bring evidence to the authorities and save Millhaven"
  ]
}
```

---

## 🗺️ Sparse Location Generation

### GM Creates Location "Stubs"

Surrounding locations start as **minimal data** - just enough to know they exist:

```javascript
async generateSparseLocations(startingTown) {
  const prompt = `
    Generate 8-12 locations surrounding ${startingTown.name}.

    These are places that exist on the map but the hero hasn't visited yet.

    For each location, provide only:
    1. Name (evocative, hints at what's there)
    2. Type (forest, ruins, cave, village, mountain, river, etc.)
    3. Direction from town (north, south, east, west, northeast, etc.)
    4. Approximate distance (close: 5-15km, medium: 15-40km, far: 40-100km)
    5. Brief rumor (1 sentence - what townfolk say about it)

    DO NOT provide detailed descriptions yet. The GM will fill those
    in when the player asks about or visits the location.

    Respond with JSON array.
  `;

  const response = await this.llm.generate(prompt);
  const locationData = JSON.parse(response);

  return locationData.map(data => {
    // Calculate grid coordinates from direction and distance
    const coords = this.calculateCoordinatesFromDirection(
      startingTown.coordinates,
      data.direction,
      data.distance
    );

    return new Location({
      id: this.generateLocationId(data.name),
      name: data.name,
      type: data.type,
      description: `[Details unknown - not yet visited]`, // Placeholder
      x: coords.x,
      y: coords.y,
      z: coords.z,
      scale: this.estimateScale(data.type),
      discovered: false, // Player has heard of it
      visited: false,
      customProperties: {
        rumor: data.rumor,
        detailLevel: 'sparse', // Marker for GM to expand later
        distanceFromStart: data.distance,
        direction: data.direction
      },
      createdBy: 'chronicler'
    });
  });
}

calculateCoordinatesFromDirection(origin, direction, distanceKm) {
  // Convert km to grid units (1 grid unit = 1km)
  const distance = distanceKm;

  const directions = {
    'north': { x: 0, y: distance },
    'south': { x: 0, y: -distance },
    'east': { x: distance, y: 0 },
    'west': { x: -distance, y: 0 },
    'northeast': { x: distance * 0.7, y: distance * 0.7 },
    'northwest': { x: -distance * 0.7, y: distance * 0.7 },
    'southeast': { x: distance * 0.7, y: -distance * 0.7 },
    'southwest': { x: -distance * 0.7, y: -distance * 0.7 }
  };

  const offset = directions[direction.toLowerCase()] || { x: 0, y: 0 };

  return {
    x: Math.round(origin.x + offset.x),
    y: Math.round(origin.y + offset.y),
    z: 0 // Surface level, dungeons go negative
  };
}
```

**Example Sparse Locations with Narrative Fuel**:
```json
[
  {
    "name": "Whisperwood Forest",
    "type": "forest",
    "direction": "north",
    "distance": 8,
    "narrativeFuel": {
      "commonKnowledge": [
        "Strange lights seen at night among the trees",
        "About two hours north of Millhaven",
        "Hunters sometimes hear whispers on the wind"
      ],
      "rumors": [
        { "text": "A hermit lives deep in the forest", "likelihood": 0.6 },
        { "text": "An old shrine hidden among trees", "likelihood": 0.8 }
      ],
      "specialists": ["Old Tam", "Lyssa"],
      "questHooks": [
        "Missing hunters last seen heading there"
      ]
    }
  },
  {
    "name": "Old Granite Quarry",
    "type": "ruins",
    "direction": "east",
    "distance": 12,
    "rumor": "Abandoned years ago after miners reported hearing voices in the stone."
  },
  {
    "name": "Crossroads Inn",
    "type": "inn",
    "direction": "south",
    "distance": 20,
    "rumor": "A meeting place for travelers with stories from distant lands."
  },
  {
    "name": "Thornvale Village",
    "type": "village",
    "direction": "west",
    "distance": 35,
    "rumor": "A rival village that's been unusually prosperous lately."
  }
  // ... more locations
]
```

**Key Point**: These locations exist on the grid and have coordinates, but their **details are placeholders** until player interacts with them.

---

## 📝 Progressive Detail Expansion

### When Player Asks About Location

```javascript
// Player: "What do people say about Whisperwood Forest?"

async expandLocationDetails(location, context = 'inquiry') {
  // Check if already detailed
  if (location.customProperties.detailLevel === 'full') {
    return location.description;
  }

  // GM fills in details based on context
  const prompt = `
    Expand details for ${location.name}.

    Current knowledge:
    - Type: ${location.type}
    - Rumor: ${location.customProperties.rumor}
    - Distance: ${location.customProperties.distanceFromStart}km ${location.customProperties.direction}

    The player is asking about this location from ${context}.

    Provide:
    1. Full description (3-4 sentences, atmospheric)
    2. What it looks like from a distance
    3. What might be found there
    4. Any dangers or interesting features
    5. Who might know more about it

    Keep some mystery - don't reveal everything until they visit.
  `;

  const response = await this.llm.generate(prompt);

  // Update location with new details
  location.description = response.description;
  location.customProperties.detailLevel = 'partial';
  location.customProperties.expandedAt = Date.now();

  return response;
}
```

**Example - Player Inquires**:
```
Player: "Tell me about Whisperwood Forest"

NPC (Old Tam): "Ah, Whisperwood... A dense forest to the north,
about two hours' walk from here. The trees there grow thick and
old, blocking out most sunlight. Hunters say they sometimes hear
whispers on the wind, though no one's ever found the source.
Strange lights flicker between the trees at night—some say it's
faeries, others claim it's something darker. I'd be cautious
venturing there alone."

[Location "Whisperwood Forest" expanded to partial detail]
```

### When Player Visits Location

```javascript
async fullyExpandLocation(location, worldState) {
  const prompt = `
    The hero is now visiting ${location.name} for the first time.

    Known info:
    ${location.description}

    World context:
    - Time: ${worldState.timeOfDay}
    - Weather: ${worldState.weather}
    - Main quest: ${worldState.mainQuest.title}

    Generate full location details:
    1. Detailed description (what player sees upon arrival)
    2. Points of interest (3-5 things to investigate)
    3. NPCs present (if any)
    4. Items/loot (if appropriate)
    5. Dangers/encounters (if location is unsafe)
    6. Connections (exits to other locations)
    7. Secrets (hidden things to discover)

    This should feel like entering a new area in an RPG. Make it
    atmospheric and give the player options for exploration.
  `;

  const fullDetails = await this.llm.generate(prompt);

  // Update location with full details
  location.description = fullDetails.arrivalDescription;
  location.customProperties.detailLevel = 'full';
  location.customProperties.pointsOfInterest = fullDetails.pointsOfInterest;
  location.customProperties.secrets = fullDetails.secrets;

  // Add any NPCs generated
  if (fullDetails.npcs) {
    fullDetails.npcs.forEach(npcData => {
      const npc = this.generateNPC(npcData);
      worldState.npcs.set(npc.id, npc);
      location.addCharacter(npc.id);
    });
  }

  // Add items
  if (fullDetails.items) {
    fullDetails.items.forEach(itemData => {
      const item = this.createItem(itemData);
      location.addItem(item, itemData.quantity || 1);
    });
  }

  // Generate connected locations (sparse stubs)
  if (fullDetails.exits) {
    const newLocations = await this.generateSparseLocationsFrom(location, fullDetails.exits);
    newLocations.forEach(loc => {
      worldState.locations.set(loc.id, loc);
      location.addExit(loc.direction, loc.id);
    });
  }

  return fullDetails;
}
```

**Example - Player Arrives**:
```
> travel north (to Whisperwood Forest)

[Traveling... 45 minutes pass]

🎭 The Chronicler:

You emerge from the road into the edge of Whisperwood Forest.
Ancient oak and ash trees tower overhead, their thick canopy
turning midday into twilight. Moss carpets the ground, muffling
your footsteps. A narrow path leads deeper into the woods, barely
visible through the undergrowth.

You notice several points of interest:
- A weathered shrine near the path entrance
- Strange carvings on a massive oak tree
- A glowing mushroom circle off to the east
- Tracks in the soft earth—something large passed through recently
- The faint sound of running water deeper in the forest

What would you like to do?

[Location "Whisperwood Forest" fully expanded]
[New locations discovered: "Forest Shrine", "Deep Woods", "Hidden Grove"]
```

---

## 🌐 World Generation Architecture

### Data Structure

```javascript
class GeneratedWorld {
  constructor() {
    this.seed = null;
    this.name = null;

    // Location tracking
    this.locations = new Map(); // All locations
    this.detailedLocations = new Set(); // Locations with full details
    this.discoveredLocations = new Set(); // Player knows about these
    this.visitedLocations = new Set(); // Player has been here

    // NPC tracking
    this.npcs = new Map();
    this.npcRelationships = new Map(); // NPC-to-NPC relationships

    // Quest tracking
    this.mainQuest = null;
    this.sideQuests = [];
    this.completedQuests = [];

    // World state
    this.worldState = new WorldState();

    // Generation metadata
    this.generationLog = []; // Track what GM generated and when
  }

  // Trigger detail expansion when needed
  async ensureLocationDetails(locationId, level = 'partial') {
    const location = this.locations.get(locationId);
    if (!location) return null;

    const currentLevel = location.customProperties.detailLevel || 'sparse';

    // Already detailed enough
    if (currentLevel === 'full' || (currentLevel === 'partial' && level === 'partial')) {
      return location;
    }

    // Expand details
    if (level === 'partial' && currentLevel === 'sparse') {
      await this.gm.expandLocationDetails(location, 'inquiry');
    } else if (level === 'full') {
      await this.gm.fullyExpandLocation(location, this.worldState);
      this.visitedLocations.add(locationId);
    }

    // Log generation
    this.generationLog.push({
      type: 'location_expanded',
      locationId: locationId,
      level: level,
      timestamp: Date.now()
    });

    return location;
  }
}
```

---

## 🎮 Game Start Sequence

### Complete Flow

```javascript
async function initializeNewGame(playerName) {
  console.clear();
  console.log('═'.repeat(60));
  console.log('         🎭 OLLAMA RPG - A Chronicle Begins 🎭');
  console.log('═'.repeat(60));
  console.log('');
  console.log(`The Chronicler stirs, weaving a new world for ${playerName}...`);
  console.log('');

  // Step 1: Generate world seed
  const seed = Date.now();
  console.log(`World Seed: ${seed}`);
  console.log('');

  // Step 2: Initialize Game Master
  const gm = new GameMaster({ seed });

  // Step 3: GM generates starting town
  console.log('🏰 Manifesting a town from the mists...');
  const town = await gm.generateStartingTown(seed);
  console.log(`   ✓ ${town.name} has emerged`);
  console.log('');

  // Step 4: GM populates town with NPCs
  console.log('👥 Breathing life into the townsfolk...');
  const npcs = await gm.generateStartingNPCs(town, 7);
  console.log(`   ✓ ${npcs.length} souls now dwell in ${town.name}`);
  console.log('');

  // Step 5: GM creates main quest
  console.log('📜 Weaving the threads of destiny...');
  const mainQuest = await gm.generateMainQuest({ town, npcs });
  console.log(`   ✓ Quest received: "${mainQuest.title}"`);
  console.log('');

  // Step 6: GM generates surrounding locations (sparse)
  console.log('🗺️  Sketching the world beyond...');
  const surroundingLocations = await gm.generateSparseLocations(town);
  console.log(`   ✓ ${surroundingLocations.length} locations whispered into existence`);
  console.log('');

  // Step 7: Create world state
  const world = new GeneratedWorld();
  world.seed = seed;
  world.name = await gm.generateWorldName();
  world.locations.set(town.id, town);
  surroundingLocations.forEach(loc => world.locations.set(loc.id, loc));
  npcs.forEach(npc => world.npcs.set(npc.id, npc));
  world.mainQuest = mainQuest;
  world.gm = gm;

  // Step 8: Create player character
  const player = new Character({
    id: 'player',
    name: playerName,
    isPlayer: true,
    stats: generateStartingStats(),
    inventory: new Inventory(),
    state: {
      location: town.id,
      currentQuest: mainQuest.id
    }
  });

  world.player = player;
  town.addCharacter(player.id);

  // Step 9: GM narrates world introduction
  console.log('═'.repeat(60));
  console.log('');
  const introduction = await gm.narrateWorldIntroduction({
    world, town, mainQuest, player
  });
  console.log(introduction);
  console.log('');
  console.log('═'.repeat(60));
  console.log('');
  console.log('Your journey begins...');
  console.log('');

  return world;
}
```

**Example Game Start Output**:
```
════════════════════════════════════════════════════════════
         🎭 OLLAMA RPG - A Chronicle Begins 🎭
════════════════════════════════════════════════════════════

The Chronicler stirs, weaving a new world for Aldric...

World Seed: 1732052947362

🏰 Manifesting a town from the mists...
   ✓ Millhaven has emerged

👥 Breathing life into the townsfolk...
   ✓ 7 souls now dwell in Millhaven

📜 Weaving the threads of destiny...
   ✓ Quest received: "The Shadow Trade"

🗺️  Sketching the world beyond...
   ✓ 10 locations whispered into existence

════════════════════════════════════════════════════════════

🎭 The Chronicler speaks:

You stand at the edge of Millhaven, a town built along a
rushing river where water wheels turn endlessly, grinding
grain from the surrounding farmlands. The smell of fresh
bread mingles with the scent of river water, and the sound
of grinding stones echoes through the streets.

But all is not well in Millhaven. Gareth, the Master Miller,
approaches you with worry etched on his weathered face.

"You look like someone who can help," he says urgently.
"Grain shipments have been disappearing—enough to threaten
the entire town's survival. If this continues, Millhaven
will starve before winter. Will you uncover who's behind
these thefts and stop them before it's too late?"

Quest Added: The Shadow Trade
- Talk to Gareth about the missing grain
- Investigate the mill and look for clues
- Question townsfolk who might have seen something

════════════════════════════════════════════════════════════

Your journey begins...

>
```

---

## 🔄 Dynamic Expansion During Gameplay

### Triggering Further Generation

```javascript
// When player asks about a location
> "What's north of here?"

GameMaster.onPlayerInquiry('direction_query', { direction: 'north' }) {
  // Find sparse locations to the north
  const northernLocations = this.findLocationsByDirection(currentLocation, 'north');

  // Expand details on nearest one
  if (northernLocations.length > 0) {
    const nearest = northernLocations[0];
    await this.expandLocationDetails(nearest, 'partial');

    return this.narrateDirectionInfo({
      locations: northernLocations,
      direction: 'north'
    });
  } else {
    // Nothing generated yet in that direction - create new sparse location
    const newLocation = await this.generateLocationInDirection(currentLocation, 'north');
    this.world.locations.set(newLocation.id, newLocation);

    return this.narrateDirectionInfo({
      locations: [newLocation],
      direction: 'north'
    });
  }
}

// When player travels to location
> travel Whisperwood Forest

TravelSystem.travel(player, 'whisperwood_forest') {
  const location = world.locations.get('whisperwood_forest');

  // Fully expand location before arrival
  await world.ensureLocationDetails(location.id, 'full');

  // Location now has full details, NPCs, items, secrets, connections
  // New sparse locations may have been generated as connections
}

// When player completes quest
GameMaster.onQuestComplete(quest) {
  // 60% chance to generate follow-up quest
  if (Math.random() < 0.6) {
    const nextQuest = await this.generateFollowUpQuest({
      completedQuest: quest,
      worldState: this.worldState
    });

    this.world.sideQuests.push(nextQuest);

    return this.narrateQuestOffer(nextQuest);
  }
}

// Random exploration
// 10% chance per location visit to discover something new
GameMaster.onLocationVisit(location) {
  if (Math.random() < 0.1) {
    const discovery = await this.generateDiscovery(location);

    if (discovery.type === 'location') {
      // New hidden location found
      const secret = await this.generateSecretLocation(location);
      this.world.locations.set(secret.id, secret);
      location.addExit('hidden', secret.id);

      return this.narrateDiscovery(secret);
    } else if (discovery.type === 'npc') {
      // Random NPC encounter
      const npc = await this.generateEncounterNPC(location);
      this.world.npcs.set(npc.id, npc);
      location.addCharacter(npc.id);

      return this.narrateEncounter(npc);
    }
  }
}
```

---

## 📊 Summary: Layered Detail System

### Detail Levels

| Level | When | What Exists |
|-------|------|-------------|
| **Sparse** | World gen | Name, type, coordinates, rumor |
| **Partial** | Player asks | Description, what's known, who knows more |
| **Full** | Player visits | Complete details, NPCs, items, secrets, connections |

### World Growth Over Time

```
Game Start:
├─ 1 town (FULL detail)
├─ 7 NPCs (FULL detail)
├─ 1 main quest (FULL detail)
└─ 10 surrounding locations (SPARSE)

After 1 hour of gameplay:
├─ 1 town (FULL)
├─ 12 NPCs (3 newly generated)
├─ 1 main quest + 2 side quests
├─ 3 visited locations (FULL)
├─ 7 discovered locations (PARTIAL)
├─ 15 sparse locations (5 new ones generated)
└─ 1 dungeon (generated when player found entrance)

After 5 hours:
├─ 1 town + 2 villages (FULL)
├─ 30+ NPCs
├─ 1 main quest + 8 side quests (3 completed)
├─ 15 fully explored locations
├─ 30+ discovered locations
├─ 50+ sparse locations (world keeps expanding)
└─ 3 dungeons (1 cleared, 2 active)
```

---

## 🎯 Benefits of This Approach

✅ **No Pre-Written Content** - Everything generated fresh each playthrough
✅ **Efficient** - Only generate what's needed
✅ **Infinite World** - Can expand indefinitely
✅ **Coherent** - GM ensures everything fits together
✅ **Player-Driven** - World expands based on player curiosity
✅ **Deterministic** - Same seed = same world (for testing/sharing)
✅ **Emergent Stories** - Unexpected connections arise naturally

---

## 🚀 Implementation Priority

### Phase 1: Core Generation (Week 1)
1. World initialization flow
2. Starting town generation
3. NPC generation (7-10)
4. Main quest generation
5. Sparse location generation (10-15)

### Phase 2: Progressive Expansion (Week 2)
6. Location detail expansion (partial)
7. Location full expansion (on visit)
8. Dynamic NPC generation
9. Follow-up quest generation

### Phase 3: Advanced Features (Week 3)
10. Dungeon generation on discovery
11. Random encounter generation
12. Secret/discovery system
13. World coherence tracking

**Ready to implement this system?**
