import { describe, test, expect, vi } from 'vitest';
import { dispatch } from '../action/dispatcher.js';
import { StateStore } from '../state/store.js';
import { createRootContext } from '../context/builder.js';
import type { ActionContext, ActionHandlers } from '../action/dispatcher.js';

function makeActionCtx(record: Record<string, unknown> = {}): ActionContext {
  return {
    widgetContext: createRootContext(record, 'sales.order', 'edit'),
    state: new StateStore(),
  };
}

describe('Action Edge Cases', () => {
  describe('setValue edge cases', () => {
    test('sets $state with expression referencing record', async () => {
      const ctx = makeActionCtx({ total: 500 });
      await dispatch(
        { type: 'setValue', field: '$state.hasTotal', value: '{{total > 0}}' },
        ctx,
        {},
      );
      expect(ctx.state.get('hasTotal')).toBe(true);
    });

    test('sets literal boolean value without expression', async () => {
      const ctx = makeActionCtx();
      await dispatch({ type: 'setValue', field: '$state.loading', value: true }, ctx, {});
      expect(ctx.state.get('loading')).toBe(true);
    });

    test('sets literal null value', async () => {
      const sets: [string, unknown][] = [];
      const handlers: ActionHandlers = { setRecordValue: (f, v) => sets.push([f, v]) };
      await dispatch({ type: 'setValue', field: 'name', value: null }, makeActionCtx(), handlers);
      expect(sets).toEqual([['name', null]]);
    });

    test('sets literal number value', async () => {
      const sets: [string, unknown][] = [];
      const handlers: ActionHandlers = { setRecordValue: (f, v) => sets.push([f, v]) };
      await dispatch({ type: 'setValue', field: 'count', value: 0 }, makeActionCtx(), handlers);
      expect(sets).toEqual([['count', 0]]);
    });

    test('string without expression is literal', async () => {
      const sets: [string, unknown][] = [];
      const handlers: ActionHandlers = { setRecordValue: (f, v) => sets.push([f, v]) };
      await dispatch(
        { type: 'setValue', field: 'status', value: 'draft' },
        makeActionCtx(),
        handlers,
      );
      expect(sets).toEqual([['status', 'draft']]);
    });
  });

  describe('setValues edge cases', () => {
    test('mix of $state and record with expressions', async () => {
      const sets: [string, unknown][] = [];
      const handlers: ActionHandlers = { setRecordValue: (f, v) => sets.push([f, v]) };
      const ctx = makeActionCtx({ qty: 5, rate: 10 });
      await dispatch(
        {
          type: 'setValues',
          values: {
            total: '{{qty * rate}}',
            '$state.calculated': true,
            status: 'calculated',
          },
        },
        ctx,
        handlers,
      );
      expect(sets).toEqual([
        ['total', 50],
        ['status', 'calculated'],
      ]);
      expect(ctx.state.get('calculated')).toBe(true);
    });

    test('empty values object does nothing', async () => {
      const ctx = makeActionCtx();
      await dispatch({ type: 'setValues', values: {} }, ctx, {});
      expect(ctx.state.keys()).toEqual([]);
    });
  });

  describe('navigate edge cases', () => {
    test('static path without expression', async () => {
      const paths: string[] = [];
      const handlers: ActionHandlers = { navigate: (p) => paths.push(p) };
      await dispatch({ type: 'navigate', path: '/dashboard' }, makeActionCtx(), handlers);
      expect(paths).toEqual(['/dashboard']);
    });

    test('path with multiple expressions', async () => {
      const paths: string[] = [];
      const handlers: ActionHandlers = { navigate: (p) => paths.push(p) };
      const ctx = makeActionCtx({ module: 'sales', id: '42' });
      await dispatch({ type: 'navigate', path: '/{{module}}/orders/{{id}}' }, ctx, handlers);
      expect(paths).toEqual(['/sales/orders/42']);
    });
  });

  describe('service edge cases', () => {
    test('service with no params', async () => {
      const serviceCall = vi.fn().mockResolvedValue({});
      const handlers: ActionHandlers = { service: serviceCall, refreshSource: vi.fn() };
      await dispatch({ type: 'service', name: 'sales.refresh' }, makeActionCtx(), handlers);
      expect(serviceCall).toHaveBeenCalledWith('sales.refresh', {});
    });

    test('$response is available in nested onSuccess actions', async () => {
      const serviceCall = vi.fn().mockResolvedValue({ id: 'new-1', status: 'created' });
      const paths: string[] = [];
      const handlers: ActionHandlers = {
        service: serviceCall,
        navigate: (p) => paths.push(p),
      };
      await dispatch(
        {
          type: 'service',
          name: 'sales.create',
          onSuccess: { type: 'navigate', path: '/orders/{{$response.id}}' },
        },
        makeActionCtx(),
        handlers,
      );
      expect(paths).toEqual(['/orders/new-1']);
    });

    test('service failure without onError does not throw', async () => {
      const serviceCall = vi.fn().mockRejectedValue(new Error('fail'));
      const handlers: ActionHandlers = { service: serviceCall };
      await expect(
        dispatch({ type: 'service', name: 'sales.fail' }, makeActionCtx(), handlers),
      ).resolves.toBeUndefined();
    });
  });

  describe('sequence edge cases', () => {
    test('empty sequence does nothing', async () => {
      await expect(
        dispatch({ type: 'sequence', actions: [] }, makeActionCtx(), {}),
      ).resolves.toBeUndefined();
    });

    test('sequence of $state writes accumulates', async () => {
      const ctx = makeActionCtx();
      await dispatch(
        {
          type: 'sequence',
          actions: [
            { type: 'setValue', field: '$state.a', value: 1 },
            { type: 'setValue', field: '$state.b', value: 2 },
            { type: 'setValue', field: '$state.c', value: 3 },
          ],
        },
        ctx,
        {},
      );
      expect(ctx.state.get('a')).toBe(1);
      expect(ctx.state.get('b')).toBe(2);
      expect(ctx.state.get('c')).toBe(3);
    });

    test('later actions in sequence see earlier state changes', async () => {
      const ctx = makeActionCtx();
      await dispatch(
        {
          type: 'sequence',
          actions: [
            { type: 'setValue', field: '$state.step', value: 1 },
            {
              type: 'conditional',
              condition: { field: '$state.step', operator: 'eq', value: 1 },
              then: { type: 'setValue', field: '$state.result', value: 'step1-done' },
            },
          ],
        },
        ctx,
        {},
      );
      expect(ctx.state.get('result')).toBe('step1-done');
    });
  });

  describe('conditional edge cases', () => {
    test('conditional without else does nothing on false', async () => {
      const ctx = makeActionCtx({ status: 'submitted' });
      const sets: [string, unknown][] = [];
      const handlers: ActionHandlers = { setRecordValue: (f, v) => sets.push([f, v]) };
      await dispatch(
        {
          type: 'conditional',
          condition: { field: 'status', operator: 'eq', value: 'draft' },
          then: { type: 'setValue', field: 'x', value: 1 },
        },
        ctx,
        handlers,
      );
      expect(sets).toEqual([]);
    });

    test('nested conditionals', async () => {
      const ctx = makeActionCtx({ a: 1, b: 2 });
      await dispatch(
        {
          type: 'conditional',
          condition: { field: 'a', operator: 'eq', value: 1 },
          then: {
            type: 'conditional',
            condition: { field: 'b', operator: 'eq', value: 2 },
            then: { type: 'setValue', field: '$state.result', value: 'both' },
            else: { type: 'setValue', field: '$state.result', value: 'only-a' },
          },
          else: { type: 'setValue', field: '$state.result', value: 'neither' },
        },
        ctx,
        {},
      );
      expect(ctx.state.get('result')).toBe('both');
    });
  });

  describe('model action edge cases', () => {
    test('model.update with explicit model and id overrides context', async () => {
      const modelUpdate = vi.fn().mockResolvedValue({});
      const handlers: ActionHandlers = { modelUpdate };
      const ctx = makeActionCtx({ id: '1' });
      await dispatch(
        {
          type: 'model.update',
          model: 'other.model',
          id: '99',
          data: { name: 'test' },
        },
        ctx,
        handlers,
      );
      expect(modelUpdate).toHaveBeenCalledWith('other.model', '99', { name: 'test' });
    });

    test('model.delete with explicit id from expression', async () => {
      const modelDelete = vi.fn().mockResolvedValue(undefined);
      const handlers: ActionHandlers = { modelDelete };
      const ctx = makeActionCtx({ selectedId: '55' });
      await dispatch(
        {
          type: 'model.delete',
          model: 'sales.order',
          id: '{{selectedId}}',
        },
        ctx,
        handlers,
      );
      expect(modelDelete).toHaveBeenCalledWith('sales.order', '55');
    });
  });

  describe('handler missing gracefully', () => {
    test('navigate without handler does not throw', async () => {
      await expect(
        dispatch({ type: 'navigate', path: '/test' }, makeActionCtx(), {}),
      ).resolves.toBeUndefined();
    });

    test('refreshSource without handler does not throw', async () => {
      await expect(
        dispatch({ type: 'refreshSource' }, makeActionCtx(), {}),
      ).resolves.toBeUndefined();
    });

    test('service without handler does not throw', async () => {
      await expect(
        dispatch({ type: 'service', name: 'test' }, makeActionCtx(), {}),
      ).resolves.toBeUndefined();
    });
  });
});
