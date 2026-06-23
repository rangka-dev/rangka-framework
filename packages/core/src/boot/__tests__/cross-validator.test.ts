import { describe, it, expect } from 'vitest';
import { validateModelReferences } from '../cross-validator.js';
import { SchemaRegistry } from '../../schema/registry.js';
import type { ResolvedModel } from '../../schema/types.js';
import type { SchemaLoadResult } from '../schema-loader.js';

function makeModel(
  qualifiedName: string,
  fields: Array<{ name: string; config: Record<string, unknown> }>,
): ResolvedModel {
  const [module, name] = qualifiedName.split('.');
  return {
    qualifiedName,
    app: 'test-app',
    module,
    name,
    auditLog: false,
    traits: [],
    fields: fields.map((f) => ({
      name: f.name,
      config: f.config as never,
      provenance: { source: 'base' as const, app: 'test-app' },
    })),
    indexes: [],
  };
}

describe('validateModelReferences', () => {
  describe('link fields', () => {
    it('passes when link target exists', () => {
      const models = [
        makeModel('sales.order', [
          { name: 'customer_id', config: { type: 'link', model: 'sales.customer' } },
        ]),
        makeModel('sales.customer', [{ name: 'name', config: { type: 'string' } }]),
      ];
      const registry = new SchemaRegistry(models);

      expect(() => validateModelReferences(registry, [])).not.toThrow();
    });

    it('throws when link target does not exist', () => {
      const models = [
        makeModel('sales.order', [
          { name: 'customer_id', config: { type: 'link', model: 'sales.nonexistent' } },
        ]),
      ];
      const registry = new SchemaRegistry(models);

      expect(() => validateModelReferences(registry, [])).toThrow('invalid definition');
    });

    it('resolves unqualified model names to current module', () => {
      const models = [
        makeModel('sales.order', [
          { name: 'customer_id', config: { type: 'link', model: 'customer' } },
        ]),
        makeModel('sales.customer', [{ name: 'name', config: { type: 'string' } }]),
      ];
      const registry = new SchemaRegistry(models);

      expect(() => validateModelReferences(registry, [])).not.toThrow();
    });

    it('throws when unqualified link target does not exist in same module', () => {
      const models = [
        makeModel('sales.order', [
          { name: 'contact_id', config: { type: 'link', model: 'contact' } },
        ]),
        makeModel('contacts.contact', [{ name: 'name', config: { type: 'string' } }]),
      ];
      const registry = new SchemaRegistry(models);

      expect(() => validateModelReferences(registry, [])).toThrow('invalid definition');
    });
  });

  describe('hasMany fields', () => {
    it('passes when target model and foreignKey exist', () => {
      const models = [
        makeModel('sales.order', [
          {
            name: 'items',
            config: { type: 'hasMany', model: 'sales.order_item', foreignKey: 'order_id' },
          },
        ]),
        makeModel('sales.order_item', [
          { name: 'order_id', config: { type: 'link', model: 'sales.order' } },
        ]),
      ];
      const registry = new SchemaRegistry(models);

      expect(() => validateModelReferences(registry, [])).not.toThrow();
    });

    it('throws when hasMany target model does not exist', () => {
      const models = [
        makeModel('sales.order', [
          {
            name: 'items',
            config: { type: 'hasMany', model: 'sales.ghost', foreignKey: 'order_id' },
          },
        ]),
      ];
      const registry = new SchemaRegistry(models);

      expect(() => validateModelReferences(registry, [])).toThrow('invalid definition');
    });

    it('throws when foreignKey does not exist on target model', () => {
      const models = [
        makeModel('sales.order', [
          {
            name: 'items',
            config: { type: 'hasMany', model: 'sales.order_item', foreignKey: 'missing_id' },
          },
        ]),
        makeModel('sales.order_item', [
          { name: 'order_id', config: { type: 'link', model: 'sales.order' } },
        ]),
      ];
      const registry = new SchemaRegistry(models);

      expect(() => validateModelReferences(registry, [])).toThrow('missing_id');
    });
  });

  describe('children fields', () => {
    it('passes when target model and foreignKey exist', () => {
      const models = [
        makeModel('sales.invoice', [
          {
            name: 'lines',
            config: { type: 'children', model: 'sales.invoice_line', foreignKey: 'invoice_id' },
          },
        ]),
        makeModel('sales.invoice_line', [
          { name: 'invoice_id', config: { type: 'link', model: 'sales.invoice' } },
        ]),
      ];
      const registry = new SchemaRegistry(models);

      expect(() => validateModelReferences(registry, [])).not.toThrow();
    });

    it('throws when children target model does not exist', () => {
      const models = [
        makeModel('sales.invoice', [
          {
            name: 'lines',
            config: { type: 'children', model: 'sales.ghost_line', foreignKey: 'invoice_id' },
          },
        ]),
      ];
      const registry = new SchemaRegistry(models);

      expect(() => validateModelReferences(registry, [])).toThrow('invalid definition');
    });

    it('throws when children foreignKey does not exist on target', () => {
      const models = [
        makeModel('sales.invoice', [
          {
            name: 'lines',
            config: { type: 'children', model: 'sales.invoice_line', foreignKey: 'bad_fk' },
          },
        ]),
        makeModel('sales.invoice_line', [
          { name: 'invoice_id', config: { type: 'link', model: 'sales.invoice' } },
        ]),
      ];
      const registry = new SchemaRegistry(models);

      expect(() => validateModelReferences(registry, [])).toThrow('bad_fk');
    });
  });

  describe('manyToMany fields', () => {
    it('passes when target model exists (through table is auto-created)', () => {
      const models = [
        makeModel('sales.order', [
          {
            name: 'tags',
            config: { type: 'manyToMany', model: 'sales.tag', through: 'order_tag' },
          },
        ]),
        makeModel('sales.tag', [{ name: 'name', config: { type: 'string' } }]),
      ];
      const registry = new SchemaRegistry(models);

      expect(() => validateModelReferences(registry, [])).not.toThrow();
    });

    it('throws when manyToMany target does not exist', () => {
      const models = [
        makeModel('sales.order', [
          {
            name: 'tags',
            config: { type: 'manyToMany', model: 'sales.ghost', through: 'order_tag' },
          },
        ]),
      ];
      const registry = new SchemaRegistry(models);

      expect(() => validateModelReferences(registry, [])).toThrow('sales.ghost');
    });
  });

  describe('dynamicLink fields', () => {
    it('passes when modelField exists on the same model', () => {
      const models = [
        makeModel('sales.comment', [
          { name: 'target_model', config: { type: 'string' } },
          { name: 'target_id', config: { type: 'dynamicLink', modelField: 'target_model' } },
        ]),
      ];
      const registry = new SchemaRegistry(models);

      expect(() => validateModelReferences(registry, [])).not.toThrow();
    });

    it('passes when modelField is auto-created by the dynamicLink itself', () => {
      const models = [
        makeModel('sales.comment', [
          { name: 'target_id', config: { type: 'dynamicLink', modelField: 'target_model' } },
        ]),
      ];
      const registry = new SchemaRegistry(models);

      expect(() => validateModelReferences(registry, [])).not.toThrow();
    });
  });

  describe('extension targets', () => {
    it('passes when extension target exists', () => {
      const models = [makeModel('sales.order', [{ name: 'name', config: { type: 'string' } }])];
      const registry = new SchemaRegistry(models);
      const extensions: SchemaLoadResult['extensions'] = [
        {
          app: 'crm-app',
          target: 'sales.order',
          config: { fields: { priority: { type: 'int' } } },
        },
      ];

      expect(() => validateModelReferences(registry, extensions)).not.toThrow();
    });

    it('throws when extension target does not exist', () => {
      const models = [makeModel('sales.order', [{ name: 'name', config: { type: 'string' } }])];
      const registry = new SchemaRegistry(models);
      const extensions: SchemaLoadResult['extensions'] = [
        {
          app: 'crm-app',
          target: 'sales.nonexistent',
          config: { fields: { priority: { type: 'int' } } },
        },
      ];

      expect(() => validateModelReferences(registry, extensions)).toThrow('sales.nonexistent');
    });
  });

  describe('multiple errors', () => {
    it('collects all errors before throwing', () => {
      const models = [
        makeModel('sales.order', [
          { name: 'customer_id', config: { type: 'link', model: 'sales.ghost1' } },
          {
            name: 'items',
            config: { type: 'hasMany', model: 'sales.ghost2', foreignKey: 'order_id' },
          },
        ]),
      ];
      const registry = new SchemaRegistry(models);

      try {
        validateModelReferences(registry, []);
        expect.fail('Should have thrown');
      } catch (err: unknown) {
        const error = err as { errors: Array<{ issues: Array<{ message: string }> }> };
        const allIssues = error.errors.flatMap((e) => e.issues);
        expect(allIssues.length).toBeGreaterThanOrEqual(2);
        expect(allIssues.some((i) => i.message.includes('ghost1'))).toBe(true);
        expect(allIssues.some((i) => i.message.includes('ghost2'))).toBe(true);
      }
    });
  });

  describe('non-relational fields', () => {
    it('ignores string, int, boolean, and other scalar fields', () => {
      const models = [
        makeModel('sales.order', [
          { name: 'name', config: { type: 'string' } },
          { name: 'quantity', config: { type: 'int' } },
          { name: 'active', config: { type: 'boolean' } },
          { name: 'total', config: { type: 'decimal', precision: 10, scale: 2 } },
          { name: 'notes', config: { type: 'text' } },
          { name: 'created_at', config: { type: 'datetime' } },
        ]),
      ];
      const registry = new SchemaRegistry(models);

      expect(() => validateModelReferences(registry, [])).not.toThrow();
    });
  });
});
