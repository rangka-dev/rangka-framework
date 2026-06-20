import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import { ApiClient } from '../helpers/api-client.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;
let api: ApiClient;

describe('concurrency: pool exhaustion', () => {
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

  it('100 concurrent requests complete without hanging', async () => {
    const promises = Array.from({ length: 100 }, (_, i) =>
      api.post('/api/hr/department', { name: `PoolDept ${i}` }),
    );

    const timeout = new Promise<'timeout'>((resolve) =>
      setTimeout(() => resolve('timeout'), 30000),
    );

    const race = await Promise.race([
      Promise.all(promises).then(() => 'completed' as const),
      timeout,
    ]);
    expect(race).toBe('completed');
  });

  it('all 100 departments were created', async () => {
    const res = await api.getRaw('/api/hr/department?filter[name][like]=PoolDept%&limit=100');
    const body = await res.json();
    expect(body.meta.total).toBe(100);
  });

  it('mixed read/write flood does not deadlock', async () => {
    const ops = Array.from({ length: 50 }, (_, i) => {
      if (i % 2 === 0) {
        return api.get('/api/hr/department');
      }
      return api.post('/api/inventory/warehouse', {
        name: `FloodWH ${i}`,
        code: `FWH-${String(i).padStart(3, '0')}`,
      });
    });

    const timeout = new Promise<'timeout'>((resolve) =>
      setTimeout(() => resolve('timeout'), 30000),
    );

    const race = await Promise.race([Promise.all(ops).then(() => 'completed' as const), timeout]);
    expect(race).toBe('completed');
  });
});
