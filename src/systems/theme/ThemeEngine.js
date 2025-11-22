/**
 * ThemeEngine - Dynamic Theme Management for Game Generation
 *
 * Manages game themes and provides theme-aware context for content generation.
 * Enables the Chronicler to create thematically consistent worlds.
 */

export class ThemeEngine {
  constructor() {
    this.currentTheme = null;
    this.themes = new Map();
    this.initializeThemes();
  }

  /**
   * Initialize built-in themes
   */
  initializeThemes() {
    // Fantasy theme
    this.registerTheme('fantasy', {
      name: 'Fantasy',
      description: 'A classic fantasy world with magic, kingdoms, and adventure',
      settings: {
        atmosphere: 'medieval_magical',
        technology: 'medieval',
        magic: 'abundant',
        races: ['human', 'elf', 'dwarf', 'halfling', 'gnome'],
        factions: ['kingdoms', 'guilds', 'orders'],
        tone: 'heroic_epic'
      },
      npcs: {
        archetypes: [
          'noble_knight', 'wise_wizard', 'cunning_rogue', 'holy_priest',
          'skilled_ranger', 'powerful_barbarian', 'mysterious_sorcerer',
          'humble_farmer', 'shrewd_merchant', 'ancient_sage'
        ],
        naming: 'fantasy_medieval',
        professions: [
          'Knight', 'Mage', 'Rogue', 'Priest', 'Ranger', 'Barbarian',
          'Sorcerer', 'Bard', 'Druid', 'Paladin', 'Monk', 'Alchemist'
        ]
      },
      items: {
        weapons: ['sword', 'axe', 'bow', 'staff', 'dagger', 'wand', 'spear', 'mace'],
        armor: ['plate', 'leather', 'robes', 'chainmail', 'scale'],
        artifacts: ['amulet', 'ring', 'crown', 'scepter', 'grimoire', 'tome'],
        rarity: ['common', 'uncommon', 'rare', 'legendary', 'artifact']
      },
      locations: {
        types: [
          'kingdom', 'castle', 'village', 'forest', 'mountain', 'dungeon',
          'tower', 'temple', 'tavern', 'marketplace', 'ruins', 'caverns'
        ],
        atmosphere: [
          'peaceful', 'dangerous', 'mysterious', 'bustling', 'abandoned',
          'sacred', 'cursed', 'hidden', 'grand', 'humble'
        ]
      },
      quests: {
        types: [
          'defeat_evil_lord', 'recover_artifact', 'save_village',
          'find_lost_treasure', 'stop_invasion', 'lift_curse',
          'unite_kingdoms', 'awaken_ancient_power', 'complete_prophecy'
        ],
        motivation: 'honor_duty_destiny'
      }
    });

    // Science Fiction theme
    this.registerTheme('sci-fi', {
      name: 'Science Fiction',
      description: 'A futuristic world with advanced technology and space exploration',
      settings: {
        atmosphere: 'high_tech_futuristic',
        technology: 'advanced_ai_space',
        magic: 'none',
        races: ['human', 'android', 'alien', 'cyborg', 'ai'],
        factions: ['corporations', 'governments', 'rebel_groups', 'guilds'],
        tone: 'exploration_discovery'
      },
      npcs: {
        archetypes: [
          'skilled_hacker', 'corporate_agent', 'rebel_pilot', 'mad_scientist',
          'android_consciousness', 'alien_diplomat', 'cyborg_soldier',
          'space_pirate', 'colony_scientist', 'ai_overseer'
        ],
        naming: 'sci_fi_futuristic',
        professions: [
          'Hacker', 'Pilot', 'Engineer', 'Scientist', 'Agent', 'Android',
          'Cyborg', 'Captain', 'Tech', 'Programmer', 'Soldier', 'Explorer'
        ]
      },
      items: {
        weapons: ['laser', 'plasma', 'rail_gun', 'ion_cannon', 'neural_disruptor', 'dagger'],
        armor: ['exoskeleton', 'force_field', 'bio_suit', 'combat_armor', 'smart_suit'],
        artifacts: ['neural_implant', 'quantum_drive', 'data_chip', 'energy_core', 'ai_core'],
        rarity: ['common', 'uncommon', 'rare', 'experimental', 'prototype', 'unique']
      },
      locations: {
        types: [
          'space_station', 'colony', 'megacity', 'mining_outpost', 'laboratory',
          'orbital_platform', 'asteroid', 'planet', 'starship', 'vault', 'facility'
        ],
        atmosphere: [
          'sterile', 'chaotic', 'mysterious', 'bustling', 'abandoned',
          'hostile', 'advanced', 'primitive', 'organic', 'mechanical'
        ]
      },
      quests: {
        types: [
          'decrypt_data', 'infiltrate_corporation', 'explore_anomaly',
          'retrieve_tech', 'stop_ai_rebellion', 'colonize_planet',
          'expose_conspiracy', 'repair_infrastructure', 'discover_species'
        ],
        motivation: 'survival_knowledge_power'
      }
    });

    // Cthulhu/Cosmic Horror theme
    this.registerTheme('cthulhu', {
      name: 'Cosmic Horror',
      description: 'A dark world of cosmic horror, sanity loss, and ancient evils',
      settings: {
        atmosphere: 'eldritch_horrific',
        technology: 'ancient_forbidden',
        magic: 'forbidden_cosmic',
        races: ['human', 'deep_one', 'mi_go', 'shoggoth', 'cultist', 'hybrid'],
        factions: ['cults', 'scholars', 'resistance', 'government', 'cosmic_entities'],
        tone: 'dread_investigation'
      },
      npcs: {
        archetypes: [
          'mad_cultist', 'paranoid_scholar', 'corrupted_investigator',
          'tainted_priest', 'hybrid_being', 'starving_wretch', 'possessed_person',
          'mysterious_stranger', 'cursed_aristocrat', 'sanity_broken_survivor'
        ],
        naming: 'eldritch_ominous',
        professions: [
          'Cultist', 'Scholar', 'Investigator', 'Priest', 'Medium', 'Hermit',
          'Vagrant', 'Occultist', 'Asylum_Patient', 'Antiquarian', 'Seeker', 'Marked'
        ]
      },
      items: {
        weapons: ['dagger', 'blade', 'ritual_knife', 'firearm', 'improvised'],
        armor: ['cloth', 'leather', 'tattered_robes', 'cursed_trinket'],
        artifacts: ['necronomicon', 'elder_sign', 'idol', 'corrupted_tome', 'alien_device'],
        rarity: ['cursed', 'forbidden', 'ancient', 'tainted', 'abhorrent']
      },
      locations: {
        types: [
          'asylum', 'cultist_lair', 'ancient_tomb', 'forbidden_library',
          'deep_cavern', 'haunted_mansion', 'ritual_site', 'dimensional_rift',
          'sunken_city', 'forbidden_temple', 'research_facility'
        ],
        atmosphere: [
          'horrific', 'maddening', 'ancient', 'cursed', 'eldritch',
          'abandoned', 'forbidden', 'corrupt', 'twisted', 'wrong'
        ]
      },
      quests: {
        types: [
          'stop_summoning', 'investigate_cult', 'recover_forbidden_text',
          'prevent_apocalypse', 'seal_rift', 'uncover_truth',
          'survive_night', 'rescue_victim', 'contain_entity', 'destroy_artifact'
        ],
        motivation: 'survival_truth_sanity'
      }
    });

    // Steampunk theme
    this.registerTheme('steampunk', {
      name: 'Steampunk',
      description: 'A Victorian-era world powered by steam technology and gears',
      settings: {
        atmosphere: 'victorian_mechanical',
        technology: 'steam_clockwork',
        magic: 'none',
        races: ['human', 'automaton', 'airship_captain', 'engineer'],
        factions: ['corporations', 'rebels', 'government', 'inventor_guilds'],
        tone: 'industrial_adventure'
      },
      npcs: {
        archetypes: [
          'brilliant_inventor', 'airship_captain', 'steam_engineer',
          'rebel_mechanic', 'corporate_executive', 'sky_pirate',
          'automaton_servant', 'gear_smith', 'coal_miner', 'steam_enforcer'
        ],
        naming: 'victorian_mechanical',
        professions: [
          'Inventor', 'Engineer', 'Captain', 'Mechanic', 'Pirate',
          'Enforcer', 'Executive', 'Automaton', 'Smith', 'Worker'
        ]
      },
      items: {
        weapons: ['steam_gun', 'tesla_coil', 'gear_blade', 'pneumatic_cannon', 'revolver'],
        armor: ['brass_plate', 'leather_gear_suit', 'steam_exoskeleton', 'goggles'],
        artifacts: ['perpetual_engine', 'tesla_device', 'clockwork_heart', 'steam_core'],
        rarity: ['standard', 'custom', 'rare', 'prototype', 'legendary_design']
      },
      locations: {
        types: [
          'factory', 'airship', 'steam_city', 'underground_workshop',
          'coal_mine', 'inventor_lab', 'airship_dock', 'gear_foundry',
          'steam_temple', 'rebel_hideout'
        ],
        atmosphere: [
          'industrial', 'bustling', 'dangerous', 'innovative', 'oppressive',
          'mechanical', 'steamy', 'noisy', 'underground', 'chaotic'
        ]
      },
      quests: {
        types: [
          'steal_blueprint', 'sabotage_factory', 'invent_device',
          'deliver_cargo', 'expose_corruption', 'free_workers',
          'recover_engine', 'stop_takeover', 'escape_city', 'build_revolution'
        ],
        motivation: 'freedom_innovation_power'
      }
    });

    // Dark Fantasy theme
    this.registerTheme('dark_fantasy', {
      name: 'Dark Fantasy',
      description: 'A grim fantasy world of dark magic, suffering, and moral ambiguity',
      settings: {
        atmosphere: 'dark_bleak_grim',
        technology: 'medieval',
        magic: 'dark_forbidden',
        races: ['human', 'orc', 'dark_elf', 'undead', 'demon_spawn'],
        factions: ['kingdoms', 'dark_lords', 'warbands', 'covens', 'cults'],
        tone: 'grim_survival'
      },
      npcs: {
        archetypes: [
          'hardened_warrior', 'dark_mage', 'cynical_rogue', 'fallen_hero',
          'morally_grey_merchant', 'tortured_soul', 'ambitious_noble',
          'battle_scarred_veteran', 'cursed_wanderer', 'desperate_survivor'
        ],
        naming: 'dark_ominous',
        professions: [
          'Warrior', 'Warlord', 'Executioner', 'Dark_Mage', 'Rogue',
          'Assassin', 'Slaver', 'Mercenary', 'Torturer', 'Cursed_One'
        ]
      },
      items: {
        weapons: ['cursed_sword', 'bone_weapon', 'corrupted_blade', 'soul_drinker'],
        armor: ['black_plate', 'bone_armor', 'cursed_mail', 'dark_robes'],
        artifacts: ['soul_gem', 'curse_orb', 'dark_relic', 'shadow_stone'],
        rarity: ['cursed', 'tainted', 'dark', 'forbidden', 'accursed']
      },
      locations: {
        types: [
          'fortress', 'slave_camp', 'necropolis', 'demon_lair',
          'blighted_land', 'dark_forest', 'blood_temple', 'cursed_city'
        ],
        atmosphere: [
          'oppressive', 'corrupted', 'suffering', 'violent', 'hopeless',
          'dark', 'twisted', 'cruel', 'damned', 'tormented'
        ]
      },
      quests: {
        types: [
          'survive_oppression', 'defeat_warlord', 'escape_slavery',
          'steal_power', 'corrupt_kingdom', 'summon_evil', 'rule_wasteland',
          'gather_artifacts', 'build_army', 'achieve_revenge'
        ],
        motivation: 'power_survival_revenge'
      }
    });
  }

  /**
   * Register a custom theme
   */
  registerTheme(key, theme) {
    this.themes.set(key, theme);
  }

  /**
   * Get available themes
   */
  getAvailableThemes() {
    return Array.from(this.themes.values()).map(theme => ({
      key: theme.name.toLowerCase().replace(/\s/g, '_'),
      name: theme.name,
      description: theme.description
    }));
  }

  /**
   * Set the current active theme
   */
  setTheme(themeKey) {
    const theme = this.themes.get(themeKey);
    if (!theme) {
      throw new Error(`Theme "${themeKey}" not found`);
    }
    this.currentTheme = { key: themeKey, ...theme };
    return this.currentTheme;
  }

  /**
   * Get the current active theme
   */
  getTheme() {
    return this.currentTheme;
  }

  /**
   * Get theme context for prompt generation
   */
  getThemeContext() {
    if (!this.currentTheme) {
      return null;
    }

    return {
      theme: this.currentTheme.name,
      atmosphere: this.currentTheme.settings.atmosphere,
      technology: this.currentTheme.settings.technology,
      tone: this.currentTheme.settings.tone,
      magic: this.currentTheme.settings.magic,
      npcArchetypes: this.currentTheme.npcs.archetypes,
      itemTypes: this.currentTheme.items.weapons.concat(this.currentTheme.items.armor),
      questTypes: this.currentTheme.quests.types,
      locationTypes: this.currentTheme.locations.types,
      locationsAtmospheres: this.currentTheme.locations.atmosphere
    };
  }

  /**
   * Get theme-specific naming style
   */
  getNamingStyle() {
    if (!this.currentTheme) return 'generic';
    return this.currentTheme.npcs.naming;
  }

  /**
   * Get theme-specific professions
   */
  getProfessions() {
    if (!this.currentTheme) return [];
    return this.currentTheme.npcs.professions;
  }

  /**
   * Get theme-specific location types
   */
  getLocationTypes() {
    if (!this.currentTheme) return [];
    return this.currentTheme.locations.types;
  }

  /**
   * Get theme-specific item categories
   */
  getItemCategories() {
    if (!this.currentTheme) return {};
    return this.currentTheme.items;
  }

  /**
   * Get theme-specific NPC archetypes
   */
  getNPCArchetypes() {
    if (!this.currentTheme) return [];
    return this.currentTheme.npcs.archetypes;
  }

  /**
   * Get theme-specific quest types
   */
  getQuestTypes() {
    if (!this.currentTheme) return [];
    return this.currentTheme.quests.types;
  }

  /**
   * Get theme settings
   */
  getSettings() {
    if (!this.currentTheme) return {};
    return this.currentTheme.settings;
  }
}

export default ThemeEngine;
