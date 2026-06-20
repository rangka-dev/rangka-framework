import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import { ApiClient } from '../helpers/api-client.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;
let api: ApiClient;

describe('hooks: rejection (hook throw → operation fails)', () => {
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

  it('hook validation error prevents record creation', async () => {
    const res = await api.post('/api/sales/customer', {
      name: 'Will Fail',
      email: 'nope',
    });
    // Hook throws plain Error for invalid email (no @)
    expect(res.status).toBeGreaterThanOrEqual(400);

    const list = await api.getRaw('/api/sales/customer?filter[name][eq]=Will Fail');
    const body = await list.json();
    expect(body.data.length).toBe(0);
  });

  it('validation error on nested required fields prevents creation', async () => {
    const res = await api.post('/api/inventory/stock_entry', {
      qty: -5,
      entry_type: 'Receipt',
      posting_date: '2025-06-01T10:00:00Z',
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('multiple validations: hook throw rejects the operation', async () => {
    const res = await api.post('/api/hr/leave_request', {
      leave_type: 'Annual',
      start_date: '2025-06-01',
      end_date: '2025-06-05',
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('valid record succeeds after failed attempts', async () => {
    const failedRes = await api.post('/api/sales/customer', {
      name: 'First Fail',
      email: 'bad-email-no-at',
    });
    expect(failedRes.status).toBeGreaterThanOrEqual(400);

    const successRes = await api.post('/api/sales/customer', {
      name: 'Then Succeed',
      email: 'good@email.com',
    });
    expect(successRes.status).toBe(201);
    expect(successRes.data.name).toBe('Then Succeed');
  });
});
