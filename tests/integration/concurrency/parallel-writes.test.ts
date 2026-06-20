import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import { ApiClient } from '../helpers/api-client.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;
let api: ApiClient;

describe('concurrency: parallel writes', () => {
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

  it('50 parallel customer inserts all succeed without deadlock', async () => {
    const promises = Array.from({ length: 50 }, (_, i) =>
      api.post('/api/sales/customer', {
        name: `Concurrent Customer ${i}`,
        email: `concurrent${i}@parallel.com`,
      }),
    );
    const results = await Promise.all(promises);
    const successes = results.filter((r) => r.status === 201);
    expect(successes.length).toBe(50);
  });

  it('all 50 customers have unique IDs', async () => {
    const res = await api.getRaw(
      '/api/sales/customer?filter[email][like]=%@parallel.com&limit=100',
    );
    const body = await res.json();
    const ids = body.data.map((r: Record<string, unknown>) => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('20 parallel warehouse inserts all succeed', async () => {
    const promises = Array.from({ length: 20 }, (_, i) =>
      api.post('/api/inventory/warehouse', {
        name: `Parallel WH ${i}`,
        code: `PWH-${String(i).padStart(3, '0')}`,
      }),
    );
    const results = await Promise.all(promises);
    const successes = results.filter((r) => r.status === 201);
    expect(successes.length).toBe(20);
  });

  it('parallel reads and writes do not interfere', async () => {
    const writePromises = Array.from({ length: 10 }, (_, i) =>
      api.post('/api/hr/department', { name: `ParaDept ${i}` }),
    );
    const readPromises = Array.from({ length: 10 }, () => api.get('/api/hr/department'));
    const allResults = await Promise.all([...writePromises, ...readPromises]);
    const writes = allResults.slice(0, 10);
    const reads = allResults.slice(10);

    expect(writes.every((r) => r.status === 201)).toBe(true);
    expect(reads.every((r) => r.status === 200)).toBe(true);
  });
});
