import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import { ApiClient } from '../helpers/api-client.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;
let api: ApiClient;

describe('api-crud: relationships', () => {
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

  it('creates invoice linked to customer (same module FK)', async () => {
    const cust = await api.post('/api/sales/customer', {
      name: 'Rel Customer',
      email: 'rel@test.com',
    });
    const inv = await api.post('/api/sales/invoice', {
      customer: cust.data.id,
      posting_date: '2025-06-01',
      status: 'Draft',
    });
    expect(inv.status).toBe(201);
    expect(inv.data.customer).toBe(cust.data.id);
  });

  it('rejects invoice with invalid customer FK', async () => {
    const res = await api.post('/api/sales/invoice', {
      customer: '00000000-0000-0000-0000-000000000099',
      posting_date: '2025-06-01',
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('creates invoice_item linking invoice and inventory.item (cross-module)', async () => {
    const cust = await api.post('/api/sales/customer', {
      name: 'Item Cust',
      email: 'itemcust@test.com',
    });
    const inv = await api.post('/api/sales/invoice', {
      customer: cust.data.id,
      posting_date: '2025-06-01',
      status: 'Draft',
    });
    const category = await api.post('/api/inventory/category', { name: 'TestCat' });
    const item = await api.post('/api/inventory/item', {
      name: 'Widget',
      category: category.data.id,
      unit: 'Piece',
    });
    const lineItem = await api.post('/api/sales/invoice_item', {
      invoice: inv.data.id,
      item: item.data.id,
      qty: 5,
      rate: 100.5,
    });
    expect(lineItem.status).toBe(201);
    expect(lineItem.data.invoice).toBe(inv.data.id);
    expect(lineItem.data.item).toBe(item.data.id);
  });

  it('creates employee linked to department', async () => {
    const dept = await api.post('/api/hr/department', { name: 'RelTest Dept' });
    const emp = await api.post('/api/hr/employee', {
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@test.com',
      department: dept.data.id,
      hire_date: '2023-03-01',
    });
    expect(emp.status).toBe(201);
    expect(emp.data.department).toBe(dept.data.id);
  });

  it('creates project linked to hr.employee (cross-module manager)', async () => {
    const dept = await api.post('/api/hr/department', { name: 'PM Dept' });
    const emp = await api.post('/api/hr/employee', {
      first_name: 'Manager',
      last_name: 'One',
      email: 'manager1@test.com',
      department: dept.data.id,
      hire_date: '2022-01-01',
    });
    const proj = await api.post('/api/project/project', {
      name: 'Alpha Project',
      manager: emp.data.id,
      status: 'Planning',
    });
    expect(proj.status).toBe(201);
    expect(proj.data.manager).toBe(emp.data.id);
  });

  it('creates timesheet linking task and employee (multi cross-module)', async () => {
    const dept = await api.post('/api/hr/department', { name: 'TS Dept' });
    const emp = await api.post('/api/hr/employee', {
      first_name: 'Worker',
      last_name: 'Bee',
      email: 'worker@test.com',
      department: dept.data.id,
      hire_date: '2023-06-01',
    });
    const proj = await api.post('/api/project/project', {
      name: 'TS Project',
      status: 'Active',
    });
    const task = await api.post('/api/project/task', {
      project: proj.data.id,
      title: 'TS Task',
      assigned_to: emp.data.id,
    });
    const ts = await api.post('/api/project/timesheet', {
      task: task.data.id,
      employee: emp.data.id,
      hours: 8.5,
      date: '2025-06-10',
    });
    expect(ts.status).toBe(201);
    expect(ts.data.task).toBe(task.data.id);
    expect(ts.data.employee).toBe(emp.data.id);
  });

  it('creates tree hierarchy (category parent-child)', async () => {
    const parent = await api.post('/api/inventory/category', { name: 'TreeParent' });
    const child = await api.post('/api/inventory/category', {
      name: 'TreeChild',
      parent: parent.data.id,
    });
    expect(child.status).toBe(201);
    expect(child.data.parent).toBe(parent.data.id);
  });

  it('rejects self-referencing FK with non-existent parent', async () => {
    const res = await api.post('/api/inventory/category', {
      name: 'Orphan Child',
      parent: '00000000-0000-0000-0000-000000000099',
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
