import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { registerWidget, clearWidgetRegistry } from '../registry.js';
import { GridWidget } from '../components/GridWidget.js';
import type { WidgetProps } from '../types.js';
import type { ComponentType } from 'react';

beforeEach(() => {
  clearWidgetRegistry();
  registerWidget(
    {
      name: 'grid',
      label: 'Grid',
      category: 'layout',
      schema: {},
      binding: 'none',
      triggers: [],
      container: true,
    },
    GridWidget as unknown as ComponentType<WidgetProps>,
  );
});

afterEach(() => {
  cleanup();
  clearWidgetRegistry();
});

describe('GridWidget', () => {
  it('renders with default 3 columns and md gap', () => {
    const { container } = render(
      <GridWidget
        props={{}}
        bind={{ value: undefined }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      >
        <div>1</div>
        <div>2</div>
        <div>3</div>
      </GridWidget>,
    );

    const grid = container.firstElementChild as HTMLElement;
    expect(grid.className).toContain('grid');
    expect(grid.className).toContain('grid-cols-3');
    expect(grid.className).toContain('gap-4');
  });

  it('renders with custom columns', () => {
    const { container } = render(
      <GridWidget
        props={{ columns: 4 }}
        bind={{ value: undefined }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      >
        <div>1</div>
        <div>2</div>
        <div>3</div>
        <div>4</div>
      </GridWidget>,
    );

    const grid = container.firstElementChild as HTMLElement;
    expect(grid.className).toContain('grid-cols-4');
  });

  it('renders with sm gap', () => {
    const { container } = render(
      <GridWidget
        props={{ gap: 'sm' }}
        bind={{ value: undefined }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      >
        <div>1</div>
      </GridWidget>,
    );

    const grid = container.firstElementChild as HTMLElement;
    expect(grid.className).toContain('gap-2');
  });

  it('renders with lg gap', () => {
    const { container } = render(
      <GridWidget
        props={{ gap: 'lg' }}
        bind={{ value: undefined }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      >
        <div>1</div>
      </GridWidget>,
    );

    const grid = container.firstElementChild as HTMLElement;
    expect(grid.className).toContain('gap-6');
  });

  it('renders children inside the grid', () => {
    const { container } = render(
      <GridWidget
        props={{ columns: 2, gap: 'md' }}
        bind={{ value: undefined }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      >
        <div data-testid="item-1">Item 1</div>
        <div data-testid="item-2">Item 2</div>
      </GridWidget>,
    );

    const grid = container.firstElementChild as HTMLElement;
    expect(grid.children).toHaveLength(2);
    expect(grid.children[0].textContent).toBe('Item 1');
    expect(grid.children[1].textContent).toBe('Item 2');
  });

  it('applies default responsive classes', () => {
    const { container } = render(
      <GridWidget
        props={{ columns: 3 }}
        bind={{ value: undefined }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      >
        <div>1</div>
      </GridWidget>,
    );

    const grid = container.firstElementChild as HTMLElement;
    expect(grid.className).toContain('max-md:grid-cols-2');
    expect(grid.className).toContain('max-sm:grid-cols-1');
  });
});
