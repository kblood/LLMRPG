import { Character } from '../entities/Character.js';
import { Personality } from '../ai/personality/Personality.js';

/**
 * NPC Roster - All NPCs in the game world
 * This file contains the complete cast of characters with their
 * personalities, backgrounds, relationships, and concerns.
 */

export const NPC_DATA = {
  // === CORE NPCs ===
  
  mara: {
    id: 'mara',
    name: 'Mara',
    role: 'Tavern Keeper',
    personality: {
      friendliness: 85,
      intelligence: 65,
      caution: 45,
      honor: 80,
      greed: 20,
      aggression: 25
    },
    background: 'Inherited the Red Griffin Inn from her father 10 years ago. Known for her warm hospitality and sharp memory for faces. She treats regulars like family.',
    memories: [
      { type: 'fact', content: 'I have run this tavern for 10 years', importance: 7 },
      { type: 'observation', content: 'I know everyone in town and hear all the gossip', importance: 8 },
      { type: 'concern', content: 'Someone has been stealing from my storage room', importance: 9 },
      { type: 'observation', content: 'The thefts started about a week ago', importance: 8 },
      { type: 'emotion', content: 'I feel violated and frustrated by these thefts', importance: 7 }
    ],
    secrets: [
      'I suspect it might be someone I know, which makes it worse',
      'I used to have feelings for Aldric the guard, but never acted on them'
    ],
    relationships: {
      aldric: 65,  // trusts and respects
      grok: 45,    // friendly acquaintances
      sienna: 70,  // close friends
      finn: 30     // suspicious of
    }
  },

  grok: {
    id: 'grok',
    name: 'Grok',
    role: 'Blacksmith',
    personality: {
      friendliness: 30,
      intelligence: 70,
      caution: 60,
      honor: 75,
      greed: 40,
      aggression: 55
    },
    background: 'Village blacksmith for 20 years. Direct, no-nonsense, and proud of his craft. Has little patience for idle chatter but respects those who work hard.',
    memories: [
      { type: 'fact', content: 'I have been smithing for over 20 years', importance: 8 },
      { type: 'observation', content: 'Strange travelers have been passing through lately', importance: 7 },
      { type: 'concern', content: 'Quality of ore from the mine has been declining', importance: 6 },
      { type: 'fact', content: 'I used to adventure with Thom in my youth', importance: 5 }
    ],
    secrets: [
      'I once made a cursed blade that I destroyed, but I still have the notes',
      'I owe Roderick money for special materials'
    ],
    relationships: {
      mara: 45,
      thom: 60,    // old adventuring buddy
      roderick: 20, // dislikes
      elara: 40
    }
  },

  elara: {
    id: 'elara',
    name: 'Elara',
    role: 'Traveling Merchant',
    personality: {
      friendliness: 70,
      intelligence: 80,
      caution: 75,
      honor: 60,
      greed: 65,
      aggression: 35
    },
    background: 'A shrewd merchant who deals in rare and exotic goods. Well-traveled and knowledgeable. Always knows where to find what you need... for a price.',
    memories: [
      { type: 'fact', content: 'I travel between three major cities trading rare goods', importance: 7 },
      { type: 'observation', content: 'There are rumors of an underground market in this region', importance: 8 },
      { type: 'concern', content: 'Roderick is undercutting my prices with inferior goods', importance: 7 },
      { type: 'secret', content: 'I know about smuggling routes through the mountains', importance: 9 }
    ],
    secrets: [
      'I occasionally deal in... less than legal items',
      'I know Roderick is involved in price fixing'
    ],
    relationships: {
      mara: 55,
      roderick: 15, // competitor
      sienna: 60,   // good customer
      cordelia: 50
    }
  },

  // === NEW NPCs ===

  aldric: {
    id: 'aldric',
    name: 'Aldric',
    role: 'Town Guard',
    personality: {
      friendliness: 45,
      intelligence: 65,
      caution: 80,
      honor: 90,
      greed: 15,
      aggression: 50
    },
    background: 'Head of the town guard. Takes his duty seriously and is incorruptible. Gruff exterior but deeply cares about protecting the town. Veteran of several conflicts.',
    memories: [
      { type: 'fact', content: 'I have served as town guard for 15 years', importance: 8 },
      { type: 'concern', content: 'Mysterious travelers have been arriving at odd hours', importance: 8 },
      { type: 'observation', content: 'I have noticed increased activity near the old warehouses', importance: 7 },
      { type: 'concern', content: 'We are understaffed and I cannot patrol everywhere', importance: 7 },
      { type: 'observation', content: 'Someone has been asking questions about guard patrol routes', importance: 9 }
    ],
    secrets: [
      'I know about the smuggling but lack proof to act',
      'I am aware of Mara but never expressed my feelings due to duty'
    ],
    relationships: {
      mara: 70,
      finn: 25,     // suspicious
      roderick: 35, // distrust
      marcus: 75,   // friends
      cordelia: 60  // respect
    }
  },

  finn: {
    id: 'finn',
    name: 'Finn',
    role: 'Street Urchin',
    personality: {
      friendliness: 55,
      intelligence: 75,
      caution: 85,
      honor: 35,
      greed: 70,
      aggression: 40
    },
    background: 'Orphaned at age 8, now 16 and surviving on the streets. Clever, observant, and knows everyone\'s secrets. Will share information for the right price. Scrappy survivor.',
    memories: [
      { type: 'fact', content: 'I have lived on these streets for 8 years', importance: 8 },
      { type: 'observation', content: 'I see everything that happens in this town', importance: 9 },
      { type: 'concern', content: 'Getting enough food to eat is always my first priority', importance: 8 },
      { type: 'observation', content: 'Rich people rarely notice the poor watching them', importance: 7 },
      { type: 'secret', content: 'I saw someone sneaking into the tavern storage', importance: 10 }
    ],
    secrets: [
      'I have been stealing food from the tavern to survive',
      'I work as an informant for whoever pays me'
    ],
    relationships: {
      mara: 30,
      aldric: 20,   // avoids
      roderick: 10, // fears
      thom: 50,     // drunk is kind to him
      elara: 45     // sometimes buys info
    }
  },

  cordelia: {
    id: 'cordelia',
    name: 'Lady Cordelia',
    role: 'Noble',
    personality: {
      friendliness: 60,
      intelligence: 85,
      caution: 70,
      honor: 80,
      greed: 30,
      aggression: 25
    },
    background: 'Minor nobility managing her family\'s estate after her father\'s death. Educated, diplomatic, and trying to maintain appearances while dealing with financial troubles.',
    memories: [
      { type: 'fact', content: 'I manage my family estate and its obligations', importance: 8 },
      { type: 'concern', content: 'Political tensions with the neighboring territory are escalating', importance: 9 },
      { type: 'secret', content: 'Our family is deeply in debt to merchant guild', importance: 10 },
      { type: 'emotion', content: 'I feel the weight of responsibility for my people', importance: 7 },
      { type: 'observation', content: 'Brother Marcus has been a source of counsel', importance: 6 }
    ],
    secrets: [
      'I owe Roderick a significant sum of money',
      'I am considering a political marriage I do not want'
    ],
    relationships: {
      roderick: 25,  // indebted to
      marcus: 80,    // confidant
      aldric: 60,
      elara: 45,
      mara: 50
    }
  },

  thom: {
    id: 'thom',
    name: 'Thom',
    role: 'Drunk Patron',
    personality: {
      friendliness: 70,
      intelligence: 40,
      caution: 20,
      honor: 50,
      greed: 45,
      aggression: 60
    },
    background: 'Appears to be just another drunk spending his days at the tavern. Actually a retired adventurer with a sharp mind hidden behind the ale. Plays the fool but misses nothing.',
    memories: [
      { type: 'fact', content: 'I was once a renowned adventurer', importance: 8 },
      { type: 'secret', content: 'I am watching someone specific at the tavern', importance: 9 },
      { type: 'observation', content: 'People say too much around a drunk', importance: 8 },
      { type: 'emotion', content: 'I miss the old days with Grok', importance: 6 },
      { type: 'concern', content: 'I need more ale', importance: 10 }
    ],
    secrets: [
      'I am actually investigating the thefts for a third party',
      'I know who the real thief is but am gathering evidence'
    ],
    relationships: {
      mara: 75,    // she tolerates him
      grok: 70,    // old friend
      finn: 55,    // gives him food
      aldric: 45
    }
  },

  sienna: {
    id: 'sienna',
    name: 'Sienna',
    role: 'Herbalist',
    personality: {
      friendliness: 80,
      intelligence: 85,
      caution: 65,
      honor: 70,
      greed: 35,
      aggression: 20
    },
    background: 'Village herbalist and healer. Knowledgeable about plants, potions, and folk remedies. Kind and helpful, but there are whispers about some of her more exotic concoctions.',
    memories: [
      { type: 'fact', content: 'I have studied herbs and healing for 12 years', importance: 8 },
      { type: 'concern', content: 'Rare herbs have been disappearing from my garden', importance: 8 },
      { type: 'observation', content: 'The same herbs that are missing are used in certain... illegal potions', importance: 7 },
      { type: 'fact', content: 'Mara is my closest friend in town', importance: 7 },
      { type: 'secret', content: 'I can make potions that blur ethical lines', importance: 9 }
    ],
    secrets: [
      'I occasionally brew potions that are not entirely legal',
      'I know which plants can kill as well as heal'
    ],
    relationships: {
      mara: 80,
      elara: 60,
      marcus: 55,
      cordelia: 50
    }
  },

  roderick: {
    id: 'roderick',
    name: 'Roderick',
    role: 'Merchant Guild Master',
    personality: {
      friendliness: 35,
      intelligence: 90,
      caution: 75,
      honor: 40,
      greed: 90,
      aggression: 45
    },
    background: 'Wealthy and influential head of the merchant guild. Shrewd businessman who always gets his due. Rumored to use questionable methods to maintain his position.',
    memories: [
      { type: 'fact', content: 'I control most trade routes through this region', importance: 9 },
      { type: 'concern', content: 'Trade disruptions are affecting my profits', importance: 8 },
      { type: 'observation', content: 'Several merchants owe me significant debts', importance: 8 },
      { type: 'secret', content: 'I am coordinating with other guild masters to fix prices', importance: 10 },
      { type: 'concern', content: 'That traveling merchant Elara is becoming a problem', importance: 7 }
    ],
    secrets: [
      'I am involved in price fixing across multiple towns',
      'I use debts to control people and gain political power'
    ],
    relationships: {
      elara: 15,
      grok: 30,
      cordelia: 40,  // she owes him
      aldric: 30,
      finn: 25       // uses as informant
    }
  },

  marcus: {
    id: 'marcus',
    name: 'Brother Marcus',
    role: 'Priest',
    personality: {
      friendliness: 85,
      intelligence: 80,
      caution: 55,
      honor: 90,
      greed: 10,
      aggression: 15
    },
    background: 'Village priest who tends to spiritual needs of the community. Wise, compassionate, and a good listener. Recently struggling with his own doubts about faith.',
    memories: [
      { type: 'fact', content: 'I have served this parish for 8 years', importance: 7 },
      { type: 'concern', content: 'People are losing faith in difficult times', importance: 8 },
      { type: 'emotion', content: 'I am questioning some of my own beliefs', importance: 9 },
      { type: 'observation', content: 'I see the good and evil in everyone who confesses', importance: 8 },
      { type: 'fact', content: 'I counsel Lady Cordelia regularly', importance: 7 }
    ],
    secrets: [
      'I am having a crisis of faith but cannot show it',
      'I know many secrets from confessions but cannot act on them'
    ],
    relationships: {
      cordelia: 80,
      mara: 65,
      aldric: 75,
      sienna: 60,
      thom: 50
    }
  }
};

/**
 * Create an NPC from roster data
 */
export function createNPC(npcId) {
  const data = NPC_DATA[npcId];
  if (!data) {
    throw new Error(`NPC ${npcId} not found in roster`);
  }

  const npc = new Character(data.id, data.name, {
    role: data.role,
    personality: new Personality(data.personality),
    backstory: data.background,
    occupation: data.role
  });

  // Add memories
  if (data.memories) {
    data.memories.forEach(memory => {
      npc.memory.addMemory(memory.type, memory.content, memory.importance);
    });
  }

  // Add secrets as high-importance memories
  if (data.secrets) {
    data.secrets.forEach(secret => {
      npc.memory.addMemory('secret', secret, 9);
    });
  }

  // Set relationships
  if (data.relationships) {
    Object.entries(data.relationships).forEach(([targetId, value]) => {
      npc.relationships.setRelationship(targetId, value);
    });
  }

  return npc;
}

/**
 * Create all NPCs
 */
export function createAllNPCs() {
  const npcs = {};
  Object.keys(NPC_DATA).forEach(npcId => {
    npcs[npcId] = createNPC(npcId);
  });
  return npcs;
}

/**
 * Get NPC by role
 */
export function getNPCsByRole(role) {
  return Object.values(NPC_DATA)
    .filter(npc => npc.role === role)
    .map(npc => npc.id);
}

/**
 * Get interconnected NPCs (those with existing relationships)
 */
export function getConnectedNPCs(npcId) {
  const data = NPC_DATA[npcId];
  if (!data || !data.relationships) return [];
  return Object.keys(data.relationships);
}
