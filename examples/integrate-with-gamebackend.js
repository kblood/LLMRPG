/**
 * Integration Example: Using StandaloneAutonomousGame with existing GameBackend
 *
 * This example shows how to integrate the new StandaloneAutonomousGame
 * with the existing Electron-based GameBackend, maintaining backward
 * compatibility while gaining all the benefits of the standalone system.
 */

import { StandaloneAutonomousGame } from '../src/services/StandaloneAutonomousGame.js';

/**
 * Example integration with GameBackend
 *
 * This shows how to refactor the existing GameBackend.startAutonomousMode()
 * to use the new StandaloneAutonomousGame instead of AutonomousGameService.
 */
class ModernGameBackend {
  constructor(mainWindow, gameService) {
    this.mainWindow = mainWindow;
    this.gameService = gameService;
    this.autonomousGame = null;
  }

  /**
   * Start autonomous mode using StandaloneAutonomousGame
   *
   * This replaces the old AutonomousGameService-based implementation
   * with the new standalone system.
   */
  async startAutonomousMode() {
    if (this.autonomousGame && this.autonomousGame.isGameRunning()) {
      console.warn('[GameBackend] Autonomous mode already running');
      return;
    }

    console.log('[GameBackend] Starting autonomous mode with StandaloneAutonomousGame...');

    // Create the standalone autonomous game
    this.autonomousGame = new StandaloneAutonomousGame(this.gameService, {
      // Enable event callbacks to send to UI
      enableEventCallback: true,

      // Forward all events to Electron renderer
      eventCallback: (event) => {
        this._handleAutonomousEvent(event);
      },

      // Configuration
      frameDelay: 1000,
      maxTurnsPerConversation: 10,
      pauseBetweenTurns: 2000,
      pauseBetweenConversations: 3000,
      pauseBetweenActions: 2000
    });

    // Start the game loop
    try {
      const stats = await this.autonomousGame.run();

      console.log('[GameBackend] Autonomous mode completed');
      console.log('[GameBackend] Final stats:', stats);

      // Notify UI of completion
      this.mainWindow.webContents.send('autonomous-completed', stats);
    } catch (error) {
      console.error('[GameBackend] Autonomous mode error:', error);
      this.mainWindow.webContents.send('autonomous-error', {
        message: error.message,
        stack: error.stack
      });
    } finally {
      this.autonomousGame = null;
    }
  }

  /**
   * Handle autonomous events and forward to UI
   * @private
   */
  _handleAutonomousEvent(event) {
    // Map new event format to old IPC format for backward compatibility
    switch (event.type) {
      case 'time_advanced':
        this.mainWindow.webContents.send('time-update', event.data.time);
        break;

      case 'action_decided':
        this.mainWindow.webContents.send('action-decision', {
          type: event.data.action,
          reason: event.data.reason,
          iteration: event.frame
        });
        break;

      case 'conversation_started':
        this.mainWindow.webContents.send('npc-chosen', {
          npcId: event.data.npcId,
          npcName: event.data.npcName,
          playerLocation: event.data.location
        });
        break;

      case 'dialogue_line':
        this.mainWindow.webContents.send('dialogue-line', {
          speakerId: event.data.speakerId,
          speakerName: event.data.speakerName,
          text: event.data.text,
          turn: event.data.turn
        });
        break;

      case 'conversation_ended':
        this.mainWindow.webContents.send('conversation-ended', {
          conversationId: event.data.conversationId,
          npcId: event.data.npcId,
          npcName: event.data.npcName,
          turns: event.data.turns
        });
        break;

      case 'combat_started':
        this.mainWindow.webContents.send('combat-encounter', event.data);
        break;

      case 'combat_ended':
        this.mainWindow.webContents.send('combat-result', event.data);
        break;

      case 'victory':
        this.mainWindow.webContents.send('victory', event.data);
        break;

      case 'error':
        this.mainWindow.webContents.send('error', event.data);
        break;

      case 'paused':
        this.mainWindow.webContents.send('autonomous-paused');
        break;

      case 'resumed':
        this.mainWindow.webContents.send('autonomous-resumed');
        break;

      default:
        // Forward all other events with autonomous prefix
        this.mainWindow.webContents.send(`autonomous-${event.type}`, event.data);
    }

    // Also send raw event for advanced UIs
    this.mainWindow.webContents.send('autonomous-event', event);
  }

  /**
   * Pause autonomous mode
   */
  pauseAutonomousMode() {
    if (!this.autonomousGame) {
      console.warn('[GameBackend] No autonomous game running');
      return;
    }

    console.log('[GameBackend] Pausing autonomous mode...');
    this.autonomousGame.pause();
  }

  /**
   * Resume autonomous mode
   */
  resumeAutonomousMode() {
    if (!this.autonomousGame) {
      console.warn('[GameBackend] No autonomous game running');
      return;
    }

    console.log('[GameBackend] Resuming autonomous mode...');
    this.autonomousGame.resume();
  }

  /**
   * Stop autonomous mode
   */
  stopAutonomousMode() {
    if (!this.autonomousGame) {
      console.warn('[GameBackend] No autonomous game running');
      return;
    }

    console.log('[GameBackend] Stopping autonomous mode...');
    this.autonomousGame.stop();
    this.autonomousGame = null;
  }

  /**
   * Set autonomous game speed
   * @param {number} multiplier - Speed multiplier (0.5x, 1x, 2x, etc.)
   */
  setAutonomousSpeed(multiplier) {
    if (!this.autonomousGame) {
      console.warn('[GameBackend] No autonomous game running');
      return;
    }

    console.log(`[GameBackend] Setting autonomous speed to ${multiplier}x...`);
    this.autonomousGame.setSpeed(multiplier);
  }

  /**
   * Get autonomous game statistics
   * @returns {Object|null} Stats or null if not running
   */
  getAutonomousStats() {
    if (!this.autonomousGame) {
      return null;
    }

    return this.autonomousGame.getStats();
  }

  /**
   * Check if autonomous mode is running
   * @returns {boolean}
   */
  isAutonomousRunning() {
    return this.autonomousGame ? this.autonomousGame.isGameRunning() : false;
  }

  /**
   * Check if autonomous mode is paused
   * @returns {boolean}
   */
  isAutonomousPaused() {
    return this.autonomousGame ? this.autonomousGame.isGamePaused() : false;
  }
}

/**
 * Example IPC Handler Setup
 *
 * Shows how to set up IPC handlers in the main Electron process
 */
function setupAutonomousIPC(ipcMain, gameBackend) {
  // Start autonomous mode
  ipcMain.handle('start-autonomous-mode', async () => {
    await gameBackend.startAutonomousMode();
    return { success: true };
  });

  // Pause autonomous mode
  ipcMain.handle('pause-autonomous-mode', () => {
    gameBackend.pauseAutonomousMode();
    return { success: true };
  });

  // Resume autonomous mode
  ipcMain.handle('resume-autonomous-mode', () => {
    gameBackend.resumeAutonomousMode();
    return { success: true };
  });

  // Stop autonomous mode
  ipcMain.handle('stop-autonomous-mode', () => {
    gameBackend.stopAutonomousMode();
    return { success: true };
  });

  // Set speed
  ipcMain.handle('set-autonomous-speed', (event, multiplier) => {
    gameBackend.setAutonomousSpeed(multiplier);
    return { success: true };
  });

  // Get stats
  ipcMain.handle('get-autonomous-stats', () => {
    return gameBackend.getAutonomousStats();
  });

  // Check status
  ipcMain.handle('is-autonomous-running', () => {
    return {
      isRunning: gameBackend.isAutonomousRunning(),
      isPaused: gameBackend.isAutonomousPaused()
    };
  });
}

/**
 * Example renderer-side usage (React component)
 *
 * Shows how the UI can interact with autonomous mode
 */
const exampleReactComponent = `
import React, { useState, useEffect } from 'react';

function AutonomousControls() {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Listen for events
    window.electron.on('autonomous-event', (event) => {
      console.log('Autonomous event:', event);
    });

    window.electron.on('dialogue-line', (data) => {
      console.log(\`\${data.speakerName}: \${data.text}\`);
    });

    return () => {
      // Cleanup listeners
    };
  }, []);

  const handleStart = async () => {
    await window.electron.invoke('start-autonomous-mode');
    setIsRunning(true);
  };

  const handlePause = async () => {
    await window.electron.invoke('pause-autonomous-mode');
    setIsPaused(true);
  };

  const handleResume = async () => {
    await window.electron.invoke('resume-autonomous-mode');
    setIsPaused(false);
  };

  const handleStop = async () => {
    await window.electron.invoke('stop-autonomous-mode');
    setIsRunning(false);
    setIsPaused(false);
  };

  const handleSpeedChange = async (newSpeed) => {
    await window.electron.invoke('set-autonomous-speed', newSpeed);
    setSpeed(newSpeed);
  };

  return (
    <div className="autonomous-controls">
      <h3>Autonomous Mode</h3>

      {!isRunning ? (
        <button onClick={handleStart}>Start</button>
      ) : (
        <>
          {isPaused ? (
            <button onClick={handleResume}>Resume</button>
          ) : (
            <button onClick={handlePause}>Pause</button>
          )}
          <button onClick={handleStop}>Stop</button>

          <div className="speed-control">
            <label>Speed: {speed}x</label>
            <input
              type="range"
              min="0.5"
              max="4"
              step="0.5"
              value={speed}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
            />
          </div>
        </>
      )}
    </div>
  );
}
`;

export {
  ModernGameBackend,
  setupAutonomousIPC,
  exampleReactComponent
};

// Usage example
console.log(`
Integration Example: StandaloneAutonomousGame with GameBackend

Benefits of this integration:
✅ No tight coupling to Electron
✅ Can be tested independently
✅ Full event history available
✅ Speed control built-in
✅ Clean pause/resume/stop
✅ Backward compatible with existing IPC

To integrate:
1. Replace AutonomousGameService with StandaloneAutonomousGame
2. Map events to existing IPC messages
3. Add new control methods (speed, stats)
4. Enjoy improved testability and flexibility!
`);
