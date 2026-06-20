import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import { ApiClient } from '../helpers/api-client.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;
let api: ApiClient;

describe('concurrency: sequence race conditions', () => {
  beforeAll(async () => {
    const db = createTestDb();
    await resetDatabase(db);
    await db.destroy();
    bootResult = await bootErpApp({ server: true });
    await bootResult.server!.listen({ port: 0 });
    api = new ApiClient(bootResult);
    await api.login();

    await api.post('/api/sales/customer', {
      name: 'Race Cust',
      email: 'race@seq.com',
    });
  });

  afterAll(async () => {
    if (bootResult.server) await bootResult.server.close();
    if (bootResult.db) await bootResult.db.destroy();
  });

  it('20 concurrent invoice creates produce unique sequence numbers', async () => {
    const listRes = await api.getRaw('/api/sales/customer?filter[email][eq]=race@seq.com');
    const listBody = await listRes.json();
    const customerId = listBody.data[0].id;

    const promises = Array.from({ length: 20 }, () =>
      api.post('/api/sales/invoice', {
        customer: customerId,
        posting_date: '2025-06-15',
      }),
    );
    const results = await Promise.all(promises);
    const successes = results.filter((r) => r.status === 201);
    expect(successes.length).toBe(20);

    const numbers = successes.map((r) => r.data.invoice_number).filter(Boolean);

    if (numbers.length > 0) {
      const uniqueNumbers = new Set(numbers);
      expect(uniqueNumbers.size).toBe(numbers.length);
    }
  });

  it('10 concurrent stock entries produce unique entry_numbers', async () => {
    const wh = await api.post('/api/inventory/warehouse', { name: 'Race WH', code: 'WH-RACE' });
    const cat = await api.post('/api/inventory/category', { name: 'RaceCat' });
    const item = await api.post('/api/inventory/item', {
      name: 'Race Item',
      category: cat.data.id,
    });

    const promises = Array.from({ length: 10 }, () =>
      api.post('/api/inventory/stock_entry', {
        warehouse: wh.data.id,
        item: item.data.id,
        qty: 1,
        entry_type: 'Receipt',
        posting_date: '2025-06-15T10:00:00Z',
      }),
    );
    const results = await Promise.all(promises);
    const successes = results.filter((r) => r.status === 201);
    expect(successes.length).toBe(10);

    const numbers = successes.map((r) => r.data.entry_number).filter(Boolean);

    if (numbers.length > 0) {
      const uniqueNumbers = new Set(numbers);
      expect(uniqueNumbers.size).toBe(numbers.length);
    }
  });
});
