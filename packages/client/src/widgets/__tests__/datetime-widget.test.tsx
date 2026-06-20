import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { DatetimeWidget } from '../components/DatetimeWidget.js';

const defaultProps = {
  props: {},
  bind: { value: null },
  on: {},
  context: { record: {}, model: '', mode: 'view' as const },
};

afterEach(() => cleanup());

describe('DatetimeWidget', () => {
  it('renders a button trigger', () => {
    render(<DatetimeWidget {...defaultProps} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('displays label from props', () => {
    render(<DatetimeWidget {...defaultProps} props={{ label: 'Created At' }} />);
    expect(screen.getByText('Created At')).toBeInTheDocument();
  });

  it('shows placeholder when no datetime selected', () => {
    render(<DatetimeWidget {...defaultProps} />);
    expect(screen.getByText('Pick date and time')).toBeInTheDocument();
  });

  it('displays formatted datetime when value is set', () => {
    render(<DatetimeWidget {...defaultProps} bind={{ value: '2024-03-15T14:30:00.000Z' }} />);
    const btn = screen.getByRole('button');
    expect(btn.textContent).toContain('March');
    expect(btn.textContent).toContain('15');
  });

  it('handles disabled state', () => {
    render(<DatetimeWidget {...defaultProps} props={{ disabled: true }} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('handles null bind.value gracefully', () => {
    render(<DatetimeWidget {...defaultProps} bind={{ value: null }} />);
    expect(screen.getByText('Pick date and time')).toBeInTheDocument();
  });

  it('falls back to bind.meta.label', () => {
    render(
      <DatetimeWidget
        {...defaultProps}
        bind={{
          value: null,
          meta: { type: 'datetime', label: 'Updated At', required: false, readOnly: false },
        }}
      />,
    );
    expect(screen.getByText('Updated At')).toBeInTheDocument();
  });

  it('opens popover on click and shows time selects', () => {
    render(<DatetimeWidget {...defaultProps} bind={{ value: '2024-03-15T14:30:00.000Z' }} />);
    fireEvent.click(screen.getByRole('button'));
    const triggers = document.querySelectorAll('[data-slot="select-trigger"]');
    expect(triggers.length).toBeGreaterThanOrEqual(2);
  });
});
