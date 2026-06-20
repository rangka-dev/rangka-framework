import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import { ApiClient } from '../helpers/api-client.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;
let api: ApiClient;

describe('api-crud: soft delete', () => {
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

  describe('trait declarations', () => {
    it('customer model has soft_delete trait declared', () => {
      const model = bootResult.registry.getModel('sales.customer');
      expect(model).toBeDefined();
      expect(model!.traits).toContain('soft_delete');
    });

    it('employee model has soft_delete trait declared', () => {
      const model = bootResult.registry.getModel('hr.employee');
      expect(model).toBeDefined();
      expect(model!.traits).toContain('soft_delete');
    });

    it('item model has soft_delete trait declared', () => {
      const model = bootResult.registry.getModel('inventory.item');
      expect(model).toBeDefined();
      expect(model!.traits).toContain('soft_delete');
    });

    it('warehouse model does NOT have soft_delete trait', () => {
      const model = bootResult.registry.getModel('inventory.warehouse');
      expect(model).toBeDefined();
      expect(model!.traits).not.toContain('soft_delete');
    });
  });

  describe('DELETE sets archived_at instead of hard-deleting', () => {
    let customerId: string;

    it('creates a customer', async () => {
      const res = await api.post('/api/sales/customer', {
        name: 'SoftDel Corp',
        email: 'softdel@test.com',
      });
      expect(res.status).toBe(201);
      customerId = res.data.id;
      expect(res.data.archived_at).toBeNull();
    });

    it('DELETE returns 204', async () => {
      const res = await api.delete(`/api/sales/customer/${customerId}`);
      expect(res.status).toBe(204);
    });

    it('GET returns 404 for archived record', async () => {
      const res = await api.get(`/api/sales/customer/${customerId}`);
      expect(res.status).toBe(404);
    });

    it('record still exists in DB with archived_at set (via includeArchived)', async () => {
      const res = await api.get('/api/sales/customer', { includeArchived: 'true' });
      expect(res.status).toBe(200);
      const archived = res.data.find((r: any) => r.id === customerId);
      expect(archived).toBeDefined();
      expect(archived.archived_at).not.toBeNull();
    });

    it('DELETE on already-archived record returns 404', async () => {
      const res = await api.delete(`/api/sales/customer/${customerId}`);
      expect(res.status).toBe(404);
    });
  });

  describe('LIST excludes archived records by default', () => {
    let activeId: string;
    let archivedId: string;

    beforeAll(async () => {
      const active = await api.post('/api/sales/customer', {
        name: 'Active Customer',
        email: 'active@test.com',
      });
      activeId = active.data.id;

      const toArchive = await api.post('/api/sales/customer', {
        name: 'To Archive',
        email: 'archive@test.com',
      });
      archivedId = toArchive.data.id;
      const delRes = await api.delete(`/api/sales/customer/${archivedId}`);
      if (delRes.status !== 204) {
        throw new Error(
          `DELETE failed with status ${delRes.status}: ${JSON.stringify(delRes.error)}`,
        );
      }
    });

    it('list excludes archived records', async () => {
      const res = await api.get('/api/sales/customer');
      expect(res.status).toBe(200);
      const ids = res.data.map((r: any) => r.id);
      expect(ids).toContain(activeId);
      expect(ids).not.toContain(archivedId);
    });

    it('list with includeArchived=true returns all records', async () => {
      const res = await api.get('/api/sales/customer', { includeArchived: 'true' });
      expect(res.status).toBe(200);
      const ids = res.data.map((r: any) => r.id);
      expect(ids).toContain(activeId);
      expect(ids).toContain(archivedId);
    });

    it('pagination meta excludes archived count by default', async () => {
      const defaultRes = await api.get('/api/sales/customer');
      const allRes = await api.get('/api/sales/customer', { includeArchived: 'true' });
      expect(allRes.meta.total).toBeGreaterThan(defaultRes.meta.total);
    });
  });

  describe('hard delete still works for models without soft_delete', () => {
    let warehouseId: string;

    it('creates a warehouse (no soft_delete trait)', async () => {
      const res = await api.post('/api/inventory/warehouse', {
        name: 'Temp Warehouse',
        code: 'WH-DEL',
        is_active: true,
      });
      expect(res.status).toBe(201);
      warehouseId = res.data.id;
    });

    it('DELETE hard-deletes the record', async () => {
      const res = await api.delete(`/api/inventory/warehouse/${warehouseId}`);
      expect(res.status).toBe(204);
    });

    it('GET returns 404 — record is permanently gone', async () => {
      const res = await api.get(`/api/inventory/warehouse/${warehouseId}`);
      expect(res.status).toBe(404);
    });
  });
});
