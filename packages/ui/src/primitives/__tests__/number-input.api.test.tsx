import { describe, it, expect } from 'vitest';
import { NumberInput } from '../number-input';

describe('NumberInput API surface', () => {
  it('exports NumberInput with sub-components', () => {
    expect(NumberInput).toBeDefined();
    expect(NumberInput.Input).toBeDefined();
    expect(NumberInput.Increment).toBeDefined();
    expect(NumberInput.Decrement).toBeDefined();
  });

  it('sub-components have display names', () => {
    expect(NumberInput.Input.displayName).toBe('NumberInput.Input');
    expect(NumberInput.Increment.displayName).toBe('NumberInput.Increment');
    expect(NumberInput.Decrement.displayName).toBe('NumberInput.Decrement');
  });
});
