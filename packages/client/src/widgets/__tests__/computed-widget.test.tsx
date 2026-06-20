import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { ComputedWidget } from '../components/ComputedWidget.js';

const defaultProps = {
  props: {},
  bind: { value: null },
  on: {},
  context: { record: {}, model: '', mode: 'view' as const },
};

afterEach(() => cleanup());

describe('ComputedWidget', () => {
  it('renders dash for null value', () => {
    render(<ComputedWidget {...defaultProps} />);
    expect(screen.getByTestId('computed-value').textContent).toBe('—');
  });

  it('renders string value', () => {
    render(<ComputedWidget {...defaultProps} bind={{ value: 'hello' }} />);
    expect(screen.getByTestId('computed-value').textContent).toBe('hello');
  });

  it('renders number with locale formatting', () => {
    render(
      <ComputedWidget {...defaultProps} props={{ format: 'number' }} bind={{ value: 1234567 }} />,
    );
    expect(screen.getByTestId('computed-value').textContent).toContain('1,234,567');
  });

  it('renders currency with 2 decimals', () => {
    render(
      <ComputedWidget {...defaultProps} props={{ format: 'currency' }} bind={{ value: 99.5 }} />,
    );
    expect(screen.getByTestId('computed-value').textContent).toBe('99.50');
  });

  it('displays label from props', () => {
    render(<ComputedWidget {...defaultProps} props={{ label: 'Total' }} />);
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('falls back to bind.meta.label', () => {
    render(
      <ComputedWidget
        {...defaultProps}
        bind={{
          value: 0,
          meta: { type: 'computed', label: 'Outstanding', required: false, readOnly: true },
        }}
      />,
    );
    expect(screen.getByText('Outstanding')).toBeInTheDocument();
  });

  it('handles undefined value gracefully', () => {
    render(<ComputedWidget {...defaultProps} bind={{ value: undefined }} />);
    expect(screen.getByTestId('computed-value').textContent).toBe('—');
  });
});
