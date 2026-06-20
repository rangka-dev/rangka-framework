import React from 'react';
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WidgetContextProvider, useWidgetContext } from '../hooks/useWidgetContext.js';
import { PageStateProvider } from '../hooks/usePageState.js';
import { StateStore } from '../state/store.js';
import { createRootContext } from '../context/builder.js';
import { useBind } from '../hooks/useBind.js';
import { useExpression } from '../hooks/useExpression.js';
import { useCondition } from '../hooks/useCondition.js';
import { usePageState } from '../hooks/usePageState.js';
import type { WidgetContext } from '../context/types.js';

function TestWrapper({ ctx, children }: { ctx: WidgetContext; children: React.ReactNode }) {
  const state = new StateStore();
  return (
    <PageStateProvider value={state}>
      <WidgetContextProvider value={ctx}>{children}</WidgetContextProvider>
    </PageStateProvider>
  );
}

describe('useBind hook', () => {
  test('returns null for undefined bind', () => {
    function TestComp() {
      const result = useBind(undefined);
      return <div data-testid="result">{String(result)}</div>;
    }
    const ctx = createRootContext({}, 'test', 'view');
    render(
      <TestWrapper ctx={ctx}>
        <TestComp />
      </TestWrapper>,
    );
    expect(screen.getByTestId('result')).toHaveTextContent('null');
  });

  test('returns field value from context', () => {
    function TestComp() {
      const result = useBind({ field: 'name' });
      return <div data-testid="result">{String(result?.value)}</div>;
    }
    const ctx = createRootContext({ name: 'Test' }, 'test', 'view');
    render(
      <TestWrapper ctx={ctx}>
        <TestComp />
      </TestWrapper>,
    );
    expect(screen.getByTestId('result')).toHaveTextContent('Test');
  });

  test('evaluates expression binding', () => {
    function TestComp() {
      const result = useBind({ expression: '{{a + b}}' });
      return <div data-testid="result">{String(result?.value)}</div>;
    }
    const ctx = createRootContext({ a: 3, b: 7 }, 'test', 'view');
    render(
      <TestWrapper ctx={ctx}>
        <TestComp />
      </TestWrapper>,
    );
    expect(screen.getByTestId('result')).toHaveTextContent('10');
  });
});

describe('useExpression hook', () => {
  test('returns undefined for no expression', () => {
    function TestComp() {
      const result = useExpression(undefined);
      return <div data-testid="result">{String(result)}</div>;
    }
    const ctx = createRootContext({}, 'test', 'view');
    render(
      <TestWrapper ctx={ctx}>
        <TestComp />
      </TestWrapper>,
    );
    expect(screen.getByTestId('result')).toHaveTextContent('undefined');
  });

  test('evaluates expression against context', () => {
    function TestComp() {
      const result = useExpression('{{qty * rate}}');
      return <div data-testid="result">{String(result)}</div>;
    }
    const ctx = createRootContext({ qty: 4, rate: 25 }, 'test', 'view');
    render(
      <TestWrapper ctx={ctx}>
        <TestComp />
      </TestWrapper>,
    );
    expect(screen.getByTestId('result')).toHaveTextContent('100');
  });

  test('handles function calls in expressions', () => {
    function TestComp() {
      const result = useExpression('{{upper("hello")}}');
      return <div data-testid="result">{String(result)}</div>;
    }
    const ctx = createRootContext({}, 'test', 'view');
    render(
      <TestWrapper ctx={ctx}>
        <TestComp />
      </TestWrapper>,
    );
    expect(screen.getByTestId('result')).toHaveTextContent('HELLO');
  });
});

describe('useCondition hook', () => {
  test('returns true when no conditions', () => {
    function TestComp() {
      const result = useCondition(undefined);
      return <div data-testid="result">{String(result)}</div>;
    }
    const ctx = createRootContext({}, 'test', 'view');
    render(
      <TestWrapper ctx={ctx}>
        <TestComp />
      </TestWrapper>,
    );
    expect(screen.getByTestId('result')).toHaveTextContent('true');
  });

  test('evaluates single condition', () => {
    function TestComp() {
      const result = useCondition({ field: 'status', operator: 'eq', value: 'draft' });
      return <div data-testid="result">{String(result)}</div>;
    }
    const ctx = createRootContext({ status: 'draft' }, 'test', 'view');
    render(
      <TestWrapper ctx={ctx}>
        <TestComp />
      </TestWrapper>,
    );
    expect(screen.getByTestId('result')).toHaveTextContent('true');
  });

  test('evaluates failing condition', () => {
    function TestComp() {
      const result = useCondition({ field: 'status', operator: 'eq', value: 'draft' });
      return <div data-testid="result">{String(result)}</div>;
    }
    const ctx = createRootContext({ status: 'submitted' }, 'test', 'view');
    render(
      <TestWrapper ctx={ctx}>
        <TestComp />
      </TestWrapper>,
    );
    expect(screen.getByTestId('result')).toHaveTextContent('false');
  });

  test('evaluates multiple AND conditions', () => {
    function TestComp() {
      const result = useCondition([
        { field: 'a', operator: 'gt', value: 0 },
        { field: 'b', operator: 'notEmpty' },
      ]);
      return <div data-testid="result">{String(result)}</div>;
    }
    const ctx = createRootContext({ a: 5, b: 'yes' }, 'test', 'view');
    render(
      <TestWrapper ctx={ctx}>
        <TestComp />
      </TestWrapper>,
    );
    expect(screen.getByTestId('result')).toHaveTextContent('true');
  });
});

describe('usePageState hook', () => {
  test('throws outside provider', () => {
    function TestComp() {
      usePageState();
      return null;
    }
    expect(() => render(<TestComp />)).toThrow(
      'usePageState must be used within a PageStateProvider',
    );
  });

  test('returns the state store', () => {
    const store = new StateStore();
    store.set('test', 42);
    function TestComp() {
      const state = usePageState();
      return <div data-testid="result">{String(state.get('test'))}</div>;
    }
    render(
      <PageStateProvider value={store}>
        <TestComp />
      </PageStateProvider>,
    );
    expect(screen.getByTestId('result')).toHaveTextContent('42');
  });
});

describe('Hook Edge Cases', () => {
  test('useBind with missing field returns undefined value', () => {
    function TestComp() {
      const result = useBind({ field: 'nonexistent' });
      return <div data-testid="result">{result?.value === undefined ? 'undef' : 'has'}</div>;
    }
    const ctx = createRootContext({}, 'test', 'view');
    render(
      <TestWrapper ctx={ctx}>
        <TestComp />
      </TestWrapper>,
    );
    expect(screen.getByTestId('result')).toHaveTextContent('undef');
  });

  test('useExpression with complex nested expression', () => {
    function TestComp() {
      const result = useExpression('{{if(qty > 0, qty * rate, 0)}}');
      return <div data-testid="result">{String(result)}</div>;
    }
    const ctx = createRootContext({ qty: 3, rate: 10 }, 'test', 'view');
    render(
      <TestWrapper ctx={ctx}>
        <TestComp />
      </TestWrapper>,
    );
    expect(screen.getByTestId('result')).toHaveTextContent('30');
  });

  test('useExpression returns 0 when qty is 0', () => {
    function TestComp() {
      const result = useExpression('{{if(qty > 0, qty * rate, 0)}}');
      return <div data-testid="result">{String(result)}</div>;
    }
    const ctx = createRootContext({ qty: 0, rate: 10 }, 'test', 'view');
    render(
      <TestWrapper ctx={ctx}>
        <TestComp />
      </TestWrapper>,
    );
    expect(screen.getByTestId('result')).toHaveTextContent('0');
  });

  test('useWidgetContext throws outside provider', () => {
    function TestComp() {
      const ctx = useWidgetContext();
      return <div>{ctx.model}</div>;
    }
    expect(() => render(<TestComp />)).toThrow();
  });
});
