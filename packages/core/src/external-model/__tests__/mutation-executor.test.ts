import { describe, it, expect, vi } from 'vitest';
import { ExternalMutationExecutor, CapabilityNotSupportedError } from '../mutation-executor.js';
import type { DataAdapter } from '../../plugins/types.js';
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

describe('ExternalMutationExecutor', () => {
  describe('create', () => {
    it('calls adapter.create with reverse-mapped data', async () => {
      const create = vi.fn().mockResolvedValue({
        id: 'cus_1',
        email: 'a@b.com',
        metadata: { company_name: 'Acme' },
      });
      const adapter = makeAdapter({ create });
      const executor = new ExternalMutationExecutor({
        adapter,
        adapterName: 'stripe',
        modelName: 'billing.Customer',
        fields: baseFields,
        capabilities: ['read', 'create'],
      });

      const result = await executor.create({ email: 'a@b.com', name: 'Acme' });

      expect(create).toHaveBeenCalledWith('billing.Customer', {
        email: 'a@b.com',
        metadata: { company_name: 'Acme' },
      });
      expect(result).toEqual({ id: 'cus_1', email: 'a@b.com', name: 'Acme' });
    });

    it('throws CapabilityNotSupportedError when create not supported', async () => {
      const adapter = makeAdapter();
      const executor = new ExternalMutationExecutor({
        adapter,
        adapterName: 'stripe',
        modelName: 'billing.Customer',
        fields: baseFields,
        capabilities: ['read'],
      });

      await expect(executor.create({ email: 'test' })).rejects.toThrow(CapabilityNotSupportedError);
      await expect(executor.create({ email: 'test' })).rejects.toThrow(
        'Adapter "stripe" does not support operation "create"',
      );
    });

    it('evaluates computed fields on response', async () => {
      const fields: Record<string, ExternalFieldConfig> = {
        id: { type: 'string' },
        name: { type: 'string' },
        upper: {
          type: 'string',
          computed: { depends: ['name'], compute: (r) => (r.name as string).toUpperCase() },
        },
      };
      const create = vi.fn().mockResolvedValue({ id: '1', name: 'alice' });
      const adapter = makeAdapter({ create });
      const executor = new ExternalMutationExecutor({
        adapter,
        adapterName: 'test',
        modelName: 'test.Model',
        fields,
        capabilities: ['read', 'create'],
      });

      const result = await executor.create({ name: 'alice' });
      expect(result.upper).toBe('ALICE');
    });
  });

  describe('update', () => {
    it('calls adapter.update with reverse-mapped data', async () => {
      const update = vi.fn().mockResolvedValue({
        id: 'cus_1',
        email: 'new@b.com',
        metadata: { company_name: 'NewCo' },
      });
      const adapter = makeAdapter({ update });
      const executor = new ExternalMutationExecutor({
        adapter,
        adapterName: 'stripe',
        modelName: 'billing.Customer',
        fields: baseFields,
        capabilities: ['read', 'update'],
      });

      const result = await executor.update('cus_1', { email: 'new@b.com', name: 'NewCo' });

      expect(update).toHaveBeenCalledWith('billing.Customer', 'cus_1', {
        email: 'new@b.com',
        metadata: { company_name: 'NewCo' },
      });
      expect(result).toEqual({ id: 'cus_1', email: 'new@b.com', name: 'NewCo' });
    });

    it('throws CapabilityNotSupportedError when update not supported', async () => {
      const adapter = makeAdapter();
      const executor = new ExternalMutationExecutor({
        adapter,
        adapterName: 'stripe',
        modelName: 'billing.Customer',
        fields: baseFields,
        capabilities: ['read'],
      });

      await expect(executor.update('1', { email: 'test' })).rejects.toThrow(
        CapabilityNotSupportedError,
      );
    });
  });

  describe('delete', () => {
    it('calls adapter.delete', async () => {
      const del = vi.fn().mockResolvedValue(undefined);
      const adapter = makeAdapter({ delete: del });
      const executor = new ExternalMutationExecutor({
        adapter,
        adapterName: 'stripe',
        modelName: 'billing.Customer',
        fields: baseFields,
        capabilities: ['read', 'delete'],
      });

      await executor.delete('cus_1');
      expect(del).toHaveBeenCalledWith('billing.Customer', 'cus_1');
    });

    it('throws CapabilityNotSupportedError when delete not supported', async () => {
      const adapter = makeAdapter();
      const executor = new ExternalMutationExecutor({
        adapter,
        adapterName: 'stripe',
        modelName: 'billing.Customer',
        fields: baseFields,
        capabilities: ['read'],
      });

      await expect(executor.delete('cus_1')).rejects.toThrow(CapabilityNotSupportedError);
      await expect(executor.delete('cus_1')).rejects.toThrow(
        'Adapter "stripe" does not support operation "delete"',
      );
    });
  });
});
