import { describe, it, expect } from 'vitest';
import { Datagrid } from '../datagrid';

describe('Datagrid API surface', () => {
  it('exports Datagrid with sub-components', () => {
    expect(Datagrid).toBeDefined();
    expect(Datagrid.ScrollArea).toBeDefined();
    expect(Datagrid.Header).toBeDefined();
    expect(Datagrid.HeaderCell).toBeDefined();
    expect(Datagrid.ResizeHandle).toBeDefined();
    expect(Datagrid.Body).toBeDefined();
    expect(Datagrid.Row).toBeDefined();
    expect(Datagrid.Cell).toBeDefined();
    expect(Datagrid.SelectCell).toBeDefined();
    expect(Datagrid.SelectHeader).toBeDefined();
    expect(Datagrid.Footer).toBeDefined();
    expect(Datagrid.FooterCount).toBeDefined();
  });

  it('sub-components have display names', () => {
    expect(Datagrid.ScrollArea.displayName).toBe('Datagrid.ScrollArea');
    expect(Datagrid.Header.displayName).toBe('Datagrid.Header');
    expect(Datagrid.HeaderCell.displayName).toBe('Datagrid.HeaderCell');
    expect(Datagrid.ResizeHandle.displayName).toBe('Datagrid.ResizeHandle');
    expect(Datagrid.Body.displayName).toBe('Datagrid.Body');
    expect(Datagrid.Row.displayName).toBe('Datagrid.Row');
    expect(Datagrid.Cell.displayName).toBe('Datagrid.Cell');
    expect(Datagrid.SelectCell.displayName).toBe('Datagrid.SelectCell');
    expect(Datagrid.SelectHeader.displayName).toBe('Datagrid.SelectHeader');
    expect(Datagrid.Footer.displayName).toBe('Datagrid.Footer');
    expect(Datagrid.FooterCount.displayName).toBe('Datagrid.FooterCount');
  });
});
