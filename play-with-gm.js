import readline from 'readline';
import chalk from 'chalk';
import { GameSession } from './src/game/GameSession.js';
import { DialogueSystem } from './src/systems/dialogue/DialogueSystem.js';
import { GameMaster } from './src/systems/GameMaster.js';
import { OllamaService } from './src/services/OllamaService.js';
import { EventBus } from './src/services/EventBus.js';
import { Character } from './src/entities/Character.js';
import { Personality } from './src/ai/personality/Personality.js';
import { createAllNPCs } from './src/data/npc-roster.js';
import { DialogueInterface } from './src/ui/DialogueInterface.js';

/**
 * Interactive RPG with Game Master narration
 */

const ui = new DialogueInterface();
const session = new GameSession({ seed: 42 });
const dialogueSystem = new DialogueSystem();
const ollama = OllamaService.getInstance();
const eventBus = EventBus.getInstance();
const gameMaster = new GameMaster(ollama, eventBus);

// Create player character
const player = new Character('player', 'Adventurer', {
    role: 'protagonist',
    personality: new Personality({
        friendliness: 60,
        intelligence: 70,
        caution: 50,
        honor: 75,
        greed: 40,
        aggression: 35
    }),
    backstory: 'A curious adventurer who has arrived in the village seeking stories and perhaps a bit of fortune.'
});

// Create NPCs
const npcsObject = createAllNPCs();
const npcs = new Map(Object.entries(npcsObject));

// Old code for reference if needed
/*
npcRoster.forEach(npcData => {
    const npc = new Character(npcData.id, npcData.name, {
        occupation: npcData.occupation,
        backstory: npcData.backstory,
        personality: npcData.personality
    });
    
    // Add initial memories
    if (npcData.initialMemories) {
        npcData.initialMemories.forEach(memory => {
            npc.memory.add(memory);
        });
    }
    
    npcs.set(npc.id, npc);
    session.registerCharacter(npc);
});

*/

// Register player and NPCs with session
session.addCharacter(player);
npcs.forEach(npc => session.addCharacter(npc));

// Game state
let currentLocation = 'Red Griffin Inn';
let currentConversation = null;

// Listen for GM narration
eventBus.on('gm:narration', (data) => {
    ui.clear();
    console.log(chalk.cyan('═'.repeat(70)));
    console.log(chalk.cyan.bold('🎭 THE CHRONICLER SPEAKS:'));
    console.log(chalk.cyan('═'.repeat(70)));
    console.log(chalk.white.italic(data.text));
    console.log(chalk.cyan('═'.repeat(70) + '\n'));
});

// Listen for GM events
eventBus.on('gm:event_generated', (event) => {
    console.log(chalk.yellow('\n⚡ A NEW EVENT UNFOLDS...'));
    console.log(chalk.white(event.description || event.narrative));
    console.log();
});

// Listen for GM orchestrated NPC interactions
eventBus.on('gm:npc_interaction', (interaction) => {
    if (interaction.playerCanObserve) {
        console.log(chalk.magenta('\n👥 NPCs are interacting nearby...'));
        console.log(chalk.white(interaction.narrative));
        console.log();
    }
});

// Welcome message
function showWelcome() {
    ui.clear();
    console.log(chalk.cyan.bold('\n╔═══════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║      OLLAMA RPG - WITH GAME MASTER NARRATION                  ║'));
    console.log(chalk.cyan.bold('╚═══════════════════════════════════════════════════════════════╝\n'));
    
    console.log(chalk.white('Welcome to an AI-driven RPG where an intelligent Game Master'));
    console.log(chalk.white('narrates your adventure and brings the world to life.\n'));
    
    console.log(chalk.yellow('Available NPCs:'));
    Array.from(npcs.values()).slice(0, 10).forEach((npc, i) => {
        console.log(chalk.gray(`  ${i + 1}. ${npc.name} - ${npc.role || npc.occupation || 'Villager'}`));
    });
    
    console.log(chalk.cyan('\nCommands:'));
    console.log(chalk.gray('  talk [name]      - Start conversation with NPC'));
    console.log(chalk.gray('  look            - Get atmospheric description of current location'));
    console.log(chalk.gray('  npcs            - List all available NPCs'));
    console.log(chalk.gray('  info [name]     - View NPC details'));
    console.log(chalk.gray('  where           - Show current location'));
    console.log(chalk.gray('  stats           - Show session statistics'));
    console.log(chalk.gray('  help            - Show this help'));
    console.log(chalk.gray('  exit            - Quit game'));
    
    console.log();
}

// Get atmospheric description
async function lookAround() {
    ui.showLoading('The Chronicler observes the scene...');
    
    const context = {
        location: currentLocation,
        timeOfDay: getTimeOfDay(),
        weather: 'clear',
        npcsPresent: getNPCsAtLocation(currentLocation),
        recentEvents: getRecentEvents(),
        mood: getCurrentMood()
    };
    
    const narration = await gameMaster.narrateScene(context);
    
    ui.hideLoading();
    
    // Narration is displayed via event listener
    await new Promise(resolve => setTimeout(resolve, 100));
}

// Get NPCs at current location
function getNPCsAtLocation(location) {
    const locationNPCs = {
        'Red Griffin Inn': ['Mara', 'Thom', 'occasional patrons'],
        'Village Square': ['Aldric', 'Finn', 'townsfolk'],
        'Blacksmith Forge': ['Grok'],
        'Temple': ['Brother Marcus'],
        'Noble Manor': ['Lady Cordelia'],
        'Market': ['Elara', 'various merchants']
    };
    
    return locationNPCs[location] || [];
}

// Get time of day based on game time
function getTimeOfDay() {
    const frame = session.currentFrame;
    const hour = Math.floor((frame / 60) % 24);
    
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    if (hour < 22) return 'evening';
    return 'night';
}

// Get recent events
function getRecentEvents() {
    const events = [];
    
    if (currentConversation) {
        events.push('in conversation');
    }
    
    if (dialogueSystem.activeConversations && dialogueSystem.activeConversations.size > 0) {
        events.push('met some villagers');
    }
    
    return events;
}

// Get current mood
function getCurrentMood() {
    const moods = ['peaceful', 'tense', 'mysterious', 'welcoming', 'busy'];
    return moods[Math.floor(Math.random() * moods.length)];
}

// Talk to NPC
async function talkToNPC(npcName) {
    const npc = Array.from(npcs.values()).find(n => 
        n.name.toLowerCase() === npcName.toLowerCase()
    );
    
    if (!npc) {
        console.log(chalk.red(`✗ Could not find NPC named "${npcName}"`));
        return;
    }
    
    // Check if already in conversation
    if (currentConversation) {
        console.log(chalk.yellow('You are already in a conversation. Type "bye" to end it first.'));
        return;
    }
    
    // GM narrates the approach
    ui.showLoading('The Chronicler sets the scene...');
    
    const approachContext = {
        location: currentLocation,
        timeOfDay: getTimeOfDay(),
        npcsPresent: [npc.name],
        playerActions: [`approaching ${npc.name}`],
        mood: 'anticipatory'
    };
    
    const approachNarration = await gameMaster.narrateScene(approachContext);
    ui.hideLoading();
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Start dialogue (greeting is auto-generated)
    const conversationId = await dialogueSystem.startConversation(player, npc);
    currentConversation = dialogueSystem.activeConversations.get(conversationId);
    
    // Show greeting if one was generated
    if (currentConversation.history.length > 0) {
        const firstTurn = currentConversation.history[0];
        console.log(chalk.yellow(`\n${npc.name}: `) + chalk.white(firstTurn.output || 'Hello there!'));
    }
    
    // Enter conversation loop
    await conversationLoop(npc);
}

// Conversation loop
async function conversationLoop(npc) {
    while (currentConversation) {
        const input = await ui.promptDialogue(npc.name);
        
        if (!input) continue;
        
        const command = input.toLowerCase().trim();
        
        if (command === 'bye' || command === 'exit' || command === 'leave') {
            await dialogueSystem.endConversation(currentConversation.id);
            console.log(chalk.gray(`\nYou part ways with ${npc.name}.\n`));
            currentConversation = null;
            break;
        }
        
        // Player message
        console.log(chalk.cyan(`\nYou: `) + chalk.white(input));
        ui.showLoading(`${npc.name} is thinking...`);
        
        const result = await dialogueSystem.addTurn(currentConversation.id, npc.id, input);
        
        ui.hideLoading();
        
        if (result && result.text) {
            console.log(chalk.yellow(`\n${npc.name}: `) + chalk.white(result.text));
            
            // Occasionally add GM atmosphere during dialogue
            if (Math.random() < 0.2) {
                const atmosphere = await gameMaster.provideAtmosphere({
                    location: currentLocation,
                    timeOfDay: getTimeOfDay(),
                    mood: 'conversational',
                    npcsPresent: [npc.name]
                });
                
                console.log(chalk.cyan.italic(`\n  ${atmosphere}\n`));
            }
        }
    }
}

// Show NPC info
function showNPCInfo(npcName) {
    const npc = Array.from(npcs.values()).find(n => 
        n.name.toLowerCase() === npcName.toLowerCase()
    );
    
    if (!npc) {
        console.log(chalk.red(`✗ Could not find NPC named "${npcName}"`));
        return;
    }
    
    ui.showCharacterInfo(npc);
}

// List all NPCs
function listNPCs() {
    console.log(chalk.yellow('\n═══ Available NPCs ═══\n'));
    
    Array.from(npcs.values()).forEach((npc, i) => {
        const personality = npc.personality;
        const dominant = personality.getDominantTrait();
        
        console.log(chalk.white(`${i + 1}. ${npc.name}`));
        console.log(chalk.gray(`   ${npc.occupation}`));
        console.log(chalk.gray(`   Personality: ${dominant.trait} (${dominant.value})`));
        console.log();
    });
}

// Show stats
function showStats() {
    const stats = dialogueSystem.getStatistics();
    const gmContext = gameMaster.getNarrativeContext();
    
    console.log(chalk.yellow('\n═══ Session Statistics ═══\n'));
    
    console.log(chalk.white('Dialogue System:'));
    console.log(chalk.gray(`  Conversations: ${stats.totalConversations}`));
    console.log(chalk.gray(`  Dialogue turns: ${stats.totalDialogueTurns}`));
    console.log(chalk.gray(`  Average conversation length: ${stats.averageConversationLength?.toFixed(1) || 0} turns`));
    
    console.log(chalk.white('\nGame Master:'));
    console.log(chalk.gray(`  Current Act: ${gmContext.currentAct}`));
    console.log(chalk.gray(`  Narrations: ${gmContext.recentNarration.length}`));
    console.log(chalk.gray(`  Story Beats: ${gmContext.storyBeats.length}`));
    console.log(chalk.gray(`  Active Events: ${gmContext.activeEvents.length}`));
    
    console.log(chalk.white('\nGame Session:'));
    console.log(chalk.gray(`  Current frame: ${session.currentFrame}`));
    console.log(chalk.gray(`  Game time: ${session.getGameTime()}`));
    
    console.log();
}

// Show current location
function showLocation() {
    console.log(chalk.yellow(`\n📍 Current Location: ${chalk.white(currentLocation)}\n`));
}

// Main command loop
async function mainLoop() {
    // Initialize UI
    ui.initialize();
    
    showWelcome();
    
    // Initial narration
    console.log(chalk.cyan('\nThe adventure begins...\n'));
    await lookAround();
    
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    const prompt = () => {
        rl.question(chalk.cyan('> '), async (input) => {
            const trimmed = input.trim();
            
            if (!trimmed) {
                prompt();
                return;
            }
            
            const parts = trimmed.split(' ');
            const command = parts[0].toLowerCase();
            const args = parts.slice(1).join(' ');
            
            try {
                switch (command) {
                    case 'talk':
                        if (!args) {
                            console.log(chalk.red('Usage: talk [name]'));
                        } else {
                            await talkToNPC(args);
                        }
                        break;
                    
                    case 'look':
                        await lookAround();
                        break;
                    
                    case 'info':
                        if (!args) {
                            console.log(chalk.red('Usage: info [name]'));
                        } else {
                            showNPCInfo(args);
                        }
                        break;
                    
                    case 'npcs':
                        listNPCs();
                        break;
                    
                    case 'where':
                        showLocation();
                        break;
                    
                    case 'stats':
                        showStats();
                        break;
                    
                    case 'help':
                        showWelcome();
                        break;
                    
                    case 'exit':
                    case 'quit':
                        console.log(chalk.cyan('\nFarewell, traveler!\n'));
                        rl.close();
                        process.exit(0);
                        return;
                    
                    default:
                        console.log(chalk.red(`Unknown command: ${command}`));
                        console.log(chalk.gray('Type "help" for available commands'));
                }
            } catch (error) {
                console.error(chalk.red('Error:'), error.message);
            }
            
            prompt();
        });
    };
    
    prompt();
}

// Start the game
mainLoop().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
});
