import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import { Separator } from '../separator';

describe('Separator API surface', () => {
  it('exports Separator component', () => {
    expect(Separator).toBeDefined();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Separator ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('accepts orientation prop', () => {
    const { container } = render(<Separator orientation="vertical" />);
    expect(container.firstChild).toBeTruthy();
  });
});
