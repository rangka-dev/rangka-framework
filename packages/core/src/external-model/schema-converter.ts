import type { ResolvedModel, ResolvedField, ModelRelationship } from '../schema/types.js';
import type { ExternalModelConfig } from './types.js';

export interface ExternalModelConversionResult {
  model: ResolvedModel;
  relationships: ModelRelationship[];
}

export function externalModelToResolved(
  config: ExternalModelConfig,
  app: string,
): ExternalModelConversionResult {
  const qualifiedName = `${app}.${config.name}`;

  const fields: ResolvedField[] = Object.entries(config.fields).map(([name, fieldConfig]) => ({
    name,
    config: {
      type: fieldConfig.type,
      label: fieldConfig.label,
      required: fieldConfig.required,
    },
    provenance: { source: 'base' as const },
  }));

  const relationships: ModelRelationship[] = [];
  for (const [fieldName, fieldConfig] of Object.entries(config.fields)) {
    if (!fieldConfig.relationship) continue;

    relationships.push({
      type: fieldConfig.relationship.type,
      from: qualifiedName,
      field: fieldName,
      to: fieldConfig.relationship.model,
      foreignKey: fieldConfig.relationship.foreignKey,
    });
  }

  const model: ResolvedModel = {
    qualifiedName,
    app,
    name: config.name,
    label: config.label,
    auditLog: false,
    crud: false,
    traits: [],
    fields,
    indexes: [],
    source: config.source,
  };

  return { model, relationships };
}
