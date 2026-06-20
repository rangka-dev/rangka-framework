import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import { ApiClient } from '../helpers/api-client.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;
let api: ApiClient;

describe('api-crud: money fields', () => {
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

  it('stores money field value in primary column', async () => {
    const cust = await api.post('/api/sales/customer', {
      name: 'Money Cust',
      email: 'money@test.com',
    });
    const inv = await api.post('/api/sales/invoice', {
      customer: cust.data.id,
      posting_date: '2025-01-01',
      grand_total: 12345.678901,
      status: 'Draft',
    });
    expect(inv.status).toBe(201);
    expect(Number(inv.data.grand_total)).toBeCloseTo(12345.678901, 4);
  });

  it('stores employee salary as money (dual columns)', async () => {
    const dept = await api.post('/api/hr/department', { name: 'Money Dept' });
    const emp = await api.post('/api/hr/employee', {
      first_name: 'Rich',
      last_name: 'Person',
      email: 'rich@test.com',
      department: dept.data.id,
      hire_date: '2024-01-01',
      salary: 75000.5,
    });
    expect(emp.status).toBe(201);
    expect(Number(emp.data.salary)).toBeCloseTo(75000.5, 2);
  });

  it('stores project budget as money', async () => {
    const proj = await api.post('/api/project/project', {
      name: 'Budget Project',
      budget: 250000.0,
      status: 'Planning',
    });
    expect(proj.status).toBe(201);
    expect(Number(proj.data.budget)).toBeCloseTo(250000.0, 2);
  });

  it('stores journal entry item debit/credit as money', async () => {
    const acc = await api.post('/api/accounting/account', {
      name: 'Cash Account',
      account_number: '1100',
      account_type: 'Asset',
    });
    const je = await api.post('/api/accounting/journal_entry', {
      posting_date: '2025-03-01',
      memo: 'Money test',
    });
    const item = await api.post('/api/accounting/journal_entry_item', {
      journal_entry: je.data.id,
      account: acc.data.id,
      debit: 5000.123456,
      credit: 0,
    });
    expect(item.status).toBe(201);
    expect(Number(item.data.debit)).toBeCloseTo(5000.123456, 4);
  });
});
