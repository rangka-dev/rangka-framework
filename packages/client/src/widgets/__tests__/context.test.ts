import { describe, test, expect } from 'vitest';
import {
  buildContext,
  buildRowContext,
  createRootContext,
  resolveContextValue,
} from '../context/builder.js';

describe('Context Builder', () => {
  const rootCtx = createRootContext(
    { id: '1', name: 'Order #1', total: 500 },
    'sales.order',
    'edit',
  );

  test('createRootContext creates context with record and model', () => {
    expect(rootCtx.record).toEqual({ id: '1', name: 'Order #1', total: 500 });
    expect(rootCtx.model).toBe('sales.order');
    expect(rootCtx.mode).toBe('edit');
    expect(rootCtx.parent).toBeUndefined();
  });

  test('layout widgets pass through context', () => {
    const ctx = buildContext({ type: 'group', children: [] }, rootCtx);
    expect(ctx).toBe(rootCtx);
  });

  test('section passes through context', () => {
    const ctx = buildContext({ type: 'section', children: [] }, rootCtx);
    expect(ctx).toBe(rootCtx);
  });

  test('divider passes through context', () => {
    const ctx = buildContext({ type: 'divider' }, rootCtx);
    expect(ctx).toBe(rootCtx);
  });

  test('table with model binding creates child scope', () => {
    const node = { type: 'table', bind: { model: { name: 'sales.orderItem' } }, children: [] };
    const ctx = buildContext(node, rootCtx);
    expect(ctx.model).toBe('sales.orderItem');
    expect(ctx.parent).toBe(rootCtx);
    expect(ctx.record).toEqual({});
    expect(ctx.records).toEqual([]);
  });

  test('buildRowContext creates row-level context with index', () => {
    const tableCtx = buildContext(
      { type: 'table', bind: { model: { name: 'sales.orderItem' } }, children: [] },
      rootCtx,
    );
    const row = { id: '10', product: 'Widget', qty: 5 };
    const rowCtx = buildRowContext(row, 2, tableCtx);
    expect(rowCtx.record).toBe(row);
    expect(rowCtx.index).toBe(2);
    expect(rowCtx.model).toBe('sales.orderItem');
    expect(rowCtx.parent).toBe(rootCtx);
  });

  test('non-layout non-model widget inherits parent context', () => {
    const ctx = buildContext({ type: 'input', bind: { field: 'name' } }, rootCtx);
    expect(ctx).toBe(rootCtx);
  });
});

describe('resolveContextValue', () => {
  const parentCtx = createRootContext({ id: '1', company: 'Acme' }, 'core.company');
  const _childCtx = buildContext(
    { type: 'table', bind: { model: { name: 'sales.order' } }, children: [] },
    parentCtx,
  );
  const rowCtx = {
    record: { id: '10', product: 'Widget', qty: 5 },
    model: 'sales.order',
    mode: 'view' as const,
    index: 0,
    parent: parentCtx,
  };

  test('resolves simple field', () => {
    expect(resolveContextValue('company', parentCtx)).toBe('Acme');
  });

  test('resolves $parent field', () => {
    expect(resolveContextValue('$parent.company', rowCtx)).toBe('Acme');
  });

  test('resolves $root field', () => {
    expect(resolveContextValue('$root.company', rowCtx)).toBe('Acme');
  });

  test('resolves $row field', () => {
    expect(resolveContextValue('$row.qty', rowCtx)).toBe(5);
  });

  test('returns undefined for missing field', () => {
    expect(resolveContextValue('missing', parentCtx)).toBeUndefined();
  });
});
