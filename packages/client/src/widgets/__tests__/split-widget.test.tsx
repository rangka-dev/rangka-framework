import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { registerWidget, clearWidgetRegistry } from '../registry.js';
import { SplitWidget } from '../components/SplitWidget.js';
import { WidgetContextProvider } from '../hooks/useWidgetContext.js';
import { PageStateProvider } from '../hooks/usePageState.js';
import { StateStore } from '../state/store.js';
import type { WidgetProps } from '../types.js';
import type { ComponentType } from 'react';
import type { WidgetNode } from '@rangka/shared';

vi.mock('react-resizable-panels', () => ({
  Group: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="panel-group" className={className}>
      {children}
    </div>
  ),
  Panel: ({ children, defaultSize }: { children: React.ReactNode; defaultSize?: number }) => (
    <div data-testid="panel" data-default-size={defaultSize}>
      {children}
    </div>
  ),
  Separator: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="separator">{children}</div>
  ),
}));

function TestChild({ props }: WidgetProps) {
  return <div data-testid="child">{String(props.label ?? '')}</div>;
}

beforeEach(() => {
  clearWidgetRegistry();
  registerWidget(
    {
      name: 'split',
      label: 'Split',
      category: 'layout',
      schema: {},
      binding: 'none',
      triggers: [],
      container: true,
    },
    SplitWidget as unknown as ComponentType<WidgetProps>,
  );
  registerWidget(
    {
      name: 'test-child',
      label: 'Test Child',
      category: 'display',
      schema: {},
      binding: 'none',
      triggers: [],
      container: false,
    },
    TestChild,
  );
});

afterEach(() => {
  cleanup();
  clearWidgetRegistry();
});

const makeChildNodes = (labels: string[]): WidgetNode[] =>
  labels.map((label) => ({ type: 'test-child', props: { label } }));

const defaultCtx = { record: {}, model: '', mode: 'view' as const };

function renderSplit(props: Record<string, unknown>, childNodes: WidgetNode[]) {
  const store = new StateStore();
  return render(
    <PageStateProvider value={store}>
      <WidgetContextProvider value={defaultCtx}>
        <SplitWidget
          props={props}
          bind={{ value: undefined }}
          on={{}}
          context={defaultCtx}
          childNodes={childNodes}
        />
      </WidgetContextProvider>
    </PageStateProvider>,
  );
}

describe('SplitWidget', () => {
  it('renders children in resizable panels', () => {
    const { container } = renderSplit(
      { sizes: [60, 40], direction: 'horizontal' },
      makeChildNodes(['Left', 'Right']),
    );

    const panels = container.querySelectorAll('[data-testid="panel"]');
    expect(panels).toHaveLength(2);
    expect(panels[0].getAttribute('data-default-size')).toBe('60');
    expect(panels[1].getAttribute('data-default-size')).toBe('40');
  });

  it('distributes equally when sizes not provided', () => {
    const { container } = renderSplit({}, makeChildNodes(['A', 'B', 'C']));

    const panels = container.querySelectorAll('[data-testid="panel"]');
    expect(panels).toHaveLength(3);
    const expectedSize = String(100 / 3);
    expect(panels[0].getAttribute('data-default-size')).toBe(expectedSize);
  });

  it('renders with vertical orientation', () => {
    const { container } = renderSplit(
      { sizes: [50, 50], direction: 'vertical' },
      makeChildNodes(['Top', 'Bottom']),
    );

    const panels = container.querySelectorAll('[data-testid="panel"]');
    expect(panels).toHaveLength(2);
  });

  it('defaults to horizontal direction', () => {
    const { container } = renderSplit({ sizes: [70, 30] }, makeChildNodes(['Left', 'Right']));

    const panels = container.querySelectorAll('[data-testid="panel"]');
    expect(panels).toHaveLength(2);
  });

  it('renders resize handles between panels', () => {
    const { container } = renderSplit({ sizes: [25, 50, 25] }, makeChildNodes(['A', 'B', 'C']));

    const separators = container.querySelectorAll('[data-testid="separator"]');
    expect(separators).toHaveLength(2);
  });
});
