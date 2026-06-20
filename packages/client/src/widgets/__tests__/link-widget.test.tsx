import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LinkWidget } from '../components/LinkWidget.js';

const defaultProps = {
  props: {},
  bind: {
    value: null,
    meta: {
      type: 'link',
      label: 'Customer',
      required: false,
      readOnly: false,
      options: [
        { label: 'Acme Corp', value: 'cust-1' },
        { label: 'Globex', value: 'cust-2' },
      ],
    },
  },
  on: {},
  context: { record: {}, model: '', mode: 'view' as const },
};

afterEach(() => cleanup());

describe('LinkWidget', () => {
  it('renders a combobox button', () => {
    render(<LinkWidget {...defaultProps} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('displays label from props', () => {
    render(<LinkWidget {...defaultProps} props={{ label: 'Supplier' }} />);
    expect(screen.getByText('Supplier')).toBeInTheDocument();
  });

  it('falls back to bind.meta.label', () => {
    render(<LinkWidget {...defaultProps} />);
    expect(screen.getByText('Customer')).toBeInTheDocument();
  });

  it('shows placeholder when no value', () => {
    render(<LinkWidget {...defaultProps} />);
    expect(screen.getByText('Select...')).toBeInTheDocument();
  });

  it('shows selected option label', () => {
    render(<LinkWidget {...defaultProps} bind={{ ...defaultProps.bind, value: 'cust-1' }} />);
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('handles disabled state', () => {
    render(<LinkWidget {...defaultProps} props={{ disabled: true }} />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it.skip('opens dropdown on click', async () => {
    render(<LinkWidget {...defaultProps} />);
    await userEvent.click(screen.getByRole('combobox'));
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it.skip('shows options in dropdown', async () => {
    render(<LinkWidget {...defaultProps} />);
    await userEvent.click(screen.getByRole('combobox'));
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Globex')).toBeInTheDocument();
  });

  it.skip('fires on.change when selecting', async () => {
    const onChange = vi.fn();
    render(<LinkWidget {...defaultProps} on={{ change: onChange }} />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByText('Globex'));
    expect(onChange).toHaveBeenCalledWith('cust-2');
  });

  it.skip('fires on.search when typing', async () => {
    const onSearch = vi.fn();
    render(<LinkWidget {...defaultProps} on={{ search: onSearch }} />);
    await userEvent.click(screen.getByRole('combobox'));
    fireEvent.change(screen.getByPlaceholderText('Search...'), { target: { value: 'acm' } });
    expect(onSearch).toHaveBeenCalledWith('acm');
  });

  it('handles null bind.value gracefully', () => {
    render(<LinkWidget {...defaultProps} bind={{ ...defaultProps.bind, value: null }} />);
    expect(screen.getByText('Select...')).toBeInTheDocument();
  });
});
