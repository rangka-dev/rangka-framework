import { describe, it, expect, vi } from 'vitest';
import { resolveIncludes } from '../include-resolver.js';
import type { SchemaRegistry } from '../../schema/registry.js';
import type { ModelRelationship } from '../../schema/types.js';
import type { ParsedInclude } from '../query-parser.js';

// --- Test helpers ---

function makeRegistry(relationships: ModelRelationship[]): SchemaRegistry {
  return {
    getRelationshipsForModel: (model: string) => relationships.filter((r) => r.from === model),
    getModel: (qn: string) => ({ qualifiedName: qn }),
  } as unknown as SchemaRegistry;
}

/**
 * Creates a mock Kysely-like DB that stores tables in memory.
 * Supports selectFrom with where('id', 'in', [...]) and where(field, 'in', [...]).
 * Also supports innerJoin for manyToMany queries.
 */
function makeMockDb(tables: Record<string, any[]>) {
  const db: any = {
    selectFrom: vi.fn((table: string) => {
      const q: any = {
        _table: table,
        _wheres: [] as any[],
        _joins: [] as any[],
        _selectAll: false,
        _selects: [] as string[],
      };
      q.selectAll = vi.fn(() => {
        q._selectAll = true;
        return q;
      });
      q.select = vi.fn((fields: string[]) => {
        q._selects.push(...fields);
        return q;
      });
      q.where = vi.fn((field: string, op: string, value: any) => {
        q._wheres.push({ field, op, value });
        return q;
      });
      q.innerJoin = vi.fn((junctionTable: string, joinCol1: string, joinCol2: string) => {
        q._joins.push({ junctionTable, joinCol1, joinCol2 });
        return q;
      });
      q.execute = vi.fn(async () => {
        let data = tables[q._table] ?? [];

        // Handle manyToMany join
        if (q._joins.length > 0) {
          const join = q._joins[0];
          const junctionData = tables[join.junctionTable] ?? [];
          // join.joinCol1 = "junction.target_fk", join.joinCol2 = "target.id"
          const targetFk = join.joinCol1.split('.')[1];
          const sourceFk = q._wheres.find((w: any) => w.op === 'in')?.field?.split('.')[1];
          const sourceIds = q._wheres.find((w: any) => w.op === 'in')?.value ?? [];

          const results: any[] = [];
          for (const jRow of junctionData) {
            if (sourceIds.includes(jRow[sourceFk!])) {
              const target = data.find((t: any) => t.id === jRow[targetFk]);
              if (target) {
                results.push({ ...target, _source_fk: jRow[sourceFk!] });
              }
            }
          }
          return results;
        }

        // Handle IN queries
        for (const w of q._wheres) {
          if (w.op === 'in') {
            const field = w.field;
            data = data.filter((r: any) => w.value.includes(r[field]));
          }
        }
        return data;
      });
      return q;
    }),
  };
  return db;
}

function makeRequest(scopeFilters: any[] = []): any {
  return {
    _scopeFilters: scopeFilters,
  };
}

// --- Tests ---

describe('resolveIncludes', () => {
  describe('link (belongs-to)', () => {
    const relationships: ModelRelationship[] = [
      { type: 'link', from: 'sales.invoice', field: 'customer', to: 'sales.customer' },
    ];

    it('resolves single FK to full object', async () => {
      const registry = makeRegistry(relationships);
      const db = makeMockDb({
        sales__customer: [
          { id: 'C-001', name: 'Acme Corp' },
          { id: 'C-002', name: 'Globex' },
        ],
      });
      const records = [
        { id: 'inv-001', customer: 'C-001', total: 100 },
        { id: 'inv-002', customer: 'C-002', total: 200 },
      ];
      const includes: ParsedInclude[] = [{ relation: 'customer' }];

      await resolveIncludes(records, includes, registry, db, 'sales.invoice', makeRequest());

      expect(records[0].customer).toEqual({ id: 'C-001', name: 'Acme Corp' });
      expect(records[1].customer).toEqual({ id: 'C-002', name: 'Globex' });
    });

    it('returns null for orphaned FK', async () => {
      const registry = makeRegistry(relationships);
      const db = makeMockDb({
        sales__customer: [{ id: 'C-001', name: 'Acme Corp' }],
      });
      const records = [{ id: 'inv-001', customer: 'C-999', total: 100 }];
      const includes: ParsedInclude[] = [{ relation: 'customer' }];

      await resolveIncludes(records, includes, registry, db, 'sales.invoice', makeRequest());

      expect(records[0].customer).toBeNull();
    });

    it('deduplicates IDs in batch query', async () => {
      const registry = makeRegistry(relationships);
      const db = makeMockDb({
        sales__customer: [{ id: 'C-001', name: 'Acme Corp' }],
      });
      const records = [
        { id: 'inv-001', customer: 'C-001', total: 100 },
        { id: 'inv-002', customer: 'C-001', total: 200 },
      ];
      const includes: ParsedInclude[] = [{ relation: 'customer' }];

      await resolveIncludes(records, includes, registry, db, 'sales.invoice', makeRequest());

      expect(records[0].customer).toEqual({ id: 'C-001', name: 'Acme Corp' });
      expect(records[1].customer).toEqual({ id: 'C-001', name: 'Acme Corp' });
      // Only one selectFrom call (batched)
      expect(db.selectFrom).toHaveBeenCalledTimes(1);
    });
  });

  describe('hasMany (one-to-many)', () => {
    const relationships: ModelRelationship[] = [
      {
        type: 'hasMany',
        from: 'sales.invoice',
        field: 'items',
        to: 'sales.invoice_item',
        foreignKey: 'invoice_id',
      },
    ];

    it('returns array grouped by parent', async () => {
      const registry = makeRegistry(relationships);
      const db = makeMockDb({
        sales__invoice_item: [
          { id: 'item-001', invoice_id: 'inv-001', qty: 10 },
          { id: 'item-002', invoice_id: 'inv-001', qty: 5 },
          { id: 'item-003', invoice_id: 'inv-002', qty: 3 },
        ],
      });
      const records: any[] = [
        { id: 'inv-001', total: 100 },
        { id: 'inv-002', total: 200 },
      ];
      const includes: ParsedInclude[] = [{ relation: 'items' }];

      await resolveIncludes(records, includes, registry, db, 'sales.invoice', makeRequest());

      expect(records[0].items).toHaveLength(2);
      expect(records[0].items[0].id).toBe('item-001');
      expect(records[1].items).toHaveLength(1);
      expect(records[1].items[0].id).toBe('item-003');
    });

    it('returns empty array when no children exist', async () => {
      const registry = makeRegistry(relationships);
      const db = makeMockDb({ sales__invoice_item: [] });
      const records: any[] = [{ id: 'inv-001', total: 100 }];
      const includes: ParsedInclude[] = [{ relation: 'items' }];

      await resolveIncludes(records, includes, registry, db, 'sales.invoice', makeRequest());

      expect(records[0].items).toEqual([]);
    });
  });

  describe('children (parent-child)', () => {
    const relationships: ModelRelationship[] = [
      {
        type: 'children',
        from: 'sales.order',
        field: 'items',
        to: 'sales.order_item',
        foreignKey: 'order_id',
      },
    ];

    it('behaves same as hasMany', async () => {
      const registry = makeRegistry(relationships);
      const db = makeMockDb({
        sales__order_item: [
          { id: 'oi-001', order_id: 'ord-001', qty: 2 },
          { id: 'oi-002', order_id: 'ord-001', qty: 7 },
        ],
      });
      const records: any[] = [{ id: 'ord-001', total: 500 }];
      const includes: ParsedInclude[] = [{ relation: 'items' }];

      await resolveIncludes(records, includes, registry, db, 'sales.order', makeRequest());

      expect(records[0].items).toHaveLength(2);
      expect(records[0].items[0].id).toBe('oi-001');
    });
  });

  describe('manyToMany', () => {
    const relationships: ModelRelationship[] = [
      {
        type: 'manyToMany',
        from: 'sales.order',
        field: 'tags',
        to: 'core.tag',
        through: 'sales.order_tag',
      },
    ];

    it('resolves through junction table', async () => {
      const registry = makeRegistry(relationships);
      const db = makeMockDb({
        core__tag: [
          { id: 'tag-001', name: 'urgent' },
          { id: 'tag-002', name: 'vip' },
        ],
        sales__order_tag: [
          { order_id: 'ord-001', tag_id: 'tag-001' },
          { order_id: 'ord-001', tag_id: 'tag-002' },
          { order_id: 'ord-002', tag_id: 'tag-001' },
        ],
      });
      const records: any[] = [
        { id: 'ord-001', total: 100 },
        { id: 'ord-002', total: 200 },
      ];
      const includes: ParsedInclude[] = [{ relation: 'tags' }];

      await resolveIncludes(records, includes, registry, db, 'sales.order', makeRequest());

      expect(records[0].tags).toHaveLength(2);
      expect(records[0].tags.map((t: any) => t.name)).toContain('urgent');
      expect(records[0].tags.map((t: any) => t.name)).toContain('vip');
      expect(records[1].tags).toHaveLength(1);
      expect(records[1].tags[0].name).toBe('urgent');
    });

    it('returns empty array when no associations', async () => {
      const registry = makeRegistry(relationships);
      const db = makeMockDb({
        core__tag: [{ id: 'tag-001', name: 'urgent' }],
        sales__order_tag: [],
      });
      const records: any[] = [{ id: 'ord-001', total: 100 }];
      const includes: ParsedInclude[] = [{ relation: 'tags' }];

      await resolveIncludes(records, includes, registry, db, 'sales.order', makeRequest());

      expect(records[0].tags).toEqual([]);
    });
  });

  describe('dynamicLink (polymorphic)', () => {
    const relationships: ModelRelationship[] = [
      {
        type: 'dynamicLink',
        from: 'core.comment',
        field: 'reference',
        to: '*',
        modelField: 'reference_type',
      },
    ];

    it('resolves grouped by discriminator', async () => {
      const registry = makeRegistry(relationships);
      const db = makeMockDb({
        sales__order: [{ id: 'ord-001', total: 500 }],
        sales__invoice: [{ id: 'inv-001', total: 1000 }],
      });
      const records: any[] = [
        { id: 'cmt-001', reference_type: 'sales.order', reference: 'ord-001' },
        { id: 'cmt-002', reference_type: 'sales.invoice', reference: 'inv-001' },
      ];
      const includes: ParsedInclude[] = [{ relation: 'reference' }];

      await resolveIncludes(records, includes, registry, db, 'core.comment', makeRequest());

      expect(records[0].reference).toEqual({ id: 'ord-001', total: 500 });
      expect(records[1].reference).toEqual({ id: 'inv-001', total: 1000 });
    });

    it('returns null when target not found', async () => {
      const registry = makeRegistry(relationships);
      const db = makeMockDb({ sales__order: [] });
      const records: any[] = [
        { id: 'cmt-001', reference_type: 'sales.order', reference: 'ord-999' },
      ];
      const includes: ParsedInclude[] = [{ relation: 'reference' }];

      await resolveIncludes(records, includes, registry, db, 'core.comment', makeRequest());

      expect(records[0].reference).toBeNull();
    });
  });

  describe('nested includes (depth 2)', () => {
    const relationships: ModelRelationship[] = [
      {
        type: 'children',
        from: 'sales.invoice',
        field: 'items',
        to: 'sales.invoice_item',
        foreignKey: 'invoice_id',
      },
      {
        type: 'link',
        from: 'sales.invoice_item',
        field: 'item_group',
        to: 'core.item_group',
      },
    ];

    it('resolves depth-2 nested includes', async () => {
      const registry = makeRegistry(relationships);
      const db = makeMockDb({
        sales__invoice_item: [
          { id: 'item-001', invoice_id: 'inv-001', item_group: 'grp-001', qty: 10 },
          { id: 'item-002', invoice_id: 'inv-001', item_group: 'grp-002', qty: 5 },
        ],
        core__item_group: [
          { id: 'grp-001', name: 'Finished Goods' },
          { id: 'grp-002', name: 'Raw Materials' },
        ],
      });
      const records: any[] = [{ id: 'inv-001', total: 1000 }];
      const includes: ParsedInclude[] = [
        { relation: 'items', nested: [{ relation: 'item_group' }] },
      ];

      await resolveIncludes(records, includes, registry, db, 'sales.invoice', makeRequest());

      expect(records[0].items[0].item_group).toEqual({ id: 'grp-001', name: 'Finished Goods' });
      expect(records[0].items[1].item_group).toEqual({ id: 'grp-002', name: 'Raw Materials' });
    });
  });

  describe('edge cases', () => {
    it('handles empty records array', async () => {
      const registry = makeRegistry([
        { type: 'link', from: 'sales.invoice', field: 'customer', to: 'sales.customer' },
      ]);
      const db = makeMockDb({});
      const records: any[] = [];
      const includes: ParsedInclude[] = [{ relation: 'customer' }];

      await resolveIncludes(records, includes, registry, db, 'sales.invoice', makeRequest());

      expect(records).toEqual([]);
    });

    it('handles null FK values in link fields', async () => {
      const registry = makeRegistry([
        { type: 'link', from: 'sales.invoice', field: 'customer', to: 'sales.customer' },
      ]);
      const db = makeMockDb({ sales__customer: [{ id: 'C-001', name: 'Acme' }] });
      const records: any[] = [{ id: 'inv-001', customer: null, total: 100 }];
      const includes: ParsedInclude[] = [{ relation: 'customer' }];

      await resolveIncludes(records, includes, registry, db, 'sales.invoice', makeRequest());

      expect(records[0].customer).toBeNull();
    });
  });
});
