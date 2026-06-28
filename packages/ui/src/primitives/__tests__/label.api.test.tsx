import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import { Label, labelVariants } from '../label';

describe('Label API surface', () => {
  it('exports Label and labelVariants', () => {
    expect(Label).toBeDefined();
    expect(labelVariants).toBeDefined();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLLabelElement>();
    render(<Label ref={ref}>Name</Label>);
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });

  it('renders as label element', () => {
    const { container } = render(<Label>Name</Label>);
    expect(container.querySelector('label')).toBeInTheDocument();
  });

  it('shows asterisk when required', () => {
    const { container } = render(<Label required>Name</Label>);
    expect(container.textContent).toContain('*');
  });

  it('does not show asterisk when not required', () => {
    const { container } = render(<Label>Name</Label>);
    expect(container.textContent).not.toContain('*');
  });

  it('passes through HTML label attributes', () => {
    const { container } = render(<Label htmlFor="email">Email</Label>);
    const label = container.querySelector('label');
    expect(label).toHaveAttribute('for', 'email');
  });
});
