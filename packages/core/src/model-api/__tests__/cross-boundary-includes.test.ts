import { describe, it, expect, vi } from 'vitest';
import { resolveModelIncludes } from '../include-resolver.js';
import type { SchemaRegistry } from '../../schema/registry.js';
import type { ModelRelationship, ResolvedModel } from '../../schema/types.js';
import { AdapterRegistry } from '../../plugins/adapter-registry.js';
import type { DataAdapter } from '../../plugins/types.js';

function makeRegistry(
  models: ResolvedModel[],
  relationships: ModelRelationship[] = [],
): SchemaRegistry {
  return {
    getModel: (qn: string) => models.find((m) => m.qualifiedName === qn),
    getAllModels: () => models,
    getRelationshipsForModel: () => relationships,
    getFieldsForModel: (qn: string) => models.find((m) => m.qualifiedName === qn)?.fields ?? [],
  } as unknown as SchemaRegistry;
}

function makeExternalModel(name: string, source: string): ResolvedModel {
  return {
    qualifiedName: name,
    app: 'test',
    module: name.split('.')[0],
    name: name.split('.')[1],
    auditLog: false,
    traits: [],
    fields: [],
    indexes: [],
    source,
  };
}

function makeInternalModel(name: string): ResolvedModel {
  return {
    qualifiedName: name,
    app: 'test',
    module: name.split('.')[0],
    name: name.split('.')[1],
    auditLog: false,
    traits: [],
    fields: [],
    indexes: [],
  };
}

describe('resolveModelIncludes - cross-boundary', () => {
  describe('internal to external (link)', () => {
    it('uses batchGet when adapter supports it', async () => {
      const batchGet = vi.fn().mockResolvedValue([
        { id: 'cus_1', email: 'a@b.com' },
        { id: 'cus_2', email: 'c@d.com' },
      ]);
      const adapter: DataAdapter = {
        async get() {
          return null;
        },
        batchGet,
      };

      const adapterRegistry = new AdapterRegistry();
      adapterRegistry.register('stripe', adapter);

      const externalModel = makeExternalModel('billing.Customer', 'stripe');
      const internalModel = makeInternalModel('sales.Order');

      const relationships: ModelRelationship[] = [
        { type: 'link', from: 'sales.Order', field: 'customer', to: 'billing.Customer' },
      ];

      const registry = makeRegistry([internalModel, externalModel], relationships);

      const records = [
        { id: 'ord_1', customer: 'cus_1', total: 100 },
        { id: 'ord_2', customer: 'cus_2', total: 200 },
        { id: 'ord_3', customer: 'cus_1', total: 150 },
      ];

      const fields = {
        'billing.Customer': {
          id: { type: 'string' as const },
          email: { type: 'string' as const },
        },
      };

      await resolveModelIncludes(records, ['customer'], registry, {} as any, 'sales.Order', {
        adapterRegistry,
        externalModelFields: fields,
      });

      expect(batchGet).toHaveBeenCalledWith('billing.Customer', ['cus_1', 'cus_2']);
      expect(records[0].customer).toEqual({ id: 'cus_1', email: 'a@b.com' });
      expect(records[1].customer).toEqual({ id: 'cus_2', email: 'c@d.com' });
      expect(records[2].customer).toEqual({ id: 'cus_1', email: 'a@b.com' });
    });

    it('falls back to N+1 get when batchGet not available', async () => {
      const get = vi.fn().mockImplementation(async (_model: string, id: string) => {
        if (id === 'cus_1') return { id: 'cus_1', email: 'a@b.com' };
        if (id === 'cus_2') return { id: 'cus_2', email: 'c@d.com' };
        return null;
      });
      const adapter: DataAdapter = { get };

      const adapterRegistry = new AdapterRegistry();
      adapterRegistry.register('stripe', adapter);

      const externalModel = makeExternalModel('billing.Customer', 'stripe');
      const internalModel = makeInternalModel('sales.Order');

      const relationships: ModelRelationship[] = [
        { type: 'link', from: 'sales.Order', field: 'customer', to: 'billing.Customer' },
      ];

      const registry = makeRegistry([internalModel, externalModel], relationships);

      const records = [
        { id: 'ord_1', customer: 'cus_1', total: 100 },
        { id: 'ord_2', customer: 'cus_2', total: 200 },
      ];

      await resolveModelIncludes(records, ['customer'], registry, {} as any, 'sales.Order', {
        adapterRegistry,
        externalModelFields: {
          'billing.Customer': { id: { type: 'string' }, email: { type: 'string' } },
        },
      });

      expect(get).toHaveBeenCalledTimes(2);
      expect(records[0].customer).toEqual({ id: 'cus_1', email: 'a@b.com' });
      expect(records[1].customer).toEqual({ id: 'cus_2', email: 'c@d.com' });
    });

    it('sets null for missing external records', async () => {
      const batchGet = vi.fn().mockResolvedValue([{ id: 'cus_1', email: 'a@b.com' }]);
      const adapter: DataAdapter = {
        async get() {
          return null;
        },
        batchGet,
      };

      const adapterRegistry = new AdapterRegistry();
      adapterRegistry.register('stripe', adapter);

      const externalModel = makeExternalModel('billing.Customer', 'stripe');
      const internalModel = makeInternalModel('sales.Order');

      const relationships: ModelRelationship[] = [
        { type: 'link', from: 'sales.Order', field: 'customer', to: 'billing.Customer' },
      ];

      const registry = makeRegistry([internalModel, externalModel], relationships);

      const records = [
        { id: 'ord_1', customer: 'cus_1', total: 100 },
        { id: 'ord_2', customer: 'cus_99', total: 200 },
      ];

      await resolveModelIncludes(records, ['customer'], registry, {} as any, 'sales.Order', {
        adapterRegistry,
        externalModelFields: {
          'billing.Customer': { id: { type: 'string' }, email: { type: 'string' } },
        },
      });

      expect(records[0].customer).toEqual({ id: 'cus_1', email: 'a@b.com' });
      expect(records[1].customer).toBeNull();
    });

    it('applies field mapping to resolved records', async () => {
      const batchGet = vi
        .fn()
        .mockResolvedValue([
          { id: 'cus_1', metadata: { company_name: 'Acme Corp' }, email: 'acme@test.com' },
        ]);
      const adapter: DataAdapter = {
        async get() {
          return null;
        },
        batchGet,
      };

      const adapterRegistry = new AdapterRegistry();
      adapterRegistry.register('stripe', adapter);

      const externalModel = makeExternalModel('billing.Customer', 'stripe');
      const internalModel = makeInternalModel('sales.Order');

      const relationships: ModelRelationship[] = [
        { type: 'link', from: 'sales.Order', field: 'customer', to: 'billing.Customer' },
      ];

      const registry = makeRegistry([internalModel, externalModel], relationships);

      const records = [{ id: 'ord_1', customer: 'cus_1' }];

      await resolveModelIncludes(records, ['customer'], registry, {} as any, 'sales.Order', {
        adapterRegistry,
        externalModelFields: {
          'billing.Customer': {
            id: { type: 'string' },
            name: { type: 'string', from: 'metadata.company_name' },
            email: { type: 'string' },
          },
        },
      });

      expect(records[0].customer).toEqual({
        id: 'cus_1',
        name: 'Acme Corp',
        email: 'acme@test.com',
      });
    });
  });

  describe('internal to external (hasMany)', () => {
    it('uses adapter.list with foreign key filter', async () => {
      const list = vi.fn().mockResolvedValue({
        data: [
          { id: 'inv_1', order_id: 'ord_1', amount: 100 },
          { id: 'inv_2', order_id: 'ord_1', amount: 50 },
          { id: 'inv_3', order_id: 'ord_2', amount: 200 },
        ],
      });
      const adapter: DataAdapter = {
        async get() {
          return null;
        },
        list,
      };

      const adapterRegistry = new AdapterRegistry();
      adapterRegistry.register('stripe', adapter);

      const externalModel = makeExternalModel('billing.Invoice', 'stripe');
      const internalModel = makeInternalModel('sales.Order');

      const relationships: ModelRelationship[] = [
        {
          type: 'hasMany',
          from: 'sales.Order',
          field: 'invoices',
          to: 'billing.Invoice',
          foreignKey: 'order_id',
        },
      ];

      const registry = makeRegistry([internalModel, externalModel], relationships);

      const records: Record<string, unknown>[] = [
        { id: 'ord_1', total: 150 },
        { id: 'ord_2', total: 200 },
      ];

      await resolveModelIncludes(records, ['invoices'], registry, {} as any, 'sales.Order', {
        adapterRegistry,
        externalModelFields: {
          'billing.Invoice': {
            id: { type: 'string' },
            order_id: { type: 'string' },
            amount: { type: 'decimal' },
          },
        },
      });

      expect(list).toHaveBeenCalledWith('billing.Invoice', {
        filters: [{ field: 'order_id', operator: 'in', value: ['ord_1', 'ord_2'] }],
      });
      expect(records[0].invoices).toHaveLength(2);
      expect(records[1].invoices).toHaveLength(1);
    });

    it('returns empty array when adapter has no list capability', async () => {
      const adapter: DataAdapter = {
        async get() {
          return null;
        },
      };

      const adapterRegistry = new AdapterRegistry();
      adapterRegistry.register('stripe', adapter);

      const externalModel = makeExternalModel('billing.Invoice', 'stripe');
      const internalModel = makeInternalModel('sales.Order');

      const relationships: ModelRelationship[] = [
        {
          type: 'hasMany',
          from: 'sales.Order',
          field: 'invoices',
          to: 'billing.Invoice',
          foreignKey: 'order_id',
        },
      ];

      const registry = makeRegistry([internalModel, externalModel], relationships);

      const records: Record<string, unknown>[] = [{ id: 'ord_1', total: 100 }];

      await resolveModelIncludes(records, ['invoices'], registry, {} as any, 'sales.Order', {
        adapterRegistry,
        externalModelFields: {
          'billing.Invoice': { id: { type: 'string' }, order_id: { type: 'string' } },
        },
      });

      expect(records[0].invoices).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('handles empty records array', async () => {
      const adapterRegistry = new AdapterRegistry();
      adapterRegistry.register('stripe', {
        async get() {
          return null;
        },
      });

      const registry = makeRegistry([], []);
      const records: Record<string, unknown>[] = [];

      await resolveModelIncludes(records, ['customer'], registry, {} as any, 'sales.Order', {
        adapterRegistry,
      });

      expect(records).toEqual([]);
    });

    it('handles null foreign key values gracefully', async () => {
      const batchGet = vi.fn().mockResolvedValue([]);
      const adapter: DataAdapter = {
        async get() {
          return null;
        },
        batchGet,
      };

      const adapterRegistry = new AdapterRegistry();
      adapterRegistry.register('stripe', adapter);

      const externalModel = makeExternalModel('billing.Customer', 'stripe');
      const internalModel = makeInternalModel('sales.Order');

      const relationships: ModelRelationship[] = [
        { type: 'link', from: 'sales.Order', field: 'customer', to: 'billing.Customer' },
      ];

      const registry = makeRegistry([internalModel, externalModel], relationships);

      const records = [
        { id: 'ord_1', customer: null },
        { id: 'ord_2', customer: undefined },
      ];

      await resolveModelIncludes(records, ['customer'], registry, {} as any, 'sales.Order', {
        adapterRegistry,
        externalModelFields: { 'billing.Customer': { id: { type: 'string' } } },
      });

      expect(records[0].customer).toBeNull();
      expect(records[1].customer).toBeNull();
    });
  });
});
