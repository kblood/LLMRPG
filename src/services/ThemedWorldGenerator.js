import { Character } from '../entities/Character.js';
import { Personality } from '../ai/personality/Personality.js';
import { CharacterStats } from '../systems/stats/CharacterStats.js';
import { Inventory } from '../systems/items/Inventory.js';
import { Equipment } from '../systems/items/Equipment.js';
import { AbilityManager } from '../systems/abilities/AbilityManager.js';
import { ThemeEngine } from '../systems/theme/ThemeEngine.js';
import { DynamicContentGenerator } from '../systems/theme/DynamicContentGenerator.js';
import { GameMaster } from '../systems/GameMaster.js';

/**
 * ThemedWorldGenerator - Shared service for generating themed worlds
 * Used by both UI (GameBackend) and tests to ensure consistency
 * 
 * This is the canonical implementation that both systems should use.
 * 
 * @class ThemedWorldGenerator
 */
export class ThemedWorldGenerator {
  constructor(ollama, eventBus) {
    this.ollama = ollama;
    this.eventBus = eventBus;
  }

  /**
   * Generate a complete themed world with dynamic content
   *
   * @param {Object} config - World generation configuration
   * @param {string} config.theme - Theme name (fantasy, sci-fi, cthulhu, steampunk, dark_fantasy)
   * @param {string} config.playerName - Player character name
   * @param {number} config.npcCount - Number of NPCs to generate
   * @param {number} config.questCount - Number of side quests to generate
   * @param {number} config.itemCount - Number of items to generate
   * @param {number} config.locationCount - Number of locations to generate
   * @param {string} config.worldTitle - Title of the world
   * @param {string} config.customInstructions - Custom instructions for world generation
   * @returns {Promise<Object>} Generated world configuration
   */
  async generateThemedWorld(config = {}) {
    console.log('[ThemedWorldGenerator] Generating themed world:', config);

    // Initialize theme system
    const themeEngine = new ThemeEngine();
    const contentGenerator = new DynamicContentGenerator(themeEngine, this.ollama, config.customInstructions);

    // Set theme
    const selectedTheme = config.theme || 'fantasy';
    themeEngine.setTheme(selectedTheme);
    console.log(`[ThemedWorldGenerator] Theme set to: ${selectedTheme}`);

    // Create GameMaster with theme support
    const gameMaster = new GameMaster(this.ollama, this.eventBus);
    gameMaster.setThemeEngine(themeEngine);
    gameMaster.setContentGenerator(contentGenerator);

    // Generate player character
    console.log('[ThemedWorldGenerator] Creating player character...');
    const player = this.createPlayerCharacter(config.playerName || 'Kael', selectedTheme);

    // Generate opening narration
    console.log('[ThemedWorldGenerator] Generating opening narration...');
    const openingNarration = await gameMaster.generateThemedOpeningNarration(player, selectedTheme);

    // Generate NPCs
    console.log('[ThemedWorldGenerator] Generating NPCs...');
    const npcCount = config.npcCount || 10;
    const npcsData = await contentGenerator.generateNPCRoster(npcCount, {});
    const npcs = this.createNPCCharacters(npcsData);

    // Generate quests
    console.log('[ThemedWorldGenerator] Generating quests...');
    const sidequests = [];
    for (let i = 0; i < (config.questCount || 5); i++) {
      const quest = await contentGenerator.generateQuest({});
      sidequests.push({
        ...quest,
        id: `quest_${i}`
      });
    }

    // Generate main quest
    console.log('[ThemedWorldGenerator] Generating main quest...');
    const mainQuest = await contentGenerator.generateMainQuest(player, {});

    // Generate items
    console.log('[ThemedWorldGenerator] Generating items...');
    const items = [];
    const categories = ['weapons', 'armor', 'artifacts'];
    for (let i = 0; i < (config.itemCount || 15); i++) {
      const category = categories[i % categories.length];
      const item = await contentGenerator.generateItem({ category });
      items.push({
        ...item,
        id: `item_${i}`
      });
    }

    // Generate locations
    console.log('[ThemedWorldGenerator] Generating locations...');
    const locations = [];
    for (let i = 0; i < (config.locationCount || 8); i++) {
      const location = await contentGenerator.generateLocation({});
      locations.push({
        ...location,
        id: `location_${i}`
      });
    }

    // Return complete world configuration
    const worldConfig = {
      title: config.worldTitle || `${selectedTheme} World`,
      theme: selectedTheme,
      playerName: player.name,
      player: player,
      openingNarration,
      npcs: npcs,
      npcsData: npcsData, // Raw data for serialization
      quests: {
        main: mainQuest,
        side: sidequests
      },
      items,
      locations,
      themeEngine,
      contentGenerator,
      gameMaster
    };

    console.log('[ThemedWorldGenerator] World generation complete!');
    console.log(`  Theme: ${selectedTheme}`);
    console.log(`  NPCs: ${npcs.length}`);
    console.log(`  Quests: ${sidequests.length + 1}`);
    console.log(`  Items: ${items.length}`);
    console.log(`  Locations: ${locations.length}`);

    return worldConfig;
  }

  /**
   * Create player character with stats and equipment
   * @param {string} playerName - Player name
   * @param {string} theme - Theme name for backstory
   * @returns {Character} Player character
   */
  createPlayerCharacter(playerName, theme) {
    const playerStats = new CharacterStats({
      strength: 12,
      dexterity: 10,
      constitution: 14,
      intelligence: 11,
      wisdom: 10,
      charisma: 13
    });

    const playerInventory = new Inventory({ 
      maxSlots: 20, 
      maxWeight: 100, 
      gold: 75 
    });
    
    const playerEquipment = new Equipment();
    const playerAbilities = new AbilityManager();

    const player = new Character('player', playerName, {
      role: 'protagonist',
      personality: new Personality({
        friendliness: 60,
        intelligence: 70,
        caution: 50,
        honor: 75,
        greed: 40,
        aggression: 35
      }),
      backstory: `A curious wanderer in the ${theme} world, seeking adventure and purpose`,
      stats: playerStats,
      inventory: playerInventory,
      equipment: playerEquipment,
      abilities: playerAbilities
    });

    return player;
  }

  /**
   * Create NPC Character objects from generated data
   * @param {Array} npcsData - Array of NPC data from content generator
   * @returns {Array<Character>} Array of NPC Character objects
   */
  createNPCCharacters(npcsData) {
    return npcsData.map((npcData, idx) => {
      const npcId = npcData.id || `npc_${idx}`;
      
      return new Character(npcId, npcData.name, {
        role: npcData.role,
        archetype: npcData.archetype,
        personality: new Personality(npcData.personality || {
          friendliness: 50,
          intelligence: 50,
          caution: 50,
          honor: 50,
          greed: 50,
          aggression: 50
        }),
        backstory: npcData.backstory,
        stats: new CharacterStats(),
        customProperties: {
          archetype: npcData.archetype,
          themeData: npcData.themeData
        }
      });
    });
  }

  /**
   * Generate a minimal themed world (faster for testing)
   * @param {Object} config - Configuration
   * @returns {Promise<Object>} Minimal world configuration
   */
  async generateMinimalThemedWorld(config = {}) {
    console.log('[ThemedWorldGenerator] Generating minimal themed world:', config);

    // Initialize theme system
    const themeEngine = new ThemeEngine();
    const contentGenerator = new DynamicContentGenerator(themeEngine, this.ollama);

    // Set theme
    const selectedTheme = config.theme || 'fantasy';
    themeEngine.setTheme(selectedTheme);
    console.log(`[ThemedWorldGenerator] Theme set to: ${selectedTheme}`);

    // Create GameMaster with theme support
    const gameMaster = new GameMaster(this.ollama, this.eventBus);
    gameMaster.setThemeEngine(themeEngine);
    gameMaster.setContentGenerator(contentGenerator);

    // Generate player character
    const player = this.createPlayerCharacter(config.playerName || 'Kael', selectedTheme);

    // Generate opening narration
    const openingNarration = await gameMaster.generateThemedOpeningNarration(player, selectedTheme);

    // Generate NPCs (minimal set)
    const npcCount = config.npcCount || 5;
    const npcsData = await contentGenerator.generateNPCRoster(npcCount, {});
    const npcs = this.createNPCCharacters(npcsData);

    return {
      title: config.worldTitle || `${selectedTheme} World`,
      theme: selectedTheme,
      playerName: player.name,
      player: player,
      openingNarration,
      npcs,
      npcsData,
      themeEngine,
      contentGenerator,
      gameMaster
    };
  }
}

export default ThemedWorldGenerator;
