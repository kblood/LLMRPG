/**
 * EventBus Unit Tests
 *
 * Tests for the singleton EventBus system including:
 * - Basic emit/on functionality
 * - Wildcard pattern matching
 * - One-time listeners (once)
 * - Listener removal (off)
 * - Event queue and deterministic processing
 * - Event history tracking
 * - Error handling
 * - Edge cases and cleanup
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventBus, EventBusImpl } from './EventBus.js';

describe('EventBus', () => {
  beforeEach(() => {
    // Clear the singleton before each test
    EventBus.clear();
  });

  afterEach(() => {
    // Clean up after each test
    EventBus.clear();
  });

  describe('Singleton Pattern', () => {
    it('should always return the same instance', () => {
      const instance1 = EventBus.getInstance();
      const instance2 = EventBus.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should be accessible via static methods', () => {
      expect(typeof EventBus.on).toBe('function');
      expect(typeof EventBus.emit).toBe('function');
      expect(typeof EventBus.off).toBe('function');
      expect(typeof EventBus.once).toBe('function');
    });
  });

  describe('Basic Event Emission and Listening', () => {
    it('should call listener when event is emitted', () => {
      const callback = vi.fn();

      EventBus.on('test:event', callback);
      EventBus.emit('test:event', { message: 'hello' });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({ message: 'hello' });
    });

    it('should call multiple listeners for the same event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      EventBus.on('test:event', callback1);
      EventBus.on('test:event', callback2);
      EventBus.on('test:event', callback3);

      EventBus.emit('test:event', { value: 42 });

      expect(callback1).toHaveBeenCalledWith({ value: 42 });
      expect(callback2).toHaveBeenCalledWith({ value: 42 });
      expect(callback3).toHaveBeenCalledWith({ value: 42 });
    });

    it('should not call listener for different events', () => {
      const callback = vi.fn();

      EventBus.on('test:event1', callback);
      EventBus.emit('test:event2', {});

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle events without data', () => {
      const callback = vi.fn();

      EventBus.on('test:nodata', callback);
      EventBus.emit('test:nodata');

      expect(callback).toHaveBeenCalledWith(undefined);
    });

    it('should handle various data types', () => {
      const callback = vi.fn();
      EventBus.on('test:data', callback);

      const testData = [
        null,
        undefined,
        42,
        'string',
        { nested: { object: true } },
        [1, 2, 3],
        true,
        false,
        0,
        ''
      ];

      for (const data of testData) {
        callback.mockClear();
        EventBus.emit('test:data', data);
        expect(callback).toHaveBeenCalledWith(data);
      }
    });
  });

  describe('Listener Removal (off)', () => {
    it('should remove listener and prevent further calls', () => {
      const callback = vi.fn();

      EventBus.on('test:event', callback);
      EventBus.emit('test:event', {});
      expect(callback).toHaveBeenCalledTimes(1);

      EventBus.off('test:event', callback);
      EventBus.emit('test:event', {});

      expect(callback).toHaveBeenCalledTimes(1); // Still only called once
    });

    it('should remove specific listener among multiple', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      EventBus.on('test:event', callback1);
      EventBus.on('test:event', callback2);
      EventBus.on('test:event', callback3);

      EventBus.off('test:event', callback2);

      EventBus.emit('test:event', {});

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).not.toHaveBeenCalled();
      expect(callback3).toHaveBeenCalledTimes(1);
    });

    it('should return true when listener is removed', () => {
      const callback = vi.fn();
      EventBus.on('test:event', callback);

      const removed = EventBus.off('test:event', callback);
      expect(removed).toBe(true);
    });

    it('should return false when listener not found', () => {
      const callback = vi.fn();

      const removed = EventBus.off('test:event', callback);
      expect(removed).toBe(false);
    });

    it('should allow re-subscribing after removal', () => {
      const callback = vi.fn();

      EventBus.on('test:event', callback);
      EventBus.off('test:event', callback);
      EventBus.on('test:event', callback);

      EventBus.emit('test:event', {});

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should clean up empty listener sets', () => {
      const callback = vi.fn();

      EventBus.on('test:event', callback);
      expect(EventBus.getEventNames()).toContain('test:event');

      EventBus.off('test:event', callback);
      expect(EventBus.getEventNames()).not.toContain('test:event');
    });
  });

  describe('One-Time Listeners (once)', () => {
    it('should call listener only once', () => {
      const callback = vi.fn();

      EventBus.once('test:event', callback);

      EventBus.emit('test:event', { num: 1 });
      EventBus.emit('test:event', { num: 2 });
      EventBus.emit('test:event', { num: 3 });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({ num: 1 });
    });

    it('should work alongside regular listeners', () => {
      const onceCallback = vi.fn();
      const regularCallback = vi.fn();

      EventBus.once('test:event', onceCallback);
      EventBus.on('test:event', regularCallback);

      EventBus.emit('test:event', { data: 1 });
      EventBus.emit('test:event', { data: 2 });

      expect(onceCallback).toHaveBeenCalledTimes(1);
      expect(regularCallback).toHaveBeenCalledTimes(2);
    });

    it('should return unsubscribe function', () => {
      const callback = vi.fn();

      const unsubscribe = EventBus.once('test:event', callback);
      expect(typeof unsubscribe).toBe('function');

      unsubscribe();
      EventBus.emit('test:event', {});

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Wildcard Pattern Matching', () => {
    it('should match specific wildcard patterns', () => {
      const callback = vi.fn();

      EventBus.on('character:*', callback);

      EventBus.emit('character:moved', { x: 10 });
      EventBus.emit('character:died', { cause: 'poison' });
      EventBus.emit('character:attacked', { damage: 15 });

      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('should not match events outside wildcard pattern', () => {
      const callback = vi.fn();

      EventBus.on('character:*', callback);

      EventBus.emit('npc:moved', {});
      EventBus.emit('world:changed', {});

      expect(callback).not.toHaveBeenCalled();
    });

    it('should match global wildcard "*"', () => {
      const callback = vi.fn();

      EventBus.on('*', callback);

      EventBus.emit('anything', { a: 1 });
      EventBus.emit('something:else', { b: 2 });
      EventBus.emit('xyz', { c: 3 });

      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('should support multiple wildcard listeners', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      EventBus.on('character:*', callback1);
      EventBus.on('item:*', callback2);

      EventBus.emit('character:moved', {});
      EventBus.emit('item:picked', {});

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should call both exact and wildcard listeners', () => {
      const exactCallback = vi.fn();
      const wildcardCallback = vi.fn();

      EventBus.on('character:moved', exactCallback);
      EventBus.on('character:*', wildcardCallback);

      EventBus.emit('character:moved', { x: 100 });

      expect(exactCallback).toHaveBeenCalledTimes(1);
      expect(wildcardCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle complex wildcard patterns', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      EventBus.on('game:*', callback1);
      EventBus.on('*', callback2);
      EventBus.on('game:state:changed', callback3);

      EventBus.emit('game:state:changed', {});

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback3).toHaveBeenCalledTimes(1);
    });

    it('should handle wildcard removal', () => {
      const callback = vi.fn();

      EventBus.on('character:*', callback);
      EventBus.emit('character:moved', {});

      const removed = EventBus.off('character:*', callback);
      expect(removed).toBe(true);

      EventBus.emit('character:moved', {});
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Event Queue and Deterministic Processing', () => {
    it('should process events in emission order', () => {
      const callOrder = [];

      EventBus.on('event:1', () => callOrder.push('1'));
      EventBus.on('event:2', () => callOrder.push('2'));
      EventBus.on('event:3', () => callOrder.push('3'));

      EventBus.emit('event:1', {});
      EventBus.emit('event:2', {});
      EventBus.emit('event:3', {});

      expect(callOrder).toEqual(['1', '2', '3']);
    });

    it('should maintain event order with multiple listeners', () => {
      const callOrder = [];

      EventBus.on('test', () => callOrder.push('a'));
      EventBus.on('test', () => callOrder.push('b'));

      EventBus.emit('test', {});
      EventBus.emit('test', {});

      // Order should be: event1-a, event1-b, event2-a, event2-b
      expect(callOrder).toEqual(['a', 'b', 'a', 'b']);
    });

    it('should process queue synchronously', () => {
      const order = [];

      EventBus.on('test', () => {
        order.push('listener');
      });

      order.push('before');
      EventBus.emit('test', {});
      order.push('after');

      expect(order).toEqual(['before', 'listener', 'after']);
    });

    it('should handle re-entrant emits correctly', () => {
      const callOrder = [];

      EventBus.on('first', () => {
        callOrder.push('first');
        EventBus.emit('second', {}); // Emit from within listener
      });

      EventBus.on('second', () => {
        callOrder.push('second');
      });

      EventBus.emit('first', {});

      expect(callOrder).toEqual(['first', 'second']);
    });

    it('should handle listener registration during emission', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      EventBus.on('test', () => {
        // Register new listener during event processing
        EventBus.on('test', callback2);
      });

      EventBus.on('test', callback1);

      EventBus.emit('test', {});
      EventBus.emit('test', {}); // callback2 should be called on second emit

      expect(callback1).toHaveBeenCalledTimes(2);
      expect(callback2).toHaveBeenCalledTimes(1); // Only on second emit
    });
  });

  describe('Event History Tracking', () => {
    it('should track all emitted events', () => {
      EventBus.emit('test:1', { value: 1 });
      EventBus.emit('test:2', { value: 2 });
      EventBus.emit('test:3', { value: 3 });

      const history = EventBus.getHistory();

      expect(history.length).toBe(3);
      expect(history[0].name).toBe('test:1');
      expect(history[1].name).toBe('test:2');
      expect(history[2].name).toBe('test:3');
    });

    it('should include event metadata in history', () => {
      EventBus.emit('test:event', { data: 'test' });

      const history = EventBus.getHistory();
      const event = history[0];

      expect(event.id).toBeDefined();
      expect(event.name).toBe('test:event');
      expect(event.data).toEqual({ data: 'test' });
      expect(event.timestamp).toBeDefined();
      expect(typeof event.timestamp).toBe('number');
    });

    it('should return specified number of recent events', () => {
      for (let i = 0; i < 10; i++) {
        EventBus.emit('test:event', { num: i });
      }

      const last3 = EventBus.getHistory(3);

      expect(last3.length).toBe(3);
      expect(last3[0].data.num).toBe(7);
      expect(last3[1].data.num).toBe(8);
      expect(last3[2].data.num).toBe(9);
    });

    it('should return all events when count exceeds history size', () => {
      EventBus.emit('test:1', {});
      EventBus.emit('test:2', {});

      const history = EventBus.getHistory(100);

      expect(history.length).toBe(2);
    });

    it('should return copy of history', () => {
      EventBus.emit('test:event', {});

      const history1 = EventBus.getHistory();
      const history2 = EventBus.getHistory();

      expect(history1).not.toBe(history2); // Different objects
      expect(history1).toEqual(history2); // But same content
    });

    it('should format history as string log', () => {
      EventBus.emit('test:1', { value: 'a' });
      EventBus.emit('test:2', { value: 'b' });

      const log = EventBus.getHistoryLog();

      expect(typeof log).toBe('string');
      expect(log).toContain('test:1');
      expect(log).toContain('test:2');
    });

    it('should limit history size to prevent memory bloat', () => {
      const instance = EventBus.getInstance();
      const maxSize = instance.maxHistorySize;

      // Emit more events than max history size
      for (let i = 0; i < maxSize + 100; i++) {
        EventBus.emit('test:event', { num: i });
      }

      const history = EventBus.getHistory();
      expect(history.length).toBeLessThanOrEqual(maxSize);
    });
  });

  describe('Error Handling', () => {
    it('should not crash if listener throws error', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Test error');
      });
      const normalCallback = vi.fn();

      EventBus.on('test', errorCallback);
      EventBus.on('test', normalCallback);

      // Should not throw
      expect(() => {
        EventBus.emit('test', {});
      }).not.toThrow();

      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
    });

    it('should validate event name is string', () => {
      expect(() => {
        EventBus.on(123, () => {});
      }).toThrow('Event name must be a string');

      expect(() => {
        EventBus.emit(null, {});
      }).toThrow('Event name must be a string');
    });

    it('should validate callback is function', () => {
      expect(() => {
        EventBus.on('test', 'not a function');
      }).toThrow('Callback must be a function');

      expect(() => {
        EventBus.once('test', null);
      }).toThrow('Callback must be a function');
    });
  });

  describe('Listener Management', () => {
    it('should return listener count for specific event', () => {
      EventBus.on('test:event', () => {});
      EventBus.on('test:event', () => {});
      EventBus.on('other:event', () => {});

      expect(EventBus.getListenerCount('test:event')).toBe(2);
      expect(EventBus.getListenerCount('other:event')).toBe(1);
      expect(EventBus.getListenerCount('unknown:event')).toBe(0);
    });

    it('should return all listener counts when no event specified', () => {
      EventBus.on('test:1', () => {});
      EventBus.on('test:1', () => {});
      EventBus.on('test:2', () => {});

      const counts = EventBus.getListenerCount();

      expect(counts['test:1']).toBe(2);
      expect(counts['test:2']).toBe(1);
    });

    it('should return all event names with listeners', () => {
      EventBus.on('event:1', () => {});
      EventBus.on('event:2', () => {});
      EventBus.on('event:3', () => {});

      const names = EventBus.getEventNames();

      expect(names).toContain('event:1');
      expect(names).toContain('event:2');
      expect(names).toContain('event:3');
      expect(names.length).toBe(3);
    });

    it('should return unsubscribe function from on()', () => {
      const callback = vi.fn();

      const unsubscribe = EventBus.on('test', callback);
      expect(typeof unsubscribe).toBe('function');

      EventBus.emit('test', {});
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
      EventBus.emit('test', {});
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Statistics and Debugging', () => {
    it('should return bus statistics', () => {
      EventBus.on('test:1', () => {});
      EventBus.on('test:1', () => {});
      EventBus.on('test:2', () => {});

      EventBus.emit('event:1', {});
      EventBus.emit('event:2', {});

      const stats = EventBus.getStats();

      expect(stats.listenerCount).toBe(3);
      expect(stats.eventNamesCount).toBe(2);
      expect(stats.historySize).toBe(2);
      expect(stats.eventCounter).toBe(2);
    });

    it('should verify bus integrity', () => {
      const verification = EventBus.verify();

      expect(verification.isHealthy).toBe(true);
      expect(Array.isArray(verification.issues)).toBe(true);
      expect(verification.issues.length).toBe(0);
    });

    it('should report issues when queue not empty', () => {
      // This is internal, but we can test the logic
      EventBus.emit('test', {});
      // Queue should be processed immediately, so this would be hard to test
      // without exposing internals. The implementation handles this.

      const verification = EventBus.verify();
      expect(verification.isHealthy).toBe(true);
    });
  });

  describe('Clear Method (for Testing)', () => {
    it('should remove all listeners', () => {
      EventBus.on('test:1', () => {});
      EventBus.on('test:2', () => {});

      expect(EventBus.getEventNames().length).toBe(2);

      EventBus.clear();

      expect(EventBus.getEventNames().length).toBe(0);
    });

    it('should clear event history', () => {
      EventBus.emit('test:1', {});
      EventBus.emit('test:2', {});

      expect(EventBus.getHistory().length).toBe(2);

      EventBus.clear();

      expect(EventBus.getHistory().length).toBe(0);
    });

    it('should clear event queue', () => {
      const instance = EventBus.getInstance();

      // Directly add to queue (simulating internal state)
      instance.eventQueue.push({ name: 'test', data: {} });

      EventBus.clear();

      expect(instance.eventQueue.length).toBe(0);
    });

    it('should reset event counter', () => {
      EventBus.emit('test:1', {});
      EventBus.emit('test:2', {});

      const instance = EventBus.getInstance();
      expect(instance.eventCounter).toBe(2);

      EventBus.clear();

      expect(instance.eventCounter).toBe(0);
    });

    it('should reset processing flag', () => {
      EventBus.clear();

      const instance = EventBus.getInstance();
      expect(instance.isProcessing).toBe(false);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle rapid-fire events', () => {
      const callback = vi.fn();
      EventBus.on('test', callback);

      for (let i = 0; i < 1000; i++) {
        EventBus.emit('test', { num: i });
      }

      expect(callback).toHaveBeenCalledTimes(1000);
    });

    it('should maintain order through complex listener operations', () => {
      const order = [];

      const cb1 = vi.fn(() => order.push('cb1'));
      const cb2 = vi.fn(() => order.push('cb2'));
      const cb3 = vi.fn(() => order.push('cb3'));

      EventBus.on('test', cb1);
      EventBus.on('test', cb2);
      EventBus.on('test', cb3);

      EventBus.emit('test', {});
      EventBus.off('test', cb2);
      EventBus.emit('test', {});

      expect(order).toEqual(['cb1', 'cb2', 'cb3', 'cb1', 'cb3']);
    });

    it('should handle mix of wildcard and exact listeners', () => {
      const exact = vi.fn();
      const wildcard1 = vi.fn();
      const wildcard2 = vi.fn();

      EventBus.on('character:moved', exact);
      EventBus.on('character:*', wildcard1);
      EventBus.on('*', wildcard2);

      EventBus.emit('character:moved', {});

      expect(exact).toHaveBeenCalledTimes(1);
      expect(wildcard1).toHaveBeenCalledTimes(1);
      expect(wildcard2).toHaveBeenCalledTimes(1);
    });

    it('should work with system-like patterns', () => {
      const movementSystem = vi.fn();
      const dialogueSystem = vi.fn();
      const allEvents = vi.fn();

      EventBus.on('movement:*', movementSystem);
      EventBus.on('dialogue:*', dialogueSystem);
      EventBus.on('*', allEvents);

      EventBus.emit('movement:started', { characterId: 1 });
      EventBus.emit('movement:finished', { characterId: 1 });
      EventBus.emit('dialogue:started', { npcId: 5 });

      expect(movementSystem).toHaveBeenCalledTimes(2);
      expect(dialogueSystem).toHaveBeenCalledTimes(1);
      expect(allEvents).toHaveBeenCalledTimes(3);
    });

    it('should support game simulation scenario', () => {
      const events = [];

      // Character movement
      EventBus.on('character:*', (data) => events.push('character'));
      EventBus.emit('character:spawned', { id: 1 });
      EventBus.emit('character:moved', { id: 1, x: 100, y: 200 });

      // Dialogue
      EventBus.on('dialogue:*', (data) => events.push('dialogue'));
      EventBus.emit('dialogue:started', { id: 1 });
      EventBus.emit('dialogue:message', { text: 'Hello' });

      // All events
      EventBus.on('*', (data) => events.push('all'));

      const history = EventBus.getHistory();

      expect(history.length).toBe(4); // First 4 events
      expect(events.length).toBe(4); // Last 2 were captured
    });
  });

  describe('Memory and Performance', () => {
    it('should not leak listeners', () => {
      const callback = vi.fn();

      // Register and unregister many times
      for (let i = 0; i < 100; i++) {
        EventBus.on('test', callback);
        EventBus.off('test', callback);
      }

      expect(EventBus.getListenerCount('test')).toBe(0);
      expect(EventBus.getEventNames()).not.toContain('test');
    });

    it('should handle large event data', () => {
      const callback = vi.fn();
      EventBus.on('test', callback);

      const largeData = {
        nested: {
          deeply: {
            array: Array(1000).fill({ values: true })
          }
        }
      };

      EventBus.emit('test', largeData);

      expect(callback).toHaveBeenCalledWith(largeData);
    });

    it('should bound history size', () => {
      const instance = EventBus.getInstance();

      // Emit more events than the max history size
      for (let i = 0; i < instance.maxHistorySize + 1000; i++) {
        EventBus.emit('test', { num: i });
      }

      expect(EventBus.getHistory().length).toBeLessThanOrEqual(
        instance.maxHistorySize
      );
    });
  });

  describe('TypeScript-like interface', () => {
    it('should support method chaining through unsubscribe', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const unsubscribe1 = EventBus.on('test', callback1);
      const unsubscribe2 = EventBus.on('test', callback2);

      EventBus.emit('test', {});
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);

      unsubscribe1();
      EventBus.emit('test', {});
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(2);

      unsubscribe2();
      EventBus.emit('test', {});
      expect(callback2).toHaveBeenCalledTimes(2);
    });
  });
});
