import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TreeWidget } from '../components/TreeWidget.js';

const defaultProps = {
  props: {},
  bind: {
    value: null,
    meta: {
      type: 'tree',
      label: 'Parent',
      required: false,
      readOnly: false,
      options: [
        { label: 'Root', value: 'cat-1', path: 'Root' },
        { label: 'Electronics', value: 'cat-2', path: 'Root / Electronics' },
        { label: 'Phones', value: 'cat-3', path: 'Root / Electronics / Phones' },
      ],
    },
  },
  on: {},
  context: { record: {}, model: '', mode: 'view' as const },
};

afterEach(() => cleanup());

describe('TreeWidget', () => {
  it('renders a combobox button', () => {
    render(<TreeWidget {...defaultProps} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('displays label', () => {
    render(<TreeWidget {...defaultProps} />);
    expect(screen.getByText('Parent')).toBeInTheDocument();
  });

  it('shows placeholder when no value', () => {
    render(<TreeWidget {...defaultProps} />);
    expect(screen.getByText('Select parent...')).toBeInTheDocument();
  });

  it('shows selected option path', () => {
    render(<TreeWidget {...defaultProps} bind={{ ...defaultProps.bind, value: 'cat-3' }} />);
    expect(screen.getByText('Root / Electronics / Phones')).toBeInTheDocument();
  });

  it('handles disabled state', () => {
    render(<TreeWidget {...defaultProps} props={{ disabled: true }} />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it.skip('fires on.change when selecting', async () => {
    const onChange = vi.fn();
    render(<TreeWidget {...defaultProps} on={{ change: onChange }} />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByText('Root / Electronics'));
    expect(onChange).toHaveBeenCalledWith('cat-2');
  });

  it.skip('fires on.search when typing', async () => {
    const onSearch = vi.fn();
    render(<TreeWidget {...defaultProps} on={{ search: onSearch }} />);
    await userEvent.click(screen.getByRole('combobox'));
    fireEvent.change(screen.getByPlaceholderText('Search...'), { target: { value: 'phone' } });
    expect(onSearch).toHaveBeenCalledWith('phone');
  });

  it('handles null bind.value gracefully', () => {
    render(<TreeWidget {...defaultProps} />);
    expect(screen.getByText('Select parent...')).toBeInTheDocument();
  });

  it.skip('shows clear option when value selected', async () => {
    render(<TreeWidget {...defaultProps} bind={{ ...defaultProps.bind, value: 'cat-1' }} />);
    await userEvent.click(screen.getByRole('combobox'));
    expect(screen.getByText('Clear selection')).toBeInTheDocument();
  });

  it.skip('clears value when clear option clicked', async () => {
    const onChange = vi.fn();
    const setValue = vi.fn();
    render(
      <TreeWidget
        {...defaultProps}
        bind={{ ...defaultProps.bind, value: 'cat-1', setValue }}
        on={{ change: onChange }}
      />,
    );
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByText('Clear selection'));
    expect(setValue).toHaveBeenCalledWith(null);
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
