import { describe, it, expect } from 'vitest';
import { MoneyInput, moneyInputVariants } from '../money-input';
import { render } from '@testing-library/react';
import { createRef } from 'react';

describe('MoneyInput API surface', () => {
  it('exports MoneyInput component and variants', () => {
    expect(MoneyInput).toBeDefined();
    expect(moneyInputVariants).toBeDefined();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLInputElement>();
    render(<MoneyInput ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('accepts value and onChange props', () => {
    const { container } = render(<MoneyInput value={99.99} onChange={() => {}} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('accepts currency prop', () => {
    const { container } = render(<MoneyInput currency="€" />);
    expect(container.textContent).toContain('€');
  });

  it('accepts size prop', () => {
    const { container } = render(<MoneyInput size="sm" />);
    expect(container.firstChild).toBeTruthy();
  });
});
