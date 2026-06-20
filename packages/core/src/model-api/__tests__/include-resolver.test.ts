import { describe, it, expect, vi } from 'vitest';
import { resolveModelIncludes } from '../include-resolver.js';
import type { SchemaRegistry } from '../../schema/registry.js';
import type { ModelRelationship } from '../../schema/types.js';

function makeRegistry(relationships: ModelRelationship[]): SchemaRegistry {
  return {
    getRelationshipsForModel: (model: string) => relationships.filter((r) => r.from === model),
    getModel: (qn: string) => ({ qualifiedName: qn }),
    getAllModels: () => [],
    getFieldsForModel: () => [],
  } as unknown as SchemaRegistry;
}

function makeMockDb(tables: Record<string, any[]>) {
  const db: any = {
    selectFrom: vi.fn((table: string) => {
      const q: any = {
        _table: table,
        _wheres: [] as any[],
      };
      q.selectAll = vi.fn((..._args: any[]) => q);
      q.select = vi.fn(() => q);
      q.innerJoin = vi.fn(() => q);
      q.where = vi.fn((field: string, op: string, value: any) => {
        q._wheres.push({ field, op, value });
        return q;
      });
      q.execute = vi.fn(async () => {
        const tableData = tables[table] ?? [];
        const inFilter = q._wheres.find((w: any) => w.op === 'in');
        if (inFilter) {
          return tableData.filter((row: any) => {
            const fieldName = inFilter.field.includes('.')
              ? inFilter.field.split('.').pop()
              : inFilter.field;
            return inFilter.value.includes(row[fieldName]);
          });
        }
        return tableData;
      });
      return q;
    }),
  };
  return db;
}

describe('resolveModelIncludes', () => {
  describe('link relationship', () => {
    it('resolves link by collecting IDs and batch-fetching', async () => {
      const relationships: ModelRelationship[] = [
        { type: 'link', from: 'sales.Order', field: 'customer', to: 'billing.Customer' },
      ];
      const registry = makeRegistry(relationships);
      const db = makeMockDb({
        billing__Customer: [
          { id: 'c1', name: 'Acme' },
          { id: 'c2', name: 'Beta' },
        ],
      });

      const records = [
        { id: 'o1', customer: 'c1' },
        { id: 'o2', customer: 'c2' },
        { id: 'o3', customer: 'c1' },
      ];

      await resolveModelIncludes(records, ['customer'], registry, db, 'sales.Order');

      expect(records[0].customer).toEqual({ id: 'c1', name: 'Acme' });
      expect(records[1].customer).toEqual({ id: 'c2', name: 'Beta' });
      expect(records[2].customer).toEqual({ id: 'c1', name: 'Acme' });
    });

    it('sets null when link ID is null', async () => {
      const relationships: ModelRelationship[] = [
        { type: 'link', from: 'sales.Order', field: 'customer', to: 'billing.Customer' },
      ];
      const registry = makeRegistry(relationships);
      const db = makeMockDb({ billing__Customer: [] });

      const records = [{ id: 'o1', customer: null }];
      await resolveModelIncludes(records, ['customer'], registry, db, 'sales.Order');

      expect(records[0].customer).toBeNull();
    });

    it('sets null when referenced record does not exist', async () => {
      const relationships: ModelRelationship[] = [
        { type: 'link', from: 'sales.Order', field: 'customer', to: 'billing.Customer' },
      ];
      const registry = makeRegistry(relationships);
      const db = makeMockDb({ billing__Customer: [] });

      const records = [{ id: 'o1', customer: 'non-existent' }];
      await resolveModelIncludes(records, ['customer'], registry, db, 'sales.Order');

      expect(records[0].customer).toBeNull();
    });

    it('deduplicates IDs for batch fetch', async () => {
      const relationships: ModelRelationship[] = [
        { type: 'link', from: 'sales.Order', field: 'customer', to: 'billing.Customer' },
      ];
      const registry = makeRegistry(relationships);
      const db = makeMockDb({
        billing__Customer: [{ id: 'c1', name: 'Acme' }],
      });

      const records = [
        { id: 'o1', customer: 'c1' },
        { id: 'o2', customer: 'c1' },
        { id: 'o3', customer: 'c1' },
      ];

      await resolveModelIncludes(records, ['customer'], registry, db, 'sales.Order');

      expect(db.selectFrom).toHaveBeenCalledTimes(1);
    });
  });

  describe('hasMany relationship', () => {
    it('resolves hasMany by fetching children by foreign key', async () => {
      const relationships: ModelRelationship[] = [
        {
          type: 'hasMany',
          from: 'sales.Order',
          field: 'lineItems',
          to: 'sales.LineItem',
          foreignKey: 'order_id',
        },
      ];
      const registry = makeRegistry(relationships);
      const db = makeMockDb({
        sales__LineItem: [
          { id: 'li1', order_id: 'o1', product: 'Widget' },
          { id: 'li2', order_id: 'o1', product: 'Gadget' },
          { id: 'li3', order_id: 'o2', product: 'Thingy' },
        ],
      });

      const records: any[] = [
        { id: 'o1', status: 'confirmed' },
        { id: 'o2', status: 'draft' },
      ];

      await resolveModelIncludes(records, ['lineItems'], registry, db, 'sales.Order');

      expect(records[0].lineItems).toHaveLength(2);
      expect(records[1].lineItems).toHaveLength(1);
      expect(records[0].lineItems[0].product).toBe('Widget');
    });

    it('returns empty array when no children exist', async () => {
      const relationships: ModelRelationship[] = [
        {
          type: 'hasMany',
          from: 'sales.Order',
          field: 'lineItems',
          to: 'sales.LineItem',
          foreignKey: 'order_id',
        },
      ];
      const registry = makeRegistry(relationships);
      const db = makeMockDb({ sales__LineItem: [] });

      const records: any[] = [{ id: 'o1', status: 'confirmed' }];
      await resolveModelIncludes(records, ['lineItems'], registry, db, 'sales.Order');

      expect(records[0].lineItems).toEqual([]);
    });
  });

  describe('unknown relation', () => {
    it('silently skips unknown relation names', async () => {
      const registry = makeRegistry([]);
      const db = makeMockDb({});

      const records = [{ id: 'o1', name: 'Test' }];
      await resolveModelIncludes(records, ['nonExistent'], registry, db, 'sales.Order');

      expect(records[0]).toEqual({ id: 'o1', name: 'Test' });
    });
  });

  describe('empty records', () => {
    it('does nothing when records array is empty', async () => {
      const relationships: ModelRelationship[] = [
        { type: 'link', from: 'sales.Order', field: 'customer', to: 'billing.Customer' },
      ];
      const registry = makeRegistry(relationships);
      const db = makeMockDb({});

      const records: any[] = [];
      await resolveModelIncludes(records, ['customer'], registry, db, 'sales.Order');

      expect(db.selectFrom).not.toHaveBeenCalled();
    });
  });

  describe('multiple includes', () => {
    it('resolves multiple relations on same records', async () => {
      const relationships: ModelRelationship[] = [
        { type: 'link', from: 'sales.Order', field: 'customer', to: 'billing.Customer' },
        {
          type: 'hasMany',
          from: 'sales.Order',
          field: 'lineItems',
          to: 'sales.LineItem',
          foreignKey: 'order_id',
        },
      ];
      const registry = makeRegistry(relationships);
      const db = makeMockDb({
        billing__Customer: [{ id: 'c1', name: 'Acme' }],
        sales__LineItem: [{ id: 'li1', order_id: 'o1', product: 'Widget' }],
      });

      const records: any[] = [{ id: 'o1', customer: 'c1' }];
      await resolveModelIncludes(records, ['customer', 'lineItems'], registry, db, 'sales.Order');

      expect(records[0].customer).toEqual({ id: 'c1', name: 'Acme' });
      expect(records[0].lineItems).toHaveLength(1);
    });
  });
});
