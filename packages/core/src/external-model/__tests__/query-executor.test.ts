import { describe, it, expect, vi } from 'vitest';
import { ExternalQueryExecutor } from '../query-executor.js';
import type { DataAdapter, AdapterCapability } from '../../plugins/types.js';
import type { ExternalFieldConfig } from '../types.js';

function makeAdapter(overrides?: Partial<DataAdapter>): DataAdapter {
  return {
    async get(_model, _id) {
      return null;
    },
    ...overrides,
  };
}

const baseFields: Record<string, ExternalFieldConfig> = {
  id: { type: 'string' },
  email: { type: 'string' },
  name: { type: 'string', from: 'metadata.company_name' },
};

describe('ExternalQueryExecutor', () => {
  describe('execGet', () => {
    it('returns null when adapter returns null', async () => {
      const adapter = makeAdapter({
        async get() {
          return null;
        },
      });
      const executor = new ExternalQueryExecutor({
        adapter,
        modelName: 'billing.Customer',
        fields: baseFields,
        capabilities: ['read'],
      });

      expect(await executor.execGet('non-existent')).toBeNull();
    });

    it('returns mapped record', async () => {
      const adapter = makeAdapter({
        async get() {
          return { id: 'cus_1', email: 'a@b.com', metadata: { company_name: 'Acme' } };
        },
      });
      const executor = new ExternalQueryExecutor({
        adapter,
        modelName: 'billing.Customer',
        fields: baseFields,
        capabilities: ['read'],
      });

      const result = await executor.execGet('cus_1');
      expect(result).toEqual({ id: 'cus_1', email: 'a@b.com', name: 'Acme' });
    });

    it('evaluates computed fields', async () => {
      const fields: Record<string, ExternalFieldConfig> = {
        id: { type: 'string' },
        name: { type: 'string' },
        upper: {
          type: 'string',
          computed: { depends: ['name'], compute: (r) => (r.name as string).toUpperCase() },
        },
      };
      const adapter = makeAdapter({
        async get() {
          return { id: '1', name: 'alice' };
        },
      });
      const executor = new ExternalQueryExecutor({
        adapter,
        modelName: 'test.Model',
        fields,
        capabilities: ['read'],
      });

      const result = await executor.execGet('1');
      expect(result?.upper).toBe('ALICE');
    });

    it('passes model name to adapter', async () => {
      const get = vi.fn().mockResolvedValue({ id: '1' });
      const adapter = makeAdapter({ get });
      const executor = new ExternalQueryExecutor({
        adapter,
        modelName: 'billing.Customer',
        fields: { id: { type: 'string' } },
        capabilities: ['read'],
      });

      await executor.execGet('cus_1');
      expect(get).toHaveBeenCalledWith('billing.Customer', 'cus_1');
    });
  });

  describe('execList', () => {
    it('calls adapter.list when capability is available', async () => {
      const list = vi.fn().mockResolvedValue({
        data: [
          { id: '1', email: 'a@b.com', metadata: { company_name: 'A' } },
          { id: '2', email: 'c@d.com', metadata: { company_name: 'B' } },
        ],
        total: 2,
      });
      const adapter = makeAdapter({ list });
      const executor = new ExternalQueryExecutor({
        adapter,
        modelName: 'billing.Customer',
        fields: baseFields,
        capabilities: ['read', 'list'],
      });

      const result = await executor.execList({
        filters: [],
        sorts: [],
        fieldNames: [],
      });

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({ id: '1', email: 'a@b.com', name: 'A' });
      expect(result.total).toBe(2);
    });

    it('passes filters to adapter when filter capability exists', async () => {
      const list = vi.fn().mockResolvedValue({ data: [], total: 0 });
      const adapter = makeAdapter({ list });
      const capabilities: AdapterCapability[] = ['read', 'list', 'filter'];
      const executor = new ExternalQueryExecutor({
        adapter,
        modelName: 'billing.Customer',
        fields: baseFields,
        capabilities,
      });

      await executor.execList({
        filters: [{ field: 'email', operator: 'eq', value: 'test@test.com' }],
        sorts: [],
        fieldNames: [],
      });

      expect(list).toHaveBeenCalledWith(
        'billing.Customer',
        expect.objectContaining({
          filters: [{ field: 'email', operator: 'eq', value: 'test@test.com' }],
        }),
      );
    });

    it('applies in-memory filter when adapter lacks filter capability', async () => {
      const list = vi.fn().mockResolvedValue({
        data: [
          { id: '1', email: 'alice@acme.com', metadata: { company_name: 'Acme' } },
          { id: '2', email: 'bob@other.com', metadata: { company_name: 'Other' } },
        ],
        total: 2,
      });
      const adapter = makeAdapter({ list });
      const executor = new ExternalQueryExecutor({
        adapter,
        modelName: 'billing.Customer',
        fields: baseFields,
        capabilities: ['read', 'list'],
      });

      const result = await executor.execList({
        filters: [{ field: 'email', operator: 'contains', value: 'acme' }],
        sorts: [],
        fieldNames: [],
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].email).toBe('alice@acme.com');
    });

    it('applies in-memory sort when adapter lacks sort capability', async () => {
      const list = vi.fn().mockResolvedValue({
        data: [
          { id: '2', email: 'b@b.com', metadata: { company_name: 'B' } },
          { id: '1', email: 'a@a.com', metadata: { company_name: 'A' } },
        ],
        total: 2,
      });
      const adapter = makeAdapter({ list });
      const executor = new ExternalQueryExecutor({
        adapter,
        modelName: 'billing.Customer',
        fields: baseFields,
        capabilities: ['read', 'list'],
      });

      const result = await executor.execList({
        filters: [],
        sorts: [{ field: 'email', direction: 'asc' }],
        fieldNames: [],
      });

      expect(result.data[0].email).toBe('a@a.com');
      expect(result.data[1].email).toBe('b@b.com');
    });

    it('returns empty data when no list capability', async () => {
      const adapter = makeAdapter();
      const executor = new ExternalQueryExecutor({
        adapter,
        modelName: 'billing.Customer',
        fields: baseFields,
        capabilities: ['read'],
      });

      const result = await executor.execList({
        filters: [],
        sorts: [],
        fieldNames: [],
      });

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('uses default limit of 25', async () => {
      const list = vi.fn().mockResolvedValue({ data: [], total: 0 });
      const adapter = makeAdapter({ list });
      const executor = new ExternalQueryExecutor({
        adapter,
        modelName: 'billing.Customer',
        fields: baseFields,
        capabilities: ['read', 'list'],
      });

      await executor.execList({ filters: [], sorts: [], fieldNames: [] });
      expect(list).toHaveBeenCalledWith(
        'billing.Customer',
        expect.objectContaining({ pageSize: 25 }),
      );
    });

    it('respects custom limit', async () => {
      const list = vi.fn().mockResolvedValue({ data: [], total: 0 });
      const adapter = makeAdapter({ list });
      const executor = new ExternalQueryExecutor({
        adapter,
        modelName: 'billing.Customer',
        fields: baseFields,
        capabilities: ['read', 'list'],
      });

      await executor.execList({ filters: [], sorts: [], fieldNames: [], limitVal: 10 });
      expect(list).toHaveBeenCalledWith(
        'billing.Customer',
        expect.objectContaining({ pageSize: 10 }),
      );
    });
  });

  describe('execCount', () => {
    it('returns total from list result', async () => {
      const list = vi.fn().mockResolvedValue({ data: [{ id: '1' }, { id: '2' }], total: 50 });
      const adapter = makeAdapter({ list });
      const executor = new ExternalQueryExecutor({
        adapter,
        modelName: 'billing.Customer',
        fields: { id: { type: 'string' } },
        capabilities: ['read', 'list'],
      });

      const count = await executor.execCount({ filters: [], sorts: [], fieldNames: [] });
      expect(count).toBe(50);
    });

    it('falls back to data length when total not provided', async () => {
      const list = vi.fn().mockResolvedValue({ data: [{ id: '1' }, { id: '2' }] });
      const adapter = makeAdapter({ list });
      const executor = new ExternalQueryExecutor({
        adapter,
        modelName: 'billing.Customer',
        fields: { id: { type: 'string' } },
        capabilities: ['read', 'list'],
      });

      const count = await executor.execCount({ filters: [], sorts: [], fieldNames: [] });
      expect(count).toBe(2);
    });
  });
});
