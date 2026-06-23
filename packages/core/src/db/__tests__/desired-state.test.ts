import { describe, it, expect } from 'vitest';
import { SchemaToDesired } from '../desired-state.js';
import { SchemaRegistry } from '../../schema/registry.js';
import type { ResolvedModel } from '../../schema/types.js';

function makeModel(overrides: Partial<ResolvedModel> = {}): ResolvedModel {
  return {
    qualifiedName: 'sales.invoice',
    app: 'sales',
    module: 'sales',
    name: 'invoice',
    auditLog: true,
    traits: [],
    fields: [],
    indexes: [],
    ...overrides,
  };
}

function makeRegistry(models: ResolvedModel[]): SchemaRegistry {
  return new SchemaRegistry(models);
}

describe('SchemaToDesired', () => {
  const converter = new SchemaToDesired();

  it('converts simple model to table definition', () => {
    const registry = makeRegistry([
      makeModel({
        fields: [
          {
            name: 'title',
            config: { type: 'string', maxLength: 200 },
            provenance: { source: 'base' },
          },
          { name: 'amount', config: { type: 'decimal' }, provenance: { source: 'base' } },
        ],
      }),
    ]);

    const state = converter.convert(registry);
    const userTables = state.tables.filter((t) => !t.name.startsWith('rangka_'));
    expect(userTables).toHaveLength(1);
    expect(userTables[0].name).toBe('sales__invoice');
    expect(userTables[0].columns.find((c) => c.name === 'id')).toBeDefined();
    expect(state.tables[0].columns.find((c) => c.name === 'title')).toBeDefined();
    expect(state.tables[0].columns.find((c) => c.name === 'amount')).toBeDefined();
  });

  it('maps table name using double underscore', () => {
    const registry = makeRegistry([makeModel({ qualifiedName: 'accounting.journal_entry' })]);

    const state = converter.convert(registry);
    expect(state.tables[0].name).toBe('accounting__journal_entry');
  });

  it('generates indexes from model config', () => {
    const registry = makeRegistry([
      makeModel({
        indexes: [{ fields: ['customer', 'posting_date'] }, { fields: ['email'], unique: true }],
      }),
    ]);

    const state = converter.convert(registry);
    const indexes = state.tables[0].indexes;
    expect(indexes).toHaveLength(2);
    expect(indexes[0].name).toBe('idx_sales__invoice_customer_posting_date');
    expect(indexes[0].unique).toBe(false);
    expect(indexes[1].name).toBe('uidx_sales__invoice_email');
    expect(indexes[1].unique).toBe(true);
  });

  it('generates rangka_naming_sequence table when sequence fields exist', () => {
    const registry = makeRegistry([
      makeModel({
        fields: [
          {
            name: 'invoice_number',
            config: { type: 'sequence', prefix: 'INV-', digits: 5 },
            provenance: { source: 'base' },
          },
        ],
      }),
    ]);

    const state = converter.convert(registry);
    const seqTable = state.tables.find((t) => t.name === 'rangka_naming_sequence');
    expect(seqTable).toBeDefined();
    expect(seqTable!.columns.map((c) => c.name)).toEqual(['model', 'field', 'next_val']);
    expect(seqTable!.indexes[0].unique).toBe(true);
  });

  it('does not generate rangka_naming_sequence table when no sequence fields', () => {
    const registry = makeRegistry([
      makeModel({
        fields: [{ name: 'title', config: { type: 'string' }, provenance: { source: 'base' } }],
      }),
    ]);

    const state = converter.convert(registry);
    expect(state.tables.find((t) => t.name === 'rangka_naming_sequence')).toBeUndefined();
  });

  it('includes extra tables from closure_table tree strategy', () => {
    const registry = makeRegistry([
      makeModel({
        fields: [
          {
            name: 'parent',
            config: { type: 'tree', parentField: 'parent_id', strategy: 'closure_table' },
            provenance: { source: 'base' },
          },
        ],
      }),
    ]);

    const state = converter.convert(registry);
    expect(state.tables.find((t) => t.name === 'sales__invoice_closure')).toBeDefined();
  });

  it('handles multiple models', () => {
    const registry = makeRegistry([
      makeModel({ qualifiedName: 'sales.invoice', name: 'invoice' }),
      makeModel({ qualifiedName: 'sales.customer', name: 'customer' }),
    ]);

    const state = converter.convert(registry);
    const userTables = state.tables.filter((t) => !t.name.startsWith('rangka_'));
    expect(userTables).toHaveLength(2);
    expect(userTables.map((t) => t.name).sort()).toEqual(['sales__customer', 'sales__invoice']);
  });
});
