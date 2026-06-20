import { describe, test, expect } from 'vitest';
import { resolveBinding } from '../binding/resolver.js';
import { createRootContext } from '../context/builder.js';
import type { FieldMeta } from '../binding/resolver.js';

describe('Binding Resolver', () => {
  const ctx = createRootContext(
    { id: '1', customer_id: 'CUST-001', qty: 5, rate: 100, name: 'Test Order' },
    'sales.order',
    'edit',
  );

  const fieldMeta: Record<string, FieldMeta> = {
    customer_id: { type: 'link', label: 'Customer', required: true, readOnly: false },
    qty: { type: 'int', label: 'Quantity', required: true, readOnly: false },
    name: { type: 'string', label: 'Order Name', required: false, readOnly: false },
  };

  test('returns null when no binding', () => {
    expect(resolveBinding(undefined, ctx)).toBeNull();
  });

  test('field binding returns value from context', () => {
    const result = resolveBinding({ field: 'customer_id' }, ctx, fieldMeta);
    expect(result).not.toBeNull();
    expect(result!.value).toBe('CUST-001');
  });

  test('field binding returns metadata', () => {
    const result = resolveBinding({ field: 'customer_id' }, ctx, fieldMeta);
    expect(result!.meta).toEqual({
      type: 'link',
      label: 'Customer',
      required: true,
      readOnly: false,
    });
  });

  test('field binding provides setValue when handler given', () => {
    const sets: [string, unknown][] = [];
    const setter = (field: string, val: unknown) => sets.push([field, val]);
    const result = resolveBinding({ field: 'qty' }, ctx, fieldMeta, setter);
    expect(result!.setValue).toBeDefined();
    result!.setValue!(10);
    expect(sets).toEqual([['qty', 10]]);
  });

  test('field binding without setter has no setValue', () => {
    const result = resolveBinding({ field: 'qty' }, ctx, fieldMeta);
    expect(result!.setValue).toBeUndefined();
  });

  test('expression binding evaluates expression', () => {
    const result = resolveBinding({ expression: '{{qty * rate}}' }, ctx);
    expect(result!.value).toBe(500);
  });

  test('expression binding has no setValue', () => {
    const result = resolveBinding({ expression: '{{qty * rate}}' }, ctx);
    expect(result!.setValue).toBeUndefined();
  });

  test('model binding returns query config', () => {
    const result = resolveBinding(
      { model: { name: 'sales.order', filters: { status: 'draft' }, limit: 10 } },
      ctx,
    );
    expect(result!.query).toEqual({ name: 'sales.order', filters: { status: 'draft' }, limit: 10 });
    expect(result!.value).toBeNull();
  });

  test('field binding returns undefined for missing field', () => {
    const result = resolveBinding({ field: 'missing' }, ctx, fieldMeta);
    expect(result!.value).toBeUndefined();
  });
});
