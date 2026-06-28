import { describe, it, expect } from 'vitest';
import { Sheet } from '../sheet';

describe('Sheet API surface', () => {
  it('exports Sheet with sub-components', () => {
    expect(Sheet).toBeDefined();
    expect(Sheet.Trigger).toBeDefined();
    expect(Sheet.Content).toBeDefined();
    expect(Sheet.Header).toBeDefined();
    expect(Sheet.Title).toBeDefined();
    expect(Sheet.Description).toBeDefined();
    expect(Sheet.Close).toBeDefined();
    expect(Sheet.Overlay).toBeDefined();
  });

  it('sub-components have display names', () => {
    expect(Sheet.Trigger.displayName).toBe('Sheet.Trigger');
    expect(Sheet.Content.displayName).toBe('Sheet.Content');
    expect(Sheet.Header.displayName).toBe('Sheet.Header');
    expect(Sheet.Title.displayName).toBe('Sheet.Title');
    expect(Sheet.Description.displayName).toBe('Sheet.Description');
    expect(Sheet.Close.displayName).toBe('Sheet.Close');
    expect(Sheet.Overlay.displayName).toBe('Sheet.Overlay');
  });
});
