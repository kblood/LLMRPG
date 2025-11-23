const { contextBridge, ipcRenderer } = require('electron');

console.log('[Preload] Starting preload script...');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('gameAPI', {
  // Initialize game
  init: (options) => ipcRenderer.invoke('game:init', options),

  // NPC operations
  getNPCs: () => ipcRenderer.invoke('game:getNPCs'),

  // Conversation operations
  startConversation: (npcId) => ipcRenderer.invoke('game:startConversation', npcId),
  sendMessage: (conversationId, message) => ipcRenderer.invoke('game:sendMessage', { conversationId, message }),
  endConversation: (conversationId) => ipcRenderer.invoke('game:endConversation', conversationId),

  // Game state
  getStats: () => ipcRenderer.invoke('game:getStats'),
  getQuests: () => ipcRenderer.invoke('game:getQuests'),
  getPlayerStats: () => ipcRenderer.invoke('game:getPlayerStats'),

  // System
  checkOllama: () => ipcRenderer.invoke('game:checkOllama'),

  // Autonomous mode
  startAutonomous: () => ipcRenderer.invoke('game:startAutonomous'),
  stopAutonomous: () => ipcRenderer.invoke('game:stopAutonomous'),

  // Replay operations
  listReplays: () => ipcRenderer.invoke('replay:list'),
  loadReplay: (filename) => ipcRenderer.invoke('replay:load', filename),

  // Event listeners
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

  // Autonomous mode event listeners
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
    ipcRenderer.on('autonomous:action-decision', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('autonomous:action-decision');
  },

  onAutonomousAction: (callback) => {
    ipcRenderer.on('autonomous:action', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('autonomous:action');
  },

  onAutonomousActionResult: (callback) => {
    ipcRenderer.on('autonomous:action-result', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('autonomous:action-result');
  },

  onAutonomousCombatEncounter: (callback) => {
    ipcRenderer.on('autonomous:combat-encounter', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('autonomous:combat-encounter');
  },

  onAutonomousCombatResult: (callback) => {
    ipcRenderer.on('autonomous:combat-result', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('autonomous:combat-result');
  },

  onAutonomousConversationStart: (callback) => {
    ipcRenderer.on('autonomous:conversation-start', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('autonomous:conversation-start');
  },

  onAutonomousMessage: (callback) => {
    ipcRenderer.on('autonomous:message', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('autonomous:message');
  },

  onAutonomousConversationEnd: (callback) => {
    ipcRenderer.on('autonomous:conversation-end', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('autonomous:conversation-end');
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

  // Replay event listeners
  onReplaySaved: (callback) => {
    ipcRenderer.on('replay:saved', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('replay:saved');
  },

  // Theme and LLM management
  getAvailableModels: () => ipcRenderer.invoke('game:getAvailableModels'),
  getAvailableThemes: () => ipcRenderer.invoke('game:getAvailableThemes'),
  generateThemedWorld: (config) => ipcRenderer.invoke('game:generateThemedWorld', config),

  // Theme persistence
  saveTheme: (themeId, themeData) => ipcRenderer.invoke('theme:save', themeId, themeData),
  loadTheme: (themeId) => ipcRenderer.invoke('theme:load', themeId),
  listThemes: () => ipcRenderer.invoke('theme:list'),
  deleteTheme: (themeId) => ipcRenderer.invoke('theme:delete', themeId),
  themeExists: (themeId) => ipcRenderer.invoke('theme:exists', themeId)
});

console.log('[Preload] Game API exposed to renderer');
