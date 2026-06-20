import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { SequenceWidget } from '../components/SequenceWidget.js';

const defaultProps = {
  props: {},
  bind: { value: null },
  on: {},
  context: { record: {}, model: '', mode: 'view' as const },
};

afterEach(() => cleanup());

describe('SequenceWidget', () => {
  it('renders Auto when no value', () => {
    render(<SequenceWidget {...defaultProps} />);
    expect(screen.getByText('Auto')).toBeInTheDocument();
  });

  it('renders the sequence value', () => {
    render(<SequenceWidget {...defaultProps} bind={{ value: 'INV-00042' }} />);
    expect(screen.getByText('INV-00042')).toBeInTheDocument();
  });

  it('displays label from props', () => {
    render(<SequenceWidget {...defaultProps} props={{ label: 'Invoice No.' }} />);
    expect(screen.getByText('Invoice No.')).toBeInTheDocument();
  });

  it('falls back to bind.meta.label', () => {
    render(
      <SequenceWidget
        {...defaultProps}
        bind={{
          value: 'X-1',
          meta: { type: 'sequence', label: 'Voucher', required: false, readOnly: true },
        }}
      />,
    );
    expect(screen.getByText('Voucher')).toBeInTheDocument();
  });

  it('renders as badge', () => {
    const { container } = render(<SequenceWidget {...defaultProps} bind={{ value: 'SEQ-1' }} />);
    expect(container.querySelector('[data-slot="badge"]')).toBeInTheDocument();
  });

  it('handles null value gracefully', () => {
    render(<SequenceWidget {...defaultProps} bind={{ value: null }} />);
    expect(screen.getByText('Auto')).toBeInTheDocument();
  });

  it('handles empty string value', () => {
    render(<SequenceWidget {...defaultProps} bind={{ value: '' }} />);
    expect(screen.getByText('Auto')).toBeInTheDocument();
  });
});
