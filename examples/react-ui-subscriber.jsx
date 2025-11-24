/**
 * React UI Subscriber Example - StatePublisher Integration
 *
 * This file demonstrates how to integrate StatePublisher with React
 * to create a responsive, real-time game UI that receives push updates
 * without driving the game loop.
 *
 * Key Features:
 * - React hooks integration
 * - Automatic subscription lifecycle management
 * - Multiple component types (HUD, dialogue, quest log)
 * - Event notifications
 * - Performance-optimized rendering
 *
 * Usage:
 * import { GameStateProvider, useGameState } from './react-ui-subscriber.jsx';
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { statePublisher, EVENT_TYPES } from '../src/services/StatePublisher.js';

// ============================================================================
// Context for Game State
// ============================================================================

const GameStateContext = createContext(null);

/**
 * Provider component that subscribes to StatePublisher
 * Wraps your app to provide game state to all child components
 */
export function GameStateProvider({ children }) {
  const [gameState, setGameState] = useState(null);
  const [lastEventType, setLastEventType] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Create subscriber
    const subscriber = {
      id: 'react-ui-provider',

      onStateUpdate: (state, eventType, metadata) => {
        setGameState(state);
        setLastEventType(eventType);

        // Add notification for important events
        if ([
          EVENT_TYPES.QUEST_CREATED,
          EVENT_TYPES.QUEST_COMPLETED,
          EVENT_TYPES.COMBAT_STARTED,
          EVENT_TYPES.LOCATION_DISCOVERED
        ].includes(eventType)) {
          addNotification(eventType, metadata);
        }
      },

      onGameEvent: (event) => {
        // Handle custom events
        if (event.type === 'custom_notification') {
          addNotification('custom', event);
        }
      }
    };

    // Subscribe
    const subscriberId = statePublisher.subscribe(subscriber);
    setIsConnected(true);

    // Cleanup on unmount
    return () => {
      statePublisher.unsubscribe(subscriberId);
      setIsConnected(false);
    };
  }, []);

  const addNotification = useCallback((type, data) => {
    const notification = {
      id: Date.now(),
      type,
      data,
      timestamp: Date.now()
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  }, []);

  const clearNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const value = {
    gameState,
    lastEventType,
    notifications,
    isConnected,
    clearNotification
  };

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
}

/**
 * Hook to access game state in any component
 */
export function useGameState() {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within GameStateProvider');
  }
  return context;
}

// ============================================================================
// Example Components
// ============================================================================

/**
 * Simple HUD component showing basic game info
 */
export function GameHUD() {
  const { gameState, lastEventType, isConnected } = useGameState();

  if (!gameState) {
    return (
      <div className="game-hud loading">
        <p>Waiting for game state...</p>
      </div>
    );
  }

  const { time, frame, location, characters, system } = gameState;

  return (
    <div className="game-hud">
      <div className="hud-header">
        <h2>Game HUD</h2>
        <span className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '● Connected' : '○ Disconnected'}
        </span>
      </div>

      <div className="hud-content">
        {/* Time and Frame */}
        <div className="hud-section">
          <h3>Time</h3>
          <p>Frame: {frame}</p>
          <p>Game Time: {time.gameTimeString}</p>
          <p>Day: {time.day}, {time.season}, Year {time.year}</p>
          <p>Time of Day: {time.timeOfDay}</p>
          <p>Weather: {time.weather}</p>
        </div>

        {/* Location */}
        <div className="hud-section">
          <h3>Location</h3>
          <p>Current: {location.current || 'Unknown'}</p>
          <p>Discovered: {location.discovered.length}</p>
          <p>Visited: {location.visited.length}</p>
        </div>

        {/* Characters */}
        <div className="hud-section">
          <h3>Characters</h3>
          <p>NPCs: {characters.npcs.length}</p>
          <p>At Location: {characters.atLocation.length}</p>
        </div>

        {/* System */}
        <div className="hud-section">
          <h3>System</h3>
          <p>Status: {system.paused ? 'Paused' : 'Running'}</p>
          <p>Last Event: {lastEventType}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Dialogue display component
 */
export function DialogueDisplay() {
  const { gameState, lastEventType } = useGameState();
  const [dialogueHistory, setDialogueHistory] = useState([]);

  useEffect(() => {
    if (!gameState) return;

    // Update dialogue history on new lines
    if (lastEventType === EVENT_TYPES.DIALOGUE_LINE) {
      const activeConversations = gameState.dialogue.activeConversations || [];
      if (activeConversations.length > 0) {
        const conversation = activeConversations[0];
        if (conversation.history) {
          setDialogueHistory(conversation.history);
        }
      }
    }

    // Clear on conversation end
    if (lastEventType === EVENT_TYPES.DIALOGUE_ENDED) {
      setTimeout(() => setDialogueHistory([]), 2000);
    }
  }, [gameState, lastEventType]);

  if (!gameState || dialogueHistory.length === 0) {
    return null;
  }

  return (
    <div className="dialogue-display">
      <h3>Conversation</h3>
      <div className="dialogue-history">
        {dialogueHistory.map((line, index) => (
          <div key={index} className={`dialogue-line ${line.speaker === 'player' ? 'player' : 'npc'}`}>
            <strong>{line.speaker}:</strong> {line.text}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Quest log component
 */
export function QuestLog() {
  const { gameState } = useGameState();

  if (!gameState || !gameState.quests) {
    return null;
  }

  const { active } = gameState.quests;

  return (
    <div className="quest-log">
      <h3>Active Quests ({active.length})</h3>
      {active.length === 0 ? (
        <p className="no-quests">No active quests</p>
      ) : (
        <ul className="quest-list">
          {active.map(quest => (
            <li key={quest.id} className={`quest-item ${quest.isMainQuest ? 'main-quest' : ''}`}>
              <h4>{quest.title}</h4>
              <p>{quest.description}</p>
              <span className="quest-status">{quest.status}</span>
              {quest.isMainQuest && <span className="badge">Main Quest</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Notification system
 */
export function NotificationSystem() {
  const { notifications, clearNotification } = useGameState();

  return (
    <div className="notification-system">
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          notification={notification}
          onClose={() => clearNotification(notification.id)}
        />
      ))}
    </div>
  );
}

function Notification({ notification, onClose }) {
  const { type, data } = notification;

  const getMessage = () => {
    switch (type) {
      case EVENT_TYPES.QUEST_CREATED:
        return `New Quest: ${data.questTitle || 'Unknown'}`;
      case EVENT_TYPES.QUEST_COMPLETED:
        return `Quest Completed!`;
      case EVENT_TYPES.COMBAT_STARTED:
        return `Combat Started!`;
      case EVENT_TYPES.LOCATION_DISCOVERED:
        return `New Location Discovered!`;
      default:
        return `Event: ${type}`;
    }
  };

  return (
    <div className={`notification ${type}`}>
      <span className="notification-message">{getMessage()}</span>
      <button className="notification-close" onClick={onClose}>×</button>
    </div>
  );
}

/**
 * Character list component
 */
export function CharacterList() {
  const { gameState } = useGameState();

  if (!gameState || !gameState.characters) {
    return null;
  }

  const { protagonist, npcs, atLocation } = gameState.characters;

  return (
    <div className="character-list">
      <h3>Characters</h3>

      {protagonist && (
        <div className="character-section">
          <h4>Protagonist</h4>
          <CharacterCard character={protagonist} />
        </div>
      )}

      <div className="character-section">
        <h4>Characters at Location ({atLocation.length})</h4>
        {atLocation.length === 0 ? (
          <p>No one here</p>
        ) : (
          atLocation.map(char => (
            <CharacterCard key={char.id} character={char} />
          ))
        )}
      </div>
    </div>
  );
}

function CharacterCard({ character }) {
  return (
    <div className="character-card">
      <h5>{character.name}</h5>
      <p className="character-role">{character.role || 'Unknown'}</p>
      {character.stats && (
        <div className="character-stats">
          <span>Level {character.stats.level}</span>
          <span>HP: {character.stats.hp}/{character.stats.maxHP}</span>
        </div>
      )}
      {character.state && (
        <p className="character-state">{character.state.emotionalState}</p>
      )}
    </div>
  );
}

/**
 * Performance monitor component
 */
export function PerformanceMonitor() {
  const { gameState } = useGameState();
  const [fps, setFps] = useState(0);
  const [frameCount, setFrameCount] = useState(0);

  useEffect(() => {
    if (!gameState) return;

    const startTime = Date.now();
    let frames = 0;

    const interval = setInterval(() => {
      frames++;
      setFrameCount(frames);
      const elapsed = (Date.now() - startTime) / 1000;
      setFps((frames / elapsed).toFixed(2));
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState]);

  if (!gameState) return null;

  return (
    <div className="performance-monitor">
      <h4>Performance</h4>
      <p>Frames: {frameCount}</p>
      <p>FPS: {fps}</p>
      <p>Current Frame: {gameState.frame}</p>
    </div>
  );
}

// ============================================================================
// Complete Game UI Example
// ============================================================================

/**
 * Full game UI component combining all pieces
 */
export function GameUI() {
  return (
    <GameStateProvider>
      <div className="game-ui">
        <header className="game-header">
          <h1>LLMRPG</h1>
          <PerformanceMonitor />
        </header>

        <div className="game-layout">
          <aside className="sidebar-left">
            <GameHUD />
          </aside>

          <main className="game-main">
            <DialogueDisplay />
            <CharacterList />
          </main>

          <aside className="sidebar-right">
            <QuestLog />
          </aside>
        </div>

        <NotificationSystem />
      </div>
    </GameStateProvider>
  );
}

// ============================================================================
// Custom Hooks
// ============================================================================

/**
 * Hook to get only specific state slice
 * Optimizes re-renders by only updating when relevant data changes
 */
export function useGameStateSlice(selector) {
  const { gameState } = useGameState();
  return useMemo(() => selector(gameState), [gameState, selector]);
}

/**
 * Example: Only get time data
 */
export function useGameTime() {
  return useGameStateSlice(state => state?.time);
}

/**
 * Example: Only get character data
 */
export function useCharacters() {
  return useGameStateSlice(state => state?.characters);
}

/**
 * Example: Only get quest data
 */
export function useQuests() {
  return useGameStateSlice(state => state?.quests);
}

/**
 * Hook to listen for specific event types
 */
export function useGameEvent(eventType, callback) {
  const { lastEventType, gameState } = useGameState();

  useEffect(() => {
    if (lastEventType === eventType) {
      callback(gameState);
    }
  }, [lastEventType, eventType, callback, gameState]);
}

// ============================================================================
// Example CSS (as string for reference)
// ============================================================================

export const EXAMPLE_CSS = `
.game-ui {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1a1a1a;
  color: #e0e0e0;
}

.game-header {
  background: #2a2a2a;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #3a3a3a;
}

.game-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar-left, .sidebar-right {
  width: 300px;
  background: #252525;
  padding: 1rem;
  overflow-y: auto;
}

.game-main {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.game-hud {
  background: #2a2a2a;
  border-radius: 8px;
  padding: 1rem;
}

.hud-section {
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: #1f1f1f;
  border-radius: 4px;
}

.status.connected {
  color: #4caf50;
}

.dialogue-display {
  background: #2a2a2a;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.dialogue-line {
  padding: 0.5rem;
  margin: 0.5rem 0;
  border-left: 3px solid #4caf50;
  background: #1f1f1f;
}

.dialogue-line.player {
  border-left-color: #2196f3;
}

.quest-log {
  background: #2a2a2a;
  border-radius: 8px;
  padding: 1rem;
}

.quest-item {
  background: #1f1f1f;
  padding: 1rem;
  margin: 0.5rem 0;
  border-radius: 4px;
  border-left: 3px solid #ff9800;
}

.quest-item.main-quest {
  border-left-color: #f44336;
}

.notification-system {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
}

.notification {
  background: #2196f3;
  color: white;
  padding: 1rem;
  margin-bottom: 0.5rem;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-width: 300px;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.character-card {
  background: #1f1f1f;
  padding: 1rem;
  margin: 0.5rem 0;
  border-radius: 4px;
}

.performance-monitor {
  font-size: 0.9rem;
  background: #1f1f1f;
  padding: 0.5rem 1rem;
  border-radius: 4px;
}
`;

// ============================================================================
// Usage Example
// ============================================================================

export const USAGE_EXAMPLE = `
// In your main app file:
import React from 'react';
import ReactDOM from 'react-dom';
import { GameUI } from './examples/react-ui-subscriber.jsx';

// Start your game
import { GameService } from './src/services/GameService.js';
import { StandaloneAutonomousGame } from './src/services/StandaloneAutonomousGame.js';

async function startGame() {
  const gameService = new GameService(gameSession);
  await gameService.initialize();

  const game = new StandaloneAutonomousGame(gameService);
  game.run(); // Game runs independently
}

// Render UI
ReactDOM.render(<GameUI />, document.getElementById('root'));

// Start game (UI will automatically update)
startGame();
`;

export default GameUI;
