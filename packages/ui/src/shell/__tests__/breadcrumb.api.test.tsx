import { describe, it, expect } from 'vitest';
import { Breadcrumb } from '../breadcrumb';

describe('Breadcrumb API surface', () => {
  it('exports Breadcrumb with all sub-components', () => {
    expect(Breadcrumb).toBeDefined();
    expect(Breadcrumb.List).toBeDefined();
    expect(Breadcrumb.Item).toBeDefined();
    expect(Breadcrumb.Link).toBeDefined();
    expect(Breadcrumb.Page).toBeDefined();
    expect(Breadcrumb.Separator).toBeDefined();
    expect(Breadcrumb.Ellipsis).toBeDefined();
  });

  it('sub-components have display names', () => {
    expect(Breadcrumb.List.displayName).toBe('Breadcrumb.List');
    expect(Breadcrumb.Item.displayName).toBe('Breadcrumb.Item');
    expect(Breadcrumb.Link.displayName).toBe('Breadcrumb.Link');
    expect(Breadcrumb.Page.displayName).toBe('Breadcrumb.Page');
    expect(Breadcrumb.Separator.displayName).toBe('Breadcrumb.Separator');
    expect(Breadcrumb.Ellipsis.displayName).toBe('Breadcrumb.Ellipsis');
  });
});
