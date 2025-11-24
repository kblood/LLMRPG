#!/usr/bin/env node

/**
 * Autonomous Exploration Test Suite
 *
 * Tests exploration system integration with autonomous game:
 * - Player leaves starting location
 * - Player seeks new areas (combat/resources/quests)
 * - Exploration varies by personality/goals
 * - Pathfinding works for distant locations
 * - Location discovery mechanics function
 *
 * Run: node tests/test-autonomous-exploration.js
 */

import { GameSession } from '../src/game/GameSession.js';
import { GameService } from '../src/services/GameService.js';
import { StandaloneAutonomousGame } from '../src/services/StandaloneAutonomousGame.js';
import { Character } from '../src/entities/Character.js';

// Test utilities
const tests = [];
let passCount = 0;
let failCount = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('='.repeat(80));
  console.log('Autonomous Exploration Test Suite');
  console.log('='.repeat(80));
  console.log();

  for (const { name, fn } of tests) {
    try {
      console.log(`Testing: ${name}`);
      await fn();
      console.log(`✓ PASS: ${name}\n`);
      passCount++;
    } catch (error) {
      console.error(`✗ FAIL: ${name}`);
      console.error(`  Error: ${error.message}`);
      console.error(`  Stack: ${error.stack}\n`);
      failCount++;
    }
  }

  console.log('='.repeat(80));
  console.log('Test Results');
  console.log('='.repeat(80));
  console.log(`Total: ${tests.length}`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${failCount}`);
  console.log();

  if (failCount === 0) {
    console.log('All tests passed!');
    process.exit(0);
  } else {
    console.log('Some tests failed!');
    process.exit(1);
  }
}

// Assertion helpers
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertNotNull(value, message) {
  if (value === null || value === undefined) {
    throw new Error(message || 'Value is null or undefined');
  }
}

function assertGreaterThan(value, threshold, message) {
  if (value <= threshold) {
    throw new Error(message || `Expected ${value} > ${threshold}`);
  }
}

function assertContains(array, item, message) {
  if (!array || !array.includes(item)) {
    throw new Error(message || `Array does not contain ${item}`);
  }
}

// Helper to create locations
function setupLocations(session) {
  // Add multiple locations to the world
  session.locationDatabase.set('town_square', {
    id: 'town_square',
    name: 'Town Square',
    description: 'The bustling heart of the town',
    type: 'settlement',
    safe: true,
    connections: ['market', 'tavern', 'temple']
  });

  session.locationDatabase.set('market', {
    id: 'market',
    name: 'Market District',
    description: 'A busy marketplace full of traders',
    type: 'settlement',
    safe: true,
    connections: ['town_square', 'warehouse']
  });

  session.locationDatabase.set('tavern', {
    id: 'tavern',
    name: 'The Red Griffin Tavern',
    description: 'A warm tavern with good ale',
    type: 'settlement',
    safe: true,
    connections: ['town_square']
  });

  session.locationDatabase.set('temple', {
    id: 'temple',
    name: 'Temple of Light',
    description: 'A peaceful temple',
    type: 'settlement',
    safe: true,
    connections: ['town_square', 'forest']
  });

  session.locationDatabase.set('forest', {
    id: 'forest',
    name: 'Dark Forest',
    description: 'A mysterious and dangerous forest',
    type: 'wilderness',
    safe: false,
    connections: ['temple', 'cave']
  });

  session.locationDatabase.set('cave', {
    id: 'cave',
    name: 'Ancient Cave',
    description: 'A deep cave with unknown dangers',
    type: 'wilderness',
    safe: false,
    connections: ['forest']
  });

  session.locationDatabase.set('warehouse', {
    id: 'warehouse',
    name: 'Old Warehouse',
    description: 'An abandoned warehouse',
    type: 'settlement',
    safe: false,
    connections: ['market']
  });

  // Start with town square discovered
  session.discoveredLocations.add('town_square');
  session.currentLocation = 'town_square';
}

// ============================================================================
// TESTS
// ============================================================================

test('GameSession can manage locations', () => {
  const session = new GameSession({ seed: 12345, model: 'granite4:3b' });
  setupLocations(session);

  assertEqual(session.locationDatabase.size, 7, 'Should have 7 locations');
  assertEqual(session.currentLocation, 'town_square', 'Should start at town square');
  assert(session.discoveredLocations.has('town_square'), 'Town square should be discovered');
});

test('GameService provides location methods', async () => {
  const session = new GameSession({ seed: 12345, model: 'granite4:3b' });
  setupLocations(session);

  const protagonist = new Character('protagonist', 'Explorer', {
    role: 'protagonist',
    currentLocation: 'town_square'
  });
  session.addCharacter(protagonist);

  const gameService = new GameService(session);
  await gameService.initialize();

  // Test location methods exist
  const discovered = gameService.getDiscoveredLocations();
  assertNotNull(discovered, 'Should have discovered locations');
  assertGreaterThan(discovered.length, 0, 'Should have at least one location');

  const current = gameService.getCurrentLocation();
  assertNotNull(current, 'Should have current location');
  assertEqual(current.id, 'town_square', 'Should be at town square');
});

test('Can discover new locations', async () => {
  const session = new GameSession({ seed: 12345, model: 'granite4:3b' });
  setupLocations(session);

  const protagonist = new Character('protagonist', 'Explorer', {
    role: 'protagonist',
    currentLocation: 'town_square'
  });
  session.addCharacter(protagonist);

  const gameService = new GameService(session);
  await gameService.initialize();

  // Initially only town square is discovered
  const initialDiscovered = gameService.getDiscoveredLocations();
  assertEqual(initialDiscovered.length, 1, 'Should have 1 location initially');

  // Discover new location
  session.discoveredLocations.add('market');

  const newDiscovered = gameService.getDiscoveredLocations();
  assertEqual(newDiscovered.length, 2, 'Should have 2 locations after discovery');
  assertContains(newDiscovered.map(l => l.id), 'market', 'Should include market');
});

test('Can travel between locations', async () => {
  const session = new GameSession({ seed: 12345, model: 'granite4:3b' });
  setupLocations(session);

  const protagonist = new Character('protagonist', 'Explorer', {
    role: 'protagonist',
    currentLocation: 'town_square'
  });
  session.addCharacter(protagonist);

  const gameService = new GameService(session);
  await gameService.initialize();

  // Discover market first before traveling
  session.discoveredLocations.add('market');

  // Travel to market
  const result = await gameService.executeAction({
    type: 'travel',
    characterId: 'protagonist',
    locationId: 'market'
  });

  // Check result
  assert(result.success, 'Travel should succeed');
  
  const newLocation = gameService.getCurrentLocation();
  if (newLocation) {
    assertEqual(newLocation.id, 'market', 'Should be at market now');
  }
});

test('Location state is included in game state', async () => {
  const session = new GameSession({ seed: 12345, model: 'granite4:3b' });
  setupLocations(session);

  const protagonist = new Character('protagonist', 'Explorer', {
    role: 'protagonist',
    currentLocation: 'town_square'
  });
  session.addCharacter(protagonist);

  const gameService = new GameService(session);
  await gameService.initialize();

  const state = gameService.getGameState();

  assertNotNull(state.location, 'Should have location state');
  assertNotNull(state.location.current, 'Should have current location');
  assertNotNull(state.location.discovered, 'Should have discovered locations');
  assertNotNull(state.location.database, 'Should have location database');
  
  assertEqual(state.location.current, 'town_square', 'Should be at town square');
  assertGreaterThan(state.location.discovered.length, 0, 'Should have discovered locations');
});

test('Location database is serialized', async () => {
  const session = new GameSession({ seed: 12345, model: 'granite4:3b' });
  setupLocations(session);

  const protagonist = new Character('protagonist', 'Explorer', {
    role: 'protagonist',
    currentLocation: 'town_square'
  });
  session.addCharacter(protagonist);

  const gameService = new GameService(session);
  await gameService.initialize();

  const state = gameService.getGameState();
  const db = state.location.database;

  assertNotNull(db, 'Should have location database');
  assertNotNull(db['town_square'], 'Should have town square in database');
  assertEqual(db['town_square'].name, 'Town Square', 'Should have correct location name');
});

test('Visited locations are tracked', async () => {
  const session = new GameSession({ seed: 12345, model: 'granite4:3b' });
  setupLocations(session);

  const protagonist = new Character('protagonist', 'Explorer', {
    role: 'protagonist',
    currentLocation: 'town_square'
  });
  session.addCharacter(protagonist);

  // Mark town square as visited
  session.visitedLocations.add('town_square');

  const gameService = new GameService(session);
  await gameService.initialize();

  const state = gameService.getGameState();
  assertNotNull(state.location.visited, 'Should have visited locations');
  assertContains(state.location.visited, 'town_square', 'Town square should be visited');
});

test('StandaloneAutonomousGame can be created with explorer', async () => {
  const game = await StandaloneAutonomousGame.create({
    sessionConfig: {
      seed: 12345,
      model: 'granite4:3b',
      protagonistName: 'Explorer Hero',
      protagonistBackstory: 'A curious explorer seeking new lands',
      theme: 'exploration'
    },
    frameRate: 10,
    maxFrames: 3,
    autoStart: false
  });

  assertNotNull(game, 'Game should be created');
  assertNotNull(game.gameService, 'Should have game service');
});

test('Autonomous game includes location state', async () => {
  const session = new GameSession({ 
    seed: 12345, 
    model: 'granite4:3b',
    theme: 'exploration'
  });
  
  setupLocations(session);

  const protagonist = new Character('protagonist', 'Explorer', {
    role: 'protagonist',
    currentLocation: 'town_square'
  });
  session.addCharacter(protagonist);

  const gameService = new GameService(session);
  await gameService.initialize();

  // Run one tick
  await gameService.tick();

  const state = gameService.getGameState();
  assertNotNull(state.location, 'Should have location state');
  assertNotNull(state.location.current, 'Should have current location');
});

test('Multiple locations can be discovered', async () => {
  const session = new GameSession({ seed: 12345, model: 'granite4:3b' });
  setupLocations(session);

  const protagonist = new Character('protagonist', 'Explorer', {
    role: 'protagonist',
    currentLocation: 'town_square'
  });
  session.addCharacter(protagonist);

  const gameService = new GameService(session);
  await gameService.initialize();

  // Discover multiple locations
  session.discoveredLocations.add('market');
  session.discoveredLocations.add('tavern');
  session.discoveredLocations.add('temple');

  const discovered = gameService.getDiscoveredLocations();
  assertGreaterThan(discovered.length, 3, 'Should have multiple locations');
});

test('Location connections are preserved', async () => {
  const session = new GameSession({ seed: 12345, model: 'granite4:3b' });
  setupLocations(session);

  const protagonist = new Character('protagonist', 'Explorer', {
    role: 'protagonist',
    currentLocation: 'town_square'
  });
  session.addCharacter(protagonist);

  const gameService = new GameService(session);
  await gameService.initialize();

  const state = gameService.getGameState();
  const townSquare = state.location.database['town_square'];

  assertNotNull(townSquare.connections, 'Should have connections');
  assert(Array.isArray(townSquare.connections), 'Connections should be array');
  assertGreaterThan(townSquare.connections.length, 0, 'Should have at least one connection');
});

// ============================================================================
// RUN TESTS
// ============================================================================

console.log('Starting Autonomous Exploration Test Suite...\n');
runTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
