import { describe, it, expect } from 'vitest';
import { fieldToJsonSchema, modelToSchemaComponent } from '../openapi-schema.js';
import type { FieldConfig } from '@rangka/shared';
import type { ResolvedModel } from '../../schema/types.js';

describe('fieldToJsonSchema', () => {
  it('maps string field', () => {
    const result = fieldToJsonSchema({ type: 'string' } as FieldConfig);
    expect(result).toEqual({ type: 'string' });
  });

  it('maps text field', () => {
    const result = fieldToJsonSchema({ type: 'text' } as FieldConfig);
    expect(result).toEqual({ type: 'string' });
  });

  it('maps int field', () => {
    const result = fieldToJsonSchema({ type: 'int' } as FieldConfig);
    expect(result).toEqual({ type: 'integer' });
  });

  it('maps decimal field', () => {
    const result = fieldToJsonSchema({ type: 'decimal' } as FieldConfig);
    expect(result).toEqual({ type: 'number' });
  });

  it('maps boolean field', () => {
    const result = fieldToJsonSchema({ type: 'boolean' } as FieldConfig);
    expect(result).toEqual({ type: 'boolean' });
  });

  it('maps date field with format', () => {
    const result = fieldToJsonSchema({ type: 'date' } as FieldConfig);
    expect(result).toEqual({ type: 'string', format: 'date' });
  });

  it('maps datetime field with format', () => {
    const result = fieldToJsonSchema({ type: 'datetime' } as FieldConfig);
    expect(result).toEqual({ type: 'string', format: 'date-time' });
  });

  it('maps enum field with values', () => {
    const result = fieldToJsonSchema({
      type: 'enum',
      options: ['Draft', 'Submitted', 'Paid'],
    } as FieldConfig);
    expect(result).toEqual({ type: 'string', enum: ['Draft', 'Submitted', 'Paid'] });
  });

  it('maps json field', () => {
    const result = fieldToJsonSchema({ type: 'json' } as FieldConfig);
    expect(result).toEqual({ oneOf: [{ type: 'object' }, { type: 'array' }] });
  });

  it('maps link field as string reference', () => {
    const result = fieldToJsonSchema({ type: 'link', model: 'customer' } as FieldConfig);
    expect(result).toEqual({ type: 'string', description: 'Reference to customer' });
  });

  it('maps money field as number', () => {
    const result = fieldToJsonSchema({ type: 'money' } as FieldConfig);
    expect(result).toEqual({ type: 'number' });
  });

  it('maps sequence field as string', () => {
    const result = fieldToJsonSchema({ type: 'sequence' } as FieldConfig);
    expect(result).toEqual({ type: 'string' });
  });

  it('returns null for hasMany', () => {
    const result = fieldToJsonSchema({
      type: 'hasMany',
      model: 'item',
      foreignKey: 'invoice_id',
    } as FieldConfig);
    expect(result).toBeNull();
  });

  it('returns null for children', () => {
    const result = fieldToJsonSchema({
      type: 'children',
      model: 'item',
      foreignKey: 'invoice_id',
    } as FieldConfig);
    expect(result).toBeNull();
  });

  it('returns null for manyToMany', () => {
    const result = fieldToJsonSchema({
      type: 'manyToMany',
      model: 'tag',
      through: 'invoice_tag',
    } as FieldConfig);
    expect(result).toBeNull();
  });

  it('returns null for tree', () => {
    const result = fieldToJsonSchema({
      type: 'tree',
      strategy: 'materialized_path',
    } as FieldConfig);
    expect(result).toBeNull();
  });
});

describe('modelToSchemaComponent', () => {
  const baseModel: ResolvedModel = {
    qualifiedName: 'sales.customer',
    app: 'basic',
    name: 'customer',
    label: 'Customer',
    auditLog: false,
    crud: true,
    traits: [],
    fields: [
      {
        name: 'name',
        config: { type: 'string', required: true, label: 'Customer Name' },
        provenance: { source: 'base' },
      },
      {
        name: 'email',
        config: { type: 'string', required: true, label: 'Email' },
        provenance: { source: 'base' },
      },
      {
        name: 'is_active',
        config: { type: 'boolean', label: 'Active' },
        provenance: { source: 'base' },
      },
    ],
    indexes: [],
  };

  it('includes id property', () => {
    const schema = modelToSchemaComponent(baseModel);
    expect(schema.properties.id).toEqual({ type: 'string', description: 'Primary key' });
  });

  it('maps fields to properties', () => {
    const schema = modelToSchemaComponent(baseModel);
    expect(schema.properties.name).toEqual({ type: 'string', description: 'Customer Name' });
    expect(schema.properties.email).toEqual({ type: 'string', description: 'Email' });
    expect(schema.properties.is_active).toEqual({ type: 'boolean', description: 'Active' });
  });

  it('collects required fields', () => {
    const schema = modelToSchemaComponent(baseModel);
    expect(schema.required).toEqual(['name', 'email']);
  });

  it('omits required array when no fields are required', () => {
    const model: ResolvedModel = {
      ...baseModel,
      fields: [{ name: 'notes', config: { type: 'text' }, provenance: { source: 'base' } }],
    };
    const schema = modelToSchemaComponent(model);
    expect(schema.required).toBeUndefined();
  });

  it('uses label as description', () => {
    const schema = modelToSchemaComponent(baseModel);
    expect(schema.properties.name.description).toBe('Customer Name');
  });

  it('omits description when no label', () => {
    const model: ResolvedModel = {
      ...baseModel,
      fields: [{ name: 'code', config: { type: 'string' }, provenance: { source: 'base' } }],
    };
    const schema = modelToSchemaComponent(model);
    expect(schema.properties.code.description).toBeUndefined();
  });

  it('includes enum values', () => {
    const model: ResolvedModel = {
      ...baseModel,
      fields: [
        {
          name: 'status',
          config: { type: 'enum', options: ['Draft', 'Submitted', 'Paid'] },
          provenance: { source: 'base' },
        },
      ],
    };
    const schema = modelToSchemaComponent(model);
    expect(schema.properties.status.enum).toEqual(['Draft', 'Submitted', 'Paid']);
  });

  it('skips relationship fields that return null', () => {
    const model: ResolvedModel = {
      ...baseModel,
      fields: [
        {
          name: 'name',
          config: { type: 'string', required: true },
          provenance: { source: 'base' },
        },
        {
          name: 'items',
          config: { type: 'hasMany', model: 'item', foreignKey: 'customer_id' },
          provenance: { source: 'base' },
        },
      ],
    };
    const schema = modelToSchemaComponent(model);
    expect(schema.properties.items).toBeUndefined();
    expect(schema.properties.name).toBeDefined();
  });
});
