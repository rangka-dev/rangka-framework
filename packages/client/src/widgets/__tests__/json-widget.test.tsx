import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { JsonWidget } from '../components/JsonWidget.js';

const defaultProps = {
  props: {},
  bind: { value: null },
  on: {},
  context: { record: {}, model: '', mode: 'view' as const },
};

afterEach(() => cleanup());

describe('JsonWidget', () => {
  it('renders a textarea', () => {
    const { container } = render(<JsonWidget {...defaultProps} />);
    expect(container.querySelector('textarea')).toBeInTheDocument();
  });

  it('has monospace font', () => {
    const { container } = render(<JsonWidget {...defaultProps} />);
    expect(container.querySelector('textarea')?.className).toContain('font-mono');
  });

  it('displays label from props', () => {
    render(<JsonWidget {...defaultProps} props={{ label: 'Metadata' }} />);
    expect(screen.getByText('Metadata')).toBeInTheDocument();
  });

  it('renders object value as formatted JSON', () => {
    const { container } = render(<JsonWidget {...defaultProps} bind={{ value: { key: 'val' } }} />);
    expect(container.querySelector('textarea')?.value).toContain('"key": "val"');
  });

  it('formats JSON on blur', () => {
    const setValue = vi.fn();
    const { container } = render(<JsonWidget {...defaultProps} bind={{ value: null, setValue }} />);
    const textarea = container.querySelector('textarea')!;
    fireEvent.change(textarea, { target: { value: '{"a":1}' } });
    fireEvent.blur(textarea);
    expect(textarea.value).toContain('"a": 1');
    expect(setValue).toHaveBeenCalledWith({ a: 1 });
  });

  it('shows error for invalid JSON on blur', () => {
    const { container } = render(<JsonWidget {...defaultProps} bind={{ value: null }} />);
    const textarea = container.querySelector('textarea')!;
    fireEvent.change(textarea, { target: { value: '{invalid' } });
    fireEvent.blur(textarea);
    expect(screen.getByRole('alert').textContent).toBe('Invalid JSON');
  });

  it('handles disabled state', () => {
    const { container } = render(<JsonWidget {...defaultProps} props={{ disabled: true }} />);
    expect(container.querySelector('textarea')?.disabled).toBe(true);
  });

  it('handles null bind.value gracefully', () => {
    const { container } = render(<JsonWidget {...defaultProps} bind={{ value: null }} />);
    expect(container.querySelector('textarea')?.value).toBe('');
  });

  it('fires on.change when typing', () => {
    const onChange = vi.fn();
    const { container } = render(<JsonWidget {...defaultProps} on={{ change: onChange }} />);
    fireEvent.change(container.querySelector('textarea')!, { target: { value: '{}' } });
    expect(onChange).toHaveBeenCalledWith('{}');
  });
});
