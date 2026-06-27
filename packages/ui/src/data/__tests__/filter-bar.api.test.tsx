import { describe, it, expect } from 'vitest';
import { FilterBar } from '../filter-bar';

describe('FilterBar API surface', () => {
  it('exports FilterBar with sub-components', () => {
    expect(FilterBar).toBeDefined();
    expect(FilterBar.Trigger).toBeDefined();
    expect(FilterBar.Content).toBeDefined();
    expect(FilterBar.Badge).toBeDefined();
    expect(FilterBar.AddButton).toBeDefined();
    expect(FilterBar.Popover).toBeDefined();
    expect(FilterBar.FieldList).toBeDefined();
    expect(FilterBar.FieldItem).toBeDefined();
    expect(FilterBar.OperatorForm).toBeDefined();
  });

  it('sub-components have display names', () => {
    expect(FilterBar.Trigger.displayName).toBe('FilterBar.Trigger');
    expect(FilterBar.Content.displayName).toBe('FilterBar.Content');
    expect(FilterBar.Badge.displayName).toBe('FilterBar.Badge');
    expect(FilterBar.AddButton.displayName).toBe('FilterBar.AddButton');
    expect(FilterBar.Popover.displayName).toBe('FilterBar.Popover');
    expect(FilterBar.FieldList.displayName).toBe('FilterBar.FieldList');
    expect(FilterBar.FieldItem.displayName).toBe('FilterBar.FieldItem');
    expect(FilterBar.OperatorForm.displayName).toBe('FilterBar.OperatorForm');
  });
});
