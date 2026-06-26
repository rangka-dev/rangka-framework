import { describe, it, expect } from 'vitest';
import { Spinner, spinnerVariants } from '../spinner';

describe('Spinner API surface', () => {
  it('exports Spinner component and spinnerVariants', () => {
    expect(Spinner).toBeDefined();
    expect(spinnerVariants).toBeDefined();
  });

  it('has display name', () => {
    expect(Spinner.displayName).toBe('Spinner');
  });
});
