import { describe, it, expect } from 'vitest';
import { Command } from '../command';

describe('Command API surface', () => {
  it('exports Command with sub-components', () => {
    expect(Command).toBeDefined();
    expect(Command.Input).toBeDefined();
    expect(Command.List).toBeDefined();
    expect(Command.Group).toBeDefined();
    expect(Command.Item).toBeDefined();
    expect(Command.Empty).toBeDefined();
  });

  it('sub-components have display names', () => {
    expect(Command.Input.displayName).toBe('Command.Input');
    expect(Command.List.displayName).toBe('Command.List');
    expect(Command.Group.displayName).toBe('Command.Group');
    expect(Command.Item.displayName).toBe('Command.Item');
    expect(Command.Empty.displayName).toBe('Command.Empty');
  });
});
