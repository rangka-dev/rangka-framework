import { describe, it, expect } from 'vitest';
import { extractSourceModels, validatePageSources } from '../page-utils.js';
import type { PageDefinition } from '@rangka/shared';

describe('extractSourceModels', () => {
  it('extracts models from data widget source', () => {
    const page: PageDefinition = {
      key: 'sales.orders',
      label: 'Orders',
      widgets: [
        {
          type: 'data',
          source: { model: 'sales.order' },
          children: [{ type: 'text', bind: { field: 'name' } }],
        },
      ],
    };

    const models = extractSourceModels(page);
    expect(models).toContain('sales.order');
    expect(models).toHaveLength(1);
  });

  it('extracts models from nested data widgets', () => {
    const page: PageDefinition = {
      key: 'sales.orders',
      label: 'Orders',
      widgets: [
        {
          type: 'data',
          source: { model: 'sales.order' },
          children: [
            {
              type: 'data',
              source: { model: 'sales.order_item' },
              children: [{ type: 'text', bind: { field: 'quantity' } }],
            },
          ],
        },
      ],
    };

    const models = extractSourceModels(page);
    expect(models).toContain('sales.order');
    expect(models).toContain('sales.order_item');
    expect(models).toHaveLength(2);
  });

  it('extracts models from table with source', () => {
    const page: PageDefinition = {
      key: 'sales.orders',
      label: 'Orders',
      widgets: [
        {
          type: 'table',
          source: { model: 'sales.invoice' },
          children: [{ type: 'column', bind: { field: 'name' } }],
        },
      ],
    };

    const models = extractSourceModels(page);
    expect(models).toContain('sales.invoice');
    expect(models).toHaveLength(1);
  });

  it('extracts models from multiple siblings', () => {
    const page: PageDefinition = {
      key: 'sales.orders',
      label: 'Orders',
      widgets: [
        { type: 'data', source: { model: 'sales.order' }, children: [] },
        { type: 'data', source: { model: 'contacts.contact' }, children: [] },
      ],
    };

    const models = extractSourceModels(page);
    expect(models).toContain('sales.order');
    expect(models).toContain('contacts.contact');
    expect(models).toHaveLength(2);
  });

  it('returns empty for widgets without data sources', () => {
    const page: PageDefinition = {
      key: 'sales.dashboard',
      label: 'Dashboard',
      widgets: [
        { type: 'text', props: { content: 'Hello' } },
        { type: 'button', props: { label: 'Click' } },
      ],
    };

    const models = extractSourceModels(page);
    expect(models).toHaveLength(0);
  });

  it('deduplicates repeated model references', () => {
    const page: PageDefinition = {
      key: 'sales.orders',
      label: 'Orders',
      widgets: [
        { type: 'data', source: { model: 'sales.order' }, children: [] },
        { type: 'table', source: { model: 'sales.order' }, children: [] },
      ],
    };

    const models = extractSourceModels(page);
    expect(models).toEqual(['sales.order']);
  });
});

describe('validatePageSources', () => {
  const knownModels = new Set(['sales.order', 'sales.customer', 'contacts.contact']);

  it('catches unresolved models in data widget', () => {
    const pages: Array<{ module: string; page: PageDefinition }> = [
      {
        module: 'sales',
        page: {
          key: 'sales.broken',
          label: 'Broken',
          widgets: [
            {
              type: 'data',
              source: { model: 'sales.nonexistent' },
              children: [],
            },
          ],
        },
      },
    ];

    const warnings = validatePageSources(pages, knownModels);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].pageKey).toBe('sales.broken');
    expect(warnings[0].location).toBe('widgets[0]');
    expect(warnings[0].message).toContain('sales.nonexistent');
  });

  it('catches unresolved models in nested children', () => {
    const pages: Array<{ module: string; page: PageDefinition }> = [
      {
        module: 'sales',
        page: {
          key: 'sales.nested',
          label: 'Nested',
          widgets: [
            {
              type: 'data',
              source: { model: 'sales.order' },
              children: [
                {
                  type: 'data',
                  source: { model: 'sales.ghost' },
                  children: [],
                },
              ],
            },
          ],
        },
      },
    ];

    const warnings = validatePageSources(pages, knownModels);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].location).toBe('widgets[0].children[0]');
    expect(warnings[0].message).toContain('sales.ghost');
  });

  it('catches unresolved models in table source', () => {
    const pages: Array<{ module: string; page: PageDefinition }> = [
      {
        module: 'sales',
        page: {
          key: 'sales.table',
          label: 'Table',
          widgets: [
            {
              type: 'table',
              source: { model: 'sales.missing' },
              children: [],
            },
          ],
        },
      },
    ];

    const warnings = validatePageSources(pages, knownModels);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].location).toBe('widgets[0]');
    expect(warnings[0].message).toContain('sales.missing');
  });

  it('passes when all models exist', () => {
    const pages: Array<{ module: string; page: PageDefinition }> = [
      {
        module: 'sales',
        page: {
          key: 'sales.orders',
          label: 'Orders',
          widgets: [
            {
              type: 'data',
              source: { model: 'sales.order' },
              children: [{ type: 'text', bind: { field: 'name' } }],
            },
          ],
        },
      },
    ];

    const warnings = validatePageSources(pages, knownModels);
    expect(warnings).toHaveLength(0);
  });
});
