/**
 * Starter abilities for OllamaRPG
 *
 * Abilities organized by type and level
 */

import { Ability } from '../systems/abilities/Ability.js';

/**
 * Warrior Abilities - Physical damage dealers
 */
export const WARRIOR_ABILITIES = {
  'power_strike': {
    id: 'power_strike',
    name: 'Power Strike',
    type: 'attack',
    description: 'A mighty blow that deals 2x weapon damage',
    costs: { stamina: 20 },
    cooldown: 3,
    range: 'melee',
    effects: {
      damageMultiplier: 2.0,
      damageType: 'physical'
    },
    requirements: { level: 1 },
    category: 'warrior'
  },

  'cleave': {
    id: 'cleave',
    name: 'Cleave',
    type: 'attack',
    description: 'Swing your weapon in an arc, hitting all enemies in melee range',
    costs: { stamina: 25 },
    cooldown: 4,
    range: 'melee',
    effects: {
      damageMultiplier: 1.5,
      damageType: 'physical',
      areaOfEffect: 'melee'
    },
    requirements: { level: 3, strength: 12 },
    category: 'warrior'
  },

  'shield_bash': {
    id: 'shield_bash',
    name: 'Shield Bash',
    type: 'attack',
    description: 'Bash enemy with shield, dealing damage and stunning for 1 turn',
    costs: { stamina: 15 },
    cooldown: 5,
    range: 'melee',
    effects: {
      damage: 15,
      damageType: 'physical',
      statusEffect: { type: 'stun', duration: 1 }
    },
    requirements: { level: 2, equipment: 'shield' },
    category: 'warrior'
  },

  'whirlwind': {
    id: 'whirlwind',
    name: 'Whirlwind',
    type: 'attack',
    description: 'Spin rapidly, hitting all nearby enemies',
    costs: { stamina: 35 },
    cooldown: 6,
    range: 'close',
    effects: {
      damageMultiplier: 1.2,
      damageType: 'physical',
      areaOfEffect: 'close'
    },
    requirements: { level: 5, strength: 15 },
    category: 'warrior'
  },

  'berserker_rage': {
    id: 'berserker_rage',
    name: 'Berserker Rage',
    type: 'buff',
    description: 'Enter a rage, gaining +50% attack but -20% defense for 3 turns',
    costs: { stamina: 20 },
    cooldown: 8,
    range: 'self',
    effects: {
      statusEffect: {
        type: 'berserk',
        duration: 3,
        attackBonus: 1.5,
        defenseBonus: 0.8
      }
    },
    requirements: { level: 6 },
    category: 'warrior'
  }
};

/**
 * Rogue Abilities - Agility and critical strikes
 */
export const ROGUE_ABILITIES = {
  'backstab': {
    id: 'backstab',
    name: 'Backstab',
    type: 'attack',
    description: 'Strike from shadows with guaranteed critical hit',
    costs: { stamina: 25 },
    cooldown: 5,
    range: 'melee',
    effects: {
      damageMultiplier: 2.5,
      damageType: 'physical',
      guaranteedCritical: true
    },
    requirements: { level: 2, dexterity: 12 },
    category: 'rogue'
  },

  'poison_blade': {
    id: 'poison_blade',
    name: 'Poison Blade',
    type: 'attack',
    description: 'Coat blade with poison, dealing damage over 3 turns',
    costs: { stamina: 20 },
    cooldown: 6,
    range: 'melee',
    effects: {
      damage: 20,
      damageType: 'physical',
      statusEffect: {
        type: 'poison',
        duration: 3,
        damagePerTurn: 10
      }
    },
    requirements: { level: 3 },
    category: 'rogue'
  },

  'smoke_bomb': {
    id: 'smoke_bomb',
    name: 'Smoke Bomb',
    type: 'utility',
    description: 'Create smoke cloud, reducing enemy accuracy by 50% for 2 turns',
    costs: { stamina: 15 },
    cooldown: 7,
    range: 'close',
    effects: {
      statusEffect: {
        type: 'blind',
        duration: 2,
        accuracyReduction: 0.5,
        areaOfEffect: 'close'
      }
    },
    requirements: { level: 4 },
    category: 'rogue'
  },

  'shadow_step': {
    id: 'shadow_step',
    name: 'Shadow Step',
    type: 'utility',
    description: 'Teleport to any distance, avoiding attacks this turn',
    costs: { stamina: 30 },
    cooldown: 4,
    range: 'any',
    effects: {
      teleport: true,
      evasionBonus: 1.0 // 100% evasion this turn
    },
    requirements: { level: 5, dexterity: 15 },
    category: 'rogue'
  },

  'dual_strike': {
    id: 'dual_strike',
    name: 'Dual Strike',
    type: 'attack',
    description: 'Strike twice with each weapon',
    costs: { stamina: 30 },
    cooldown: 4,
    range: 'melee',
    effects: {
      damageMultiplier: 1.0,
      damageType: 'physical',
      multiHit: 2
    },
    requirements: { level: 4, equipment: 'dual_wield' },
    category: 'rogue'
  }
};

/**
 * Mage Abilities - Magical attacks and utility
 */
export const MAGE_ABILITIES = {
  'fireball': {
    id: 'fireball',
    name: 'Fireball',
    type: 'attack',
    description: 'Hurl a ball of flame at your target',
    costs: { magic: 30 },
    cooldown: 2,
    range: 'medium',
    effects: {
      damage: 50,
      damageType: 'fire'
    },
    requirements: { level: 1, intelligence: 10 },
    category: 'mage'
  },

  'ice_shard': {
    id: 'ice_shard',
    name: 'Ice Shard',
    type: 'attack',
    description: 'Launch ice shard that deals damage and slows enemy',
    costs: { magic: 25 },
    cooldown: 3,
    range: 'medium',
    effects: {
      damage: 35,
      damageType: 'ice',
      statusEffect: {
        type: 'slow',
        duration: 2,
        speedReduction: 0.5
      }
    },
    requirements: { level: 2, intelligence: 12 },
    category: 'mage'
  },

  'lightning_bolt': {
    id: 'lightning_bolt',
    name: 'Lightning Bolt',
    type: 'attack',
    description: 'Strike with lightning, may stun target',
    costs: { magic: 35 },
    cooldown: 4,
    range: 'long',
    effects: {
      damage: 60,
      damageType: 'lightning',
      statusEffect: {
        type: 'stun',
        duration: 1,
        chance: 0.3 // 30% chance
      }
    },
    requirements: { level: 4, intelligence: 14 },
    category: 'mage'
  },

  'mana_shield': {
    id: 'mana_shield',
    name: 'Mana Shield',
    type: 'buff',
    description: 'Create shield that absorbs 50 damage',
    costs: { magic: 40 },
    cooldown: 6,
    range: 'self',
    effects: {
      statusEffect: {
        type: 'shield',
        duration: 5,
        absorbAmount: 50
      }
    },
    requirements: { level: 3 },
    category: 'mage'
  },

  'arcane_missiles': {
    id: 'arcane_missiles',
    name: 'Arcane Missiles',
    type: 'attack',
    description: 'Fire 5 magic missiles that never miss',
    costs: { magic: 50 },
    cooldown: 5,
    range: 'long',
    effects: {
      damage: 12,
      damageType: 'arcane',
      multiHit: 5,
      neverMiss: true
    },
    requirements: { level: 6, intelligence: 16 },
    category: 'mage'
  },

  'meteor_swarm': {
    id: 'meteor_swarm',
    name: 'Meteor Swarm',
    type: 'attack',
    description: 'Rain meteors on all enemies',
    costs: { magic: 80 },
    cooldown: 10,
    range: 'any',
    effects: {
      damage: 70,
      damageType: 'fire',
      areaOfEffect: 'all'
    },
    requirements: { level: 8, intelligence: 18 },
    category: 'mage'
  }
};

/**
 * Cleric Abilities - Healing and support
 */
export const CLERIC_ABILITIES = {
  'heal': {
    id: 'heal',
    name: 'Heal',
    type: 'heal',
    description: 'Restore 50 HP to target',
    costs: { magic: 25 },
    cooldown: 2,
    range: 'close',
    effects: {
      heal: 50
    },
    requirements: { level: 1, wisdom: 10 },
    category: 'cleric'
  },

  'holy_smite': {
    id: 'holy_smite',
    name: 'Holy Smite',
    type: 'attack',
    description: 'Strike with holy energy, extra damage vs undead',
    costs: { magic: 30 },
    cooldown: 3,
    range: 'melee',
    effects: {
      damage: 40,
      damageType: 'holy',
      bonusVsUndead: 2.0
    },
    requirements: { level: 2, wisdom: 12 },
    category: 'cleric'
  },

  'divine_shield': {
    id: 'divine_shield',
    name: 'Divine Shield',
    type: 'buff',
    description: 'Grant target immunity to damage for 1 turn',
    costs: { magic: 60 },
    cooldown: 10,
    range: 'close',
    effects: {
      statusEffect: {
        type: 'invulnerable',
        duration: 1
      }
    },
    requirements: { level: 5, wisdom: 15 },
    category: 'cleric'
  },

  'cure_poison': {
    id: 'cure_poison',
    name: 'Cure Poison',
    type: 'utility',
    description: 'Remove poison and disease effects',
    costs: { magic: 20 },
    cooldown: 3,
    range: 'close',
    effects: {
      removeStatus: ['poison', 'disease']
    },
    requirements: { level: 2 },
    category: 'cleric'
  },

  'resurrection': {
    id: 'resurrection',
    name: 'Resurrection',
    type: 'utility',
    description: 'Revive fallen ally with 50% HP',
    costs: { magic: 100 },
    cooldown: 15,
    range: 'close',
    effects: {
      revive: true,
      reviveHealthPercent: 0.5
    },
    requirements: { level: 7, wisdom: 17 },
    category: 'cleric'
  },

  'prayer_of_healing': {
    id: 'prayer_of_healing',
    name: 'Prayer of Healing',
    type: 'heal',
    description: 'Heal all allies for 30 HP',
    costs: { magic: 50 },
    cooldown: 6,
    range: 'any',
    effects: {
      heal: 30,
      areaOfEffect: 'all_allies'
    },
    requirements: { level: 4, wisdom: 14 },
    category: 'cleric'
  }
};

/**
 * Utility/Universal Abilities - Available to all classes
 */
export const UNIVERSAL_ABILITIES = {
  'second_wind': {
    id: 'second_wind',
    name: 'Second Wind',
    type: 'heal',
    description: 'Catch your breath and recover stamina',
    costs: {},
    cooldown: 8,
    range: 'self',
    effects: {
      restoreStamina: 50
    },
    requirements: { level: 2 },
    category: 'universal'
  },

  'sprint': {
    id: 'sprint',
    name: 'Sprint',
    type: 'utility',
    description: 'Move to any distance without stamina cost',
    costs: { stamina: 5 },
    cooldown: 3,
    range: 'self',
    effects: {
      freeMovement: true
    },
    requirements: { level: 1 },
    category: 'universal'
  },

  'dodge': {
    id: 'dodge',
    name: 'Dodge',
    type: 'defense',
    description: 'Increase evasion by 50% for 2 turns',
    costs: { stamina: 15 },
    cooldown: 4,
    range: 'self',
    effects: {
      statusEffect: {
        type: 'evasion_boost',
        duration: 2,
        evasionBonus: 0.5
      }
    },
    requirements: { level: 2 },
    category: 'universal'
  },

  'meditate': {
    id: 'meditate',
    name: 'Meditate',
    type: 'utility',
    description: 'Recover 30 magic and remove debuffs',
    costs: {},
    cooldown: 10,
    range: 'self',
    effects: {
      restoreMagic: 30,
      removeDebuffs: true
    },
    requirements: { level: 3 },
    category: 'universal'
  }
};

/**
 * Get ability by ID
 */
export function getAbility(abilityId) {
  const allAbilities = {
    ...WARRIOR_ABILITIES,
    ...ROGUE_ABILITIES,
    ...MAGE_ABILITIES,
    ...CLERIC_ABILITIES,
    ...UNIVERSAL_ABILITIES
  };

  const abilityData = allAbilities[abilityId];
  if (!abilityData) return null;

  return new Ability(abilityData);
}

/**
 * Get abilities by category
 */
export function getAbilitiesByCategory(category) {
  const categoryMap = {
    'warrior': WARRIOR_ABILITIES,
    'rogue': ROGUE_ABILITIES,
    'mage': MAGE_ABILITIES,
    'cleric': CLERIC_ABILITIES,
    'universal': UNIVERSAL_ABILITIES
  };

  const abilities = categoryMap[category];
  if (!abilities) return [];

  return Object.values(abilities).map(data => new Ability(data));
}

/**
 * Get all available abilities
 */
export function getAllAbilities() {
  const allAbilities = {
    ...WARRIOR_ABILITIES,
    ...ROGUE_ABILITIES,
    ...MAGE_ABILITIES,
    ...CLERIC_ABILITIES,
    ...UNIVERSAL_ABILITIES
  };

  return Object.values(allAbilities).map(data => new Ability(data));
}

/**
 * Get starter abilities for a character level and stats
 */
export function getStarterAbilities(level = 1, stats = {}) {
  const abilities = [];

  // Always get power strike for melee
  if (stats.strength >= 10) {
    abilities.push(getAbility('power_strike'));
  }

  // Mages get fireball
  if (stats.intelligence >= 10) {
    abilities.push(getAbility('fireball'));
  }

  // Clerics get heal
  if (stats.wisdom >= 10) {
    abilities.push(getAbility('heal'));
  }

  // Rogues get backstab
  if (stats.dexterity >= 12) {
    abilities.push(getAbility('backstab'));
  }

  // Everyone gets second wind
  if (level >= 2) {
    abilities.push(getAbility('second_wind'));
  }

  return abilities.filter(a => a !== null);
}

export default {
  WARRIOR_ABILITIES,
  ROGUE_ABILITIES,
  MAGE_ABILITIES,
  CLERIC_ABILITIES,
  UNIVERSAL_ABILITIES,
  getAbility,
  getAbilitiesByCategory,
  getAllAbilities,
  getStarterAbilities
};
