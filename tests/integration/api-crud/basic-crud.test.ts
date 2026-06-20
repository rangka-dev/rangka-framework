import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import { ApiClient } from '../helpers/api-client.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;
let api: ApiClient;

describe('api-crud: basic CRUD operations', () => {
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

  describe('CREATE', () => {
    it('creates a customer with all fields', async () => {
      const res = await api.post('/api/sales/customer', {
        name: 'Acme Corp',
        email: 'acme@test.com',
        phone: '+1-555-0100',
        is_active: true,
        credit_limit: 50000.5,
        notes: 'VIP customer',
        metadata: { tier: 'gold', region: 'us-east' },
      });
      expect(res.status).toBe(201);
      expect(res.data.id).toBeDefined();
      expect(res.data.name).toBe('Acme Corp');
      expect(res.data.email).toBe('acme@test.com');
      expect(res.data.is_active).toBe(true);
      expect(res.data.metadata).toEqual({ tier: 'gold', region: 'us-east' });
    });

    it('creates a warehouse', async () => {
      const res = await api.post('/api/inventory/warehouse', {
        name: 'Main Warehouse',
        code: 'WH-001',
        is_active: true,
        address: { city: 'Jakarta', zip: '10110' },
      });
      expect(res.status).toBe(201);
      expect(res.data.code).toBe('WH-001');
      expect(res.data.address).toEqual({ city: 'Jakarta', zip: '10110' });
    });

    it('creates a department', async () => {
      const res = await api.post('/api/hr/department', { name: 'Engineering' });
      expect(res.status).toBe(201);
      expect(res.data.name).toBe('Engineering');
    });

    it('creates an employee linked to department', async () => {
      const dept = await api.post('/api/hr/department', { name: 'Sales Dept' });
      const res = await api.post('/api/hr/employee', {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@test.com',
        department: dept.data.id,
        hire_date: '2024-01-15',
      });
      expect(res.status).toBe(201);
      expect(res.data.department).toBe(dept.data.id);
    });

    it('creates an account (closure_table tree)', async () => {
      const res = await api.post('/api/accounting/account', {
        name: 'Assets',
        account_number: '1000',
        account_type: 'Asset',
        is_group: true,
      });
      expect(res.status).toBe(201);
      expect(res.data.account_type).toBe('Asset');
    });

    it('rejects creation with missing required fields', async () => {
      const res = await api.post('/api/sales/customer', { phone: '555-0000' });
      expect(res.status).toBe(400);
      expect(res.error.message).toContain('name');
    });

    it('rejects creation with invalid enum value at DB level', async () => {
      const cust = await api.post('/api/sales/customer', {
        name: 'Bad Status Co',
        email: 'badstatus@test.com',
      });
      const res = await api.post('/api/sales/invoice', {
        customer: cust.data.id,
        posting_date: '2025-01-01',
        status: 'InvalidStatus',
      });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('READ', () => {
    it('gets a single record by id', async () => {
      const created = await api.post('/api/inventory/warehouse', {
        name: 'Read Test WH',
        code: 'WH-READ',
        is_active: true,
      });
      const res = await api.get(`/api/inventory/warehouse/${created.data.id}`);
      expect(res.status).toBe(200);
      expect(res.data.name).toBe('Read Test WH');
    });

    it('returns 404 for non-existent id', async () => {
      const res = await api.get('/api/sales/customer/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });

    it('lists records with pagination metadata', async () => {
      const res = await api.get('/api/sales/customer');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.meta).toBeDefined();
      expect(res.meta.total).toBeGreaterThanOrEqual(0);
      expect(res.meta.page).toBeDefined();
      expect(res.meta.limit).toBeDefined();
    });
  });

  describe('UPDATE', () => {
    it('updates a record', async () => {
      const created = await api.post('/api/sales/customer', {
        name: 'Update Me',
        email: 'updateme@test.com',
      });
      const res = await api.put(`/api/sales/customer/${created.data.id}`, {
        name: 'Updated Name',
        email: 'updateme@test.com',
        credit_limit: 99999,
      });
      expect(res.status).toBe(200);
      expect(res.data.name).toBe('Updated Name');
    });

    it('returns 404 when updating non-existent record', async () => {
      const res = await api.put('/api/sales/customer/00000000-0000-0000-0000-000000000000', {
        name: 'Ghost',
        email: 'ghost@test.com',
      });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE', () => {
    it('deletes a record', async () => {
      const created = await api.post('/api/inventory/warehouse', {
        name: 'Delete Me WH',
        code: 'WH-DEL',
        is_active: false,
      });
      expect(created.status).toBe(201);
      const res = await api.delete(`/api/inventory/warehouse/${created.data.id}`);
      expect(res.status).toBe(204);

      const getRes = await api.get(`/api/inventory/warehouse/${created.data.id}`);
      expect(getRes.status).toBe(404);
    });

    it('returns 404 when deleting non-existent record', async () => {
      const res = await api.delete('/api/inventory/warehouse/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });
  });
});
