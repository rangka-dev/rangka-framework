import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TextareaWidget } from '../components/TextareaWidget.js';

const defaultProps = {
  props: {},
  bind: { value: '' },
  on: {},
  context: { record: {}, model: '', mode: 'view' as const },
};

afterEach(() => cleanup());

describe('TextareaWidget', () => {
  it('renders textarea element', () => {
    const { container } = render(<TextareaWidget {...defaultProps} />);
    expect(container.querySelector('textarea')).toBeInTheDocument();
  });

  it('displays label from props', () => {
    render(<TextareaWidget {...defaultProps} props={{ label: 'Notes' }} />);
    expect(screen.getByText('Notes')).toBeInTheDocument();
  });

  it('falls back to bind.meta.label', () => {
    render(
      <TextareaWidget
        {...defaultProps}
        bind={{
          value: '',
          meta: { type: 'text', label: 'Description', required: false, readOnly: false },
        }}
      />,
    );
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('renders current value', () => {
    const { container } = render(
      <TextareaWidget {...defaultProps} bind={{ value: 'Hello world' }} />,
    );
    expect(container.querySelector('textarea')?.value).toBe('Hello world');
  });

  it('fires on.change when typing', () => {
    const onChange = vi.fn();
    const { container } = render(<TextareaWidget {...defaultProps} on={{ change: onChange }} />);
    fireEvent.change(container.querySelector('textarea')!, { target: { value: 'new text' } });
    expect(onChange).toHaveBeenCalledWith('new text');
  });

  it('fires on.focus and on.blur', () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const { container } = render(
      <TextareaWidget {...defaultProps} on={{ focus: onFocus, blur: onBlur }} />,
    );
    fireEvent.focus(container.querySelector('textarea')!);
    expect(onFocus).toHaveBeenCalled();
    fireEvent.blur(container.querySelector('textarea')!);
    expect(onBlur).toHaveBeenCalled();
  });

  it('sets placeholder', () => {
    const { container } = render(
      <TextareaWidget {...defaultProps} props={{ placeholder: 'Enter notes...' }} />,
    );
    expect(container.querySelector('textarea')?.placeholder).toBe('Enter notes...');
  });

  it('sets rows from props', () => {
    const { container } = render(<TextareaWidget {...defaultProps} props={{ rows: 8 }} />);
    expect(container.querySelector('textarea')?.rows).toBe(8);
  });

  it('handles disabled state', () => {
    const { container } = render(<TextareaWidget {...defaultProps} props={{ disabled: true }} />);
    expect(container.querySelector('textarea')?.disabled).toBe(true);
  });

  it('handles readOnly from bind.meta', () => {
    const { container } = render(
      <TextareaWidget
        {...defaultProps}
        bind={{ value: '', meta: { type: 'text', label: 'X', required: false, readOnly: true } }}
      />,
    );
    expect(container.querySelector('textarea')?.readOnly).toBe(true);
  });

  it('handles null bind.value gracefully', () => {
    const { container } = render(<TextareaWidget {...defaultProps} bind={{ value: null }} />);
    expect(container.querySelector('textarea')?.value).toBe('');
  });

  it('calls bind.setValue on change', () => {
    const setValue = vi.fn();
    const { container } = render(
      <TextareaWidget {...defaultProps} bind={{ value: '', setValue }} />,
    );
    fireEvent.change(container.querySelector('textarea')!, { target: { value: 'updated' } });
    expect(setValue).toHaveBeenCalledWith('updated');
  });
});
