import { describe, it, expect } from 'vitest';
import { validatePluginSetup } from '../validator.js';
import { AdapterRegistry } from '../adapter-registry.js';
import type { PluginDefinition, DataAdapter, AdapterCapability } from '../types.js';
import type { ResolvedModel } from '../../schema/types.js';

function makeAdapter(overrides?: Partial<DataAdapter>): DataAdapter {
  return {
    async get(_model, _id) {
      return { id: '1' };
    },
    ...overrides,
  };
}

function makeExternalModel(name: string, source: string): ResolvedModel {
  return {
    qualifiedName: `billing.${name}`,
    app: 'billing-app',
    name,
    auditLog: false,
    traits: [],
    fields: [],
    indexes: [],
    source,
  };
}

function makePlugin(name: string, adapters?: string[]): PluginDefinition {
  return {
    name,
    version: '1.0.0',
    provides: adapters
      ? { adapters: adapters.map((a) => ({ name: a, capabilities: ['read'] as const })) }
      : undefined,
    boot() {},
  };
}

describe('validatePluginSetup', () => {
  describe('valid setup', () => {
    it('returns valid with no plugins and no external models', () => {
      const registry = new AdapterRegistry();
      const result = validatePluginSetup(registry, [], []);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('returns valid when all adapters are registered and sources resolved', () => {
      const registry = new AdapterRegistry();
      registry.register('stripe', makeAdapter());

      const models = [makeExternalModel('Customer', 'stripe')];
      const plugins = [makePlugin('stripe', ['stripe'])];

      const result = validatePluginSetup(registry, models, plugins);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('duplicate plugin detection', () => {
    it('detects duplicate plugin names', () => {
      const registry = new AdapterRegistry();
      const plugins = [makePlugin('stripe'), makePlugin('stripe')];

      const result = validatePluginSetup(registry, [], plugins);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('DUPLICATE_PLUGIN');
      expect(result.errors[0].message).toContain('stripe');
    });

    it('allows different plugin names', () => {
      const registry = new AdapterRegistry();
      const plugins = [makePlugin('stripe'), makePlugin('hubspot')];

      const result = validatePluginSetup(registry, [], plugins);
      expect(result.valid).toBe(true);
    });
  });

  describe('missing adapter implementation', () => {
    it('detects when declared adapter is not registered', () => {
      const registry = new AdapterRegistry();
      const plugins = [makePlugin('stripe', ['stripe'])];

      const result = validatePluginSetup(registry, [], plugins);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('MISSING_ADAPTER_IMPL');
      expect(result.errors[0].plugin).toBe('stripe');
      expect(result.errors[0].message).toContain('stripe');
    });

    it('passes when declared adapter is registered', () => {
      const registry = new AdapterRegistry();
      registry.register('stripe', makeAdapter());
      const plugins = [makePlugin('stripe', ['stripe'])];

      const result = validatePluginSetup(registry, [], plugins);
      expect(result.valid).toBe(true);
    });
  });

  describe('unresolved external model source', () => {
    it('detects when external model references unregistered adapter', () => {
      const registry = new AdapterRegistry();
      const models = [makeExternalModel('Customer', 'stripe')];

      const result = validatePluginSetup(registry, models, []);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('UNRESOLVED_SOURCE');
      expect(result.errors[0].model).toBe('billing.Customer');
      expect(result.errors[0].message).toContain('stripe');
    });

    it('passes when source adapter is registered', () => {
      const registry = new AdapterRegistry();
      registry.register('stripe', makeAdapter());
      const models = [makeExternalModel('Customer', 'stripe')];

      const result = validatePluginSetup(registry, models, []);
      expect(result.valid).toBe(true);
    });

    it('skips models without source', () => {
      const registry = new AdapterRegistry();
      const internalModel: ResolvedModel = {
        qualifiedName: 'sales.Order',
        app: 'sales-app',
        name: 'Order',
        auditLog: false,
        traits: [],
        fields: [],
        indexes: [],
      };

      const result = validatePluginSetup(registry, [internalModel], []);
      expect(result.valid).toBe(true);
    });
  });

  describe('batchGet warnings', () => {
    it('warns when adapter lacks batchGet', () => {
      const registry = new AdapterRegistry();
      registry.register('stripe', makeAdapter());
      const models = [makeExternalModel('Customer', 'stripe')];

      const result = validatePluginSetup(registry, models, []);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('batchGet');
      expect(result.warnings[0]).toContain('N+1');
    });

    it('no warning when adapter has batchGet', () => {
      const registry = new AdapterRegistry();
      registry.register(
        'stripe',
        makeAdapter({
          async batchGet(_model, ids) {
            return ids.map((id) => ({ id }));
          },
        }),
      );
      const models = [makeExternalModel('Customer', 'stripe')];

      const result = validatePluginSetup(registry, models, []);
      expect(result.warnings).toHaveLength(0);
    });

    it('skips warning when adapter is not registered', () => {
      const registry = new AdapterRegistry();
      const models = [makeExternalModel('Customer', 'missing')];

      const result = validatePluginSetup(registry, models, []);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('aggregated errors', () => {
    it('collects multiple errors from different checks', () => {
      const registry = new AdapterRegistry();
      const plugins = [makePlugin('stripe', ['stripe']), makePlugin('stripe', ['hubspot'])];
      const models = [makeExternalModel('Customer', 'missing')];

      const result = validatePluginSetup(registry, models, plugins);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);

      const types = result.errors.map((e) => e.type);
      expect(types).toContain('DUPLICATE_PLUGIN');
      expect(types).toContain('MISSING_ADAPTER_IMPL');
      expect(types).toContain('UNRESOLVED_SOURCE');
    });
  });

  describe('capability violations', () => {
    it('errors when adapter lacks required read capability', () => {
      const registry = new AdapterRegistry();
      registry.register('stripe', makeAdapter());
      const models = [makeExternalModel('Customer', 'stripe')];
      const capabilities: Record<string, AdapterCapability[]> = { stripe: ['list'] };

      const result = validatePluginSetup(registry, models, [], capabilities);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          type: 'CAPABILITY_VIOLATION',
          model: 'billing.Customer',
          message: expect.stringContaining('read'),
        }),
      );
    });

    it('errors when adapter lacks list capability', () => {
      const registry = new AdapterRegistry();
      registry.register('stripe', makeAdapter());
      const models = [makeExternalModel('Customer', 'stripe')];
      const capabilities: Record<string, AdapterCapability[]> = { stripe: ['read'] };

      const result = validatePluginSetup(registry, models, [], capabilities);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          type: 'CAPABILITY_VIOLATION',
          message: expect.stringContaining('list'),
        }),
      );
    });

    it('passes when adapter has read and list', () => {
      const registry = new AdapterRegistry();
      registry.register('stripe', makeAdapter());
      const models = [makeExternalModel('Customer', 'stripe')];
      const capabilities: Record<string, AdapterCapability[]> = { stripe: ['read', 'list'] };

      const result = validatePluginSetup(registry, models, [], capabilities);
      const capErrors = result.errors.filter((e) => e.type === 'CAPABILITY_VIOLATION');
      expect(capErrors).toHaveLength(0);
    });

    it('skips check when no capabilities declared for adapter', () => {
      const registry = new AdapterRegistry();
      registry.register('stripe', makeAdapter());
      const models = [makeExternalModel('Customer', 'stripe')];

      const result = validatePluginSetup(registry, models, [], {});
      const capErrors = result.errors.filter((e) => e.type === 'CAPABILITY_VIOLATION');
      expect(capErrors).toHaveLength(0);
    });

    it('skips internal models', () => {
      const registry = new AdapterRegistry();
      const internalModel: ResolvedModel = {
        qualifiedName: 'sales.Order',
        app: 'test',
        name: 'Order',
        auditLog: false,
        traits: [],
        fields: [],
        indexes: [],
      };
      const capabilities: Record<string, AdapterCapability[]> = { stripe: ['read'] };

      const result = validatePluginSetup(registry, [internalModel], [], capabilities);
      const capErrors = result.errors.filter((e) => e.type === 'CAPABILITY_VIOLATION');
      expect(capErrors).toHaveLength(0);
    });
  });
});
