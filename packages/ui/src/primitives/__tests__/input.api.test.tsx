import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import { Input, inputVariants } from '../input';

describe('Input API surface', () => {
  it('exports Input component and inputVariants', () => {
    expect(Input).toBeDefined();
    expect(inputVariants).toBeDefined();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('accepts size prop', () => {
    const { container } = render(<Input size="sm" />);
    expect(container.firstChild).toBeTruthy();
  });
});
