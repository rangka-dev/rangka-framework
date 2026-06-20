import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { CodeWidget } from '../components/CodeWidget.js';

const defaultProps = {
  props: {},
  bind: { value: '' },
  on: {},
  context: { record: {}, model: '', mode: 'view' as const },
};

afterEach(() => cleanup());

describe('CodeWidget', () => {
  it('renders a textarea', () => {
    const { container } = render(<CodeWidget {...defaultProps} />);
    expect(container.querySelector('textarea')).toBeInTheDocument();
  });

  it('has monospace font', () => {
    const { container } = render(<CodeWidget {...defaultProps} />);
    expect(container.querySelector('textarea')?.className).toContain('font-mono');
  });

  it('displays label from props', () => {
    render(<CodeWidget {...defaultProps} props={{ label: 'Expression' }} />);
    expect(screen.getByText('Expression')).toBeInTheDocument();
  });

  it('renders current value', () => {
    const { container } = render(
      <CodeWidget {...defaultProps} bind={{ value: 'return x + 1;' }} />,
    );
    expect(container.querySelector('textarea')?.value).toBe('return x + 1;');
  });

  it('fires on.change when typing', () => {
    const onChange = vi.fn();
    const { container } = render(<CodeWidget {...defaultProps} on={{ change: onChange }} />);
    fireEvent.change(container.querySelector('textarea')!, { target: { value: 'new code' } });
    expect(onChange).toHaveBeenCalledWith('new code');
  });

  it('sets rows from props', () => {
    const { container } = render(<CodeWidget {...defaultProps} props={{ rows: 10 }} />);
    expect(container.querySelector('textarea')?.rows).toBe(10);
  });

  it('handles disabled state', () => {
    const { container } = render(<CodeWidget {...defaultProps} props={{ disabled: true }} />);
    expect(container.querySelector('textarea')?.disabled).toBe(true);
  });

  it('handles null bind.value gracefully', () => {
    const { container } = render(<CodeWidget {...defaultProps} bind={{ value: null }} />);
    expect(container.querySelector('textarea')?.value).toBe('');
  });

  it('has spellCheck disabled', () => {
    const { container } = render(<CodeWidget {...defaultProps} />);
    expect(container.querySelector('textarea')?.getAttribute('spellcheck')).toBe('false');
  });
});
