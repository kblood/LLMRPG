/**
 * Personality system for characters
 * 6-trait system that influences dialogue and behavior
 * 
 * Traits (all 0-100):
 * - aggression: tendency to be confrontational
 * - friendliness: warmth and openness
 * - intelligence: cleverness and wit
 * - caution: carefulness and risk-aversion
 * - greed: selfishness and materialism
 * - honor: honesty and integrity
 * 
 * @class Personality
 */
export class Personality {
  static TRAITS = ['aggression', 'friendliness', 'intelligence', 'caution', 'greed', 'honor'];

  constructor(traits = {}) {
    // Initialize all traits to 50 (neutral) by default
    this.aggression = this.clamp(traits.aggression ?? 50);
    this.friendliness = this.clamp(traits.friendliness ?? 50);
    this.intelligence = this.clamp(traits.intelligence ?? 50);
    this.caution = this.clamp(traits.caution ?? 50);
    this.greed = this.clamp(traits.greed ?? 50);
    this.honor = this.clamp(traits.honor ?? 50);
  }

  /**
   * Clamp value between 0 and 100
   * @param {number} value
   * @returns {number}
   */
  clamp(value) {
    return Math.max(0, Math.min(100, value));
  }

  /**
   * Get trait level description
   * @param {number} value - Trait value (0-100)
   * @returns {string} Level description
   */
  static getLevel(value) {
    if (value < 30) return 'Low';
    if (value < 70) return 'Medium';
    return 'High';
  }

  /**
   * Get trait description for prompts
   * @param {string} trait - Trait name
   * @param {number} value - Trait value
   * @returns {string} Description
   */
  static getTraitDescription(trait, value) {
    const level = this.getLevel(value);
    
    const descriptions = {
      aggression: {
        Low: 'peaceful and accommodating',
        Medium: 'assertive when needed',
        High: 'confrontational and aggressive'
      },
      friendliness: {
        Low: 'cold and distant',
        Medium: 'polite but reserved',
        High: 'warm and welcoming'
      },
      intelligence: {
        Low: 'simple and straightforward',
        Medium: 'reasonably clever',
        High: 'sharp and insightful'
      },
      caution: {
        Low: 'reckless and impulsive',
        Medium: 'measured in decisions',
        High: 'extremely careful and paranoid'
      },
      greed: {
        Low: 'generous and selfless',
        Medium: 'fair-minded',
        High: 'selfish and materialistic'
      },
      honor: {
        Low: 'deceitful and dishonest',
        Medium: 'pragmatic about honesty',
        High: 'strictly honorable and truthful'
      }
    };

    return descriptions[trait][level];
  }

  /**
   * Get dominant traits (those significantly above or below 50)
   * @returns {Array} Array of {trait, value, level, description}
   */
  getDominantTraits() {
    const dominant = [];

    for (const trait of Personality.TRAITS) {
      const value = this[trait];
      if (value < 35 || value > 65) {
        dominant.push({
          trait,
          value,
          level: Personality.getLevel(value),
          description: Personality.getTraitDescription(trait, value)
        });
      }
    }

    return dominant.sort((a, b) => {
      // Sort by distance from 50 (most extreme first)
      const distA = Math.abs(a.value - 50);
      const distB = Math.abs(b.value - 50);
      return distB - distA;
    });
  }

  /**
   * Get personality summary for LLM prompts
   * @returns {string}
   */
  toPromptString() {
    const lines = [];

    lines.push('Personality traits:');
    for (const trait of Personality.TRAITS) {
      const value = this[trait];
      const level = Personality.getLevel(value);
      const description = Personality.getTraitDescription(trait, value);
      lines.push(`- ${trait}: ${level} (${value}/100) - ${description}`);
    }

    return lines.join('\n');
  }

  /**
   * Get detailed personality description
   * Focuses on dominant traits for more natural description
   * @returns {string}
   */
  toDetailedDescription() {
    const dominant = this.getDominantTraits();

    if (dominant.length === 0) {
      return 'A balanced personality with no extreme traits.';
    }

    const descriptions = dominant.slice(0, 3).map(t => t.description);
    
    if (descriptions.length === 1) {
      return `A person who is ${descriptions[0]}.`;
    } else if (descriptions.length === 2) {
      return `A person who is ${descriptions[0]} and ${descriptions[1]}.`;
    } else {
      const last = descriptions.pop();
      return `A person who is ${descriptions.join(', ')}, and ${last}.`;
    }
  }

  /**
   * Convert to plain object
   * @returns {Object}
   */
  toObject() {
    return {
      aggression: this.aggression,
      friendliness: this.friendliness,
      intelligence: this.intelligence,
      caution: this.caution,
      greed: this.greed,
      honor: this.honor
    };
  }

  /**
   * Create from plain object
   * @param {Object} obj
   * @returns {Personality}
   */
  static fromObject(obj) {
    return new Personality(obj);
  }

  /**
   * Create a random personality
   * @param {SeededRandom} rng - Random number generator
   * @returns {Personality}
   */
  static createRandom(rng) {
    return new Personality({
      aggression: rng.nextInt(0, 100),
      friendliness: rng.nextInt(0, 100),
      intelligence: rng.nextInt(0, 100),
      caution: rng.nextInt(0, 100),
      greed: rng.nextInt(0, 100),
      honor: rng.nextInt(0, 100)
    });
  }

  /**
   * Create predefined personality archetypes
   */
  static createArchetype(type) {
    const archetypes = {
      friendly_merchant: new Personality({
        aggression: 20,
        friendliness: 85,
        intelligence: 65,
        caution: 45,
        greed: 60,
        honor: 70
      }),
      gruff_blacksmith: new Personality({
        aggression: 65,
        friendliness: 40,
        intelligence: 55,
        caution: 30,
        greed: 45,
        honor: 75
      }),
      wise_elder: new Personality({
        aggression: 15,
        friendliness: 70,
        intelligence: 90,
        caution: 80,
        greed: 20,
        honor: 85
      }),
      suspicious_guard: new Personality({
        aggression: 55,
        friendliness: 30,
        intelligence: 50,
        caution: 85,
        greed: 40,
        honor: 70
      }),
      cheerful_tavern_keeper: new Personality({
        aggression: 20,
        friendliness: 90,
        intelligence: 60,
        caution: 50,
        greed: 35,
        honor: 75
      }),
      cunning_thief: new Personality({
        aggression: 50,
        friendliness: 55,
        intelligence: 80,
        caution: 75,
        greed: 85,
        honor: 25
      })
    };

    return archetypes[type] || new Personality();
  }
}

export default Personality;
