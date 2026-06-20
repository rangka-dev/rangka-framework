import type {
  PluginDefinition,
  PluginBootContext,
  DataAdapter,
  PluginLifecycleEvent,
  LifecycleHandler,
} from './types.js';
import { AdapterRegistry } from './adapter-registry.js';
import { PluginLifecycleManager } from './lifecycle.js';

export class DuplicatePluginError extends Error {
  constructor(public readonly pluginName: string) {
    super(`Plugin "${pluginName}" is already registered`);
    this.name = 'DuplicatePluginError';
  }
}

export class PluginConfigError extends Error {
  constructor(
    public readonly pluginName: string,
    public readonly field: string,
  ) {
    super(`Plugin "${pluginName}" requires config field "${field}"`);
    this.name = 'PluginConfigError';
  }
}

export class MissingAdapterImplementationError extends Error {
  constructor(
    public readonly pluginName: string,
    public readonly adapterName: string,
  ) {
    super(
      `Plugin "${pluginName}" declares adapter "${adapterName}" in provides but did not implement it during boot`,
    );
    this.name = 'MissingAdapterImplementationError';
  }
}

export interface LoadPluginsOptions {
  plugins: PluginDefinition[];
  config?: Record<string, Record<string, unknown>>;
}

export interface LoadPluginsResult {
  adapterRegistry: AdapterRegistry;
  lifecycleManager: PluginLifecycleManager;
}

export async function loadPlugins(options: LoadPluginsOptions): Promise<LoadPluginsResult> {
  const { plugins, config = {} } = options;
  const adapterRegistry = new AdapterRegistry();
  const lifecycleManager = new PluginLifecycleManager();

  const seen = new Set<string>();
  for (const plugin of plugins) {
    if (seen.has(plugin.name)) {
      throw new DuplicatePluginError(plugin.name);
    }
    seen.add(plugin.name);
  }

  for (const plugin of plugins) {
    const pluginConfig = resolveConfig(plugin, config[plugin.name] ?? {});
    const implemented = new Set<string>();

    const adapterProxies: Record<string, { implement(impl: DataAdapter): void }> = {};
    if (plugin.provides?.adapters) {
      for (const decl of plugin.provides.adapters) {
        adapterProxies[decl.name] = {
          implement(impl: DataAdapter) {
            adapterRegistry.register(decl.name, impl);
            implemented.add(decl.name);
          },
        };
      }
    }

    const ctx: PluginBootContext = {
      config: pluginConfig,
      adapters: adapterProxies,
      on(event: PluginLifecycleEvent, handler: LifecycleHandler) {
        lifecycleManager.register(event, handler);
      },
    };

    await plugin.boot(ctx);

    if (plugin.provides?.adapters) {
      for (const decl of plugin.provides.adapters) {
        if (!implemented.has(decl.name)) {
          throw new MissingAdapterImplementationError(plugin.name, decl.name);
        }
      }
    }
  }

  return { adapterRegistry, lifecycleManager };
}

function resolveConfig(
  plugin: PluginDefinition,
  userConfig: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (!plugin.config) return userConfig;

  for (const [key, schema] of Object.entries(plugin.config)) {
    if (userConfig[key] !== undefined) {
      result[key] = userConfig[key];
    } else if (schema.default !== undefined) {
      result[key] = schema.default;
    } else if (schema.required) {
      throw new PluginConfigError(plugin.name, key);
    }
  }

  for (const [key, value] of Object.entries(userConfig)) {
    if (!(key in result)) {
      result[key] = value;
    }
  }

  return result;
}
