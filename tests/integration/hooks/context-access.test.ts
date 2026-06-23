import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import { ApiClient } from '../helpers/api-client.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;
let api: ApiClient;

describe('hooks: ctx.models and ctx.db in transaction context', () => {
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

  describe('ctx.models usage in hooks', () => {
    it('afterCreate hook can update related records via ctx.models', async () => {
      const wh = await api.post('/api/inventory/warehouse', {
        name: 'Hook WH',
        code: 'HWH-001',
        is_active: true,
      });
      const item = await api.post('/api/inventory/item', {
        name: 'Hook Item',
      });

      await api.post('/api/inventory/stock_entry', {
        warehouse: wh.data.id,
        item: item.data.id,
        qty: 50,
        entry_type: 'Receipt',
        posting_date: '2025-01-01T00:00:00Z',
      });

      const updated = await api.get(`/api/inventory/item/${item.data.id}`);
      expect(updated.data.description).toContain('Last stocked: qty 50');
    });

    it('ctx.models in hook shares transaction — rolls back on hook failure', async () => {
      const wh = await api.post('/api/inventory/warehouse', {
        name: 'Rollback WH',
        code: 'RWH-001',
        is_active: true,
      });
      const item = await api.post('/api/inventory/item', {
        name: 'Rollback Item',
        description: 'original',
      });

      const res = await api.post('/api/inventory/stock_entry', {
        warehouse: wh.data.id,
        item: item.data.id,
        qty: -1,
      });
      expect(res.status).toBe(400);

      const unchanged = await api.get(`/api/inventory/item/${item.data.id}`);
      expect(unchanged.data.description).toBe('original');
    });
  });

  describe('ctx.db usage in hooks', () => {
    it('afterDelete hook can update records via ctx.db with internal table names', async () => {
      const wh = await api.post('/api/inventory/warehouse', {
        name: 'CtxDb WH',
        code: 'CDB-001',
        is_active: true,
      });
      const item = await api.post('/api/inventory/item', {
        name: 'CtxDb Item',
        description: 'before delete',
      });

      const entry = await api.post('/api/inventory/stock_entry', {
        warehouse: wh.data.id,
        item: item.data.id,
        qty: 10,
        entry_type: 'Receipt',
        posting_date: '2025-01-01T00:00:00Z',
      });

      await api.delete(`/api/inventory/stock_entry/${entry.data.id}`);

      const updated = await api.get(`/api/inventory/item/${item.data.id}`);
      expect(updated.data.description).toBe('Stock entry removed');
    });
  });

  describe('transaction integrity', () => {
    it('hook validation failure prevents the write entirely', async () => {
      const wh = await api.post('/api/inventory/warehouse', {
        name: 'NoWrite WH',
        code: 'NW-001',
        is_active: true,
      });
      const item = await api.post('/api/inventory/item', { name: 'NoWrite Item' });

      const res = await api.post('/api/inventory/stock_entry', {
        warehouse: wh.data.id,
        item: item.data.id,
        qty: 0,
      });
      expect(res.status).toBe(400);

      const ctx = bootResult.frameworkContext!;
      const entries = await ctx.models
        .query('inventory.stock_entry')
        .filter({ warehouse: wh.data.id, item: item.data.id })
        .exec();
      expect(entries.data).toHaveLength(0);
    });

    it('ctx.models.transaction works inside ctx provided to services', async () => {
      const ctx = bootResult.frameworkContext!;

      const dept = await ctx.models.create('hr.department', { name: 'TxSvc Dept' });
      expect(dept.id).toBeDefined();

      await ctx.models.transaction(async (tx) => {
        const emp1 = await tx.create('hr.employee', {
          first_name: 'Tx1',
          last_name: 'Svc1',
          email: 'txsvc1@test.com',
          department: dept.id,
          hire_date: '2024-01-01',
        });
        const emp2 = await tx.create('hr.employee', {
          first_name: 'Tx2',
          last_name: 'Svc2',
          email: 'txsvc2@test.com',
          department: dept.id,
          hire_date: '2024-01-01',
        });
        expect(emp1.id).toBeDefined();
        expect(emp2.id).toBeDefined();
      });

      const result = await ctx.models
        .query('hr.employee')
        .filter({ department: dept.id as string })
        .exec();
      expect(result.data).toHaveLength(2);
    });

    it('ctx.models.transaction rolls back all ops on failure', async () => {
      const ctx = bootResult.frameworkContext!;
      const dept = await ctx.models.create('hr.department', { name: 'TxFail Dept' });

      try {
        await ctx.models.transaction(async (tx) => {
          await tx.create('hr.employee', {
            first_name: 'Fail1',
            last_name: 'Rollback',
            email: 'txfail1@test.com',
            department: dept.id,
            hire_date: '2024-01-01',
          });
          throw new Error('Simulated failure');
        });
      } catch {
        // expected
      }

      const result = await ctx.models
        .query('hr.employee')
        .filter({ email: 'txfail1@test.com' })
        .exec();
      expect(result.data).toHaveLength(0);
    });

    it('ctx.db operations in hook share same transaction as the write', async () => {
      const wh = await api.post('/api/inventory/warehouse', {
        name: 'SharedTx WH',
        code: 'STX-001',
        is_active: true,
      });
      const item = await api.post('/api/inventory/item', {
        name: 'SharedTx Item',
        description: 'initial',
      });

      const entry = await api.post('/api/inventory/stock_entry', {
        warehouse: wh.data.id,
        item: item.data.id,
        qty: 25,
        entry_type: 'Receipt',
        posting_date: '2025-01-01T00:00:00Z',
      });
      expect(entry.status).toBe(201);

      const afterCreate = await api.get(`/api/inventory/item/${item.data.id}`);
      expect(afterCreate.data.description).toContain('Last stocked: qty 25');

      await api.delete(`/api/inventory/stock_entry/${entry.data.id}`);

      const afterDelete = await api.get(`/api/inventory/item/${item.data.id}`);
      expect(afterDelete.data.description).toBe('Stock entry removed');
    });
  });
});
