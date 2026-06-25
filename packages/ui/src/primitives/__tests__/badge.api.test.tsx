import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import { Badge, badgeVariants } from '../badge';

describe('Badge API surface', () => {
  it('exports Badge and badgeVariants', () => {
    expect(Badge).toBeDefined();
    expect(badgeVariants).toBeDefined();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Badge ref={ref}>Test</Badge>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('accepts variant prop', () => {
    const variants = ['default', 'secondary', 'destructive', 'outline'] as const;
    for (const variant of variants) {
      const { container } = render(<Badge variant={variant}>Test</Badge>);
      expect(container.firstChild).toBeInTheDocument();
    }
  });

  it('renders as span element', () => {
    const { container } = render(<Badge>Test</Badge>);
    expect(container.querySelector('span')).toBeInTheDocument();
  });

  it('passes through HTML span attributes', () => {
    const { container } = render(<Badge data-testid="badge">Test</Badge>);
    expect(container.querySelector('[data-testid="badge"]')).toBeInTheDocument();
  });
});
