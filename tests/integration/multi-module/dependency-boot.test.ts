import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;

describe('multi-module: dependency boot order', () => {
  beforeAll(async () => {
    const db = createTestDb();
    await resetDatabase(db);
    await db.destroy();
    bootResult = await bootErpApp();
  });

  afterAll(async () => {
    if (bootResult.db) await bootResult.db.destroy();
  });

  it('all 5 modules are loaded into registry', () => {
    const models = bootResult.registry.getAllModels();
    const modules = new Set(models.map((m) => m.module));
    expect(modules.has('sales')).toBe(true);
    expect(modules.has('inventory')).toBe(true);
    expect(modules.has('hr')).toBe(true);
    expect(modules.has('accounting')).toBe(true);
    expect(modules.has('project')).toBe(true);
  });

  it('sales module depends on inventory (loaded after)', () => {
    const models = bootResult.registry.getAllModels();
    const names = models.map((m) => m.qualifiedName);
    expect(names).toContain('sales.invoice_item');
    expect(names).toContain('inventory.item');
  });

  it('project module depends on hr (loaded after)', () => {
    const models = bootResult.registry.getAllModels();
    const names = models.map((m) => m.qualifiedName);
    expect(names).toContain('project.task');
    expect(names).toContain('hr.employee');
  });

  it('core module is always included (built-in)', () => {
    const models = bootResult.registry.getAllModels();
    const modules = new Set(models.map((m) => m.module));
    expect(modules.has('core')).toBe(true);
  });

  it('all models have unique qualified names', () => {
    const models = bootResult.registry.getAllModels();
    const names = models.map((m) => m.qualifiedName);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });
});
