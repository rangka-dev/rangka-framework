import { describe, it, expect } from 'vitest';
import { Text, textVariants } from '../text';

describe('Text API surface', () => {
  it('exports Text component and textVariants', () => {
    expect(Text).toBeDefined();
    expect(textVariants).toBeDefined();
  });

  it('has display name', () => {
    expect(Text.displayName).toBe('Text');
  });
});
