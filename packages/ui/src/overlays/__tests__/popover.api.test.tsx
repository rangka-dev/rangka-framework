import { describe, it, expect } from 'vitest';
import { Popover } from '../popover';

describe('Popover API surface', () => {
  it('exports Popover with sub-components', () => {
    expect(Popover).toBeDefined();
    expect(Popover.Trigger).toBeDefined();
    expect(Popover.Content).toBeDefined();
    expect(Popover.Arrow).toBeDefined();
    expect(Popover.Close).toBeDefined();
    expect(Popover.Title).toBeDefined();
    expect(Popover.Description).toBeDefined();
  });

  it('sub-components have display names', () => {
    expect(Popover.Trigger.displayName).toBe('Popover.Trigger');
    expect(Popover.Content.displayName).toBe('Popover.Content');
    expect(Popover.Arrow.displayName).toBe('Popover.Arrow');
    expect(Popover.Close.displayName).toBe('Popover.Close');
    expect(Popover.Title.displayName).toBe('Popover.Title');
    expect(Popover.Description.displayName).toBe('Popover.Description');
  });
});
