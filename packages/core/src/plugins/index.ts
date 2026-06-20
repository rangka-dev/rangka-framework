export { definePlugin } from './define.js';
export {
  AdapterRegistry,
  AdapterNotFoundError,
  DuplicateAdapterError,
} from './adapter-registry.js';
export { PluginLifecycleManager } from './lifecycle.js';
export {
  loadPlugins,
  DuplicatePluginError,
  PluginConfigError,
  MissingAdapterImplementationError,
} from './loader.js';
export { validatePluginSetup } from './validator.js';
export type {
  DataAdapter,
  AdapterCapability,
  PluginDefinition,
  PluginBootContext,
  PluginLifecycleEvent,
  PluginProvides,
  PluginConfigField,
  ListQuery,
  ListResult,
  FilterExpression,
  LifecycleHandler,
} from './types.js';
export type { ValidationResult, PluginValidationError } from './validator.js';
