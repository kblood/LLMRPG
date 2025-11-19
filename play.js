#!/usr/bin/env node
// Simple playable dialogue demo
import { Character } from './src/entities/Character.js';
import { Personality } from './src/ai/personality/Personality.js';
import { GameSession } from './src/game/GameSession.js';
import { DialogueInterface } from './src/ui/DialogueInterface.js';

// Initialize UI
const ui = new DialogueInterface().initialize();

// Show welcome screen
ui.clear();
ui.displayHeader('OLLAMA RPG - Dialogue Demo');
ui.display('\nA dialogue-first RPG powered by AI\n', { color: 'cyan' });

// Initialize game session
ui.displayInfo('Initializing game session...');
const session = new GameSession({
  seed: 12345,
  model: 'llama3.1:8b',
  temperature: 0.8
});

// Create protagonist
const player = new Character('player', 'Adventurer', {
  role: 'protagonist',
  backstory: 'A traveler seeking adventure and knowledge',
  age: 25
});
session.addCharacter(player);

// Create NPCs
ui.displayInfo('Creating characters...');

const mara = new Character('mara', 'Mara', {
  role: 'npc',
  backstory: 'Inherited the Red Griffin Tavern from her father 10 years ago',
  occupation: 'Tavern Keeper',
  age: 35,
  location: 'tavern',
  personality: Personality.createArchetype('cheerful_tavern_keeper')
});
mara.memory.addMemory('background', 'I know everyone in town and hear all the gossip', {
  importance: 60
});
mara.memory.addMemory('concern', 'Someone has been stealing from my storage recently', {
  importance: 80
});
mara.relationships.setRelationship('player', 50);
session.addCharacter(mara);

const grok = new Character('grok', 'Grok', {
  role: 'npc',
  backstory: 'Been working the forge for 20 years, values his time',
  occupation: 'Blacksmith',
  age: 45,
  location: 'forge',
  personality: Personality.createArchetype('gruff_blacksmith')
});
grok.memory.addMemory('background', 'I make the finest weapons in the region', {
  importance: 50
});
grok.relationships.setRelationship('player', 20);
session.addCharacter(grok);

const elara = new Character('elara', 'Elara', {
  role: 'npc',
  backstory: 'Town healer and herbalist, knows many secrets',
  occupation: 'Healer',
  age: 42,
  location: 'healers_hut',
  personality: new Personality({
    aggression: 15,
    friendliness: 75,
    intelligence: 85,
    caution: 70,
    greed: 20,
    honor: 80
  })
});
elara.memory.addMemory('knowledge', 'I know ancient remedies passed down for generations', {
  importance: 70
});
elara.relationships.setRelationship('player', 40);
session.addCharacter(elara);

ui.displaySuccess(`Created ${session.characters.size} characters`);
ui.display('');

// Main game loop
let running = true;
let currentConversation = null;

async function showMainMenu() {
  ui.displayHeader('Red Griffin Tavern');
  ui.display(`Time: ${session.getGameTimeString()} (${session.getTimeOfDay()})`, { color: 'gray' });
  ui.display('');
  
  ui.display('You are in the warm, bustling tavern. The smell of ale and fresh bread fills the air.', {
    color: 'white'
  });
  ui.display('');
  
  ui.display('People present:', { color: 'yellow' });
  const npcs = session.getCharactersAtLocation();
  npcs.forEach((npc, i) => {
    const relationship = npc.relationships.getRelationshipLevel('player');
    ui.display(`  ${i + 1}. ${npc.name} (${npc.occupation}) - ${relationship}`, {
      color: 'white'
    });
  });
  ui.display('');
  
  ui.displayMenu([
    { key: '1-' + npcs.length, text: 'Talk to someone' },
    { key: 's', text: 'Show stats' },
    { key: 'q', text: 'Show quests' },
    { key: 'x', text: 'Quit' }
  ]);
  
  const choice = await ui.prompt();
  
  if (choice === 'x') {
    running = false;
    return;
  }
  
  if (choice === 's') {
    await showStats();
    return;
  }
  
  if (choice === 'q') {
    await showQuests();
    return;
  }
  
  const npcIndex = parseInt(choice) - 1;
  if (npcIndex >= 0 && npcIndex < npcs.length) {
    await startDialogue(npcs[npcIndex]);
  } else {
    ui.displayError('Invalid choice');
    await ui.pause();
  }
}

async function startDialogue(npc) {
  ui.clear();
  ui.displayCharacterInfo(npc);
  ui.display('');
  
  ui.displayLoading('Starting conversation...');
  
  try {
    currentConversation = await session.startConversation(npc.id, {
      situation: `${player.name} approaches ${npc.name} in the ${session.currentLocation || 'tavern'}`,
      generateGreeting: true
    });
    
    ui.clearLoading();
    
    const conversation = session.dialogueSystem.getConversation(currentConversation);
    const greeting = conversation.history[0];
    
    ui.displayDialogue(npc.name, greeting.output);
    ui.display('');
    
    await handleDialogue(npc);
    
  } catch (error) {
    ui.clearLoading();
    ui.displayError(`Error: ${error.message}`);
    await ui.pause();
  }
}

async function handleDialogue(npc) {
  let inConversation = true;
  
  while (inConversation) {
    ui.displayMenu([
      { key: '1', text: 'Say something' },
      { key: '2', text: 'Ask a question' },
      { key: '3', text: 'Say goodbye' }
    ]);
    
    const choice = await ui.prompt();
    
    if (choice === '3') {
      ui.display('');
      ui.displayDialogue(player.name, 'I should be going. Goodbye!', { isPlayer: true });
      
      ui.displayLoading(`${npc.name} is responding...`);
      const farewell = await session.addConversationTurn(
        currentConversation,
        npc.id,
        'I should be going. Goodbye!'
      );
      ui.clearLoading();
      
      ui.displayDialogue(npc.name, farewell.text);
      ui.display('');
      
      session.endConversation(currentConversation);
      currentConversation = null;
      inConversation = false;
      
      await ui.pause();
      return;
    }
    
    if (choice === '1' || choice === '2') {
      const promptText = choice === '1' ? 'What do you say' : 'What do you ask';
      ui.display('');
      ui.display(`${promptText}?`, { color: 'cyan' });
      const input = await ui.promptDialogue(npc.name);
      
      if (!input) {
        ui.displayError('Please type something');
        continue;
      }
      
      ui.display('');
      ui.displayDialogue(player.name, input, { isPlayer: true });
      
      ui.displayLoading(`${npc.name} is thinking...`);
      const response = await session.addConversationTurn(
        currentConversation,
        npc.id,
        input
      );
      ui.clearLoading();
      
      ui.displayDialogue(npc.name, response.text);
      ui.display('');
      
      const activeQuests = session.getActiveQuests();
      if (activeQuests.length > 0) {
        const lastQuest = activeQuests[activeQuests.length - 1];
        if (lastQuest.frameCreated === session.frame) {
          ui.displayQuestNotification(lastQuest, 'new');
        }
      }
    }
  }
}

async function showStats() {
  ui.clear();
  ui.displayHeader('Game Statistics');
  
  const stats = session.getStats();
  
  ui.display(`Session ID: ${stats.sessionId.substring(0, 20)}...`, { color: 'gray' });
  ui.display(`Seed: ${stats.seed}`, { color: 'gray' });
  ui.display(`Frame: ${stats.frame}`, { color: 'white' });
  ui.display(`Game Time: ${stats.gameTime} (${stats.timeOfDay})`, { color: 'white' });
  ui.display(`Characters: ${stats.characterCount} (${stats.npcCount} NPCs)`, { color: 'white' });
  ui.display(`Real Time Played: ${stats.realTimePlayed}s`, { color: 'white' });
  ui.display('');
  ui.display(`Active Conversations: ${stats.activeConversations}`, { color: 'cyan' });
  ui.display(`Total Conversations: ${stats.totalConversationsInHistory}`, { color: 'cyan' });
  ui.display('');
  ui.display(`Active Quests: ${stats.active || 0}`, { color: 'yellow' });
  ui.display(`Completed Quests: ${stats.completed || 0}`, { color: 'green' });
  ui.display('');
  
  const ollamaStats = session.dialogueSystem.dialogueGenerator.ollama.getStats();
  ui.display('LLM Statistics:', { color: 'yellow' });
  ui.display(`  Total Calls: ${ollamaStats.totalCalls}`, { color: 'white' });
  ui.display(`  Total Tokens: ${ollamaStats.totalTokens}`, { color: 'white' });
  ui.display(`  Cache Hits: ${ollamaStats.cacheHits}`, { color: 'white' });
  ui.display(`  Errors: ${ollamaStats.errors}`, { color: 'white' });
  ui.display('');
  
  await ui.pause();
}

async function showQuests() {
  ui.clear();
  const quests = session.questManager.getQuestsForDisplay();
  ui.displayQuestLog(quests);
  await ui.pause();
}

// Main loop
async function main() {
  await ui.pause();
  
  session.currentLocation = 'tavern';
  
  while (running) {
    ui.clear();
    await showMainMenu();
  }
  
  ui.clear();
  ui.displayHeader('Thanks for Playing!');
  
  const finalStats = session.getStats();
  ui.display(`You had ${finalStats.totalConversationsInHistory} conversations`, { color: 'cyan' });
  ui.display(`Generated ${session.dialogueSystem.dialogueGenerator.ollama.getStats().totalTokens} tokens`, {
    color: 'cyan'
  });
  ui.display('');
  
  ui.close();
  process.exit(0);
}

// Start game
main().catch(error => {
  ui.displayError(`Fatal error: ${error.message}`);
  console.error(error);
  ui.close();
  process.exit(1);
});
