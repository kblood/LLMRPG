import readline from 'readline';

/**
 * Simple text-based dialogue interface
 * Handles user input and displays dialogue
 * 
 * @class DialogueInterface
 */
export class DialogueInterface {
  constructor() {
    this.rl = null;
    this.inputCallback = null;
  }

  /**
   * Initialize the interface
   */
  initialize() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });

    return this;
  }

  /**
   * Display a message
   * @param {string} message - Message to display
   * @param {Object} options - Display options
   */
  display(message, options = {}) {
    const { color, prefix = '', suffix = '\n' } = options;
    
    if (color) {
      // Simple color codes
      const colors = {
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m',
        gray: '\x1b[90m',
        reset: '\x1b[0m'
      };
      
      const colorCode = colors[color] || colors.white;
      process.stdout.write(`${colorCode}${prefix}${message}${colors.reset}${suffix}`);
    } else {
      process.stdout.write(`${prefix}${message}${suffix}`);
    }
  }

  /**
   * Display character dialogue
   * @param {string} characterName - Name of speaking character
   * @param {string} text - What they said
   * @param {Object} options - Display options
   */
  displayDialogue(characterName, text, options = {}) {
    const color = options.color || (options.isPlayer ? 'cyan' : 'white');
    const prefix = options.isPlayer ? '> ' : '';
    
    this.display(`${characterName}: `, { color: 'yellow', suffix: '' });
    this.display(`${prefix}${text}`, { color, suffix: '\n' });
  }

  /**
   * Display a separator
   */
  displaySeparator() {
    this.display('─'.repeat(60), { color: 'gray' });
  }

  /**
   * Display a header
   * @param {string} text - Header text
   */
  displayHeader(text) {
    this.display('\n' + '═'.repeat(60), { color: 'cyan' });
    this.display(`  ${text}`, { color: 'cyan' });
    this.display('═'.repeat(60) + '\n', { color: 'cyan' });
  }

  /**
   * Display an info message
   * @param {string} text - Info text
   */
  displayInfo(text) {
    this.display(`ℹ ${text}`, { color: 'blue' });
  }

  /**
   * Display a success message
   * @param {string} text - Success text
   */
  displaySuccess(text) {
    this.display(`✓ ${text}`, { color: 'green' });
  }

  /**
   * Display an error message
   * @param {string} text - Error text
   */
  displayError(text) {
    this.display(`✗ ${text}`, { color: 'red' });
  }

  /**
   * Display a menu
   * @param {Array} options - Menu options [{key, text}]
   */
  displayMenu(options) {
    this.display('\nOptions:', { color: 'yellow' });
    options.forEach(opt => {
      this.display(`  [${opt.key}] ${opt.text}`, { color: 'white' });
    });
    this.display('');
  }

  /**
   * Prompt for user input
   * @param {string} prompt - Prompt text
   * @returns {Promise<string>} User input
   */
  async prompt(prompt = 'Your choice') {
    return new Promise((resolve) => {
      this.rl.question(`${prompt}: `, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  /**
   * Prompt for dialogue input
   * @param {string} characterName - Name of character player is talking to
   * @returns {Promise<string>} Player's dialogue
   */
  async promptDialogue(characterName = 'NPC') {
    this.display('\n> ', { color: 'cyan', suffix: '' });
    return new Promise((resolve) => {
      this.rl.question('', (answer) => {
        resolve(answer.trim());
      });
    });
  }

  /**
   * Display loading indicator
   * @param {string} text - Loading text
   */
  displayLoading(text = 'Thinking...') {
    this.display(`⟳ ${text}`, { color: 'gray', suffix: '' });
  }

  /**
   * Show loading indicator (alias for displayLoading)
   * @param {string} text - Loading text
   */
  showLoading(text = 'Thinking...') {
    this.displayLoading(text);
  }

  /**
   * Hide loading indicator (alias for clearLoading)
   */
  hideLoading() {
    this.clearLoading();
  }

  /**
   * Clear loading indicator
   */
  clearLoading() {
    // Move cursor up and clear line
    process.stdout.write('\x1b[1A\x1b[2K');
  }

  /**
   * Display character info
   * @param {Character} character - Character to display
   */
  displayCharacterInfo(character) {
    this.displaySeparator();
    this.display(`${character.name}`, { color: 'yellow', suffix: '' });
    if (character.occupation) {
      this.display(` - ${character.occupation}`, { color: 'white' });
    } else {
      this.display('\n');
    }
    
    const relationship = character.relationships?.getRelationship('player') || 0;
    const relationshipLevel = character.relationships?.getRelationshipLevel('player') || 'Stranger';
    
    this.display(`Relationship: ${relationshipLevel} (${relationship})`, { color: 'gray' });
    this.displaySeparator();
  }

  /**
   * Display thought/internal monologue
   * @param {string} characterName - Character thinking
   * @param {string} thought - Their thought
   */
  displayThought(characterName, thought) {
    this.display(`[${characterName} thinks: ${thought}]`, { color: 'gray' });
  }

  /**
   * Clear the screen
   */
  clear() {
    console.clear();
  }

  /**
   * Close the interface
   */
  close() {
    if (this.rl) {
      this.rl.close();
    }
  }

  /**
   * Display a pause prompt
   * @returns {Promise<void>}
   */
  async pause() {
    return this.prompt('Press Enter to continue');
  }

  displayQuestNotification(quest, type = 'new') {
    this.display('');
    if (type === 'new') {
      this.display('═══════════════════════════════════════════════════════════', { color: 'yellow' });
      this.display('  ⚔️  NEW QUEST  ⚔️', { color: 'yellow' });
      this.display('═══════════════════════════════════════════════════════════', { color: 'yellow' });
      this.display(`  ${quest.title}`, { color: 'white' });
      this.display(`  ${quest.description}`, { color: 'gray' });
      if (quest.objectives && quest.objectives.length > 0) {
        this.display('');
        this.display('  Objectives:', { color: 'cyan' });
        quest.objectives.forEach((obj, i) => {
          this.display(`    ${i + 1}. ${obj.description}`, { color: 'white' });
        });
      }
      this.display('═══════════════════════════════════════════════════════════', { color: 'yellow' });
    } else if (type === 'completed') {
      this.display('═══════════════════════════════════════════════════════════', { color: 'green' });
      this.display('  ✓ QUEST COMPLETED  ✓', { color: 'green' });
      this.display('═══════════════════════════════════════════════════════════', { color: 'green' });
      this.display(`  ${quest.title}`, { color: 'white' });
      if (quest.rewards && quest.rewards.description) {
        this.display(`  Reward: ${quest.rewards.description}`, { color: 'yellow' });
      }
      this.display('═══════════════════════════════════════════════════════════', { color: 'green' });
    }
    this.display('');
  }

  displayQuestLog(quests) {
    this.displayHeader('Quest Log');
    
    if (quests.active.length === 0 && quests.completed.length === 0) {
      this.display('No quests yet. Talk to NPCs to find tasks!', { color: 'gray' });
      this.display('');
      return;
    }

    if (quests.active.length > 0) {
      this.display('Active Quests:', { color: 'yellow' });
      this.display('');
      quests.active.forEach((quest, i) => {
        this.display(`${i + 1}. ${quest.title} (${quest.progress.percentage.toFixed(0)}%)`, {
          color: 'white'
        });
        this.display(`   From: ${quest.giver}`, { color: 'gray' });
        this.display(`   ${quest.description}`, { color: 'gray' });
        
        if (quest.objectives.length > 0) {
          quest.objectives.forEach(obj => {
            const status = obj.completed ? '✓' : '○';
            this.display(`   ${status} ${obj.description}`, {
              color: obj.completed ? 'green' : 'white'
            });
          });
        }
        this.display('');
      });
    }

    if (quests.completed.length > 0) {
      this.display('Completed Quests:', { color: 'green' });
      quests.completed.forEach((quest, i) => {
        this.display(`  ✓ ${quest.title}`, { color: 'green' });
      });
      this.display('');
    }
  }
}

export default DialogueInterface;
