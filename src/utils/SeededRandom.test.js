import { describe, it, expect, beforeEach } from 'vitest';
import SeededRandom from './SeededRandom.js';

describe('SeededRandom', () => {
  let rng;

  beforeEach(() => {
    rng = new SeededRandom(12345);
  });

  describe('constructor', () => {
    it('should create instance with seed', () => {
      expect(rng).toBeDefined();
      expect(rng.getSeed()).toBe(12345);
    });

    it('should handle negative seeds', () => {
      const negRng = new SeededRandom(-100);
      expect(negRng.getSeed()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('next()', () => {
    it('should return number between 0 and 1', () => {
      for (let i = 0; i < 100; i++) {
        const val = rng.next();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });

    it('should be deterministic with same seed', () => {
      const rng1 = new SeededRandom(999);
      const rng2 = new SeededRandom(999);

      const values1 = [];
      const values2 = [];

      for (let i = 0; i < 10; i++) {
        values1.push(rng1.next());
        values2.push(rng2.next());
      }

      expect(values1).toEqual(values2);
    });

    it('should produce different sequences with different seeds', () => {
      const rng1 = new SeededRandom(111);
      const rng2 = new SeededRandom(222);

      const val1 = rng1.next();
      const val2 = rng2.next();

      expect(val1).not.toBe(val2);
    });
  });

  describe('nextInt()', () => {
    it('should return integer in range', () => {
      for (let i = 0; i < 100; i++) {
        const val = rng.nextInt(0, 10);
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(10);
        expect(Number.isInteger(val)).toBe(true);
      }
    });

    it('should include both min and max', () => {
      const results = new Set();
      const rng = new SeededRandom(12345);
      
      // Generate many values
      for (let i = 0; i < 1000; i++) {
        results.add(rng.nextInt(0, 5));
      }

      // Should see all values including 0 and 5
      expect(results.has(0)).toBe(true);
      expect(results.has(5)).toBe(true);
    });

    it('should throw error if min > max', () => {
      expect(() => rng.nextInt(10, 5)).toThrow('min must be less than or equal to max');
    });

    it('should handle single value range', () => {
      const val = rng.nextInt(5, 5);
      expect(val).toBe(5);
    });

    it('should handle negative ranges', () => {
      const val = rng.nextInt(-10, -5);
      expect(val).toBeGreaterThanOrEqual(-10);
      expect(val).toBeLessThanOrEqual(-5);
    });

    it('should be deterministic', () => {
      const rng1 = new SeededRandom(777);
      const rng2 = new SeededRandom(777);

      const values1 = Array.from({ length: 10 }, () => rng1.nextInt(0, 100));
      const values2 = Array.from({ length: 10 }, () => rng2.nextInt(0, 100));

      expect(values1).toEqual(values2);
    });
  });

  describe('nextFloat()', () => {
    it('should return float in range', () => {
      for (let i = 0; i < 100; i++) {
        const val = rng.nextFloat(0, 10);
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(10);
      }
    });

    it('should throw error if min > max', () => {
      expect(() => rng.nextFloat(10, 5)).toThrow('min must be less than or equal to max');
    });

    it('should handle negative ranges', () => {
      const val = rng.nextFloat(-1.5, -0.5);
      expect(val).toBeGreaterThanOrEqual(-1.5);
      expect(val).toBeLessThan(-0.5);
    });

    it('should be deterministic', () => {
      const rng1 = new SeededRandom(888);
      const rng2 = new SeededRandom(888);

      const values1 = Array.from({ length: 10 }, () => rng1.nextFloat(0, 100));
      const values2 = Array.from({ length: 10 }, () => rng2.nextFloat(0, 100));

      expect(values1).toEqual(values2);
    });
  });



  describe('getSeed()', () => {
    it('should return current seed', () => {
      expect(rng.getSeed()).toBe(12345);
    });
  });

  describe('reset()', () => {
    it('should reset generator to original seed', () => {
      const val1 = rng.next();
      rng.reset();
      const val2 = rng.next();
      
      expect(val1).toBe(val2);
    });

    it('should produce same sequence after reset', () => {
      const values1 = [rng.next(), rng.next(), rng.next()];
      rng.reset();
      const values2 = [rng.next(), rng.next(), rng.next()];

      expect(values1).toEqual(values2);
    });
  });

  describe('determinism verification', () => {
    it('should produce identical long sequences with same seed', () => {
      const rng1 = new SeededRandom(424242);
      const rng2 = new SeededRandom(424242);

      for (let i = 0; i < 1000; i++) {
        expect(rng1.next()).toBe(rng2.next());
      }
    });

    it('should be repeatable across multiple operations', () => {
      const seed = 7777;
      const operations = [
        (r) => r.next(),
        (r) => r.nextInt(0, 100),
        (r) => r.nextFloat(0, 1),
        (r) => r.nextInt(-50, 50),
        (r) => r.next()
      ];

      const rng1 = new SeededRandom(seed);
      const results1 = operations.map(op => op(rng1));

      const rng2 = new SeededRandom(seed);
      const results2 = operations.map(op => op(rng2));

      expect(results1).toEqual(results2);
    });
  });
});
