/**
 * Enemy definitions for OllamaRPG
 *
 * Each enemy has stats, equipment, and AI behavior
 */

export const ENEMIES = {
  // Weak enemies (Level 1-3)
  'goblin': {
    name: 'Goblin',
    level: 1,
    description: 'A small, wicked creature with crude weapons',
    stats: {
      strength: 8,
      dexterity: 12,
      constitution: 8,
      intelligence: 6,
      wisdom: 8,
      charisma: 6
    },
    equipment: {
      weapon: {
        name: 'Rusty Dagger',
        type: 'weapon',
        equipSlot: 'weapon',
        stats: { attack: 3 },
        customProperties: { range: 'melee' }
      }
    },
    abilities: [],
    behavior: 'aggressive',
    loot: {
      experienceValue: 25,
      goldRange: [1, 5],
      items: [
        { id: 'health_potion', chance: 0.1 }
      ]
    }
  },

  'bandit': {
    name: 'Bandit',
    level: 2,
    description: 'A highway robber looking for easy marks',
    stats: {
      strength: 11,
      dexterity: 13,
      constitution: 10,
      intelligence: 9,
      wisdom: 10,
      charisma: 11
    },
    equipment: {
      weapon: {
        name: 'Short Sword',
        type: 'weapon',
        equipSlot: 'weapon',
        stats: { attack: 6 },
        customProperties: { range: 'melee' }
      },
      chest: {
        name: 'Leather Armor',
        type: 'armor',
        equipSlot: 'chest',
        stats: { defense: 2 }
      }
    },
    abilities: [],
    behavior: 'balanced',
    loot: {
      experienceValue: 40,
      goldRange: [5, 15],
      items: [
        { id: 'health_potion', chance: 0.15 },
        { id: 'leather_armor', chance: 0.05 }
      ]
    }
  },

  'giant_rat': {
    name: 'Giant Rat',
    level: 1,
    description: 'A disease-ridden rodent of unusual size',
    stats: {
      strength: 7,
      dexterity: 14,
      constitution: 9,
      intelligence: 3,
      wisdom: 10,
      charisma: 3
    },
    equipment: {}, // Natural weapons
    abilities: [],
    behavior: 'aggressive',
    loot: {
      experienceValue: 20,
      goldRange: [0, 2],
      items: []
    }
  },

  // Medium enemies (Level 3-5)
  'wolf': {
    name: 'Wolf',
    level: 3,
    description: 'A fierce predator with sharp fangs',
    stats: {
      strength: 13,
      dexterity: 15,
      constitution: 12,
      intelligence: 4,
      wisdom: 12,
      charisma: 6
    },
    equipment: {},
    abilities: [
      {
        name: 'Pounce',
        type: 'attack',
        staminaCost: 15,
        damage: 12,
        damageType: 'physical',
        damageMultiplier: 1.3,
        range: 'close',
        cooldown: 3,
        description: 'Leap at the enemy with powerful jaws'
      }
    ],
    behavior: 'aggressive',
    loot: {
      experienceValue: 60,
      goldRange: [0, 5],
      items: [
        { id: 'wolf_pelt', chance: 0.3 }
      ]
    }
  },

  'orc_warrior': {
    name: 'Orc Warrior',
    level: 4,
    description: 'A brutish orc wielding a massive axe',
    stats: {
      strength: 16,
      dexterity: 10,
      constitution: 14,
      intelligence: 7,
      wisdom: 9,
      charisma: 8
    },
    equipment: {
      weapon: {
        name: 'Battle Axe',
        type: 'weapon',
        equipSlot: 'weapon',
        stats: { attack: 12 },
        customProperties: { range: 'melee' }
      },
      chest: {
        name: 'Studded Leather',
        type: 'armor',
        equipSlot: 'chest',
        stats: { defense: 4 }
      }
    },
    abilities: [
      {
        name: 'Cleave',
        type: 'attack',
        staminaCost: 20,
        damage: 18,
        damageType: 'physical',
        damageMultiplier: 1.5,
        range: 'melee',
        cooldown: 4,
        description: 'A powerful overhead strike'
      }
    ],
    behavior: 'aggressive',
    loot: {
      experienceValue: 80,
      goldRange: [10, 25],
      items: [
        { id: 'health_potion', chance: 0.2 },
        { id: 'battle_axe', chance: 0.1 }
      ]
    }
  },

  'skeleton': {
    name: 'Skeleton',
    level: 3,
    description: 'An animated skeleton, its bones clattering with each movement',
    stats: {
      strength: 10,
      dexterity: 12,
      constitution: 10,
      intelligence: 6,
      wisdom: 8,
      charisma: 5
    },
    equipment: {
      weapon: {
        name: 'Bone Sword',
        type: 'weapon',
        equipSlot: 'weapon',
        stats: { attack: 7 },
        customProperties: { range: 'melee' }
      }
    },
    abilities: [],
    behavior: 'balanced',
    resistances: {
      physical: 20, // Harder to damage with physical attacks
      poison: 100  // Immune to poison
    },
    loot: {
      experienceValue: 50,
      goldRange: [0, 10],
      items: [
        { id: 'bone_dust', chance: 0.2 }
      ]
    }
  },

  // Strong enemies (Level 5-7)
  'dark_mage': {
    name: 'Dark Mage',
    level: 6,
    description: 'A corrupted sorcerer wreathed in shadow',
    stats: {
      strength: 8,
      dexterity: 12,
      constitution: 11,
      intelligence: 17,
      wisdom: 14,
      charisma: 13
    },
    equipment: {
      weapon: {
        name: 'Staff of Shadows',
        type: 'weapon',
        equipSlot: 'weapon',
        stats: { attack: 4, magicPower: 8 },
        customProperties: { range: 'medium' }
      },
      chest: {
        name: 'Dark Robes',
        type: 'armor',
        equipSlot: 'chest',
        stats: { defense: 2, magicalResistance: 15 }
      }
    },
    abilities: [
      {
        name: 'Shadow Bolt',
        type: 'attack',
        magicCost: 20,
        damage: 20,
        damageType: 'magical',
        damageMultiplier: 1.4,
        range: 'long',
        cooldown: 2,
        description: 'Hurl a bolt of dark energy'
      },
      {
        name: 'Drain Life',
        type: 'attack',
        magicCost: 30,
        damage: 15,
        damageType: 'magical',
        heal: 15,
        range: 'medium',
        cooldown: 4,
        description: 'Steal life force from the target'
      }
    ],
    behavior: 'balanced',
    loot: {
      experienceValue: 120,
      goldRange: [20, 50],
      items: [
        { id: 'mana_potion', chance: 0.3 },
        { id: 'dark_robes', chance: 0.1 }
      ]
    }
  },

  'troll': {
    name: 'Troll',
    level: 7,
    description: 'A massive, regenerating monster with incredible strength',
    stats: {
      strength: 18,
      dexterity: 8,
      constitution: 17,
      intelligence: 6,
      wisdom: 7,
      charisma: 5
    },
    equipment: {},
    abilities: [
      {
        name: 'Regeneration',
        type: 'heal',
        staminaCost: 0,
        heal: 10,
        targetType: 'self',
        cooldown: 2,
        description: 'Rapidly heal wounds (passive effect)'
      },
      {
        name: 'Smash',
        type: 'attack',
        staminaCost: 25,
        damage: 25,
        damageType: 'physical',
        damageMultiplier: 1.6,
        range: 'melee',
        cooldown: 3,
        description: 'A devastating blow with massive fists'
      }
    ],
    behavior: 'aggressive',
    resistances: {
      physical: 15
    },
    loot: {
      experienceValue: 150,
      goldRange: [30, 60],
      items: [
        { id: 'health_potion', chance: 0.3 },
        { id: 'troll_blood', chance: 0.2 }
      ]
    }
  },

  // Boss enemies (Level 8+)
  'dragon_wyrmling': {
    name: 'Dragon Wyrmling',
    level: 10,
    description: 'A young dragon, still dangerous with fiery breath',
    stats: {
      strength: 17,
      dexterity: 14,
      constitution: 16,
      intelligence: 12,
      wisdom: 13,
      charisma: 15
    },
    equipment: {},
    abilities: [
      {
        name: 'Fire Breath',
        type: 'attack',
        staminaCost: 40,
        damage: 30,
        damageType: 'fire',
        targetType: 'area',
        areaSize: 3,
        range: 'close',
        cooldown: 5,
        description: 'Breathe a cone of scorching flames'
      },
      {
        name: 'Claw Slash',
        type: 'attack',
        staminaCost: 15,
        damage: 18,
        damageType: 'physical',
        range: 'melee',
        cooldown: 2,
        description: 'Rake with sharp claws'
      },
      {
        name: 'Wing Buffet',
        type: 'defense',
        staminaCost: 20,
        range: 'melee',
        cooldown: 3,
        description: 'Create distance with powerful wings',
        customEffect: 'pushback'
      }
    ],
    behavior: 'aggressive',
    resistances: {
      fire: 75,
      physical: 25
    },
    loot: {
      experienceValue: 300,
      goldRange: [100, 200],
      items: [
        { id: 'dragon_scale', chance: 0.8 },
        { id: 'dragon_tooth', chance: 0.5 },
        { id: 'rare_gem', chance: 0.3 }
      ]
    }
  }
};

/**
 * Get enemy by ID
 * @param {string} enemyId
 * @returns {Object|null}
 */
export function getEnemy(enemyId) {
  return ENEMIES[enemyId] || null;
}

/**
 * Get enemies by level range
 * @param {number} minLevel
 * @param {number} maxLevel
 * @returns {Array}
 */
export function getEnemiesByLevel(minLevel, maxLevel) {
  return Object.entries(ENEMIES)
    .filter(([_, enemy]) => enemy.level >= minLevel && enemy.level <= maxLevel)
    .map(([id, enemy]) => ({ id, ...enemy }));
}

/**
 * Get random enemy from level range
 * @param {number} minLevel
 * @param {number} maxLevel
 * @returns {Object}
 */
export function getRandomEnemy(minLevel, maxLevel) {
  const enemies = getEnemiesByLevel(minLevel, maxLevel);
  if (enemies.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * enemies.length);
  return enemies[randomIndex];
}

export default ENEMIES;
