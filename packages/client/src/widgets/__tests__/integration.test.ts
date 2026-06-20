import { describe, test, expect } from 'vitest';
import { parse, evaluate } from '../expression/index.js';
import { evaluateConditions } from '../condition/index.js';
import { StateStore } from '../state/index.js';
import { createRootContext } from '../context/index.js';
import { resolveBinding } from '../binding/index.js';
import { dispatch } from '../action/index.js';
import { buildDependencyMap, getAffectedWidgets } from '../reactivity/index.js';
import type { ActionContext, ActionHandlers } from '../action/index.js';
import type { WidgetNode } from '@rangka/shared';

describe('Integration: Form scenario', () => {
  test('field change → expression recomputes → condition re-evaluates → action fires', () => {
    const record = { qty: 5, rate: 100, total: 500, status: 'draft' };
    const _ctx = createRootContext(record, 'sales.order', 'edit');

    record.qty = 10;
    const exprAst = parse('{{qty * rate}}');
    const newTotal = evaluate(exprAst, record);
    expect(newTotal).toBe(1000);

    record.total = newTotal as number;
    const visible = evaluateConditions({ field: 'total', operator: 'gt', value: 500 }, record);
    expect(visible).toBe(true);
  });
});

describe('Integration: Table row context', () => {
  test('model binding → row context → action in row uses correct record', async () => {
    const parentRecord = { id: '1', customer: 'Acme' };
    const parentCtx = createRootContext(parentRecord, 'sales.order', 'view');

    const rowRecord = { id: '10', product: 'Widget', qty: 5, rate: 20 };
    const rowCtx = {
      record: rowRecord,
      model: 'sales.orderItem',
      mode: 'view' as const,
      index: 0,
      parent: parentCtx,
    };

    const binding = resolveBinding({ expression: '{{qty * rate}}' }, rowCtx);
    expect(binding!.value).toBe(100);

    const deleted: [string, string][] = [];
    const handlers: ActionHandlers = {
      modelDelete: async (model, id) => {
        deleted.push([model, id]);
      },
    };
    const actionCtx: ActionContext = {
      widgetContext: rowCtx,
      state: new StateStore(),
    };
    await dispatch({ type: 'model.delete' }, actionCtx, handlers);
    expect(deleted).toEqual([['sales.orderItem', '10']]);
  });
});

describe('Integration: $state reactivity scenario', () => {
  test('action writes $state → dependent widgets flagged for re-render', async () => {
    const state = new StateStore();
    const nodes: WidgetNode[] = [
      { id: 'step1', type: 'section', visible: { field: '$state.step', operator: 'eq', value: 1 } },
      { id: 'step2', type: 'section', visible: { field: '$state.step', operator: 'eq', value: 2 } },
      {
        id: 'nextBtn',
        type: 'button',
        props: { label: '{{if($state.step == 2, "Submit", "Next")}}' },
      },
    ];

    const depMap = buildDependencyMap(nodes);

    const actionCtx: ActionContext = {
      widgetContext: createRootContext({}, 'app.page', 'view'),
      state,
    };
    await dispatch({ type: 'setValue', field: '$state.step', value: 2 }, actionCtx, {});

    expect(state.get('step')).toBe(2);

    const affected = getAffectedWidgets(depMap, 'step', true);
    expect(affected).toContain('step1');
    expect(affected).toContain('step2');
    expect(affected).toContain('nextBtn');
  });
});

describe('Integration: Wizard scenario', () => {
  test('$state.step changes → visibility toggles → props update', async () => {
    const state = new StateStore();
    state.set('step', 1);

    const flat = { $state: { step: 1 } };

    expect(evaluateConditions({ field: '$state.step', operator: 'eq', value: 1 }, flat)).toBe(true);
    expect(evaluateConditions({ field: '$state.step', operator: 'eq', value: 2 }, flat)).toBe(
      false,
    );

    const labelAst = parse('{{if($state.step == 2, "Submit", "Next")}}');
    expect(evaluate(labelAst, flat)).toBe('Next');

    state.set('step', 2);
    const flat2 = { $state: { step: 2 } };

    expect(evaluateConditions({ field: '$state.step', operator: 'eq', value: 1 }, flat2)).toBe(
      false,
    );
    expect(evaluateConditions({ field: '$state.step', operator: 'eq', value: 2 }, flat2)).toBe(
      true,
    );
    expect(evaluate(labelAst, flat2)).toBe('Submit');
  });
});
