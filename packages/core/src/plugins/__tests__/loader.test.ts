import { describe, it, expect, vi } from 'vitest';
import {
  loadPlugins,
  DuplicatePluginError,
  PluginConfigError,
  MissingAdapterImplementationError,
} from '../loader.js';
import type { PluginDefinition, DataAdapter } from '../types.js';

function makeAdapter(overrides?: Partial<DataAdapter>): DataAdapter {
  return {
    async get(_model: string, _id: string) {
      return { id: '1' };
    },
    ...overrides,
  };
}

describe('loadPlugins', () => {
  describe('basic boot', () => {
    it('calls boot on each plugin', async () => {
      const boot = vi.fn();
      const plugin: PluginDefinition = {
        name: 'test-plugin',
        version: '1.0.0',
        boot,
      };

      await loadPlugins({ plugins: [plugin] });
      expect(boot).toHaveBeenCalledOnce();
    });

    it('boots multiple plugins in order', async () => {
      const order: string[] = [];
      const pluginA: PluginDefinition = {
        name: 'a',
        version: '1.0.0',
        boot() {
          order.push('a');
        },
      };
      const pluginB: PluginDefinition = {
        name: 'b',
        version: '1.0.0',
        boot() {
          order.push('b');
        },
      };

      await loadPlugins({ plugins: [pluginA, pluginB] });
      expect(order).toEqual(['a', 'b']);
    });

    it('supports async boot functions', async () => {
      const plugin: PluginDefinition = {
        name: 'async-plugin',
        version: '1.0.0',
        async boot() {
          await new Promise((r) => setTimeout(r, 5));
        },
      };

      await expect(loadPlugins({ plugins: [plugin] })).resolves.toBeDefined();
    });
  });

  describe('config resolution', () => {
    it('passes user config to boot context', async () => {
      let receivedConfig: Record<string, unknown> = {};
      const plugin: PluginDefinition = {
        name: 'stripe',
        version: '1.0.0',
        config: {
          secretKey: { type: 'string', required: true },
        },
        boot(ctx) {
          receivedConfig = ctx.config;
        },
      };

      await loadPlugins({
        plugins: [plugin],
        config: { stripe: { secretKey: 'sk_test_123' } },
      });

      expect(receivedConfig).toEqual({ secretKey: 'sk_test_123' });
    });

    it('applies default values when user config is missing', async () => {
      let receivedConfig: Record<string, unknown> = {};
      const plugin: PluginDefinition = {
        name: 'stripe',
        version: '1.0.0',
        config: {
          apiVersion: { type: 'string', default: '2024-12-18' },
        },
        boot(ctx) {
          receivedConfig = ctx.config;
        },
      };

      await loadPlugins({ plugins: [plugin] });
      expect(receivedConfig).toEqual({ apiVersion: '2024-12-18' });
    });

    it('throws PluginConfigError when required field is missing', async () => {
      const plugin: PluginDefinition = {
        name: 'stripe',
        version: '1.0.0',
        config: {
          secretKey: { type: 'string', required: true },
        },
        boot() {},
      };

      await expect(loadPlugins({ plugins: [plugin] })).rejects.toThrow(PluginConfigError);
      await expect(loadPlugins({ plugins: [plugin] })).rejects.toThrow(
        'Plugin "stripe" requires config field "secretKey"',
      );
    });

    it('allows extra config fields not in schema', async () => {
      let receivedConfig: Record<string, unknown> = {};
      const plugin: PluginDefinition = {
        name: 'stripe',
        version: '1.0.0',
        config: {
          secretKey: { type: 'string', required: true },
        },
        boot(ctx) {
          receivedConfig = ctx.config;
        },
      };

      await loadPlugins({
        plugins: [plugin],
        config: { stripe: { secretKey: 'sk_test', extra: 'value' } },
      });

      expect(receivedConfig).toEqual({ secretKey: 'sk_test', extra: 'value' });
    });
  });

  describe('adapter registration', () => {
    it('provides adapter implement function in boot context', async () => {
      const adapter = makeAdapter();
      const plugin: PluginDefinition = {
        name: 'stripe',
        version: '1.0.0',
        provides: {
          adapters: [{ name: 'stripe', capabilities: ['read', 'list'] }],
        },
        boot(ctx) {
          ctx.adapters.stripe.implement(adapter);
        },
      };

      const { adapterRegistry } = await loadPlugins({ plugins: [plugin] });
      expect(adapterRegistry.has('stripe')).toBe(true);
      expect(adapterRegistry.get('stripe')).toBe(adapter);
    });

    it('supports multiple adapters from one plugin', async () => {
      const plugin: PluginDefinition = {
        name: 'multi',
        version: '1.0.0',
        provides: {
          adapters: [
            { name: 'stripe', capabilities: ['read'] },
            { name: 'hubspot', capabilities: ['read', 'list'] },
          ],
        },
        boot(ctx) {
          ctx.adapters.stripe.implement(makeAdapter());
          ctx.adapters.hubspot.implement(makeAdapter());
        },
      };

      const { adapterRegistry } = await loadPlugins({ plugins: [plugin] });
      expect(adapterRegistry.has('stripe')).toBe(true);
      expect(adapterRegistry.has('hubspot')).toBe(true);
    });

    it('throws MissingAdapterImplementationError when adapter not implemented', async () => {
      const plugin: PluginDefinition = {
        name: 'stripe',
        version: '1.0.0',
        provides: {
          adapters: [{ name: 'stripe', capabilities: ['read'] }],
        },
        boot() {
          // does not call ctx.adapters.stripe.implement()
        },
      };

      await expect(loadPlugins({ plugins: [plugin] })).rejects.toThrow(
        MissingAdapterImplementationError,
      );
      await expect(loadPlugins({ plugins: [plugin] })).rejects.toThrow(
        'Plugin "stripe" declares adapter "stripe" in provides but did not implement it during boot',
      );
    });
  });

  describe('lifecycle hooks', () => {
    it('registers lifecycle handlers via ctx.on', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      const plugin: PluginDefinition = {
        name: 'test',
        version: '1.0.0',
        boot(ctx) {
          ctx.on('afterBoot', handler);
        },
      };

      const { lifecycleManager } = await loadPlugins({ plugins: [plugin] });
      expect(lifecycleManager.getHandlers('afterBoot')).toContain(handler);
    });

    it('supports multiple lifecycle events from one plugin', async () => {
      const beforeHandler = vi.fn().mockResolvedValue(undefined);
      const afterHandler = vi.fn().mockResolvedValue(undefined);
      const plugin: PluginDefinition = {
        name: 'test',
        version: '1.0.0',
        boot(ctx) {
          ctx.on('beforeBoot', beforeHandler);
          ctx.on('afterBoot', afterHandler);
        },
      };

      const { lifecycleManager } = await loadPlugins({ plugins: [plugin] });
      expect(lifecycleManager.getHandlers('beforeBoot')).toContain(beforeHandler);
      expect(lifecycleManager.getHandlers('afterBoot')).toContain(afterHandler);
    });
  });

  describe('duplicate detection', () => {
    it('throws DuplicatePluginError for same plugin name', async () => {
      const pluginA: PluginDefinition = {
        name: 'stripe',
        version: '1.0.0',
        boot() {},
      };
      const pluginB: PluginDefinition = {
        name: 'stripe',
        version: '2.0.0',
        boot() {},
      };

      await expect(loadPlugins({ plugins: [pluginA, pluginB] })).rejects.toThrow(
        DuplicatePluginError,
      );
      await expect(loadPlugins({ plugins: [pluginA, pluginB] })).rejects.toThrow(
        'Plugin "stripe" is already registered',
      );
    });
  });

  describe('return value', () => {
    it('returns adapterRegistry and lifecycleManager', async () => {
      const plugin: PluginDefinition = {
        name: 'test',
        version: '1.0.0',
        boot() {},
      };

      const result = await loadPlugins({ plugins: [plugin] });
      expect(result).toHaveProperty('adapterRegistry');
      expect(result).toHaveProperty('lifecycleManager');
    });
  });
});
