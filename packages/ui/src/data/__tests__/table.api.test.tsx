import { describe, it, expect } from 'vitest';
import { Table } from '../table';

describe('Table API surface', () => {
  it('exports Table with sub-components', () => {
    expect(Table).toBeDefined();
    expect(Table.Content).toBeDefined();
    expect(Table.Header).toBeDefined();
    expect(Table.Body).toBeDefined();
    expect(Table.Row).toBeDefined();
    expect(Table.Head).toBeDefined();
    expect(Table.Cell).toBeDefined();
    expect(Table.SelectCell).toBeDefined();
    expect(Table.SelectHead).toBeDefined();
    expect(Table.Empty).toBeDefined();
    expect(Table.Skeleton).toBeDefined();
    expect(Table.Footer).toBeDefined();
  });

  it('sub-components have display names', () => {
    expect(Table.Content.displayName).toBe('Table.Content');
    expect(Table.Header.displayName).toBe('Table.Header');
    expect(Table.Body.displayName).toBe('Table.Body');
    expect(Table.Row.displayName).toBe('Table.Row');
    expect(Table.Head.displayName).toBe('Table.Head');
    expect(Table.Cell.displayName).toBe('Table.Cell');
    expect(Table.SelectCell.displayName).toBe('Table.SelectCell');
    expect(Table.SelectHead.displayName).toBe('Table.SelectHead');
    expect(Table.Empty.displayName).toBe('Table.Empty');
    expect(Table.Skeleton.displayName).toBe('Table.Skeleton');
    expect(Table.Footer.displayName).toBe('Table.Footer');
  });
});
