import { describe, it, expect } from 'vitest';
import { ContextMenu } from '../context-menu';

describe('ContextMenu API surface', () => {
  it('exports ContextMenu with sub-components', () => {
    expect(ContextMenu).toBeDefined();
    expect(ContextMenu.Trigger).toBeDefined();
    expect(ContextMenu.Content).toBeDefined();
    expect(ContextMenu.Item).toBeDefined();
    expect(ContextMenu.Label).toBeDefined();
    expect(ContextMenu.Separator).toBeDefined();
    expect(ContextMenu.Group).toBeDefined();
  });

  it('sub-components have display names', () => {
    expect(ContextMenu.Trigger.displayName).toBe('ContextMenu.Trigger');
    expect(ContextMenu.Content.displayName).toBe('ContextMenu.Content');
    expect(ContextMenu.Item.displayName).toBe('ContextMenu.Item');
    expect(ContextMenu.Label.displayName).toBe('ContextMenu.Label');
    expect(ContextMenu.Separator.displayName).toBe('ContextMenu.Separator');
    expect(ContextMenu.Group.displayName).toBe('ContextMenu.Group');
  });
});
