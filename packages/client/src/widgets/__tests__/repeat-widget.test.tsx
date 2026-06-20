import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { registerWidget, clearWidgetRegistry } from '../registry.js';
import { RepeatWidget } from '../components/RepeatWidget.js';
import { WidgetContextProvider } from '../hooks/useWidgetContext.js';
import type { WidgetProps } from '../types.js';
import type { WidgetContext } from '../context/types.js';
import type { ComponentType } from 'react';

function FieldReader({ bind, context }: WidgetProps) {
  return (
    <span data-testid="field-reader" data-index={context.index} data-model={context.model}>
      {bind.value != null ? String(bind.value) : 'no-value'}
    </span>
  );
}

beforeEach(() => {
  clearWidgetRegistry();
  registerWidget(
    {
      name: 'repeat',
      label: 'Repeat',
      category: 'data',
      schema: {},
      binding: 'field',
      triggers: [],
      container: true,
    },
    RepeatWidget as unknown as ComponentType<WidgetProps>,
  );
  registerWidget(
    {
      name: 'field-reader',
      label: 'Field Reader',
      category: 'display',
      schema: {},
      binding: 'field',
      triggers: [],
      container: false,
    },
    FieldReader,
  );
});

afterEach(() => {
  cleanup();
  clearWidgetRegistry();
});

describe('RepeatWidget', () => {
  it('renders children for each record from bind.value', () => {
    const records = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
      { id: '3', name: 'Carol' },
    ];

    const { container } = render(
      <WidgetContextProvider value={{ record: {}, model: 'test', mode: 'view' }}>
        <RepeatWidget
          props={{ layout: 'list' }}
          bind={{ value: records }}
          on={{}}
          context={{ record: {}, model: 'test', mode: 'view' }}
        >
          <span data-testid="repeat-child">item</span>
        </RepeatWidget>
      </WidgetContextProvider>,
    );

    const items = container.querySelectorAll('[data-repeat-index]');
    expect(items).toHaveLength(3);
  });

  it('reads records from parent context when bind.value is not an array', () => {
    const records = [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' },
    ];

    const ctx: WidgetContext = {
      record: {},
      records,
      model: 'sales.product',
      mode: 'view',
    };

    const { container } = render(
      <WidgetContextProvider value={ctx}>
        <RepeatWidget
          props={{ layout: 'list' }}
          bind={{ value: null }}
          on={{}}
          context={{ record: {}, model: 'sales.product', mode: 'view' }}
        >
          <span data-testid="repeat-child">item</span>
        </RepeatWidget>
      </WidgetContextProvider>,
    );

    const items = container.querySelectorAll('[data-repeat-index]');
    expect(items).toHaveLength(2);
  });

  it('renders grid layout with correct columns', () => {
    const records = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
    ];

    const { container } = render(
      <WidgetContextProvider value={{ record: {}, model: 'test', mode: 'view' }}>
        <RepeatWidget
          props={{ layout: 'grid', columns: 2, gap: 'lg' }}
          bind={{ value: records }}
          on={{}}
          context={{ record: {}, model: 'test', mode: 'view' }}
        >
          <span>item</span>
        </RepeatWidget>
      </WidgetContextProvider>,
    );

    const repeatEl = container.querySelector('[data-widget="repeat"]') as HTMLElement;
    expect(repeatEl.getAttribute('data-layout')).toBe('grid');
    expect(repeatEl.style.display).toBe('grid');
    expect(repeatEl.style.gridTemplateColumns).toBe('repeat(2, minmax(0, 1fr))');
    expect(repeatEl.style.gap).toBe('24px');
  });

  it('renders list layout with vertical flex', () => {
    const records = [{ id: '1', name: 'A' }];

    const { container } = render(
      <WidgetContextProvider value={{ record: {}, model: 'test', mode: 'view' }}>
        <RepeatWidget
          props={{ layout: 'list', gap: 'sm' }}
          bind={{ value: records }}
          on={{}}
          context={{ record: {}, model: 'test', mode: 'view' }}
        >
          <span>item</span>
        </RepeatWidget>
      </WidgetContextProvider>,
    );

    const repeatEl = container.querySelector('[data-widget="repeat"]') as HTMLElement;
    expect(repeatEl.getAttribute('data-layout')).toBe('list');
    expect(repeatEl.style.display).toBe('flex');
    expect(repeatEl.style.flexDirection).toBe('column');
    expect(repeatEl.style.gap).toBe('8px');
  });

  it('provides row-level context with index', () => {
    const records = [
      { id: '1', name: 'First' },
      { id: '2', name: 'Second' },
    ];

    const ctx: WidgetContext = {
      record: {},
      records,
      model: 'test.item',
      mode: 'view',
    };

    // We need to test that children get row context
    // The RepeatWidget renders children as ReactNode, so each iteration gets WidgetContextProvider
    // We verify by checking that it renders the right number of items
    const { container } = render(
      <WidgetContextProvider value={ctx}>
        <RepeatWidget
          props={{ layout: 'list' }}
          bind={{ value: records }}
          on={{}}
          context={{ record: {}, model: 'test.item', mode: 'view' }}
        >
          <span className="child-marker">child</span>
        </RepeatWidget>
      </WidgetContextProvider>,
    );

    const items = container.querySelectorAll('[data-repeat-index]');
    expect(items).toHaveLength(2);
    expect(items[0].getAttribute('data-repeat-index')).toBe('0');
    expect(items[1].getAttribute('data-repeat-index')).toBe('1');
  });

  it('renders empty when no records available', () => {
    const { container } = render(
      <WidgetContextProvider value={{ record: {}, model: 'test', mode: 'view' }}>
        <RepeatWidget
          props={{ layout: 'list' }}
          bind={{ value: null }}
          on={{}}
          context={{ record: {}, model: 'test', mode: 'view' }}
        >
          <span>item</span>
        </RepeatWidget>
      </WidgetContextProvider>,
    );

    const items = container.querySelectorAll('[data-repeat-index]');
    expect(items).toHaveLength(0);
  });

  it('defaults to list layout and md gap', () => {
    const records = [{ id: '1', name: 'A' }];

    const { container } = render(
      <WidgetContextProvider value={{ record: {}, model: 'test', mode: 'view' }}>
        <RepeatWidget
          props={{}}
          bind={{ value: records }}
          on={{}}
          context={{ record: {}, model: 'test', mode: 'view' }}
        >
          <span>item</span>
        </RepeatWidget>
      </WidgetContextProvider>,
    );

    const repeatEl = container.querySelector('[data-widget="repeat"]') as HTMLElement;
    expect(repeatEl.getAttribute('data-layout')).toBe('list');
    expect(repeatEl.style.gap).toBe('16px');
  });
});
