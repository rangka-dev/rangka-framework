import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { ModelAccessInterface } from '../../types/index.js';
import { ModelNotFoundError } from '../../types/model-api.js';

export interface ContractTestFactory {
  create(): Promise<{
    models: ModelAccessInterface;
    teardown?: () => Promise<void>;
  }>;
  seed(models: ModelAccessInterface): Promise<void>;
}

export function defineModelAccessContract(factory: ContractTestFactory) {
  let models: ModelAccessInterface;
  let teardownFn: (() => Promise<void>) | undefined;

  beforeEach(async () => {
    const result = await factory.create();
    models = result.models;
    teardownFn = result.teardown;
    await factory.seed(models);
  });

  afterEach(async () => {
    if (teardownFn) await teardownFn();
  });

  describe('get', () => {
    it('returns record by id', async () => {
      const created = await models.create('test.item', { name: 'Alpha', price: 100 });
      const fetched = await models.get('test.item', created.id as string);
      expect(fetched).not.toBeNull();
      expect(fetched!.name).toBe('Alpha');
      expect(fetched!.price).toBe(100);
    });

    it('returns null for non-existent id', async () => {
      const result = await models.get('test.item', 'non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('returns created record with generated id', async () => {
      const record = await models.create('test.item', { name: 'Beta', price: 200 });
      expect(record.id).toBeDefined();
      expect(record.name).toBe('Beta');
      expect(record.price).toBe(200);
    });
  });

  describe('update', () => {
    it('returns updated record', async () => {
      const created = await models.create('test.item', { name: 'Gamma', price: 300 });
      const updated = await models.update('test.item', created.id as string, { price: 350 });
      expect(updated.price).toBe(350);
      expect(updated.name).toBe('Gamma');
    });

    it('throws ModelNotFoundError for non-existent id', async () => {
      await expect(models.update('test.item', 'non-existent', { name: 'X' })).rejects.toThrow(
        ModelNotFoundError,
      );
    });
  });

  describe('delete', () => {
    it('returns deleted record', async () => {
      const created = await models.create('test.item', { name: 'Delta', price: 400 });
      const deleted = await models.delete('test.item', created.id as string);
      expect(deleted.name).toBe('Delta');
      const fetched = await models.get('test.item', created.id as string);
      expect(fetched).toBeNull();
    });

    it('throws ModelNotFoundError for non-existent id', async () => {
      await expect(models.delete('test.item', 'non-existent')).rejects.toThrow(ModelNotFoundError);
    });
  });

  describe('createMany', () => {
    it('creates all records and returns them', async () => {
      const items = [
        { name: 'A', price: 10 },
        { name: 'B', price: 20 },
        { name: 'C', price: 30 },
      ];
      const created = await models.createMany('test.item', items);
      expect(created).toHaveLength(3);
      expect(created[0].name).toBe('A');
      expect(created[1].name).toBe('B');
      expect(created[2].name).toBe('C');
      for (const record of created) {
        expect(record.id).toBeDefined();
      }
    });
  });

  describe('query.filter', () => {
    it('eq: exact match', async () => {
      await models.create('test.item', { name: 'Exact', price: 500 });
      await models.create('test.item', { name: 'Other', price: 600 });
      const result = await models.query('test.item').filter({ name: 'Exact' }).exec();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Exact');
    });

    it('neq: excludes value', async () => {
      await models.create('test.item', { name: 'Keep', price: 100 });
      await models.create('test.item', { name: 'Exclude', price: 200 });
      const result = await models
        .query('test.item')
        .filter({ name: { neq: 'Exclude' } })
        .exec();
      expect(result.data.every((r) => r.name !== 'Exclude')).toBe(true);
    });

    it('gt/gte/lt/lte: numeric comparison', async () => {
      await models.create('test.item', { name: 'Low', price: 10 });
      await models.create('test.item', { name: 'Mid', price: 50 });
      await models.create('test.item', { name: 'High', price: 100 });

      const gt = await models
        .query('test.item')
        .filter({ price: { gt: 50 } })
        .exec();
      expect(gt.data).toHaveLength(1);
      expect(gt.data[0].name).toBe('High');

      const gte = await models
        .query('test.item')
        .filter({ price: { gte: 50 } })
        .exec();
      expect(gte.data).toHaveLength(2);

      const lt = await models
        .query('test.item')
        .filter({ price: { lt: 50 } })
        .exec();
      expect(lt.data).toHaveLength(1);
      expect(lt.data[0].name).toBe('Low');

      const lte = await models
        .query('test.item')
        .filter({ price: { lte: 50 } })
        .exec();
      expect(lte.data).toHaveLength(2);
    });

    it('in: set membership', async () => {
      await models.create('test.item', { name: 'A', price: 1 });
      await models.create('test.item', { name: 'B', price: 2 });
      await models.create('test.item', { name: 'C', price: 3 });
      const result = await models
        .query('test.item')
        .filter({ name: { in: ['A', 'C'] } })
        .exec();
      expect(result.data).toHaveLength(2);
      expect(result.data.map((r) => r.name).sort()).toEqual(['A', 'C']);
    });

    it('notIn: set exclusion', async () => {
      await models.create('test.item', { name: 'A', price: 1 });
      await models.create('test.item', { name: 'B', price: 2 });
      await models.create('test.item', { name: 'C', price: 3 });
      const result = await models
        .query('test.item')
        .filter({ name: { notIn: ['A', 'C'] } })
        .exec();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('B');
    });

    it('contains: case-insensitive substring', async () => {
      await models.create('test.item', { name: 'Hello World', price: 1 });
      await models.create('test.item', { name: 'Goodbye', price: 2 });
      const result = await models
        .query('test.item')
        .filter({ name: { contains: 'hello' } })
        .exec();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Hello World');
    });

    it('startsWith: prefix match', async () => {
      await models.create('test.item', { name: 'Prefix-match', price: 1 });
      await models.create('test.item', { name: 'No-match', price: 2 });
      const result = await models
        .query('test.item')
        .filter({ name: { startsWith: 'prefix' } })
        .exec();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Prefix-match');
    });

    it('endsWith: suffix match', async () => {
      await models.create('test.item', { name: 'ends-here', price: 1 });
      await models.create('test.item', { name: 'not-this', price: 2 });
      const result = await models
        .query('test.item')
        .filter({ name: { endsWith: 'here' } })
        .exec();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('ends-here');
    });

    it('is null', async () => {
      await models.create('test.item', { name: 'Has category', price: 1, category: 'tools' });
      await models.create('test.item', { name: 'No category', price: 2, category: null });
      const result = await models
        .query('test.item')
        .filter({ category: { is: null } })
        .exec();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('No category');
    });

    it('is not_null', async () => {
      await models.create('test.item', { name: 'Has category', price: 1, category: 'tools' });
      await models.create('test.item', { name: 'No category', price: 2, category: null });
      const result = await models
        .query('test.item')
        .filter({ category: { is: 'not_null' } })
        .exec();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Has category');
    });

    it('between: inclusive range', async () => {
      await models.create('test.item', { name: 'Low', price: 10 });
      await models.create('test.item', { name: 'Mid', price: 50 });
      await models.create('test.item', { name: 'High', price: 100 });
      const result = await models
        .query('test.item')
        .filter({ price: { between: [20, 80] } })
        .exec();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Mid');
    });

    it('$or: top-level disjunction', async () => {
      await models.create('test.item', { name: 'A', price: 10 });
      await models.create('test.item', { name: 'B', price: 50 });
      await models.create('test.item', { name: 'C', price: 100 });
      const result = await models
        .query('test.item')
        .filter({
          $or: [{ name: 'A' }, { price: { gte: 100 } }],
        })
        .exec();
      expect(result.data).toHaveLength(2);
      expect(result.data.map((r) => r.name).sort()).toEqual(['A', 'C']);
    });

    it('$or with AND groups', async () => {
      await models.create('test.item', { name: 'A', price: 10, category: 'x' });
      await models.create('test.item', { name: 'B', price: 50, category: 'y' });
      await models.create('test.item', { name: 'C', price: 100, category: 'x' });
      const result = await models
        .query('test.item')
        .filter({
          $or: [{ category: 'x', price: { gte: 50 } }, { category: 'y' }],
        })
        .exec();
      expect(result.data).toHaveLength(2);
      expect(result.data.map((r) => r.name).sort()).toEqual(['B', 'C']);
    });

    it('chained filters are AND', async () => {
      await models.create('test.item', { name: 'A', price: 10 });
      await models.create('test.item', { name: 'B', price: 50 });
      await models.create('test.item', { name: 'C', price: 100 });
      const result = await models
        .query('test.item')
        .filter({ price: { gte: 10 } })
        .filter({ price: { lte: 50 } })
        .exec();
      expect(result.data).toHaveLength(2);
      expect(result.data.map((r) => r.name).sort()).toEqual(['A', 'B']);
    });
  });

  describe('query.sort', () => {
    it('ascending by field', async () => {
      await models.create('test.item', { name: 'C', price: 30 });
      await models.create('test.item', { name: 'A', price: 10 });
      await models.create('test.item', { name: 'B', price: 20 });
      const result = await models.query('test.item').sort('name', 'asc').exec();
      expect(result.data.map((r) => r.name)).toEqual(['A', 'B', 'C']);
    });

    it('descending by field', async () => {
      await models.create('test.item', { name: 'C', price: 30 });
      await models.create('test.item', { name: 'A', price: 10 });
      await models.create('test.item', { name: 'B', price: 20 });
      const result = await models.query('test.item').sort('name', 'desc').exec();
      expect(result.data.map((r) => r.name)).toEqual(['C', 'B', 'A']);
    });
  });

  describe('query.pagination', () => {
    it('limit restricts result count', async () => {
      await models.createMany('test.item', [
        { name: 'A', price: 1 },
        { name: 'B', price: 2 },
        { name: 'C', price: 3 },
      ]);
      const result = await models.query('test.item').sort('name').limit(2).exec();
      expect(result.data).toHaveLength(2);
    });

    it('offset skips records', async () => {
      await models.createMany('test.item', [
        { name: 'A', price: 1 },
        { name: 'B', price: 2 },
        { name: 'C', price: 3 },
      ]);
      const result = await models.query('test.item').sort('name').limit(2).offset(1).exec();
      expect(result.data.map((r) => r.name)).toEqual(['B', 'C']);
    });

    it('page calculates offset from limit', async () => {
      await models.createMany('test.item', [
        { name: 'A', price: 1 },
        { name: 'B', price: 2 },
        { name: 'C', price: 3 },
        { name: 'D', price: 4 },
      ]);
      const result = await models.query('test.item').sort('name').limit(2).page(2).exec();
      expect(result.data.map((r) => r.name)).toEqual(['C', 'D']);
    });

    it('execWithMeta returns pagination metadata', async () => {
      await models.createMany('test.item', [
        { name: 'A', price: 1 },
        { name: 'B', price: 2 },
        { name: 'C', price: 3 },
        { name: 'D', price: 4 },
        { name: 'E', price: 5 },
      ]);
      const result = await models.query('test.item').limit(2).page(2).execWithMeta();
      expect(result.meta.total).toBe(5);
      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(2);
      expect(result.meta.totalPages).toBe(3);
      expect(result.data).toHaveLength(2);
    });
  });

  describe('query.fields', () => {
    it('returns only specified fields', async () => {
      await models.create('test.item', { name: 'Selective', price: 999, category: 'test' });
      const result = await models
        .query('test.item')
        .filter({ name: 'Selective' })
        .fields(['name'])
        .exec();
      expect(result.data[0].name).toBe('Selective');
      expect(result.data[0].price).toBeUndefined();
    });

    it('always includes id', async () => {
      await models.create('test.item', { name: 'WithId', price: 1 });
      const result = await models
        .query('test.item')
        .filter({ name: 'WithId' })
        .fields(['name'])
        .exec();
      expect(result.data[0].id).toBeDefined();
    });
  });

  describe('query.search', () => {
    it('matches across specified fields', async () => {
      await models.create('test.item', { name: 'Searchable Item', price: 1 });
      await models.create('test.item', { name: 'Other', price: 2 });
      const result = await models.query('test.item').search('searchable', ['name']).exec();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Searchable Item');
    });

    it('case-insensitive', async () => {
      await models.create('test.item', { name: 'UPPERCASE', price: 1 });
      const result = await models.query('test.item').search('uppercase', ['name']).exec();
      expect(result.data).toHaveLength(1);
    });
  });

  describe('aggregate', () => {
    beforeEach(async () => {
      await models.createMany('test.item', [
        { name: 'A', price: 10, category: 'x' },
        { name: 'B', price: 20, category: 'x' },
        { name: 'C', price: 30, category: 'y' },
        { name: 'D', price: 40, category: 'y' },
        { name: 'E', price: 50, category: 'y' },
      ]);
    });

    it('sum without groupBy', async () => {
      const result = await models.query('test.item').aggregate({ sum: 'price', count: true });
      expect(result).toHaveProperty('sum');
      expect((result as { sum: Record<string, number> }).sum.price).toBe(150);
      expect((result as { count: number }).count).toBe(5);
    });

    it('count without groupBy', async () => {
      const result = await models.query('test.item').aggregate({ count: true });
      expect((result as { count: number }).count).toBe(5);
    });

    it('groupBy single field', async () => {
      const result = await models
        .query('test.item')
        .groupBy('category')
        .aggregate({ sum: 'price', count: true });
      expect(result).toHaveProperty('groups');
      const grouped = result as {
        groups: Array<{
          key: Record<string, unknown>;
          sum?: Record<string, number>;
          count?: number;
        }>;
      };
      expect(grouped.groups).toHaveLength(2);
      const xGroup = grouped.groups.find((g) => g.key.category === 'x')!;
      const yGroup = grouped.groups.find((g) => g.key.category === 'y')!;
      expect(xGroup.sum!.price).toBe(30);
      expect(xGroup.count).toBe(2);
      expect(yGroup.sum!.price).toBe(120);
      expect(yGroup.count).toBe(3);
    });

    it('respects filters', async () => {
      const result = await models
        .query('test.item')
        .filter({ category: 'x' })
        .aggregate({ sum: 'price', count: true });
      expect((result as { sum: Record<string, number> }).sum.price).toBe(30);
      expect((result as { count: number }).count).toBe(2);
    });
  });

  describe('updateAll', () => {
    it('updates all matching records', async () => {
      await models.createMany('test.item', [
        { name: 'A', price: 10, category: 'x' },
        { name: 'B', price: 20, category: 'x' },
        { name: 'C', price: 30, category: 'y' },
      ]);
      const result = await models
        .query('test.item')
        .filter({ category: 'x' })
        .updateAll({ price: 99 });
      expect(result.count).toBe(2);

      const updated = await models.query('test.item').filter({ category: 'x' }).exec();
      expect(updated.data.every((r) => r.price === 99)).toBe(true);
    });

    it('returns affected count', async () => {
      await models.createMany('test.item', [
        { name: 'A', price: 10 },
        { name: 'B', price: 20 },
      ]);
      const result = await models.query('test.item').filter({ name: 'A' }).updateAll({ price: 99 });
      expect(result.count).toBe(1);
    });
  });

  describe('deleteAll', () => {
    it('deletes all matching records', async () => {
      await models.createMany('test.item', [
        { name: 'A', price: 10, category: 'x' },
        { name: 'B', price: 20, category: 'x' },
        { name: 'C', price: 30, category: 'y' },
      ]);
      const result = await models.query('test.item').filter({ category: 'x' }).deleteAll();
      expect(result.count).toBe(2);

      const remaining = await models.query('test.item').exec();
      expect(remaining.data).toHaveLength(1);
      expect(remaining.data[0].name).toBe('C');
    });

    it('returns affected count', async () => {
      await models.createMany('test.item', [
        { name: 'A', price: 10 },
        { name: 'B', price: 20 },
      ]);
      const result = await models.query('test.item').filter({ name: 'nonexistent' }).deleteAll();
      expect(result.count).toBe(0);
    });
  });

  describe('transaction', () => {
    it('commits on normal return', async () => {
      await models.transaction(async (tx) => {
        await tx.create('test.item', { name: 'TxItem', price: 100 });
      });
      const result = await models.query('test.item').filter({ name: 'TxItem' }).exec();
      expect(result.data).toHaveLength(1);
    });

    it('rolls back on throw', async () => {
      await models.create('test.item', { name: 'Before', price: 1 });
      try {
        await models.transaction(async (tx) => {
          await tx.create('test.item', { name: 'ShouldRollback', price: 999 });
          throw new Error('Intentional rollback');
        });
      } catch {
        // expected
      }
      const result = await models.query('test.item').filter({ name: 'ShouldRollback' }).exec();
      expect(result.data).toHaveLength(0);
    });
  });
}
