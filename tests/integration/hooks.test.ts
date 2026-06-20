import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, resetDatabase } from './helpers/db.js';
import { bootFixtureApp } from './helpers/boot.js';
import { ApiClient } from './helpers/api-client.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;
let api: ApiClient;

describe('hooks integration', () => {
  beforeAll(async () => {
    const db = createTestDb();
    await resetDatabase(db);
    await db.destroy();

    bootResult = await bootFixtureApp({ server: true });
    await bootResult.server!.listen({ port: 0 });

    api = new ApiClient(bootResult);
    await api.login();
  });

  afterAll(async () => {
    if (bootResult.server) {
      await bootResult.server.close();
    }
    if (bootResult.db) {
      await bootResult.db.destroy();
    }
  });

  it('hook registry has invoice hooks registered', () => {
    const chain = bootResult.hookRegistry.getChain('sales.invoice');
    expect(chain).toBeDefined();
    expect(chain!.entries.length).toBeGreaterThan(0);
    expect(chain!.entries[0].hooks.validate).toBeTypeOf('function');
  });

  it('required field validation rejects invoice without customer', async () => {
    const res = await api.post('/api/sales/invoice', {
      posting_date: '2026-01-01',
      grand_total: 100,
    });
    expect(res.status).toBe(400);
    expect(res.error.message).toContain('customer');
  });

  it('valid invoice with all required fields passes', async () => {
    const customerRes = await api.post('/api/sales/customer', {
      name: 'Hook Test Co',
      email: 'hook@test.com',
    });
    expect(customerRes.status).toBe(201);

    const res = await api.post('/api/sales/invoice', {
      customer: customerRes.data.id,
      posting_date: '2026-01-01',
      grand_total: 500,
      status: 'Draft',
    });
    expect(res.status).toBe(201);
  });
});
