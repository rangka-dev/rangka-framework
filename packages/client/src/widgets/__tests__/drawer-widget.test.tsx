import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { DrawerWidget } from '../components/DrawerWidget.js';
import { PageStateProvider } from '../hooks/usePageState.js';
import { StateStore } from '../state/store.js';

function renderWithState(ui: React.ReactElement, state?: StateStore) {
  const store = state ?? new StateStore();
  return { ...render(<PageStateProvider value={store}>{ui}</PageStateProvider>), store };
}

beforeEach(() => {});

afterEach(() => {
  cleanup();
});

describe('DrawerWidget', () => {
  it('renders children', () => {
    renderWithState(
      <DrawerWidget
        props={{ width: 'md' }}
        bind={{ value: undefined }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      >
        <div data-testid="child">Hello</div>
      </DrawerWidget>,
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toHaveTextContent('Hello');
  });

  it('renders with sm width class', () => {
    renderWithState(
      <DrawerWidget
        props={{ width: 'sm' }}
        bind={{ value: undefined }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      >
        <div>Content</div>
      </DrawerWidget>,
    );

    const sheet = screen.getByRole('dialog');
    expect(sheet.className).toContain('w-80');
  });

  it('renders with md width class by default', () => {
    renderWithState(
      <DrawerWidget
        props={{}}
        bind={{ value: undefined }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      >
        <div>Content</div>
      </DrawerWidget>,
    );

    const sheet = screen.getByRole('dialog');
    expect(sheet.className).toContain('w-[28rem]');
  });

  it('renders with lg width class', () => {
    renderWithState(
      <DrawerWidget
        props={{ width: 'lg' }}
        bind={{ value: undefined }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      >
        <div>Content</div>
      </DrawerWidget>,
    );

    const sheet = screen.getByRole('dialog');
    expect(sheet.className).toContain('w-[40rem]');
  });

  it('renders title', () => {
    renderWithState(
      <DrawerWidget
        props={{ title: 'Order Details' }}
        bind={{ value: undefined }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      >
        <div>Content</div>
      </DrawerWidget>,
    );

    expect(screen.getByText('Order Details')).toBeInTheDocument();
  });

  it('renders close button by default', () => {
    renderWithState(
      <DrawerWidget
        props={{ title: 'Test' }}
        bind={{ value: undefined }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      >
        <div>Content</div>
      </DrawerWidget>,
    );

    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('close button sets $state key to false', () => {
    const store = new StateStore();
    store.set('showDrawer', true);

    renderWithState(
      <DrawerWidget
        props={{ title: 'Test', _visibleField: '$state.showDrawer' }}
        bind={{ value: undefined }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      >
        <div>Content</div>
      </DrawerWidget>,
      store,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(store.get('showDrawer')).toBe(false);
  });

  it('drawer is visible when open', () => {
    renderWithState(
      <DrawerWidget
        props={{}}
        bind={{ value: undefined }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      >
        <div>Content</div>
      </DrawerWidget>,
    );

    const sheet = screen.getByRole('dialog');
    expect(sheet).toBeInTheDocument();
  });
});
