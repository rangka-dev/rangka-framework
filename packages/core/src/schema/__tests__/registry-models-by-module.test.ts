import { describe, it, expect } from 'vitest';
import { SchemaRegistry } from '../registry.js';
import type { ResolvedModel } from '../types.js';

function makeModel(module: string, name: string): ResolvedModel {
  return {
    qualifiedName: `${module}.${name}`,
    app: 'test',
    module,
    name,
    auditLog: false,
    traits: [],
    fields: [{ name: 'id', config: { type: 'string' }, provenance: { source: 'base' } }],
    indexes: [],
  };
}

describe('SchemaRegistry.getModelsByModule', () => {
  it('returns empty map for empty registry', () => {
    const registry = new SchemaRegistry([]);
    const result = registry.getModelsByModule();
    expect(result.size).toBe(0);
  });

  it('groups models by module', () => {
    const models = [
      makeModel('sales', 'invoice'),
      makeModel('sales', 'customer'),
      makeModel('accounting', 'journal_entry'),
    ];
    const registry = new SchemaRegistry(models);
    const result = registry.getModelsByModule();

    expect(result.size).toBe(2);
    expect(result.get('sales')).toHaveLength(2);
    expect(result.get('accounting')).toHaveLength(1);
  });

  it('preserves model data', () => {
    const models = [makeModel('sales', 'invoice')];
    const registry = new SchemaRegistry(models);
    const result = registry.getModelsByModule();
    const salesModels = result.get('sales')!;
    expect(salesModels[0].qualifiedName).toBe('sales.invoice');
    expect(salesModels[0].name).toBe('invoice');
  });

  it('handles single module with multiple models', () => {
    const models = [
      makeModel('hr', 'employee'),
      makeModel('hr', 'department'),
      makeModel('hr', 'leave_request'),
    ];
    const registry = new SchemaRegistry(models);
    const result = registry.getModelsByModule();
    expect(result.get('hr')).toHaveLength(3);
  });
});
