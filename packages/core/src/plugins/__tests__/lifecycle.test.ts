import { describe, it, expect, vi } from 'vitest';
import { PluginLifecycleManager } from '../lifecycle.js';
import type { PluginLifecycleEvent } from '../types.js';

describe('PluginLifecycleManager', () => {
  describe('register and emit', () => {
    it('calls registered handler on emit', async () => {
      const manager = new PluginLifecycleManager();
      const handler = vi.fn().mockResolvedValue(undefined);
      manager.register('afterBoot', handler);

      await manager.emit('afterBoot');
      expect(handler).toHaveBeenCalledOnce();
    });

    it('passes arguments to handler', async () => {
      const manager = new PluginLifecycleManager();
      const handler = vi.fn().mockResolvedValue(undefined);
      manager.register('beforeRequest', handler);

      await manager.emit('beforeRequest', { url: '/api/test' });
      expect(handler).toHaveBeenCalledWith({ url: '/api/test' });
    });

    it('calls multiple handlers in registration order', async () => {
      const manager = new PluginLifecycleManager();
      const order: number[] = [];

      manager.register('afterBoot', async () => {
        order.push(1);
      });
      manager.register('afterBoot', async () => {
        order.push(2);
      });
      manager.register('afterBoot', async () => {
        order.push(3);
      });

      await manager.emit('afterBoot');
      expect(order).toEqual([1, 2, 3]);
    });

    it('does nothing when no handlers for event', async () => {
      const manager = new PluginLifecycleManager();
      await expect(manager.emit('beforeShutdown')).resolves.toBeUndefined();
    });

    it('supports all lifecycle events', async () => {
      const manager = new PluginLifecycleManager();
      const events: PluginLifecycleEvent[] = [
        'beforeBoot',
        'afterBoot',
        'beforeRequest',
        'afterRequest',
        'beforeShutdown',
      ];

      for (const event of events) {
        const handler = vi.fn().mockResolvedValue(undefined);
        manager.register(event, handler);
        await manager.emit(event);
        expect(handler).toHaveBeenCalledOnce();
      }
    });

    it('awaits async handlers sequentially', async () => {
      const manager = new PluginLifecycleManager();
      const order: number[] = [];

      manager.register('afterBoot', async () => {
        await new Promise((r) => setTimeout(r, 10));
        order.push(1);
      });
      manager.register('afterBoot', async () => {
        order.push(2);
      });

      await manager.emit('afterBoot');
      expect(order).toEqual([1, 2]);
    });
  });

  describe('getHandlers', () => {
    it('returns empty array for unregistered event', () => {
      const manager = new PluginLifecycleManager();
      expect(manager.getHandlers('beforeBoot')).toEqual([]);
    });

    it('returns registered handlers', () => {
      const manager = new PluginLifecycleManager();
      const handler = vi.fn().mockResolvedValue(undefined);
      manager.register('afterBoot', handler);
      expect(manager.getHandlers('afterBoot')).toEqual([handler]);
    });
  });
});
