import { describe, it, expect } from 'vitest';
import { Drawer } from '../drawer';

describe('Drawer API surface', () => {
  it('exports Drawer with sub-components', () => {
    expect(Drawer).toBeDefined();
    expect(Drawer.Content).toBeDefined();
    expect(Drawer.Header).toBeDefined();
    expect(Drawer.Title).toBeDefined();
    expect(Drawer.Body).toBeDefined();
    expect(Drawer.Footer).toBeDefined();
  });

  it('sub-components have display names', () => {
    expect(Drawer.Content.displayName).toBe('Drawer.Content');
    expect(Drawer.Header.displayName).toBe('Drawer.Header');
    expect(Drawer.Title.displayName).toBe('Drawer.Title');
    expect(Drawer.Body.displayName).toBe('Drawer.Body');
    expect(Drawer.Footer.displayName).toBe('Drawer.Footer');
  });
});
