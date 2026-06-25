import { describe, it, expect } from 'vitest';
import { DropdownMenu } from '../dropdown-menu';

describe('DropdownMenu API surface', () => {
  it('exports DropdownMenu with sub-components', () => {
    expect(DropdownMenu).toBeDefined();
    expect(DropdownMenu.Trigger).toBeDefined();
    expect(DropdownMenu.Content).toBeDefined();
    expect(DropdownMenu.Item).toBeDefined();
    expect(DropdownMenu.Label).toBeDefined();
    expect(DropdownMenu.Separator).toBeDefined();
    expect(DropdownMenu.Group).toBeDefined();
  });

  it('sub-components have display names', () => {
    expect(DropdownMenu.Trigger.displayName).toBe('DropdownMenu.Trigger');
    expect(DropdownMenu.Content.displayName).toBe('DropdownMenu.Content');
    expect(DropdownMenu.Item.displayName).toBe('DropdownMenu.Item');
    expect(DropdownMenu.Label.displayName).toBe('DropdownMenu.Label');
    expect(DropdownMenu.Separator.displayName).toBe('DropdownMenu.Separator');
    expect(DropdownMenu.Group.displayName).toBe('DropdownMenu.Group');
  });
});
