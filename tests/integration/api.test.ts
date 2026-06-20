import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, resetDatabase } from './helpers/db.js';
import { bootFixtureApp } from './helpers/boot.js';
import { ApiClient } from './helpers/api-client.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;
let api: ApiClient;

describe('api integration', () => {
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

  it('GET /api/sales/customer returns 200 with empty list', async () => {
    const res = await api.get('/api/sales/customer');
    expect(res.status).toBe(200);
    expect(res.data).toEqual([]);
  });

  it('POST /api/sales/customer creates a document', async () => {
    const res = await api.post('/api/sales/customer', {
      name: 'Acme Corp',
      email: 'acme@example.com',
    });
    expect(res.status).toBe(201);
    expect(res.data.name).toBe('Acme Corp');
    expect(res.data.id).toBeDefined();
  });

  it('GET /api/sales/customer/:id returns the created document', async () => {
    const createRes = await api.post('/api/sales/customer', {
      name: 'Test Co',
      email: 'test@example.com',
    });
    const res = await api.get(`/api/sales/customer/${createRes.data.id}`);
    expect(res.status).toBe(200);
    expect(res.data.name).toBe('Test Co');
  });

  it('GET /api/sales/invoice returns 200', async () => {
    const res = await api.get('/api/sales/invoice');
    expect(res.status).toBe(200);
  });
});
