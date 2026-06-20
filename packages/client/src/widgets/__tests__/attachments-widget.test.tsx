import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AttachmentsWidget } from '../components/AttachmentsWidget.js';

const defaultProps = {
  props: {},
  bind: { value: [] },
  on: {},
  context: { record: {}, model: '', mode: 'view' as const },
};

afterEach(() => cleanup());

describe('AttachmentsWidget', () => {
  it('renders upload zone when no files', () => {
    render(<AttachmentsWidget {...defaultProps} />);
    expect(screen.getByText(/Drop files here/)).toBeInTheDocument();
  });

  it('displays label from props', () => {
    render(<AttachmentsWidget {...defaultProps} props={{ label: 'Documents' }} />);
    expect(screen.getByText('Documents')).toBeInTheDocument();
  });

  it('shows file list when files exist', () => {
    render(
      <AttachmentsWidget
        {...defaultProps}
        bind={{
          value: [
            { name: 'a.pdf', size: 1024 },
            { name: 'b.pdf', size: 2048 },
          ],
        }}
      />,
    );
    expect(screen.getByText('a.pdf')).toBeInTheDocument();
    expect(screen.getByText('b.pdf')).toBeInTheDocument();
  });

  it('shows file sizes', () => {
    render(
      <AttachmentsWidget {...defaultProps} bind={{ value: [{ name: 'a.pdf', size: 2048 }] }} />,
    );
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();
  });

  it('shows remove button per file', () => {
    render(
      <AttachmentsWidget {...defaultProps} bind={{ value: [{ name: 'a.pdf', size: 100 }] }} />,
    );
    expect(screen.getByLabelText('Remove a.pdf')).toBeInTheDocument();
  });

  it('fires on.remove with index when removing', () => {
    const onRemove = vi.fn();
    const setValue = vi.fn();
    render(
      <AttachmentsWidget
        {...defaultProps}
        bind={{
          value: [
            { name: 'a.pdf', size: 100 },
            { name: 'b.pdf', size: 200 },
          ],
          setValue,
        }}
        on={{ remove: onRemove }}
      />,
    );
    fireEvent.click(screen.getByLabelText('Remove b.pdf'));
    expect(onRemove).toHaveBeenCalledWith(1);
    expect(setValue).toHaveBeenCalledWith([{ name: 'a.pdf', size: 100 }]);
  });

  it('shows count in upload zone', () => {
    render(
      <AttachmentsWidget
        {...defaultProps}
        props={{ maxCount: 5 }}
        bind={{ value: [{ name: 'a.pdf', size: 100 }] }}
      />,
    );
    expect(screen.getByText(/1\/5/)).toBeInTheDocument();
  });

  it('hides upload zone when max reached', () => {
    render(
      <AttachmentsWidget
        {...defaultProps}
        props={{ maxCount: 1 }}
        bind={{ value: [{ name: 'a.pdf', size: 100 }] }}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Upload files' })).not.toBeInTheDocument();
  });

  it('handles disabled state', () => {
    render(<AttachmentsWidget {...defaultProps} props={{ disabled: true }} />);
    const zone = screen.getByRole('button', { name: 'Upload files' });
    expect(zone.className).toContain('cursor-not-allowed');
  });

  it('handles null bind.value gracefully', () => {
    render(<AttachmentsWidget {...defaultProps} bind={{ value: null }} />);
    expect(screen.getByText(/Drop files here/)).toBeInTheDocument();
  });
});
