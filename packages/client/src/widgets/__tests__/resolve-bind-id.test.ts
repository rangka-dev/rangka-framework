import { describe, test, expect } from 'vitest';
import { resolveBindId } from '../lib/resolve-bind-id.js';
import { createRootContext } from '../context/builder.js';
import type { WidgetContext } from '../context/types.js';

describe('resolveBindId', () => {
  const ctx = createRootContext(
    { id: '1', customer_id: 'CUST-001', name: 'Test Order' },
    'sales.order',
    'view',
  );

  const childCtx: WidgetContext = {
    record: { id: '2', product_id: 'PROD-99' },
    model: 'sales.line_item',
    mode: 'view',
    parent: ctx,
  };

  const routeParams = { id: '42', tab: 'details' };

  test('returns undefined for undefined input', () => {
    expect(resolveBindId(undefined, ctx, routeParams)).toBeUndefined();
  });

  test('returns literal string unchanged', () => {
    expect(resolveBindId('abc-123-uuid', ctx, routeParams)).toBe('abc-123-uuid');
  });

  test('returns numeric literal unchanged', () => {
    expect(resolveBindId('999', ctx, routeParams)).toBe('999');
  });

  test('resolves template syntax {{$route.id}}', () => {
    expect(resolveBindId('{{$route.id}}', ctx, routeParams)).toBe('42');
  });

  test('resolves template syntax {{$route.tab}}', () => {
    expect(resolveBindId('{{$route.tab}}', ctx, routeParams)).toBe('details');
  });

  test('resolves bare $route.id without template syntax', () => {
    expect(resolveBindId('$route.id', ctx, routeParams)).toBe('42');
  });

  test('resolves bare $route.tab without template syntax', () => {
    expect(resolveBindId('$route.tab', ctx, routeParams)).toBe('details');
  });

  test('returns undefined for bare $route reference with missing param', () => {
    expect(resolveBindId('$route.missing', ctx, routeParams)).toBeUndefined();
  });

  test('returns undefined for template with missing param', () => {
    expect(resolveBindId('{{$route.missing}}', ctx, routeParams)).toBeUndefined();
  });

  test('resolves $state.selectedId from state', () => {
    const state = { selectedId: '99', filter: 'active' };
    expect(resolveBindId('$state.selectedId', ctx, routeParams, state)).toBe('99');
  });

  test('resolves {{$state.selectedId}} from state', () => {
    const state = { selectedId: '99' };
    expect(resolveBindId('{{$state.selectedId}}', ctx, routeParams, state)).toBe('99');
  });

  test('returns undefined for $state reference without state', () => {
    expect(resolveBindId('$state.selectedId', ctx, routeParams)).toBeUndefined();
  });

  test('resolves $parent.customer_id from child context', () => {
    expect(resolveBindId('$parent.customer_id', childCtx, routeParams)).toBe('CUST-001');
  });

  test('resolves field from current record context', () => {
    expect(resolveBindId('{{customer_id}}', ctx, routeParams)).toBe('CUST-001');
  });

  test('resolves interpolated template with prefix', () => {
    expect(resolveBindId('/orders/{{$route.id}}', ctx, routeParams)).toBe('/orders/42');
  });

  test('empty route params with $route.id returns undefined', () => {
    expect(resolveBindId('$route.id', ctx, {})).toBeUndefined();
  });
});
