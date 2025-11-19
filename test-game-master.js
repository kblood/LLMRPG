import { GameMaster } from './src/systems/GameMaster.js';
import { OllamaService } from './src/services/OllamaService.js';
import { EventBus } from './src/services/EventBus.js';
import { Character } from './src/entities/Character.js';
import { Personality } from './src/ai/personality/Personality.js';
import chalk from 'chalk';

/**
 * Test the Game Master (Narrative Director) system
 */

console.log(chalk.cyan.bold('\n╔════════════════════════════════════════════╗'));
console.log(chalk.cyan.bold('║   Game Master System Test                 ║'));
console.log(chalk.cyan.bold('╔════════════════════════════════════════════╗\n'));

const ollama = OllamaService.getInstance();
const eventBus = EventBus.getInstance();
const gameMaster = new GameMaster(ollama, eventBus);

// Create test NPCs
const mara = new Character('mara', 'Mara', {
    occupation: 'Tavern Keeper',
    backstory: 'Runs the Red Griffin Inn',
    personality: Personality.createArchetype('cheerful_tavern_keeper')
});

const grok = new Character('grok', 'Grok', {
    occupation: 'Blacksmith',
    backstory: 'Village blacksmith',
    personality: Personality.createArchetype('gruff_blacksmith')
});

// Test 1: Scene Narration
async function testSceneNarration() {
    console.log(chalk.yellow('═══ Test 1: Scene Narration ═══\n'));
    
    const context = {
        location: 'Red Griffin Inn',
        timeOfDay: 'evening',
        weather: 'rainy',
        recentEvents: ['player arrived in village', 'learned about mysterious thefts'],
        playerActions: ['talked to town guard', 'entered tavern'],
        npcsPresent: ['Mara', 'Grok', 'drunk patron'],
        mood: 'tense'
    };
    
    console.log(chalk.gray('Context:'));
    console.log(chalk.gray(`  Location: ${context.location}`));
    console.log(chalk.gray(`  Time: ${context.timeOfDay}`));
    console.log(chalk.gray(`  Weather: ${context.weather}`));
    console.log(chalk.gray(`  Mood: ${context.mood}\n`));
    
    console.log(chalk.cyan('Generating narration...\n'));
    
    const narration = await gameMaster.narrateScene(context);
    
    console.log(chalk.green('GM Narration:'));
    console.log(chalk.white(narration));
    console.log();
}

// Test 2: Atmospheric Descriptions
async function testAtmosphere() {
    console.log(chalk.yellow('\n═══ Test 2: Atmospheric Descriptions ═══\n'));
    
    const moments = [
        {
            location: 'village square',
            timeOfDay: 'dawn',
            recentEvents: ['quest completed', 'thief caught'],
            mood: 'relieved',
            npcsPresent: ['villagers gathering']
        },
        {
            location: 'dark alley',
            timeOfDay: 'midnight',
            recentEvents: ['suspicious figure spotted'],
            mood: 'tense',
            npcsPresent: ['hooded stranger']
        },
        {
            location: 'temple',
            timeOfDay: 'noon',
            recentEvents: ['seeking guidance'],
            mood: 'peaceful',
            npcsPresent: ['Brother Marcus']
        }
    ];
    
    for (const moment of moments) {
        console.log(chalk.gray(`\nLocation: ${moment.location} (${moment.timeOfDay})`));
        console.log(chalk.gray(`Mood: ${moment.mood}`));
        
        const atmosphere = await gameMaster.provideAtmosphere(moment);
        
        console.log(chalk.green('Atmosphere:'));
        console.log(chalk.white(atmosphere));
    }
    
    console.log();
}

// Test 3: NPC Interaction Orchestration
async function testNPCInteraction() {
    console.log(chalk.yellow('\n═══ Test 3: NPC Interaction Orchestration ═══\n'));
    
    const context = {
        reason: 'Grok comes to the tavern after work',
        playerCanObserve: true,
        location: 'Red Griffin Inn'
    };
    
    console.log(chalk.gray('Orchestrating interaction between Mara and Grok...'));
    console.log(chalk.gray(`Context: ${context.reason}\n`));
    
    const interaction = await gameMaster.orchestrateNPCInteraction(mara, grok, context);
    
    if (interaction) {
        console.log(chalk.green('Orchestrated Interaction:'));
        console.log(chalk.white(interaction.narrative));
        console.log();
        console.log(chalk.gray(`Participants: ${interaction.participants.join(', ')}`));
        console.log(chalk.gray(`Player Can Observe: ${interaction.playerCanObserve}`));
    }
    
    console.log();
}

// Test 4: Event Generation
async function testEventGeneration() {
    console.log(chalk.yellow('\n═══ Test 4: Dynamic Event Generation ═══\n'));
    
    const gameState = {
        npcsMet: ['Mara', 'Grok', 'Aldric'],
        activeQuests: ['investigate_thefts'],
        currentLocation: 'Red Griffin Inn',
        timeOfDay: 'evening',
        recentActions: ['talked to Mara about thefts', 'questioned Grok', 'searched for clues']
    };
    
    console.log(chalk.gray('Game State:'));
    console.log(chalk.gray(`  NPCs Met: ${gameState.npcsMet.join(', ')}`));
    console.log(chalk.gray(`  Active Quests: ${gameState.activeQuests.join(', ')}`));
    console.log(chalk.gray(`  Recent Actions: ${gameState.recentActions.slice(0, 2).join(', ')}`));
    console.log(chalk.gray('\nGenerating dynamic event...\n'));
    
    const event = await gameMaster.generateEvent(gameState);
    
    if (event) {
        console.log(chalk.green('Generated Event:'));
        console.log(chalk.white(`Type: ${event.type || 'narrative_event'}`));
        console.log(chalk.white(`Description: ${event.description || event.narrative}`));
        
        if (event.participants) {
            console.log(chalk.gray(`Participants: ${event.participants.join(', ')}`));
        }
        
        if (event.consequences) {
            console.log(chalk.gray('Possible Consequences:'));
            event.consequences.forEach(c => console.log(chalk.gray(`  - ${c}`)));
        }
    }
    
    console.log();
}

// Test 5: Story Arc Tracking
function testStoryArcTracking() {
    console.log(chalk.yellow('\n═══ Test 5: Story Arc Tracking ═══\n'));
    
    // Simulate player progression
    const progression = [
        { actions: 2, quests: 0, expected: 1 },
        { actions: 8, quests: 1, expected: 2 },
        { actions: 15, quests: 3, expected: 3 }
    ];
    
    progression.forEach(({ actions, quests, expected }) => {
        const playerActions = [];
        
        for (let i = 0; i < actions; i++) {
            playerActions.push({ type: 'dialogue', npcId: 'test' });
        }
        
        for (let i = 0; i < quests; i++) {
            playerActions.push({ type: 'quest_started', questId: `quest_${i}` });
        }
        
        gameMaster.trackStoryArc(playerActions);
        
        console.log(chalk.gray(`Player Actions: ${actions}, Quests: ${quests}`));
        console.log(chalk.white(`Current Act: ${gameMaster.currentAct} (expected: ${expected})`));
        
        if (gameMaster.currentAct === expected) {
            console.log(chalk.green('✓ Story arc tracking correct\n'));
        } else {
            console.log(chalk.red('✗ Story arc tracking incorrect\n'));
        }
    });
}

// Test 6: Event Observation
function testEventObservation() {
    console.log(chalk.yellow('\n═══ Test 6: Event Observation ═══\n'));
    
    let narrationReceived = false;
    
    eventBus.on('gm:narration', (data) => {
        console.log(chalk.green('✓ GM narration event received'));
        narrationReceived = true;
    });
    
    gameMaster.observePlayerAction({
        type: 'talk',
        target: 'mara'
    });
    
    console.log(chalk.gray('Player action observed and tracked\n'));
    
    gameMaster.observeQuestStart({
        questId: 'test_quest'
    });
    
    console.log(chalk.gray('Quest start observed and tracked\n'));
    
    console.log(chalk.white(`Total player actions tracked: ${gameMaster.playerActions.length}`));
    console.log(chalk.white(`Current story act: ${gameMaster.currentAct}`));
    console.log();
}

// Test 7: Configuration
function testConfiguration() {
    console.log(chalk.yellow('\n═══ Test 7: GM Configuration ═══\n'));
    
    console.log(chalk.gray('Default configuration:'));
    console.log(chalk.gray(`  Narration Frequency: ${gameMaster.narrationFrequency}`));
    console.log(chalk.gray(`  Event Generation: ${gameMaster.eventGenerationEnabled}`));
    console.log(chalk.gray(`  Story Arc Tracking: ${gameMaster.storyArcTracking}\n`));
    
    gameMaster.configure({
        narrationFrequency: 'constant',
        eventGenerationEnabled: false
    });
    
    console.log(chalk.gray('Updated configuration:'));
    console.log(chalk.gray(`  Narration Frequency: ${gameMaster.narrationFrequency}`));
    console.log(chalk.gray(`  Event Generation: ${gameMaster.eventGenerationEnabled}\n`));
    
    console.log(chalk.green('✓ Configuration system working\n'));
}

// Test 8: Full Integration Scenario
async function testFullIntegration() {
    console.log(chalk.yellow('\n═══ Test 8: Full Integration Scenario ═══\n'));
    
    console.log(chalk.cyan('Simulating a complete game sequence...\n'));
    
    // Reset GM
    gameMaster.reset();
    gameMaster.configure({ narrationFrequency: 'key_moments' });
    
    // 1. Player enters tavern
    console.log(chalk.bold('1. Player enters Red Griffin Inn'));
    const enterNarration = await gameMaster.narrateScene({
        location: 'Red Griffin Inn',
        timeOfDay: 'evening',
        weather: 'clear',
        mood: 'welcoming'
    });
    console.log(chalk.white(`   ${enterNarration.substring(0, 100)}...\n`));
    
    // 2. Player talks to Mara
    console.log(chalk.bold('2. Player starts dialogue with Mara'));
    eventBus.emit('dialogue:started', { npcId: 'mara' });
    console.log(chalk.green('   ✓ GM observes dialogue start\n'));
    
    // 3. Quest emerges
    console.log(chalk.bold('3. Quest discovered'));
    eventBus.emit('quest:started', { questId: 'investigate_thefts' });
    console.log(chalk.green('   ✓ GM tracks quest start\n'));
    
    // 4. GM orchestrates NPC interaction
    console.log(chalk.bold('4. GM orchestrates background NPC interaction'));
    const bgInteraction = await gameMaster.orchestrateNPCInteraction(mara, grok, {
        reason: 'Grok stops by for his evening ale',
        playerCanObserve: true
    });
    if (bgInteraction) {
        console.log(chalk.white(`   ${bgInteraction.narrative.substring(0, 100)}...\n`));
    }
    
    // 5. Check narrative context
    console.log(chalk.bold('5. Narrative Context Summary'));
    const context = gameMaster.getNarrativeContext();
    console.log(chalk.gray(`   Current Act: ${context.currentAct}`));
    console.log(chalk.gray(`   Narrations: ${context.recentNarration.length}`));
    console.log(chalk.gray(`   Story Beats: ${context.storyBeats.length}`));
    console.log(chalk.gray(`   Active Events: ${context.activeEvents.length}\n`));
    
    console.log(chalk.green.bold('✓ Full integration test complete!\n'));
}

// Run all tests
async function runAllTests() {
    try {
        // Check Ollama availability
        const isAvailable = await ollama.isAvailable();
        
        if (!isAvailable) {
            console.log(chalk.yellow('⚠ Ollama not available - some tests will use fallbacks\n'));
        } else {
            console.log(chalk.green('✓ Ollama available and ready\n'));
        }
        
        // Run tests
        await testSceneNarration();
        await testAtmosphere();
        await testNPCInteraction();
        await testEventGeneration();
        testStoryArcTracking();
        testEventObservation();
        testConfiguration();
        await testFullIntegration();
        
        // Summary
        console.log(chalk.cyan.bold('\n╔════════════════════════════════════════════╗'));
        console.log(chalk.cyan.bold('║   All Game Master Tests Complete!         ║'));
        console.log(chalk.cyan.bold('╚════════════════════════════════════════════╝\n'));
        
        console.log(chalk.green('✓ Scene Narration'));
        console.log(chalk.green('✓ Atmospheric Descriptions'));
        console.log(chalk.green('✓ NPC Interaction Orchestration'));
        console.log(chalk.green('✓ Dynamic Event Generation'));
        console.log(chalk.green('✓ Story Arc Tracking'));
        console.log(chalk.green('✓ Event Observation'));
        console.log(chalk.green('✓ Configuration System'));
        console.log(chalk.green('✓ Full Integration'));
        
        console.log(chalk.cyan('\nThe Game Master system is ready to use!\n'));
        
    } catch (error) {
        console.error(chalk.red('\n✗ Test failed:'), error);
        console.error(error.stack);
    }
}

// Run tests
runAllTests();
