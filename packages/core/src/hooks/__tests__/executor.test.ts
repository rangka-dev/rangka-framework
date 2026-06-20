import { describe, it, expect } from 'vitest';
import { ValidationError } from '../errors.js';
import { executeHookPipeline } from '../executor.js';
import { HookRegistry } from '../registry.js';
import type { HookDocument } from '../types.js';
import type { SchemaRegistry } from '../../schema/registry.js';
import type { RequestContext } from '../../auth/types.js';

function mockSchema(): SchemaRegistry {
  return {} as unknown as SchemaRegistry;
}

function mockAuth(): RequestContext {
  return {
    user: { id: '1', email: 'test@test.com' },
    roles: ['Admin'],
    scopeFilters: [],
  } as unknown as RequestContext;
}

function mockKysely() {
  const trxQueries: any[] = [];
  const trx: any = {
    insertInto: (table: string) => {
      const q: any = {};
      q.values = (v: any) => {
        trxQueries.push({ op: 'insert', table, values: v });
        return q;
      };
      q.returningAll = () => q;
      q.executeTakeFirstOrThrow = async () => ({
        id: '1',
        ...trxQueries[trxQueries.length - 1]?.values,
      });
      return q;
    },
    updateTable: (table: string) => {
      const q: any = {};
      q.set = (v: any) => {
        trxQueries.push({ op: 'update', table, values: v });
        return q;
      };
      q.where = () => q;
      q.returningAll = () => q;
      q.executeTakeFirstOrThrow = async () => ({
        id: '1',
        ...trxQueries[trxQueries.length - 1]?.values,
      });
      return q;
    },
    deleteFrom: (table: string) => {
      const q: any = {};
      q.where = () => q;
      q.execute = async () => {
        trxQueries.push({ op: 'delete', table });
      };
      return q;
    },
  };

  const db: any = {
    transaction: () => ({
      execute: async (cb: (trx: any) => Promise<any>) => cb(trx),
    }),
  };

  return { db, trx, trxQueries };
}

describe('executeHookPipeline', () => {
  it('runs full create pipeline: validate → beforeCreate → execute → afterCreate', async () => {
    const order: string[] = [];
    const registry = new HookRegistry();
    registry.register(
      'sales.invoice',
      {
        validate: () => {
          order.push('validate');
        },
        beforeCreate: async () => {
          order.push('beforeCreate');
        },
        afterCreate: async () => {
          order.push('afterCreate');
        },
      },
      'sales',
    );

    const { db } = mockKysely();
    const chain = registry.getChain('sales.invoice')!;

    await executeHookPipeline({
      model: 'sales.invoice',
      operation: 'create',
      chain,
      doc: { name: 'INV-001' },
      db,
      schema: mockSchema(),
      auth: mockAuth(),
      execute: async (doc) => {
        order.push('execute');
        return { id: '1', ...doc };
      },
    });

    expect(order).toEqual(['validate', 'beforeCreate', 'execute', 'afterCreate']);
  });

  it('runs beforeSave/afterSave for create operations', async () => {
    const order: string[] = [];
    const registry = new HookRegistry();
    registry.register(
      'sales.invoice',
      {
        beforeSave: async () => {
          order.push('beforeSave');
        },
        afterSave: async () => {
          order.push('afterSave');
        },
        beforeCreate: async () => {
          order.push('beforeCreate');
        },
        afterCreate: async () => {
          order.push('afterCreate');
        },
      },
      'sales',
    );

    const { db } = mockKysely();
    const chain = registry.getChain('sales.invoice')!;

    await executeHookPipeline({
      model: 'sales.invoice',
      operation: 'create',
      chain,
      doc: { name: 'INV-001' },
      db,
      schema: mockSchema(),
      auth: mockAuth(),
      execute: async (doc) => ({ id: '1', ...doc }),
    });

    expect(order).toEqual(['beforeSave', 'beforeCreate', 'afterCreate', 'afterSave']);
  });

  it('validate hook rejection aborts pipeline', async () => {
    const registry = new HookRegistry();
    registry.register(
      'sales.invoice',
      {
        validate: (doc) => {
          if (!doc.customer) {
            throw new ValidationError('customer', 'Customer is required');
          }
        },
        beforeCreate: async () => {
          throw new Error('Should not reach beforeCreate');
        },
      },
      'sales',
    );

    const { db } = mockKysely();
    const chain = registry.getChain('sales.invoice')!;

    await expect(
      executeHookPipeline({
        model: 'sales.invoice',
        operation: 'create',
        chain,
        doc: { name: 'INV-001' },
        db,
        schema: mockSchema(),
        auth: mockAuth(),
        execute: async (doc) => doc,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('beforeCreate can modify the document', async () => {
    const registry = new HookRegistry();
    registry.register(
      'sales.invoice',
      {
        beforeCreate: async (doc) => {
          doc.computed_total = 100;
        },
      },
      'sales',
    );

    const { db } = mockKysely();
    const chain = registry.getChain('sales.invoice')!;
    let executedDoc: HookDocument | undefined;

    await executeHookPipeline({
      model: 'sales.invoice',
      operation: 'create',
      chain,
      doc: { name: 'INV-001' },
      db,
      schema: mockSchema(),
      auth: mockAuth(),
      execute: async (doc) => {
        executedDoc = doc;
        return { id: '1', ...doc };
      },
    });

    expect(executedDoc!.computed_total).toBe(100);
  });

  it('afterCreate receives the result from execute', async () => {
    const registry = new HookRegistry();
    let afterDoc: HookDocument | undefined;
    registry.register(
      'sales.invoice',
      {
        afterCreate: async (doc) => {
          afterDoc = doc;
        },
      },
      'sales',
    );

    const { db } = mockKysely();
    const chain = registry.getChain('sales.invoice')!;

    await executeHookPipeline({
      model: 'sales.invoice',
      operation: 'create',
      chain,
      doc: { name: 'INV-001' },
      db,
      schema: mockSchema(),
      auth: mockAuth(),
      execute: async (doc) => ({ id: '1', ...doc, server_generated: true }),
    });

    expect(afterDoc!.server_generated).toBe(true);
  });

  it('rolls back transaction on beforeCreate throw', async () => {
    const registry = new HookRegistry();
    registry.register(
      'sales.invoice',
      {
        beforeCreate: async () => {
          throw new Error('Business rule violated');
        },
      },
      'sales',
    );

    let transactionRolledBack = false;
    const db: any = {
      transaction: () => ({
        execute: async (cb: (trx: any) => Promise<any>) => {
          try {
            return await cb({});
          } catch (err) {
            transactionRolledBack = true;
            throw err;
          }
        },
      }),
    };

    const chain = registry.getChain('sales.invoice')!;

    await expect(
      executeHookPipeline({
        model: 'sales.invoice',
        operation: 'create',
        chain,
        doc: { name: 'INV-001' },
        db,
        schema: mockSchema(),
        auth: mockAuth(),
        execute: async (doc) => doc,
      }),
    ).rejects.toThrow('Business rule violated');

    expect(transactionRolledBack).toBe(true);
  });

  it('extension hooks run after base hooks', async () => {
    const order: string[] = [];
    const registry = new HookRegistry();
    registry.register(
      'sales.invoice',
      {
        beforeCreate: async () => {
          order.push('base');
        },
      },
      'sales',
    );
    registry.register(
      'sales.invoice',
      {
        beforeCreate: async () => {
          order.push('extension');
        },
      },
      'custom',
    );

    const { db } = mockKysely();
    const chain = registry.getChain('sales.invoice')!;

    await executeHookPipeline({
      model: 'sales.invoice',
      operation: 'create',
      chain,
      doc: {},
      db,
      schema: mockSchema(),
      auth: mockAuth(),
      execute: async (doc) => doc,
    });

    expect(order).toEqual(['base', 'extension']);
  });

  it('handles update operation with beforeUpdate/afterUpdate', async () => {
    const order: string[] = [];
    const registry = new HookRegistry();
    registry.register(
      'sales.invoice',
      {
        beforeUpdate: async () => {
          order.push('beforeUpdate');
        },
        afterUpdate: async () => {
          order.push('afterUpdate');
        },
      },
      'sales',
    );

    const { db } = mockKysely();
    const chain = registry.getChain('sales.invoice')!;

    await executeHookPipeline({
      model: 'sales.invoice',
      operation: 'update',
      chain,
      doc: { id: '1', name: 'INV-002' },
      db,
      schema: mockSchema(),
      auth: mockAuth(),
      execute: async (doc) => doc,
    });

    expect(order).toEqual(['beforeUpdate', 'afterUpdate']);
  });

  it('handles delete operation with beforeDelete/afterDelete', async () => {
    const order: string[] = [];
    const registry = new HookRegistry();
    registry.register(
      'sales.invoice',
      {
        beforeDelete: async () => {
          order.push('beforeDelete');
        },
        afterDelete: async () => {
          order.push('afterDelete');
        },
      },
      'sales',
    );

    const { db } = mockKysely();
    const chain = registry.getChain('sales.invoice')!;

    await executeHookPipeline({
      model: 'sales.invoice',
      operation: 'delete',
      chain,
      doc: { id: '1' },
      db,
      schema: mockSchema(),
      auth: mockAuth(),
      execute: async (doc) => doc,
    });

    expect(order).toEqual(['beforeDelete', 'afterDelete']);
  });

  it('does not run beforeSave/afterSave for delete operations', async () => {
    const order: string[] = [];
    const registry = new HookRegistry();
    registry.register(
      'sales.invoice',
      {
        beforeSave: async () => {
          order.push('beforeSave');
        },
        afterSave: async () => {
          order.push('afterSave');
        },
        beforeDelete: async () => {
          order.push('beforeDelete');
        },
        afterDelete: async () => {
          order.push('afterDelete');
        },
      },
      'sales',
    );

    const { db } = mockKysely();
    const chain = registry.getChain('sales.invoice')!;

    await executeHookPipeline({
      model: 'sales.invoice',
      operation: 'delete',
      chain,
      doc: { id: '1' },
      db,
      schema: mockSchema(),
      auth: mockAuth(),
      execute: async (doc) => doc,
    });

    expect(order).toEqual(['beforeDelete', 'afterDelete']);
  });
});
