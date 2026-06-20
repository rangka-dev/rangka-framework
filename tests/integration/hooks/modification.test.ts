import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import { ApiClient } from '../helpers/api-client.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;
let api: ApiClient;

describe('hooks: modification', () => {
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

  it('beforeSave hook normalizes email to lowercase', async () => {
    const res = await api.post('/api/sales/customer', {
      name: 'CaseTest',
      email: 'UPPER@Case.COM',
    });
    expect(res.status).toBe(201);
    expect(res.data.email).toBe('upper@case.com');
  });

  it('beforeSave hook trims whitespace from email', async () => {
    const res = await api.post('/api/sales/customer', {
      name: 'TrimTest',
      email: '  spaces@test.com  ',
    });
    expect(res.status).toBe(201);
    expect(res.data.email).toBe('spaces@test.com');
  });

  it('beforeCreate hook sets default status on invoice', async () => {
    const cust = await api.post('/api/sales/customer', {
      name: 'DefaultStatus',
      email: 'defstatus@test.com',
    });
    const inv = await api.post('/api/sales/invoice', {
      customer: cust.data.id,
      posting_date: '2025-01-01',
    });
    expect(inv.status).toBe(201);
    expect(inv.data.status).toBe('Draft');
  });

  it('beforeCreate hook sets default status on leave_request', async () => {
    const dept = await api.post('/api/hr/department', { name: 'ModDept' });
    const emp = await api.post('/api/hr/employee', {
      first_name: 'Mod',
      last_name: 'Hook',
      email: 'modhook@test.com',
      department: dept.data.id,
      hire_date: '2024-01-01',
    });
    const leave = await api.post('/api/hr/leave_request', {
      employee: emp.data.id,
      leave_type: 'Sick',
      start_date: '2025-06-01',
      end_date: '2025-06-03',
    });
    expect(leave.status).toBe(201);
    expect(leave.data.status).toBe('Pending');
  });

  it('beforeSave hook sets is_posted default on journal_entry', async () => {
    const je = await api.post('/api/accounting/journal_entry', {
      posting_date: '2025-01-01',
      memo: 'Modification test',
    });
    expect(je.status).toBe(201);
    expect(je.data.is_posted).toBe(false);
  });
});
