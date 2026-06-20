import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import { ApiClient } from '../helpers/api-client.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;
let api: ApiClient;

describe('api-query: includes (eager loading)', () => {
  let customerId: string;
  let invoiceId: string;
  let itemId: string;

  beforeAll(async () => {
    const db = createTestDb();
    await resetDatabase(db);
    await db.destroy();
    bootResult = await bootErpApp({ server: true });
    await bootResult.server!.listen({ port: 0 });
    api = new ApiClient(bootResult);
    await api.login();

    const customerRes = await api.post('/api/sales/customer', {
      name: 'Include Test Corp',
      email: 'include@test.com',
      is_active: true,
      credit_limit: 50000,
    });
    customerId = customerRes.data.id;

    const itemRes = await api.post('/api/inventory/item', {
      name: 'Widget A',
      unit: 'Piece',
      is_stockable: true,
    });
    itemId = itemRes.data.id;

    const invoiceRes = await api.post('/api/sales/invoice', {
      customer: customerId,
      posting_date: '2026-01-15',
      grand_total: 5000,
      status: 'Draft',
    });
    invoiceId = invoiceRes.data.id;

    await api.post('/api/sales/invoice_item', {
      invoice: invoiceId,
      item: itemId,
      qty: 10,
      rate: 500,
      description: 'First item',
    });
    await api.post('/api/sales/invoice_item', {
      invoice: invoiceId,
      item: itemId,
      qty: 5,
      rate: 200,
      description: 'Second item',
    });
  });

  afterAll(async () => {
    if (bootResult.server) await bootResult.server.close();
    if (bootResult.db) await bootResult.db.destroy();
  });

  describe('link (belongs-to)', () => {
    it('resolves a link field to full object on get', async () => {
      const res = await api.get(`/api/sales/invoice/${invoiceId}`, { include: 'customer' });
      expect(res.status).toBe(200);
      expect(res.data.customer).toBeTypeOf('object');
      expect(res.data.customer.id).toBe(customerId);
      expect(res.data.customer.name).toBe('Include Test Corp');
    });

    it('resolves a link field on list', async () => {
      const res = await api.get('/api/sales/invoice', { include: 'customer' });
      expect(res.status).toBe(200);
      const invoice = res.data.find((r: any) => r.id === invoiceId);
      expect(invoice.customer).toBeTypeOf('object');
      expect(invoice.customer.id).toBe(customerId);
    });
  });

  describe('children (one-to-many)', () => {
    it('resolves children as array on get', async () => {
      const res = await api.get(`/api/sales/invoice/${invoiceId}`, { include: 'items' });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.items)).toBe(true);
      expect(res.data.items.length).toBe(2);
      expect(res.data.items[0].invoice).toBe(invoiceId);
    });

    it('returns empty array when no children exist', async () => {
      const emptyInvoice = await api.post('/api/sales/invoice', {
        customer: customerId,
        posting_date: '2026-02-01',
        grand_total: 0,
        status: 'Draft',
      });
      const res = await api.get(`/api/sales/invoice/${emptyInvoice.data.id}`, { include: 'items' });
      expect(res.status).toBe(200);
      expect(res.data.items).toEqual([]);
    });
  });

  describe('multiple includes', () => {
    it('resolves multiple relations in one request', async () => {
      const res = await api.get(`/api/sales/invoice/${invoiceId}`, {
        include: 'customer,items',
      });
      expect(res.status).toBe(200);
      expect(res.data.customer).toBeTypeOf('object');
      expect(res.data.customer.id).toBe(customerId);
      expect(Array.isArray(res.data.items)).toBe(true);
      expect(res.data.items.length).toBe(2);
    });
  });

  describe('nested includes (depth 2)', () => {
    it('resolves nested link on children', async () => {
      const res = await api.get(`/api/sales/invoice/${invoiceId}`, {
        include: 'items.item',
      });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.items)).toBe(true);
      expect(res.data.items[0].item).toBeTypeOf('object');
      expect(res.data.items[0].item.id).toBe(itemId);
      expect(res.data.items[0].item.name).toBe('Widget A');
    });
  });

  describe('manyToMany', () => {
    let tagId1: string;
    let tagId2: string;

    beforeAll(async () => {
      const tag1 = await api.post('/api/sales/sales_tag', { name: 'VIP', color: '#ff0000' });
      tagId1 = tag1.data.id;
      const tag2 = await api.post('/api/sales/sales_tag', { name: 'Priority', color: '#00ff00' });
      tagId2 = tag2.data.id;

      // Insert junction records via raw SQL
      const kysely = bootResult.db!.kysely;
      await kysely
        .insertInto('sales__customer_tag')
        .values({ customer_id: customerId, sales_tag_id: tagId1 })
        .execute();
      await kysely
        .insertInto('sales__customer_tag')
        .values({ customer_id: customerId, sales_tag_id: tagId2 })
        .execute();
    });

    it('resolves manyToMany through junction table', async () => {
      const res = await api.get(`/api/sales/customer/${customerId}`, { include: 'tags' });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.tags)).toBe(true);
      expect(res.data.tags.length).toBe(2);
      const tagNames = res.data.tags.map((t: any) => t.name);
      expect(tagNames).toContain('VIP');
      expect(tagNames).toContain('Priority');
    });

    it('returns empty array when no associations', async () => {
      const loneCustomer = await api.post('/api/sales/customer', {
        name: 'Lone Customer',
        email: 'lone@test.com',
        is_active: true,
        credit_limit: 1000,
      });
      const res = await api.get(`/api/sales/customer/${loneCustomer.data.id}`, { include: 'tags' });
      expect(res.status).toBe(200);
      expect(res.data.tags).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('rejects unknown relation name', async () => {
      const res = await api.get(`/api/sales/invoice/${invoiceId}`, {
        include: 'nonexistent',
      });
      expect(res.status).toBe(400);
    });

    it('rejects depth > 2', async () => {
      const res = await api.get(`/api/sales/invoice/${invoiceId}`, {
        include: 'items.item.category',
      });
      expect(res.status).toBe(400);
    });
  });
});
