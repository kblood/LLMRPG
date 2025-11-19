/**
 * Starter locations for OllamaRPG
 *
 * Pre-defined locations that form the starting world
 */

import { Location } from '../systems/world/Location.js';

/**
 * Create all starter locations
 * @returns {Map<string, Location>} Map of location ID to Location
 */
export function createStarterLocations() {
  const locations = new Map();

  // Town locations
  locations.set('town_square', createTownSquare());
  locations.set('red_griffin_inn', createRedGriffinInn());
  locations.set('blacksmith', createBlacksmith());
  locations.set('market', createMarket());
  locations.set('temple', createTemple());
  locations.set('guild_hall', createGuildHall());

  // Surrounding areas
  locations.set('town_gate', createTownGate());
  locations.set('forest_path', createForestPath());
  locations.set('forest_clearing', createForestClearing());
  locations.set('abandoned_mine', createAbandonedMine());
  locations.set('mine_entrance', createMineEntrance());
  locations.set('mine_depths', createMineDepths());

  // Connect locations
  connectLocations(locations);

  // Establish parent-child relationships
  establishHierarchy(locations);

  return locations;
}

/**
 * Town Square - Central hub (parent of all town buildings)
 */
function createTownSquare() {
  return new Location({
    id: 'town_square',
    name: 'Town Square',
    type: 'area',
    description: 'The heart of the town, bustling with activity. A stone fountain sits in the center, surrounded by cobblestone streets leading in all directions. Merchants call out their wares while townsfolk go about their business.',
    x: 100,
    y: 100,
    z: 0,
    scale: 10,
    indoor: false,
    lit: true,
    safe: true,
    temperature: 'temperate',
    tags: ['town', 'safe', 'social'],
    discovered: true, // Starting location
    visited: true,
    createdBy: 'system'
  });
}

/**
 * Red Griffin Inn - Tavern and quest hub
 */
function createRedGriffinInn() {
  return new Location({
    id: 'red_griffin_inn',
    name: 'The Red Griffin Inn',
    type: 'building',
    description: 'A warm, inviting tavern with a thatched roof and timber walls. The smell of roasted meat and ale fills the air. A painted sign depicts a fierce red griffin above the entrance. Inside, patrons gather around wooden tables, sharing stories and rumors.',
    x: 105,
    y: 100,
    z: 0,
    scale: 1,
    parentLocation: 'town_square',
    indoor: true,
    lit: true,
    safe: true,
    temperature: 'warm',
    tags: ['inn', 'tavern', 'social', 'rest'],
    lore: 'The Red Griffin has been the town\'s gathering place for over a century, named after a legendary beast said to protect the region.',
    createdBy: 'system'
  });
}

/**
 * Blacksmith - Equipment shop
 */
function createBlacksmith() {
  return new Location({
    id: 'blacksmith',
    name: 'Grok\'s Forge',
    type: 'building',
    description: 'The rhythmic clanging of hammer on anvil echoes from this sturdy stone building. Heat radiates from the open forge, where Grok the blacksmith crafts weapons and armor. Finished pieces hang on the walls, gleaming in the firelight.',
    x: 97,
    y: 103,
    z: 0,
    scale: 1,
    parentLocation: 'town_square',
    indoor: true,
    lit: true,
    safe: true,
    temperature: 'hot',
    tags: ['shop', 'blacksmith', 'weapons', 'armor'],
    createdBy: 'system'
  });
}

/**
 * Market - General goods and consumables
 */
function createMarket() {
  return new Location({
    id: 'market',
    name: 'Town Market',
    type: 'area',
    description: 'A bustling marketplace filled with stalls and vendors. Colorful awnings provide shade as merchants hawk their goods: fresh produce, potions, tools, and curiosities from distant lands. The air is thick with the scent of spices and baked bread.',
    x: 100,
    y: 95,
    z: 0,
    scale: 10,
    parentLocation: 'town_square',
    indoor: false,
    lit: true,
    safe: true,
    temperature: 'temperate',
    tags: ['market', 'shop', 'social'],
    createdBy: 'system'
  });
}

/**
 * Temple - Healing and blessing
 */
function createTemple() {
  return new Location({
    id: 'temple',
    name: 'Temple of the Dawn',
    type: 'building',
    description: 'A serene stone temple with tall stained-glass windows depicting scenes of heroic deeds. Soft light filters through, casting colorful patterns on the polished floor. The air is fragrant with incense, and a sense of peace pervades the space.',
    x: 95,
    y: 100,
    z: 0,
    scale: 1,
    parentLocation: 'town_square',
    indoor: true,
    lit: true,
    safe: true,
    temperature: 'temperate',
    tags: ['temple', 'holy', 'healing', 'rest'],
    lore: 'Brother Marcus tends to the temple and offers healing to those in need.',
    createdBy: 'system'
  });
}

/**
 * Guild Hall - Quest board and adventurer hub
 */
function createGuildHall() {
  return new Location({
    id: 'guild_hall',
    name: 'Adventurer\'s Guild Hall',
    type: 'building',
    description: 'A sturdy building adorned with trophies from past adventures: mounted beast heads, ancient weapons, and faded maps. A large notice board dominates one wall, covered with requests for aid. Adventurers gather here to form parties and share tales.',
    x: 100,
    y: 105,
    z: 0,
    scale: 1,
    parentLocation: 'town_square',
    indoor: true,
    lit: true,
    safe: true,
    temperature: 'temperate',
    tags: ['guild', 'quests', 'adventurers'],
    createdBy: 'system'
  });
}

/**
 * Town Gate - Exit to wilderness
 */
function createTownGate() {
  return new Location({
    id: 'town_gate',
    name: 'Town Gate',
    type: 'area',
    description: 'A sturdy wooden gate reinforced with iron bands marks the edge of town. Guards stand watch, keeping an eye on travelers coming and going. Beyond the gate, a dirt road leads into the surrounding wilderness.',
    x: 110,
    y: 100,
    z: 0,
    scale: 5,
    indoor: false,
    lit: true,
    safe: true,
    temperature: 'temperate',
    tags: ['gate', 'border', 'guards'],
    createdBy: 'system'
  });
}

/**
 * Forest Path - Wilderness area with random encounters
 */
function createForestPath() {
  return new Location({
    id: 'forest_path',
    name: 'Forest Path',
    type: 'wilderness',
    description: 'A winding dirt path cuts through dense forest. Tall trees create a canopy overhead, filtering the sunlight into dappled patterns on the ground. The sounds of birds and rustling leaves fill the air. Dangers may lurk among the trees.',
    x: 130,
    y: 100,
    z: 0,
    scale: 20,
    indoor: false,
    lit: true,
    safe: false,
    temperature: 'temperate',
    hazards: ['wild_animals', 'bandits'],
    tags: ['forest', 'wilderness', 'danger'],
    createdBy: 'system'
  });
}

/**
 * Forest Clearing - Safe rest area
 */
function createForestClearing() {
  return new Location({
    id: 'forest_clearing',
    name: 'Forest Clearing',
    type: 'wilderness',
    description: 'A peaceful clearing in the forest where sunlight streams through the break in the canopy. Wildflowers dot the grass, and a small stream babbles nearby. This seems like a safe place to rest and catch your breath.',
    x: 145,
    y: 105,
    z: 0,
    scale: 10,
    parentLocation: 'forest_path',
    indoor: false,
    lit: true,
    safe: true,
    temperature: 'temperate',
    tags: ['forest', 'clearing', 'rest'],
    createdBy: 'system'
  });
}

/**
 * Abandoned Mine - Dungeon entrance
 */
function createAbandonedMine() {
  return new Location({
    id: 'abandoned_mine',
    name: 'Abandoned Mine',
    type: 'area',
    description: 'The entrance to an old mine, long since abandoned by its workers. Rusty mining equipment litters the area, and the wooden support beams look weathered and unstable. A dark opening leads deep into the earth, and an unsettling silence emanates from within.',
    x: 135,
    y: 90,
    z: 0,
    scale: 5,
    indoor: false,
    lit: true,
    safe: false,
    temperature: 'temperate',
    tags: ['mine', 'abandoned', 'dungeon'],
    lore: 'The mine was closed years ago after miners reported strange noises and disappearances.',
    createdBy: 'system'
  });
}

/**
 * Mine Entrance - First level of dungeon
 */
function createMineEntrance() {
  return new Location({
    id: 'mine_entrance',
    name: 'Mine Entrance Hall',
    type: 'dungeon',
    description: 'The entrance chamber of the mine, dimly lit by the daylight filtering in from outside. Old mining carts sit on rusted rails, and pickaxes lean against the walls. The air is cool and damp. Tunnels lead deeper into darkness.',
    x: 135,
    y: 90,
    z: -1, // Below ground
    scale: 10,
    parentLocation: 'abandoned_mine',
    indoor: true,
    lit: false,
    safe: false,
    temperature: 'cold',
    hazards: ['darkness', 'unstable_ground'],
    tags: ['mine', 'dungeon', 'dark'],
    createdBy: 'system'
  });
}

/**
 * Mine Depths - Dangerous dungeon area
 */
function createMineDepths() {
  return new Location({
    id: 'mine_depths',
    name: 'Mine Depths',
    type: 'dungeon',
    description: 'Deep within the mine, where no light reaches. The tunnels here are narrow and claustrophobic, and strange sounds echo from the darkness. Water drips from the ceiling, and the air is thick with an unnatural chill. Something dangerous dwells here.',
    x: 135,
    y: 90,
    z: -2, // Deep below ground
    scale: 15,
    parentLocation: 'mine_entrance',
    indoor: true,
    lit: false,
    safe: false,
    temperature: 'cold',
    hazards: ['darkness', 'monsters', 'unstable_ground', 'poison_gas'],
    tags: ['mine', 'dungeon', 'dangerous', 'dark'],
    createdBy: 'system'
  });
}

/**
 * Connect all locations with exits
 */
function connectLocations(locations) {
  // Town Square connections (central hub)
  const townSquare = locations.get('town_square');
  townSquare.addExit('north', 'guild_hall');
  townSquare.addExit('south', 'market');
  townSquare.addExit('east', 'red_griffin_inn');
  townSquare.addExit('west', 'temple');
  townSquare.addExit('northwest', 'blacksmith');
  townSquare.addExit('gate', 'town_gate');

  // Red Griffin Inn
  const inn = locations.get('red_griffin_inn');
  inn.addExit('outside', 'town_square');
  inn.addExit('west', 'town_square');

  // Blacksmith
  const blacksmith = locations.get('blacksmith');
  blacksmith.addExit('outside', 'town_square');
  blacksmith.addExit('southeast', 'town_square');

  // Market
  const market = locations.get('market');
  market.addExit('north', 'town_square');
  market.addExit('back', 'town_square');

  // Temple
  const temple = locations.get('temple');
  temple.addExit('outside', 'town_square');
  temple.addExit('east', 'town_square');

  // Guild Hall
  const guild = locations.get('guild_hall');
  guild.addExit('outside', 'town_square');
  guild.addExit('south', 'town_square');

  // Town Gate
  const gate = locations.get('town_gate');
  gate.addExit('town', 'town_square');
  gate.addExit('back', 'town_square');
  gate.addExit('forest', 'forest_path');
  gate.addExit('wilderness', 'forest_path');

  // Forest Path
  const forestPath = locations.get('forest_path');
  forestPath.addExit('town', 'town_gate');
  forestPath.addExit('back', 'town_gate');
  forestPath.addExit('deeper', 'forest_clearing');
  forestPath.addExit('clearing', 'forest_clearing');
  forestPath.addExit('mine', 'abandoned_mine');

  // Forest Clearing
  const clearing = locations.get('forest_clearing');
  clearing.addExit('back', 'forest_path');
  clearing.addExit('path', 'forest_path');

  // Abandoned Mine (exterior)
  const mine = locations.get('abandoned_mine');
  mine.addExit('back', 'forest_path');
  mine.addExit('forest', 'forest_path');
  mine.addExit('enter', 'mine_entrance');
  mine.addExit('inside', 'mine_entrance');

  // Mine Entrance
  const mineEntrance = locations.get('mine_entrance');
  mineEntrance.addExit('outside', 'abandoned_mine');
  mineEntrance.addExit('exit', 'abandoned_mine');
  mineEntrance.addExit('deeper', 'mine_depths');
  mineEntrance.addExit('down', 'mine_depths');

  // Mine Depths
  const mineDepths = locations.get('mine_depths');
  mineDepths.addExit('back', 'mine_entrance');
  mineDepths.addExit('up', 'mine_entrance');
}

/**
 * Establish parent-child relationships
 */
function establishHierarchy(locations) {
  const townSquare = locations.get('town_square');
  const forestPath = locations.get('forest_path');
  const abandonedMine = locations.get('abandoned_mine');
  const mineEntrance = locations.get('mine_entrance');

  // Town children
  townSquare.addChildLocation('red_griffin_inn');
  townSquare.addChildLocation('blacksmith');
  townSquare.addChildLocation('market');
  townSquare.addChildLocation('temple');
  townSquare.addChildLocation('guild_hall');

  // Forest children
  forestPath.addChildLocation('forest_clearing');

  // Mine hierarchy
  abandonedMine.addChildLocation('mine_entrance');
  mineEntrance.addChildLocation('mine_depths');
}

/**
 * Get location by ID
 * @param {string} locationId
 * @param {Map} locations - Location map
 * @returns {Location|null}
 */
export function getLocation(locationId, locations) {
  return locations.get(locationId) || null;
}

/**
 * Get starting location ID
 * @returns {string}
 */
export function getStartingLocation() {
  return 'town_square';
}

export default {
  createStarterLocations,
  getLocation,
  getStartingLocation
};
