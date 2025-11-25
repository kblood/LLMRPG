/**
 * Diagnostic Script for UI Issues
 * Simulates what the UI receives and checks if it has all needed data
 */

import { StatePublisher } from '../src/services/StatePublisher.js';

console.log('\n=== UI Issue Diagnostic ===\n');

// Simulate state publisher
const publisher = StatePublisher.getInstance();

// Simulate the UI subscriber
let receivedUpdates = [];

const uiSubscriber = {
  id: 'test-ui',
  onStateUpdate: (state, eventType) => {
    receivedUpdates.push({ state, eventType, timestamp: Date.now() });
    console.log(`[UI] Received update #${receivedUpdates.length}: ${eventType}`);
    
    // Check quest data
    if (state.quests && state.quests.active) {
      console.log(`  Quests in state: ${state.quests.active.length}`);
      if (state.quests.active.length > 0) {
        const quest = state.quests.active[0];
        console.log(`  First quest:`, {
          title: quest.title,
          status: quest.status,
          type: quest.type,
          hasDescription: !!quest.description
        });
      }
    } else {
      console.log(`  ❌ No quests in state`);
    }
    
    // Check location data
    if (state.location) {
      console.log(`  Locations discovered: ${state.location.discovered?.length || 0}`);
      console.log(`  Location database: ${state.location.database?.length || 0}`);
      if (state.location.database && state.location.database.length > 0) {
        const loc = state.location.database[0];
        console.log(`  First location:`, {
          id: loc.id,
          name: loc.name,
          dangerLevel: loc.dangerLevel
        });
      }
    } else {
      console.log(`  ❌ No location data in state`);
    }
    
    // Check protagonist
    if (state.characters && state.characters.protagonist) {
      const prot = state.characters.protagonist;
      console.log(`  Protagonist: ${prot.name}`);
      console.log(`  HP: ${prot.stats?.currentHP}/${prot.stats?.maxHP}`);
      console.log(`  Location: ${prot.currentLocation}`);
    } else {
      console.log(`  ❌ No protagonist in state`);
    }
    
    console.log('');
  },
  onGameEvent: (event) => {
    console.log(`[UI] Game event: ${event.type}`);
  }
};

publisher.subscribe(uiSubscriber);

// Simulate game state updates that the UI should receive

// 1. Game started
console.log('\n--- Simulating Game Start ---\n');
publisher.publish({
  sessionId: 'test_session',
  seed: 12345,
  frame: 0,
  time: {
    gameTime: 480,
    gameTimeString: '08:00',
    timeOfDay: 'morning',
    day: 1
  },
  characters: {
    protagonist: {
      id: 'prot_1',
      name: 'TestHero',
      currentLocation: 'location_0',
      stats: {
        currentHP: 100,
        maxHP: 100,
        level: 1
      }
    },
    npcs: []
  },
  location: {
    current: 'location_0',
    discovered: ['location_0'],
    visited: ['location_0'],
    database: [
      {
        id: 'location_0',
        name: 'Starting Town',
        dangerLevel: 'safe',
        type: 'town'
      }
    ]
  },
  quests: {
    active: [],
    stats: {
      total: 0,
      active: 0,
      completed: 0
    }
  }
}, 'game_started');

// 2. Quest created
console.log('\n--- Simulating Quest Creation ---\n');
publisher.publish({
  sessionId: 'test_session',
  frame: 10,
  time: { gameTime: 490, gameTimeString: '08:10', timeOfDay: 'morning', day: 1 },
  characters: {
    protagonist: {
      id: 'prot_1',
      name: 'TestHero',
      currentLocation: 'location_0',
      stats: { currentHP: 100, maxHP: 100, level: 1 }
    },
    npcs: []
  },
  location: {
    current: 'location_0',
    discovered: ['location_0'],
    visited: ['location_0'],
    database: [
      {
        id: 'location_0',
        name: 'Starting Town',
        dangerLevel: 'safe',
        type: 'town'
      }
    ]
  },
  quests: {
    active: [
      {
        id: 'quest_1',
        title: 'Find the Ancient Relic',
        description: 'Search for the legendary relic hidden in the forest',
        type: 'main',
        status: 'active',
        objectives: [
          {
            id: 'obj_1',
            description: 'Travel to Dark Forest',
            completed: false
          }
        ]
      }
    ],
    stats: {
      total: 1,
      active: 1,
      completed: 0
    }
  }
}, 'quest_created');

// 3. Location discovered
console.log('\n--- Simulating Location Discovery ---\n');
publisher.publish({
  sessionId: 'test_session',
  frame: 20,
  time: { gameTime: 500, gameTimeString: '08:20', timeOfDay: 'morning', day: 1 },
  characters: {
    protagonist: {
      id: 'prot_1',
      name: 'TestHero',
      currentLocation: 'location_0',
      stats: { currentHP: 100, maxHP: 100, level: 1 }
    },
    npcs: []
  },
  location: {
    current: 'location_0',
    discovered: ['location_0', 'location_1'],
    visited: ['location_0'],
    database: [
      {
        id: 'location_0',
        name: 'Starting Town',
        dangerLevel: 'safe',
        type: 'town'
      },
      {
        id: 'location_1',
        name: 'Dark Forest',
        dangerLevel: 'medium',
        type: 'wilderness'
      }
    ]
  },
  quests: {
    active: [
      {
        id: 'quest_1',
        title: 'Find the Ancient Relic',
        description: 'Search for the legendary relic hidden in the forest',
        type: 'main',
        status: 'active',
        objectives: [
          {
            id: 'obj_1',
            description: 'Travel to Dark Forest',
            completed: false
          }
        ]
      }
    ],
    stats: {
      total: 1,
      active: 1,
      completed: 0
    }
  }
}, 'location_discovered');

// Summary
console.log('\n--- Diagnostic Summary ---\n');
console.log(`Total updates received: ${receivedUpdates.length}`);
console.log(`Expected: 3 (game_started, quest_created, location_discovered)`);

if (receivedUpdates.length === 3) {
  console.log('✅ All updates received');
} else {
  console.log(`❌ Missing ${3 - receivedUpdates.length} updates`);
}

// Check if data is complete
const lastUpdate = receivedUpdates[receivedUpdates.length - 1];
if (lastUpdate) {
  const state = lastUpdate.state;
  console.log('\nFinal state check:');
  console.log(`  Quests: ${state.quests.active.length > 0 ? '✅' : '❌'}`);
  console.log(`  Locations: ${state.location.database.length > 1 ? '✅' : '❌'}`);
  console.log(`  Protagonist: ${state.characters.protagonist ? '✅' : '❌'}`);
}

console.log('\n=== Diagnostic Complete ===\n');

process.exit(0);
