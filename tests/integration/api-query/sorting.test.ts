import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import { ApiClient } from '../helpers/api-client.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;
let api: ApiClient;

describe('api-query: sorting', () => {
  beforeAll(async () => {
    const db = createTestDb();
    await resetDatabase(db);
    await db.destroy();
    bootResult = await bootErpApp({ server: true });
    await bootResult.server!.listen({ port: 0 });
    api = new ApiClient(bootResult);
    await api.login();

    await api.post('/api/sales/customer', {
      name: 'Zebra Co',
      email: 'zebra@sort.com',
      credit_limit: 1000,
    });
    await api.post('/api/sales/customer', {
      name: 'Alpha Inc',
      email: 'alpha@sort.com',
      credit_limit: 5000,
    });
    await api.post('/api/sales/customer', {
      name: 'Mango Ltd',
      email: 'mango@sort.com',
      credit_limit: 3000,
    });
  });

  afterAll(async () => {
    if (bootResult.server) await bootResult.server.close();
    if (bootResult.db) await bootResult.db.destroy();
  });

  it('sorts ascending by name', async () => {
    const res = await api.getRaw('/api/sales/customer?sort=name');
    const body = await res.json();
    const names = body.data.map((r: Record<string, unknown>) => r.name);
    const sorted = [...names].sort();
    expect(names).toEqual(sorted);
  });

  it('sorts descending by name', async () => {
    const res = await api.getRaw('/api/sales/customer?sort=-name');
    const body = await res.json();
    const names = body.data.map((r: Record<string, unknown>) => r.name);
    const sorted = [...names].sort().reverse();
    expect(names).toEqual(sorted);
  });

  it('sorts by numeric field (credit_limit ascending)', async () => {
    const res = await api.getRaw('/api/sales/customer?sort=credit_limit');
    const body = await res.json();
    const limits = body.data.map((r: Record<string, unknown>) => Number(r.credit_limit));
    for (let i = 1; i < limits.length; i++) {
      expect(limits[i]).toBeGreaterThanOrEqual(limits[i - 1]);
    }
  });

  it('sorts by numeric field (credit_limit descending)', async () => {
    const res = await api.getRaw('/api/sales/customer?sort=-credit_limit');
    const body = await res.json();
    const limits = body.data.map((r: Record<string, unknown>) => Number(r.credit_limit));
    for (let i = 1; i < limits.length; i++) {
      expect(limits[i]).toBeLessThanOrEqual(limits[i - 1]);
    }
  });

  it('sorts by multiple fields', async () => {
    const res = await api.getRaw('/api/sales/customer?sort=is_active,-name');
    const body = await res.json();
    expect(body.data.length).toBeGreaterThan(0);
  });

  it('rejects sort on unknown field', async () => {
    const res = await api.getRaw('/api/sales/customer?sort=nonexistent');
    expect(res.status).toBe(400);
  });
});
