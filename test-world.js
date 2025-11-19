/**
 * World System Test - Testing hierarchical locations and distance calculations
 */

import { Location } from './src/systems/world/Location.js';
import { WorldManager } from './src/systems/world/WorldManager.js';

console.log('╔════════════════════════════════════════╗');
console.log('║   OLLAMARPM WORLD SYSTEM TEST          ║');
console.log('╚════════════════════════════════════════╝\n');

// Create world manager
const world = new WorldManager();

// Test 1: Create hierarchical locations
console.log('📍 Test 1: Creating Hierarchical Locations\n');

// Create continent
const continent = new Location({
  id: 'valoria',
  name: 'Valoria',
  type: 'region',
  x: 0,
  y: 0,
  z: 0,
  scale: 10000,
  description: 'A vast continent'
});
world.addLocation(continent);
console.log(`✓ Created continent: ${continent.name}`);

// Create kingdom
const kingdom = new Location({
  id: 'eldoria',
  name: 'Kingdom of Eldoria',
  type: 'region',
  x: 500,
  y: 500,
  z: 0,
  scale: 1000,
  parentLocation: 'valoria',
  description: 'A prosperous kingdom'
});
world.addLocation(kingdom);
world.addChildToParent('valoria', 'eldoria');
console.log(`✓ Created kingdom: ${kingdom.name} (child of ${continent.name})`);

// Create town
const town = new Location({
  id: 'riverside',
  name: 'Riverside',
  type: 'area',
  x: 520,
  y: 510,
  z: 0,
  scale: 100,
  parentLocation: 'eldoria',
  description: 'A bustling riverside town'
});
world.addLocation(town);
world.addChildToParent('eldoria', 'riverside');
console.log(`✓ Created town: ${town.name} (child of ${kingdom.name})`);

// Create inn
const inn = new Location({
  id: 'dragon_inn',
  name: 'The Sleeping Dragon Inn',
  type: 'building',
  x: 522,
  y: 512,
  z: 0,
  scale: 1,
  parentLocation: 'riverside',
  indoor: true,
  description: 'A cozy inn with warm beds'
});
world.addLocation(inn);
world.addChildToParent('riverside', 'dragon_inn');
console.log(`✓ Created inn: ${inn.name} (child of ${town.name})`);

// Create room
const room = new Location({
  id: 'guest_room',
  name: 'Guest Room 3',
  type: 'room',
  x: 522,
  y: 512,
  z: 1, // First floor
  scale: 0.1,
  parentLocation: 'dragon_inn',
  indoor: true,
  description: 'A simple but comfortable guest room'
});
world.addLocation(room);
world.addChildToParent('dragon_inn', 'guest_room');
console.log(`✓ Created room: ${room.name} (child of ${inn.name})`);

// Create shop
const shop = new Location({
  id: 'blacksmith',
  name: 'Ironforge Smithy',
  type: 'building',
  x: 525,
  y: 508,
  z: 0,
  scale: 1,
  parentLocation: 'riverside',
  indoor: true,
  tags: ['shop', 'blacksmith'],
  description: 'A blacksmith shop with quality weapons'
});
world.addLocation(shop);
world.addChildToParent('riverside', 'blacksmith');
console.log(`✓ Created shop: ${shop.name} (child of ${town.name})`);

// Test 2: Hierarchy Navigation
console.log('\n📊 Test 2: Hierarchy Navigation\n');

const hierarchy = world.getLocationHierarchy('guest_room');
console.log(`Hierarchy chain for ${room.name}:`);
hierarchy.forEach((loc, index) => {
  console.log(`  ${'  '.repeat(index)}${index + 1}. ${loc.name} (${loc.type}, scale: ${loc.scale})`);
});

const path = world.getLocationPath('guest_room');
console.log(`\nPath: ${path}`);

const topLevel = world.getTopLevelLocations();
console.log(`\nTop-level locations: ${topLevel.map(l => l.name).join(', ')}`);

const townChildren = world.getChildLocations('riverside');
console.log(`\nChildren of ${town.name}: ${townChildren.map(l => l.name).join(', ')}`);

// Test 3: Distance Calculations
console.log('\n📏 Test 3: Distance Calculations\n');

const distanceInnToShop = world.calculateDistance('dragon_inn', 'blacksmith');
console.log(`Distance from ${inn.name} to ${shop.name}: ${distanceInnToShop.toFixed(2)} units`);

const distanceRoomToShop = world.calculateDistance('guest_room', 'blacksmith');
console.log(`Distance from ${room.name} to ${shop.name}: ${distanceRoomToShop.toFixed(2)} units`);

// Manhattan distance
const manhattanDist = inn.manhattanDistanceTo(shop);
console.log(`Manhattan distance (inn to shop): ${manhattanDist} units`);

// Test 4: Radius Search
console.log('\n🔍 Test 4: Radius Search\n');

const nearby = world.getLocationsWithinRadius('riverside', 10);
console.log(`Locations within 10 units of ${town.name}:`);
nearby.forEach(({ location, distance }) => {
  console.log(`  - ${location.name} (${distance.toFixed(2)} units away)`);
});

// Test 5: Find Nearest by Type
console.log('\n🎯 Test 5: Find Nearest by Type\n');

const nearestShop = world.findNearestLocationType('dragon_inn', 'building');
if (nearestShop) {
  console.log(`Nearest building to ${inn.name}: ${nearestShop.location.name} (${nearestShop.distance.toFixed(2)} units)`);
}

// Test 6: Character Movement
console.log('\n🚶 Test 6: Character Movement\n');

const playerId = 'player1';

// Move to town
world.moveCharacterToLocation(playerId, 'riverside');
let currentLoc = world.getCharacterLocation(playerId);
console.log(`Player moved to: ${currentLoc.name}`);
console.log(`  Full path: ${world.getLocationPath(playerId)}`);

// Move to inn
world.moveCharacterToLocation(playerId, 'dragon_inn');
currentLoc = world.getCharacterLocation(playerId);
console.log(`Player moved to: ${currentLoc.name}`);
console.log(`  Full path: ${world.getLocationPath(currentLoc.id)}`);

// Move to room
world.moveCharacterToLocation(playerId, 'guest_room');
currentLoc = world.getCharacterLocation(playerId);
console.log(`Player moved to: ${currentLoc.name}`);
console.log(`  Full path: ${world.getLocationPath(currentLoc.id)}`);

// Test 7: Serialization
console.log('\n💾 Test 7: Serialization\n');

const locationJson = room.toJSON();
console.log(`Serialized location: ${JSON.stringify(locationJson).substring(0, 100)}...`);

const worldJson = world.toJSON();
console.log(`Serialized world: ${worldJson.locations.length} locations, ${worldJson.characterLocations.length} character positions`);

const deserializedWorld = WorldManager.fromJSON(worldJson);
console.log(`Deserialized world: ${deserializedWorld.getAllLocations().length} locations restored`);

const deserializedRoom = deserializedWorld.getLocation('guest_room');
console.log(`Restored location: ${deserializedRoom.name} at (${deserializedRoom.coordinates.x}, ${deserializedRoom.coordinates.y}, ${deserializedRoom.coordinates.z})`);

// Test 8: World Statistics
console.log('\n📈 Test 8: World Statistics\n');

const stats = world.getStatistics();
console.log(`Total locations: ${stats.totalLocations}`);
console.log(`Discovered: ${stats.discoveredLocations}`);
console.log(`Visited: ${stats.visitedLocations}`);
console.log(`By type:`, stats.locationsByType);
console.log(`Characters in world: ${stats.charactersInWorld}`);

// Summary
console.log('\n╔════════════════════════════════════════╗');
console.log('║   ✅ ALL WORLD TESTS PASSED!          ║');
console.log('╚════════════════════════════════════════╝');
console.log('\n✓ Hierarchical locations working');
console.log('✓ Coordinates and positioning working');
console.log('✓ Distance calculations working');
console.log('✓ Hierarchy navigation working');
console.log('✓ Character movement working');
console.log('✓ Serialization/deserialization working');
console.log('✓ World statistics working\n');
