import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { DatePickerWidget } from '../components/DatePickerWidget.js';

const defaultProps = {
  props: {},
  bind: { value: null },
  on: {},
  context: { record: {}, model: '', mode: 'view' as const },
};

afterEach(() => cleanup());

describe('DatePickerWidget', () => {
  it('renders a button trigger', () => {
    render(<DatePickerWidget {...defaultProps} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('displays label from props', () => {
    render(<DatePickerWidget {...defaultProps} props={{ label: 'Start Date' }} />);
    expect(screen.getByText('Start Date')).toBeInTheDocument();
  });

  it('shows placeholder when no date selected', () => {
    render(<DatePickerWidget {...defaultProps} />);
    expect(screen.getByText('Pick a date')).toBeInTheDocument();
  });

  it('displays formatted date when value is set', () => {
    render(<DatePickerWidget {...defaultProps} bind={{ value: '2024-03-15' }} />);
    expect(screen.getByRole('button').textContent).toContain('March');
    expect(screen.getByRole('button').textContent).toContain('15');
  });

  it('handles disabled state', () => {
    render(<DatePickerWidget {...defaultProps} props={{ disabled: true }} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('handles null bind.value gracefully', () => {
    render(<DatePickerWidget {...defaultProps} bind={{ value: null }} />);
    expect(screen.getByText('Pick a date')).toBeInTheDocument();
  });

  it('falls back to bind.meta.label', () => {
    render(
      <DatePickerWidget
        {...defaultProps}
        bind={{
          value: null,
          meta: { type: 'date', label: 'Due Date', required: false, readOnly: false },
        }}
      />,
    );
    expect(screen.getByText('Due Date')).toBeInTheDocument();
  });

  it('opens popover on click', () => {
    render(<DatePickerWidget {...defaultProps} />);
    fireEvent.click(screen.getByRole('button'));
    // DayPicker renders a table for the calendar
    expect(document.querySelector('table')).toBeInTheDocument();
  });
});
