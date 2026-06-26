import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import { Spacer, spacerVariants } from '../spacer';

describe('Spacer API surface', () => {
  it('exports Spacer component and spacerVariants', () => {
    expect(Spacer).toBeDefined();
    expect(spacerVariants).toBeDefined();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Spacer ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('accepts size prop', () => {
    const { container } = render(<Spacer size="xl" />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders with aria-hidden', () => {
    const { container } = render(<Spacer />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });
});
