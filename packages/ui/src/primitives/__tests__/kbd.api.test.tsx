import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import { Kbd, kbdVariants } from '../kbd';

describe('Kbd API surface', () => {
  it('exports Kbd and kbdVariants', () => {
    expect(Kbd).toBeDefined();
    expect(kbdVariants).toBeDefined();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLElement>();
    render(<Kbd ref={ref}>Ctrl</Kbd>);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it('renders as kbd element', () => {
    const { container } = render(<Kbd>Ctrl</Kbd>);
    expect(container.querySelector('kbd')).toBeInTheDocument();
  });

  it('passes through HTML attributes', () => {
    const { container } = render(<Kbd data-testid="kbd">K</Kbd>);
    expect(container.querySelector('[data-testid="kbd"]')).toBeInTheDocument();
  });
});
