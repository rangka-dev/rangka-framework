import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ManyToManyWidget } from '../components/ManyToManyWidget.js';

const defaultProps = {
  props: {},
  bind: {
    value: [],
    meta: {
      type: 'manyToMany',
      label: 'Tags',
      required: false,
      readOnly: false,
      options: [
        { label: 'VIP', value: 'tag-1' },
        { label: 'Active', value: 'tag-2' },
        { label: 'New', value: 'tag-3' },
      ],
    },
  },
  on: {},
  context: { record: {}, model: '', mode: 'view' as const },
};

afterEach(() => cleanup());

describe('ManyToManyWidget', () => {
  it('renders a combobox button', () => {
    render(<ManyToManyWidget {...defaultProps} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('displays label', () => {
    render(<ManyToManyWidget {...defaultProps} />);
    expect(screen.getByText('Tags')).toBeInTheDocument();
  });

  it('shows placeholder when empty', () => {
    render(<ManyToManyWidget {...defaultProps} />);
    expect(screen.getByText('Select...')).toBeInTheDocument();
  });

  it('shows badges for selected values', () => {
    render(
      <ManyToManyWidget
        {...defaultProps}
        bind={{ ...defaultProps.bind, value: ['tag-1', 'tag-2'] }}
      />,
    );
    expect(screen.getByText('VIP')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('handles disabled state', () => {
    render(<ManyToManyWidget {...defaultProps} props={{ disabled: true }} />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it.skip('fires on.change when toggling selection', async () => {
    const onChange = vi.fn();
    render(<ManyToManyWidget {...defaultProps} on={{ change: onChange }} />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByText('VIP'));
    expect(onChange).toHaveBeenCalledWith(['tag-1']);
  });

  it('removes item via badge button', () => {
    const setValue = vi.fn();
    render(
      <ManyToManyWidget
        {...defaultProps}
        bind={{ ...defaultProps.bind, value: ['tag-1', 'tag-2'], setValue }}
      />,
    );
    fireEvent.click(screen.getByLabelText('Remove VIP'));
    expect(setValue).toHaveBeenCalledWith(['tag-2']);
  });

  it('handles null bind.value gracefully', () => {
    render(<ManyToManyWidget {...defaultProps} bind={{ ...defaultProps.bind, value: null }} />);
    expect(screen.getByText('Select...')).toBeInTheDocument();
  });

  it.skip('fires on.search when typing', async () => {
    const onSearch = vi.fn();
    render(<ManyToManyWidget {...defaultProps} on={{ search: onSearch }} />);
    await userEvent.click(screen.getByRole('combobox'));
    fireEvent.change(screen.getByPlaceholderText('Search...'), { target: { value: 'vi' } });
    expect(onSearch).toHaveBeenCalledWith('vi');
  });
});
