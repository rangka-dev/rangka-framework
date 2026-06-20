import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MoneyWidget } from '../components/MoneyWidget.js';

const defaultProps = {
  props: {},
  bind: { value: null },
  on: {},
  context: { record: {}, model: '', mode: 'view' as const },
};

afterEach(() => cleanup());

describe('MoneyWidget', () => {
  it('renders input element', () => {
    const { container } = render(<MoneyWidget {...defaultProps} />);
    expect(container.querySelector('input')).toBeInTheDocument();
  });

  it('displays label from props', () => {
    render(<MoneyWidget {...defaultProps} props={{ label: 'Amount' }} />);
    expect(screen.getByText('Amount')).toBeInTheDocument();
  });

  it('shows currency prefix', () => {
    render(<MoneyWidget {...defaultProps} props={{ currency: '€' }} />);
    expect(screen.getByText('€')).toBeInTheDocument();
  });

  it('shows default $ prefix', () => {
    render(<MoneyWidget {...defaultProps} />);
    expect(screen.getByText('$')).toBeInTheDocument();
  });

  it('displays value with 2 decimal places', () => {
    const { container } = render(<MoneyWidget {...defaultProps} bind={{ value: 1234.5 }} />);
    expect(container.querySelector('input')?.value).toBe('1234.50');
  });

  it('fires on.change with numeric value', () => {
    const onChange = vi.fn();
    const { container } = render(<MoneyWidget {...defaultProps} on={{ change: onChange }} />);
    fireEvent.focus(container.querySelector('input')!);
    fireEvent.change(container.querySelector('input')!, { target: { value: '99.99' } });
    expect(onChange).toHaveBeenCalledWith(99.99);
  });

  it('fires on.change with null for empty input', () => {
    const onChange = vi.fn();
    const { container } = render(
      <MoneyWidget {...defaultProps} bind={{ value: 100 }} on={{ change: onChange }} />,
    );
    fireEvent.focus(container.querySelector('input')!);
    fireEvent.change(container.querySelector('input')!, { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('formats value on blur', () => {
    const { container } = render(<MoneyWidget {...defaultProps} bind={{ value: null }} />);
    const input = container.querySelector('input')!;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '42.1' } });
    fireEvent.blur(input);
    expect(input.value).toBe('42.10');
  });

  it('handles disabled state', () => {
    const { container } = render(<MoneyWidget {...defaultProps} props={{ disabled: true }} />);
    expect(container.querySelector('input')?.disabled).toBe(true);
  });

  it('handles null bind.value gracefully', () => {
    const { container } = render(<MoneyWidget {...defaultProps} bind={{ value: null }} />);
    expect(container.querySelector('input')?.value).toBe('');
  });

  it('handles readOnly from bind.meta', () => {
    const { container } = render(
      <MoneyWidget
        {...defaultProps}
        bind={{ value: 0, meta: { type: 'money', label: 'X', required: false, readOnly: true } }}
      />,
    );
    expect(container.querySelector('input')?.readOnly).toBe(true);
  });

  it('calls bind.setValue on change', () => {
    const setValue = vi.fn();
    const { container } = render(
      <MoneyWidget {...defaultProps} bind={{ value: null, setValue }} />,
    );
    fireEvent.focus(container.querySelector('input')!);
    fireEvent.change(container.querySelector('input')!, { target: { value: '50' } });
    expect(setValue).toHaveBeenCalledWith(50);
  });
});
