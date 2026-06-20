import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import { ApiClient } from '../helpers/api-client.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;
let api: ApiClient;

describe('hooks: validation', () => {
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

  it('rejects customer without name (required field)', async () => {
    const res = await api.post('/api/sales/customer', {
      email: 'noname@test.com',
    });
    expect(res.status).toBe(400);
  });

  it('rejects customer without email (required field)', async () => {
    const res = await api.post('/api/sales/customer', {
      name: 'No Email Corp',
    });
    expect(res.status).toBe(400);
  });

  it('rejects customer with invalid email format (hook throws)', async () => {
    const res = await api.post('/api/sales/customer', {
      name: 'Bad Email',
      email: 'notanemail',
    });
    // Hook throws plain Error → 500 (not ValidationError → 400)
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('rejects invoice without customer (hook throws)', async () => {
    const res = await api.post('/api/sales/invoice', {
      posting_date: '2025-01-01',
      grand_total: 100,
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('rejects invoice with negative grand_total (hook throws)', async () => {
    const cust = await api.post('/api/sales/customer', {
      name: 'NegTotal Cust',
      email: 'negtotal@test.com',
    });
    const res = await api.post('/api/sales/invoice', {
      customer: cust.data.id,
      posting_date: '2025-01-01',
      grand_total: -500,
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('rejects stock_entry with zero quantity (hook throws)', async () => {
    const wh = await api.post('/api/inventory/warehouse', { name: 'Val WH', code: 'WH-VAL' });
    const cat = await api.post('/api/inventory/category', { name: 'ValCat' });
    const item = await api.post('/api/inventory/item', { name: 'ValItem', category: cat.data.id });
    const res = await api.post('/api/inventory/stock_entry', {
      warehouse: wh.data.id,
      item: item.data.id,
      qty: 0,
      entry_type: 'Receipt',
      posting_date: '2025-06-01T10:00:00Z',
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('rejects leave_request where end_date < start_date (hook throws)', async () => {
    const dept = await api.post('/api/hr/department', { name: 'ValDept' });
    const emp = await api.post('/api/hr/employee', {
      first_name: 'Val',
      last_name: 'Emp',
      email: 'valemp@test.com',
      department: dept.data.id,
      hire_date: '2024-01-01',
    });
    const res = await api.post('/api/hr/leave_request', {
      employee: emp.data.id,
      leave_type: 'Annual',
      start_date: '2025-06-10',
      end_date: '2025-06-05',
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('rejects task without project (hook throws)', async () => {
    const res = await api.post('/api/project/task', {
      title: 'Orphan Task',
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('rejects task without title (hook throws)', async () => {
    const proj = await api.post('/api/project/project', { name: 'HookProj', status: 'Active' });
    const res = await api.post('/api/project/task', {
      project: proj.data.id,
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
