import { describe, it, expect } from 'vitest';
import * as path from 'node:path';
import { ProjectScanner } from '../project-scanner.js';

const FIXTURE_ROOT = path.resolve(__dirname, '../../../../../tests/fixtures/basic-app');

describe('ProjectScanner', () => {
  it('discovers modules from modules/ directory', async () => {
    const scanner = new ProjectScanner(FIXTURE_ROOT);
    const result = await scanner.scan();

    expect(result.app.schemas.length).toBeGreaterThan(0);
    const modules = new Set(result.app.schemas.map((s) => s.app));
    expect(modules.has('sales')).toBe(true);
  });

  it('discovers model schemas from flat files', async () => {
    const scanner = new ProjectScanner(FIXTURE_ROOT);
    const result = await scanner.scan();

    const schemaNames = result.app.schemas.map((s) => s.schema.name);
    expect(schemaNames).toContain('customer');
    expect(schemaNames).toContain('invoice');
  });

  it('loads hooks from hooks/ directory', async () => {
    const scanner = new ProjectScanner(FIXTURE_ROOT);
    const result = await scanner.scan();

    expect(result.app.hooks).toBeDefined();
    const invoiceHooks = result.app.hooks!.find((h) => h.model === 'sales.invoice');
    expect(invoiceHooks).toBeDefined();
    expect(invoiceHooks!.hooks.validate).toBeTypeOf('function');
  });

  it('loads roles from per-module roles.ts', async () => {
    const scanner = new ProjectScanner(FIXTURE_ROOT);
    const result = await scanner.scan();

    expect(result.app.roles).toBeDefined();
    expect(result.app.roles!.length).toBeGreaterThan(0);
    const salesRoles = result.app.roles!.find((r) => r.app === 'sales');
    expect(salesRoles).toBeDefined();
    expect(salesRoles!.config['Sales User']).toBeDefined();
    expect(salesRoles!.config['Sales Manager']).toBeDefined();
  });

  it('loads rangka.config.ts', async () => {
    const scanner = new ProjectScanner(FIXTURE_ROOT);
    const result = await scanner.scan();

    expect(result.rangkaConfig).toBeDefined();
    const dbConfig = result.rangkaConfig.database;
    expect(dbConfig).toBeDefined();
    expect(dbConfig!.dialect).toBe('pg');
    if (dbConfig!.dialect === 'pg') {
      expect(dbConfig!.host).toBe('localhost');
      expect(dbConfig!.port).toBe(5433);
      expect(dbConfig!.database).toBe('rangka_test');
    }
  });

  it('returns empty extensions when extensions/ dir does not exist', async () => {
    const scanner = new ProjectScanner(FIXTURE_ROOT);
    const result = await scanner.scan();

    expect(result.app.extensions).toEqual([]);
  });

  it('throws when rangka.config.ts is missing', async () => {
    const scanner = new ProjectScanner('/tmp/nonexistent-rangka-project');
    await expect(scanner.scan()).rejects.toThrow('No rangka.config.ts found');
  });

  it('produces DiscoveredApp compatible with boot()', async () => {
    const scanner = new ProjectScanner(FIXTURE_ROOT);
    const result = await scanner.scan();

    expect(result.app.packageInfo.path).toBe(FIXTURE_ROOT);
    expect(result.app.packageInfo.rangka.type).toBe('app');
  });

  it('discovers pages from pages/ directory', async () => {
    const scanner = new ProjectScanner(FIXTURE_ROOT);
    const result = await scanner.scan();

    expect(result.app.pages).toBeDefined();
    const pageKeys = result.app.pages!.map((p) => p.page.key);
    expect(pageKeys).toContain('sales.customers');
    expect(pageKeys).toContain('sales.orders');
  });
});
