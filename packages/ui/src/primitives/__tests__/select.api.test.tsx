import { describe, it, expect } from 'vitest';
import { Select } from '../select';

describe('Select API surface', () => {
  it('exports Select with sub-components', () => {
    expect(Select).toBeDefined();
    expect(Select.Trigger).toBeDefined();
    expect(Select.Value).toBeDefined();
    expect(Select.Content).toBeDefined();
    expect(Select.Item).toBeDefined();
    expect(Select.Group).toBeDefined();
  });

  it('sub-components have display names', () => {
    expect(Select.Trigger.displayName).toBe('Select.Trigger');
    expect(Select.Value.displayName).toBe('Select.Value');
    expect(Select.Content.displayName).toBe('Select.Content');
    expect(Select.Item.displayName).toBe('Select.Item');
    expect(Select.Group.displayName).toBe('Select.Group');
  });
});
