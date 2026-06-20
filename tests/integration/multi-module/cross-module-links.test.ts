import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import { ApiClient } from '../helpers/api-client.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;
let api: ApiClient;

describe('multi-module: cross-module links', () => {
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

  it('invoice_item links to inventory.item across modules', async () => {
    const cust = await api.post('/api/sales/customer', {
      name: 'CrossMod Cust',
      email: 'crossmod@test.com',
    });
    const inv = await api.post('/api/sales/invoice', {
      customer: cust.data.id,
      posting_date: '2025-06-01',
    });
    const cat = await api.post('/api/inventory/category', { name: 'CrossCat' });
    const item = await api.post('/api/inventory/item', {
      name: 'Cross Item',
      category: cat.data.id,
    });
    const lineItem = await api.post('/api/sales/invoice_item', {
      invoice: inv.data.id,
      item: item.data.id,
      qty: 2,
      rate: 50,
    });
    expect(lineItem.status).toBe(201);
    expect(lineItem.data.item).toBe(item.data.id);
  });

  it('project.project links to hr.employee as manager', async () => {
    const dept = await api.post('/api/hr/department', { name: 'Cross Dept' });
    const emp = await api.post('/api/hr/employee', {
      first_name: 'Cross',
      last_name: 'Manager',
      email: 'crossmgr@test.com',
      department: dept.data.id,
      hire_date: '2023-01-01',
    });
    const proj = await api.post('/api/project/project', {
      name: 'Cross Project',
      manager: emp.data.id,
      status: 'Active',
    });
    expect(proj.status).toBe(201);
    expect(proj.data.manager).toBe(emp.data.id);
  });

  it('project.task links to hr.employee as assigned_to', async () => {
    const dept = await api.post('/api/hr/department', { name: 'TaskLink Dept' });
    const emp = await api.post('/api/hr/employee', {
      first_name: 'Task',
      last_name: 'Worker',
      email: 'taskworker@test.com',
      department: dept.data.id,
      hire_date: '2024-01-01',
    });
    const proj = await api.post('/api/project/project', {
      name: 'TaskLink Project',
      status: 'Active',
    });
    const task = await api.post('/api/project/task', {
      project: proj.data.id,
      title: 'Cross Link Task',
      assigned_to: emp.data.id,
    });
    expect(task.status).toBe(201);
    expect(task.data.assigned_to).toBe(emp.data.id);
  });

  it('project.timesheet links to both project.task and hr.employee', async () => {
    const dept = await api.post('/api/hr/department', { name: 'TS Dept X' });
    const emp = await api.post('/api/hr/employee', {
      first_name: 'TS',
      last_name: 'Linker',
      email: 'tslinker@test.com',
      department: dept.data.id,
      hire_date: '2024-06-01',
    });
    const proj = await api.post('/api/project/project', {
      name: 'TS Link Proj',
      status: 'Active',
    });
    const task = await api.post('/api/project/task', {
      project: proj.data.id,
      title: 'TS Link Task',
    });
    const ts = await api.post('/api/project/timesheet', {
      task: task.data.id,
      employee: emp.data.id,
      hours: 4.5,
      date: '2025-06-10',
    });
    expect(ts.status).toBe(201);
    expect(ts.data.task).toBe(task.data.id);
    expect(ts.data.employee).toBe(emp.data.id);
  });

  it('journal_entry_item links to accounting.account', async () => {
    const acc = await api.post('/api/accounting/account', {
      name: 'CrossAcc',
      account_number: '9001',
      account_type: 'Revenue',
    });
    const je = await api.post('/api/accounting/journal_entry', {
      posting_date: '2025-06-01',
      memo: 'Cross link test',
    });
    const item = await api.post('/api/accounting/journal_entry_item', {
      journal_entry: je.data.id,
      account: acc.data.id,
      debit: 1000,
      credit: 0,
    });
    expect(item.status).toBe(201);
    expect(item.data.account).toBe(acc.data.id);
  });

  it('FK constraint prevents linking to nonexistent cross-module record', async () => {
    const proj = await api.post('/api/project/project', {
      name: 'Bad Link Proj',
      manager: '00000000-0000-0000-0000-000000000099',
      status: 'Active',
    });
    expect(proj.status).toBeGreaterThanOrEqual(400);
  });
});
