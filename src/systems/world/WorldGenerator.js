import { GameMaster } from '../GameMaster.js';
import { Location } from './Location.js';
import { Character } from '../../entities/Character.js';
import { Quest } from '../quest/Quest.js';
import { QuestManager } from '../quest/QuestManager.js';
import Logger from '../../utils/Logger.js';

/**
 * WorldGenerator - Procedurally generates game world
 *
 * Generates:
 * - Starting town with full details
 * - NPCs with knowledge and relationships
 * - Main quest
 * - Sparse surrounding locations with narrative fuel
 * - Town rumors and events
 */
export class WorldGenerator {
  constructor(gameMaster, options = {}) {
    this.gm = gameMaster;
    this.logger = new Logger('WorldGenerator');
    this.seed = options.seed || Date.now();
    this.questManager = new QuestManager();
  }

  /**
   * Generate complete starting world
   */
  async generateWorld(options) {
    const playerName = options.playerName || 'Hero';
    const difficulty = options.difficulty || 'normal';

    this.logger.info(`Generating world for ${playerName} (seed: ${this.seed})`);

    console.log('');
    console.log('═'.repeat(70));
    console.log('         🎭 THE CHRONICLER AWAKENS');
    console.log('═'.repeat(70));
    console.log('');
    console.log(`Weaving a new world for ${playerName}...`);
    console.log(`World Seed: ${this.seed}`);
    console.log('');

    const world = {
      seed: this.seed,
      name: null,
      player: null,
      startingTown: null,
      locations: new Map(),
      npcs: new Map(),
      mainQuest: null,
      sideQuests: [],
      townRumors: [],
      worldState: {
        time: 0,
        day: 1,
        timeOfDay: 'morning',
        weather: 'clear',
        season: 'spring'
      }
    };

    try {
      // Step 1: Generate starting town
      console.log('🏰 Manifesting a town from the mists...');
      world.startingTown = await this.generateStartingTown();
      world.locations.set(world.startingTown.id, world.startingTown);
      console.log(`   ✓ ${world.startingTown.name} has emerged`);
      console.log('');

      // Step 2: Generate sparse surrounding locations
      console.log('🗺️  Sketching the world beyond...');
      const sparseLocations = await this.generateSparseLocations(world.startingTown);
      sparseLocations.forEach(loc => {
        world.locations.set(loc.id, loc);
      });
      console.log(`   ✓ ${sparseLocations.length} locations whispered into existence`);
      console.log('');

      // Step 3: Generate NPCs with knowledge
      console.log('👥 Breathing life into the townsfolk...');
      const npcs = await this.generateStartingNPCs(
        world.startingTown,
        sparseLocations
      );
      npcs.forEach(npc => {
        world.npcs.set(npc.id, npc);
      });

      // Step 3b: Distribute NPCs across locations
      console.log('📍 Scattering souls across the world...');
      this.distributeNPCsAcrossLocations(npcs, world);
      console.log(`   ✓ ${npcs.length} souls distributed across ${world.startingTown.name} and beyond`);
      console.log('');

      // Step 4: Generate NPC relationships
      console.log('🤝 Forging bonds between people...');
      await this.generateNPCRelationships(npcs);
      console.log(`   ✓ Relationships woven`);
      console.log('');

      // Step 5: Generate main quest
      console.log('📜 Weaving the threads of destiny...');
      world.mainQuest = await this.generateMainQuest({
        town: world.startingTown,
        npcs: Array.from(world.npcs.values()),
        locations: sparseLocations
      });
      console.log(`   ✓ Quest received: "${world.mainQuest.title}"`);
      console.log('');

      // Step 6: Generate town rumors
      console.log('💬 Planting seeds of rumor and mystery...');
      world.townRumors = await this.generateTownRumors({
        town: world.startingTown,
        npcs: Array.from(world.npcs.values()),
        locations: sparseLocations,
        mainQuest: world.mainQuest
      });
      console.log(`   ✓ ${world.townRumors.length} rumors spread through town`);
      console.log('');

      // Step 7: Generate world name
      world.name = await this.generateWorldName(world.startingTown);

      // Step 8: Create player character
      world.player = this.createPlayer(playerName, world.startingTown);
      world.startingTown.addCharacter(world.player.id);

      this.logger.info(`World generation complete: ${world.name}`);

      return world;

    } catch (error) {
      this.logger.error('Failed to generate world:', error);
      throw new Error(`World generation failed: ${error.message}`);
    }
  }

  /**
   * Generate starting town with full details
   */
  async generateStartingTown() {
    const prompt = `Generate a fantasy starting town. Respond with ONLY valid JSON, no other text.

{
  "name": "Millhaven",
  "description": "A prosperous mill town built along a rushing river.",
  "type": "mill_town",
  "population": 450,
  "landmarks": ["The Grand Mill", "River Bridge", "Market Square"],
  "situation": "Grain shipments mysteriously disappearing",
  "industry": "Grain milling and trade",
  "atmosphere": "worried but hopeful"
}

Create a similar town with different details. Return ONLY the JSON object.`.trim();

    const response = await this.gm.ollama.generate(prompt, {
      temperature: 0.9,
      seed: this.seed
    });

    let townData;
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        townData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (error) {
      this.logger.error('Failed to parse town JSON, using fallback');
      // Fallback town
      townData = {
        name: "Millhaven",
        description: "A prosperous mill town along a rushing river.",
        type: "mill_town",
        population: 450,
        landmarks: ["The Grand Mill", "River Bridge", "Market Square"],
        situation: "Grain shipments have been going missing recently.",
        industry: "Grain milling and trade",
        atmosphere: "worried but hopeful"
      };
    }

    const town = new Location({
      id: 'starting_town',
      name: townData.name,
      description: townData.description,
      type: 'town',
      x: 100,
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
        landmarks: townData.landmarks,
        atmosphere: townData.atmosphere
      },
      discovered: true,
      visited: true,
      createdBy: 'chronicler'
    });

    return town;
  }

  /**
   * Generate sparse locations with narrative fuel
   */
  async generateSparseLocations(startingTown, count = 10) {
    // Use fallback for now - LLM JSON generation needs improvement
    const locationData = this.getFallbackLocations(count);

    return locationData.map((data, index) => {
      const coords = this.calculateCoordinatesFromDirection(
        startingTown.coordinates,
        data.direction,
        data.distance
      );

      return new Location({
        id: this.generateLocationId(data.name),
        name: data.name,
        type: data.type,
        description: '[Details unknown - not yet visited]',
        x: coords.x,
        y: coords.y,
        z: coords.z || 0,
        scale: this.estimateScale(data.type),
        indoor: false,
        lit: true,
        safe: data.type !== 'dungeon' && data.type !== 'ruins',
        discovered: true, // Nearby locations are known via rumors/common knowledge
        visited: false,
        customProperties: {
          narrativeFuel: data.narrativeFuel,
          detailLevel: 'sparse',
          distanceFromStart: data.distance,
          direction: data.direction
        },
        createdBy: 'chronicler'
      });
    });
  }

  /**
   * Generate NPCs with knowledge system and grid positioning
   */
  async generateStartingNPCs(town, locations, count = 7) {
    // Use fallback for now - LLM JSON generation needs improvement
    const npcData = this.getFallbackNPCs().slice(0, count);

    // Define default NPC locations in town (grid positions)
    const npcLocations = [
      { x: 10, y: 10, locationHint: 'Near the Mill' },      // Gareth
      { x: 14, y: 8, locationHint: 'Market area' },         // Lyssa
      { x: 7, y: 12, locationHint: 'By the Bridge' }        // Old Tam
    ];

    return npcData.map((data, index) => {
      const npc = new Character(`npc_${index}`, data.name, {
        role: data.role,
        personality: data.personality,
        backstory: data.background,
        currentLocation: town.id
      });

      // Add custom properties for world generation
      npc.currentConcern = data.currentConcern;
      npc.mood = data.mood || 'neutral';
      npc.activity = 'idle';
      npc.availability = 'available';

      // Add grid positioning within town
      const locData = npcLocations[index] || { x: 10 + Math.random() * 10, y: 10 + Math.random() * 10, locationHint: 'In town' };
      npc.gridPosition = {
        x: Math.floor(locData.x),
        y: Math.floor(locData.y),
        locationHint: locData.locationHint
      };

      // Add knowledge system
      npc.knowledge = {
        specialties: data.knowledge.specialties || [],
        rumors: data.knowledge.rumors || [],
        secrets: [],
        opinions: new Map()
      };

      // Store pending relationships for later processing
      npc.pendingRelationships = data.relationships || [];

      // Add schedule information (for future NPC movement system)
      npc.schedule = data.schedule || [
        { timeOfDay: 'morning', location: town.id, activity: 'work' },
        { timeOfDay: 'afternoon', location: town.id, activity: 'work' },
        { timeOfDay: 'evening', location: town.id, activity: 'rest' }
      ];

      return npc;
    });
  }

  /**
   * Generate relationships between NPCs
   */
  async generateNPCRelationships(npcs) {
    // Process pending relationships
    npcs.forEach(npc => {
      if (!npc || !npc.pendingRelationships) return;

      const pending = npc.pendingRelationships || [];

      pending.forEach(rel => {
        // Find target NPC by name
        const targetNPC = npcs.find(n => n && n.name === rel.npc);

        if (targetNPC && npc.relationships) {
          npc.relationships.setRelationship(targetNPC.id, rel.level || 0);
        }
      });

      // Clean up
      delete npc.pendingRelationships;
    });
  }

  /**
   * Distribute NPCs across different locations
   */
  distributeNPCsAcrossLocations(npcs, world) {
    if (!npcs || npcs.length === 0) return;

    // Primary location for most NPCs
    world.startingTown.addCharacter(npcs[0].id);

    // Distribute remaining NPCs to sparse locations or keep in starting town
    const sparseLocationIds = Array.from(world.locations.values())
      .filter(loc => loc.id !== world.startingTown.id)
      .map(loc => loc.id);

    for (let i = 1; i < npcs.length; i++) {
      const npc = npcs[i];

      // 70% chance to stay in starting town, 30% distributed
      if (sparseLocationIds.length > 0 && Math.random() < 0.3) {
        // Pick a random sparse location
        const randomLocId = sparseLocationIds[Math.floor(Math.random() * sparseLocationIds.length)];
        const location = world.locations.get(randomLocId);
        if (location) {
          location.addCharacter(npc.id);
          npc.currentLocation = randomLocId;
          console.log(`    - ${npc.name} assigned to ${location.name}`);
        } else {
          world.startingTown.addCharacter(npc.id);
        }
      } else {
        // Keep in starting town
        world.startingTown.addCharacter(npc.id);
      }
    }
  }

  /**
   * Generate main quest - Chronicler-driven narrative
   */
  async generateMainQuest(context) {
    // Generate a main quest from the town's situation
    // This quest is the REASON the player arrives at the town

    const townSituation = context.town.customProperties?.situation || "Trouble brews";
    const townIndustry = context.town.customProperties?.industry || "unknown trade";

    // The Lost Chronicle quest as default, but could be enhanced with LLM later
    const questData = {
      title: "The Lost Chronicle",
      description: `A mysterious ancient artifact has gone missing in ${context.town.name}, and rumors point to a long-forgotten tragedy connected to it. Uncover the truth behind this lost chronicle and restore balance to the village.`,
      why_it_matters: `The town's prosperity depends on understanding what was lost and why`,
      questGiver: "Chronicler",  // Given by the Chronicler narrative, discovered through NPCs
      foundVia: "town_situation",  // How player learns about this quest
      initialObjectives: [
        `Learn about the missing artifact from townsfolk in ${context.town.name}`,
        "Investigate the old locations mentioned in rumors",
        "Uncover the connection to the town's history"
      ],
      longTermArc: [
        "Discover the artifact's true significance",
        "Learn of the tragedy that caused its disappearance",
        "Find the artifact or learn its final fate",
        "Help restore what was lost",
        `Bring peace and understanding to ${context.town.name}`
      ],
      guidance: {
        nextLocation: context.town.name,
        nextNPC: context.npcs[0]?.name || "Gareth",
        hint: "Listen to the townspeople - they hold the key to this mystery"
      },
      // Frame information for narrative
      discoveredAtFrame: 1,
      narrative: `The Chronicler has guided you to ${context.town.name} for a reason. There is something lost here—something important that holds the key to a greater mystery.`
    };

    const questId = this.questManager.createQuest({
      title: questData.title,
      description: questData.description,
      type: 'main',
      giver: questData.questGiver,
      foundVia: questData.foundVia,
      objectives: questData.initialObjectives.map((desc, i) => ({
        id: `obj_${i}`,
        description: desc,
        completed: false
      })),
      rewards: {
        experience: 1000,
        reputation: 100,
        narrative: questData.why_it_matters
      },
      state: 'active',
      guidance: questData.guidance,
      arc: questData.longTermArc,
      discoveredAtFrame: questData.discoveredAtFrame,
      narrativeIntroduction: questData.narrative
    });

    return this.questManager.getQuest(questId);
  }

  /**
   * Generate town rumors
   */
  async generateTownRumors(context) {
    // Simple rumors for now
    return [
      { text: context.mainQuest.description, source: 'common knowledge' },
      { text: `${context.town.name} is known for ${context.town.customProperties.industry}`, source: 'common knowledge' }
    ];
  }

  /**
   * Generate world name
   */
  async generateWorldName(town) {
    return `The Lands of ${town.name}`;
  }

  /**
   * Create player character
   */
  createPlayer(name, startingLocation) {
    const player = new Character('player', name, {
      role: 'Adventurer',
      currentLocation: startingLocation.id
    });

    // Mark as player
    player.isPlayer = true;

    // Add player-specific properties
    player.currentConcern = 'Beginning a new adventure';
    player.mood = 'determined';
    player.activity = 'exploring';
    player.availability = 'active';

    return player;
  }

  /**
   * Calculate grid coordinates from direction
   */
  calculateCoordinatesFromDirection(origin, direction, distanceKm) {
    const directions = {
      'north': { x: 0, y: 1 },
      'south': { x: 0, y: -1 },
      'east': { x: 1, y: 0 },
      'west': { x: -1, y: 0 },
      'northeast': { x: 0.7, y: 0.7 },
      'northwest': { x: -0.7, y: 0.7 },
      'southeast': { x: 0.7, y: -0.7 },
      'southwest': { x: -0.7, y: -0.7 }
    };

    const offset = directions[direction.toLowerCase()] || { x: 0, y: 0 };

    return {
      x: Math.round(origin.x + offset.x * distanceKm),
      y: Math.round(origin.y + offset.y * distanceKm),
      z: 0
    };
  }

  /**
   * Generate location ID from name
   */
  generateLocationId(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  }

  /**
   * Estimate scale from location type
   */
  estimateScale(type) {
    const scales = {
      'town': 50,
      'village': 20,
      'city': 100,
      'forest': 30,
      'mountain': 40,
      'cave': 10,
      'dungeon': 15,
      'ruins': 20,
      'default': 10
    };

    return scales[type] || scales.default;
  }

  /**
   * Get fallback locations (for reliable testing)
   */
  getFallbackLocations(count) {
    const locations = [
      {
        name: "Whisperwood Forest",
        type: "forest",
        direction: "north",
        distance: 8,
        narrativeFuel: {
          commonKnowledge: ["Strange lights seen at night", "Dense ancient trees", "About two hours walk north"],
          rumors: [{ text: "A hermit lives deep in the forest", likelihood: 0.6 }],
          specialists: ["Old Tam"],
          questHooks: ["Missing hunters were last seen heading there"]
        }
      },
      {
        name: "Old Granite Quarry",
        type: "ruins",
        direction: "east",
        distance: 12,
        narrativeFuel: {
          commonKnowledge: ["Abandoned mine", "Dangerous unstable ground", "Three hours east"],
          rumors: [{ text: "Miners heard voices in the stone", likelihood: 0.7 }],
          specialists: ["Gareth"],
          questHooks: ["Strange sounds reported at night"]
        }
      },
      {
        name: "Crossroads Inn",
        type: "building",
        direction: "south",
        distance: 20,
        narrativeFuel: {
          commonKnowledge: ["Meeting place for travelers", "Half day journey south", "Good food and ale"],
          rumors: [{ text: "Merchants share news from distant lands", likelihood: 0.9 }],
          specialists: ["Lyssa"],
          questHooks: ["Travelers bring tales of trouble"]
        }
      },
      {
        name: "Thornvale Village",
        type: "village",
        direction: "west",
        distance: 35,
        narrativeFuel: {
          commonKnowledge: ["Rival farming village", "Full day journey west", "Recently very prosperous"],
          rumors: [{ text: "They may be behind the thefts", likelihood: 0.5 }],
          specialists: ["Lyssa", "Gareth"],
          questHooks: ["Suspiciously wealthy lately"]
        }
      },
      {
        name: "The Winding River",
        type: "wilderness",
        direction: "northeast",
        distance: 5,
        narrativeFuel: {
          commonKnowledge: ["Source of the mill's power", "One hour northeast", "Good fishing"],
          rumors: [{ text: "Something lurks upstream", likelihood: 0.4 }],
          specialists: ["Old Tam"],
          questHooks: ["Water levels dropping mysteriously"]
        }
      }
    ];

    return locations.slice(0, Math.min(count, locations.length));
  }

  /**
   * Get fallback NPCs (for reliable testing)
   */
  getFallbackNPCs() {
    return [
      {
        name: "Gareth",
        role: "Master Miller",
        personality: { aggression: 15, friendliness: 75, intelligence: 65, caution: 60, greed: 20, honor: 90 },
        background: "Runs the Grand Mill. Inherited from his father. Proud of his work.",
        currentConcern: "Missing grain shipments threatening his business",
        mood: "worried",
        knowledge: {
          specialties: ["Milling", "Grain trade", "Old Granite Quarry"],
          rumors: ["Thefts are organized", "Rival village involved"]
        },
        relationships: [],
        schedule: [
          { timeOfDay: 'morning', location: 'starting_town', activity: 'work at mill', gridX: 10, gridY: 10 },
          { timeOfDay: 'afternoon', location: 'starting_town', activity: 'work at mill', gridX: 10, gridY: 10 },
          { timeOfDay: 'evening', location: 'starting_town', activity: 'drink at inn', gridX: 8, gridY: 5 }
        ]
      },
      {
        name: "Lyssa",
        role: "Grain Merchant",
        personality: { aggression: 25, friendliness: 55, intelligence: 80, caution: 70, greed: 60, honor: 50 },
        background: "Manages grain trade between farmers and mill. Shrewd businesswoman.",
        currentConcern: "Protecting profit margins during crisis",
        mood: "calculating",
        knowledge: {
          specialties: ["Trade routes", "Thornvale Village", "Crossroads Inn"],
          rumors: ["She knows more than she says", "Has contacts in Thornvale"]
        },
        relationships: [
          { npc: "Gareth", level: -20, reason: "business tension" }
        ],
        schedule: [
          { timeOfDay: 'morning', location: 'starting_town', activity: 'haggle at market', gridX: 14, gridY: 8 },
          { timeOfDay: 'afternoon', location: 'starting_town', activity: 'count coins at market', gridX: 14, gridY: 8 },
          { timeOfDay: 'evening', location: 'starting_town', activity: 'dinner', gridX: 12, gridY: 6 }
        ]
      },
      {
        name: "Old Tam",
        role: "Bridge Keeper",
        personality: { aggression: 10, friendliness: 85, intelligence: 70, caution: 40, greed: 15, honor: 80 },
        background: "Elderly man who maintains the stone bridges. Watches all travelers.",
        currentConcern: "Worried about suspicious strangers",
        mood: "friendly but concerned",
        knowledge: {
          specialties: ["Local gossip", "Whisperwood Forest", "The Winding River"],
          rumors: ["Saw strangers at night", "Lights in the forest"]
        },
        relationships: [
          { npc: "Gareth", level: 40, reason: "old friends" }
        ],
        schedule: [
          { timeOfDay: 'morning', location: 'starting_town', activity: 'maintain bridge', gridX: 7, gridY: 12 },
          { timeOfDay: 'afternoon', location: 'starting_town', activity: 'watch travelers', gridX: 7, gridY: 12 },
          { timeOfDay: 'evening', location: 'starting_town', activity: 'rest at home', gridX: 6, gridY: 14 }
        ]
      }
    ];
  }
}

export default WorldGenerator;
