import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import { ApiClient } from '../helpers/api-client.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;
let api: ApiClient;

describe('hooks: lifecycle', () => {
  beforeAll(async () => {
    const db = createTestDb();
    await resetDatabase(db);
    await db.destroy();
    bootResult = await bootErpApp({ server: true });
    await bootResult.server!.listen({ port: 0 });
    api = new ApiClient(bootResult);
    await api.login();
  });

  afterAll(async () => {
    if (bootResult.server) await bootResult.server.close();
    if (bootResult.db) await bootResult.db.destroy();
  });

  it('hook registry has chains registered for all hooked models', () => {
    const models = [
      'sales.customer',
      'sales.invoice',
      'hr.leave_request',
      'project.task',
      'inventory.stock_entry',
      'accounting.journal_entry',
    ];
    for (const model of models) {
      const chain = bootResult.hookRegistry.getChain(model);
      expect(chain, `Expected hook chain for ${model}`).toBeDefined();
      expect(chain!.entries.length).toBeGreaterThan(0);
    }
  });

  it('validate hook exists for sales.customer', () => {
    const chain = bootResult.hookRegistry.getChain('sales.customer');
    expect(chain!.entries.some((e) => e.hooks.validate)).toBe(true);
  });

  it('beforeSave hook exists for sales.customer', () => {
    const chain = bootResult.hookRegistry.getChain('sales.customer');
    expect(chain!.entries.some((e) => e.hooks.beforeSave)).toBe(true);
  });

  it('beforeCreate hook exists for sales.invoice', () => {
    const chain = bootResult.hookRegistry.getChain('sales.invoice');
    expect(chain!.entries.some((e) => e.hooks.beforeCreate)).toBe(true);
  });

  it('afterCreate hook exists for sales.invoice', () => {
    const chain = bootResult.hookRegistry.getChain('sales.invoice');
    expect(chain!.entries.some((e) => e.hooks.afterCreate)).toBe(true);
  });

  it('validate + beforeCreate hooks exist for hr.leave_request', () => {
    const chain = bootResult.hookRegistry.getChain('hr.leave_request');
    expect(chain!.entries.some((e) => e.hooks.validate)).toBe(true);
    expect(chain!.entries.some((e) => e.hooks.beforeCreate)).toBe(true);
  });

  it('validate + beforeSave hooks exist for project.task', () => {
    const chain = bootResult.hookRegistry.getChain('project.task');
    expect(chain!.entries.some((e) => e.hooks.validate)).toBe(true);
    expect(chain!.entries.some((e) => e.hooks.beforeSave)).toBe(true);
  });
});
