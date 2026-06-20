import { describe, it, expect } from 'vitest';
import { evaluateComputedFields } from '../computed-fields.js';
import type { ExternalFieldConfig } from '../types.js';

describe('evaluateComputedFields', () => {
  it('computes a field from existing mapped fields', () => {
    const record = { name: 'Acme', email: 'acme@test.com' };
    const fields: Record<string, ExternalFieldConfig> = {
      name: { type: 'string' },
      email: { type: 'string' },
      displayName: {
        type: 'string',
        computed: {
          depends: ['name', 'email'],
          compute: (r) => r.name || r.email,
        },
      },
    };

    const result = evaluateComputedFields(record, fields);
    expect(result.displayName).toBe('Acme');
  });

  it('uses fallback when primary depends field is missing', () => {
    const record = { name: undefined, email: 'acme@test.com' };
    const fields: Record<string, ExternalFieldConfig> = {
      name: { type: 'string' },
      email: { type: 'string' },
      displayName: {
        type: 'string',
        computed: {
          depends: ['name', 'email'],
          compute: (r) => r.name || r.email,
        },
      },
    };

    const result = evaluateComputedFields(record, fields);
    expect(result.displayName).toBe('acme@test.com');
  });

  it('does not modify non-computed fields', () => {
    const record = { name: 'Acme', email: 'a@b.com' };
    const fields: Record<string, ExternalFieldConfig> = {
      name: { type: 'string' },
      email: { type: 'string' },
    };

    const result = evaluateComputedFields(record, fields);
    expect(result).toEqual({ name: 'Acme', email: 'a@b.com' });
  });

  it('handles numeric computed fields', () => {
    const record = { quantity: 5, price: 10 };
    const fields: Record<string, ExternalFieldConfig> = {
      quantity: { type: 'int' },
      price: { type: 'decimal' },
      total: {
        type: 'decimal',
        computed: {
          depends: ['quantity', 'price'],
          compute: (r) => (r.quantity as number) * (r.price as number),
        },
      },
    };

    const result = evaluateComputedFields(record, fields);
    expect(result.total).toBe(50);
  });

  it('computed fields can access other computed fields (order dependent)', () => {
    const record = { firstName: 'John', lastName: 'Doe' };
    const fields: Record<string, ExternalFieldConfig> = {
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      fullName: {
        type: 'string',
        computed: {
          depends: ['firstName', 'lastName'],
          compute: (r) => `${r.firstName} ${r.lastName}`,
        },
      },
    };

    const result = evaluateComputedFields(record, fields);
    expect(result.fullName).toBe('John Doe');
  });

  it('does not mutate the original record', () => {
    const record = { name: 'Acme' };
    const fields: Record<string, ExternalFieldConfig> = {
      name: { type: 'string' },
      upper: {
        type: 'string',
        computed: {
          depends: ['name'],
          compute: (r) => (r.name as string).toUpperCase(),
        },
      },
    };

    evaluateComputedFields(record, fields);
    expect(record).toEqual({ name: 'Acme' });
    expect(record).not.toHaveProperty('upper');
  });
});
