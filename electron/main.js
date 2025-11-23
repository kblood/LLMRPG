import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { ThemePersistence } from './services/ThemePersistence.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let gameBackend;
let themePersistence;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#1a1a2e',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default'
  });

  // Load the UI
  const htmlPath = path.join(__dirname, '../ui/index.html');
  console.log('[Main] Loading UI from:', htmlPath);
  mainWindow.loadFile(htmlPath);

  // Open DevTools for debugging
  mainWindow.webContents.openDevTools();

  // Log when page finishes loading
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Main] UI finished loading');
  });

  // Log any console messages from renderer
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer] ${message}`);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialize game backend
async function initializeGameBackend() {
  const { GameBackend } = await import('./ipc/GameBackend.js');
  gameBackend = new GameBackend();

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
      const result = await gameBackend.initialize(options);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Main] Failed to initialize game:', error);
      return { success: false, error: error.message };
    }
  });

  // Get NPCs
  ipcMain.handle('game:getNPCs', async () => {
    try {
      const npcs = await gameBackend.getNPCs();
      return { success: true, data: npcs };
    } catch (error) {
      console.error('[Main] Failed to get NPCs:', error);
      return { success: false, error: error.message };
    }
  });

  // Start conversation
  ipcMain.handle('game:startConversation', async (event, npcId) => {
    try {
      const conversation = await gameBackend.startConversation(npcId);
      return { success: true, data: conversation };
    } catch (error) {
      console.error('[Main] Failed to start conversation:', error);
      return { success: false, error: error.message };
    }
  });

  // Send message
  ipcMain.handle('game:sendMessage', async (event, { conversationId, message }) => {
    try {
      const response = await gameBackend.sendMessage(conversationId, message);
      return { success: true, data: response };
    } catch (error) {
      console.error('[Main] Failed to send message:', error);
      return { success: false, error: error.message };
    }
  });

  // End conversation
  ipcMain.handle('game:endConversation', async (event, conversationId) => {
    try {
      await gameBackend.endConversation(conversationId);
      return { success: true };
    } catch (error) {
      console.error('[Main] Failed to end conversation:', error);
      return { success: false, error: error.message };
    }
  });

  // Get game stats
  ipcMain.handle('game:getStats', async () => {
    try {
      const stats = await gameBackend.getStats();
      return { success: true, data: stats };
    } catch (error) {
      console.error('[Main] Failed to get stats:', error);
      return { success: false, error: error.message };
    }
  });

  // Get active quests
  ipcMain.handle('game:getQuests', async () => {
    try {
      const quests = await gameBackend.getQuests();
      return { success: true, data: quests };
    } catch (error) {
      console.error('[Main] Failed to get quests:', error);
      return { success: false, error: error.message };
    }
  });

  // Check Ollama status
  ipcMain.handle('game:checkOllama', async () => {
    try {
      const status = await gameBackend.checkOllama();
      return { success: true, data: status };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Get player stats
  ipcMain.handle('game:getPlayerStats', async () => {
    try {
      const stats = await gameBackend.getPlayerStats();
      return { success: true, data: stats };
    } catch (error) {
      console.error('[Main] Failed to get player stats:', error);
      return { success: false, error: error.message };
    }
  });

  // Start autonomous mode
  ipcMain.handle('game:startAutonomous', async () => {
    try {
      const result = await gameBackend.startAutonomousMode(mainWindow);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Main] Failed to start autonomous mode:', error);
      return { success: false, error: error.message };
    }
  });

  // Stop autonomous mode
  ipcMain.handle('game:stopAutonomous', async () => {
    try {
      const result = await gameBackend.stopAutonomousMode();
      return { success: true, data: result };
    } catch (error) {
      console.error('[Main] Failed to stop autonomous mode:', error);
      return { success: false, error: error.message };
    }
  });

  // Replay operations
  ipcMain.handle('replay:list', async () => {
    try {
      const replays = await gameBackend.listReplays();
      return { success: true, data: replays };
    } catch (error) {
      console.error('[Main] Failed to list replays:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('replay:load', async (event, filename) => {
    try {
      const replay = await gameBackend.loadReplay(filename);
      return { success: true, data: replay };
    } catch (error) {
      console.error('[Main] Failed to load replay:', error);
      return { success: false, error: error.message };
    }
  });

  // Get available Ollama models
  ipcMain.handle('game:getAvailableModels', async () => {
    try {
      const result = await gameBackend.getAvailableModels();
      return result;
    } catch (error) {
      console.error('[Main] Failed to get available models:', error);
      return { success: false, error: error.message };
    }
  });

  // Get available themes
  ipcMain.handle('game:getAvailableThemes', async () => {
    try {
      const result = gameBackend.getAvailableThemes();
      return result;
    } catch (error) {
      console.error('[Main] Failed to get available themes:', error);
      return { success: false, error: error.message };
    }
  });

  // Generate themed world
  ipcMain.handle('game:generateThemedWorld', async (event, config) => {
    try {
      const result = await gameBackend.generateThemedWorld(config);
      return result;
    } catch (error) {
      console.error('[Main] Failed to generate themed world:', error);
      return { success: false, error: error.message };
    }
  });

  // Theme persistence handlers
  ipcMain.handle('theme:save', async (event, themeId, themeData) => {
    try {
      const result = themePersistence.saveTheme(themeId, themeData);
      return result;
    } catch (error) {
      console.error('[Main] Failed to save theme:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('theme:load', async (event, themeId) => {
    try {
      const result = themePersistence.loadTheme(themeId);
      return result;
    } catch (error) {
      console.error('[Main] Failed to load theme:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('theme:list', async (event) => {
    try {
      const result = themePersistence.listThemes();
      return result;
    } catch (error) {
      console.error('[Main] Failed to list themes:', error);
      return { success: false, error: error.message, themes: [] };
    }
  });

  ipcMain.handle('theme:delete', async (event, themeId) => {
    try {
      const result = themePersistence.deleteTheme(themeId);
      return result;
    } catch (error) {
      console.error('[Main] Failed to delete theme:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('theme:exists', async (event, themeId) => {
    try {
      const exists = themePersistence.themeExists(themeId);
      return { success: true, exists };
    } catch (error) {
      console.error('[Main] Failed to check theme:', error);
      return { success: false, error: error.message, exists: false };
    }
  });
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

app.on('will-quit', () => {
  // Cleanup
  if (gameBackend) {
    gameBackend.cleanup();
  }
});

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('[Main] Uncaught exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('[Main] Unhandled rejection:', error);
});
