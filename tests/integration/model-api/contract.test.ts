import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import type { BootResult } from '@rangka/core';
import type { ModelAccessInterface } from '@rangka/shared';

let bootResult: BootResult;
let models: ModelAccessInterface;

describe('model-api: contract tests against PostgreSQL', () => {
  beforeAll(async () => {
    const db = createTestDb();
    await resetDatabase(db);
    await db.destroy();
    bootResult = await bootErpApp();
    models = bootResult.frameworkContext!.models;
  });

  afterAll(async () => {
    if (bootResult.db) await bootResult.db.destroy();
  });

  beforeEach(async () => {
    const db = bootResult.frameworkContext!.db;
    await db.deleteFrom('sales__customer').execute();
    await db.deleteFrom('hr__department').execute();
  });

  describe('get', () => {
    it('returns record by id', async () => {
      const created = await models.create('hr.department', { name: 'Engineering' });
      const fetched = await models.get('hr.department', created.id as string);
      expect(fetched).not.toBeNull();
      expect(fetched!.name).toBe('Engineering');
    });

    it('returns null for non-existent id', async () => {
      const result = await models.get('hr.department', '00000000-0000-0000-0000-000000000000');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('returns created record with generated id', async () => {
      const record = await models.create('hr.department', { name: 'Sales' });
      expect(record.id).toBeDefined();
      expect(record.name).toBe('Sales');
    });
  });

  describe('update', () => {
    it('returns updated record', async () => {
      const created = await models.create('hr.department', { name: 'Marketing' });
      const updated = await models.update('hr.department', created.id as string, {
        name: 'Marketing & Comms',
      });
      expect(updated.name).toBe('Marketing & Comms');
    });

    it('throws for non-existent id', async () => {
      await expect(
        models.update('hr.department', '00000000-0000-0000-0000-000000000000', { name: 'X' }),
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('returns deleted record', async () => {
      const created = await models.create('hr.department', { name: 'Temp' });
      const deleted = await models.delete('hr.department', created.id as string);
      expect(deleted.name).toBe('Temp');
      const fetched = await models.get('hr.department', created.id as string);
      expect(fetched).toBeNull();
    });

    it('soft-deletes when model has soft_delete trait', async () => {
      const created = await models.create('sales.customer', {
        name: 'SoftDel Co',
        email: 'softdel@test.com',
      });
      await models.delete('sales.customer', created.id as string);

      const fetched = await models.get('sales.customer', created.id as string);
      expect(fetched).toBeNull();

      const db = bootResult.frameworkContext!.db;
      const raw = await db
        .selectFrom('sales__customer')
        .selectAll()
        .where('id', '=', created.id)
        .executeTakeFirst();
      expect(raw).toBeDefined();
      expect(raw.archived_at).not.toBeNull();
    });

    it('throws for non-existent id', async () => {
      await expect(
        models.delete('hr.department', '00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow();
    });
  });

  describe('createMany', () => {
    it('creates all records and returns them', async () => {
      const items = [{ name: 'Dept A' }, { name: 'Dept B' }, { name: 'Dept C' }];
      const created = await models.createMany('hr.department', items);
      expect(created).toHaveLength(3);
      expect(created[0].name).toBe('Dept A');
      expect(created[1].name).toBe('Dept B');
      expect(created[2].name).toBe('Dept C');
      for (const record of created) {
        expect(record.id).toBeDefined();
      }
    });
  });

  describe('query.filter', () => {
    beforeEach(async () => {
      await models.createMany('sales.customer', [
        { name: 'Alpha Corp', email: 'alpha@test.com', credit_limit: 1000, is_active: true },
        { name: 'Beta Inc', email: 'beta@test.com', credit_limit: 5000, is_active: true },
        { name: 'Gamma Ltd', email: 'gamma@test.com', credit_limit: 10000, is_active: false },
        { name: 'Delta Co', email: 'delta@test.com', credit_limit: 500, is_active: true },
      ]);
    });

    it('eq: exact match', async () => {
      const result = await models.query('sales.customer').filter({ name: 'Alpha Corp' }).exec();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Alpha Corp');
    });

    it('neq: excludes value', async () => {
      const result = await models
        .query('sales.customer')
        .filter({ name: { neq: 'Alpha Corp' } })
        .exec();
      expect(result.data.every((r) => r.name !== 'Alpha Corp')).toBe(true);
      expect(result.data.length).toBe(3);
    });

    it('gt/gte/lt/lte: numeric comparison', async () => {
      const gt = await models
        .query('sales.customer')
        .filter({ credit_limit: { gt: 5000 } })
        .exec();
      expect(gt.data).toHaveLength(1);
      expect(gt.data[0].name).toBe('Gamma Ltd');

      const gte = await models
        .query('sales.customer')
        .filter({ credit_limit: { gte: 5000 } })
        .exec();
      expect(gte.data).toHaveLength(2);

      const lt = await models
        .query('sales.customer')
        .filter({ credit_limit: { lt: 1000 } })
        .exec();
      expect(lt.data).toHaveLength(1);
      expect(lt.data[0].name).toBe('Delta Co');

      const lte = await models
        .query('sales.customer')
        .filter({ credit_limit: { lte: 1000 } })
        .exec();
      expect(lte.data).toHaveLength(2);
    });

    it('in: set membership', async () => {
      const result = await models
        .query('sales.customer')
        .filter({ name: { in: ['Alpha Corp', 'Gamma Ltd'] } })
        .exec();
      expect(result.data).toHaveLength(2);
      expect(result.data.map((r) => r.name).sort()).toEqual(['Alpha Corp', 'Gamma Ltd']);
    });

    it('notIn: set exclusion', async () => {
      const result = await models
        .query('sales.customer')
        .filter({ name: { notIn: ['Alpha Corp', 'Gamma Ltd'] } })
        .exec();
      expect(result.data).toHaveLength(2);
      expect(result.data.map((r) => r.name).sort()).toEqual(['Beta Inc', 'Delta Co']);
    });

    it('contains: case-insensitive substring', async () => {
      const result = await models
        .query('sales.customer')
        .filter({ name: { contains: 'corp' } })
        .exec();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Alpha Corp');
    });

    it('startsWith: prefix match', async () => {
      const result = await models
        .query('sales.customer')
        .filter({ name: { startsWith: 'beta' } })
        .exec();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Beta Inc');
    });

    it('endsWith: suffix match', async () => {
      const result = await models
        .query('sales.customer')
        .filter({ name: { endsWith: 'Ltd' } })
        .exec();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Gamma Ltd');
    });

    it('is null', async () => {
      const result = await models
        .query('sales.customer')
        .filter({ notes: { is: null } })
        .exec();
      expect(result.data).toHaveLength(4);
    });

    it('is not_null', async () => {
      await models.create('sales.customer', {
        name: 'Has Notes',
        email: 'notes@test.com',
        notes: 'Some notes here',
      });
      const result = await models
        .query('sales.customer')
        .filter({ notes: { is: 'not_null' } })
        .exec();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Has Notes');
    });

    it('between: inclusive range', async () => {
      const result = await models
        .query('sales.customer')
        .filter({ credit_limit: { between: [1000, 5000] } })
        .exec();
      expect(result.data).toHaveLength(2);
      expect(result.data.map((r) => r.name).sort()).toEqual(['Alpha Corp', 'Beta Inc']);
    });

    it('$or: top-level disjunction', async () => {
      const result = await models
        .query('sales.customer')
        .filter({
          $or: [{ name: 'Alpha Corp' }, { credit_limit: { gte: 10000 } }],
        })
        .exec();
      expect(result.data).toHaveLength(2);
      expect(result.data.map((r) => r.name).sort()).toEqual(['Alpha Corp', 'Gamma Ltd']);
    });

    it('$or with AND groups', async () => {
      const result = await models
        .query('sales.customer')
        .filter({
          $or: [{ is_active: true, credit_limit: { gte: 5000 } }, { is_active: false }],
        })
        .exec();
      expect(result.data).toHaveLength(2);
      expect(result.data.map((r) => r.name).sort()).toEqual(['Beta Inc', 'Gamma Ltd']);
    });

    it('chained filters are AND', async () => {
      const result = await models
        .query('sales.customer')
        .filter({ is_active: true })
        .filter({ credit_limit: { gte: 1000 } })
        .exec();
      expect(result.data).toHaveLength(2);
      expect(result.data.map((r) => r.name).sort()).toEqual(['Alpha Corp', 'Beta Inc']);
    });
  });

  describe('query.sort', () => {
    beforeEach(async () => {
      await models.createMany('hr.department', [
        { name: 'Zeta' },
        { name: 'Alpha' },
        { name: 'Mu' },
      ]);
    });

    it('ascending by field', async () => {
      const result = await models.query('hr.department').sort('name', 'asc').exec();
      expect(result.data.map((r) => r.name)).toEqual(['Alpha', 'Mu', 'Zeta']);
    });

    it('descending by field', async () => {
      const result = await models.query('hr.department').sort('name', 'desc').exec();
      expect(result.data.map((r) => r.name)).toEqual(['Zeta', 'Mu', 'Alpha']);
    });
  });

  describe('query.pagination', () => {
    beforeEach(async () => {
      await models.createMany('hr.department', [
        { name: 'A' },
        { name: 'B' },
        { name: 'C' },
        { name: 'D' },
        { name: 'E' },
      ]);
    });

    it('limit restricts result count', async () => {
      const result = await models.query('hr.department').sort('name').limit(3).exec();
      expect(result.data).toHaveLength(3);
    });

    it('offset skips records', async () => {
      const result = await models.query('hr.department').sort('name').limit(2).offset(2).exec();
      expect(result.data.map((r) => r.name)).toEqual(['C', 'D']);
    });

    it('page calculates offset from limit', async () => {
      const result = await models.query('hr.department').sort('name').limit(2).page(3).exec();
      expect(result.data.map((r) => r.name)).toEqual(['E']);
    });

    it('execWithMeta returns pagination metadata', async () => {
      const result = await models.query('hr.department').limit(2).page(2).execWithMeta();
      expect(result.meta.total).toBe(5);
      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(2);
      expect(result.meta.totalPages).toBe(3);
      expect(result.data).toHaveLength(2);
    });
  });

  describe('query.fields', () => {
    it('returns only specified fields', async () => {
      await models.create('sales.customer', {
        name: 'Selective',
        email: 'selective@test.com',
        credit_limit: 999,
      });
      const result = await models
        .query('sales.customer')
        .filter({ name: 'Selective' })
        .fields(['name'])
        .exec();
      expect(result.data[0].name).toBe('Selective');
      expect(result.data[0].credit_limit).toBeUndefined();
    });

    it('always includes id', async () => {
      await models.create('hr.department', { name: 'WithId' });
      const result = await models
        .query('hr.department')
        .filter({ name: 'WithId' })
        .fields(['name'])
        .exec();
      expect(result.data[0].id).toBeDefined();
    });
  });

  describe('query.search', () => {
    beforeEach(async () => {
      await models.createMany('sales.customer', [
        { name: 'Searchable Corp', email: 'search@test.com' },
        { name: 'Other Company', email: 'other@test.com' },
      ]);
    });

    it('matches across specified fields', async () => {
      const result = await models.query('sales.customer').search('searchable', ['name']).exec();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Searchable Corp');
    });

    it('case-insensitive', async () => {
      const result = await models.query('sales.customer').search('SEARCHABLE', ['name']).exec();
      expect(result.data).toHaveLength(1);
    });
  });

  describe('aggregate', () => {
    beforeEach(async () => {
      await models.createMany('sales.customer', [
        { name: 'A', email: 'a@test.com', credit_limit: 1000, is_active: true },
        { name: 'B', email: 'b@test.com', credit_limit: 2000, is_active: true },
        { name: 'C', email: 'c@test.com', credit_limit: 3000, is_active: false },
        { name: 'D', email: 'd@test.com', credit_limit: 4000, is_active: false },
        { name: 'E', email: 'e@test.com', credit_limit: 5000, is_active: false },
      ]);
    });

    it('sum without groupBy', async () => {
      const result = await models
        .query('sales.customer')
        .aggregate({ sum: 'credit_limit', count: true });
      expect((result as { sum: Record<string, number> }).sum.credit_limit).toBe(15000);
      expect((result as { count: number }).count).toBe(5);
    });

    it('count without groupBy', async () => {
      const result = await models.query('sales.customer').aggregate({ count: true });
      expect((result as { count: number }).count).toBe(5);
    });

    it('groupBy single field', async () => {
      const result = await models
        .query('sales.customer')
        .groupBy('is_active')
        .aggregate({ sum: 'credit_limit', count: true });
      const grouped = result as {
        groups: Array<{
          key: Record<string, unknown>;
          sum?: Record<string, number>;
          count?: number;
        }>;
      };
      expect(grouped.groups).toHaveLength(2);
      const activeGroup = grouped.groups.find((g) => g.key.is_active === true)!;
      const inactiveGroup = grouped.groups.find((g) => g.key.is_active === false)!;
      expect(activeGroup.sum!.credit_limit).toBe(3000);
      expect(activeGroup.count).toBe(2);
      expect(inactiveGroup.sum!.credit_limit).toBe(12000);
      expect(inactiveGroup.count).toBe(3);
    });

    it('respects filters', async () => {
      const result = await models
        .query('sales.customer')
        .filter({ is_active: true })
        .aggregate({ sum: 'credit_limit', count: true });
      expect((result as { sum: Record<string, number> }).sum.credit_limit).toBe(3000);
      expect((result as { count: number }).count).toBe(2);
    });
  });

  describe('updateAll', () => {
    beforeEach(async () => {
      await models.createMany('sales.customer', [
        { name: 'U1', email: 'u1@test.com', credit_limit: 100, is_active: true },
        { name: 'U2', email: 'u2@test.com', credit_limit: 200, is_active: true },
        { name: 'U3', email: 'u3@test.com', credit_limit: 300, is_active: false },
      ]);
    });

    it('updates all matching records', async () => {
      const result = await models
        .query('sales.customer')
        .filter({ is_active: true })
        .updateAll({ credit_limit: 999 });
      expect(result.count).toBe(2);

      const updated = await models.query('sales.customer').filter({ is_active: true }).exec();
      expect(updated.data.every((r) => Number(r.credit_limit) === 999)).toBe(true);
    });

    it('returns affected count', async () => {
      const result = await models
        .query('sales.customer')
        .filter({ name: 'U1' })
        .updateAll({ credit_limit: 555 });
      expect(result.count).toBe(1);
    });
  });

  describe('deleteAll', () => {
    it('deletes all matching records', async () => {
      await models.createMany('hr.department', [
        { name: 'Keep' },
        { name: 'Del1' },
        { name: 'Del2' },
      ]);
      const result = await models
        .query('hr.department')
        .filter({ name: { startsWith: 'del' } })
        .deleteAll();
      expect(result.count).toBe(2);

      const remaining = await models.query('hr.department').exec();
      expect(remaining.data).toHaveLength(1);
      expect(remaining.data[0].name).toBe('Keep');
    });

    it('soft-deletes when model has soft_delete trait', async () => {
      await models.createMany('sales.customer', [
        { name: 'SD1', email: 'sd1@test.com' },
        { name: 'SD2', email: 'sd2@test.com' },
      ]);
      const result = await models.query('sales.customer').deleteAll();
      expect(result.count).toBe(2);

      const visible = await models.query('sales.customer').exec();
      expect(visible.data).toHaveLength(0);

      const db = bootResult.frameworkContext!.db;
      const raw = await db.selectFrom('sales__customer').selectAll().execute();
      expect(raw.length).toBe(2);
      expect(raw.every((r: any) => r.archived_at !== null)).toBe(true);
    });

    it('returns zero count when nothing matches', async () => {
      const result = await models
        .query('hr.department')
        .filter({ name: 'nonexistent' })
        .deleteAll();
      expect(result.count).toBe(0);
    });
  });

  describe('transaction', () => {
    it('commits on normal return', async () => {
      await models.transaction(async (tx) => {
        await tx.create('hr.department', { name: 'TxCommit' });
      });
      const result = await models.query('hr.department').filter({ name: 'TxCommit' }).exec();
      expect(result.data).toHaveLength(1);
    });

    it('rolls back on throw', async () => {
      try {
        await models.transaction(async (tx) => {
          await tx.create('hr.department', { name: 'TxRollback' });
          throw new Error('Intentional rollback');
        });
      } catch {
        // expected
      }
      const result = await models.query('hr.department').filter({ name: 'TxRollback' }).exec();
      expect(result.data).toHaveLength(0);
    });

    it('operations within use same transaction', async () => {
      await models.transaction(async (tx) => {
        const dept = await tx.create('hr.department', { name: 'TxDept' });
        const fetched = await tx.get('hr.department', dept.id as string);
        expect(fetched).not.toBeNull();
        expect(fetched!.name).toBe('TxDept');
      });
    });

    it('createMany within transaction is atomic', async () => {
      const deptsBefore = await models.query('hr.department').exec();
      const countBefore = deptsBefore.data.length;

      try {
        await models.transaction(async (tx) => {
          await tx.createMany('hr.department', [{ name: 'TxBatch1' }, { name: 'TxBatch2' }]);
          throw new Error('Rollback batch');
        });
      } catch {
        // expected
      }

      const deptsAfter = await models.query('hr.department').exec();
      expect(deptsAfter.data.length).toBe(countBefore);
    });
  });

  describe('includeArchived', () => {
    it('includes soft-deleted records', async () => {
      const created = await models.create('sales.customer', {
        name: 'Archived Co',
        email: 'archived@test.com',
      });
      await models.delete('sales.customer', created.id as string);

      const withoutArchived = await models.query('sales.customer').exec();
      expect(withoutArchived.data.find((r) => r.name === 'Archived Co')).toBeUndefined();

      const withArchived = await models.query('sales.customer').includeArchived().exec();
      expect(withArchived.data.find((r) => r.name === 'Archived Co')).toBeDefined();
    });
  });
});
