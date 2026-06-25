import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import { Checkbox } from '../checkbox';

describe('Checkbox API surface', () => {
  it('exports Checkbox with sub-components', () => {
    expect(Checkbox).toBeDefined();
    expect(Checkbox.Indicator).toBeDefined();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLElement>();
    render(<Checkbox ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it('renders with checked prop', () => {
    const { container } = render(<Checkbox checked onCheckedChange={() => {}} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders with indeterminate prop', () => {
    const { container } = render(<Checkbox indeterminate />);
    expect(container.firstChild).toBeTruthy();
  });
});
