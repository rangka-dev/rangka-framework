import { describe, it, expect } from 'vitest';
import { Combobox } from '../combobox';

describe('Combobox API surface', () => {
  it('exports Combobox with sub-components', () => {
    expect(Combobox).toBeDefined();
    expect(Combobox.Input).toBeDefined();
    expect(Combobox.Content).toBeDefined();
    expect(Combobox.Item).toBeDefined();
    expect(Combobox.Group).toBeDefined();
  });

  it('sub-components have display names', () => {
    expect(Combobox.Input.displayName).toBe('Combobox.Input');
    expect(Combobox.Content.displayName).toBe('Combobox.Content');
    expect(Combobox.Item.displayName).toBe('Combobox.Item');
    expect(Combobox.Group.displayName).toBe('Combobox.Group');
  });
});
