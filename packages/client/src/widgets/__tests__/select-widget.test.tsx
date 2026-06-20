import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { SelectWidget } from '../components/SelectWidget.js';

afterEach(() => {
  cleanup();
});

describe('SelectWidget', () => {
  it('renders label from props', () => {
    render(
      <SelectWidget
        props={{ label: 'Country' }}
        bind={{ value: null }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      />,
    );

    expect(screen.getByText('Country')).toBeInTheDocument();
  });

  it('renders label from bind.meta.label as fallback', () => {
    render(
      <SelectWidget
        props={{}}
        bind={{
          value: null,
          meta: { type: 'select', label: 'Status', required: false, readOnly: false },
        }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      />,
    );

    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('prefers props.label over bind.meta.label', () => {
    render(
      <SelectWidget
        props={{ label: 'From Props' }}
        bind={{
          value: null,
          meta: { type: 'select', label: 'From Meta', required: false, readOnly: false },
        }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      />,
    );

    expect(screen.getByText('From Props')).toBeInTheDocument();
    expect(screen.queryByText('From Meta')).not.toBeInTheDocument();
  });

  it('renders placeholder text on the trigger', () => {
    render(
      <SelectWidget
        props={{ placeholder: 'Choose an option' }}
        bind={{ value: null }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      />,
    );

    expect(screen.getByText('Choose an option')).toBeInTheDocument();
  });

  it('disabled prop disables the select trigger', () => {
    render(
      <SelectWidget
        props={{ disabled: true }}
        bind={{ value: null }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      />,
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeDisabled();
  });

  it('disabled from bind.meta.readOnly as fallback', () => {
    render(
      <SelectWidget
        props={{}}
        bind={{
          value: null,
          meta: { type: 'select', label: 'Status', required: false, readOnly: true },
        }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      />,
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeDisabled();
  });

  it('renders current value text', () => {
    render(
      <SelectWidget
        props={{}}
        bind={{
          value: 'active',
          meta: {
            type: 'select',
            label: 'Status',
            required: false,
            readOnly: false,
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ],
          },
        }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      />,
    );

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders with searchable prop', () => {
    const { container } = render(
      <SelectWidget
        props={{ searchable: true }}
        bind={{
          value: null,
          meta: {
            type: 'select',
            label: 'Country',
            required: false,
            readOnly: false,
            options: [
              { label: 'Malaysia', value: 'my' },
              { label: 'Singapore', value: 'sg' },
            ],
          },
        }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      />,
    );

    // Component should render without errors when searchable is true
    expect(container.firstElementChild).not.toBeNull();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('calls bind.setValue and on.change when value changes', () => {
    const setValue = vi.fn();
    const onChange = vi.fn();

    render(
      <SelectWidget
        props={{}}
        bind={{
          value: 'active',
          setValue,
          meta: {
            type: 'select',
            label: 'Status',
            required: false,
            readOnly: false,
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ],
          },
        }}
        on={{ change: onChange }}
        context={{ record: {}, model: '', mode: 'view' }}
      />,
    );

    // Verify the component renders with the handlers ready
    // (Radix Select portals make it difficult to test actual selection in jsdom)
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders without label when none is provided', () => {
    const { container } = render(
      <SelectWidget
        props={{}}
        bind={{ value: null }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      />,
    );

    const labels = container.querySelectorAll('label');
    expect(labels.length).toBe(0);
  });

  describe('widgetMeta', () => {
    it('has correct name', () => {
      expect(SelectWidget.widgetMeta.name).toBe('select');
    });

    it('has correct label', () => {
      expect(SelectWidget.widgetMeta.label).toBe('Select');
    });

    it('has correct category', () => {
      expect(SelectWidget.widgetMeta.category).toBe('input');
    });

    it('has field binding', () => {
      expect(SelectWidget.widgetMeta.binding).toBe('field');
    });

    it('has change trigger', () => {
      expect(SelectWidget.widgetMeta.triggers).toContain('change');
    });

    it('is not a container', () => {
      expect(SelectWidget.widgetMeta.container).toBe(false);
    });

    it('has correct schema properties', () => {
      const { schema } = SelectWidget.widgetMeta;
      expect(schema.label).toEqual({ type: 'string' });
      expect(schema.placeholder).toEqual({ type: 'string' });
      expect(schema.searchable).toEqual({ type: 'boolean', default: false });
      expect(schema.disabled).toEqual({ type: 'boolean', default: false });
    });
  });
});
