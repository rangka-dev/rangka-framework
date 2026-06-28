import { describe, it, expect } from 'vitest';
import { Listbox } from '../listbox';

describe('Listbox API surface', () => {
  it('exports Listbox with sub-components', () => {
    expect(Listbox).toBeDefined();
    expect(Listbox.Trigger).toBeDefined();
    expect(Listbox.TriggerValue).toBeDefined();
    expect(Listbox.TriggerIcon).toBeDefined();
    expect(Listbox.Content).toBeDefined();
    expect(Listbox.Search).toBeDefined();
    expect(Listbox.Items).toBeDefined();
    expect(Listbox.Item).toBeDefined();
    expect(Listbox.Empty).toBeDefined();
  });

  it('sub-components have display names', () => {
    expect(Listbox.Trigger.displayName).toBe('Listbox.Trigger');
    expect(Listbox.TriggerValue.displayName).toBe('Listbox.TriggerValue');
    expect(Listbox.TriggerIcon.displayName).toBe('Listbox.TriggerIcon');
    expect(Listbox.Content.displayName).toBe('Listbox.Content');
    expect(Listbox.Search.displayName).toBe('Listbox.Search');
    expect(Listbox.Items.displayName).toBe('Listbox.Items');
    expect(Listbox.Item.displayName).toBe('Listbox.Item');
    expect(Listbox.Empty.displayName).toBe('Listbox.Empty');
  });
});
