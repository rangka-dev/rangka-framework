import { describe, it, expect } from 'vitest';
import { Tooltip } from '../tooltip';

describe('Tooltip API surface', () => {
  it('exports Tooltip with sub-components', () => {
    expect(Tooltip).toBeDefined();
    expect(Tooltip.Trigger).toBeDefined();
    expect(Tooltip.Content).toBeDefined();
    expect(Tooltip.Arrow).toBeDefined();
  });

  it('sub-components have display names', () => {
    expect(Tooltip.Trigger.displayName).toBe('Tooltip.Trigger');
    expect(Tooltip.Content.displayName).toBe('Tooltip.Content');
    expect(Tooltip.Arrow.displayName).toBe('Tooltip.Arrow');
  });
});
