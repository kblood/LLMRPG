const { contextBridge, ipcRenderer } = require('electron');

console.log('[Preload] Starting preload script (Integrated Architecture)...');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('gameAPI', {
  // ============================================================================
  // GAME INITIALIZATION & STATUS
  // ============================================================================
  
  init: (options) => ipcRenderer.invoke('game:init', options),
  getStatus: () => ipcRenderer.invoke('game:getStatus'),
  getState: () => ipcRenderer.invoke('game:getState'),
  checkOllama: () => ipcRenderer.invoke('game:checkOllama'),

  // ============================================================================
  // CHARACTERS
  // ============================================================================
  
  getNPCs: () => ipcRenderer.invoke('game:getNPCs'),
  getProtagonist: () => ipcRenderer.invoke('game:getProtagonist'),

  // ============================================================================
  // CONVERSATIONS
  // ============================================================================
  
  startConversation: (npcId, options) => ipcRenderer.invoke('game:startConversation', npcId, options),
  sendMessage: (conversationId, text, options) => ipcRenderer.invoke('game:sendMessage', conversationId, text, options),
  endConversation: (conversationId) => ipcRenderer.invoke('game:endConversation', conversationId),

  // ============================================================================
  // ACTIONS & TIME
  // ============================================================================
  
  executeAction: (action) => ipcRenderer.invoke('game:executeAction', action),
  tick: (minutes) => ipcRenderer.invoke('game:tick', minutes),

  // ============================================================================
  // AUTONOMOUS MODE
  // ============================================================================
  
  startAutonomous: (options) => ipcRenderer.invoke('game:startAutonomous', options),
  stopAutonomous: () => ipcRenderer.invoke('game:stopAutonomous'),
  pauseAutonomous: () => ipcRenderer.invoke('game:pauseAutonomous'),
  resumeAutonomous: () => ipcRenderer.invoke('game:resumeAutonomous'),
  getAutonomousStatus: () => ipcRenderer.invoke('game:getAutonomousStatus'),

  // ============================================================================
  // REPLAY SYSTEM
  // ============================================================================
  
  saveReplay: (filename) => ipcRenderer.invoke('game:saveReplay', filename),
  listReplays: () => ipcRenderer.invoke('game:listReplays'),
  loadReplay: (filename) => ipcRenderer.invoke('game:loadReplay', filename),
  continueFromReplay: (filename, frameIndex) => ipcRenderer.invoke('game:continueFromReplay', filename, frameIndex),

  // ============================================================================
  // THEME PERSISTENCE
  // ============================================================================
  
  loadTheme: () => ipcRenderer.invoke('theme:load'),
  saveTheme: (theme) => ipcRenderer.invoke('theme:save', theme),

  // ============================================================================
  // EVENT LISTENERS - STATE UPDATES
  // ============================================================================
  
  /**
   * Listen for game state updates
   * Called whenever the game state changes
   */
  onGameUpdate: (callback) => {
    console.log('[Preload] Setting up onGameUpdate listener');
    const handler = (event, update) => {
      console.log('[Preload] Received game:update event:', update?.type, update?.eventType);
      callback(update);
    };
    ipcRenderer.on('game:update', handler);
    console.log('[Preload] onGameUpdate listener registered');
    return () => ipcRenderer.removeListener('game:update', handler);
  },

  // ============================================================================
  // LEGACY EVENT LISTENERS (For backward compatibility)
  // ============================================================================
  
  onGameEvent: (callback) => {
    ipcRenderer.on('game:event', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('game:event');
  },

  onNarration: (callback) => {
    ipcRenderer.on('game:narration', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('game:narration');
  },

  onTimeUpdate: (callback) => {
    ipcRenderer.on('game:time-update', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('game:time-update');
  },

  onWorldGenerated: (callback) => {
    ipcRenderer.on('autonomous:world-generated', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('autonomous:world-generated');
  },

  onOpeningNarration: (callback) => {
    ipcRenderer.on('autonomous:opening-narration', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('autonomous:opening-narration');
  },

  onMainQuest: (callback) => {
    ipcRenderer.on('autonomous:main-quest', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('autonomous:main-quest');
  },

  onTransition: (callback) => {
    ipcRenderer.on('autonomous:transition', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('autonomous:transition');
  },

  onAutonomousActionDecision: (callback) => {
    ipcRenderer.on('autonomous:action_decision', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('autonomous:action_decision');
  },

  onAutonomousAction: (callback) => {
    ipcRenderer.on('autonomous:action', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('autonomous:action');
  },

  onAutonomousActionResult: (callback) => {
    ipcRenderer.on('autonomous:action_result', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('autonomous:action_result');
  },

  onAutonomousCombatEncounter: (callback) => {
    ipcRenderer.on('autonomous:combat_encounter', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('autonomous:combat_encounter');
  },

  onAutonomousCombatResult: (callback) => {
    ipcRenderer.on('autonomous:combat_result', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('autonomous:combat_result');
  },

  onAutonomousConversationStart: (callback) => {
    ipcRenderer.on('autonomous:conversation_start', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('autonomous:conversation_start');
  },

  onAutonomousMessage: (callback) => {
    ipcRenderer.on('autonomous:message', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('autonomous:message');
  },

  onAutonomousDialogueLine: (callback) => {
    ipcRenderer.on('autonomous:dialogue_line', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('autonomous:dialogue_line');
  },

  onAutonomousConversationEnd: (callback) => {
    ipcRenderer.on('autonomous:conversation_end', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('autonomous:conversation_end');
  },

  onAutonomousError: (callback) => {
    ipcRenderer.on('autonomous:error', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('autonomous:error');
  },

  onAutonomousChronicler: (callback) => {
    ipcRenderer.on('autonomous:chronicler', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('autonomous:chronicler');
  },

  onVictory: (callback) => {
    ipcRenderer.on('game:victory', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('game:victory');
  },

  onReplaySaved: (callback) => {
    ipcRenderer.on('replay:saved', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('replay:saved');
  }
});

console.log('[Preload] Game API exposed to renderer (Integrated Architecture)');
