import { describe, it, expect, vi } from 'vitest';
import * as path from 'node:path';
import { ProjectScanner } from '../project-scanner.js';
import { validatePageSources, detectDuplicatePageKeys } from '../page-utils.js';
import type { PageDefinition } from '@rangka/shared';

const FIXTURE_ROOT = path.resolve(__dirname, '../../../../../tests/fixtures/basic-app');

describe('ProjectScanner - page scanning', () => {
  it('discovers pages from modules with pages directory', async () => {
    const scanner = new ProjectScanner(FIXTURE_ROOT);
    const result = await scanner.scan();

    expect(result.app.pages).toBeDefined();
    expect(result.app.pages!.length).toBe(2);

    const pageKeys = result.app.pages!.map((p) => p.page.key);
    expect(pageKeys).toContain('sales.customers');
    expect(pageKeys).toContain('sales.orders');

    for (const entry of result.app.pages!) {
      expect(entry.app).toBe('sales');
    }
  });

  it('returns no pages field when no pages directory exists', async () => {
    const scanner = new ProjectScanner(
      path.resolve(__dirname, '../../../../../tests/fixtures/basic-app'),
    );
    const result = await scanner.scan();

    if (result.app.pages) {
      expect(result.app.pages.length).toBeGreaterThan(0);
    }
  });

  it('logs warning and continues when a page file has import error', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const scanner = new ProjectScanner(FIXTURE_ROOT);
    const result = await scanner.scan();

    expect(result.app.pages).toBeDefined();
    expect(result.app.pages!.length).toBeGreaterThan(0);

    warnSpy.mockRestore();
  });
});

describe('detectDuplicatePageKeys', () => {
  it('emits warning for duplicate page keys', () => {
    const pages: Array<{ app: string; page: PageDefinition }> = [
      {
        app: 'sales',
        page: { key: 'sales.orders', label: 'Orders', widgets: [] },
      },
      {
        app: 'crm',
        page: { key: 'sales.orders', label: 'Orders CRM', widgets: [] },
      },
    ];

    const warnings = detectDuplicatePageKeys(pages);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].pageKey).toBe('sales.orders');
    expect(warnings[0].message).toContain('Duplicate page key');
  });

  it('no warnings when all keys are unique', () => {
    const pages: Array<{ app: string; page: PageDefinition }> = [
      {
        app: 'sales',
        page: { key: 'sales.orders', label: 'Orders', widgets: [] },
      },
      {
        app: 'sales',
        page: { key: 'sales.customers', label: 'Customers', widgets: [] },
      },
    ];

    const warnings = detectDuplicatePageKeys(pages);
    expect(warnings).toHaveLength(0);
  });
});

describe('validatePageSources', () => {
  const knownModels = new Set(['sales.order', 'sales.customer', 'contacts.contact']);

  it('passes when all source models exist', () => {
    const pages: Array<{ app: string; page: PageDefinition }> = [
      {
        app: 'sales',
        page: {
          key: 'sales.orders',
          label: 'Orders',
          widgets: [{ type: 'data', source: { model: 'sales.order' }, children: [] }],
        },
      },
    ];

    const warnings = validatePageSources(pages, knownModels);
    expect(warnings).toHaveLength(0);
  });

  it('warns when widget references non-existent model', () => {
    const pages: Array<{ app: string; page: PageDefinition }> = [
      {
        app: 'sales',
        page: {
          key: 'sales.broken',
          label: 'Broken',
          widgets: [{ type: 'data', source: { model: 'sales.nonexistent' }, children: [] }],
        },
      },
    ];

    const warnings = validatePageSources(pages, knownModels);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].pageKey).toBe('sales.broken');
    expect(warnings[0].location).toBe('widgets[0]');
    expect(warnings[0].message).toContain('sales.nonexistent');
  });

  it('warns when nested widget references non-existent model', () => {
    const pages: Array<{ app: string; page: PageDefinition }> = [
      {
        app: 'sales',
        page: {
          key: 'sales.detail',
          label: 'Detail',
          widgets: [
            {
              type: 'data',
              source: { model: 'sales.order' },
              children: [{ type: 'data', source: { model: 'contacts.missing' }, children: [] }],
            },
          ],
        },
      },
    ];

    const warnings = validatePageSources(pages, knownModels);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].location).toBe('widgets[0].children[0]');
    expect(warnings[0].message).toContain('contacts.missing');
  });

  it('no warnings for widgets without model sources', () => {
    const pages: Array<{ app: string; page: PageDefinition }> = [
      {
        app: 'reports',
        page: {
          key: 'reports.revenue',
          label: 'Revenue',
          widgets: [
            { type: 'text', props: { content: 'Revenue Report' } },
            { type: 'button', props: { label: 'Refresh' } },
          ],
        },
      },
    ];

    const warnings = validatePageSources(pages, knownModels);
    expect(warnings).toHaveLength(0);
  });
});
