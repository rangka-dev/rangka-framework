import { describe, it, expect } from 'vitest';
import { validateModel } from '../schemas/model.js';

describe('validateModel', () => {
  it('accepts minimal valid model', () => {
    const result = validateModel({
      name: 'invoice',
      fields: { total: { type: 'decimal' } },
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const result = validateModel({ fields: {} });
    expect(result.success).toBe(false);
  });

  it('rejects missing fields', () => {
    const result = validateModel({ name: 'invoice' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid field type', () => {
    const result = validateModel({
      name: 'invoice',
      fields: { total: { type: 'invalid' } },
    });
    expect(result.success).toBe(false);
  });

  it('rejects index referencing non-existent field', () => {
    const result = validateModel({
      name: 'invoice',
      fields: { total: { type: 'decimal' } },
      indexes: [{ fields: ['totall'] }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid indexes referencing existing fields', () => {
    const result = validateModel({
      name: 'invoice',
      fields: { total: { type: 'decimal' }, customer: { type: 'string' } },
      indexes: [{ fields: ['total', 'customer'], unique: true }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts all field types', () => {
    const result = validateModel({
      name: 'everything',
      fields: {
        f_string: { type: 'string', maxLength: 100 },
        f_text: { type: 'text' },
        f_int: { type: 'int' },
        f_decimal: { type: 'decimal', precision: 10, scale: 2 },
        f_boolean: { type: 'boolean' },
        f_date: { type: 'date' },
        f_datetime: { type: 'datetime' },
        f_enum: { type: 'enum', options: ['a', 'b', 'c'] },
        f_json: { type: 'json' },
        f_link: { type: 'link', model: 'other.model' },
        f_hasMany: { type: 'hasMany', model: 'other.model', foreignKey: 'parent_id' },
        f_children: { type: 'children', model: 'child.model', foreignKey: 'parent_id' },
        f_m2m: { type: 'manyToMany', model: 'other.model', through: 'pivot_table' },
        f_dynamicLink: { type: 'dynamicLink', modelField: 'type_field' },
        f_money: { type: 'money' },
        f_code: { type: 'code', language: 'expression' },
        f_tree: { type: 'tree', parentField: 'parent_id', strategy: 'materialized_path' },
        f_sequence: { type: 'sequence', prefix: 'INV-', digits: 5 },
        f_attachment: { type: 'attachment', accept: ['image/*'] },
        f_attachments: { type: 'attachments', maxCount: 10 },
        f_computed: { type: 'computed', depends: ['f_int'], compute: () => 0 },
      },
    });
    expect(result.success).toBe(true);
  });

  it('accepts all traits', () => {
    const result = validateModel({
      name: 'post',
      fields: { title: { type: 'string' } },
      traits: ['timestamped', 'soft_delete'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid trait', () => {
    const result = validateModel({
      name: 'post',
      fields: { title: { type: 'string' } },
      traits: ['invalid_trait'],
    });
    expect(result.success).toBe(false);
  });

  it('accepts model with scope as string', () => {
    const result = validateModel({
      name: 'order',
      fields: { company: { type: 'link', model: 'core.company' } },
      scope: 'company',
    });
    expect(result.success).toBe(true);
  });

  it('accepts model with scope as object', () => {
    const result = validateModel({
      name: 'order',
      fields: { company: { type: 'link', model: 'core.company' } },
      scope: { name: 'company', field: 'company' },
    });
    expect(result.success).toBe(true);
  });

  it('accepts model with naming', () => {
    const result = validateModel({
      name: 'invoice',
      fields: { invoice_number: { type: 'sequence' } },
      naming: 'invoice_number',
    });
    expect(result.success).toBe(true);
  });
});
