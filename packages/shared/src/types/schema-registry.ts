import type { FieldConfig } from './field.js';

export interface ResolvedFieldInfo {
  name: string;
  config: FieldConfig;
}

export interface ResolvedModelInfo {
  qualifiedName: string;
  app: string;
  name: string;
  label?: string;
  fields: ResolvedFieldInfo[];
  traits: string[];
}

export interface ModelRelationshipInfo {
  type: string;
  from: string;
  field: string;
  to: string;
}

export interface SchemaRegistryInterface {
  getModel(qualifiedName: string): ResolvedModelInfo | undefined;
  getAllModels(): ResolvedModelInfo[];
  getFieldsForModel(qualifiedName: string): ResolvedFieldInfo[];
  getRelationships(): ModelRelationshipInfo[];
  getRelationshipsForModel(qualifiedName: string): ModelRelationshipInfo[];
}
