import { describe, it, expect } from 'vitest';
import { TableFilterBar } from '../table-filter-bar';

describe('TableFilterBar API surface', () => {
  it('exports TableFilterBar component', () => {
    expect(TableFilterBar).toBeDefined();
    expect(TableFilterBar.displayName).toBe('TableFilterBar');
  });
});
