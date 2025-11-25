import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { ThemePersistence } from './services/ThemePersistence.js';
import { GameBackendIntegrated } from './ipc/GameBackendIntegrated.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let gameBackend;
let themePersistence;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    backgroundColor: '#1a1a2e',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload-integrated.js')
    },
    titleBarStyle: 'default'
  });

  // Load the UI
  const htmlPath = path.join(__dirname, '../ui/index.html');
  console.log('[Main] Loading UI from:', htmlPath);
  mainWindow.loadFile(htmlPath);

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Log when page finishes loading
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Main] UI finished loading');
  });

  mainWindow.on('closed', () => {
    // Cleanup game backend
    if (gameBackend) {
      gameBackend.cleanup();
    }
    mainWindow = null;
  });
}

// Initialize game backend
async function initializeGameBackend() {
  gameBackend = new GameBackendIntegrated();

  // Set UI callback for state updates
  let uiUpdateCount = 0;
  gameBackend.setUICallback((update) => {
    uiUpdateCount++;
    if (uiUpdateCount <= 5 || uiUpdateCount % 10 === 0) {
      console.log(`[Main] Sending UI update #${uiUpdateCount}: ${update.type} ${update.eventType || update.event?.type || ''}`);
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('game:update', update);
    } else {
      console.warn('[Main] Cannot send update - mainWindow is destroyed or null');
    }
  });

  // Initialize theme persistence
  themePersistence = new ThemePersistence();
  console.log('[Main] Theme persistence initialized');

  // Set up IPC handlers
  setupIPCHandlers();

  console.log('[Main] Game backend initialized');
}

function setupIPCHandlers() {
  // Initialize game session
  ipcMain.handle('game:init', async (event, options) => {
    try {
      console.log('[Main] Initializing game with options:', options);
      const result = await gameBackend.initialize(options);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Main] Failed to initialize game:', error);
      return { success: false, error: error.message };
    }
  });

  // Check Ollama availability
  ipcMain.handle('game:checkOllama', async () => {
    try {
      const status = await gameBackend.checkOllama();
      return { success: true, data: status };
    } catch (error) {
      console.error('[Main] Failed to check Ollama:', error);
      return { success: false, error: error.message };
    }
  });

  // Get game status
  ipcMain.handle('game:getStatus', async () => {
    try {
      const status = gameBackend.getStatus();
      return { success: true, data: status };
    } catch (error) {
      console.error('[Main] Failed to get status:', error);
      return { success: false, error: error.message };
    }
  });

  // Get game state
  ipcMain.handle('game:getState', async () => {
    try {
      const state = gameBackend.getGameState();
      return { success: true, data: state };
    } catch (error) {
      console.error('[Main] Failed to get state:', error);
      return { success: false, error: error.message };
    }
  });

  // Get NPCs
  ipcMain.handle('game:getNPCs', async () => {
    try {
      const npcs = gameBackend.getNPCs();
      return { success: true, data: npcs };
    } catch (error) {
      console.error('[Main] Failed to get NPCs:', error);
      return { success: false, error: error.message };
    }
  });

  // Get protagonist
  ipcMain.handle('game:getProtagonist', async () => {
    try {
      const protagonist = gameBackend.getProtagonist();
      return { success: true, data: protagonist };
    } catch (error) {
      console.error('[Main] Failed to get protagonist:', error);
      return { success: false, error: error.message };
    }
  });

  // Start conversation
  ipcMain.handle('game:startConversation', async (event, npcId, options) => {
    try {
      const conversation = await gameBackend.startConversation(npcId, options);
      return { success: true, data: conversation };
    } catch (error) {
      console.error('[Main] Failed to start conversation:', error);
      return { success: false, error: error.message };
    }
  });

  // Send message
  ipcMain.handle('game:sendMessage', async (event, conversationId, text, options) => {
    try {
      const result = await gameBackend.sendMessage(conversationId, text, options);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Main] Failed to send message:', error);
      return { success: false, error: error.message };
    }
  });

  // End conversation
  ipcMain.handle('game:endConversation', async (event, conversationId) => {
    try {
      const result = await gameBackend.endConversation(conversationId);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Main] Failed to end conversation:', error);
      return { success: false, error: error.message };
    }
  });

  // Execute action
  ipcMain.handle('game:executeAction', async (event, action) => {
    try {
      const result = await gameBackend.executeAction(action);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Main] Failed to execute action:', error);
      return { success: false, error: error.message };
    }
  });

  // Advance time
  ipcMain.handle('game:tick', async (event, minutes) => {
    try {
      const result = gameBackend.tick(minutes);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Main] Failed to tick:', error);
      return { success: false, error: error.message };
    }
  });

  // Autonomous mode controls
  ipcMain.handle('game:startAutonomous', async (event, options) => {
    try {
      const result = await gameBackend.startAutonomousMode(options);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Main] Failed to start autonomous mode:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('game:stopAutonomous', async () => {
    try {
      const result = gameBackend.stopAutonomousMode();
      return { success: true, data: result };
    } catch (error) {
      console.error('[Main] Failed to stop autonomous mode:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('game:pauseAutonomous', async () => {
    try {
      const result = gameBackend.pauseAutonomousMode();
      return { success: true, data: result };
    } catch (error) {
      console.error('[Main] Failed to pause autonomous mode:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('game:resumeAutonomous', async () => {
    try {
      const result = gameBackend.resumeAutonomousMode();
      return { success: true, data: result };
    } catch (error) {
      console.error('[Main] Failed to resume autonomous mode:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('game:getAutonomousStatus', async () => {
    try {
      const status = gameBackend.getAutonomousStatus();
      return { success: true, data: status };
    } catch (error) {
      console.error('[Main] Failed to get autonomous status:', error);
      return { success: false, error: error.message };
    }
  });

  // Save replay
  ipcMain.handle('game:saveReplay', async (event, filename) => {
    try {
      const result = await gameBackend.saveReplay(filename);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Main] Failed to save replay:', error);
      return { success: false, error: error.message };
    }
  });

  // Theme persistence
  ipcMain.handle('theme:load', async () => {
    try {
      const theme = await themePersistence.load();
      return { success: true, data: theme };
    } catch (error) {
      console.error('[Main] Failed to load theme:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('theme:save', async (event, theme) => {
    try {
      await themePersistence.save(theme);
      return { success: true };
    } catch (error) {
      console.error('[Main] Failed to save theme:', error);
      return { success: false, error: error.message };
    }
  });

  console.log('[Main] IPC handlers registered');
}

// App lifecycle
app.whenReady().then(async () => {
  await initializeGameBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('[Main] Unhandled rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('[Main] Uncaught exception:', error);
});
