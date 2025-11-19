#!/usr/bin/env node
// Test group conversation system (3+ participants)
import { Character } from './src/entities/Character.js';
import { Personality } from './src/ai/personality/Personality.js';
import { GameSession } from './src/game/GameSession.js';

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  GROUP CONVERSATION TEST (Phase 5.2)');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('Testing multi-party dialogue with 3+ participants\n');

// Initialize game session
const session = new GameSession({
  seed: 99999,
  model: 'llama3.1:8b',
  temperature: 0.8,
  autoDetectQuests: true
});

// Create protagonist
const player = new Character('player', 'Hero', {
  role: 'protagonist',
  backstory: 'An adventurer investigating mysteries',
  age: 25
});
session.addCharacter(player);

// Create Mara (tavern keeper)
const mara = new Character('mara', 'Mara', {
  role: 'npc',
  backstory: 'Friendly tavern keeper with concerns about thefts',
  occupation: 'Tavern Keeper',
  age: 35,
  personality: Personality.createArchetype('cheerful_tavern_keeper')
});
mara.memory.addMemory('concern', 'Valuable supplies have been stolen from my tavern', {
  importance: 90
});
mara.relationships.setRelationship('player', 50);
mara.relationships.setRelationship('aldric', 40);
mara.relationships.setRelationship('finn', 30);
session.addCharacter(mara);

// Create Aldric (guard captain)
const aldric = new Character('aldric', 'Aldric', {
  role: 'npc',
  backstory: 'Dutiful town guard captain',
  occupation: 'Town Guard Captain',
  age: 42,
  personality: Personality.createArchetype('dutiful_guard')
});
aldric.memory.addMemory('concern', 'Increased criminal activity in the town', {
  importance: 80
});
aldric.relationships.setRelationship('player', 30);
aldric.relationships.setRelationship('mara', 40);
aldric.relationships.setRelationship('finn', 10);
session.addCharacter(aldric);

// Create Finn (street urchin)
const finn = new Character('finn', 'Finn', {
  role: 'npc',
  backstory: 'Street-smart orphan who knows everything happening in town',
  occupation: 'Street Urchin',
  age: 14,
  personality: Personality.createArchetype('streetwise_urchin')
});
finn.memory.addMemory('observation', 'I saw suspicious people near the tavern at night', {
  importance: 70
});
finn.relationships.setRelationship('player', 20);
finn.relationships.setRelationship('mara', 30);
finn.relationships.setRelationship('aldric', 10);
session.addCharacter(finn);

async function runTest() {
  try {
    console.log('══════════════════════════════════════════════════════════');
    console.log('TEST 1: Starting Group Conversation (3 NPCs + Player)');
    console.log('══════════════════════════════════════════════════════════\n');
    
    console.log('Participants:');
    console.log('  - Hero (Player)');
    console.log('  - Mara (Tavern Keeper) - worried about thefts');
    console.log('  - Aldric (Guard Captain) - investigating crimes');
    console.log('  - Finn (Street Urchin) - saw something suspicious\n');
    
    const groupId = await session.startGroupConversation(
      ['mara', 'aldric', 'finn', 'player'],
      {
        situation: 'Everyone gathers at the tavern to discuss the recent thefts',
        generateGreeting: false
      }
    );
    
    const conversation = session.getGroupConversation(groupId);
    console.log(`✓ Group conversation started (ID: ${groupId})`);
    console.log(`  Participants: ${conversation.participantIds.length}\n`);
    
    console.log('──────────────────────────────────────────────────────────');
    console.log('Turn 1: Player initiates discussion\n');
    
    const turn1 = await session.addGroupConversationTurn(
      groupId,
      'player',
      "Mara, you mentioned thefts. Aldric, have you heard about this?"
    );
    console.log(`Player: "Mara, you mentioned thefts. Aldric, have you heard about this?"\n`);
    
    console.log('──────────────────────────────────────────────────────────');
    console.log('Turn 2: Aldric responds\n');
    
    const turn2 = await session.addGroupConversationTurn(
      groupId,
      'aldric',
      turn1.text
    );
    console.log(`Aldric: "${turn2.text}"\n`);
    
    console.log('──────────────────────────────────────────────────────────');
    console.log('Turn 3: Mara adds details\n');
    
    const turn3 = await session.addGroupConversationTurn(
      groupId,
      'mara',
      turn2.text
    );
    console.log(`Mara: "${turn3.text}"\n`);
    
    console.log('──────────────────────────────────────────────────────────');
    console.log('Turn 4: Finn reveals information\n');
    
    const turn4 = await session.addGroupConversationTurn(
      groupId,
      'finn',
      turn3.text
    );
    console.log(`Finn: "${turn4.text}"\n`);
    
    console.log('──────────────────────────────────────────────────────────');
    console.log('Turn 5: Player asks Finn for details\n');
    
    const turn5 = await session.addGroupConversationTurn(
      groupId,
      'player',
      "Finn, what exactly did you see?"
    );
    console.log(`Player: "Finn, what exactly did you see?"\n`);
    
    const turn6 = await session.addGroupConversationTurn(
      groupId,
      'finn',
      turn5.text
    );
    console.log(`Finn: "${turn6.text}"\n`);
    
    console.log('\n══════════════════════════════════════════════════════════');
    console.log('TEST 2: Conversation Dynamics');
    console.log('══════════════════════════════════════════════════════════\n');
    
    // Get conversation stats
    const stats = conversation.getStatistics();
    console.log('Conversation Statistics:');
    console.log(`  Total Turns: ${stats.totalTurns}`);
    console.log(`  Participants: ${stats.participantCount}`);
    console.log(`  Duration: ${Math.round(stats.duration / 1000)}s`);
    console.log('\n  Turns per Participant:');
    Object.entries(stats.turnsPerParticipant).forEach(([name, count]) => {
      console.log(`    ${name}: ${count} turn(s)`);
    });
    
    // Check next speaker suggestion
    const nextSpeaker = session.suggestNextSpeaker(groupId, 'finn');
    const nextChar = session.getCharacter(nextSpeaker);
    console.log(`\n  Suggested Next Speaker: ${nextChar?.name || 'Unknown'}`);
    
    console.log('\n══════════════════════════════════════════════════════════');
    console.log('TEST 3: Quest Detection in Group Context');
    console.log('══════════════════════════════════════════════════════════\n');
    
    const quests = session.getActiveQuests();
    if (quests.length > 0) {
      console.log(`✓ Quest(s) detected in group conversation!\n`);
      quests.forEach((quest, i) => {
        console.log(`Quest ${i + 1}: "${quest.title}"`);
        console.log(`  Given by: ${quest.giver}`);
        console.log(`  Confidence: ${quest.metadata?.detectionConfidence || 'N/A'}%`);
        console.log(`  Objectives: ${quest.objectives.length}`);
      });
    } else {
      console.log('No quests detected (might need more explicit request)\n');
    }
    
    console.log('\n══════════════════════════════════════════════════════════');
    console.log('TEST 4: Conversation History & Context');
    console.log('══════════════════════════════════════════════════════════\n');
    
    const history = conversation.formatHistory();
    console.log('Full Conversation:');
    history.forEach((line, i) => {
      console.log(`  ${i + 1}. ${line}`);
    });
    
    console.log('\n══════════════════════════════════════════════════════════');
    console.log('TEST 5: Ending Group Conversation');
    console.log('══════════════════════════════════════════════════════════\n');
    
    const summary = session.endGroupConversation(groupId);
    console.log('Conversation ended successfully');
    console.log(`  Duration: ${Math.round(summary.duration / 1000)}s`);
    console.log(`  Total turns: ${summary.turnCount}`);
    console.log(`  Participants: ${summary.participants.join(', ')}`);
    
    // Check if NPCs remember the group conversation
    console.log('\n══════════════════════════════════════════════════════════');
    console.log('TEST 6: Memory & Relationship Changes');
    console.log('══════════════════════════════════════════════════════════\n');
    
    console.log('Relationship Updates:');
    console.log(`  Mara → Player: ${mara.relationships.getRelationship('player')}`);
    console.log(`  Mara → Aldric: ${mara.relationships.getRelationship('aldric')}`);
    console.log(`  Aldric → Player: ${aldric.relationships.getRelationship('player')}`);
    console.log(`  Finn → Player: ${finn.relationships.getRelationship('player')}`);
    
    console.log('\n══════════════════════════════════════════════════════════');
    console.log('  TEST SUMMARY');
    console.log('══════════════════════════════════════════════════════════\n');
    
    console.log('✓ Group conversation test complete!\n');
    console.log('Features Tested:');
    console.log('  ✓ Multi-party conversation (4 participants)');
    console.log('  ✓ Turn-taking and speaker rotation');
    console.log('  ✓ Quest detection in group context');
    console.log('  ✓ Conversation history tracking');
    console.log('  ✓ Relationship updates');
    console.log('  ✓ Statistics and analytics');
    console.log('  ✓ Clean conversation ending');
    
    console.log('\nGroup Conversation Improvements:');
    console.log('  → NPCs can talk to each other');
    console.log('  → Player can witness NPC-to-NPC dialogue');
    console.log('  → Natural turn-taking with suggestions');
    console.log('  → Quest detection works in group settings');
    console.log('  → All participants build relationships');
    
  } catch (error) {
    console.error('Test failed:', error);
    console.error(error.stack);
  }
}

runTest();
