import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { registerWidget, clearWidgetRegistry } from '../registry.js';
import { DataWidget } from '../components/DataWidget.js';
import { WidgetContextProvider } from '../hooks/useWidgetContext.js';
import { PageStateProvider } from '../hooks/usePageState.js';
import { StateStore } from '../state/store.js';
import { createRootContext } from '../context/builder.js';
import type { WidgetProps } from '../types.js';
import type { ComponentType } from 'react';

vi.mock('../data/useModelRecord.js', () => ({
  useModelRecord: vi.fn(() => ({
    data: { id: '1', name: 'Test Order' },
    isLoading: false,
    error: null,
  })),
}));

vi.mock('../data/useModelQuery.js', () => ({
  useModelQuery: vi.fn(() => ({
    data: [
      { id: '1', name: 'Order 1' },
      { id: '2', name: 'Order 2' },
    ],
    isLoading: false,
    isFetching: false,
    error: null,
    total: 2,
    page: 1,
    pageSize: 20,
    sort: null,
  })),
}));

function Wrapper({
  children,
  model = 'sales.order',
}: {
  children: React.ReactNode;
  model?: string;
}) {
  const ctx = createRootContext({}, model, 'view');
  const store = new StateStore();
  return (
    <PageStateProvider value={store}>
      <WidgetContextProvider value={ctx}>{children}</WidgetContextProvider>
    </PageStateProvider>
  );
}

beforeEach(() => {
  clearWidgetRegistry();
  registerWidget(
    {
      name: 'data',
      label: 'Data',
      category: 'data',
      schema: {},
      binding: 'none',
      triggers: ['load', 'error'],
      container: true,
    },
    DataWidget as unknown as ComponentType<WidgetProps>,
  );
});

afterEach(() => {
  cleanup();
  clearWidgetRegistry();
});

describe('DataWidget', () => {
  it('renders data-widget attribute in record mode', () => {
    const { container } = render(
      <Wrapper>
        <DataWidget
          props={{}}
          bind={
            {
              value: null,
              id: '123',
              query: { name: 'sales.order' },
            } as unknown as WidgetProps['bind']
          }
          on={{}}
          context={{ record: {}, model: 'sales.order', mode: 'view' }}
        >
          <span>child</span>
        </DataWidget>
      </Wrapper>,
    );

    const dataEl = container.querySelector('[data-rangka-widget="data"]');
    expect(dataEl).not.toBeNull();
  });

  it('renders children in record mode', () => {
    const { container } = render(
      <Wrapper>
        <DataWidget
          props={{}}
          bind={
            {
              value: null,
              id: '123',
              query: { name: 'sales.order' },
            } as unknown as WidgetProps['bind']
          }
          on={{}}
          context={{ record: {}, model: 'sales.order', mode: 'view' }}
          childNodes={[{ type: 'context-reader', bind: { field: 'name' } }]}
        >
          <span data-testid="child">hello</span>
        </DataWidget>
      </Wrapper>,
    );

    expect(container.querySelector('[data-rangka-widget="data"]')).not.toBeNull();
  });

  it('renders children in list mode', () => {
    const { container } = render(
      <Wrapper>
        <DataWidget
          props={{}}
          bind={{ value: null, query: { name: 'sales.order' } } as unknown as WidgetProps['bind']}
          on={{}}
          context={{ record: {}, model: 'sales.order', mode: 'view' }}
          childNodes={[{ type: 'context-reader', bind: { field: 'name' } }]}
        >
          <span data-testid="child">hello</span>
        </DataWidget>
      </Wrapper>,
    );

    expect(container.querySelector('[data-rangka-widget="data"]')).not.toBeNull();
  });

  it('fires load trigger when data loads in record mode', () => {
    const loadFn = vi.fn();
    render(
      <Wrapper>
        <DataWidget
          props={{}}
          bind={
            {
              value: null,
              id: '1',
              query: { name: 'sales.order' },
            } as unknown as WidgetProps['bind']
          }
          on={{ load: loadFn }}
          context={{ record: {}, model: 'sales.order', mode: 'view' }}
        >
          <span>child</span>
        </DataWidget>
      </Wrapper>,
    );

    expect(loadFn).toHaveBeenCalledWith({ record: { id: '1', name: 'Test Order' } });
  });

  it('fires load trigger when data loads in list mode', () => {
    const loadFn = vi.fn();
    render(
      <Wrapper>
        <DataWidget
          props={{}}
          bind={{ value: null, query: { name: 'sales.order' } } as unknown as WidgetProps['bind']}
          on={{ load: loadFn }}
          context={{ record: {}, model: 'sales.order', mode: 'view' }}
        >
          <span>child</span>
        </DataWidget>
      </Wrapper>,
    );

    expect(loadFn).toHaveBeenCalledWith({
      records: [
        { id: '1', name: 'Order 1' },
        { id: '2', name: 'Order 2' },
      ],
    });
  });

  it('returns null when no model name provided', () => {
    const { container } = render(
      <Wrapper model="">
        <DataWidget
          props={{}}
          bind={{ value: null } as unknown as WidgetProps['bind']}
          on={{}}
          context={{ record: {}, model: '', mode: 'view' }}
        >
          <span>child</span>
        </DataWidget>
      </Wrapper>,
    );

    expect(container.querySelector('[data-rangka-widget="data"]')).toBeNull();
  });
});
