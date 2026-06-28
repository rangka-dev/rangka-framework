import { describe, it, expect } from 'vitest';
import { Tabs } from '../tabs';

describe('Tabs API surface', () => {
  it('exports Tabs with sub-components', () => {
    expect(Tabs).toBeDefined();
    expect(Tabs.List).toBeDefined();
    expect(Tabs.Trigger).toBeDefined();
    expect(Tabs.Content).toBeDefined();
  });

  it('sub-components have display names', () => {
    expect(Tabs.List.displayName).toBe('Tabs.List');
    expect(Tabs.Trigger.displayName).toBe('Tabs.Trigger');
    expect(Tabs.Content.displayName).toBe('Tabs.Content');
  });
});
