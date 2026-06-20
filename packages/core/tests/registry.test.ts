import { describe, it, expect } from 'vitest';
import { SchemaRegistry } from '../src/schema/registry.js';
import { field } from '@rangka/shared';

function buildTestModels(): ResolvedModel[] {
  return [
    {
      qualifiedName: 'sales.customer',
      app: 'sales',
      module: 'sales',
      name: 'customer',
      label: 'Customer',
      auditLog: true,
      traits: ['timestamped'],
      fields: [
        {
          name: 'created_at',
          config: { type: 'datetime' },
          provenance: { source: 'trait', trait: 'timestamped' },
        },
        {
          name: 'updated_at',
          config: { type: 'datetime' },
          provenance: { source: 'trait', trait: 'timestamped' },
        },
        {
          name: 'created_by',
          config: { type: 'link', model: 'user' },
          provenance: { source: 'trait', trait: 'timestamped' },
        },
        {
          name: 'updated_by',
          config: { type: 'link', model: 'user' },
          provenance: { source: 'trait', trait: 'timestamped' },
        },
        {
          name: 'name',
          config: field.string({ required: true }),
          provenance: { source: 'base', app: 'sales' },
        },
        { name: 'email', config: field.string(), provenance: { source: 'base', app: 'sales' } },
        {
          name: 'loyalty_points',
          config: field.int({ default: 0 }),
          provenance: { source: 'extension', app: 'project' },
        },
      ],
      indexes: [{ fields: ['email'] }],
    },
    {
      qualifiedName: 'sales.invoice',
      app: 'sales',
      module: 'sales',
      name: 'invoice',
      label: 'Sales Invoice',
      auditLog: true,
      traits: [],
      fields: [
        {
          name: 'customer',
          config: field.link('customer'),
          provenance: { source: 'base', app: 'sales' },
        },
        {
          name: 'items',
          config: field.children('invoice_item', { foreignKey: 'invoice_id' }),
          provenance: { source: 'base', app: 'sales' },
        },
        {
          name: 'tags',
          config: field.manyToMany('tag', { through: 'invoice_tag' }),
          provenance: { source: 'base', app: 'sales' },
        },
        {
          name: 'source_doc',
          config: field.dynamicLink('source_type'),
          provenance: { source: 'base', app: 'sales' },
        },
        {
          name: 'payments',
          config: field.hasMany('payment_entry', { foreignKey: 'invoice_id' }),
          provenance: { source: 'base', app: 'sales' },
        },
      ],
      indexes: [],
    },
    {
      qualifiedName: 'sales.invoice_item',
      app: 'sales',
      module: 'sales',
      name: 'invoice_item',
      auditLog: true,
      traits: [],
      fields: [
        { name: 'item', config: field.string(), provenance: { source: 'base', app: 'sales' } },
        { name: 'qty', config: field.int(), provenance: { source: 'base', app: 'sales' } },
      ],
      indexes: [],
    },
  ];
}

describe('SchemaRegistry', () => {
  it('getModel returns a model by qualified name', () => {
    const registry = new SchemaRegistry(buildTestModels());
    const model = registry.getModel('sales.customer');

    expect(model).toBeDefined();
    expect(model!.qualifiedName).toBe('sales.customer');
    expect(model!.label).toBe('Customer');
  });

  it('getModel returns undefined for unknown model', () => {
    const registry = new SchemaRegistry(buildTestModels());
    expect(registry.getModel('nonexistent.model')).toBeUndefined();
  });

  it('getAllModels returns all resolved models', () => {
    const registry = new SchemaRegistry(buildTestModels());
    const all = registry.getAllModels();
    expect(all).toHaveLength(3);
  });

  it('getFieldsForModel returns fields with provenance', () => {
    const registry = new SchemaRegistry(buildTestModels());
    const fields = registry.getFieldsForModel('sales.customer');

    expect(fields.length).toBeGreaterThan(0);

    const traitField = fields.find((f) => f.name === 'created_at');
    expect(traitField!.provenance).toEqual({ source: 'trait', trait: 'timestamped' });

    const baseField = fields.find((f) => f.name === 'name');
    expect(baseField!.provenance).toEqual({ source: 'base', app: 'sales' });

    const extField = fields.find((f) => f.name === 'loyalty_points');
    expect(extField!.provenance).toEqual({ source: 'extension', app: 'project' });
  });

  it('getFieldsForModel returns empty for unknown model', () => {
    const registry = new SchemaRegistry(buildTestModels());
    expect(registry.getFieldsForModel('unknown.model')).toEqual([]);
  });

  it('getRelationships returns all relationship edges', () => {
    const registry = new SchemaRegistry(buildTestModels());
    const rels = registry.getRelationships();

    expect(rels.length).toBeGreaterThan(0);

    const linkRel = rels.find((r) => r.type === 'link' && r.field === 'customer');
    expect(linkRel).toBeDefined();
    expect(linkRel!.from).toBe('sales.invoice');
    expect(linkRel!.to).toBe('sales.customer');

    const childrenRel = rels.find((r) => r.type === 'children' && r.field === 'items');
    expect(childrenRel).toBeDefined();
    expect(childrenRel!.to).toBe('sales.invoice_item');
    expect(childrenRel!.foreignKey).toBe('invoice_id');

    const m2mRel = rels.find((r) => r.type === 'manyToMany');
    expect(m2mRel).toBeDefined();
    expect(m2mRel!.to).toBe('sales.tag');
    expect(m2mRel!.through).toBe('sales.invoice_tag');

    const dynRel = rels.find((r) => r.type === 'dynamicLink');
    expect(dynRel).toBeDefined();
    expect(dynRel!.to).toBe('*');
    expect(dynRel!.modelField).toBe('source_type');

    const hasManyRel = rels.find((r) => r.type === 'hasMany');
    expect(hasManyRel).toBeDefined();
    expect(hasManyRel!.to).toBe('sales.payment_entry');
    expect(hasManyRel!.foreignKey).toBe('invoice_id');
  });

  it('getRelationshipsForModel returns only relationships from that model', () => {
    const registry = new SchemaRegistry(buildTestModels());
    const rels = registry.getRelationshipsForModel('sales.invoice');

    expect(rels.length).toBeGreaterThan(0);
    for (const rel of rels) {
      expect(rel.from).toBe('sales.invoice');
    }
  });

  it('getExtensionSources returns apps that extended a model', () => {
    const registry = new SchemaRegistry(buildTestModels());
    const sources = registry.getExtensionSources('sales.customer');

    expect(sources).toHaveLength(1);
    expect(sources[0].app).toBe('project');
    expect(sources[0].fields).toContain('loyalty_points');
  });

  it('getExtensionSources returns empty for model without extensions', () => {
    const registry = new SchemaRegistry(buildTestModels());
    const sources = registry.getExtensionSources('sales.invoice_item');
    expect(sources).toEqual([]);
  });

  it('registry is immutable — no mutation methods', () => {
    const registry = new SchemaRegistry(buildTestModels());
    const model = registry.getModel('sales.customer');
    const originalFieldCount = model!.fields.length;

    model!.fields.push({
      name: 'hacked',
      config: { type: 'string' },
      provenance: { source: 'base', app: 'x' },
    });

    const freshModel = registry.getModel('sales.customer');
    expect(freshModel!.fields.length).toBe(originalFieldCount + 1);
  });
});
