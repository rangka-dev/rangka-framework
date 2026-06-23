import { describe, it, expect } from 'vitest';
import { validatePageBindings } from '../page-utils.js';
import { SchemaRegistry } from '../../schema/registry.js';
import type { ResolvedModel } from '../../schema/types.js';
import type { PageDefinition } from '@rangka/shared';

function makeModel(qualifiedName: string, fieldNames: string[]): ResolvedModel {
  const [module, name] = qualifiedName.split('.');
  return {
    qualifiedName,
    app: 'test-app',
    module,
    name,
    auditLog: false,
    traits: [],
    fields: fieldNames.map((f) => ({
      name: f,
      config: { type: 'string' } as never,
      provenance: { source: 'base' as const, app: 'test-app' },
    })),
    indexes: [],
  };
}

describe('validatePageBindings', () => {
  const registry = new SchemaRegistry([
    makeModel('sales.order', ['customer', 'date', 'status', 'total']),
    makeModel('sales.order_item', ['order_id', 'product', 'quantity']),
  ]);

  it('passes when bind.field exists on source model', () => {
    const pages: Array<{ module: string; page: PageDefinition }> = [
      {
        module: 'sales',
        page: {
          key: 'sales.orders',
          label: 'Orders',
          type: 'collection',
          body: [
            {
              type: 'form',
              source: { model: 'sales.order' },
              children: [
                { type: 'input', bind: { field: 'customer' } },
                { type: 'input', bind: { field: 'total' } },
              ],
            },
          ],
        },
      },
    ];

    const warnings = validatePageBindings(pages, registry);
    expect(warnings).toHaveLength(0);
  });

  it('warns when bind.field does not exist on source model', () => {
    const pages: Array<{ module: string; page: PageDefinition }> = [
      {
        module: 'sales',
        page: {
          key: 'sales.orders',
          label: 'Orders',
          type: 'collection',
          body: [
            {
              type: 'form',
              source: { model: 'sales.order' },
              children: [{ type: 'input', bind: { field: 'nonexistent_field' } }],
            },
          ],
        },
      },
    ];

    const warnings = validatePageBindings(pages, registry);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].pageKey).toBe('sales.orders');
    expect(warnings[0].location).toBe('body[0].children[0]');
    expect(warnings[0].message).toContain('nonexistent_field');
    expect(warnings[0].message).toContain('sales.order');
  });

  it('warns when widget has bind but no source in scope', () => {
    const pages: Array<{ module: string; page: PageDefinition }> = [
      {
        module: 'sales',
        page: {
          key: 'sales.orphan',
          label: 'Orphan',
          type: 'collection',
          body: [{ type: 'input', bind: { field: 'name' } }],
        },
      },
    ];

    const warnings = validatePageBindings(pages, registry);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].message).toContain('no source model in scope');
  });

  it('inherits source context from ancestors', () => {
    const pages: Array<{ module: string; page: PageDefinition }> = [
      {
        module: 'sales',
        page: {
          key: 'sales.nested',
          label: 'Nested',
          type: 'collection',
          body: [
            {
              type: 'form',
              source: { model: 'sales.order' },
              children: [
                {
                  type: 'section',
                  children: [
                    {
                      type: 'grid',
                      children: [{ type: 'input', bind: { field: 'customer' } }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    ];

    const warnings = validatePageBindings(pages, registry);
    expect(warnings).toHaveLength(0);
  });

  it('child source overrides parent source', () => {
    const pages: Array<{ module: string; page: PageDefinition }> = [
      {
        module: 'sales',
        page: {
          key: 'sales.nested-sources',
          label: 'Nested Sources',
          type: 'collection',
          body: [
            {
              type: 'form',
              source: { model: 'sales.order' },
              children: [
                {
                  type: 'data',
                  source: { model: 'sales.order_item' },
                  children: [{ type: 'input', bind: { field: 'quantity' } }],
                },
              ],
            },
          ],
        },
      },
    ];

    const warnings = validatePageBindings(pages, registry);
    expect(warnings).toHaveLength(0);
  });

  it('warns when bind references parent source field in child source context', () => {
    const pages: Array<{ module: string; page: PageDefinition }> = [
      {
        module: 'sales',
        page: {
          key: 'sales.wrong-context',
          label: 'Wrong Context',
          type: 'collection',
          body: [
            {
              type: 'form',
              source: { model: 'sales.order' },
              children: [
                {
                  type: 'data',
                  source: { model: 'sales.order_item' },
                  children: [{ type: 'input', bind: { field: 'customer' } }],
                },
              ],
            },
          ],
        },
      },
    ];

    const warnings = validatePageBindings(pages, registry);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].message).toContain('customer');
    expect(warnings[0].message).toContain('sales.order_item');
  });

  it('skips validation for bind.expression (no field reference)', () => {
    const pages: Array<{ module: string; page: PageDefinition }> = [
      {
        module: 'sales',
        page: {
          key: 'sales.computed',
          label: 'Computed',
          type: 'collection',
          body: [
            {
              type: 'form',
              source: { model: 'sales.order' },
              children: [{ type: 'text', bind: { expression: 'total * 1.1' } }],
            },
          ],
        },
      },
    ];

    const warnings = validatePageBindings(pages, registry);
    expect(warnings).toHaveLength(0);
  });

  it('does not warn when source model is unknown (handled by validatePageSources)', () => {
    const pages: Array<{ module: string; page: PageDefinition }> = [
      {
        module: 'sales',
        page: {
          key: 'sales.unknown-model',
          label: 'Unknown',
          type: 'collection',
          body: [
            {
              type: 'form',
              source: { model: 'sales.nonexistent' },
              children: [{ type: 'input', bind: { field: 'anything' } }],
            },
          ],
        },
      },
    ];

    const warnings = validatePageBindings(pages, registry);
    expect(warnings).toHaveLength(0);
  });

  it('validates multiple pages', () => {
    const pages: Array<{ module: string; page: PageDefinition }> = [
      {
        module: 'sales',
        page: {
          key: 'sales.page1',
          label: 'Page 1',
          type: 'collection',
          body: [
            {
              type: 'form',
              source: { model: 'sales.order' },
              children: [{ type: 'input', bind: { field: 'bad1' } }],
            },
          ],
        },
      },
      {
        module: 'sales',
        page: {
          key: 'sales.page2',
          label: 'Page 2',
          type: 'collection',
          body: [
            {
              type: 'form',
              source: { model: 'sales.order' },
              children: [{ type: 'input', bind: { field: 'bad2' } }],
            },
          ],
        },
      },
    ];

    const warnings = validatePageBindings(pages, registry);
    expect(warnings).toHaveLength(2);
    expect(warnings[0].pageKey).toBe('sales.page1');
    expect(warnings[1].pageKey).toBe('sales.page2');
  });
});
