import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import { ApiClient } from '../helpers/api-client.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;
let api: ApiClient;

describe('api-crud: dynamic link (polymorphic)', () => {
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

  it('creates payment referencing an invoice via dynamicLink', async () => {
    const cust = await api.post('/api/sales/customer', {
      name: 'DL Customer',
      email: 'dl@test.com',
    });
    const inv = await api.post('/api/sales/invoice', {
      customer: cust.data.id,
      posting_date: '2025-06-01',
      status: 'Submitted',
    });
    const payment = await api.post('/api/sales/payment', {
      reference_type: 'sales.invoice',
      reference: inv.data.id,
      amount: 1500.0,
      payment_date: '2025-06-15',
      method: 'Bank',
    });
    expect(payment.status).toBe(201);
    expect(payment.data.reference_type).toBe('sales.invoice');
    expect(payment.data.reference).toBe(inv.data.id);
  });

  it('creates journal_entry referencing invoice via dynamicLink', async () => {
    const cust = await api.post('/api/sales/customer', {
      name: 'JE DL Customer',
      email: 'jedl@test.com',
    });
    const inv = await api.post('/api/sales/invoice', {
      customer: cust.data.id,
      posting_date: '2025-07-01',
      status: 'Paid',
    });
    const je = await api.post('/api/accounting/journal_entry', {
      posting_date: '2025-07-01',
      reference_type: 'sales.invoice',
      reference: inv.data.id,
      memo: 'Payment recorded',
    });
    expect(je.status).toBe(201);
    expect(je.data.reference_type).toBe('sales.invoice');
    expect(je.data.reference).toBe(inv.data.id);
  });

  it('dynamicLink can reference different model types', async () => {
    const dept = await api.post('/api/hr/department', { name: 'DL Dept' });
    const emp = await api.post('/api/hr/employee', {
      first_name: 'DL',
      last_name: 'Emp',
      email: 'dlemp@test.com',
      department: dept.data.id,
      hire_date: '2024-01-01',
    });
    const je = await api.post('/api/accounting/journal_entry', {
      posting_date: '2025-08-01',
      reference_type: 'hr.employee',
      reference: emp.data.id,
      memo: 'Salary payment',
    });
    expect(je.status).toBe(201);
    expect(je.data.reference_type).toBe('hr.employee');
    expect(je.data.reference).toBe(emp.data.id);
  });

  it('reads back dynamicLink fields correctly', async () => {
    const cust = await api.post('/api/sales/customer', {
      name: 'ReadBack DL',
      email: 'readbackdl@test.com',
    });
    const inv = await api.post('/api/sales/invoice', {
      customer: cust.data.id,
      posting_date: '2025-09-01',
      status: 'Draft',
    });
    const payment = await api.post('/api/sales/payment', {
      reference_type: 'sales.invoice',
      reference: inv.data.id,
      amount: 200,
      payment_date: '2025-09-05',
      method: 'Cash',
    });

    const fetched = await api.get(`/api/sales/payment/${payment.data.id}`);
    expect(fetched.data.reference_type).toBe('sales.invoice');
    expect(fetched.data.reference).toBe(inv.data.id);
  });
});
