import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { InputWidget } from '../components/InputWidget.js';

describe('InputWidget', () => {
  const defaultProps = {
    props: {},
    bind: { value: undefined },
    on: {},
    context: { record: {}, model: '', mode: 'view' as const },
  };

  describe('label rendering', () => {
    it('renders label from props', () => {
      render(<InputWidget {...defaultProps} props={{ label: 'Email Address' }} />);
      expect(screen.getByText('Email Address')).toBeDefined();
    });

    it('renders label from bind.meta.label as fallback', () => {
      render(
        <InputWidget
          {...defaultProps}
          bind={{
            value: '',
            meta: { type: 'string', label: 'Username', required: false, readOnly: false },
          }}
        />,
      );
      expect(screen.getByText('Username')).toBeDefined();
    });

    it('prefers props.label over bind.meta.label', () => {
      render(
        <InputWidget
          {...defaultProps}
          props={{ label: 'Override Label' }}
          bind={{
            value: '',
            meta: { type: 'string', label: 'Meta Label', required: false, readOnly: false },
          }}
        />,
      );
      expect(screen.getByText('Override Label')).toBeDefined();
      expect(screen.queryByText('Meta Label')).toBeNull();
    });

    it('does not render label element when no label provided', () => {
      const { container } = render(<InputWidget {...defaultProps} />);
      expect(container.querySelector('label')).toBeNull();
    });
  });

  describe('input type mapping', () => {
    it('maps int field type to number input', () => {
      const { container } = render(
        <InputWidget
          {...defaultProps}
          bind={{
            value: '',
            meta: { type: 'int', label: 'Qty', required: false, readOnly: false },
          }}
        />,
      );
      expect(container.querySelector('input')?.type).toBe('number');
    });

    it('maps decimal field type to number input', () => {
      const { container } = render(
        <InputWidget
          {...defaultProps}
          bind={{
            value: '',
            meta: { type: 'decimal', label: 'Price', required: false, readOnly: false },
          }}
        />,
      );
      expect(container.querySelector('input')?.type).toBe('number');
    });

    it('maps money field type to number input', () => {
      const { container } = render(
        <InputWidget
          {...defaultProps}
          bind={{
            value: '',
            meta: { type: 'money', label: 'Amount', required: false, readOnly: false },
          }}
        />,
      );
      expect(container.querySelector('input')?.type).toBe('number');
    });

    it('maps date field type to date input', () => {
      const { container } = render(
        <InputWidget
          {...defaultProps}
          bind={{
            value: '',
            meta: { type: 'date', label: 'Date', required: false, readOnly: false },
          }}
        />,
      );
      expect(container.querySelector('input')?.type).toBe('date');
    });

    it('defaults to text input for string field type', () => {
      const { container } = render(
        <InputWidget
          {...defaultProps}
          bind={{
            value: '',
            meta: { type: 'string', label: 'Name', required: false, readOnly: false },
          }}
        />,
      );
      expect(container.querySelector('input')?.type).toBe('text');
    });

    it('defaults to text input when no meta type provided', () => {
      const { container } = render(<InputWidget {...defaultProps} bind={{ value: '' }} />);
      expect(container.querySelector('input')?.type).toBe('text');
    });
  });

  describe('props passthrough', () => {
    it('sets placeholder from props', () => {
      const { container } = render(
        <InputWidget {...defaultProps} props={{ placeholder: 'Enter value...' }} />,
      );
      expect(container.querySelector('input')?.placeholder).toBe('Enter value...');
    });

    it('sets readOnly from props', () => {
      const { container } = render(<InputWidget {...defaultProps} props={{ readOnly: true }} />);
      expect(container.querySelector('input')?.readOnly).toBe(true);
    });

    it('sets readOnly from bind.meta as fallback', () => {
      const { container } = render(
        <InputWidget
          {...defaultProps}
          bind={{
            value: '',
            meta: { type: 'string', label: 'Field', required: false, readOnly: true },
          }}
        />,
      );
      expect(container.querySelector('input')?.readOnly).toBe(true);
    });

    it('sets disabled from props', () => {
      const { container } = render(<InputWidget {...defaultProps} props={{ disabled: true }} />);
      expect(container.querySelector('input')?.disabled).toBe(true);
    });

    it('passes min, max, step, and pattern as HTML attributes', () => {
      const { container } = render(
        <InputWidget
          {...defaultProps}
          props={{ min: 0, max: 100, step: 5, pattern: '[0-9]+' }}
          bind={{
            value: '',
            meta: { type: 'int', label: 'Score', required: false, readOnly: false },
          }}
        />,
      );
      const input = container.querySelector('input')!;
      expect(input.min).toBe('0');
      expect(input.max).toBe('100');
      expect(input.step).toBe('5');
      expect(input.pattern).toBe('[0-9]+');
    });
  });

  describe('value binding', () => {
    it('displays bind.value in the input', () => {
      const { container } = render(
        <InputWidget {...defaultProps} bind={{ value: 'Hello World' }} />,
      );
      expect(container.querySelector('input')?.value).toBe('Hello World');
    });

    it('displays empty string when bind.value is null', () => {
      const { container } = render(<InputWidget {...defaultProps} bind={{ value: null }} />);
      expect(container.querySelector('input')?.value).toBe('');
    });

    it('displays empty string when bind.value is undefined', () => {
      const { container } = render(<InputWidget {...defaultProps} bind={{ value: undefined }} />);
      expect(container.querySelector('input')?.value).toBe('');
    });
  });

  describe('event triggers', () => {
    it('calls bind.setValue and on.change on input change', () => {
      const setValue = vi.fn();
      const onChange = vi.fn();

      const { container } = render(
        <InputWidget {...defaultProps} bind={{ value: '', setValue }} on={{ change: onChange }} />,
      );

      fireEvent.change(container.querySelector('input')!, { target: { value: 'new value' } });

      expect(setValue).toHaveBeenCalledWith('new value');
      expect(onChange).toHaveBeenCalledWith('new value');
    });

    it('calls on.focus on input focus', () => {
      const onFocus = vi.fn();

      const { container } = render(<InputWidget {...defaultProps} on={{ focus: onFocus }} />);

      fireEvent.focus(container.querySelector('input')!);

      expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('calls on.blur on input blur', () => {
      const onBlur = vi.fn();

      const { container } = render(<InputWidget {...defaultProps} on={{ blur: onBlur }} />);

      fireEvent.blur(container.querySelector('input')!);

      expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('does not throw when on.change is not provided', () => {
      const setValue = vi.fn();
      const { container } = render(
        <InputWidget {...defaultProps} bind={{ value: '', setValue }} on={{}} />,
      );

      expect(() => {
        fireEvent.change(container.querySelector('input')!, { target: { value: 'x' } });
      }).not.toThrow();
      expect(setValue).toHaveBeenCalledWith('x');
    });

    it('does not throw when bind.setValue is not provided', () => {
      const onChange = vi.fn();
      const { container } = render(
        <InputWidget {...defaultProps} bind={{ value: '' }} on={{ change: onChange }} />,
      );

      expect(() => {
        fireEvent.change(container.querySelector('input')!, { target: { value: 'x' } });
      }).not.toThrow();
      expect(onChange).toHaveBeenCalledWith('x');
    });
  });

  describe('widgetMeta', () => {
    it('has correct metadata', () => {
      expect(InputWidget.widgetMeta.name).toBe('input');
      expect(InputWidget.widgetMeta.category).toBe('input');
      expect(InputWidget.widgetMeta.binding).toBe('field');
      expect(InputWidget.widgetMeta.container).toBe(false);
      expect(InputWidget.widgetMeta.triggers).toEqual(['change', 'focus', 'blur']);
    });
  });
});
