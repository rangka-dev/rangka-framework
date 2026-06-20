import { describe, it, expect } from 'vitest';
import { resolveFieldValue, mapAdapterResponse, reverseMapForWrite } from '../field-mapper.js';

describe('resolveFieldValue', () => {
  it('resolves top-level field', () => {
    expect(resolveFieldValue({ name: 'Acme' }, 'name')).toBe('Acme');
  });

  it('resolves nested field with dot notation', () => {
    const record = { address: { street: '123 Main St', city: 'Springfield' } };
    expect(resolveFieldValue(record, 'address.street')).toBe('123 Main St');
  });

  it('resolves deeply nested field', () => {
    const record = { subscription: { plan: { id: 'pro' } } };
    expect(resolveFieldValue(record, 'subscription.plan.id')).toBe('pro');
  });

  it('returns undefined for missing top-level field', () => {
    expect(resolveFieldValue({}, 'name')).toBeUndefined();
  });

  it('returns undefined for missing nested path', () => {
    expect(resolveFieldValue({ a: {} }, 'a.b.c')).toBeUndefined();
  });

  it('returns undefined when intermediate is null', () => {
    expect(resolveFieldValue({ a: null }, 'a.b')).toBeUndefined();
  });

  it('returns undefined when intermediate is a primitive', () => {
    expect(resolveFieldValue({ a: 'string' }, 'a.b')).toBeUndefined();
  });

  it('handles numeric values', () => {
    expect(resolveFieldValue({ count: 0 }, 'count')).toBe(0);
  });

  it('handles false values', () => {
    expect(resolveFieldValue({ active: false }, 'active')).toBe(false);
  });
});

describe('mapAdapterResponse', () => {
  it('maps fields with 1:1 naming', () => {
    const raw = { id: '1', email: 'test@example.com' };
    const fields = {
      id: { type: 'string' as const },
      email: { type: 'string' as const },
    };

    expect(mapAdapterResponse(raw, fields)).toEqual({
      id: '1',
      email: 'test@example.com',
    });
  });

  it('maps fields using from property', () => {
    const raw = { metadata: { company_name: 'Acme Corp' } };
    const fields = {
      name: { type: 'string' as const, from: 'metadata.company_name' },
    };

    expect(mapAdapterResponse(raw, fields)).toEqual({ name: 'Acme Corp' });
  });

  it('handles mixed direct and mapped fields', () => {
    const raw = { id: 'cus_123', email: 'a@b.com', metadata: { company_name: 'X' } };
    const fields = {
      id: { type: 'string' as const },
      email: { type: 'string' as const },
      name: { type: 'string' as const, from: 'metadata.company_name' },
    };

    expect(mapAdapterResponse(raw, fields)).toEqual({
      id: 'cus_123',
      email: 'a@b.com',
      name: 'X',
    });
  });

  it('skips computed fields', () => {
    const raw = { name: 'Acme', email: 'a@b.com' };
    const fields = {
      name: { type: 'string' as const },
      email: { type: 'string' as const },
      displayName: {
        type: 'string' as const,
        computed: {
          depends: ['name', 'email'],
          compute: (r: Record<string, unknown>) => r.name || r.email,
        },
      },
    };

    const result = mapAdapterResponse(raw, fields);
    expect(result).toEqual({ name: 'Acme', email: 'a@b.com' });
    expect(result).not.toHaveProperty('displayName');
  });

  it('returns undefined for missing source fields', () => {
    const raw = {};
    const fields = {
      name: { type: 'string' as const, from: 'metadata.company_name' },
    };

    expect(mapAdapterResponse(raw, fields)).toEqual({ name: undefined });
  });
});

describe('reverseMapForWrite', () => {
  it('maps 1:1 fields directly', () => {
    const data = { email: 'new@test.com' };
    const fields = { email: { type: 'string' as const } };

    expect(reverseMapForWrite(data, fields)).toEqual({ email: 'new@test.com' });
  });

  it('reverse maps fields with from to nested structure', () => {
    const data = { name: 'Acme Corp' };
    const fields = {
      name: { type: 'string' as const, from: 'metadata.company_name' },
    };

    expect(reverseMapForWrite(data, fields)).toEqual({
      metadata: { company_name: 'Acme Corp' },
    });
  });

  it('skips computed fields', () => {
    const data = { name: 'Acme', displayName: 'Acme Corp' };
    const fields = {
      name: { type: 'string' as const },
      displayName: {
        type: 'string' as const,
        computed: { depends: ['name'], compute: (r: Record<string, unknown>) => r.name },
      },
    };

    expect(reverseMapForWrite(data, fields)).toEqual({ name: 'Acme' });
  });

  it('skips fields not in schema', () => {
    const data = { name: 'Acme', unknown: 'value' };
    const fields = { name: { type: 'string' as const } };

    expect(reverseMapForWrite(data, fields)).toEqual({ name: 'Acme' });
  });

  it('builds nested objects for deep paths', () => {
    const data = { plan: 'pro' };
    const fields = {
      plan: { type: 'string' as const, from: 'subscription.plan.id' },
    };

    expect(reverseMapForWrite(data, fields)).toEqual({
      subscription: { plan: { id: 'pro' } },
    });
  });
});
