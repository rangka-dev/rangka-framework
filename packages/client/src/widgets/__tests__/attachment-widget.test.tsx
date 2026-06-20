import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AttachmentWidget } from '../components/AttachmentWidget.js';

const defaultProps = {
  props: {},
  bind: { value: null },
  on: {},
  context: { record: {}, model: '', mode: 'view' as const },
};

afterEach(() => cleanup());

describe('AttachmentWidget', () => {
  it('renders upload zone when no file', () => {
    render(<AttachmentWidget {...defaultProps} />);
    expect(screen.getByText('Drop a file here or click to browse')).toBeInTheDocument();
  });

  it('displays label from props', () => {
    render(<AttachmentWidget {...defaultProps} props={{ label: 'Logo' }} />);
    expect(screen.getByText('Logo')).toBeInTheDocument();
  });

  it('shows file name when value is set', () => {
    render(
      <AttachmentWidget {...defaultProps} bind={{ value: { name: 'report.pdf', size: 2048 } }} />,
    );
    expect(screen.getByText('report.pdf')).toBeInTheDocument();
  });

  it('shows file size', () => {
    render(
      <AttachmentWidget {...defaultProps} bind={{ value: { name: 'report.pdf', size: 2048 } }} />,
    );
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();
  });

  it('shows remove button when file exists', () => {
    render(
      <AttachmentWidget {...defaultProps} bind={{ value: { name: 'report.pdf', size: 1024 } }} />,
    );
    expect(screen.getByLabelText('Remove file')).toBeInTheDocument();
  });

  it('fires on.remove when removing file', () => {
    const onRemove = vi.fn();
    const setValue = vi.fn();
    render(
      <AttachmentWidget
        {...defaultProps}
        bind={{ value: { name: 'x.pdf', size: 100 }, setValue }}
        on={{ remove: onRemove }}
      />,
    );
    fireEvent.click(screen.getByLabelText('Remove file'));
    expect(onRemove).toHaveBeenCalled();
    expect(setValue).toHaveBeenCalledWith(null);
  });

  it('handles disabled state - no upload zone click', () => {
    render(<AttachmentWidget {...defaultProps} props={{ disabled: true }} />);
    const zone = screen.getByRole('button', { name: 'Upload file' });
    expect(zone.className).toContain('cursor-not-allowed');
  });

  it('handles null bind.value gracefully', () => {
    render(<AttachmentWidget {...defaultProps} bind={{ value: null }} />);
    expect(screen.getByText('Drop a file here or click to browse')).toBeInTheDocument();
  });

  it('falls back to bind.meta.label', () => {
    render(
      <AttachmentWidget
        {...defaultProps}
        bind={{
          value: null,
          meta: { type: 'attachment', label: 'Document', required: false, readOnly: false },
        }}
      />,
    );
    expect(screen.getByText('Document')).toBeInTheDocument();
  });
});
