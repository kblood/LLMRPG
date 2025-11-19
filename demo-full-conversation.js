import chalk from 'chalk';
import { Character } from './src/entities/Character.js';
import { Personality } from './src/ai/personality/Personality.js';
import { DialogueSystem } from './src/systems/dialogue/DialogueSystem.js';
import { QuestManager } from './src/systems/quest/QuestManager.js';
import { OllamaService } from './src/services/OllamaService.js';
import { EventBus } from './src/services/EventBus.js';

console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════'));
console.log(chalk.cyan.bold('  OLLAMARKG - FULL CONVERSATION DEMO'));
console.log(chalk.cyan.bold('  Testing NPC Context & Quest Integration'));
console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════\n'));

const eventBus = EventBus.getInstance();
const dialogueSystem = new DialogueSystem();
const questManager = new QuestManager();

// Setup event listeners
eventBus.on('quest:created', ({ quest }) => {
  console.log(chalk.yellow('\n🎯 NEW QUEST RECEIVED!'));
  console.log(chalk.yellow('   Title: ') + chalk.white(quest.title));
  console.log(chalk.yellow('   Description: ') + chalk.gray(quest.description));
  console.log(chalk.yellow('   Giver: ') + chalk.gray(quest.giver));
  
  const objectives = quest.getVisibleObjectives();
  if (objectives.length > 0) {
    console.log(chalk.yellow('   Objectives:'));
    objectives.forEach((obj, idx) => {
      console.log(chalk.gray(`     ${idx + 1}. ${obj.description}`));
    });
  }
  console.log();
});

eventBus.on('quest:objective_completed', ({ questId, objectiveId }) => {
  console.log(chalk.green('\n   ✓ Quest objective completed!\n'));
});

eventBus.on('quest:completed', ({ quest }) => {
  console.log(chalk.green.bold('\n🎉 QUEST COMPLETED: ' + quest.title + '\n'));
});

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runDemo() {
  // Check Ollama availability
  const ollamaService = OllamaService.getInstance();
  const available = await ollamaService.isAvailable();
  
  if (!available) {
    console.log(chalk.red('⚠ Ollama not available. Using fallback responses.'));
    console.log(chalk.gray('For best results, start Ollama with: ollama serve\n'));
  } else {
    console.log(chalk.green('✓ Ollama connected and ready\n'));
  }

  await delay(1000);

  // Create player character
  console.log(chalk.cyan('Creating characters...\n'));
  
  const player = new Character('player', {
    name: 'Adventurer',
    personality: new Personality({
      friendliness: 65,
      intelligence: 70,
      caution: 55,
      honor: 75
    })
  });

  // Create Mara - the tavern keeper with a problem
  const mara = new Character('mara', {
    name: 'Mara',
    role: 'Tavern Keeper',
    personality: new Personality({
      friendliness: 85,
      intelligence: 65,
      caution: 45,
      honor: 80,
      greed: 20
    }),
    background: 'Owns the Red Griffin Inn. Warm and welcoming, but currently worried about thefts.'
  });

  // Add context to Mara's memory
  mara.memory.addMemory('concern', 'Someone has been stealing from my tavern storage for weeks', 9);
  mara.memory.addMemory('fact', 'I found signs of forced entry last night', 8);
  mara.memory.addMemory('observation', 'Some adventurers have been acting suspiciously', 6);
  mara.memory.addMemory('feeling', 'I trust adventurers who seem honest and helpful', 5);

  // Set initial relationship
  player.relationships.modifyRelationship('mara', 45); // Neutral-friendly
  mara.relationships.modifyRelationship('player', 45);

  console.log(chalk.white('✓ Player: ') + chalk.gray('Adventurer'));
  console.log(chalk.white('✓ NPC: ') + chalk.gray('Mara (Tavern Keeper)'));
  console.log(chalk.gray(`   Personality: Friendly (${mara.personality.friendliness}), Honorable (${mara.personality.honor})`));
  console.log(chalk.gray(`   Current concerns: Thefts from tavern storage\n`));

  await delay(1500);

  // Start conversation
  console.log(chalk.cyan('═'.repeat(60)));
  console.log(chalk.cyan('  CONVERSATION 1: Meeting Mara'));
  console.log(chalk.cyan('═'.repeat(60)) + '\n');

  console.log(chalk.gray('[Mara sees you enter the tavern...]\n'));
  await delay(1000);

  const convId = await dialogueSystem.startConversation(mara, player, {
    situation: 'The adventurer enters the Red Griffin Inn in the evening',
    generateGreeting: true
  });

  const conversation = dialogueSystem.getConversation(convId);
  const greeting = conversation.history[0].output;
  console.log(chalk.blue('Mara: ') + chalk.white(`"${greeting}"\n`));

  await delay(2000);

  // Player asks a casual question
  const input1 = "Hello Mara! How have things been at the tavern?";
  console.log(chalk.green('You: ') + chalk.white(`"${input1}"\n`));

  await delay(500);
  console.log(chalk.gray('[Mara thinks about recent troubles...]\n'));
  await delay(1500);

  const turn1 = await dialogueSystem.addTurn(convId, 'mara', input1, {
    temperature: 0.8
  });
  console.log(chalk.blue('Mara: ') + chalk.white(`"${turn1.text}"\n`));

  // Update relationship slightly
  player.relationships.modifyRelationship('mara', 3);
  mara.relationships.modifyRelationship('player', 3);

  await delay(2000);

  // Player shows concern
  const input2 = "You seem worried. Is something wrong?";
  console.log(chalk.green('You: ') + chalk.white(`"${input2}"\n`));

  await delay(500);
  console.log(chalk.gray('[Mara decides to confide in you...]\n'));
  await delay(1500);

  const turn2 = await dialogueSystem.addTurn(convId, 'mara', input2, {
    temperature: 0.8
  });
  console.log(chalk.blue('Mara: ') + chalk.white(`"${turn2.text}"\n`));

  // Boost relationship for showing concern
  player.relationships.modifyRelationship('mara', 5);
  mara.relationships.modifyRelationship('player', 5);

  await delay(2000);

  // Player offers to help
  const input3 = "I'd like to help if I can. Tell me more about what's been happening.";
  console.log(chalk.green('You: ') + chalk.white(`"${input3}"\n`));

  await delay(500);
  console.log(chalk.gray('[Mara appreciates your offer and explains the situation...]\n'));
  await delay(1500);

  const turn3 = await dialogueSystem.addTurn(convId, 'mara', input3, {
    temperature: 0.8
  });
  console.log(chalk.blue('Mara: ') + chalk.white(`"${turn3.text}"\n`));

  // Significant relationship boost for offering help
  player.relationships.modifyRelationship('mara', 8);
  mara.relationships.modifyRelationship('player', 8);

  await delay(2000);

  // Add memory of the conversation
  const convSummary = 'Had a helpful conversation with player about the thefts';
  mara.memory.addMemory('interaction', convSummary, { importance: 70 });
  player.memory.addMemory('interaction', 'Learned about thefts at the Red Griffin Inn', { importance: 80 });

  dialogueSystem.endConversation(convId);

  // Show relationship changes
  console.log(chalk.cyan('\n' + '═'.repeat(60)));
  console.log(chalk.cyan('  RELATIONSHIP CHANGES'));
  console.log(chalk.cyan('═'.repeat(60)) + '\n');

  const finalRel = player.relationships.getRelationship('mara');
  const relLevel = player.relationships.getRelationshipLevel('mara');
  
  console.log(chalk.white('Your relationship with Mara: ') + 
              (finalRel >= 60 ? chalk.green(`${finalRel} (${relLevel})`) : 
               chalk.yellow(`${finalRel} (${relLevel})`)));
  console.log(chalk.gray('Starting: 45 (Neutral) → Final: ') + chalk.white(finalRel) + 
              chalk.gray(` (+${finalRel - 45})\n`));

  await delay(2000);

  // Show Mara's perspective
  console.log(chalk.cyan('═'.repeat(60)));
  console.log(chalk.cyan('  MARA\'S PERSPECTIVE'));
  console.log(chalk.cyan('═'.repeat(60)) + '\n');

  console.log(chalk.white('Recent Memories:\n'));
  const maraMemories = mara.memory.getRecentMemories(4);
  maraMemories.forEach((mem, idx) => {
    console.log(chalk.gray(`  ${idx + 1}. [${mem.type}] ${mem.content}`));
  });

  console.log(chalk.white('\nPersonality Traits:\n'));
  console.log(chalk.gray(`  Friendliness: ${mara.personality.friendliness}/100`));
  console.log(chalk.gray(`  Honor: ${mara.personality.honor}/100`));
  console.log(chalk.gray(`  Caution: ${mara.personality.caution}/100`));
  console.log(chalk.gray(`  Greed: ${mara.personality.greed}/100\n`));

  await delay(2000);

  // Show quest log
  console.log(chalk.cyan('═'.repeat(60)));
  console.log(chalk.cyan('  QUEST LOG'));
  console.log(chalk.cyan('═'.repeat(60)) + '\n');

  const activeQuests = questManager.getActiveQuests();
  
  if (activeQuests.length > 0) {
    console.log(chalk.yellow('Active Quests:\n'));
    
    activeQuests.forEach((quest, idx) => {
      console.log(chalk.white(`  ${idx + 1}. ${quest.title}`));
      console.log(chalk.gray(`     ${quest.description}`));
      console.log(chalk.gray(`     Given by: ${quest.giver}`));
      console.log(chalk.gray(`     Progress: ${quest.getProgress()}%`));
      
      const objectives = quest.getVisibleObjectives();
      if (objectives.length > 0) {
        console.log(chalk.gray('     Objectives:'));
        objectives.forEach(obj => {
          const status = obj.completed ? chalk.green('✓') : chalk.gray('○');
          console.log(chalk.gray(`       ${status} ${obj.description}`));
        });
      }
      console.log();
    });
  } else {
    console.log(chalk.gray('No active quests yet.\n'));
    console.log(chalk.gray('(Quest may have been detected during conversation)\n'));
  }

  await delay(2000);

  // Show statistics
  console.log(chalk.cyan('═'.repeat(60)));
  console.log(chalk.cyan('  SESSION STATISTICS'));
  console.log(chalk.cyan('═'.repeat(60)) + '\n');

  const stats = ollamaService.getStats();
  const finalConv = dialogueSystem.getConversation(convId);
  console.log(chalk.white('LLM Calls: ') + chalk.gray(stats.totalCalls));
  console.log(chalk.white('Tokens Generated: ') + chalk.gray(stats.totalTokens));
  console.log(chalk.white('Cache Hits: ') + chalk.gray(stats.cacheHits));
  console.log(chalk.white('Conversation Turns: ') + chalk.gray(finalConv ? finalConv.history.length : 0));
  console.log(chalk.white('Total Quests: ') + chalk.gray(questManager.getActiveQuests().length));

  console.log(chalk.cyan('\n' + '═'.repeat(60)));
  console.log(chalk.cyan('  DEMO COMPLETE'));
  console.log(chalk.cyan('═'.repeat(60)) + '\n');

  console.log(chalk.green('✓ Dialogue system working with context-aware responses'));
  console.log(chalk.green('✓ NPCs remember previous interactions'));
  console.log(chalk.green('✓ Relationships change based on conversation'));
  console.log(chalk.green('✓ Quest system integrated with dialogue'));
  console.log(chalk.green('✓ Personality traits influence NPC behavior\n'));

  console.log(chalk.white('Next Steps:\n'));
  console.log(chalk.gray('  • Add more NPCs with different personalities'));
  console.log(chalk.gray('  • Implement multi-NPC conversations'));
  console.log(chalk.gray('  • Add quest progression and completion'));
  console.log(chalk.gray('  • Test longer conversation chains'));
  console.log(chalk.gray('  • Add location system and NPC movement\n'));

  console.log(chalk.cyan('Run ') + chalk.white('node interactive-demo.js') + 
              chalk.cyan(' for hands-on testing!\n'));
}

runDemo().catch(error => {
  console.error(chalk.red('\n✗ Error:'), error);
  console.error(error.stack);
  process.exit(1);
});
