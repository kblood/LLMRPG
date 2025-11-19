# Narrative Context & UI Design

**Created**: November 19, 2025
**Purpose**: Define what gets generated to fuel NPC conversations and improve UI context awareness

---

## 🎭 The Problem: NPCs Need Context to Talk

### Current Issue

If we generate locations as just "names on a map", NPCs won't have anything to say about them:

```
❌ BAD:
Player: "What do you know about Whisperwood Forest?"
NPC: *has no context, can't respond meaningfully*
```

### Solution: Generate "Narrative Fuel"

When GM generates sparse locations, also generate **common knowledge** that NPCs can reference:

```
✅ GOOD:
Player: "What do you know about Whisperwood Forest?"
NPC: "Strange lights at night, hunters avoid it. Old Tam says
      he heard whispers there once. Could be faeries, could be
      worse. I'd steer clear if I were you."
```

---

## 🧠 Narrative Fuel System

### What Gets Generated at World Start

```javascript
{
  // Sparse location
  location: {
    id: "whisperwood_forest",
    name: "Whisperwood Forest",
    type: "forest",
    coordinates: { x: 100, y: 120, z: 0 },
    description: "[Not yet visited]"
  },

  // Narrative fuel - what NPCs know
  narrativeFuel: {
    // Common knowledge (most NPCs know this)
    commonKnowledge: [
      "Strange lights seen at night among the trees",
      "Located about two hours north of Millhaven",
      "Hunters sometimes hear whispers on the wind",
      "Some believe faeries live there"
    ],

    // Rumors (some NPCs know, accuracy varies)
    rumors: [
      { text: "A hermit lives deep in the forest", likelihood: 0.6 },
      { text: "An old shrine hidden among the trees", likelihood: 0.8 },
      { text: "The forest is cursed", likelihood: 0.3 }
    ],

    // Specialists (who knows most about this location)
    specialists: [
      { npcId: "old_tam", reason: "travels often, observant" },
      { npcId: "lyssa", reason: "trades with forest hermit" }
    ],

    // Hooks (things that could lead to quests)
    questHooks: [
      "Missing hunters were last seen heading there",
      "Strange symbol carved into trees matches old legends"
    ]
  }
}
```

### How NPCs Use Narrative Fuel

```javascript
async function generateNPCResponse(npc, playerQuestion, context) {
  // Check if question is about a location
  const mentionedLocation = findLocationInQuestion(playerQuestion);

  if (mentionedLocation) {
    const fuel = mentionedLocation.narrativeFuel;

    // Build context for LLM
    const npcContext = {
      // What this NPC knows
      knownFacts: npc.isSpecialist(mentionedLocation)
        ? [...fuel.commonKnowledge, ...fuel.rumors.map(r => r.text)]
        : fuel.commonKnowledge,

      // NPC personality affects how they share info
      personality: npc.personality,

      // Current relationship with player
      relationship: npc.getRelationshipWith('player')
    };

    const prompt = `
      You are ${npc.name}, ${npc.role}.

      The player asked: "${playerQuestion}"

      What you know about ${mentionedLocation.name}:
      ${npcContext.knownFacts.join('\n')}

      Respond naturally as ${npc.name} would, based on your personality
      and relationship with the player.
    `;

    return await llm.generate(prompt);
  }
}
```

---

## 🗺️ Enhanced UI: Contextual Lists

### Current Approach (Global Lists)

```
❌ Shows all NPCs everywhere:
> npcs

Available NPCs:
1. Mara (Tavern Keeper)
2. Grok (Blacksmith)
3. Finn (Street Urchin)
... (NPCs from other towns too!)
```

### New Approach (Location-Aware Lists)

```
✅ Shows nearby NPCs and context:
> look

═══════════════════════════════════════════════════════
📍 MILLHAVEN - Market Square
═══════════════════════════════════════════════════════

A bustling marketplace filled with stalls and vendors...

👥 PEOPLE HERE:
  • Gareth (Master Miller) - seems worried
  • Lyssa (Grain Merchant) - watching you
  • Old Tam (Bridge Keeper) - leaning on his staff

📜 ACTIVE QUESTS:
  ⭐ The Shadow Trade (Main)
     ├─ [✓] Talk to Gareth about the missing grain
     ├─ [ ] Investigate the mill
     └─ [ ] Question townsfolk

🗺️ NEARBY LOCATIONS:
  North: Whisperwood Forest (2 hrs) - strange lights at night
  East: Old Granite Quarry (3 hrs) - abandoned, unsafe
  South: The Grand Mill (15 min) - Gareth's workplace
  West: Stone Bridge (5 min) - Old Tam watches over it

═══════════════════════════════════════════════════════
> talk gareth
```

---

## 📋 Contextual Commands

### Enhanced Commands

```javascript
// LOOK - Context-aware overview
> look
Shows:
- Current location description
- NPCs at this location
- Active quests with progress
- Nearby locations with brief info
- Points of interest

// NPCS - Nearby only
> npcs
Shows:
- NPCs at current location (detailed)
- NPCs in nearby locations (brief)
- NPCs related to active quests

// QUESTS - With location context
> quests
Shows:
- Active quests
- Current objectives
- Where to go next
- Who to talk to

// LOCATIONS - Discovered only
> locations
Shows:
- Current location
- Adjacent locations
- Discovered but not visited
- Rumored locations

// MAP - Visual layout
> map
Shows:
- ASCII map of discovered area
- Your position
- Quest objectives marked
- NPC locations
```

---

## 🔧 Implementation Details

### 1. Generate Narrative Fuel with Locations

```javascript
async generateSparseLocations(startingTown) {
  const prompt = `
    Generate 10 locations around ${startingTown.name}.

    For EACH location, provide:
    1. Name
    2. Type
    3. Direction and distance
    4. Common knowledge (3-4 facts most people know)
    5. Rumors (2-3 things some people say, may be true/false)
    6. Who in town knows most about it
    7. Quest hooks (1-2 potential adventure threads)

    This info will fuel NPC conversations about these places.
  `;

  const response = await this.llm.generate(prompt);
  const locationData = JSON.parse(response);

  return locationData.map(data => {
    const location = new Location({
      id: generateId(data.name),
      name: data.name,
      type: data.type,
      // ... coordinates etc
    });

    // Add narrative fuel
    location.narrativeFuel = {
      commonKnowledge: data.commonKnowledge,
      rumors: data.rumors,
      specialists: data.specialists.map(name => {
        // Find NPC by name in town
        return { npcId: findNPCByName(name), reason: data.reason };
      }),
      questHooks: data.questHooks
    };

    return location;
  });
}
```

### 2. Generate NPC Relationships & Knowledge

```javascript
async generateStartingNPCs(town, locations) {
  const prompt = `
    Generate 7 NPCs for ${town.name}.

    Context:
    - Town situation: ${town.situation}
    - Nearby locations: ${locations.map(l => l.name).join(', ')}

    For each NPC:
    1. Name, role, personality
    2. Knowledge specialties (what locations/topics they know about)
    3. Relationships with other NPCs (2-3 connections)
    4. What they'd say about the town situation
    5. Rumors they've heard

    Make NPCs interconnected and knowledgeable about the world.
  `;

  const npcData = await this.llm.generate(prompt);

  return npcData.map(data => {
    const npc = new Character({
      id: generateId(data.name),
      name: data.name,
      role: data.role,
      // ... other properties
    });

    // Add knowledge system
    npc.knowledge = {
      specialties: data.specialties, // ["Whisperwood Forest", "Local history"]
      rumors: data.rumors,
      opinions: data.opinions
    };

    // Add relationships
    npc.relationships = new Map();
    data.relationships.forEach(rel => {
      npc.relationships.set(rel.npcId, {
        level: rel.level,
        reason: rel.reason
      });
    });

    return npc;
  });
}
```

### 3. Enhanced "Look" Command

```javascript
async function lookCommand(player, world) {
  const location = world.getLocation(player.currentLocation);
  const npcsHere = location.getCharacters()
    .map(id => world.npcs.get(id))
    .filter(npc => npc && !npc.isPlayer);

  const activeQuests = world.getActiveQuests();
  const nearbyLocations = world.getAdjacentLocations(location);

  // Format output
  console.log('═'.repeat(70));
  console.log(`📍 ${location.name.toUpperCase()}`);
  console.log('═'.repeat(70));
  console.log('');
  console.log(location.description);
  console.log('');

  // NPCs at this location
  if (npcsHere.length > 0) {
    console.log('👥 PEOPLE HERE:');
    npcsHere.forEach(npc => {
      const mood = npc.state.mood || 'neutral';
      console.log(`  • ${npc.name} (${npc.role}) - ${mood}`);
    });
    console.log('');
  }

  // Active quests
  if (activeQuests.length > 0) {
    console.log('📜 ACTIVE QUESTS:');
    activeQuests.forEach(quest => {
      const icon = quest.type === 'main' ? '⭐' : '📋';
      console.log(`  ${icon} ${quest.title} (${quest.type})`);

      quest.objectives.slice(0, 3).forEach(obj => {
        const check = obj.completed ? '✓' : ' ';
        console.log(`     ├─ [${check}] ${obj.description}`);
      });

      if (quest.objectives.length > 3) {
        console.log(`     └─ ... and ${quest.objectives.length - 3} more`);
      }
    });
    console.log('');
  }

  // Nearby locations
  if (nearbyLocations.length > 0) {
    console.log('🗺️  NEARBY LOCATIONS:');
    nearbyLocations.forEach(loc => {
      const direction = getDirectionTo(location, loc.location);
      const travelTime = calculateTravelTime(location, loc.location);
      const rumor = loc.location.narrativeFuel?.commonKnowledge[0] || '';

      console.log(`  ${direction}: ${loc.location.name} (${formatTime(travelTime)}) - ${rumor}`);
    });
    console.log('');
  }

  console.log('═'.repeat(70));
}
```

### 4. Context-Aware NPC List

```javascript
async function npcsCommand(player, world) {
  const currentLocation = world.getLocation(player.currentLocation);
  const npcsHere = currentLocation.getCharacters()
    .map(id => world.npcs.get(id))
    .filter(npc => npc && !npc.isPlayer);

  const nearbyLocations = world.getAdjacentLocations(currentLocation);
  const npcsNearby = nearbyLocations.flatMap(loc =>
    loc.location.getCharacters()
      .map(id => ({ npc: world.npcs.get(id), location: loc.location }))
      .filter(obj => obj.npc && !obj.npc.isPlayer)
  );

  const questRelatedNPCs = world.getActiveQuests()
    .flatMap(q => q.objectives)
    .filter(obj => obj.targetNPC)
    .map(obj => world.npcs.get(obj.targetNPC));

  console.log('👥 PEOPLE\n');

  // NPCs here (can talk to immediately)
  if (npcsHere.length > 0) {
    console.log('AT THIS LOCATION:');
    npcsHere.forEach(npc => {
      const rel = npc.getRelationshipWith('player');
      const relStr = formatRelationship(rel);
      console.log(`  • ${npc.name} - ${npc.role}`);
      console.log(`    ${relStr} | ${npc.state.currentConcern || 'Available to talk'}`);
    });
    console.log('');
  }

  // NPCs nearby (must travel to)
  if (npcsNearby.length > 0) {
    console.log('NEARBY:');
    npcsNearby.slice(0, 5).forEach(obj => {
      console.log(`  • ${obj.npc.name} - at ${obj.location.name}`);
    });
    console.log('');
  }

  // Quest-related NPCs
  if (questRelatedNPCs.length > 0) {
    console.log('QUEST RELATED:');
    questRelatedNPCs.forEach(npc => {
      const loc = world.getNPCLocation(npc.id);
      console.log(`  • ${npc.name} - ${loc.name}`);
    });
    console.log('');
  }

  console.log(`Type 'talk <name>' to start a conversation`);
}
```

---

## 📦 Data Structure Updates

### Enhanced Location

```javascript
class Location {
  constructor(data) {
    // ... existing properties

    // NEW: Narrative fuel for NPC conversations
    this.narrativeFuel = data.narrativeFuel || {
      commonKnowledge: [],   // Facts most NPCs know
      rumors: [],            // Rumors (may be true/false)
      specialists: [],       // NPCs who know most
      questHooks: [],        // Potential quest threads
      history: null,         // Optional lore
      currentEvents: []      // What's happening now
    };

    // NEW: Points of interest (for exploration)
    this.pointsOfInterest = data.pointsOfInterest || [];

    // NEW: Active events at this location
    this.activeEvents = data.activeEvents || [];
  }
}
```

### Enhanced NPC

```javascript
class Character {
  constructor(data) {
    // ... existing properties

    // NEW: Knowledge system
    this.knowledge = data.knowledge || {
      specialties: [],       // Topics/locations they know well
      rumors: [],            // Rumors they've heard
      secrets: [],           // Hidden information
      opinions: new Map()    // Opinions on topics/people
    };

    // NEW: Current state details
    this.state = {
      location: data.location,
      currentConcern: data.currentConcern,
      mood: data.mood || 'neutral',
      activity: data.activity || 'idle',  // what they're doing
      availability: data.availability || 'available'  // can they talk?
    };
  }

  // Check if NPC is specialist on topic
  isSpecialist(topic) {
    return this.knowledge.specialties.includes(topic) ||
           this.knowledge.specialties.includes(topic.id);
  }

  // Get what NPC knows about location
  getKnowledgeAbout(location) {
    const fuel = location.narrativeFuel;
    const knowledge = [...fuel.commonKnowledge];

    if (this.isSpecialist(location)) {
      knowledge.push(...fuel.rumors.map(r => r.text));
      if (fuel.history) knowledge.push(fuel.history);
    }

    return knowledge;
  }
}
```

### Enhanced Quest

```javascript
class Quest {
  constructor(id, data) {
    // ... existing properties

    // NEW: Quest guidance
    this.guidance = data.guidance || {
      currentStep: 0,
      nextLocation: null,     // Where to go
      nextNPC: null,          // Who to talk to
      hints: []               // Hints for stuck players
    };

    // NEW: Quest metadata for UI
    this.metadata = {
      icon: data.icon || '📋',
      color: data.color || 'white',
      estimatedTime: data.estimatedTime || 'unknown'
    };
  }

  // Get next step guidance
  getNextStep() {
    const currentObj = this.objectives[this.guidance.currentStep];

    if (!currentObj) return null;

    return {
      objective: currentObj.description,
      location: this.guidance.nextLocation,
      npc: this.guidance.nextNPC,
      hint: this.guidance.hints[this.guidance.currentStep]
    };
  }
}
```

---

## 🎮 Updated World Generation

### Generate with Narrative Context

```javascript
async generateWorld(options) {
  // 1. Generate starting town
  const town = await this.generateStartingTown(options.seed);

  // 2. Generate sparse locations with narrative fuel
  const locations = await this.generateSparseLocations(town);

  // 3. Generate NPCs with knowledge of locations
  const npcs = await this.generateStartingNPCs(town, locations);

  // 4. Generate main quest with guidance
  const mainQuest = await this.generateMainQuest({
    town,
    npcs,
    locations
  });

  // 5. Generate inter-NPC relationships
  await this.generateNPCRelationships(npcs);

  // 6. Generate town events/rumors
  const townRumors = await this.generateTownRumors({
    town,
    npcs,
    locations,
    mainQuest
  });

  // 7. Assign knowledge to NPCs
  this.distributeKnowledge(npcs, locations, townRumors);

  return {
    town,
    locations,
    npcs,
    mainQuest,
    townRumors
  };
}
```

---

## 🎯 Summary of Changes

### What Gets Generated at Start

| Item | Old | New |
|------|-----|-----|
| **Locations** | Just name + coords | + Narrative fuel (knowledge, rumors, hooks) |
| **NPCs** | Name + personality | + Knowledge specialties + relationships |
| **Quests** | Title + objectives | + Guidance (where to go, who to talk to) |
| **Town** | Description | + Current events + rumors + connections |

### UI Improvements

| Command | Old | New |
|---------|-----|-----|
| **npcs** | All NPCs everywhere | Location-aware (here, nearby, quest-related) |
| **look** | Basic description | + NPCs + Quests + Nearby locations |
| **quests** | Simple list | + Progress + Next steps + Guidance |
| **locations** | N/A | Discovered locations + Rumors + Travel time |

### NPC Conversation Improvements

| Aspect | Old | New |
|--------|-----|-----|
| **Knowledge** | None | Common knowledge + specialist knowledge |
| **Opinions** | Generic | Based on personality + relationships |
| **Guidance** | Vague | Can point to locations, other NPCs |
| **Context** | Minimal | Aware of quests, events, rumors |

---

## 🚀 Implementation Order

### Phase 1A: Enhanced Generation (3-4 hours)
1. Update location generation to include narrative fuel
2. Update NPC generation to include knowledge system
3. Generate NPC relationships
4. Generate town rumors/events

### Phase 1B: Contextual UI (2-3 hours)
5. Implement enhanced `look` command
6. Implement location-aware `npcs` command
7. Implement `quests` command with guidance
8. Implement `locations` command

### Phase 1C: NPC Context Integration (2-3 hours)
9. Update dialogue system to use NPC knowledge
10. NPCs reference locations with narrative fuel
11. NPCs give quest guidance
12. NPCs share rumors

**Total Phase 1: ~8-10 hours**

This ensures NPCs have meaningful things to say and players can easily track story progress!
