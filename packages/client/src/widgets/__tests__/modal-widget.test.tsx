import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ModalWidget } from '../components/ModalWidget.js';
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

describe('ModalWidget', () => {
  it('renders children', () => {
    renderWithState(
      <ModalWidget
        props={{ size: 'md' }}
        bind={{ value: undefined }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      >
        <div data-testid="child">Hello</div>
      </ModalWidget>,
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toHaveTextContent('Hello');
  });

  it('renders with sm size', () => {
    renderWithState(
      <ModalWidget
        props={{ size: 'sm' }}
        bind={{ value: undefined }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      >
        <div>Content</div>
      </ModalWidget>,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('sm:max-w-sm');
  });

  it('renders with md size by default', () => {
    renderWithState(
      <ModalWidget
        props={{}}
        bind={{ value: undefined }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      >
        <div>Content</div>
      </ModalWidget>,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('sm:max-w-lg');
  });

  it('renders with lg size', () => {
    renderWithState(
      <ModalWidget
        props={{ size: 'lg' }}
        bind={{ value: undefined }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      >
        <div>Content</div>
      </ModalWidget>,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('sm:max-w-3xl');
  });

  it('renders title', () => {
    renderWithState(
      <ModalWidget
        props={{ title: 'Confirm Action' }}
        bind={{ value: undefined }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      >
        <div>Content</div>
      </ModalWidget>,
    );

    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
  });

  it('renders close button by default', () => {
    renderWithState(
      <ModalWidget
        props={{ title: 'Test' }}
        bind={{ value: undefined }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      >
        <div>Content</div>
      </ModalWidget>,
    );

    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('close button sets $state key to false', () => {
    const store = new StateStore();
    store.set('showModal', true);

    renderWithState(
      <ModalWidget
        props={{ title: 'Test', _visibleField: '$state.showModal' }}
        bind={{ value: undefined }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      >
        <div>Content</div>
      </ModalWidget>,
      store,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(store.get('showModal')).toBe(false);
  });

  it('has correct aria role', () => {
    renderWithState(
      <ModalWidget
        props={{ title: 'My Modal' }}
        bind={{ value: undefined }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      >
        <div>Content</div>
      </ModalWidget>,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
