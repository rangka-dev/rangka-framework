/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ResolvedField, ResolvedModel } from '../schema/types.js';
import type { SchemaLoadResult } from './schema-loader.js';
import { getTraitFields } from './traits.js';
import { SchemaConflictError } from './types.js';

export interface MergeResult {
  models: ResolvedModel[];
}

/**
 * Merge loaded schemas and extensions into a flat list of resolved models.
 * Traits inject fields first, then base fields, then extensions add theirs.
 * Throws SchemaConflictError if an extension tries to redefine an existing field.
 */
export function mergeSchemas(loadResult: SchemaLoadResult): MergeResult {
  const modelMap = new Map<string, ResolvedModel>();

  // Phase 1: Build base models from schemas (trait fields + declared fields)
  for (const { app, module, schema } of loadResult.schemas) {
    const qualifiedName = `${module}.${schema.name}`;
    const fields = buildBaseFields(app, schema);

    modelMap.set(qualifiedName, {
      qualifiedName,
      app,
      module,
      name: schema.name,
      label: schema.label,
      naming: schema.naming,
      scope: schema.scope,
      auditLog: schema.auditLog !== false,
      traits: schema.traits ?? [],
      fields,
      indexes: schema.indexes,
    });
  }

  // Phase 2: Apply extensions (add fields from other apps/modules)
  for (const { app, target, config } of loadResult.extensions) {
    const model = modelMap.get(target);
    if (!model) continue;

    if (config.fields) {
      applyExtensionFields(model, config.fields, app, target);
    }
  }

  return {
    models: Array.from(modelMap.values()),
  };
}

// --- Helpers ---

/** Build the initial field list for a model: trait-injected fields followed by declared fields. */
function buildBaseFields(
  app: string,
  schema: { name: string; traits?: string[]; fields: Record<string, any> },
): ResolvedField[] {
  const fields: ResolvedField[] = [];

  // Inject fields from each trait
  const traits = schema.traits ?? [];
  for (const trait of traits) {
    const traitFields = getTraitFields(trait);
    for (const [fieldName, fieldConfig] of Object.entries(traitFields)) {
      fields.push({
        name: fieldName,
        config: fieldConfig,
        provenance: { source: 'trait', trait },
      });
    }
  }

  // Add the model's own declared fields
  for (const [fieldName, fieldConfig] of Object.entries(schema.fields)) {
    fields.push({
      name: fieldName,
      config: fieldConfig,
      provenance: { source: 'base', app },
    });
  }

  return fields;
}

/** Append extension fields to a model, throwing on conflicts with existing fields. */
function applyExtensionFields(
  model: ResolvedModel,
  extensionFields: Record<string, any>,
  extensionApp: string,
  target: string,
): void {
  for (const [fieldName, fieldConfig] of Object.entries(extensionFields)) {
    const existing = model.fields.find((f) => f.name === fieldName);
    if (existing) {
      const existingSource = describeProvenance(existing);
      throw new SchemaConflictError(
        target,
        fieldName,
        existingSource,
        `extension (${extensionApp})`,
      );
    }

    model.fields.push({
      name: fieldName,
      config: fieldConfig,
      provenance: { source: 'extension', app: extensionApp },
    });
  }
}

/** Produce a human-readable description of where a field came from. */
function describeProvenance(field: ResolvedField): string {
  switch (field.provenance.source) {
    case 'base':
      return `base schema (${field.provenance.app})`;
    case 'extension':
      return `extension (${field.provenance.app})`;
    case 'trait':
      return `trait (${field.provenance.trait})`;
  }
}
