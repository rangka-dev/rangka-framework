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

describe('Action Dispatcher', () => {
  describe('setValue', () => {
    test('sets record field via handler', async () => {
      const sets: [string, unknown][] = [];
      const handlers: ActionHandlers = { setRecordValue: (f, v) => sets.push([f, v]) };
      const ctx = makeActionCtx({ qty: 5, rate: 100 });
      await dispatch({ type: 'setValue', field: 'qty', value: 10 }, ctx, handlers);
      expect(sets).toEqual([['qty', 10]]);
    });

    test('sets $state key', async () => {
      const ctx = makeActionCtx();
      await dispatch({ type: 'setValue', field: '$state.step', value: 2 }, ctx, {});
      expect(ctx.state.get('step')).toBe(2);
    });

    test('resolves expression in value', async () => {
      const sets: [string, unknown][] = [];
      const handlers: ActionHandlers = { setRecordValue: (f, v) => sets.push([f, v]) };
      const ctx = makeActionCtx({ qty: 5, rate: 100 });
      await dispatch({ type: 'setValue', field: 'amount', value: '{{qty * rate}}' }, ctx, handlers);
      expect(sets).toEqual([['amount', 500]]);
    });
  });

  describe('clearValue', () => {
    test('sets field to null', async () => {
      const sets: [string, unknown][] = [];
      const handlers: ActionHandlers = { setRecordValue: (f, v) => sets.push([f, v]) };
      await dispatch({ type: 'clearValue', field: 'name' }, makeActionCtx(), handlers);
      expect(sets).toEqual([['name', null]]);
    });
  });

  describe('setValues', () => {
    test('sets multiple fields', async () => {
      const sets: [string, unknown][] = [];
      const handlers: ActionHandlers = { setRecordValue: (f, v) => sets.push([f, v]) };
      const ctx = makeActionCtx();
      await dispatch(
        { type: 'setValues', values: { status: 'submitted', '$state.loading': true } },
        ctx,
        handlers,
      );
      expect(sets).toEqual([['status', 'submitted']]);
      expect(ctx.state.get('loading')).toBe(true);
    });
  });

  describe('navigate', () => {
    test('calls navigate handler with resolved path', async () => {
      const paths: string[] = [];
      const handlers: ActionHandlers = { navigate: (p) => paths.push(p) };
      const ctx = makeActionCtx({ id: '42' });
      await dispatch({ type: 'navigate', path: '/orders/{{id}}' }, ctx, handlers);
      expect(paths).toEqual(['/orders/42']);
    });
  });

  describe('service', () => {
    test('calls service and runs onSuccess', async () => {
      const serviceCall = vi.fn().mockResolvedValue({ price: 99 });
      const sets: [string, unknown][] = [];
      const handlers: ActionHandlers = {
        service: serviceCall,
        setRecordValue: (f, v) => sets.push([f, v]),
      };
      const ctx = makeActionCtx({ product_id: 'P1' });
      await dispatch(
        {
          type: 'service',
          name: 'sales.getPrice',
          params: { id: '{{product_id}}' },
          onSuccess: { type: 'setValue', field: 'rate', value: '{{$response.price}}' },
        },
        ctx,
        handlers,
      );
      expect(serviceCall).toHaveBeenCalledWith('sales.getPrice', { id: 'P1' });
      expect(sets).toEqual([['rate', 99]]);
    });

    test('calls onError on failure', async () => {
      const serviceCall = vi.fn().mockRejectedValue(new Error('Network error'));
      const ctx = makeActionCtx();
      const handlers: ActionHandlers = { service: serviceCall };
      await dispatch(
        {
          type: 'service',
          name: 'sales.submit',
          onError: { type: 'setValue', field: '$state.error', value: '{{$response.message}}' },
        },
        ctx,
        handlers,
      );
      expect(ctx.state.get('error')).toBe('Network error');
    });

    test('refreshes source by default on success without onSuccess', async () => {
      const serviceCall = vi.fn().mockResolvedValue({});
      const refreshSource = vi.fn();
      const handlers: ActionHandlers = { service: serviceCall, refreshSource };
      await dispatch({ type: 'service', name: 'sales.submit' }, makeActionCtx(), handlers);
      expect(refreshSource).toHaveBeenCalled();
    });
  });

  describe('model actions', () => {
    test('model.create resolves expressions in data', async () => {
      const modelCreate = vi.fn().mockResolvedValue({});
      const handlers: ActionHandlers = { modelCreate };
      const ctx = makeActionCtx({ customer: 'CUST-001' });
      await dispatch(
        { type: 'model.create', model: 'sales.order', data: { customer_id: '{{customer}}' } },
        ctx,
        handlers,
      );
      expect(modelCreate).toHaveBeenCalledWith('sales.order', { customer_id: 'CUST-001' });
    });

    test('model.update infers model and id from context', async () => {
      const modelUpdate = vi.fn().mockResolvedValue({});
      const handlers: ActionHandlers = { modelUpdate };
      const ctx = makeActionCtx({ id: '42', status: 'draft' });
      await dispatch({ type: 'model.update', data: { status: 'submitted' } }, ctx, handlers);
      expect(modelUpdate).toHaveBeenCalledWith('sales.order', '42', { status: 'submitted' });
    });

    test('model.delete infers model and id from context', async () => {
      const modelDelete = vi.fn().mockResolvedValue(undefined);
      const handlers: ActionHandlers = { modelDelete };
      const ctx = makeActionCtx({ id: '42' });
      await dispatch({ type: 'model.delete' }, ctx, handlers);
      expect(modelDelete).toHaveBeenCalledWith('sales.order', '42');
    });
  });

  describe('sequence', () => {
    test('runs actions in order', async () => {
      const order: string[] = [];
      const handlers: ActionHandlers = {
        setRecordValue: (f) => order.push(f),
      };
      const ctx = makeActionCtx();
      await dispatch(
        {
          type: 'sequence',
          actions: [
            { type: 'setValue', field: 'a', value: 1 },
            { type: 'setValue', field: 'b', value: 2 },
            { type: 'setValue', field: 'c', value: 3 },
          ],
        },
        ctx,
        handlers,
      );
      expect(order).toEqual(['a', 'b', 'c']);
    });
  });

  describe('conditional', () => {
    test('runs then branch when condition passes', async () => {
      const ctx = makeActionCtx({ status: 'draft' });
      await dispatch(
        {
          type: 'conditional',
          condition: { field: 'status', operator: 'eq', value: 'draft' },
          then: { type: 'setValue', field: '$state.canEdit', value: true },
        },
        ctx,
        {},
      );
      expect(ctx.state.get('canEdit')).toBe(true);
    });

    test('runs else branch when condition fails', async () => {
      const ctx = makeActionCtx({ status: 'submitted' });
      await dispatch(
        {
          type: 'conditional',
          condition: { field: 'status', operator: 'eq', value: 'draft' },
          then: { type: 'setValue', field: '$state.canEdit', value: true },
          else: { type: 'setValue', field: '$state.canEdit', value: false },
        },
        ctx,
        {},
      );
      expect(ctx.state.get('canEdit')).toBe(false);
    });
  });

  describe('simple handlers', () => {
    test('refreshSource calls handler', async () => {
      const refreshSource = vi.fn();
      await dispatch({ type: 'refreshSource' }, makeActionCtx(), { refreshSource });
      expect(refreshSource).toHaveBeenCalled();
    });

    test('focus calls handler', async () => {
      const focus = vi.fn();
      await dispatch({ type: 'focus', field: 'name' }, makeActionCtx(), { focus });
      expect(focus).toHaveBeenCalledWith('name');
    });

    test('addRow calls handler', async () => {
      const addRow = vi.fn();
      await dispatch({ type: 'addRow', field: 'items' }, makeActionCtx(), { addRow });
      expect(addRow).toHaveBeenCalledWith('items');
    });

    test('removeRow calls handler', async () => {
      const removeRow = vi.fn();
      await dispatch({ type: 'removeRow', field: 'items' }, makeActionCtx(), { removeRow });
      expect(removeRow).toHaveBeenCalledWith('items');
    });

    test('duplicateRow calls handler', async () => {
      const duplicateRow = vi.fn();
      await dispatch({ type: 'duplicateRow', field: 'items' }, makeActionCtx(), { duplicateRow });
      expect(duplicateRow).toHaveBeenCalledWith('items');
    });
  });
});
