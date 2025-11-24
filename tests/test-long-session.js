/**
 * Long running test to verify travel and combat systems
 */

import { GameBackendIntegrated } from '../electron/ipc/GameBackendIntegrated.js';

async function runLongTest() {
  console.log('=== Starting Long Session Test ===\n');
  
  const backend = new GameBackendIntegrated();
  
  // Initialize with a seed for reproducibility
  const seed = Date.now();
  console.log(`Using seed: ${seed}`);
  
  const worldConfig = {
    title: 'Test World',
    theme: 'fantasy',
    playerName: 'Adventurer',
    openingNarration: 'A world of adventure awaits...',
    npcs: [
      {
        id: 'npc1',
        name: 'Village Elder',
        role: 'quest_giver',
        personality: { friendliness: 0.8, aggression: 0.1 },
        location: 'village'
      },
      {
        id: 'npc2',
        name: 'Merchant',
        role: 'merchant',
        personality: { friendliness: 0.6, greed: 0.7 },
        location: 'village'
      },
      {
        id: 'npc3',
        name: 'Forest Bandit',
        role: 'enemy',
        personality: { aggression: 0.9, hostility: 0.8 },
        location: 'dark_forest'
      }
    ],
    locations: [
      {
        id: 'village',
        name: 'Peaceful Village',
        description: 'A quiet village where your journey begins',
        type: 'town',
        x: 0,
        y: 0,
        dangerLevel: 'safe' // Changed to safe to avoid combat here
      },
      {
        id: 'dark_forest',
        name: 'Dark Forest',
        description: 'A dangerous forest filled with bandits',
        type: 'wilderness',
        x: 100,
        y: 0,
        dangerLevel: 'high', // Increased from 3 to 'high' for more encounters
        hasEnemies: true
      },
      {
        id: 'ancient_ruins',
        name: 'Ancient Ruins',
        description: 'Mysterious ruins with hidden dangers',
        type: 'dungeon',
        x: 200,
        y: 0,
        dangerLevel: 'deadly', // Increased from 5 to 'deadly' for guaranteed encounters
        hasEnemies: true
      }
    ],
    items: [
      {
        id: 'sword',
        name: 'Iron Sword',
        type: 'weapon',
        rarity: 'common',
        effect: { damage: 10 }
      },
      {
        id: 'potion',
        name: 'Health Potion',
        type: 'consumable',
        rarity: 'common',
        effect: { healing: 50 }
      }
    ],
    quests: {
      main: {
        id: 'main_quest',
        title: 'Clear the Dark Forest',
        description: 'Defeat the bandits in the Dark Forest'
      },
      side: []
    }
  };
  
  await backend.initialize({
    seed,
    playerName: 'Adventurer',
    gameTitle: 'Test Adventure',
    theme: 'fantasy',
    worldConfig
  });
  
  console.log('Game initialized successfully\n');
  
  // Track important events
  let frameCount = 0;
  let travelCount = 0;
  let combatCount = 0;
  let conversationCount = 0;
  let visitedLocations = new Set();
  let currentLocation = null;
  
  // Subscribe to state updates via the backend's own subscription system
  // (This mimics how the UI would receive updates)
  backend.setUICallback((update) => {
    if (!update) return;
    
    const state = update.state;
    if (!state) return;
    
    frameCount++;
    
    // Track protagonist location (corrected path)
    const protagonist = state.characters?.protagonist;
    if (protagonist?.location) {
      const loc = protagonist.location;
      if (loc !== currentLocation) {
        travelCount++; // Count this as a travel
        currentLocation = loc;
        visitedLocations.add(loc);
        console.log(`[Frame ${frameCount}] Protagonist moved to: ${loc}`);
      }
    }
    
    // Log important events
    if (update.type === 'game_event' && update.event) {
      const event = update.event;
      
      if (event.type === 'combat:encounter_started' || event.type === 'combat_started') {
        combatCount++;
        const enemies = event.enemies || (event.details?.enemies) || [];
        console.log(`[Frame ${frameCount}] COMBAT START: vs ${enemies.length > 0 ? enemies.join(', ') : 'unknown'}`);
      }
      
      if (event.type === 'combat:ended' || event.type === 'combat_ended') {
        console.log(`[Frame ${frameCount}] COMBAT END: ${event.outcome || event.details?.result || 'unknown'}`);
        if (event.rounds) {
          console.log(`  Rounds: ${event.rounds}`);
        }
      }
      
      if (event.type === 'conversation_started') {
        conversationCount++;
        console.log(`[Frame ${frameCount}] CONVERSATION: with ${event.details?.npc}`);
      }
      
      if (event.type === 'action_decided') {
        console.log(`[Frame ${frameCount}] Decision: ${event.details?.action} - ${event.details?.reasoning?.substring(0, 80)}...`);
      }
    }
    
    // Print stats every 10 frames
    if (frameCount % 10 === 0) {
      console.log(`\n--- Stats at Frame ${frameCount} ---`);
      console.log(`Current location: ${currentLocation || 'unknown'}`);
      console.log(`Locations visited: ${visitedLocations.size} (${Array.from(visitedLocations).join(', ')})`);
      console.log(`Travels: ${travelCount}`);
      console.log(`Combats: ${combatCount}`);
      console.log(`Conversations: ${conversationCount}`);
      if (protagonist) {
        console.log(`HP: ${protagonist.stats?.health || '?'}/${protagonist.stats?.maxHealth || '?'}`);
        console.log(`Level: ${protagonist.stats?.level || '?'}`);
      }
      console.log('---\n');
    }
  });
  
  console.log('Starting autonomous mode...\n');
  
  try {
    // Start the game
    await backend.startAutonomousMode();
    
    // Run for 100 frames or until we see combat
    const maxFrames = 100;
    const maxTime = 5 * 60 * 1000; // 5 minutes max
    const startTime = Date.now();
    
    while (frameCount < maxFrames && (Date.now() - startTime) < maxTime) {
      // Check if we've achieved our goals
      if (combatCount >= 2 && visitedLocations.size >= 2) {
        console.log('\n✅ SUCCESS: Achieved test goals!');
        console.log(`- Visited ${visitedLocations.size} locations`);
        console.log(`- Entered ${combatCount} combats`);
        console.log(`- Made ${travelCount} travels`);
        break;
      }
      
      // Wait a bit between checks
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Stop the game
    await backend.stopAutonomousMode();
    
    console.log('\n=== Final Results ===');
    console.log(`Total frames: ${frameCount}`);
    console.log(`Locations visited: ${visitedLocations.size} - ${Array.from(visitedLocations).join(', ')}`);
    console.log(`Travels: ${travelCount}`);
    console.log(`Combats: ${combatCount}`);
    console.log(`Conversations: ${conversationCount}`);
    
    // Determine success
    const success = combatCount > 0 && visitedLocations.size > 1;
    
    if (success) {
      console.log('\n✅ TEST PASSED: Protagonist traveled and entered combat');
    } else {
      console.log('\n❌ TEST FAILED:');
      if (visitedLocations.size <= 1) {
        console.log('  - Protagonist did not travel to multiple locations');
      }
      if (combatCount === 0) {
        console.log('  - Protagonist did not enter any combat');
      }
    }
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

runLongTest().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
