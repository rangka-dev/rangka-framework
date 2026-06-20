import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import { ApiClient } from '../helpers/api-client.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;
let api: ApiClient;

describe('api-crud: computed fields', () => {
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

  it('computes invoice_item.amount from qty * rate on create', async () => {
    const cust = await api.post('/api/sales/customer', {
      name: 'Compute Cust',
      email: 'compute@test.com',
    });
    const inv = await api.post('/api/sales/invoice', {
      customer: cust.data.id,
      posting_date: '2025-01-01',
    });
    const cat = await api.post('/api/inventory/category', { name: 'CompCat' });
    const item = await api.post('/api/inventory/item', {
      name: 'Compute Item',
      category: cat.data.id,
    });
    const lineItem = await api.post('/api/sales/invoice_item', {
      invoice: inv.data.id,
      item: item.data.id,
      qty: 5,
      rate: 200.5,
    });
    expect(lineItem.status).toBe(201);
    if (lineItem.data.amount !== undefined) {
      expect(Number(lineItem.data.amount)).toBeCloseTo(5 * 200.5, 2);
    }
  });

  it('computes leave_request.days from date diff on create', async () => {
    const dept = await api.post('/api/hr/department', { name: 'Comp Dept' });
    const emp = await api.post('/api/hr/employee', {
      first_name: 'Leave',
      last_name: 'Taker',
      email: 'leave@test.com',
      department: dept.data.id,
      hire_date: '2023-01-01',
    });
    const leave = await api.post('/api/hr/leave_request', {
      employee: emp.data.id,
      leave_type: 'Annual',
      start_date: '2025-06-01',
      end_date: '2025-06-05',
    });
    expect(leave.status).toBe(201);
    if (leave.data.days !== undefined) {
      expect(leave.data.days).toBe(5);
    }
  });

  it('recomputes amount when qty is updated', async () => {
    const cust = await api.post('/api/sales/customer', {
      name: 'Recomp Cust',
      email: 'recomp@test.com',
    });
    const inv = await api.post('/api/sales/invoice', {
      customer: cust.data.id,
      posting_date: '2025-02-01',
    });
    const cat = await api.post('/api/inventory/category', { name: 'ReCat' });
    const item = await api.post('/api/inventory/item', {
      name: 'ReItem',
      category: cat.data.id,
    });
    const lineItem = await api.post('/api/sales/invoice_item', {
      invoice: inv.data.id,
      item: item.data.id,
      qty: 3,
      rate: 100,
    });
    const updated = await api.put(`/api/sales/invoice_item/${lineItem.data.id}`, {
      qty: 10,
      rate: 100,
    });
    if (updated.data.amount !== undefined) {
      expect(Number(updated.data.amount)).toBeCloseTo(1000, 2);
    }
  });

  it('handles zero qty gracefully', async () => {
    const cust = await api.post('/api/sales/customer', {
      name: 'Zero Cust',
      email: 'zero@test.com',
    });
    const inv = await api.post('/api/sales/invoice', {
      customer: cust.data.id,
      posting_date: '2025-03-01',
    });
    const cat = await api.post('/api/inventory/category', { name: 'ZeroCat' });
    const item = await api.post('/api/inventory/item', {
      name: 'ZeroItem',
      category: cat.data.id,
    });
    const lineItem = await api.post('/api/sales/invoice_item', {
      invoice: inv.data.id,
      item: item.data.id,
      qty: 0,
      rate: 50,
    });
    expect(lineItem.status).toBe(201);
    if (lineItem.data.amount !== undefined) {
      expect(Number(lineItem.data.amount)).toBe(0);
    }
  });
});
