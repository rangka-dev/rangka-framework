import { describe, it, expect } from 'vitest';
import { ServiceRegistry } from '../registry.js';
import { HookRegistry } from '../../hooks/registry.js';
import { executeHookPipeline } from '../../hooks/executor.js';
import { SchemaRegistry } from '../../schema/registry.js';
import { EventBus } from '../../events/bus.js';

describe('hook → service → db integration', () => {
  it('hook calls ctx.service() which accesses ctx.db', async () => {
    const serviceRegistry = new ServiceRegistry();
    const dbCalls: string[] = [];

    serviceRegistry.register({
      name: 'pricing',
      factory: (_ctx) => ({
        getDiscount: async (customerId: unknown) => {
          dbCalls.push(`query:${customerId}`);
          return 0.1;
        },
      }),
    });

    const hookRegistry = new HookRegistry();
    hookRegistry.register(
      'sales.order',
      {
        beforeSave: async (doc: any, ctx: any) => {
          const pricing = ctx.service('pricing') as any;
          const discount = await pricing.getDiscount(doc.customer_id);
          doc.discount = discount;
        },
      },
      'sales',
    );

    const schema = new SchemaRegistry([]);
    const eventBus = new EventBus();
    const auth = { user: { id: '1' }, roles: ['Admin'], scopes: {} } as any;

    const mockTrx = {
      transaction: () => ({
        execute: async (fn: any) => fn(mockTrx),
      }),
    } as any;

    const chain = hookRegistry.getChain('sales.order')!;
    const result = await executeHookPipeline({
      model: 'sales.order',
      operation: 'create',
      chain,
      doc: { customer_id: 'cust-1', total: 100 } as any,
      db: mockTrx,
      schema,
      auth,
      eventBus,
      serviceRegistry,
      execute: async (doc) => doc,
    });

    expect(result.discount).toBe(0.1);
    expect(dbCalls).toEqual(['query:cust-1']);
  });
});
