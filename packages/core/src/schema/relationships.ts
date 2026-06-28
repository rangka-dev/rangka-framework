/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ResolvedModel, ModelRelationship } from './types.js';

/**
 * Scans all models for relational fields and produces a flat list of relationships.
 */
export function buildRelationships(models: ResolvedModel[]): ModelRelationship[] {
  const relationships: ModelRelationship[] = [];

  for (const model of models) {
    for (const field of model.fields) {
      const relationship = fieldToRelationship(field.config, field.name, model, models);
      if (relationship) {
        relationships.push(relationship);
      }
    }
  }

  return relationships;
}

/**
 * Converts a single field config into a ModelRelationship, or returns null
 * if the field is not a relational type.
 */
function fieldToRelationship(
  config: any,
  fieldName: string,
  sourceModel: ResolvedModel,
  allModels: ResolvedModel[],
): ModelRelationship | null {
  const from = sourceModel.qualifiedName;

  switch (config.type) {
    case 'link': {
      const targetModel = resolveModelName(config.model, sourceModel.app, allModels);
      return { type: 'link', from, field: fieldName, to: targetModel };
    }
    case 'hasMany': {
      const targetModel = resolveModelName(config.model, sourceModel.app, allModels);
      return {
        type: 'hasMany',
        from,
        field: fieldName,
        to: targetModel,
        foreignKey: config.foreignKey,
      };
    }
    case 'children': {
      const targetModel = resolveModelName(config.model, sourceModel.app, allModels);
      return {
        type: 'children',
        from,
        field: fieldName,
        to: targetModel,
        foreignKey: config.foreignKey,
      };
    }
    case 'manyToMany': {
      const targetModel = resolveModelName(config.model, sourceModel.app, allModels);
      const throughModel = resolveModelName(config.through, sourceModel.app, allModels);
      return { type: 'manyToMany', from, field: fieldName, to: targetModel, through: throughModel };
    }
    case 'dynamicLink': {
      return {
        type: 'dynamicLink',
        from,
        field: fieldName,
        to: '*',
        modelField: config.modelField,
      };
    }
    default:
      return null;
  }
}

/**
 * Resolves an unqualified model name (e.g. "Invoice") to its fully qualified form
 * (e.g. "accounting.Invoice") by checking the current app first, then all models.
 */
function resolveModelName(name: string, currentModule: string, models: ResolvedModel[]): string {
  if (name.includes('.')) return name;

  const qualifiedInCurrentModule = `${currentModule}.${name}`;
  const foundInCurrentModule = models.find((m) => m.qualifiedName === qualifiedInCurrentModule);
  if (foundInCurrentModule) return qualifiedInCurrentModule;

  const foundElsewhere = models.find((m) => m.name === name);
  if (foundElsewhere) return foundElsewhere.qualifiedName;

  return qualifiedInCurrentModule;
}
