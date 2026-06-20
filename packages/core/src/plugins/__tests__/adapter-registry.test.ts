import { describe, it, expect } from 'vitest';
import {
  AdapterRegistry,
  AdapterNotFoundError,
  DuplicateAdapterError,
} from '../adapter-registry.js';
import type { DataAdapter } from '../types.js';

function makeAdapter(overrides?: Partial<DataAdapter>): DataAdapter {
  return {
    async get(_model: string, _id: string) {
      return { id: '1' };
    },
    ...overrides,
  };
}

describe('AdapterRegistry', () => {
  describe('register', () => {
    it('registers an adapter', () => {
      const registry = new AdapterRegistry();
      const adapter = makeAdapter();
      registry.register('stripe', adapter);
      expect(registry.has('stripe')).toBe(true);
    });

    it('throws DuplicateAdapterError on duplicate name', () => {
      const registry = new AdapterRegistry();
      registry.register('stripe', makeAdapter());
      expect(() => registry.register('stripe', makeAdapter())).toThrow(DuplicateAdapterError);
      expect(() => registry.register('stripe', makeAdapter())).toThrow(
        'Adapter "stripe" is already registered',
      );
    });

    it('allows different names', () => {
      const registry = new AdapterRegistry();
      registry.register('stripe', makeAdapter());
      registry.register('hubspot', makeAdapter());
      expect(registry.has('stripe')).toBe(true);
      expect(registry.has('hubspot')).toBe(true);
    });
  });

  describe('get', () => {
    it('returns the registered adapter', () => {
      const registry = new AdapterRegistry();
      const adapter = makeAdapter();
      registry.register('stripe', adapter);
      expect(registry.get('stripe')).toBe(adapter);
    });

    it('throws AdapterNotFoundError for unknown name', () => {
      const registry = new AdapterRegistry();
      expect(() => registry.get('unknown')).toThrow(AdapterNotFoundError);
      expect(() => registry.get('unknown')).toThrow('Adapter "unknown" is not registered');
    });
  });

  describe('has', () => {
    it('returns false for unregistered adapter', () => {
      const registry = new AdapterRegistry();
      expect(registry.has('stripe')).toBe(false);
    });

    it('returns true after registration', () => {
      const registry = new AdapterRegistry();
      registry.register('stripe', makeAdapter());
      expect(registry.has('stripe')).toBe(true);
    });
  });

  describe('getAll', () => {
    it('returns empty array when no adapters registered', () => {
      const registry = new AdapterRegistry();
      expect(registry.getAll()).toEqual([]);
    });

    it('returns all registered adapters with names', () => {
      const registry = new AdapterRegistry();
      const stripe = makeAdapter();
      const hubspot = makeAdapter();
      registry.register('stripe', stripe);
      registry.register('hubspot', hubspot);

      const all = registry.getAll();
      expect(all).toHaveLength(2);
      expect(all).toContainEqual({ name: 'stripe', adapter: stripe });
      expect(all).toContainEqual({ name: 'hubspot', adapter: hubspot });
    });
  });
});
