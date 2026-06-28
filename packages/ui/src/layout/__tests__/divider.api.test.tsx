import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import { Divider, dividerVariants } from '../divider';

describe('Divider API surface', () => {
  it('exports Divider component and dividerVariants', () => {
    expect(Divider).toBeDefined();
    expect(dividerVariants).toBeDefined();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Divider ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('accepts orientation and margin props', () => {
    const { container } = render(<Divider orientation="vertical" margin="lg" />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders with separator role', () => {
    const { container } = render(<Divider />);
    expect(container.querySelector('[role="separator"]')).toBeTruthy();
  });
});
