import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Utility class for loading game data from JSON template files
 */
class DataLoader {
  constructor() {
    this.templatesPath = path.join(__dirname, 'templates');
    this.cache = {};
  }

  /**
   * Load character templates
   * @returns {Object} Character templates data
   */
  loadCharacterTemplates() {
    if (this.cache.characters) {
      return this.cache.characters;
    }

    try {
      const filePath = path.join(this.templatesPath, 'characters.json');
      const data = fs.readFileSync(filePath, 'utf8');
      this.cache.characters = JSON.parse(data);
      return this.cache.characters;
    } catch (error) {
      console.error('[DataLoader] Failed to load character templates:', error);
      return this.getDefaultCharacterTemplates();
    }
  }

  /**
   * Load quest templates
   * @returns {Object} Quest templates data
   */
  loadQuestTemplates() {
    if (this.cache.quests) {
      return this.cache.quests;
    }

    try {
      const filePath = path.join(this.templatesPath, 'quests.json');
      const data = fs.readFileSync(filePath, 'utf8');
      this.cache.quests = JSON.parse(data);
      return this.cache.quests;
    } catch (error) {
      console.error('[DataLoader] Failed to load quest templates:', error);
      return this.getDefaultQuestTemplates();
    }
  }

  /**
   * Load world templates
   * @returns {Object} World templates data
   */
  loadWorldTemplates() {
    if (this.cache.world) {
      return this.cache.world;
    }

    try {
      const filePath = path.join(this.templatesPath, 'world.json');
      const data = fs.readFileSync(filePath, 'utf8');
      this.cache.world = JSON.parse(data);
      return this.cache.world;
    } catch (error) {
      console.error('[DataLoader] Failed to load world templates:', error);
      return this.getDefaultWorldTemplates();
    }
  }

  /**
   * Get a random protagonist template
   * @returns {Object} Random protagonist template
   */
  getRandomProtagonistTemplate() {
    const templates = this.loadCharacterTemplates();
    const protagonists = templates.protagonist_templates || [];
    if (protagonists.length === 0) {
      return this.getDefaultProtagonist();
    }
    return protagonists[Math.floor(Math.random() * protagonists.length)];
  }

  /**
   * Get NPC archetype by ID
   * @param {string} archetypeId - The archetype ID
   * @returns {Object} NPC archetype data
   */
  getNPCArchetype(archetypeId) {
    const templates = this.loadCharacterTemplates();
    const archetypes = templates.npc_archetypes || [];
    return archetypes.find(a => a.id === archetypeId) || archetypes[0];
  }

  /**
   * Get a random main quest template
   * @returns {Object} Random main quest template
   */
  getRandomMainQuestTemplate() {
    const templates = this.loadQuestTemplates();
    const mainQuestType = templates.quest_types?.find(qt => qt.category === 'main');
    if (!mainQuestType || !mainQuestType.templates || mainQuestType.templates.length === 0) {
      return this.getDefaultMainQuest();
    }
    return mainQuestType.templates[Math.floor(Math.random() * mainQuestType.templates.length)];
  }

  /**
   * Get all side quest templates
   * @returns {Array} Side quest templates
   */
  getSideQuestTemplates() {
    const templates = this.loadQuestTemplates();
    const sideQuestType = templates.quest_types?.find(qt => qt.category === 'side');
    return sideQuestType?.templates || [];
  }

  /**
   * Get quest variables for template substitution
   * @returns {Object} Quest variables
   */
  getQuestVariables() {
    const templates = this.loadQuestTemplates();
    return templates.variables || {};
  }

  /**
   * Generate a city name
   * @param {string} size - City size (small, medium, large)
   * @returns {Object} City data
   */
  generateCity(size = 'medium') {
    const templates = this.loadWorldTemplates();
    const cityTemplate = templates.location_templates?.cities?.[0];

    if (!cityTemplate) {
      return { name: 'Riverside', size, danger: 'safe' };
    }

    const prefix = cityTemplate.prefixes[Math.floor(Math.random() * cityTemplate.prefixes.length)];
    const suffix = cityTemplate.suffixes[Math.floor(Math.random() * cityTemplate.suffixes.length)];
    const name = `${prefix} ${suffix}`;

    const sizeData = cityTemplate.size_categories[size] || cityTemplate.size_categories.medium;
    const characteristic = cityTemplate.characteristics[Math.floor(Math.random() * cityTemplate.characteristics.length)];

    return {
      name,
      size,
      type: 'city',
      danger: 'safe',
      characteristic,
      population: Math.floor(Math.random() * (sizeData.population_range[1] - sizeData.population_range[0])) + sizeData.population_range[0],
      districts: sizeData.districts,
      services: sizeData.services
    };
  }

  /**
   * Generate a dungeon
   * @param {string} difficulty - Dungeon difficulty (easy, medium, hard, deadly)
   * @returns {Object} Dungeon data
   */
  generateDungeon(difficulty = 'medium') {
    const templates = this.loadWorldTemplates();
    const dungeonTemplate = templates.location_templates?.dungeons?.[0];

    if (!dungeonTemplate) {
      return { name: 'Dark Cavern', difficulty, danger: 'medium' };
    }

    const adjective = dungeonTemplate.adjectives[Math.floor(Math.random() * dungeonTemplate.adjectives.length)];
    const type = dungeonTemplate.types[Math.floor(Math.random() * dungeonTemplate.types.length)];
    const name = `The ${adjective} ${type}`;

    const difficultyData = dungeonTemplate.difficulty_levels[difficulty] || dungeonTemplate.difficulty_levels.medium;
    const feature = dungeonTemplate.features[Math.floor(Math.random() * dungeonTemplate.features.length)];

    return {
      name,
      type: 'dungeon',
      difficulty,
      danger: difficultyData.danger,
      levelRange: difficultyData.level_range,
      enemyCount: difficultyData.enemy_count,
      feature
    };
  }

  /**
   * Generate a landmark
   * @returns {Object} Landmark data
   */
  generateLandmark() {
    const templates = this.loadWorldTemplates();
    const landmarkTemplate = templates.location_templates?.landmarks?.[0];

    if (!landmarkTemplate) {
      return { name: 'Misty Forest', type: 'landmark', danger: 'low' };
    }

    const descriptor = landmarkTemplate.descriptors[Math.floor(Math.random() * landmarkTemplate.descriptors.length)];
    const feature = landmarkTemplate.features[Math.floor(Math.random() * landmarkTemplate.features.length)];
    const name = `${descriptor} ${feature}`;

    const property = landmarkTemplate.special_properties[Math.floor(Math.random() * landmarkTemplate.special_properties.length)];

    return {
      name,
      type: 'landmark',
      danger: 'low',
      specialProperty: property
    };
  }

  /**
   * Generate a special location
   * @returns {Object} Special location data
   */
  generateSpecialLocation() {
    const templates = this.loadWorldTemplates();
    const specialTemplates = templates.location_templates?.special_locations || [];

    if (specialTemplates.length === 0) {
      return { name: 'Mysterious Tower', type: 'special', danger: 'medium' };
    }

    const template = specialTemplates[Math.floor(Math.random() * specialTemplates.length)];
    let name = template.name_template || template.name;

    // Handle name substitution
    if (template.wizard_names) {
      const wizardName = template.wizard_names[Math.floor(Math.random() * template.wizard_names.length)];
      name = name.replace('{wizard_name}', wizardName);
    } else if (template.dragon_names) {
      const dragonName = template.dragon_names[Math.floor(Math.random() * template.dragon_names.length)];
      name = name.replace('{dragon_name}', dragonName);
    }

    return {
      name,
      type: 'special',
      danger: template.danger,
      description: template.description,
      uniqueNPCs: template.unique_npcs
    };
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache = {};
  }

  // Default fallback methods
  getDefaultCharacterTemplates() {
    return {
      protagonist_templates: [{
        id: 'default_hero',
        name: 'Kael',
        archetype: 'warrior',
        stats: { str: 14, dex: 12, con: 13, int: 10, wis: 11, cha: 12 }
      }],
      npc_archetypes: [{
        id: 'merchant',
        personality_ranges: { greed: [40, 60], honesty: [50, 70], friendliness: [60, 80] }
      }]
    };
  }

  getDefaultQuestTemplates() {
    return {
      quest_types: [{
        category: 'main',
        templates: [{
          id: 'default_quest',
          title_template: 'The Ancient Quest',
          description_template: 'Embark on a great adventure'
        }]
      }]
    };
  }

  getDefaultWorldTemplates() {
    return {
      location_templates: {
        cities: [],
        dungeons: [],
        landmarks: []
      }
    };
  }

  getDefaultProtagonist() {
    return {
      id: 'default_hero',
      name: 'Kael',
      archetype: 'warrior',
      stats: { str: 14, dex: 12, con: 13, int: 10, wis: 11, cha: 12 }
    };
  }

  getDefaultMainQuest() {
    return {
      id: 'default_quest',
      title_template: 'The Ancient Quest',
      description_template: 'Embark on a great adventure',
      stages: []
    };
  }
}

// Export singleton instance
export const dataLoader = new DataLoader();
