import { describe, it, expectTypeOf } from 'vitest';
import { field } from '../field.js';
import { defineModel, defineHooks, defineExtension, defineService, defineJob } from '../define.js';
import type {
  StringFieldConfig,
  IntFieldConfig,
  LinkFieldConfig,
  EnumFieldConfig,
  FieldConfig,
  TreeFieldConfig,
} from '../types/field.js';

describe('type-level tests', () => {
  describe('field builders return correct types', () => {
    it('field.string() returns StringFieldConfig', () => {
      expectTypeOf(field.string()).toEqualTypeOf<StringFieldConfig>();
    });

    it('field.int() returns IntFieldConfig', () => {
      expectTypeOf(field.int()).toEqualTypeOf<IntFieldConfig>();
    });

    it('field.link() returns LinkFieldConfig', () => {
      expectTypeOf(field.link('Model')).toEqualTypeOf<LinkFieldConfig>();
    });

    it('field.enum() returns EnumFieldConfig', () => {
      expectTypeOf(field.enum(['a', 'b'])).toEqualTypeOf<EnumFieldConfig>();
    });

    it('field.tree() returns TreeFieldConfig', () => {
      expectTypeOf(
        field.tree({ parentField: 'parent', strategy: 'nested_set' }),
      ).toEqualTypeOf<TreeFieldConfig>();
    });
  });

  describe('define functions preserve literal types', () => {
    it('defineModel preserves the config type', () => {
      const config = { name: 'Invoice' as const, fields: {} };
      const result = defineModel(config);
      expectTypeOf(result).toEqualTypeOf<typeof config>();
    });

    it('defineHooks returns model plus config', () => {
      const config = { validate: () => {} };
      const result = defineHooks('sales.order', config);
      expectTypeOf(result).toHaveProperty('model');
      expectTypeOf(result.model).toBeString();
      expectTypeOf(result).toHaveProperty('validate');
    });

    it('defineExtension returns target plus config', () => {
      const config = { actions: {} };
      const result = defineExtension('Invoice', config);
      expectTypeOf(result).toHaveProperty('target');
      expectTypeOf(result.target).toBeString();
      expectTypeOf(result).toHaveProperty('actions');
    });

    it('defineService preserves config type', () => {
      const config = { name: 'Svc', factory: () => ({ send: () => Promise.resolve() }) };
      const result = defineService(config);
      expectTypeOf(result).toHaveProperty('name');
      expectTypeOf(result).toHaveProperty('factory');
    });

    it('defineJob returns name plus config', () => {
      const config = { handler: async () => {} };
      const result = defineJob('job1', config);
      expectTypeOf(result).toHaveProperty('name');
      expectTypeOf(result.name).toBeString();
      expectTypeOf(result).toHaveProperty('handler');
    });
  });

  describe('FieldConfig discriminated union', () => {
    it('accepts all field types', () => {
      const fields: Record<string, FieldConfig> = {
        name: field.string(),
        age: field.int(),
        ref: field.link('Other'),
        status: field.enum(['a', 'b']),
      };
      expectTypeOf(fields).toEqualTypeOf<Record<string, FieldConfig>>();
    });
  });
});
