import type { DiscoveredApp } from '../boot/types.js';
import type { ResolvedModel, ResolvedField } from '../schema/types.js';
import { coreSchemas } from './core-models.js';
import type { FieldConfig } from '@rangka/shared';

function schemaToResolvedModel(schema: {
  name: string;
  label?: string;
  fields: Record<string, FieldConfig>;
  indexes?: Array<{ fields: string[]; unique?: boolean }>;
}): ResolvedModel {
  const fields: ResolvedField[] = [
    {
      name: 'id',
      config: { type: 'string', required: true } as FieldConfig,
      provenance: { source: 'base' },
    },
    ...Object.entries(schema.fields).map(([name, config]) => ({
      name,
      config,
      provenance: { source: 'base' as const },
    })),
  ];

  return {
    qualifiedName: `core.${schema.name}`,
    app: 'core',
    name: schema.name,
    label: schema.label,
    auditLog: false,
    crud: false,
    traits: [],
    fields,
    indexes: schema.indexes,
  };
}

export function getCoreModels(): ResolvedModel[] {
  return coreSchemas.map(schemaToResolvedModel);
}

export function getCoreApp(): DiscoveredApp {
  return {
    packageInfo: {
      packageName: '@rangka/core',
      path: '__builtin__',
      rangka: { type: 'app', entrypoint: 'index.js' },
    },
    config: {
      name: 'core',
      label: 'Core',
    },
    schemas: coreSchemas.map((s) => ({
      app: 'core',
      schema: s,
    })),
    extensions: [],
  };
}
