import { describe, it, expect } from 'vitest';
import { extractSourceModels, validatePageSources } from '../page-utils.js';
import type { PageDefinition } from '@rangka/shared';

describe('extractSourceModels', () => {
  it('extracts models from data widget source', () => {
    const page: PageDefinition = {
      key: 'sales.orders',
      label: 'Orders',
      type: 'collection',
      body: [
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
      type: 'collection',
      body: [
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

  it('extracts models from table with model binding', () => {
    const page: PageDefinition = {
      key: 'sales.orders',
      label: 'Orders',
      type: 'collection',
      body: [
        {
          type: 'table',
          bind: { model: { name: 'sales.invoice' } },
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
      type: 'collection',
      body: [
        { type: 'data', source: { model: 'sales.order' }, children: [] },
        { type: 'data', source: { model: 'contacts.contact' }, children: [] },
      ],
    };

    const models = extractSourceModels(page);
    expect(models).toContain('sales.order');
    expect(models).toContain('contacts.contact');
    expect(models).toHaveLength(2);
  });

  it('returns empty for body without data sources', () => {
    const page: PageDefinition = {
      key: 'sales.dashboard',
      label: 'Dashboard',
      type: 'dashboard',
      body: [
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
      type: 'collection',
      body: [
        { type: 'data', source: { model: 'sales.order' }, children: [] },
        { type: 'table', bind: { model: { name: 'sales.order' } }, children: [] },
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
          type: 'collection',
          body: [
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
    expect(warnings[0].location).toBe('body[0]');
    expect(warnings[0].message).toContain('sales.nonexistent');
  });

  it('catches unresolved models in nested children', () => {
    const pages: Array<{ module: string; page: PageDefinition }> = [
      {
        module: 'sales',
        page: {
          key: 'sales.nested',
          label: 'Nested',
          type: 'collection',
          body: [
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
    expect(warnings[0].location).toBe('body[0].children[0]');
    expect(warnings[0].message).toContain('sales.ghost');
  });

  it('catches unresolved models in table bind.model', () => {
    const pages: Array<{ module: string; page: PageDefinition }> = [
      {
        module: 'sales',
        page: {
          key: 'sales.table',
          label: 'Table',
          type: 'collection',
          body: [
            {
              type: 'table',
              bind: { model: { name: 'sales.missing' } },
              children: [],
            },
          ],
        },
      },
    ];

    const warnings = validatePageSources(pages, knownModels);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].location).toBe('body[0]');
    expect(warnings[0].message).toContain('sales.missing');
  });

  it('passes when all models exist', () => {
    const pages: Array<{ module: string; page: PageDefinition }> = [
      {
        module: 'sales',
        page: {
          key: 'sales.orders',
          label: 'Orders',
          type: 'collection',
          body: [
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
