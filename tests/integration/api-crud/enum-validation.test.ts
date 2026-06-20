import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import { ApiClient } from '../helpers/api-client.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;
let api: ApiClient;

describe('api-crud: enum validation', () => {
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

  it('accepts valid enum value for invoice status', async () => {
    const cust = await api.post('/api/sales/customer', {
      name: 'Enum Cust',
      email: 'enum@test.com',
    });
    const res = await api.post('/api/sales/invoice', {
      customer: cust.data.id,
      posting_date: '2025-01-01',
      status: 'Submitted',
    });
    expect(res.status).toBe(201);
    expect(res.data.status).toBe('Submitted');
  });

  it('rejects invalid enum value for invoice status', async () => {
    const cust = await api.post('/api/sales/customer', {
      name: 'Bad Enum Cust',
      email: 'badenum@test.com',
    });
    const res = await api.post('/api/sales/invoice', {
      customer: cust.data.id,
      posting_date: '2025-01-01',
      status: 'NotAValidStatus',
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('accepts valid enum value for payment method', async () => {
    const cust = await api.post('/api/sales/customer', {
      name: 'Pay Cust',
      email: 'paycust@test.com',
    });
    const inv = await api.post('/api/sales/invoice', {
      customer: cust.data.id,
      posting_date: '2025-01-01',
    });
    const res = await api.post('/api/sales/payment', {
      reference_type: 'sales.invoice',
      reference: inv.data.id,
      amount: 100,
      payment_date: '2025-01-05',
      method: 'Cash',
    });
    expect(res.status).toBe(201);
  });

  it('rejects invalid enum value for payment method', async () => {
    const cust = await api.post('/api/sales/customer', {
      name: 'BadPay Cust',
      email: 'badpay@test.com',
    });
    const inv = await api.post('/api/sales/invoice', {
      customer: cust.data.id,
      posting_date: '2025-01-01',
    });
    const res = await api.post('/api/sales/payment', {
      reference_type: 'sales.invoice',
      reference: inv.data.id,
      amount: 100,
      payment_date: '2025-01-05',
      method: 'Bitcoin',
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('accepts valid enum for stock entry type', async () => {
    const wh = await api.post('/api/inventory/warehouse', {
      name: 'Enum WH',
      code: 'WH-ENUM',
    });
    const cat = await api.post('/api/inventory/category', { name: 'EnumCat' });
    const item = await api.post('/api/inventory/item', {
      name: 'Enum Item',
      category: cat.data.id,
    });
    const res = await api.post('/api/inventory/stock_entry', {
      warehouse: wh.data.id,
      item: item.data.id,
      qty: 10,
      entry_type: 'Receipt',
      posting_date: '2025-06-01T10:00:00Z',
    });
    expect(res.status).toBe(201);
  });

  it('rejects invalid enum for stock entry type', async () => {
    const wh = await api.post('/api/inventory/warehouse', {
      name: 'Enum WH2',
      code: 'WH-ENUM2',
    });
    const cat = await api.post('/api/inventory/category', { name: 'EnumCat2' });
    const item = await api.post('/api/inventory/item', {
      name: 'Enum Item2',
      category: cat.data.id,
    });
    const res = await api.post('/api/inventory/stock_entry', {
      warehouse: wh.data.id,
      item: item.data.id,
      qty: 10,
      entry_type: 'Donate',
      posting_date: '2025-06-01T10:00:00Z',
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('accepts all valid task priority values', async () => {
    const proj = await api.post('/api/project/project', {
      name: 'Enum Project',
      status: 'Active',
    });
    for (const priority of ['Low', 'Medium', 'High', 'Critical']) {
      const res = await api.post('/api/project/task', {
        project: proj.data.id,
        title: `Task ${priority}`,
        priority,
      });
      expect(res.status).toBe(201);
    }
  });

  it('rejects invalid task priority', async () => {
    const proj = await api.post('/api/project/project', {
      name: 'Enum Project 2',
      status: 'Active',
    });
    const res = await api.post('/api/project/task', {
      project: proj.data.id,
      title: 'Bad Priority',
      priority: 'Urgent',
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
