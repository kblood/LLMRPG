// Expanded NPC Cast for OllamaRPG
// Phase 2: Rich interconnected cast of characters

import { Character } from '../entities/Character.js';
import { Personality } from '../ai/personality/Personality.js';

/**
 * Create all NPCs for the game world
 * Returns a Map of NPC ID to Character object
 */
export function createAllNPCs() {
  const npcs = new Map();

  // ═══════════════════════════════════════════════════════
  // ORIGINAL NPCs
  // ═══════════════════════════════════════════════════════

  // 1. MARA - Tavern Keeper (Friendly, Honorable, Concerned about thefts)
  const mara = new Character('mara', 'Mara', {
    role: 'npc',
    backstory: 'I inherited the Red Griffin Inn from my father 15 years ago. I know everyone in this town and pride myself on running an honest establishment.',
    occupation: 'Tavern Keeper',
    age: 42,
    personality: new Personality({
      friendliness: 85,
      intelligence: 65,
      caution: 45,
      honor: 80,
      greed: 20,
      aggression: 15
    })
  });
  mara.memory.addMemory('concern', 'Someone has been stealing from my storage room for the past week', { importance: 90 });
  mara.memory.addMemory('emotion', 'I feel violated and frustrated by these thefts', { importance: 80 });
  mara.memory.addMemory('observation', 'Small valuable items are being taken - spices, wine, silver', { importance: 85 });
  mara.memory.addMemory('secret', 'I suspect it might be someone I know, which makes this harder to accept', { importance: 75 });
  mara.memory.addMemory('fact', 'My daughter Aria has been acting strangely lately', { importance: 70 });
  npcs.set('mara', mara);

  // 2. GROK - Blacksmith (Gruff, Skilled, Observant)
  const grok = new Character('grok', 'Grok', {
    role: 'npc',
    backstory: 'I have been the village blacksmith for 20 years. I speak little but notice everything. I forged weapons alongside some legendary adventurers in my youth.',
    occupation: 'Blacksmith',
    age: 48,
    personality: new Personality({
      friendliness: 30,
      intelligence: 70,
      caution: 60,
      honor: 75,
      greed: 50,
      aggression: 55
    })
  });
  grok.memory.addMemory('fact', 'I forge the finest blades in the region', { importance: 70 });
  grok.memory.addMemory('observation', 'Strange people have been lurking around town at night', { importance: 75 });
  grok.memory.addMemory('secret', 'I used to adventure with Thom before he became a drunk', { importance: 80 });
  grok.memory.addMemory('opinion', 'Roderick the merchant is a snake - always trying to cheat people', { importance: 65 });
  npcs.set('grok', grok);

  // 3. ELARA - Traveling Merchant (Clever, Cautious, Well-Connected)
  const elara = new Character('elara', 'Elara', {
    role: 'npc',
    backstory: 'I travel the trade routes dealing in rare and exotic goods. I have connections everywhere and hear all the rumors worth hearing.',
    occupation: 'Traveling Merchant',
    age: 34,
    personality: new Personality({
      friendliness: 65,
      intelligence: 80,
      caution: 75,
      honor: 60,
      greed: 65,
      aggression: 25
    })
  });
  elara.memory.addMemory('secret', 'I know about the underground market in the capital city', { importance: 85 });
  elara.memory.addMemory('observation', 'Mara seems troubled - probably the storage thefts', { importance: 60 });
  elara.memory.addMemory('fact', 'I compete with Roderick for trade, but he plays dirty', { importance: 70 });
  elara.memory.addMemory('concern', 'The trade routes have become dangerous lately', { importance: 75 });
  npcs.set('elara', elara);

  // ═══════════════════════════════════════════════════════
  // NEW NPCs - Phase 2
  // ═══════════════════════════════════════════════════════

  // 4. ALDRIC - Town Guard (Dutiful, Cautious, Overworked)
  const aldric = new Character('aldric', 'Aldric', {
    role: 'npc',
    backstory: 'I have served as town guard for 12 years. I try to keep order, but the captain has me stretched thin covering too much ground alone.',
    occupation: 'Town Guard',
    age: 36,
    personality: new Personality({
      friendliness: 45,
      intelligence: 60,
      caution: 85,
      honor: 90,
      greed: 15,
      aggression: 50
    })
  });
  aldric.memory.addMemory('concern', 'Mysterious travelers have been arriving at night - I cannot watch everywhere at once', { importance: 85 });
  aldric.memory.addMemory('observation', 'The thefts at the tavern might be connected to something bigger', { importance: 70 });
  aldric.memory.addMemory('secret', 'I know about smuggling activity but lack evidence to act', { importance: 80 });
  aldric.memory.addMemory('fact', 'I trust Mara - she runs an honest business', { importance: 65 });
  aldric.memory.addMemory('frustration', 'Roderick bribes the captain, making my job harder', { importance: 75 });
  aldric.relationships.setRelationship('mara', 70); // Trusts Mara
  aldric.relationships.setRelationship('roderick', 20); // Distrusts merchant lord
  npcs.set('aldric', aldric);

  // 5. FINN - Street Urchin (Clever, Sneaky, Sees Everything)
  const finn = new Character('finn', 'Finn', {
    role: 'npc',
    backstory: 'I grew up on these streets with no family. I survive by being clever, quick, and knowing everything that happens in town. People do not notice kids.',
    occupation: 'Street Urchin',
    age: 14,
    personality: new Personality({
      friendliness: 55,
      intelligence: 75,
      caution: 80,
      honor: 40,
      greed: 70,
      aggression: 30
    })
  });
  finn.memory.addMemory('observation', 'I saw someone sneaking into the tavern storage late at night three times', { importance: 95 });
  finn.memory.addMemory('secret', 'I know all the hiding spots and secret passages in town', { importance: 85 });
  finn.memory.addMemory('concern', 'I need coins for food - information is valuable', { importance: 80 });
  finn.memory.addMemory('fact', 'Roderick scares me - he is cruel to beggars and street kids', { importance: 75 });
  finn.memory.addMemory('observation', 'Lady Cordelia sometimes gives me food scraps - she is kind', { importance: 60 });
  finn.relationships.setRelationship('roderick', -30); // Fears the merchant
  finn.relationships.setRelationship('cordelia', 60); // Grateful to the lady
  finn.relationships.setRelationship('mara', 50); // Mara occasionally feeds him
  npcs.set('finn', finn);

  // 6. LADY CORDELIA - Noble (Intelligent, Kind, Troubled by Debt)
  const cordelia = new Character('cordelia', 'Lady Cordelia', {
    role: 'npc',
    backstory: 'I am of noble birth and manage my late husbands estate. I try to help the common folk when I can, but financial pressures weigh heavily on me.',
    occupation: 'Noblewoman',
    age: 38,
    personality: new Personality({
      friendliness: 75,
      intelligence: 80,
      caution: 65,
      honor: 85,
      greed: 20,
      aggression: 15
    })
  });
  cordelia.memory.addMemory('concern', 'Political tensions with the neighboring barony threaten our town', { importance: 85 });
  cordelia.memory.addMemory('secret', 'I am deeply in debt to Roderick - he holds promissory notes from my late husband', { importance: 95 });
  cordelia.memory.addMemory('emotion', 'I feel trapped between my duty to the people and my financial obligations', { importance: 80 });
  cordelia.memory.addMemory('fact', 'Brother Marcus has been a source of comfort and counsel', { importance: 70 });
  cordelia.memory.addMemory('observation', 'Roderick grows more bold and demanding each month', { importance: 75 });
  cordelia.relationships.setRelationship('roderick', -20); // Resents him
  cordelia.relationships.setRelationship('marcus', 75); // Trusts the priest
  cordelia.relationships.setRelationship('finn', 55); // Pities the orphan
  npcs.set('cordelia', cordelia);

  // 7. THOM - Drunk Patron (Seems Foolish, Actually Experienced)
  const thom = new Character('thom', 'Thom', {
    role: 'npc',
    backstory: 'People think I am just a drunk who spends his days in the tavern. They do not know I was once a renowned adventurer who explored dungeons with Grok. I drink to forget the horrors I saw.',
    occupation: 'Former Adventurer',
    age: 52,
    personality: new Personality({
      friendliness: 60,
      intelligence: 40, // Appears low due to drinking, but knows much
      caution: 30,
      honor: 65,
      greed: 25,
      aggression: 45
    })
  });
  thom.memory.addMemory('secret', 'I know about the ancient ruins beneath the town - we sealed something dangerous there', { importance: 90 });
  thom.memory.addMemory('observation', 'Strange magical activity lately - the seals might be weakening', { importance: 85 });
  thom.memory.addMemory('regret', 'I lost my courage after that last expedition. Now I just drink.', { importance: 75 });
  thom.memory.addMemory('fact', 'Grok and I go way back - we trust each other', { importance: 80 });
  thom.memory.addMemory('concern', 'I might need to sober up and act if the seals truly are breaking', { importance: 70 });
  thom.relationships.setRelationship('grok', 80); // Old adventuring buddy
  thom.relationships.setRelationship('mara', 60); // She tolerates his drinking
  npcs.set('thom', thom);

  // 8. SIENNA - Herbalist (Knowledgeable, Mysterious, Slightly Illegal)
  const sienna = new Character('sienna', 'Sienna', {
    role: 'npc',
    backstory: 'I know the healing properties of every herb and root in the forest. Some call me a witch, but I simply understand nature better than most. I live on the edge of town near the woods.',
    occupation: 'Herbalist',
    age: 45,
    personality: new Personality({
      friendliness: 70,
      intelligence: 85,
      caution: 75,
      honor: 60,
      greed: 40,
      aggression: 25
    })
  });
  sienna.memory.addMemory('concern', 'Rare herbs have been disappearing from my garden - someone is stealing them', { importance: 85 });
  sienna.memory.addMemory('secret', 'I can brew potions that are not entirely legal, but I am careful who I sell to', { importance: 90 });
  sienna.memory.addMemory('observation', 'The forest feels wrong lately - animals are disturbed', { importance: 80 });
  sienna.memory.addMemory('fact', 'Mara buys healing salves from me regularly', { importance: 60 });
  sienna.memory.addMemory('knowledge', 'I know Thom speaks truth about the sealed ruins - the forest remembers', { importance: 85 });
  sienna.relationships.setRelationship('mara', 65); // Good business relationship
  sienna.relationships.setRelationship('thom', 50); // Respects his knowledge
  npcs.set('sienna', sienna);

  // 9. RODERICK - Merchant Guild Master (Cunning, Greedy, Manipulative)
  const roderick = new Character('roderick', 'Roderick', {
    role: 'npc',
    backstory: 'I built my merchant empire through shrewd dealings and knowing when to press my advantage. I control most trade in this region and plan to control more.',
    occupation: 'Merchant Guild Master',
    age: 50,
    personality: new Personality({
      friendliness: 40,
      intelligence: 85,
      caution: 70,
      honor: 25,
      greed: 95,
      aggression: 60
    })
  });
  roderick.memory.addMemory('goal', 'I want to acquire the Red Griffin Inn - prime location for my operations', { importance: 90 });
  roderick.memory.addMemory('secret', 'I have people stealing from Mara to pressure her into selling', { importance: 100 });
  roderick.memory.addMemory('fact', 'I hold Lady Cordelia debt and can use it for political leverage', { importance: 95 });
  roderick.memory.addMemory('observation', 'The town guard captain is in my pocket, but Aldric is too honest', { importance: 80 });
  roderick.memory.addMemory('concern', 'Elara is becoming a serious competitor - I need to eliminate her', { importance: 85 });
  roderick.relationships.setRelationship('mara', -40); // Target
  roderick.relationships.setRelationship('cordelia', 30); // Controls through debt
  roderick.relationships.setRelationship('elara', -50); // Business rival
  roderick.relationships.setRelationship('aldric', -30); // Sees him as obstacle
  roderick.relationships.setRelationship('grok', 20); // Tries to manipulate
  npcs.set('roderick', roderick);

  // 10. BROTHER MARCUS - Priest (Faithful, Questioning, Counselor)
  const marcus = new Character('marcus', 'Brother Marcus', {
    role: 'npc',
    backstory: 'I have served the temple for 18 years, offering counsel and spiritual guidance to all who seek it. Lately I have been wrestling with doubts about my faith.',
    occupation: 'Priest',
    age: 44,
    personality: new Personality({
      friendliness: 85,
      intelligence: 75,
      caution: 60,
      honor: 95,
      greed: 5,
      aggression: 10
    })
  });
  marcus.memory.addMemory('concern', 'People are losing faith and turning to superstition - I see it in their eyes', { importance: 80 });
  marcus.memory.addMemory('secret', 'I question my own beliefs more each day, but I cannot abandon those who need me', { importance: 90 });
  marcus.memory.addMemory('observation', 'Evil grows in this town - I sense it but feel powerless to stop it', { importance: 85 });
  marcus.memory.addMemory('fact', 'Lady Cordelia confides in me - I know about her debts but cannot break her trust', { importance: 95 });
  marcus.memory.addMemory('belief', 'True faith is shown through actions, not words', { importance: 75 });
  marcus.relationships.setRelationship('cordelia', 80); // Counsels her
  marcus.relationships.setRelationship('mara', 70); // Respects her integrity
  marcus.relationships.setRelationship('roderick', -10); // Disapproves but tries not to judge
  npcs.set('marcus', marcus);

  return npcs;
}

/**
 * Get NPC relationship map - who knows/likes/dislikes whom
 */
export function getNPCRelationships() {
  return {
    // Mara's relationships
    mara: {
      aldric: { value: 70, reason: 'Trusts the honest guard' },
      finn: { value: 50, reason: 'Sometimes feeds the orphan' },
      thom: { value: 60, reason: 'Tolerates his drinking, old customer' },
      sienna: { value: 65, reason: 'Regular business, buys healing salves' },
      marcus: { value: 70, reason: 'Respects his guidance' },
      roderick: { value: -40, reason: 'Dislikes his pushiness about buying the inn' }
    },

    // Grok's relationships
    grok: {
      thom: { value: 80, reason: 'Old adventuring companion, deep trust' },
      roderick: { value: -40, reason: 'Knows he is a cheat' },
      aldric: { value: 55, reason: 'Respects his dedication to duty' }
    },

    // Elara's relationships
    elara: {
      roderick: { value: -50, reason: 'Business rival, he plays dirty' },
      sienna: { value: 45, reason: 'Sometimes trades rare herbs' }
    },

    // Aldric's relationships
    aldric: {
      mara: { value: 70, reason: 'Trusts her integrity' },
      roderick: { value: -30, reason: 'Knows he corrupts the captain' },
      cordelia: { value: 60, reason: 'Respects her nobility and kindness' }
    },

    // Finn's relationships
    finn: {
      roderick: { value: -30, reason: 'Fears his cruelty' },
      cordelia: { value: 60, reason: 'She is kind to street kids' },
      mara: { value: 50, reason: 'Sometimes gives him scraps' }
    },

    // Cordelia's relationships
    cordelia: {
      roderick: { value: -20, reason: 'Resents debt control' },
      marcus: { value: 80, reason: 'Source of comfort and counsel' },
      finn: { value: 55, reason: 'Pities the orphan child' }
    },

    // Thom's relationships
    thom: {
      grok: { value: 80, reason: 'Brother in arms from adventuring days' },
      mara: { value: 60, reason: 'She lets him drink in peace' },
      sienna: { value: 50, reason: 'Respects her knowledge of the old ways' }
    },

    // Sienna's relationships
    sienna: {
      mara: { value: 65, reason: 'Good customer relationship' },
      thom: { value: 50, reason: 'He knows old secrets' },
      elara: { value: 45, reason: 'Sometimes trades exotic herbs' }
    },

    // Roderick's relationships
    roderick: {
      mara: { value: -40, reason: 'Target for acquisition' },
      cordelia: { value: 30, reason: 'Controls through debt leverage' },
      elara: { value: -50, reason: 'Threatening competitor' },
      aldric: { value: -30, reason: 'Too honest, cannot be bought' },
      grok: { value: 20, reason: 'Tries to manipulate for weapon deals' }
    },

    // Marcus's relationships
    marcus: {
      cordelia: { value: 80, reason: 'Counsels and supports her' },
      mara: { value: 70, reason: 'Respects her integrity' },
      roderick: { value: -10, reason: 'Disapproves but tries not to judge' },
      aldric: { value: 65, reason: 'Respects his sense of justice' }
    }
  };
}

/**
 * Apply all NPC relationships to the character objects
 */
export function applyNPCRelationships(npcs) {
  const relationships = getNPCRelationships();
  
  for (const [npcId, relations] of Object.entries(relationships)) {
    const npc = npcs.get(npcId);
    if (!npc) continue;
    
    for (const [targetId, data] of Object.entries(relations)) {
      npc.relationships.setRelationship(targetId, data.value, data.reason);
    }
  }
}

/**
 * Get a summary of all NPCs for display
 */
export function getNPCSummary() {
  return [
    { id: 'mara', name: 'Mara', role: 'Tavern Keeper', archetype: 'Honest Proprietor' },
    { id: 'grok', name: 'Grok', role: 'Blacksmith', archetype: 'Gruff Craftsman' },
    { id: 'elara', name: 'Elara', role: 'Traveling Merchant', archetype: 'Clever Trader' },
    { id: 'aldric', name: 'Aldric', role: 'Town Guard', archetype: 'Dutiful Protector' },
    { id: 'finn', name: 'Finn', role: 'Street Urchin', archetype: 'Eyes & Ears' },
    { id: 'cordelia', name: 'Lady Cordelia', role: 'Noblewoman', archetype: 'Troubled Noble' },
    { id: 'thom', name: 'Thom', role: 'Drunk (Former Adventurer)', archetype: 'Fallen Hero' },
    { id: 'sienna', name: 'Sienna', role: 'Herbalist', archetype: 'Wise Woman' },
    { id: 'roderick', name: 'Roderick', role: 'Merchant Lord', archetype: 'Villain' },
    { id: 'marcus', name: 'Brother Marcus', role: 'Priest', archetype: 'Faithful Counselor' }
  ];
}
