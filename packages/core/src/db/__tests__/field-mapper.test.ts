import { describe, it, expect } from 'vitest';
import { mapFieldsToColumns, modelToTableName } from '../field-mapper.js';
import type { ResolvedModel, ResolvedField } from '../../schema/types.js';

function makeModel(overrides: Partial<ResolvedModel> = {}): ResolvedModel {
  return {
    qualifiedName: 'sales.invoice',
    app: 'sales',
    name: 'invoice',
    auditLog: true,
    traits: [],
    fields: [],
    indexes: [],
    ...overrides,
  };
}

function makeField(name: string, config: any): ResolvedField {
  return { name, config, provenance: { source: 'base' } };
}

describe('modelToTableName', () => {
  it('converts qualified name to table name', () => {
    expect(modelToTableName('sales.invoice')).toBe('sales__invoice');
  });

  it('handles single-segment names', () => {
    expect(modelToTableName('core.user')).toBe('core__user');
  });
});

describe('mapFieldsToColumns', () => {
  it('always includes id UUID primary key', () => {
    const model = makeModel();
    const result = mapFieldsToColumns(model);
    const idCol = result.columns.find((c) => c.name === 'id');
    expect(idCol).toBeDefined();
    expect(idCol!.type).toBe('UUID');
    expect(idCol!.primaryKey).toBe(true);
    expect(idCol!.defaultValue).toBeUndefined();
  });

  describe('primitive fields', () => {
    it('maps string field to VARCHAR', () => {
      const model = makeModel({
        fields: [makeField('title', { type: 'string', maxLength: 200 })],
      });
      const result = mapFieldsToColumns(model);
      const col = result.columns.find((c) => c.name === 'title');
      expect(col).toBeDefined();
      expect(col!.type).toBe('VARCHAR(200)');
    });

    it('maps string field with default maxLength', () => {
      const model = makeModel({
        fields: [makeField('title', { type: 'string' })],
      });
      const result = mapFieldsToColumns(model);
      const col = result.columns.find((c) => c.name === 'title');
      expect(col!.type).toBe('VARCHAR(255)');
    });

    it('maps text field to TEXT', () => {
      const model = makeModel({
        fields: [makeField('description', { type: 'text' })],
      });
      const result = mapFieldsToColumns(model);
      const col = result.columns.find((c) => c.name === 'description');
      expect(col!.type).toBe('TEXT');
    });

    it('maps int field to INTEGER', () => {
      const model = makeModel({
        fields: [makeField('quantity', { type: 'int' })],
      });
      const result = mapFieldsToColumns(model);
      const col = result.columns.find((c) => c.name === 'quantity');
      expect(col!.type).toBe('INTEGER');
    });

    it('maps decimal field to DECIMAL with precision/scale', () => {
      const model = makeModel({
        fields: [makeField('rate', { type: 'decimal', precision: 10, scale: 2 })],
      });
      const result = mapFieldsToColumns(model);
      const col = result.columns.find((c) => c.name === 'rate');
      expect(col!.type).toBe('DECIMAL(10,2)');
    });

    it('maps decimal field with default precision/scale', () => {
      const model = makeModel({
        fields: [makeField('amount', { type: 'decimal' })],
      });
      const result = mapFieldsToColumns(model);
      const col = result.columns.find((c) => c.name === 'amount');
      expect(col!.type).toBe('DECIMAL(18,6)');
    });

    it('maps boolean field to BOOLEAN', () => {
      const model = makeModel({
        fields: [makeField('is_active', { type: 'boolean' })],
      });
      const result = mapFieldsToColumns(model);
      const col = result.columns.find((c) => c.name === 'is_active');
      expect(col!.type).toBe('BOOLEAN');
    });

    it('maps date field to DATE', () => {
      const model = makeModel({
        fields: [makeField('posting_date', { type: 'date' })],
      });
      const result = mapFieldsToColumns(model);
      const col = result.columns.find((c) => c.name === 'posting_date');
      expect(col!.type).toBe('DATE');
    });

    it('maps datetime field to TIMESTAMPTZ', () => {
      const model = makeModel({
        fields: [makeField('created', { type: 'datetime' })],
      });
      const result = mapFieldsToColumns(model);
      const col = result.columns.find((c) => c.name === 'created');
      expect(col!.type).toBe('TIMESTAMPTZ');
    });

    it('maps enum field to VARCHAR with CHECK constraint', () => {
      const model = makeModel({
        fields: [makeField('status', { type: 'enum', options: ['Draft', 'Submitted', 'Paid'] })],
      });
      const result = mapFieldsToColumns(model);
      const col = result.columns.find((c) => c.name === 'status');
      expect(col!.type).toBe('VARCHAR(255)');
      expect(result.checkConstraints).toHaveLength(1);
      expect(result.checkConstraints[0].expression).toContain("'Draft'");
      expect(result.checkConstraints[0].expression).toContain("'Submitted'");
      expect(result.checkConstraints[0].expression).toContain("'Paid'");
    });

    it('maps json field to JSONB', () => {
      const model = makeModel({
        fields: [makeField('metadata', { type: 'json' })],
      });
      const result = mapFieldsToColumns(model);
      const col = result.columns.find((c) => c.name === 'metadata');
      expect(col!.type).toBe('JSONB');
    });

    it('maps code field to TEXT', () => {
      const model = makeModel({
        fields: [makeField('formula', { type: 'code', language: 'expression' })],
      });
      const result = mapFieldsToColumns(model);
      const col = result.columns.find((c) => c.name === 'formula');
      expect(col!.type).toBe('TEXT');
    });
  });

  describe('link fields', () => {
    it('maps link field to UUID with FK', () => {
      const model = makeModel({
        fields: [makeField('customer', { type: 'link', model: 'sales.customer' })],
      });
      const result = mapFieldsToColumns(model);
      const col = result.columns.find((c) => c.name === 'customer');
      expect(col!.type).toBe('UUID');
      expect(result.foreignKeys).toHaveLength(1);
      expect(result.foreignKeys[0].referencedTable).toBe('sales__customer');
      expect(result.foreignKeys[0].referencedColumn).toBe('id');
    });

    it('maps required link field to NOT NULL', () => {
      const model = makeModel({
        fields: [
          makeField('customer', {
            type: 'link',
            model: 'sales.customer',
            required: true,
            nullable: false,
          }),
        ],
      });
      const result = mapFieldsToColumns(model);
      const col = result.columns.find((c) => c.name === 'customer');
      expect(col!.nullable).toBe(false);
    });
  });

  describe('dynamic link fields', () => {
    it('maps dynamicLink to discriminator + UUID columns', () => {
      const model = makeModel({
        fields: [makeField('source_document', { type: 'dynamicLink', modelField: 'source_type' })],
      });
      const result = mapFieldsToColumns(model);
      const typeCol = result.columns.find((c) => c.name === 'source_type');
      const idCol = result.columns.find((c) => c.name === 'source_document');
      expect(typeCol!.type).toBe('VARCHAR(255)');
      expect(idCol!.type).toBe('UUID');
      expect(result.foreignKeys).toHaveLength(0);
    });
  });

  describe('money fields', () => {
    it('maps money field to two DECIMAL columns', () => {
      const model = makeModel({
        fields: [makeField('total_amount', { type: 'money' })],
      });
      const result = mapFieldsToColumns(model);
      const valueCol = result.columns.find((c) => c.name === 'total_amount');
      const baseCol = result.columns.find((c) => c.name === 'total_amount_base');
      expect(valueCol!.type).toBe('DECIMAL(18,6)');
      expect(baseCol!.type).toBe('DECIMAL(18,6)');
    });
  });

  describe('tree fields', () => {
    it('maps materialized_path tree to parent + path + depth', () => {
      const model = makeModel({
        fields: [makeField('parent', { type: 'tree', strategy: 'materialized_path' })],
      });
      const result = mapFieldsToColumns(model);
      expect(result.columns.find((c) => c.name === 'parent')).toBeDefined();
      expect(result.columns.find((c) => c.name === 'path')).toBeDefined();
      expect(result.columns.find((c) => c.name === 'depth')).toBeDefined();
      expect(result.foreignKeys.find((fk) => fk.column === 'parent')!.referencedTable).toBe(
        'sales__invoice',
      );
    });

    it('maps nested_set tree to parent + lft + rgt', () => {
      const model = makeModel({
        fields: [makeField('parent', { type: 'tree', strategy: 'nested_set' })],
      });
      const result = mapFieldsToColumns(model);
      expect(result.columns.find((c) => c.name === 'parent')).toBeDefined();
      expect(result.columns.find((c) => c.name === 'lft')).toBeDefined();
      expect(result.columns.find((c) => c.name === 'rgt')).toBeDefined();
    });

    it('maps closure_table tree to parent + extra closure table', () => {
      const model = makeModel({
        fields: [makeField('parent', { type: 'tree', strategy: 'closure_table' })],
      });
      const result = mapFieldsToColumns(model);
      expect(result.columns.find((c) => c.name === 'parent')).toBeDefined();
      expect(result.extraTables).toHaveLength(1);
      expect(result.extraTables[0].name).toBe('sales__invoice_closure');
      expect(result.extraTables[0].columns.map((c) => c.name)).toEqual([
        'ancestor_id',
        'descendant_id',
        'depth',
      ]);
    });
  });

  describe('sequence fields', () => {
    it('maps sequence field to VARCHAR', () => {
      const model = makeModel({
        fields: [makeField('invoice_number', { type: 'sequence', prefix: 'INV-', digits: 5 })],
      });
      const result = mapFieldsToColumns(model);
      const col = result.columns.find((c) => c.name === 'invoice_number');
      expect(col!.type).toBe('VARCHAR(255)');
    });
  });

  describe('relationship fields (no columns)', () => {
    it('hasMany produces no columns', () => {
      const model = makeModel({
        fields: [
          makeField('items', {
            type: 'hasMany',
            model: 'sales.invoice_item',
            foreignKey: 'invoice_id',
          }),
        ],
      });
      const result = mapFieldsToColumns(model);
      expect(result.columns.find((c) => c.name === 'items')).toBeUndefined();
    });

    it('children produces no columns', () => {
      const model = makeModel({
        fields: [
          makeField('items', {
            type: 'children',
            model: 'sales.invoice_item',
            foreignKey: 'parent',
          }),
        ],
      });
      const result = mapFieldsToColumns(model);
      expect(result.columns.find((c) => c.name === 'items')).toBeUndefined();
    });

    it('manyToMany produces no columns', () => {
      const model = makeModel({
        fields: [
          makeField('tags', { type: 'manyToMany', model: 'core.tag', through: 'invoice_tag' }),
        ],
      });
      const result = mapFieldsToColumns(model);
      expect(result.columns.find((c) => c.name === 'tags')).toBeUndefined();
    });
  });

  describe('trait column injection', () => {
    it('timestamped adds created_at/updated_at/created_by/updated_by', () => {
      const model = makeModel({ traits: ['timestamped'] });
      const result = mapFieldsToColumns(model);
      expect(result.columns.find((c) => c.name === 'created_at')!.type).toBe('TIMESTAMPTZ');
      expect(result.columns.find((c) => c.name === 'updated_at')!.type).toBe('TIMESTAMPTZ');
      expect(result.columns.find((c) => c.name === 'created_by')!.type).toBe('UUID');
      expect(result.columns.find((c) => c.name === 'updated_by')!.type).toBe('UUID');
    });
  });

  describe('default values', () => {
    it('maps boolean default', () => {
      const model = makeModel({
        fields: [makeField('is_active', { type: 'boolean', default: false })],
      });
      const result = mapFieldsToColumns(model);
      const col = result.columns.find((c) => c.name === 'is_active');
      expect(col!.defaultValue).toBe('FALSE');
    });

    it('maps string default', () => {
      const model = makeModel({
        fields: [makeField('status', { type: 'string', default: 'Draft' })],
      });
      const result = mapFieldsToColumns(model);
      const col = result.columns.find((c) => c.name === 'status');
      expect(col!.defaultValue).toBe("'Draft'");
    });

    it('maps numeric default', () => {
      const model = makeModel({
        fields: [makeField('quantity', { type: 'int', default: 1 })],
      });
      const result = mapFieldsToColumns(model);
      const col = result.columns.find((c) => c.name === 'quantity');
      expect(col!.defaultValue).toBe('1');
    });

    it('no default when not specified', () => {
      const model = makeModel({
        fields: [makeField('title', { type: 'string' })],
      });
      const result = mapFieldsToColumns(model);
      const col = result.columns.find((c) => c.name === 'title');
      expect(col!.defaultValue).toBeUndefined();
    });
  });
});
