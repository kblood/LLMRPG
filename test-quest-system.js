#!/usr/bin/env node
// Test quest system with LLM
import { Character } from './src/entities/Character.js';
import { Personality } from './src/ai/personality/Personality.js';
import { GameSession } from './src/game/GameSession.js';

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  QUEST SYSTEM TEST');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('Testing quest detection and generation...\n');

// Initialize game session
const session = new GameSession({
  seed: 54321,
  model: 'llama3.1:8b',
  temperature: 0.8
});

// Create protagonist
const player = new Character('player', 'Hero', {
  role: 'protagonist',
  backstory: 'An adventurer looking for work',
  age: 25
});
session.addCharacter(player);

// Create NPC with a problem
const mara = new Character('mara', 'Mara', {
  role: 'npc',
  backstory: 'Tavern keeper dealing with mysterious thefts',
  occupation: 'Tavern Keeper',
  age: 35,
  personality: Personality.createArchetype('cheerful_tavern_keeper')
});
mara.memory.addMemory('concern', 'Someone has been stealing from my tavern storage for weeks', {
  importance: 90
});
mara.memory.addMemory('concern', 'I lost valuable ale and food supplies', {
  importance: 85
});
mara.relationships.setRelationship('player', 30);
session.addCharacter(mara);

async function runTest() {
  try {
    console.log('1. Starting conversation...');
    const conversationId = await session.startConversation(mara.id, {
      situation: 'Player enters the tavern',
      generateGreeting: true
    });
    
    const conv = session.dialogueSystem.getConversation(conversationId);
    console.log(`   Mara: "${conv.history[0].output}"\n`);
    
    // Player asks about problems
    console.log('2. Player: "You look worried. Is something wrong?"');
    const response1 = await session.addConversationTurn(
      conversationId,
      mara.id,
      "You look worried. Is something wrong?"
    );
    console.log(`   Mara: "${response1.text}"\n`);
    
    // Check if quest was created
    const quests = session.getActiveQuests();
    if (quests.length > 0) {
      console.log('✓ Quest detected and created!\n');
      const quest = quests[0];
      
      console.log('═══════════════════════════════════════════════════════════');
      console.log('  QUEST DETAILS');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`Title: ${quest.title}`);
      console.log(`Description: ${quest.description}`);
      console.log(`Giver: ${quest.giver} (${mara.name})`);
      console.log(`\nObjectives:`);
      quest.objectives.forEach((obj, i) => {
        console.log(`  ${i + 1}. ${obj.description}`);
        console.log(`     Type: ${obj.type}, Target: ${obj.target}`);
      });
      console.log(`\nRewards:`);
      console.log(`  Relationship: +${quest.rewards.relationship}`);
      console.log(`  Description: ${quest.rewards.description || 'N/A'}`);
      console.log('═══════════════════════════════════════════════════════════\n');
      
    } else {
      console.log('⚠ No quest detected (might need more explicit request)\n');
      
      // Try more direct request
      console.log('3. Player: "How can I help you with that?"');
      const response2 = await session.addConversationTurn(
        conversationId,
        mara.id,
        "How can I help you with that?"
      );
      console.log(`   Mara: "${response2.text}"\n`);
      
      const quests2 = session.getActiveQuests();
      if (quests2.length > 0) {
        console.log('✓ Quest created after explicit offer!\n');
        const quest = quests2[0];
        console.log(`Quest: "${quest.title}"`);
        console.log(`Objectives: ${quest.objectives.length}`);
      }
    }
    
    // Show statistics
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  TEST RESULTS');
    console.log('═══════════════════════════════════════════════════════════');
    
    const stats = session.getStats();
    console.log(`Active Quests: ${stats.active}`);
    console.log(`Completed Quests: ${stats.completed}`);
    console.log(`Total Conversations: ${stats.totalConversationsInHistory}`);
    
    const ollamaStats = session.dialogueSystem.dialogueGenerator.ollama.getStats();
    console.log(`\nLLM Calls: ${ollamaStats.totalCalls}`);
    console.log(`Tokens Generated: ${ollamaStats.totalTokens}`);
    
    console.log('\n✓ Quest system test complete!');
    
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    console.error(error.stack);
  }
}

runTest();
