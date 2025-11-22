/**
 * DynamicContentGenerator - Theme-Aware Content Creation
 *
 * Generates NPCs, items, quests, and other content dynamically based
 * on the current theme. Works in conjunction with the Chronicler/GameMaster.
 */

import { Character } from '../../entities/Character.js';
import { Personality } from '../../ai/personality/Personality.js';

export class DynamicContentGenerator {
  constructor(themeEngine, ollama = null) {
    this.themeEngine = themeEngine;
    this.ollama = ollama;
    this.logger = console;
  }

  /**
   * Generate a theme-aware NPC
   */
  async generateNPC(options = {}) {
    const theme = this.themeEngine.getTheme();
    if (!theme) {
      throw new Error('No theme set. Call themeEngine.setTheme() first.');
    }

    const archetypes = this.themeEngine.getNPCArchetypes();
    const professions = this.themeEngine.getProfessions();
    const themeContext = this.themeEngine.getThemeContext();

    const archetype = options.archetype || this._randomElement(archetypes);
    const profession = options.profession || this._randomElement(professions);

    // Generate name if Ollama is available
    let name = options.name;
    if (!name && this.ollama) {
      try {
        name = await this._generateNPCName(archetype, profession, theme.name);
      } catch (error) {
        this.logger.warn('Failed to generate NPC name via Ollama, using default');
        name = `${profession} ${archetype}`;
      }
    }

    // Generate backstory if Ollama is available
    let backstory = options.backstory;
    if (!backstory && this.ollama) {
      try {
        backstory = await this._generateNPCBackstory(
          name,
          archetype,
          profession,
          theme,
          themeContext
        );
      } catch (error) {
        this.logger.warn('Failed to generate NPC backstory via Ollama');
        backstory = `A ${profession} from the ${theme.name} world`;
      }
    }

    // Generate personality traits
    const personality = this._generatePersonality(archetype, theme.settings.tone);

    return {
      id: `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name || `${profession}`,
      role: profession,
      archetype: archetype,
      backstory: backstory || `A mysterious ${profession}`,
      personality: personality,
      theme: theme.name,
      themeData: {
        tone: theme.settings.tone,
        atmosphere: theme.settings.atmosphere
      }
    };
  }

  /**
   * Generate a theme-aware item
   */
  async generateItem(options = {}) {
    const theme = this.themeEngine.getTheme();
    if (!theme) {
      throw new Error('No theme set. Call themeEngine.setTheme() first.');
    }

    const itemCategories = this.themeEngine.getItemCategories();
    const category = options.category || this._randomElement(['weapons', 'armor', 'artifacts']);
    const items = itemCategories[category] || [];
    const itemType = options.type || this._randomElement(items);
    const rarity = options.rarity || this._randomElement(itemCategories.rarity);

    let description = options.description;
    if (!description && this.ollama) {
      try {
        description = await this._generateItemDescription(itemType, rarity, theme.name);
      } catch (error) {
        this.logger.warn('Failed to generate item description via Ollama');
        description = `A ${rarity} ${itemType}`;
      }
    }

    return {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: options.name || this._generateItemName(itemType, rarity, theme.name),
      type: itemType,
      category: category,
      rarity: rarity,
      description: description || `A ${rarity} ${itemType}`,
      theme: theme.name,
      value: this._calculateItemValue(rarity),
      effects: options.effects || {}
    };
  }

  /**
   * Generate a theme-aware quest
   */
  async generateQuest(options = {}) {
    const theme = this.themeEngine.getTheme();
    if (!theme) {
      throw new Error('No theme set. Call themeEngine.setTheme() first.');
    }

    const questTypes = this.themeEngine.getQuestTypes();
    const questType = options.type || this._randomElement(questTypes);
    const themeContext = this.themeEngine.getThemeContext();

    let title = options.title;
    let description = options.description;
    let objectives = options.objectives || [];

    // Generate title and description if Ollama is available
    if (!title || !description) {
      if (this.ollama) {
        try {
          const generated = await this._generateQuestContent(
            questType,
            theme.name,
            themeContext
          );
          title = title || generated.title;
          description = description || generated.description;
          objectives = objectives.length > 0 ? objectives : generated.objectives || [];
        } catch (error) {
          this.logger.warn('Failed to generate quest content via Ollama');
        }
      }
    }

    // Fallbacks
    title = title || `${questType} Quest`;
    description = description || `A ${theme.name} quest involving ${questType}`;
    objectives = objectives.length > 0 ? objectives : [questType];

    return {
      id: `quest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: title,
      description: description,
      type: questType,
      objectives: objectives,
      theme: theme.name,
      difficulty: options.difficulty || this._calculateDifficulty(questType),
      motivation: theme.quests.motivation,
      rewards: options.rewards || {
        xp: 100,
        gold: 50
      }
    };
  }

  /**
   * Generate a main quest for the game
   */
  async generateMainQuest(options = {}) {
    const theme = this.themeEngine.getTheme();
    if (!theme) {
      throw new Error('No theme set. Call themeEngine.setTheme() first.');
    }

    const themeContext = this.themeEngine.getThemeContext();

    let title = options.title;
    let description = options.description;
    let narrative = options.narrative;
    let objectives = options.objectives || [];

    // Generate main quest with Chronicler if available
    if (!title || !description || !narrative) {
      if (this.ollama) {
        try {
          const generated = await this._generateMainQuestNarrative(
            theme.name,
            themeContext,
            options.player
          );
          title = title || generated.title;
          description = description || generated.description;
          narrative = narrative || generated.narrative;
          objectives = objectives.length > 0 ? objectives : generated.objectives || [];
        } catch (error) {
          this.logger.warn('Failed to generate main quest via Ollama');
        }
      }
    }

    // Fallbacks
    title = title || `The ${theme.name} Destiny`;
    description = description || `Uncover your destiny in this ${theme.name} world`;
    narrative = narrative || `Your journey in the ${theme.name} world begins now.`;
    objectives = objectives.length > 0 ? objectives : ['Begin your journey'];

    return {
      id: `main_quest_${Date.now()}`,
      title: title,
      description: description,
      narrative: narrative,
      objectives: objectives,
      theme: theme.name,
      isMainQuest: true,
      difficulty: 'epic',
      motivation: theme.quests.motivation,
      stages: options.stages || this._generateQuestStages(objectives.length)
    };
  }

  /**
   * Generate a themed world description
   */
  async generateWorldDescription(options = {}) {
    const theme = this.themeEngine.getTheme();
    if (!theme) {
      throw new Error('No theme set. Call themeEngine.setTheme() first.');
    }

    const themeContext = this.themeEngine.getThemeContext();

    if (this.ollama) {
      try {
        return await this._generateWorldNarration(theme.name, themeContext);
      } catch (error) {
        this.logger.warn('Failed to generate world description via Ollama');
      }
    }

    // Fallback description
    return `A ${theme.settings.atmosphere} world of ${theme.name}`;
  }

  /**
   * Generate multiple themed NPCs
   */
  async generateNPCRoster(count = 5, options = {}) {
    const npcs = [];
    for (let i = 0; i < count; i++) {
      try {
        const npc = await this.generateNPC(options);
        npcs.push(npc);
      } catch (error) {
        this.logger.warn(`Failed to generate NPC ${i + 1}:`, error.message);
      }
    }
    return npcs;
  }

  /**
   * Generate a themed location
   */
  async generateLocation(options = {}) {
    const theme = this.themeEngine.getTheme();
    if (!theme) {
      throw new Error('No theme set. Call themeEngine.setTheme() first.');
    }

    const locationTypes = this.themeEngine.getLocationTypes();
    const atmospheres = theme.locations.atmosphere;

    const locationType = options.type || this._randomElement(locationTypes);
    const atmosphere = options.atmosphere || this._randomElement(atmospheres);

    let name = options.name;
    let description = options.description;

    if (!name || !description) {
      if (this.ollama) {
        try {
          const generated = await this._generateLocationContent(
            locationType,
            atmosphere,
            theme.name
          );
          name = name || generated.name;
          description = description || generated.description;
        } catch (error) {
          this.logger.warn('Failed to generate location via Ollama');
        }
      }
    }

    name = name || `${locationType}`;
    description = description || `A ${atmosphere} ${locationType}`;

    return {
      id: `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name,
      type: locationType,
      atmosphere: atmosphere,
      description: description,
      theme: theme.name,
      NPCs: [],
      items: [],
      gridWidth: 20,
      gridHeight: 20,
      cellSize: 1
    };
  }

  // ============== Private Helper Methods ==============

  /**
   * Generate NPC name via Ollama
   */
  async _generateNPCName(archetype, profession, themeName) {
    const prompt = `Generate a single unique name for a ${archetype} ${profession} in a ${themeName} setting.
Only respond with the name, nothing else. The name should fit the theme and be creative.`;

    const response = await this.ollama.generate(prompt, {
      temperature: 0.7,
      maxTokens: 20
    });

    return response.trim();
  }

  /**
   * Generate NPC backstory via Ollama
   */
  async _generateNPCBackstory(name, archetype, profession, theme, themeContext) {
    const prompt = `You are a master storyteller. Generate a brief, compelling backstory (2-3 sentences) for:
Name: ${name}
Archetype: ${archetype}
Profession: ${profession}
Theme: ${theme.name}
Theme Tone: ${theme.settings.tone}
Theme Atmosphere: ${theme.settings.atmosphere}

Make it dramatic, mysterious, and fitting for the ${theme.name} genre. Include a hint of conflict or intrigue.`;

    return await this.ollama.generate(prompt, {
      temperature: 0.85,
      maxTokens: 150
    });
  }

  /**
   * Generate item description via Ollama
   */
  async _generateItemDescription(itemType, rarity, themeName) {
    const prompt = `Generate a mystical, evocative description (1-2 sentences) for a ${rarity} ${itemType} in a ${themeName} setting.
Be creative and make it sound valuable and interesting. Only the description, no other text.`;

    return await this.ollama.generate(prompt, {
      temperature: 0.8,
      maxTokens: 100
    });
  }

  /**
   * Generate quest content via Ollama
   */
  async _generateQuestContent(questType, themeName, themeContext) {
    const prompt = `You are a quest designer. Generate a ${themeName} quest of type: ${questType}

Return a JSON object with:
{
  "title": "Quest title (2-4 words)",
  "description": "Quest description (2-3 sentences)",
  "objectives": ["objective 1", "objective 2", "objective 3"]
}

Make it thematic, engaging, and challenging. Only return the JSON, no other text.`;

    try {
      const response = await this.ollama.generate(prompt, {
        temperature: 0.8,
        maxTokens: 300
      });

      return JSON.parse(response);
    } catch (error) {
      return {
        title: `The ${questType} Challenge`,
        description: `Complete your quest of ${questType} in this ${themeName} world`,
        objectives: [questType, 'Achieve your goal', 'Return victorious']
      };
    }
  }

  /**
   * Generate main quest narrative via Ollama
   */
  async _generateMainQuestNarrative(themeName, themeContext, player) {
    const playerName = player?.name || 'Adventurer';
    const prompt = `You are the Chronicler, the Game Master of a ${themeName} world.
Generate the MAIN QUEST that will define ${playerName}'s destiny.

Return a JSON object with:
{
  "title": "Epic main quest title",
  "description": "Quest description (3-4 sentences)",
  "narrative": "Opening narrative that sets the tone",
  "objectives": ["major objective 1", "major objective 2", "final challenge"]
}

Make it EPIC, MEANINGFUL, and THEMATIC. This is the centerpiece of the entire game.
Only return the JSON, no other text.`;

    try {
      const response = await this.ollama.generate(prompt, {
        temperature: 0.85,
        maxTokens: 500
      });

      return JSON.parse(response);
    } catch (error) {
      return {
        title: `The ${themeName} Destiny`,
        description: `${playerName} must uncover the truth and change their fate`,
        narrative: `In this ${themeName} world, ${playerName}'s journey begins with a single choice...`,
        objectives: ['Discover your origins', 'Gain power and allies', 'Face your destiny']
      };
    }
  }

  /**
   * Generate world narration via Ollama
   */
  async _generateWorldNarration(themeName, themeContext) {
    const prompt = `You are a master storyteller describing a ${themeName} world.
Generate an atmospheric world description (3-4 sentences) that captures the essence of this setting.
Theme atmosphere: ${themeContext.atmosphere}
Theme tone: ${themeContext.tone}`;

    return await this.ollama.generate(prompt, {
      temperature: 0.85,
      maxTokens: 200
    });
  }

  /**
   * Generate location content via Ollama
   */
  async _generateLocationContent(locationType, atmosphere, themeName) {
    const prompt = `Generate a ${themeName} location of type: ${locationType} with atmosphere: ${atmosphere}

Return a JSON object with:
{
  "name": "Location name",
  "description": "Location description (2-3 sentences)"
}

Make it vivid and thematic. Only return the JSON.`;

    try {
      const response = await this.ollama.generate(prompt, {
        temperature: 0.8,
        maxTokens: 200
      });

      return JSON.parse(response);
    } catch (error) {
      return {
        name: `${locationType} of ${themeName}`,
        description: `A ${atmosphere} ${locationType} in the ${themeName} realm`
      };
    }
  }

  /**
   * Generate personality based on archetype
   */
  _generatePersonality(archetype, tone) {
    // Map archetypes to personality traits
    const traitMap = {
      'noble_knight': { friendliness: 70, intelligence: 60, honor: 95, caution: 50 },
      'wise_wizard': { friendliness: 65, intelligence: 95, honor: 75, caution: 70 },
      'cunning_rogue': { friendliness: 75, intelligence: 80, honor: 30, caution: 85 },
      'holy_priest': { friendliness: 85, intelligence: 75, honor: 90, caution: 60 },
      'skilled_hacker': { friendliness: 50, intelligence: 95, honor: 40, caution: 80 },
      'corporate_agent': { friendliness: 60, intelligence: 85, honor: 35, caution: 75 },
      'mad_cultist': { friendliness: 30, intelligence: 70, honor: 20, caution: 40 },
      'brilliant_inventor': { friendliness: 70, intelligence: 90, honor: 60, caution: 65 }
    };

    const baseTraits = traitMap[archetype] || {
      friendliness: 50 + Math.random() * 40,
      intelligence: 50 + Math.random() * 40,
      caution: 50 + Math.random() * 40,
      honor: 40 + Math.random() * 40
    };

    return new Personality(baseTraits);
  }

  /**
   * Generate item name based on theme
   */
  _generateItemName(itemType, rarity, themeName) {
    const prefixes = {
      'cursed': ['Cursed', 'Accursed', 'Doomed', 'Tainted'],
      'forbidden': ['Forbidden', 'Forbidden', 'Arcane', 'Eldritch'],
      'legendary': ['Legendary', 'Mythic', 'Eternal', 'Supreme'],
      'rare': ['Rare', 'Fabled', 'Ancient', 'Storied']
    };

    const pre = this._randomElement(prefixes[rarity] || ['Fine', 'Quality', 'Good']);
    return `${pre} ${itemType}`;
  }

  /**
   * Calculate item value based on rarity
   */
  _calculateItemValue(rarity) {
    const values = {
      'common': 10,
      'uncommon': 50,
      'rare': 200,
      'legendary': 1000,
      'artifact': 5000,
      'cursed': 25,
      'forbidden': 150,
      'experimental': 300,
      'prototype': 400
    };

    return values[rarity] || 50;
  }

  /**
   * Calculate difficulty from quest type
   */
  _calculateDifficulty(questType) {
    const easyQuests = ['talk_to_npc', 'deliver_message', 'find_item'];
    const hardQuests = ['defeat_evil_lord', 'stop_invasion', 'prevent_apocalypse'];

    if (easyQuests.includes(questType)) return 'easy';
    if (hardQuests.includes(questType)) return 'hard';
    return 'medium';
  }

  /**
   * Generate quest stages
   */
  _generateQuestStages(objectiveCount) {
    const stages = [];
    for (let i = 0; i < Math.max(objectiveCount, 3); i++) {
      stages.push({
        id: `stage_${i}`,
        title: `Stage ${i + 1}`,
        objectives: [],
        completed: false
      });
    }
    return stages;
  }

  /**
   * Random element from array
   */
  _randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
}

export default DynamicContentGenerator;
