import { describe, it, expect, vi } from 'vitest';
import { createHookContext } from '../../hooks/context.js';
import { EventBus } from '../../events/bus.js';
import type { SchemaRegistry } from '../../schema/registry.js';
import type { RequestContext } from '../../auth/types.js';

function mockSchema(): SchemaRegistry {
  return { getAllModels: () => [] } as unknown as SchemaRegistry;
}

function mockAuth(): RequestContext {
  return {
    user: { id: '1', email: 'test@test.com' },
    roles: ['Admin'],
    scopeFilters: [],
  } as unknown as RequestContext;
}

describe('Hook → EventBus integration', () => {
  it('ctx.events.emit delegates to EventBus in sync mode', async () => {
    const bus = new EventBus();
    const handler = vi.fn().mockResolvedValue(undefined);
    bus.on('invoice.created', handler);

    const ctx = createHookContext({
      trx: {},
      schema: mockSchema(),
      auth: mockAuth(),
      eventBus: bus,
    });

    // emitWithTrx with sync falls through to sync handler
    const mockEmitWithTrx = vi.fn().mockResolvedValue(undefined);
    (bus as any).emitWithTrx = mockEmitWithTrx;

    await ctx.events.emit('invoice.created', { id: '123' });

    expect(mockEmitWithTrx).toHaveBeenCalledWith(
      'invoice.created',
      { id: '123' },
      expect.anything(),
    );
  });

  it('EventBus sync emit runs listener inline', async () => {
    const bus = new EventBus();
    const results: string[] = [];

    bus.on('job.done', async (payload: unknown) => {
      const p = payload as { name: string };
      results.push(p.name);
    });

    await bus.emit('job.done', { name: 'test' }, { sync: true });
    expect(results).toEqual(['test']);
  });

  it('EventBus registers event handler that JobWorker can call', async () => {
    const bus = new EventBus();
    const handler = vi.fn().mockResolvedValue(undefined);

    bus.on('order.shipped', handler);

    const listeners = bus.getListeners('order.shipped');
    expect(listeners).toHaveLength(1);

    // Simulate what the worker does: call the handler directly
    await listeners[0].handler({ orderId: '456' });
    expect(handler).toHaveBeenCalledWith({ orderId: '456' });
  });
});
