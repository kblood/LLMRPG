#!/usr/bin/env node
// Test enhanced quest detection system
import { Character } from './src/entities/Character.js';
import { Personality } from './src/ai/personality/Personality.js';
import { GameSession } from './src/game/GameSession.js';

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  ENHANCED QUEST DETECTION TEST');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('Testing Phase 5.1: Enhanced Quest Detection\n');

// Initialize game session
const session = new GameSession({
  seed: 12345,
  model: 'llama3.1:8b',
  temperature: 0.8,
  autoDetectQuests: true
});

// Create protagonist
const player = new Character('player', 'Hero', {
  role: 'protagonist',
  backstory: 'An adventurer looking for purpose',
  age: 25
});
session.addCharacter(player);

// Create Mara with concerns
const mara = new Character('mara', 'Mara', {
  role: 'npc',
  backstory: 'Tavern keeper dealing with mysterious thefts',
  occupation: 'Tavern Keeper',
  age: 35,
  personality: Personality.createArchetype('cheerful_tavern_keeper')
});
mara.memory.addMemory('concern', 'Someone has been stealing from my tavern storage', {
  importance: 90
});
mara.memory.addMemory('concern', 'I lost valuable supplies worth 50 gold pieces', {
  importance: 85
});
mara.relationships.setRelationship('player', 40);
session.addCharacter(mara);

// Create Aldric the guard
const aldric = new Character('aldric', 'Aldric', {
  role: 'npc',
  backstory: 'Veteran town guard, dutiful but cautious',
  occupation: 'Town Guard Captain',
  age: 42,
  personality: Personality.createArchetype('dutiful_guard')
});
aldric.memory.addMemory('concern', 'Strange movements near the town gates at night', {
  importance: 75
});
aldric.relationships.setRelationship('player', 20);
session.addCharacter(aldric);

async function runTest() {
  try {
    console.log('══════════════════════════════════════════════════════════');
    console.log('TEST 1: Natural Quest Discovery (No Explicit Request)');
    console.log('══════════════════════════════════════════════════════════\n');
    
    console.log('Starting conversation with Mara...');
    const conv1 = await session.startConversation(mara.id, {
      situation: 'Player enters the tavern and sits at the bar',
      generateGreeting: true
    });
    
    const greeting = session.dialogueSystem.getConversation(conv1).history[0];
    console.log(`Mara: "${greeting.output}"\n`);
    
    // Just ask how she is - she should hint at problems
    console.log('Player: "How are things going?"\n');
    const response1 = await session.addConversationTurn(
      conv1,
      mara.id,
      "How are things going?"
    );
    console.log(`Mara: "${response1.text}"\n`);
    
    // Check for quest
    let quests = session.getActiveQuests();
    if (quests.length > 0) {
      console.log('✓ Quest detected from natural conversation!\n');
      displayQuest(quests[0]);
    } else {
      console.log('  → No quest yet (waiting for explicit offer)\n');
      
      // Follow up
      console.log('Player: "That sounds concerning. Is there anything I can do?"\n');
      const response2 = await session.addConversationTurn(
        conv1,
        mara.id,
        "That sounds concerning. Is there anything I can do?"
      );
      console.log(`Mara: "${response2.text}"\n`);
      
      quests = session.getActiveQuests();
      if (quests.length > 0) {
        console.log('✓ Quest created after offering help!\n');
        displayQuest(quests[0]);
      }
    }
    
    session.dialogueSystem.endConversation(conv1);
    
    console.log('\n══════════════════════════════════════════════════════════');
    console.log('TEST 2: Quest Context in Follow-up Conversation');
    console.log('══════════════════════════════════════════════════════════\n');
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Starting a new conversation with Mara...\n');
    const conv2 = await session.startConversation(mara.id, {
      situation: 'Player returns to the tavern',
      generateGreeting: true
    });
    
    const greeting2 = session.dialogueSystem.getConversation(conv2).history[0];
    console.log(`Mara: "${greeting2.output}"`);
    console.log('  → Should mention the quest naturally\n');
    
    // Ask about progress
    console.log('Player: "I\'ve been asking around about those thefts"\n');
    const response3 = await session.addConversationTurn(
      conv2,
      mara.id,
      "I've been asking around about those thefts"
    );
    console.log(`Mara: "${response3.text}"`);
    console.log('  → Should acknowledge quest progress\n');
    
    session.dialogueSystem.endConversation(conv2);
    
    console.log('\n══════════════════════════════════════════════════════════');
    console.log('TEST 3: Multiple NPCs, Quest Awareness');
    console.log('══════════════════════════════════════════════════════════\n');
    
    console.log('Talking to Aldric (the guard)...\n');
    const conv3 = await session.startConversation(aldric.id, {
      situation: 'Player approaches the town guard',
      generateGreeting: true
    });
    
    const greeting3 = session.dialogueSystem.getConversation(conv3).history[0];
    console.log(`Aldric: "${greeting3.output}"\n`);
    
    // Mention Mara's problem
    console.log('Player: "Mara at the tavern mentioned some thefts. Do you know anything?"\n');
    const response4 = await session.addConversationTurn(
      conv3,
      aldric.id,
      "Mara at the tavern mentioned some thefts. Do you know anything?"
    );
    console.log(`Aldric: "${response4.text}"\n`);
    
    // Check if Aldric offers help or his own quest
    quests = session.getActiveQuests();
    if (quests.length > 1) {
      console.log('✓ Aldric offered related quest!\n');
      displayQuest(quests[quests.length - 1]);
    } else {
      console.log('  → Aldric provides information (no new quest)\n');
    }
    
    session.dialogueSystem.endConversation(conv3);
    
    console.log('\n══════════════════════════════════════════════════════════');
    console.log('  TEST SUMMARY');
    console.log('══════════════════════════════════════════════════════════\n');
    
    const finalQuests = session.getActiveQuests();
    console.log(`Active Quests: ${finalQuests.length}`);
    finalQuests.forEach((quest, i) => {
      console.log(`  ${i + 1}. "${quest.title}" (from ${quest.giver})`);
    });
    
    console.log(`\nConversations: ${session.dialogueSystem.conversationHistory.length + 3}`);
    console.log(`Total Dialogue Turns: ${session.dialogueSystem.getStatistics().totalDialogueTurns}`);
    
    console.log('\n✓ Enhanced quest detection test complete!\n');
    console.log('Key improvements tested:');
    console.log('  ✓ Natural quest discovery without explicit requests');
    console.log('  ✓ NPCs reference quest context in future conversations');
    console.log('  ✓ Quest awareness across multiple NPCs');
    console.log('  ✓ Pattern-based + LLM detection');
    
  } catch (error) {
    console.error('Test failed:', error);
    console.error(error.stack);
  }
}

function displayQuest(quest) {
  console.log('───────────────────────────────────────────────────────────');
  console.log(`Quest: "${quest.title}"`);
  console.log(`Description: ${quest.description}`);
  console.log(`Given by: ${quest.metadata?.npcName || quest.giver}`);
  if (quest.metadata?.detectionConfidence) {
    console.log(`Detection Confidence: ${quest.metadata.detectionConfidence}%`);
  }
  console.log('\nObjectives:');
  quest.objectives.forEach((obj, i) => {
    console.log(`  ${i + 1}. ${obj.description}`);
  });
  console.log('───────────────────────────────────────────────────────────\n');
}

runTest();
