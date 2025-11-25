/**
 * Text-based UI Simulator for Testing
 * Simulates what the UI would display in a text/shell format
 */

import { EventEmitter } from 'events';

/**
 * Simulates the UI by printing to console what the UI would show
 */
export class TextUISimulator extends EventEmitter {
  constructor() {
    super();
    this.gameState = null;
    this.conversationLog = [];
    this.actionLog = [];
    this.combatLog = [];
    this.questLog = [];
    this.frameCount = 0;
    this.isRunning = false;
  }

  /**
   * Start the UI simulator
   */
  start() {
    this.isRunning = true;
    console.log('\n' + '='.repeat(80));
    console.log('TEXT UI SIMULATOR STARTED'.center(80));
    console.log('='.repeat(80) + '\n');
  }

  /**
   * Stop the UI simulator
   */
  stop() {
    this.isRunning = false;
    console.log('\n' + '='.repeat(80));
    console.log('TEXT UI SIMULATOR STOPPED'.center(80));
    console.log('='.repeat(80) + '\n');
    this.printSummary();
  }

  /**
   * Handle state update from the game
   * @param {string} updateType - Type of update (e.g. 'dialogue_line', 'action_executed')
   * @param {Object} state - Current game state
   * @param {Object} metadata - Additional metadata about the event
   */
  handleStateUpdate(updateType, state, metadata = {}) {
    if (!this.isRunning) return;

    this.gameState = state;

    switch (updateType) {
      case 'game_started':
        this.handleGameStarted(state);
        break;
      case 'frame_update':
        this.handleFrameUpdate(state);
        break;
      case 'dialogue_started':
        this.handleDialogueStarted(state, metadata);
        break;
      case 'dialogue_line':
        this.handleDialogueLine(state, metadata);
        break;
      case 'dialogue_ended':
        this.handleDialogueEnded(state, metadata);
        break;
      case 'action_started':
      case 'action_executed':
        this.handleActionStarted(state, metadata);
        break;
      case 'action_completed':
        this.handleActionCompleted(state, metadata);
        break;
      case 'combat_started':
        this.handleCombatStarted(state, metadata);
        break;
      case 'combat_round':
        this.handleCombatRound(state, metadata);
        break;
      case 'combat_ended':
        this.handleCombatEnded(state, metadata);
        break;
      case 'quest_updated':
      case 'quest_added':
      case 'quest_created':
        this.handleQuestUpdated(state, metadata);
        break;
      case 'location_changed':
        this.handleLocationChanged(state, metadata);
        break;
    }
  }

  /**
   * Handle game event
   */
  handleGameEvent(eventType, data) {
    if (!this.isRunning) return;

    switch (eventType) {
      case 'autonomous_mode_started':
        console.log('\n🤖 [AUTONOMOUS MODE] Started - AI is now controlling the protagonist\n');
        break;
      case 'autonomous_mode_stopped':
        console.log('\n🤖 [AUTONOMOUS MODE] Stopped\n');
        break;
      case 'error':
        console.log(`\n❌ [ERROR] ${data.message}\n`);
        break;
    }
  }

  handleGameStarted(state) {
    console.log('\n📜 [GAME STARTED]');
    console.log(`Theme: ${state.theme || state.worldTitle || 'Unknown'}`);
    console.log(`World: ${state.worldTitle || state.theme || 'Unknown World'}`);
    const protagonist = state.characters?.protagonist || state.protagonist;
    if (protagonist) {
      console.log(`Protagonist: ${protagonist.name}`);
      const location = protagonist.currentLocation || protagonist.location;
      console.log(`Location: ${this.getLocationName(location)}`);
      const hp = protagonist.stats?.hp || protagonist.hp || '?';
      const maxHp = protagonist.stats?.maxHp || protagonist.maxHp || '?';
      console.log(`HP: ${hp}/${maxHp}`);
    }
    const gameTime = state.time?.gameTimeString || this.formatGameTime(state.gameTime) || this.formatGameTime(state.time?.gameTime);
    console.log(`Game Time: ${gameTime}`);
    console.log('─'.repeat(80));
  }

  handleFrameUpdate(state) {
    this.frameCount = state.frame || state.currentFrame || this.frameCount + 1;
    // Only print every 10 frames to avoid spam
    if (this.frameCount % 10 === 0) {
      const gameTime = state.time?.gameTimeString || this.formatGameTime(state.gameTime) || this.formatGameTime(state.time?.gameTime);
      process.stdout.write(`\r⏱️  Frame: ${this.frameCount} | Time: ${gameTime}`);
    }
  }

  handleDialogueStarted(state, metadata = {}) {
    console.log('\n');
    console.log('💬 [CONVERSATION STARTED]');
    const participants = metadata.participants || state.dialogue?.participants || [];
    console.log(`Participants: ${participants.join(', ')}`);
    console.log('─'.repeat(80));
  }

  handleDialogueLine(state, metadata = {}) {
    // Metadata contains speaker information directly
    const speaker = metadata.speakerName || metadata.speaker || 'Unknown';
    const text = metadata.text || metadata.message || '';
    
    if (text && text.length > 0) {
      // Add to log
      this.conversationLog.push({ speaker, text, frame: this.frameCount });
      
      // Print to console
      console.log(`  ${speaker}: "${text}"`);
    }
  }

  handleDialogueEnded(state, metadata = {}) {
    console.log('─'.repeat(80));
    console.log('💬 [CONVERSATION ENDED]\n');
  }

  handleDialogueEnded(state) {
    console.log('─'.repeat(80));
    console.log('💬 [CONVERSATION ENDED]\n');
  }

  handleActionStarted(state, metadata = {}) {
    // Extract action from metadata or state
    const action = metadata.action || metadata;
    const actionType = action.type || action.actionType || metadata.actionType || 'Unknown';
    const description = action.description || action.result || metadata.description || 'No description';
    
    console.log(`\n⚡ [ACTION] ${actionType} - ${description}`);
    this.actionLog.push({ 
      type: actionType, 
      description,
      frame: this.frameCount,
      status: 'started'
    });
  }

  handleActionCompleted(state, metadata = {}) {
    const action = metadata.action || metadata;
    const actionType = action.type || action.actionType || 'Unknown';
    const result = action.result || metadata.result || 'No result';
    const success = action.success !== undefined ? action.success : true;
    const status = success ? '✅' : '❌';
    
    console.log(`${status} [ACTION COMPLETED] ${actionType} - ${result}\n`);
    this.actionLog.push({ 
      type: actionType, 
      result,
      success,
      frame: this.frameCount,
      status: 'completed'
    });
  }

  handleCombatStarted(state, metadata = {}) {
    console.log('\n⚔️  [COMBAT STARTED]');
    const combat = metadata.combat || state.currentCombat;
    if (combat) {
      console.log(`${combat.player?.name || 'Player'} vs ${combat.enemy?.name || 'Enemy'}`);
      console.log(`Player HP: ${combat.player?.stats?.hp || '?'}/${combat.player?.stats?.maxHp || '?'}`);
      console.log(`Enemy HP: ${combat.enemy?.stats?.hp || '?'}/${combat.enemy?.stats?.maxHp || '?'}`);
      console.log('─'.repeat(80));
    }
    this.combatLog.push({
      type: 'started',
      frame: this.frameCount
    });
  }

  handleCombatRound(state, metadata = {}) {
    const combat = metadata.combat || state.currentCombat;
    if (combat) {
      const round = combat.round || metadata.round || '?';
      console.log(`\n  Round ${round}:`);
      
      if (combat.lastAction) {
        console.log(`    ${combat.lastAction.attacker}: ${combat.lastAction.description}`);
        console.log(`    Damage: ${combat.lastAction.damage || 0}`);
      }
      
      console.log(`    Player HP: ${combat.player?.stats?.hp || '?'}/${combat.player?.stats?.maxHp || '?'}`);
      console.log(`    Enemy HP: ${combat.enemy?.stats?.hp || '?'}/${combat.enemy?.stats?.maxHp || '?'}`);
    }
  }

  handleCombatEnded(state, metadata = {}) {
    console.log('─'.repeat(80));
    const combat = metadata.combat || state.lastCombat;
    if (combat) {
      const result = combat.victory ? '🎉 VICTORY!' : '💀 DEFEAT!';
      console.log(`⚔️  [COMBAT ENDED] ${result}`);
      if (combat.rewards) {
        console.log(`Rewards: ${JSON.stringify(combat.rewards)}`);
      }
    }
    console.log('');
    this.combatLog.push({
      type: 'ended',
      victory: combat?.victory,
      frame: this.frameCount
    });
  }

  handleQuestUpdated(state, metadata = {}) {
    // Extract quest from metadata or state
    const quest = metadata.quest || metadata;
    const title = quest.title || metadata.title || 'Unknown Quest';
    const status = quest.status || metadata.status || 'active';
    const description = quest.description || metadata.description || '';
    
    console.log(`\n📋 [QUEST] ${title}`);
    console.log(`   Status: ${status}`);
    if (description) {
      const shortDesc = description.substring(0, 100);
      console.log(`   ${shortDesc}${description.length > 100 ? '...' : ''}`);
    }
    console.log('');
    this.questLog.push({
      title,
      status,
      frame: this.frameCount
    });
  }

  handleLocationChanged(state, metadata = {}) {
    const location = metadata.location || metadata.locationName;
    if (location) {
      console.log(`\n🗺️  [TRAVEL] Arrived at: ${location}\n`);
    }
  }

  getLocationName(locationId) {
    if (!locationId) return 'Unknown';
    if (!this.gameState) return locationId;
    
    // Try to find location in various possible structures
    const locations = this.gameState.locations || this.gameState.location?.locations || [];
    const location = locations.find(l => l.id === locationId);
    return location ? location.name : locationId;
  }

  formatGameTime(gameTime) {
    if (!gameTime && gameTime !== 0) return '00:00';
    const hours = Math.floor(gameTime / 60);
    const minutes = gameTime % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  printSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('GAME SESSION SUMMARY'.center(80));
    console.log('='.repeat(80));
    console.log(`Total Frames: ${this.frameCount}`);
    console.log(`Conversations: ${this.conversationLog.length} lines`);
    console.log(`Actions: ${this.actionLog.length}`);
    console.log(`Combat Encounters: ${this.combatLog.filter(c => c.type === 'started').length}`);
    console.log(`Quests: ${this.questLog.length}`);
    
    if (this.gameState && this.gameState.protagonist) {
      console.log('\nFinal Protagonist State:');
      console.log(`  Name: ${this.gameState.protagonist.name}`);
      console.log(`  Location: ${this.getLocationName(this.gameState.protagonist.currentLocation)}`);
      console.log(`  HP: ${this.gameState.protagonist.stats.hp}/${this.gameState.protagonist.stats.maxHp}`);
      console.log(`  Level: ${this.gameState.protagonist.stats.level || 1}`);
    }
    
    console.log('\nRecent Actions (last 5):');
    this.actionLog.slice(-5).forEach((action, i) => {
      const status = action.success ? '✅' : action.status === 'started' ? '⏳' : '❌';
      console.log(`  ${status} ${action.type}: ${action.description || action.result || 'No description'}`);
    });
    
    if (this.conversationLog.length > 0) {
      console.log('\nRecent Conversations (last 5 lines):');
      this.conversationLog.slice(-5).forEach((line, i) => {
        console.log(`  ${line.speaker}: "${line.text}"`);
      });
    }
    
    if (this.combatLog.length > 0) {
      const combats = this.combatLog.filter(c => c.type === 'started').length;
      const victories = this.combatLog.filter(c => c.type === 'ended' && c.victory).length;
      console.log(`\nCombat Record: ${victories}/${combats} victories`);
    }
    
    console.log('='.repeat(80) + '\n');
  }
}

// Helper for string centering
String.prototype.center = function(width) {
  const padding = Math.max(0, width - this.length);
  const left = Math.floor(padding / 2);
  const right = padding - left;
  return ' '.repeat(left) + this + ' '.repeat(right);
};
