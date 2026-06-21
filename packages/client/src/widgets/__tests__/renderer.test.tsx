import React from 'react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SlotRenderer } from '../renderer/SlotRenderer.js';
import { registerWidget, clearWidgetRegistry } from '../registry.js';
import { registerBuiltInWidgets } from '../components/register.js';
import { DividerWidget } from '../components/DividerWidget.js';
import { SpacerWidget } from '../components/SpacerWidget.js';
import { SequenceWidget } from '../components/SequenceWidget.js';
import { createRootContext } from '../context/builder.js';
import { StateStore } from '../state/store.js';
import type { WidgetDefinitionMeta, WidgetNode } from '@rangka/shared';
import type { WidgetProps } from '../types.js';
import type { ComponentType } from 'react';

type WidgetWithMeta = ComponentType<WidgetProps> & { widgetMeta: WidgetDefinitionMeta };

beforeEach(() => {
  clearWidgetRegistry();
  registerBuiltInWidgets();
  registerWidget(
    (DividerWidget as unknown as WidgetWithMeta).widgetMeta,
    DividerWidget as unknown as ComponentType<WidgetProps>,
  );
  registerWidget(
    (SpacerWidget as unknown as WidgetWithMeta).widgetMeta,
    SpacerWidget as unknown as ComponentType<WidgetProps>,
  );
  registerWidget(
    (SequenceWidget as unknown as WidgetWithMeta).widgetMeta,
    SequenceWidget as unknown as ComponentType<WidgetProps>,
  );
});

describe('SlotRenderer', () => {
  test('renders empty slot without error', () => {
    const { container } = render(<SlotRenderer nodes={[]} />);
    expect(container.innerHTML).toBe('');
  });

  test('renders single button widget', () => {
    const nodes: WidgetNode[] = [{ type: 'button', props: { label: 'Click me' } }];
    render(<SlotRenderer nodes={nodes} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  test('renders multiple widgets in order', () => {
    const nodes: WidgetNode[] = [
      { type: 'button', props: { label: 'First' } },
      { type: 'button', props: { label: 'Second' } },
      { type: 'button', props: { label: 'Third' } },
    ];
    render(<SlotRenderer nodes={nodes} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
    expect(buttons[0]).toHaveTextContent('First');
    expect(buttons[1]).toHaveTextContent('Second');
    expect(buttons[2]).toHaveTextContent('Third');
  });

  test('renders text widget with field binding', () => {
    const ctx = createRootContext({ name: 'Order #1' }, 'sales.order', 'view');
    const nodes: WidgetNode[] = [{ type: 'text', bind: { field: 'name' } }];
    render(<SlotRenderer nodes={nodes} context={ctx} />);
    expect(screen.getByText('Order #1')).toBeInTheDocument();
  });

  test('renders text widget with expression binding', () => {
    const ctx = createRootContext({ qty: 5, rate: 100 }, 'sales.order', 'view');
    const nodes: WidgetNode[] = [{ type: 'text', bind: { expression: '{{qty * rate}}' } }];
    render(<SlotRenderer nodes={nodes} context={ctx} />);
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  test('skips widget when visible=false', () => {
    const ctx = createRootContext({ status: 'submitted' }, 'sales.order', 'view');
    const nodes: WidgetNode[] = [
      {
        type: 'button',
        props: { label: 'Edit' },
        visible: { field: 'status', operator: 'eq', value: 'draft' },
      },
    ];
    render(<SlotRenderer nodes={nodes} context={ctx} />);
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  test('shows widget when visible=true', () => {
    const ctx = createRootContext({ status: 'draft' }, 'sales.order', 'view');
    const nodes: WidgetNode[] = [
      {
        type: 'button',
        props: { label: 'Edit' },
        visible: { field: 'status', operator: 'eq', value: 'draft' },
      },
    ];
    render(<SlotRenderer nodes={nodes} context={ctx} />);
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  test('resolves expression in props', () => {
    const ctx = createRootContext({ count: 3 }, 'test', 'view');
    const nodes: WidgetNode[] = [{ type: 'button', props: { label: '{{count}} items' } }];
    render(<SlotRenderer nodes={nodes} context={ctx} />);
    expect(screen.getByText('3 items')).toBeInTheDocument();
  });

  test('renders group with children', () => {
    const nodes: WidgetNode[] = [
      {
        type: 'group',
        props: { direction: 'row' },
        children: [
          { type: 'button', props: { label: 'A' } },
          { type: 'button', props: { label: 'B' } },
        ],
      },
    ];
    render(<SlotRenderer nodes={nodes} />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  test('renders section with label and children', () => {
    const nodes: WidgetNode[] = [
      {
        type: 'section',
        props: { label: 'Details' },
        children: [{ type: 'text', bind: { expression: '{{"hello"}}' } }],
      },
    ];
    render(<SlotRenderer nodes={nodes} />);
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  test('renders divider', () => {
    const nodes: WidgetNode[] = [{ type: 'divider' }];
    const { container } = render(<SlotRenderer nodes={nodes} />);
    expect(
      container.querySelector('[role="separator"]') ??
        container.querySelector('[data-slot="separator"]'),
    ).toBeInTheDocument();
  });

  test('renders spacer', () => {
    const nodes: WidgetNode[] = [{ type: 'spacer' }];
    const { container } = render(<SlotRenderer nodes={nodes} />);
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  test('renders loading placeholder for unknown widget', () => {
    const nodes: WidgetNode[] = [{ type: 'nonexistent_widget' }];
    const { container } = render(<SlotRenderer nodes={nodes} />);
    expect(container.querySelector('[data-widget-loading]')).toBeInTheDocument();
  });

  test('button click fires action', async () => {
    const navigate = vi.fn();
    const nodes: WidgetNode[] = [
      {
        type: 'button',
        props: { label: 'Go' },
        on: { click: { type: 'navigate', path: '/home' } },
      },
    ];
    render(<SlotRenderer nodes={nodes} handlers={{ navigate }} />);
    fireEvent.click(screen.getByText('Go'));
    await vi.waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/home');
    });
  });

  test('button click fires setValue on $state', async () => {
    const state = new StateStore();
    const nodes: WidgetNode[] = [
      {
        type: 'button',
        props: { label: 'Next' },
        on: { click: { type: 'setValue', field: '$state.step', value: 2 } },
      },
    ];
    render(<SlotRenderer nodes={nodes} state={state} />);
    fireEvent.click(screen.getByText('Next'));
    await vi.waitFor(() => {
      expect(state.get('step')).toBe(2);
    });
  });
});

describe('SlotRenderer Edge Cases', () => {
  test('deeply nested widget tree renders', () => {
    const nodes: WidgetNode[] = [
      {
        type: 'group',
        children: [
          {
            type: 'group',
            children: [
              {
                type: 'group',
                children: [{ type: 'button', props: { label: 'Deep' } }],
              },
            ],
          },
        ],
      },
    ];
    render(<SlotRenderer nodes={nodes} />);
    expect(screen.getByText('Deep')).toBeInTheDocument();
  });

  test('multiple visible conditions all must pass', () => {
    const ctx = createRootContext({ status: 'draft', total: 50 }, 'test', 'view');
    const nodes: WidgetNode[] = [
      {
        type: 'button',
        props: { label: 'Submit' },
        visible: [
          { field: 'status', operator: 'eq', value: 'draft' },
          { field: 'total', operator: 'gt', value: 0 },
        ],
      },
    ];
    render(<SlotRenderer nodes={nodes} context={ctx} />);
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  test('visible fails when one condition false', () => {
    const ctx = createRootContext({ status: 'draft', total: 0 }, 'test', 'view');
    const nodes: WidgetNode[] = [
      {
        type: 'button',
        props: { label: 'Submit' },
        visible: [
          { field: 'status', operator: 'eq', value: 'draft' },
          { field: 'total', operator: 'gt', value: 0 },
        ],
      },
    ];
    render(<SlotRenderer nodes={nodes} context={ctx} />);
    expect(screen.queryByText('Submit')).not.toBeInTheDocument();
  });

  test('widget with no props renders without error', () => {
    const nodes: WidgetNode[] = [{ type: 'divider' }];
    expect(() => render(<SlotRenderer nodes={nodes} />)).not.toThrow();
  });

  test('custom widget via registry', () => {
    const CustomWidget = ({ props }: WidgetProps) => (
      <div data-testid="custom">{props.text as string}</div>
    );
    registerWidget(
      {
        name: 'custom-test',
        label: 'Custom',
        category: 'display',
        schema: { text: { type: 'string' } },
        binding: 'none',
        triggers: [],
        container: false,
      },
      CustomWidget,
    );
    const nodes: WidgetNode[] = [{ type: 'custom-test', props: { text: 'Hello Custom' } }];
    render(<SlotRenderer nodes={nodes} />);
    expect(screen.getByTestId('custom')).toHaveTextContent('Hello Custom');
  });

  test('sequence action fires multiple actions', async () => {
    const state = new StateStore();
    const navigate = vi.fn();
    const nodes: WidgetNode[] = [
      {
        type: 'button',
        props: { label: 'Do All' },
        on: {
          click: {
            type: 'sequence',
            actions: [
              { type: 'setValue', field: '$state.done', value: true },
              { type: 'navigate', path: '/done' },
            ],
          },
        },
      },
    ];
    render(<SlotRenderer nodes={nodes} state={state} handlers={{ navigate }} />);
    fireEvent.click(screen.getByText('Do All'));
    await vi.waitFor(() => {
      expect(state.get('done')).toBe(true);
      expect(navigate).toHaveBeenCalledWith('/done');
    });
  });

  test('expression binding with nested field path', () => {
    const ctx = createRootContext({ items: [10, 20, 30] }, 'test', 'view');
    const nodes: WidgetNode[] = [{ type: 'text', bind: { expression: '{{sum(items)}}' } }];
    render(<SlotRenderer nodes={nodes} context={ctx} />);
    expect(screen.getByText('60')).toBeInTheDocument();
  });

  test('widget with expression in disabled prop', () => {
    const ctx = createRootContext({ locked: true }, 'test', 'view');
    const nodes: WidgetNode[] = [
      { type: 'button', props: { label: 'Action', disabled: '{{locked}}' } },
    ];
    render(<SlotRenderer nodes={nodes} context={ctx} />);
    expect(screen.getByText('Action')).toBeDisabled();
  });

  test('handles null bind value gracefully', () => {
    const ctx = createRootContext({ name: null }, 'test', 'view');
    const nodes: WidgetNode[] = [{ type: 'text', bind: { field: 'name' } }];
    expect(() => render(<SlotRenderer nodes={nodes} context={ctx} />)).not.toThrow();
  });
});
