import { describe, it, expect } from 'vitest';
import { Collapsible } from '../collapsible';

describe('Collapsible API surface', () => {
  it('exports Collapsible with sub-components', () => {
    expect(Collapsible).toBeDefined();
    expect(Collapsible.Trigger).toBeDefined();
    expect(Collapsible.Content).toBeDefined();
  });

  it('sub-components have display names', () => {
    expect(Collapsible.Trigger.displayName).toBe('Collapsible.Trigger');
    expect(Collapsible.Content.displayName).toBe('Collapsible.Content');
  });
});
