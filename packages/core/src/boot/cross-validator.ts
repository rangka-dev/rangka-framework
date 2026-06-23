import type { SchemaRegistry } from '../schema/registry.js';
import type { ResolvedModel } from '../schema/types.js';
import type { SchemaLoadResult } from './schema-loader.js';
import { DefinitionValidationError } from './validator.js';
import type { DefinitionError } from './validator.js';

export interface CrossDefinitionError {
  model: string;
  field: string;
  message: string;
}

/**
 * Validate that all relational field references point to models that exist
 * in the registry. Runs after SchemaRegistry is built (all models known).
 * Throws DefinitionValidationError if any references are invalid.
 */
export function validateModelReferences(
  registry: SchemaRegistry,
  extensions: SchemaLoadResult['extensions'],
): void {
  const errors: DefinitionError[] = [];

  for (const model of registry.getAllModels()) {
    const fieldErrors = validateModelFields(model, registry);
    if (fieldErrors.length > 0) {
      errors.push({
        app: model.app,
        file: `models/${model.name}.ts`,
        defType: 'model',
        name: model.qualifiedName,
        issues: fieldErrors.map((e) => ({ path: `fields.${e.field}`, message: e.message })),
      });
    }
  }

  const extensionErrors = validateExtensionTargets(extensions, registry);
  errors.push(...extensionErrors);

  if (errors.length > 0) {
    throw new DefinitionValidationError(errors);
  }
}

function validateModelFields(
  model: ResolvedModel,
  registry: SchemaRegistry,
): CrossDefinitionError[] {
  const errors: CrossDefinitionError[] = [];
  const fieldNames = new Set(model.fields.map((f) => f.name));

  for (const field of model.fields) {
    const config = field.config;

    switch (config.type) {
      case 'link': {
        const targetName = resolveModelName(config.model, model.module);
        if (!registry.getModel(targetName)) {
          errors.push({
            model: model.qualifiedName,
            field: field.name,
            message: `Link target model "${config.model}" does not exist`,
          });
        }
        break;
      }

      case 'hasMany': {
        const targetName = resolveModelName(config.model, model.module);
        const targetModel = registry.getModel(targetName);
        if (!targetModel) {
          errors.push({
            model: model.qualifiedName,
            field: field.name,
            message: `HasMany target model "${config.model}" does not exist`,
          });
        } else {
          const targetFieldNames = new Set(targetModel.fields.map((f) => f.name));
          if (!targetFieldNames.has(config.foreignKey)) {
            errors.push({
              model: model.qualifiedName,
              field: field.name,
              message: `HasMany foreignKey "${config.foreignKey}" does not exist on target model "${targetName}"`,
            });
          }
        }
        break;
      }

      case 'children': {
        const targetName = resolveModelName(config.model, model.module);
        const targetModel = registry.getModel(targetName);
        if (!targetModel) {
          errors.push({
            model: model.qualifiedName,
            field: field.name,
            message: `Children target model "${config.model}" does not exist`,
          });
        } else {
          const targetFieldNames = new Set(targetModel.fields.map((f) => f.name));
          if (!targetFieldNames.has(config.foreignKey)) {
            errors.push({
              model: model.qualifiedName,
              field: field.name,
              message: `Children foreignKey "${config.foreignKey}" does not exist on target model "${targetName}"`,
            });
          }
        }
        break;
      }

      case 'manyToMany': {
        const targetName = resolveModelName(config.model, model.module);
        if (!registry.getModel(targetName)) {
          errors.push({
            model: model.qualifiedName,
            field: field.name,
            message: `ManyToMany target model "${config.model}" does not exist`,
          });
        }
        const throughName = resolveModelName(config.through, model.module);
        if (!registry.getModel(throughName)) {
          errors.push({
            model: model.qualifiedName,
            field: field.name,
            message: `ManyToMany through model "${config.through}" does not exist`,
          });
        }
        break;
      }

      case 'dynamicLink': {
        if (!fieldNames.has(config.modelField)) {
          errors.push({
            model: model.qualifiedName,
            field: field.name,
            message: `DynamicLink modelField "${config.modelField}" does not exist on this model`,
          });
        }
        break;
      }
    }
  }

  return errors;
}

function validateExtensionTargets(
  extensions: SchemaLoadResult['extensions'],
  registry: SchemaRegistry,
): DefinitionError[] {
  const errors: DefinitionError[] = [];

  for (const { app, target } of extensions) {
    if (!registry.getModel(target)) {
      errors.push({
        app,
        file: `extensions/${target}.ts`,
        defType: 'extension',
        name: target,
        issues: [{ path: 'target', message: `Extension target model "${target}" does not exist` }],
      });
    }
  }

  return errors;
}

/**
 * Resolve an unqualified model name to its qualified form.
 * If already qualified (contains a dot), returns as-is.
 * Otherwise prefixes with the current module.
 */
function resolveModelName(name: string, currentModule: string): string {
  if (name.includes('.')) return name;
  return `${currentModule}.${name}`;
}
