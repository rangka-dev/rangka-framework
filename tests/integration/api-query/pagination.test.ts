import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import { ApiClient } from '../helpers/api-client.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;
let api: ApiClient;

describe('api-query: pagination', () => {
  beforeAll(async () => {
    const db = createTestDb();
    await resetDatabase(db);
    await db.destroy();
    bootResult = await bootErpApp({ server: true });
    await bootResult.server!.listen({ port: 0 });
    api = new ApiClient(bootResult);
    await api.login();

    for (let i = 1; i <= 30; i++) {
      await api.post('/api/inventory/warehouse', {
        name: `Warehouse ${String(i).padStart(3, '0')}`,
        code: `WH-P${String(i).padStart(3, '0')}`,
      });
    }
  });

  afterAll(async () => {
    if (bootResult.server) await bootResult.server.close();
    if (bootResult.db) await bootResult.db.destroy();
  });

  it('defaults to page 1 with limit 25', async () => {
    const res = await api.getRaw('/api/inventory/warehouse');
    const body = await res.json();
    expect(body.meta.page).toBe(1);
    expect(body.meta.limit).toBe(25);
    expect(body.data.length).toBe(25);
    expect(body.meta.total).toBe(30);
    expect(body.meta.totalPages).toBe(2);
  });

  it('respects custom page and limit', async () => {
    const res = await api.getRaw('/api/inventory/warehouse?page=2&limit=10');
    const body = await res.json();
    expect(body.meta.page).toBe(2);
    expect(body.meta.limit).toBe(10);
    expect(body.data.length).toBe(10);
    expect(body.meta.totalPages).toBe(3);
  });

  it('last page has remaining records', async () => {
    const res = await api.getRaw('/api/inventory/warehouse?page=3&limit=10');
    const body = await res.json();
    expect(body.data.length).toBe(10);
  });

  it('page beyond last returns empty data', async () => {
    const res = await api.getRaw('/api/inventory/warehouse?page=10&limit=10');
    const body = await res.json();
    expect(body.data).toEqual([]);
    expect(body.meta.total).toBe(30);
  });

  it('limit is capped at 100', async () => {
    const res = await api.getRaw('/api/inventory/warehouse?limit=200');
    const body = await res.json();
    // Framework may reject via schema validation (400) or clamp to 100
    if (res.status === 200) {
      expect(body.meta.limit).toBeLessThanOrEqual(100);
    } else {
      expect(res.status).toBe(400);
    }
  });

  it('limit below 1 is clamped to 1', async () => {
    const res = await api.getRaw('/api/inventory/warehouse?limit=0');
    const body = await res.json();
    expect(body.meta.limit).toBeGreaterThanOrEqual(1);
  });

  it('invalid page defaults to 1', async () => {
    const res = await api.getRaw('/api/inventory/warehouse?page=-5');
    const body = await res.json();
    expect(body.meta.page).toBe(1);
  });

  it('total is correct when filtered', async () => {
    const res = await api.getRaw(
      '/api/inventory/warehouse?filter[name][like]=Warehouse%25&limit=5',
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.meta.total).toBeGreaterThanOrEqual(1);
  });
});
