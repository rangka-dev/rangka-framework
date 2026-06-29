import { describe, it, expect } from 'vitest';
import { validateFields } from '../field-validator.js';
import type { ResolvedModel, ResolvedField } from '../../schema/types.js';
import type { FieldConfig } from '@rangka/shared';

function makeModel(fields: ResolvedField[]): ResolvedModel {
  return {
    app: 'test',
    name: 'item',
    qualifiedName: 'test.item',
    auditLog: false,
    crud: true,
    traits: [],
    fields,
    indexes: [],
  };
}

function field(name: string, config: Partial<FieldConfig> & { type: string }): ResolvedField {
  return { name, config: config as FieldConfig, provenance: { source: 'base' } };
}

describe('validateFields', () => {
  describe('minLength / maxLength', () => {
    const model = makeModel([
      field('name', { type: 'string', validation: { minLength: 3, maxLength: 50 } }),
    ]);

    it('passes when string length is within bounds', () => {
      expect(validateFields(model, { name: 'hello' }, 'create')).toEqual([]);
    });

    it('fails when string is too short', () => {
      const result = validateFields(model, { name: 'ab' }, 'create');
      expect(result).toHaveLength(1);
      expect(result[0].field).toBe('name');
      expect(result[0].rule).toBe('minLength');
    });

    it('fails when string is too long', () => {
      const result = validateFields(model, { name: 'a'.repeat(51) }, 'create');
      expect(result).toHaveLength(1);
      expect(result[0].field).toBe('name');
      expect(result[0].rule).toBe('maxLength');
    });
  });

  describe('min / max', () => {
    const model = makeModel([field('quantity', { type: 'int', validation: { min: 0, max: 100 } })]);

    it('passes when number is within bounds', () => {
      expect(validateFields(model, { quantity: 50 }, 'create')).toEqual([]);
    });

    it('fails when number is below min', () => {
      const result = validateFields(model, { quantity: -1 }, 'create');
      expect(result).toHaveLength(1);
      expect(result[0].field).toBe('quantity');
      expect(result[0].rule).toBe('min');
    });

    it('fails when number is above max', () => {
      const result = validateFields(model, { quantity: 101 }, 'create');
      expect(result).toHaveLength(1);
      expect(result[0].field).toBe('quantity');
      expect(result[0].rule).toBe('max');
    });

    it('passes at exact boundaries', () => {
      expect(validateFields(model, { quantity: 0 }, 'create')).toEqual([]);
      expect(validateFields(model, { quantity: 100 }, 'create')).toEqual([]);
    });
  });

  describe('pattern', () => {
    const model = makeModel([
      field('code', { type: 'string', validation: { pattern: '^[A-Z]{3}-\\d+$' } }),
    ]);

    it('passes when value matches pattern', () => {
      expect(validateFields(model, { code: 'ABC-123' }, 'create')).toEqual([]);
    });

    it('fails when value does not match pattern', () => {
      const result = validateFields(model, { code: 'abc-123' }, 'create');
      expect(result).toHaveLength(1);
      expect(result[0].field).toBe('code');
      expect(result[0].rule).toBe('pattern');
    });
  });

  describe('format', () => {
    const model = makeModel([
      field('email', { type: 'string', validation: { format: 'email' } }),
      field('website', { type: 'string', validation: { format: 'url' } }),
      field('ref', { type: 'string', validation: { format: 'uuid' } }),
    ]);

    it('passes valid email', () => {
      expect(validateFields(model, { email: 'user@example.com' }, 'create')).toEqual([]);
    });

    it('fails invalid email', () => {
      const result = validateFields(model, { email: 'not-an-email' }, 'create');
      expect(result).toHaveLength(1);
      expect(result[0].rule).toBe('format');
    });

    it('passes valid url', () => {
      expect(validateFields(model, { website: 'https://example.com' }, 'create')).toEqual([]);
    });

    it('fails invalid url', () => {
      const result = validateFields(model, { website: 'not-a-url' }, 'create');
      expect(result).toHaveLength(1);
      expect(result[0].rule).toBe('format');
    });

    it('passes valid uuid', () => {
      expect(
        validateFields(model, { ref: '550e8400-e29b-41d4-a716-446655440000' }, 'create'),
      ).toEqual([]);
    });

    it('fails invalid uuid', () => {
      const result = validateFields(model, { ref: 'not-a-uuid' }, 'create');
      expect(result).toHaveLength(1);
      expect(result[0].rule).toBe('format');
    });

    it('ignores unknown format', () => {
      const m = makeModel([
        field('x', { type: 'string', validation: { format: 'unknown_format' } }),
      ]);
      expect(validateFields(m, { x: 'anything' }, 'create')).toEqual([]);
    });
  });

  describe('custom message', () => {
    it('uses custom message when provided', () => {
      const model = makeModel([
        field('age', {
          type: 'int',
          validation: { min: 18, message: 'Must be at least 18 years old' },
        }),
      ]);
      const result = validateFields(model, { age: 10 }, 'create');
      expect(result[0].message).toBe('Must be at least 18 years old');
    });
  });

  describe('update operation', () => {
    const model = makeModel([
      field('name', { type: 'string', validation: { minLength: 3 } }),
      field('quantity', { type: 'int', validation: { min: 0 } }),
    ]);

    it('only validates fields present in body', () => {
      expect(validateFields(model, { quantity: 5 }, 'update')).toEqual([]);
    });

    it('validates fields that are present', () => {
      const result = validateFields(model, { name: 'ab' }, 'update');
      expect(result).toHaveLength(1);
      expect(result[0].field).toBe('name');
    });

    it('skips null/undefined fields', () => {
      expect(validateFields(model, { name: undefined }, 'update')).toEqual([]);
      expect(validateFields(model, { name: null }, 'update')).toEqual([]);
    });
  });

  describe('fields without validation config', () => {
    const model = makeModel([field('title', { type: 'string' }), field('count', { type: 'int' })]);

    it('skips fields without validation', () => {
      expect(validateFields(model, { title: '', count: -999 }, 'create')).toEqual([]);
    });
  });

  describe('multiple violations', () => {
    const model = makeModel([
      field('name', { type: 'string', validation: { minLength: 3 } }),
      field('quantity', { type: 'int', validation: { min: 0 } }),
    ]);

    it('returns all violations at once', () => {
      const result = validateFields(model, { name: 'ab', quantity: -1 }, 'create');
      expect(result).toHaveLength(2);
      expect(result.map((v) => v.field)).toContain('name');
      expect(result.map((v) => v.field)).toContain('quantity');
    });
  });
});
