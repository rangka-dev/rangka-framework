import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import { ApiClient } from '../helpers/api-client.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;
let api: ApiClient;

describe('api-crud: cascade delete children', () => {
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

  it('deletes children when parent is deleted', async () => {
    const cust = await api.post('/api/sales/customer', {
      name: 'Cascade Cust',
      email: 'cascade@test.com',
    });
    const inv = await api.post('/api/sales/invoice', {
      customer: cust.data.id,
      posting_date: '2025-01-01',
    });
    const category = await api.post('/api/inventory/category', { name: 'CascadeCat' });
    const item = await api.post('/api/inventory/item', {
      name: 'Cascade Item',
      category: category.data.id,
    });

    // Create children
    const lineItem1 = await api.post('/api/sales/invoice_item', {
      invoice: inv.data.id,
      item: item.data.id,
      qty: 2,
      rate: 50,
    });
    const lineItem2 = await api.post('/api/sales/invoice_item', {
      invoice: inv.data.id,
      item: item.data.id,
      qty: 3,
      rate: 75,
    });
    expect(lineItem1.status).toBe(201);
    expect(lineItem2.status).toBe(201);

    // Delete parent
    const deleteRes = await api.delete(`/api/sales/invoice/${inv.data.id}`);
    expect(deleteRes.status).toBe(204);

    // Children should be gone
    const child1 = await api.get(`/api/sales/invoice_item/${lineItem1.data.id}`);
    expect(child1.status).toBe(404);

    const child2 = await api.get(`/api/sales/invoice_item/${lineItem2.data.id}`);
    expect(child2.status).toBe(404);
  });

  it('does not delete children of other parents', async () => {
    const cust = await api.post('/api/sales/customer', {
      name: 'Multi Parent',
      email: 'multiparent@test.com',
    });
    const inv1 = await api.post('/api/sales/invoice', {
      customer: cust.data.id,
      posting_date: '2025-02-01',
    });
    const inv2 = await api.post('/api/sales/invoice', {
      customer: cust.data.id,
      posting_date: '2025-02-02',
    });
    const category = await api.post('/api/inventory/category', { name: 'MultiCat' });
    const item = await api.post('/api/inventory/item', {
      name: 'Multi Item',
      category: category.data.id,
    });

    // Children on inv1
    await api.post('/api/sales/invoice_item', {
      invoice: inv1.data.id,
      item: item.data.id,
      qty: 1,
      rate: 10,
    });

    // Children on inv2
    const inv2Item = await api.post('/api/sales/invoice_item', {
      invoice: inv2.data.id,
      item: item.data.id,
      qty: 5,
      rate: 20,
    });

    // Delete inv1 only
    await api.delete(`/api/sales/invoice/${inv1.data.id}`);

    // inv2's children should still exist
    const remaining = await api.get(`/api/sales/invoice_item/${inv2Item.data.id}`);
    expect(remaining.status).toBe(200);
    expect(remaining.data.id).toBe(inv2Item.data.id);
  });
});
