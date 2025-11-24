/**
 * Tests for StandaloneAutonomousGame
 *
 * These tests verify that the autonomous game can run completely
 * standalone without any Electron or UI dependencies.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { StandaloneAutonomousGame } from '../src/services/StandaloneAutonomousGame.js';
import { GameService } from '../src/services/GameService.js';
import { GameSession } from '../src/game/GameSession.js';

describe('StandaloneAutonomousGame', () => {
  let session;
  let gameService;
  let game;

  beforeEach(async () => {
    // Create fresh instances for each test
    session = new GameSession({ seed: 12345 });
    await session.initialize();
    gameService = new GameService(session);
    await gameService.initialize();
  });

  afterEach(() => {
    // Clean up
    if (game && game.isGameRunning()) {
      game.stop();
    }
  });

  describe('Constructor', () => {
    it('should create instance with gameService', () => {
      game = new StandaloneAutonomousGame(gameService);
      expect(game).toBeDefined();
      expect(game.gameService).toBe(gameService);
      expect(game.isRunning).toBe(false);
      expect(game.isPaused).toBe(false);
    });

    it('should throw error without gameService', () => {
      expect(() => {
        new StandaloneAutonomousGame(null);
      }).toThrow('StandaloneAutonomousGame requires a GameService instance');
    });

    it('should accept options', () => {
      game = new StandaloneAutonomousGame(gameService, {
        frameDelay: 500,
        maxFrames: 100,
        seed: 99999,
        timeDeltaMin: 10,
        timeDeltaMax: 20
      });

      expect(game.frameDelay).toBe(500);
      expect(game.maxFrames).toBe(100);
      expect(game.seed).toBe(99999);
      expect(game.timeDeltaMin).toBe(10);
      expect(game.timeDeltaMax).toBe(20);
    });

    it('should use default options', () => {
      game = new StandaloneAutonomousGame(gameService);

      expect(game.frameDelay).toBe(1000);
      expect(game.maxFrames).toBe(Infinity);
      expect(game.timeDeltaMin).toBe(5);
      expect(game.timeDeltaMax).toBe(15);
    });
  });

  describe('Headless Mode', () => {
    it('should run headless without callbacks', async () => {
      game = new StandaloneAutonomousGame(gameService, {
        frameDelay: 10,
        timeDeltaMin: 1,
        timeDeltaMax: 2
      });

      const stats = await game.run(5);

      expect(stats).toBeDefined();
      expect(stats.framesPlayed).toBe(5);
      expect(game.isGameRunning()).toBe(false);
    });

    it('should track frames correctly', async () => {
      game = new StandaloneAutonomousGame(gameService, {
        frameDelay: 10
      });

      const stats = await game.run(10);

      expect(stats.framesPlayed).toBe(10);
      expect(game.getCurrentFrame()).toBe(10);
    });

    it('should generate event history even without callback', async () => {
      game = new StandaloneAutonomousGame(gameService, {
        frameDelay: 10
      });

      await game.run(5);

      const history = game.getEventHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history[0]).toHaveProperty('type');
      expect(history[0]).toHaveProperty('frame');
      expect(history[0]).toHaveProperty('timestamp');
    });
  });

  describe('Event Callbacks', () => {
    it('should call event callback when enabled', async () => {
      const events = [];

      game = new StandaloneAutonomousGame(gameService, {
        enableEventCallback: true,
        eventCallback: (event) => {
          events.push(event);
        },
        frameDelay: 10
      });

      await game.run(3);

      expect(events.length).toBeGreaterThan(0);
      expect(events[0]).toHaveProperty('type');
      expect(events[0]).toHaveProperty('data');
    });

    it('should not call callback when disabled', async () => {
      let callbackCalled = false;

      game = new StandaloneAutonomousGame(gameService, {
        enableEventCallback: false,
        eventCallback: () => {
          callbackCalled = true;
        },
        frameDelay: 10
      });

      await game.run(3);

      expect(callbackCalled).toBe(false);
    });

    it('should emit game lifecycle events', async () => {
      const eventTypes = [];

      game = new StandaloneAutonomousGame(gameService, {
        enableEventCallback: true,
        eventCallback: (event) => {
          eventTypes.push(event.type);
        },
        frameDelay: 10
      });

      await game.run(2);

      expect(eventTypes).toContain('game_started');
      expect(eventTypes).toContain('time_advanced');
      expect(eventTypes).toContain('action_decided');
      expect(eventTypes).toContain('game_ended');
    });
  });

  describe('Pause/Resume', () => {
    it('should pause and resume', async () => {
      game = new StandaloneAutonomousGame(gameService, {
        frameDelay: 50
      });

      const runPromise = game.run(20);

      // Pause after a short delay
      setTimeout(() => {
        game.pause();
        expect(game.isGamePaused()).toBe(true);
      }, 100);

      // Resume after another delay
      setTimeout(() => {
        game.resume();
        expect(game.isGamePaused()).toBe(false);
      }, 300);

      await runPromise;

      expect(game.isGameRunning()).toBe(false);
    });

    it('should emit pause and resume events', async () => {
      const eventTypes = [];

      game = new StandaloneAutonomousGame(gameService, {
        enableEventCallback: true,
        eventCallback: (event) => {
          eventTypes.push(event.type);
        },
        frameDelay: 50
      });

      const runPromise = game.run(20);

      setTimeout(() => game.pause(), 100);
      setTimeout(() => game.resume(), 200);
      setTimeout(() => game.stop(), 300);

      await runPromise;

      expect(eventTypes).toContain('paused');
      expect(eventTypes).toContain('resumed');
    });
  });

  describe('Stop', () => {
    it('should stop game early', async () => {
      game = new StandaloneAutonomousGame(gameService, {
        frameDelay: 50
      });

      const runPromise = game.run(100);

      setTimeout(() => {
        game.stop();
      }, 200);

      const stats = await runPromise;

      expect(stats.framesPlayed).toBeLessThan(100);
      expect(game.isGameRunning()).toBe(false);
    });

    it('should emit stopped event', async () => {
      const eventTypes = [];

      game = new StandaloneAutonomousGame(gameService, {
        enableEventCallback: true,
        eventCallback: (event) => {
          eventTypes.push(event.type);
        },
        frameDelay: 50
      });

      const runPromise = game.run(100);

      setTimeout(() => game.stop(), 100);

      await runPromise;

      expect(eventTypes).toContain('stopped');
    });
  });

  describe('Speed Control', () => {
    it('should set speed multiplier', () => {
      game = new StandaloneAutonomousGame(gameService);

      game.setSpeed(2.0);
      expect(game.getSpeed()).toBe(2.0);

      game.setSpeed(0.5);
      expect(game.getSpeed()).toBe(0.5);
    });

    it('should emit speed_changed event', async () => {
      const events = [];

      game = new StandaloneAutonomousGame(gameService, {
        enableEventCallback: true,
        eventCallback: (event) => {
          if (event.type === 'speed_changed') {
            events.push(event);
          }
        },
        frameDelay: 50
      });

      const runPromise = game.run(20);

      setTimeout(() => game.setSpeed(2.0), 100);

      await runPromise;

      expect(events.length).toBeGreaterThan(0);
      expect(events[0].data.newSpeed).toBe(2.0);
    });

    it('should throw error for invalid speed', () => {
      game = new StandaloneAutonomousGame(gameService);

      expect(() => {
        game.setSpeed(0);
      }).toThrow('Speed multiplier must be a positive number');

      expect(() => {
        game.setSpeed(-1);
      }).toThrow('Speed multiplier must be a positive number');
    });
  });

  describe('Statistics', () => {
    it('should return stats', async () => {
      game = new StandaloneAutonomousGame(gameService, {
        frameDelay: 10
      });

      await game.run(5);

      const stats = game.getStats();

      expect(stats).toHaveProperty('framesPlayed');
      expect(stats).toHaveProperty('eventHistorySize');
      expect(stats).toHaveProperty('isRunning');
      expect(stats).toHaveProperty('isPaused');
      expect(stats.framesPlayed).toBe(5);
    });

    it('should track conversations', async () => {
      game = new StandaloneAutonomousGame(gameService, {
        frameDelay: 10,
        maxTurnsPerConversation: 2
      });

      await game.run(10);

      const stats = game.getStats();

      expect(stats).toHaveProperty('conversationsHeld');
      expect(stats.conversationsHeld).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Event History', () => {
    it('should maintain event history', async () => {
      game = new StandaloneAutonomousGame(gameService, {
        frameDelay: 10
      });

      await game.run(5);

      const history = game.getEventHistory();

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
    });

    it('should return limited history', async () => {
      game = new StandaloneAutonomousGame(gameService, {
        frameDelay: 10
      });

      await game.run(5);

      const fullHistory = game.getEventHistory();
      const limitedHistory = game.getEventHistory(5);

      expect(limitedHistory.length).toBeLessThanOrEqual(5);
      expect(limitedHistory.length).toBeLessThanOrEqual(fullHistory.length);
    });

    it('should trim history when exceeding max size', async () => {
      game = new StandaloneAutonomousGame(gameService, {
        frameDelay: 10
      });

      game.maxEventHistory = 50; // Set a small limit for testing

      await game.run(30);

      const history = game.getEventHistory();

      expect(history.length).toBeLessThanOrEqual(50);
    });
  });

  describe('Integration', () => {
    it('should work with GameService methods', async () => {
      game = new StandaloneAutonomousGame(gameService, {
        frameDelay: 10
      });

      const initialFrame = gameService.getFrame();

      await game.run(5);

      const finalFrame = gameService.getFrame();

      expect(finalFrame).toBeGreaterThan(initialFrame);
    });

    it('should advance game time', async () => {
      game = new StandaloneAutonomousGame(gameService, {
        frameDelay: 10,
        timeDeltaMin: 5,
        timeDeltaMax: 5
      });

      const initialState = gameService.getGameState();
      const initialTime = initialState.time.gameTime;

      await game.run(5);

      const finalState = gameService.getGameState();
      const finalTime = finalState.time.gameTime;

      expect(finalTime).toBeGreaterThan(initialTime);
    });
  });
});
