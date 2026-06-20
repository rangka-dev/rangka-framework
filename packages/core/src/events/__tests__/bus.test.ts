import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../bus.js';

describe('EventBus', () => {
  it('registers listeners via on()', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on('order.created', handler);

    expect(bus.hasListeners('order.created')).toBe(true);
    expect(bus.getListeners('order.created')).toHaveLength(1);
  });

  it('supports multiple listeners per event', () => {
    const bus = new EventBus();
    const h1 = vi.fn();
    const h2 = vi.fn();

    bus.on('order.created', h1);
    bus.on('order.created', h2);

    expect(bus.getListeners('order.created')).toHaveLength(2);
  });

  it('returns false for events with no listeners', () => {
    const bus = new EventBus();
    expect(bus.hasListeners('nothing')).toBe(false);
    expect(bus.getListeners('nothing')).toHaveLength(0);
  });

  it('getAllEvents returns all registered event names', () => {
    const bus = new EventBus();
    bus.on('a', vi.fn());
    bus.on('b', vi.fn());
    bus.on('c', vi.fn());

    const events = bus.getAllEvents();
    expect(events).toContain('a');
    expect(events).toContain('b');
    expect(events).toContain('c');
  });

  describe('sync emit', () => {
    it('calls listeners inline with { sync: true }', async () => {
      const bus = new EventBus();
      const handler = vi.fn().mockResolvedValue(undefined);

      bus.on('test.event', handler);
      await bus.emit('test.event', { id: 1 }, { sync: true });

      expect(handler).toHaveBeenCalledWith({ id: 1 });
    });

    it('calls multiple listeners in order', async () => {
      const bus = new EventBus();
      const order: number[] = [];

      bus.on('test', async () => {
        order.push(1);
      });
      bus.on('test', async () => {
        order.push(2);
      });

      await bus.emit('test', {}, { sync: true });
      expect(order).toEqual([1, 2]);
    });

    it('does nothing if no listeners registered', async () => {
      const bus = new EventBus();
      await expect(bus.emit('unknown', {}, { sync: true })).resolves.toBeUndefined();
    });
  });

  describe('async emit', () => {
    it('throws if db not set', async () => {
      const bus = new EventBus();
      bus.on('test', vi.fn());

      await expect(bus.emit('test', {})).rejects.toThrow('database not set');
    });

    it('emitWithTrx in sync mode calls handlers directly', async () => {
      const bus = new EventBus();
      const handler = vi.fn().mockResolvedValue(undefined);
      bus.on('test', handler);

      const mockTrx = {} as any;
      await bus.emitWithTrx('test', { data: 'hi' }, mockTrx, { sync: true });

      expect(handler).toHaveBeenCalledWith({ data: 'hi' });
    });
  });

  describe('listener source tracking', () => {
    it('stores source on listener', () => {
      const bus = new EventBus();
      bus.on('test', vi.fn(), 'sales-module');

      const listeners = bus.getListeners('test');
      expect(listeners[0].source).toBe('sales-module');
    });
  });
});
