import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { DynamicLinkWidget } from '../components/DynamicLinkWidget.js';

const defaultProps = {
  props: { models: ['sales.customer', 'sales.supplier'], modelField: 'ref_type' },
  bind: {
    value: null,
    meta: {
      type: 'dynamicLink',
      label: 'Reference',
      required: false,
      readOnly: false,
      options: [{ label: 'Acme Corp', value: 'rec-1' }],
    },
  },
  on: {},
  context: { record: { ref_type: 'sales.customer' }, model: 'sales.order', mode: 'view' as const },
};

afterEach(() => cleanup());

describe('DynamicLinkWidget', () => {
  it('renders model selector and record selector', () => {
    render(<DynamicLinkWidget {...defaultProps} />);
    expect(screen.getAllByRole('combobox').length).toBeGreaterThanOrEqual(1);
  });

  it('displays label', () => {
    render(<DynamicLinkWidget {...defaultProps} />);
    expect(screen.getByText('Reference')).toBeInTheDocument();
  });

  it('handles disabled state', () => {
    render(
      <DynamicLinkWidget {...defaultProps} props={{ ...defaultProps.props, disabled: true }} />,
    );
    const buttons = screen.getAllByRole('combobox');
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('handles null bind.value gracefully', () => {
    render(<DynamicLinkWidget {...defaultProps} />);
    expect(screen.getByText('Select record...')).toBeInTheDocument();
  });

  it('shows selected record label', () => {
    render(<DynamicLinkWidget {...defaultProps} bind={{ ...defaultProps.bind, value: 'rec-1' }} />);
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });
});
