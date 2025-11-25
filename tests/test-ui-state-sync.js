/**
 * UI State Synchronization Test
 * Tests that state updates are properly formatted and contain all needed data
 */

import { GameService } from '../src/services/GameService.js';
import { GameSession } from '../src/game/GameSession.js';
import { Character } from '../src/entities/Character.js';

console.log('\n=== UI State Synchronization Test ===\n');

// Create game session
const session = new GameSession({
  seed: 12345,
  playerName: 'TestHero',
  model: 'granite4:3b'
});

// Create game service
const gameService = new GameService(session);

// Create protagonist
const protagonist = new Character({
  id: 'protagonist_1',
  name: 'TestHero',
  role: 'Warrior',
  backstory: 'A test hero',
  personality: {
    aggression: 0.7,
    friendliness: 0.5,
    intelligence: 0.5,
    caution: 0.3,
    greed: 0.3,
    honor: 0.7
  },
  attributes: {
    strength: 15,
    dexterity: 12,
    constitution: 14,
    intelligence: 10,
    wisdom: 10,
    charisma: 10
  }
});

protagonist.isPlayer = true;
session.addCharacter(protagonist);
session.protagonist = protagonist;

// Add some locations to the session
session.initializeLocation('location_0', {
  name: 'Starting Town',
  description: 'A peaceful town',
  type: 'town',
  dangerLevel: 'safe'
});

session.initializeLocation('location_1', {
  name: 'Dark Forest',
  description: 'A dangerous forest',
  type: 'wilderness',
  dangerLevel: 'medium'
});

protagonist.currentLocation = 'location_0';
session.currentLocation = 'location_0';

// Discover location_1
session.discoverLocation('location_1', 'Dark Forest');

console.log('[Test] Session initialized');
console.log(`  Locations in database: ${session.locationDatabase.size}`);
console.log(`  Discovered locations: ${Array.from(session.discoveredLocations).join(', ')}`);
console.log(`  Current location: ${session.currentLocation}`);

// Add a quest
const quest = {
  id: 'quest_1',
  title: 'Test Quest',
  description: 'A test quest for heroes',
  type: 'main',
  status: 'active',
  objectives: [
    {
      id: 'obj_1',
      description: 'Find the sword',
      completed: false
    }
  ]
};

session.questManager.addQuest(quest);

console.log('[Test] Quest added');
console.log(`  Active quests: ${session.getActiveQuests().length}`);

// Get game state
const state = gameService.getGameState();

console.log('\n[Test] Game State Structure:');
console.log(`  Session ID: ${state.sessionId}`);
console.log(`  Frame: ${state.frame}`);
console.log(`  Current Time: ${state.time.gameTimeString}`);

console.log('\n[Test] Character State:');
console.log(`  Protagonist: ${state.characters.protagonist ? state.characters.protagonist.name : 'null'}`);
console.log(`  Protagonist Location: ${state.characters.protagonist?.currentLocation}`);
console.log(`  Protagonist HP: ${state.characters.protagonist?.stats.currentHP}/${state.characters.protagonist?.stats.maxHP}`);

console.log('\n[Test] Location State:');
console.log(`  Current: ${state.location.current}`);
console.log(`  Discovered: ${JSON.stringify(state.location.discovered)}`);
console.log(`  Visited: ${JSON.stringify(state.location.visited)}`);
console.log(`  Database entries: ${state.location.database.length}`);
state.location.database.forEach(loc => {
  console.log(`    - ${loc.id}: ${loc.name} (${loc.dangerLevel})`);
});

console.log('\n[Test] Quest State:');
console.log(`  Active quests: ${state.quests.active.length}`);
state.quests.active.forEach(q => {
  console.log(`    - ${q.title} (${q.status})`);
  console.log(`      Type: ${q.type}`);
  console.log(`      Objectives: ${q.objectives?.length || 0}`);
});

// Verify UI would have all needed data
console.log('\n[Test] UI Data Validation:');

const errors = [];

if (!state.characters.protagonist) {
  errors.push('❌ Missing protagonist in state');
}

if (!state.location.database || state.location.database.length === 0) {
  errors.push('❌ Missing location database');
}

if (!state.location.discovered || state.location.discovered.length === 0) {
  errors.push('❌ No discovered locations');
}

if (!state.quests.active || state.quests.active.length === 0) {
  errors.push('❌ No active quests');
}

if (state.quests.active && state.quests.active.length > 0) {
  const firstQuest = state.quests.active[0];
  if (!firstQuest.title) errors.push('❌ Quest missing title');
  if (!firstQuest.status) errors.push('❌ Quest missing status');
  if (!firstQuest.type) errors.push('❌ Quest missing type');
}

if (errors.length > 0) {
  console.log('\n❌ Validation Failed:');
  errors.forEach(err => console.log(`  ${err}`));
} else {
  console.log('✅ All required data present for UI');
}

console.log('\n=== Test Complete ===\n');

process.exit(0);
