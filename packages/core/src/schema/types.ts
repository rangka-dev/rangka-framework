import type { FieldConfig, ModelConfig, ScopeConfig } from '@rangka/shared';

export interface FieldProvenance {
  source: 'base' | 'trait' | 'extension';
  app?: string;
  trait?: string;
}

export interface ResolvedField {
  name: string;
  config: FieldConfig;
  provenance: FieldProvenance;
}

export interface ResolvedModel {
  qualifiedName: string;
  app: string;
  module: string;
  name: string;
  label?: string;
  naming?: ModelConfig['naming'];
  scope?: ScopeConfig;
  auditLog: boolean;
  traits: string[];
  fields: ResolvedField[];
  indexes: ModelConfig['indexes'];
  source?: string;
}

export interface ModelRelationship {
  type: 'link' | 'hasMany' | 'children' | 'manyToMany' | 'dynamicLink';
  from: string;
  field: string;
  to: string;
  foreignKey?: string;
  through?: string;
  modelField?: string;
}

export interface ExtensionSource {
  app: string;
  fields: string[];
}
