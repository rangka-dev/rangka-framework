import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import { ApiClient } from '../helpers/api-client.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;
let api: ApiClient;

describe('api-crud: sequence fields', () => {
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

  it('auto-generates invoice_number with prefix and digits', async () => {
    const cust = await api.post('/api/sales/customer', {
      name: 'Seq Cust',
      email: 'seq@test.com',
    });
    const inv1 = await api.post('/api/sales/invoice', {
      customer: cust.data.id,
      posting_date: '2025-01-01',
    });
    expect(inv1.status).toBe(201);
    expect(inv1.data.invoice_number).toMatch(/^INV-\d{5}$/);
  });

  it('generates sequential numbers for multiple records', async () => {
    const cust = await api.post('/api/sales/customer', {
      name: 'Multi Seq',
      email: 'multiseq@test.com',
    });
    const inv1 = await api.post('/api/sales/invoice', {
      customer: cust.data.id,
      posting_date: '2025-01-01',
    });
    const inv2 = await api.post('/api/sales/invoice', {
      customer: cust.data.id,
      posting_date: '2025-01-02',
    });
    const num1 = parseInt(inv1.data.invoice_number.replace('INV-', ''));
    const num2 = parseInt(inv2.data.invoice_number.replace('INV-', ''));
    expect(num2).toBe(num1 + 1);
  });

  it('generates employee_id sequence with EMP- prefix', async () => {
    const dept = await api.post('/api/hr/department', { name: 'Seq Dept' });
    const emp = await api.post('/api/hr/employee', {
      first_name: 'Seq',
      last_name: 'Emp',
      email: 'seqemp@test.com',
      department: dept.data.id,
      hire_date: '2024-01-01',
    });
    expect(emp.status).toBe(201);
    expect(emp.data.employee_id).toMatch(/^EMP-\d{4}$/);
  });

  it('generates project code sequence with PRJ- prefix', async () => {
    const proj = await api.post('/api/project/project', {
      name: 'Seq Project',
      status: 'Planning',
    });
    expect(proj.status).toBe(201);
    expect(proj.data.code).toMatch(/^PRJ-\d{4}$/);
  });

  it('generates different sequence counters per model', async () => {
    const wh = await api.post('/api/inventory/warehouse', {
      name: 'Seq WH',
      code: 'WH-SEQ',
    });
    const cat = await api.post('/api/inventory/category', { name: 'SeqCat' });
    const item = await api.post('/api/inventory/item', {
      name: 'Seq Item',
      category: cat.data.id,
    });
    const ste = await api.post('/api/inventory/stock_entry', {
      warehouse: wh.data.id,
      item: item.data.id,
      qty: 5,
      entry_type: 'Receipt',
      posting_date: '2025-06-01T10:00:00Z',
    });
    expect(ste.data.entry_number).toMatch(/^STE-\d{5}$/);
  });
});
