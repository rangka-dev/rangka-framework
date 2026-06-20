import type { AdapterRegistry } from './adapter-registry.js';
import type { AdapterCapability, PluginDefinition } from './types.js';
import type { ResolvedModel } from '../schema/types.js';

export interface PluginValidationError {
  type:
    | 'MISSING_ADAPTER_IMPL'
    | 'UNRESOLVED_SOURCE'
    | 'CONFIG_REQUIRED'
    | 'DUPLICATE_PLUGIN'
    | 'CAPABILITY_VIOLATION';
  plugin?: string;
  model?: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: PluginValidationError[];
  warnings: string[];
}

export function validatePluginSetup(
  adapterRegistry: AdapterRegistry,
  externalModels: ResolvedModel[],
  pluginDefinitions: PluginDefinition[],
  adapterCapabilities?: Record<string, AdapterCapability[]>,
): ValidationResult {
  const errors: PluginValidationError[] = [];
  const warnings: string[] = [];

  checkDuplicatePlugins(pluginDefinitions, errors);
  checkAdapterImplementations(pluginDefinitions, adapterRegistry, errors);
  checkExternalModelSources(externalModels, adapterRegistry, errors);
  checkCapabilityViolations(externalModels, adapterCapabilities ?? {}, errors);
  checkBatchGetSupport(externalModels, adapterRegistry, warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function checkDuplicatePlugins(plugins: PluginDefinition[], errors: PluginValidationError[]): void {
  const seen = new Set<string>();
  for (const plugin of plugins) {
    if (seen.has(plugin.name)) {
      errors.push({
        type: 'DUPLICATE_PLUGIN',
        plugin: plugin.name,
        message: `Duplicate plugin name: "${plugin.name}"`,
      });
    }
    seen.add(plugin.name);
  }
}

function checkAdapterImplementations(
  plugins: PluginDefinition[],
  adapterRegistry: AdapterRegistry,
  errors: PluginValidationError[],
): void {
  for (const plugin of plugins) {
    if (!plugin.provides?.adapters) continue;
    for (const decl of plugin.provides.adapters) {
      if (!adapterRegistry.has(decl.name)) {
        errors.push({
          type: 'MISSING_ADAPTER_IMPL',
          plugin: plugin.name,
          message: `Plugin "${plugin.name}" declares adapter "${decl.name}" but it is not registered`,
        });
      }
    }
  }
}

function checkExternalModelSources(
  models: ResolvedModel[],
  adapterRegistry: AdapterRegistry,
  errors: PluginValidationError[],
): void {
  for (const model of models) {
    if (!model.source) continue;
    if (!adapterRegistry.has(model.source)) {
      errors.push({
        type: 'UNRESOLVED_SOURCE',
        model: model.qualifiedName,
        message: `External model "${model.qualifiedName}" references adapter "${model.source}" which is not registered`,
      });
    }
  }
}

function checkBatchGetSupport(
  models: ResolvedModel[],
  adapterRegistry: AdapterRegistry,
  warnings: string[],
): void {
  for (const model of models) {
    if (!model.source) continue;
    if (!adapterRegistry.has(model.source)) continue;

    const adapter = adapterRegistry.get(model.source);
    if (!adapter.batchGet) {
      warnings.push(
        `Adapter "${model.source}" used by "${model.qualifiedName}" does not implement batchGet. Relationship resolution will use N+1 get calls.`,
      );
    }
  }
}

function checkCapabilityViolations(
  models: ResolvedModel[],
  adapterCapabilities: Record<string, AdapterCapability[]>,
  errors: PluginValidationError[],
): void {
  for (const model of models) {
    if (!model.source) continue;
    const declared = adapterCapabilities[model.source];
    if (!declared) continue;

    const capabilities = new Set(declared);

    if (!capabilities.has('read')) {
      errors.push({
        type: 'CAPABILITY_VIOLATION',
        model: model.qualifiedName,
        message: `External model "${model.qualifiedName}" uses adapter "${model.source}" which does not declare the required "read" capability`,
      });
    }

    if (!capabilities.has('list')) {
      errors.push({
        type: 'CAPABILITY_VIOLATION',
        model: model.qualifiedName,
        message: `External model "${model.qualifiedName}" uses adapter "${model.source}" which does not declare "list" capability. List endpoints will not be generated.`,
      });
    }
  }
}
