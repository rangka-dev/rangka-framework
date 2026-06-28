import { describe, it, expect } from 'vitest';
import { Split } from '../split';

describe('Split API surface', () => {
  it('exports Split with sub-components', () => {
    expect(Split).toBeDefined();
    expect(Split.Panel).toBeDefined();
    expect(Split.Handle).toBeDefined();
  });

  it('sub-components have display names', () => {
    expect(Split.Panel.displayName).toBe('Split.Panel');
    expect(Split.Handle.displayName).toBe('Split.Handle');
  });
});
