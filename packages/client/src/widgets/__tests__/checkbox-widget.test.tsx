import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CheckboxWidget } from '../components/CheckboxWidget.js';

describe('CheckboxWidget', () => {
  it('renders label text from props', () => {
    render(
      <CheckboxWidget
        props={{ label: 'Accept terms' }}
        bind={{ value: false }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      />,
    );

    expect(screen.getByText('Accept terms')).toBeInTheDocument();
  });

  it('renders label from bind.meta.label as fallback', () => {
    render(
      <CheckboxWidget
        props={{}}
        bind={{
          value: false,
          meta: { type: 'boolean', label: 'Meta Label', required: false, readOnly: false },
        }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      />,
    );

    expect(screen.getByText('Meta Label')).toBeInTheDocument();
  });

  it('does not render label when label is empty', () => {
    const { container } = render(
      <CheckboxWidget
        props={{ label: '' }}
        bind={{ value: false }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      />,
    );

    expect(container.querySelector('span')).toBeNull();
  });

  it('renders checked state when bind.value is true', () => {
    render(
      <CheckboxWidget
        props={{}}
        bind={{ value: true }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      />,
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-checked', 'true');
  });

  it('renders unchecked state when bind.value is false', () => {
    render(
      <CheckboxWidget
        props={{}}
        bind={{ value: false }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      />,
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
  });

  it('defaults to unchecked when bind.value is undefined', () => {
    render(
      <CheckboxWidget
        props={{}}
        bind={{ value: undefined }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      />,
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
  });

  it('disables checkbox when props.disabled is true', () => {
    render(
      <CheckboxWidget
        props={{ disabled: true }}
        bind={{ value: false }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      />,
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
    expect(checkbox).toHaveAttribute('data-disabled', '');
  });

  it('disables checkbox from bind.meta.readOnly as fallback', () => {
    render(
      <CheckboxWidget
        props={{}}
        bind={{
          value: false,
          meta: { type: 'boolean', label: 'Read Only', required: false, readOnly: true },
        }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      />,
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
    expect(checkbox).toHaveAttribute('data-disabled', '');
  });

  it('calls bind.setValue and on.change when clicked', () => {
    const setValue = vi.fn();
    const onChange = vi.fn();

    render(
      <CheckboxWidget
        props={{}}
        bind={{ value: false, setValue }}
        on={{ change: onChange }}
        context={{ record: {}, model: '', mode: 'edit' }}
      />,
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(setValue).toHaveBeenCalledWith(true);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('has correct widgetMeta', () => {
    expect(CheckboxWidget.widgetMeta).toEqual({
      name: 'checkbox',
      label: 'Checkbox',
      category: 'input',
      schema: {
        label: { type: 'string' },
        disabled: { type: 'boolean', default: false },
      },
      binding: 'field',
      triggers: ['change'],
      container: false,
    });
  });
});
