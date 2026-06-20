import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import { ApiClient } from '../helpers/api-client.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;
let api: ApiClient;

describe('api-query: field selection', () => {
  beforeAll(async () => {
    const db = createTestDb();
    await resetDatabase(db);
    await db.destroy();
    bootResult = await bootErpApp({ server: true });
    await bootResult.server!.listen({ port: 0 });
    api = new ApiClient(bootResult);
    await api.login();

    await api.post('/api/sales/customer', {
      name: 'FieldSel Co',
      email: 'fieldsel@test.com',
      phone: '555-0001',
      credit_limit: 10000,
      notes: 'Some notes',
    });
  });

  afterAll(async () => {
    if (bootResult.server) await bootResult.server.close();
    if (bootResult.db) await bootResult.db.destroy();
  });

  it('returns only requested fields plus id', async () => {
    const res = await api.getRaw('/api/sales/customer?fields=name,email');
    const body = await res.json();
    expect(body.data.length).toBeGreaterThan(0);
    const record = body.data[0];
    expect(record.id).toBeDefined();
    expect(record.name).toBeDefined();
    expect(record.email).toBeDefined();
    expect(record.phone).toBeUndefined();
    expect(record.credit_limit).toBeUndefined();
  });

  it('always includes id even when not requested', async () => {
    const res = await api.getRaw('/api/sales/customer?fields=name');
    const body = await res.json();
    expect(body.data[0].id).toBeDefined();
  });

  it('returns all fields when no field selection specified', async () => {
    const res = await api.getRaw('/api/sales/customer');
    const body = await res.json();
    const record = body.data[0];
    expect(record.id).toBeDefined();
    expect(record.name).toBeDefined();
    expect(record.email).toBeDefined();
  });

  it('rejects unknown field name in selection', async () => {
    const res = await api.getRaw('/api/sales/customer?fields=name,nonexistent');
    expect(res.status).toBe(400);
  });

  it('field selection works on single record endpoint', async () => {
    const all = await api.getRaw('/api/sales/customer');
    const allBody = await all.json();
    const id = allBody.data[0].id;

    const res = await api.getRaw(`/api/sales/customer/${id}?fields=name,email`);
    const body = await res.json();
    expect(body.data.id).toBeDefined();
    expect(body.data.name).toBeDefined();
    expect(body.data.email).toBeDefined();
    expect(body.data.phone).toBeUndefined();
  });
});
